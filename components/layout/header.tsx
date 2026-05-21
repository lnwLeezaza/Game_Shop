'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  Bell, ChevronDown, Globe, LogOut, Menu, Search,
  ShoppingBag, User, Wallet, X, LayoutDashboard,
  Shield, Package, Zap, Coins,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuthStore, useNotificationStore } from '@/lib/store'
import { useLocale, formatPrice } from '@/hooks/use-locale'

export function Header() {
  const { user, logout, refreshUser } = useAuthStore()
  const { unreadCount, fetchNotifications, addNotification } = useNotificationStore()
  const { locale, toggleLocale, t } = useLocale()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!user) return
    fetchNotifications(user.id)
    let cleanup: (() => void) | undefined
    const setupRealtime = async () => {
      try {
        const { notificationAPI, realtimeAPI } = await import('@/lib/supabase')
        const notifChannel = notificationAPI.subscribeToNotifications(user.id, (n) => {
          addNotification(n)
          if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
            new window.Notification(n.title || 'GameShop', { body: n.message })
          }
        })
        const balanceChannel = realtimeAPI.subscribeToUserBalance(user.id, () => { refreshUser() })
        cleanup = () => { notifChannel?.unsubscribe?.(); balanceChannel?.unsubscribe?.() }
      } catch {}
    }
    setupRealtime()
    return () => { cleanup?.() }
  }, [user?.id])

  return (
    <>
      <style>{`
        .header-root {
          position: sticky; top: 0; z-index: 50; width: 100%;
          transition: all 0.3s ease;
        }
        .header-root.scrolled {
          box-shadow: 0 4px 32px rgba(37,99,235,0.12), 0 1px 0 rgba(191,219,254,0.5);
        }
        .header-inner {
          background: rgba(240,246,255,0.92);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(191,219,254,0.7);
        }
        .logo-orb {
          position: relative; width: 36px; height: 36px; border-radius: 10px;
          background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
          display: flex; align-items: center; justify-content: center;
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }
        .logo-orb:hover {
          box-shadow: 0 0 20px rgba(37,99,235,0.45), 0 0 40px rgba(6,182,212,0.2);
          transform: scale(1.05);
        }
        .logo-dot {
          position: absolute; top: -3px; right: -3px;
          width: 10px; height: 10px; border-radius: 50%;
          background: #22c55e; border: 2px solid #f0f6ff;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          50%       { box-shadow: 0 0 0 4px rgba(34,197,94,0); }
        }
        .logo-text {
          background: linear-gradient(90deg, #2563eb, #06b6d4);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          font-size: 18px; font-weight: 800; letter-spacing: -0.03em;
        }
        .nav-btn {
          display: flex; align-items: center; gap: 7px;
          padding: 7px 18px; border-radius: 10px;
          font-size: 13px; font-weight: 700;
          text-decoration: none; white-space: nowrap;
          transition: all 0.18s ease; cursor: pointer;
        }
        .nav-topup {
          background: rgba(255,255,255,0.7);
          border: 1.5px solid #bfdbfe;
          color: #1d4ed8;
        }
        .nav-topup:hover {
          background: #fff; border-color: #2563eb;
          box-shadow: 0 2px 14px rgba(37,99,235,0.16);
          transform: translateY(-1px);
        }
        .nav-gacha {
          background: linear-gradient(135deg, #ef4444, #f97316);
          border: 1.5px solid transparent;
          color: #fff;
          box-shadow: 0 2px 14px rgba(239,68,68,0.28);
        }
        .nav-gacha:hover {
          box-shadow: 0 4px 22px rgba(239,68,68,0.45);
          transform: translateY(-1px);
        }
        .icon-btn {
          width: 36px; height: 36px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid transparent; background: transparent;
          color: #1d4ed8; cursor: pointer;
          transition: all 0.18s ease; position: relative;
        }
        .icon-btn:hover {
          background: rgba(37,99,235,0.08); border-color: rgba(37,99,235,0.2); color: #2563eb;
        }
        .notif-badge {
          position: absolute; top: -4px; right: -4px;
          min-width: 18px; height: 18px; border-radius: 9px;
          background: linear-gradient(135deg, #ef4444, #f97316);
          color: #fff; font-size: 10px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #f0f6ff; padding: 0 4px;
        }
        .user-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 10px 4px 4px; border-radius: 24px;
          border: 1.5px solid #bfdbfe; background: rgba(255,255,255,0.7);
          cursor: pointer; transition: all 0.2s ease;
        }
        .user-pill:hover { border-color: #2563eb; background: #fff; box-shadow: 0 2px 12px rgba(37,99,235,0.14); }
        .user-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 11px; font-weight: 800; overflow: hidden; flex-shrink: 0;
        }
        .user-name    { font-size: 13px; font-weight: 700; color: #0a1628; }
        .user-balance { font-size: 11px; color: #1d4ed8; font-weight: 600; }
        .auth-btn-login {
          padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 600;
          color: #2563eb; border: 1.5px solid #bfdbfe; background: transparent;
          cursor: pointer; transition: all 0.18s;
          text-decoration: none; display: inline-flex; align-items: center;
        }
        .auth-btn-login:hover { background: rgba(37,99,235,0.06); border-color: #2563eb; }
        .auth-btn-register {
          padding: 6px 14px; border-radius: 8px; font-size: 13px; font-weight: 700;
          color: #fff; background: linear-gradient(135deg, #2563eb, #06b6d4);
          border: none; cursor: pointer; transition: all 0.18s;
          text-decoration: none; display: inline-flex; align-items: center;
          box-shadow: 0 2px 12px rgba(37,99,235,0.3);
        }
        .auth-btn-register:hover { box-shadow: 0 4px 20px rgba(37,99,235,0.45); transform: translateY(-1px); }
        .search-input {
          width: 100%; padding: 7px 12px 7px 36px; border-radius: 10px;
          border: 1.5px solid #bfdbfe; background: rgba(255,255,255,0.8);
          font-size: 13px; color: #0a1628; outline: none; transition: all 0.2s ease;
        }
        .search-input:focus { border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
        .search-input::placeholder { color: #93c5fd; }
        .mobile-search-bar { border-top: 1px solid #bfdbfe; padding: 10px 16px; animation: slideDown 0.2s ease; }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .sheet-nav-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; border-radius: 12px;
          font-size: 14px; font-weight: 700;
          text-decoration: none; transition: all 0.15s; border: none; cursor: pointer;
        }
      `}</style>

      <header className={`header-root${scrolled ? ' scrolled' : ''}`}>
        <div className="header-inner">
          <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 16px' }}>
            <div style={{ display: 'flex', height: 60, alignItems: 'center', gap: 12 }}>

              {/* ── Logo ── */}
              <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 9, flexShrink: 0 }}>
                <div className="logo-orb">
                  <ShoppingBag size={17} color="#fff" />
                  <div className="logo-dot" />
                </div>
                <span className="logo-text hidden sm:inline">GameShop</span>
              </Link>

              {/* ── Desktop Nav ── */}
              <nav style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }} className="hidden md:flex">
                <Link href="/topup" className="nav-btn nav-topup">
                  <Coins size={14} /> เติมเกม
                </Link>
                <Link href="/gacha" className="nav-btn nav-gacha">
                  <Zap size={14} /> สุ่มไอดี
                </Link>
              </nav>

              {/* ── Search ── */}
              <div style={{ position: 'relative', flex: 1, maxWidth: 280, marginLeft: 'auto', marginRight: 8 }} className="hidden lg:flex">
                <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#93c5fd', pointerEvents: 'none' }} />
                <input type="search" placeholder="ค้นหาเกม..." className="search-input" />
              </div>

              {/* ── Right Actions ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }} className="lg:ml-0">

                <button className="icon-btn lg:hidden" onClick={() => setSearchOpen(!searchOpen)}>
                  {searchOpen ? <X size={17} /> : <Search size={17} />}
                </button>

                <button className="icon-btn" onClick={toggleLocale} title="Toggle language">
                  <Globe size={17} />
                </button>

                {user ? (
                  <>
                    <Link href="/notifications" style={{ textDecoration: 'none' }}>
                      <button className="icon-btn">
                        <Bell size={17} />
                        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                      </button>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="user-pill">
                          <div className="user-avatar">
                            {user.avatar
                              ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : user.displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="hidden sm:flex flex-col" style={{ lineHeight: 1 }}>
                            <span className="user-name">{user.displayName}</span>
                            <span className="user-balance">{formatPrice(user.balance, locale)}</span>
                          </div>
                          <ChevronDown size={13} style={{ color: '#93c5fd' }} className="hidden sm:block" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" style={{ width: 220, borderColor: '#bfdbfe', boxShadow: '0 8px 32px rgba(37,99,235,0.14)' }}>
                        <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #e0f2fe' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0a1628' }}>{user.displayName}</div>
                          <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 2 }}>{user.email}</div>
                          <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
  {/* Balance */}
  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#fff', background: 'linear-gradient(90deg,#2563eb,#06b6d4)', padding: '3px 10px', borderRadius: 20 }}>
    <Wallet size={10} /> {formatPrice(user.balance, locale)}
  </div>

  {/* Tier badge */}
  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
    <span style={{
      fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 20,
      background: user.tier === 'vip' ? 'linear-gradient(135deg,#d97706,#f59e0b)'
                : user.tier === 'gold' ? 'linear-gradient(135deg,#ca8a04,#eab308)'
                : user.tier === 'silver' ? 'linear-gradient(135deg,#64748b,#94a3b8)'
                : 'linear-gradient(135deg,#92400e,#b45309)',
      color: '#fff',
    }}>
      {user.tier === 'vip' ? '👑 VIP'
     : user.tier === 'gold' ? '🥇 Gold'
     : user.tier === 'silver' ? '🥈 Silver'
     : '🥉 Bronze'}
    </span>
    <span style={{ fontSize: 10, color: '#64748b' }}>{user.lifetimePoints} pt</span>
  </div>

{/* Progress bar */}
{user.tier !== 'vip' && (() => {
  const next = user.tier === 'gold' ? 5000 : user.tier === 'silver' ? 2000 : 500
  const prev = user.tier === 'gold' ? 2000 : user.tier === 'silver' ? 500 : 0
  const pct = Math.min(((user.lifetimePoints - prev) / (next - prev)) * 100, 100)
  return (
    <div>
      <div style={{ height: 5, background: '#e2e8f0', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 99, background: 'linear-gradient(90deg,#2563eb,#06b6d4)', transition: 'width 0.5s ease' }} />
      </div>
      <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>
        {next > user.lifetimePoints
          ? `อีก ${next - user.lifetimePoints} pt ขึ้น ${user.tier === 'silver' ? '🥇 Gold' : user.tier === 'bronze' ? '🥈 Silver' : '👑 VIP'}`
          : `ถึง tier ถัดไปแล้ว!`}
      </div>
    </div>
  )
    })()}
</div>
                        </div>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <LayoutDashboard size={14} style={{ color: '#2563eb' }} /> {t.nav.dashboard}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/wallet" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Wallet size={14} style={{ color: '#06b6d4' }} /> {t.nav.wallet}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/orders" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Package size={14} style={{ color: '#2563eb' }} /> {t.nav.orders}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <User size={14} style={{ color: '#2563eb' }} /> {t.nav.profile}
                          </Link>
                        </DropdownMenuItem>
                        {user.role === 'admin' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7c3aed' }}>
                                <Shield size={14} /> {t.nav.admin}
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', cursor: 'pointer' }}>
                          <LogOut size={14} /> {t.nav.logout}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Link href="/login" className="auth-btn-login">{t.nav.login}</Link>
                    <Link href="/register" className="auth-btn-register">{t.nav.register}</Link>
                  </div>
                )}

                {/* Mobile menu */}
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <button className="icon-btn md:hidden"><Menu size={18} /></button>
                  </SheetTrigger>
                  <SheetContent side="right" style={{ width: 280, background: '#f0f6ff', borderLeft: '1px solid #bfdbfe' }}>
                    <SheetTitle className="sr-only">เมนูนำทาง</SheetTitle>
                    <div style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px 16px', borderBottom: '1px solid #bfdbfe', marginBottom: 4 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#2563eb,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingBag size={15} color="#fff" />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: 16, background: 'linear-gradient(90deg,#2563eb,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GameShop</span>
                      </div>

                      <Link href="/topup" className="sheet-nav-btn"
                        style={{ background: 'rgba(255,255,255,0.8)', border: '1.5px solid #bfdbfe', color: '#1d4ed8' }}
                        onClick={() => setMobileMenuOpen(false)}>
                        <Coins size={16} /> เติมเกม
                      </Link>

                      <Link href="/gacha" className="sheet-nav-btn"
                        style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#fff', boxShadow: '0 2px 14px rgba(239,68,68,0.28)' }}
                        onClick={() => setMobileMenuOpen(false)}>
                        <Zap size={16} /> สุ่มไอดี
                      </Link>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          {searchOpen && (
            <div className="mobile-search-bar">
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#93c5fd' }} />
                <input type="search" placeholder="ค้นหาเกม..." className="search-input" autoFocus style={{ width: '100%' }} />
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  )
}