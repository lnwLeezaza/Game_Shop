'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ShoppingCart, Zap, Star, TrendingDown, Shuffle, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { createClient } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'
// ---- Types ----
type Category = { id: string; name: string; slug: string; icon?: string }
type Product = {
  id: string
  name: string
  price: number
  original_price?: number
  image_url?: string
  category_id?: string
  is_featured?: boolean
  is_on_sale?: boolean
  discount_percent?: number
  categories?: { name: string; slug: string }
}

// ---- Static data (fallback / hardcoded categories) ----
const CATEGORY_ICONS: Record<string, string> = {
  rov: '',
  freefire: '',
  pubg: '',
  genshin: '',
  roblox: '',
  efootball: '',
  default: '',
}

const TOPUP_GAMES = [
  {
   id: 'rov',
    label: 'ROV',
    logo: '/gamespic/rov.png',  // ชื่อไฟล์ตรงกับที่วางไว้ใน /public/games/
    href: '/products?category=rov',
  },
  {
    id: 'freefire',
    label: 'Free Fire',
    logo: '/gamespic/freefire.jpg',  // ชื่อไฟล์ตรงกับที่วางไว้ใน /public/games/s
    href: '/products?category=freefire',
  },
  {
    id: 'pubg',
    label: 'PUBG Mobile',
    logo: 'https://play-lh.googleusercontent.com/JRd05pyBH41qjgsJuWduRJpDeZG0Hnb0yjf2nWqO7VaGKL10-G5UIygxED-WNOgHuA=w240-h240',
    color: 'from-yellow-500 to-amber-800',
    href: '/products?category=pubg',
  },
  {
    id: 'genshin',
    label: 'Genshin Impact',
    logo: 'https://play-lh.googleusercontent.com/3oRI-GQmCHqg0OaUycXbGc4R0YSfqBQEITmJRIHkM1lMBfS6QCRLvL5oZfGmpADiGA=w240-h240',
    color: 'from-indigo-500 to-purple-900',
    href: '/products?category=genshin',
  },
  {
    id: 'roblox',
    label: 'Roblox',
    logo: 'https://play-lh.googleusercontent.com/WRRspnAJ6EN_bLchMM_KBxZoSqNYYFj9dXmCpPq1HV8gsgJOEfFKIHbsOmz99nyxhA=w240-h240',
    color: 'from-gray-800 to-gray-950',
    href: '/roblox',
  },
  {
    id: 'efootball',
    label: 'eFootball',
    logo: 'https://play-lh.googleusercontent.com/haGRqJVBXiNGSyORv0UqbPbE3r9KoWmNSY0jDmSTaZmRZ5gF6yUNhUWVSw5DnHE2dA=w240-h240',
    color: 'from-blue-700 to-blue-950',
    href: '/products?category=efootball',
  },
]

// ---- Sub-components ----

function SectionHeader({
  icon,
  title,
  href,
}: {
  icon: React.ReactNode
  title: string
  href?: string
}) {
  return (
    <div className="flex items-center justify-between mb-5">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      </div>
      {href && (
        <Link href={href}>
          <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground hover:text-primary">
            ดูทั้งหมด <ChevronRight className="h-4 w-4" />
          </Button>
        </Link>
      )}
    </div>
  )
}

function ProductCard({ product }: { product: Product }) {
  const discount = product.discount_percent ?? (
    product.original_price && product.original_price > product.price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : null
  )

  return (
    <Link href={`/products/${product.id}`}>
      <div className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200">
        {/* Image */}
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {CATEGORY_ICONS[product.categories?.slug ?? 'default']}
            </div>
          )}
          {discount && (
            <Badge className="absolute top-2 left-2 bg-destructive text-white text-xs px-1.5 py-0.5">
              -{discount}%
            </Badge>
          )}
        </div>
        {/* Info */}
        <div className="p-3">
          <p className="text-sm font-medium line-clamp-2 mb-1">{product.name}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-primary">฿{product.price.toLocaleString()}</span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-xs text-muted-foreground line-through">฿{product.original_price.toLocaleString()}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-muted rounded w-3/4" />
        <div className="h-4 bg-muted rounded w-1/2" />
      </div>
    </div>
  )
}

// ---- Main Page ----

export default function HomePage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [saleProducts, setSaleProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {

        // Fetch categories
        const { data: cats } = await supabase
          .from('categories')
          .select('*')
          .order('name')

        if (cats) setCategories(cats)

        // Fetch sale / discounted products
        const { data: sale } = await supabase
          .from('products')
          .select('*, categories(name, slug)')
          .eq('is_on_sale', true)
          .order('discount_percent', { ascending: false })
          .limit(8)

        if (sale) setSaleProducts(sale)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-6 space-y-10">

        {/* ── Hero Banner ── */}
        <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary/90 via-blue-600/80 to-indigo-900 p-8 md:p-12 min-h-[220px] flex items-center">
          {/* BG decoration */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-4 right-10 text-[120px] leading-none select-none">🎮</div>
            <div className="absolute bottom-4 right-40 text-[60px] leading-none select-none">⚔️</div>
            <div className="absolute top-8 right-52 text-[50px] leading-none select-none">🔥</div>
          </div>
          <div className="relative z-10 max-w-lg">
            <Badge className="mb-3 bg-white/20 text-white border-0 text-xs">🎉 โปรโมชั่นพิเศษวันนี้</Badge>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white leading-tight mb-3">
              เติมเกม ซื้อไอเทม<br />ราคาถูกที่สุด!
            </h1>
            <p className="text-white/80 text-sm mb-5">
              เลือกซื้อเกมและไอเทมสุดคุ้ม พร้อมโปรโมชั่นทุกวัน
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/products">
                <Button className="bg-white text-primary hover:bg-white/90 font-semibold shadow-lg">
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  เลือกซื้อสินค้า
                </Button>
              </Link>
              <Link href="/gacha">
                <Button variant="outline" className="border-white/40 text-white hover:bg-white/10">
                  <Shuffle className="h-4 w-4 mr-2" />
                  ลองดวงตู้สุ่ม
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* ── เติมเกม / Top-up ── */}
        <section>
          <SectionHeader
            icon={<Zap className="h-5 w-5" />}
            title="เติมเกมยอดนิยม"
            href="/products"
          />
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {TOPUP_GAMES.map((game) => (
              <Link key={game.id} href={game.href}>
                <div className="group flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200 cursor-pointer">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${game.color} shadow-md group-hover:scale-110 transition-transform duration-200 flex items-center justify-center p-2 shrink-0`}>
                    <img
                      src={game.logo}
                      alt={game.label}
                      width={48}
                      height={48}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-center leading-tight w-full truncate px-1">{game.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── หมวดหมู่ (จาก DB) ── */}
        {categories.length > 0 && (
          <section>
            <SectionHeader
              icon={<Star className="h-5 w-5" />}
              title="หมวดหมู่สินค้า"
              href="/products"
            />
            <div className="flex flex-wrap gap-2">
              <Link href="/products">
                <Badge variant="outline" className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-white hover:border-primary transition-colors">
                  🎮 ทั้งหมด
                </Badge>
              </Link>
              {categories.map((cat) => (
                <Link key={cat.id} href={`/products?category=${cat.slug}`}>
                  <Badge variant="outline" className="px-4 py-2 text-sm cursor-pointer hover:bg-primary hover:text-white hover:border-primary transition-colors">
                    {CATEGORY_ICONS[cat.slug] ?? '🎮'} {cat.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── เกมลดราคา ── */}
        <section>
          <SectionHeader
            icon={<TrendingDown className="h-5 w-5" />}
            title="ลดราคา / โปรโมชั่น"
            href="/products?sale=true"
          />
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : saleProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {saleProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">
              <TrendingDown className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">ยังไม่มีสินค้าลดราคาในขณะนี้</p>
              <Link href="/products">
                <Button variant="ghost" size="sm" className="mt-2">ดูสินค้าทั้งหมด</Button>
              </Link>
            </div>
          )}
        </section>

        {/* ── Gacha Banner ── */}
        <section>
          <SectionHeader
            icon={<Shuffle className="h-5 w-5" />}
            title="ตู้สุ่มไอเทม"
          />
          <Link href="/gacha">
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-900 p-8 cursor-pointer group hover:shadow-xl hover:shadow-purple-500/20 transition-all duration-300">
              {/* Decorations */}
              <div className="absolute inset-0 opacity-15 text-[200px] leading-none text-right pr-4 pt-2 select-none pointer-events-none">
                🎲
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div>
                  <Badge className="mb-2 bg-white/20 text-white border-0">✨ ลองดวงวันนี้</Badge>
                  <h3 className="text-2xl font-extrabold text-white mb-1">ตู้สุ่มไอเทมสุดพิเศษ</h3>
                  <p className="text-white/70 text-sm">สุ่มรับไอเทมสุดหายาก ราคาเริ่มต้นแค่ไม่กี่บาท!</p>
                </div>
                <Button className="ml-auto bg-white text-purple-700 hover:bg-white/90 font-bold shadow-lg shrink-0 group-hover:scale-105 transition-transform">
                  <Shuffle className="h-4 w-4 mr-2" />
                  ลองเลย!
                </Button>
              </div>

              {/* Floating badges */}
              <div className="absolute top-4 right-4 flex flex-col gap-1.5">
                {['⭐ SSR', '🔮 SR', '💎 R'].map((label) => (
                  <Badge key={label} className="bg-white/15 text-white border-0 text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>
          </Link>
        </section>

        {/* ── Quick Links ── */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link href="/wallet">
            <div className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center text-2xl shrink-0">
                💳
              </div>
              <div>
                <p className="font-semibold text-sm">เติมเงินกระเป๋า</p>
                <p className="text-xs text-muted-foreground">เพิ่มเครดิตเพื่อซื้อสินค้า</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
          <Link href="/orders">
            <div className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-2xl shrink-0">
                📦
              </div>
              <div>
                <p className="font-semibold text-sm">ประวัติคำสั่งซื้อ</p>
                <p className="text-xs text-muted-foreground">ตรวจสอบสถานะออร์เดอร์</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
          <Link href="/profile">
            <div className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-md transition-all flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-2xl shrink-0">
                👤
              </div>
              <div>
                <p className="font-semibold text-sm">โปรไฟล์ของฉัน</p>
                <p className="text-xs text-muted-foreground">จัดการข้อมูลส่วนตัว</p>
              </div>
              <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </section>

      </div>
      </div>
      <Footer />
    </>
  )
}
