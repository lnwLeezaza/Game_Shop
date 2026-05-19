'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import {
  Zap, Shield, Copy, Check, ChevronRight, Clock,
  Coins, History, Lock,
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
  game: 'rov' | 'pes' | 'freefire' | 'mlbb' | 'pubg'
  name: string
  nameTh: string
  description: string
  descriptionTh: string
  price: number
  color: string
  colorB: string
  glowColor: string
  emoji: string
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

// ─── Game config ──────────────────────────────────────────────────────
const GAMES = {
  rov:      { label: 'ROV',          emoji: '⚔️', colorA: '#ef4444', colorB: '#991b1b', logo: '/gamespic/rov.png'      },
  freefire: { label: 'Free Fire',    emoji: '🔥', colorA: '#f97316', colorB: '#c2410c', logo: '/gamespic/freefire.jpg' },
  mlbb:     { label: 'MLBB',         emoji: '🏆', colorA: '#3b82f6', colorB: '#1d4ed8', logo: '/gamespic/mlbb.jpg'     },
  pubg:     { label: 'PUBG Mobile',  emoji: '🎯', colorA: '#eab308', colorB: '#a16207', logo: null                    },
  pes:      { label: 'eFootball',    emoji: '⚽', colorA: '#22c55e', colorB: '#15803d', logo: '/gamespic/pes.jpg'      },
} as const

// ─── Rarity ──────────────────────────────────────────────────────────
// สีของ rarity ยังคงเป็น hardcoded เพราะเป็น identity ของ item ไม่ใช่ theme
const RARITY = {
  common:    { label: 'Common',    labelTh: 'ธรรมดา', color: '#64748b', glow: 'rgba(100,116,139,0.35)', bg: 'rgba(100,116,139,0.08)',  border: 'rgba(100,116,139,0.25)'  },
  rare:      { label: 'Rare',      labelTh: 'หายาก',  color: '#2563eb', glow: 'rgba(37,99,235,0.4)',    bg: 'rgba(37,99,235,0.08)',    border: 'rgba(37,99,235,0.3)'    },
  epic:      { label: 'Epic',      labelTh: 'เอพิค',  color: '#7c3aed', glow: 'rgba(124,58,237,0.4)',   bg: 'rgba(124,58,237,0.08)',   border: 'rgba(124,58,237,0.3)'   },
  legendary: { label: 'Legendary', labelTh: 'ตำนาน',  color: '#d97706', glow: 'rgba(217,119,6,0.5)',    bg: 'rgba(217,119,6,0.1)',     border: 'rgba(217,119,6,0.35)'   },
} as const

// ─── Pool Data ────────────────────────────────────────────────────────
const MOCK_POOLS: MockPool[] = [
  // ROV
  { id: 'rov-legend', game: 'rov', name: 'ROV Legend Account', nameTh: 'ตู้สุ่มไอดี ROV ตำนาน', description: 'Legendary skins & ranks', descriptionTh: 'สกินตำนาน แรงค์สูง', price: 199, color: '#ef4444', colorB: '#991b1b', glowColor: 'rgba(239,68,68,0.3)', emoji: '👑',
    items: [
      { id: 'rl1', name: 'Full Legendary Skin Account', nameTh: 'ไอดีสกิน Legendary ครบ', rarity: 'legendary', dropRate: 3,  value: 2999, icon: '👑' },
      { id: 'rl2', name: 'Epic Bundle Account',         nameTh: 'ไอดีสกิน Epic ครบชุด',   rarity: 'epic',      dropRate: 12, value: 899,  icon: '💎' },
      { id: 'rl3', name: 'Rare Hero Account',           nameTh: 'ไอดีฮีโร่ครบ Rare',      rarity: 'rare',      dropRate: 30, value: 399,  icon: '⭐' },
      { id: 'rl4', name: 'Starter Account',             nameTh: 'ไอดีเริ่มต้น',            rarity: 'common',    dropRate: 55, value: 99,   icon: '🎮' },
    ],
  },
  { id: 'rov-rank', game: 'rov', name: 'ROV High Rank', nameTh: 'ตู้สุ่มไอดีแรงค์สูง', description: 'Challenger & Grandmaster', descriptionTh: 'Challenger และ Grandmaster', price: 249, color: '#f97316', colorB: '#c2410c', glowColor: 'rgba(249,115,22,0.3)', emoji: '🏆',
    items: [
      { id: 'rr1', name: 'Challenger Account',   nameTh: 'ไอดีแรงค์ Challenger',  rarity: 'legendary', dropRate: 3,  value: 4999, icon: '👑' },
      { id: 'rr2', name: 'Grandmaster Account',  nameTh: 'ไอดีแรงค์ Grandmaster', rarity: 'epic',      dropRate: 12, value: 1499, icon: '💎' },
      { id: 'rr3', name: 'Master Account',       nameTh: 'ไอดีแรงค์ Master',      rarity: 'rare',      dropRate: 30, value: 599,  icon: '⭐' },
      { id: 'rr4', name: 'Diamond Rank Account', nameTh: 'ไอดีแรงค์ Diamond',     rarity: 'common',    dropRate: 55, value: 149,  icon: '🎮' },
    ],
  },
  { id: 'rov-hero', game: 'rov', name: 'ROV All Heroes', nameTh: 'ตู้สุ่มไอดีครบฮีโร่', description: 'All heroes unlocked', descriptionTh: 'ปลดล็อคฮีโร่ครบทุกตัว', price: 99, color: '#8b5cf6', colorB: '#6d28d9', glowColor: 'rgba(139,92,246,0.3)', emoji: '⚔️',
    items: [
      { id: 'rh1', name: 'All Heroes + All Skins',  nameTh: 'ครบฮีโร่ + ครบสกิน',      rarity: 'legendary', dropRate: 2,  value: 3499, icon: '👑' },
      { id: 'rh2', name: 'All Heroes + Epic Skins', nameTh: 'ครบฮีโร่ + สกิน Epic',     rarity: 'epic',      dropRate: 8,  value: 799,  icon: '💎' },
      { id: 'rh3', name: 'All Heroes Account',      nameTh: 'ไอดีครบฮีโร่',             rarity: 'rare',      dropRate: 35, value: 349,  icon: '⭐' },
      { id: 'rh4', name: 'Most Heroes Account',     nameTh: 'ไอดีเยอะฮีโร่',            rarity: 'common',    dropRate: 55, value: 89,   icon: '🎮' },
    ],
  },

  // Free Fire
  { id: 'ff-heroic', game: 'freefire', name: 'Free Fire Heroic', nameTh: 'ตู้สุ่มไอดี FF Heroic', description: 'Heroic rank & rare skins', descriptionTh: 'แรงค์ Heroic สกินหายาก', price: 149, color: '#f97316', colorB: '#c2410c', glowColor: 'rgba(249,115,22,0.3)', emoji: '🔥',
    items: [
      { id: 'ff1', name: 'Heroic + Elite Skins',   nameTh: 'Heroic + สกิน Elite',   rarity: 'legendary', dropRate: 4,  value: 2499, icon: '👑' },
      { id: 'ff2', name: 'Platinum + Epic Skins',  nameTh: 'Platinum + สกิน Epic',  rarity: 'epic',      dropRate: 14, value: 799,  icon: '💎' },
      { id: 'ff3', name: 'Gold + Rare Skins',      nameTh: 'Gold + สกิน Rare',      rarity: 'rare',      dropRate: 32, value: 349,  icon: '⭐' },
      { id: 'ff4', name: 'Silver Starter',         nameTh: 'Silver เริ่มต้น',       rarity: 'common',    dropRate: 50, value: 89,   icon: '🎮' },
    ],
  },
  { id: 'ff-diamond', game: 'freefire', name: 'Free Fire Diamond', nameTh: 'ตู้สุ่มไอดีเพชรสูง FF', description: 'High diamond accounts', descriptionTh: 'ไอดีเพชรสูง', price: 119, color: '#06b6d4', colorB: '#0284c7', glowColor: 'rgba(6,182,212,0.3)', emoji: '💎',
    items: [
      { id: 'fd1', name: 'Max Diamond + Skins',   nameTh: 'เพชรสูงสุด + สกิน',   rarity: 'legendary', dropRate: 5,  value: 1999, icon: '👑' },
      { id: 'fd2', name: 'High Diamond + Bundle', nameTh: 'เพชรสูง + Bundle',     rarity: 'epic',      dropRate: 15, value: 699,  icon: '💎' },
      { id: 'fd3', name: 'Mid Diamond',           nameTh: 'เพชรปานกลาง',          rarity: 'rare',      dropRate: 30, value: 299,  icon: '⭐' },
      { id: 'fd4', name: 'Starter Diamond',       nameTh: 'เพชรเริ่มต้น',         rarity: 'common',    dropRate: 50, value: 79,   icon: '🎮' },
    ],
  },

  // MLBB
  { id: 'mlbb-myth', game: 'mlbb', name: 'MLBB Mythical Glory', nameTh: 'ตู้สุ่มไอดี ML Mythical', description: 'Mythical Glory & Epic skins', descriptionTh: 'Mythical Glory สกิน Epic+', price: 179, color: '#3b82f6', colorB: '#1d4ed8', glowColor: 'rgba(59,130,246,0.3)', emoji: '🏆',
    items: [
      { id: 'ml1', name: 'Mythical Glory + Legend Skins', nameTh: 'Mythical Glory + สกินตำนาน', rarity: 'legendary', dropRate: 3,  value: 3499, icon: '👑' },
      { id: 'ml2', name: 'Mythical + Epic Skins',         nameTh: 'Mythical + สกิน Epic',       rarity: 'epic',      dropRate: 12, value: 999,  icon: '💎' },
      { id: 'ml3', name: 'Legend Rank Account',           nameTh: 'ไอดีแรงค์ Legend',           rarity: 'rare',      dropRate: 30, value: 449,  icon: '⭐' },
      { id: 'ml4', name: 'Epic Rank Account',             nameTh: 'ไอดีแรงค์ Epic',             rarity: 'common',    dropRate: 55, value: 119,  icon: '🎮' },
    ],
  },
  { id: 'mlbb-skin', game: 'mlbb', name: 'MLBB Special Skin', nameTh: 'ตู้สุ่มไอดีสกินพิเศษ ML', description: 'Limited & collector skins', descriptionTh: 'สกิน Limited สุดหายาก', price: 229, color: '#a855f7', colorB: '#7c3aed', glowColor: 'rgba(168,85,247,0.3)', emoji: '✨',
    items: [
      { id: 'ms1', name: 'Collector Skin Account', nameTh: 'ไอดีสกิน Collector',    rarity: 'legendary', dropRate: 2,  value: 5999, icon: '👑' },
      { id: 'ms2', name: 'Special Skin Bundle',    nameTh: 'ไอดีสกิน Special ครบ', rarity: 'epic',      dropRate: 10, value: 1499, icon: '💎' },
      { id: 'ms3', name: 'Elite Skin Account',     nameTh: 'ไอดีสกิน Elite',        rarity: 'rare',      dropRate: 28, value: 599,  icon: '⭐' },
      { id: 'ms4', name: 'Normal Skin Account',    nameTh: 'ไอดีสกินทั่วไป',        rarity: 'common',    dropRate: 60, value: 149,  icon: '🎮' },
    ],
  },

  // PUBG
  { id: 'pubg-uc', game: 'pubg', name: 'PUBG Max UC Account', nameTh: 'ตู้สุ่มไอดี PUBG UC สูง', description: 'High UC & rare outfits', descriptionTh: 'UC เยอะ ชุดหายาก', price: 159, color: '#eab308', colorB: '#a16207', glowColor: 'rgba(234,179,8,0.3)', emoji: '🎯',
    items: [
      { id: 'pu1', name: 'Max UC + Legendary Outfit', nameTh: 'UC สูงสุด + ชุด Legendary', rarity: 'legendary', dropRate: 4,  value: 2999, icon: '👑' },
      { id: 'pu2', name: 'High UC + Epic Outfit',     nameTh: 'UC สูง + ชุด Epic',         rarity: 'epic',      dropRate: 14, value: 899,  icon: '💎' },
      { id: 'pu3', name: 'Mid UC Account',            nameTh: 'ไอดี UC ปานกลาง',          rarity: 'rare',      dropRate: 30, value: 349,  icon: '⭐' },
      { id: 'pu4', name: 'Starter UC Account',        nameTh: 'ไอดี UC เริ่มต้น',         rarity: 'common',    dropRate: 52, value: 99,   icon: '🎮' },
    ],
  },
  { id: 'pubg-rank', game: 'pubg', name: 'PUBG Conqueror Account', nameTh: 'ตู้สุ่มไอดี PUBG Conqueror', description: 'Conqueror & Ace rank', descriptionTh: 'แรงค์ Conqueror และ Ace', price: 299, color: '#f97316', colorB: '#c2410c', glowColor: 'rgba(249,115,22,0.3)', emoji: '🔫',
    items: [
      { id: 'pk1', name: 'Conqueror + KD 5+',  nameTh: 'Conqueror + KD 5+',       rarity: 'legendary', dropRate: 3,  value: 5999, icon: '👑' },
      { id: 'pk2', name: 'Ace + Good KD',      nameTh: 'Ace + KD ดี',             rarity: 'epic',      dropRate: 12, value: 1499, icon: '💎' },
      { id: 'pk3', name: 'Crown Rank Account', nameTh: 'ไอดีแรงค์ Crown',         rarity: 'rare',      dropRate: 30, value: 549,  icon: '⭐' },
      { id: 'pk4', name: 'Diamond Account',    nameTh: 'ไอดีแรงค์ Diamond',       rarity: 'common',    dropRate: 55, value: 149,  icon: '🎮' },
    ],
  },

  // PES
  { id: 'pes-legend', game: 'pes', name: 'eFootball Legend Squad', nameTh: 'ตู้สุ่มไอดี PES ทีมตำนาน', description: 'Top squad + GP coins', descriptionTh: 'ทีมตำนาน + GP สูง', price: 199, color: '#22c55e', colorB: '#15803d', glowColor: 'rgba(34,197,94,0.3)', emoji: '⚽',
    items: [
      { id: 'pl1', name: 'Full Legend Squad + 999M GP', nameTh: 'ทีมตำนานครบ + GP 999M', rarity: 'legendary', dropRate: 3,  value: 3999, icon: '👑' },
      { id: 'pl2', name: 'Epic Squad + 500M GP',        nameTh: 'ทีม Epic + GP 500M',     rarity: 'epic',      dropRate: 12, value: 999,  icon: '💎' },
      { id: 'pl3', name: 'Good Squad + GP',             nameTh: 'ทีมดี + GP',             rarity: 'rare',      dropRate: 30, value: 399,  icon: '⭐' },
      { id: 'pl4', name: 'Starter Squad',               nameTh: 'ไอดีเริ่มต้น',           rarity: 'common',    dropRate: 55, value: 99,   icon: '⚽' },
    ],
  },
  { id: 'pes-player', game: 'pes', name: 'eFootball Star Players', nameTh: 'ตู้สุ่มไอดีนักเตะดาว', description: 'Mbappe, Ronaldo, Messi', descriptionTh: 'เอ็มบาเป้ โรนัลโด้ เมสซี่', price: 249, color: '#06b6d4', colorB: '#0284c7', glowColor: 'rgba(6,182,212,0.3)', emoji: '🌟',
    items: [
      { id: 'pp1', name: 'Mbappe + Messi Black Label', nameTh: 'เอ็มบาเป้ + เมสซี่ Black', rarity: 'legendary', dropRate: 2,  value: 4999, icon: '👑' },
      { id: 'pp2', name: 'Top 5 Star Players',         nameTh: 'นักเตะดาวดัง 5 คน',        rarity: 'epic',      dropRate: 10, value: 1299, icon: '💎' },
      { id: 'pp3', name: '3 Star Players Squad',       nameTh: 'ทีมนักเตะดาว 3 คน',        rarity: 'rare',      dropRate: 28, value: 499,  icon: '⭐' },
      { id: 'pp4', name: 'Good Players Account',       nameTh: 'ไอดีนักเตะดี',             rarity: 'common',    dropRate: 60, value: 119,  icon: '⚽' },
    ],
  },
]

// ─── Live feed ────────────────────────────────────────────────────────
const FAKE_NAMES = ['SiamGamer99', 'xXProHunter', 'ThaiROV', 'RushB_TH', 'EliteProwler', 'GoldRanker', 'GhostPlayer', 'ThunderBlade', 'NightCrawler', 'PixelWarrior']
const FAKE_ITEMS: Record<string, string[]> = {
  rov:      ['ไอดี ROV ตำนาน 👑', 'ไอดีแรงค์ Challenger', 'สกิน Epic ครบ 💎', 'ไอดีฮีโร่ครบ'],
  freefire: ['ไอดี FF Heroic 🔥', 'เพชรสูงสุด 💎', 'ไอดีสกิน Elite', 'Platinum + Bundle'],
  mlbb:     ['Mythical Glory 🏆', 'สกิน Collector ✨', 'ไอดีแรงค์ Legend', 'สกิน Special'],
  pubg:     ['Conqueror KD5+ 🎯', 'ไอดี UC สูงสุด', 'Ace + KD ดี', 'Crown Rank'],
  pes:      ['ทีมตำนาน PES ⚽', 'GP 9.9ล้าน 🌟', 'เอ็มบาเป้ Black', 'Super Division'],
}

function useLiveFeed(game: string) {
  const [feed, setFeed] = useState<{ id: number; name: string; item: string; rarity: string; ago: number }[]>([])
  const counter = useRef(0)
  useEffect(() => {
    const items = FAKE_ITEMS[game] || FAKE_ITEMS.rov
    const add = () => {
      const rarity = Math.random() < 0.04 ? 'legendary' : Math.random() < 0.14 ? 'epic' : Math.random() < 0.34 ? 'rare' : 'common'
      const item = items[Math.floor(Math.random() * items.length)]
      setFeed(prev => [{ id: counter.current++, name: FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)], item, rarity, ago: 1 }, ...prev.slice(0, 7)].map((f, i) => ({ ...f, ago: i + 1 })))
    }
    add()
    const t = setInterval(add, 3500)
    return () => clearInterval(t)
  }, [game])
  return feed
}

// ─── Particle burst ───────────────────────────────────────────────────
function ParticleBurst({ active, color }: { active: boolean; color: string }) {
  if (!active) return null
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998 }}>
      {Array.from({ length: 28 }).map((_, i) => {
        const angle = (i / 28) * 360
        const dist = 90 + Math.random() * 130
        return (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: i % 3 === 0 ? '10px' : '6px', height: i % 3 === 0 ? '10px' : '6px',
            borderRadius: i % 4 === 0 ? '2px' : '50%',
            background: i % 2 === 0 ? color : 'var(--primary)',
            animation: `burst${i} 0.9s cubic-bezier(0,0.8,0.2,1) forwards`,
          }} />
        )
        void dist; void angle
      })}
      <style>{Array.from({ length: 28 }).map((_, i) => {
        const angle = (i / 28) * 360
        const dist = 90 + (i * 7 % 130)
        return `@keyframes burst${i}{0%{transform:translate(-50%,-50%) scale(1.2);opacity:1}100%{transform:translate(calc(-50% + ${Math.cos(angle * Math.PI / 180) * dist}px),calc(-50% + ${Math.sin(angle * Math.PI / 180) * dist}px)) scale(0);opacity:0}}`
      }).join('')}</style>
    </div>
  )
}

// ─── Unlock overlay ───────────────────────────────────────────────────
function UnlockOverlay({ item, poolColor, onClose, locale }: {
  item: MockItem; poolColor: string; onClose: () => void; locale: string
}) {
  const [phase, setPhase] = useState<'spin' | 'reveal' | 'show'>('spin')
  const [copied, setCopied] = useState<string | null>(null)
  const [burst, setBurst] = useState(false)
  const th = locale === 'th'
  const cfg = RARITY[item.rarity]

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 1500)
    const t2 = setTimeout(() => { setPhase('show'); setBurst(true) }, 2500)
    const t3 = setTimeout(() => setBurst(false), 3400)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  const fakeId   = `UID-${Math.random().toString(36).substring(2, 9).toUpperCase()}`
  const fakePass = `PWD-${Math.random().toString(36).substring(2, 11).toUpperCase()}`

  const copy = (v: string, k: string) => {
    navigator.clipboard.writeText(v).catch(() => {})
    setCopied(k)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <>
      <ParticleBurst active={burst} color={cfg.color} />
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(10,22,40,0.82)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{
          width: 'min(400px, 94vw)',
          background: 'var(--card)',
          borderRadius: '20px',
          border: `1px solid ${cfg.border}`,
          boxShadow: `0 0 60px ${cfg.glow}, 0 24px 48px rgba(0,0,0,0.15)`,
          overflow: 'hidden',
        }}>
          {/* top bar */}
          <div style={{ height: '3px', background: `linear-gradient(90deg, ${cfg.color}, ${poolColor})` }} />
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Lock style={{ width: 13, height: 13, color: cfg.color }} />
            <span style={{ fontSize: '11px', fontWeight: 700, color: cfg.color, letterSpacing: '0.1em' }}>UNLOCK REWARD</span>
            <div style={{ marginLeft: 'auto', width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a', animation: 'glow-pulse 1.2s infinite' }} />
          </div>

          <div style={{ padding: '28px 24px' }}>
            {phase === 'spin' && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: '64px', height: '64px', margin: '0 auto 16px', borderRadius: '50%', border: `2px solid var(--border)`, borderTopColor: poolColor, animation: 'spin 0.5s linear infinite' }} />
                <p style={{ color: 'var(--muted-foreground)', fontSize: '13px', fontWeight: 500 }}>{th ? 'กำลังสุ่มรางวัล...' : 'Randomizing...'}</p>
              </div>
            )}

            {phase === 'reveal' && (
              <div style={{ textAlign: 'center', padding: '24px 0', animation: 'fadeUp 0.4s ease' }}>
                <div style={{ fontSize: '72px', marginBottom: '16px', filter: item.rarity === 'legendary' ? `drop-shadow(0 0 24px ${cfg.color})` : 'none', animation: 'bounceIn 0.5s cubic-bezier(0.175,0.885,0.32,1.275)' }}>{item.icon}</div>
                <div style={{ display: 'inline-block', padding: '4px 18px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '99px', fontSize: '11px', fontWeight: 800, color: cfg.color, letterSpacing: '0.1em', marginBottom: '12px' }}>{item.rarity.toUpperCase()}</div>
                <p style={{ color: 'var(--foreground)', fontSize: '18px', fontWeight: 800, margin: 0 }}>{th ? item.nameTh : item.name}</p>
              </div>
            )}

            {phase === 'show' && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                {/* item card */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '12px', marginBottom: '16px' }}>
                  <div style={{ fontSize: '36px' }}>{item.icon}</div>
                  <div>
                    <div style={{ display: 'inline-block', padding: '2px 10px', background: 'var(--muted)', border: `1px solid ${cfg.border}`, borderRadius: '99px', fontSize: '10px', fontWeight: 800, color: cfg.color, marginBottom: '4px' }}>{item.rarity.toUpperCase()}</div>
                    <p style={{ margin: 0, color: 'var(--foreground)', fontSize: '14px', fontWeight: 700 }}>{th ? item.nameTh : item.name}</p>
                    <p style={{ margin: 0, fontSize: '12px', color: cfg.color }}>มูลค่า ฿{item.value.toLocaleString()}</p>
                  </div>
                </div>
                {/* credentials */}
                <div style={{ background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '12px', padding: '14px', marginBottom: '14px' }}>
                  <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.1em' }}>🔐 ACCOUNT CREDENTIALS</p>
                  {[{ label: 'USERNAME', value: fakeId, key: 'id' }, { label: 'PASSWORD', value: fakePass, key: 'pass' }].map(row => (
                    <div key={row.key} style={{ marginBottom: '8px' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '10px', color: 'var(--muted-foreground)' }}>{row.label}</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px' }}>
                        <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', fontFamily: 'monospace' }}>{row.value}</span>
                        <button onClick={() => copy(row.value, row.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied === row.key ? '#16a34a' : 'var(--muted-foreground)', padding: '2px' }}>
                          {copied === row.key ? <Check style={{ width: 13, height: 13 }} /> : <Copy style={{ width: 13, height: 13 }} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* delivered */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: '8px', marginBottom: '14px' }}>
                  <Shield style={{ width: 13, height: 13, color: '#16a34a', flexShrink: 0 }} />
                  <span style={{ fontSize: '12px', color: '#15803d', fontWeight: 600 }}>{th ? 'ส่งอัตโนมัติสำเร็จ ✓' : 'AUTO-DELIVERED ✓'}</span>
                </div>
                <button onClick={onClose} style={{ width: '100%', padding: '13px', background: `linear-gradient(135deg, ${poolColor}, ${cfg.color})`, border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: 800, cursor: 'pointer', boxShadow: `0 4px 20px ${cfg.glow}` }}>
                  {th ? '✓ รับรางวัลแล้ว' : '✓ CLAIM REWARD'}
                </button>
              </div>
            )}
          </div>
        </div>
        <style>{`
          @keyframes spin     { to { transform: rotate(360deg) } }
          @keyframes fadeUp   { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }
          @keyframes bounceIn { 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.18)} 100%{transform:scale(1);opacity:1} }
          @keyframes glow-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0.4)} 50%{box-shadow:0 0 0 4px rgba(22,163,74,0)} }
        `}</style>
      </div>
    </>
  )
}

// ─── Pool card (compact) ──────────────────────────────────────────────
function PoolCard({ pool, selected, onClick, locale }: {
  pool: MockPool; selected: boolean; onClick: () => void; locale: string
}) {
  const th = locale === 'th'
  const legRate = pool.items.find(i => i.rarity === 'legendary')?.dropRate ?? 0
  return (
    <div onClick={onClick} style={{
      background: selected
        ? `linear-gradient(135deg, ${pool.color}14, ${pool.colorB}0a)`
        : 'var(--card)',
      borderRadius: '14px',
      border: selected ? `1.5px solid ${pool.color}` : '1px solid var(--border)',
      padding: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: selected ? `0 0 20px ${pool.glowColor}, 0 4px 16px rgba(0,0,0,0.06)` : '0 1px 4px rgba(0,0,0,0.04)',
      transform: selected ? 'translateY(-2px)' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `linear-gradient(135deg, ${pool.color}, ${pool.colorB})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0, boxShadow: selected ? `0 4px 12px ${pool.glowColor}` : 'none' }}>
          {pool.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ margin: 0, fontSize: '12px', fontWeight: 700, color: 'var(--foreground)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{th ? pool.nameTh : pool.name}</p>
          <p style={{ margin: '2px 0 0', fontSize: '10px', color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{th ? pool.descriptionTh : pool.description}</p>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
        <span style={{ fontSize: '16px', fontWeight: 800, color: selected ? pool.color : 'var(--foreground)' }}>฿{pool.price}</span>
        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', background: 'rgba(217,119,6,0.12)', border: '1px solid rgba(217,119,6,0.3)', borderRadius: '99px', color: '#d97706' }}>★{legRate}%</span>
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

  const [activeGame, setActiveGame] = useState<'rov' | 'pes' | 'freefire' | 'mlbb' | 'pubg'>('rov')
  const [selectedPoolId, setSelectedPoolId] = useState('rov-legend')
  const [isSpinning, setIsSpinning] = useState(false)
  const [wonItem, setWonItem] = useState<MockItem | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [spinCount, setSpinCount] = useState(0)

  const defaultPools: Record<string, string> = { rov: 'rov-legend', freefire: 'ff-heroic', mlbb: 'mlbb-myth', pubg: 'pubg-uc', pes: 'pes-legend' }

  const liveFeed = useLiveFeed(activeGame)
  const pools = MOCK_POOLS.filter(p => p.game === activeGame)
  const pool  = MOCK_POOLS.find(p => p.id === selectedPoolId) || pools[0]

  useEffect(() => { setSelectedPoolId(defaultPools[activeGame]) }, [activeGame])

  const pullGacha = useCallback(async () => {
    if (!user || !pool) return
    if (user.balance < pool.price) { toast.error(th ? 'ยอดเงินไม่พอ' : 'Insufficient balance'); return }
    setIsSpinning(true)
    await new Promise(r => setTimeout(r, 700))
    const rand = Math.random() * 100
    let cum = 0; let winner: MockItem | null = null
    for (const item of pool.items) { cum += item.dropRate; if (rand <= cum) { winner = item; break } }
    if (!winner) winner = pool.items[pool.items.length - 1]
    updateBalance(-pool.price)
    setSpinCount(c => c + 1)
    addPull({ poolId: pool.id, userId: user.id, itemId: winner.id, item: winner as unknown as GachaItem, seed: Math.random().toString(36) })
    setWonItem(winner)
    setIsSpinning(false)
  }, [user, pool, updateBalance, addPull, th])

  const userPulls = pulls.filter(p => p.userId === user?.id)
  const gameKeys = ['rov', 'freefire', 'mlbb', 'pubg', 'pes'] as const

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', display: 'flex', flexDirection: 'column' }}>
      <Header />

      <main style={{ flex: 1 }}>
        {/* ── Hero ── */}
        <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid var(--border)', padding: '48px 16px 36px', textAlign: 'center' }}>
          {/* BG grid */}
          <div style={{ position: 'absolute', inset: 0, opacity: 0.5, backgroundImage: 'linear-gradient(var(--border) 1px,transparent 1px),linear-gradient(90deg,var(--border) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
          {/* glow blobs — ใช้ primary/accent จาก theme */}
          <div style={{ position: 'absolute', top: '-80px', left: '20%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.12), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '-60px', right: '15%', width: '260px', height: '260px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.10), transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* live badge */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '5px 16px', marginBottom: '16px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.25)', borderRadius: '99px', fontSize: '11px', fontWeight: 700, color: '#15803d' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', animation: 'glow-pulse 1.5s infinite' }} />
              ระบบออนไลน์ · ส่งอัตโนมัติ 24/7
            </div>

            <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(28px,5vw,52px)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em' }}>
              <span style={{ color: 'var(--foreground)' }}>🎮 ตู้สุ่ม</span>
              <span style={{ 
                backgroundImage: `linear-gradient(135deg, ${GAMES[activeGame].colorA}, ${GAMES[activeGame].colorB})`, 
                WebkitBackgroundClip: 'text', 
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent', 
                color: 'transparent', 
                display: 'inline-block' 
              }}> ไอดีเกม</span>
            </h1>
            <p style={{ margin: '0 0 28px', color: 'var(--muted-foreground)', fontSize: '14px' }}>
              สุ่มรับไอดีหายาก 5 เกม · ส่งทันทีอัตโนมัติ · รับประกัน 24 ชม.
            </p>
            {/* Game selector tabs */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {gameKeys.map(g => {
                const gCfg = GAMES[g]
                const isActive = activeGame === g
                return (
                  <button key={g} onClick={() => setActiveGame(g)} style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    padding: '9px 18px', borderRadius: '10px', border: isActive ? 'none' : '1px solid var(--border)', cursor: 'pointer',
                    background: isActive ? `linear-gradient(135deg, ${gCfg.colorA}, ${gCfg.colorB})` : 'var(--card)',
                    color: isActive ? '#fff' : 'var(--muted-foreground)',
                    fontSize: '13px', fontWeight: 700,
                    boxShadow: isActive ? `0 4px 16px ${gCfg.colorA}45` : '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'all 0.2s',
                    transform: isActive ? 'translateY(-2px)' : 'none',
                  }}>
                    <span>{gCfg.emoji}</span>{gCfg.label}
                  </button>
                )
              })}
            </div>

            {/* balance + history */}
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px' }}>
                  <Coins style={{ width: 14, height: 14, color: '#d97706' }} />
                  <span style={{ fontWeight: 700, color: '#d97706' }}>{formatPrice(user.balance, locale)}</span>
                </div>
                <button onClick={() => setShowHistory(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '10px', color: 'var(--muted-foreground)', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                  <History style={{ width: 13, height: 13 }} />{th ? 'ประวัติ' : 'History'}{userPulls.length > 0 && ` (${userPulls.length})`}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Main content ── */}
        <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '28px 16px 60px', display: 'grid', gridTemplateColumns: '1fr 270px', gap: '24px' }}>

          {/* Left */}
          <div>
            {/* Pool grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '24px' }}>
              {pools.map(p => (
                <PoolCard key={p.id} pool={p} selected={selectedPoolId === p.id} onClick={() => setSelectedPoolId(p.id)} locale={locale} />
              ))}
            </div>

            {/* Spin area */}
            {pool && (
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(37,99,235,0.06)' }}>
                {/* header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `linear-gradient(135deg, ${pool.color}, ${pool.colorB})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{pool.emoji}</div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, color: 'var(--foreground)', fontSize: '14px' }}>{th ? pool.nameTh : pool.name}</p>
                    <p style={{ margin: 0, fontSize: '11px', color: 'var(--muted-foreground)' }}>{th ? pool.descriptionTh : pool.description}</p>
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '99px', fontSize: '11px', fontWeight: 600, color: '#15803d' }}>
                    <Shield style={{ width: 11, height: 11 }} />พร้อมส่ง
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '28px', padding: '24px' }}>
                  {/* Spin box */}
                  <div>
                    <div style={{
                      aspectRatio: '1', borderRadius: '16px',
                      background: isSpinning ? `radial-gradient(circle at center, ${pool.color}10, transparent 70%)` : 'var(--muted)',
                      border: `1.5px solid ${isSpinning ? pool.color : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '16px', transition: 'all 0.3s',
                      boxShadow: isSpinning ? `0 0 30px ${pool.glowColor}` : 'none',
                    }}>
                      {isSpinning ? (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ width: '52px', height: '52px', margin: '0 auto 12px', border: `2px solid var(--border)`, borderTopColor: pool.color, borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} />
                          <p style={{ color: 'var(--muted-foreground)', fontSize: '12px', margin: 0 }}>{th ? 'กำลังสุ่ม...' : 'Spinning...'}</p>
                        </div>
                      ) : (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '48px', marginBottom: '8px', filter: 'grayscale(0.1)' }}>🎲</div>
                          <p style={{ color: 'var(--muted-foreground)', fontSize: '11px', margin: 0 }}>{th ? 'กดสุ่มด้านล่าง' : 'Press to Spin'}</p>
                        </div>
                      )}
                    </div>

                    {/* price row */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--muted-foreground)' }}>ราคา/ครั้ง</span>
                      <span style={{ fontSize: '20px', fontWeight: 800, color: pool.color }}>฿{pool.price.toLocaleString()}</span>
                    </div>

                    {/* spin button */}
                    {user ? (
                      <button onClick={pullGacha} disabled={isSpinning || user.balance < pool.price} style={{
                        width: '100%', padding: '13px', border: 'none', borderRadius: '12px',
                        cursor: isSpinning ? 'wait' : user.balance < pool.price ? 'not-allowed' : 'pointer',
                        background: isSpinning || user.balance < pool.price
                          ? 'var(--muted)'
                          : `linear-gradient(135deg, ${pool.color}, ${pool.colorB})`,
                        color: isSpinning || user.balance < pool.price ? 'var(--muted-foreground)' : '#fff',
                        fontSize: '15px', fontWeight: 800,
                        boxShadow: !(isSpinning || user.balance < pool.price) ? `0 6px 24px ${pool.glowColor}` : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        transition: 'all 0.2s',
                      }}>
                        {isSpinning
                          ? <><div style={{ width: '16px', height: '16px', border: `2px solid var(--border)`, borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.5s linear infinite' }} />{th ? 'กำลังสุ่ม...' : 'Spinning...'}</>
                          : <><Zap style={{ width: 16, height: 16 }} />{th ? '⚡ สุ่มเลย!' : '⚡ Spin Now!'}</>}
                      </button>
                    ) : (
                      <Link href="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '13px', borderRadius: '12px', background: `linear-gradient(135deg, ${pool.color}, ${pool.colorB})`, color: '#fff', textDecoration: 'none', fontSize: '14px', fontWeight: 800, boxShadow: `0 6px 24px ${pool.glowColor}` }}>
                        {th ? 'เข้าสู่ระบบเพื่อสุ่ม' : 'Login to Spin'}<ChevronRight style={{ width: 15, height: 15 }} />
                      </Link>
                    )}

                    {spinCount > 0 && (
                      <div style={{ marginTop: '10px', padding: '8px', background: 'var(--muted)', border: '1px solid var(--border)', borderRadius: '8px', textAlign: 'center', fontSize: '11px', color: 'var(--muted-foreground)' }}>
                        {th ? `สุ่มแล้ว ${spinCount} ครั้ง` : `${spinCount} pulls`}
                      </div>
                    )}
                  </div>

                  {/* Drop rates */}
                  <div>
                    <p style={{ margin: '0 0 14px', fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.1em' }}>📊 อัตราการสุ่ม</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {pool.items.map(item => {
                        const cfg = RARITY[item.rarity]
                        return (
                          <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '10px' }}>
                            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'var(--muted)', border: `1px solid ${cfg.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>{item.icon}</div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{th ? item.nameTh : item.name}</p>
                              <p style={{ margin: 0, fontSize: '10px', color: cfg.color, fontWeight: 600 }}>{cfg.labelTh}</p>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                              <p style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: cfg.color }}>{item.dropRate}%</p>
                              <p style={{ margin: 0, fontSize: '10px', color: 'var(--muted-foreground)' }}>฿{item.value.toLocaleString()}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    {/* bar */}
                    <div style={{ marginTop: '14px' }}>
                      <div style={{ display: 'flex', height: '6px', borderRadius: '99px', overflow: 'hidden', gap: '2px' }}>
                        {pool.items.map(item => (
                          <div key={item.id} style={{ flex: item.dropRate, background: RARITY[item.rarity].color, opacity: 0.75 }} />
                        ))}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
                        {pool.items.map(item => (
                          <span key={item.id} style={{ fontSize: '10px', color: RARITY[item.rarity].color, fontWeight: 700 }}>{item.dropRate}%</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: live feed + payment */}
          <div style={{ position: 'sticky', top: '80px', alignSelf: 'start', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Live feed */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(37,99,235,0.05)' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a', animation: 'glow-pulse 1.5s infinite', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}>LIVE PULLS</span>
                <span style={{ marginLeft: 'auto', fontSize: '9px', fontWeight: 700, padding: '2px 7px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)', borderRadius: '4px', color: '#15803d' }}>LIVE</span>
              </div>
              <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {liveFeed.map(f => {
                  const cfg = RARITY[f.rarity as keyof typeof RARITY]
                  return (
                    <div key={f.id} style={{ padding: '9px 11px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderLeft: `3px solid ${cfg.color}`, borderRadius: '8px', transition: 'all 0.3s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--foreground)', fontWeight: 600 }}>{f.name}</span>
                        <span style={{ fontSize: '9px', color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <Clock style={{ width: 9, height: 9 }} />{f.ago}m
                        </span>
                      </div>
                      <p style={{ margin: '0 0 3px', fontSize: '11px', fontWeight: 600, color: cfg.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.item}</p>
                      <span style={{ fontSize: '9px', fontWeight: 700, padding: '1px 6px', background: 'var(--muted)', border: `1px solid ${cfg.border}`, borderRadius: '3px', color: cfg.color }}>{f.rarity.toUpperCase()}</span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Payment */}
            <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: '16px', padding: '14px 16px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.1em' }}>💳 ช่องทางชำระเงิน</p>
              {['PromptPay / QR', 'TrueMoney Wallet', 'KBank', 'SCB', 'BBL'].map(m => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '12px', color: 'var(--muted-foreground)', fontWeight: 500 }}>{m}</span>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} />
                </div>
              ))}
            </div>

            {/* Guarantee badge */}
            <div style={{ padding: '12px 14px', background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.18)', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Shield style={{ width: 13, height: 13, color: '#16a34a', flexShrink: 0 }} />
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>รับประกันทุกออร์เดอร์</span>
              </div>
              <p style={{ margin: 0, fontSize: '10px', color: 'var(--muted-foreground)', lineHeight: 1.6 }}>ไอดีผ่านการตรวจสอบ · เข้าใช้ได้ภายใน 24 ชม. · ทีมงานพร้อมดูแล</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {wonItem && <UnlockOverlay item={wonItem} poolColor={pool?.color ?? 'var(--primary)'} locale={locale} onClose={() => setWonItem(null)} />}

      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent style={{ background: 'var(--card)', border: '1px solid var(--border)', maxWidth: '460px' }}>
          <h3 style={{ margin: '0 0 16px', color: 'var(--foreground)', fontWeight: 700 }}>📜 {th ? 'ประวัติการสุ่ม' : 'Pull History'}</h3>
          <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {userPulls.length > 0 ? userPulls.slice().reverse().map(p => {
              const mi = p.item as unknown as MockItem
              const cfg = RARITY[mi.rarity as keyof typeof RARITY] || RARITY.common
              return (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: '10px' }}>
                  <div style={{ fontSize: '26px' }}>{mi.icon || '🎁'}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--foreground)', fontSize: '12px' }}>{th ? mi.nameTh : mi.name}</p>
                    <p style={{ margin: 0, fontSize: '10px', color: 'var(--muted-foreground)' }}>{new Date(p.createdAt).toLocaleDateString('th-TH')}</p>
                  </div>
                  <span style={{ padding: '2px 9px', fontSize: '9px', fontWeight: 700, background: 'var(--muted)', border: `1px solid ${cfg.border}`, borderRadius: '5px', color: cfg.color }}>{cfg.labelTh}</span>
                </div>
              )
            }) : (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--muted-foreground)', fontSize: '14px' }}>{th ? 'ยังไม่มีประวัติการสุ่ม' : 'No pull history yet'}</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes spin       { to { transform: rotate(360deg) } }
        @keyframes glow-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(22,163,74,0.5)} 50%{box-shadow:0 0 0 5px rgba(22,163,74,0)} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bounceIn   { 0%{transform:scale(0.3);opacity:0} 60%{transform:scale(1.15)} 100%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  )
}