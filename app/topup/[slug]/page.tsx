"use client";

// app/topup/[slug]/page.tsx
import { useEffect, useState, useCallback, use } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Shield, Zap, Clock, CheckCircle2, XCircle, Loader2, Star, User, CreditCard, Package } from "lucide-react";
import {
  supabase,
  getTopupProduct,
  getTopupPackages,
  createTopupOrder,
  subscribeToOrder,
  type TopupProduct,
  type TopupPackage,
  type TopupOrder,
} from "@/lib/supabase/topup-client";

type Step = "package" | "info" | "payment" | "status";

const TRUST = [
  { icon: <Zap size={12} />,    label: "ส่งทันที" },
  { icon: <Shield size={12} />, label: "ปลอดภัย 100%" },
  { icon: <Clock size={12} />,  label: "24/7" },
];

// แพ็กเกจที่ถือว่า "ใหญ่" (>= 1240 คูปอง)
const BIG_PACKAGE_THRESHOLD = 1240;

function GridBg() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.04 }}>
      <defs>
        <pattern id="tgrid" width="36" height="36" patternUnits="userSpaceOnUse">
          <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#2563eb" strokeWidth="0.8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#tgrid)" />
    </svg>
  );
}

// ── Step Bar ──────────────────────────────────────────────
function StepBar({ current }: { current: Step }) {
  const steps: { key: Step; label: string; icon: React.ReactNode }[] = [
    { key: "package", label: "แพ็กเกจ",  icon: <Package size={13} /> },
    { key: "info",    label: "ข้อมูล",    icon: <User size={13} /> },
    { key: "payment", label: "ชำระเงิน",  icon: <CreditCard size={13} /> },
    { key: "status",  label: "ผลลัพธ์",   icon: <CheckCircle2 size={13} /> },
  ];
  const idx = steps.findIndex((s) => s.key === current);

  return (
    <div className="relative flex items-center justify-between mb-8 px-1">
      <div className="absolute top-4 left-6 right-6 h-[2px] bg-border rounded-full z-0">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${(idx / (steps.length - 1)) * 100}%`,
            background: "linear-gradient(90deg, #2563eb, #06b6d4)",
            boxShadow: "0 0 8px rgba(6,182,212,0.5)",
          }}
        />
      </div>
      {steps.map((step, i) => {
        const done   = i < idx;
        const active = i === idx;
        return (
          <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300"
              style={
                done
                  ? { background: "linear-gradient(135deg, #2563eb, #06b6d4)", color: "#fff", boxShadow: "0 0 12px rgba(6,182,212,0.5)" }
                  : active
                  ? { background: "linear-gradient(135deg, #1d4ed8, #0891b2)", color: "#fff", boxShadow: "0 0 0 4px rgba(37,99,235,0.2), 0 0 16px rgba(6,182,212,0.4)" }
                  : { background: "#f0f6ff", color: "#93c5fd", border: "1.5px solid #bfdbfe" }
              }
            >
              {done ? "✓" : step.icon}
            </div>
            <span className="text-[10px] font-semibold whitespace-nowrap" style={{ color: active ? "#2563eb" : done ? "#06b6d4" : "#93c5fd" }}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Coupon SVG Icon ───────────────────────────────────────
function CouponIcon({ selected, size = 28 }: { selected: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="8" width="28" height="16" rx="3"
        fill={selected ? "rgba(255,255,255,0.25)" : "#bfdbfe"} />
      <path d="M2 13h28M2 19h28"
        stroke={selected ? "#fff" : "#60a5fa"} strokeWidth="1.2" strokeDasharray="3 2" />
      <circle cx="2"  cy="16" r="3" fill={selected ? "rgba(37,99,235,0.4)" : "#e0f2fe"} />
      <circle cx="30" cy="16" r="3" fill={selected ? "rgba(37,99,235,0.4)" : "#e0f2fe"} />
      <text
        x="16" y="17"
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="7"
        fontWeight="800"
        fill={selected ? "#fff" : "#1d4ed8"}
        fontFamily="'Noto Sans Thai', sans-serif"
      >
        ROV
      </text>
    </svg>
  );
}

// ── Package Card ──────────────────────────────────────────
function PackageCard({ pkg, selected, onClick }: { pkg: TopupPackage; selected: boolean; onClick: () => void }) {
  const isBig = (pkg.diamond_amount ?? 0) >= BIG_PACKAGE_THRESHOLD;

  return (
    <button
      onClick={onClick}
      className="relative w-full rounded-2xl text-left transition-all duration-200 overflow-hidden group focus:outline-none"
      style={
        selected
          ? { background: "linear-gradient(135deg, rgba(37,99,235,0.10), rgba(6,182,212,0.08))", border: "2px solid #2563eb", boxShadow: "0 0 0 3px rgba(37,99,235,0.15), 0 8px 24px rgba(37,99,235,0.18)", transform: "scale(1.03)" }
          : { background: "#fff", border: "2px solid #e0f0ff", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }
      }
      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 20px rgba(37,99,235,0.15)"; }}
      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(0,0,0,0.05)"; }}
    >
      {/* gradient top bar */}
      <div className="h-[3px] w-full" style={{ background: selected ? "linear-gradient(90deg, #2563eb, #06b6d4)" : isBig ? "linear-gradient(90deg, #7c3aed, #2563eb)" : "linear-gradient(90deg, #bfdbfe, #a5f3fc)" }} />

      {/* badges — ป้อง overlap กัน */}
      {pkg.is_popular && !isBig && (
        <div className="absolute top-0 right-2 text-[8px] font-black text-white px-2 py-0.5 rounded-b-lg leading-tight" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}>
          ⭐ นิยม
        </div>
      )}
      {isBig && (
        <div className="absolute top-0 left-2 text-[8px] font-black text-white px-2 py-0.5 rounded-b-lg leading-tight" style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
          💎 แพ็กใหญ่
        </div>
      )}

      {/* checkmark */}
      {selected && (
        <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)" }}>
          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      <div className="p-3 flex flex-col items-center gap-1.5">
        {/* icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
          style={
            selected
              ? { background: "linear-gradient(135deg, #2563eb, #06b6d4)", boxShadow: "0 4px 14px rgba(37,99,235,0.4)" }
              : isBig
              ? { background: "linear-gradient(135deg, #ede9fe, #dbeafe)" }
              : { background: "linear-gradient(135deg, #dbeafe, #cffafe)" }
          }
        >
          <CouponIcon selected={selected} size={26} />
        </div>

        {/* amount */}
        <div className="text-center">
          <div className="text-[15px] font-black" style={{ color: "#0a1628" }}>
            {pkg.diamond_amount?.toLocaleString()}
          </div>
          <div className="text-[9px] font-semibold" style={{ color: isBig ? "#7c3aed" : "#1d4ed8" }}>
            {pkg.currency_label}
          </div>
        </div>

        {/* bonus */}
        {pkg.bonus_amount > 0 && (
          <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full border" style={{ background: "rgba(6,182,212,0.08)", color: "#0891b2", borderColor: "#a5f3fc" }}>
            +{pkg.bonus_amount} โบนัส
          </span>
        )}

        {/* price */}
        <div className="text-center mt-0.5">
          <div className="text-[16px] font-black" style={{ color: selected ? "#2563eb" : "#0a1628" }}>
            ฿{pkg.price.toLocaleString()}
          </div>
          {pkg.original_price && (
            <div className="text-[9px] line-through" style={{ color: "#93c5fd" }}>
              ฿{pkg.original_price}
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

// ── QR Payment ────────────────────────────────────────────
function QRPayment({ amount, packageName, onConfirm }: { amount: number; packageName: string; onConfirm: () => void }) {
  const [countdown, setCountdown] = useState(300);
  useEffect(() => {
    const t = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(countdown / 60)).padStart(2, "0");
  const ss = String(countdown % 60).padStart(2, "0");
  const urgent = countdown < 60;

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-full rounded-2xl p-4 text-center relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #0891b2 100%)", boxShadow: "0 4px 20px rgba(37,99,235,0.3)" }}>
        <GridBg />
        <div className="relative z-10">
          <p className="text-[11px] font-semibold mb-1" style={{ color: "rgba(255,255,255,0.7)" }}>{packageName}</p>
          <p className="text-4xl font-black text-white" style={{ textShadow: "0 0 20px rgba(6,182,212,0.6)" }}>฿{amount.toLocaleString()}</p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>ชำระผ่าน PromptPay</p>
        </div>
      </div>

      <div className="relative">
        <div className="p-5 bg-white rounded-2xl" style={{ boxShadow: "0 0 0 1px #bfdbfe, 0 8px 32px rgba(37,99,235,0.12)" }}>
          {[["top-2 left-2","border-t-2 border-l-2"],["top-2 right-2","border-t-2 border-r-2"],["bottom-2 left-2","border-b-2 border-l-2"],["bottom-2 right-2","border-b-2 border-r-2"]].map(([pos,border],i) => (
            <div key={i} className={`absolute ${pos} w-5 h-5 ${border} rounded-sm`} style={{ borderColor: "#2563eb" }} />
          ))}
          <svg viewBox="0 0 100 100" fill="#0a1628" className="w-40 h-40">
            <rect x="5" y="5" width="35" height="35" rx="4" fill="none" stroke="#0a1628" strokeWidth="4"/>
            <rect x="14" y="14" width="17" height="17" rx="2"/>
            <rect x="60" y="5" width="35" height="35" rx="4" fill="none" stroke="#0a1628" strokeWidth="4"/>
            <rect x="69" y="14" width="17" height="17" rx="2"/>
            <rect x="5" y="60" width="35" height="35" rx="4" fill="none" stroke="#0a1628" strokeWidth="4"/>
            <rect x="14" y="69" width="17" height="17" rx="2"/>
            <rect x="60" y="60" width="6" height="6"/><rect x="72" y="60" width="6" height="6"/>
            <rect x="84" y="60" width="11" height="6"/><rect x="60" y="72" width="6" height="6"/>
            <rect x="72" y="72" width="6" height="6"/><rect x="84" y="72" width="11" height="6"/>
            <rect x="60" y="84" width="6" height="11"/><rect x="72" y="84" width="6" height="6"/>
            <rect x="84" y="84" width="11" height="6"/>
          </svg>
        </div>
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-4 py-1 rounded-full whitespace-nowrap" style={{ background: "linear-gradient(90deg, #1e3a8a, #1e40af)", boxShadow: "0 2px 8px rgba(37,99,235,0.4)" }}>
          PromptPay QR
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm font-semibold px-5 py-2 rounded-full" style={urgent ? { background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" } : { background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
        <Clock size={13} />
        หมดเวลาใน <span className="font-mono font-black tabular-nums">{mm}:{ss}</span>
      </div>

      <div className="w-full rounded-2xl p-4 space-y-2.5" style={{ background: "#f0f6ff", border: "1px solid #bfdbfe" }}>
        <p className="text-xs font-bold mb-1" style={{ color: "#1e40af" }}>📱 วิธีสแกน QR</p>
        {["เปิดแอปธนาคารหรือ Mobile Banking","เลือก 'สแกน QR' หรือ 'PromptPay'","สแกน QR แล้วยืนยันยอด"].map((s,i) => (
          <div key={i} className="flex items-center gap-3 text-xs" style={{ color: "#1d4ed8" }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-[10px] shrink-0" style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)" }}>{i+1}</div>
            {s}
          </div>
        ))}
      </div>

      <button onClick={onConfirm} className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:brightness-110 active:scale-95" style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)", boxShadow: "0 4px 20px rgba(37,99,235,0.35)" }}>
        ✓ ยืนยันการชำระเงิน
      </button>
      <p className="text-[11px] text-center" style={{ color: "#60a5fa" }}>
        ระบบตรวจสอบอัตโนมัติภายใน 1–3 นาที หากชำระแล้วไม่ต้องกดปุ่มนี้
      </p>
    </div>
  );
}

// ── Status Tracker ────────────────────────────────────────
function StatusTracker({ order }: { order: TopupOrder }) {
  const isSuccess = order.status === "success";
  const isFailed  = order.status === "failed";
  const isDone    = isSuccess || isFailed;

  return (
    <div className="flex flex-col items-center gap-5 py-2">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center"
        style={
          isSuccess ? { background: "rgba(6,182,212,0.1)", boxShadow: "0 0 0 8px rgba(6,182,212,0.08)" }
          : isFailed ? { background: "#fef2f2", boxShadow: "0 0 0 8px rgba(239,68,68,0.08)" }
          : { background: "rgba(37,99,235,0.08)", boxShadow: "0 0 0 8px rgba(37,99,235,0.06)" }
        }
      >
        {isSuccess ? <CheckCircle2 size={40} style={{ color: "#06b6d4" }} />
         : isFailed ? <XCircle size={40} className="text-red-500" />
         : <Loader2 size={36} className="animate-spin" style={{ color: "#2563eb" }} />}
      </div>

      <div className="text-center">
        <h2 className="text-xl font-black mb-1" style={{ color: "#0a1628" }}>
          {isSuccess ? "เติมเกมสำเร็จ! 🎉" : isFailed ? "เกิดข้อผิดพลาด" : "กำลังดำเนินการ..."}
        </h2>
        <p className="text-sm" style={{ color: "#1d4ed8" }}>
          {isSuccess ? "ระบบโอนเข้าบัญชีในเกมของคุณแล้ว"
           : isFailed ? order.error_message ?? "กรุณาติดต่อทีมงาน"
           : "กำลังส่งข้อมูลไปยังเซิร์ฟเวอร์เกม"}
        </p>
      </div>

      <div className="w-full rounded-2xl overflow-hidden" style={{ border: "1px solid #bfdbfe" }}>
        <div className="px-4 py-2 text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg, #1e40af, #0891b2)" }}>รายละเอียดคำสั่งซื้อ</div>
        <div className="divide-y divide-border">
          {[
            { label: "หมายเลขออเดอร์", value: order.id.slice(0,8).toUpperCase(), mono: true },
            ...(order.api_ref_id ? [{ label: "Ref.", value: order.api_ref_id, mono: true }] : []),
            { label: "ยอดชำระ", value: `฿${order.amount.toLocaleString()}`, mono: false },
            { label: "สถานะ", value: isSuccess ? "✅ สำเร็จ" : isFailed ? "❌ ล้มเหลว" : "⏳ กำลังดำเนินการ", mono: false },
          ].map((row,i) => (
            <div key={i} className="flex justify-between items-center px-4 py-2.5 text-sm bg-white">
              <span style={{ color: "#1d4ed8" }}>{row.label}</span>
              <span className={`font-bold ${row.mono ? "font-mono text-xs" : ""}`} style={{ color: "#0a1628" }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {!isDone && (
        <div className="flex gap-1.5">
          {[0,1,2].map(i => <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#2563eb", animationDelay: `${i*0.15}s` }} />)}
        </div>
      )}

      {isDone && (
        <div className="flex gap-3 w-full">
          <a href="/" className="flex-1"><Button variant="outline" className="w-full">กลับหน้าหลัก</Button></a>
          {isSuccess ? (
            <a href="/orders" className="flex-1">
              <button className="w-full py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)" }}>ดูประวัติ</button>
            </a>
          ) : (
            <button onClick={() => window.location.reload()} className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>ลองใหม่</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function TopupPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [product,     setProduct]     = useState<TopupProduct | null>(null);
  const [packages,    setPackages]    = useState<TopupPackage[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState("");
  const [step,        setStep]        = useState<Step>("package");
  const [playerId,    setPlayerId]    = useState("");
  const [serverId,    setServerId]    = useState("");
  const [selectedPkg, setSelectedPkg] = useState<TopupPackage | null>(null);
  const [order,       setOrder]       = useState<TopupOrder | null>(null);
  const [submitting,  setSubmitting]  = useState(false);

  // ดึงข้อมูลจาก Supabase (getTopupPackages เรียง sort_order อยู่แล้ว)
  useEffect(() => {
    (async () => {
      const prod = await getTopupProduct(slug);
      if (!prod) { setError("ไม่พบเกมนี้"); setLoading(false); return; }
      const pkgs = await getTopupPackages(prod.id);
      setProduct(prod);
      setPackages(pkgs);
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!order) return;
    const unsub = subscribeToOrder(order.id, (updated) => setOrder(updated));
    return unsub;
  }, [order?.id]);

  const handlePackageNext = useCallback(() => {
    if (!selectedPkg) { setError("กรุณาเลือกแพ็กเกจ"); return; }
    setError(""); setStep("info");
  }, [selectedPkg]);

  const handleInfoNext = useCallback(() => {
    if (!playerId.trim()) { setError("กรุณากรอก Player ID"); return; }
    setError(""); setStep("payment");
  }, [playerId]);

  const handlePaymentConfirm = useCallback(async () => {
    if (!selectedPkg) return;
    setSubmitting(true); setError("");
    try {
      const result = await createTopupOrder({
        package_id: selectedPkg.id,
        player_id: playerId,
        player_server: serverId || undefined,
        payment_ref: `QR-${Date.now()}`,
      });
      const { data } = await supabase.from("topup_orders").select("*").eq("id", result.order_id).single();
      setOrder(data as TopupOrder);
      setStep("status");
    } catch (e) {
      setError(e instanceof Error ? e.message : "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  }, [selectedPkg, playerId, serverId]);

  // ── Loading ──
  if (loading) return (
    <>
      <Header />
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-14 h-14">
            <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)", opacity: 0.15 }} />
            <Loader2 size={32} className="animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: "#2563eb" }} />
          </div>
          <p className="text-sm font-medium" style={{ color: "#1d4ed8" }}>กำลังโหลด...</p>
        </div>
      </div>
      <Footer />
    </>
  );

  // ── Not Found ──
  if (!product) return (
    <>
      <Header />
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🎮</p>
          <h1 className="text-xl font-bold mb-2" style={{ color: "#0a1628" }}>ไม่พบเกมนี้</h1>
          <a href="/" className="text-sm hover:underline" style={{ color: "#2563eb" }}>← กลับหน้าหลัก</a>
        </div>
      </div>
      <Footer />
    </>
  );

  const currencyName = (product as any).currency_name ?? "คูปอง";

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">

        {/* ── Hero band ── */}
        <div className="relative overflow-hidden" style={{ background: "linear-gradient(130deg, #1e40af 0%, #2563eb 50%, #0891b2 100%)" }}>
          <GridBg />
          <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: "rgba(6,182,212,0.25)", filter: "blur(48px)" }} />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full pointer-events-none" style={{ background: "rgba(37,99,235,0.3)", filter: "blur(48px)" }} />

          <div className="relative z-10 mx-auto max-w-lg px-4 py-5 flex items-center gap-3">
            <a href="/topup">
              <button className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 shrink-0" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}>
                <ChevronLeft size={16} className="text-white" />
              </button>
            </a>

            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-xl object-cover shrink-0" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }} />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: "rgba(255,255,255,0.2)" }}>🎮</div>
            )}

            <div className="min-w-0 flex-1">
              <div className="text-white font-extrabold text-base leading-tight truncate" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.2)" }}>{product.name}</div>
              <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.65)" }}>{product.publisher}</div>
            </div>

            <div className="hidden sm:flex gap-1.5 shrink-0">
              {TRUST.map((t,i) => (
                <div key={i} className="flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(255,255,255,0.14)", color: "#bfdbfe", border: "1px solid rgba(255,255,255,0.2)" }}>
                  {t.icon} {t.label}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-lg px-4 py-6">
          <StepBar current={step} />

          {/* ── Main card ── */}
          <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: "0 4px 32px rgba(37,99,235,0.10), 0 0 0 1px #e0f0ff" }}>
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #2563eb, #06b6d4, #38bdf8)" }} />

            <div className="p-6">
              {error && (
                <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium" style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                  <XCircle size={15} className="shrink-0" /> {error}
                </div>
              )}

              {/* ══ STEP 1: Package ══ */}
              {step === "package" && (
                <div className="space-y-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="font-extrabold text-xl mb-0.5" style={{ color: "#0a1628" }}>เลือกแพ็กเกจ</h2>
                      <p className="text-sm" style={{ color: "#1d4ed8" }}>เลือกจำนวน{currencyName}ที่ต้องการเติม</p>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ background: "#eff6ff", color: "#2563eb", border: "1px solid #bfdbfe" }}>
                      <Star size={10} className="fill-current" />
                      {packages.length} แพ็กเกจ
                    </div>
                  </div>

                  {/* Package grid */}
                  <div className="grid grid-cols-3 gap-2.5 max-h-[420px] overflow-y-auto pr-0.5">
                    {packages.map(pkg => (
                      <PackageCard
                        key={pkg.id}
                        pkg={pkg}
                        selected={selectedPkg?.id === pkg.id}
                        onClick={() => setSelectedPkg(pkg)}
                      />
                    ))}
                  </div>

                  {/* Selected summary */}
                  {selectedPkg ? (
                    <div className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.07), rgba(6,182,212,0.07))", border: "1px solid #bfdbfe" }}>
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)" }}>
                          <CouponIcon selected size={18} />
                        </div>
                        <span className="font-bold" style={{ color: "#0a1628" }}>
                          {selectedPkg.diamond_amount?.toLocaleString()} {selectedPkg.currency_label}
                        </span>
                      </div>
                      <span className="font-black text-base" style={{ color: "#2563eb" }}>฿{selectedPkg.price.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm" style={{ background: "#f0f6ff", border: "1px dashed #bfdbfe", color: "#60a5fa" }}>
                      <Package size={14} /> กรุณาเลือกแพ็กเกจ
                    </div>
                  )}

                  <button
                    onClick={handlePackageNext}
                    disabled={!selectedPkg}
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      background: selectedPkg ? "linear-gradient(135deg, #2563eb, #06b6d4)" : "#93c5fd",
                      boxShadow: selectedPkg ? "0 4px 20px rgba(37,99,235,0.35)" : "none",
                    }}
                  >
                    {selectedPkg
                      ? `ถัดไป → เติม ${selectedPkg.diamond_amount?.toLocaleString()} ${selectedPkg.currency_label}`
                      : "เลือกแพ็กเกจก่อน"}
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
                    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.06), rgba(6,182,212,0.06))", border: "1px solid #bfdbfe" }}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)" }}>
                        <CouponIcon selected size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold" style={{ color: "#1d4ed8" }}>แพ็กเกจที่เลือก</div>
                        <div className="font-bold text-sm" style={{ color: "#0a1628" }}>
                          {selectedPkg.diamond_amount?.toLocaleString()} {selectedPkg.currency_label}
                        </div>
                      </div>
                      <div className="font-black" style={{ color: "#2563eb" }}>฿{selectedPkg.price.toLocaleString()}</div>
                      <button onClick={() => setStep("package")} className="text-[11px] font-semibold px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors" style={{ color: "#2563eb" }}>เปลี่ยน</button>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "#1d4ed8" }}>
                        Player ID / UID <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={playerId}
                        onChange={e => setPlayerId(e.target.value)}
                        placeholder="เช่น 123456789"
                        className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-all focus:outline-none"
                        style={{ background: "#f0f6ff", border: "2px solid #bfdbfe", color: "#0a1628" }}
                        onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
                        onBlur={e  => { e.target.style.borderColor = "#bfdbfe"; e.target.style.boxShadow = "none"; }}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: "#1d4ed8" }}>
                        Server ID <span className="font-normal normal-case opacity-60">(ถ้ามี)</span>
                      </label>
                      <input
                        type="text"
                        value={serverId}
                        onChange={e => setServerId(e.target.value)}
                        placeholder="เช่น 1234"
                        className="w-full rounded-xl px-4 py-3 text-sm font-medium transition-all focus:outline-none"
                        style={{ background: "#f0f6ff", border: "2px solid #bfdbfe", color: "#0a1628" }}
                        onFocus={e => { e.target.style.borderColor = "#2563eb"; e.target.style.boxShadow = "0 0 0 3px rgba(37,99,235,0.12)"; }}
                        onBlur={e  => { e.target.style.borderColor = "#bfdbfe"; e.target.style.boxShadow = "none"; }}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl p-4" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                    <p className="text-xs font-bold mb-2.5 flex items-center gap-1.5" style={{ color: "#1e40af" }}>
                      <span className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[9px] font-black text-blue-600">?</span>
                      วิธีหา Player ID
                    </p>
                    <div className="space-y-1.5">
                      {["เปิดเกม ROV","ไปที่หน้าโปรไฟล์ตัวละคร","คัดลอก ID ตัวเลขใต้ชื่อตัวละคร"].map((s,i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px]" style={{ color: "#1d4ed8" }}>
                          <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-black shrink-0" style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)" }}>{i+1}</div>
                          {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2.5">
                    <button onClick={() => setStep("package")} className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors hover:bg-secondary/50" style={{ border: "2px solid #bfdbfe", color: "#1d4ed8", background: "#fff" }}>
                      ← ย้อนกลับ
                    </button>
                    <button onClick={handleInfoNext} className="flex-[2] py-3 rounded-xl text-white font-bold text-sm transition-all hover:brightness-110 active:scale-95" style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)", boxShadow: "0 4px 16px rgba(37,99,235,0.3)" }}>
                      ถัดไป →
                    </button>
                  </div>
                </div>
              )}

              {/* ══ STEP 3: Payment ══ */}
              {step === "payment" && selectedPkg && (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-extrabold text-xl mb-0.5" style={{ color: "#0a1628" }}>ชำระเงิน</h2>
                    <p className="text-sm" style={{ color: "#1d4ed8" }}>
                      {selectedPkg.name} · {selectedPkg.diamond_amount?.toLocaleString()} {selectedPkg.currency_label}
                      {" · "}ID: <span className="font-mono font-bold">{playerId}</span>
                    </p>
                  </div>
                  {submitting ? (
                    <div className="flex flex-col items-center gap-4 py-12">
                      <div className="relative w-16 h-16">
                        <div className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(135deg, #2563eb, #06b6d4)", opacity: 0.15 }} />
                        <Loader2 size={32} className="animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ color: "#2563eb" }} />
                      </div>
                      <p className="text-sm font-medium" style={{ color: "#1d4ed8" }}>กำลังสร้างคำสั่งซื้อ...</p>
                    </div>
                  ) : (
                    <QRPayment
                      amount={selectedPkg.price}
                      packageName={selectedPkg.name}
                      onConfirm={handlePaymentConfirm}
                    />
                  )}
                  {!submitting && (
                    <button onClick={() => setStep("info")} className="w-full py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-secondary/50" style={{ border: "1px solid #bfdbfe", color: "#1d4ed8" }}>
                      ← ย้อนกลับ
                    </button>
                  )}
                </div>
              )}

              {/* ══ STEP 4: Status ══ */}
              {step === "status" && order && <StatusTracker order={order} />}
            </div>
          </div>

          {/* Footer trust strip */}
          <div className="flex items-center justify-center gap-5 mt-5 px-4 py-3 rounded-2xl" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
            {[
              { icon: "🔒", label: "SSL Secured" },
              { icon: "⚡", label: "ส่งทันที" },
              { icon: "🎮", label: "ครบทุกเกม" },
              { icon: "💬", label: "ซัพพอร์ต 24/7" },
            ].map((item,i) => (
              <div key={i} className="flex items-center gap-1 text-[11px] font-semibold" style={{ color: "#1d4ed8" }}>
                <span>{item.icon}</span> {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
