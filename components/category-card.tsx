'use client'

import Link from 'next/link'
import { Gamepad2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useLocale, formatNumber } from '@/hooks/use-locale'

interface CategoryCardProps {
  id: string
  name: string
  count: number
  icon?: React.ReactNode
  gradient: string
}

export function CategoryCard({ id, name, count, icon, gradient }: CategoryCardProps) {
  const { locale } = useLocale()

  return (
    <Link href={`/products/${id}`}>
      <Card className={`group h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 ${gradient}`}>
        <CardContent className="flex flex-col items-center justify-center p-6 text-center text-white">
          <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            {icon || <Gamepad2 className="h-7 w-7" />}
          </div>
          <h3 className="text-lg font-bold">{name}</h3>
          <p className="text-sm text-white/80">
            {formatNumber(count, locale)} {locale === 'th' ? 'รายการ' : 'items'}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

export const categoryGradients: Record<string, string> = {
  rov: 'bg-gradient-to-br from-orange-500 to-red-600',
  freefire: 'bg-gradient-to-br from-yellow-500 to-orange-600',
  efootball: 'bg-gradient-to-br from-green-500 to-emerald-600',
  pubg: 'bg-gradient-to-br from-amber-500 to-yellow-600',
  genshin: 'bg-gradient-to-br from-blue-500 to-indigo-600',
  roblox: 'bg-gradient-to-br from-red-500 to-rose-700',
  other: 'bg-gradient-to-br from-slate-500 to-gray-600',
}
