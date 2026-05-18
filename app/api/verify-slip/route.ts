import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get("slip") as File
  const amount = formData.get("amount")
  const paymentMethod = formData.get("paymentMethod")

  if (!file) return NextResponse.json({ error: "No slip" }, { status: 400 })

  // ส่งไป SlipOK
  const slipForm = new FormData()
  slipForm.append("files", file)
  slipForm.append("log", "true")
  if (amount) slipForm.append("amount", String(amount))

  const slipRes = await fetch(
    `https://api.slipok.com/api/line/apikey/${process.env.SLIPOK_BRANCH_ID}`,
    {
      method: "POST",
      headers: { "x-authorization": process.env.SLIPOK_API_KEY! },
      body: slipForm,
    }
  )

  const slipData = await slipRes.json()
  console.log('SlipOK response:', JSON.stringify(slipData))

  if (!slipRes.ok) {
    const errorMessages: Record<number, string> = {
      1007: "รูปไม่มี QR Code",
      1008: "QR นี้ไม่ใช่สลิปชำระเงิน",
      1011: "QR Code หมดอายุหรือไม่มีรายการ",
      1012: "สลิปซ้ำ เคยใช้ในระบบแล้ว",
      1013: "ยอดเงินในสลิปไม่ตรงกับที่แจ้ง",
      1014: "บัญชีผู้รับไม่ตรงกับร้าน",
    }
    return NextResponse.json(
      { error: errorMessages[slipData.code] || slipData.message, code: slipData.code },
      { status: 400 }
    )
  }

  const slip = slipData.data

  // ดึง balance ปัจจุบัน
  const { data: userData } = await supabaseAdmin
    .from("users")
    .select("balance")
    .eq("id", user.id)
    .single()

  const currentBalance = userData?.balance ?? 0
  const newBalance = currentBalance + slip.amount

  // อัปเดต balance
  await supabaseAdmin
    .from("users")
    .update({ balance: newBalance })
    .eq("id", user.id)

  // บันทึก deposit
  await supabaseAdmin.from("deposits").insert({
    user_id: user.id,
    amount: slip.amount,
    status: "completed",
    payment_method: paymentMethod,
    slip_ref: slip.transRef,
    slip_data: slip,
    slip_uploaded_at: new Date().toISOString(),
  })

  // บันทึก transaction
  await supabaseAdmin.from("transactions").insert({
    user_id: user.id,
    type: "deposit",
    amount: slip.amount,
    balance_before: currentBalance,
    balance_after: newBalance,
    status: "completed",
    description: `เติมเงินผ่านสลิป ฿${slip.amount.toLocaleString()}`,
  })

  // บันทึก notification
const { error: notiError } = await supabaseAdmin.from("notifications").insert({
  user_id: user.id,
  title: "Deposit Successful",
  title_th: "เติมเงินสำเร็จ",
  message: `Deposited ฿${slip.amount.toLocaleString()} successfully`,
  message_th: `เติมเงิน ฿${slip.amount.toLocaleString()} เข้ากระเป๋าเรียบร้อย`,
  type: "payment",
  is_read: false,
})

console.log('notiError:', notiError)


  return NextResponse.json({
    success: true,
    amount: slip.amount,
    newBalance,
    transRef: slip.transRef,
  })
}