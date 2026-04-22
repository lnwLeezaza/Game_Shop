'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Package, CreditCard, Swords, Shield, Gift, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore, useNotificationStore } from '@/lib/store'
import { useLocale } from '@/hooks/use-locale'
import type { Notification } from '@/lib/types'
import { cn } from '@/lib/utils'

const typeIcon: Record<Notification['type'], React.ReactNode> = {
  order: <Package className="w-5 h-5 text-blue-500" />,
  payment: <CreditCard className="w-5 h-5 text-green-500" />,
  gacha: <Gift className="w-5 h-5 text-purple-500" />,
  system: <Shield className="w-5 h-5 text-gray-500" />,
  dispute: <Swords className="w-5 h-5 text-red-500" />,
}

export default function NotificationsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationStore()
  const { locale } = useLocale()

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchNotifications(user.id)
  }, [user])

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto max-w-2xl px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">{locale === 'th' ? 'การแจ้งเตือน' : 'Notifications'}</h1>
          {notifications.some(n => !n.isRead) && (
            <Button variant="ghost" size="sm" onClick={() => markAllAsRead(user.id)}>
              <CheckCheck className="w-4 h-4 mr-1" />
              {locale === 'th' ? 'อ่านทั้งหมด' : 'Mark all read'}
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>{locale === 'th' ? 'ไม่มีการแจ้งเตือน' : 'No notifications'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => markAsRead(n.id)}
                className={cn(
                  'flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors hover:bg-muted/50',
                  !n.isRead && 'bg-primary/5 border-primary/20'
                )}
              >
                <div className="mt-0.5">{typeIcon[n.type]}</div>
                <div className="flex-1 min-w-0">
                  <p className={cn('text-sm font-medium', !n.isRead && 'text-primary')}>
                    {locale === 'th' ? n.titleTh : n.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {locale === 'th' ? n.messageTh : n.message}
                  </p>
                  <p className="text-xs text-muted-foreground/60 mt-1">
                    {new Date(n.createdAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}
