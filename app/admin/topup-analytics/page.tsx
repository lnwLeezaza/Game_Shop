"use client";

// app/admin/topup-analytics/page.tsx
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/topup-client";
import {
  TrendingUp, ShoppingCart, CheckCircle2, XCircle, Clock,
  RefreshCw, ChevronDown, ChevronUp, Search, Radio
} from "lucide-react";

// ══════════════════════════════════════════════
//  TYPES
// ══════════════════════════════════════════════
interface Order {
  id: string;
  user_id: string;
  product_id: string;
  package_id: string;
  player_id: string;
  player_server: string | null;
  status: "pending" | "success" | "failed" | "processing";
  amount: number;
  api_ref_id: string | null;
  error_message: string | null;
  payment_method: string | null;
  payment_ref: string | null;
  paid_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  // joined
  topup_products?: { name: string; image_url: string | null };
  topup_packages?: { name: string; diamond_amount: number; currency_label: string };
}

interface GameStat {
  product_id: string;
  name: string;
  image_url: string | null;
  total_orders: number;
  success_orders: number;
  total_revenue: number;
}

interface PackageStat {
  package_id: string;
  name: string;
  currency_label: string;
  diamond_amount: number;
  total_orders: number;
  total_revenue: number;
}

const STATUS_CONFIG = {
  success:    { label: "สำเร็จ",        color: "#06b6d4", bg: "rgba(6,182,212,0.10)",  border: "#a5f3fc", icon: <CheckCircle2 size={12}/> },
  failed:     { label: "ล้มเหลว",       color: "#ef4444", bg: "rgba(239,68,68,0.10)",  border: "#fecaca", icon: <XCircle size={12}/> },
  pending:    { label: "รอดำเนินการ",   color: "#f59e0b", bg: "rgba(245,158,11,0.10)", border: "#fde68a", icon: <Clock size={12}/> },
  processing: { label: "กำลังดำเนินการ",color: "#2563eb", bg: "rgba(37,99,235,0.10)",  border: "#bfdbfe", icon: <RefreshCw size={12}/> },
};

// ══════════════════════════════════════════════
//  HELPERS
// ══════════════════════════════════════════════
function GridBg() {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.04 }}>
      <defs><pattern id="ag" width="36" height="36" patternUnits="userSpaceOnUse">
        <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#2563eb" strokeWidth="0.8"/>
      </pattern></defs>
      <rect width="100%" height="100%" fill="url(#ag)"/>
    </svg>
  );
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub?: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-border relative overflow-hidden"
      style={{ boxShadow: `0 2px 12px ${color}18` }}>
      <div className="absolute top-0 left-0 right-0 h-[3px]" style={{ background: `linear-gradient(90deg,${color},${color}88)` }}/>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-1" style={{ color: "#1d4ed8" }}>{label}</p>
          <p className="text-2xl font-black" style={{ color: "#0a1628" }}>{value}</p>
          {sub && <p className="text-[11px] mt-0.5" style={{ color: "#60a5fa" }}>{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
          <span style={{ color }}>{icon}</span>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════
//  MAIN PAGE
// ══════════════════════════════════════════════
export default function TopupAnalyticsPage() {
  const [orders,       setOrders]       = useState<Order[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search,       setSearch]       = useState("");
  const [sortBy,       setSortBy]       = useState<"created_at" | "amount">("created_at");
  const [sortDir,      setSortDir]      = useState<"desc" | "asc">("desc");
  const [gameStats,    setGameStats]    = useState<GameStat[]>([]);
  const [pkgStats,     setPkgStats]     = useState<PackageStat[]>([]);
  const [lastRefresh,  setLastRefresh]  = useState(new Date());
  const [isLive,       setIsLive]       = useState(false); // ── สถานะ Realtime connection

  // ══════════════════════════════════════════════
  //  FETCH DATA (useCallback เพื่อใช้เป็น dep)
  // ══════════════════════════════════════════════
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // ── orders with joins ──
      const { data: raw } = await supabase
        .from("topup_orders")
        .select(`
          *,
          topup_products ( name, image_url ),
          topup_packages ( name, diamond_amount, currency_label )
        `)
        .order(sortBy, { ascending: sortDir === "asc" })
        .limit(200);

      const rows = (raw ?? []) as Order[];
      setOrders(rows);

      // ── game stats (aggregate client-side) ──
      const gameMap = new Map<string, GameStat>();
      rows.forEach(o => {
        if (!o.product_id) return;
        const key = o.product_id;
        const prev = gameMap.get(key) ?? {
          product_id: o.product_id,
          name: o.topup_products?.name ?? o.product_id.slice(0,8),
          image_url: o.topup_products?.image_url ?? null,
          total_orders: 0, success_orders: 0, total_revenue: 0,
        };
        gameMap.set(key, {
          ...prev,
          total_orders: prev.total_orders + 1,
          success_orders: prev.success_orders + (o.status === "success" ? 1 : 0),
          total_revenue: prev.total_revenue + (o.status === "success" ? Number(o.amount) : 0),
        });
      });
      setGameStats([...gameMap.values()].sort((a,b) => b.total_orders - a.total_orders));

      // ── package stats ──
      const pkgMap = new Map<string, PackageStat>();
      rows.forEach(o => {
        if (!o.package_id) return;
        const prev = pkgMap.get(o.package_id) ?? {
          package_id: o.package_id,
          name: o.topup_packages?.name ?? "-",
          currency_label: o.topup_packages?.currency_label ?? "",
          diamond_amount: o.topup_packages?.diamond_amount ?? 0,
          total_orders: 0, total_revenue: 0,
        };
        pkgMap.set(o.package_id, {
          ...prev,
          total_orders: prev.total_orders + 1,
          total_revenue: prev.total_revenue + (o.status === "success" ? Number(o.amount) : 0),
        });
      });
      setPkgStats([...pkgMap.values()].sort((a,b) => b.total_orders - a.total_orders).slice(0,10));

      setLastRefresh(new Date());
    } finally {
      setLoading(false);
    }
  }, [sortBy, sortDir]); // re-create เมื่อ sort เปลี่ยน

  // ══════════════════════════════════════════════
  //  INITIAL FETCH — ทำงานเมื่อ fetchData เปลี่ยน
  // ══════════════════════════════════════════════
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ══════════════════════════════════════════════
  //  REALTIME SUBSCRIPTION
  // ══════════════════════════════════════════════
  useEffect(() => {
    const channel = supabase
      .channel("topup_orders_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",          // รับทั้ง INSERT, UPDATE, DELETE
          schema: "public",
          table: "topup_orders",
        },
        () => {
          // มี order ใหม่หรืออัปเดต → fetch ใหม่ทั้งหมด
          fetchData();
        }
      )
      .subscribe((status) => {
        // อัปเดต live indicator ตาม connection state
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel); // cleanup เมื่อ unmount
    };
  }, [fetchData]); // re-subscribe เมื่อ sort เปลี่ยน

  // ── derived stats ──
  const total        = orders.length;
  const success      = orders.filter(o => o.status === "success").length;
  const failed       = orders.filter(o => o.status === "failed").length;
  const pending      = orders.filter(o => o.status === "pending" || o.status === "processing").length;
  const totalRevenue = orders.filter(o => o.status === "success").reduce((s, o) => s + Number(o.amount), 0);

  // ── filtered orders ──
  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch = !q
      || o.player_id?.toLowerCase().includes(q)
      || o.id.toLowerCase().includes(q)
      || o.topup_products?.name?.toLowerCase().includes(q)
      || o.api_ref_id?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const toggleSort = (col: "created_at" | "amount") => {
    if (sortBy === col) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortBy(col); setSortDir("desc"); }
  };

  const SortIcon = ({ col }: { col: "created_at" | "amount" }) =>
    sortBy === col
      ? sortDir === "desc" ? <ChevronDown size={12}/> : <ChevronUp size={12}/>
      : <ChevronDown size={12} style={{ opacity: 0.3 }}/>;

  return (
    <div className="min-h-screen bg-background">

      {/* ── Header ── */}
      <div className="relative overflow-hidden" style={{ background: "linear-gradient(130deg,#1e40af 0%,#2563eb 50%,#0891b2 100%)" }}>
        <GridBg/>
        <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background:"rgba(6,182,212,0.25)",filter:"blur(48px)" }}/>
        <div className="relative z-10 px-6 py-5 flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {/* ── Live indicator ── */}
              {isLive ? (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 animate-pulse" style={{ boxShadow:"0 0 6px #67e8f9" }}/>
                  <Radio size={10} style={{ color:"#67e8f9" }}/>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color:"#bfdbfe" }}>
                    LIVE
                  </span>
                </>
              ) : (
                <>
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-300"/>
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color:"#fde68a" }}>
                    Connecting...
                  </span>
                </>
              )}
            </div>
            <h1 className="text-xl font-extrabold text-white">Topup Analytics</h1>
            <p className="text-[11px] mt-0.5" style={{ color:"rgba(255,255,255,0.6)" }}>
              อัปเดตล่าสุด {lastRefresh.toLocaleTimeString("th-TH")}
            </p>
          </div>
          <button onClick={fetchData} disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95 disabled:opacity-60"
            style={{ background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.25)" }}>
            <RefreshCw size={13} className={loading ? "animate-spin" : ""}/>
            รีเฟรช
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <StatCard icon={<ShoppingCart size={18}/>}  label="ออร์เดอร์ทั้งหมด" value={total.toLocaleString()}               color="#2563eb"/>
          <StatCard icon={<CheckCircle2 size={18}/>}  label="สำเร็จ"           value={success.toLocaleString()}             sub={`${total ? Math.round(success/total*100) : 0}%`} color="#06b6d4"/>
          <StatCard icon={<XCircle size={18}/>}       label="ล้มเหลว"          value={failed.toLocaleString()}              sub={`${total ? Math.round(failed/total*100) : 0}%`}  color="#ef4444"/>
          <StatCard icon={<Clock size={18}/>}         label="รอดำเนินการ"      value={pending.toLocaleString()}             color="#f59e0b"/>
          <StatCard icon={<TrendingUp size={18}/>}    label="รายได้รวม"        value={`฿${totalRevenue.toLocaleString()}`}  color="#8b5cf6"/>
        </div>

        {/* ── Game Stats + Package Stats ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Game stats */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden" style={{ boxShadow:"0 2px 12px rgba(37,99,235,0.06)" }}>
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background:"linear-gradient(180deg,#2563eb,#06b6d4)" }}/>
              <h2 className="text-sm font-bold" style={{ color:"#0a1628" }}>ยอดสั่งซื้อรายเกม</h2>
            </div>
            <div className="divide-y divide-border">
              {gameStats.length === 0 && (
                <div className="py-8 text-center text-sm" style={{ color:"#60a5fa" }}>ไม่มีข้อมูล</div>
              )}
              {gameStats.map((g, i) => (
                <div key={g.product_id} className="flex items-center gap-3 px-5 py-3 hover:bg-blue-50/40 transition-colors">
                  <span className="text-[11px] font-black w-5 text-center" style={{ color:"#93c5fd" }}>#{i+1}</span>
                  {g.image_url ? (
                    <img src={g.image_url} alt={g.name} className="w-7 h-7 rounded-lg object-cover shrink-0"/>
                  ) : (
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-black text-white" style={{ background:"linear-gradient(135deg,#2563eb,#06b6d4)" }}>
                      {g.name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold truncate" style={{ color:"#0a1628" }}>{g.name}</div>
                    <div className="text-[10px]" style={{ color:"#1d4ed8" }}>{g.success_orders}/{g.total_orders} สำเร็จ</div>
                  </div>
                  {/* Bar */}
                  <div className="w-20 hidden sm:block">
                    <div className="h-1.5 rounded-full bg-blue-50 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width:`${gameStats[0]?.total_orders ? (g.total_orders/gameStats[0].total_orders)*100 : 0}%`, background:"linear-gradient(90deg,#2563eb,#06b6d4)" }}/>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[12px] font-black" style={{ color:"#2563eb" }}>{g.total_orders}</div>
                    <div className="text-[10px]" style={{ color:"#60a5fa" }}>฿{g.total_revenue.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Package stats */}
          <div className="bg-white rounded-2xl border border-border overflow-hidden" style={{ boxShadow:"0 2px 12px rgba(37,99,235,0.06)" }}>
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-2">
              <div className="w-1 h-4 rounded-full" style={{ background:"linear-gradient(180deg,#06b6d4,#0891b2)" }}/>
              <h2 className="text-sm font-bold" style={{ color:"#0a1628" }}>แพ็กเกจขายดี Top 10</h2>
            </div>
            <div className="divide-y divide-border">
              {pkgStats.length === 0 && (
                <div className="py-8 text-center text-sm" style={{ color:"#60a5fa" }}>ไม่มีข้อมูล</div>
              )}
              {pkgStats.map((p, i) => (
                <div key={p.package_id} className="flex items-center gap-3 px-5 py-3 hover:bg-cyan-50/40 transition-colors">
                  <span className="text-[11px] font-black w-5 text-center" style={{ color:"#93c5fd" }}>#{i+1}</span>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background:"linear-gradient(135deg,#cffafe,#dbeafe)" }}>
                    <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                      <rect x="2" y="6" width="20" height="12" rx="2" stroke="#06b6d4" strokeWidth="1.5"/>
                      <circle cx="12" cy="12" r="2" fill="#06b6d4"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-bold truncate" style={{ color:"#0a1628" }}>{p.name || `${p.diamond_amount} ${p.currency_label}`}</div>
                    <div className="text-[10px]" style={{ color:"#1d4ed8" }}>฿{p.total_revenue.toLocaleString()} รายได้</div>
                  </div>
                  <div className="w-20 hidden sm:block">
                    <div className="h-1.5 rounded-full bg-cyan-50 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width:`${pkgStats[0]?.total_orders ? (p.total_orders/pkgStats[0].total_orders)*100 : 0}%`, background:"linear-gradient(90deg,#06b6d4,#0891b2)" }}/>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[12px] font-black" style={{ color:"#06b6d4" }}>{p.total_orders}</div>
                    <div className="text-[10px]" style={{ color:"#60a5fa" }}>ออร์เดอร์</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Orders Table ── */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden" style={{ boxShadow:"0 2px 12px rgba(37,99,235,0.06)" }}>
          {/* Table header */}
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 rounded-full" style={{ background:"linear-gradient(180deg,#2563eb,#8b5cf6)" }}/>
                <h2 className="text-sm font-bold" style={{ color:"#0a1628" }}>รายการออร์เดอร์ทั้งหมด</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background:"#eff6ff", color:"#2563eb", border:"1px solid #bfdbfe" }}>
                  {filtered.length} รายการ
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search */}
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color:"#60a5fa" }}/>
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="ค้นหา Player ID, เกม..."
                    className="pl-8 pr-3 py-2 text-[12px] rounded-xl w-52 focus:outline-none transition-all"
                    style={{ background:"#f0f6ff", border:"1.5px solid #bfdbfe", color:"#0a1628" }}
                    onFocus={e => { e.target.style.borderColor="#2563eb"; e.target.style.boxShadow="0 0 0 3px rgba(37,99,235,0.10)"; }}
                    onBlur={e  => { e.target.style.borderColor="#bfdbfe"; e.target.style.boxShadow="none"; }}
                  />
                </div>
                {/* Status filter */}
                <div className="flex gap-1">
                  {["all","success","pending","failed"].map(s => {
                    const cfg = s === "all" ? null : STATUS_CONFIG[s as keyof typeof STATUS_CONFIG];
                    return (
                      <button key={s} onClick={() => setStatusFilter(s)}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all"
                        style={statusFilter === s
                          ? { background: s === "all" ? "linear-gradient(135deg,#2563eb,#06b6d4)" : cfg!.bg, color: s === "all" ? "#fff" : cfg!.color, border: `1px solid ${s === "all" ? "#2563eb" : cfg!.border}` }
                          : { background:"#f8fafc", color:"#1d4ed8", border:"1px solid #e0f0ff" }}>
                        {s === "all" ? "ทั้งหมด" : cfg!.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background:"#f0f6ff", borderBottom:"1px solid #bfdbfe" }}>
                  {[
                    { label:"Order ID",    w:"w-28" },
                    { label:"เกม",         w:"w-36" },
                    { label:"แพ็กเกจ",     w:"w-32" },
                    { label:"Player ID",   w:"w-28" },
                    { label:"สถานะ",       w:"w-28" },
                    { label:"ยอด",         w:"w-24", sort:"amount" as const },
                    { label:"วันที่",       w:"w-36", sort:"created_at" as const },
                  ].map(col => (
                    <th key={col.label} className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider ${col.w} ${col.sort ? "cursor-pointer hover:bg-blue-50/60 select-none" : ""}`}
                      style={{ color:"#1d4ed8" }}
                      onClick={() => col.sort && toggleSort(col.sort)}>
                      <div className="flex items-center gap-1">
                        {col.label}
                        {col.sort && <SortIcon col={col.sort}/>}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="py-12 text-center text-sm" style={{ color:"#60a5fa" }}>
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw size={14} className="animate-spin"/> กำลังโหลด...
                    </div>
                  </td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={7} className="py-12 text-center text-sm" style={{ color:"#60a5fa" }}>ไม่มีรายการ</td></tr>
                )}
                {!loading && filtered.map((o, i) => {
                  const cfg = STATUS_CONFIG[o.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending;
                  return (
                    <tr key={o.id} className="border-b border-border hover:bg-blue-50/30 transition-colors"
                      style={{ background: i % 2 === 0 ? "#fff" : "#fafcff" }}>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px] font-bold" style={{ color:"#1d4ed8" }}>
                          {o.id.slice(0,8).toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          { o.topup_products?.image_url ? (
                            <img src={ o.topup_products.image_url} className="w-5 h-5 rounded object-cover shrink-0"/>
                          ) : (
                            <div className="w-5 h-5 rounded flex items-center justify-center shrink-0 text-[8px] font-black text-white" style={{ background:"linear-gradient(135deg,#2563eb,#06b6d4)" }}>
                              { o.topup_products?.name?.charAt(0) ?? "?"}
                            </div>
                          )}
                          <span className="text-[12px] font-semibold truncate max-w-[100px]" style={{ color:"#0a1628" }}>
                            { o.topup_products?.name ?? "-"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] font-medium" style={{ color:"#1d4ed8" }}>
                          {o.topup_packages?.name ?? `${o.topup_packages?.diamond_amount ?? "-"} ${o.topup_packages?.currency_label ?? ""}`}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-mono text-[11px]" style={{ color:"#0a1628" }}>{o.player_id ?? "-"}</span>
                        {o.player_server && <span className="text-[10px] ml-1" style={{ color:"#60a5fa" }}>({o.player_server})</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
                          style={{ background: cfg.bg, color: cfg.color, border:`1px solid ${cfg.border}` }}>
                          {cfg.icon} {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-black text-[13px]" style={{ color: o.status === "success" ? "#06b6d4" : "#0a1628" }}>
                          ฿{Number(o.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px]" style={{ color:"#1d4ed8" }}>
                          {new Date(o.created_at).toLocaleString("th-TH", { dateStyle:"short", timeStyle:"short" })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table footer */}
          {!loading && filtered.length > 0 && (
            <div className="px-5 py-3 border-t border-border flex items-center justify-between" style={{ background:"#f8faff" }}>
              <span className="text-[11px]" style={{ color:"#60a5fa" }}>แสดง {filtered.length} จาก {orders.length} รายการ (สูงสุด 200)</span>
              <span className="text-[11px] font-bold" style={{ color:"#2563eb" }}>
                รายได้ที่กรอง: ฿{filtered.filter(o=>o.status==="success").reduce((s,o)=>s+Number(o.amount),0).toLocaleString()}
              </span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
