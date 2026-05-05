import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const supabaseUser = createServerClient(
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

  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return NextResponse.json({ error: 'กรุณาเข้าสู่ระบบ' }, { status: 401 })

  const { packageId, playerId, serverId } = await req.json()
  if (!packageId || !playerId)
    return NextResponse.json({ error: 'ข้อมูลไม่ครบ' }, { status: 400 })

  // ✅ เพิ่ม product_id ใน select
  const { data: pkg, error: pkgError } = await supabaseAdmin
    .from('topup_packages')
    .select('id, name, price, diamond_amount, currency_label, api_sku, product_id')
    .eq('id', packageId)
    .eq('is_active', true)
    .single()

  if (pkgError || !pkg)
    return NextResponse.json({ error: 'ไม่พบแพ็กเกจ' }, { status: 404 })


  console.log('pkg:', pkg) // ✅ เพิ่มตรงนี้

  const { data: result, error: rpcError } = await supabaseAdmin.rpc('deduct_balance', {
    p_user_id: user.id,
    p_amount: pkg.price,
    p_description: 'เติม ROV ' + pkg.name + ' Player ID: ' + playerId,
    p_reference: pkg.api_sku,
  })

  console.log('rpc result:', result)
  console.log('rpc error:', rpcError)

  if (!result?.success) {
    if (result?.error === 'insufficient_balance') {
      return NextResponse.json({
        error: 'ยอดเงินไม่เพียงพอ',
        balance: result.balance,
        required: pkg.price,
      }, { status: 402 })
    }
    return NextResponse.json({ error: 'เกิดข้อผิดพลาด' }, { status: 500 })
  }

  // ✅ แก้ insert ให้ตรงกับ schema จริง
const { data: order, error: insertError } = await supabaseAdmin
    .from('topup_orders')
    .insert({
      user_id: user.id,
      product_id: pkg.product_id ?? null,
      package_id: pkg.id,
      amount: pkg.price,
      player_id: playerId,
      player_server: serverId || null,
      status: 'success',
      payment_method: 'wallet',
      paid_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('insert topup error:', insertError.message)
    await supabaseAdmin.rpc('refund_balance', {
      p_user_id: user.id,
      p_amount: pkg.price,
      p_description: 'คืนเงิน: บันทึก order ล้มเหลว',
      p_reference: pkg.api_sku,
    })
    return NextResponse.json({ error: 'บันทึก order ไม่สำเร็จ: ' + insertError.message }, { status: 500 })
  }

  await supabaseAdmin.from('notifications').insert({
    user_id: user.id,
    type: 'system',
    title: 'เติมเกมสำเร็จ',
    title_th: 'เติมเกมสำเร็จ',
    message: 'ROV ' + pkg.name + ' Player ID: ' + playerId,
    message_th: 'ROV ' + pkg.name + ' Player ID: ' + playerId,
    is_read: false,
  })

  return NextResponse.json({
    success: true,
    balanceAfter: result.balance_after,
    package: pkg.name,
    playerId,
  })
}