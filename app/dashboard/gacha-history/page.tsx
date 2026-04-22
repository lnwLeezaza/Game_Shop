'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Gift, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { useAuthStore, useGachaStore } from '@/lib/store'
import { useLocale, formatPrice } from '@/hooks/use-locale'
import { cn } from '@/lib/utils'

const rarityColors: Record<string, string> = {
  common: 'bg-gray-100 text-gray-800',
  rare: 'bg-blue-100 text-blue-800',
  epic: 'bg-purple-100 text-purple-800',
  legendary: 'bg-yellow-100 text-yellow-800',
}
const rarityTh: Record<string, string> = { common: 'ธรรมดา', rare: 'หายาก', epic: 'มหากาพย์', legendary: 'ตำนาน' }

export default function GachaHistoryPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { pulls, fetchPullHistory } = useGachaStore()
  const { locale } = useLocale()

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchPullHistory(user.id)
  }, [user])

  const userPulls = pulls.filter(p => p.userId === user?.id)
  const legendaryCount = userPulls.filter(p => p.item.rarity === 'legendary').length
  const totalValue = userPulls.reduce((s, p) => s + p.item.value, 0)

  if (!user) return null

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">{locale === 'th' ? 'ประวัติการสุ่ม' : 'Gacha History'}</h1>
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: locale === 'th' ? 'สุ่มทั้งหมด' : 'Total Pulls', value: userPulls.length },
          { label: locale === 'th' ? 'ตำนาน' : 'Legendary', value: legendaryCount },
          { label: locale === 'th' ? 'มูลค่ารวม' : 'Total Value', value: formatPrice(totalValue) },
        ].map((s, i) => (
          <div key={i} className="p-4 border rounded-xl text-center bg-card">
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      {userPulls.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{locale === 'th' ? 'ยังไม่มีประวัติการสุ่ม' : 'No gacha history yet'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {userPulls.map(pull => (
            <div key={pull.id} className={cn('flex items-center gap-3 p-3 rounded-xl border', pull.item.rarity === 'legendary' && 'border-yellow-300 bg-yellow-50/50')}>
              <img src={pull.item.image || '/placeholder.jpg'} alt={pull.item.nameTh} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="font-medium text-sm">{locale === 'th' ? pull.item.nameTh : pull.item.name}</p>
                <p className="text-xs text-muted-foreground">{formatPrice(pull.item.value)} · {new Date(pull.createdAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rarityColors[pull.item.rarity]}`}>
                {locale === 'th' ? rarityTh[pull.item.rarity] : pull.item.rarity}
              </span>
              {pull.item.rarity === 'legendary' && <Star className="w-4 h-4 text-yellow-500" />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
