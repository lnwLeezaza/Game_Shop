'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Shield, Zap, Star, Package, Users, ShoppingCart, ChevronRight, TrendingDown } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useLocale } from '@/hooks/use-locale'
import { useProductStore } from '@/lib/store'
import { Badge } from '@/components/ui/badge'

// ── ประเภทไอดี ──────────────────────────────────────────────
const ID_CATEGORIES = [
  {
    id: 'double',
    icon: '🐔🐔',
    label: 'ไอดีไก่คู่',
    labelEn: 'Double Epic',
    desc: 'มีนักเตะ Epic 2 คน ขึ้นไป ทีมแน่น',
    color: '#f97316',
    colorB: '#c2410c',
    bg: '#fff7ed',
    border: '#fed7aa',
    tag: 'ยอดนิยม',
  },
  {
    id: 'single',
    icon: '🐔',
    label: 'ไอดีไก่เดี่ยว',
    labelEn: 'Single Epic',
    desc: 'มีนักเตะ Epic 1 คน เหมาะสำหรับเริ่มต้น',
    color: '#eab308',
    colorB: '#a16207',
    bg: '#fefce8',
    border: '#fde68a',
    tag: '',
  },
  {
    id: 'legend',
    icon: '👑',
    label: 'ไอดี Legend',
    labelEn: 'Legend Account',
    desc: 'มีนักเตะ Legend หายาก ระดับสูงสุด',
    color: '#a855f7',
    colorB: '#7e22ce',
    bg: '#faf5ff',
    border: '#e9d5ff',
    tag: 'หายาก',
  },
  {
    id: 'starter',
    icon: '⚽',
    label: 'ไอดีทั่วไป',
    labelEn: 'Starter Account',
    desc: 'ทีมระดับกลาง เหมาะสำหรับมือใหม่',
    color: '#22c55e',
    colorB: '#15803d',
    bg: '#f0fdf4',
    border: '#bbf7d0',
    tag: '',
  },
]

// ── ตัวอย่างไอดีพร้อมนักเตะ ──────────────────────────────
const SAMPLE_IDS = [
  {
    id: '1',
    category: 'double',
    title: 'ไอดีไก่คู่ — Messi + Ronaldo',
    price: 590,
    original: 890,
    ovr: 91,
    players: [
      { name: 'L. Messi',   ovr: 96, rarity: 'Epic',   pos: 'CF',  nation: '🇦🇷' },
      { name: 'C. Ronaldo', ovr: 95, rarity: 'Epic',   pos: 'CF',  nation: '🇵🇹' },
      { name: 'V. van Dijk',ovr: 89, rarity: 'Rare',   pos: 'CB',  nation: '🇳🇱' },
      { name: 'K. Mbappé',  ovr: 88, rarity: 'Rare',   pos: 'LWF', nation: '🇫🇷' },
    ],
    coins: 850000,
    gp: 120000,
    sold: false,
  },
  {
    id: '2',
    category: 'double',
    title: 'ไอดีไก่คู่ — Neymar + Benzema',
    price: 490,
    original: 750,
    ovr: 90,
    players: [
      { name: 'Neymar Jr', ovr: 94, rarity: 'Epic',  pos: 'LWF', nation: '🇧🇷' },
      { name: 'K. Benzema',ovr: 93, rarity: 'Epic',  pos: 'CF',  nation: '🇫🇷' },
      { name: 'T. Kroos',  ovr: 87, rarity: 'Rare',  pos: 'CMF', nation: '🇩🇪' },
    ],
    coins: 640000,
    gp: 90000,
    sold: false,
  },
  {
    id: '3',
    category: 'single',
    title: 'ไอดีไก่เดี่ยว — Lewandowski',
    price: 290,
    original: 450,
    ovr: 88,
    players: [
      { name: 'R. Lewandowski', ovr: 95, rarity: 'Epic', pos: 'CF',  nation: '🇵🇱' },
      { name: 'Pedri',          ovr: 86, rarity: 'Rare', pos: 'CMF', nation: '🇪🇸' },
      { name: 'R. Bellingham',  ovr: 85, rarity: 'Rare', pos: 'CMF', nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
    ],
    coins: 420000,
    gp: 65000,
    sold: false,
  },
  {
    id: '4',
    category: 'legend',
    title: 'ไอดี Legend — Zidane + Ronaldo R9',
    price: 1490,
    original: 2200,
    ovr: 93,
    players: [
      { name: 'Zinedine Zidane', ovr: 97, rarity: 'Legend', pos: 'CMF', nation: '🇫🇷' },
      { name: 'Ronaldo (R9)',    ovr: 97, rarity: 'Legend', pos: 'CF',  nation: '🇧🇷' },
      { name: 'P. Maldini',     ovr: 91, rarity: 'Epic',   pos: 'CB',  nation: '🇮🇹' },
    ],
    coins: 1200000,
    gp: 250000,
    sold: false,
  },
  {
    id: '5',
    category: 'single',
    title: 'ไอดีไก่เดี่ยว — Salah',
    price: 249,
    original: 380,
    ovr: 86,
    players: [
      { name: 'M. Salah',    ovr: 93, rarity: 'Epic', pos: 'RWF', nation: '🇪🇬' },
      { name: 'A. Arnold',   ovr: 84, rarity: 'Rare', pos: 'RB',  nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { name: 'L. Díaz',     ovr: 83, rarity: 'Rare', pos: 'LWF', nation: '🇨🇴' },
    ],
    coins: 380000,
    gp: 55000,
    sold: true,
  },
  {
    id: '6',
    category: 'starter',
    title: 'ไอดีทั่วไป ทีม 85 OVR',
    price: 149,
    original: 220,
    ovr: 85,
    players: [
      { name: 'H. Kane',    ovr: 87, rarity: 'Rare', pos: 'CF',  nation: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
      { name: 'B. Silva',   ovr: 86, rarity: 'Rare', pos: 'AMF', nation: '🇵🇹' },
      { name: 'V. Osimhen', ovr: 85, rarity: 'Rare', pos: 'CF',  nation: '🇳🇬' },
    ],
    coins: 210000,
    gp: 30000,
    sold: false,
  },
]

const RARITY_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  Legend: { bg: '#fef9c3', color: '#854d0e', border: '#fde68a' },
  Epic:   { bg: '#faf5ff', color: '#7e22ce', border: '#e9d5ff' },
  Rare:   { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
}

const features = [
  { icon: Zap,     title: 'ส่งทันที',       desc: 'ได้รับรหัสทันทีหลังชำระเงิน' },
  { icon: Shield,  title: 'ไอดีแท้ 100%',   desc: 'ตรวจสอบทุกบัญชีก่อนขาย ปลอดภัย' },
  { icon: Users,   title: 'ซัพพอร์ต 24/7', desc: 'ทีมงานพร้อมช่วยเหลือตลอดเวลา' },
  { icon: Package, title: 'ราคาถูกที่สุด', desc: 'ถูกกว่าราคาตลาดทั่วไป 30-40%' },
]

// ── PlayerBadge ──────────────────────────────────────────────
function PlayerBadge({ p }: { p: typeof SAMPLE_IDS[0]['players'][0] }) {
  const s = RARITY_STYLE[p.rarity] ?? RARITY_STYLE['Rare']
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <span className="text-[10px]">{p.nation}</span>
      <div className="min-w-0">
        <div className="text-[10px] font-bold leading-none truncate" style={{ color: '#1a1028', maxWidth: 72 }}>{p.name}</div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[8px] font-bold" style={{ color: s.color }}>{p.rarity}</span>
          <span className="text-[8px]" style={{ color: '#94a3b8' }}>{p.pos}</span>
          <span className="text-[8px] font-black" style={{ color: s.color }}>{p.ovr}</span>
        </div>
      </div>
    </div>
  )
}

// ── IDCard ────────────────────────────────────────────────────
function IDCard({ item, cat }: { item: typeof SAMPLE_IDS[0]; cat: typeof ID_CATEGORIES[0] }) {
  const discount = Math.round((1 - item.price / item.original) * 100)
  return (
    <div
      className="bg-white rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1"
      style={{
        border: `1px solid ${item.sold ? '#e2e8f0' : cat.border}`,
        boxShadow: item.sold ? 'none' : `0 2px 12px ${cat.color}18`,
        opacity: item.sold ? 0.6 : 1,
      }}
    >
      {/* Top accent */}
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${cat.color}, ${cat.colorB})` }} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">{cat.icon}</span>
            <div>
              <div className="text-[11px] font-bold leading-tight" style={{ color: cat.color }}>{cat.label}</div>
              <div className="text-[12px] font-extrabold text-[#1a1028] leading-tight line-clamp-1">{item.title.replace(/^ไอดี[^\s—–-]*\s*[—–-]\s*/, '')}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {item.sold ? (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-400">ขายแล้ว</span>
            ) : (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: '#ef4444' }}>-{discount}%</span>
            )}
            <div className="text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{ background: cat.bg, color: cat.color }}>
              OVR {item.ovr}
            </div>
          </div>
        </div>

        {/* Players */}
        <div className="flex flex-col gap-1.5 mb-3">
          {item.players.map((p, i) => <PlayerBadge key={i} p={p} />)}
        </div>

        {/* Coins / GP */}
        <div className="flex gap-2 mb-3">
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: '#fef9c3', border: '1px solid #fde68a' }}>
            <span className="text-[10px]">🪙</span>
            <span className="text-[9px] font-bold text-[#854d0e]">{(item.coins / 10000).toFixed(0)}W coins</span>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
            <span className="text-[10px]">💚</span>
            <span className="text-[9px] font-bold text-[#15803d]">{(item.gp / 1000).toFixed(0)}K GP</span>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-[18px] font-extrabold leading-none" style={{ color: cat.color }}>฿{item.price.toLocaleString()}</span>
              <span className="text-[10px] line-through text-slate-400">฿{item.original.toLocaleString()}</span>
            </div>
          </div>
          {item.sold ? (
            <button disabled className="px-3 py-1.5 rounded-xl text-[11px] font-bold bg-slate-100 text-slate-400 cursor-not-allowed">
              ขายแล้ว
            </button>
          ) : (
            <Link href={`/products/efootball-${item.id}`}>
              <button
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-[11px] font-bold text-white transition-all hover:scale-105 active:scale-95"
                style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.colorB})`, boxShadow: `0 3px 10px ${cat.color}40` }}
              >
                <ShoppingCart size={11} /> ซื้อเลย
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

// ── SectionHeader (same as homepage) ─────────────────────────
function SectionHeader({ icon, title, href }: { icon: React.ReactNode; title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>
          {icon}
        </span>
        <h2 className="text-[15px] font-bold tracking-tight text-[#1a1028]">{title}</h2>
      </div>
      {href && (
        <Link href={href}>
          <button className="text-[12px] font-semibold text-primary flex items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-primary/8 transition-colors">
            ดูทั้งหมด <ChevronRight size={12} />
          </button>
        </Link>
      )}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function EFootballPage() {
  const { locale } = useLocale()
  const th = locale === 'th'
  const { products, fetchProducts } = useProductStore()
  const [productsLoading, setProductsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')

  useEffect(() => { fetchProducts().finally(() => setProductsLoading(false)) }, [fetchProducts])

  const filtered = activeTab === 'all' ? SAMPLE_IDS : SAMPLE_IDS.filter(p => p.category === activeTab)

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-5 flex flex-col gap-8">

          {/* ── Hero ─────────────────────────────────────────── */}
          <section
            className="relative rounded-2xl overflow-hidden"
            style={{ minHeight: 260, background: 'linear-gradient(130deg, #15803d 0%, #16a34a 45%, #0c4a6e 100%)' }}
          >
            {/* grid texture */}
            <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <defs><pattern id="pgrid2" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.6"/>
              </pattern></defs>
              <rect width="100%" height="100%" fill="url(#pgrid2)"/>
            </svg>
            <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full pointer-events-none" style={{ background: '#4ade80', filter: 'blur(72px)', opacity: 0.18 }} />
            <div className="absolute right-0 top-0 bottom-0 pointer-events-none" style={{ width: '35%', background: 'rgba(255,255,255,0.04)', clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)' }} />

            <div className="relative z-10 flex items-center min-h-[260px] px-8 md:px-14 py-10 gap-8">
              <div className="flex-1 min-w-0">
                <span className="inline-block text-[10px] font-bold tracking-widest uppercase mb-3 px-3 py-1.5 rounded-md"
                  style={{ background: 'rgba(255,255,255,0.14)', color: '#86efac', border: '1px solid rgba(134,239,172,0.35)', letterSpacing: '0.1em' }}>
                  eFootball / PES
                </span>
                <h1 className="font-extrabold leading-tight mb-1 text-white" style={{ fontSize: 'clamp(22px,3.5vw,38px)', textShadow: '0 2px 20px rgba(0,0,0,0.25)' }}>
                  ขายไอดี eFootball
                </h1>
                <h2 className="font-extrabold leading-tight mb-4" style={{ fontSize: 'clamp(18px,3vw,32px)', color: '#86efac', textShadow: '0 0 32px rgba(134,239,172,0.5)' }}>
                  ไก่คู่ ไก่เดี่ยว Legend ราคาถูก
                </h2>
                <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 400, lineHeight: 1.7 }}>
                  ไอดีแท้ ทีมแน่น ส่งทันทีหลังชำระเงิน ราคาถูกกว่าตลาด 30–40%
                </p>
                <div className="flex gap-3 flex-wrap">
                  <a href="#ids">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                      style={{ background: '#fff', color: '#15803d', boxShadow: '0 4px 24px rgba(0,0,0,0.22)' }}>
                      <ShoppingCart size={14} /> เลือกซื้อไอดี
                    </button>
                  </a>
                  <Link href="/products?category=efootball">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                      style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)' }}>
                      ดูสินค้าทั้งหมด <ArrowRight size={13} />
                    </button>
                  </Link>
                </div>
              </div>

              {/* right stats panel */}
              <div className="hidden md:flex flex-col gap-2.5 shrink-0 w-52">
                <div className="rounded-xl px-3 py-3 grid grid-cols-2 gap-y-2.5"
                  style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' }}>
                  {[
                    { num: '200+', label: 'ไอดีที่ขายแล้ว' },
                    { num: '4.9★', label: 'รีวิว' },
                    { num: '<5 นาที', label: 'ส่งทันที' },
                    { num: '100%', label: 'ปลอดภัย' },
                  ].map((item, i) => (
                    <div key={i} className="text-center">
                      <div className="text-[13px] font-extrabold text-white leading-none">{item.num}</div>
                      <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.48)' }}>{item.label}</div>
                    </div>
                  ))}
                </div>
                {/* quick legend */}
                <div className="rounded-xl p-3 flex flex-col gap-1.5"
                  style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' }}>
                  {[
                    { rarity: 'Legend', color: '#854d0e', bg: '#fef9c3' },
                    { rarity: 'Epic (ไก่)',  color: '#7e22ce', bg: '#faf5ff' },
                    { rarity: 'Rare',   color: '#1d4ed8', bg: '#eff6ff' },
                  ].map(r => (
                    <div key={r.rarity} className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.color }} />
                      <span className="text-[10px] font-bold" style={{ color: '#fff' }}>{r.rarity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Trust bar ────────────────────────────────────── */}
          <div className="bg-white border border-border rounded-2xl py-3.5 px-6 flex flex-wrap justify-around gap-3"
            style={{ boxShadow: '0 2px 12px rgba(21,128,61,0.06)' }}>
            {[
              { icon: <Zap size={13} />,     label: 'ส่งทันที 24/7',   bg: '#dcfce7', color: '#15803d' },
              { icon: <Shield size={13} />,  label: 'ไอดีแท้ 100%',    bg: '#f0fdf4', color: '#15803d' },
              { icon: <Star size={13} />,    label: 'รีวิว 4.9/5',     bg: '#fef9c3', color: '#854d0e' },
              { icon: <Users size={13} />,   label: 'ซัพพอร์ต 24 ชม.', bg: '#eff6ff', color: '#1d4ed8' },
              { icon: <Package size={13} />, label: 'ราคาถูกกว่าตลาด', bg: '#faf5ff', color: '#7e22ce' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: '#15803d' }}>
                <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: item.bg, color: item.color }}>
                  {item.icon}
                </span>
                {item.label}
              </div>
            ))}
          </div>

          {/* ── หมวดหมู่ไอดี ──────────────────────────────────── */}
          <section>
            <SectionHeader icon={<span className="text-[11px]">⚽</span>} title="หมวดหมู่ไอดี eFootball" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {ID_CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setActiveTab(cat.id === activeTab ? 'all' : cat.id)}
                  className="relative text-left rounded-2xl overflow-hidden transition-all duration-200 hover:-translate-y-1 cursor-pointer"
                  style={{
                    border: `1.5px solid ${activeTab === cat.id ? cat.color : cat.border}`,
                    background: activeTab === cat.id ? `linear-gradient(135deg, ${cat.color}18, ${cat.bg})` : '#fff',
                    boxShadow: activeTab === cat.id ? `0 4px 20px ${cat.color}30` : '0 1px 3px rgba(0,0,0,0.06)',
                  }}>
                  <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${cat.color}, ${cat.colorB})` }} />
                  <div className="p-4">
                    <div className="text-2xl mb-2">{cat.icon}</div>
                    <div className="text-[13px] font-extrabold mb-1" style={{ color: cat.color }}>{cat.label}</div>
                    <div className="text-[11px] text-muted-foreground leading-snug">{cat.desc}</div>
                    {cat.tag && (
                      <span className="inline-block mt-2 text-[9px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: cat.color }}>
                        {cat.tag}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── รายการไอดี ───────────────────────────────────── */}
          <section id="ids">
            <SectionHeader
              icon={<TrendingDown size={13} />}
              title={activeTab === 'all' ? 'ไอดีทั้งหมด' : ID_CATEGORIES.find(c => c.id === activeTab)?.label ?? 'ไอดี'}
              href="/products?category=efootball"
            />

            {/* filter tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button onClick={() => setActiveTab('all')}
                className="px-4 py-1.5 text-xs font-semibold rounded-full border transition-colors"
                style={{
                  background: activeTab === 'all' ? '#15803d' : '#fff',
                  color: activeTab === 'all' ? '#fff' : '#64748b',
                  borderColor: activeTab === 'all' ? '#15803d' : '#e2e8f0',
                }}>
                ทั้งหมด ({SAMPLE_IDS.filter(p => !p.sold).length} ไอดี)
              </button>
              {ID_CATEGORIES.map(cat => {
                const count = SAMPLE_IDS.filter(p => p.category === cat.id && !p.sold).length
                return (
                  <button key={cat.id} onClick={() => setActiveTab(cat.id)}
                    className="px-4 py-1.5 text-xs font-semibold rounded-full border transition-colors"
                    style={{
                      background: activeTab === cat.id ? cat.color : '#fff',
                      color: activeTab === cat.id ? '#fff' : '#64748b',
                      borderColor: activeTab === cat.id ? cat.color : '#e2e8f0',
                    }}>
                    {cat.icon} {cat.label} ({count})
                  </button>
                )
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(item => {
                const cat = ID_CATEGORIES.find(c => c.id === item.category)!
                return <IDCard key={item.id} item={item} cat={cat} />
              })}
            </div>
          </section>

          {/* ── วิธีการสั่งซื้อ ────────────────────────────────── */}
          <section>
            <SectionHeader icon={<span className="text-[11px]">📋</span>} title="วิธีการสั่งซื้อ" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { step: 1, icon: '🔍', title: 'เลือกไอดี',      desc: 'เลือกหมวดที่ต้องการ ดูนักเตะก่อนซื้อ' },
                { step: 2, icon: '💳', title: 'ชำระเงิน',        desc: 'พร้อมเพย์ / โอนธนาคาร / TrueMoney' },
                { step: 3, icon: '📩', title: 'รับรหัสไอดี',     desc: 'ระบบส่งรหัสให้อัตโนมัติใน 5 นาที' },
                { step: 4, icon: '🎮', title: 'เข้าเกมได้เลย!', desc: 'ล็อกอินแล้วเล่นได้ทันที' },
              ].map(s => (
                <div key={s.step} className="bg-white border border-border rounded-2xl p-4 text-center"
                  style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-extrabold text-sm mx-auto mb-3"
                    style={{ background: 'linear-gradient(135deg, #15803d, #22c55e)', boxShadow: '0 3px 12px rgba(21,128,61,0.3)' }}>
                    {s.step}
                  </div>
                  <div className="text-xl mb-1">{s.icon}</div>
                  <div className="text-[13px] font-bold text-[#1a1028] mb-1">{s.title}</div>
                  <div className="text-[11px] text-muted-foreground leading-snug">{s.desc}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── รีวิว ─────────────────────────────────────────── */}
          <section>
            <SectionHeader icon={<Star size={13} />} title="รีวิวจากลูกค้า" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { name: 'GoalMachine_TH', rating: 5, text: 'ได้ไอดีไก่คู่มา ทีมดีมากครับ Messi + Ronaldo ส่งไวด้วย ประทับใจ!' },
                { name: 'eFootball_Pro',  rating: 5, text: 'ราคาถูกกว่าที่อื่นมาก ไว้ใจได้ บริการดี ได้ Legend ไป ดีใจมาก' },
                { name: 'SoccerKing99',   rating: 5, text: 'ซื้อมาหลายครั้งแล้ว ได้ไอดีไก่เดี่ยว Lewandowski ทีมแน่นมาก' },
              ].map((r, i) => (
                <div key={i} className="bg-white border border-border rounded-2xl p-4" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <Star key={j} size={13} className="fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-[12px] text-[#334155] leading-relaxed mb-3">"{r.text}"</p>
                  <div className="text-[11px] font-bold" style={{ color: '#15803d' }}>— {r.name}</div>
                </div>
              ))}
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
