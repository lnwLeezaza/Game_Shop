// app/api/wondd/topup/route.ts
// ============================================================
// FIX Critical #2: IP Whitelist — E09 Invalid IP Address
// ปัญหา: Vercel ใช้ dynamic IP → WONDD reject ทุก request ด้วย E09
//
// แนวทางแก้ 3 ตัวเลือก (เลือกอย่างใดอย่างหนึ่ง):
//   A) Vercel Pro + Static Outbound IP Add-on  → ง่ายสุด แต่มีค่าใช้จ่าย
//   B) Route ผ่าน VPS (Static IP) → ฟรีแต่ต้องมี VPS
//   C) ใช้ Next.js API Route นี้เป็น proxy ผ่าน VPS
//
// ไฟล์นี้ implement ตัวเลือก B/C: GameShop → VPS Proxy → WONDD
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// ─── ENV ──────────────────────────────────────────────────────
// WONDD_USERNAME=your_username
// WONDD_PASSWORD=your_password
// WONDD_PROXY_URL=https://your-vps.com/wondd-proxy   (ถ้าใช้ VPS proxy)
//                หรือเว้นว่างถ้าใช้ Vercel Static IP
// ─────────────────────────────────────────────────────────────

const WONDD_BASE = "https://www.wondd.com/member/bot-game.php"
const WONDD_USER = process.env.WONDD_USERNAME ?? ""
const WONDD_PASS = process.env.WONDD_PASSWORD ?? ""
const PROXY_URL  = process.env.WONDD_PROXY_URL ?? ""

// ── Types ────────────────────────────────────────────────────
interface WONDDResponse {
  status:          number
  errorcode:       string   // "00" = success, "E00"–"E09" = error
  errordetail:     string
  orderid?:        string
  amount?:         number
  discountamount?: number
  servicechange?:  number
  net?:            number
}

interface TopupRequest {
  internalOrderId: string
  servicecode:     "rov" | "freefire" | "undawn" | "blackcover"
  packcode:        string
  gameid:          string
}

// ── ฟังก์ชันเรียก WONDD (ผ่าน proxy ถ้าตั้งค่าไว้) ────────────
async function callWONDD(body: Record<string, string>): Promise<WONDDResponse> {
  const formData = new URLSearchParams({
    username: WONDD_USER,
    password: WONDD_PASS,
    ...body,
  })

  const targetURL = PROXY_URL || WONDD_BASE

  const res = await fetch(targetURL, {
    method:  "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body:    formData.toString(),
    signal:  AbortSignal.timeout(15_000),
  })

  if (!res.ok) {
    throw new Error(`WONDD HTTP error: ${res.status}`)
  }

  const text = await res.text()

  try {
    return JSON.parse(text) as WONDDResponse
  } catch {
    console.error("[WONDD] JSON parse failed, raw response:", text)
    throw new Error("WONDD returned invalid JSON")
  }
}

// ── POST /api/wondd/topup ────────────────────────────────────
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

  // 1. ตรวจ auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: TopupRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  const { internalOrderId, servicecode, packcode, gameid } = body

  if (!internalOrderId || !servicecode || !packcode || !gameid) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  // validate servicecode ตรงกับ WONDD doc
  const validServicecodes = ["rov", "freefire", "undawn", "blackcover"]
  if (!validServicecodes.includes(servicecode)) {
    return NextResponse.json(
      { error: `Invalid servicecode. Must be one of: ${validServicecodes.join(", ")}` },
      { status: 400 }
    )
  }

  // 2. ดึง order จาก DB — ตรวจว่า order เป็นของ user นี้จริง
  const { data: order, error: orderErr } = await supabase
    .from("orders")
    .select("id, status, buyer_id, wondd_orderid")
    .eq("id", internalOrderId)
    .eq("buyer_id", user.id)
    .single()

  if (orderErr || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  // 3. Idempotency — ถ้าเคยส่ง topup ไปแล้ว ให้ใช้ checkstatus แทน
  if (order.wondd_orderid) {
    console.log("[WONDD Topup] Already sent, returning existing orderid:", order.wondd_orderid)
    return NextResponse.json({
      success:      true,
      wonddOrderId: order.wondd_orderid,
      alreadySent:  true,
      message:      "Topup already submitted. Use checkstatus to poll result.",
    })
  }

  // 4. ตรวจ status — ต้องเป็น paid เท่านั้น
  if (order.status !== "paid") {
    return NextResponse.json(
      { error: `Order status is '${order.status}', expected 'paid'` },
      { status: 409 }
    )
  }

  // 5. เรียก WONDD API
  let wonddRes: WONDDResponse
  try {
    wonddRes = await callWONDD({
      method: "topup",
      servicecode,
      packcode,
      gameid,
    })
  } catch (err) {
    console.error("[WONDD Topup] Network/parse error:", err)
    return NextResponse.json(
      { error: "Failed to reach WONDD API", detail: String(err) },
      { status: 502 }
    )
  }

  // 6. ตรวจ E09 โดยเฉพาะ — IP ยังไม่ได้ whitelist
  if (wonddRes.errorcode === "E09") {
    console.error("[WONDD Topup] IP not whitelisted — check WONDD_PROXY_URL or Vercel Static IP")
    return NextResponse.json(
      { error: "IP not whitelisted by WONDD. See server logs for fix." },
      { status: 403 }
    )
  }

  // 7. ตรวจ error อื่นๆ
  if (wonddRes.errorcode !== "00") {
    console.error("[WONDD Topup] API error:", wonddRes.errorcode, wonddRes.errordetail)
    return NextResponse.json(
      { error: wonddRes.errordetail, code: wonddRes.errorcode },
      { status: 422 }
    )
  }

  // 8. บันทึก wondd_orderid + wondd fields ลง DB ทันที
  //    ก่อน return เพื่อป้องกัน retry ส่ง topup ซ้ำ
  if (wonddRes.orderid) {
    const { error: updateErr } = await supabase
      .from("orders")
      .update({
        wondd_orderid:     wonddRes.orderid,
        wondd_servicecode: servicecode,
        wondd_packcode:    packcode,
        wondd_gameid:      gameid,
        status:            "processing",
        updated_at:        new Date().toISOString(),
      })
      .eq("id", internalOrderId)

    if (updateErr) {
      // WONDD topup สำเร็จแล้ว แต่บันทึก DB ไม่ได้
      // log ไว้ให้ admin ตรวจสอบ แต่ยังคืน success เพราะ topup จริงแล้ว
      console.error("[WONDD Topup] CRITICAL: Failed to save wondd_orderid to DB:", updateErr)
      console.error("[WONDD Topup] Manual fix needed — orderId:", internalOrderId, "wonddOrderId:", wonddRes.orderid)
    }
  }

  return NextResponse.json({
    success:      true,
    wonddOrderId: wonddRes.orderid,
    amount:       wonddRes.amount,
    net:          wonddRes.net,
    discount:     wonddRes.discountamount,
  })
}

// ============================================================
// VPS Proxy Script (ถ้าเลือกใช้ VPS — ติดตั้งบน Node.js server)
// บันทึกเป็น wondd-proxy.js แล้วรันด้วย node wondd-proxy.js
// ============================================================
/*
const http = require('http')
const https = require('https')

const WONDD_TARGET = 'https://www.wondd.com/member/bot-game.php'
const PORT = 3001

http.createServer((req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405)
    res.end()
    return
  }

  let body = ''
  req.on('data', chunk => body += chunk)
  req.on('end', () => {
    const proxyReq = https.request(WONDD_TARGET, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      }
    }, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers)
      proxyRes.pipe(res)
    })
    proxyReq.on('error', (e) => {
      res.writeHead(502)
      res.end(JSON.stringify({ error: e.message }))
    })
    proxyReq.write(body)
    proxyReq.end()
  })
}).listen(PORT, () => console.log(`WONDD proxy running on port ${PORT}`))
*/