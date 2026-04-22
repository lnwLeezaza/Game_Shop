'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Package,
  MessageCircle,
  Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useAuthStore, useOrderStore, useProductStore } from '@/lib/store'
import { useLocale, formatPrice, formatDate } from '@/hooks/use-locale'

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  pending: { icon: <Clock className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700' },
  paid: { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700' },
  processing: { icon: <Package className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700' },
  completed: { icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-100 text-green-700' },
  disputed: { icon: <AlertCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-700' },
  refunded: { icon: <XCircle className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700' },
  cancelled: { icon: <XCircle className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700' },
}

export default function OrdersPage() {
  const { user } = useAuthStore()
  const { orders, updateOrderStatus } = useOrderStore()
  const { updateProduct } = useProductStore()
  const { locale, t } = useLocale()

  const [activeTab, setActiveTab] = useState('all')

  if (!user) return null

  const userOrders = orders.filter(
    (o) => o.buyerId === user.id || o.sellerId === user.id
  )

  const buyOrders = userOrders.filter((o) => o.buyerId === user.id)
  const sellOrders = userOrders.filter((o) => o.sellerId === user.id)

  const filterOrders = (orderList: typeof userOrders, status?: string) => {
    if (!status || status === 'all') return orderList
    return orderList.filter((o) => o.status === status)
  }

  const handleConfirmReceived = async (orderId: string, productId: string) => {
    await updateOrderStatus(orderId, 'completed')
    await updateProduct(productId, { status: 'sold' })
    toast.success(locale === 'th' ? 'ยืนยันรับสินค้าเรียบร้อย' : 'Order confirmed successfully')
  }

  const handleReportProblem = async (orderId: string) => {
    await updateOrderStatus(orderId, 'disputed')
    toast.info(locale === 'th' ? 'แจ้งปัญหาเรียบร้อย ทีมงานจะติดต่อกลับ' : 'Problem reported. Our team will contact you.')
  }

  const OrderCard = ({ order, isSeller }: { order: typeof userOrders[0]; isSeller: boolean }) => {
    const statusInfo = statusConfig[order.status]

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-4">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={order.productImage || '/placeholder.jpg'}
                  alt={order.productTitle}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col">
                <Link
                  href={`/products/${order.productId}`}
                  className="font-medium hover:text-primary line-clamp-2"
                >
                  {order.productTitle}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {isSeller ? `${t.orders.buyer}: ${order.buyerName}` : `${t.orders.seller}: ${order.sellerName}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(order.createdAt, locale)}
                </p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-2">
              <Badge className={`${statusInfo.color} flex items-center gap-1`}>
                {statusInfo.icon}
                {t.status[order.status as keyof typeof t.status]}
              </Badge>
              <p className="text-lg font-bold">
                {formatPrice(isSeller ? order.sellerReceives : order.amount, locale)}
              </p>
              {isSeller && order.platformFee > 0 && (
                <p className="text-xs text-muted-foreground">
                  {locale === 'th' ? 'หลังหักค่าธรรมเนียม' : 'After fees'}
                </p>
              )}
            </div>
          </div>

          {/* Order Actions */}
          {!isSeller && order.status === 'processing' && (
            <div className="mt-4 flex gap-2 border-t pt-4">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="flex-1">{t.orders.confirmReceived}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.orders.confirmReceived}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {locale === 'th'
                        ? 'คุณได้รับสินค้าถูกต้องครบถ้วนแล้วใช่หรือไม่? หลังจากยืนยัน เงินจะถูกโอนให้ผู้ขาย'
                        : 'Have you received the product correctly? After confirming, the payment will be released to the seller.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleConfirmReceived(order.id, order.productId)}>
                      {t.common.confirm}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline">{t.orders.reportProblem}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t.orders.reportProblem}</AlertDialogTitle>
                    <AlertDialogDescription>
                      {locale === 'th'
                        ? 'หากมีปัญหากับสินค้า ทีมงานจะตรวจสอบและติดต่อกลับภายใน 24 ชั่วโมง'
                        : 'If there is a problem with the product, our team will investigate and contact you within 24 hours.'}
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => handleReportProblem(order.id)}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {locale === 'th' ? 'แจ้งปัญหา' : 'Report'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* Delivery Info for Buyer */}
          {!isSeller && order.deliveryInfo && order.status === 'processing' && (
            <div className="mt-4 rounded-lg bg-muted p-4">
              <p className="text-sm font-medium">{locale === 'th' ? 'ข้อมูลการส่งมอบ' : 'Delivery Info'}</p>
              <p className="mt-1 font-mono text-sm">{order.deliveryInfo}</p>
            </div>
          )}

          {/* Actions for Seller */}
          {isSeller && order.status === 'paid' && (
            <div className="mt-4 border-t pt-4">
              <p className="mb-2 text-sm text-muted-foreground">
                {locale === 'th'
                  ? 'กรุณาส่งข้อมูลสินค้าให้ผู้ซื้อ'
                  : 'Please send the product info to the buyer'}
              </p>
              <Button className="w-full">
                <MessageCircle className="mr-2 h-4 w-4" />
                {locale === 'th' ? 'ส่งข้อมูลสินค้า' : 'Send Product Info'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.orders.title}</h1>
        <p className="text-muted-foreground">
          {locale === 'th' ? 'จัดการคำสั่งซื้อของคุณ' : 'Manage your orders'}
        </p>
      </div>

      <Tabs defaultValue="buying" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="buying">
            {locale === 'th' ? 'การซื้อ' : 'Buying'} ({buyOrders.length})
          </TabsTrigger>
          <TabsTrigger value="selling">
            {locale === 'th' ? 'การขาย' : 'Selling'} ({sellOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buying" className="mt-6">
          {buyOrders.length > 0 ? (
            <div className="space-y-4">
              {buyOrders.map((order) => (
                <OrderCard key={order.id} order={order} isSeller={false} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {locale === 'th' ? 'ยังไม่มีคำสั่งซื้อ' : 'No orders yet'}
                </p>
                <Link href="/products">
                  <Button className="mt-4">{locale === 'th' ? 'ดูสินค้า' : 'Browse Products'}</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="selling" className="mt-6">
          {sellOrders.length > 0 ? (
            <div className="space-y-4">
              {sellOrders.map((order) => (
                <OrderCard key={order.id} order={order} isSeller={true} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  {locale === 'th' ? 'ยังไม่มีการขาย' : 'No sales yet'}
                </p>
                <Link href="/dashboard/products/new">
                  <Button className="mt-4">{locale === 'th' ? 'ลงขายสินค้า' : 'List a Product'}</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Escrow Info */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="rounded-full bg-blue-100 p-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-blue-900">
              {locale === 'th' ? 'ระบบ Escrow ปกป้องทุกธุรกรรม' : 'Escrow Protection'}
            </p>
            <p className="text-sm text-blue-700">
              {t.orders.escrowInfo}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
