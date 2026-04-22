'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Eye,
  ShoppingCart,
  Shield,
  Star,
  MessageCircle,
  Share2,
  Heart,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
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
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/product-card'
import { useLocale, formatPrice, formatDate, formatNumber } from '@/hooks/use-locale'
import { useProductStore, useOrderStore, useAuthStore } from '@/lib/store'
import type { Review } from '@/lib/types'

const categoryColors: Record<string, string> = {
  rov: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  freefire: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  efootball: 'bg-green-500/10 text-green-600 border-green-500/20',
  pubg: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  genshin: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  other: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const router = useRouter()
  const { locale, t } = useLocale()
  const { user } = useAuthStore()
  const { getProduct, products } = useProductStore()
  const { createOrder } = useOrderStore()

  const product = getProduct(id)
  const [sellerReviews, setSellerReviews] = useState<Review[]>([])

  const avgRating =
    sellerReviews.length > 0
      ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length
      : 0

  // Fetch seller reviews from Supabase
  useEffect(() => {
    if (!product?.sellerId) return
    const load = async () => {
      try {
        const { reviewAPI } = await import('@/lib/supabase')
        const data = await reviewAPI.getSellerReviews(product.sellerId)
        setSellerReviews(data)
      } catch { setSellerReviews([]) }
    }
    load()
  }, [product?.sellerId])

  const relatedProducts = products
    .filter((p) => p.category === product?.category && p.id !== id && p.status === 'available')
    .slice(0, 4)

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold">
              {locale === 'th' ? 'ไม่พบสินค้า' : 'Product Not Found'}
            </h1>
            <Link href="/products">
              <Button className="mt-4">{t.common.back}</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  const handleBuy = async () => {
    if (!user) {
      router.push('/login')
      return
    }

    if (user.balance < product.price) {
      toast.error(t.errors.insufficientBalance)
      return
    }

    const order = await createOrder(product.id, user.id)
    if (order) {
      toast.success(locale === 'th' ? 'สั่งซื้อสำเร็จ!' : 'Order placed successfully!')
      router.push(`/orders/${order.id}`)
    } else {
      toast.error(t.errors.somethingWentWrong)
    }
  }

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-8">
          {/* Breadcrumb */}
          <div className="mb-6">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t.common.back}
            </Button>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                <Image
                  src={product.images[0] || '/placeholder.jpg'}
                  alt={product.title}
                  fill
                  className="object-cover"
                  priority
                />
                {discount > 0 && (
                  <Badge className="absolute left-4 top-4 bg-destructive text-destructive-foreground">
                    -{discount}%
                  </Badge>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.slice(1).map((img, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square overflow-hidden rounded-md bg-muted"
                    >
                      <Image src={img} alt="" fill className="object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className={categoryColors[product.category]}>
                    {t.categories[product.category as keyof typeof t.categories]}
                  </Badge>
                  <Badge variant="secondary">
                    {t.productTypes[product.type as keyof typeof t.productTypes]}
                  </Badge>
                </div>
                <h1 className="text-2xl font-bold lg:text-3xl">{product.title}</h1>
                <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {formatNumber(product.views, locale)} {locale === 'th' ? 'ครั้ง' : 'views'}
                  </span>
                  <span>{formatDate(product.createdAt, locale)}</span>
                </div>
              </div>

              {/* Price */}
              <div className="rounded-lg bg-muted/50 p-4">
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-primary">
                    {formatPrice(product.price, locale)}
                  </span>
                  {product.originalPrice && product.originalPrice > product.price && (
                    <span className="text-lg text-muted-foreground line-through">
                      {formatPrice(product.originalPrice, locale)}
                    </span>
                  )}
                </div>
                {user && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {locale === 'th' ? 'ยอดเงินของคุณ:' : 'Your balance:'}{' '}
                    <span className={user.balance >= product.price ? 'text-green-600' : 'text-destructive'}>
                      {formatPrice(user.balance, locale)}
                    </span>
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                {product.status === 'available' ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button size="lg" className="flex-1 gap-2">
                        <ShoppingCart className="h-5 w-5" />
                        {t.common.buyNow}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          {locale === 'th' ? 'ยืนยันการซื้อ' : 'Confirm Purchase'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {locale === 'th'
                            ? `คุณต้องการซื้อ "${product.title}" ในราคา ${formatPrice(product.price, locale)} ใช่หรือไม่?`
                            : `Do you want to purchase "${product.title}" for ${formatPrice(product.price, locale)}?`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleBuy}>
                          {t.common.confirm}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button size="lg" className="flex-1" disabled>
                    {t.status[product.status as keyof typeof t.status]}
                  </Button>
                )}
                <Button size="lg" variant="outline">
                  <Heart className="h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

              {/* Escrow Notice */}
              <div className="flex items-start gap-3 rounded-lg border border-green-500/20 bg-green-500/5 p-4">
                <Shield className="mt-0.5 h-5 w-5 text-green-600" />
                <div className="text-sm">
                  <p className="font-medium text-green-700">
                    {locale === 'th' ? 'ระบบ Escrow ปกป้องคุณ' : 'Escrow Protection'}
                  </p>
                  <p className="text-green-600/80">
                    {locale === 'th'
                      ? 'เงินจะถูกกักไว้จนกว่าคุณจะยืนยันรับสินค้า'
                      : 'Your payment is held until you confirm receipt'}
                  </p>
                </div>
              </div>

              {/* Seller Info */}
              {seller && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      {locale === 'th' ? 'ข้อมูลผู้ขาย' : 'Seller Info'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={undefined} />
                          <AvatarFallback>{product?.sellerName?.charAt(0) || "?"}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{product?.sellerName}</p>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span>{avgRating.toFixed(1)}</span>
                            <span>({sellerReviews.length} {locale === 'th' ? 'รีวิว' : 'reviews'})</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        {locale === 'th' ? 'แชท' : 'Chat'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Description & Details */}
          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              <Card>
                <CardHeader>
                  <CardTitle>{locale === 'th' ? 'รายละเอียด' : 'Description'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap text-muted-foreground">
                    {product.description}
                  </p>
                </CardContent>
              </Card>

              {/* Reviews */}
              <Card>
                <CardHeader>
                  <CardTitle>{t.reviews.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {sellerReviews.length > 0 ? (
                    <div className="space-y-4">
                      {sellerReviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-0 last:pb-0">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={review.buyerAvatar} />
                              <AvatarFallback>{review.buyerName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{review.buyerName}</p>
                              <div className="flex items-center gap-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < review.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>
                          <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground">{t.reviews.noReviews}</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Product Details Sidebar */}
            <div>
              <Card className="sticky top-24">
                <CardHeader>
                  <CardTitle>{locale === 'th' ? 'รายละเอียดสินค้า' : 'Product Details'}</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="space-y-3">
                    {Object.entries(product.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <dt className="text-muted-foreground">{key}</dt>
                        <dd className="font-medium">{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {product.tags.length > 0 && (
                    <>
                      <Separator className="my-4" />
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16">
              <h2 className="mb-6 text-2xl font-bold">
                {locale === 'th' ? 'สินค้าที่เกี่ยวข้อง' : 'Related Products'}
              </h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
