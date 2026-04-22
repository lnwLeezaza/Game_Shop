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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuthStore, useNotificationStore } from '@/lib/store'
import { useLocale, formatPrice } from '@/hooks/use-locale'

const categories = [
  { id: 'rov', label: 'ROV' },
  { id: 'freefire', label: 'Free Fire' },
  { id: 'efootball', label: 'eFootball' },
  { id: 'pubg', label: 'PUBG' },
  { id: 'genshin', label: 'Genshin' },
  { id: 'roblox', label: 'Roblox' },
]

export function Header() {
  const { user, logout, refreshUser } = useAuthStore()
  const { unreadCount, fetchNotifications, addNotification } = useNotificationStore()
  const { locale, toggleLocale, t } = useLocale()
  const [searchOpen, setSearchOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const channelRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Realtime: notifications + balance updates
  useEffect(() => {
    if (!user) return
    fetchNotifications(user.id)

    let cleanup: (() => void) | undefined

    const setupRealtime = async () => {
      try {
        const { notificationAPI, realtimeAPI } = await import('@/lib/supabase')

        // Subscribe to new notifications
        const notifChannel = notificationAPI.subscribeToNotifications(user.id, (n) => {
          addNotification(n)
          if (typeof window !== 'undefined' && 'Notification' in window && window.Notification.permission === 'granted') {
            new window.Notification(n.title || 'GameShop', { body: n.message })
          }
        })

        // Subscribe to balance changes
        const balanceChannel = realtimeAPI.subscribeToUserBalance(user.id, () => {
          refreshUser()
        })

        cleanup = () => {
          notifChannel?.unsubscribe?.()
          balanceChannel?.unsubscribe?.()
        }
      } catch {}
    }

    setupRealtime()
    return () => { cleanup?.() }
  }, [user?.id])


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-lg shadow-primary/25">
              <ShoppingBag className="h-5 w-5 text-white" />
              <div className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-green-500 ring-2 ring-background" />
            </div>
            <span className="hidden bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-xl font-bold text-transparent sm:inline-block">
              GameShop
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 md:flex">
            <Link href="/products">
              <Button variant="ghost" size="sm">
                {t.nav.products}
              </Button>
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1">
                  {t.categories.all}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuItem asChild>
                  <Link href="/products">{t.categories.all}</Link>
                </DropdownMenuItem>
                {categories.map((cat) => (
                  <DropdownMenuItem key={cat.id} asChild>
                    <Link href={`/products?category=${cat.id}`}>
                      {cat.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Link href="/roblox">
              <Button variant="ghost" size="sm" className="gap-1.5">
                <span className="text-base leading-none">🟥</span>
                Roblox
              </Button>
            </Link>
            <Link href="/gacha">
              <Button variant="ghost" size="sm">
                {t.nav.gacha}
              </Button>
            </Link>
          </nav>

          {/* Search */}
          <div className="hidden flex-1 max-w-md lg:flex">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={`${t.common.search}...`}
                className="w-full pl-9"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </Button>

            {/* Language Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleLocale}>
              <Globe className="h-5 w-5" />
              <span className="sr-only">Toggle language</span>
            </Button>

            {user ? (
              <>
                {/* Notifications */}
                <Link href="/notifications">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </Link>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 px-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.displayName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden flex-col items-start text-left sm:flex">
                        <span className="text-sm font-medium">{user.displayName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatPrice(user.balance, locale)}
                        </span>
                      </div>
                      <ChevronDown className="hidden h-4 w-4 sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.displayName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/dashboard" className="flex items-center gap-2">
                        <LayoutDashboard className="h-4 w-4" />
                        {t.nav.dashboard}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/wallet" className="flex items-center gap-2">
                        <Wallet className="h-4 w-4" />
                        {t.nav.wallet}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/orders" className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {t.nav.orders}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {t.nav.profile}
                      </Link>
                    </DropdownMenuItem>
                    {user.role === 'admin' && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href="/admin" className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            {t.nav.admin}
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={logout}
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      {t.nav.logout}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    {t.nav.login}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">{t.nav.register}</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <nav className="flex flex-col gap-4 pt-8">
                  <Link
                    href="/products"
                    className="text-lg font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t.nav.products}
                  </Link>
                  <div className="space-y-1">
                    <Link
                      href="/products"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      🎮 {t.categories.all}
                    </Link>
                    {categories.map((cat) => (
                      <Link
                        key={cat.id}
                        href={`/products?category=${cat.id}`}
                        className="block rounded-lg py-1.5 pl-6 text-sm hover:text-primary transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {cat.label}
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/roblox"
                    className="flex items-center gap-2 text-lg font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <span>🟥</span> Roblox
                  </Link>
                  <Link
                    href="/gacha"
                    className="text-lg font-medium"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t.nav.gacha}
                  </Link>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* Mobile Search Bar */}
        {searchOpen && (
          <div className="border-t py-3 lg:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={`${t.common.search}...`}
                className="w-full pl-9"
                autoFocus
              />
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
