'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Package, CheckCircle, AlertTriangle, ChevronRight, Truck, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore, useOrderStore } from '@/lib/store'
import { useLocale, formatPrice } from '@/hooks/use-locale'
import type { Order } from '@/lib/types'
import { toast } from 'sonner'

const statusColors: Record<Order['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-blue-100 text-blue-800',
  processing: 'bg-purple-100 text-purple-800',
  completed: 'bg-green-100 text-green-800',
  disputed: 'bg-red-100 text-red-800',
  refunded: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<Order['status'], { th: string; en: string }> = {
  pending: { th: 'รอดำเนินการ', en: 'Pending' },
  paid: { th: 'ชำระแล้ว', en: 'Paid' },
  processing: { th: 'กำลังดำเนินการ', en: 'Processing' },
  completed: { th: 'เสร็จสิ้น', en: 'Completed' },
  disputed: { th: 'มีข้อพิพาท', en: 'Disputed' },
  refunded: { th: 'คืนเงินแล้ว', en: 'Refunded' },
  cancelled: { th: 'ยกเลิก', en: 'Cancelled' },
}

export default function OrdersPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { orders, fetchOrders, updateOrderStatus } = useOrderStore()
  const { locale } = useLocale()

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showDelivery, setShowDelivery] = useState(false)
  const [showDispute, setShowDispute] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deliveryInfo, setDeliveryInfo] = useState('')
  const [disputeReason, setDisputeReason] = useState('')

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchOrders(user.id)
  }, [user])

  const buyerOrders = orders.filter(o => o.buyerId === user?.id)
  const sellerOrders = orders.filter(o => o.sellerId === user?.id)

  const handleConfirmReceive = async () => {
    if (!selectedOrder) return
    await updateOrderStatus(selectedOrder.id, 'completed')
    toast.success(locale === 'th' ? 'ยืนยันรับสินค้าสำเร็จ' : 'Order confirmed')
    setShowConfirm(false)
  }

  const handleDispute = async () => {
    if (!selectedOrder || !disputeReason.trim()) return
    await updateOrderStatus(selectedOrder.id, 'disputed')
    toast.error(locale === 'th' ? 'แจ้งปัญหาสำเร็จ ทีมงานจะติดต่อกลับ' : 'Dispute filed. Team will contact you.')
    setShowDispute(false)
    setDisputeReason('')
  }

  const handleSendDelivery = async () => {
    if (!selectedOrder || !deliveryInfo.trim()) return
    await updateOrderStatus(selectedOrder.id, 'processing', deliveryInfo)
    toast.success(locale === 'th' ? 'ส่งข้อมูลสินค้าสำเร็จ' : 'Delivery info sent')
    setShowDelivery(false)
    setDeliveryInfo('')
  }

  const OrderCard = ({ order, isSeller }: { order: Order; isSeller: boolean }) => (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <img src={order.productImage || '/placeholder.jpg'} alt={order.productTitle} className="w-16 h-16 rounded-lg object-cover" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{order.productTitle}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isSeller ? (locale === 'th' ? 'ผู้ซื้อ: ' : 'Buyer: ') + order.buyerName : (locale === 'th' ? 'ร้าน: ' : 'Shop: ') + order.sellerName}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[order.status]}`}>
                {locale === 'th' ? statusLabels[order.status].th : statusLabels[order.status].en}
              </span>
              <span className="text-sm font-semibold text-primary">{formatPrice(order.amount)}</span>
            </div>
          </div>
        </div>

        {/* Buyer Actions */}
        {!isSeller && order.status === 'processing' && (
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="flex-1" onClick={() => { setSelectedOrder(order); setShowConfirm(true) }}>
              <CheckCircle className="w-4 h-4 mr-1" /> {locale === 'th' ? 'ยืนยันรับ' : 'Confirm'}
            </Button>
            <Button size="sm" variant="destructive" className="flex-1" onClick={() => { setSelectedOrder(order); setShowDispute(true) }}>
              <AlertTriangle className="w-4 h-4 mr-1" /> {locale === 'th' ? 'แจ้งปัญหา' : 'Dispute'}
            </Button>
          </div>
        )}

        {/* Delivery Info shown to buyer */}
        {!isSeller && order.deliveryInfo && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg text-sm">
            <p className="font-medium text-green-800 mb-1">{locale === 'th' ? 'ข้อมูลสินค้า:' : 'Delivery Info:'}</p>
            <p className="text-green-700 whitespace-pre-wrap">{order.deliveryInfo}</p>
          </div>
        )}

        {/* Seller Actions */}
        {isSeller && order.status === 'paid' && (
          <Button size="sm" className="w-full mt-3" onClick={() => { setSelectedOrder(order); setShowDelivery(true) }}>
            <Truck className="w-4 h-4 mr-1" /> {locale === 'th' ? 'ส่งข้อมูลสินค้า' : 'Send Delivery Info'}
          </Button>
        )}

        <p className="text-xs text-muted-foreground mt-2">
          {new Date(order.createdAt).toLocaleDateString(locale === 'th' ? 'th-TH' : 'en-US')}
        </p>
      </CardContent>
    </Card>
  )

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold mb-4">{locale === 'th' ? 'คำสั่งซื้อ' : 'Orders'}</h1>

        <Tabs defaultValue="buying">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="buying" className="flex-1">{locale === 'th' ? 'ซื้อ' : 'Buying'} ({buyerOrders.length})</TabsTrigger>
            {(user.role === 'seller' || user.role === 'admin') && (
              <TabsTrigger value="selling" className="flex-1">{locale === 'th' ? 'ขาย' : 'Selling'} ({sellerOrders.length})</TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="buying">
            {buyerOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{locale === 'th' ? 'ยังไม่มีคำสั่งซื้อ' : 'No orders yet'}</p>
              </div>
            ) : buyerOrders.map(o => <OrderCard key={o.id} order={o} isSeller={false} />)}
          </TabsContent>

          <TabsContent value="selling">
            {sellerOrders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>{locale === 'th' ? 'ยังไม่มีคำสั่งซื้อ' : 'No orders yet'}</p>
              </div>
            ) : sellerOrders.map(o => <OrderCard key={o.id} order={o} isSeller={true} />)}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />

      {/* Confirm Receive Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locale === 'th' ? 'ยืนยันรับสินค้า' : 'Confirm Receipt'}</DialogTitle>
            <DialogDescription>{locale === 'th' ? 'คุณได้รับสินค้าครบถ้วนแล้วใช่ไหม? เงินจะถูกปล่อยให้ผู้ขายทันที' : 'Confirm you received the item? Funds will be released to seller.'}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>{locale === 'th' ? 'ยกเลิก' : 'Cancel'}</Button>
            <Button className="flex-1" onClick={handleConfirmReceive}>{locale === 'th' ? 'ยืนยัน' : 'Confirm'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dispute Dialog */}
      <Dialog open={showDispute} onOpenChange={setShowDispute}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locale === 'th' ? 'แจ้งปัญหา' : 'Report Issue'}</DialogTitle>
          </DialogHeader>
          <Textarea placeholder={locale === 'th' ? 'อธิบายปัญหาที่พบ...' : 'Describe the issue...'} value={disputeReason} onChange={e => setDisputeReason(e.target.value)} rows={4} />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowDispute(false)}>{locale === 'th' ? 'ยกเลิก' : 'Cancel'}</Button>
            <Button variant="destructive" className="flex-1" onClick={handleDispute}>{locale === 'th' ? 'ส่งรายงาน' : 'Submit'}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delivery Info Dialog (Seller) */}
      <Dialog open={showDelivery} onOpenChange={setShowDelivery}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{locale === 'th' ? 'ส่งข้อมูลสินค้า' : 'Send Delivery Info'}</DialogTitle>
            <DialogDescription>{locale === 'th' ? 'ระบุข้อมูล เช่น ID, Password, Voucher Code' : 'Enter account info, codes, or any details'}</DialogDescription>
          </DialogHeader>
          <Textarea placeholder={locale === 'th' ? 'เช่น Email: xxx@gmail.com\nPassword: xxxx1234' : 'e.g. Email: xxx@gmail.com\nPassword: xxxx1234'} value={deliveryInfo} onChange={e => setDeliveryInfo(e.target.value)} rows={5} />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowDelivery(false)}>{locale === 'th' ? 'ยกเลิก' : 'Cancel'}</Button>
            <Button className="flex-1" onClick={handleSendDelivery}>{locale === 'th' ? 'ส่งข้อมูล' : 'Send'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
