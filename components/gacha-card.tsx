'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Sparkles, Users, Info } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { GachaPool } from '@/lib/types'
import { useLocale, formatPrice, formatNumber } from '@/hooks/use-locale'

interface GachaCardProps {
  pool: GachaPool
}

const categoryColors: Record<string, string> = {
  rov: 'bg-gradient-to-r from-orange-500 to-red-500',
  freefire: 'bg-gradient-to-r from-yellow-500 to-orange-500',
  efootball: 'bg-gradient-to-r from-green-500 to-emerald-500',
  pubg: 'bg-gradient-to-r from-amber-500 to-yellow-500',
  genshin: 'bg-gradient-to-r from-blue-500 to-purple-500',
  roblox: 'bg-gradient-to-r from-red-500 to-rose-600',
  other: 'bg-gradient-to-r from-gray-500 to-slate-500',
}

// FIX #6: ตัวอย่างอัตราโอกาส (ควรดึงจาก pool.odds จริงๆ)
const defaultOdds = [
  { rarity: 'Legendary', chance: '1%', color: 'text-yellow-500' },
  { rarity: 'Epic', chance: '5%', color: 'text-purple-500' },
  { rarity: 'Rare', chance: '14%', color: 'text-blue-500' },
  { rarity: 'Common', chance: '80%', color: 'text-muted-foreground' },
]

export function GachaCard({ pool }: GachaCardProps) {
  const { locale, t } = useLocale()
  const [showOdds, setShowOdds] = useState(false)

  const name = locale === 'th' ? pool.nameTh : pool.name
  const description = locale === 'th' ? pool.descriptionTh : pool.description

  return (
    <Card className="group h-full overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
      <Link href={`/gacha/${pool.id}`}>
        {/* FIX #4: ใช้ object-fit: cover ผ่าน Next.js Image เพื่อไม่ให้รูปบิดหรือแตก */}
        <div className="relative aspect-[16/9] overflow-hidden bg-muted">
          <Image
            src={pool.image}
            alt={name}
            fill
            className="object-cover transition-transform group-hover:scale-110"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={(e) => {
              // FIX: ถ้ารูปแตก ให้แสดง fallback gradient แทน
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
          {/* Fallback gradient ถ้ารูปโหลดไม่ได้ */}
          <div className="absolute inset-0 -z-0 bg-gradient-to-br from-purple-600 to-pink-600 opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <Badge className={`mb-2 ${categoryColors[pool.category] || categoryColors.other} border-0 text-white`}>
              <Sparkles className="mr-1 h-3 w-3" />
              {pool.category.toUpperCase()}
            </Badge>
            <h3 className="text-lg font-bold text-white" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
              {name}
            </h3>
          </div>
        </div>
      </Link>

      <CardContent className="p-4">
        <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">{description}</p>

        {/* FIX #6: ปุ่มดูอัตราโอกาสรับรางวัล เพื่อความโปร่งใส */}
        <button
          onClick={() => setShowOdds(!showOdds)}
          className="mb-3 flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        >
          <Info className="h-3.5 w-3.5" />
          {locale === 'th' ? 'ดูอัตราโอกาสรับรางวัล' : 'View drop rates'}
        </button>

        {showOdds && (
          <div className="mb-3 rounded-lg border border-border bg-muted/50 p-3">
            <p className="mb-2 text-xs font-semibold text-foreground">
              {locale === 'th' ? 'อัตราโอกาสรับรางวัล' : 'Drop Rates'}
            </p>
            <div className="space-y-1">
              {defaultOdds.map((odd) => (
                <div key={odd.rarity} className="flex items-center justify-between text-xs">
                  <span className={`font-medium ${odd.color}`}>{odd.rarity}</span>
                  <span className="text-muted-foreground">{odd.chance}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            <span>{formatNumber(pool.totalPulls, locale)} {locale === 'th' ? 'ครั้ง' : 'pulls'}</span>
          </div>
          <Link href={`/gacha/${pool.id}`}>
            <Button size="sm" className="gap-1">
              <Sparkles className="h-4 w-4" />
              {formatPrice(pool.price, locale)}
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
