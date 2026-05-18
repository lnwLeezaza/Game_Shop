'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  Bell,
  ChevronDown,
  Globe,
  LogOut,
  Menu,
  Search,
  ShoppingBag,
  User,
  Wallet,
  X,
  LayoutDashboard,
  Shield,
  Package,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useAuthStore, useNotificationStore } from '@/lib/store'
import { useLocale, formatPrice } from '@/hooks/use-locale'

const categories = [
  { id: 'rov',      label: 'ROV',       emoji: '⚔️' },
  { id: 'freefire', label: 'Free Fire', emoji: '🔥' },
  { id: 'efootball',label: 'eFootball', emoji: '⚽' },
  { id: 'pubg',     label: 'PUBG',      emoji: '🎯' },
  { id: 'genshin',  label: 'Genshin',   emoji: '✨' },
  { id: 'roblox',   label: 'Roblox',    emoji: '🟥' },
]

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
          position: relative;
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #2563eb 0%, #06b6d4 100%);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 0 0 rgba(37,99,235,0.4);
          transition: box-shadow 0.3s ease, transform 0.2s ease;
        }
        .logo-orb:hover {
          box-shadow: 0 0 20px rgba(37,99,235,0.45), 0 0 40px rgba(6,182,212,0.2);
          transform: scale(1.05);
        }
        .logo-dot {
          position: absolute; top: -3px; right: -3px;
          width: 10px; height: 10px; border-radius: 50%;
          background: #22c55e;
          border: 2px solid #f0f6ff;
          animation: pulse-dot 2s ease-in-out infinite;
        }
        @keyframes pulse-dot {
          0%, 100% { box-shadow: 0 0 0 0 rgba(34,197,94,0.5); }
          50% { box-shadow: 0 0 0 4px rgba(34,197,94,0); }
        }
        .logo-text {
          background: linear-gradient(90deg, #2563eb, #06b6d4);
          -webkit-background-clip: text; background-clip: text;
          -webkit-text-fill-color: transparent;
          font-size: 18px; font-weight: 800; letter-spacing: -0.03em;
        }
        .nav-link {
          position: relative;
          padding: 6px 12px; border-radius: 8px;
          font-size: 13px; font-weight: 600;
          color: #1e40af;
          text-decoration: none;
          transition: all 0.18s ease;
          white-space: nowrap;
        }
        .nav-link:hover {
          color: #2563eb;
          background: rgba(37,99,235,0.08);
        }
        .nav-link.active {
          color: #2563eb;
          background: rgba(37,99,235,0.1);
        }
        .nav-link-special {
          background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(249,115,22,0.1));
          border: 1px solid rgba(249,115,22,0.25);
          color: #c2410c;
        }
        .nav-link-special:hover {
          background: linear-gradient(135deg, rgba(239,68,68,0.18), rgba(249,115,22,0.18));
          color: #ea580c;
        }
        .search-wrap {
          position: relative; flex: 1; max-width: 320px;
        }
        .search-input {
          width: 100%;
          padding: 7px 12px 7px 36px;
          border-radius: 10px;
          border: 1.5px solid #bfdbfe;
          background: rgba(255,255,255,0.8);
          font-size: 13px; color: #0a1628;
          outline: none;
          transition: all 0.2s ease;
        }
        .search-input:focus {
          border-color: #2563eb;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .search-input::placeholder { color: #93c5fd; }
        .search-icon {
          position: absolute; left: 11px; top: 50%;
          transform: translateY(-50%);
          color: #93c5fd; pointer-events: none;
        }
        .icon-btn {
          width: 36px; height: 36px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          border: 1.5px solid transparent;
          background: transparent;
          color: #1d4ed8;
          cursor: pointer;
          transition: all 0.18s ease;
          position: relative;
        }
        .icon-btn:hover {
          background: rgba(37,99,235,0.08);
          border-color: rgba(37,99,235,0.2);
          color: #2563eb;
        }
        .notif-badge {
          position: absolute; top: -4px; right: -4px;
          min-width: 18px; height: 18px;
          border-radius: 9px;
          background: linear-gradient(135deg, #ef4444, #f97316);
          color: #fff; font-size: 10px; font-weight: 800;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid #f0f6ff;
          padding: 0 4px;
        }
        .user-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 4px 10px 4px 4px;
          border-radius: 24px;
          border: 1.5px solid #bfdbfe;
          background: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .user-pill:hover {
          border-color: #2563eb;
          background: #fff;
          box-shadow: 0 2px 12px rgba(37,99,235,0.14);
        }
        .user-avatar {
          width: 28px; height: 28px; border-radius: 50%;
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-size: 11px; font-weight: 800;
          overflow: hidden; flex-shrink: 0;
        }
        .user-name { font-size: 13px; font-weight: 700; color: #0a1628; }
        .user-balance {
          font-size: 11px; color: #1d4ed8; font-weight: 600;
        }
        .auth-btn-login {
          padding: 6px 14px; border-radius: 8px;
          font-size: 13px; font-weight: 600;
          color: #2563eb;
          border: 1.5px solid #bfdbfe;
          background: transparent;
          cursor: pointer; transition: all 0.18s;
          text-decoration: none; display: inline-flex; align-items: center;
        }
        .auth-btn-login:hover {
          background: rgba(37,99,235,0.06);
          border-color: #2563eb;
        }
        .auth-btn-register {
          padding: 6px 14px; border-radius: 8px;
          font-size: 13px; font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #2563eb, #06b6d4);
          border: none; cursor: pointer;
          transition: all 0.18s;
          text-decoration: none; display: inline-flex; align-items: center;
          box-shadow: 0 2px 12px rgba(37,99,235,0.3);
        }
        .auth-btn-register:hover {
          box-shadow: 0 4px 20px rgba(37,99,235,0.45);
          transform: translateY(-1px);
        }
        /* Mobile search bar */
        .mobile-search-bar {
          border-top: 1px solid #bfdbfe;
          padding: 10px 16px;
          animation: slideDown 0.2s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Sheet nav */
        .sheet-nav-link {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px;
          font-size: 14px; font-weight: 600; color: #1e40af;
          text-decoration: none; transition: all 0.15s;
        }
        .sheet-nav-link:hover {
          background: rgba(37,99,235,0.08); color: #2563eb;
        }
        .sheet-cat-link {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 14px 7px 22px; border-radius: 8px;
          font-size: 13px; color: #1d4ed8;
          text-decoration: none; transition: all 0.15s;
        }
        .sheet-cat-link:hover {
          background: rgba(37,99,235,0.06); color: #2563eb;
        }
        /* Dropdown overrides */
        [data-radix-popper-content-wrapper] {
          --tw-shadow: 0 8px 32px rgba(37,99,235,0.14) !important;
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
              <nav style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: 8 }} className="hidden md:flex">
                <Link href="/products" className="nav-link">{t.nav.products}</Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                      {t.categories.all}
                      <ChevronDown size={13} style={{ opacity: 0.6 }} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" style={{ minWidth: 180, borderColor: '#bfdbfe', boxShadow: '0 8px 32px rgba(37,99,235,0.14)' }}>
                    <DropdownMenuItem asChild>
                      <Link href="/products" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        🎮 {t.categories.all}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {categories.map(cat => (
                      <DropdownMenuItem key={cat.id} asChild>
                        <Link href={`/products/${cat.id}`} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {cat.emoji} {cat.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                <Link href="/roblox" className="nav-link" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  🟥 Roblox
                </Link>
                <Link href="/gacha" className="nav-link nav-link-special" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Zap size={13} />
                  {t.nav.gacha}
                </Link>
              </nav>

              {/* ── Search ── */}
              <div className="search-wrap hidden lg:flex" style={{ marginLeft: 'auto', marginRight: 8 }}>
                <Search size={15} className="search-icon" />
                <input type="search" placeholder={`${t.common.search}...`} className="search-input" />
              </div>

              {/* ── Right Actions ── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }} className="lg:ml-0">

                {/* Mobile search toggle */}
                <button className="icon-btn lg:hidden" onClick={() => setSearchOpen(!searchOpen)}>
                  {searchOpen ? <X size={17} /> : <Search size={17} />}
                </button>

                {/* Language */}
                <button className="icon-btn" onClick={toggleLocale} title="Toggle language">
                  <Globe size={17} />
                </button>

                {user ? (
                  <>
                    {/* Notifications */}
                    <Link href="/notifications" style={{ textDecoration: 'none' }}>
                      <button className="icon-btn">
                        <Bell size={17} />
                        {unreadCount > 0 && (
                          <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                        )}
                      </button>
                    </Link>

                    {/* User dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <div className="user-pill">
                          <div className="user-avatar">
                            {user.avatar
                              ? <img src={user.avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              : user.displayName.charAt(0).toUpperCase()
                            }
                          </div>
                          <div className="hidden sm:flex flex-col" style={{ lineHeight: 1 }}>
                            <span className="user-name">{user.displayName}</span>
                            <span className="user-balance">{formatPrice(user.balance, locale)}</span>
                          </div>
                          <ChevronDown size={13} style={{ color: '#93c5fd' }} className="hidden sm:block" />
                        </div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" style={{ width: 220, borderColor: '#bfdbfe', boxShadow: '0 8px 32px rgba(37,99,235,0.14)' }}>
                        {/* User header */}
                        <div style={{ padding: '10px 12px 8px', borderBottom: '1px solid #e0f2fe' }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#0a1628' }}>{user.displayName}</div>
                          <div style={{ fontSize: 11, color: '#60a5fa', marginTop: 2 }}>{user.email}</div>
                          <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: '#fff', background: 'linear-gradient(90deg,#2563eb,#06b6d4)', padding: '3px 10px', borderRadius: 20 }}>
                            <Wallet size={10} /> {formatPrice(user.balance, locale)}
                          </div>
                        </div>
                        <DropdownMenuItem asChild>
                          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <LayoutDashboard size={14} style={{ color: '#2563eb' }} />
                            {t.nav.dashboard}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/wallet" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Wallet size={14} style={{ color: '#06b6d4' }} />
                            {t.nav.wallet}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/orders" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Package size={14} style={{ color: '#2563eb' }} />
                            {t.nav.orders}
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <User size={14} style={{ color: '#2563eb' }} />
                            {t.nav.profile}
                          </Link>
                        </DropdownMenuItem>
                        {user.role === 'admin' && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                              <Link href="/admin" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7c3aed' }}>
                                <Shield size={14} />
                                {t.nav.admin}
                              </Link>
                            </DropdownMenuItem>
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={logout}
                          style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ef4444', cursor: 'pointer' }}
                        >
                          <LogOut size={14} />
                          {t.nav.logout}
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
                    <button className="icon-btn md:hidden">
                      <Menu size={18} />
                    </button>
                  </SheetTrigger>
                  <SheetContent side="right" style={{ width: 300, background: '#f0f6ff', borderLeft: '1px solid #bfdbfe' }}>
                    <SheetTitle className="sr-only">เมนูนำทาง</SheetTitle>
                    <div style={{ paddingTop: 24, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {/* Branding */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px 16px', borderBottom: '1px solid #bfdbfe', marginBottom: 8 }}>
                        <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#2563eb,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ShoppingBag size={15} color="#fff" />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: 16, background: 'linear-gradient(90deg,#2563eb,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>GameShop</span>
                      </div>

                      <Link href="/products" className="sheet-nav-link" onClick={() => setMobileMenuOpen(false)}>
                        🎮 {t.nav.products}
                      </Link>

                      <div style={{ padding: '4px 0' }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: '#93c5fd', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 14px 6px' }}>หมวดหมู่</div>
                        {categories.map(cat => (
                          <Link key={cat.id} href={`/products/${cat.id}`} className="sheet-cat-link" onClick={() => setMobileMenuOpen(false)}>
                            {cat.emoji} {cat.label}
                          </Link>
                        ))}
                      </div>

                      <Link href="/roblox" className="sheet-nav-link" onClick={() => setMobileMenuOpen(false)}>
                        🟥 Roblox
                      </Link>
                      <Link href="/gacha" className="sheet-nav-link" style={{ color: '#c2410c', background: 'rgba(239,68,68,0.06)' }} onClick={() => setMobileMenuOpen(false)}>
                        <Zap size={15} style={{ color: '#f97316' }} />
                        {t.nav.gacha}
                      </Link>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>

          {/* Mobile Search Bar */}
          {searchOpen && (
            <div className="mobile-search-bar">
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#93c5fd' }} />
                <input type="search" placeholder={`${t.common.search}...`} className="search-input" autoFocus style={{ width: '100%' }} />
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  )
}
