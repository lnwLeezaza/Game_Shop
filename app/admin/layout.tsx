'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import {
  LayoutDashboard, Users, Package, ShoppingCart, AlertTriangle,
  Settings, BarChart2, Shield, Gift, FileText, ChevronLeft, Wallet, LogOut, TrendingUp,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useLocale } from '@/hooks/use-locale'

const adminNavItems = [
  { href: '/admin',                   icon: LayoutDashboard, labelTh: 'ภาพรวม',              labelEn: 'Dashboard',         group: 'main' },
  { href: '/admin/topup-analytics',   icon: BarChart2,       labelTh: '📊 Topup Analytics',  labelEn: '📊 Topup Analytics', group: 'main', highlight: 'cyan' },
  { href: '/admin/approvals',         icon: Wallet,          labelTh: '✅ อนุมัติ (รวม)',     labelEn: '✅ Approvals',       group: 'main', highlight: 'green' },
  { href: '/admin/users',             icon: Users,           labelTh: 'ผู้ใช้งาน',            labelEn: 'Users',              group: 'manage' },
  { href: '/admin/products',          icon: Package,         labelTh: 'จัดการสินค้า',         labelEn: 'Products',           group: 'manage' },
  { href: '/admin/orders',            icon: ShoppingCart,    labelTh: 'คำสั่งซื้อ',           labelEn: 'Orders',             group: 'manage' },
  { href: '/admin/disputes',          icon: AlertTriangle,   labelTh: 'ข้อพิพาท',             labelEn: 'Disputes',           group: 'manage' },
  { href: '/admin/deposits',          icon: Wallet,          labelTh: 'ฝากเงิน',              labelEn: 'Deposits',           group: 'finance' },
  { href: '/admin/withdrawals',       icon: Wallet,          labelTh: 'ถอนเงิน',              labelEn: 'Withdrawals',        group: 'finance' },
  { href: '/admin/gacha',             icon: Gift,            labelTh: 'ตู้สุ่ม',               labelEn: 'Gacha',              group: 'other' },
  { href: '/admin/stock',             icon: Package,         labelTh: '📦 สต็อก',              labelEn: 'Stock',              group: 'other' },
]

const GROUP_LABELS: Record<string, { th: string; en: string }> = {
  main:    { th: 'หลัก',       en: 'MAIN' },
  manage:  { th: 'จัดการ',     en: 'MANAGE' },
  finance: { th: 'การเงิน',    en: 'FINANCE' },
  other:   { th: 'อื่นๆ',      en: 'OTHER' },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
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
      <div style={{ minHeight:'100vh', background:'#050c1a', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div style={{ width:40, height:40, border:'3px solid #2563eb', borderTopColor:'#06b6d4', borderRadius:'50%', animation:'spin 0.8s linear infinite' }}/>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  // group nav items
  const groups = ['main','manage','finance','other']

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#050c1a' }}>

      {/* ── Sidebar ── */}
      <aside style={{
        position:'fixed', left:0, top:0, bottom:0, width:240, zIndex:40,
        background:'#070f1f',
        borderRight:'1px solid rgba(37,99,235,0.2)',
        display:'flex', flexDirection:'column', overflow:'hidden',
      }}>

        {/* Top bar */}
        <div style={{ padding:'18px 16px', borderBottom:'1px solid rgba(37,99,235,0.15)', background:'#050c1a', position:'relative', overflow:'hidden' }}>
          {/* subtle glow */}
          <div style={{ position:'absolute', top:-20, right:-20, width:80, height:80, borderRadius:'50%', background:'rgba(6,182,212,0.15)', filter:'blur(32px)', pointerEvents:'none' }}/>
          <div style={{ display:'flex', alignItems:'center', gap:10, position:'relative', zIndex:1 }}>
            <div style={{
              width:38, height:38, flexShrink:0,
              background:'linear-gradient(135deg,#1e40af,#0891b2)',
              borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 0 16px rgba(6,182,212,0.45)',
            }}>
              <Shield style={{ width:18, height:18, color:'white' }}/>
            </div>
            <div>
              <p style={{ margin:0, fontSize:13, fontWeight:900, color:'#e0f0ff', letterSpacing:'-0.01em' }}>Admin Panel</p>
              <p style={{ margin:0, fontSize:10, color:'#60a5fa' }}>GameShop</p>
            </div>
          </div>

          {/* User badge */}
          <div style={{
            marginTop:12, padding:'7px 10px', position:'relative', zIndex:1,
            background:'rgba(37,99,235,0.12)', border:'1px solid rgba(37,99,235,0.25)',
            borderRadius:8, fontSize:11, color:'#60a5fa',
            display:'flex', alignItems:'center', gap:6,
          }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:'#06b6d4', boxShadow:'0 0 6px #06b6d4', flexShrink:0 }}/>
            🛡️ {user.displayName || user.username}
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ flex:1, padding:'10px 10px', overflowY:'auto', display:'flex', flexDirection:'column', gap:0 }}>
          {groups.map(group => {
            const items = adminNavItems.filter(i => i.group === group)
            if (!items.length) return null
            return (
              <div key={group} style={{ marginBottom:6 }}>
                {/* Group label */}
                <div style={{ padding:'6px 10px 4px', fontSize:9, fontWeight:700, letterSpacing:'0.12em', color:'rgba(96,165,250,0.4)', textTransform:'uppercase' }}>
                  {th ? GROUP_LABELS[group].th : GROUP_LABELS[group].en}
                </div>
                {items.map(item => {
                  const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))
                  const hl = (item as any).highlight

                  // color config
                  const activeColor  = hl === 'cyan' ? '#06b6d4' : hl === 'green' ? '#34d399' : '#38bdf8'
                  const activeBg     = hl === 'cyan' ? 'rgba(6,182,212,0.12)' : hl === 'green' ? 'rgba(52,211,153,0.10)' : 'rgba(37,99,235,0.14)'
                  const activeBorder = hl === 'cyan' ? 'rgba(6,182,212,0.3)'  : hl === 'green' ? 'rgba(52,211,153,0.25)' : 'rgba(37,99,235,0.35)'
                  const idleColor    = hl === 'cyan' ? '#06b6d4' : hl === 'green' ? '#34d399' : '#475569'
                  const idleBg       = hl === 'cyan' ? 'rgba(6,182,212,0.07)'  : hl === 'green' ? 'rgba(52,211,153,0.06)' : 'transparent'

                  return (
                    <Link key={item.href} href={item.href} style={{ textDecoration:'none' }}>
                      <div style={{
                        display:'flex', alignItems:'center', gap:9,
                        padding:'8px 10px', borderRadius:8, marginBottom:1,
                        fontSize:12, transition:'all 0.15s', cursor:'pointer',
                        background:    isActive ? activeBg     : idleBg,
                        color:         isActive ? activeColor  : idleColor,
                        border:       `1px solid ${isActive ? activeBorder : 'transparent'}`,
                        boxShadow:     isActive ? `0 0 10px ${activeBg}` : 'none',
                        fontWeight:    isActive ? 700 : (hl ? 600 : 400),
                      }}>
                        <item.icon style={{ width:14, height:14, flexShrink:0 }}/>
                        <span style={{ flex:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                          {th ? item.labelTh : item.labelEn}
                        </span>
                        {isActive && (
                          <div style={{ width:4, height:4, borderRadius:'50%', background:activeColor, boxShadow:`0 0 5px ${activeColor}`, flexShrink:0 }}/>
                        )}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )
          })}
        </nav>

        {/* Footer */}
        <div style={{ padding:'10px', borderTop:'1px solid rgba(37,99,235,0.15)', display:'flex', flexDirection:'column', gap:2 }}>
          <Link href="/" style={{ textDecoration:'none' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, fontSize:12, color:'#475569', cursor:'pointer', transition:'all 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background='rgba(37,99,235,0.08)'; (e.currentTarget as HTMLElement).style.color='#60a5fa'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background='transparent'; (e.currentTarget as HTMLElement).style.color='#475569'; }}
            >
              <ChevronLeft style={{ width:13, height:13 }}/>
              {th ? 'กลับหน้าหลัก' : 'Back to Site'}
            </div>
          </Link>
          <button
            onClick={() => { logout(); router.push('/') }}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px', borderRadius:8, cursor:'pointer', fontSize:12, color:'#ef4444', background:'none', border:'none', width:'100%', textAlign:'left', transition:'all 0.15s' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='rgba(239,68,68,0.08)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='none'}
          >
            <LogOut style={{ width:13, height:13 }}/>
            {th ? 'ออกจากระบบ' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main style={{ marginLeft:240, flex:1, padding:32, minHeight:'100vh', background:'#050c1a' }}>
        {children}
      </main>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
