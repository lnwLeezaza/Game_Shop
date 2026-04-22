'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/product-card'
import { useLocale, formatPrice } from '@/hooks/use-locale'
import { useProductStore } from '@/lib/store'
import type { GameCategory, ProductType } from '@/lib/types'

const categories: { id: GameCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'rov', label: 'ROV' },
  { id: 'freefire', label: 'Free Fire' },
  { id: 'efootball', label: 'eFootball' },
  { id: 'pubg', label: 'PUBG' },
  { id: 'genshin', label: 'Genshin' },
  { id: 'roblox', label: 'Roblox' },
  { id: 'other', label: 'Other' },
]

const productTypes: { id: ProductType | 'all'; label: { th: string; en: string } }[] = [
  { id: 'all', label: { th: 'ทั้งหมด', en: 'All' } },
  { id: 'account', label: { th: 'ไอดี/บัญชี', en: 'Account' } },
  { id: 'item', label: { th: 'ไอเทม', en: 'Item' } },
  { id: 'topup', label: { th: 'เติมเงิน', en: 'Top-up' } },
  { id: 'skin', label: { th: 'สกิน', en: 'Skin' } },
]

const sortOptions = [
  { id: 'newest', label: { th: 'ใหม่ล่าสุด', en: 'Newest' } },
  { id: 'price_asc', label: { th: 'ราคา: ต่ำ - สูง', en: 'Price: Low to High' } },
  { id: 'price_desc', label: { th: 'ราคา: สูง - ต่ำ', en: 'Price: High to Low' } },
  { id: 'popular', label: { th: 'ยอดนิยม', en: 'Popular' } },
]

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const initialCategory = searchParams.get('category') as GameCategory | null
  
  const { locale, t } = useLocale()
  const { products, fetchProducts } = useProductStore()
  
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<GameCategory | 'all'>(initialCategory || 'all')
  const [type, setType] = useState<ProductType | 'all'>('all')
  const [sortBy, setSortBy] = useState('newest')
  const [priceRange, setPriceRange] = useState([0, 50000])
  const [filterOpen, setFilterOpen] = useState(false)

  // Fetch products on mount and sync URL category param
  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    setCategory(initialCategory || 'all')
  }, [initialCategory])

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.status === 'available')

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase()
      result = result.filter(
        p =>
          p.title.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    // Category filter
    if (category !== 'all') {
      result = result.filter(p => p.category === category)
    }

    // Type filter
    if (type !== 'all') {
      result = result.filter(p => p.type === type)
    }

    // Price filter
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])

    // Sort
    switch (sortBy) {
      case 'price_asc':
        result.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        result.sort((a, b) => b.price - a.price)
        break
      case 'popular':
        result.sort((a, b) => b.views - a.views)
        break
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return result
  }, [products, search, category, type, sortBy, priceRange])

  const activeFiltersCount = [
    category !== 'all',
    type !== 'all',
    priceRange[0] > 0 || priceRange[1] < 50000,
  ].filter(Boolean).length

  const clearFilters = () => {
    setCategory('all')
    setType('all')
    setPriceRange([0, 50000])
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Category */}
      <div className="space-y-3">
        <Label>{locale === 'th' ? 'หมวดหมู่' : 'Category'}</Label>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant={category === cat.id ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setCategory(cat.id)}
            >
              {cat.id === 'all' ? t.categories.all : cat.label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Type */}
      <div className="space-y-3">
        <Label>{locale === 'th' ? 'ประเภท' : 'Type'}</Label>
        <div className="flex flex-wrap gap-2">
          {productTypes.map((pt) => (
            <Badge
              key={pt.id}
              variant={type === pt.id ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setType(pt.id)}
            >
              {pt.label[locale]}
            </Badge>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t.common.price}</Label>
          <span className="text-sm text-muted-foreground">
            {formatPrice(priceRange[0], locale)} - {formatPrice(priceRange[1], locale)}
          </span>
        </div>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={0}
          max={50000}
          step={500}
          className="py-4"
        />
      </div>

      {activeFiltersCount > 0 && (
        <Button variant="outline" className="w-full" onClick={clearFilters}>
          <X className="mr-2 h-4 w-4" />
          {locale === 'th' ? 'ล้างตัวกรอง' : 'Clear Filters'}
        </Button>
      )}
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">{t.nav.products}</h1>
            <p className="mt-2 text-muted-foreground">
              {locale === 'th'
                ? `พบ ${filteredProducts.length} รายการ`
                : `${filteredProducts.length} products found`}
            </p>
          </div>

          {/* Search and Filters Bar */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={`${t.common.search}...`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((opt) => (
                    <SelectItem key={opt.id} value={opt.id}>
                      {opt.label[locale]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Mobile Filter Button */}
              <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2 lg:hidden">
                    <SlidersHorizontal className="h-4 w-4" />
                    {t.common.filter}
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>{t.common.filter}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6">
                    <FilterContent />
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar Filters */}
            <aside className="hidden w-64 shrink-0 lg:block">
              <div className="sticky top-24 rounded-lg border border-border bg-card p-6">
                <h3 className="mb-4 font-semibold">{t.common.filter}</h3>
                <FilterContent />
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {filteredProducts.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="mb-4 rounded-full bg-muted p-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold">{t.common.noResults}</h3>
                  <p className="mt-2 text-muted-foreground">
                    {locale === 'th'
                      ? 'ลองปรับตัวกรองหรือค้นหาด้วยคำอื่น'
                      : 'Try adjusting filters or search terms'}
                  </p>
                  <Button variant="outline" className="mt-4" onClick={clearFilters}>
                    {locale === 'th' ? 'ล้างตัวกรอง' : 'Clear Filters'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
