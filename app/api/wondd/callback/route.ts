// app/api/wondd/callback/route.ts
// ============================================================
// FIX Critical #1: Callback Security
// ปัญหา: WONDD ไม่มี HMAC signature → ใครรู้ URL ปลอม complete ได้
// แก้:  1) secret token ใน query string
//       2) IP whitelist ของ WONDD
//       3) ตรวจ orderid ว่ามีอยู่ใน DB จริง
//       4) กัน replay attack ด้วย idempotency check
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"


// ─── ENV ที่ต้องตั้งใน .env.local ──────────────────────────
// WONDD_CALLBACK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  (random 32+ chars)
// WONDD_ALLOWED_IPS=1.2.3.4,5.6.7.8   (ขอ IP จาก WONDD support)
// ────────────────────────────────────────────────────────────

const CALLBACK_SECRET = process.env.WONDD_CALLBACK_SECRET ?? ""
const ALLOWED_IPS_RAW = process.env.WONDD_ALLOWED_IPS ?? ""
const ALLOWED_IPS     = ALLOWED_IPS_RAW.split(",").map((ip) => ip.trim()).filter(Boolean)

// ── helpers ─────────────────────────────────────────────────

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

function validateSecret(req: NextRequest): boolean {
  const secret = req.nextUrl.searchParams.get("secret")
  if (!secret || secret.length !== CALLBACK_SECRET.length) return false
  // ป้องกัน timing attack ด้วย constant-time compare
  let diff = 0
  for (let i = 0; i < secret.length; i++) {
    diff |= secret.charCodeAt(i) ^ CALLBACK_SECRET.charCodeAt(i)
  }
  return diff === 0
}

function validateIP(ip: string): boolean {
  if (ALLOWED_IPS.length === 0) {
    console.warn("[WONDD Callback] WONDD_ALLOWED_IPS not set — skipping IP check")
    return true
  }
  return ALLOWED_IPS.includes(ip)
}

// ── main handler ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // 1. ตรวจ secret token ก่อนเลย (fast reject)
  if (!validateSecret(req)) {
    console.warn("[WONDD Callback] Invalid secret from IP:", getClientIP(req))
    // คืน 200 เพื่อไม่ให้ attacker รู้ว่า secret ผิด
    return NextResponse.json({ received: true })
  }

  // 2. ตรวจ IP whitelist
  const clientIP = getClientIP(req)
  if (!validateIP(clientIP)) {
    console.warn("[WONDD Callback] IP not whitelisted:", clientIP)
    return NextResponse.json({ received: true })
  }

  // 3. Parse body
  let body: { orderid?: string; status?: string; remark?: string }
  try {
    body = await req.json()
  } catch {
    console.error("[WONDD Callback] Failed to parse JSON body")
    return NextResponse.json({ received: true })
  }

  const { orderid, status, remark } = body

  // 4. ตรวจ field ครบ
  if (!orderid || !status) {
    console.warn("[WONDD Callback] Missing orderid or status")
    return NextResponse.json({ received: true })
  }

  // 5. หา order ใน DB ด้วย wondd_orderid
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

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, status, buyer_id, wondd_orderid")
    .eq("wondd_orderid", orderid)
    .single()

  if (error || !order) {
    console.warn("[WONDD Callback] Order not found for wondd_orderid:", orderid)
    return NextResponse.json({ received: true })
  }

  // 6. Idempotency — ถ้า order เสร็จแล้ว ไม่ทำซ้ำ
  if (order.status === "completed" || order.status === "refunded") {
    console.log("[WONDD Callback] Order already settled:", order.id, order.status)
    return NextResponse.json({ received: true })
  }

  // 7. ประมวลผลตาม status ที่ WONDD ส่งมา
  try {
    if (status === "complete") {
      const { error: rpcErr } = await supabase.rpc("confirm_delivery", {
        p_order_id: order.id,
        p_buyer_id: order.buyer_id,
      })
      if (rpcErr) throw rpcErr
      console.log("[WONDD Callback] confirm_delivery success for order:", order.id)

    } else if (status === "fail") {
      const { error: rpcErr } = await supabase.rpc("admin_refund_order", {
        p_order_id: order.id,
      })
      if (rpcErr) throw rpcErr
      console.log("[WONDD Callback] refund success for order:", order.id, "remark:", remark)

    } else if (status === "process") {
      console.log("[WONDD Callback] Order still processing:", order.id)
    }
  } catch (err) {
    console.error("[WONDD Callback] RPC error for order:", order.id, err)
    // คืน 500 เพื่อให้ WONDD retry
    return NextResponse.json({ error: "internal error" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

// ── ตัวอย่าง Callback URL ที่ให้ WONDD ────────────────────
// https://yourdomain.com/api/wondd/callback?secret=WONDD_CALLBACK_SECRET_VALUE
//
// ตั้ง WONDD_CALLBACK_SECRET ใน .env.local และ Vercel Dashboard
// อย่าใส่ secret ใน URL ที่ commit ขึ้น git