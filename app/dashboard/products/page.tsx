'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Plus,
  Package,
  Eye,
  Edit,
  Trash2,
  MoreVertical,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { useAuthStore, useProductStore } from '@/lib/store'
import { useLocale, formatPrice, formatNumber, getRelativeTime } from '@/hooks/use-locale'

const statusConfig: Record<string, { icon: React.ReactNode; color: string }> = {
  available: { icon: <CheckCircle className="h-3 w-3" />, color: 'bg-green-100 text-green-700' },
  sold: { icon: <CheckCircle className="h-3 w-3" />, color: 'bg-blue-100 text-blue-700' },
  reserved: { icon: <Clock className="h-3 w-3" />, color: 'bg-yellow-100 text-yellow-700' },
  hidden: { icon: <XCircle className="h-3 w-3" />, color: 'bg-gray-100 text-gray-700' },
}

export default function MyProductsPage() {
  const { user } = useAuthStore()
  const { products, deleteProduct, updateProduct } = useProductStore()
  const { locale, t } = useLocale()

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)

  if (!user) return null

  // Only seller and admin can access this page
  if (user.role !== 'seller' && user.role !== 'admin') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '300px', gap: '16px', textAlign: 'center',
      }}>
        <Package style={{ width: '48px', height: '48px', color: '#94a3b8' }} />
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1f5f9', marginBottom: '8px' }}>
            {locale === 'th' ? 'คุณยังไม่ได้เป็นผู้ขาย' : 'You are not a seller yet'}
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>
            {locale === 'th' ? 'ไปที่ Settings เพื่อสมัครเป็นผู้ขาย' : 'Go to Settings to apply as a seller'}
          </p>
          <Link href="/profile">
            <Button>{locale === 'th' ? 'สมัครเป็นผู้ขาย' : 'Become a Seller'}</Button>
          </Link>
        </div>
      </div>
    )
  }

  const myProducts = products.filter((p) => p.sellerId === user.id)
  const availableProducts = myProducts.filter((p) => p.status === 'available')
  const soldProducts = myProducts.filter((p) => p.status === 'sold')
  const hiddenProducts = myProducts.filter((p) => p.status === 'hidden')

  const handleDelete = async () => {
    if (productToDelete) {
      await deleteProduct(productToDelete)
      toast.success(locale === 'th' ? 'ลบสินค้าแล้ว' : 'Product deleted')
      setProductToDelete(null)
      setDeleteDialogOpen(false)
    }
  }

  const handleToggleVisibility = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'hidden' ? 'available' : 'hidden'
    await updateProduct(productId, { status: newStatus })
    toast.success(
      locale === 'th'
        ? newStatus === 'hidden' ? 'ซ่อนสินค้าแล้ว' : 'แสดงสินค้าแล้ว'
        : newStatus === 'hidden' ? 'Product hidden' : 'Product visible'
    )
  }

  const ProductCard = ({ product }: { product: typeof myProducts[0] }) => {
    const statusInfo = statusConfig[product.status]

    return (
      <Card className="overflow-hidden">
        <div className="flex flex-col sm:flex-row">
          <div className="relative aspect-[4/3] w-full sm:aspect-square sm:w-32">
            <Image
              src={product.images[0] || '/placeholder.jpg'}
              alt={product.title}
              fill
              className="object-cover"
            />
          </div>
          <CardContent className="flex flex-1 flex-col p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <Badge className={`${statusInfo.color} flex items-center gap-1 text-xs`}>
                    {statusInfo.icon}
                    {t.status[product.status as keyof typeof t.status]}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {t.categories[product.category as keyof typeof t.categories]}
                  </Badge>
                </div>
                <Link
                  href={`/products/${product.id}`}
                  className="font-medium hover:text-primary line-clamp-2"
                >
                  {product.title}
                </Link>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/products/${product.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      {t.common.view}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/products/${product.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      {t.common.edit}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleToggleVisibility(product.id, product.status)}>
                    {product.status === 'hidden' ? (
                      <>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {locale === 'th' ? 'แสดงสินค้า' : 'Show Product'}
                      </>
                    ) : (
                      <>
                        <XCircle className="mr-2 h-4 w-4" />
                        {locale === 'th' ? 'ซ่อนสินค้า' : 'Hide Product'}
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      setProductToDelete(product.id)
                      setDeleteDialogOpen(true)
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {t.common.delete}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="mt-auto flex items-center justify-between pt-2">
              <div>
                <p className="text-lg font-bold text-primary">
                  {formatPrice(product.price, locale)}
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-3 w-3" />
                  <span>{formatNumber(product.views, locale)}</span>
                  <span>•</span>
                  <span>{getRelativeTime(product.createdAt, locale)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.nav.myProducts}</h1>
          <p className="text-muted-foreground">
            {locale === 'th'
              ? `${myProducts.length} สินค้าทั้งหมด`
              : `${myProducts.length} total products`}
          </p>
        </div>
        <Link href="/dashboard/products/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {locale === 'th' ? 'ลงขายสินค้า' : 'Add Product'}
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">
            {locale === 'th' ? 'ทั้งหมด' : 'All'} ({myProducts.length})
          </TabsTrigger>
          <TabsTrigger value="available">
            {t.status.available} ({availableProducts.length})
          </TabsTrigger>
          <TabsTrigger value="sold">
            {t.status.sold} ({soldProducts.length})
          </TabsTrigger>
          <TabsTrigger value="hidden">
            {t.status.hidden} ({hiddenProducts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          {myProducts.length > 0 ? (
            <div className="space-y-4">
              {myProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </TabsContent>

        <TabsContent value="available" className="mt-6">
          {availableProducts.length > 0 ? (
            <div className="space-y-4">
              {availableProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </TabsContent>

        <TabsContent value="sold" className="mt-6">
          {soldProducts.length > 0 ? (
            <div className="space-y-4">
              {soldProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </TabsContent>

        <TabsContent value="hidden" className="mt-6">
          {hiddenProducts.length > 0 ? (
            <div className="space-y-4">
              {hiddenProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === 'th' ? 'ยืนยันการลบสินค้า' : 'Confirm Delete'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === 'th'
                ? 'คุณแน่ใจหรือไม่ว่าต้องการลบสินค้านี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้'
                : 'Are you sure you want to delete this product? This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EmptyState() {
  const { locale } = useLocale()

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Package className="mb-4 h-12 w-12 text-muted-foreground/50" />
        <p className="text-muted-foreground">
          {locale === 'th' ? 'ไม่มีสินค้า' : 'No products'}
        </p>
        <Link href="/dashboard/products/new">
          <Button className="mt-4">
            <Plus className="mr-2 h-4 w-4" />
            {locale === 'th' ? 'ลงขายสินค้า' : 'Add Product'}
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
