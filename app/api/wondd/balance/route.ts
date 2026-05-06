// app/api/wondd/balance/route.ts
// ============================================================
// WONDD Balance Check
// ใช้สำหรับ:
//   1) Admin ตรวจยอด credit ที่เหลือใน WONDD ก่อน topup
//   2) แสดงใน dashboard ให้ admin รู้ว่าต้องเติม credit หรือยัง
//   3) ป้องกัน E03 (Out of credit) โดยเช็คก่อน
//
// WONDD doc (หน้า 6):
//   POST method: balance
//   username / password
//   Success: { status:0, errorcode:"00", errordetail:"success", balance:300.25 }
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const WONDD_BASE = "https://www.wondd.com/member/bot-game.php"
const WONDD_USER = process.env.WONDD_USERNAME ?? ""
const WONDD_PASS = process.env.WONDD_PASSWORD ?? ""
const PROXY_URL  = process.env.WONDD_PROXY_URL ?? ""

// ── Types ────────────────────────────────────────────────────
interface WONDDBalanceResponse {
  status:      number
  errorcode:   string
  errordetail: string
  balance?:    number
}

// ── เรียก WONDD balance ──────────────────────────────────────

console.log("WONDD_USER:", WONDD_USER)
console.log("WONDD_PASS:", WONDD_PASS)

async function fetchWONDDBalance(): Promise<WONDDBalanceResponse> {
  const formData = new URLSearchParams({
    method:   "balance",
    username: WONDD_USER,
    password: WONDD_PASS,
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
    return JSON.parse(text) as WONDDBalanceResponse
  } catch {
    console.error("[WONDD Balance] JSON parse failed, raw:", text)
    throw new Error("WONDD returned invalid JSON")
  }
}

// ── Simple cache — ไม่ดึงทุก request เพราะ WONDD อาจ rate limit ─
// cache 60 วินาที
let cachedBalance: number | null = null
let cacheTimestamp = 0
const CACHE_TTL_MS = 60_000

// ── GET /api/wondd/balance ────────────────────────────────────
export async function GET(req: NextRequest) {
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

  // 2. ตรวจ role — เฉพาะ admin เท่านั้น
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // 3. ถ้ามี cache ที่ยังไม่หมดอายุ ใช้ cache แทน
  const forceRefresh = req.nextUrl.searchParams.get("refresh") === "1"
  const now = Date.now()

  if (!forceRefresh && cachedBalance !== null && now - cacheTimestamp < CACHE_TTL_MS) {
    return NextResponse.json({
      balance:    cachedBalance,
      cached:     true,
      cachedAt:   new Date(cacheTimestamp).toISOString(),
      expiresIn:  Math.round((CACHE_TTL_MS - (now - cacheTimestamp)) / 1000),
    })
  }

  // 4. เรียก WONDD
  let wonddRes: WONDDBalanceResponse
  try {
    wonddRes = await fetchWONDDBalance()
  } catch (err) {
    console.error("[WONDD Balance] Network/parse error:", err)
    return NextResponse.json(
      { error: "Failed to reach WONDD API", detail: String(err) },
      { status: 502 }
    )
  }

  // 5. ตรวจ E09 — IP ยังไม่ได้ whitelist
  if (wonddRes.errorcode === "E09") {
    console.error("[WONDD Balance] IP not whitelisted")
    return NextResponse.json(
      { error: "IP not whitelisted by WONDD. See server logs for fix." },
      { status: 403 }
    )
  }

  // 6. ตรวจ error อื่นๆ
  if (wonddRes.errorcode !== "00") {
    console.error("[WONDD Balance] API error:", wonddRes.errorcode, wonddRes.errordetail)
    return NextResponse.json(
      { error: wonddRes.errordetail, code: wonddRes.errorcode },
      { status: 422 }
    )
  }

  // 7. อัปเดต cache
  cachedBalance  = wonddRes.balance ?? 0
  cacheTimestamp = now

  // 8. เตือนถ้า balance ต่ำ (ต่ำกว่า 500 บาท)
  const LOW_BALANCE_THRESHOLD = 500
  const isLow = (wonddRes.balance ?? 0) < LOW_BALANCE_THRESHOLD

  if (isLow) {
    console.warn("[WONDD Balance] Low credit warning:", wonddRes.balance)
  }

  return NextResponse.json({
    balance:  wonddRes.balance,
    cached:   false,
    fetchedAt: new Date().toISOString(),
    warning:  isLow ? `Low WONDD credit: ฿${wonddRes.balance}. Please top up soon.` : null,
  })
}