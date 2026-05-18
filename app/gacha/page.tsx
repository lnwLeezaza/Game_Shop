'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Sparkles, Gift, Coins, History, Zap, Star, Shield, Lock,
  Copy, Check, ChevronRight, Clock, Swords, Trophy, Crown,
  Gamepad2, Flame, Diamond, ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore, useGachaStore } from '@/lib/store'
import { useLocale, formatPrice } from '@/hooks/use-locale'
import type { GachaItem } from '@/lib/types'

// ─── Types ───────────────────────────────────────────────────────────
interface MockPool {
  id: string
  game: 'rov' | 'pes'
  name: string
  nameTh: string
  description: string
  descriptionTh: string
  price: number
  image: string
  color: string
  glowColor: string
  items: MockItem[]
}

interface MockItem {
  id: string
  name: string
  nameTh: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  dropRate: number
  value: number
  icon: string
}

// ─── Rarity config (Light theme) ─────────────────────────────────────
const RARITY = {
  common:    { label: 'Common',    labelTh: 'ธรรมดา',  color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1', text: '#475569', badge: '#e2e8f0' },
  rare:      { label: 'Rare',      labelTh: 'หายาก',   color: '#2563eb', bg: '#dbeafe', border: '#93c5fd', text: '#1d4ed8', badge: '#bfdbfe' },
  epic:      { label: 'Epic',      labelTh: 'เอพิค',   color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd', text: '#6d28d9', badge: '#ddd6fe' },
  legendary: { label: 'Legendary', labelTh: 'ตำนาน',   color: '#d97706', bg: '#fef3c7', border: '#fcd34d', text: '#b45309', badge: '#fde68a' },
} as const

// ─── Mock Pool Data ───────────────────────────────────────────────────
const MOCK_POOLS: MockPool[] = [
  // ── ROV ──
  {
    id: 'rov-legend',
    game: 'rov',
    name: 'ROV Legend Account',
    nameTh: 'ตู้สุ่มไอดี ROV ระดับตำนาน',
    description: 'Legendary ROV accounts with rare skins',
    descriptionTh: 'ไอดี ROV ระดับสูง มีสกินหายาก',
    price: 199,
    image: 'https://placehold.co/400x225/1e40af/white?text=ROV+LEGEND',
    color: '#f97316',
    glowColor: 'rgba(249,115,22,0.3)',
    items: [
      { id: 'rl1', name: 'Full Skin Legendary Account', nameTh: 'ไอดีสกินครบ Legendary', rarity: 'legendary', dropRate: 3, value: 2999, icon: '👑' },
      { id: 'rl2', name: 'Epic Skin Bundle Account', nameTh: 'ไอดีสกิน Epic ครบชุด', rarity: 'epic', dropRate: 12, value: 899, icon: '💎' },
      { id: 'rl3', name: 'Rare Hero Account', nameTh: 'ไอดีฮีโร่ครบ Rare', rarity: 'rare', dropRate: 30, value: 399, icon: '⭐' },
      { id: 'rl4', name: 'Starter Account', nameTh: 'ไอดีเริ่มต้น', rarity: 'common', dropRate: 55, value: 99, icon: '🎮' },
    ],
  },
  {
    id: 'rov-diamond',
    game: 'rov',
    name: 'ROV Diamond Pack',
    nameTh: 'ตู้สุ่ม Diamond ROV',
    description: 'High diamond ROV accounts',
    descriptionTh: 'ไอดี ROV แดมมอนด์สูง',
    price: 149,
    image: 'https://placehold.co/400x225/1e40af/white?text=ROV+DIAMOND',
    color: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.3)',
    items: [
      { id: 'rd1', name: 'Max Diamond Account', nameTh: 'ไอดีแดมมอนด์สูงสุด', rarity: 'legendary', dropRate: 5, value: 1999, icon: '👑' },
      { id: 'rd2', name: 'High Diamond + Skins', nameTh: 'แดมมอนด์สูง + สกิน', rarity: 'epic', dropRate: 15, value: 699, icon: '💎' },
      { id: 'rd3', name: 'Mid Diamond Account', nameTh: 'ไอดีแดมมอนด์กลาง', rarity: 'rare', dropRate: 30, value: 299, icon: '⭐' },
      { id: 'rd4', name: 'Starter Diamond', nameTh: 'ไอดีแดมมอนด์เริ่มต้น', rarity: 'common', dropRate: 50, value: 79, icon: '🎮' },
    ],
  },
  {
    id: 'rov-hero',
    game: 'rov',
    name: 'ROV All Heroes',
    nameTh: 'ตู้สุ่มไอดีครบฮีโร่',
    description: 'Accounts with all heroes unlocked',
    descriptionTh: 'ไอดีปลดล็อคฮีโร่ครบทุกตัว',
    price: 99,
    image: 'https://placehold.co/400x225/1e40af/white?text=ROV+HEROES',
    color: '#8b5cf6',
    glowColor: 'rgba(139,92,246,0.3)',
    items: [
      { id: 'rh1', name: 'All Heroes + All Skins', nameTh: 'ครบฮีโร่ + ครบสกิน', rarity: 'legendary', dropRate: 2, value: 3499, icon: '👑' },
      { id: 'rh2', name: 'All Heroes + Epic Skins', nameTh: 'ครบฮีโร่ + สกิน Epic', rarity: 'epic', dropRate: 8, value: 799, icon: '💎' },
      { id: 'rh3', name: 'All Heroes Account', nameTh: 'ไอดีครบฮีโร่', rarity: 'rare', dropRate: 35, value: 349, icon: '⭐' },
      { id: 'rh4', name: 'Most Heroes Account', nameTh: 'ไอดีเยอะฮีโร่', rarity: 'common', dropRate: 55, value: 89, icon: '🎮' },
    ],
  },
  {
    id: 'rov-rank',
    game: 'rov',
    name: 'ROV High Rank',
    nameTh: 'ตู้สุ่มไอดีแรงค์สูง',
    description: 'Challenger & Grandmaster accounts',
    descriptionTh: 'ไอดีแรงค์ Challenger และ Grandmaster',
    price: 249,
    image: 'https://placehold.co/400x225/1e40af/white?text=ROV+RANK',
    color: '#ef4444',
    glowColor: 'rgba(239,68,68,0.3)',
    items: [
      { id: 'rr1', name: 'Challenger Account', nameTh: 'ไอดีแรงค์ Challenger', rarity: 'legendary', dropRate: 3, value: 4999, icon: '👑' },
      { id: 'rr2', name: 'Grandmaster Account', nameTh: 'ไอดีแรงค์ Grandmaster', rarity: 'epic', dropRate: 12, value: 1499, icon: '💎' },
      { id: 'rr3', name: 'Master Account', nameTh: 'ไอดีแรงค์ Master', rarity: 'rare', dropRate: 30, value: 599, icon: '⭐' },
      { id: 'rr4', name: 'Diamond Rank Account', nameTh: 'ไอดีแรงค์ Diamond', rarity: 'common', dropRate: 55, value: 149, icon: '🎮' },
    ],
  },
  {
    id: 'rov-special',
    game: 'rov',
    name: 'ROV Special Edition',
    nameTh: 'ตู้สุ่ม Limited ROV',
    description: 'Rare limited edition ROV accounts',
    descriptionTh: 'ไอดี ROV Limited Edition สุดหายาก',
    price: 299,
    image: 'https://placehold.co/400x225/1e40af/white?text=ROV+LIMITED',
    color: '#ec4899',
    glowColor: 'rgba(236,72,153,0.3)',
    items: [
      { id: 'rs1', name: 'Limited OG Account', nameTh: 'ไอดี OG สุดหายาก', rarity: 'legendary', dropRate: 1, value: 9999, icon: '👑' },
      { id: 'rs2', name: 'Special Skin Account', nameTh: 'ไอดีสกิน Special', rarity: 'epic', dropRate: 9, value: 1999, icon: '💎' },
      { id: 'rs3', name: 'Rare Limited Account', nameTh: 'ไอดี Limited หายาก', rarity: 'rare', dropRate: 30, value: 699, icon: '⭐' },
      { id: 'rs4', name: 'Normal Account', nameTh: 'ไอดีทั่วไป', rarity: 'common', dropRate: 60, value: 99, icon: '🎮' },
    ],
  },

  // ── PES / eFootball ──
  {
    id: 'pes-legend',
    game: 'pes',
    name: 'eFootball Legend Squad',
    nameTh: 'ตู้สุ่มไอดี PES ทีมตำนาน',
    description: 'Legendary squad with top players',
    descriptionTh: 'ไอดีทีมตำนาน นักเตะดาวดัง',
    price: 199,
    image: 'https://placehold.co/400x225/166534/white?text=PES+LEGEND',
    color: '#16a34a',
    glowColor: 'rgba(22,163,74,0.3)',
    items: [
      { id: 'pl1', name: 'Full Legend Squad + 999M GP', nameTh: 'ทีมตำนานครบ + GP 999M', rarity: 'legendary', dropRate: 3, value: 3999, icon: '👑' },
      { id: 'pl2', name: 'Epics Squad + 500M GP', nameTh: 'ทีม Epic + GP 500M', rarity: 'epic', dropRate: 12, value: 999, icon: '💎' },
      { id: 'pl3', name: 'Good Squad + GP', nameTh: 'ทีมดี + GP', rarity: 'rare', dropRate: 30, value: 399, icon: '⭐' },
      { id: 'pl4', name: 'Starter Squad', nameTh: 'ไอดีเริ่มต้น', rarity: 'common', dropRate: 55, value: 99, icon: '⚽' },
    ],
  },
  {
    id: 'pes-gp',
    game: 'pes',
    name: 'eFootball Max GP',
    nameTh: 'ตู้สุ่ม GP สูงสุด',
    description: 'Accounts loaded with GP coins',
    descriptionTh: 'ไอดีเหรียญ GP เยอะมาก',
    price: 149,
    image: 'https://placehold.co/400x225/166534/white?text=PES+GP',
    color: '#eab308',
    glowColor: 'rgba(234,179,8,0.3)',
    items: [
      { id: 'pg1', name: '9,999,999 GP Account', nameTh: 'ไอดี GP 9.9 ล้าน', rarity: 'legendary', dropRate: 4, value: 2999, icon: '👑' },
      { id: 'pg2', name: '5,000,000 GP Account', nameTh: 'ไอดี GP 5 ล้าน', rarity: 'epic', dropRate: 16, value: 799, icon: '💎' },
      { id: 'pg3', name: '1,000,000 GP Account', nameTh: 'ไอดี GP 1 ล้าน', rarity: 'rare', dropRate: 30, value: 299, icon: '⭐' },
      { id: 'pg4', name: '500,000 GP Account', nameTh: 'ไอดี GP 5 แสน', rarity: 'common', dropRate: 50, value: 79, icon: '⚽' },
    ],
  },
  {
    id: 'pes-player',
    game: 'pes',
    name: 'eFootball Star Players',
    nameTh: 'ตู้สุ่มไอดีนักเตะดาว',
    description: 'Mbappe, Ronaldo, Messi era accounts',
    descriptionTh: 'ไอดีนักเตะดาวดัง เอ็มบาเป้ โรนัลโด้',
    price: 249,
    image: 'https://placehold.co/400x225/166534/white?text=PES+STARS',
    color: '#2563eb',
    glowColor: 'rgba(37,99,235,0.3)',
    items: [
      { id: 'pp1', name: 'Mbappe + Messi Black Label', nameTh: 'เอ็มบาเป้ + เมสซี่ Black Label', rarity: 'legendary', dropRate: 2, value: 4999, icon: '👑' },
      { id: 'pp2', name: 'Top 5 Star Players', nameTh: 'นักเตะดาวดัง 5 คนครบ', rarity: 'epic', dropRate: 10, value: 1299, icon: '💎' },
      { id: 'pp3', name: '3 Star Players Squad', nameTh: 'ทีมมีนักเตะดาว 3 คน', rarity: 'rare', dropRate: 28, value: 499, icon: '⭐' },
      { id: 'pp4', name: 'Good Players Account', nameTh: 'ไอดีนักเตะดี', rarity: 'common', dropRate: 60, value: 119, icon: '⚽' },
    ],
  },
  {
    id: 'pes-rank',
    game: 'pes',
    name: 'eFootball High Division',
    nameTh: 'ตู้สุ่มไอดีดิวิชั่นสูง',
    description: 'Division 1 & Super Division accounts',
    descriptionTh: 'ไอดีดิวิชั่น 1 และ Super Division',
    price: 179,
    image: 'https://placehold.co/400x225/166534/white?text=PES+DIV',
    color: '#7c3aed',
    glowColor: 'rgba(124,58,237,0.3)',
    items: [
      { id: 'pk1', name: 'Super Division Account', nameTh: 'ไอดี Super Division', rarity: 'legendary', dropRate: 3, value: 2499, icon: '👑' },
      { id: 'pk2', name: 'Division 1 Account', nameTh: 'ไอดีดิวิชั่น 1', rarity: 'epic', dropRate: 15, value: 799, icon: '💎' },
      { id: 'pk3', name: 'Division 2 Account', nameTh: 'ไอดีดิวิชั่น 2', rarity: 'rare', dropRate: 32, value: 299, icon: '⭐' },
      { id: 'pk4', name: 'Division 3 Account', nameTh: 'ไอดีดิวิชั่น 3', rarity: 'common', dropRate: 50, value: 89, icon: '⚽' },
    ],
  },
  {
    id: 'pes-special',
    game: 'pes',
    name: 'eFootball Full Package',
    nameTh: 'ตู้สุ่มไอดีแพ็คเกจครบ',
    description: 'Full package: GP + players + rank',
    descriptionTh: 'ครบทุกอย่าง GP + นักเตะ + แรงค์',
    price: 349,
    image: 'https://placehold.co/400x225/166534/white?text=PES+FULL',
    color: '#0891b2',
    glowColor: 'rgba(8,145,178,0.3)',
    items: [
      { id: 'pf1', name: 'MAX Everything Account', nameTh: 'ไอดีแม็กซ์ทุกอย่าง', rarity: 'legendary', dropRate: 2, value: 7999, icon: '👑' },
      { id: 'pf2', name: 'Full Epic Package', nameTh: 'แพ็คเกจ Epic ครบ', rarity: 'epic', dropRate: 10, value: 1999, icon: '💎' },
      { id: 'pf3', name: 'Good Package Account', nameTh: 'ไอดีแพ็คเกจดี', rarity: 'rare', dropRate: 28, value: 699, icon: '⭐' },
      { id: 'pf4', name: 'Basic Package Account', nameTh: 'ไอดีแพ็คเกจพื้นฐาน', rarity: 'common', dropRate: 60, value: 149, icon: '⚽' },
    ],
  },
]

// ─── Fake live feed ───────────────────────────────────────────────────
const FAKE_NAMES = ['SiamGamer99', 'xXProHunter', 'ThaiROV', 'RushB_TH', 'EliteProwler', 'GoldRanker', 'GhostPlayer', 'ThunderBlade']
const FAKE_ROV  = ['ไอดี ROV ตำนาน 👑', 'ไอดีแรงค์ Challenger', 'สกิน Epic ครบ 💎', 'ไอดีฮีโร่ครบ', 'ไอดี ROV แรงค์สูง']
const FAKE_PES  = ['ทีมตำนาน PES 👑', 'ไอดี GP 9.9ล้าน', 'เอ็มบาเป้ Black Label', 'Super Division', 'ไอดีครบแพ็คเกจ']

function useLiveFeed(game: 'rov' | 'pes') {
  const [feed, setFeed] = useState<{ id: number; name: string; item: string; rarity: string; ago: number }[]>([])
  const counter = useRef(0)
  useEffect(() => {
    const items = game === 'rov' ? FAKE_ROV : FAKE_PES
    const add = () => {
      const rarity = Math.random() < 0.04 ? 'legendary' : Math.random() < 0.14 ? 'epic' : Math.random() < 0.34 ? 'rare' : 'common'
      const item = rarity === 'legendary' || rarity === 'epic' ? items[Math.floor(Math.random() * 2)] : items[2 + Math.floor(Math.random() * 3)]
      setFeed(prev => [{
        id: counter.current++,
        name: FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)],
        item, rarity, ago: 1,
      }, ...prev.slice(0, 6)].map((f, i) => ({ ...f, ago: i + 1 })))
    }
    add()
    const t = setInterval(add, 4000)
    return () => clearInterval(t)
  }, [game])
  return feed
}

// ─── Particle burst effect ────────────────────────────────────────────
function ParticleBurst({ active, rarity }: { active: boolean; rarity: string }) {
  if (!active) return null
  const cfg = RARITY[rarity as keyof typeof RARITY] || RARITY.common
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }}>
      {Array.from({ length: 24 }).map((_, i) => {
        const angle = (i / 24) * 360
        const dist = 80 + Math.random() * 120
        return (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: '8px', height: '8px', borderRadius: '50%',
            background: cfg.color,
            animation: `particle-${i} 0.8s ease-out forwards`,
            '--tx': `${Math.cos(angle * Math.PI / 180) * dist}px`,
            '--ty': `${Math.sin(angle * Math.PI / 180) * dist}px`,
          } as React.CSSProperties} />
        )
      })}
      <style>{`
        ${Array.from({ length: 24 }).map((_, i) => {
          const angle = (i / 24) * 360
          const dist = 80 + Math.random() * 120
          return `@keyframes particle-${i} {
            0% { transform: translate(-50%,-50%) scale(1); opacity:1; }
            100% { transform: translate(calc(-50% + ${Math.cos(angle * Math.PI / 180) * dist}px), calc(-50% + ${Math.sin(angle * Math.PI / 180) * dist}px)) scale(0); opacity:0; }
          }`
        }).join('')}
      `}</style>
    </div>
  )
}

// ─── Unlock Overlay (Light theme) ────────────────────────────────────
function UnlockOverlay({ item, onClose, locale }: { item: MockItem; onClose: () => void; locale: string }) {
  const [phase, setPhase] = useState<'spin' | 'reveal' | 'show'>('spin')
  const [copied, setCopied] = useState<string | null>(null)
  const [showParticles, setShowParticles] = useState(false)
  const th = locale === 'th'
  const cfg = RARITY[item.rarity as keyof typeof RARITY] || RARITY.common

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 1600)
    const t2 = setTimeout(() => { setPhase('show'); setShowParticles(true) }, 2600)
    const t3 = setTimeout(() => setShowParticles(false), 3400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const fakeId   = `ID-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  const fakePass = `PASS-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).catch(() => {})
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <>
      <ParticleBurst active={showParticles} rarity={item.rarity} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(14, 30, 70, 0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(6px)',
      }}>
        <div style={{
          width: 'min(420px, 92vw)',
          background: '#ffffff',
          borderRadius: '20px',
          border: `2px solid ${cfg.border}`,
          boxShadow: `0 20px 60px rgba(37,99,235,0.15), 0 0 0 4px ${cfg.bg}`,
          overflow: 'hidden',
        }}>
          {/* Header bar */}
          <div style={{
            background: `linear-gradient(135deg, ${cfg.bg}, #f0f6ff)`,
            borderBottom: `1px solid ${cfg.border}`,
            padding: '14px 20px',
            display: 'flex', alignItems: 'center', gap: '10px',
          }}>
            <Lock style={{ width: 14, height: 14, color: cfg.color }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: cfg.text, letterSpacing: '0.05em' }}>
              UNLOCK REWARD
            </span>
            <div style={{
              marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%',
              background: '#22c55e',
              animation: 'pulse 1s infinite',
            }} />
          </div>

          <div style={{ padding: '28px 24px' }}>
            {phase === 'spin' && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{
                  width: '72px', height: '72px', margin: '0 auto 16px',
                  borderRadius: '50%',
                  border: `3px solid ${cfg.border}`,
                  borderTopColor: cfg.color,
                  animation: 'spin 0.6s linear infinite',
                }} />
                <p style={{ color: cfg.text, fontSize: '14px', fontWeight: 600 }}>
                  {th ? 'กำลังสุ่ม...' : 'Randomizing...'}
                </p>
              </div>
            )}

            {phase === 'reveal' && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{
                  fontSize: '64px', marginBottom: '16px',
                  animation: 'bounceIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)',
                  filter: item.rarity === 'legendary' ? `drop-shadow(0 0 20px ${cfg.color})` : 'none',
                }}>
                  {item.icon}
                </div>
                <div style={{
                  display: 'inline-block', marginBottom: '10px',
                  padding: '4px 16px',
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  borderRadius: '99px', fontSize: '12px', fontWeight: 700,
                  color: cfg.text, letterSpacing: '0.08em',
                }}>
                  {item.rarity.toUpperCase()}
                </div>
                <p style={{ color: '#0a1628', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  {th ? item.nameTh : item.name}
                </p>
              </div>
            )}

            {phase === 'show' && (
              <div>
                {/* Item display */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '16px', marginBottom: '16px',
                  background: cfg.bg,
                  borderRadius: '12px',
                  border: `1px solid ${cfg.border}`,
                }}>
                  <div style={{ fontSize: '40px' }}>{item.icon}</div>
                  <div>
                    <div style={{
                      display: 'inline-block', marginBottom: '4px',
                      padding: '2px 10px',
                      background: cfg.badge,
                      borderRadius: '99px', fontSize: '11px', fontWeight: 700,
                      color: cfg.text,
                    }}>
                      {item.rarity.toUpperCase()}
                    </div>
                    <p style={{ margin: 0, fontWeight: 700, color: '#0a1628', fontSize: '15px' }}>
                      {th ? item.nameTh : item.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '13px', color: '#1d4ed8' }}>
                      มูลค่า {item.value.toLocaleString()} บาท
                    </p>
                  </div>
                </div>

                {/* Credentials */}
                <div style={{
                  background: '#f8faff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '12px', padding: '16px', marginBottom: '16px',
                }}>
                  <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 600, color: '#1d4ed8', letterSpacing: '0.06em' }}>
                    🔐 CREDENTIALS UNLOCKED
                  </p>
                  {[
                    { label: 'USERNAME / ID', value: fakeId, key: 'id' },
                    { label: 'PASSWORD', value: fakePass, key: 'pass' },
                  ].map(row => (
                    <div key={row.key} style={{ marginBottom: '10px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '11px', color: '#64748b' }}>{row.label}</p>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: '#fff', border: '1px solid #bfdbfe',
                        borderRadius: '8px', padding: '8px 12px',
                      }}>
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#1e3a5f', fontFamily: 'monospace' }}>
                          {row.value}
                        </span>
                        <button
                          onClick={() => copy(row.value, row.key)}
                          style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            color: copied === row.key ? '#22c55e' : '#2563eb', padding: '2px',
                          }}
                        >
                          {copied === row.key ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Status */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px', marginBottom: '16px',
                  background: '#f0fdf4', border: '1px solid #86efac',
                  borderRadius: '8px',
                }}>
                  <Shield style={{ width: 14, height: 14, color: '#16a34a', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#166534', fontWeight: 600 }}>
                    {th ? 'ส่งอัตโนมัติแล้ว ✓' : 'AUTO-DELIVERED ✓'}
                  </span>
                </div>

                <button
                  onClick={onClose}
                  style={{
                    width: '100%', padding: '13px',
                    background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                    border: 'none', borderRadius: '10px',
                    color: '#fff', fontSize: '14px', fontWeight: 700,
                    cursor: 'pointer', letterSpacing: '0.03em',
                    boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                  }}
                >
                  {th ? '✓ รับรางวัลแล้ว' : '✓ CLAIM REWARD'}
                </button>
              </div>
            )}
          </div>
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg) } }
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
          @keyframes bounceIn { 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
        `}</style>
      </div>
    </>
  )
}

// ─── Pool Card ────────────────────────────────────────────────────────
function PoolCard({ pool, selected, onClick, locale }: {
  pool: MockPool; selected: boolean; onClick: () => void; locale: string
}) {
  const th = locale === 'th'
  const legRate = pool.items.find(i => i.rarity === 'legendary')?.dropRate || 0

  return (
    <div
      onClick={onClick}
      style={{
        background: '#ffffff',
        borderRadius: '16px',
        border: selected ? `2px solid ${pool.color}` : '1px solid #bfdbfe',
        overflow: 'hidden', cursor: 'pointer',
        boxShadow: selected
          ? `0 8px 32px ${pool.glowColor}, 0 2px 8px rgba(37,99,235,0.1)`
          : '0 2px 8px rgba(37,99,235,0.06)',
        transition: 'all 0.2s',
        transform: selected ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* Image */}
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#dbeafe' }}>
        <img src={pool.image} alt={pool.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} crossOrigin="anonymous" />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,22,40,0.6), transparent)' }} />

        {/* Legend rate badge */}
        <div style={{
          position: 'absolute', top: '8px', right: '8px',
          padding: '3px 10px',
          background: 'rgba(255,255,255,0.9)',
          borderRadius: '99px', fontSize: '11px', fontWeight: 700,
          color: '#b45309',
        }}>
          ★ {legRate}% Legend
        </div>

        {/* Game badge */}
        <div style={{
          position: 'absolute', top: '8px', left: '8px',
          padding: '3px 10px',
          background: pool.color,
          borderRadius: '99px', fontSize: '11px', fontWeight: 700,
          color: '#fff',
        }}>
          {pool.game === 'rov' ? 'ROV' : 'PES'}
        </div>

        <div style={{ position: 'absolute', bottom: '8px', left: '12px', right: '12px' }}>
          <p style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: '14px' }}>
            {th ? pool.nameTh : pool.name}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>ราคาต่อครั้ง</p>
          <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#2563eb' }}>
            ฿{pool.price.toLocaleString()}
          </p>
        </div>
        <div style={{
          padding: '6px 14px',
          background: selected ? pool.color : '#f0f6ff',
          borderRadius: '8px',
          fontSize: '12px', fontWeight: 700,
          color: selected ? '#fff' : '#2563eb',
          transition: 'all 0.2s',
        }}>
          {selected ? '✓ เลือกอยู่' : 'เลือก'}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function GachaPage() {
  const { user, updateBalance } = useAuthStore()
  const { pulls, addPull } = useGachaStore()
  const { locale } = useLocale()
  const th = locale === 'th'

  const [activeGame, setActiveGame] = useState<'rov' | 'pes'>('rov')
  const [selectedPoolId, setSelectedPoolId] = useState<string>('rov-legend')
  const [isSpinning, setIsSpinning] = useState(false)
  const [wonItem, setWonItem] = useState<MockItem | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [spinCount, setSpinCount] = useState(0)

  const liveFeed = useLiveFeed(activeGame)

  const pools = MOCK_POOLS.filter(p => p.game === activeGame)
  const pool  = MOCK_POOLS.find(p => p.id === selectedPoolId) || pools[0]

  // Switch game → reset pool
  useEffect(() => {
    setSelectedPoolId(activeGame === 'rov' ? 'rov-legend' : 'pes-legend')
  }, [activeGame])

  const pullGacha = useCallback(async () => {
    if (!user || !pool) return
    if (user.balance < pool.price) {
      toast.error(th ? 'ยอดเงินไม่พอ' : 'Insufficient balance')
      return
    }
    setIsSpinning(true)
    await new Promise(r => setTimeout(r, 600))

    // Client-side pull
    const rand = Math.random() * 100
    let cumulative = 0
    let winner: MockItem | null = null
    for (const item of pool.items) {
      cumulative += item.dropRate
      if (rand <= cumulative) { winner = item; break }
    }
    if (!winner) winner = pool.items[pool.items.length - 1]

    updateBalance(-pool.price)
    setSpinCount(c => c + 1)
    addPull({
      poolId: pool.id,
      userId: user.id,
      itemId: winner.id,
      item: winner as unknown as GachaItem,
      seed: Math.random().toString(36),
    })
    setWonItem(winner)
    setIsSpinning(false)
  }, [user, pool, updateBalance, addPull, th])

  const userPulls = pulls.filter(p => p.userId === user?.id)

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />

      <main className="flex-1">
        {/* Hero */}
        <section style={{
          background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 50%, #ecfdf5 100%)',
          borderBottom: '1px solid #bfdbfe',
          padding: '40px 16px 32px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: '-60px', left: '-60px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(37,99,235,0.06)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-40px', right: '-40px', width: '160px', height: '160px', borderRadius: '50%', background: 'rgba(6,182,212,0.06)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              padding: '4px 16px', marginBottom: '12px',
              background: '#dbeafe', border: '1px solid #93c5fd',
              borderRadius: '99px', fontSize: '12px', fontWeight: 600, color: '#1d4ed8',
            }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite' }} />
              {th ? 'ระบบออนไลน์ • ส่งอัตโนมัติ' : 'SYSTEM ONLINE • AUTO-DELIVERY'}
            </div>

            <h1 style={{
              fontSize: 'clamp(26px, 5vw, 48px)',
              fontWeight: 900, margin: '0 0 8px',
              background: 'linear-gradient(135deg, #1d4ed8, #0891b2)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              lineHeight: 1.1,
            }}>
              {th ? '🎮 ตู้สุ่มไอดีเกม' : '🎮 Game ID Gacha'}
            </h1>
            <p style={{ color: '#1d4ed8', fontSize: '14px', margin: '0 0 24px', opacity: 0.75 }}>
              {th ? 'สุ่มรับไอดีหายาก ROV & PES • ส่งทันทีอัตโนมัติ' : 'Random rare IDs — ROV & eFootball • Instant auto-delivery'}
            </p>

            {/* Game tabs */}
            <div style={{
              display: 'inline-flex',
              background: '#fff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px', padding: '4px',
              gap: '4px',
            }}>
              {([
                { id: 'rov', label: '⚔️ ROV', color: '#f97316' },
                { id: 'pes', label: '⚽ eFootball', color: '#16a34a' },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveGame(tab.id)}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '8px', border: 'none', cursor: 'pointer',
                    fontSize: '14px', fontWeight: 700,
                    background: activeGame === tab.id ? tab.color : 'transparent',
                    color: activeGame === tab.id ? '#fff' : '#64748b',
                    transition: 'all 0.2s',
                    boxShadow: activeGame === tab.id ? `0 4px 12px ${tab.color}40` : 'none',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Balance + History */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 16px', background: '#fff',
                  border: '1px solid #bfdbfe', borderRadius: '10px',
                }}>
                  <Coins style={{ width: 16, height: 16, color: '#2563eb' }} />
                  <span style={{ fontWeight: 700, color: '#1d4ed8' }}>{formatPrice(user.balance, locale)}</span>
                </div>
                <button
                  onClick={() => setShowHistory(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', background: '#fff',
                    border: '1px solid #bfdbfe', borderRadius: '10px',
                    color: '#1d4ed8', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  }}
                >
                  <History style={{ width: 14, height: 14 }} />
                  {th ? 'ประวัติ' : 'History'} {userPulls.length > 0 && `(${userPulls.length})`}
                </button>
              </div>
            )}
          </div>
        </section>

        <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px 16px 48px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '24px' }}>

            {/* Left: pools + spin */}
            <div>
              {/* Pool grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '16px', marginBottom: '28px',
              }}>
                {pools.map(p => (
                  <PoolCard
                    key={p.id}
                    pool={p}
                    selected={selectedPoolId === p.id}
                    onClick={() => setSelectedPoolId(p.id)}
                    locale={locale}
                  />
                ))}
              </div>

              {/* Selected pool spin area */}
              {pool && (
                <div style={{
                  background: '#ffffff',
                  borderRadius: '20px',
                  border: '1px solid #bfdbfe',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(37,99,235,0.08)',
                }}>
                  {/* Header */}
                  <div style={{
                    background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)',
                    borderBottom: '1px solid #bfdbfe',
                    padding: '16px 20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, color: '#1e3a5f', fontSize: '15px' }}>
                        {th ? pool.nameTh : pool.name}
                      </p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#1d4ed8', opacity: 0.7 }}>
                        {th ? pool.descriptionTh : pool.description}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      padding: '4px 12px',
                      background: '#f0fdf4', border: '1px solid #86efac',
                      borderRadius: '99px', fontSize: '11px', fontWeight: 600, color: '#166534',
                    }}>
                      <Shield style={{ width: 12, height: 12 }} />
                      {th ? 'พร้อมส่ง' : 'Ready'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '24px' }}>
                    {/* Left: Spin */}
                    <div>
                      {/* Spin box */}
                      <div style={{
                        aspectRatio: '1', maxWidth: '220px', margin: '0 auto 20px',
                        background: isSpinning ? '#eff6ff' : '#f8faff',
                        border: `2px solid ${isSpinning ? pool.color : '#bfdbfe'}`,
                        borderRadius: '20px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.3s',
                        boxShadow: isSpinning ? `0 0 0 6px ${pool.glowColor}` : 'none',
                      }}>
                        {isSpinning ? (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{
                              width: '56px', height: '56px', margin: '0 auto 12px',
                              border: `3px solid #bfdbfe`,
                              borderTopColor: pool.color,
                              borderRadius: '50%',
                              animation: 'spin 0.5s linear infinite',
                            }} />
                            <p style={{ color: '#1d4ed8', fontSize: '13px', fontWeight: 600, margin: 0 }}>
                              {th ? 'กำลังสุ่ม...' : 'Spinning...'}
                            </p>
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎲</div>
                            <p style={{ color: '#93c5fd', fontSize: '12px', margin: 0, fontWeight: 600 }}>
                              {th ? 'กดสุ่มด้านล่าง' : 'Press to Spin'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '12px 16px', marginBottom: '12px',
                        background: '#f0f6ff', border: '1px solid #bfdbfe', borderRadius: '10px',
                      }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>
                          {th ? 'ราคา' : 'Price'}
                        </span>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#2563eb' }}>
                          ฿{pool.price.toLocaleString()}
                        </span>
                      </div>

                      {/* Spin button */}
                      {user ? (
                        <button
                          onClick={pullGacha}
                          disabled={isSpinning || user.balance < pool.price}
                          style={{
                            width: '100%', padding: '14px', border: 'none',
                            borderRadius: '12px', cursor: isSpinning ? 'not-allowed' : 'pointer',
                            background: isSpinning || user.balance < pool.price
                              ? '#e0f0ff'
                              : `linear-gradient(135deg, #2563eb, #06b6d4)`,
                            color: isSpinning || user.balance < pool.price ? '#93c5fd' : '#fff',
                            fontSize: '15px', fontWeight: 800,
                            boxShadow: isSpinning ? 'none' : '0 6px 20px rgba(37,99,235,0.35)',
                            transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          }}
                        >
                          {isSpinning ? (
                            <><div style={{ width: '18px', height: '18px', border: '2px solid #93c5fd', borderTopColor: '#2563eb', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />{th ? 'กำลังสุ่ม...' : 'Spinning...'}</>
                          ) : (
                            <><Zap style={{ width: 18, height: 18 }} />{th ? '⚡ สุ่มเลย!' : '⚡ Spin Now!'}</>
                          )}
                        </button>
                      ) : (
                        <Link href="/login" style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                          padding: '14px', borderRadius: '12px',
                          background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                          color: '#fff', textDecoration: 'none',
                          fontSize: '15px', fontWeight: 800,
                          boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
                        }}>
                          {th ? 'เข้าสู่ระบบเพื่อสุ่ม' : 'Login to Spin'}
                          <ChevronRight style={{ width: 16, height: 16 }} />
                        </Link>
                      )}

                      {/* Spin stats */}
                      {spinCount > 0 && (
                        <div style={{
                          marginTop: '12px', padding: '8px 12px',
                          background: '#eff6ff', border: '1px solid #bfdbfe',
                          borderRadius: '8px', textAlign: 'center',
                          fontSize: '12px', color: '#1d4ed8',
                        }}>
                          {th ? `สุ่มแล้ว ${spinCount} ครั้ง` : `${spinCount} pulls total`}
                        </div>
                      )}
                    </div>

                    {/* Right: Drop rates */}
                    <div>
                      <p style={{ margin: '0 0 14px', fontSize: '12px', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.06em' }}>
                        📊 {th ? 'อัตราการสุ่ม' : 'DROP RATES'}
                      </p>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {pool.items.map(item => {
                          const cfg = RARITY[item.rarity as keyof typeof RARITY] || RARITY.common
                          return (
                            <div key={item.id} style={{
                              display: 'flex', alignItems: 'center', gap: '10px',
                              padding: '10px 12px',
                              background: cfg.bg,
                              border: `1px solid ${cfg.border}`,
                              borderRadius: '10px',
                            }}>
                              <div style={{
                                width: '32px', height: '32px', borderRadius: '8px',
                                background: '#fff', border: `1px solid ${cfg.border}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '16px', flexShrink: 0,
                              }}>
                                {item.icon}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{
                                  margin: 0, fontSize: '12px', fontWeight: 600, color: '#0a1628',
                                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                  {th ? item.nameTh : item.name}
                                </p>
                                <p style={{ margin: 0, fontSize: '10px', color: cfg.text, fontWeight: 600 }}>
                                  {cfg.labelTh}
                                </p>
                              </div>
                              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: cfg.color }}>
                                  {item.dropRate}%
                                </p>
                                <p style={{ margin: 0, fontSize: '10px', color: '#64748b' }}>
                                  ฿{item.value.toLocaleString()}
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>

                      {/* Drop rate bar */}
                      <div style={{ marginTop: '16px' }}>
                        <div style={{ display: 'flex', height: '8px', borderRadius: '99px', overflow: 'hidden', gap: '2px' }}>
                          {pool.items.map(item => {
                            const cfg = RARITY[item.rarity as keyof typeof RARITY] || RARITY.common
                            return (
                              <div key={item.id} style={{
                                flex: item.dropRate, background: cfg.color, transition: 'flex 0.3s',
                              }} />
                            )
                          })}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                          {pool.items.map(item => {
                            const cfg = RARITY[item.rarity as keyof typeof RARITY] || RARITY.common
                            return (
                              <span key={item.id} style={{ fontSize: '10px', color: cfg.color, fontWeight: 700 }}>
                                {item.dropRate}%
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Live feed */}
            <div style={{ position: 'sticky', top: '80px', alignSelf: 'start' }}>
              <div style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #bfdbfe',
                overflow: 'hidden',
                boxShadow: '0 4px 16px rgba(37,99,235,0.08)',
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #eff6ff, #f0f9ff)',
                  borderBottom: '1px solid #bfdbfe',
                  padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'pulse 1.5s infinite', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#1d4ed8' }}>
                    {th ? 'สุ่มล่าสุด' : 'LIVE PULLS'}
                  </span>
                  <span style={{
                    marginLeft: 'auto', fontSize: '10px', fontWeight: 700,
                    padding: '2px 8px', background: '#dbeafe',
                    border: '1px solid #93c5fd', borderRadius: '4px', color: '#1d4ed8',
                  }}>
                    LIVE
                  </span>
                </div>

                <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {liveFeed.map(f => {
                    const cfg = RARITY[f.rarity as keyof typeof RARITY] || RARITY.common
                    return (
                      <div key={f.id} style={{
                        padding: '10px 12px',
                        background: cfg.bg,
                        border: `1px solid ${cfg.border}`,
                        borderRadius: '10px',
                        borderLeft: `3px solid ${cfg.color}`,
                        transition: 'all 0.3s',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '11px', color: '#475569', fontWeight: 600 }}>{f.name}</span>
                          <span style={{ fontSize: '10px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <Clock style={{ width: 10, height: 10 }} />{f.ago}m
                          </span>
                        </div>
                        <p style={{
                          margin: 0, fontSize: '12px', fontWeight: 600, color: cfg.text,
                          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                          {f.item}
                        </p>
                        <span style={{
                          fontSize: '9px', fontWeight: 700,
                          padding: '1px 6px', background: cfg.badge,
                          borderRadius: '4px', color: cfg.text,
                        }}>
                          {f.rarity.toUpperCase()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Payment methods */}
              <div style={{
                marginTop: '16px', background: '#ffffff',
                border: '1px solid #bfdbfe', borderRadius: '16px', padding: '16px',
              }}>
                <p style={{ margin: '0 0 12px', fontSize: '11px', fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.06em' }}>
                  💳 {th ? 'ช่องทางชำระเงิน' : 'PAYMENT METHODS'}
                </p>
                {['PromptPay', 'TrueMoney', 'KBank', 'SCB', 'BBL'].map(m => (
                  <div key={m} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '7px 0', borderBottom: '1px solid #f0f6ff',
                  }}>
                    <span style={{ fontSize: '13px', color: '#1e3a5f', fontWeight: 500 }}>{m}</span>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e' }} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Unlock overlay */}
      {wonItem && <UnlockOverlay item={wonItem} locale={locale} onClose={() => setWonItem(null)} />}

      {/* History dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent style={{ background: '#ffffff', border: '1px solid #bfdbfe', maxWidth: '480px' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1e3a5f', fontWeight: 700 }}>
            📜 {th ? 'ประวัติการสุ่ม' : 'Pull History'}
          </h3>
          <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {userPulls.length > 0 ? userPulls.slice().reverse().map(p => {
              const cfg = RARITY[(p.item as unknown as MockItem).rarity as keyof typeof RARITY] || RARITY.common
              const mi = p.item as unknown as MockItem
              return (
                <div key={p.id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '10px 12px',
                  background: cfg.bg, border: `1px solid ${cfg.border}`,
                  borderRadius: '10px',
                }}>
                  <div style={{ fontSize: '28px' }}>{mi.icon || '🎁'}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#0a1628', fontSize: '13px' }}>
                      {th ? mi.nameTh : mi.name}
                    </p>
                    <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                      {new Date(p.createdAt).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <span style={{
                    padding: '3px 10px', fontSize: '10px', fontWeight: 700,
                    background: cfg.badge, border: `1px solid ${cfg.border}`,
                    borderRadius: '6px', color: cfg.text,
                  }}>
                    {cfg.labelTh}
                  </span>
                </div>
              )
            }) : (
              <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
                {th ? 'ยังไม่มีประวัติการสุ่ม' : 'No pull history yet'}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes bounceIn{ 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  )
}
