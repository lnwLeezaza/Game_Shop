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
        /* ── Reset ── */
        .hdr { position: sticky; top: 0; z-index: 50; }
        .hdr, .hdr * { box-sizing: border-box; }

        /* ── Shell ── */
        .hdr-shell {
          width: 100vw;
          max-width: 100vw;
          background: rgba(240,246,255,0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(191,219,254,0.7);
          overflow: hidden;
        }
        .hdr-shell.scrolled {
          box-shadow: 0 4px 32px rgba(37,99,235,0.12);
        }

        /* ── Inner row ── */
        .hdr-row {
          display: flex;
          align-items: center;
          height: 56px;
          padding: 0 12px;
          gap: 6px;
          width: 100%;
          max-width: 1280px;
          margin: 0 auto;
        }

        /* ── Logo ── */
        .hdr-logo {
          display: flex; align-items: center; gap: 8px;
          text-decoration: none; flex-shrink: 0;
        }
        .hdr-logo-orb {
          position: relative; width: 34px; height: 34px; border-radius: 10px;
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .hdr-logo-dot {
          position: absolute; top: -2px; right: -2px;
          width: 9px; height: 9px; border-radius: 50%;
          background: #22c55e; border: 2px solid #f0f6ff;
          animation: hdr-pulse 2s ease-in-out infinite;
        }
        @keyframes hdr-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          50%      { box-shadow: 0 0 0 4px rgba(34,197,94,0); }
        }
        .hdr-logo-text {
          background: linear-gradient(90deg, #2563eb, #06b6d4);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          font-size: 17px; font-weight: 800; letter-spacing: -0.03em;
          white-space: nowrap;
        }

        /* ── Desktop nav links (hidden on mobile) ── */
        .hdr-nav {
          display: none;
          align-items: center;
          gap: 6px;
          margin-left: 8px;
        }
        @media (min-width: 768px) { .hdr-nav { display: flex; } }

        .hdr-nav-topup {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 9px;
          font-size: 13px; font-weight: 700;
          text-decoration: none; white-space: nowrap;
          background: rgba(255,255,255,0.8);
          border: 1.5px solid #bfdbfe; color: #1d4ed8;
          transition: all 0.18s;
        }
        .hdr-nav-topup:hover { background: #fff; border-color: #2563eb; }

        .hdr-nav-gacha {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 14px; border-radius: 9px;
          font-size: 13px; font-weight: 700;
          text-decoration: none; white-space: nowrap;
          background: linear-gradient(135deg, #ef4444, #f97316);
          border: none; color: #fff;
          box-shadow: 0 2px 12px rgba(239,68,68,0.3);
          transition: all 0.18s;
        }
        .hdr-nav-gacha:hover { box-shadow: 0 4px 20px rgba(239,68,68,0.45); }

        /* ── Spacer ── */
        .hdr-spacer { flex: 1; min-width: 0; }

        /* ── Icon btn ── */
        .hdr-icon {
          width: 36px; height: 36px; min-width: 36px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid transparent; background: transparent;
          color: #1d4ed8; cursor: pointer; position: relative;
          transition: all 0.18s; flex-shrink: 0;
        }
        .hdr-icon:hover { background: rgba(37,99,235,0.08); border-color: rgba(37,99,235,0.2); }

        /* Search icon: show only on < lg */
        .hdr-icon-search { display: flex; }
        @media (min-width: 1024px) { .hdr-icon-search { display: none; } }

        /* Globe: always show */

        .hdr-notif-badge {
          position: absolute; top: -4px; right: -4px;
          min-width: 17px; height: 17px; border-radius: 9px;
          background: linear-gradient(135deg, #ef4444, #f97316);
          color: #fff; font-size: 10px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #f0f6ff; padding: 0 3px;
        }

        /* ── Auth buttons ── */
        .hdr-auth {
          display: flex; align-items: center; gap: 6px; flex-shrink: 0;
        }
        .hdr-login {
          display: none; /* hidden on mobile */
          align-items: center;
          padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600;
          color: #2563eb; border: 1.5px solid #bfdbfe; background: transparent;
          text-decoration: none; white-space: nowrap; cursor: pointer;
          transition: all 0.18s;
        }
        @media (min-width: 640px) { .hdr-login { display: inline-flex; } }
        .hdr-login:hover { background: rgba(37,99,235,0.06); border-color: #2563eb; }

        .hdr-register {
          display: inline-flex; align-items: center;
          padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 700;
          color: #fff; background: linear-gradient(135deg, #2563eb, #06b6d4);
          border: none; text-decoration: none; white-space: nowrap; cursor: pointer;
          box-shadow: 0 2px 10px rgba(37,99,235,0.3); flex-shrink: 0;
          transition: all 0.18s;
        }
        .hdr-register:hover { box-shadow: 0 4px 18px rgba(37,99,235,0.45); }

        /* ── User pill ── */
        .hdr-user {
          display: flex; align-items: center; gap: 6px;
          padding: 3px 8px 3px 3px; border-radius: 24px;
          border: 1.5px solid #bfdbfe; background: rgba(255,255,255,0.8);
          cursor: pointer; flex-shrink: 0; max-width: 160px;
          transition: all 0.2s;
        }
        .hdr-user:hover { border-color: #2563eb; background: #fff; }
        .hdr-avatar {
          width: 28px; height: 28px; min-width: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 11px; font-weight: 800; overflow: hidden;
        }
        .hdr-uname { font-size: 12px; font-weight: 700; color: #0a1628; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .hdr-ubal  { font-size: 10px; color: #1d4ed8; font-weight: 600; white-space: nowrap; }

        /* ── Hamburger: show only < md ── */
        .hdr-menu-btn { display: flex; }
        @media (min-width: 768px) { .hdr-menu-btn { display: none; } }

        /* ── Search bar drop ── */
        .hdr-search-bar {
          padding: 10px 12px;
          border-top: 1px solid #bfdbfe;
          animation: hdr-slide 0.2s ease;
        }
        @keyframes hdr-slide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hdr-search-wrap { position: relative; }
        .hdr-search-ico  { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #93c5fd; pointer-events: none; }
        .hdr-search-input {
          width: 100%; padding: 7px 12px 7px 34px; border-radius: 10px;
          border: 1.5px solid #bfdbfe; background: rgba(255,255,255,0.9);
          font-size: 13px; color: #0a1628; outline: none;
        }
        .hdr-search-input:focus { border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
        .hdr-search-input::placeholder { color: #93c5fd; }

        /* ── Sheet nav ── */
        .hdr-sheet-btn {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px; border-radius: 12px;
          font-size: 14px; font-weight: 700;
          text-decoration: none; border: none; cursor: pointer;
          transition: all 0.15s;
        }
      `}</style>

      <header className="hdr">
        <div className={`hdr-shell${scrolled ? ' scrolled' : ''}`}>
          <div className="hdr-row">

            {/* Logo */}
            <Link href="/" className="hdr-logo">
              <div className="hdr-logo-orb">
                <ShoppingBag size={16} color="#fff" />
                <div className="hdr-logo-dot" />
              </div>
              <span className="hdr-logo-text hidden sm:inline">GameShop</span>
            </Link>

            {/* Desktop nav */}
            <nav className="hdr-nav">
              <Link href="/topup" className="hdr-nav-topup">
                <Coins size={13} /> เติมเกม
              </Link>
              <Link href="/gacha" className="hdr-nav-gacha">
                <Zap size={13} /> สุ่มไอดี
              </Link>
            </nav>

            {/* Spacer */}
            <div className="hdr-spacer" />

            {/* Desktop search */}
            <div style={{ position: 'relative', width: 220, marginRight: 4 }} className="hidden lg:flex">
              <Search size={14} className="hdr-search-ico" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#93c5fd', pointerEvents: 'none' }} />
              <input type="search" placeholder="ค้นหาเกม..." className="hdr-search-input" />
            </div>

            {/* Mobile search toggle */}
            <button className="hdr-icon hdr-icon-search" onClick={() => setSearchOpen(v => !v)}>
              {searchOpen ? <X size={17} /> : <Search size={17} />}
            </button>

            {/* Globe */}
            <button className="hdr-icon" onClick={toggleLocale} title="Toggle language">
              <Globe size={17} />
            </button>

            {/* User area */}
            {user ? (
              <>
                <Link href="/notifications" style={{ textDecoration: 'none', flexShrink: 0 }}>
                  <button className="hdr-icon">
                    <Bell size={17} />
                    {unreadCount > 0 && (
                      <span className="hdr-notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                    )}
                  </button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="hdr-user">
                      <div className="hdr-avatar">
                        {user.avatar
                          ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : user.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="hidden sm:flex flex-col" style={{ lineHeight: 1, minWidth: 0 }}>
                        <span className="hdr-uname">{user.displayName}</span>
                        <span className="hdr-ubal">{formatPrice(user.balance, locale)}</span>
                      </div>
                      <ChevronDown size={12} style={{ color: '#93c5fd', flexShrink: 0 }} className="hidden sm:block" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" style={{ width: 220, borderColor: '#bfdbfe', boxShadow: '0 8px 32px rgba(37,99,235,0.14)' }}>
                    <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #e0f2fe' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0a1628' }}>{user.displayName}</div>
                      <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 2 }}>{user.email}</div>
                      <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#fff', background: 'linear-gradient(90deg,#2563eb,#06b6d4)', padding: '3px 10px', borderRadius: 20 }}>
                          <Wallet size={10} /> {formatPrice(user.balance, locale)}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 11, fontWeight: 800, padding: '2px 10px', borderRadius: 20, color: '#fff',
                            background: user.tier === 'vip' ? 'linear-gradient(135deg,#d97706,#f59e0b)'
                                      : user.tier === 'gold' ? 'linear-gradient(135deg,#ca8a04,#eab308)'
                                      : user.tier === 'silver' ? 'linear-gradient(135deg,#64748b,#94a3b8)'
                                      : 'linear-gradient(135deg,#92400e,#b45309)',
                          }}>
                            {user.tier === 'vip' ? '👑 VIP' : user.tier === 'gold' ? '🥇 Gold' : user.tier === 'silver' ? '🥈 Silver' : '🥉 Bronze'}
                          </span>
                          <span style={{ fontSize: 10, color: '#64748b' }}>{user.lifetimePoints} pt</span>
                        </div>
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
                                  : 'ถึง tier ถัดไปแล้ว!'}
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
              <div className="hdr-auth">
                <Link href="/login" className="hdr-login">{t.nav.login}</Link>
                <Link href="/register" className="hdr-register">{t.nav.register}</Link>
              </div>
            )}

            {/* Hamburger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="hdr-icon hdr-menu-btn"><Menu size={18} /></button>
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
                  <Link href="/topup" className="hdr-sheet-btn"
                    style={{ background: 'rgba(255,255,255,0.8)', border: '1.5px solid #bfdbfe', color: '#1d4ed8' }}
                    onClick={() => setMobileMenuOpen(false)}>
                    <Coins size={16} /> เติมเกม
                  </Link>
                  <Link href="/gacha" className="hdr-sheet-btn"
                    style={{ background: 'linear-gradient(135deg, #ef4444, #f97316)', color: '#fff', boxShadow: '0 2px 14px rgba(239,68,68,0.28)' }}
                    onClick={() => setMobileMenuOpen(false)}>
                    <Zap size={16} /> สุ่มไอดี
                  </Link>
                </div>
              </SheetContent>
            </Sheet>

          </div>

          {/* Mobile search bar */}
          {searchOpen && (
            <div className="hdr-search-bar">
              <div className="hdr-search-wrap">
                <Search size={14} className="hdr-search-ico" />
                <input type="search" placeholder="ค้นหาเกม..." className="hdr-search-input" autoFocus />
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  )
}