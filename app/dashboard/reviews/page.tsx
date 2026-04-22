'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Star, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { useLocale } from '@/hooks/use-locale'
import type { Review } from '@/lib/types'



function Stars({ rating }: { rating: number }) {
  return <div className="flex">{[1,2,3,4,5].map(i => <Star key={i} className={`w-4 h-4 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />)}</div>
}

export default function ReviewsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { locale } = useLocale()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    const loadReviews = async () => {
      setLoadingReviews(true)
      try {
        const { reviewAPI } = await import('@/lib/supabase')
        const data = await reviewAPI.getSellerReviews(user.id)
        setReviews(data)
      } catch { setReviews([]) }
      finally { setLoadingReviews(false) }
    }
    loadReviews()
  }, [user])

  const avg = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0.0'

  if (!user) return null

  return (
    <div className="p-6 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">{locale === 'th' ? 'รีวิวของฉัน' : 'My Reviews'}</h1>
      <div className="flex items-center gap-4 p-5 border rounded-xl bg-card mb-6">
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">{avg}</p>
          <Stars rating={Math.round(Number(avg))} />
          <p className="text-xs text-muted-foreground mt-1">{reviews.length} {locale === 'th' ? 'รีวิว' : 'reviews'}</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5,4,3,2,1].map(star => {
            const count = reviews.filter(r => r.rating === star).length
            const pct = reviews.length ? (count / reviews.length) * 100 : 0
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3">{star}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-4 text-muted-foreground">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
      {reviews.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{locale === 'th' ? 'ยังไม่มีรีวิว' : 'No reviews yet'}</p>
        </div>
      ) : reviews.map(r => (
        <div key={r.id} className="p-4 border rounded-xl mb-3 bg-card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold">{r.buyerName[0]}</div>
            <div>
              <p className="text-sm font-medium">{r.buyerName}</p>
              <Stars rating={r.rating} />
            </div>
            <p className="ml-auto text-xs text-muted-foreground">{new Date(r.createdAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')}</p>
          </div>
          {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
        </div>
      ))}
    </div>
  )
}
