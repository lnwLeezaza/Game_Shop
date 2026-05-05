"use client";
import { use } from "react"; // เพิ่ม use
import { useState, useCallback, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import {
  ChevronLeft, Shield, Zap, Clock, CheckCircle2,
  XCircle, Loader2, Star, User, CreditCard, Package, Crown
} from "lucide-react";

// ── Types (อยู่นอก component ถูกต้อง) ──
type Step = "package" | "info" | "payment" | "status";

interface PkgData {
  id:            string;
  sku:           string;
  amount:        number;
  label:         string;
  currencyLabel: string;
  price:         number;
  originalPrice: number | null;
  bonusAmount:   number;
  tier:          "normal" | "big";
  badge:         string | null;
  badgeColor:    string | null;
  valuePerUnit:  number;
}

// ══════════════════════════════════════════════
//  COMPONENTS (อยู่นอก component ถูกต้อง)
// ══════════════════════════════════════════════

function GridBg({ opacity = 0.04 }: { opacity?: number }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" style={{ opacity }}>
      <defs>
        <pattern id="tgrid" width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#2563eb" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tgrid)" />
    </svg>
  );
}

function StepBar({ current }: { current: Step }) {
  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "package", label: "แพ็กเกจ", icon: <Package size={13} /> },
    { key: "info",    label: "ข้อมูล",   icon: <User size={13} /> },
    { key: "payment", label: "ชำระเงิน", icon: <CreditCard size={13} /> },
    { key: "status",  label: "ผลลัพธ์",  icon: <CheckCircle2 size={13} /> },
  ];
  const idx = steps.findIndex(s => s.key === current);
  return (
    <div className="relative flex items-center justify-between mb-8 px-1">
      <div className="absolute top-4 left-6 right-6 h-[2px] bg-border rounded-full z-0">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(idx / (steps.length - 1)) * 100}%`, background: "linear-gradient(90deg,#2563eb,#06b6d4)", boxShadow: "0 0 8px rgba(6,182,212,0.5)" }} />
      </div>
      {steps.map((step, i) => {
        const done = i < idx; const active = i === idx;
        return (
          <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={done
                ? { background: "linear-gradient(135deg,#2563eb,#06b6d4)", color: "#fff", boxShadow: "0 0 12px rgba(6,182,212,0.5)" }
                : active
                  ? { background: "linear-gradient(135deg,#1d4ed8,#0891b2)", color: "#fff", boxShadow: "0 0 0 4px rgba(37,99,235,0.2),0 0 16px rgba(6,182,212,0.4)" }
                  : { background: "#f0f6ff", color: "#93c5fd", border: "1.5px solid #bfdbfe" }}>
              {done ? "✓" : step.icon}
            </div>
            <span className="text-[10px] font-semibold whitespace-nowrap"
              style={{ color: active ? "#2563eb" : done ? "#06b6d4" : "#93c5fd" }}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function PackageCard({
  pkg, selected, onClick, isBestValue
}: {
  pkg: PkgData; selected: boolean; onClick: () => void; isBestValue: boolean
}) {
  const isBig = pkg.tier === "big";
  const [imgErr, setImgErr] = useState(false);

  return (
    <button
      onClick={onClick}
      className="relative w-full text-left transition-all duration-200 overflow-hidden group focus:outline-none rounded-2xl"
      style={selected
        ? {
            background: isBig
              ? "linear-gradient(135deg,rgba(139,92,246,0.12),rgba(37,99,235,0.10))"
              : "linear-gradient(135deg,rgba(37,99,235,0.10),rgba(6,182,212,0.08))",
            border: `2px solid ${isBig ? "#8b5cf6" : "#2563eb"}`,
            boxShadow: `0 0 0 3px ${isBig ? "rgba(139,92,246,0.15)" : "rgba(37,99,235,0.15)"}, 0 8px 24px ${isBig ? "rgba(139,92,246,0.18)" : "rgba(37,99,235,0.18)"}`,
            transform: "scale(1.03)"
          }
        : {
            background: isBig ? "linear-gradient(135deg,#faf5ff,#eff6ff)" : "#fff",
            border: `2px solid ${isBig ? "#ddd6fe" : "#e0f0ff"}`,
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)"
          }}
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 20px ${isBig ? "rgba(139,92,246,0.15)" : "rgba(37,99,235,0.15)"}` }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)" }}
    >
      <div className="h-[3px] w-full" style={{
        background: selected
          ? isBig ? "linear-gradient(90deg,#8b5cf6,#2563eb)" : "linear-gradient(90deg,#2563eb,#06b6d4)"
          : isBig ? "linear-gradient(90deg,#ddd6fe,#bfdbfe)" : "linear-gradient(90deg,#bfdbfe,#a5f3fc)"
      }} />

      {(pkg.badge || isBestValue) && (
        <div className="absolute -top-0 right-2 text-[8px] font-black text-white px-2 py-0.5 rounded-b-lg leading-tight z-10"
          style={{
            background: isBestValue && !pkg.badge
              ? "linear-gradient(135deg,#06b6d4,#2563eb)"
              : `linear-gradient(135deg,${pkg.badgeColor},${pkg.badgeColor}cc)`
          }}>
          {isBestValue && !pkg.badge ? "💎 ดีที่สุด"
            : pkg.badge === "VIP" ? "👑 VIP"
            : pkg.badge === "ยอดนิยม" ? "🔥 " + pkg.badge
            : pkg.badge}
        </div>
      )}

      {selected && (
        <div className="absolute top-2.5 left-2.5 w-4 h-4 rounded-full flex items-center justify-center z-10"
          style={{ background: isBig ? "linear-gradient(135deg,#8b5cf6,#2563eb)" : "linear-gradient(135deg,#2563eb,#06b6d4)" }}>
          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      <div className="px-2 pt-2 pb-0 flex flex-col items-center gap-1.5">
        <div className="w-full h-16 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-105 overflow-hidden"
          style={selected
            ? { background: isBig ? "linear-gradient(135deg,#8b5cf6,#2563eb)" : "linear-gradient(135deg,#2563eb,#06b6d4)", boxShadow: `0 4px 14px ${isBig ? "rgba(139,92,246,0.4)" : "rgba(37,99,235,0.4)"}` }
            : { background: isBig ? "linear-gradient(135deg,#ede9fe,#dbeafe)" : "linear-gradient(135deg,#dbeafe,#cffafe)" }}>
          {!imgErr ? (
            <img src="/gamespic/K.png" alt="coupon" className="w-full h-full object-contain p-0.5" onError={() => setImgErr(true)} />
          ) : (
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <rect x="2" y="6" width="20" height="12" rx="2" stroke={selected ? "white" : isBig ? "#8b5cf6" : "#2563eb"} strokeWidth="1.5" />
              <circle cx="12" cy="12" r="2" fill={selected ? "white" : isBig ? "#8b5cf6" : "#2563eb"} />
            </svg>
          )}
        </div>

        <div className="text-center">
          <div className="font-black leading-tight" style={{ fontSize: pkg.amount >= 1000 ? "13px" : "15px", color: "#0a1628" }}>
            {pkg.amount.toLocaleString()}
          </div>
          <div className="text-[9px] font-semibold" style={{ color: selected ? (isBig ? "#8b5cf6" : "#2563eb") : "#1d4ed8" }}>
            {pkg.currencyLabel}
          </div>
        </div>

        {pkg.bonusAmount > 0 && (
          <div className="text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white"
            style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)" }}>
            +{pkg.bonusAmount} โบนัส
          </div>
        )}

        <div className="text-[8px] font-semibold px-1.5 py-0.5 rounded-full"
          style={{ background: isBig ? "rgba(139,92,246,0.08)" : "rgba(6,182,212,0.08)", color: isBig ? "#8b5cf6" : "#0891b2" }}>
          ฿{pkg.valuePerUnit}/{pkg.currencyLabel}
        </div>

        <div className="text-center mt-0.5">
          {pkg.originalPrice && (
            <div className="text-[9px] line-through" style={{ color: "#94a3b8" }}>฿{pkg.originalPrice.toLocaleString()}</div>
          )}
          <div className="font-black" style={{ fontSize: pkg.price >= 1000 ? "14px" : "16px", color: selected ? (isBig ? "#8b5cf6" : "#2563eb") : "#0a1628" }}>
            ฿{pkg.price.toLocaleString()}
          </div>
        </div>

        {isBig && (
          <div className="text-[8px] font-bold flex items-center gap-0.5 mb-1" style={{ color: "#8b5cf6" }}>
            <Crown size={8} /> เติมหนัก
          </div>
        )}
      </div>
    </button>
  );
}

// ══════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════
export default function RovTopupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  // ── State ทั้งหมดอยู่ใน component ──
  const [step,        setStep]        = useState<Step>("package");
  const [packages,    setPackages]    = useState<PkgData[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [fetchError,  setFetchError]  = useState("");
  const [selectedPkg, setSelectedPkg] = useState<PkgData | null>(null);
  const [playerId,    setPlayerId]    = useState("");
  const [serverId,    setServerId]    = useState("");
  const [error,       setError]       = useState("");
  const [balance,     setBalance]     = useState(0);
  const [submitting,  setSubmitting]  = useState(false);

  // ── Fetch packages ──
  useEffect(() => {
    fetch("/api/topup/rov/packages")
      .then(r => r.json())
      .then(d => {
        if (d.error) { setFetchError(d.error); return; }
        setPackages(d.packages);
      })
      .catch(() => setFetchError("โหลดแพ็กเกจไม่สำเร็จ กรุณารีเฟรช"))
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch balance ──
  useEffect(() => {
    fetch("/api/user/balance")
      .then(r => r.json())
      .then(d => setBalance(d.balance ?? 0))
      .catch(() => {});
  }, []);

  const normalPkgs  = packages.filter(p => p.tier === "normal");
  const bigPkgs     = packages.filter(p => p.tier === "big");
  const bestValueId = packages.length
    ? packages.reduce((best, p) =>
        p.valuePerUnit < (packages.find(x => x.id === best)?.valuePerUnit ?? Infinity) ? p.id : best
      , packages[0].id)
    : "";

  const handlePackageNext = useCallback(() => {
    if (!selectedPkg) { setError("กรุณาเลือกแพ็กเกจ"); return; }
    setError(""); setStep("info");
  }, [selectedPkg]);

  const handleInfoNext = useCallback(() => {
    if (!playerId.trim()) { setError("กรุณากรอก Player ID"); return; }
    setError(""); setStep("payment");
  }, [playerId]);

  const handleConfirm = useCallback(async () => {
    if (!selectedPkg) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/topup/rov/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selectedPkg.id, playerId, serverId }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setSubmitting(false); return; }
      setBalance(data.balanceAfter);
      setStep("status");
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }, [selectedPkg, playerId, serverId]);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">

        {/* ── Hero ── */}
        <div className="relative overflow-hidden" style={{ background: "linear-gradient(130deg,#1e40af 0%,#2563eb 50%,#0891b2 100%)" }}>
          <GridBg />
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: "rgba(6,182,212,0.25)", filter: "blur(48px)" }} />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: "rgba(37,99,235,0.3)", filter: "blur(48px)" }} />
          <div className="relative z-10 mx-auto max-w-lg px-4 py-5 flex items-center gap-3">
            <a href="/topup">
              <button className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all hover:scale-110 active:scale-95"
                style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
                <ChevronLeft size={16} className="text-white" />
              </button>
            </a>
            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
              <img src="/gamespic/rov.png" alt="ROV" className="w-full h-full object-cover"
                onError={e => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white font-extrabold text-base leading-tight">ROV — Arena of Valor</div>
              <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.65)" }}>เติมคูปอง ส่งทันที 24/7</div>
            </div>
            <div className="hidden sm:flex gap-1.5 shrink-0">
              {[{ icon: <Zap size={11} />, label: "ส่งทันที" }, { icon: <Shield size={11} />, label: "ปลอดภัย" }, { icon: <Clock size={11} />, label: "24/7" }].map((t, i) => (
                <div key={i} className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-full"
                  style={{ background: "rgba(255,255,255,0.14)", color: "#bfdbfe", border: "1px solid rgba(255,255,255,0.2)" }}>
                  {t.icon} {t.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-lg px-4 py-6">
          <StepBar current={step} />

          <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 4px 32px rgba(37,99,235,0.10),0 0 0 1px #e0f0ff" }}>
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg,#2563eb,#06b6d4,#38bdf8)" }} />
            <div className="p-6">

              {error && (
                <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                  style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                  <XCircle size={15} className="shrink-0" /> {error}
                </div>
              )}

              {/* ══ STEP 1: Package ══ */}
              {step === "package" && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="font-extrabold text-xl mb-0.5" style={{ color: "#0a1628" }}>เลือกแพ็กเกจ</h2>
                      <p className="text-sm" style={{ color: "#1d4ed8" }}>เลือกจำนวนคูปองที่ต้องการเติม</p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                      <Star size={10} className="fill-current" />
                      {packages.length} แพ็กเกจ
                    </div>
                  </div>

                  {loading && (
                    <div className="flex flex-col items-center gap-3 py-12">
                      <Loader2 size={28} className="animate-spin" style={{ color: "#2563eb" }} />
                      <p className="text-sm" style={{ color: "#1d4ed8" }}>กำลังโหลดแพ็กเกจ...</p>
                    </div>
                  )}

                  {!loading && fetchError && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                      style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                      <XCircle size={15} /> {fetchError}
                    </div>
                  )}

                  {!loading && !fetchError && normalPkgs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: "linear-gradient(135deg,rgba(37,99,235,0.08),rgba(6,182,212,0.08))", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                          <Zap size={10} />แพ็กหลัก
                        </div>
                        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,#bfdbfe,transparent)" }} />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {normalPkgs.map(pkg => (
                          <PackageCard key={pkg.id} pkg={pkg} selected={selectedPkg?.id === pkg.id}
                            isBestValue={pkg.id === bestValueId} onClick={() => setSelectedPkg(pkg)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {!loading && !fetchError && bigPkgs.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-2.5">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full"
                          style={{ background: "linear-gradient(135deg,rgba(139,92,246,0.10),rgba(37,99,235,0.08))", color: "#8b5cf6", border: "1px solid #ddd6fe" }}>
                          <Crown size={10} />แพ็กใหญ่ เติมหนัก
                        </div>
                        <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg,#ddd6fe,transparent)" }} />
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {bigPkgs.map(pkg => (
                          <PackageCard key={pkg.id} pkg={pkg} selected={selectedPkg?.id === pkg.id}
                            isBestValue={pkg.id === bestValueId} onClick={() => setSelectedPkg(pkg)} />
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedPkg ? (
                    <div className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm"
                      style={{ background: "linear-gradient(135deg,rgba(37,99,235,0.07),rgba(6,182,212,0.07))", border: "1px solid #bfdbfe" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg,#2563eb,#06b6d4)" }}>
                          <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                            <rect x="2" y="6" width="20" height="12" rx="2" stroke="white" strokeWidth="1.5" />
                            <circle cx="12" cy="12" r="2" fill="white" />
                          </svg>
                        </div>
                        <span className="font-bold" style={{ color: "#0a1628" }}>{selectedPkg.amount.toLocaleString()} {selectedPkg.currencyLabel}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                          style={{ background: "rgba(6,182,212,0.1)", color: "#0891b2" }}>
                          ฿{selectedPkg.valuePerUnit}/{selectedPkg.currencyLabel}
                        </span>
                      </div>
                      <span className="font-black text-base" style={{ color: "#2563eb" }}>฿{selectedPkg.price.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm"
                      style={{ background: "#f0f6ff", border: "1px dashed #bfdbfe", color: "#60a5fa" }}>
                      <Package size={14} /> กรุณาเลือกแพ็กเกจ
                    </div>
                  )}

                  <button onClick={handlePackageNext} disabled={!selectedPkg || loading}
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ background: selectedPkg ? "linear-gradient(135deg,#2563eb,#06b6d4)" : "#93c5fd", boxShadow: selectedPkg ? "0 4px 20px rgba(37,99,235,0.35)" : "none" }}>
                    {selectedPkg ? `ถัดไป → เติม ${selectedPkg.amount.toLocaleString()} ${selectedPkg.currencyLabel} ฿${selectedPkg.price.toLocaleString()}` : "เลือกแพ็กเกจก่อน"}
                  </button>
                </div>
              )}

              {/* ══ STEP 2: Info ══ */}
              {step === "info" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="font-extrabold text-xl mb-0.5" style={{ color: "#0a1628" }}>กรอกข้อมูลผู้เล่น</h2>
                    <p className="text-sm" style={{ color: "#1d4ed8" }}>ตรวจสอบ ID ให้ถูกต้องก่อนกดถัดไป</p>
                  </div>

                  {selectedPkg && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                      style={{ background: "linear-gradient(135deg,rgba(37,99,235,0.06),rgba(6,182,212,0.06))", border: "1px solid #bfdbfe" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg,#2563eb,#06b6d4)" }}>
                        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4">
                          <rect x="2" y="6" width="20" height="12" rx="2" stroke="white" strokeWidth="1.5" />
                          <circle cx="12" cy="12" r="2" fill="white" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold" style={{ color: "#1d4ed8" }}>แพ็กเกจที่เลือก</div>
                        <div className="font-bold text-sm" style={{ color: "#0a1628" }}>{selectedPkg.amount.toLocaleString()} {selectedPkg.currencyLabel}</div>
                      </div>
                      <div className="font-black" style={{ color: "#2563eb" }}>฿{selectedPkg.price.toLocaleString()}</div>
                      <button onClick={() => setStep("package")} className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors" style={{ color: "#2563eb" }}>เปลี่ยน</button>
                    </div>
                  )}

                  <div className="space-y-3">
                    {[
                      { label: "Player ID / UID", value: playerId, setter: setPlayerId, placeholder: "เช่น 123456789", required: true },
                      { label: "Server ID", value: serverId, setter: setServerId, placeholder: "เช่น 1234 (ถ้ามี)", required: false },
                    ].map((f, i) => (
                      <div key={i}>
                        <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "#1d4ed8" }}>
                          {f.label} {f.required && <span className="text-red-400">*</span>}
                        </label>
                        <input type="text" value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder}
                          className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-all focus:outline-none"
                          style={{ background: "#f0f6ff", border: "2px solid #bfdbfe", color: "#0a1628" }}
                          onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
                          onBlur={e => { e.target.style.borderColor = "#bfdbfe"; e.target.style.boxShadow = "none"; }} />
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    <p className="text-xs font-bold mb-2.5 flex items-center gap-1.5" style={{ color: "#1e40af" }}>
                      <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-black text-blue-600">?</span>
                      วิธีหา Player ID ใน ROV
                    </p>
                    {["เปิด ROV แล้วแตะรูปโปรไฟล์มุมบนซ้าย", "เลือก 'ข้อมูลผู้เล่น'", "คัดลอก ID ตัวเลข 9 หลัก"].map((s, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] mb-1.5" style={{ color: "#1d4ed8" }}>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0"
                          style={{ background: "linear-gradient(135deg,#2563eb,#06b6d4)" }}>{i + 1}</div>
                        {s}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2.5">
                    <button onClick={() => setStep("package")} className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors hover:bg-secondary/50"
                      style={{ border: "2px solid #bfdbfe", color: "#1d4ed8", background: "#fff" }}>← ย้อนกลับ</button>
                    <button onClick={handleInfoNext} className="flex-[2] py-3 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 active:scale-95"
                      style={{ background: "linear-gradient(135deg,#2563eb,#06b6d4)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>ถัดไป →</button>
                  </div>
                </div>
              )}

              {/* ══ STEP 3: Payment (หักจาก Wallet) ══ */}
              {step === "payment" && selectedPkg && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-extrabold text-xl mb-0.5" style={{ color: "#0a1628" }}>ยืนยันการเติม</h2>
                    <p className="text-sm" style={{ color: "#1d4ed8" }}>
                      {selectedPkg.amount.toLocaleString()} {selectedPkg.currencyLabel} · ID: <span className="font-mono font-bold">{playerId}</span>
                    </p>
                  </div>

                  {/* Wallet summary */}
                  <div className="rounded-2xl p-4" style={{ background: "#f0f6ff", border: "1px solid #bfdbfe" }}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold" style={{ color: "#1d4ed8" }}>ยอดเงินในกระเป๋า</span>
                      <span className="text-lg font-black" style={{ color: "#2563eb" }}>฿{balance.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-semibold" style={{ color: "#1d4ed8" }}>ราคาแพ็กเกจ</span>
                      <span className="text-lg font-black" style={{ color: "#dc2626" }}>- ฿{selectedPkg.price.toLocaleString()}</span>
                    </div>
                    <div className="h-px my-3" style={{ background: "#bfdbfe" }} />
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold" style={{ color: "#1e40af" }}>คงเหลือหลังเติม</span>
                      <span className="text-lg font-black" style={{ color: balance >= selectedPkg.price ? "#16a34a" : "#dc2626" }}>
                        ฿{(balance - selectedPkg.price).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* ยอดไม่พอ */}
                  {balance < selectedPkg.price && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                      style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                      <XCircle size={15} className="shrink-0" />
                      ยอดเงินไม่เพียงพอ ต้องเติมอีก ฿{(selectedPkg.price - balance).toLocaleString()}
                      <a href="/deposit" className="ml-auto font-bold underline whitespace-nowrap">เติมเงิน</a>
                    </div>
                  )}

                  {/* สรุปออร์เดอร์ */}
                  <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid #bfdbfe" }}>
                    <div className="px-4 py-2 text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg,#1e40af,#0891b2)" }}>รายละเอียด</div>
                    {[
                      { label: "เกม",      value: "ROV — Arena of Valor" },
                      { label: "แพ็กเกจ", value: `${selectedPkg.amount.toLocaleString()} ${selectedPkg.currencyLabel}` },
                      { label: "Player ID", value: playerId },
                      ...(serverId ? [{ label: "Server ID", value: serverId }] : []),
                      { label: "ราคา",    value: `฿${selectedPkg.price.toLocaleString()}` },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-2.5 text-sm bg-white border-t first:border-t-0"
                        style={{ borderColor: "#e0f0ff" }}>
                        <span style={{ color: "#1d4ed8" }}>{row.label}</span>
                        <span className="font-bold" style={{ color: "#0a1628" }}>{row.value}</span>
                      </div>
                    ))}
                  </div>

                  <button onClick={handleConfirm} disabled={balance < selectedPkg.price || submitting}
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg,#2563eb,#06b6d4)", boxShadow: "0 4px 20px rgba(37,99,235,0.35)" }}>
                    {submitting
                      ? <><Loader2 size={16} className="animate-spin" /> กำลังดำเนินการ...</>
                      : `✓ ยืนยัน หักเงิน ฿${selectedPkg.price.toLocaleString()}`}
                  </button>

                  <button onClick={() => setStep("info")} className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-secondary/50"
                    style={{ border: "1px solid #bfdbfe", color: "#1d4ed8" }}>← ย้อนกลับ</button>
                </div>
              )}

              {/* ══ STEP 4: Status ══ */}
              {step === "status" && (
                <div className="flex flex-col items-center gap-5 py-2">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center"
                    style={{ background: "rgba(6,182,212,0.1)", boxShadow: "0 0 0 8px rgba(6,182,212,0.08)" }}>
                    <CheckCircle2 size={40} style={{ color: "#06b6d4" }} />
                  </div>
                  <div className="text-center">
                    <h2 className="text-xl font-black mb-1" style={{ color: "#0a1628" }}>เติมเกมสำเร็จ! 🎉</h2>
                    <p className="text-sm" style={{ color: "#1d4ed8" }}>คูปองถูกโอนเข้าบัญชี ROV ของคุณแล้ว</p>
                  </div>
                  <div className="w-full rounded-2xl overflow-hidden" style={{ border: "1px solid #bfdbfe" }}>
                    <div className="px-4 py-2 text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg,#1e40af,#0891b2)" }}>รายละเอียด</div>
                    {[
                      { label: "เกม",      value: "ROV — Arena of Valor" },
                      { label: "จำนวน",   value: `${selectedPkg?.amount.toLocaleString()} ${selectedPkg?.currencyLabel}` },
                      { label: "Player ID", value: playerId },
                      { label: "ยอดชำระ", value: `฿${selectedPkg?.price.toLocaleString()}` },
                      { label: "คงเหลือ", value: `฿${balance.toLocaleString()}` },
                    ].map((row, i) => (
                      <div key={i} className="flex justify-between items-center px-4 py-2.5 text-sm bg-white border-t first:border-t-0"
                        style={{ borderColor: "#e0f0ff" }}>
                        <span style={{ color: "#1d4ed8" }}>{row.label}</span>
                        <span className="font-bold" style={{ color: "#0a1628" }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 w-full">
                    <a href="/" className="flex-1">
                      <button className="w-full py-2.5 rounded-xl font-semibold text-sm border" style={{ borderColor: "#bfdbfe", color: "#1d4ed8" }}>กลับหน้าหลัก</button>
                    </a>
                    <a href="/orders" className="flex-1">
                      <button className="w-full py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: "linear-gradient(135deg,#2563eb,#06b6d4)" }}>ดูประวัติ</button>
                    </a>
                  </div>
                </div>
              )}

            </div>
          </div>

          {/* Trust strip */}
          <div className="flex items-center justify-center gap-5 mt-5 px-4 py-3 rounded-2xl" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
            {[{ icon: "🔒", label: "SSL Secured" }, { icon: "⚡", label: "ส่งทันที" }, { icon: "🎮", label: "ครบทุกเกม" }, { icon: "💬", label: "ซัพพอร์ต 24/7" }].map((item, i) => (
              <div key={i} className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#1d4ed8" }}>
                <span>{item.icon}</span>{item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}