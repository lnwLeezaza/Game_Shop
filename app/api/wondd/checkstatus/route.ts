// app/api/wondd/checkstatus/route.ts
// ============================================================
// FIX Critical #3 (Part B): checkstatus + JSON safe parse
//
// ใช้สำหรับ:
//   1) Polling ตรวจสถานะ topup แทน callback (fallback)
//   2) ตรวจก่อน retry ว่า WONDD ทำเสร็จแล้วหรือยัง
//   3) รับมือ JSON ที่ขาด comma จาก WONDD doc (อาจ malformed)
//   4) map key ที่ typo "trascationstatus" → transactionStatus
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"


const WONDD_BASE = "https://www.wondd.com/member/bot-game.php"
const WONDD_USER = process.env.WONDD_USERNAME ?? ""
const WONDD_PASS = process.env.WONDD_PASSWORD ?? ""
const PROXY_URL  = process.env.WONDD_PROXY_URL ?? ""

// ── Safe JSON parser ─────────────────────────────────────────
// WONDD API doc มี JSON ที่ขาด comma หลายจุด เช่น:
//   "gameid": "123" "packcode": "R00012"   ← ขาด comma
//   "remark":""  "trascationstatus":"complete"  ← ขาด comma
//
// ในกรณีที่ WONDD ส่ง JSON จริงผิดด้วย ต้องพยายาม repair ก่อน parse
function safeParseWONDD(text: string): Record<string, unknown> | null {
  // ลอง parse ปกติก่อน
  try {
    return JSON.parse(text)
  } catch {
    // ลอง repair: เติม comma ระหว่าง closing quote + whitespace + opening quote
    const repaired = text
      .replace(/(["'])\s*(")/g, "$1, $2")   // "value" "key" → "value", "key"
      .replace(/}(\s*){/g, "}, {")           // }{ → }, {
    try {
      console.warn("[WONDD] Used JSON repair for malformed response")
      return JSON.parse(repaired)
    } catch {
      console.error("[WONDD] JSON repair failed, raw:", text)
      return null
    }
  }
}

// ── Type สำหรับ checkstatus response ─────────────────────────
interface CheckStatusResponse {
  status:              number
  errorcode:           string
  errordetail:         string
  orderid?:            string
  createdate?:         string
  gameid?:             string
  packcode?:           string
  packname?:           string
  point?:              number
  amount?:             number
  discount?:           number
  netamount?:          number
  remark?:             string
  // WONDD สะกดผิด: "trascationstatus" (ขาด n)
  trascationstatus?:   string   // "process" | "complete" | "fail"
  // normalize แล้วเก็บที่นี่
  transactionStatus?:  string
}

// ── Normalize: ไม่ mutate raw, return object ใหม่ ────────────
function normalizeCheckStatus(raw: Record<string, unknown>): CheckStatusResponse {
  const base = raw as unknown as CheckStatusResponse
  return {
    ...base,
    transactionStatus: (raw["trascationstatus"] as string) ?? "",
  } satisfies CheckStatusResponse
}

// ── เรียก WONDD checkstatus ──────────────────────────────────
async function fetchCheckStatus(wonddOrderId: string): Promise<CheckStatusResponse> {
  const formData = new URLSearchParams({
    method:   "checkstatus",
    username: WONDD_USER,
    password: WONDD_PASS,
    orderid:  wonddOrderId,
  })

  const targetURL = PROXY_URL || WONDD_BASE
  const res = await fetch(targetURL, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    formData.toString(),
    signal:  AbortSignal.timeout(15_000),
  })

  const text = await res.text()
  const parsed = safeParseWONDD(text)

  if (!parsed) {
    throw new Error(`WONDD checkstatus returned unparseable response: ${text.slice(0, 200)}`)
  }

  return normalizeCheckStatus(parsed)
}

// ── Simple in-memory rate limit (per orderId) ─────────────────
// ป้องกัน client poll ถี่เกินไปจนทำให้ WONDD block IP
// production ควรใช้ Redis แทน
const pollCooldown = new Map<string, number>()
const COOLDOWN_MS = 3_000  // ขั้นต่ำ 3 วินาทีต่อ orderId

function isRateLimited(orderId: string): boolean {
  const last = pollCooldown.get(orderId) ?? 0
  const now  = Date.now()
  if (now - last < COOLDOWN_MS) return true
  pollCooldown.set(orderId, now)
  return false
}

// ── POST /api/wondd/checkstatus ───────────────────────────────
export async function POST(req: NextRequest) {
  // Next.js 15+: cookies() ต้อง await
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get: (name) => cookieStore.get(name)?.value,
      },
    }
  )

  // ตรวจ auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { internalOrderId } = body as { internalOrderId?: string }

  if (!internalOrderId) {
    return NextResponse.json({ error: "Missing internalOrderId" }, { status: 400 })
  }

  // Rate limit ต่อ orderId
  if (isRateLimited(internalOrderId)) {
    return NextResponse.json({ error: "Too many requests, please wait" }, { status: 429 })
  }

  // ดึง order
  const { data: order } = await supabase
    .from("orders")
    .select("id, status, buyer_id, wondd_orderid")
    .eq("id", internalOrderId)
    .eq("buyer_id", user.id)
    .single()

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (!order.wondd_orderid) {
    return NextResponse.json({
      transactionStatus: "not_sent",
      message:           "Topup has not been sent to WONDD yet",
    })
  }

  // ถ้าเสร็จแล้ว ไม่ต้องเช็คซ้ำ
  if (order.status === "completed" || order.status === "refunded") {
    return NextResponse.json({
      transactionStatus: order.status,
      alreadySettled:    true,
    })
  }

  // เรียก WONDD checkstatus
  let wonddStatus: CheckStatusResponse
  try {
    wonddStatus = await fetchCheckStatus(order.wondd_orderid)
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach WONDD", detail: String(err) },
      { status: 502 }
    )
  }

  if (wonddStatus.errorcode !== "00") {
    return NextResponse.json({
      error: wonddStatus.errordetail,
      code:  wonddStatus.errorcode,
    }, { status: 422 })
  }

  // ถ้า WONDD บอก complete แต่ callback ยังไม่มา → ปล่อย escrow เอง
  if (wonddStatus.transactionStatus === "complete" && order.status !== "completed") {
    const { error: rpcErr } = await supabase.rpc("confirm_delivery", {
      p_order_id: order.id,
      p_buyer_id: order.buyer_id,
    })
    if (rpcErr) {
      console.error("[checkstatus] confirm_delivery failed:", rpcErr)
      return NextResponse.json(
        { error: "Topup complete but failed to confirm delivery", detail: rpcErr.message },
        { status: 500 }
      )
    }
    console.log("[checkstatus] Manually confirmed delivery for order:", order.id)
  }

  // ถ้า WONDD บอก fail → คืนเงิน
  if (wonddStatus.transactionStatus === "fail" && order.status === "processing") {
    const { error: refundErr } = await supabase.rpc("admin_refund_order", {
      p_order_id: order.id,
    })
    if (refundErr) {
      console.error("[checkstatus] Refund failed:", refundErr)
      return NextResponse.json(
        { error: "Topup failed and refund could not be processed", detail: refundErr.message },
        { status: 500 }
      )
    }
    console.log("[checkstatus] Refunded failed topup for order:", order.id)
  }

  return NextResponse.json({
    transactionStatus: wonddStatus.transactionStatus,   // normalized
    rawStatus:         wonddStatus.trascationstatus,    // typo key จาก WONDD (reference)
    wonddOrderId:      wonddStatus.orderid,
    packname:          wonddStatus.packname,
    point:             wonddStatus.point,
    gameid:            wonddStatus.gameid,
    remark:            wonddStatus.remark,
  })
}

// ============================================================
// Polling Hook (ใช้ใน frontend ถ้า callback ไม่มา)
// ============================================================
/*
// hooks/useWonddStatus.ts
import { useEffect, useState } from "react"

export function useWonddStatus(orderId: string, enabled: boolean) {
  const [status, setStatus] = useState<string>("processing")

  useEffect(() => {
    if (!enabled || status === "complete" || status === "fail") return

    const poll = async () => {
      const res = await fetch("/api/wondd/checkstatus", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ internalOrderId: orderId }),
      })
      const data = await res.json()
      setStatus(data.transactionStatus)
    }

    // poll ทุก 5 วินาที สูงสุด 12 ครั้ง (1 นาที)
    let count = 0
    const interval = setInterval(() => {
      poll()
      if (++count >= 12) clearInterval(interval)
    }, 5000)

    return () => clearInterval(interval)
  }, [orderId, enabled, status])

  return status
}
*/