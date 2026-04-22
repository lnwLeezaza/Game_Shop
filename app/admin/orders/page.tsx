'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAuthStore, useOrderStore } from '@/lib/store'
import { formatPrice } from '@/hooks/use-locale'
import { toast } from 'sonner'

export default function AdminOrdersPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { orders, fetchOrders, updateOrderStatus } = useOrderStore()

  useEffect(() => { if (!user || user.role !== 'admin') { router.push('/'); return }; fetchOrders() }, [user])

  const forceComplete = async (id: string) => { await updateOrderStatus(id, 'completed'); toast.success('Force complete สำเร็จ') }
  const refund = async (id: string) => { await updateOrderStatus(id, 'refunded'); toast.success('คืนเงินสำเร็จ') }

  const statusColors: Record<string, string> = { pending: 'secondary', paid: 'default', processing: 'secondary', completed: 'default', disputed: 'destructive', refunded: 'secondary', cancelled: 'secondary' }
  const statusTh: Record<string, string> = { pending: 'รอ', paid: 'ชำระแล้ว', processing: 'กำลังส่ง', completed: 'เสร็จ', disputed: 'พิพาท', refunded: 'คืนเงิน', cancelled: 'ยกเลิก' }

  return (
    <div style={{ padding: "24px" }}>
      <h1 style={{ fontSize: "22px", fontWeight: "800", color: "#f1f5f9", marginBottom: "24px" }}>จัดการออเดอร์ ({orders.length})</h1>
      <div className="space-y-3">
        {orders.map(o => (
          <div key={o.id} className="flex items-center gap-4 p-4 border rounded-xl bg-card">
            <img src={o.productImage || '/placeholder.jpg'} alt="" className="w-12 h-12 rounded-lg object-cover" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{o.productTitle}</p>
              <p className="text-xs text-muted-foreground">{o.buyerName} → {o.sellerName} · {formatPrice(o.amount)}</p>
            </div>
            <Badge variant={(statusColors[o.status] as 'default' | 'secondary' | 'destructive') || 'secondary'}>{statusTh[o.status]}</Badge>
            {['paid', 'processing', 'disputed'].includes(o.status) && (
              <div className="flex gap-1">
                <Button size="sm" className="bg-green-600 hover:bg-green-700 text-xs" onClick={() => forceComplete(o.id)}><CheckCircle className="w-3 h-3 mr-1" />Force</Button>
                <Button size="sm" variant="destructive" className="text-xs" onClick={() => refund(o.id)}><RefreshCw className="w-3 h-3 mr-1" />คืน</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
