'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Users, Package, ShoppingCart, Wallet, TrendingUp, AlertTriangle, CheckCircle, Clock, ArrowUpRight, RefreshCw } from 'lucide-react'
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

  const totalUsers = liveStats?.totalUsers ?? users.length
  const totalProducts = liveStats?.activeProducts ?? products.filter(p => p.status === 'available').length
  const totalOrders = liveStats?.totalOrders ?? orders.length
  const totalRevenue = liveStats?.totalRevenue ?? orders.filter(o => o.status === 'completed').reduce((s, o) => s + o.platformFee, 0)

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'paid').length
  const disputedOrders = orders.filter(o => o.status === 'disputed').length
  const recentOrders = orders.slice(0, 6)

  const statCards = [
    { label: th ? 'ผู้ใช้ทั้งหมด' : 'Total Users', value: totalUsers.toLocaleString(), icon: Users, color: '#60a5fa', glow: 'rgba(96,165,250,0.3)', href: '/admin/users' },
    { label: th ? 'สินค้า (ขายอยู่)' : 'Active Products', value: totalProducts.toLocaleString(), icon: Package, color: '#a78bfa', glow: 'rgba(139,92,246,0.3)', href: '/admin/products' },
    { label: th ? 'คำสั่งซื้อทั้งหมด' : 'Total Orders', value: totalOrders.toLocaleString(), icon: ShoppingCart, color: '#34d399', glow: 'rgba(52,211,153,0.3)', href: '/admin/orders' },
    { label: th ? 'รายได้ค่าธรรมเนียม' : 'Platform Revenue', value: formatPrice(totalRevenue, locale), icon: Wallet, color: '#fbbf24', glow: 'rgba(251,191,36,0.3)', href: '/admin/deposits' },
  ]

  const alerts = [
    { count: pendingOrders, label: th ? 'รอดำเนินการ (Order)' : 'Pending Orders', color: '#fbbf24', href: '/admin/orders', icon: Clock },
    { count: disputedOrders, label: th ? 'ข้อพิพาท' : 'Disputes', color: '#ef4444', href: '/admin/disputes', icon: AlertTriangle },
    { count: users.filter(u => u.kycStatus === 'pending').length, label: th ? 'รอยืนยัน KYC' : 'Pending KYC', color: '#60a5fa', href: '/admin/users', icon: CheckCircle },
    { count: null, label: th ? '💰 ตรวจสลิป & ถอน' : '💰 Approvals', color: '#34d399', href: '/admin/approvals', icon: CheckCircle },
  ]

  const orderStatusColor: Record<string, string> = {
    pending: '#fbbf24', paid: '#60a5fa', processing: '#a78bfa',
    completed: '#4ade80', disputed: '#ef4444', refunded: '#f97316', cancelled: '#64748b',
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#f1f5f9', fontFamily: 'monospace' }}>
            {th ? '🛡️ Admin Dashboard' : '🛡️ ADMIN DASHBOARD'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
            {th ? 'ภาพรวมระบบทั้งหมด • อัพเดต realtime' : 'System overview • Live data'}
          </p>
        </div>
        <button onClick={() => { setLoading(true); adminAPI.getDashboardStats().then(s => { setLiveStats(s); setLoading(false) }).catch(() => setLoading(false)) }}
          style={{ padding: '8px 14px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
          <RefreshCw style={{ width: 13, height: 13, animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {th ? 'รีเฟรช' : 'Refresh'}
        </button>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {statCards.map(s => (
          <Link key={s.label} href={s.href} style={{ textDecoration: 'none' }}>
            <div style={{
              background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '12px',
              padding: '18px', cursor: 'pointer', transition: 'all 0.2s',
              boxShadow: loading ? 'none' : `0 0 16px ${s.glow}20`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{s.label}</p>
                  {loading
                    ? <div style={{ height: '30px', width: '80px', background: '#1a1a2e', borderRadius: '4px', marginTop: '6px', animation: 'pulse 1.5s infinite' }} />
                    : <p style={{ margin: '6px 0 0', fontSize: '26px', fontWeight: 'bold', color: s.color, fontFamily: 'monospace', textShadow: `0 0 12px ${s.glow}` }}>{s.value}</p>
                  }
                </div>
                <div style={{ width: '40px', height: '40px', background: `${s.color}15`, border: `1px solid ${s.color}30`, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 10px ${s.glow}30` }}>
                  <s.icon style={{ width: '18px', height: '18px', color: s.color }} />
                </div>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                <ArrowUpRight style={{ width: 11, height: 11, color: s.color }} />
                {th ? 'ดูทั้งหมด' : 'View all'}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Alert Badges */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        {alerts.map(a => (
          <Link key={a.label} href={a.href} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px',
              background: a.count > 0 ? `${a.color}10` : '#0f0f1a',
              border: `1px solid ${a.count > 0 ? a.color + '40' : '#1a1a2e'}`,
              borderRadius: '8px', cursor: 'pointer',
            }}>
              <a.icon style={{ width: 14, height: 14, color: a.count > 0 ? a.color : '#94a3b8' }} />
              <span style={{ fontSize: '13px', fontWeight: 'bold', color: a.count > 0 ? a.color : '#94a3b8', fontFamily: 'monospace' }}>
                {a.count}
              </span>
              <span style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>{a.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Orders */}
      <div style={{ background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ background: '#070710', borderBottom: '1px solid #1a1a2e', padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#a78bfa', fontFamily: 'monospace' }}>
            // {th ? 'คำสั่งซื้อล่าสุด' : 'RECENT_ORDERS'}
          </span>
          <Link href="/admin/orders" style={{ fontSize: '11px', color: '#8b5cf6', fontFamily: 'monospace', textDecoration: 'none' }}>
            {th ? 'ดูทั้งหมด →' : 'View all →'}
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>
            {th ? '// ยังไม่มีคำสั่งซื้อ' : '// NO_ORDERS_YET'}
          </div>
        ) : recentOrders.map(o => (
          <div key={o.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 80px', gap: '10px', padding: '10px 18px', borderBottom: '1px solid #0d0d1a', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '12px', color: '#f1f5f9', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{o.productTitle}</div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>{o.buyerName} → {o.sellerName}</div>
            </div>
            <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
              {new Date(o.createdAt).toLocaleDateString('th-TH')}
            </div>
            <div style={{ fontSize: '12px', color: '#fbbf24', fontFamily: 'monospace', fontWeight: 'bold' }}>
              {formatPrice(o.amount, locale)}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: orderStatusColor[o.status] || '#64748b', boxShadow: `0 0 5px ${orderStatusColor[o.status] || '#64748b'}` }} />
              <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>{o.status}</span>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}
