import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

// ✅ ใช้ admin client จากไฟล์กลาง (หรือจะแยกไปไว้ lib/supabase/admin.ts ก็ได้)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

  // ✅ validate รูปแบบ Player ID
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

  // 5. ✅ บันทึก order — ถ้าล้มเหลวให้คืนเงินทันที
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
    // ✅ Rollback — คืนเงินถ้าบันทึก order ไม่สำเร็จ
    await supabaseAdmin.rpc('refund_balance', {
      p_user_id:     user.id,
      p_amount:      pkg.price,
      p_description: 'คืนเงิน: บันทึก order ล้มเหลว',
      p_reference:   pkg.api_sku,
    })
    return NextResponse.json({ error: 'บันทึก order ไม่สำเร็จ' }, { status: 500 })
  }

  // 6. ✅ ส่งผลลัพธ์พร้อม orderId
  return NextResponse.json({
    success:      true,
    orderId:      order.id,
    balanceAfter: result.balance_after,
    package:      pkg.name,
    playerId,
  })
}