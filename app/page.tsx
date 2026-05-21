'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback, useRef } from 'react'
import { ShoppingCart, ChevronRight, ChevronLeft, Zap, Star, Shield, Clock, CreditCard, Shuffle, Package, Tag, Gamepad2, ChevronDown, CheckCircle2, Trophy, Gift, Crown, Sparkles, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { supabase } from '@/lib/supabase'

// ── Types ────────────────────────────────────────────────────────────
type Category = { id: string; name: string; slug: string; icon?: string }

// ─── Constants ──────────────────────────────────────────────────────
const SLIDES = [
  {
    badge: 'โปรโมชั่นพิเศษ',
    title: 'เติมเกม ซื้อไอเทม',
    highlight: 'ราคาถูกที่สุด',
    sub: 'ครบทุกเกม ส่งทันที 24 ชั่วโมง ปลอดภัย 100%',
    cta: 'เลือกซื้อสินค้า', ctaHref: '/topup',
    cta2: 'ลองดวงตู้สุ่ม', cta2Href: '/gacha',
    gradFrom: '#1e40af', gradMid: '#1d4ed8', gradTo: '#0c4a6e', accentColor: '#06b6d4',
    bgImage: '/gamespic/All1.jfif',
    showContent: false,
  },
  {
    badge: 'HOT DEAL',
    title: 'ROV & Free Fire',
    highlight: 'ลด 30%',
    sub: 'เติมเหรียญ ROV และเพชร Free Fire ราคาพิเศษ จำกัดเวลา',
    cta: 'เติมเกมเลย', ctaHref: '/topup?category=rov',
    cta2: 'ดูโปรทั้งหมด', cta2Href: '/topup',
    gradFrom: '#dc2626', gradMid: '#ea580c', gradTo: '#431407', accentColor: '#fca5a5',
    bgImage: '/gamespic/All2.png',
    showContent: false,
  },
  {
    badge: 'VALORANT & MLBB',
    title: 'เติม VP & Diamond',
    highlight: 'ง่าย จ่ายไว',
    sub: 'VP และ Diamond พร้อมส่งทันทีหลังชำระเงิน ไม่ต้องรอนาน',
    cta: 'เติม Valorant', ctaHref: '/topup?category=valorant',
    cta2: 'เติม MLBB', cta2Href: '/topup?category=mlbb',
    gradFrom: '#0369a1', gradMid: '#4f46e5', gradTo: '#0c0a1e', accentColor: '#93c5fd',
    bgImage: '/gamespic/All3.png',
    showContent: false,
  },
]

const GAMES = [
  { id: 'rov', name: 'ROV', fullName: 'Arena of Valor', logo: '/gamespic/rov.png', fallback: 'RV', colorA: '#ef4444', colorB: '#991b1b', tag: 'ยอดนิยม', tagColor: '#ef4444', currency: 'เหรียญทอง', href: '/topup', topPack: { label: '100 เหรียญ', price: '฿29', was: '฿35' } },
  { id: 'freefire', name: 'Free Fire', fullName: 'Garena', logo: '/gamespic/freefire.jpg', fallback: 'FF', colorA: '#f97316', colorB: '#c2410c', tag: 'ขายดี', tagColor: '#f97316', currency: 'เพชร', href: '/topup?category=freefire', topPack: { label: '70 เพชร', price: '฿19', was: '฿25' } },
  { id: 'undawn', name: 'Undawn', fullName: 'Level Infinite', logo: 'https://play-lh.googleusercontent.com/P6NRhqhWHSJuTkXO7LpMdmjV00eHhj_TqTxRCEYi1kSJGFMi0uQJDFnTzLbxjw3mV4Q=w96-h96', fallback: 'UD', colorA: '#16a34a', colorB: '#14532d', tag: 'ใหม่', tagColor: '#16a34a', currency: 'เพชร', href: '/topup?category=undawn', topPack: { label: '60 เพชร', price: '฿29', was: undefined } },
  { id: 'deltaforce', name: 'Delta Force', fullName: 'Mobile', logo: '/gamespic/delta force.jpg', fallback: 'DF', colorA: '#475569', colorB: '#0f172a', tag: '', tagColor: '', currency: 'บัตรเกม', href: '/topup?category=deltaforce', topPack: { label: 'บัตร ฿50', price: '฿50', was: undefined } },
  { id: 'codm', name: 'Call of Duty', fullName: 'Mobile', logo: 'https://play-lh.googleusercontent.com/9wGk5pUHsZBWXf9tPtEUKrJAE5PqZFpXxjVBQBIMx2cGvq7yFpOwMBfNkMjpO7FW4g=w96-h96', fallback: 'COD', colorA: '#b45309', colorB: '#451a03', tag: '', tagColor: '', currency: 'CP', href: '/topup?category=codm', topPack: { label: '80 CP', price: '฿35', was: '฿45' } },
  { id: 'haikyu', name: 'HAIKYU!!', fullName: 'Fly High', logo: 'https://play-lh.googleusercontent.com/Fc-xbXDR4rwkFCLGFVcHW-Rb3Tj1gFnj3yJgKN5vSaTIU1MDq5ABZIJ_M0xzIrv7qQ=w96-h96', fallback: 'HQ', colorA: '#ea580c', colorB: '#7c2d12', tag: 'ใหม่', tagColor: '#ea580c', currency: 'คูปอง', href: '/topup?category=haikyu', topPack: { label: '60 คูปอง', price: '฿29', was: undefined } },
  { id: 'pubg', name: 'PUBG Mobile', fullName: 'Krafton', logo: 'https://play-lh.googleusercontent.com/JRd05pyBH41qjgsJuWduRJpDeZG0Hnb0yjf2nWqO7VaGKL10-G5UIygxED-WNOgHuA=w96-h96', fallback: 'PUBG', colorA: '#ca8a04', colorB: '#78350f', tag: '', tagColor: '', currency: 'UC', href: '/topup?category=pubg', topPack: { label: '60 UC', price: '฿35', was: '฿42' } },
  { id: 'mlbb', name: 'Mobile Legends', fullName: 'Bang Bang', logo: '/gamespic/mlbb.jpg', fallback: 'ML', colorA: '#2563eb', colorB: '#1e3a8a', tag: 'ยอดนิยม', tagColor: '#2563eb', currency: 'Diamond', href: '/topup?category=mlbb', topPack: { label: '86 Diamond', price: '฿29', was: '฿35' } },
  { id: 'valorant', name: 'Valorant', fullName: 'Riot Games', logo: 'https://play-lh.googleusercontent.com/VKLY97mE7r2-xHHnKSPvI5OPNXwKJKS7yFoXMBjBjbQbOAZeUJDxVyoJHW29-eTww=w96-h96', fallback: 'VAL', colorA: '#dc2626', colorB: '#450a0a', tag: '', tagColor: '', currency: 'VP', href: '/topup?category=valorant', topPack: { label: '475 VP', price: '฿89', was: '฿110' } },
  { id: 'heartopia', name: 'Heartopia', fullName: 'เฉพาะเพชร', logo: 'https://play-lh.googleusercontent.com/q_NKzGJwb5nlfVjxWlR9f4Y4-LGdM1l-EMNHjCkuCIGb-UtQ5VZ9FH7s2U4IyBEALQ=w96-h96', fallback: 'HT', colorA: '#a21caf', colorB: '#581c87', tag: 'เพชรเท่านั้น', tagColor: '#a21caf', currency: 'เพชร', href: '/topup?category=heartopia', topPack: { label: '60 เพชร', price: '฿29', was: undefined } },
]

const GACHA_POOLS = [
  {
    id: 'pool-freefire', game: 'Free Fire',
    colorA: '#f97316', colorB: '#c2410c',
    logo: '/gamespic/freefire.jpg', fallback: 'FF',
    title: 'ตู้สุ่มไอดี Free Fire', subtitle: 'ลุ้นไอดี Heroic • สกิน Epic+',
    price: '฿99',
    items: ['ไอดีทั่วไป', 'ไอดีสกิน 5+', 'ไอดี Diamond III+', 'ไอดี Heroic ⭐'],
    rates: [50, 30, 15, 5], rareLabel: 'Heroic', rareColor: '#fbbf24',
    features: ['ยืนยันทุกไอดี', 'ส่งทันทีหลังซื้อ', 'รับประกัน 24 ชม.'], emoji: '💎',
  },
  {
    id: 'pool-rov', game: 'ROV',
    colorA: '#ef4444', colorB: '#991b1b',
    logo: '/gamespic/rov.png', fallback: 'RV',
    title: 'ตู้สุ่มไอดี ROV', subtitle: 'ลุ้นไอดี Conqueror • สกิน Legendary',
    price: '฿129',
    items: ['ไอดีทั่วไป', 'ไอดีสกิน 5+', 'ไอดี Diamond V+', 'ไอดี Conqueror ⭐'],
    rates: [50, 28, 17, 5], rareLabel: 'Conqueror', rareColor: '#fbbf24',
    features: ['ไอดีแท้ 100%', 'ตรวจสอบได้', 'รับประกัน 24 ชม.'], emoji: '👑',
  },
  {
    id: 'pool-pes', game: 'eFootball (PES)',
    colorA: '#2563eb', colorB: '#1e3a8a',
    logo: '/gamespic/pes.jpg', fallback: 'PES',
    title: 'ตู้สุ่มไอดี PES', subtitle: 'ลุ้นไอดี Division 1 • นักเตะ Legendary',
    price: '฿149',
    items: ['ไอดีทั่วไป', 'ไอดีนักเตะ Epic 5+', 'ไอดี Division 2+', 'ไอดี Division 1 ⭐'],
    rates: [45, 30, 20, 5], rareLabel: 'Division 1', rareColor: '#a78bfa',
    features: ['นักเตะครบ', 'ไม่มีประวัติแบน', 'รับประกัน 24 ชม.'], emoji: '⚽',
  },
]

const PROMO_ITEMS = [
  'เติมเพชร Free Fire ราคาถูก ส่งทันที', 'เติมเหรียญ ROV ไม่ต้องรอ',
  'ตู้สุ่มไอดี Free Fire เปิดแล้ว!', 'ตู้สุ่มไอดี ROV ลุ้น Conqueror',
  'ตู้สุ่มไอดี PES ลุ้น Division 1', 'เติม UC PUBG ส่งใน 1 นาที',
  'เติม VP Valorant ปลอดภัย 100%', 'ครบทุกเกม จ่ายง่าย มีทุกช่องทาง',
  'รับประกันทุกออร์เดอร์ บริการ 24/7', 'สะสมแต้มทุกการซื้อ แลกของรางวัลได้!',
]

const LIVE_FEED_ITEMS = [
  { user: 'ปิ๊ก***', game: 'Free Fire', item: '70 เพชร', mins: 1 },
  { user: 'นัท***', game: 'ROV', item: '100 เหรียญ', mins: 2 },
  { user: 'เบส***', game: 'PUBG Mobile', item: '60 UC', mins: 3 },
  { user: 'ฝน***', game: 'Mobile Legends', item: '86 Diamond', mins: 4 },
  { user: 'ต้น***', game: 'Valorant', item: '475 VP', mins: 5 },
  { user: 'แนน***', game: 'Free Fire', item: '140 เพชร', mins: 6 },
  { user: 'โอม***', game: 'MLBB', item: '172 Diamond', mins: 7 },
  { user: 'มิ้น***', game: 'ROV', item: '200 เหรียญ', mins: 8 },
]

const VIP_TIERS = [
  {
    level: 'Bronze', icon: '🥉', minSpend: 0, maxSpend: 499,
    color: '#cd7f32', bg: 'linear-gradient(135deg, #fdf0e8, #fde8d4)',
    border: '#e8a87c',
    perks: ['ซื้อ/สุ่มได้ปกติ', 'ดูประวัติแต้ม', 'แลกของได้ (ถ้ามี balance)', 'ยังไม่มียศ Discord'],
  },
  {
    level: 'Silver', icon: '🥈', minSpend: 500, maxSpend: 1999,
    color: '#94a3b8', bg: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)',
    border: '#94a3b8',
    perks: ['แลกของในร้าน', 'ยศ Silver ใน Discord', 'ห้อง #silver-lounge', 'ping สินค้าใหม่'],
  },
  {
    level: 'Gold', icon: '🥇', minSpend: 2000, maxSpend: 4999,
    color: '#ca8a04', bg: 'linear-gradient(135deg, #fefce8, #fef9c3)',
    border: '#fbbf24',
    perks: ['แลกของ + cashback', 'Early access 24 ชม.', 'ยศ Gold ใน Discord', 'ห้อง #gold-deals', 'Priority support'],
  },
  {
    level: 'VIP', icon: '👑', minSpend: 5000, maxSpend: 99999,
    color: '#7c3aed', bg: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
    border: '#a78bfa',
    perks: ['แลกของ exclusive', 'Early access 72 ชม.', 'ยศ VIP + ชื่อสีพิเศษ', 'ห้อง #vip-only', 'โหวต gacha pool'],
  },
]

const REVIEWS = [
  { name: 'พีช***', game: 'Free Fire', stars: 5, text: 'เร็วมากกก เพชรเข้าทันทีเลย ไม่ต้องรอ ใช้บริการซ้ำทุกเดือนเลยครับ', avatar: '🎮', time: '2 วันที่แล้ว' },
  { name: 'ฟ้า***', game: 'ROV', stars: 5, text: 'ราคาถูกกว่าร้านอื่นเยอะ ส่งไวมาก ไว้ใจได้ 100% แนะนำเลยค่ะ', avatar: '⚔️', time: '3 วันที่แล้ว' },
  { name: 'บอส***', game: 'PUBG Mobile', stars: 5, text: 'UC เข้าภายใน 1 นาที จ่ายง่ายมาก มีหลายช่องทาง ดีมากครับ', avatar: '🔫', time: '5 วันที่แล้ว' },
  { name: 'นิ้ง***', game: 'Mobile Legends', stars: 5, text: 'Diamond เข้าเร็วมาก ราคาโอเค บริการดีมากเลยค่ะ ขอบคุณนะคะ', avatar: '🏆', time: '1 อาทิตย์ที่แล้ว' },
  { name: 'เจมส์***', game: 'Valorant', stars: 4, text: 'VP เข้าเร็วดีครับ ราคาย่อมเยา จะกลับมาใช้บริการอีกแน่นอน', avatar: '🎯', time: '1 อาทิตย์ที่แล้ว' },
  { name: 'แพร***', game: 'ตู้สุ่ม ROV', stars: 5, text: 'สุ่มได้ไอดี Conqueror เลยคุ้มมากกก ไม่น่าเชื่อว่าจะโชคดีขนาดนี้!!', avatar: '🎲', time: '2 อาทิตย์ที่แล้ว' },
]

const FAQS = [
  {
    q: 'หลังจากชำระเงินแล้ว จะได้รับสินค้าเมื่อไหร่?',
    a: 'ระบบจะส่งสินค้าให้อัตโนมัติทันทีหลังชำระเงินสำเร็จ โดยทั่วไปใช้เวลาไม่เกิน 1–3 นาที หากเกิน 10 นาที กรุณาติดต่อ support ได้เลยครับ',
  },
  {
    q: 'มีช่องทางชำระเงินอะไรบ้าง?',
    a: 'รองรับหลายช่องทาง ได้แก่ PromptPay / QR Code, บัตรเครดิต/เดบิต, TrueMoney Wallet, และเครดิตในกระเป๋าของเว็บ',
  },
  {
    q: 'ปลอดภัยไหม? ไอดีหรือข้อมูลเกมจะถูกแฮกไหม?',
    a: 'ปลอดภัย 100% ครับ การเติมเกมทำผ่านช่องทางอย่างเป็นทางการ ไม่ต้องแจ้งรหัสผ่านหรือข้อมูลส่วนตัวใดๆ ทั้งสิ้น',
  },
  {
    q: 'ตู้สุ่มไอดี รับประกันอะไรบ้าง?',
    a: 'ทุกไอดีผ่านการตรวจสอบก่อนนำมาขาย มีอีเมลและสามารถเปลี่ยนรหัสผ่านได้ รับประกันเข้าใช้งานได้ภายใน 24 ชั่วโมงหลังได้รับ',
  },
  {
    q: 'สะสมแต้มอย่างไร และแลกได้เมื่อไหร่?',
    a: 'ทุกการซื้อจะได้รับแต้มอัตโนมัติ (ขึ้นอยู่กับระดับ VIP) สามารถแลกแต้มเป็นเครดิตในกระเป๋าได้ทุกเมื่อผ่านหน้า "โปรไฟล์ของฉัน"',
  },
  {
    q: 'หากสินค้าไม่ถึง หรือมีปัญหา ติดต่อได้ที่ไหน?',
    a: 'ติดต่อ support ได้ตลอด 24 ชั่วโมงผ่านไลน์ @gameshop หรือผ่านแชทในเว็บ ทีมงานจะรีบแก้ไขให้โดยเร็วที่สุดครับ',
  },
]

// ─── Global styles injected once ────────────────────────────────────
const GLOBAL_STYLES = `
  @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(200%)} }
  @keyframes fadeSlideUp { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
  @keyframes pulseGlow { 0%,100%{opacity:1} 50%{opacity:0.5} }

  /* Mobile tap highlight removal */
  * { -webkit-tap-highlight-color: transparent; }

  /* Smooth scrolling */
  html { scroll-behavior: smooth; }

  /* Touch-friendly minimum sizes */
  button, a { min-height: 44px; }

  /* Safe area for notched phones */
  .safe-bottom { padding-bottom: env(safe-area-inset-bottom, 0px); }
`

// ─── Components ─────────────────────────────────────────────────────

function Ticker() {
  const items = [...PROMO_ITEMS, ...PROMO_ITEMS]
  return (
    <div
      className="overflow-hidden border border-primary/20 rounded-xl py-2"
      style={{ background: 'linear-gradient(90deg, rgba(217,70,168,0.06), rgba(168,85,247,0.06))' }}
    >
      <div className="flex whitespace-nowrap" style={{ animation: 'ticker 32s linear infinite' }}>
        {items.map((item, i) => (
          <span key={i} className="inline-flex items-center gap-2 text-[11px] sm:text-[12px] font-semibold text-primary mr-10 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" style={{ boxShadow: '0 0 6px #d946a8' }} />
            {item}
          </span>
        ))}
      </div>
    </div>
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
        /* Mobile: 220px, tablet: 280px, desktop: 360px */
        minHeight: 'clamp(220px, 40vw, 360px)',
        background: s.bgImage
          ? `url('${s.bgImage}') center/cover no-repeat`
          : `linear-gradient(130deg, ${s.gradFrom} 0%, ${s.gradMid} 50%, ${s.gradTo} 100%)`,
        transition: 'background 0.7s ease',
      }}
    >
      {/* Grid overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="pgrid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.6" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#pgrid)" />
      </svg>
      {/* Glow blobs */}
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none" style={{ background: s.accentColor, filter: 'blur(72px)', opacity: 0.2 }} />
      <div className="absolute bottom-0 left-1/4 w-56 h-56 rounded-full pointer-events-none" style={{ background: s.accentColor, filter: 'blur(60px)', opacity: 0.1 }} />

      {s.showContent && (
        <div className="relative z-10 flex items-center px-4 sm:px-8 md:px-14 py-6 sm:py-8 gap-8" style={{ minHeight: 'inherit' }}>
          <div className="flex-1 min-w-0">
            <span className="inline-block text-[9px] sm:text-[10px] font-bold tracking-widest uppercase mb-2 sm:mb-3 px-3 py-1.5 rounded-md" style={{ background: 'rgba(255,255,255,0.14)', color: s.accentColor, border: `1px solid ${s.accentColor}35` }}>{s.badge}</span>
            <h1 className="font-extrabold leading-tight mb-1" style={{ fontSize: 'clamp(18px,4vw,40px)', color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.25)' }}>{s.title}</h1>
            <h2 className="font-extrabold leading-tight mb-3 sm:mb-4" style={{ fontSize: 'clamp(16px,3.5vw,38px)', color: s.accentColor, textShadow: `0 0 32px ${s.accentColor}70` }}>{s.highlight}</h2>
            <p className="text-xs sm:text-sm mb-4 sm:mb-5 hidden sm:block" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 400, lineHeight: 1.7 }}>{s.sub}</p>
            <div className="flex gap-2 sm:gap-3 flex-wrap">
              <Link href={s.ctaHref}>
                <button className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all hover:scale-105 active:scale-95" style={{ background: '#fff', color: s.gradMid, boxShadow: '0 4px 24px rgba(0,0,0,0.22)' }}>
                  <ShoppingCart size={13} />{s.cta}
                </button>
              </Link>
              <Link href={s.cta2Href}>
                <button className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all hover:scale-105 active:scale-95" style={{ background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.28)' }}>
                  {s.cta2}
                </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Nav arrows — larger on mobile for touch */}
      <button
        onClick={goBack}
        className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        onClick={next}
        className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
        style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff' }}
      >
        <ChevronRight size={16} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => go(i)}
            className="rounded-full border-0 cursor-pointer transition-all duration-300 p-0"
            style={{ width: i === idx ? 20 : 7, height: 7, background: i === idx ? '#fff' : 'rgba(255,255,255,0.35)' }}
          />
        ))}
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
    /* Horizontally scrollable on very small phones, wraps on tablet+ */
    <div
      className="bg-white border border-border rounded-2xl py-3 px-4 sm:px-6 flex gap-3 overflow-x-auto sm:flex-wrap sm:justify-around"
      style={{ boxShadow: '0 2px 12px rgba(37,99,235,0.06)', scrollbarWidth: 'none' }}
    >
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-[12px] font-semibold shrink-0" style={{ color: '#1d4ed8' }}>
          <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center" style={{ background: item.bg, color: item.color }}>{item.icon}</span>
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
          <h2 className="text-[14px] sm:text-[15px] font-bold tracking-tight text-[#1a1028] leading-tight">{title}</h2>
          {sub && <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight">{sub}</p>}
        </div>
      </div>
      {href && (
        <Link href={href}>
          <button className="text-[11px] sm:text-[12px] font-semibold text-primary flex items-center gap-0.5 px-2.5 sm:px-3 py-1.5 rounded-lg hover:bg-primary/8 transition-colors">
            ดูทั้งหมด <ChevronRight size={12} />
          </button>
        </Link>
      )}
    </div>
  )
}

// ── Game Card ────────────────────────────────────────────────────────
function GameCard({ game }: { game: typeof GAMES[0] }) {
  const [err, setErr] = useState(false)
  const [hovered, setHovered] = useState(false)
  const hasDiscount = game.topPack.was !== undefined
  return (
    <Link href={game.href}>
      <div
        className="relative bg-white rounded-2xl overflow-hidden cursor-pointer"
        style={{
          border: hovered ? `1.5px solid ${game.colorA}` : '1.5px solid #e0f2fe',
          boxShadow: hovered ? `0 8px 28px ${game.colorA}30` : '0 1px 3px rgba(0,0,0,0.06)',
          transform: hovered ? 'translateY(-4px) scale(1.03)' : 'translateY(0) scale(1)',
          transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
          /* Ensure minimum touch target */
          minHeight: 110,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${game.colorA}, ${game.colorB})` }} />
        <div className="flex flex-col items-center pt-3 pb-1 px-1.5 sm:px-2 gap-1.5 sm:gap-2">
          <div
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
            style={{
              background: `linear-gradient(135deg, ${game.colorA}, ${game.colorB})`,
              boxShadow: hovered ? `0 6px 20px ${game.colorA}60` : `0 4px 14px ${game.colorA}45`,
              transform: hovered ? 'scale(1.12) rotate(2deg)' : 'scale(1)',
              transition: 'all 0.25s ease',
            }}
          >
            {!err
              ? <img src={game.logo} alt={game.name} loading="lazy" className="w-full h-full object-cover" onError={() => setErr(true)} />
              : <span className="text-white text-[9px] font-black">{game.fallback}</span>}
          </div>
          {/* Shorter name on mobile */}
          <div className="text-[10px] sm:text-[11px] font-bold text-[#1a1028] leading-tight truncate w-full text-center px-0.5">
            {game.name}
          </div>
        </div>
        <div className="mx-1.5 sm:mx-2 mb-2 mt-1 rounded-lg px-1.5 sm:px-2 py-1.5" style={{ background: `${game.colorA}12`, border: `1px solid ${game.colorA}25` }}>
          <div className="text-[7.5px] sm:text-[8.5px] font-semibold leading-none mb-0.5 truncate" style={{ color: game.colorA }}>{game.topPack.label}</div>
          <div className="flex items-baseline gap-1">
            <span className="text-[11px] sm:text-[12px] font-extrabold leading-none" style={{ color: game.colorA }}>{game.topPack.price}</span>
            {hasDiscount && <span className="text-[8px] sm:text-[9px] line-through leading-none hidden sm:inline" style={{ color: `${game.colorA}60` }}>{game.topPack.was}</span>}
          </div>
        </div>
        {game.tag && (
          <div className="absolute top-2 right-1.5 sm:right-2 text-[7px] sm:text-[8px] font-bold text-white px-1 sm:px-1.5 py-0.5 rounded-full leading-tight" style={{ background: game.tagColor }}>
            {game.tag}
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${game.colorA}, ${game.colorB})`, transform: hovered ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.3s ease' }} />
      </div>
    </Link>
  )
}

// ── Top-up Feature Banner ─────────────────────────────────────────────
function TopupFeatureBanner({ game }: { game: typeof GAMES[0] }) {
  const [err, setErr] = useState(false)
  const [hovered, setHovered] = useState(false)
  return (
    <Link href={game.href}>
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer"
        style={{
          background: `linear-gradient(130deg, ${game.colorA} 0%, ${game.colorB} 100%)`,
          minHeight: 110,
          transform: hovered ? 'translateY(-3px) scale(1.015)' : 'translateY(0) scale(1)',
          boxShadow: hovered ? `0 16px 40px ${game.colorA}50` : `0 4px 16px ${game.colorA}30`,
          transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-black leading-none select-none pointer-events-none" style={{ fontSize: 64, color: 'rgba(255,255,255,0.07)', letterSpacing: '-0.05em' }}>{game.fallback}</div>
        {hovered && <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)', animation: 'shimmer 1.4s infinite' }} />}
        <div className="relative z-10 flex items-center gap-3 sm:gap-4 p-4 sm:p-5 h-full">
          <div
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden shrink-0 border-2 border-white/30"
            style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.35)', transform: hovered ? 'scale(1.08) rotate(-2deg)' : 'scale(1)', transition: 'transform 0.3s ease' }}
          >
            {!err
              ? <img src={game.logo} alt={game.name} loading="lazy" className="w-full h-full object-cover" onError={() => setErr(true)} />
              : <div className="w-full h-full flex items-center justify-center font-black text-[13px]" style={{ background: `linear-gradient(135deg, ${game.colorA}, ${game.colorB})`, color: '#fff' }}>{game.fallback}</div>}
          </div>
          <div className="min-w-0 flex-1">
            {game.tag && <span className="inline-block text-[9px] font-bold mb-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}>{game.tag}</span>}
            <div className="text-white font-extrabold text-[14px] sm:text-[16px] leading-tight">{game.name}</div>
            <div className="text-[10px] sm:text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.65)' }}>เติม{game.currency} ราคาพิเศษ</div>
            <div className="flex items-baseline gap-1.5 mt-1.5 sm:mt-2">
              <span className="text-white font-extrabold text-[14px] sm:text-[15px]">{game.topPack.price}</span>
              {game.topPack.was && <span className="text-[9px] sm:text-[10px] line-through" style={{ color: 'rgba(255,255,255,0.45)' }}>{game.topPack.was}</span>}
              <span className="text-[8px] sm:text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>{game.topPack.label}</span>
            </div>
          </div>
          <div
            className="ml-auto w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-200"
            style={{ background: hovered ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.18)', transform: hovered ? 'scale(1.1)' : 'scale(1)' }}
          >
            <ChevronRight size={13} style={{ color: hovered ? game.colorA : '#fff' }} />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Gacha Card ───────────────────────────────────────────────────────
function GachaCard({ pool }: { pool: typeof GACHA_POOLS[0] }) {
  const [err, setErr] = useState(false)
  const [hovered, setHovered] = useState(false)
  const rateColors = ['#94a3b8', '#3b82f6', pool.colorA, pool.rareColor]
  return (
    <Link href="/gacha">
      <div
        className="relative rounded-3xl overflow-hidden cursor-pointer flex flex-col"
        style={{
          background: '#fff',
          border: hovered ? `2px solid ${pool.colorA}` : '2px solid #e0eaff',
          boxShadow: hovered ? `0 28px 60px ${pool.colorA}35` : '0 4px 20px rgba(37,99,235,0.08)',
          transform: hovered ? 'translateY(-10px) scale(1.02)' : 'translateY(0) scale(1)',
          transition: 'all 0.32s cubic-bezier(0.34,1.56,0.64,1)',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="relative overflow-hidden" style={{ background: `linear-gradient(145deg, ${pool.colorA} 0%, ${pool.colorB} 100%)`, padding: '20px 16px 16px' }}>
          <div className="absolute inset-0 opacity-[0.07] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1' fill='%23fff'/%3E%3C/svg%3E\")", backgroundSize: '20px' }} />
          <div className="absolute right-4 bottom-0 text-[64px] leading-none select-none pointer-events-none" style={{ opacity: 0.12, transform: 'rotate(-10deg) translateY(10px)' }}>{pool.emoji}</div>
          {hovered && <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.12) 50%, transparent 65%)', animation: 'shimmer 1.4s infinite' }} />}
          <div className="relative z-10 flex items-start gap-3 sm:gap-4">
            <div className="w-13 h-13 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-white/40 shrink-0" style={{ width: 52, height: 52, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', transform: hovered ? 'scale(1.08) rotate(-3deg)' : 'scale(1)', transition: 'transform 0.3s ease' }}>
              {!err
                ? <img src={pool.logo} alt={pool.game} loading="lazy" className="w-full h-full object-cover" onError={() => setErr(true)} />
                : <div className="w-full h-full flex items-center justify-center font-black text-[14px]" style={{ background: `linear-gradient(135deg, ${pool.colorA}, ${pool.colorB})`, color: '#fff' }}>{pool.fallback}</div>}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-white/70 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-0.5">{pool.game}</div>
              <div className="text-white font-extrabold text-[13px] sm:text-[15px] leading-tight">{pool.title}</div>
              <div className="text-white/60 text-[10px] sm:text-[11px] mt-0.5">{pool.subtitle}</div>
            </div>
          </div>
          <div className="relative z-10 mt-3 sm:mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${pool.rareColor}60` }}>
            <span className="text-[10px]">⭐</span>
            <span className="text-[9px] sm:text-[10px] font-black" style={{ color: pool.rareColor }}>รางวัลสูงสุด: {pool.rareLabel}</span>
          </div>
        </div>
        <div className="flex-1 flex flex-col p-3.5 sm:p-4 gap-2.5 sm:gap-3">
          <div className="flex flex-col gap-1.5 sm:gap-2">
            {pool.items.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#f1f5f9' }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: hovered ? `${pool.rates[i]}%` : '0%', background: rateColors[i] }} />
                </div>
                <span className="text-[9px] sm:text-[10px] font-semibold w-20 sm:w-24 truncate" style={{ color: rateColors[i] }}>{item}</span>
                <span className="text-[9px] sm:text-[10px] font-black w-6 sm:w-7 text-right tabular-nums" style={{ color: rateColors[i] }}>{pool.rates[i]}%</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1">
            {pool.features.map((f, i) => (
              <span key={i} className="text-[8px] sm:text-[9px] font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full" style={{ background: `${pool.colorA}10`, color: pool.colorA, border: `1px solid ${pool.colorA}25` }}>✓ {f}</span>
            ))}
          </div>
          <div className="flex items-center justify-between mt-auto pt-1">
            <div>
              <div className="text-[10px] text-slate-400 font-medium">ราคาต่อครั้ง</div>
              <div className="text-[20px] sm:text-[22px] font-extrabold leading-none" style={{ color: pool.colorA }}>{pool.price}</div>
            </div>
            <button
              className="flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl text-white text-[12px] sm:text-[13px] font-black"
              style={{ background: `linear-gradient(135deg, ${pool.colorA}, ${pool.colorB})`, boxShadow: hovered ? `0 8px 24px ${pool.colorA}55` : `0 4px 12px ${pool.colorA}35`, transform: hovered ? 'scale(1.05)' : 'scale(1)', transition: 'all 0.2s ease' }}
            >
              <Shuffle size={12} />สุ่มเลย!
            </button>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${pool.colorA}, ${pool.colorB})`, transform: hovered ? 'scaleX(1)' : 'scaleX(0)', transformOrigin: 'left', transition: 'transform 0.4s ease' }} />
      </div>
    </Link>
  )
}

// ── Promo Banner ──────────────────────────────────────────────────────
function PromoBanner() {
  return (
    <Link href="/topup">
      <div
        className="relative rounded-2xl overflow-hidden cursor-pointer group"
        style={{ background: 'linear-gradient(120deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #1d4ed8 100%)', minHeight: 80, boxShadow: '0 8px 32px rgba(79,70,229,0.3)' }}
      >
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-300" style={{ background: 'linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.06) 50%, transparent 65%)', animation: 'shimmer 2s infinite' }} />
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1' fill='%23fff'/%3E%3C/svg%3E\")", backgroundSize: '20px' }} />
        <div className="absolute -top-6 left-1/3 w-32 h-32 rounded-full pointer-events-none" style={{ background: '#6366f1', filter: 'blur(40px)', opacity: 0.3 }} />
        <div className="absolute -bottom-6 right-1/4 w-24 h-24 rounded-full pointer-events-none" style={{ background: '#06b6d4', filter: 'blur(36px)', opacity: 0.25 }} />
        <div className="relative z-10 flex items-center gap-3 sm:gap-5 px-4 sm:px-6 py-4 sm:py-5">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 text-lg sm:text-xl" style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>⚡</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-white font-extrabold text-[13px] sm:text-[15px] leading-tight">โปรโมชั่นพิเศษวันนี้</span>
              <span className="text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-full animate-pulse" style={{ background: 'linear-gradient(90deg, #f97316, #ef4444)', color: '#fff' }}>🔥 LIMITED</span>
            </div>
            <p className="text-[10px] sm:text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>เติมเกมทุกเกม ราคาพิเศษ · ส่งทันที · ปลอดภัย 100%</p>
          </div>
          <div className="shrink-0 hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold transition-all group-hover:scale-105" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.25)' }}>
            ดูโปรเลย <ChevronRight size={13} />
          </div>
          {/* Mobile: just an arrow icon */}
          <div className="shrink-0 sm:hidden w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <ChevronRight size={14} color="#fff" />
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── Live Feed ─────────────────────────────────────────────────────────
function LiveFeed() {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => { setCurrentIdx(i => (i + 1) % LIVE_FEED_ITEMS.length); setVisible(true) }, 300)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const item = LIVE_FEED_ITEMS[currentIdx]

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 rounded-xl" style={{ background: 'linear-gradient(90deg, #f0fdf4, #dcfce7)', border: '1px solid #86efac' }}>
      <div className="relative shrink-0">
        <div className="w-2 h-2 rounded-full bg-green-500" />
        <div className="absolute inset-0 w-2 h-2 rounded-full bg-green-400 animate-ping" />
      </div>
      <span className="text-[10px] sm:text-[11px] font-bold text-green-700 shrink-0">LIVE</span>
      <div className="flex-1 overflow-hidden">
        <span className="text-[10px] sm:text-[11px] font-semibold text-green-900 transition-all duration-300 block truncate" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(-6px)' }}>
          <span className="font-black">{item.user}</span> เพิ่งเติม <span className="font-black text-green-700">{item.game} {item.item}</span>
          <span className="hidden sm:inline"> เมื่อ {item.mins} นาทีที่แล้ว</span>
        </span>
      </div>
      <span className="text-[9px] sm:text-[10px] text-green-600 font-semibold shrink-0">✓ สำเร็จ</span>
    </div>
  )
}

// ── How to Order ──────────────────────────────────────────────────────
function HowToOrder() {
  const steps = [
    { icon: '🎮', num: '01', title: 'เลือกเกม', desc: 'เลือกเกมที่ต้องการเติม หรือตู้สุ่มที่สนใจ' },
    { icon: '📦', num: '02', title: 'เลือกแพ็คเกจ', desc: 'เลือกจำนวนเหรียญ / เพชร ที่ต้องการ' },
    { icon: '💳', num: '03', title: 'ชำระเงิน', desc: 'เลือกช่องทางชำระ PromptPay, บัตร หรือ Wallet' },
    { icon: '⚡', num: '04', title: 'รับทันที', desc: 'ระบบส่งให้อัตโนมัติภายใน 1–3 นาที' },
  ]
  return (
    <section>
      <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)', boxShadow: '0 4px 14px rgba(14,165,233,0.4)' }}>
          <CheckCircle2 size={15} />
        </div>
        <div>
          <h2 className="text-[14px] sm:text-[16px] font-extrabold tracking-tight text-[#1a1028]">วิธีสั่งซื้อ</h2>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground">ง่าย เร็ว ปลอดภัย ใน 4 ขั้นตอน</p>
        </div>
      </div>
      {/* 2 cols on mobile, 4 on tablet+ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        {steps.map((step, i) => (
          <div key={i} className="relative bg-white rounded-2xl p-3.5 sm:p-4 flex flex-col items-center text-center" style={{ border: '1.5px solid #e0f2fe', boxShadow: '0 2px 10px rgba(14,165,233,0.07)' }}>
            {i < steps.length - 1 && <div className="hidden md:block absolute top-8 -right-1.5 w-3 h-0.5 z-10" style={{ background: 'linear-gradient(90deg, #0ea5e9, #06b6d4)' }} />}
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-xl sm:text-2xl mb-2 shrink-0" style={{ background: 'linear-gradient(135deg, #e0f7fa, #b3e5fc)', boxShadow: '0 4px 14px rgba(14,165,233,0.18)' }}>
              {step.icon}
            </div>
            <div className="text-[8px] sm:text-[9px] font-black mb-0.5" style={{ color: '#0ea5e9' }}>STEP {step.num}</div>
            <div className="text-[12px] sm:text-[13px] font-extrabold text-[#1a1028] mb-0.5 sm:mb-1 leading-tight">{step.title}</div>
            <p className="text-[9.5px] sm:text-[10.5px] text-muted-foreground leading-snug">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── VIP System ────────────────────────────────────────────────────────
function VIPSystem() {
  const [activeIdx, setActiveIdx] = useState(2)

  return (
    <section>
      <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, #ca8a04, #f59e0b)', boxShadow: '0 4px 14px rgba(202,138,4,0.4)' }}>
          <Crown size={15} />
        </div>
        <div>
          <h2 className="text-[14px] sm:text-[16px] font-extrabold tracking-tight text-[#1a1028]">ระบบสะสมแต้ม VIP</h2>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground">ซื้อมากขึ้น ได้สิทธิ์มากขึ้น — ไม่มีวันหมดอายุ</p>
        </div>
      </div>

      {/* 4 cols always, compact on mobile */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
        {VIP_TIERS.map((tier, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className="flex flex-col items-center py-2.5 sm:py-3 px-1 sm:px-2 rounded-2xl transition-all duration-200 cursor-pointer"
            style={{
              background: activeIdx === i ? tier.bg : '#f8fafc',
              border: activeIdx === i ? `2px solid ${tier.border}` : '2px solid #e2e8f0',
              boxShadow: activeIdx === i ? `0 4px 16px ${tier.color}30` : 'none',
              transform: activeIdx === i ? 'translateY(-2px)' : 'translateY(0)',
            }}
          >
            <span className="text-lg sm:text-xl mb-0.5 sm:mb-1">{tier.icon}</span>
            <span className="text-[9px] sm:text-[11px] font-extrabold leading-tight" style={{ color: activeIdx === i ? tier.color : '#94a3b8' }}>{tier.level}</span>
            {i === 3 && <span className="mt-0.5 text-[7px] sm:text-[8px] font-black px-1 sm:px-1.5 py-0.5 rounded-full" style={{ background: '#7c3aed', color: '#fff' }}>สูงสุด</span>}
          </button>
        ))}
      </div>

      {(() => {
        const tier = VIP_TIERS[activeIdx]
        return (
          <div className="rounded-2xl p-4 sm:p-5" style={{ background: tier.bg, border: `1.5px solid ${tier.border}` }}>
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">{tier.icon}</span>
              <div>
                <div className="text-[15px] sm:text-[17px] font-extrabold" style={{ color: tier.color }}>{tier.level} Member</div>
                <div className="text-[10px] sm:text-[11px] text-muted-foreground">
                  {tier.maxSpend < 99999
                    ? `ยอดซื้อสะสม ฿${tier.minSpend.toLocaleString()} – ฿${tier.maxSpend.toLocaleString()}`
                    : `ยอดซื้อสะสม ฿${tier.minSpend.toLocaleString()} ขึ้นไป`}
                </div>
              </div>
            </div>
            {/* 1 col on mobile, 2 on sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2">
              {tier.perks.map((perk, j) => (
                <div key={j} className="flex items-center gap-2 bg-white/70 rounded-xl px-3 py-2">
                  <Gift size={12} style={{ color: tier.color, flexShrink: 0 }} />
                  <span className="text-[11px] sm:text-[12px] font-semibold text-[#1a1028]">{perk}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      <div className="mt-3 rounded-xl px-3.5 sm:px-4 py-2.5 flex items-center gap-2" style={{ background: '#fef9c3', border: '1px solid #fde047' }}>
        <Trophy size={12} style={{ color: '#ca8a04', flexShrink: 0 }} />
        <p className="text-[10px] sm:text-[11px] font-semibold text-[#854d0e]">แต้มสะสมจะอัปเดตอัตโนมัติหลังทุกการซื้อ · ตรวจสอบได้ที่หน้าโปรไฟล์</p>
      </div>
    </section>
  )
}

// ── Reviews ───────────────────────────────────────────────────────────
function Reviews() {
  return (
    <section>
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 4px 14px rgba(245,158,11,0.4)' }}>
            <Star size={15} />
          </div>
          <div>
            <h2 className="text-[14px] sm:text-[16px] font-extrabold tracking-tight text-[#1a1028]">รีวิวจากลูกค้าจริง</h2>
            <p className="text-[10px] sm:text-[11px] text-muted-foreground">4.9 ★ จากกว่า 3,000 รีวิว</p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          {[1,2,3,4,5].map(s => <Star key={s} size={11} fill="#fbbf24" color="#fbbf24" />)}
          <span className="text-[11px] sm:text-[12px] font-extrabold text-[#1a1028] ml-1">4.9</span>
        </div>
      </div>
      {/* 1 col mobile, 2 cols tablet, 3 cols desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
        {REVIEWS.map((r, i) => (
          <div key={i} className="bg-white rounded-2xl p-3.5 sm:p-4 flex flex-col gap-2" style={{ border: '1.5px solid #fef3c7', boxShadow: '0 2px 10px rgba(245,158,11,0.08)' }}>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-base sm:text-lg shrink-0" style={{ background: 'linear-gradient(135deg, #fef9c3, #fde68a)' }}>{r.avatar}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[11px] sm:text-[12px] font-extrabold text-[#1a1028] truncate">{r.name}</div>
                <div className="text-[9px] sm:text-[10px] font-semibold" style={{ color: '#f97316' }}>{r.game}</div>
              </div>
              <div className="flex items-center gap-0.5 shrink-0">
                {Array.from({ length: r.stars }).map((_, s) => <Star key={s} size={9} fill="#fbbf24" color="#fbbf24" />)}
              </div>
            </div>
            <p className="text-[10.5px] sm:text-[11.5px] text-[#334155] leading-relaxed flex-1">"{r.text}"</p>
            <div className="text-[9px] sm:text-[10px] text-muted-foreground">{r.time}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

// ── FAQ ───────────────────────────────────────────────────────────────
function FAQ() {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  return (
    <section>
      <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-5">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', boxShadow: '0 4px 14px rgba(14,165,233,0.4)' }}>
          <MessageCircle size={15} />
        </div>
        <div>
          <h2 className="text-[14px] sm:text-[16px] font-extrabold tracking-tight text-[#1a1028]">คำถามที่พบบ่อย</h2>
          <p className="text-[10px] sm:text-[11px] text-muted-foreground">ตอบทุกข้อสงสัยก่อนสั่งซื้อ</p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {FAQS.map((faq, i) => {
          const isOpen = openIdx === i
          return (
            <div key={i} className="rounded-2xl overflow-hidden transition-all duration-200" style={{ border: isOpen ? '1.5px solid #0ea5e9' : '1.5px solid #e2e8f0', boxShadow: isOpen ? '0 4px 20px rgba(14,165,233,0.1)' : 'none' }}>
              <button
                className="w-full flex items-center justify-between gap-3 px-4 py-3 sm:py-3.5 text-left cursor-pointer"
                style={{ background: isOpen ? 'linear-gradient(90deg, #f0f9ff, #e0f2fe)' : '#fff' }}
                onClick={() => setOpenIdx(isOpen ? null : i)}
              >
                <span className="text-[12px] sm:text-[13px] font-bold text-[#1a1028] leading-snug">{faq.q}</span>
                <ChevronDown size={14} className="shrink-0 transition-transform duration-200" style={{ color: '#0ea5e9', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
              </button>
              {isOpen && (
                <div className="px-4 pb-4 pt-1" style={{ background: '#f0f9ff' }}>
                  <p className="text-[11px] sm:text-[12px] text-[#334155] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 rounded-2xl px-4 sm:px-5 py-3.5 sm:py-4 flex items-center gap-3 sm:gap-4" style={{ background: 'linear-gradient(90deg, #eff6ff, #dbeafe)', border: '1px solid #93c5fd' }}>
        <Sparkles size={14} style={{ color: '#2563eb', flexShrink: 0 }} />
        <div className="flex-1">
          <p className="text-[11px] sm:text-[12px] font-bold text-[#1e3a8a]">ยังมีคำถามอื่น?</p>
          <p className="text-[9.5px] sm:text-[10.5px] text-[#3b82f6]">ทีมงานพร้อมตอบตลอด 24 ชั่วโมง ทาง LINE @gameshop</p>
        </div>
        <a href="https://line.me" target="_blank" rel="noopener noreferrer">
          <button className="shrink-0 px-3.5 sm:px-4 py-2 rounded-xl text-[10px] sm:text-[11px] font-bold text-white transition-all hover:scale-105 active:scale-95" style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            ติดต่อ LINE
          </button>
        </a>
      </div>
    </section>
  )
}

// ─── Page ────────────────────────────────────────────────────────────
export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const { data: cats } = await supabase.from('categories').select('id, name, slug, icon').order('name')
        if (cats) setCategories(cats)
      } catch (e) {
        console.error(e)
      }
    }
    load()
  }, [])

  return (
    <>
      <style>{GLOBAL_STYLES}</style>
      <Header />
      <main className="min-h-screen bg-background">
        {/*
          ┌─────────────────────────────────────────────────┐
          │  Responsive container                           │
          │  mobile:  px-3, gap-5                          │
          │  tablet:  px-5, gap-6                          │
          │  desktop: px-4 max-w-7xl, gap-8               │
          └─────────────────────────────────────────────────┘
        */}
        <div className="mx-auto max-w-7xl px-3 sm:px-5 md:px-4 py-4 sm:py-5 flex flex-col gap-5 sm:gap-6 md:gap-8">

          <Ticker />
          <Hero />
          <TrustBar />
          <LiveFeed />

          {/* ── 1. เติมเกมยอดนิยม ── */}
          <section>
            <div className="flex items-center justify-between mb-4 sm:mb-5">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)', boxShadow: '0 4px 14px rgba(37,99,235,0.4)' }}>
                  <Gamepad2 size={15} />
                </div>
                <div>
                  <h2 className="text-[14px] sm:text-[16px] font-extrabold tracking-tight text-[#1a1028]">เติมเกมยอดนิยม</h2>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">เติมเหรียญ / เพชร / UC ส่งทันทีภายใน 1 นาที</p>
                </div>
              </div>
              <Link href="/topup">
                <button className="text-[11px] sm:text-[12px] font-bold flex items-center gap-0.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95" style={{ background: 'linear-gradient(90deg, #2563eb, #06b6d4)' }}>
                  ดูทั้งหมด <ChevronRight size={11} />
                </button>
              </Link>
            </div>

            {/*
              Game grid:
              mobile:  5 cols (2 rows of 5)
              sm:      5 cols
              md:      8 cols
              lg:      10 cols
            */}
            <div className="grid grid-cols-5 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10 gap-1.5 sm:gap-2 md:gap-2.5 mb-4 sm:mb-5">
              {GAMES.map(g => <GameCard key={g.id} game={g} />)}
            </div>

            {/* Feature banners: 1 col mobile, 3 cols desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 sm:gap-3">
              {GAMES.filter(g => g.tag).slice(0, 3).map(g => (
                <TopupFeatureBanner key={g.id} game={g} />
              ))}
            </div>

            {/* Stats strip */}
            <div className="mt-3 sm:mt-4 rounded-2xl px-4 py-3.5 sm:py-4 grid grid-cols-4 gap-2 sm:gap-4" style={{ background: 'linear-gradient(90deg, #eff6ff, #f0fdf4)', border: '1px solid #dbeafe' }}>
              {[
                { num: '50K+', label: 'ออร์เดอร์สำเร็จ', icon: '📦' },
                { num: '4.9★', label: 'คะแนนรีวิว', icon: '⭐' },
                { num: '< 1 นาที', label: 'ส่งเฉลี่ย', icon: '⚡' },
                { num: '100%', label: 'ปลอดภัย', icon: '🔒' },
              ].map((s, i) => (
                <div key={i} className="text-center">
                  <div className="text-sm sm:text-base mb-0.5">{s.icon}</div>
                  <div className="text-[12px] sm:text-[14px] font-extrabold text-[#1a1028] leading-tight">{s.num}</div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 hidden sm:block">{s.label}</div>
                </div>
              ))}
            </div>
          </section>

          <PromoBanner />
          <HowToOrder />

          {/* ── 2. ตู้สุ่มไอดี ── */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl flex items-center justify-center text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 4px 14px rgba(124,58,237,0.4)' }}>
                  <Shuffle size={14} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <h2 className="text-[14px] sm:text-[16px] font-extrabold tracking-tight text-[#1a1028]">ตู้สุ่มไอดีเกม</h2>
                    <span className="text-[8px] sm:text-[9px] font-black text-white px-1.5 sm:px-2 py-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }}>✨ NEW</span>
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">ลุ้นรับไอดีหายาก 3 เกมดัง — Free Fire · ROV · PES</p>
                </div>
              </div>
              <Link href="/gacha">
                <button className="text-[11px] sm:text-[12px] font-bold flex items-center gap-0.5 sm:gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl text-white transition-all hover:opacity-90 active:scale-95" style={{ background: 'linear-gradient(90deg, #7c3aed, #4f46e5)' }}>
                  ดูทั้งหมด <ChevronRight size={11} />
                </button>
              </Link>
            </div>

            <div className="rounded-xl px-3.5 sm:px-4 py-2.5 mb-4 sm:mb-5 flex items-center gap-2" style={{ background: '#fef9c3', border: '1px solid #fde047' }}>
              <span className="text-sm shrink-0">⚠️</span>
              <p className="text-[10px] sm:text-[11px] font-semibold text-[#854d0e]">ผลการสุ่มเป็นแบบสุ่มจริง — อัตราการได้รับแสดงด้านล่างแต่ละตู้ ซื้อตามกำลังทรัพย์</p>
            </div>

            {/* 1 col mobile, 3 cols tablet+ */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
              {GACHA_POOLS.map(pool => <GachaCard key={pool.id} pool={pool} />)}
            </div>

            <Link href="/gacha">
              <div className="relative mt-4 sm:mt-5 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-2xl hover:shadow-violet-500/25 hover:-translate-y-0.5" style={{ background: 'linear-gradient(130deg, #5b21b6 0%, #4338ca 55%, #0f172a 100%)', minHeight: 80 }}>
                <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1' fill='%23fff'/%3E%3C/svg%3E\")", backgroundSize: '20px' }} />
                <div className="relative z-10 flex items-center gap-4 sm:gap-6 px-5 sm:px-8 py-4 sm:py-5">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] sm:text-[15px] font-extrabold text-white mb-0.5">ลองดวงตู้ Item สุดพิเศษ</h3>
                    <p className="text-[10px] sm:text-[11px]" style={{ color: 'rgba(255,255,255,0.55)' }}>ไม่ใช่แค่ไอดี — สุ่มรับไอเทม สกิน และอื่นๆ อีกมาก</p>
                  </div>
                  <button className="shrink-0 px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all hover:scale-105 active:scale-95 whitespace-nowrap" style={{ background: '#fff', color: '#4f46e5' }}>
                    ดูตู้ทั้งหมด
                  </button>
                </div>
              </div>
            </Link>
          </section>

          <VIPSystem />
          <Reviews />

          {/* ── Categories ── */}
          {categories.length > 0 && (
            <section>
              <SectionHeader icon={<Package size={12} />} title="หมวดหมู่สินค้า" href="/topup" />
              {/* Horizontally scrollable on mobile */}
              <div className="flex gap-2 overflow-x-auto pb-1 sm:flex-wrap" style={{ scrollbarWidth: 'none' }}>
                <Link href="/topup">
                  <Badge variant="outline" className="px-3.5 sm:px-4 py-1.5 text-xs font-semibold cursor-pointer hover:bg-primary hover:text-white hover:border-primary transition-colors rounded-full shrink-0">ทั้งหมด</Badge>
                </Link>
                {categories.map(cat => (
                  <Link key={cat.id} href={`/topup?category=${cat.slug}`}>
                    <Badge variant="outline" className="px-3.5 sm:px-4 py-1.5 text-xs font-semibold cursor-pointer hover:bg-primary hover:text-white hover:border-primary transition-colors rounded-full shrink-0">{cat.name}</Badge>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <FAQ />

          {/* ── Quick Links ── */}
          {/* Full-width stacked on mobile, 3 cols on sm+ */}
          <section className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pb-4 safe-bottom">
            {[
              { href: '/wallet', icon: <CreditCard size={16} />, iconBg: '#dcfce7', iconColor: '#15803d', title: 'เติมเงินกระเป๋า', sub: 'เพิ่มเครดิตเพื่อซื้อสินค้า' },
              { href: '/orders', icon: <ShoppingCart size={16} />, iconBg: '#dbeafe', iconColor: '#1d4ed8', title: 'ประวัติคำสั่งซื้อ', sub: 'ตรวจสอบสถานะออร์เดอร์' },
              { href: '/profile', icon: <Star size={16} />, iconBg: '#fef9c3', iconColor: '#854d0e', title: 'โปรไฟล์ของฉัน', sub: 'จัดการข้อมูลส่วนตัว' },
            ].map(item => (
              <Link key={item.href} href={item.href}>
                <div className="group bg-white border border-border rounded-2xl p-3.5 sm:p-4 flex items-center gap-3 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md hover:shadow-primary/8 active:scale-[0.98]">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: item.iconBg, color: item.iconColor }}>{item.icon}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] sm:text-[13px] font-bold text-[#1a1028] leading-tight">{item.title}</p>
                    <p className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight mt-0.5">{item.sub}</p>
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