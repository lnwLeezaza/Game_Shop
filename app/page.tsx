'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback, useRef } from 'react'
import { ShoppingCart, ChevronRight, ChevronLeft, TrendingDown, Zap, Star, Shield, Clock, CreditCard, Shuffle, Key, Trophy, Package, Flame, Tag, Percent } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { supabase } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────
type Category = { id: string; name: string; slug: string; icon?: string }
type Product = {
  id: string
  title: string
  price: number
  original_price?: number
  images?: string[]
  category_id?: string
  is_featured?: boolean
  is_on_sale?: boolean
  discount_percent?: number
  categories?: { name: string; slug: string }
}

// ─── Shared flash timer ──────────────────────────────────────────────
let sharedSecs = 0
const timerListeners: Set<(s: number) => void> = new Set()
let timerStarted = false

function startSharedTimer() {
  if (timerStarted) return
  timerStarted = true
  setInterval(() => {
    sharedSecs = sharedSecs > 0 ? sharedSecs - 1 : 3599
    timerListeners.forEach(fn => fn(sharedSecs))
  }, 1000)
}

function useFlashSecs() {
  const [secs, setSecs] = useState(0)
  useEffect(() => {
    sharedSecs = 3600 - (Math.floor(Date.now() / 1000) % 3600)
    setSecs(sharedSecs)
    startSharedTimer()
    timerListeners.add(setSecs)
    return () => { timerListeners.delete(setSecs) }
  }, [])
  return secs
}

// ─── Constants ──────────────────────────────────────────────────────
const SLIDES = [
  {
    badge: 'โปรโมชั่นพิเศษ',
    title: 'เติมเกม ซื้อไอเทม',
    highlight: 'ราคาถูกที่สุด',
    sub: 'ครบทุกเกม ส่งทันที 24 ชั่วโมง ปลอดภัย 100%',
    cta: 'เลือกซื้อสินค้า', ctaHref: '/products',
    cta2: 'ลองดวงตู้สุ่ม', cta2Href: '/gacha',
    gradFrom: '#1e40af', gradMid: '#1d4ed8', gradTo: '#0c4a6e', accentColor: '#06b6d4',
    bgImage: '/gamespic/All1.jfif',
    heroImg: '',
    showContent: false, // ← ซ่อน text/button ทั้งหมด
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
    cta: 'เติมเกมเลย', ctaHref: '/products?category=rov',
    cta2: 'ดูโปรทั้งหมด', cta2Href: '/products',
    gradFrom: '#dc2626', gradMid: '#ea580c', gradTo: '#431407', accentColor: '#fca5a5',
    bgImage: '/gamespic/All2.png',
    heroImg: '',
    showContent: false, // ← ไม่มีรูป แสดง text ปกติ
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
    cta: 'เติม Valorant', ctaHref: '/products?category=valorant',
    cta2: 'เติม MLBB', cta2Href: '/products?category=mlbb',
    gradFrom: '#0369a1', gradMid: '#4f46e5', gradTo: '#0c0a1e', accentColor: '#93c5fd',
    bgImage: '/gamespic/All3.png',
    heroImg: '',
    showContent: false,
    deals: [
      { game: 'Valorant', detail: '475 VP', price: '฿89', was: '฿110', save: '-19%' },
      { game: 'MLBB', detail: '172 Diamond', price: '฿55', was: '฿65', save: '-15%' },
    ],
  },
]

const GAMES = [
  { id: 'rov', name: 'ROV', fullName: 'Arena of Valor', logo: '/gamespic/rov.png', fallback: 'RV', colorA: '#ef4444', colorB: '#991b1b', tag: 'ยอดนิยม', tagColor: '#ef4444', currency: 'เหรียญทอง', href: '/topup', topPack: { label: '100 เหรียญ', price: '฿29', was: '฿35' } },
  { id: 'freefire', name: 'Free Fire', fullName: 'Garena', logo: '/gamespic/freefire.jpg', fallback: 'FF', colorA: '#f97316', colorB: '#c2410c', tag: 'ขายดี', tagColor: '#f97316', currency: 'เพชร', href: '/products?category=freefire', topPack: { label: '70 เพชร', price: '฿19', was: '฿25' } },
  { id: 'undawn', name: 'Undawn', fullName: 'Level Infinite', logo: 'https://play-lh.googleusercontent.com/P6NRhqhWHSJuTkXO7LpMdmjV00eHhj_TqTxRCEYi1kSJGFMi0uQJDFnTzLbxjw3mV4Q=w96-h96', fallback: 'UD', colorA: '#16a34a', colorB: '#14532d', tag: 'ใหม่', tagColor: '#16a34a', currency: 'เพชร', href: '/products?category=undawn', topPack: { label: '60 เพชร', price: '฿29', was: undefined } },
  { id: 'deltaforce', name: 'Delta Force', fullName: 'Mobile', logo: '/gamespic/delta force.jpg', fallback: 'DF', colorA: '#475569', colorB: '#0f172a', tag: '', tagColor: '', currency: 'บัตรเกม', href: '/products?category=deltaforce', topPack: { label: 'บัตร ฿50', price: '฿50', was: undefined } },
  { id: 'codm', name: 'Call of Duty', fullName: 'Mobile', logo: 'https://play-lh.googleusercontent.com/9wGk5pUHsZBWXf9tPtEUKrJAE5PqZFpXxjVBQBIMx2cGvq7yFpOwMBfNkMjpO7FW4g=w96-h96', fallback: 'COD', colorA: '#b45309', colorB: '#451a03', tag: '', tagColor: '', currency: 'CP', href: '/products?category=codm', topPack: { label: '80 CP', price: '฿35', was: '฿45' } },
  { id: 'haikyu', name: 'HAIKYU!!', fullName: 'Fly High', logo: 'https://play-lh.googleusercontent.com/Fc-xbXDR4rwkFCLGFVcHW-Rb3Tj1gFnj3yJgKN5vSaTIU1MDq5ABZIJ_M0xzIrv7qQ=w96-h96', fallback: 'HQ', colorA: '#ea580c', colorB: '#7c2d12', tag: 'ใหม่', tagColor: '#ea580c', currency: 'คูปอง', href: '/products?category=haikyu', topPack: { label: '60 คูปอง', price: '฿29', was: undefined } },
  { id: 'pubg', name: 'PUBG Mobile', fullName: 'Krafton', logo: 'https://play-lh.googleusercontent.com/JRd05pyBH41qjgsJuWduRJpDeZG0Hnb0yjf2nWqO7VaGKL10-G5UIygxED-WNOgHuA=w96-h96', fallback: 'PUBG', colorA: '#ca8a04', colorB: '#78350f', tag: '', tagColor: '', currency: 'UC', href: '/products?category=pubg', topPack: { label: '60 UC', price: '฿35', was: '฿42' } },
  { id: 'mlbb', name: 'Mobile Legends', fullName: 'Bang Bang', logo: '/gamespic/mlbb.jpg', fallback: 'ML', colorA: '#2563eb', colorB: '#1e3a8a', tag: 'ยอดนิยม', tagColor: '#2563eb', currency: 'Diamond', href: '/products?category=mlbb', topPack: { label: '86 Diamond', price: '฿29', was: '฿35' } },
  { id: 'valorant', name: 'Valorant', fullName: 'Riot Games', logo: 'https://play-lh.googleusercontent.com/VKLY97mE7r2-xHHnKSPvI5OPNXwKJKS7yFoXMBjBjbQbOAZeUJDxVyoJHW29-eTww=w96-h96', fallback: 'VAL', colorA: '#dc2626', colorB: '#450a0a', tag: '', tagColor: '', currency: 'VP', href: '/products?category=valorant', topPack: { label: '475 VP', price: '฿89', was: '฿110' } },
  { id: 'heartopia', name: 'Heartopia', fullName: 'เฉพาะเพชร', logo: 'https://play-lh.googleusercontent.com/q_NKzGJwb5nlfVjxWlR9f4Y4-LGdM1l-EMNHjCkuCIGb-UtQ5VZ9FH7s2U4IyBEALQ=w96-h96', fallback: 'HT', colorA: '#a21caf', colorB: '#581c87', tag: 'เพชรเท่านั้น', tagColor: '#a21caf', currency: 'เพชร', href: '/products?category=heartopia', topPack: { label: '60 เพชร', price: '฿29', was: undefined } },
]

const ACCOUNT_ITEMS = [
  { id: 'acc1', game: 'Free Fire', colorA: '#f97316', colorB: '#c2410c', fallback: 'FF', logo: '/gamespic/freefire.jpg', rank: 'Diamond III', rankIcon: '💎', skins: 24, level: 89, price: '฿590', was: '฿800', badge: 'ยืนยันแล้ว', badgeColor: '#16a34a', highlight: 'สกิน Epic 3 ชิ้น' },
  { id: 'acc2', game: 'Free Fire', colorA: '#f97316', colorB: '#c2410c', fallback: 'FF', logo: '/gamespic/freefire.jpg', rank: 'Heroic', rankIcon: '🏆', skins: 51, level: 142, price: '฿1,200', was: '฿1,600', badge: 'ฮอต', badgeColor: '#dc2626', highlight: 'สกิน Legendary 1 ชิ้น' },
  { id: 'acc3', game: 'ROV', colorA: '#ef4444', colorB: '#991b1b', fallback: 'RV', logo: '/gamespic/rov.png', rank: 'Challenger', rankIcon: '👑', skins: 45, level: 200, price: '฿1,800', was: undefined, badge: 'ราคาพิเศษ', badgeColor: '#ca8a04', highlight: 'สกิน Legendary 2 ชิ้น' },
  { id: 'acc4', game: 'ROV', colorA: '#ef4444', colorB: '#991b1b', fallback: 'RV', logo: '/gamespic/rov.png', rank: 'Diamond V', rankIcon: '⭐', skins: 18, level: 95, price: '฿490', was: '฿650', badge: 'ยืนยันแล้ว', badgeColor: '#16a34a', highlight: 'สกิน Epic 4 ชิ้น' },
  { id: 'acc5', game: 'eFootball (PES)', colorA: '#2563eb', colorB: '#1e3a8a', fallback: 'PES', logo: '/gamespic/pes.jpg', rank: 'Division 1', rankIcon: '⚽', skins: 0, level: 85, price: '฿890', was: '฿1,200', badge: 'ยืนยันแล้ว', badgeColor: '#16a34a', highlight: 'นักเตะ Legendary 5+' },
  { id: 'acc6', game: 'eFootball (PES)', colorA: '#2563eb', colorB: '#1e3a8a', fallback: 'PES', logo: '/gamespic/pes.jpg', rank: 'Division 2', rankIcon: '🎯', skins: 0, level: 60, price: '฿390', was: '฿500', badge: 'ราคาถูก', badgeColor: '#ca8a04', highlight: 'นักเตะ Epic 10+' },
]

const GACHA_POOLS = [
  { id: 'pool1', game: 'Free Fire', colorA: '#f97316', colorB: '#c2410c', logo: '/gamespic/freefire.jpg', fallback: 'FF', title: 'ตู้สุ่มไอดี Free Fire', price: '฿99', items: ['ไอดีทั่วไป', 'ไอดีสกิน 5+', 'ไอดี Diamond III+', 'ไอดี Heroic ⭐'], rates: [50, 30, 15, 5], rareLabel: 'Heroic', rareColor: '#fbbf24' },
  { id: 'pool2', game: 'ROV', colorA: '#ef4444', colorB: '#991b1b', logo: '/gamespic/rov.png', fallback: 'RV', title: 'ตู้สุ่มไอดี ROV', price: '฿129', items: ['ไอดีทั่วไป', 'ไอดีสกิน 5+', 'ไอดี Diamond V+', 'ไอดี Conqueror ⭐'], rates: [50, 28, 17, 5], rareLabel: 'Conqueror', rareColor: '#fbbf24' },
  { id: 'pool3', game: 'eFootball (PES)', colorA: '#2563eb', colorB: '#1e3a8a', logo: '/gamespic/pes.jpg', fallback: 'PES', title: 'ตู้สุ่มไอดี PES', price: '฿149', items: ['ไอดีทั่วไป', 'ไอดีนักเตะ Epic 5+', 'ไอดี Division 2+', 'ไอดี Division 1 ⭐'], rates: [45, 30, 20, 5], rareLabel: 'Division 1', rareColor: '#a78bfa' },
]

const PROMO_ITEMS = [
  'ขายไอดี Free Fire ราคาถูก ยืนยันแล้ว', 'ไอดี ROV Challenger สกิน Legendary',
  'ไอดี PES Division 1 นักเตะครบ', 'ตู้สุ่มไอดี Free Fire เปิดแล้ว!',
  'ตู้สุ่มไอดี ROV ลุ้น Conqueror', 'ตู้สุ่มไอดี PES ลุ้น Division 1',
  'ไอดี Free Fire Heroic ราคาพิเศษ', 'ไอดี ROV Diamond V+ สกิน Epic',
  'ไอดี PES Division 2 ราคาถูก', 'รับประกันทุกไอดี ยืนยันก่อนส่ง',
]

// ─── Components ─────────────────────────────────────────────────────

function Ticker() {
  const items = [...PROMO_ITEMS, ...PROMO_ITEMS]
  return (
    <div className="overflow-hidden border border-primary/20 rounded-xl py-2.5" style={{ background: 'linear-gradient(90deg, rgba(217,70,168,0.06), rgba(168,85,247,0.06))' }}>
      <div className="flex whitespace-nowrap" style={{ animation: 'ticker 32s linear infinite' }}>
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
  const secs = useFlashSecs()
  const h = Math.floor(secs / 3600).toString().padStart(2, '0')
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0')
  const sc = (secs % 60).toString().padStart(2, '0')
  return (
    <span className="text-[11px] font-black tabular-nums" style={{ color: accentColor, letterSpacing: '0.04em' }}>
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
  <section className="relative rounded-2xl overflow-hidden" style={{ 
  minHeight: 360, 
  background: s.bgImage
    ? `url('${s.bgImage}') center/cover no-repeat`
    : `linear-gradient(130deg, ${s.gradFrom} 0%, ${s.gradMid} 50%, ${s.gradTo} 100%)`,
  transition: 'background 0.7s ease' 
}}>
      <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="pgrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.6" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#pgrid)" />
      </svg>
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none" style={{ background: s.accentColor, filter: 'blur(72px)', opacity: 0.2 }} />
      <div className="absolute bottom-0 left-1/4 w-56 h-56 rounded-full pointer-events-none" style={{ background: s.accentColor, filter: 'blur(60px)', opacity: 0.1 }} />
      <div className="absolute right-0 top-0 bottom-0 pointer-events-none" style={{ width: '35%', background: 'rgba(255,255,255,0.04)', clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)' }} />
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none" style={{ background: s.accentColor, filter: 'blur(72px)', opacity: 0.2 }} />
<div className="absolute bottom-0 left-1/4 w-56 h-56 rounded-full pointer-events-none" style={{ background: s.accentColor, filter: 'blur(60px)', opacity: 0.1 }} />
<div className="absolute right-0 top-0 bottom-0 pointer-events-none" style={{ width: '35%', background: 'rgba(255,255,255,0.04)', clipPath: 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)' }} />

{s.showContent && (
  <div className="relative z-10 flex items-center min-h-[300px] md:min-h-[340px] px-6 md:px-14 py-8 gap-8">
    <div className="flex-1 min-w-0">
      <span className="inline-block text-[10px] font-bold tracking-widest uppercase mb-3 px-3 py-1.5 rounded-md" style={{ background: 'rgba(255,255,255,0.14)', color: s.accentColor, border: `1px solid ${s.accentColor}35`, letterSpacing: '0.1em' }}>{s.badge}</span>
      <h1 className="font-extrabold leading-tight mb-1" style={{ fontSize: 'clamp(22px, 3.8vw, 40px)', color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.25)' }}>{s.title}</h1>
      <h2 className="font-extrabold leading-tight mb-4" style={{ fontSize: 'clamp(20px, 3.5vw, 38px)', color: s.accentColor, textShadow: `0 0 32px ${s.accentColor}70` }}>{s.highlight}</h2>
      <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 400, lineHeight: 1.7 }}>{s.sub}</p>
      <div className="flex gap-3 flex-wrap">
        <Link href={s.ctaHref}><button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95" style={{ background: '#fff', color: s.gradMid, boxShadow: '0 4px 24px rgba(0,0,0,0.22)' }}><ShoppingCart size={14} />{s.cta}</button></Link>
        <Link href={s.cta2Href}><button className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)' }}>{s.cta2}</button></Link>
      </div>
      <div className="flex gap-2 mt-4 md:hidden">
        {s.deals.map((d, i) => (
          <div key={i} className="flex-1 rounded-xl p-2.5" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid ${s.accentColor}35` }}>
            <div className="text-[9px] font-bold text-white truncate">{d.game}</div>
            <div className="text-[11px] font-extrabold text-white mt-0.5">{d.price}</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[8px] line-through" style={{ color: 'rgba(255,255,255,0.4)' }}>{d.was}</span>
              <span className="text-[7px] font-bold px-1 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.3)', color: '#fca5a5' }}>{d.save}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
    <div className="hidden md:flex flex-col gap-2.5 shrink-0 w-56">
      <div className="rounded-xl p-3.5 flex flex-col gap-2" style={{ background: 'rgba(0,0,0,0.28)', border: `1px solid ${s.accentColor}35`, backdropFilter: 'blur(14px)' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.accentColor, boxShadow: `0 0 6px ${s.accentColor}` }} />
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: s.accentColor }}>Flash Deal</span>
          </div>
          <FlashTimer accentColor={s.accentColor} />
        </div>
        <div style={{ height: 1, background: `${s.accentColor}25` }} />
        {s.deals.map((d, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold text-white leading-tight truncate">{d.game} <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 400 }}>{d.detail}</span></div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-[14px] font-extrabold text-white">{d.price}</span>
                <span className="text-[9px] line-through" style={{ color: 'rgba(255,255,255,0.38)' }}>{d.was}</span>
              </div>
            </div>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0" style={{ background: 'rgba(239,68,68,0.25)', color: '#fca5a5', border: '1px solid rgba(239,68,68,0.35)' }}>{d.save}</span>
          </div>
        ))}
      </div>
      <div className="rounded-xl px-3 py-3 grid grid-cols-2 gap-y-2.5" style={{ background: 'rgba(0,0,0,0.22)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' }}>
        {[{ num: '50K+', label: 'ออร์เดอร์' }, { num: '4.9★', label: 'รีวิว' }, { num: '<1 นาที', label: 'ส่งทันที' }, { num: '100%', label: 'ปลอดภัย' }].map((item, i) => (
          <div key={i} className="text-center">
            <div className="text-[13px] font-extrabold text-white leading-none">{item.num}</div>
            <div className="text-[9px] mt-0.5" style={{ color: 'rgba(255,255,255,0.48)' }}>{item.label}</div>
          </div>
        ))}
      </div>
      <Link href="/products">
        <div className="rounded-xl px-3.5 py-2.5 flex items-center gap-2 cursor-pointer transition-all hover:brightness-125 active:scale-95" style={{ background: `${s.accentColor}22`, border: `1px solid ${s.accentColor}40` }}>
          <span style={{ fontSize: 14 }}>🎮</span>
          <span className="text-[11px] font-bold flex-1" style={{ color: s.accentColor }}>ดูสินค้าทั้งหมด</span>
          <ChevronRight size={12} style={{ color: s.accentColor, opacity: 0.7 }} />
        </div>
      </Link>
    </div>
  </div>
)}
      <button onClick={goBack} className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95" style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}><ChevronLeft size={15} /></button>
      <button onClick={next} className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95" style={{ background: 'rgba(0,0,0,0.28)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}><ChevronRight size={15} /></button>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {SLIDES.map((_, i) => (<button key={i} onClick={() => go(i)} className="rounded-full border-0 cursor-pointer transition-all duration-300 p-0" style={{ width: i === idx ? 20 : 6, height: 6, background: i === idx ? '#fff' : 'rgba(255,255,255,0.35)' }} />))}
      </div>
    </section>
  )
}

function TrustBar() {
  const items = [
    { icon: <Zap size={13} />, label: 'ส่งทันที 24/7', bg: '#dbeafe', color: '#1d4ed8' },
    { icon: <Shield size={13} />, label: 'ปลอดภัย 100%', bg: '#dcfce7', color: '#15803d' },
    { icon: <CreditCard size={13} />, label: 'หลายช่องทาง', bg: '#fef9c3', color: '#854d0e' },
    { icon: <Clock size={13} />, label: 'รองรับ 24 ชม.', bg: '#dbeafe', color: '#1d4ed8' },
    { icon: <Star size={13} />, label: 'ครบทุกเกม', bg: '#ede9fe', color: '#5b21b6' },
  ]
  return (
    <div className="bg-white border border-border rounded-2xl py-3.5 px-6 flex flex-wrap justify-around gap-3" style={{ boxShadow: '0 2px 12px rgba(37,99,235,0.06)' }}>
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-[12px] font-semibold" style={{ color: '#1d4ed8' }}>
          <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: item.bg, color: item.color }}>{item.icon}</span>
          {item.label}
        </div>
      ))}
    </div>
  )
}

function SectionHeader({ icon, title, href, sub, accent }: { icon: React.ReactNode; title: string; href?: string; sub?: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: accent ?? 'linear-gradient(135deg, #2563eb, #06b6d4)' }}>{icon}</span>
        <div>
          <h2 className="text-[15px] font-bold tracking-tight text-[#1a1028] leading-tight">{title}</h2>
          {sub && <p className="text-[11px] text-muted-foreground leading-tight">{sub}</p>}
        </div>
      </div>
      {href && (
        <Link href={href}>
          <button className="text-[12px] font-semibold text-primary flex items-center gap-0.5 px-3 py-1.5 rounded-lg hover:bg-primary/8 transition-colors">ดูทั้งหมด <ChevronRight size={12} /></button>
        </Link>
      )}
    </div>
  )
}

function GameCard({ game }: { game: typeof GAMES[0] }) {
  const [err, setErr] = useState(false)
  const hasDiscount = game.topPack.was !== undefined
  return (
    <Link href={game.href}>
      <div className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1.5" style={{ border: '1px solid #e0f2fe', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 32px ${game.colorA}28, 0 0 0 1.5px ${game.colorA}50` }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)' }}>
        <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${game.colorA}, ${game.colorB})` }} />
        <div className="flex flex-col items-center pt-3.5 pb-1 px-2 gap-2">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-200 group-hover:scale-110 group-hover:rotate-1" style={{ background: `linear-gradient(135deg, ${game.colorA}, ${game.colorB})`, boxShadow: `0 4px 14px ${game.colorA}45` }}>
            {!err ? <img src={game.logo} alt={game.name} loading="lazy" className="w-full h-full object-cover" onError={() => setErr(true)} /> : <span className="text-white text-[10px] font-black">{game.fallback}</span>}
          </div>
          <div className="text-[11px] font-bold text-[#1a1028] leading-tight truncate w-full text-center px-1">{game.name}</div>
        </div>
        <div className="mx-2 mb-2.5 mt-1 rounded-lg px-2 py-1.5" style={{ background: `${game.colorA}12`, border: `1px solid ${game.colorA}25` }}>
          <div className="text-[8.5px] font-semibold leading-none mb-0.5 truncate" style={{ color: game.colorA }}>{game.topPack.label}</div>
          <div className="flex items-baseline gap-1">
            <span className="text-[12px] font-extrabold leading-none" style={{ color: game.colorA }}>{game.topPack.price}</span>
            {hasDiscount && <span className="text-[9px] line-through leading-none" style={{ color: `${game.colorA}60` }}>{game.topPack.was}</span>}
            {hasDiscount && <span className="ml-auto text-[7.5px] font-bold px-1 py-0.5 rounded-full leading-none" style={{ background: `${game.colorA}22`, color: game.colorA }}>ถูกกว่า</span>}
          </div>
        </div>
        {game.tag && <div className="absolute top-2 right-2 text-[8px] font-bold text-white px-1.5 py-0.5 rounded-full leading-tight" style={{ background: game.tagColor }}>{game.tag}</div>}
      </div>
    </Link>
  )
}

function AccountCard({ item }: { item: any }) {
  const [err, setErr] = useState(false)
  const [hovered, setHovered] = useState(false)

  const logo = item.logo ?? item.images?.[0] ?? ''
  const screenshot = item.screenshot ?? item.images?.[1] ?? null
  const gameName = item.game ?? item.category?.toUpperCase() ?? ''
  const title = item.rank ?? item.title ?? ''
  const priceNum = typeof item.price === 'number' ? item.price : parseFloat(item.price) || 0
  const priceStr = `฿${priceNum.toLocaleString()}`
  const wasStr = item.was ?? (item.original_price ? `฿${Number(item.original_price).toLocaleString()}` : null)
  const badgeText = item.badge ?? item.status ?? ''
  const badgeColor = item.badgeColor ?? '#16a34a'
  const desc = item.highlight ?? item.description ?? ''

  const categoryColors: Record<string, [string, string]> = {
    rov:       ['#ef4444', '#991b1b'],
    freefire:  ['#f97316', '#c2410c'],
    efootball: ['#2563eb', '#1e3a8a'],
    pubg:      ['#ca8a04', '#78350f'],
    mlbb:      ['#2563eb', '#1e3a8a'],
    valorant:  ['#dc2626', '#450a0a'],
  }
  const [cA, cB] = categoryColors[item.category] ?? [item.colorA ?? '#2563eb', item.colorB ?? '#1e3a8a']

  return (
    <Link href={`/products/${item.id}`}>
      <div
        className="group relative bg-white rounded-3xl overflow-hidden cursor-pointer"
        style={{
          border: hovered ? `2px solid ${cA}` : '2px solid #e0eaff',
          boxShadow: hovered
            ? `0 32px 64px ${cA}30, 0 0 0 1px ${cA}20`
            : '0 4px 20px rgba(37,99,235,0.08)',
          transform: hovered ? 'translateY(-10px) scale(1.02)' : 'translateY(0) scale(1)',
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* ── Header ── */}
        <div className="relative overflow-hidden" style={{ height: 160 }}>
          {/* bg รูปหรือ gradient */}
          {screenshot ? (
            <img src={screenshot} alt="" className="absolute inset-0 w-full h-full object-cover"
              style={{ transform: hovered ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.5s ease' }} />
          ) : (
            <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${cA} 0%, ${cB} 100%)` }} />
          )}

          {/* gradient overlay */}
          <div className="absolute inset-0" style={{
            background: `linear-gradient(to bottom, ${cA}99 0%, ${cB}ee 100%)`,
          }} />

          {/* shimmer effect on hover */}
          {hovered && (
            <div className="absolute inset-0 pointer-events-none" style={{
              background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
              animation: 'shimmer 1.5s infinite',
            }} />
          )}

          {/* content */}
          <div className="absolute inset-0 flex flex-col justify-between p-4">
            {/* top row */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {/* logo */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white/40"
                  style={{ boxShadow: '0 6px 20px rgba(0,0,0,0.4)' }}>
                  {logo && !err
                    ? <img src={logo} alt={gameName} loading="lazy" className="w-full h-full object-cover" onError={() => setErr(true)} />
                    : <div className="w-full h-full flex items-center justify-center text-white font-black text-[13px]"
                        style={{ background: `linear-gradient(135deg, ${cA}, ${cB})` }}>
                        {gameName.slice(0, 2)}
                      </div>
                  }
                </div>
                <div>
                  <div className="text-white font-extrabold text-[16px] leading-tight drop-shadow-md">{gameName}</div>
                  <div className="text-white/70 text-[12px] mt-0.5">{title}</div>
                </div>
              </div>
              {/* badge */}
              <span className="text-[9px] font-black text-white px-2.5 py-1 rounded-full uppercase tracking-wide"
                style={{ background: badgeColor, boxShadow: `0 2px 10px ${badgeColor}80` }}>
                {badgeText}
              </span>
            </div>

            {/* bottom — price preview */}
            <div className="flex items-end justify-between">
              <div>
                <div className="text-white/60 text-[10px] font-semibold mb-0.5">ราคา</div>
                <div className="text-white font-extrabold text-[22px] leading-none drop-shadow-md">{priceStr}</div>
                {wasStr && <div className="text-white/50 text-[11px] line-through mt-0.5">{wasStr}</div>}
              </div>
              {/* hover arrow */}
              <div className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300"
                style={{
                  background: hovered ? '#fff' : 'rgba(255,255,255,0.2)',
                  transform: hovered ? 'scale(1.15)' : 'scale(1)',
                }}>
                <ChevronRight size={18} style={{ color: hovered ? cA : '#fff' }} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
       {/* Body */}
<div className="p-4">

  {/* highlight tags จาก tags array */}
  {(() => {
  const details = item.details ?? {}
  const highlights = [
    details.rank       ? `🏆 ${details.rank}`       : null,
    details.heroCount  ? `🎮 ${details.heroCount}`   : null,
    details.skinCount  ? `✨ ${details.skinCount}`   : null,
    details.highlight1 ? `💎 ${details.highlight1}`  : null,
    details.highlight2 ? `🔥 ${details.highlight2}`  : null,
  ].filter(Boolean)
  return highlights.length > 0 ? (
    <div className="flex flex-wrap gap-1.5 mb-3">
      {highlights.map((h, i) => (
        <span key={i} className="text-[11px] font-bold px-2.5 py-1 rounded-full"
          style={{ background: `${cA}15`, color: cA, border: `1px solid ${cA}30` }}>
          {h}
        </span>
      ))}
    </div>
  ) : null
})()}
  {/* description */}
  {desc && (
    <p className="text-[12px] text-slate-500 leading-relaxed line-clamp-3 mb-3">{desc}</p>
  )}

  {/* price + CTA */}
  <div className="flex items-center justify-between mt-2">
    <div>
      <div className="text-[20px] font-extrabold leading-none" style={{ color: cA }}>{priceStr}</div>
      {wasStr && (
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-slate-400 line-through">{wasStr}</span>
          {item.original_price && (
            <span className="text-[9px] font-black text-white px-1.5 py-0.5 rounded-full"
              style={{ background: '#ef4444' }}>
              -{Math.round((1 - priceNum / Number(item.original_price)) * 100)}%
            </span>
          )}
        </div>
      )}
    </div>
    <button className="text-[12px] font-extrabold px-4 py-2.5 rounded-xl text-white"
      style={{ background: `linear-gradient(90deg, ${cA}, ${cB})`, boxShadow: `0 4px 12px ${cA}45` }}>
      ดูรายละเอียด →
    </button>
  </div>
</div>

        {/* bottom accent line */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
          background: `linear-gradient(90deg, ${cA}, ${cB})`,
          transform: hovered ? 'scaleX(1)' : 'scaleX(0)',
          transformOrigin: 'left',
          transition: 'transform 0.4s ease',
        }} />

        <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
      </div>
    </Link>
  )
}

function GachaCard({ pool }: { pool: typeof GACHA_POOLS[0] }) {
  const [err, setErr] = useState(false)
  return (
    <Link href={`/gacha/${pool.id}`}>
      <div className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl" style={{ border: '1px solid #e0f2fe', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 40px ${pool.colorA}30, 0 0 0 1.5px ${pool.colorA}50` }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)' }}>
        <div className="relative flex flex-col items-center pt-5 pb-3 px-4" style={{ background: `linear-gradient(160deg, ${pool.colorA}22, ${pool.colorB}10)` }}>
          <div className="w-14 h-14 rounded-2xl overflow-hidden mb-2 transition-transform duration-200 group-hover:scale-110" style={{ boxShadow: `0 6px 20px ${pool.colorA}50`, border: `2px solid ${pool.colorA}40` }}>
            {!err ? <img src={pool.logo} alt={pool.game} loading="lazy" className="w-full h-full object-cover" onError={() => setErr(true)} /> : <div className="w-full h-full flex items-center justify-center font-black text-sm" style={{ background: `linear-gradient(135deg, ${pool.colorA}, ${pool.colorB})`, color: '#fff' }}>{pool.fallback}</div>}
          </div>
          <div className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center" style={{ background: `${pool.colorA}20`, color: pool.colorA }}><Shuffle size={12} /></div>
          <div className="text-[12px] font-extrabold text-[#1a1028] text-center leading-tight">{pool.title}</div>
        </div>
        <div className="px-3 pb-3">
          <div className="flex flex-col gap-1 my-2.5">
            {pool.items.map((item, i) => {
              const colors = ['#64748b', '#2563eb', pool.colorA, pool.rareColor]
              return (
                <div key={i} className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}><div className="h-full rounded-full transition-all" style={{ width: `${pool.rates[i]}%`, background: colors[i] }} /></div>
                  <span className="text-[9px] font-semibold w-20 truncate" style={{ color: colors[i] }}>{item}</span>
                  <span className="text-[9px] font-bold w-6 text-right" style={{ color: colors[i] }}>{pool.rates[i]}%</span>
                </div>
              )
            })}
          </div>
          <div className="flex items-center gap-1.5 mb-2.5 px-2 py-1.5 rounded-lg" style={{ background: `${pool.rareColor}15` }}>
            <span className="text-[10px]">⭐</span>
            <span className="text-[9px] font-bold" style={{ color: pool.rareColor }}>รางวัลสูงสุด: {pool.rareLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[16px] font-extrabold" style={{ color: pool.colorA }}>{pool.price}</span>
            <button className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-xl text-white transition-all hover:scale-105" style={{ background: `linear-gradient(90deg, ${pool.colorA}, ${pool.colorB})` }}><Shuffle size={11} />สุ่มเลย!</button>
          </div>
        </div>
      </div>
    </Link>
  )
}
// เพิ่มต่อจาก FlashTimer component
function FlashSaleBanner() {
  const secs = useFlashSecs()
  const vals = [
    Math.floor(secs / 3600).toString().padStart(2, '0'),
    Math.floor((secs % 3600) / 60).toString().padStart(2, '0'),
    (secs % 60).toString().padStart(2, '0'),
  ]
  return (
    <div className="rounded-2xl px-5 py-3 mb-5 flex items-center gap-4"
      style={{ background: 'linear-gradient(90deg, #1a0a0a, #2d0a0a)', border: '1px solid #ef444430' }}>
      <div className="flex items-center gap-2">
        <Zap size={14} style={{ color: '#fbbf24' }} />
        <span className="text-[11px] font-bold text-white">Flash Sale หมดเวลา</span>
      </div>
      <div className="flex items-center gap-1.5">
        {vals.map((v, i) => (
          <div key={i} className="flex items-center gap-1">
            <span className="text-[13px] font-black text-white px-2 py-1 rounded-lg tabular-nums"
              style={{ background: '#ef4444', minWidth: 34, textAlign: 'center' }}>{v}</span>
            {i < 2 && <span className="text-[11px] font-black text-red-400">:</span>}
          </div>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-1.5">
        <Percent size={11} style={{ color: '#fbbf24' }} />
        <span className="text-[10px] font-bold" style={{ color: '#fbbf24' }}>ส่วนลดสูงสุดในรอบนี้</span>
      </div>
    </div>
  )
}
// ── NEW: Sale Product Card — big, loud, impossible to ignore ──────────
function SaleProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false)

  const discount =
    product.discount_percent ??
    (product.original_price && product.original_price > product.price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : null)

  const imageUrl = product.images?.[0] ?? null
  const saving = product.original_price && product.original_price > product.price
    ? product.original_price - product.price
    : null

  return (
    <Link href="/products">
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer group"
        style={{
          background: '#fff',
          border: hovered ? '2px solid #ef4444' : '2px solid #ffe4e4',
          boxShadow: hovered
            ? '0 24px 48px rgba(239,68,68,0.22), 0 0 0 1px #ef444420'
            : '0 4px 16px rgba(239,68,68,0.08)',
          transform: hovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
          transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Hot stripe top */}
        <div style={{ height: 4, background: 'linear-gradient(90deg, #ef4444, #f97316, #fbbf24)', backgroundSize: '200% 100%', animation: hovered ? 'shimmer 1.2s linear infinite' : 'none' }} />

        {/* Image */}
        <div className="relative overflow-hidden" style={{ aspectRatio: '1/1', background: 'linear-gradient(135deg, #fff5f5, #fff7ed)' }}>
          {imageUrl ? (
            <img src={imageUrl} alt={product.title} loading="lazy" className="w-full h-full object-cover"
              style={{ transform: hovered ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.5s ease' }} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #ffe4e6, #fef3c7)' }}>
              <Tag size={28} style={{ color: '#f87171', opacity: 0.5 }} />
            </div>
          )}

          {/* Dark overlay on hover */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)',
            opacity: hovered ? 1 : 0, transition: 'opacity 0.3s',
          }} />

          {/* Discount badge — BIG */}
          {discount != null && discount > 0 && (
            <div className="absolute top-0 left-0 z-10">
              <div style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                color: '#fff', fontWeight: 900,
                fontSize: 15, lineHeight: 1,
                padding: '8px 10px 6px',
                borderBottomRightRadius: 12,
                boxShadow: '2px 2px 12px rgba(239,68,68,0.5)',
              }}>
                -{discount}%
              </div>
            </div>
          )}

          {/* Saving pill */}
          {saving && (
            <div className="absolute top-2 right-2 z-10">
              <span style={{
                fontSize: 9, fontWeight: 800,
                background: '#fef9c3', color: '#92400e',
                padding: '3px 7px', borderRadius: 999,
                border: '1px solid #fde047',
                display: 'block',
              }}>ประหยัด ฿{saving.toLocaleString()}</span>
            </div>
          )}

          {/* Quick view */}
          <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center pb-3"
            style={{ opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(10px)', transition: 'all 0.25s ease' }}>
            <span style={{
              fontSize: 11, fontWeight: 800, color: '#fff',
              padding: '6px 18px', borderRadius: 999,
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              boxShadow: '0 4px 16px rgba(239,68,68,0.55)',
            }}>ดูสินค้า →</span>
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: '10px 12px 12px' }}>
          <p style={{
            fontSize: 12, fontWeight: 600, color: '#1e293b', lineHeight: 1.5,
            marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.8em',
          }}>{product.title}</p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 4 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {product.original_price && product.original_price > product.price && (
                <span style={{ fontSize: 10, color: '#94a3b8', textDecoration: 'line-through', lineHeight: 1 }}>
                  ฿{product.original_price.toLocaleString()}
                </span>
              )}
              <span style={{ fontSize: 18, fontWeight: 900, color: '#ef4444', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                ฿{product.price.toLocaleString()}
              </span>
            </div>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: hovered ? 'linear-gradient(135deg, #ef4444, #f97316)' : '#fff5f5',
              border: '1.5px solid #fca5a5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}>
              <ShoppingCart size={14} style={{ color: hovered ? '#fff' : '#ef4444' }} />
            </div>
          </div>
        </div>

        <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
      </div>
    </Link>
  )
}

function SaleProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ border: '2px solid #ffe4e4' }}>
      <div style={{ height: 4, background: '#fecaca' }} />
      <div style={{ aspectRatio: '1/1', background: 'linear-gradient(135deg, #fff5f5, #fef3c7)' }} />
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ height: 11, background: '#ffe4e6', borderRadius: 6, marginBottom: 6, width: '80%' }} />
        <div style={{ height: 11, background: '#ffe4e6', borderRadius: 6, marginBottom: 10, width: '55%' }} />
        <div style={{ height: 20, background: '#fca5a5', borderRadius: 6, width: '45%' }} />
      </div>
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false)

  const discount =
    product.discount_percent ??
    (product.original_price && product.original_price > product.price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : null)

  const imageUrl = product.images?.[0] ?? null
  const saving = product.original_price && product.original_price > product.price
    ? product.original_price - product.price
    : null

  return (
    <Link href={`/products/${product.id}`}>
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background: '#fff',
          border: '1.5px solid #e0eaff',
          boxShadow: hovered ? '0 20px 40px rgba(37,99,235,0.18), 0 0 0 2px #2563eb40' : '0 2px 12px rgba(37,99,235,0.07)',
          transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
          transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative overflow-hidden" style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg, #e0eaff 0%, #f0f4ff 100%)' }}>
          {imageUrl ? (
            <img src={imageUrl} alt={product.title} loading="lazy" className="w-full h-full object-cover"
              style={{ transform: hovered ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.5s ease' }} />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2" style={{ background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)' }}>
              <ShoppingCart size={32} style={{ color: '#93c5fd', opacity: 0.6 }} />
              <span style={{ fontSize: 10, color: '#a5b4fc', fontWeight: 600 }}>ไม่มีรูปภาพ</span>
            </div>
          )}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 55%)', opacity: hovered ? 1 : 0, transition: 'opacity 0.3s' }} />
         // เดิม
{discount != null && discount > 0 && (
 <div className="absolute top-0 left-0 z-10">
  {discount != null && discount > 0 ? (
    <div style={{
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: '#fff', fontWeight: 900,
      fontSize: 15, lineHeight: 1,
      padding: '8px 10px 6px',
      borderBottomRightRadius: 12,
      boxShadow: '2px 2px 12px rgba(239,68,68,0.5)',
    }}>
      -{discount}%
    </div>
  ) : (
    <div style={{
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: '#fff', fontWeight: 900,
      fontSize: 11, lineHeight: 1,
      padding: '6px 10px',
      borderBottomRightRadius: 12,
      boxShadow: '2px 2px 12px rgba(239,68,68,0.5)',
    }}>
      🔥 SALE
    </div>
  )}
</div>
)}

// ใหม่
<div className="absolute top-0 left-0 z-10">
  {discount != null && discount > 0 ? (
    <div style={{
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: '#fff', fontWeight: 900,
      fontSize: 15, lineHeight: 1,
      padding: '8px 10px 6px',
      borderBottomRightRadius: 12,
      boxShadow: '2px 2px 12px rgba(239,68,68,0.5)',
    }}>
      -{discount}%
    </div>
  ) : (
    <div style={{
      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: '#fff', fontWeight: 900,
      fontSize: 11, lineHeight: 1,
      padding: '6px 10px',
      borderBottomRightRadius: 12,
      boxShadow: '2px 2px 12px rgba(239,68,68,0.5)',
    }}>
      🔥 SALE
    </div>
  )}
</div>
          <div className="absolute bottom-0 left-0 right-0 z-10 flex justify-center pb-3"
            style={{ opacity: hovered ? 1 : 0, transform: hovered ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.25s ease' }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', padding: '6px 18px', borderRadius: 999, background: 'linear-gradient(135deg, #2563eb, #06b6d4)', boxShadow: '0 4px 16px rgba(37,99,235,0.55)', letterSpacing: '0.04em' }}>ดูสินค้า →</span>
          </div>
        </div>
        <div style={{ padding: '12px 14px 14px' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.8em' }}>{product.title}</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 17, fontWeight: 900, color: '#2563eb', letterSpacing: '-0.02em' }}>฿{product.price.toLocaleString()}</span>
              {product.original_price && product.original_price > product.price && (
                <span style={{ fontSize: 11, color: '#94a3b8', textDecoration: 'line-through' }}>฿{product.original_price.toLocaleString()}</span>
              )}
            </div>
            {saving ? (
              <span style={{ fontSize: 9, fontWeight: 800, color: '#15803d', background: '#dcfce7', padding: '3px 8px', borderRadius: 999, border: '1px solid #bbf7d0', whiteSpace: 'nowrap' }}>ประหยัด ฿{saving.toLocaleString()}</span>
            ) : product.is_on_sale ? (
              <span style={{ fontSize: 9, fontWeight: 800, color: '#854d0e', background: '#fef9c3', padding: '3px 8px', borderRadius: 999, border: '1px solid #fde047', whiteSpace: 'nowrap' }}>🏷️ โปร</span>
            ) : null}
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, #2563eb, #06b6d4)', transform: hovered ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.3s ease' }} />
      </div>
    </Link>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden animate-pulse" style={{ border: '1.5px solid #e0eaff' }}>
      <div style={{ aspectRatio: '4/3', background: 'linear-gradient(135deg, #dbeafe, #ede9fe)' }} />
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ height: 12, background: '#e0eaff', borderRadius: 6, marginBottom: 8, width: '75%' }} />
        <div style={{ height: 12, background: '#e0eaff', borderRadius: 6, marginBottom: 12, width: '50%' }} />
        <div style={{ height: 18, background: '#bfdbfe', borderRadius: 6, width: '40%' }} />
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────
export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [saleProducts, setSaleProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [accountItems, setAccountItems] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const { data: cats } = await supabase.from('categories').select('id, name, slug, icon').order('name')
        if (cats) setCategories(cats)

       const { data: sale } = await supabase
        .from('products')
        .select('id, title, price, original_price, images, is_on_sale, discount_percent, sale_expires_at, category_id, categories(name, slug)')
        .eq('is_on_sale', true)
        .eq('status', 'available')
        .or('sale_expires_at.is.null,sale_expires_at.gt.now()')
        .order('discount_percent', { ascending: false })
        .limit(8)
        
        if (sale) setSaleProducts(sale as unknown as Product[])
   const { data: accounts } = await supabase
  .from('products')
  .select('*')
  .eq('type', 'account')
  .eq('status', 'available')
  .eq('is_featured', true)
  .limit(6)

if (accounts) setAccountItems(accounts)
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

          <Ticker />
          <Hero />
          <TrustBar />

          {/* ── 1. เติมเกมยอดนิยม — FIRST ── */}
          <section>
            <SectionHeader icon={<Zap size={13} />} title="เติมเกมยอดนิยม" sub="เติมเหรียญ / เพชร / UC ได้ทันที" href="/products" />
            <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-2.5">
              {GAMES.map(g => <GameCard key={g.id} game={g} />)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
              {GAMES.filter(g => g.tag).slice(0, 3).map(g => (
                <Link key={g.id} href={g.href}>
                  <div className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.018] hover:shadow-2xl" style={{ background: `linear-gradient(130deg, ${g.colorA} 0%, ${g.colorB} 100%)`, minHeight: 110 }}>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 font-black leading-none select-none pointer-events-none" style={{ fontSize: 64, color: 'rgba(255,255,255,0.08)' }}>{g.fallback}</div>
                    <div className="relative z-10 flex items-center gap-4 p-5 h-full">
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0" style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
                        <img src={g.logo} alt={g.name} loading="lazy" className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="inline-block text-[9px] font-bold mb-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>{g.tag}</span>
                        <div className="text-white font-extrabold text-[15px] leading-tight">{g.name}</div>
                        <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>เติม{g.currency} ราคาพิเศษ</div>
                        <div className="flex items-baseline gap-1.5 mt-1.5">
                          <span className="text-white font-extrabold text-[14px]">{g.topPack.price}</span>
                          {g.topPack.was && <span className="text-[10px] line-through" style={{ color: 'rgba(255,255,255,0.45)' }}>{g.topPack.was}</span>}
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>{g.topPack.label}</span>
                        </div>
                      </div>
                      <div className="ml-auto w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.18)' }}><ChevronRight size={14} className="text-white" /></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* ── 2. ลดราคา — NEW BOLD LAYOUT ── */}
          <section>
            {/* Header with animated badge */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', boxShadow: '0 4px 12px rgba(239,68,68,0.45)' }}>
                    <Flame size={15} />
                  </div>
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 border-2 border-white animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-[16px] font-extrabold tracking-tight text-[#1a1028]">ลดราคา / โปรโมชั่น</h2>
                    <span className="text-[9px] font-black text-white px-2 py-0.5 rounded-full animate-pulse"
                      style={{ background: 'linear-gradient(90deg, #ef4444, #f97316)' }}>🔥 HOT</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">สินค้าลดราคา ส่งทันที — จำกัดเวลา</p>
                </div>
              </div>
              <Link href="/products?sale=true">
                <button className="text-[12px] font-bold flex items-center gap-1 px-3 py-1.5 rounded-xl text-white transition-all hover:opacity-90"
                  style={{ background: 'linear-gradient(90deg, #ef4444, #f97316)' }}>
                  ดูทั้งหมด <ChevronRight size={12} />
                </button>
              </Link>
            </div>

            {/* Flash sale timer banner */}

              <FlashSaleBanner />

            {/* Sale grid — 1:1 cards, bigger discount emphasis */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {Array.from({ length: 8 }).map((_, i) => <SaleProductCardSkeleton key={i} />)}
              </div>
            ) : saleProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {saleProducts.map(p => <SaleProductCard key={p.id} product={p} />)}
              </div>
            ) : (
              <div className="rounded-2xl py-14 text-center" style={{ border: '2px dashed #fca5a5', background: '#fff5f5' }}>
                <Flame className="mx-auto mb-3 opacity-20" size={36} style={{ color: '#ef4444' }} />
                <p className="text-sm text-muted-foreground mb-3">ยังไม่มีสินค้าลดราคาในขณะนี้</p>
                <Link href="/products"><Button variant="ghost" size="sm">ดูสินค้าทั้งหมด</Button></Link>
              </div>
            )}
          </section>

          {/* ── 3. ซื้อ-ขายไอดี ── */}
          <section>
            <SectionHeader icon={<Key size={13} />} title="ซื้อ-ขายไอดีเกม" sub="ไอดีมือสอง ยืนยันแล้ว ปลอดภัย 100%" href="/accounts" />
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[{ step: '1', label: 'เลือกไอดี', icon: '🎮', color: '#2563eb' }, { step: '2', label: 'ตรวจสอบข้อมูล', icon: '🔍', color: '#7c3aed' }, { step: '3', label: 'ชำระเงิน', icon: '💳', color: '#16a34a' }, { step: '4', label: 'รับรหัสทันที', icon: '⚡', color: '#ca8a04' }].map(s => (
                <div key={s.step} className="flex items-center gap-2 shrink-0 rounded-xl px-3 py-2" style={{ background: `${s.color}10`, border: `1px solid ${s.color}25` }}>
                  <span className="text-base">{s.icon}</span>
                  <div>
                    <div className="text-[8px] font-bold" style={{ color: s.color }}>ขั้นตอนที่ {s.step}</div>
                    <div className="text-[10px] font-semibold text-[#1a1028]">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {accountItems.map(item => (
  <AccountCard key={item.id} item={item} />
))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/accounts"><Button variant="outline" className="rounded-xl font-semibold text-sm">ดูไอดีทั้งหมด <ChevronRight size={14} className="ml-1" /></Button></Link>
            </div>
          </section>

          {/* ── 4. ตู้สุ่มไอดี ── */}
          <section>
            <SectionHeader icon={<Shuffle size={13} />} title="ตู้สุ่มไอดีเกม" sub="ลุ้นรับไอดีหายาก เริ่มต้นหลักร้อย" href="/gacha" />
            <div className="rounded-xl px-4 py-2.5 mb-4 flex items-center gap-2.5" style={{ background: '#fef9c3', border: '1px solid #fde047' }}>
              <span className="text-base shrink-0">⚠️</span>
              <p className="text-[11px] font-semibold text-[#854d0e]">ผลการสุ่มเป็นแบบสุ่มจริง — อัตราการได้รับแสดงด้านล่างแต่ละตู้ ซื้อตามกำลังทรัพย์</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {GACHA_POOLS.map(pool => <GachaCard key={pool.id} pool={pool} />)}
            </div>
            <Link href="/gacha">
              <div className="relative mt-4 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-2xl hover:shadow-violet-500/20 hover:-translate-y-0.5" style={{ background: 'linear-gradient(130deg, #5b21b6 0%, #4338ca 55%, #0f172a 100%)', minHeight: 90 }}>
                <div className="relative z-10 flex items-center gap-6 px-8 py-5">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[15px] font-extrabold text-white mb-0.5">ลองดวงตู้ Item สุดพิเศษ</h3>
                    <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.58)' }}>ไม่ใช่แค่ไอดี — สุ่มรับไอเทม สกิน และอื่นๆ อีกมาก</p>
                  </div>
                  <button className="shrink-0 px-5 py-2 rounded-xl text-sm font-bold" style={{ background: '#fff', color: '#4f46e5' }}>ดูตู้ทั้งหมด</button>
                </div>
              </div>
            </Link>
          </section>

          {/* ── 5. Categories ── */}
          {categories.length > 0 && (
            <section>
              <SectionHeader icon={<Package size={13} />} title="หมวดหมู่สินค้า" href="/products" />
              <div className="flex flex-wrap gap-2">
                <Link href="/products"><Badge variant="outline" className="px-4 py-1.5 text-xs font-semibold cursor-pointer hover:bg-primary hover:text-white hover:border-primary transition-colors rounded-full">ทั้งหมด</Badge></Link>
                {categories.map(cat => (
                  <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                    <Badge variant="outline" className="px-4 py-1.5 text-xs font-semibold cursor-pointer hover:bg-primary hover:text-white hover:border-primary transition-colors rounded-full">{cat.name}</Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* ── 6. Quick Links ── */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-4">
            {[
              { href: '/wallet', icon: <CreditCard size={17} />, iconBg: '#dcfce7', iconColor: '#15803d', title: 'เติมเงินกระเป๋า', sub: 'เพิ่มเครดิตเพื่อซื้อสินค้า' },
              { href: '/orders', icon: <ShoppingCart size={17} />, iconBg: '#dbeafe', iconColor: '#1d4ed8', title: 'ประวัติคำสั่งซื้อ', sub: 'ตรวจสอบสถานะออร์เดอร์' },
              { href: '/profile', icon: <Star size={17} />, iconBg: '#fef9c3', iconColor: '#854d0e', title: 'โปรไฟล์ของฉัน', sub: 'จัดการข้อมูลส่วนตัว' },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div className="group bg-white border border-border rounded-2xl p-4 flex items-center gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/8">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.iconBg, color: item.iconColor }}>{item.icon}</div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-[#1a1028] leading-tight">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{item.sub}</p>
                  </div>
                  <ChevronRight size={13} className="ml-auto text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
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
