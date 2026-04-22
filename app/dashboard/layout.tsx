'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard, Package, ShoppingCart, Wallet,
  Star, Settings, Plus, History, User, LogOut,
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore } from '@/lib/store'
import { useLocale } from '@/hooks/use-locale'
import { cn } from '@/lib/utils'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { locale } = useLocale()
  const th = locale === 'th'

  useEffect(() => {
    if (!user) router.push('/login')
  }, [user, router])

  if (!user) return null

  const isSeller = user.role === 'seller' || user.role === 'admin'

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: th ? 'ภาพรวม' : 'Overview' },
    ...(isSeller ? [{ href: '/dashboard/products', icon: Package, label: th ? 'สินค้าของฉัน' : 'My Products' }] : []),
    { href: '/dashboard/orders', icon: ShoppingCart, label: th ? 'คำสั่งซื้อ' : 'Orders' },
    { href: '/wallet', icon: Wallet, label: th ? 'กระเป๋าเงิน' : 'Wallet' },
    { href: '/dashboard/gacha-history', icon: History, label: th ? 'ประวัติสุ่ม' : 'Gacha History' },
    { href: '/dashboard/reviews', icon: Star, label: th ? 'รีวิว' : 'Reviews' },
    { href: '/profile', icon: Settings, label: th ? 'ตั้งค่า' : 'Settings' },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside
          className="hidden w-64 shrink-0 border-r lg:block"
          style={{ borderColor: '#1a1a2e', background: '#08080e' }}
        >
          <div style={{ position: 'sticky', top: '64px', padding: '20px 16px' }}>
            {/* User info */}
            <div style={{
              padding: '14px', marginBottom: '20px',
              background: '#0f0f1a', border: '1px solid #1a1a2e',
              borderRadius: '10px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '8px',
                  background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <User style={{ width: '18px', height: '18px', color: 'white' }} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#f1f5f9', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {user.displayName || user.username}
                  </div>
                  <div style={{ fontSize: '10px', fontFamily: 'monospace', color: user.role === 'seller' ? '#60a5fa' : '#4ade80', marginTop: '2px' }}>
                    {user.role === 'seller' ? (th ? '🏪 ผู้ขาย' : '🏪 Seller') : (th ? '👤 ผู้ซื้อ' : '👤 Buyer')}
                  </div>
                </div>
              </div>
            </div>

            {isSeller && (
              <Link href="/dashboard/products/new" style={{ display: 'block', marginBottom: '16px', textDecoration: 'none' }}>
                <div style={{
                  padding: '10px 14px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
                  borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', boxShadow: '0 0 16px rgba(139,92,246,0.3)',
                }}>
                  <Plus style={{ width: '16px', height: '16px', color: 'white' }} />
                  <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'white', fontFamily: 'monospace' }}>
                    {th ? 'ลงขายสินค้า' : 'List Product'}
                  </span>
                </div>
              </Link>
            )}

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {navItems.map(item => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '9px 12px', borderRadius: '8px', textDecoration: 'none',
                      fontSize: '13px', fontFamily: 'monospace', transition: 'all 0.15s',
                      background: isActive ? 'rgba(139,92,246,0.15)' : 'transparent',
                      color: isActive ? '#a78bfa' : '#64748b',
                      border: `1px solid ${isActive ? 'rgba(139,92,246,0.3)' : 'transparent'}`,
                    }}
                  >
                    <item.icon style={{ width: '15px', height: '15px' }} />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #1a1a2e' }}>
              <button
                onClick={() => { logout(); router.push('/') }}
                style={{
                  width: '100%', padding: '9px 12px', background: 'none',
                  border: '1px solid transparent', borderRadius: '8px',
                  display: 'flex', alignItems: 'center', gap: '10px',
                  fontSize: '13px', color: '#ef4444', fontFamily: 'monospace',
                  cursor: 'pointer', transition: 'all 0.15s', textAlign: 'left',
                }}
              >
                <LogOut style={{ width: '15px', height: '15px' }} />
                {th ? 'ออกจากระบบ' : 'Sign Out'}
              </button>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1" style={{ background: '#050508' }}>
          <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '24px 16px' }}>
            {children}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  )
}
