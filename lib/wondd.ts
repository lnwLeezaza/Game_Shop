// lib/wondd.ts
// ============================================================
// WonDD API Helper — ใช้ร่วมกันทุกเกม
// ============================================================

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

const WONDD_URL  = 'https://www.wondd.com/member/bot-game.php'
const WONDD_USER = process.env.WONDD_USERNAME!
const WONDD_PASS = process.env.WONDD_PASSWORD!

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function getSupabaseUser() {
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

// ── เรียก WonDD Topup API ────────────────────────────────────
export async function callWonddTopup(servicecode: string, packcode: string, gameid: string) {
  const body = new URLSearchParams({
    method: 'topup',
    username: WONDD_USER,
    password: WONDD_PASS,
    servicecode,
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
  try { return JSON.parse(text) }
  catch { throw new Error('WonDD invalid JSON: ' + text) }
}

// ── Handler กลาง — ใช้ทุกเกม ─────────────────────────────────
export async function handleTopupOrder(
  req: Request,
  servicecode: string,
  gameName: string
) {
  // 1. ตรวจ user
  const supabaseUser = await getSupabaseUser()
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })

  // 2. ตรวจ input
  const { packageId, playerId, serverId } = await req.json()
  if (!packageId || !playerId)
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })

  // 3. ดึงแพ็กเกจ
  const { data: pkg, error: pkgError } = await supabaseAdmin
    .from('topup_packages')
    .select('id, name, price, diamond_amount, currency_label, api_sku, product_id')
    .eq('id', packageId)
    .eq('is_active', true)
    .single()

  if (pkgError || !pkg)
    return NextResponse.json({ error: 'ไม่พบแพ็กเกจ' }, { status: 404 })

  // 4. ตัดเงิน
  const { data: result, error: rpcError } = await supabaseAdmin.rpc('deduct_balance', {
    p_user_id:     user.id,
    p_amount:      pkg.price,
    p_description: `เติม ${gameName} ${pkg.name} Player ID: ${playerId}`,
    p_reference:   pkg.api_sku,
  })

  if (rpcError || !result?.success) {
    if (result?.error === 'insufficient_balance') {
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
      product_id:     pkg.product_id ?? null,
      package_id:     pkg.id,
      amount:         pkg.price,
      player_id:      playerId,
      player_server:  serverId || null,
      status:         'pending',
      payment_method: 'wallet',
      paid_at:        new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError) {
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
    wonddRes = await callWonddTopup(servicecode, pkg.api_sku, playerId)
  } catch (err) {
    await supabaseAdmin
      .from('topup_orders')
      .update({ status: 'failed', remark: String(err) })
      .eq('id', order.id)

    return NextResponse.json({
      error:   'ติดต่อ WonDD ไม่สำเร็จ กรุณาติดต่อ admin',
      orderId: order.id,
    }, { status: 502 })
  }

  // 7. WonDD error → คืนเงินทันที
  if (wonddRes.errorcode !== '00') {
    await supabaseAdmin.rpc('refund_balance', {
      p_user_id:     user.id,
      p_amount:      pkg.price,
      p_description: `คืนเงิน: WonDD ${wonddRes.errorcode}`,
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

  // 8. สำเร็จ → อัปเดต order
  await supabaseAdmin
    .from('topup_orders')
    .update({
      status:         'success',
      wondd_order_id: wonddRes.orderid,
      remark:         `WonDD orderid: ${wonddRes.orderid}`,
      completed_at:   new Date().toISOString(),
    })
    .eq('id', order.id)

  // 9. แจ้งเตือน
  await supabaseAdmin.from('notifications').insert({
    user_id:    user.id,
    type:       'system',
    title:      'เติมเกมสำเร็จ',
    title_th:   'เติมเกมสำเร็จ',
    message:    `${gameName} ${pkg.name} Player ID: ${playerId}`,
    message_th: `${gameName} ${pkg.name} Player ID: ${playerId}`,
    is_read:    false,
  })

  return NextResponse.json({
    success:      true,
    orderId:      order.id,
    wonddOrderId: wonddRes.orderid,
    balanceAfter: result.balance_after,
    package:      pkg.name,
    playerId,
  })
}