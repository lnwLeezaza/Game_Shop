'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Package, ShoppingCart, AlertTriangle,
  Settings, BarChart3, Shield, Gift, FileText, ChevronLeft, Wallet, LogOut,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useLocale } from '@/hooks/use-locale'

const adminNavItems = [
  { href: '/admin',              icon: LayoutDashboard, labelTh: 'ภาพรวม',            labelEn: 'Dashboard',  badge: null },
  { href: '/admin/approvals',    icon: Wallet,          labelTh: '✅ อนุมัติ (รวม)',   labelEn: '✅ Approvals', badge: 'pending', highlight: true },
  { href: '/admin/users',        icon: Users,           labelTh: 'ผู้ใช้งาน',          labelEn: 'Users',      badge: null },
  { href: '/admin/products',     icon: Package,         labelTh: 'จัดการสินค้า',       labelEn: 'Products',   badge: null },
  { href: '/admin/orders',       icon: ShoppingCart,    labelTh: 'คำสั่งซื้อ',         labelEn: 'Orders',     badge: null },
  { href: '/admin/disputes',     icon: AlertTriangle,   labelTh: 'ข้อพิพาท',           labelEn: 'Disputes',   badge: null },
  { href: '/admin/deposits',     icon: Wallet,          labelTh: 'ฝากเงิน',            labelEn: 'Deposits',   badge: null },
  { href: '/admin/withdrawals',  icon: Wallet,          labelTh: 'ถอนเงิน',            labelEn: 'Withdrawals',badge: null },
  { href: '/admin/gacha',        icon: Gift,            labelTh: 'ตู้สุ่ม',             labelEn: 'Gacha',      badge: null },
  { href: '/admin/stock',        icon: Package,         labelTh: '📦 สต็อก',            labelEn: 'Stock',      badge: null },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { locale } = useLocale()
  const th = locale === 'th'

  useEffect(() => {
    if (!user) router.push('/login')
    else if (user.role !== 'admin') router.push('/dashboard')
  }, [user, router])

  if (!user || user.role !== 'admin') {
    return (
      <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#050508' }}>
      {/* Sidebar */}
      <aside style={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: '240px', zIndex: 40,
        background: '#07070e', borderRight: '1px solid #1a1a2e',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Top bar */}
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1a1a2e', background: '#050508' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', flexShrink: 0,
              background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
              borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(139,92,246,0.4)',
            }}>
              <Shield style={{ width: '18px', height: '18px', color: 'white' }} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '14px', fontWeight: 'bold', color: '#f1f5f9', fontFamily: 'monospace' }}>Admin Panel</p>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>GameShop</p>
            </div>
          </div>
          <div style={{
            marginTop: '12px', padding: '8px 10px',
            background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
            borderRadius: '6px', fontSize: '11px', color: '#a78bfa', fontFamily: 'monospace',
          }}>
            🛡️ {user.displayName || user.username}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {adminNavItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
            const isHighlight = (item as any).highlight
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '9px 12px', borderRadius: '8px', textDecoration: 'none',
                  fontSize: '13px', fontFamily: 'monospace', transition: 'all 0.15s',
                  background: isActive
                    ? 'rgba(139,92,246,0.15)'
                    : isHighlight ? 'rgba(16,185,129,0.06)' : 'transparent',
                  color: isActive ? '#a78bfa' : isHighlight ? '#34d399' : '#64748b',
                  border: `1px solid ${isActive ? 'rgba(139,92,246,0.3)' : isHighlight ? 'rgba(16,185,129,0.2)' : 'transparent'}`,
                  boxShadow: isActive ? '0 0 10px rgba(139,92,246,0.1)' : 'none',
                  fontWeight: isHighlight ? 700 : 400,
                }}
              >
                <item.icon style={{ width: '15px', height: '15px', flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{th ? item.labelTh : item.labelEn}</span>
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding: '12px', borderTop: '1px solid #1a1a2e', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
              fontSize: '12px', color: '#64748b', fontFamily: 'monospace',
            }}>
              <ChevronLeft style={{ width: '14px', height: '14px' }} />
              {th ? 'กลับหน้าหลัก' : 'Back to Site'}
            </div>
          </Link>
          <button
            onClick={() => { logout(); router.push('/') }}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
              fontSize: '12px', color: '#ef4444', fontFamily: 'monospace',
              background: 'none', border: 'none', width: '100%', textAlign: 'left',
            }}
          >
            <LogOut style={{ width: '14px', height: '14px' }} />
            {th ? 'ออกจากระบบ' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ marginLeft: '240px', flex: 1, padding: '32px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
