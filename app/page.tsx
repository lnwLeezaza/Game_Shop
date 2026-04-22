'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ArrowRight, Shield, Zap, Clock, Sparkles, Gamepad2, TrendingUp, Users, Star, ChevronRight, Flame, Crown, Clock3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/product-card'
import { GachaCard } from '@/components/gacha-card'
import { CategoryCard, categoryGradients } from '@/components/category-card'
import { ImageSlider } from '@/components/image-slider'
import { useLocale, formatPrice } from '@/hooks/use-locale'
import { categoryStats } from '@/lib/mock-data'
import type { GachaPool } from '@/lib/types'
import { useProductStore } from '@/lib/store'

const categoryIcons: Record<string, React.ReactNode> = {
  rov: <Gamepad2 className="h-7 w-7" />,
  freefire: <Zap className="h-7 w-7" />,
  efootball: <span className="text-2xl">⚽</span>,
  pubg: <span className="text-2xl">🎯</span>,
  genshin: <Sparkles className="h-7 w-7" />,
  roblox: <span className="text-2xl">🟥</span>,
  other: <Gamepad2 className="h-7 w-7" />,
}

export default function HomePage() {
  const { locale, t } = useLocale()
  const { products, fetchProducts } = useProductStore()

  useEffect(() => {
    fetchProducts()
    const loadGacha = async () => {
      try {
        const { gachaAPI } = await import('@/lib/supabase')
        const pools = await gachaAPI.getPools()
        setFeaturedGacha(pools.slice(0, 3))
      } catch { setFeaturedGacha([]) }
    }
    const loadReviews = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data } = await supabase.from('reviews').select('*').order('created_at', { ascending: false }).limit(3)
        setReviews(data || [])
      } catch { setReviews([]) }
    }
    loadGacha()
    loadReviews()
  }, [fetchProducts])

  const [featuredGacha, setFeaturedGacha] = useState<GachaPool[]>([])
  const [reviews, setReviews] = useState<any[]>([])

  const robloxItems = products.filter(p => p.category === 'roblox').slice(0, 3)
  const featuredProducts = products.slice(0, 4)
  const hotDeals = [...products].sort((a, b) => b.views - a.views).slice(0, 4)

  const slides = [
    {
      id: '1',
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&h=400&fit=crop',
      title: locale === 'th' ? 'ซื้อขายไอดีเกมที่ปลอดภัยที่สุด' : 'The Safest Game ID Trading Platform',
      subtitle: locale === 'th' ? 'ระบบ Escrow ปกป้องทุกธุรกรรม รับประกันความพึงพอใจ 100%' : 'Escrow system protects every transaction. 100% satisfaction guaranteed.',
      cta: { label: locale === 'th' ? '🛒 เริ่มช้อปเลย' : '🛒 Start Shopping', href: '/products' },
      gradient: 'bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500',
    },
    {
      id: '2',
      image: 'https://images.unsplash.com/photo-1640955014216-75201056c829?w=600&h=400&fit=crop',
      title: locale === 'th' ? 'Roblox Robux ราคาถูกที่สุด!' : 'Cheapest Roblox Robux!',
      subtitle: locale === 'th' ? 'เติม Robux ง่ายๆ ส่งไวภายใน 5 นาที ปลอดภัย 100%' : 'Top up Robux easily. Delivered in 5 minutes, 100% safe!',
      cta: { label: locale === 'th' ? '🎮 ซื้อ Robux เลย' : '🎮 Buy Robux Now', href: '/products?category=roblox' },
      gradient: 'bg-gradient-to-br from-red-500 via-rose-500 to-pink-500',
    },
    {
      id: '3',
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&h=400&fit=crop',
      title: locale === 'th' ? 'ตู้สุ่มโชคดี Gacha' : 'Lucky Gacha Box',
      subtitle: locale === 'th' ? 'ลุ้นรับไอเทมหายากราคาถูก โอกาสลุ้นรางวัลใหญ่ทุกครั้ง!' : 'Win rare items at low cost. Big prizes every spin!',
      cta: { label: locale === 'th' ? '✨ สุ่มเลย' : '✨ Try Your Luck', href: '/gacha' },
      gradient: 'bg-gradient-to-br from-purple-600 via-violet-500 to-fuchsia-500',
    },
    {
      id: '4',
      image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b2b0d?w=600&h=400&fit=crop',
      title: locale === 'th' ? 'โปรโมชั่นสมาชิกใหม่!' : 'New Member Promotion!',
      subtitle: locale === 'th' ? 'ลดสูงสุด 30% สมัครวันนี้รับเครดิตฟรี 50 บาท' : 'Up to 30% off. Register today and get 50 THB free credit!',
      cta: { label: locale === 'th' ? '🎁 สมัครเลย' : '🎁 Register Now', href: '/register' },
      gradient: 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500',
    },
  ]

  const stats = [
    { label: locale === 'th' ? 'ผู้ใช้งาน' : 'Users', value: '50,000+', icon: Users },
    { label: locale === 'th' ? 'สินค้าขายแล้ว' : 'Items Sold', value: '120,000+', icon: TrendingUp },
    { label: locale === 'th' ? 'คะแนนรีวิว' : 'Rating', value: '4.9/5', icon: Star },
  ]

  // FIX #5: Roblox packages — visual hierarchy ชัดเจน ยอดนิยมเด่นที่สุด
  const robuxPackages = [
    { amount: '400 R$', price: '฿290', oldPrice: null, popular: false, noPassword: true, deliveryMin: 5 },
    { amount: '800 R$', price: '฿520', oldPrice: null, popular: false, noPassword: true, deliveryMin: 5 },
    { amount: '1,700 R$', price: '฿990', oldPrice: '฿1,200', popular: true, noPassword: true, deliveryMin: 5 },
    { amount: '4,500 R$', price: '฿2,490', oldPrice: null, popular: false, noPassword: true, deliveryMin: 5 },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">

        {/* Hero Slider — ปุ่ม CTA สีส้มทอง แก้ใน image-slider.tsx แล้ว */}
        <section className="px-4 py-6 lg:py-8">
          <div className="mx-auto max-w-7xl">
            <ImageSlider slides={slides} />
          </div>
        </section>

        {/* Stats */}
        <section className="border-y border-border bg-gradient-to-r from-primary/5 via-transparent to-primary/5 py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid grid-cols-3 gap-4 lg:gap-8">
              {stats.map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <stat.icon className="h-6 w-6 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground lg:text-3xl">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Roblox Banner — FIX #2: เพิ่ม text-shadow, เพิ่ม bg เข้มขึ้น */}
        <section className="py-8">
          <div className="mx-auto max-w-7xl px-4">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-700 via-rose-600 to-orange-500 p-6 lg:p-10 shadow-xl">
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '20px 20px' }} />
              <div className="absolute -right-8 -top-8 text-[160px] leading-none select-none opacity-20">🟥</div>
              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-sm font-semibold text-white backdrop-blur">
                    <Flame className="h-4 w-4 text-yellow-300" />
                    {locale === 'th' ? '🆕 ใหม่! มาแล้ว' : '🆕 NEW! Just arrived'}
                  </div>
                  {/* FIX #2: text-shadow เพิ่ม contrast บน bg สีแดง-ส้ม */}
                  <h2
                    className="text-3xl font-extrabold text-white lg:text-4xl"
                    style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}
                  >
                    Roblox Robux &amp; Accounts
                  </h2>
                  <p
                    className="mt-2 max-w-md text-white/90"
                    style={{ textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}
                  >
                    {locale === 'th'
                      ? 'เติม Robux ราคาถูก บัญชี Premium Limited items ส่งไวภายใน 5 นาที!'
                      : 'Cheap Robux top-up, Premium accounts, Limited items. Delivered in 5 minutes!'}
                  </p>
                </div>
                <div className="flex flex-col gap-3 sm:items-end">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur text-sm px-3 py-1">800 R$ = ฿290</Badge>
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur text-sm px-3 py-1">4,500 R$ = ฿1,290</Badge>
                  </div>
                  <Link href="/products?category=roblox">
                    <Button size="lg" className="bg-white text-red-600 hover:bg-white/90 font-bold gap-2 shadow-lg min-h-[48px]">
                      {locale === 'th' ? 'ดู Roblox ทั้งหมด' : 'Browse Roblox'}<ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-card py-12">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-6 sm:grid-cols-3">
              {[
                { from: 'from-blue-500', to: 'to-cyan-500', icon: Shield, title: locale === 'th' ? 'ระบบ Escrow' : 'Escrow System', desc: locale === 'th' ? 'กักเงินจนกว่าจะได้รับสินค้า' : 'Funds held until delivery', bg: 'from-blue-500/10 to-cyan-500/10' },
                { from: 'from-green-500', to: 'to-emerald-500', icon: Zap, title: locale === 'th' ? 'รวดเร็วทันใจ' : 'Fast Delivery', desc: locale === 'th' ? 'รับไอดีภายในไม่กี่นาที' : 'Get your ID in minutes', bg: 'from-green-500/10 to-emerald-500/10' },
                { from: 'from-purple-500', to: 'to-pink-500', icon: Clock, title: locale === 'th' ? 'ซัพพอร์ต 24/7' : '24/7 Support', desc: locale === 'th' ? 'ทีมงานพร้อมช่วยเหลือตลอด' : 'Always here to help', bg: 'from-purple-500/10 to-pink-500/10' },
              ].map((f, i) => (
                <Card key={i} className={`group overflow-hidden border-0 bg-gradient-to-br ${f.bg} shadow-none transition-all hover:shadow-lg`}>
                  <CardContent className="flex items-center gap-4 p-6">
                    <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${f.from} ${f.to} shadow-lg transition-transform group-hover:scale-110`}>
                      <f.icon className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{f.title}</h3>
                      <p className="text-sm text-muted-foreground">{f.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Hot Deals Ticker — FIX #3: เพิ่มความเร็ว 20s → 35s ให้อ่านทัน */}
        <section className="overflow-hidden border-y border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 dark:from-orange-950/20 dark:to-yellow-950/20 dark:border-orange-800/30 py-3">
          <div className="mx-auto max-w-7xl px-4 flex items-center gap-4">
            <div className="flex shrink-0 items-center gap-2 rounded-full bg-orange-500 px-3 py-1 text-xs font-bold text-white">
              <Flame className="h-3.5 w-3.5" />{locale === 'th' ? 'ขายดี' : 'HOT'}
            </div>
            <div className="flex gap-6 overflow-hidden">
              <div className="flex gap-8 whitespace-nowrap" style={{ animation: 'marquee 35s linear infinite' }}>
                {[...hotDeals, ...hotDeals].map((p, i) => (
                  <Link key={i} href={`/products/${p.id}`} className="flex items-center gap-2 text-sm hover:text-primary transition-colors">
                    <span className="font-medium text-foreground">{p.title.slice(0, 30)}{p.title.length > 30 ? '...' : ''}</span>
                    <span className="font-bold text-orange-600">{formatPrice(p.price, locale)}</span>
                    {p.originalPrice && <span className="text-xs text-muted-foreground line-through">{formatPrice(p.originalPrice, locale)}</span>}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground lg:text-3xl">{t.categories.all}</h2>
                <p className="mt-1 text-muted-foreground">{locale === 'th' ? 'เลือกหมวดหมู่เกมที่ต้องการ' : 'Browse by game category'}</p>
              </div>
              <Link href="/products"><Button variant="ghost" className="gap-1">{t.common.seeAll}<ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
              {Object.entries(categoryStats).map(([id, { count, label }]) => (
                <CategoryCard key={id} id={id} name={label} count={count} icon={categoryIcons[id]} gradient={categoryGradients[id]} />
              ))}
            </div>
          </div>
        </section>

        {/* Roblox Packages — FIX #5: Visual Hierarchy ชัดเจน ยอดนิยมเด่น, ปุ่มอื่น outline */}
        <section className="bg-gradient-to-b from-red-50 to-background dark:from-red-950/10 py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-700 text-2xl shadow-lg">🟥</div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground lg:text-3xl">Roblox</h2>
                  <p className="text-muted-foreground">{locale === 'th' ? 'Robux & บัญชีราคาถูก' : 'Robux & Accounts at best prices'}</p>
                </div>
              </div>
              <Link href="/products?category=roblox">
                <Button variant="outline" className="gap-1 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400">{t.common.seeAll}<ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>

            {/* FIX #5: Robux Package Cards */}
            <div className="mb-10 grid gap-4 grid-cols-2 lg:grid-cols-4">
              {robuxPackages.map((pkg, i) => (
                <div
                  key={i}
                  className={`relative rounded-2xl border-2 p-5 transition-all hover:-translate-y-1 hover:shadow-lg ${
                    pkg.popular
                      ? 'border-red-500 bg-red-50 dark:bg-red-950/20 shadow-md'
                      : 'border-border bg-card hover:border-red-200'
                  }`}
                >
                  {pkg.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white shadow">
                        🔥 {locale === 'th' ? 'ยอดนิยม' : 'Popular'}
                      </span>
                    </div>
                  )}
                  <p className="text-2xl font-extrabold text-foreground">{pkg.amount}</p>
                  <p className="text-xs text-muted-foreground mb-3">Robux</p>
                  {/* FIX #5: เพิ่มข้อมูล "ได้รับภายใน X นาที" + "ไม่ต้องรหัสผ่าน" */}
                  <div className="mb-4 space-y-1">
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <Clock3 className="h-3 w-3" />
                      {locale === 'th' ? `ได้รับภายใน ${pkg.deliveryMin} นาที` : `Delivered in ${pkg.deliveryMin} min`}
                    </div>
                    {pkg.noPassword && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {locale === 'th' ? '✓ ไม่ต้องรหัสผ่าน' : '✓ No password needed'}
                      </p>
                    )}
                  </div>
                  <div className="mb-4">
                    {pkg.oldPrice && (
                      <p className="text-xs text-muted-foreground line-through">{pkg.oldPrice}</p>
                    )}
                    <p className={`text-xl font-bold ${pkg.popular ? 'text-red-600' : 'text-foreground'}`}>
                      {pkg.price}
                    </p>
                  </div>
                  {/* FIX #5: ปุ่มยอดนิยม = สีเต็ม, ปุ่มอื่น = outline เพื่อให้ยอดนิยมเด่นที่สุด */}
                  <Link href={`/products?category=roblox`}>
                    <Button
                      className={`w-full min-h-[44px] font-bold ${
                        pkg.popular
                          ? 'bg-red-500 hover:bg-red-600 text-white'
                          : 'bg-transparent border border-border text-foreground hover:bg-muted'
                      }`}
                      variant={pkg.popular ? 'default' : 'outline'}
                    >
                      {locale === 'th' ? 'ซื้อเลย' : 'Buy Now'}
                    </Button>
                  </Link>
                </div>
              ))}
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {robloxItems.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section className="bg-muted/30 py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground lg:text-3xl">{t.home.featured}</h2>
                <p className="mt-1 text-muted-foreground">{locale === 'th' ? 'สินค้ายอดนิยมที่คัดสรรมาเพื่อคุณ' : 'Handpicked popular items for you'}</p>
              </div>
              <Link href="/products"><Button variant="ghost" className="gap-1">{t.common.seeAll}<ArrowRight className="h-4 w-4" /></Button></Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {featuredProducts.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>

        {/* Gacha — FIX #4 + #6 แก้ใน gacha-card.tsx แล้ว */}
        <section className="relative overflow-hidden py-12 lg:py-16">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5" />
          <div className="absolute left-0 top-0 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/2 translate-y-1/2 rounded-full bg-purple-500/10 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Sparkles className="h-8 w-8 text-yellow-500" />
                  <div className="absolute inset-0 animate-ping"><Sparkles className="h-8 w-8 text-yellow-500/50" /></div>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground lg:text-3xl">{t.home.gacha}</h2>
                  <p className="text-muted-foreground">{locale === 'th' ? 'ลุ้นรางวัลใหญ่ในราคาสุดคุ้ม!' : 'Win big prizes at amazing prices!'}</p>
                </div>
              </div>
              <Link href="/gacha">
                <Button variant="outline" className="gap-1 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground">{t.common.seeAll}<ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featuredGacha.map((pool) => <GachaCard key={pool.id} pool={pool} />)}
            </div>
          </div>
        </section>

        {/* Top Sellers */}
        <section className="bg-card py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 flex items-center gap-3">
              <Crown className="h-7 w-7 text-yellow-500" />
              <div>
                <h2 className="text-2xl font-bold text-foreground lg:text-3xl">{locale === 'th' ? 'ร้านค้าแนะนำ' : 'Top Sellers'}</h2>
                <p className="text-muted-foreground">{locale === 'th' ? 'ร้านค้ายืนยันตัวตน มีรีวิวดีเยี่ยม' : 'Verified sellers with excellent reviews'}</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { name: 'ร้าน TopSeller', games: 'ROV, Free Fire, Roblox', sales: '1,240', rating: 4.9, badge: locale === 'th' ? 'ยืนยันแล้ว' : 'Verified', color: 'from-blue-500 to-cyan-500' },
                { name: 'GameKing Shop', games: 'PUBG, Genshin, Roblox', sales: '870', rating: 4.8, badge: locale === 'th' ? 'ผู้ขายดีเด่น' : 'Top Seller', color: 'from-purple-500 to-pink-500' },
                { name: 'RobloxPro TH', games: 'Roblox Robux & Accounts', sales: '3,210', rating: 5.0, badge: locale === 'th' ? 'ผู้เชี่ยวชาญ Roblox' : 'Roblox Expert', color: 'from-red-500 to-orange-500' },
              ].map((seller, i) => (
                <Card key={i} className="group overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-4">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${seller.color} text-2xl font-bold text-white shadow-md`}>
                        {seller.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-foreground">{seller.name}</h3>
                          <Badge variant="secondary" className="text-xs">{seller.badge}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{seller.games}</p>
                        <div className="mt-1 flex items-center gap-3 text-sm">
                          <span className="flex items-center gap-1 text-yellow-500 font-semibold">
                            <Star className="h-3.5 w-3.5 fill-yellow-400" />{seller.rating}
                          </span>
                          <span className="text-muted-foreground">{seller.sales} {locale === 'th' ? 'ออเดอร์' : 'orders'}</span>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="py-12 lg:py-16">
          <div className="mx-auto max-w-7xl px-4">
            <div className="mb-8 text-center">
              <h2 className="text-2xl font-bold text-foreground lg:text-3xl">{locale === 'th' ? 'รีวิวจากลูกค้า' : 'Customer Reviews'}</h2>
              <p className="mt-1 text-muted-foreground">{locale === 'th' ? 'เสียงตอบรับจากผู้ใช้งานจริง' : 'Real feedback from our users'}</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.length === 0 && (
                <div className="col-span-3 text-center py-8 text-muted-foreground">ยังไม่มีรีวิว</div>
              )}
              {reviews.map((review) => (
                <Card key={review.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
                  <div className="absolute right-4 top-4 text-6xl font-bold text-primary/5">{`"`}</div>
                  <CardContent className="p-6">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                        {(review.buyer_name || '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{review.buyer_name || review.buyerName}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-muted-foreground">{review.comment}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Quick Banners */}
        <section className="py-6">
          <div className="mx-auto max-w-7xl px-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { href: '/products?category=roblox', from: 'from-red-500', to: 'to-rose-600', emoji: '🟥', cat: 'Roblox', title: locale === 'th' ? 'Robux ราคาถูก' : 'Cheap Robux', desc: locale === 'th' ? 'ส่งภายใน 5 นาที' : 'Delivered in 5 min' },
                { href: '/gacha', from: 'from-purple-500', to: 'to-violet-600', emoji: '✨', cat: 'Gacha', title: locale === 'th' ? 'สุ่มรับรางวัล' : 'Lucky Draw', desc: locale === 'th' ? 'ลุ้นไอเทม Legendary' : 'Win Legendary items' },
                { href: '/register', from: 'from-green-500', to: 'to-emerald-600', emoji: '🎁', cat: locale === 'th' ? 'สมัครใหม่' : 'New Member', title: locale === 'th' ? 'รับเครดิตฟรี ฿50' : 'Free ฿50 Credit', desc: locale === 'th' ? 'สมัครวันนี้เลย' : 'Sign up today' },
              ].map((b, i) => (
                <Link key={i} href={b.href} className="group">
                  {/* FIX Mobile: min-h เพื่อให้ปุ่มกดง่ายบนมือถือ */}
                  <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${b.from} ${b.to} p-5 text-white shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5 min-h-[100px]`}>
                    <div className="absolute -right-4 -top-4 text-7xl opacity-20">{b.emoji}</div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/70">{b.cat}</p>
                    <p className="mt-1 text-lg font-bold">{b.title}</p>
                    <p className="text-sm text-white/80">{b.desc}</p>
                    <ArrowRight className="mt-3 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="relative overflow-hidden bg-gradient-to-r from-primary via-blue-600 to-cyan-500 py-16 text-white">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzBoLTJ2LTJoMnYyem0wLTRoLTJ2LTJoMnYyem0tNCA0aC0ydi0yaDJ2MnoiLz48L2c+PC9nPjwvc3ZnPg==')" }} />
          <div className="relative mx-auto max-w-7xl px-4 text-center">
            <h2 className="text-3xl font-bold lg:text-4xl" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
              {locale === 'th' ? 'พร้อมเริ่มซื้อขายแล้วหรือยัง?' : 'Ready to Start Trading?'}
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/80">
              {locale === 'th'
                ? 'สมัครสมาชิกฟรีวันนี้ เริ่มซื้อขายไอดีเกมและไอเทมได้ทันที พร้อมรับโบนัสต้อนรับ!'
                : 'Sign up for free today and start trading game IDs and items instantly. Plus get a welcome bonus!'}
            </p>
            {/* FIX Mobile: ปุ่ม CTA section นี้ใช้สีส้ม-ทอง เด่นบน bg น้ำเงิน */}
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/register">
                <button className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-yellow-400 px-8 py-4 text-base font-bold text-black shadow-lg transition-all hover:scale-105 hover:shadow-orange-400/40 hover:shadow-xl active:scale-95 min-h-[52px]">
                  {t.nav.register}<ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/products">
                <Button size="lg" variant="outline" className="border-white/30 bg-transparent px-8 text-white hover:bg-white/10 min-h-[52px]">
                  {locale === 'th' ? 'ดูสินค้าทั้งหมด' : 'Browse Products'}
                </Button>
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
