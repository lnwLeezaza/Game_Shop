'use client'

import Link from 'next/link'
import { Eye, Tag, ShieldCheck, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Product } from '@/lib/types'
import { useLocale, formatPrice, formatNumber } from '@/hooks/use-locale'
import { cn } from '@/lib/utils'

interface ProductCardProps {
  product: Product
}

const categoryColors: Record<string, string> = {
  rov: 'bg-orange-500 text-white',
  freefire: 'bg-yellow-500 text-black',
  efootball: 'bg-green-500 text-white',
  pubg: 'bg-amber-600 text-white',
  genshin: 'bg-blue-500 text-white',
  roblox: 'bg-red-500 text-white',
  other: 'bg-gray-500 text-white',
}

const categoryGradients: Record<string, string> = {
  rov: 'from-orange-500/20 to-red-500/20',
  freefire: 'from-yellow-500/20 to-orange-500/20',
  efootball: 'from-green-500/20 to-emerald-500/20',
  pubg: 'from-amber-500/20 to-yellow-500/20',
  genshin: 'from-blue-500/20 to-purple-500/20',
  roblox: 'from-red-500/20 to-rose-500/20',
  other: 'from-gray-500/20 to-slate-500/20',
}

export function ProductCard({ product }: ProductCardProps) {
  const { locale, t } = useLocale()

  const categoryLabel = t.categories[product.category as keyof typeof t.categories] || product.category
  const typeLabel = t.productTypes[product.type as keyof typeof t.productTypes] || product.type
  const hasDiscount = product.originalPrice && product.originalPrice > product.price
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.price / product.originalPrice!) * 100) 
    : 0

  return (
    <Link href={`/products/item/${product.id}`}>
      <Card className={cn(
        "group h-full overflow-hidden border-0 shadow-md transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-2 hover:shadow-primary/10"
      )}>
        <div className="relative aspect-[4/3] overflow-hidden">
          {/* Gradient Overlay based on category */}
          <div className={cn(
            "absolute inset-0 bg-gradient-to-br opacity-60 transition-opacity group-hover:opacity-40",
            categoryGradients[product.category]
          )} />
          
          <img
            src={product.images[0] || '/placeholder.jpg'}
            alt={product.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
            crossOrigin="anonymous"
          />
          
          {/* Top badges */}
          <div className="absolute left-2 right-2 top-2 flex items-start justify-between">
            <div className="flex flex-col gap-1">
              {hasDiscount && (
                <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg">
                  -{discountPercent}%
                </Badge>
              )}
              {product.status === 'available' && (
                <Badge variant="secondary" className="bg-green-500/90 text-white backdrop-blur-sm">
                  <ShieldCheck className="mr-1 h-3 w-3" />
                  {locale === 'th' ? 'พร้อมขาย' : 'Available'}
                </Badge>
              )}
            </div>
            <Badge className={cn("shadow-lg", categoryColors[product.category])}>
              {categoryLabel}
            </Badge>
          </div>

          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
          
          {/* Views counter */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white backdrop-blur-sm">
            <Eye className="h-3 w-3" />
            <span>{formatNumber(product.views, locale)}</span>
          </div>
        </div>

        <CardContent className="relative p-4">
          {/* Type badge */}
          <Badge variant="outline" className="mb-2 border-primary/30 bg-primary/5 text-primary">
            <Tag className="mr-1 h-3 w-3" />
            {typeLabel}
          </Badge>

          {/* Title */}
          <h3 className="mb-3 line-clamp-2 text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-primary">
            {product.title}
          </h3>

          {/* Price section */}
          <div className="flex items-end justify-between">
            <div className="space-y-0.5">
              <span className="block text-xl font-bold text-primary">
                {formatPrice(product.price, locale)}
              </span>
              {hasDiscount && (
                <span className="block text-sm text-muted-foreground line-through">
                  {formatPrice(product.originalPrice!, locale)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="font-medium">4.9</span>
            </div>
          </div>

          {/* Seller info */}
          <div className="mt-3 flex items-center gap-2 border-t pt-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-primary to-blue-600 text-[10px] font-bold text-white">
              {product.sellerName.charAt(0)}
            </div>
            <span className="text-xs text-muted-foreground">
              {product.sellerName}
            </span>
            <ShieldCheck className="ml-auto h-4 w-4 text-green-500" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
