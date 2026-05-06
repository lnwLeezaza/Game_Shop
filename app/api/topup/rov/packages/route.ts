import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const WONDD_URL  = 'https://www.wondd.com/member/bot-game.php'
const WONDD_USER = process.env.WONDD_USERNAME!
const WONDD_PASS = process.env.WONDD_PASSWORD!

async function getSupabaseUser() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}

// ── เรียก WonDD Topup ─────────────────────────────────────────
async function callWonddTopup(packcode: string, gameid: string) {
  const body = new URLSearchParams({
    method:      'topup',
    username:    WONDD_USER,
    password:    WONDD_PASS,
    servicecode: 'rov',
    packcode,
    gameid,
  })

  const res = await fetch(WONDD_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body:    body.toString(),
    signal:  AbortSignal.timeout(20_000),
  })

  const text = await res.text()
  try {
    return JSON.parse(text)
  } catch {
    throw new Error('WonDD returned invalid JSON: ' + text)
  }
}

export async function GET() {
  const { data: packages, error } = await supabaseAdmin
    .from('topup_packages')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const mapped = (packages ?? []).map(p => ({
    id:            p.id,
    sku:           p.api_sku,
    amount:        p.diamond_amount,
    label:         p.name,
    currencyLabel: p.currency_label,
    price:         p.price,
    originalPrice: p.original_price ?? null,
    bonusAmount:   p.bonus_amount ?? 0,
    tier:          p.tier ?? 'normal',
    badge:         p.badge ?? null,
    badgeColor:    p.badge_color ?? null,
    valuePerUnit:  +(p.price / p.diamond_amount).toFixed(4),
  }))

  return NextResponse.json({ packages: mapped })
}

export async function POST(req: Request) {
  // 1. ตรวจสอบ user
  const supabaseUser = await getSupabaseUser()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })

  // 2. ตรวจสอบ input
  const { packageId, playerId, serverId } = await req.json()
  if (!packageId || !playerId)
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })

  if (!/^\d{8,12}$/.test(playerId))
    return NextResponse.json({ error: 'Player ID ไม่ถูกต้อง' }, { status: 400 })

  // 3. ดึงข้อมูลแพ็กเกจ
  const { data: pkg, error: pkgError } = await supabaseAdmin
    .from('topup_packages')
    .select('id, name, price, diamond_amount, currency_label, api_sku')
    .eq('id', packageId)
    .eq('is_active', true)
    .single()

  if (pkgError || !pkg)
    return NextResponse.json({ error: 'ไม่พบแพ็กเกจ' }, { status: 404 })

  // 4. ตัดเงิน
  const { data: result } = await supabaseAdmin.rpc('deduct_balance', {
    p_user_id:     user.id,
    p_amount:      pkg.price,
    p_description: `เติม ROV ${pkg.name} → Player ID: ${playerId}`,
    p_reference:   pkg.api_sku,
  })

  if (!result.success) {
    if (result.error === 'insufficient_balance') {
      return NextResponse.json({
        error:    'ยอดเงินไม่เพียงพอ',
        balance:  result.balance,
        required: pkg.price,
      }, { status: 402 })
    }
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }

  // 5. บันทึก order สถานะ pending
  const { data: order, error: insertError } = await supabaseAdmin
    .from('topup_orders')
    .insert({
      user_id:        user.id,
      package_id:     pkg.id,
      player_id:      playerId,
      server_id:      serverId ?? null,
      amount_paid:    pkg.price,
      diamond_amount: pkg.diamond_amount,
      status:         'pending',
      balance_before: result.balance_before,
      balance_after:  result.balance_after,
    })
    .select('id')
    .single()

  if (insertError) {
    // Rollback คืนเงิน
    await supabaseAdmin.rpc('refund_balance', {
      p_user_id:     user.id,
      p_amount:      pkg.price,
      p_description: 'คืนเงิน: บันทึก order ล้มเหลว',
      p_reference:   pkg.api_sku,
    })
    return NextResponse.json({ error: 'บันทึก order ไม่สำเร็จ' }, { status: 500 })
  }

  // 6. เรียก WonDD API
  let wonddRes: any
  try {
    wonddRes = await callWonddTopup(pkg.api_sku, playerId)
  } catch (err) {
    // WonDD error → อัปเดต order เป็น failed แต่ไม่คืนเงินอัตโนมัติ (รอ admin ตรวจ)
    await supabaseAdmin
      .from('topup_orders')
      .update({ status: 'failed', remark: String(err) })
      .eq('id', order.id)

    return NextResponse.json({
      error:   'ติดต่อ WonDD ไม่สำเร็จ กรุณาติดต่อ admin',
      orderId: order.id,
    }, { status: 502 })
  }

  // 7. เช็ค WonDD error code
  if (wonddRes.errorcode !== '00') {
    // WonDD ปฏิเสธ → คืนเงินทันที
    await supabaseAdmin.rpc('refund_balance', {
      p_user_id:     user.id,
      p_amount:      pkg.price,
      p_description: `คืนเงิน: WonDD error ${wonddRes.errorcode}`,
      p_reference:   pkg.api_sku,
    })

    await supabaseAdmin
      .from('topup_orders')
      .update({
        status: 'failed',
        remark: `WonDD: ${wonddRes.errorcode} - ${wonddRes.errordetail}`,
      })
      .eq('id', order.id)

    return NextResponse.json({
      error:   wonddRes.errordetail ?? 'WonDD ปฏิเสธคำสั่ง',
      code:    wonddRes.errorcode,
      orderId: order.id,
    }, { status: 422 })
  }

  // 8. สำเร็จ → อัปเดต order เป็น completed
  await supabaseAdmin
    .from('topup_orders')
    .update({
      status:         'completed',
      wondd_order_id: wonddRes.orderid,
      remark:         `WonDD orderid: ${wonddRes.orderid}`,
    })
    .eq('id', order.id)

  return NextResponse.json({
    success:      true,
    orderId:      order.id,
    wonddOrderId: wonddRes.orderid,
    balanceAfter: result.balance_after,
    package:      pkg.name,
    playerId,
  })
}