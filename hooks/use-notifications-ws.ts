'use client'

import { useEffect } from 'react'
import { useNotificationStore } from '@/lib/store'
import type { Notification } from '@/lib/types'

export function useNotificationsWS(userId: string) {
  const { addNotification, fetchNotifications } = useNotificationStore()

  useEffect(() => {
    if (!userId) return

    const ws = new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:3001'}/ws?userId=${userId}`
    )

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'new_notification') {
          const notif: Notification = {
            id: data.id ?? `notif-${Date.now()}`,
            userId,
            type: data.notifType ?? 'payment',
            title: data.title,
            titleTh: data.titleTh ?? data.title,
            message: data.message,
            messageTh: data.messageTh ?? data.message,
            isRead: false,
            link: data.link,
            createdAt: new Date().toISOString(),
          }
          addNotification(notif)

          // Toast event
          window.dispatchEvent(new CustomEvent('push-toast', {
            detail: { title: notif.titleTh, message: notif.messageTh }
          }))
        }
      } catch {}
    }

    ws.onerror = () => ws.close()

    return () => ws.close()
  }, [userId])
}