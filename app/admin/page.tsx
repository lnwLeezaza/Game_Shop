'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Users, Package, ShoppingCart, Wallet, AlertTriangle,
  CheckCircle, Clock, ArrowUpRight, RefreshCw, BarChart2, Flame,
} from 'lucide-react'
import { useLocale, formatPrice } from '@/hooks/use-locale'
import { useProductStore, useOrderStore, useAdminUserStore } from '@/lib/store'
import { adminAPI, supabase } from '@/lib/supabase'

export default function AdminDashboardPage() {
  const { locale } = useLocale()
  const th = locale === 'th'
  const { products, fetchAllProducts } = useProductStore()
  const { orders, fetchAllOrders } = useOrderStore()
  const { users, fetchUsers } = useAdminUserStore()
  const [liveStats, setLiveStats] = useState<{
    totalUsers: number; activeProducts: number; totalOrders: number; totalRevenue: number
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const [popupCount, setPopupCount] = useState<number>(0)

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

    const loadPopupCount = async () => {
      const now = new Date().toISOString()
      const { count } = await supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('popup_enabled', true)
        .or(`popup_expires_at.is.null,popup_expires_at.gt.${now}`)
      setPopupCount(count ?? 0)
    }
    loadPopupCount()
  }, [])

  const totalUsers    = liveStats?.totalUsers     ?? users.length
  const totalProducts = liveStats?.activeProducts ?? products.filter(p => p.status === 'available').length
  const totalOrders   = liveStats?.totalOrders    ?? orders.length
  const totalRevenue  = liveStats?.totalRevenue   ?? orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.platformFee, 0)

  const pendingOrders  = orders.filter(o => o.status === 'pending' || o.status === 'paid').length
  const disputedOrders = orders.filter(o => o.status === 'disputed').length
  const recentOrders   = orders.slice(0, 6)

  const statCards = [
    { label: th ? 'ผู้ใช้ทั้งหมด'      : 'Total Users',      value: totalUsers.toLocaleString(),       icon: Users,        accent: '#2563eb', iconBg: '#eff6ff', href: '/admin/users' },
    { label: th ? 'สินค้า (ขายอยู่)'   : 'Active Products',  value: totalProducts.toLocaleString(),    icon: Package,      accent: '#06b6d4', iconBg: '#ecfeff', href: '/admin/products' },
    { label: th ? 'คำสั่งซื้อทั้งหมด'  : 'Total Orders',     value: totalOrders.toLocaleString(),      icon: ShoppingCart, accent: '#38bdf8', iconBg: '#f0f9ff', href: '/admin/orders' },
    { label: th ? 'รายได้ค่าธรรมเนียม' : 'Platform Revenue', value: formatPrice(totalRevenue, locale), icon: Wallet,       accent: '#0ea5e9', iconBg: '#f0f9ff', href: '/admin/deposits' },
  ]

  const alerts = [
    { count: pendingOrders,                                       label: th ? 'รอดำเนินการ' : 'Pending Orders', accent: '#38bdf8', href: '/admin/orders',    icon: Clock },
    { count: disputedOrders,                                      label: th ? 'ข้อพิพาท'   : 'Disputes',       accent: '#ef4444', href: '/admin/disputes',  icon: AlertTriangle },
    { count: users.filter(u => u.kycStatus === 'pending').length, label: th ? 'รอ KYC'     : 'Pending KYC',    accent: '#06b6d4', href: '/admin/users',     icon: CheckCircle },
    { count: null,                                                 label: th ? 'อนุมัติถอน' : 'Approvals',      accent: '#0ea5e9', href: '/admin/approvals', icon: CheckCircle },
  ]

  const statusColor: Record<string, string> = {
    pending: '#f59e0b', paid: '#38bdf8', processing: '#06b6d4',
    completed: '#2563eb', disputed: '#ef4444', refunded: '#f97316', cancelled: '#94a3b8',
  }

  return (
    <div style={{ fontFamily: "'DM Sans','Noto Sans Thai',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '26px' }}>
        <div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '5px',
            fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', color: '#0891b2',
            textTransform: 'uppercase', background: '#e0f2fe', border: '1px solid #bae6fd',
            borderRadius: '999px', padding: '3px 10px', marginBottom: '6px',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06b6d4', display: 'inline-block', animation: 'blink 1.8s ease-in-out infinite' }}/>
            Live
          </div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0a1628', letterSpacing: '-0.03em' }}>
            {th ? '🛡️ ภาพรวมระบบ' : '🛡️ System Overview'}
          </h1>
          <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#3b82f6', fontFamily: 'DM Mono,monospace' }}>
            {th ? '// ข้อมูลเรียลไทม์ • อัปเดตอัตโนมัติ' : '// real-time data · auto refresh'}
          </p>
        </div>

        <button
          onClick={() => {
            setLoading(true)
            adminAPI.getDashboardStats()
              .then(s => { setLiveStats(s); setLoading(false) })
              .catch(() => setLoading(false))
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 16px', background: '#fff', border: '1px solid #bfdbfe',
            borderRadius: '10px', cursor: 'pointer', fontSize: '12px',
            color: '#2563eb', fontFamily: 'inherit', fontWeight: 500, transition: 'all .15s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#eff6ff' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff' }}
        >
          <RefreshCw style={{ width: 13, height: 13, animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
          {th ? 'รีเฟรช' : 'Refresh'}
        </button>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '14px', marginBottom: '16px' }}>
        {statCards.map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: '#fff', borderRadius: '14px', padding: '18px',
                border: '1px solid #e0eaff', cursor: 'pointer', transition: 'all .18s',
                position: 'relative', overflow: 'hidden',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(-2px)'
                el.style.boxShadow = '0 6px 24px rgba(37,99,235,.1)'
                el.style.borderColor = '#93c5fd'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.transform = 'translateY(0)'
                el.style.boxShadow = 'none'
                el.style.borderColor = '#e0eaff'
              }}
            >
              {/* top accent bar */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: s.accent, borderRadius: '14px 14px 0 0' }}/>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#64748b' }}>
                    {s.label}
                  </p>
                  {loading
                    ? <div style={{ height: '28px', width: '80px', background: '#e0eaff', borderRadius: '6px', marginTop: '6px', animation: 'pulse 1.5s ease-in-out infinite' }}/>
                    : <p style={{ margin: '6px 0 0', fontSize: '26px', fontWeight: 800, color: s.accent, letterSpacing: '-0.03em', lineHeight: 1 }}>{s.value}</p>
                  }
                </div>
                <div style={{
                  width: '38px', height: '38px', background: s.iconBg,
                  border: `1px solid ${s.accent}30`, borderRadius: '10px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <s.icon style={{ width: 18, height: 18, color: s.accent }}/>
                </div>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: '#94a3b8' }}>
                <ArrowUpRight style={{ width: 11, height: 11, color: s.accent }}/>
                {th ? 'ดูทั้งหมด' : 'View all'}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Promo Cards Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>

        {/* Popup Promotions */}
        <Link href="/admin/products" style={{ textDecoration: 'none' }}>
          <div
            style={{
              background: 'linear-gradient(135deg,#dc2626,#991b1b)',
              borderRadius: '14px', padding: '18px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', transition: 'all .18s', position: 'relative', overflow: 'hidden',
              border: '1px solid rgba(220,38,38,.3)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(220,38,38,.3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(239,68,68,.25)', filter: 'blur(36px)', pointerEvents: 'none' }}/>
            <div style={{ position: 'absolute', left: 20, top: 20, width: 7, height: 7, borderRadius: '50%', background: '#fca5a5', animation: 'blink 1.5s infinite' }}/>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame style={{ width: 22, height: 22, color: '#fca5a5' }}/>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                  {th ? '🔥 Popup โปรโมชั่น' : '🔥 Popup Promotions'}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.6)', marginTop: '2px' }}>
                  {th ? 'จัดการ popup บนหน้าแรก' : 'Manage homepage popups'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '22px', fontWeight: 800, color: '#fca5a5', lineHeight: 1 }}>
                  {loading ? '—' : popupCount}
                </div>
                <div style={{ fontSize: '9px', color: 'rgba(255,255,255,.5)', marginTop: '2px', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {th ? 'กำลังแสดง' : 'Active'}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[th ? 'เรียลไทม์' : 'Realtime', th ? 'จัดการได้' : 'Manageable'].map(b => (
                  <span key={b} style={{ fontSize: '9px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px', background: 'rgba(255,255,255,.12)', color: '#fca5a5', border: '1px solid rgba(255,255,255,.2)', letterSpacing: '0.05em' }}>{b}</span>
                ))}
              </div>
              <ArrowUpRight style={{ width: 18, height: 18, color: 'rgba(255,255,255,.7)' }}/>
            </div>
          </div>
        </Link>

        {/* Topup Analytics */}
        <Link href="/admin/topup-analytics" style={{ textDecoration: 'none' }}>
          <div
            style={{
              background: 'linear-gradient(135deg,#1e40af,#2563eb,#0891b2)',
              borderRadius: '14px', padding: '18px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', transition: 'all .18s', position: 'relative', overflow: 'hidden',
              border: '1px solid rgba(37,99,235,.3)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(37,99,235,.3)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}
          >
            <div style={{ position: 'absolute', right: -20, top: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(6,182,212,.2)', filter: 'blur(36px)', pointerEvents: 'none' }}/>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 1 }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BarChart2 style={{ width: 22, height: 22, color: '#fff' }}/>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>
                  Topup Analytics
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,.65)', marginTop: '2px' }}>
                  {th ? 'ยอดเติมเกม • แพ็กขายดี • สถานะออร์เดอร์' : 'Revenue · Top packages · Order status'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {[
                  { label: th ? 'เรียลไทม์' : 'Realtime', color: '#67e8f9' },
                  { label: th ? 'ทุกเกม' : 'All Games', color: '#93c5fd' },
                ].map(b => (
                  <span key={b.label} style={{ fontSize: '9px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px', background: 'rgba(255,255,255,.12)', color: b.color, border: '1px solid rgba(255,255,255,.2)', letterSpacing: '0.05em' }}>{b.label}</span>
                ))}
              </div>
              <ArrowUpRight style={{ width: 18, height: 18, color: 'rgba(255,255,255,.7)' }}/>
            </div>
          </div>
        </Link>
      </div>

      {/* ── Alert Chips ── */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '22px' }}>
        {alerts.map(a => {
          const active = (a.count ?? 0) > 0
          return (
            <Link key={a.label} href={a.href} style={{ textDecoration: 'none' }}>
              <div
                style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '9px 14px', borderRadius: '10px', cursor: 'pointer', transition: 'all .15s',
                  background: active ? `${a.accent}10` : '#f8fbff',
                  border: `1px solid ${active ? a.accent + '45' : '#e0eaff'}`,
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${a.accent}18` }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = active ? `${a.accent}10` : '#f8fbff' }}
              >
                <a.icon style={{ width: 13, height: 13, color: active ? a.accent : '#94a3b8' }}/>
                <span style={{ fontSize: '13px', fontWeight: 800, color: active ? a.accent : '#94a3b8' }}>
                  {a.count ?? '—'}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>{a.label}</span>
              </div>
            </Link>
          )
        })}
      </div>

      {/* ── Recent Orders ── */}
      <div style={{ background: '#fff', border: '1px solid #e0eaff', borderRadius: '14px', overflow: 'hidden' }}>
        {/* top accent */}
        <div style={{ height: '3px', background: 'linear-gradient(90deg,#2563eb,#06b6d4,#38bdf8)' }}/>

        {/* table header */}
        <div style={{ background: '#f8fbff', borderBottom: '1px solid #e0eaff', padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '3px', height: '16px', background: '#2563eb', borderRadius: '999px', flexShrink: 0 }}/>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#1e40af' }}>
              {th ? 'คำสั่งซื้อล่าสุด' : 'Recent Orders'}
            </span>
          </div>
          <Link href="/admin/orders" style={{ fontSize: '11px', color: '#3b82f6', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
            {th ? 'ดูทั้งหมด' : 'View all'} <ArrowUpRight style={{ width: 11, height: 11 }}/>
          </Link>
        </div>

        {/* column labels */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 90px 80px', gap: '10px', padding: '8px 18px', borderBottom: '1px solid #f1f5f9' }}>
          {[th ? 'สินค้า' : 'Product', th ? 'วันที่' : 'Date', th ? 'ยอด' : 'Amount', th ? 'สถานะ' : 'Status'].map(h => (
            <span key={h} style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8' }}>{h}</span>
          ))}
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
            {th ? 'ยังไม่มีคำสั่งซื้อ' : 'No orders yet'}
          </div>
        ) : recentOrders.map((o, i) => (
          <div key={o.id} style={{
            display: 'grid', gridTemplateColumns: '1fr 110px 90px 80px',
            gap: '10px', padding: '11px 18px', alignItems: 'center',
            borderBottom: '1px solid #f1f5f9',
            background: i % 2 === 0 ? '#fff' : '#fafcff',
            transition: 'background .12s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#eff6ff' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = i % 2 === 0 ? '#fff' : '#fafcff' }}
          >
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#0a1628', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.productTitle}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{o.buyerName} → {o.sellerName}</div>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'DM Mono,monospace' }}>
              {new Date(o.createdAt).toLocaleDateString('th-TH')}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d4ed8' }}>
              {formatPrice(o.amount, locale)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor[o.status] || '#94a3b8', flexShrink: 0 }}/>
              <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'DM Mono,monospace' }}>{o.status}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin  { to { transform: rotate(360deg) } }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>
    </div>
  )
}