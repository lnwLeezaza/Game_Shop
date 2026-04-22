'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Sparkles, Gift, Coins, History, Zap, Star, Shield, Lock, Copy, Check, ChevronRight, Clock } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore, useGachaStore } from '@/lib/store'
import { useLocale, formatPrice } from '@/hooks/use-locale'
import type { GachaPool } from '@/lib/types'
import type { GachaItem } from '@/lib/types'

// ─── Rarity config ──────────────────────────────────────────────────
const RARITY = {
  common:    { label:'Common',    labelTh:'ธรรมดา',  glow:'rgba(156,163,175,0.6)', border:'#6b7280', bg:'#1f2937', text:'#9ca3af', badge:'#374151' },
  rare:      { label:'Rare',      labelTh:'หายาก',   glow:'rgba(59,130,246,0.8)',  border:'#3b82f6', bg:'#1e3a5f', text:'#60a5fa', badge:'#1e3a5f' },
  epic:      { label:'Epic',      labelTh:'เอพิค',   glow:'rgba(139,92,246,0.9)',  border:'#8b5cf6', bg:'#2e1065', text:'#a78bfa', badge:'#2e1065' },
  legendary: { label:'Legendary', labelTh:'ตำนาน',   glow:'rgba(251,191,36,1.0)',  border:'#fbbf24', bg:'#431407', text:'#fcd34d', badge:'#78350f' },
} as const

// ─── Fake live activity feed ─────────────────────────────────────────
const FAKE_NAMES = ['QueenSlayer99','xXDarkHunter','CryptoGG','RushB_TH','EliteProwler','NeonBlade','GhostRider7','ThunderStrike']
const FAKE_ITEMS = ['ตำนาน Legendary ID','Epic Character Pack','ไอดีระดับพระเจ้า','SSR Full Skin','Diamond Account','Rare Bundle']

function useLiveFeed() {
  const [feed, setFeed] = useState<{id:number;name:string;item:string;rarity:string;ago:number}[]>([])
  const counter = useRef(0)
  useEffect(() => {
    const add = () => {
      const rarity = Math.random() < 0.05 ? 'legendary' : Math.random() < 0.15 ? 'epic' : Math.random() < 0.35 ? 'rare' : 'common'
      const item = rarity === 'legendary' ? FAKE_ITEMS[Math.floor(Math.random()*3)] : FAKE_ITEMS[3+Math.floor(Math.random()*3)]
      setFeed(prev => [{
        id: counter.current++,
        name: FAKE_NAMES[Math.floor(Math.random()*FAKE_NAMES.length)],
        item, rarity, ago: 1,
      }, ...prev.slice(0,7)].map((f,i) => ({...f, ago: i+1})))
    }
    add()
    const t = setInterval(add, 4500)
    return () => clearInterval(t)
  }, [])
  return feed
}

// ─── Unlock animation overlay ────────────────────────────────────────
function UnlockOverlay({ item, onClose, locale }: { item: GachaItem; onClose:()=>void; locale:string }) {
  const [phase, setPhase] = useState<'spin'|'reveal'|'show'>('spin')
  const [copied, setCopied] = useState(false)
  const th = locale === 'th'
  const cfg = RARITY[item.rarity as keyof typeof RARITY] || RARITY.common

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('reveal'), 1800)
    const t2 = setTimeout(() => setPhase('show'), 2800)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  const fakeId = `ID-${Math.random().toString(36).substring(2,8).toUpperCase()}`
  const fakePass = `PASS-${Math.random().toString(36).substring(2,10).toUpperCase()}`

  const copy = (text: string) => {
    navigator.clipboard.writeText(text).catch(()=>{})
    setCopied(true)
    setTimeout(()=>setCopied(false), 2000)
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      background:'rgba(0,0,0,0.92)',
      display:'flex', alignItems:'center', justifyContent:'center',
      backdropFilter:'blur(8px)',
    }}>
      <div style={{
        width:'min(420px,90vw)', borderRadius:'16px',
        border:`1px solid ${cfg.border}`,
        background:'#0f0f1a',
        boxShadow:`0 0 60px ${cfg.glow}, 0 0 120px ${cfg.glow}40`,
        overflow:'hidden', position:'relative',
      }}>
        {/* Scan lines overlay */}
        <div style={{position:'absolute',inset:0,backgroundImage:'repeating-linear-gradient(0deg,rgba(255,255,255,0.015) 0px,rgba(255,255,255,0.015) 1px,transparent 1px,transparent 4px)',pointerEvents:'none',zIndex:1}}/>

        {/* Top bar */}
        <div style={{background:'#111118',borderBottom:`1px solid ${cfg.border}40`,padding:'12px 16px',display:'flex',alignItems:'center',gap:'8px',position:'relative',zIndex:2}}>
          <Lock style={{width:14,height:14,color:cfg.text}}/>
          <span style={{fontFamily:'monospace',fontSize:'11px',color:cfg.text,letterSpacing:'0.1em'}}>SYSTEM UNLOCK PROTOCOL</span>
          <div style={{marginLeft:'auto',width:'8px',height:'8px',borderRadius:'50%',background:cfg.border,boxShadow:`0 0 8px ${cfg.border}`,animation:'pulse 1s infinite'}}/>
        </div>

        <div style={{padding:'24px', position:'relative', zIndex:2}}>
          {phase === 'spin' && (
            <div style={{textAlign:'center',padding:'32px 0'}}>
              <div style={{
                width:'80px',height:'80px',margin:'0 auto 16px',
                border:`2px solid ${cfg.border}`,borderTopColor:'transparent',
                borderRadius:'50%',animation:'spin 0.6s linear infinite',
                boxShadow:`0 0 20px ${cfg.glow}`,
              }}/>
              <p style={{color:cfg.text,fontFamily:'monospace',fontSize:'13px',letterSpacing:'0.05em'}}>
                {th?'กำลังสุ่ม...':'RANDOMIZING...'}
              </p>
            </div>
          )}

          {phase === 'reveal' && (
            <div style={{textAlign:'center',padding:'24px 0'}}>
              <div style={{
                fontSize:'48px',marginBottom:'12px',
                filter:`drop-shadow(0 0 16px ${cfg.glow})`,
                animation:'bounce 0.5s ease',
              }}>
                {item.rarity==='legendary'?'👑':item.rarity==='epic'?'💎':item.rarity==='rare'?'⭐':'🎁'}
              </div>
              <p style={{color:cfg.text,fontFamily:'monospace',fontSize:'20px',fontWeight:'bold',letterSpacing:'0.05em',
                textShadow:`0 0 20px ${cfg.glow}`}}>
                {th ? item.nameTh : item.name}
              </p>
              <div style={{display:'inline-block',marginTop:'8px',padding:'4px 12px',background:cfg.badge,border:`1px solid ${cfg.border}`,borderRadius:'4px',fontSize:'11px',color:cfg.text,fontFamily:'monospace',letterSpacing:'0.1em'}}>
                [{item.rarity.toUpperCase()}]
              </div>
            </div>
          )}

          {phase === 'show' && (
            <div>
              <div style={{textAlign:'center',marginBottom:'20px'}}>
                <div style={{fontSize:'32px',marginBottom:'8px',filter:`drop-shadow(0 0 12px ${cfg.glow})`}}>
                  {item.rarity==='legendary'?'👑':item.rarity==='epic'?'💎':item.rarity==='rare'?'⭐':'🎁'}
                </div>
                <p style={{color:cfg.text,fontSize:'16px',fontWeight:'bold',fontFamily:'monospace',textShadow:`0 0 12px ${cfg.glow}`}}>
                  {th ? item.nameTh : item.name}
                </p>
              </div>

              {/* Credential boxes */}
              <div style={{background:'#070710',border:'1px solid #1a1a2e',borderRadius:'8px',padding:'16px',marginBottom:'12px',fontFamily:'monospace'}}>
                <div style={{fontSize:'10px',color:'#94a3b8',marginBottom:'8px',letterSpacing:'0.1em'}}>// CREDENTIALS UNLOCKED</div>
                <div style={{marginBottom:'12px'}}>
                  <div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>USERNAME / ID</div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#0d0d1a',border:`1px solid ${cfg.border}40`,borderRadius:'6px',padding:'8px 12px'}}>
                    <span style={{flex:1,color:cfg.text,fontSize:'13px',letterSpacing:'0.08em'}}>{fakeId}</span>
                    <button onClick={()=>copy(fakeId)} style={{background:'none',border:'none',cursor:'pointer',color:cfg.text,padding:'2px'}}>
                      {copied?<Check style={{width:14,height:14}}/>:<Copy style={{width:14,height:14}}/>}
                    </button>
                  </div>
                </div>
                <div>
                  <div style={{fontSize:'10px',color:'#666',marginBottom:'4px'}}>PASSWORD</div>
                  <div style={{display:'flex',alignItems:'center',gap:'8px',background:'#0d0d1a',border:`1px solid ${cfg.border}40`,borderRadius:'6px',padding:'8px 12px'}}>
                    <span style={{flex:1,color:cfg.text,fontSize:'13px',letterSpacing:'0.08em'}}>{fakePass}</span>
                    <button onClick={()=>copy(fakePass)} style={{background:'none',border:'none',cursor:'pointer',color:cfg.text,padding:'2px'}}>
                      {copied?<Check style={{width:14,height:14}}/>:<Copy style={{width:14,height:14}}/>}
                    </button>
                  </div>
                </div>
              </div>

              <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'16px',padding:'8px 12px',background:'#071a0f',border:'1px solid #1a4a2a',borderRadius:'6px'}}>
                <Shield style={{width:14,height:14,color:'#4ade80',flexShrink:0}}/>
                <span style={{fontSize:'11px',color:'#4ade80',fontFamily:'monospace'}}>
                  {th?'สถานะ: ส่งอัตโนมัติแล้ว ✓':'STATUS: AUTO-DELIVERED ✓'}
                </span>
              </div>

              <button
                onClick={onClose}
                style={{
                  width:'100%',padding:'12px',background:`linear-gradient(90deg, ${cfg.border}33, ${cfg.bg})`,
                  border:`1px solid ${cfg.border}`,borderRadius:'8px',color:cfg.text,
                  fontFamily:'monospace',fontSize:'13px',letterSpacing:'0.05em',cursor:'pointer',
                  boxShadow:`0 0 20px ${cfg.glow}40`,
                  fontWeight:'bold',
                }}
              >
                {th?'[ รับรางวัล ]':'[ CLAIM REWARD ]'}
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes bounce { 0%{transform:scale(0.5);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1} }
      `}</style>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────
export default function GachaPage() {
  const { user, updateBalance, refreshUser } = useAuthStore()
  const { pulls, addPull, fetchPullHistory } = useGachaStore()
  const { locale } = useLocale()
  const th = locale === 'th'

  const [pools, setPools] = useState<GachaPool[]>([])
  const [poolsLoading, setPoolsLoading] = useState(true)
  const [selectedPool, setSelectedPool] = useState<string | null>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [wonItem, setWonItem] = useState<GachaItem | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const liveFeed = useLiveFeed()

  // Load real pools from Supabase
  useEffect(() => {
    const load = async () => {
      setPoolsLoading(true)
      try {
        const { gachaAPI } = await import('@/lib/supabase')
        const data = await gachaAPI.getPools()
        setPools(data)
        if (data.length > 0) setSelectedPool(data[0].id)
      } catch { setPools([]) }
      finally { setPoolsLoading(false) }
    }
    load()
  }, [])

  // Load pull history
  useEffect(() => {
    if (user) fetchPullHistory(user.id)
  }, [user?.id])

  const pool = selectedPool ? pools.find(p => p.id === selectedPool) : null
  const poolItems = pool?.items || []
  const userPulls = pulls.filter(p => p.userId === user?.id)

  const pullGacha = useCallback(async () => {
    if (!user || !pool) return
    if (user.balance < pool.price) { toast.error(th ? 'ยอดเงินไม่พอ' : 'Insufficient balance'); return }
    setIsSpinning(true)
    try {
      const { gachaAPI, supabase } = await import('@/lib/supabase')
      let winner: GachaItem | null = null
      try {
        // Try Supabase RPC (handles balance deduction + recording server-side)
        const result = await gachaAPI.pullGacha(pool.id, user.id)
        winner = result.item || poolItems.find((i: GachaItem) => i.id === result.itemId) || poolItems[0]
        await refreshUser()
      } catch {
        // Fallback: client-side pull + manual DB write
        const random = Math.random() * 100
        let cumulative = 0
        for (const item of poolItems) {
          cumulative += item.dropRate
          if (random <= cumulative) { winner = item; break }
        }
        if (!winner) winner = poolItems[0]
        // Deduct balance and record pull in DB
        await supabase.rpc('admin_adjust_balance', { p_user_id: user.id, p_amount: -pool.price })
        await supabase.from('gacha_pulls').insert({ pool_id: pool.id, user_id: user.id, item_id: winner!.id, seed: Math.random().toString(36) })
        updateBalance(-pool.price)
      }
      if (winner) {
        // Create notification in DB
        try {
          const { supabase: sb } = await import('@/lib/supabase')
          await sb.from('notifications').insert({
            user_id: user.id, type: 'gacha',
            title: `You got: ${winner.name}`,
            title_th: `คุณได้รับ: ${winner.nameTh || winner.name}`,
            message: `Rarity: ${winner.rarity} — check your gacha history`,
            message_th: `ระดับ: ${winner.rarity} — ดูประวัติการสุ่มของคุณ`,
            is_read: false, link: '/gacha',
          })
        } catch {}
        addPull({ poolId: pool.id, userId: user.id, itemId: winner.id, item: winner, seed: Math.random().toString(36) })
        setWonItem(winner)
      }
    } finally {
      setIsSpinning(false)
    }
  }, [user, pool, poolItems, updateBalance, refreshUser, addPull, th])

  // Neon glow style helper
  const glow = (color: string, size = 20) => `0 0 ${size}px ${color}, 0 0 ${size*2}px ${color}40`

  return (
    <div style={{ minHeight:'100vh', background:'#050508', color:'#f1f5f9', display:'flex', flexDirection:'column' }}>
      <Header />

      <main style={{ flex:1 }}>
        {/* Hero */}
        <section style={{ position:'relative', overflow:'hidden', padding:'48px 16px 32px', textAlign:'center' }}>
          <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 50%, rgba(139,92,246,0.12) 0%, transparent 60%), radial-gradient(ellipse at 70% 50%, rgba(59,130,246,0.1) 0%, transparent 60%)' }}/>
          <div style={{ position:'relative', zIndex:1, maxWidth:'800px', margin:'0 auto' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', marginBottom:'8px', padding:'4px 16px', background:'rgba(139,92,246,0.1)', border:'1px solid rgba(139,92,246,0.3)', borderRadius:'99px', fontSize:'12px', color:'#a78bfa', fontFamily:'monospace', letterSpacing:'0.05em' }}>
              <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#4ade80', boxShadow:glow('#4ade80',6) }}/>
              {th?'ระบบออนไลน์ • ส่งอัตโนมัติ':'SYSTEM ONLINE • AUTO-DELIVERY'}
            </div>
            <h1 style={{ fontSize:'clamp(28px,5vw,52px)', fontWeight:'bold', margin:'8px 0', background:'linear-gradient(135deg,#a78bfa,#60a5fa,#f472b6)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1.1, fontFamily:'monospace' }}>
              {th?'ตู้สุ่มรหัส':'GACHA ID SHOP'}
            </h1>
            <p style={{ color:'#64748b', fontSize:'14px', marginBottom:'24px', fontFamily:'monospace' }}>
              {th?'สุ่มรับไอดีและรหัสหายาก • ส่งทันทีอัตโนมัติ':'Random rare IDs & codes • Instant auto-delivery'}
            </p>
            {user ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'12px', flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'8px 16px', background:'rgba(251,191,36,0.08)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:'8px', fontFamily:'monospace' }}>
                  <Coins style={{ width:16, height:16, color:'#fbbf24' }}/>
                  <span style={{ color:'#fbbf24', fontWeight:'bold' }}>{formatPrice(user.balance, locale)}</span>
                </div>
                <button onClick={()=>setShowHistory(true)} style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 16px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', color:'#94a3b8', cursor:'pointer', fontFamily:'monospace', fontSize:'13px' }}>
                  <History style={{ width:14, height:14 }}/>{th?'ประวัติ':'History'}
                </button>
              </div>
            ) : (
              <Link href="/login" style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'10px 24px', background:'linear-gradient(135deg,#7c3aed,#2563eb)', borderRadius:'8px', color:'white', textDecoration:'none', fontFamily:'monospace', fontSize:'13px' }}>
                {th?'เข้าสู่ระบบเพื่อสุ่ม':'Login to Start'}<ChevronRight style={{ width:14, height:14 }}/>
              </Link>
            )}
          </div>
        </section>

        <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'0 16px 48px', display:'grid', gridTemplateColumns:'1fr 280px', gap:'24px' }}>

          {/* Left: pools + selected pool */}
          <div>
            {/* Pool cards */}
            {poolsLoading && (
              <div style={{ padding:'48px', textAlign:'center', color:'#a78bfa', fontFamily:'monospace' }}>
                <div style={{ width:'32px', height:'32px', border:'3px solid #8b5cf6', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 12px' }}/>
                {th ? 'กำลังโหลดตู้สุ่ม...' : 'Loading pools...'}
              </div>
            )}
            {!poolsLoading && pools.length === 0 && (
              <div style={{ padding:'48px', textAlign:'center', color:'#475569', fontFamily:'monospace' }}>
                {th ? 'ยังไม่มีตู้สุ่ม — แอดมินยังไม่ได้เพิ่ม' : 'No gacha pools yet'}
              </div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:'16px', marginBottom:'24px' }}>
              {pools.map(gp => {
                const items = gp.items || []
                const legRate = items.find(i => i.rarity==='legendary')?.dropRate || 0
                const isSelected = selectedPool === gp.id
                const stock = Math.floor(Math.random()*8)+1
                const isLow = stock <= 3
                return (
                  <div
                    key={gp.id}
                    onClick={()=>setSelectedPool(gp.id)}
                    style={{
                      background:'#0f0f1a', border:`1px solid ${isSelected?'#8b5cf6':'#1a1a2e'}`,
                      borderRadius:'12px', overflow:'hidden', cursor:'pointer',
                      boxShadow: isSelected ? glow('#8b5cf6',16) : 'none',
                      transition:'all 0.2s',
                    }}
                  >
                    <div style={{ position:'relative', aspectRatio:'16/9', overflow:'hidden', background:'#0d0d1a' }}>
                      <img src={gp.image} alt={th?gp.nameTh:gp.name} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.8 }} crossOrigin="anonymous"/>
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}/>
                      <div style={{ position:'absolute', top:'8px', right:'8px', padding:'3px 10px', background:'rgba(251,191,36,0.15)', border:'1px solid rgba(251,191,36,0.4)', borderRadius:'4px', fontSize:'11px', color:'#fbbf24', fontFamily:'monospace', boxShadow:glow('#fbbf24',8) }}>
                        ★ {legRate}% LEGEND
                      </div>
                      {isLow && (
                        <div style={{ position:'absolute', top:'8px', left:'8px', padding:'3px 10px', background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.5)', borderRadius:'4px', fontSize:'11px', color:'#f87171', fontFamily:'monospace', animation:'pulse 1.5s infinite', boxShadow:glow('#ef4444',8) }}>
                          เหลือ {stock} ไอดี!
                        </div>
                      )}
                      <div style={{ position:'absolute', bottom:'8px', left:'12px', right:'12px' }}>
                        <div style={{ fontSize:'15px', fontWeight:'bold', color:'white', fontFamily:'monospace' }}>{th?gp.nameTh:gp.name}</div>
                      </div>
                    </div>
                    <div style={{ padding:'12px 14px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                      <div>
                        <div style={{ fontSize:'10px', color:'#94a3b8', fontFamily:'monospace', marginBottom:'2px' }}>{th?'ราคาต่อครั้ง':'PRICE/PULL'}</div>
                        <div style={{ fontSize:'18px', fontWeight:'bold', color:'#a78bfa', fontFamily:'monospace' }}>{formatPrice(gp.price, locale)}</div>
                      </div>
                      <button
                        onClick={e=>{e.stopPropagation();setSelectedPool(gp.id)}}
                        style={{ padding:'8px 16px', background: isSelected?'rgba(139,92,246,0.2)':'rgba(255,255,255,0.04)', border:`1px solid ${isSelected?'#8b5cf6':'rgba(255,255,255,0.1)'}`, borderRadius:'6px', color: isSelected?'#a78bfa':'#64748b', cursor:'pointer', fontFamily:'monospace', fontSize:'12px', boxShadow: isSelected?glow('#8b5cf6',8):'' }}
                      >
                        {isSelected?(th?'เลือกอยู่':'SELECTED'):(th?'เลือก':'SELECT')}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Selected pool detail */}
            {pool && (
              <div style={{ background:'#0f0f1a', border:'1px solid #1a1a2e', borderRadius:'12px', overflow:'hidden' }}>
                {/* Spin box header */}
                <div style={{ background:'#070710', borderBottom:'1px solid #1a1a2e', padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontFamily:'monospace', fontSize:'13px', color:'#64748b', letterSpacing:'0.05em' }}>
                    <span style={{ color:'#a78bfa' }}>// </span>{th?'เลือกตู้':''}{th?pool.nameTh:pool.name}
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'11px', color:'#4ade80', fontFamily:'monospace' }}>
                    <Shield style={{ width:12, height:12 }}/>{th?'พร้อมส่งอัตโนมัติ':'AUTO-DELIVER READY'}
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', padding:'20px' }}>
                  {/* Left: Spin */}
                  <div>
                    {/* Spin box */}
                    <div style={{
                      position:'relative', aspectRatio:'1', maxWidth:'220px', margin:'0 auto 16px',
                      background:'#070710', border:`1px solid ${isSpinning?'#8b5cf6':'#1a1a2e'}`,
                      borderRadius:'16px', display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow: isSpinning ? glow('#8b5cf6',24) : 'none', transition:'all 0.3s',
                    }}>
                      <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle at 50% 50%, rgba(139,92,246,0.05) 0%, transparent 70%)', borderRadius:'16px' }}/>
                      {isSpinning ? (
                        <div style={{ textAlign:'center' }}>
                          <div style={{ width:'60px', height:'60px', margin:'0 auto 12px', border:'2px solid #8b5cf6', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.4s linear infinite', boxShadow:glow('#8b5cf6',16) }}/>
                          <div style={{ color:'#a78bfa', fontFamily:'monospace', fontSize:'12px', letterSpacing:'0.1em' }}>RANDOMIZING...</div>
                        </div>
                      ) : (
                        <div style={{ textAlign:'center' }}>
                          <Gift style={{ width:56, height:56, color:'#1a1a2e' }}/>
                          <div style={{ color:'#2d2d4a', fontFamily:'monospace', fontSize:'11px', marginTop:'8px' }}>{th?'กดสุ่มด้านล่าง':'PRESS TO SPIN'}</div>
                        </div>
                      )}
                    </div>

                    {/* Price row */}
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', background:'#070710', border:'1px solid #1a1a2e', borderRadius:'8px', marginBottom:'12px', fontFamily:'monospace' }}>
                      <span style={{ color:'#94a3b8', fontSize:'12px' }}>{th?'ราคา':'PRICE'}</span>
                      <span style={{ color:'#fbbf24', fontSize:'18px', fontWeight:'bold' }}>{formatPrice(pool.price, locale)}</span>
                    </div>

                    <button
                      onClick={pullGacha}
                      disabled={isSpinning || !user || (!!user && user.balance < pool.price)}
                      style={{
                        width:'100%', padding:'14px', border:'none', borderRadius:'8px', cursor: isSpinning||!user?'not-allowed':'pointer',
                        background: isSpinning||!user ? '#1a1a2e' : 'linear-gradient(135deg,#7c3aed,#2563eb)',
                        color: isSpinning||!user ? '#94a3b8' : 'white',
                        fontFamily:'monospace', fontSize:'15px', fontWeight:'bold', letterSpacing:'0.05em',
                        boxShadow: isSpinning||!user ? '' : glow('#8b5cf6',12),
                        transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                      }}
                    >
                      {isSpinning ? (
                        <><div style={{ width:'18px', height:'18px', border:'2px solid white', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 0.5s linear infinite' }}/>{th?'กำลังสุ่ม...':'SPINNING...'}</>
                      ) : (
                        <><Zap style={{ width:18, height:18 }}/>{th?'⚡ สุ่มเลย!':'⚡ SPIN NOW!'}</>
                      )}
                    </button>

                    {!user && (
                      <div style={{ textAlign:'center', marginTop:'10px', fontSize:'12px', color:'#94a3b8', fontFamily:'monospace' }}>
                        <Link href="/login" style={{ color:'#8b5cf6', textDecoration:'none' }}>
                          {th?'เข้าสู่ระบบ →':'Login →'}
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Right: Drop rates */}
                  <div>
                    <div style={{ fontSize:'11px', color:'#94a3b8', fontFamily:'monospace', letterSpacing:'0.1em', marginBottom:'12px' }}>// DROP_RATES</div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {poolItems.map(item => {
                        const cfg = RARITY[item.rarity as keyof typeof RARITY] || RARITY.common
                        return (
                          <div key={item.id} style={{ display:'flex', alignItems:'center', gap:'10px', padding:'10px 12px', background:'#070710', border:`1px solid ${cfg.border}25`, borderRadius:'8px', boxShadow: item.rarity==='legendary'?`0 0 12px ${cfg.glow}30`:'' }}>
                            <div style={{ width:'32px', height:'32px', borderRadius:'6px', background:cfg.bg, border:`1px solid ${cfg.border}50`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 0 8px ${cfg.glow}40` }}>
                              {item.rarity==='legendary'?<Star style={{width:14,height:14,color:cfg.text}}/>:item.rarity==='epic'?<Sparkles style={{width:14,height:14,color:cfg.text}}/>:<Gift style={{width:14,height:14,color:cfg.text}}/>}
                            </div>
                            <div style={{ flex:1, minWidth:0 }}>
                              <div style={{ fontSize:'12px', color:'#f1f5f9', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{th?item.nameTh:item.name}</div>
                              <div style={{ fontSize:'10px', color:cfg.text, fontFamily:'monospace', letterSpacing:'0.05em' }}>[{item.rarity.toUpperCase()}]</div>
                            </div>
                            <div style={{ textAlign:'right', flexShrink:0 }}>
                              <div style={{ fontSize:'14px', fontWeight:'bold', color:cfg.text, fontFamily:'monospace', textShadow:`0 0 8px ${cfg.glow}` }}>{item.dropRate}%</div>
                              <div style={{ fontSize:'10px', color:'#94a3b8', fontFamily:'monospace' }}>{formatPrice(item.value, locale)}</div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right: Live feed */}
          <div style={{ position:'sticky', top:'80px', alignSelf:'start' }}>
            <div style={{ background:'#0f0f1a', border:'1px solid #1a1a2e', borderRadius:'12px', overflow:'hidden' }}>
              <div style={{ background:'#070710', borderBottom:'1px solid #1a1a2e', padding:'12px 16px', display:'flex', alignItems:'center', gap:'8px' }}>
                <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#4ade80', boxShadow:glow('#4ade80',6), flexShrink:0 }}/>
                <span style={{ fontFamily:'monospace', fontSize:'12px', color:'#4ade80', letterSpacing:'0.05em' }}>LIVE PULLS</span>
                <span style={{ marginLeft:'auto', fontSize:'10px', color:'#1a4a2a', fontFamily:'monospace', padding:'2px 8px', background:'#071a0f', border:'1px solid #1a4a2a', borderRadius:'4px' }}>REALTIME</span>
              </div>
              <div style={{ padding:'12px', display:'flex', flexDirection:'column', gap:'8px' }}>
                {liveFeed.map(f => {
                  const cfg = RARITY[f.rarity as keyof typeof RARITY] || RARITY.common
                  return (
                    <div key={f.id} style={{ padding:'10px 12px', background:'#070710', border:`1px solid ${cfg.border}20`, borderRadius:'8px', borderLeft:`2px solid ${cfg.border}`, boxShadow: f.rarity==='legendary'||f.rarity==='epic'?`0 0 10px ${cfg.glow}20`:'' }}>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'4px' }}>
                        <span style={{ fontSize:'11px', color:'#64748b', fontFamily:'monospace' }}>{f.name}</span>
                        <span style={{ fontSize:'10px', color:'#2d2d4a', fontFamily:'monospace', display:'flex', alignItems:'center', gap:'3px' }}>
                          <Clock style={{ width:10, height:10 }}/>{f.ago}m ago
                        </span>
                      </div>
                      <div style={{ fontSize:'12px', color:cfg.text, fontFamily:'monospace', textShadow: f.rarity==='legendary'||f.rarity==='epic'?`0 0 8px ${cfg.glow}`:'', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {f.item}
                      </div>
                      <div style={{ marginTop:'4px', display:'inline-block', fontSize:'9px', padding:'1px 6px', background:cfg.bg, border:`1px solid ${cfg.border}40`, borderRadius:'3px', color:cfg.text, fontFamily:'monospace', letterSpacing:'0.08em' }}>
                        [{f.rarity.toUpperCase()}]
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Payment methods */}
            <div style={{ marginTop:'16px', background:'#0f0f1a', border:'1px solid #1a1a2e', borderRadius:'12px', padding:'14px 16px' }}>
              <div style={{ fontSize:'10px', color:'#94a3b8', fontFamily:'monospace', letterSpacing:'0.1em', marginBottom:'10px' }}>// PAYMENT_METHODS</div>
              {['PromptPay','TrueMoney','KBank','SCB','BBL'].map(m => (
                <div key={m} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #0d0d1a' }}>
                  <span style={{ fontSize:'12px', color:'#94a3b8', fontFamily:'monospace' }}>{m}</span>
                  <div style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#4ade80', boxShadow:glow('#4ade80',4) }}/>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Cyberpunk Unlock Overlay */}
      {wonItem && <UnlockOverlay item={wonItem} locale={locale} onClose={()=>setWonItem(null)} />}

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent style={{ background:'#0f0f1a', border:'1px solid #1a1a2e', color:'#f1f5f9', maxWidth:'480px' }}>
          <div style={{ fontFamily:'monospace', fontSize:'14px', color:'#a78bfa', marginBottom:'16px', letterSpacing:'0.05em' }}>
            // {th?'ประวัติการสุ่ม':'PULL_HISTORY'}
          </div>
          <div style={{ maxHeight:'360px', overflowY:'auto', display:'flex', flexDirection:'column', gap:'8px' }}>
            {userPulls.length > 0 ? userPulls.map(p => {
              const cfg = RARITY[p.item.rarity as keyof typeof RARITY] || RARITY.common
              return (
                <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 12px', background:'#070710', border:`1px solid ${cfg.border}20`, borderRadius:'8px' }}>
                  <div style={{ width:'36px', height:'36px', borderRadius:'8px', background:cfg.bg, border:`1px solid ${cfg.border}40`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 0 10px ${cfg.glow}40` }}>
                    <Gift style={{ width:16, height:16, color:cfg.text }}/>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:'13px', color:'#f1f5f9', fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{th?p.item.nameTh:p.item.name}</div>
                    <div style={{ fontSize:'11px', color:'#94a3b8', fontFamily:'monospace' }}>{new Date(p.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ fontSize:'10px', padding:'3px 8px', background:cfg.bg, border:`1px solid ${cfg.border}40`, borderRadius:'4px', color:cfg.text, fontFamily:'monospace', flexShrink:0 }}>{p.item.rarity.toUpperCase()}</div>
                </div>
              )
            }) : (
              <div style={{ padding:'32px', textAlign:'center', color:'#2d2d4a', fontFamily:'monospace', fontSize:'13px' }}>
                {th?'// ยังไม่มีประวัติ':'// NO_HISTORY_FOUND'}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>
    </div>
  )
}
