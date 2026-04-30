'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Package, ShoppingCart, Wallet, TrendingUp, AlertTriangle, CheckCircle, Clock, ArrowUpRight, RefreshCw, BarChart2 } from 'lucide-react'
import { useLocale, formatPrice } from '@/hooks/use-locale'
import { useProductStore, useOrderStore, useAdminUserStore } from '@/lib/store'
import { adminAPI } from '@/lib/supabase'

export default function AdminDashboardPage() {
  const { locale } = useLocale()
  const th = locale === 'th'
  const { products, fetchAllProducts } = useProductStore()
  const { orders, fetchAllOrders } = useOrderStore()
  const { users, fetchUsers } = useAdminUserStore()
  const [liveStats, setLiveStats] = useState<{ totalUsers: number; activeProducts: number; totalOrders: number; totalRevenue: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [stats] = await Promise.all([
          adminAPI.getDashboardStats(),
          fetchAllProducts(),
          fetchAllOrders(),
          fetchUsers(),
        ])
        setLiveStats(stats)
      } catch {
        await Promise.all([fetchAllProducts(), fetchAllOrders(), fetchUsers()])
      }
      setLoading(false)
    }
    load()
  }, [])

  const totalUsers    = liveStats?.totalUsers      ?? users.length
  const totalProducts = liveStats?.activeProducts  ?? products.filter(p => p.status === 'available').length
  const totalOrders   = liveStats?.totalOrders     ?? orders.length
  const totalRevenue  = liveStats?.totalRevenue    ?? orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.platformFee, 0)

  const pendingOrders  = orders.filter(o => o.status === 'pending' || o.status === 'paid').length
  const disputedOrders = orders.filter(o => o.status === 'disputed').length
  const recentOrders   = orders.slice(0, 6)

  const statCards = [
    { label: th ? 'ผู้ใช้ทั้งหมด'      : 'Total Users',       value: totalUsers.toLocaleString(),       icon: Users,        color: '#38bdf8', glow: 'rgba(56,189,248,0.35)',   href: '/admin/users' },
    { label: th ? 'สินค้า (ขายอยู่)'   : 'Active Products',   value: totalProducts.toLocaleString(),    icon: Package,      color: '#06b6d4', glow: 'rgba(6,182,212,0.35)',    href: '/admin/products' },
    { label: th ? 'คำสั่งซื้อทั้งหมด'  : 'Total Orders',      value: totalOrders.toLocaleString(),      icon: ShoppingCart, color: '#2563eb', glow: 'rgba(37,99,235,0.35)',    href: '/admin/orders' },
    { label: th ? 'รายได้ค่าธรรมเนียม' : 'Platform Revenue',  value: formatPrice(totalRevenue, locale), icon: Wallet,       color: '#0ea5e9', glow: 'rgba(14,165,233,0.35)',   href: '/admin/deposits' },
  ]

  const alerts = [
    { count: pendingOrders,                              label: th ? 'รอดำเนินการ' : 'Pending Orders', color: '#38bdf8',  href: '/admin/orders',   icon: Clock },
    { count: disputedOrders,                             label: th ? 'ข้อพิพาท'   : 'Disputes',       color: '#ef4444',  href: '/admin/disputes', icon: AlertTriangle },
    { count: users.filter(u => u.kycStatus === 'pending').length, label: th ? 'รอ KYC' : 'Pending KYC', color: '#06b6d4', href: '/admin/users',    icon: CheckCircle },
    { count: null,                                       label: th ? '💰 อนุมัติถอน' : '💰 Approvals', color: '#0ea5e9',  href: '/admin/approvals',icon: CheckCircle },
  ]

  const orderStatusColor: Record<string, string> = {
    pending: '#f59e0b', paid: '#38bdf8', processing: '#06b6d4',
    completed: '#2563eb', disputed: '#ef4444', refunded: '#f97316', cancelled: '#475569',
  }

  return (
    <div style={{ fontFamily: "'Noto Sans Thai', monospace" }}>

      {/* ── Header ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'28px' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px' }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#06b6d4', display:'inline-block', boxShadow:'0 0 8px #06b6d4', animation:'pulse 2s infinite' }}/>
            <span style={{ fontSize:'10px', fontWeight:'bold', letterSpacing:'0.12em', color:'#38bdf8', textTransform:'uppercase' }}>Admin Dashboard</span>
          </div>
          <h1 style={{ margin:0, fontSize:'22px', fontWeight:900, color:'#f0f6ff', letterSpacing:'-0.02em' }}>
            🛡️ {th ? 'ภาพรวมระบบ' : 'System Overview'}
          </h1>
          <p style={{ margin:'3px 0 0', fontSize:'11px', color:'#60a5fa' }}>
            {th ? 'ข้อมูลเรียลไทม์ • อัปเดตอัตโนมัติ' : 'Live data • Auto refresh'}
          </p>
        </div>
        <button
          onClick={() => { setLoading(true); adminAPI.getDashboardStats().then(s => { setLiveStats(s); setLoading(false) }).catch(() => setLoading(false)) }}
          style={{ padding:'8px 16px', background:'rgba(37,99,235,0.12)', border:'1px solid rgba(37,99,235,0.35)', borderRadius:'10px', cursor:'pointer', display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#60a5fa', transition:'all 0.2s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(37,99,235,0.22)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='rgba(37,99,235,0.12)'}
        >
          <RefreshCw style={{ width:13, height:13, animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
          {th ? 'รีเฟรช' : 'Refresh'}
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'20px' }}>
        {statCards.map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration:'none' }}>
            <div style={{
              background:'linear-gradient(135deg,rgba(15,23,42,0.9),rgba(7,15,30,0.95))',
              border:`1px solid ${s.color}30`,
              borderRadius:'14px', padding:'18px', cursor:'pointer',
              transition:'all 0.2s', position:'relative', overflow:'hidden',
              boxShadow:`0 4px 20px ${s.glow}15`,
            }}
              onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow=`0 8px 28px ${s.glow}35`; el.style.borderColor=`${s.color}60`; el.style.transform='translateY(-2px)'; }}
              onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.boxShadow=`0 4px 20px ${s.glow}15`; el.style.borderColor=`${s.color}30`; el.style.transform='translateY(0)'; }}
            >
              {/* top accent */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${s.color},${s.color}44)`, borderRadius:'14px 14px 0 0' }}/>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div>
                  <p style={{ margin:0, fontSize:'10px', color:'#60a5fa', letterSpacing:'0.08em', textTransform:'uppercase', fontWeight:600 }}>{s.label}</p>
                  {loading
                    ? <div style={{ height:28, width:80, background:'rgba(37,99,235,0.15)', borderRadius:6, marginTop:6, animation:'pulse 1.5s infinite' }}/>
                    : <p style={{ margin:'6px 0 0', fontSize:'24px', fontWeight:900, color:s.color, textShadow:`0 0 16px ${s.glow}` }}>{s.value}</p>
                  }
                </div>
                <div style={{ width:40, height:40, background:`${s.color}15`, border:`1px solid ${s.color}30`, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 12px ${s.glow}30` }}>
                  <s.icon style={{ width:18, height:18, color:s.color }}/>
                </div>
              </div>
              <div style={{ marginTop:10, display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#475569' }}>
                <ArrowUpRight style={{ width:11, height:11, color:s.color }}/>
                {th ? 'ดูทั้งหมด' : 'View all'}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Topup Analytics Button ── */}
      <Link href="/admin/topup-analytics" style={{ textDecoration:'none', display:'block', marginBottom:'20px' }}>
        <div style={{
          background:'linear-gradient(135deg,#1e40af 0%,#2563eb 50%,#0891b2 100%)',
          borderRadius:'14px', padding:'16px 22px',
          display:'flex', alignItems:'center', justifyContent:'space-between',
          cursor:'pointer', transition:'all 0.2s', position:'relative', overflow:'hidden',
          boxShadow:'0 4px 24px rgba(37,99,235,0.35)',
        }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow='0 8px 32px rgba(37,99,235,0.55)'; (e.currentTarget as HTMLElement).style.transform='translateY(-1px)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow='0 4px 24px rgba(37,99,235,0.35)'; (e.currentTarget as HTMLElement).style.transform='translateY(0)'; }}
        >
          {/* grid texture */}
          <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:0.06, pointerEvents:'none' }} xmlns="http://www.w3.org/2000/svg">
            <defs><pattern id="dg" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.6"/>
            </pattern></defs>
            <rect width="100%" height="100%" fill="url(#dg)"/>
          </svg>
          {/* glow */}
          <div style={{ position:'absolute', right:-20, top:-20, width:120, height:120, borderRadius:'50%', background:'rgba(6,182,212,0.25)', filter:'blur(40px)', pointerEvents:'none' }}/>

          <div style={{ display:'flex', alignItems:'center', gap:14, position:'relative', zIndex:1 }}>
            <div style={{ width:44, height:44, borderRadius:12, background:'rgba(255,255,255,0.15)', border:'1px solid rgba(255,255,255,0.25)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 16px rgba(6,182,212,0.4)' }}>
              <BarChart2 style={{ width:22, height:22, color:'#fff' }}/>
            </div>
            <div>
              <div style={{ fontSize:15, fontWeight:900, color:'#fff', letterSpacing:'-0.01em' }}>
                {th ? 'Topup Analytics' : 'Topup Analytics'}
              </div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.65)', marginTop:2 }}>
                {th ? 'ยอดเติมเกม • แพ็กขายดี • รายเกม • สถานะออร์เดอร์' : 'Game revenue • Top packages • Order status'}
              </div>
            </div>
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:10, position:'relative', zIndex:1 }}>
            {/* mini stat pills */}
            <div style={{ display:'flex', gap:6 }}>
              {[
                { label: th ? 'เรียลไทม์' : 'Realtime', color:'#67e8f9' },
                { label: th ? 'ทุกเกม'    : 'All Games', color:'#93c5fd' },
              ].map(p => (
                <span key={p.label} style={{ fontSize:9, fontWeight:700, padding:'3px 8px', borderRadius:999, background:'rgba(255,255,255,0.12)', color:p.color, border:'1px solid rgba(255,255,255,0.2)', letterSpacing:'0.05em' }}>
                  {p.label}
                </span>
              ))}
            </div>
            <ArrowUpRight style={{ width:18, height:18, color:'rgba(255,255,255,0.7)' }}/>
          </div>
        </div>
      </Link>

      {/* ── Alert Badges ── */}
      <div style={{ display:'flex', gap:'10px', marginBottom:'22px', flexWrap:'wrap' }}>
        {alerts.map(a => (
          <Link key={a.label} href={a.href} style={{ textDecoration:'none' }}>
            <div style={{
              display:'flex', alignItems:'center', gap:8, padding:'9px 14px',
              background: (a.count ?? 0) > 0 ? `${a.color}12` : 'rgba(15,23,42,0.8)',
              border:`1px solid ${(a.count ?? 0) > 0 ? a.color + '45' : 'rgba(37,99,235,0.2)'}`,
              borderRadius:10, cursor:'pointer', transition:'all 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background=`${a.color}20`}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background=(a.count ?? 0) > 0 ? `${a.color}12` : 'rgba(15,23,42,0.8)'}
            >
              <a.icon style={{ width:13, height:13, color:(a.count ?? 0) > 0 ? a.color : '#475569' }}/>
              <span style={{ fontSize:13, fontWeight:900, color:(a.count ?? 0) > 0 ? a.color : '#475569' }}>
                {a.count ?? '—'}
              </span>
              <span style={{ fontSize:11, color:'#475569' }}>{a.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Recent Orders ── */}
      <div style={{ background:'linear-gradient(135deg,rgba(15,23,42,0.9),rgba(7,15,30,0.95))', border:'1px solid rgba(37,99,235,0.2)', borderRadius:14, overflow:'hidden' }}>
        {/* top accent */}
        <div style={{ height:3, background:'linear-gradient(90deg,#2563eb,#06b6d4,#38bdf8)' }}/>
        <div style={{ background:'rgba(7,15,30,0.8)', borderBottom:'1px solid rgba(37,99,235,0.15)', padding:'12px 18px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:3, height:16, borderRadius:999, background:'linear-gradient(180deg,#2563eb,#06b6d4)' }}/>
            <span style={{ fontSize:13, fontWeight:700, color:'#38bdf8' }}>
              {th ? 'คำสั่งซื้อล่าสุด' : 'Recent Orders'}
            </span>
          </div>
          <Link href="/admin/orders" style={{ fontSize:11, color:'#60a5fa', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
            {th ? 'ดูทั้งหมด' : 'View all'} <ArrowUpRight style={{ width:11, height:11 }}/>
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding:'32px', textAlign:'center', color:'#475569', fontSize:12 }}>
            {th ? 'ยังไม่มีคำสั่งซื้อ' : 'No orders yet'}
          </div>
        ) : recentOrders.map((o, i) => (
          <div key={o.id} style={{
            display:'grid', gridTemplateColumns:'1fr 120px 100px 90px',
            gap:10, padding:'11px 18px',
            borderBottom:'1px solid rgba(37,99,235,0.08)',
            background: i % 2 === 0 ? 'transparent' : 'rgba(37,99,235,0.03)',
            alignItems:'center',
          }}>
            <div>
              <div style={{ fontSize:12, color:'#e0f0ff', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight:600 }}>{o.productTitle}</div>
              <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{o.buyerName} → {o.sellerName}</div>
            </div>
            <div style={{ fontSize:11, color:'#60a5fa' }}>
              {new Date(o.createdAt).toLocaleDateString('th-TH')}
            </div>
            <div style={{ fontSize:12, color:'#38bdf8', fontWeight:900 }}>
              {formatPrice(o.amount, locale)}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:orderStatusColor[o.status]||'#475569', boxShadow:`0 0 6px ${orderStatusColor[o.status]||'#475569'}` }}/>
              <span style={{ fontSize:10, color:'#60a5fa' }}>{o.status}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg) } }
        @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}
