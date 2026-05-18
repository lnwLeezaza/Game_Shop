"use client";

import { use } from "react";
import { useState, useCallback, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  ChevronLeft, Shield, Zap, Clock, CheckCircle2,
  XCircle, Loader2, Star, User, CreditCard, Package, Crown,
  Sparkles, TrendingUp
} from "lucide-react";
import React from "react";

// ── Game Map ─────────────────────────────────────────────────
const GAME_MAP: Record<string, {
  apiCode: string; name: string; fullName: string; image: string;
  currency: string; idLabel: string; idPlaceholder: string;
  idHint: string[]; hasServer: boolean; color: string; colorDark: string;
}> = {
  'rov': { apiCode: 'rov', name: 'ROV', fullName: 'Arena of Valor', image: '/gamespic/rov.png', currency: 'คูปอง', idLabel: 'Player ID / UID', idPlaceholder: 'เช่น 123456789', idHint: ['เปิด ROV แล้วแตะรูปโปรไฟล์มุมบนซ้าย', "เลือก 'ข้อมูลผู้เล่น'", 'คัดลอก ID ตัวเลข 9 หลัก'], hasServer: true, color: '#2563eb', colorDark: '#1e40af' },
  'free-fire': { apiCode: 'freefire', name: 'Free Fire', fullName: 'Garena', image: '/gamespic/freefire.jpg', currency: 'เพชร', idLabel: 'Player ID', idPlaceholder: 'เช่น 123456789', idHint: ['เปิด Free Fire แตะรูปโปรไฟล์', 'ดู ID ใต้ชื่อผู้เล่น', 'คัดลอกตัวเลข'], hasServer: false, color: '#f97316', colorDark: '#c2410c' },
  'mobile-legends': { apiCode: 'mlbb', name: 'Mobile Legends', fullName: 'Bang Bang', image: '/gamespic/mmlb.jpg', currency: 'Diamond', idLabel: 'User ID', idPlaceholder: 'เช่น 123456789', idHint: ['เปิด MLBB แตะรูปโปรไฟล์', 'ดู User ID ใต้ชื่อ', 'กรอก ID และ Server ID'], hasServer: true, color: '#06b6d4', colorDark: '#0e7490' },
  'pubg-mobile': { apiCode: 'pubg', name: 'PUBG Mobile', fullName: 'Krafton', image: '/gamespic/pubg.jpg', currency: 'UC', idLabel: 'Player ID', idPlaceholder: 'เช่น 123456789', idHint: ['เปิด PUBG Mobile แตะโปรไฟล์', 'ดู ID มุมขวาบน', 'คัดลอกตัวเลข'], hasServer: false, color: '#eab308', colorDark: '#a16207' },
  'valorant': { apiCode: 'valorant', name: 'Valorant', fullName: 'Riot Games', image: '/gamespic/valorant.jpg', currency: 'VP', idLabel: 'Riot ID', idPlaceholder: 'เช่น PlayerName#1234', idHint: ['เปิด Valorant ไปที่ Collection', 'ดู Riot ID มุมขวาบน', 'กรอก Name#Tag'], hasServer: false, color: '#ef4444', colorDark: '#b91c1c' },
  'Heartopia': { apiCode: 'heartopia', name: 'Heartopia', fullName: 'เกมใหม่', image: '/gamespic/hajpg.jpg', currency: 'Diamond', idLabel: 'Player ID', idPlaceholder: 'เช่น 123456789', idHint: ['เปิด Heartopia แตะโปรไฟล์', 'ดู Player ID', 'คัดลอกตัวเลข'], hasServer: false, color: '#ec4899', colorDark: '#9d174d' },
  'undawn': { apiCode: 'undawn', name: 'Undawn', fullName: 'Level Infinite', image: '', currency: 'RC', idLabel: 'Player ID', idPlaceholder: 'เช่น 123456789', idHint: ['เปิด Undawn แตะโปรไฟล์', 'ดู Player ID', 'คัดลอกตัวเลข'], hasServer: false, color: '#10b981', colorDark: '#065f46' },
  'delta-force': { apiCode: 'deltaforce', name: 'Delta Force', fullName: 'Mobile', image: '/gamespic/delta force.jpg', currency: 'Coins', idLabel: 'Player ID', idPlaceholder: 'เช่น 123456789', idHint: ['เปิด Delta Force แตะโปรไฟล์', 'ดู Player ID', 'คัดลอกตัวเลข'], hasServer: false, color: '#64748b', colorDark: '#334155' },
  'call-of-duty-mobile': { apiCode: 'codm', name: 'Call of Duty', fullName: 'Mobile', image: '', currency: 'CP', idLabel: 'Player ID', idPlaceholder: 'เช่น 123456789', idHint: ['เปิด COD Mobile แตะโปรไฟล์', 'ดู Player ID', 'คัดลอกตัวเลข'], hasServer: false, color: '#78716c', colorDark: '#44403c' },
  'haikyu': { apiCode: 'haikyu', name: 'HAIKYU!!', fullName: 'Fly High', image: '', currency: 'Star Gems', idLabel: 'Player ID', idPlaceholder: 'เช่น 123456789', idHint: ['เปิด Haikyu แตะโปรไฟล์', 'ดู Player ID', 'คัดลอกตัวเลข'], hasServer: false, color: '#f59e0b', colorDark: '#b45309' },
  'blackcover': { apiCode: 'blackcover', name: 'Black Clover', fullName: 'Mobile', image: '', currency: 'Crystal', idLabel: 'Player ID', idPlaceholder: 'เช่น 123456789', idHint: ['เปิด Black Clover Mobile แตะโปรไฟล์', 'ดู Player ID', 'คัดลอกตัวเลข'], hasServer: false, color: '#8b5cf6', colorDark: '#5b21b6' },
}

type Step = "package" | "info" | "payment" | "status"
interface PkgData {
  id: string; sku: string; amount: number; label: string; currencyLabel: string;
  price: number; originalPrice: number | null; bonusAmount: number;
  tier: "normal" | "big"; badge: string | null; badgeColor: string | null;
  valuePerUnit: number; imageUrl?: string;
}

// ── Floating particles background ───────────────────────────
function Particles({ color }: { color: string }) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="absolute rounded-full opacity-20"
          style={{
            width: `${4 + (i % 4) * 3}px`,
            height: `${4 + (i % 4) * 3}px`,
            background: color,
            left: `${(i * 8.3) % 100}%`,
            top: `${(i * 13.7) % 100}%`,
            animation: `float${i % 3} ${3 + (i % 4)}s ease-in-out infinite`,
            animationDelay: `${i * 0.4}s`,
          }} />
      ))}
    </div>
  )
}

// ── Step bar ─────────────────────────────────────────────────
function StepBar({ current }: { current: Step }) {
  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "package", label: "แพ็กเกจ", icon: <Package size={12} /> },
    { key: "info", label: "ข้อมูล", icon: <User size={12} /> },
    { key: "payment", label: "ชำระเงิน", icon: <CreditCard size={12} /> },
    { key: "status", label: "ผลลัพธ์", icon: <CheckCircle2 size={12} /> },
  ]
  const idx = steps.findIndex(s => s.key === current)
  return (
    <div className="relative flex items-center justify-between mb-6 px-2">
      <div className="absolute top-[15px] left-8 right-8 h-[2px] rounded-full" style={{ background: "#e2e8f0" }}>
        <div className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${(idx / (steps.length - 1)) * 100}%`, background: "linear-gradient(90deg,#2563eb,#38bdf8)" }} />
      </div>
      {steps.map((step, i) => {
        const done = i < idx; const active = i === idx
        return (
          <div key={step.key} className="relative z-10 flex flex-col items-center gap-1">
            <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500"
              style={done
                ? { background: "linear-gradient(135deg,#2563eb,#38bdf8)", color: "#fff", boxShadow: "0 0 0 3px rgba(37,99,235,0.2)" }
                : active
                  ? { background: "linear-gradient(135deg,#1d4ed8,#0891b2)", color: "#fff", boxShadow: "0 0 0 4px rgba(37,99,235,0.15), 0 0 20px rgba(56,189,248,0.4)" }
                  : { background: "#f1f5f9", color: "#94a3b8", border: "1.5px solid #e2e8f0" }}>
              {done ? "✓" : step.icon}
            </div>
            <span className="text-[9px] font-semibold whitespace-nowrap"
              style={{ color: active ? "#2563eb" : done ? "#38bdf8" : "#94a3b8" }}>
              {step.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Package Card ─────────────────────────────────────────────
function PackageCard({ pkg, selected, onClick, isBestValue, gameColor }: {
  pkg: PkgData; selected: boolean; onClick: () => void; isBestValue: boolean; gameColor: string
}) {
  const isBig = pkg.tier === "big"
  const accentColor = isBig ? "#8b5cf6" : gameColor
  const [imgErr, setImgErr] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  return (
    <button onClick={onClick}
      className="relative w-full text-left focus:outline-none group"
      style={{
        borderRadius: "14px",
        transform: selected ? "scale(1.03) translateY(-3px)" : "scale(1)",
        transition: "all 0.25s cubic-bezier(0.34,1.56,0.64,1)",
        zIndex: selected ? 2 : 1,
      }}>

      {/* Card body */}
      <div className="w-full overflow-hidden"
        style={{
          borderRadius: "14px",
          background: selected
            ? `linear-gradient(160deg, ${accentColor}, ${isBig ? "#4c1d95" : "#0c4a6e"})`
            : "#fff",
          border: selected ? `2px solid ${accentColor}` : "1.5px solid #e2e8f0",
          boxShadow: selected
            ? `0 8px 28px ${accentColor}55, 0 0 0 3px ${accentColor}22`
            : "0 1px 4px rgba(0,0,0,0.06)",
          transition: "all 0.25s ease",
        }}>

        {/* Top color bar */}
        <div style={{
          height: "3px",
          background: selected
            ? "rgba(255,255,255,0.35)"
            : `linear-gradient(90deg,${accentColor},${accentColor}44)`,
          borderRadius: "14px 14px 0 0",
        }} />

        {/* Badge */}
        {(pkg.badge || isBestValue) && (
          <div className="absolute -top-px right-2 z-10 text-[8px] font-black text-white px-2 py-[3px] leading-tight"
            style={{
              background: isBestValue && !pkg.badge ? "linear-gradient(135deg,#06b6d4,#2563eb)" : `linear-gradient(135deg,${pkg.badgeColor ?? accentColor},${pkg.badgeColor ?? accentColor}99)`,
              borderRadius: "0 0 8px 8px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.25)"
            }}>
            {isBestValue && !pkg.badge ? "💎 ดีที่สุด" : pkg.badge === "VIP" ? "👑 VIP" : pkg.badge === "ยอดนิยม" ? "🔥 ยอดนิยม" : pkg.badge}
          </div>
        )}

        {/* Selected checkmark */}
        {selected && (
          <div className="absolute top-2 left-2 z-10 w-[18px] h-[18px] rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.25)", border: "1.5px solid rgba(255,255,255,0.5)" }}>
            <svg viewBox="0 0 10 10" className="w-3 h-3">
              <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        <div className="flex flex-col items-center px-2 pt-2.5 pb-2.5 gap-1.5">
          {/* Image container — fixed square aspect ratio, never stretches */}
          <div className="relative overflow-hidden"
            style={{
              width: "100%",
              aspectRatio: "1 / 1",
              borderRadius: "10px",
              background: selected
                ? "rgba(255,255,255,0.15)"
                : `linear-gradient(135deg,${accentColor}18,${accentColor}08)`,
              border: selected ? "1px solid rgba(255,255,255,0.2)" : `1px solid ${accentColor}22`,
              flexShrink: 0,
            }}>
            {pkg.imageUrl && !imgErr ? (
              <>
                {!imgLoaded && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: selected ? "rgba(255,255,255,0.4)" : `${accentColor}44`, borderTopColor: "transparent" }} />
                  </div>
                )}
                <img
                  src={pkg.imageUrl}
                  alt={pkg.label}
                  onError={() => setImgErr(true)}
                  onLoad={() => setImgLoaded(true)}
                  style={{
                    width: "100%", height: "100%",
                    objectFit: "contain",
                    objectPosition: "center",
                    padding: "8px",
                    opacity: imgLoaded ? 1 : 0,
                    transition: "opacity 0.3s ease",
                  }}
                />
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg viewBox="0 0 36 36" style={{ width: "55%", height: "55%" }} fill="none">
                  <circle cx="18" cy="18" r="16"
                    fill={selected ? "rgba(255,255,255,0.2)" : `${accentColor}22`} />
                  <polygon points="18,7 21.5,14.5 30,14.5 23.5,19.5 26,27 18,22 10,27 12.5,19.5 6,14.5 14.5,14.5"
                    fill={selected ? "rgba(255,255,255,0.9)" : accentColor} opacity="0.9" />
                </svg>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="text-center w-full leading-none">
            <div className="font-black truncate"
              style={{
                fontSize: pkg.amount >= 10000 ? "11px" : pkg.amount >= 1000 ? "12px" : "14px",
                color: selected ? "#fff" : "#0f172a",
                lineHeight: 1.15,
              }}>
              {pkg.amount > 0 ? pkg.amount.toLocaleString() : pkg.label}
            </div>
            <div style={{
              fontSize: "8px", fontWeight: 700, marginTop: "2px",
              color: selected ? "rgba(255,255,255,0.7)" : accentColor,
            }}>
              {pkg.currencyLabel}
            </div>
          </div>

          {/* Bonus */}
          {pkg.bonusAmount > 0 && (
            <div className="text-[8px] font-black px-1.5 py-[2px] rounded-full"
              style={{
                background: selected ? "rgba(255,255,255,0.2)" : "linear-gradient(135deg,#f59e0b,#d97706)",
                color: "#fff",
                border: selected ? "1px solid rgba(255,255,255,0.3)" : "none",
              }}>
              +{pkg.bonusAmount}
            </div>
          )}

          {/* Price */}
          <div className="text-center w-full">
            {pkg.originalPrice && (
              <div style={{ fontSize: "9px", textDecoration: "line-through", color: selected ? "rgba(255,255,255,0.45)" : "#94a3b8" }}>
                ฿{pkg.originalPrice.toLocaleString()}
              </div>
            )}
            <div className="font-black"
              style={{
                fontSize: pkg.price >= 1000 ? "12px" : "13px",
                color: selected ? "#fff" : accentColor,
                lineHeight: 1.2,
              }}>
              ฿{pkg.price.toLocaleString()}
            </div>
          </div>

          {isBig && (
            <div className="flex items-center gap-0.5 px-1.5 py-[2px] rounded-full text-[7px] font-black"
              style={{
                background: selected ? "rgba(255,255,255,0.18)" : "rgba(139,92,246,0.12)",
                color: selected ? "#fff" : "#8b5cf6",
              }}>
              <Crown size={6} />แพ็กหนัก
            </div>
          )}
        </div>
      </div>
    </button>
  )
}



// ── Main Page ────────────────────────────────────────────────
export default function GameTopupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const game = GAME_MAP[slug]

  const [step, setStep] = useState<Step>("package")
  const [packages, setPackages] = useState<PkgData[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")
  const [selectedPkg, setSelectedPkg] = useState<PkgData | null>(null)
  const [playerId, setPlayerId] = useState("")
  const [serverId, setServerId] = useState("")
  const [error, setError] = useState("")
  const [balance, setBalance] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [wonddOrderId, setWonddOrderId] = useState("")
  const [cardVisible, setCardVisible] = useState(false)
  const [heroScrollY, setHeroScrollY] = useState(0)

  useEffect(() => {
    const t = setTimeout(() => setCardVisible(true), 80)
    return () => clearTimeout(t)
  }, [])

  // Subtle parallax on hero
  useEffect(() => {
    const onScroll = () => setHeroScrollY(window.scrollY * 0.3)
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  if (!game) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-xl font-bold mb-2">ไม่พบเกมนี้</p>
            <a href="/topup" className="text-primary underline">กลับหน้าเลือกเกม</a>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  useEffect(() => {
    fetch(`/api/topup/${game.apiCode}/packages`)
      .then(r => r.json())
      .then(d => { if (d.error) { setFetchError(d.error); return }; setPackages(d.packages ?? []) })
      .catch(() => setFetchError("โหลดแพ็กเกจไม่สำเร็จ กรุณารีเฟรช"))
      .finally(() => setLoading(false))
  }, [game.apiCode])

  useEffect(() => {
    fetch("/api/user/balance").then(r => r.json()).then(d => setBalance(d.balance ?? 0)).catch(() => {})
  }, [])

  const normalPkgs = packages.filter(p => p.tier === "normal")
  const bigPkgs = packages.filter(p => p.tier === "big")
  const bestValueId = packages.length
    ? packages.reduce((best, p) => p.valuePerUnit < (packages.find(x => x.id === best)?.valuePerUnit ?? Infinity) ? p.id : best, packages[0].id)
    : ""

  const handlePackageNext = useCallback(() => {
    if (!selectedPkg) { setError("กรุณาเลือกแพ็กเกจ"); return }
    setError(""); setStep("info")
  }, [selectedPkg])

  const handleInfoNext = useCallback(() => {
    if (!playerId.trim()) { setError(`กรุณากรอก ${game.idLabel}`); return }
    setError(""); setStep("payment")
  }, [playerId, game.idLabel])

  const handleConfirm = useCallback(async () => {
    if (!selectedPkg) return
    setSubmitting(true); setError("")
    try {
      const res = await fetch(`/api/topup/${game.apiCode}/packages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selectedPkg.id, playerId, serverId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "เกิดข้อผิดพลาด"); setSubmitting(false); return }
      setBalance(data.balanceAfter); setWonddOrderId(data.wonddOrderId ?? ""); setStep("status")
    } catch { setError("เกิดข้อผิดพลาด กรุณาลองใหม่") } finally { setSubmitting(false) }
  }, [selectedPkg, playerId, serverId, game.apiCode])

  const c = game.color
  const cd = game.colorDark

  return (
    <>
      <style>{`
        @keyframes float0 { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-12px) rotate(5deg)} }
        @keyframes float1 { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-8px) rotate(-4deg)} }
        @keyframes float2 { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-16px) rotate(3deg)} }
        @keyframes slideInUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideInCard { from{opacity:0;transform:translateY(24px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes pulseGlow { 0%,100%{box-shadow:0 0 0 0 ${c}44} 50%{box-shadow:0 0 0 8px ${c}00} }
        @keyframes countUp { from{transform:translateY(8px);opacity:0} to{transform:translateY(0);opacity:1} }
        @keyframes successPop { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        @keyframes confettiFall { from{transform:translateY(-20px) rotate(0deg);opacity:1} to{transform:translateY(80px) rotate(360deg);opacity:0} }
        .scrollbar-hide::-webkit-scrollbar { display:none }
      `}</style>

      <Header />
      <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${c}08 0%, #f8fafc 120px)` }}>

        {/* ── Hero ── */}
        <div className="relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${cd} 0%, ${c} 60%, ${c}cc 100%)`, minHeight: "96px" }}>

          {/* Parallax bg circles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div style={{
              position: "absolute", right: "-40px", top: "-40px",
              width: "200px", height: "200px", borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              transform: `translateY(${heroScrollY * 0.5}px)`,
              transition: "transform 0.1s linear",
            }} />
            <div style={{
              position: "absolute", left: "-30px", bottom: "-50px",
              width: "160px", height: "160px", borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
              transform: `translateY(${heroScrollY * 0.3}px)`,
              transition: "transform 0.1s linear",
            }} />
            <div style={{
              position: "absolute", left: "40%", top: "-20px",
              width: "100px", height: "100px", borderRadius: "50%",
              background: "rgba(255,255,255,0.05)",
              transform: `translateY(${heroScrollY * 0.7}px)`,
              transition: "transform 0.1s linear",
            }} />
          </div>

          <Particles color="rgba(255,255,255,0.6)" />

          {/* Grid overlay */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04]">
            <defs>
              <pattern id="g" width="32" height="32" patternUnits="userSpaceOnUse">
                <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#fff" strokeWidth="0.8" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#g)" />
          </svg>

          <div className="relative z-10 mx-auto max-w-4xl px-4 py-5 flex items-center gap-3">
            <a href="/topup">
              <button className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 hover:scale-110 active:scale-95 transition-transform"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}>
                <ChevronLeft size={18} className="text-white" />
              </button>
            </a>

            {/* Game avatar */}
            <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 flex items-center justify-center"
              style={{
                boxShadow: "0 6px 20px rgba(0,0,0,0.35), 0 0 0 2px rgba(255,255,255,0.2)",
                background: "rgba(255,255,255,0.1)",
                animation: "pulseGlow 3s ease-in-out infinite",
              }}>
              {game.image ? (
                <img src={game.image} alt={game.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={e => {
                    const el = e.currentTarget as HTMLImageElement
                    el.style.display = "none"
                    const p = el.parentElement; if (p) p.innerHTML = `<span style="font-size:22px;font-weight:900;color:#fff">${game.name[0]}</span>`
                  }} />
              ) : (
                <span style={{ fontSize: "22px", fontWeight: 900, color: "#fff" }}>{game.name[0]}</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <div className="text-white font-extrabold text-lg leading-tight tracking-tight">{game.name}</div>
                <div className="flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.9)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse inline-block" /> ONLINE
                </div>
              </div>
              <div className="text-[12px]" style={{ color: "rgba(255,255,255,0.65)" }}>{game.fullName}</div>
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {[{ icon: <Zap size={9} />, t: "ส่งทันที" }, { icon: <Shield size={9} />, t: "ปลอดภัย 100%" }, { icon: <Clock size={9} />, t: "24/7" }].map((x, i) => (
                  <div key={i} className="flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.18)" }}>
                    {x.icon}{x.t}
                  </div>
                ))}
              </div>
            </div>

            {/* Balance chip */}
            <div className="shrink-0 text-right hidden sm:block">
              <div className="text-[9px] font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>กระเป๋าเงิน</div>
              <div className="text-white font-black text-base" style={{ animation: "countUp 0.5s ease both" }}>
                ฿{balance.toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* ── Main ── */}
        <div className="mx-auto max-w-4xl px-4 py-5"
          style={{ animation: cardVisible ? "slideInCard 0.5s cubic-bezier(0.34,1.2,0.64,1) both" : "none" }}>

          <StepBar current={step} />

          <div className="rounded-3xl overflow-hidden"
            style={{ background: "#fff", boxShadow: `0 8px 40px ${c}18, 0 0 0 1px ${c}12` }}>
            {/* Animated top bar */}
            <div style={{ height: "3px", background: `linear-gradient(90deg,${cd},${c},#38bdf8,${c})`, backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite" }} />

            <div className="p-5 sm:p-6">

              {error && (
                <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium animate-pulse"
                  style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                  <XCircle size={15} className="shrink-0" /> {error}
                </div>
              )}

              {/* ══ STEP 1 ══ */}
              {step === "package" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-extrabold text-xl" style={{ color: "#0f172a" }}>เลือกแพ็กเกจ</h2>
                      <p className="text-sm mt-0.5" style={{ color: c }}>เลือก{game.currency}ที่ต้องการ</p>
                    </div>
                    {packages.length > 0 && (
                      <div className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{ background: `${c}12`, color: c, border: `1px solid ${c}30` }}>
                        <TrendingUp size={10} />{packages.length} แพ็กเกจ
                      </div>
                    )}
                  </div>

                  {loading && (
                    <div className="flex flex-col items-center gap-4 py-16">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full opacity-20 animate-ping" style={{ background: c }} />
                        <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: `${c}18` }}>
                          <Loader2 size={24} className="animate-spin" style={{ color: c }} />
                        </div>
                      </div>
                      <p className="text-sm font-medium" style={{ color: c }}>กำลังโหลดแพ็กเกจ...</p>
                    </div>
                  )}

                  {!loading && fetchError && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                      <XCircle size={15} /> {fetchError}
                    </div>
                  )}

                  {!loading && !fetchError && packages.length === 0 && (
                    <div className="flex flex-col items-center gap-3 py-16 text-center">
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${c}10` }}>
                        <Package size={32} style={{ color: `${c}66` }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: c }}>ยังไม่มีแพ็กเกจ</p>
                    </div>
                  )}

                  {!loading && !fetchError && normalPkgs.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
                          style={{ background: `${c}10`, color: c, border: `1px solid ${c}30` }}>
                          <Zap size={10} />แพ็กหลัก
                        </div>
                        <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg,${c}30,transparent)` }} />
                      </div>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
                        gap: "8px",
                      }}>
                        {normalPkgs.map((pkg, i) => (
                          <div key={pkg.id} style={{ animation: "slideInUp 0.35s ease both", animationDelay: `${i * 0.03}s` }}>
                            <PackageCard pkg={pkg} selected={selectedPkg?.id === pkg.id}
                              onClick={() => setSelectedPkg(pkg)} isBestValue={pkg.id === bestValueId} gameColor={c} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!loading && !fetchError && bigPkgs.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full"
                          style={{ background: "rgba(139,92,246,0.08)", color: "#8b5cf6", border: "1px solid #ddd6fe" }}>
                          <Crown size={10} />แพ็กใหญ่ เติมหนัก
                        </div>
                        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,#ddd6fe,transparent)" }} />
                      </div>
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
                        gap: "8px",
                      }}>
                        {bigPkgs.map((pkg, i) => (
                          <div key={pkg.id} style={{ animation: "slideInUp 0.35s ease both", animationDelay: `${i * 0.03}s` }}>
                            <PackageCard pkg={pkg} selected={selectedPkg?.id === pkg.id}
                              onClick={() => setSelectedPkg(pkg)} isBestValue={pkg.id === bestValueId} gameColor="#8b5cf6" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Selected summary */}
                  <div className="rounded-2xl transition-all duration-300 overflow-hidden"
                    style={selectedPkg
                      ? { background: `linear-gradient(135deg,${c}0e,${c}06)`, border: `1.5px solid ${c}40` }
                      : { background: "#f8fafc", border: "1.5px dashed #cbd5e1" }}>
                    {selectedPkg ? (
                      <div className="flex items-center justify-between px-4 py-3">
                        <div>
                          <div className="text-[10px] font-semibold" style={{ color: "#64748b" }}>ที่เลือก</div>
                          <div className="font-bold text-sm" style={{ color: "#0f172a" }}>
                            {selectedPkg.amount > 0 ? `${selectedPkg.amount.toLocaleString()} ${selectedPkg.currencyLabel}` : selectedPkg.label}
                          </div>
                        </div>
                        <div className="font-black text-xl" style={{ color: c, animation: "countUp 0.3s ease both" }}>
                          ฿{selectedPkg.price.toLocaleString()}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2 px-4 py-3 text-sm" style={{ color: "#94a3b8" }}>
                        <Package size={14} /> แตะแพ็กเกจที่ต้องการ
                      </div>
                    )}
                  </div>

                  <button onClick={handlePackageNext} disabled={!selectedPkg || loading}
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-[15px] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: selectedPkg ? `linear-gradient(135deg,${cd},${c})` : "#cbd5e1",
                      boxShadow: selectedPkg ? `0 8px 24px ${c}55, inset 0 1px 0 rgba(255,255,255,0.2)` : "none",
                      letterSpacing: "0.01em",
                    }}>
                    {selectedPkg ? `ถัดไป → ฿${selectedPkg.price.toLocaleString()}` : "เลือกแพ็กเกจก่อน"}
                  </button>
                </div>
              )}

              {/* ══ STEP 2 ══ */}
              {step === "info" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-extrabold text-xl" style={{ color: "#0f172a" }}>กรอกข้อมูลผู้เล่น</h2>
                    <p className="text-sm mt-0.5" style={{ color: c }}>ตรวจสอบ ID ก่อนกดถัดไป</p>
                  </div>

                  {selectedPkg && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{ background: `${c}0c`, border: `1px solid ${c}28` }}>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-semibold" style={{ color: "#64748b" }}>แพ็กเกจ</div>
                        <div className="font-bold text-sm" style={{ color: "#0f172a" }}>
                          {selectedPkg.amount > 0 ? `${selectedPkg.amount.toLocaleString()} ${selectedPkg.currencyLabel}` : selectedPkg.label}
                        </div>
                      </div>
                      <div className="font-black text-base" style={{ color: c }}>฿{selectedPkg.price.toLocaleString()}</div>
                      <button onClick={() => setStep("package")}
                        className="text-[11px] font-bold px-2.5 py-1 rounded-lg transition-colors"
                        style={{ color: c, background: `${c}14` }}>
                        เปลี่ยน
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: cd }}>
                        {game.idLabel} <span className="text-red-400">*</span>
                      </label>
                      <input type="text" value={playerId} onChange={e => setPlayerId(e.target.value)}
                        placeholder={game.idPlaceholder}
                        className="w-full rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition-all"
                        style={{ background: `${c}08`, border: `2px solid ${c}28`, color: "#0f172a" }}
                        onFocus={e => { e.target.style.borderColor = c; e.target.style.boxShadow = `0 0 0 3px ${c}22` }}
                        onBlur={e => { e.target.style.borderColor = `${c}28`; e.target.style.boxShadow = "none" }} />
                    </div>
                    {game.hasServer && (
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: cd }}>Server ID</label>
                        <input type="text" value={serverId} onChange={e => setServerId(e.target.value)}
                          placeholder="เช่น 1234 (ถ้ามี)"
                          className="w-full rounded-xl px-4 py-3 text-sm font-medium focus:outline-none transition-all"
                          style={{ background: `${c}08`, border: `2px solid ${c}28`, color: "#0f172a" }}
                          onFocus={e => { e.target.style.borderColor = c; e.target.style.boxShadow = `0 0 0 3px ${c}22` }}
                          onBlur={e => { e.target.style.borderColor = `${c}28`; e.target.style.boxShadow = "none" }} />
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: `${c}08`, border: `1px solid ${c}20` }}>
                    <p className="text-xs font-bold mb-3 flex items-center gap-2" style={{ color: cd }}>
                      <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white"
                        style={{ background: `linear-gradient(135deg,${c},${cd})` }}>?</span>
                      วิธีหา {game.idLabel}
                    </p>
                    {game.idHint.map((s, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-[11px] mb-2" style={{ color: cd }}>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0 mt-0.5"
                          style={{ background: `linear-gradient(135deg,${c},${cd})` }}>{i + 1}</div>
                        <span className="leading-relaxed">{s}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2.5">
                    <button onClick={() => setStep("package")}
                      className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors"
                      style={{ border: `2px solid ${c}30`, color: c, background: "#fff" }}>← ย้อนกลับ</button>
                    <button onClick={handleInfoNext}
                      className="flex-[2] py-3 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 active:scale-95"
                      style={{ background: `linear-gradient(135deg,${cd},${c})`, boxShadow: `0 4px 16px ${c}44, inset 0 1px 0 rgba(255,255,255,0.2)` }}>
                      ถัดไป →
                    </button>
                  </div>
                </div>
              )}

              {/* ══ STEP 3 ══ */}
              {step === "payment" && selectedPkg && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-extrabold text-xl" style={{ color: "#0f172a" }}>ยืนยันการเติม</h2>
                    <p className="text-sm mt-0.5" style={{ color: c }}>
                      ID: <span className="font-mono font-bold" style={{ color: "#0f172a" }}>{playerId}</span>
                    </p>
                  </div>

                  <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c}28` }}>
                    <div className="px-4 py-2.5 text-[11px] font-bold text-white flex items-center gap-1.5"
                      style={{ background: `linear-gradient(135deg,${cd},${c})` }}>
                      <CreditCard size={11} /> สรุปการชำระเงิน
                    </div>
                    <div className="p-4 space-y-2.5" style={{ background: `${c}05` }}>
                      {[
                        { label: "ยอดเงินในกระเป๋า", value: `฿${balance.toLocaleString()}`, valueColor: c },
                        { label: "ราคาแพ็กเกจ", value: `− ฿${selectedPkg.price.toLocaleString()}`, valueColor: "#dc2626" },
                      ].map((row, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <span className="text-sm" style={{ color: "#64748b" }}>{row.label}</span>
                          <span className="font-black text-base" style={{ color: row.valueColor }}>{row.value}</span>
                        </div>
                      ))}
                      <div className="h-px" style={{ background: `${c}20` }} />
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-bold" style={{ color: "#0f172a" }}>คงเหลือหลังเติม</span>
                        <span className="font-black text-xl" style={{ color: balance >= selectedPkg.price ? "#16a34a" : "#dc2626" }}>
                          ฿{(balance - selectedPkg.price).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {balance < selectedPkg.price && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                      style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                      <XCircle size={15} className="shrink-0" />
                      <span>ยอดไม่พอ ต้องเติมอีก ฿{(selectedPkg.price - balance).toLocaleString()}</span>
                      <a href="/deposit" className="ml-auto font-bold underline whitespace-nowrap">เติมเงิน →</a>
                    </div>
                  )}

                  <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${c}18` }}>
                    <div className="px-4 py-2.5 text-[11px] font-bold text-white flex items-center gap-1.5"
                      style={{ background: `linear-gradient(135deg,${cd},${c})` }}>
                      <Sparkles size={11} /> รายละเอียด
                    </div>
                    {[
                      { label: "เกม", value: `${game.name} — ${game.fullName}` },
                      { label: "แพ็กเกจ", value: selectedPkg.amount > 0 ? `${selectedPkg.amount.toLocaleString()} ${selectedPkg.currencyLabel}` : selectedPkg.label },
                      { label: game.idLabel, value: playerId },
                      ...(game.hasServer && serverId ? [{ label: "Server ID", value: serverId }] : []),
                      { label: "ราคา", value: `฿${selectedPkg.price.toLocaleString()}` },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-2.5 text-sm border-t"
                        style={{ background: i % 2 === 0 ? "#fff" : `${c}04`, borderColor: `${c}10` }}>
                        <span style={{ color: "#64748b" }}>{row.label}</span>
                        <span className="font-semibold" style={{ color: "#0f172a" }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={handleConfirm} disabled={balance < selectedPkg.price || submitting}
                    className="w-full py-4 rounded-2xl text-white font-bold text-[15px] transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{
                      background: `linear-gradient(135deg,${cd},${c})`,
                      boxShadow: `0 8px 28px ${c}55, inset 0 1px 0 rgba(255,255,255,0.2)`,
                    }}>
                    {submitting
                      ? <><Loader2 size={16} className="animate-spin" /> กำลังดำเนินการ...</>
                      : <><CheckCircle2 size={17} /> ยืนยัน หักเงิน ฿{selectedPkg.price.toLocaleString()}</>}
                  </button>

                  <button onClick={() => setStep("info")}
                    className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
                    style={{ border: `1px solid ${c}28`, color: c, background: "#fff" }}>← ย้อนกลับ</button>
                </div>
              )}

              {/* ══ STEP 4 ══ */}
              {step === "status" && (
                <div className="flex flex-col items-center gap-5 py-2">
                  {/* Confetti dots */}
                  <div className="relative w-full h-0 overflow-visible pointer-events-none">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className="absolute rounded-full"
                        style={{
                          width: `${4 + i % 4}px`, height: `${4 + i % 4}px`,
                          background: [c, "#f59e0b", "#10b981", "#ef4444", "#8b5cf6"][i % 5],
                          left: `${10 + i * 9}%`, top: "-10px",
                          animation: `confettiFall ${1 + i * 0.15}s ease forwards`,
                          animationDelay: `${i * 0.1}s`,
                          opacity: 0,
                        }} />
                    ))}
                  </div>

                  <div className="relative" style={{ animation: "successPop 0.6s cubic-bezier(0.34,1.56,0.64,1) both" }}>
                    <div className="w-24 h-24 rounded-full flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg,${c}22,${c}10)`, boxShadow: `0 0 0 8px ${c}0c, 0 0 0 16px ${c}06` }}>
                      <CheckCircle2 size={44} style={{ color: c }} />
                    </div>
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center text-lg"
                      style={{ background: "linear-gradient(135deg,#fbbf24,#f59e0b)", boxShadow: "0 3px 10px rgba(245,158,11,0.5)" }}>
                      🎉
                    </div>
                  </div>

                  <div className="text-center">
                    <h2 className="text-2xl font-black mb-1" style={{ color: "#0f172a" }}>เติมเกมสำเร็จ!</h2>
                    <p className="text-sm" style={{ color: c }}>{game.currency}ถูกโอนเข้าบัญชีแล้ว</p>
                  </div>

                  <div className="w-full rounded-2xl overflow-hidden" style={{ border: `1px solid ${c}20` }}>
                    <div className="px-4 py-2.5 text-[11px] font-bold text-white flex items-center gap-1.5"
                      style={{ background: `linear-gradient(135deg,${cd},${c})` }}>
                      <CheckCircle2 size={11} /> สรุปรายการ
                    </div>
                    {[
                      { label: "เกม", value: `${game.name} — ${game.fullName}` },
                      { label: "จำนวน", value: selectedPkg ? (selectedPkg.amount > 0 ? `${selectedPkg.amount.toLocaleString()} ${selectedPkg.currencyLabel}` : selectedPkg.label) : "-" },
                      { label: game.idLabel, value: playerId },
                      { label: "ยอดชำระ", value: `฿${selectedPkg?.price.toLocaleString()}` },
                      { label: "คงเหลือ", value: `฿${balance.toLocaleString()}` },
                      ...(wonddOrderId ? [{ label: "Order ID", value: wonddOrderId }] : []),
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-2.5 text-sm border-t"
                        style={{ background: i % 2 === 0 ? "#fff" : `${c}04`, borderColor: `${c}10` }}>
                        <span style={{ color: "#64748b" }}>{row.label}</span>
                        <span className="font-bold font-mono text-xs" style={{ color: "#0f172a" }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3 w-full">
                    <a href="/topup" className="flex-1">
                      <button className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:brightness-95"
                        style={{ border: `1.5px solid ${c}30`, color: c, background: "#fff" }}>เติมเกมอื่น</button>
                    </a>
                    <a href="/orders" className="flex-1">
                      <button className="w-full py-3 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 active:scale-95"
                        style={{ background: `linear-gradient(135deg,${cd},${c})`, boxShadow: `0 4px 16px ${c}44` }}>
                        ดูประวัติ →
                      </button>
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Trust strip */}
          <div className="flex items-center justify-center gap-5 mt-4 px-4 py-3 rounded-2xl flex-wrap"
            style={{ background: "#fff", border: "1px solid #f1f5f9", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}>
            {[{ e: "🔒", t: "SSL Secured" }, { e: "⚡", t: "ส่งทันที" }, { e: "🎮", t: "ครบทุกเกม" }, { e: "💬", t: "24/7 Support" }].map((x, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] font-semibold" style={{ color: "#64748b" }}>
                {x.e} {x.t}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
