"use client";

// app/topup/[slug]/page.tsx
import { useEffect, useState, useCallback, use } from "react";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Shield, Zap, Clock, CheckCircle2, XCircle, Loader2 } from "lucide-react";
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

type Step = "info" | "package" | "payment" | "status";

// ── Trust badges ──────────────────────────────────────────
const TRUST = [
  { icon: <Zap size={12} />,    label: "ส่งทันที" },
  { icon: <Shield size={12} />, label: "ปลอดภัย 100%" },
  { icon: <Clock size={12} />,  label: "24/7" },
];

// ── Step Bar ──────────────────────────────────────────────
function StepBar({ current }: { current: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "info",    label: "ข้อมูล" },
    { key: "package", label: "แพ็กเกจ" },
    { key: "payment", label: "ชำระเงิน" },
    { key: "status",  label: "ผลลัพธ์" },
  ];
  const idx = steps.findIndex((s) => s.key === current);
  return (
    <div className="flex items-center justify-between mb-8 px-2">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1">
          <div className="flex flex-col items-center shrink-0">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                i < idx
                  ? "text-white shadow-md"
                  : i === idx
                  ? "text-white shadow-lg ring-4 ring-primary/20"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}
              style={i <= idx ? { background: "linear-gradient(135deg, #d946a8, #7c3aed)" } : {}}
            >
              {i < idx ? "✓" : i + 1}
            </div>
            <span className={`mt-1 text-[10px] font-semibold whitespace-nowrap ${i === idx ? "text-primary" : "text-muted-foreground"}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-[2px] flex-1 mx-2 mb-4 rounded-full transition-all duration-500 ${i < idx ? "bg-primary" : "bg-border"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Package Card ──────────────────────────────────────────
function PackageCard({ pkg, selected, onClick }: { pkg: TopupPackage; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative w-full rounded-2xl p-3.5 text-left transition-all duration-200 border-2 overflow-hidden group ${
        selected
          ? "border-primary shadow-lg shadow-primary/15 scale-[1.02]"
          : "border-border bg-white hover:border-primary/40 hover:shadow-md hover:shadow-primary/8 hover:-translate-y-0.5"
      }`}
      style={selected ? { background: "linear-gradient(135deg, rgba(217,70,168,0.06), rgba(124,58,237,0.06))" } : {}}
    >
      {/* Top accent bar */}
      {selected && (
        <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: "linear-gradient(90deg, #d946a8, #7c3aed)" }} />
      )}

      {pkg.is_popular && (
        <span
          className="absolute -top-0 right-3 text-[9px] font-black text-white px-2 py-0.5 rounded-b-lg"
          style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
        >
          ⭐ ยอดนิยม
        </span>
      )}

      {selected && (
        <div
          className="absolute top-2 left-2 w-4 h-4 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #d946a8, #7c3aed)" }}
        >
          <svg viewBox="0 0 10 10" className="w-2.5 h-2.5">
            <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}

      {/* Diamond icon + amount */}
      <div className="flex flex-col items-center gap-1 pt-1">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center mb-1 transition-transform duration-200 group-hover:scale-110"
          style={{ background: selected ? "linear-gradient(135deg, #d946a8, #7c3aed)" : "linear-gradient(135deg, #e9d5ff, #fce7f3)" }}
        >
          <svg viewBox="0 0 24 24" fill={selected ? "white" : "#7c3aed"} className="w-5 h-5">
            <path d="M12 2L2 9l10 13L22 9z" />
          </svg>
        </div>
        <div className="text-center">
          <div className="text-base font-black text-[#1a1028]">{pkg.diamond_amount?.toLocaleString()}</div>
          <div className="text-[10px] text-muted-foreground font-medium">{pkg.currency_label}</div>
        </div>
        {pkg.bonus_amount > 0 && (
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
            +{pkg.bonus_amount} โบนัส
          </span>
        )}
        <div className="mt-1 text-center">
          <div className="text-lg font-black" style={{ color: selected ? "#7c3aed" : "#1a1028" }}>
            ฿{pkg.price.toLocaleString()}
          </div>
          {pkg.original_price && (
            <div className="text-[10px] text-muted-foreground line-through">฿{pkg.original_price}</div>
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

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Amount summary */}
      <div
        className="w-full rounded-2xl p-4 text-center"
        style={{ background: "linear-gradient(135deg, rgba(217,70,168,0.08), rgba(124,58,237,0.08))", border: "1px solid rgba(124,58,237,0.15)" }}
      >
        <p className="text-muted-foreground text-xs mb-1">{packageName}</p>
        <p className="text-3xl font-black" style={{ background: "linear-gradient(135deg, #d946a8, #7c3aed)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          ฿{amount.toLocaleString()}
        </p>
        <p className="text-muted-foreground text-xs mt-1">ชำระผ่าน PromptPay</p>
      </div>

      {/* QR Code */}
      <div className="relative">
        <div className="p-4 bg-white rounded-2xl shadow-xl border border-border">
          {/* Corner decorations */}
          {[["top-2 left-2", "border-t-2 border-l-2"], ["top-2 right-2", "border-t-2 border-r-2"],
            ["bottom-2 left-2", "border-b-2 border-l-2"], ["bottom-2 right-2", "border-b-2 border-r-2"]].map(([pos, border], i) => (
            <div key={i} className={`absolute ${pos} w-5 h-5 border-primary rounded-sm`} style={{ borderColor: "#7c3aed" }} />
          ))}
          <svg viewBox="0 0 100 100" fill="#1a1028" className="w-44 h-44">
            <rect x="5" y="5" width="35" height="35" rx="4" fill="none" stroke="#1a1028" strokeWidth="4" />
            <rect x="14" y="14" width="17" height="17" rx="2" />
            <rect x="60" y="5" width="35" height="35" rx="4" fill="none" stroke="#1a1028" strokeWidth="4" />
            <rect x="69" y="14" width="17" height="17" rx="2" />
            <rect x="5" y="60" width="35" height="35" rx="4" fill="none" stroke="#1a1028" strokeWidth="4" />
            <rect x="14" y="69" width="17" height="17" rx="2" />
            <rect x="60" y="60" width="6" height="6" /><rect x="72" y="60" width="6" height="6" />
            <rect x="84" y="60" width="11" height="6" /><rect x="60" y="72" width="6" height="6" />
            <rect x="72" y="72" width="6" height="6" /><rect x="84" y="72" width="11" height="6" />
            <rect x="60" y="84" width="6" height="11" /><rect x="72" y="84" width="6" height="6" />
            <rect x="84" y="84" width="11" height="6" />
          </svg>
        </div>
        {/* PromptPay badge */}
        <div
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold px-4 py-1 rounded-full whitespace-nowrap shadow-lg"
          style={{ background: "linear-gradient(90deg, #1a237e, #283593)" }}
        >
          PromptPay QR
        </div>
      </div>

      {/* Timer */}
      <div className={`flex items-center gap-2 text-sm font-semibold mt-2 px-4 py-2 rounded-full ${countdown < 60 ? "bg-red-50 text-red-500 border border-red-200" : "bg-secondary text-muted-foreground"}`}>
        <Clock size={13} />
        หมดเวลาใน <span className="font-mono font-black">{mm}:{ss}</span>
      </div>

      {/* How to pay steps */}
      <div className="w-full bg-secondary/60 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-bold text-foreground mb-2">📱 วิธีสแกน QR</p>
        {["เปิดแอปธนาคารหรือ Mobile Banking", "เลือก 'สแกน QR' หรือ 'PromptPay'", "สแกน QR แล้วยืนยันยอด"].map((step, i) => (
          <div key={i} className="flex items-center gap-2.5 text-xs text-muted-foreground">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center text-white font-bold shrink-0 text-[10px]"
              style={{ background: "linear-gradient(135deg, #d946a8, #7c3aed)" }}
            >
              {i + 1}
            </div>
            {step}
          </div>
        ))}
      </div>

      <button
        onClick={onConfirm}
        className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 shadow-lg"
        style={{ background: "linear-gradient(135deg, #d946a8, #7c3aed)", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}
      >
        ✓ ยืนยันการชำระเงิน
      </button>
      <p className="text-muted-foreground text-[11px] text-center">
        ระบบตรวจสอบอัตโนมัติภายใน 1–3 นาที<br />
        หากชำระแล้วไม่ต้องกดปุ่มนี้
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
      {/* Icon */}
      <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-500 ${
        isSuccess ? "bg-emerald-50" : isFailed ? "bg-red-50" : ""
      }`}
        style={!isDone ? { background: "linear-gradient(135deg, rgba(217,70,168,0.1), rgba(124,58,237,0.1))" } : {}}
      >
        {isSuccess
          ? <CheckCircle2 size={40} className="text-emerald-500" />
          : isFailed
          ? <XCircle size={40} className="text-red-500" />
          : <Loader2 size={36} className="animate-spin" style={{ color: "#7c3aed" }} />
        }
      </div>

      <div className="text-center">
        <h2 className="text-xl font-black text-[#1a1028] mb-1">
          {isSuccess ? "เติมเกมสำเร็จ! 🎉" : isFailed ? "เกิดข้อผิดพลาด" : "กำลังดำเนินการ..."}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isSuccess ? "ระบบโอนเข้าบัญชีในเกมของคุณแล้ว" :
           isFailed  ? order.error_message ?? "ไม่สามารถเติมเกมได้ กรุณาติดต่อทีมงาน" :
           "กำลังส่งข้อมูลไปยังเซิร์ฟเวอร์เกม"}
        </p>
      </div>

      {/* Order details */}
      <div className="w-full rounded-2xl overflow-hidden border border-border">
        <div className="px-4 py-2 text-[11px] font-bold text-white" style={{ background: "linear-gradient(135deg, #d946a8, #7c3aed)" }}>
          รายละเอียดคำสั่งซื้อ
        </div>
        <div className="divide-y divide-border">
          {[
            { label: "หมายเลขออเดอร์", value: order.id.slice(0, 8).toUpperCase(), mono: true },
            ...(order.api_ref_id ? [{ label: "Ref. ร้านเติมเกม", value: order.api_ref_id, mono: true }] : []),
            { label: "ยอดชำระ", value: `฿${order.amount.toLocaleString()}`, mono: false },
            { label: "สถานะ", value: order.status === "success" ? "✅ สำเร็จ" : order.status === "failed" ? "❌ ล้มเหลว" : "⏳ กำลังดำเนินการ", mono: false },
          ].map((row, i) => (
            <div key={i} className="flex justify-between items-center px-4 py-2.5 text-sm bg-white">
              <span className="text-muted-foreground">{row.label}</span>
              <span className={`font-bold text-[#1a1028] ${row.mono ? "font-mono text-xs" : ""}`}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Loading dots */}
      {!isDone && (
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#7c3aed", animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      )}

      {/* Actions */}
      {isDone && (
        <div className="flex gap-3 w-full">
          <a href="/" className="flex-1">
            <Button variant="outline" className="w-full">กลับหน้าหลัก</Button>
          </a>
          {isSuccess ? (
            <a href="/orders" className="flex-1">
              <button className="w-full py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #d946a8, #7c3aed)" }}>
                ดูประวัติ
              </button>
            </a>
          ) : (
            <button onClick={() => window.location.reload()} className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm" style={{ background: "linear-gradient(135deg, #ef4444, #dc2626)" }}>
              ลองใหม่
            </button>
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
  const [step,        setStep]        = useState<Step>("info");
  const [playerId,    setPlayerId]    = useState("");
  const [serverId,    setServerId]    = useState("");
  const [selectedPkg, setSelectedPkg] = useState<TopupPackage | null>(null);
  const [order,       setOrder]       = useState<TopupOrder | null>(null);
  const [submitting,  setSubmitting]  = useState(false);

  useEffect(() => {
    (async () => {
      const prod = await getTopupProduct(slug);
      if (!prod) { setError("ไม่พบเกมนี้"); setLoading(false); return; }
      const pkgs = await getTopupPackages(prod.id);
      setProduct(prod); setPackages(pkgs); setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!order) return;
    const unsub = subscribeToOrder(order.id, (updated) => setOrder(updated));
    return unsub;
  }, [order?.id]);

  const handleInfoNext = useCallback(() => {
    if (!playerId.trim()) { setError("กรุณากรอก Player ID"); return; }
    setError(""); setStep("package");
  }, [playerId]);

  const handlePackageNext = useCallback(() => {
    if (!selectedPkg) { setError("กรุณาเลือกแพ็กเกจ"); return; }
    setError(""); setStep("payment");
  }, [selectedPkg]);

  const handlePaymentConfirm = useCallback(async () => {
    if (!selectedPkg) return;
    setSubmitting(true); setError("");
    try {
      const result = await createTopupOrder({
        package_id:    selectedPkg.id,
        player_id:     playerId,
        player_server: serverId || undefined,
        payment_ref:   `QR-${Date.now()}`,
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

  if (loading) return (
    <>
      <Header />
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin" style={{ color: "#7c3aed" }} />
          <p className="text-muted-foreground text-sm font-medium">กำลังโหลด...</p>
        </div>
      </div>
      <Footer />
    </>
  );

  if (!product) return (
    <>
      <Header />
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-6xl mb-4">🎮</p>
          <h1 className="text-foreground text-xl font-bold mb-2">ไม่พบเกมนี้</h1>
          <a href="/" className="text-primary hover:underline text-sm">← กลับหน้าหลัก</a>
        </div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-lg px-4 py-6">

          {/* ── Page Header ── */}
          <div className="flex items-center gap-3 mb-5">
            <a href="/">
              <button className="w-8 h-8 rounded-xl border border-border bg-white flex items-center justify-center hover:border-primary/40 hover:shadow-sm transition-all">
                <ChevronLeft size={16} className="text-muted-foreground" />
              </button>
            </a>

            {/* Game info banner */}
            <div
              className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl"
              style={{ background: "linear-gradient(135deg, rgba(217,70,168,0.08), rgba(124,58,237,0.08))", border: "1px solid rgba(124,58,237,0.15)" }}
            >
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="w-9 h-9 rounded-xl object-cover shadow-sm border border-border shrink-0" />
              ) : (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0" style={{ background: "linear-gradient(135deg, #d946a8, #7c3aed)" }}>🎮</div>
              )}
              <div className="min-w-0">
                <div className="text-sm font-bold text-[#1a1028] leading-tight truncate">{product.name}</div>
                <div className="text-[10px] text-muted-foreground">{product.publisher}</div>
              </div>
              <div className="ml-auto flex gap-1.5 shrink-0">
                {TRUST.map((t, i) => (
                  <div key={i} className="hidden sm:flex items-center gap-1 text-[9px] font-semibold px-2 py-1 rounded-full" style={{ background: "rgba(124,58,237,0.1)", color: "#7c3aed" }}>
                    {t.icon} {t.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Step Bar ── */}
          <StepBar current={step} />

          {/* ── Main Card ── */}
          <div className="bg-white border border-border rounded-3xl shadow-sm overflow-hidden">

            {/* Card top gradient strip */}
            <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #d946a8, #7c3aed, #6366f1)" }} />

            <div className="p-6">
              {/* Error */}
              {error && (
                <div className="mb-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium">
                  <XCircle size={15} className="shrink-0" /> {error}
                </div>
              )}

              {/* ── STEP 1: Info ── */}
              {step === "info" && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-[#1a1028] font-extrabold text-xl mb-1">กรอกข้อมูลผู้เล่น</h2>
                    <p className="text-muted-foreground text-sm">ตรวจสอบ ID ให้ถูกต้องก่อนกดถัดไป</p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Player ID / UID <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={playerId}
                        onChange={(e) => setPlayerId(e.target.value)}
                        placeholder="เช่น 123456789"
                        className="w-full bg-secondary/40 border-2 border-border rounded-xl px-4 py-3 text-[#1a1028] font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:bg-white transition-all text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                        Server ID <span className="text-muted-foreground/50 normal-case font-normal">(ถ้ามี)</span>
                      </label>
                      <input
                        type="text"
                        value={serverId}
                        onChange={(e) => setServerId(e.target.value)}
                        placeholder="เช่น 1234"
                        className="w-full bg-secondary/40 border-2 border-border rounded-xl px-4 py-3 text-[#1a1028] font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:bg-white transition-all text-sm"
                      />
                    </div>
                  </div>

                  {/* How to find ID */}
                  <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, rgba(217,70,168,0.05), rgba(124,58,237,0.05))", border: "1px solid rgba(124,58,237,0.12)" }}>
                    <p className="text-xs font-bold mb-2" style={{ color: "#7c3aed" }}>📌 วิธีหา Player ID</p>
                    <div className="space-y-1">
                      {["เปิดเกมที่ต้องการเติม", "ไปที่หน้าโปรไฟล์หรือตัวละคร", "คัดลอก ID ตัวเลขใต้ชื่อตัวละคร"].map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                          <span className="font-bold" style={{ color: "#d946a8" }}>{i + 1}.</span> {s}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trust row */}
                  <div className="flex items-center justify-center gap-4 py-1">
                    {TRUST.map((t, i) => (
                      <div key={i} className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground">
                        <span style={{ color: "#7c3aed" }}>{t.icon}</span> {t.label}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={handleInfoNext}
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 shadow-lg"
                    style={{ background: "linear-gradient(135deg, #d946a8, #7c3aed)", boxShadow: "0 4px 20px rgba(124,58,237,0.3)" }}
                  >
                    ถัดไป →
                  </button>
                </div>
              )}

              {/* ── STEP 2: Package ── */}
              {step === "package" && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-[#1a1028] font-extrabold text-xl mb-1">เลือกแพ็กเกจ</h2>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Player ID:</span>
                      <span className="font-mono font-bold px-2 py-0.5 rounded-md bg-secondary text-[#1a1028]">{playerId}</span>
                      {serverId && <><span>Server:</span><span className="font-mono font-bold px-2 py-0.5 rounded-md bg-secondary text-[#1a1028]">{serverId}</span></>}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2.5 max-h-[400px] overflow-y-auto pr-0.5">
                    {packages.map((pkg) => (
                      <PackageCard key={pkg.id} pkg={pkg} selected={selectedPkg?.id === pkg.id} onClick={() => setSelectedPkg(pkg)} />
                    ))}
                  </div>

                  {/* Selected summary */}
                  {selectedPkg && (
                    <div
                      className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm"
                      style={{ background: "linear-gradient(135deg, rgba(217,70,168,0.07), rgba(124,58,237,0.07))", border: "1px solid rgba(124,58,237,0.15)" }}
                    >
                      <span className="text-muted-foreground">เลือกแล้ว:</span>
                      <span className="font-bold text-[#1a1028]">{selectedPkg.diamond_amount?.toLocaleString()} {selectedPkg.currency_label}</span>
                      <span className="font-black" style={{ color: "#7c3aed" }}>฿{selectedPkg.price.toLocaleString()}</span>
                    </div>
                  )}

                  <div className="flex gap-2.5">
                    <button onClick={() => setStep("info")} className="flex-1 py-3 rounded-xl border-2 border-border text-muted-foreground font-semibold text-sm hover:border-primary/40 transition-colors bg-white">
                      ← ย้อนกลับ
                    </button>
                    <button
                      onClick={handlePackageNext}
                      disabled={!selectedPkg}
                      className="flex-[2] py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{ background: "linear-gradient(135deg, #d946a8, #7c3aed)", boxShadow: selectedPkg ? "0 4px 16px rgba(124,58,237,0.25)" : "none" }}
                    >
                      {selectedPkg ? `ชำระ ฿${selectedPkg.price.toLocaleString()} →` : "เลือกแพ็กเกจ"}
                    </button>
                  </div>
                </div>
              )}

              {/* ── STEP 3: Payment ── */}
              {step === "payment" && selectedPkg && (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-[#1a1028] font-extrabold text-xl mb-1">ชำระเงิน</h2>
                    <p className="text-muted-foreground text-sm">{selectedPkg.name} · {selectedPkg.diamond_amount?.toLocaleString()} {selectedPkg.currency_label}</p>
                  </div>
                  {submitting ? (
                    <div className="flex flex-col items-center gap-4 py-12">
                      <Loader2 size={36} className="animate-spin" style={{ color: "#7c3aed" }} />
                      <p className="text-muted-foreground text-sm font-medium">กำลังสร้างคำสั่งซื้อ...</p>
                    </div>
                  ) : (
                    <QRPayment amount={selectedPkg.price} packageName={selectedPkg.name} onConfirm={handlePaymentConfirm} />
                  )}
                  {!submitting && (
                    <button onClick={() => setStep("package")} className="w-full py-2.5 rounded-xl border border-border text-muted-foreground text-sm font-medium hover:bg-secondary/50 transition-colors">
                      ← เปลี่ยนแพ็กเกจ
                    </button>
                  )}
                </div>
              )}

              {/* ── STEP 4: Status ── */}
              {step === "status" && order && <StatusTracker order={order} />}
            </div>
          </div>

          {/* Footer trust */}
          <div className="flex items-center justify-center gap-4 mt-5">
            {[
              { icon: "🔒", label: "SSL Secured" },
              { icon: "⚡", label: "ส่งทันที" },
              { icon: "🎮", label: "ครบทุกเกม" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
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
