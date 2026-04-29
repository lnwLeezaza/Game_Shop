'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback, useRef } from 'react'
import { ShoppingCart, ChevronRight, ChevronLeft, TrendingDown, Zap, Star, Shield, Clock, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { supabase } from '@/lib/supabase'

type Category = { id: string; name: string; slug: string; icon?: string }
type Product = {
  id: string
  name: string
  price: number
  original_price?: number
  image_url?: string
  category_id?: string
  is_featured?: boolean
  is_on_sale?: boolean
  discount_percent?: number
  categories?: { name: string; slug: string }
}

const SLIDES = [
  {
    badge: 'โปรโมชั่นพิเศษ',
    title: 'เติมเกม ซื้อไอเทม',
    highlight: 'ราคาถูกที่สุด',
    sub: 'ครบทุกเกม ส่งทันที 24 ชั่วโมง ปลอดภัย 100%',
    cta: 'เลือกซื้อสินค้า',
    ctaHref: '/products',
    cta2: 'ลองดวงตู้สุ่ม',
    cta2Href: '/gacha',
    gradFrom: '#c026d3',
    gradMid: '#7c3aed',
    gradTo: '#1e1b4b',
    accentColor: '#f0abfc',
    deals: [
      { game: 'Free Fire', detail: '70 เพชร', price: '฿19', was: '฿25', save: '-24%' },
      { game: 'ROV', detail: '100 เหรียญ', price: '฿29', was: '฿35', save: '-17%' },
    ],
  },
  {
    badge: 'HOT DEAL',
    title: 'ROV & Free Fire',
    highlight: 'ลด 30%',
    sub: 'เติมเหรียญ ROV และเพชร Free Fire ราคาพิเศษ จำกัดเวลา',
    cta: 'เติมเกมเลย',
    ctaHref: '/products?category=rov',
    cta2: 'ดูโปรทั้งหมด',
    cta2Href: '/products',
    gradFrom: '#dc2626',
    gradMid: '#ea580c',
    gradTo: '#431407',
    accentColor: '#fca5a5',
    deals: [
      { game: 'PUBG', detail: '60 UC', price: '฿35', was: '฿42', save: '-17%' },
      { game: 'MLBB', detail: '86 Diamond', price: '฿29', was: '฿35', save: '-17%' },
    ],
  },
  {
    badge: 'VALORANT & MLBB',
    title: 'เติม VP & Diamond',
    highlight: 'ง่าย จ่ายไว',
    sub: 'VP และ Diamond พร้อมส่งทันทีหลังชำระเงิน ไม่ต้องรอนาน',
    cta: 'เติม Valorant',
    ctaHref: '/products?category=valorant',
    cta2: 'เติม MLBB',
    cta2Href: '/products?category=mlbb',
    gradFrom: '#0369a1',
    gradMid: '#4f46e5',
    gradTo: '#0c0a1e',
    accentColor: '#93c5fd',
    deals: [
      { game: 'Valorant', detail: '475 VP', price: '฿89', was: '฿110', save: '-19%' },
      { game: 'MLBB', detail: '172 Diamond', price: '฿55', was: '฿65', save: '-15%' },
    ],
  },
]

const GAMES = [
  {
    id: 'rov',
    name: 'ROV',
    fullName: 'Arena of Valor',
    logo: '/gamespic/rov.png',
    fallback: 'RV',
    colorA: '#ef4444',
    colorB: '#991b1b',
    tag: 'ยอดนิยม',
    tagColor: '#ef4444',
    currency: 'เหรียญทอง',
    href: '/topup',
    topPack: { label: '100 เหรียญ', price: '฿29', was: '฿35' },
  },
  {
    id: 'freefire',
    name: 'Free Fire',
    fullName: 'Garena',
    logo: '/gamespic/freefire.jpg',
    fallback: 'FF',
    colorA: '#f97316',
    colorB: '#c2410c',
    tag: 'ขายดี',
    tagColor: '#f97316',
    currency: 'เพชร',
    href: '/products?category=freefire',
    topPack: { label: '70 เพชร', price: '฿19', was: '฿25' },
  },
  {
    id: 'undawn',
    name: 'Undawn',
    fullName: 'Level Infinite',
    logo: 'https://play-lh.googleusercontent.com/P6NRhqhWHSJuTkXO7LpMdmjV00eHhj_TqTxRCEYi1kSJGFMi0uQJDFnTzLbxjw3mV4Q=w96-h96',
    fallback: 'UD',
    colorA: '#16a34a',
    colorB: '#14532d',
    tag: 'ใหม่',
    tagColor: '#16a34a',
    currency: 'เพชร',
    href: '/products?category=undawn',
    topPack: { label: '60 เพชร', price: '฿29', was: undefined },
  },
  {
    id: 'deltaforce',
    name: 'Delta Force',
    fullName: 'Mobile',
    logo: '/gamespic/delta force.jpg',
    fallback: 'DF',
    colorA: '#475569',
    colorB: '#0f172a',
    tag: '',
    tagColor: '',
    currency: 'บัตรเกม',
    href: '/products?category=deltaforce',
    topPack: { label: 'บัตร ฿50', price: '฿50', was: undefined },
  },
  {
    id: 'codm',
    name: 'Call of Duty',
    fullName: 'Mobile',
    logo: 'https://play-lh.googleusercontent.com/9wGk5pUHsZBWXf9tPtEUKrJAE5PqZFpXxjVBQBIMx2cGvq7yFpOwMBfNkMjpO7FW4g=w96-h96',
    fallback: 'COD',
    colorA: '#b45309',
    colorB: '#451a03',
    tag: '',
    tagColor: '',
    currency: 'CP',
    href: '/products?category=codm',
    topPack: { label: '80 CP', price: '฿35', was: '฿45' },
  },
  {
    id: 'haikyu',
    name: 'HAIKYU!!',
    fullName: 'Fly High',
    logo: 'https://play-lh.googleusercontent.com/Fc-xbXDR4rwkFCLGFVcHW-Rb3Tj1gFnj3yJgKN5vSaTIU1MDq5ABZIJ_M0xzIrv7qQ=w96-h96',
    fallback: 'HQ',
    colorA: '#ea580c',
    colorB: '#7c2d12',
    tag: 'ใหม่',
    tagColor: '#ea580c',
    currency: 'คูปอง',
    href: '/products?category=haikyu',
    topPack: { label: '60 คูปอง', price: '฿29', was: undefined },
  },
  {
    id: 'pubg',
    name: 'PUBG Mobile',
    fullName: 'Krafton',
    logo: 'https://play-lh.googleusercontent.com/JRd05pyBH41qjgsJuWduRJpDeZG0Hnb0yjf2nWqO7VaGKL10-G5UIygxED-WNOgHuA=w96-h96',
    fallback: 'PUBG',
    colorA: '#ca8a04',
    colorB: '#78350f',
    tag: '',
    tagColor: '',
    currency: 'UC',
    href: '/products?category=pubg',
    topPack: { label: '60 UC', price: '฿35', was: '฿42' },
  },
  {
    id: 'mlbb',
    name: 'Mobile Legends',
    fullName: 'Bang Bang',
    Logo: '/gamespic/mmlb.jpg',
    fallback: 'ML',
    colorA: '#2563eb',
    colorB: '#1e3a8a',
    tag: 'ยอดนิยม',
    tagColor: '#2563eb',
    currency: 'Diamond',
    href: '/products?category=mlbb',
    topPack: { label: '86 Diamond', price: '฿29', was: '฿35' },
  },
  {
    id: 'valorant',
    name: 'Valorant',
    fullName: 'Riot Games',
    logo: 'https://play-lh.googleusercontent.com/VKLY97mE7r2-xHHnKSPvI5OPNXwKJKS7yFoXMBjBjbQbOAZeUJDxVyoJHW29-eTww=w96-h96',
    fallback: 'VAL',
    colorA: '#dc2626',
    colorB: '#450a0a',
    tag: '',
    tagColor: '',
    currency: 'VP',
    href: '/products?category=valorant',
    topPack: { label: '475 VP', price: '฿89', was: '฿110' },
  },
  {
    id: 'heartopia',
    name: 'Heartopia',
    fullName: 'เฉพาะเพชร',
    logo: 'https://play-lh.googleusercontent.com/q_NKzGJwb5nlfVjxWlR9f4Y4-LGdM1l-EMNHjCkuCIGb-UtQ5VZ9FH7s2U4IyBEALQ=w96-h96',
    fallback: 'HT',
    colorA: '#a21caf',
    colorB: '#581c87',
    tag: 'เพชรเท่านั้น',
    tagColor: '#a21caf',
    currency: 'เพชร',
    href: '/products?category=heartopia',
    topPack: { label: '60 เพชร', price: '฿29', was: undefined },
  },
]

const PROMO_ITEMS = [
  'Free Fire Diamond ลด 15% — วันนี้เท่านั้น',
  'ROV เหรียญทอง โปรสุดคุ้ม',
  'MLBB Diamond พร้อมส่งทันที',
  'Valorant VP ราคาพิเศษ',
  'PUBG Mobile UC ลด 20%',
  'Heartopia เพชร สั่งง่าย จ่ายไว',
  'Call of Duty CP ส่งไวทุกวัน',
  'Undawn เพชร เติมได้แล้ววันนี้',
]

function Ticker() {
  const items = [...PROMO_ITEMS, ...PROMO_ITEMS]
  return (
    <div className="overflow-hidden border border-primary/20 rounded-xl py-2.5" style={{ background: 'linear-gradient(90deg, rgba(217,70,168,0.06), rgba(168,85,247,0.06))' }}>
      <div className="flex whitespace-nowrap" style={{ animation: 'ticker 28s linear infinite' }}>
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2.5 text-[12px] font-semibold text-primary mr-12 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" style={{ boxShadow: '0 0 6px #d946a8' }} />
            {item}
          </span>
        ))}
      </div>
      <style>{`@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}`}</style>
    </div>
  )
}
function FlashTimer({ accentColor }: { accentColor: string }) {
  const [secs, setSecs] = useState(3600)  // ← ค่าคงที่ ไม่ใช้ Date.now()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setSecs(3600 - (Math.floor(Date.now() / 1000) % 3600))  // ← sync หลัง mount
    const t = setInterval(() => setSecs(s => (s > 0 ? s - 1 : 3599)), 1000)
    return () => clearInterval(t)
  }, [])

  const h = Math.floor(secs / 3600).toString().padStart(2, '0')
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
  const sc = (secs % 60).toString().padStart(2, '0')

  if (!mounted) return null  // ← ไม่ render บน server

  return (
    <span className="text-[11px] font-black tabular-nums" style={{ color: accentColor, fontVariantNumeric: 'tabular-nums', letterSpacing: '0.04em' }}>
      {h}:{m}:{sc}
    </span>
  )
}

function Hero() {
  const [idx, setIdx] = useState(0)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const go = useCallback((next: number) => {
    if (animating) return
    setAnimating(true)
    setIdx(next)
    setTimeout(() => setAnimating(false), 500)
  }, [animating])

  const next = useCallback(() => go((idx + 1) % SLIDES.length), [go, idx])
  const goBack = useCallback(() => go((idx - 1 + SLIDES.length) % SLIDES.length), [go, idx])

  useEffect(() => {
    timerRef.current = setInterval(next, 5500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [next])

  const s = SLIDES[idx]

  return (
    <section
      className="relative rounded-2xl overflow-hidden"
      style={{
        minHeight: 300,
        background: `linear-gradient(130deg, ${s.gradFrom} 0%, ${s.gradMid} 50%, ${s.gradTo} 100%)`,
        transition: 'background 0.7s ease',
      }}
    >
      {/* Grid texture */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="pgrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#pgrid)" />
      </svg>

      {/* Glow orbs */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none" style={{ background: s.accentColor, filter: 'blur(72px)', opacity: 0.2 }} />
      <div className="absolute bottom-0 left-1/4 w-56 h-56 rounded-full pointer-events-none" style={{ background: s.accentColor, filter: 'blur(60px)', opacity: 0.1 }} />

      {/* Diagonal right panel */}
      <div className="absolute right-0 top-0 bottom-0 pointer-events-none" style={{ width: '35%', background: 'rgba(255,255,255,0.04)', clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)' }} />

      {/* Content */}
      <div className="relative z-10 flex items-center min-h-[300px] md:min-h-[340px] px-8 md:px-14 py-10 gap-8">
        {/* Left: text */}
        <div className="flex-1 min-w-0">
          <span
            className="inline-block text-[10px] font-bold tracking-widest uppercase mb-3 px-3 py-1.5 rounded-md"
            style={{ background: 'rgba(255,255,255,0.14)', color: s.accentColor, border: `1px solid ${s.accentColor}35`, letterSpacing: '0.1em' }}
          >
            {s.badge}
          </span>

          <h1 className="font-extrabold leading-tight mb-1" style={{ fontSize: 'clamp(24px, 3.8vw, 40px)', color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.25)' }}>
            {s.title}
          </h1>
          <h2 className="font-extrabold leading-tight mb-4" style={{ fontSize: 'clamp(22px, 3.5vw, 38px)', color: s.accentColor, textShadow: `0 0 32px ${s.accentColor}70` }}>
            {s.highlight}
          </h2>

          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 400, lineHeight: 1.7 }}>{s.sub}</p>

          <div className="flex gap-3 flex-wrap">
            <Link href={s.ctaHref}>
              <button
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                style={{ background: '#fff', color: s.gradMid, boxShadow: '0 4px 24px rgba(0,0,0,0.22)' }}
              >
                <ShoppingCart size={14} />
                {s.cta}
              </button>
            </Link>
            <Link href={s.cta2Href}>
              <button
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)' }}
              >
                {s.cta2}
              </button>
            </Link>
          </div>
        </div>

        {/* Right: Deal showcase panel */}
        <div className="hidden md:flex flex-col gap-2.5 shrink-0 w-56">

          {/* Flash Deal block */}
          <div
            className="rounded-xl p-3.5 flex flex-col gap-2"
            style={{
              background: 'rgba(0,0,0,0.28)',
              border: `1px solid ${s.accentColor}35`,
              backdropFilter: 'blur(14px)',
            }}
          >
            {/* Header row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{ background: s.accentColor, boxShadow: `0 0 6px ${s.accentColor}` }}
                />
                <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: s.accentColor }}>
                  Flash Deal
                </span>
              </div>
              <FlashTimer accentColor={s.accentColor} />
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: `${s.accentColor}25` }} />

            {/* Deal rows */}
            {s.deals.map((d, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-white leading-tight truncate">
                    {d.game}{' '}
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>{d.detail}</span>
                  </div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-[14px] font-extrabold text-white">{d.price}</span>
                    <span className="text-[9px] line-through" style={{ color: 'rgba(255,255,255,0.38)' }}>{d.was}</span>
                  </div>
                </div>
                <span
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0"
                  style={{ background: 'rgba(239,68,68,0.25)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)' }}
                >
                  {d.save}
                </span>
              </div>
            ))}
          </div>

          {/* Trust stats grid */}
          <div
            className="rounded-xl px-3 py-3 grid grid-cols-2 gap-y-2.5"
            style={{
              background: 'rgba(0,0,0,0.22)',
              border: '1px solid rgba(255,255,255,0.12)',
              backdropFilter: 'blur(10px)',
            }}
          >
            {[
              { num: '50K+', label: 'ออร์เดอร์' },
              { num: '4.9★', label: 'รีวิว' },
              { num: '<1 นาที', label: 'ส่งทันที' },
              { num: '100%', label: 'ปลอดภัย' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="text-[13px] font-extrabold text-white leading-none">{item.num}</div>
                <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.48)' }}>{item.label}</div>
              </div>
            ))}
          </div>

          {/* Quick top-up CTA */}
          <Link href="/products">
            <div
              className="rounded-xl px-3.5 py-2.5 flex items-center gap-2 cursor-pointer transition-all hover:brightness-125 active:scale-95"
              style={{
                background: `${s.accentColor}22`,
                border: `1px solid ${s.accentColor}40`,
              }}
            >
              <span style={{ fontSize: 14 }}>🎮</span>
              <span className="text-[11px] font-bold flex-1" style={{ color: s.accentColor }}>ดูสินค้าทั้งหมด</span>
              <ChevronRight size={12} style={{ color: s.accentColor, opacity: 0.7 }} />
            </div>
          </Link>
        </div>
      </div>

      {/* Nav arrows */}
      <button
        onClick={goBack}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
      >
        <ChevronLeft size={15} />
      </button>
      <button
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
      >
        <ChevronRight size={15} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className="rounded-full border-0 cursor-pointer transition-all duration-300 p-0"
            style={{ width: i === idx ? 20 : 6, height: 6, background: i === idx ? '#fff' : 'rgba(255,255,255,0.35)' }}
          />
        ))}
      </div>
    </section>
  )
}

function TrustBar() {
  const items = [
    { icon: <Zap size={13} />, label: 'ส่งทันที 24/7' },
    { icon: <Shield size={13} />, label: 'ปลอดภัย 100%' },
    { icon: <CreditCard size={13} />, label: 'หลายช่องทางชำระ' },
    { icon: <Clock size={13} />, label: 'รองรับตลอด 24 ชม.' },
    { icon: <Star size={13} />, label: 'ครบทุกเกม' },
  ]
  return (
    <div className="flex flex-wrap justify-center gap-x-7 gap-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: '#7c3aed' }}>
          <span className="text-primary">{item.icon}</span>
          {item.label}
        </div>
      ))}
    </div>
  )
}

function GameCard({ game }: { game: typeof GAMES[0] }) {
  const [err, setErr] = useState(false)
  const hasDiscount = game.topPack.was !== undefined

  return (
    <Link href={game.href}>
      <div
        className="group relative bg-white border border-border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1.5"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        onMouseEnter={e => {
          ;(e.currentTarget as HTMLElement).style.boxShadow = `0 10px 32px ${game.colorA}28, 0 0 0 1.5px ${game.colorA}38`
        }}
        onMouseLeave={e => {
          ;(e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
        }}
      >
        {/* Top color accent bar */}
        <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${game.colorA}, ${game.colorB})` }} />

        <div className="flex flex-col items-center pt-3.5 pb-1 px-2 gap-2">
          {/* Logo */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-1"
            style={{
              background: `linear-gradient(135deg, ${game.colorA}, ${game.colorB})`,
              boxShadow: `0 4px 14px ${game.colorA}45`,
            }}
          >
            {!err ? (
              <img
                src={game.logo}
                alt={game.name}
                className="w-full h-full object-cover"
                onError={() => setErr(true)}
              />
            ) : (
              <span className="text-white text-[10px] font-black">{game.fallback}</span>
            )}
          </div>

          {/* Name */}
          <div className="text-[11px] font-bold text-[#1a1028] leading-tight truncate w-full text-center px-1">
            {game.name}
          </div>
        </div>

        {/* Price strip */}
        <div
          className="mx-2 mb-2.5 mt-1 rounded-lg px-2 py-1.5"
          style={{
            background: `${game.colorA}12`,
            border: `1px solid ${game.colorA}25`,
          }}
        >
          <div className="text-[8.5px] font-semibold leading-none mb-0.5 truncate" style={{ color: game.colorA }}>
            {game.topPack.label}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-[12px] font-extrabold leading-none" style={{ color: game.colorA }}>
              {game.topPack.price}
            </span>
            {hasDiscount && (
              <span className="text-[9px] line-through leading-none" style={{ color: `${game.colorA}60` }}>
                {game.topPack.was}
              </span>
            )}
            {hasDiscount && (
              <span
                className="ml-auto text-[7.5px] font-bold px-1 py-0.5 rounded-full leading-none"
                style={{
                  background: `${game.colorA}22`,
                  color: game.colorA,
                }}
              >
                ถูกกว่า
              </span>
            )}
          </div>
        </div>

        {/* Tag badge */}
        {game.tag && (
          <div
            className="absolute top-2 right-2 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full leading-tight"
            style={{ background: game.tagColor }}
          >
            {game.tag}
          </div>
        )}
      </div>
    </Link>
  )
}

function SectionHeader({ icon, title, href }: { icon: React.ReactNode; title: string; href?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span
          className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #d946a8, #7c3aed)' }}
        >
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

function ProductCard({ product }: { product: Product }) {
  const discount =
    product.discount_percent ??
    (product.original_price && product.original_price > product.price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : null)
  return (
    <Link href={`/products/${product.id}`}>
      <div className="group bg-white border border-border rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10">
        <div className="aspect-[4/3] bg-gradient-to-br from-secondary to-muted relative overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-primary/20">
              <ShoppingCart size={32} />
            </div>
          )}
          {discount && (
            <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              -{discount}%
            </span>
          )}
        </div>
        <div className="p-3">
          <p className="text-[12px] font-semibold text-[#1a1028] line-clamp-2 mb-1.5 leading-snug">{product.name}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[14px] font-extrabold text-primary">฿{product.price.toLocaleString()}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-[10px] text-muted-foreground line-through">
                ฿{product.original_price.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="bg-white border border-border rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-secondary" />
      <div className="p-3 space-y-2">
        <div className="h-3 bg-secondary rounded w-3/4" />
        <div className="h-3 bg-secondary rounded w-1/2" />
      </div>
    </div>
  )
}

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [saleProducts, setSaleProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const { data: cats } = await supabase.from('categories').select('*').order('name')
        if (cats) setCategories(cats)
        const { data: sale } = await supabase
          .from('products')
          .select('*, categories(name, slug)')
          .eq('is_on_sale', true)
          .order('discount_percent', { ascending: false })
          .limit(8)
        if (sale) setSaleProducts(sale)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-7xl px-4 py-5 flex flex-col gap-8">

          {/* Ticker */}
          <Ticker />

          {/* Hero slideshow */}
          <Hero />

          {/* Trust bar */}
          <TrustBar />

          {/* ── เติมเกมยอดนิยม (10 games) ── */}
          <section>
            <SectionHeader icon={<Zap size={13} />} title="เติมเกมยอดนิยม" href="/products" />
            <div className="grid grid-cols-5 lg:grid-cols-10 gap-2.5">
              {GAMES.map(g => (
                <GameCard key={g.id} game={g} />
              ))}
            </div>
          </section>

          {/* ── Featured promo strip ── */}
          <section>
            <SectionHeader icon={<Star size={13} />} title="โปรโมชั่นเด่นประจำวัน" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {GAMES.filter(g => g.tag)
                .slice(0, 3)
                .map(g => (
                  <Link key={g.id} href={g.href}>
                    <div
                      className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.018] hover:shadow-2xl"
                      style={{
                        background: `linear-gradient(130deg, ${g.colorA} 0%, ${g.colorB} 100%)`,
                        minHeight: 110,
                      }}
                    >
                      <div
                        className="absolute right-5 top-1/2 -translate-y-1/2 font-black leading-none select-none pointer-events-none"
                        style={{ fontSize: 64, color: 'rgba(255,255,255,0.08)' }}
                      >
                        {g.fallback}
                      </div>
                      <div className="relative z-10 flex items-center gap-4 p-5 h-full">
                        <div
                          className="w-12 h-12 rounded-xl overflow-hidden shrink-0"
                          style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}
                        >
                          <img
                            src={g.logo}
                            alt={g.name}
                            className="w-full h-full object-cover"
                            onError={e => {
                              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                            }}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span
                            className="inline-block text-[9px] font-bold mb-1 px-2 py-0.5 rounded-full"
                            style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
                          >
                            {g.tag}
                          </span>
                          <div className="text-white font-extrabold text-[15px] leading-tight">{g.name}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>
                            เติม{g.currency} ราคาพิเศษ
                          </div>
                          {/* Price hint on promo strip */}
                          <div className="flex items-baseline gap-1.5 mt-1.5">
                            <span className="text-white font-extrabold text-[14px]">{g.topPack.price}</span>
                            {g.topPack.was && (
                              <span className="text-[10px] line-through" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                {g.topPack.was}
                              </span>
                            )}
                            <span
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
                            >
                              {g.topPack.label}
                            </span>
                          </div>
                        </div>
                        <div
                          className="ml-auto w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                          style={{ background: 'rgba(255,255,255,0.18)' }}
                        >
                          <ChevronRight size={14} className="text-white" />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </section>

          {/* ── หมวดหมู่ ── */}
          {categories.length > 0 && (
            <section>
              <SectionHeader icon={<Star size={13} />} title="หมวดหมู่สินค้า" href="/products" />
              <div className="flex flex-wrap gap-2">
                <Link href="/products">
                  <Badge
                    variant="outline"
                    className="px-4 py-1.5 text-xs font-semibold cursor-pointer hover:bg-primary hover:text-white hover:border-primary transition-colors rounded-full"
                  >
                    ทั้งหมด
                  </Badge>
                </Link>
                {categories.map(cat => (
                  <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                    <Badge
                      variant="outline"
                      className="px-4 py-1.5 text-xs font-semibold cursor-pointer hover:bg-primary hover:text-white hover:border-primary transition-colors rounded-full"
                    >
                      {cat.name}
                    </Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── ลดราคา ── */}
          <section>
            <SectionHeader icon={<TrendingDown size={13} />} title="ลดราคา / โปรโมชั่น" href="/products?sale=true" />
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductCardSkeleton key={i} />
                ))}
              </div>
            ) : saleProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {saleProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border py-14 text-center">
                <TrendingDown className="mx-auto mb-3 opacity-20 text-primary" size={36} />
                <p className="text-sm text-muted-foreground mb-3">ยังไม่มีสินค้าลดราคาในขณะนี้</p>
                <Link href="/products">
                  <Button variant="ghost" size="sm">
                    ดูสินค้าทั้งหมด
                  </Button>
                </Link>
              </div>
            )}
          </section>

          {/* ── Gacha banner ── */}
          <section>
            <Link href="/gacha">
              <div
                className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-2xl hover:shadow-violet-500/20 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(130deg, #5b21b6 0%, #4338ca 55%, #0f172a 100%)',
                  minHeight: 110,
                }}
              >
                <svg
                  className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <pattern id="gg" width="32" height="32" patternUnits="userSpaceOnUse">
                      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#gg)" />
                </svg>
                <div className="relative z-10 flex items-center gap-6 px-8 py-6">
                  <div className="flex-1 min-w-0">
                    <span
                      className="inline-block text-[9px] font-bold tracking-widest uppercase mb-2 px-2.5 py-1 rounded-full"
                      style={{
                        background: 'rgba(255,255,255,0.12)',
                        color: '#c4b5fd',
                        border: '1px solid rgba(196,181,253,0.28)',
                      }}
                    >
                      ลองดวงวันนี้
                    </span>
                    <h3 className="text-xl font-extrabold text-white mb-1">ตู้สุ่มไอเทมสุดพิเศษ</h3>
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.58)' }}>
                      สุ่มรับไอเทมสุดหายาก ราคาเริ่มต้นแค่ไม่กี่บาท
                    </p>
                  </div>
                  <div className="hidden sm:flex flex-col gap-1.5 shrink-0">
                    {[
                      { label: 'SSR', c: '#fbbf24', bg: 'rgba(251,191,36,0.22)' },
                      { label: 'SR', c: '#c084fc', bg: 'rgba(192,132,252,0.22)' },
                      { label: 'R', c: '#93c5fd', bg: 'rgba(147,197,253,0.22)' },
                    ].map(r => (
                      <span
                        key={r.label}
                        className="text-[9px] font-bold px-3 py-0.5 rounded-full"
                        style={{ background: r.bg, color: r.c, border: `1px solid ${r.c}40` }}
                      >
                        {r.label}
                      </span>
                    ))}
                  </div>
                  <button
                    className="shrink-0 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
                    style={{ background: '#fff', color: '#4f46e5', boxShadow: '0 4px 18px rgba(0,0,0,0.22)' }}
                  >
                    ลองเลย!
                  </button>
                </div>
              </div>
            </Link>
          </section>

          {/* ── Quick links ── */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4">
            {[
              {
                href: '/wallet',
                icon: <CreditCard size={17} />,
                iconBg: '#dcfce7',
                iconColor: '#15803d',
                title: 'เติมเงินกระเป๋า',
                sub: 'เพิ่มเครดิตเพื่อซื้อสินค้า',
              },
              {
                href: '/orders',
                icon: <ShoppingCart size={17} />,
                iconBg: '#dbeafe',
                iconColor: '#1d4ed8',
                title: 'ประวัติคำสั่งซื้อ',
                sub: 'ตรวจสอบสถานะออร์เดอร์',
              },
              {
                href: '/profile',
                icon: <Star size={17} />,
                iconBg: '#fef9c3',
                iconColor: '#854d0e',
                title: 'โปรไฟล์ของฉัน',
                sub: 'จัดการข้อมูลส่วนตัว',
              },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div className="group bg-white border border-border rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/8">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: item.iconBg, color: item.iconColor }}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#1a1028] leading-tight">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{item.sub}</p>
                  </div>
                  <ChevronRight
                    size={13}
                    className="ml-auto text-muted-foreground group-hover:text-primary transition-colors shrink-0"
                  />
                </div>
              </Link>
            ))}
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}
