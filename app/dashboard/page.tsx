'use client'

import { useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  ShoppingBag, Wallet, Clock, CheckCircle2,
  XCircle, ArrowUpRight, ChevronRight, Gamepad2,
  PackageSearch, Coins,
} from 'lucide-react'
import { useAuthStore, useOrderStore, useProductStore, useTransactionStore } from '@/lib/store'
import { useLocale, formatPrice, getRelativeTime } from '@/hooks/use-locale'

const statusConfig: Record<string, { label: string; labelEn: string; bg: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'รอดำเนินการ', labelEn: 'Pending',    bg: '#fef3c7', color: '#b45309', icon: <Clock style={{ width: 10, height: 10 }} /> },
  processing: { label: 'กำลังดำเนิน', labelEn: 'Processing', bg: '#dbeafe', color: '#1d4ed8', icon: <Clock style={{ width: 10, height: 10 }} /> },
  paid:       { label: 'ชำระแล้ว',    labelEn: 'Paid',       bg: '#dcfce7', color: '#166534', icon: <CheckCircle2 style={{ width: 10, height: 10 }} /> },
  completed:  { label: 'เสร็จสิ้น',   labelEn: 'Completed',  bg: '#dbeafe', color: '#1d4ed8', icon: <CheckCircle2 style={{ width: 10, height: 10 }} /> },
  disputed:   { label: 'มีข้อพิพาท',  labelEn: 'Disputed',   bg: '#fee2e2', color: '#b91c1c', icon: <XCircle style={{ width: 10, height: 10 }} /> },
  cancelled:  { label: 'ยกเลิก',      labelEn: 'Cancelled',  bg: '#fee2e2', color: '#b91c1c', icon: <XCircle style={{ width: 10, height: 10 }} /> },
}

const categoryEmoji: Record<string, string> = {
  roblox: '🟥', rov: '⚔️', freefire: '🔥', pubg: '🪖',
  genshin: '✨', efootball: '⚽', other: '🎮',
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { orders, fetchOrders } = useOrderStore()
  const { transactions, fetchTransactions } = useTransactionStore()
  const { products, fetchProducts } = useProductStore()
  const { locale } = useLocale()

  useEffect(() => {
    if (user) {
      fetchOrders(user.id)
      fetchTransactions(user.id)
      fetchProducts() 
    }
  }, [user])

  const myOrders = useMemo(
    () => orders.filter(o => o.buyerId === user?.id).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders, user]
  )

  const completedOrders = myOrders.filter(o => o.status === 'completed' || o.status === 'paid')
  const pendingOrders   = myOrders.filter(o => o.status === 'pending' || o.status === 'processing')
  const totalSpent      = completedOrders.reduce((s, o) => s + o.amount, 0)

  if (!user) return null
  const th = locale === 'th'

  const card: React.CSSProperties = {
    background: '#ffffff',
    border: '1px solid #bfdbfe',
    borderRadius: '16px',
    padding: '20px',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>

      {/* Welcome */}
      <div style={{
        background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)',
        border: '1px solid #bfdbfe',
        borderRadius: '20px',
        padding: '24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: '16px', flexWrap: 'wrap',
      }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#1d4ed8', fontWeight: 600 }}>
            {th ? 'ยินดีต้อนรับกลับ 👋' : 'Welcome back 👋'}
          </p>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0a1628' }}>
            {user.displayName}
          </h1>
        </div>
        {/* Balance pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '12px 20px',
          background: '#fff', border: '1px solid #93c5fd',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(37,99,235,0.1)',
        }}>
          <Coins style={{ width: 20, height: 20, color: '#2563eb' }} />
          <div>
            <p style={{ margin: 0, fontSize: '11px', color: '#1d4ed8', fontWeight: 600 }}>
              {th ? 'ยอดเงินคงเหลือ' : 'Balance'}
            </p>
            <p style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#1d4ed8' }}>
              {formatPrice(user.balance, locale)}
            </p>
          </div>
          <Link href="/wallet" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px',
            background: '#2563eb', borderRadius: '8px',
            color: '#fff', textDecoration: 'none',
          }}>
            <ArrowUpRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>
      </div>

      {/* 3 stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
        {[
          {
            icon: <ShoppingBag style={{ width: 20, height: 20, color: '#2563eb' }} />,
            label: th ? 'ออเดอร์ทั้งหมด' : 'Total Orders',
            value: myOrders.length,
            sub: th ? `เสร็จแล้ว ${completedOrders.length} รายการ` : `${completedOrders.length} completed`,
            bg: '#eff6ff', border: '#bfdbfe',
          },
          {
            icon: <Clock style={{ width: 20, height: 20, color: '#d97706' }} />,
            label: th ? 'รอดำเนินการ' : 'Pending',
            value: pendingOrders.length,
            sub: th ? 'กำลังดำเนินการ' : 'In progress',
            bg: '#fffbeb', border: '#fcd34d',
          },
          {
            icon: <Coins style={{ width: 20, height: 20, color: '#0891b2' }} />,
            label: th ? 'ยอดซื้อรวม' : 'Total Spent',
            value: formatPrice(totalSpent, locale),
            sub: th ? 'ตลอดการใช้งาน' : 'All time',
            bg: '#ecfeff', border: '#a5f3fc',
          },
        ].map((s, i) => (
          <div key={i} style={{ ...card, background: s.bg, border: `1px solid ${s.border}`, padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: `1px solid ${s.border}`,
              }}>
                {s.icon}
              </div>
              <span style={{ fontSize: '12px', color: '#475569', fontWeight: 600 }}>{s.label}</span>
            </div>
            <p style={{ margin: '0 0 4px', fontSize: '24px', fontWeight: 800, color: '#0a1628' }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Recent orders */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#0a1628' }}>
            {th ? '📦 ออเดอร์ล่าสุด' : '📦 Recent Orders'}
          </h2>
          <Link href="/orders" style={{
            display: 'flex', alignItems: 'center', gap: '4px',
            fontSize: '12px', color: '#2563eb', textDecoration: 'none', fontWeight: 600,
          }}>
            {th ? 'ดูทั้งหมด' : 'See all'}
            <ChevronRight style={{ width: 14, height: 14 }} />
          </Link>
        </div>

        {myOrders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {myOrders.slice(0, 6).map(order => {
              const st = statusConfig[order.status] || statusConfig.pending
              const cat = products.find(p => p.id === order.productId)?.category || 'other'
              const emoji = categoryEmoji[cat] || '🎮'
              return (
                <Link key={order.id} href={`/orders/${order.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', borderRadius: '12px',
                    border: '1px solid #f0f6ff', background: '#fafcff',
                    transition: 'all 0.15s', cursor: 'pointer',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#eff6ff')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#fafcff')}
                  >
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: '#eff6ff', border: '1px solid #bfdbfe',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '20px', flexShrink: 0,
                    }}>
                      {emoji}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0a1628', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.productTitle}
                      </p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>
                        {getRelativeTime(order.createdAt, locale)}
                      </p>
                    </div>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '4px',
                      padding: '4px 10px',
                      background: st.bg, borderRadius: '99px',
                      fontSize: '11px', fontWeight: 700, color: st.color,
                      flexShrink: 0,
                    }}>
                      {st.icon}
                      {th ? st.label : st.labelEn}
                    </div>
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#1d4ed8', flexShrink: 0 }}>
                      {formatPrice(order.amount, locale)}
                    </p>
                  </div>
                </Link>
              )
            })}
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <PackageSearch style={{ width: 40, height: 40, color: '#bfdbfe', margin: '0 auto 12px' }} />
            <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '14px' }}>
              {th ? 'ยังไม่มีออเดอร์' : 'No orders yet'}
            </p>
            <Link href="/products" style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              borderRadius: '10px', color: '#fff', textDecoration: 'none',
              fontSize: '13px', fontWeight: 700,
            }}>
              <Gamepad2 style={{ width: 14, height: 14 }} />
              {th ? 'เริ่มช้อปเลย' : 'Start Shopping'}
            </Link>
          </div>
        )}
      </div>

      {/* Quick links */}
      <div style={card}>
        <h2 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 700, color: '#0a1628' }}>
          {th ? '⚡ ทำอะไรต่อ?' : '⚡ Quick Actions'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {[
            { href: '/products', emoji: '🎮', label: th ? 'ซื้อสินค้า' : 'Shop' },
            { href: '/gacha', emoji: '🎲', label: th ? 'ตู้สุ่ม' : 'Gacha' },
            { href: '/wallet', emoji: '💰', label: th ? 'เติมเงิน' : 'Top Up' },
            { href: '/orders', emoji: '📋', label: th ? 'ออเดอร์' : 'Orders' },
          ].map(a => (
            <Link key={a.href} href={a.href} style={{ textDecoration: 'none' }}>
              <div style={{
                padding: '16px 8px',
                background: '#f8faff', border: '1px solid #bfdbfe',
                borderRadius: '12px', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = '#eff6ff'; e.currentTarget.style.borderColor = '#93c5fd' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f8faff'; e.currentTarget.style.borderColor = '#bfdbfe' }}
              >
                <div style={{ fontSize: '24px', marginBottom: '6px' }}>{a.emoji}</div>
                <p style={{ margin: 0, fontSize: '12px', fontWeight: 600, color: '#1d4ed8' }}>{a.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  )
}
