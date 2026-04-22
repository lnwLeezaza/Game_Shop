'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { X, Plus, Upload, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuthStore, useProductStore } from '@/lib/store'
import { useLocale } from '@/hooks/use-locale'
import type { GameCategory, ProductType, ProductStatus } from '@/lib/types'

const categories: { id: GameCategory; label: string }[] = [
  { id: 'rov', label: 'ROV' },
  { id: 'freefire', label: 'Free Fire' },
  { id: 'efootball', label: 'eFootball' },
  { id: 'pubg', label: 'PUBG' },
  { id: 'genshin', label: 'Genshin Impact' },
  { id: 'other', label: 'Other' },
]

const productTypes: { id: ProductType; label: { th: string; en: string } }[] = [
  { id: 'account', label: { th: 'ไอดี/บัญชี', en: 'Account/ID' } },
  { id: 'item', label: { th: 'ไอเทม', en: 'Item' } },
  { id: 'topup', label: { th: 'เติมเงิน', en: 'Top-up' } },
  { id: 'skin', label: { th: 'สกิน', en: 'Skin' } },
]

export default function NewProductPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const { createProduct } = useProductStore()
  const { locale, t } = useLocale()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    originalPrice: '',
    category: '' as GameCategory,
    type: '' as ProductType,
    tags: [] as string[],
    newTag: '',
  })
  const [details, setDetails] = useState<{ key: string; value: string }[]>([
    { key: '', value: '' },
  ])

  if (!user) {
    router.push('/login')
    return null
  }

  if (user.role !== 'seller' && user.role !== 'admin') {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        minHeight: '300px', gap: '16px', textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px' }}>🔒</div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1f5f9', marginBottom: '8px' }}>
            {locale === 'th' ? 'ต้องมีสิทธิ์ผู้ขาย' : 'Seller Access Required'}
          </h2>
          <p style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '16px' }}>
            {locale === 'th' ? 'ไปที่ Settings/Profile เพื่อสมัครเป็นผู้ขาย' : 'Go to Settings/Profile to become a seller'}
          </p>
          <Link href="/profile">
            <Button>{locale === 'th' ? 'สมัครเป็นผู้ขาย' : 'Become a Seller'}</Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.title || !formData.description || !formData.price || !formData.category || !formData.type) {
      toast.error(t.errors.required)
      return
    }

    setIsSubmitting(true)

    try {
      const detailsObj: Record<string, string> = {}
      details.forEach((d) => {
        if (d.key && d.value) {
          detailsObj[d.key] = d.value
        }
      })

      await createProduct({
        sellerId: user.id,
        sellerName: user.displayName,
        title: formData.title,
        description: formData.description,
        price: parseInt(formData.price),
        originalPrice: formData.originalPrice ? parseInt(formData.originalPrice) : undefined,
        category: formData.category,
        type: formData.type,
        status: 'available' as ProductStatus,
        images: ['https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&h=300&fit=crop'],
        details: detailsObj,
        tags: formData.tags,
      })

      toast.success(locale === 'th' ? 'ลงขายสินค้าสำเร็จ' : 'Product listed successfully')
      router.push('/dashboard/products')
    } catch (error) {
      toast.error(t.errors.somethingWentWrong)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTag = () => {
    if (formData.newTag && !formData.tags.includes(formData.newTag)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.newTag.toLowerCase()],
        newTag: '',
      })
    }
  }

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tag),
    })
  }

  const addDetailRow = () => {
    setDetails([...details, { key: '', value: '' }])
  }

  const updateDetail = (index: number, field: 'key' | 'value', value: string) => {
    const newDetails = [...details]
    newDetails[index][field] = value
    setDetails(newDetails)
  }

  const removeDetail = (index: number) => {
    setDetails(details.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t.productForm.createProduct}</h1>
        <p className="text-muted-foreground">
          {locale === 'th' ? 'กรอกข้อมูลสินค้าที่ต้องการขาย' : 'Fill in the product details'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="space-y-6 lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'th' ? 'ข้อมูลหลัก' : 'Basic Info'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">{t.productForm.title} *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={locale === 'th' ? 'เช่น ไอดี ROV แรงค์ Conqueror' : 'e.g. ROV Account Conqueror Rank'}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t.productForm.description} *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder={locale === 'th' ? 'อธิบายรายละเอียดสินค้า...' : 'Describe your product...'}
                    rows={5}
                    required
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="category">{t.productForm.category} *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value as GameCategory })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={locale === 'th' ? 'เลือกหมวดหมู่' : 'Select category'} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">{t.productForm.type} *</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData({ ...formData, type: value as ProductType })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={locale === 'th' ? 'เลือกประเภท' : 'Select type'} />
                      </SelectTrigger>
                      <SelectContent>
                        {productTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>
                            {type.label[locale]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            <Card>
              <CardHeader>
                <CardTitle>{locale === 'th' ? 'รายละเอียดสินค้า' : 'Product Details'}</CardTitle>
                <CardDescription>
                  {locale === 'th' ? 'เพิ่มข้อมูลเฉพาะของสินค้า เช่น แรงค์, จำนวนเพชร ฯลฯ' : 'Add specific details like rank, gems, etc.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {details.map((detail, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder={locale === 'th' ? 'ชื่อ (เช่น แรงค์)' : 'Key (e.g. Rank)'}
                      value={detail.key}
                      onChange={(e) => updateDetail(index, 'key', e.target.value)}
                    />
                    <Input
                      placeholder={locale === 'th' ? 'ค่า (เช่น Conqueror)' : 'Value (e.g. Conqueror)'}
                      value={detail.value}
                      onChange={(e) => updateDetail(index, 'value', e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDetail(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addDetailRow} className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  {locale === 'th' ? 'เพิ่มรายละเอียด' : 'Add Detail'}
                </Button>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>{t.productForm.tags}</CardTitle>
                <CardDescription>
                  {locale === 'th' ? 'เพิ่มแท็กเพื่อให้ค้นหาได้ง่ายขึ้น' : 'Add tags to improve searchability'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder={locale === 'th' ? 'พิมพ์แท็ก...' : 'Enter tag...'}
                    value={formData.newTag}
                    onChange={(e) => setFormData({ ...formData, newTag: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                  />
                  <Button type="button" variant="outline" onClick={addTag}>
                    {locale === 'th' ? 'เพิ่ม' : 'Add'}
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price */}
            <Card>
              <CardHeader>
                <CardTitle>{t.common.price}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="price">{locale === 'th' ? 'ราคาขาย' : 'Sale Price'} *</Label>
                  <div className="relative">
                    <Input
                      id="price"
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0"
                      min={1}
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {t.common.baht}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="originalPrice">{locale === 'th' ? 'ราคาเดิม (ถ้ามี)' : 'Original Price (optional)'}</Label>
                  <div className="relative">
                    <Input
                      id="originalPrice"
                      type="number"
                      value={formData.originalPrice}
                      onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      placeholder="0"
                      min={1}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {t.common.baht}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {locale === 'th' ? 'ใส่ราคาเดิมถ้าต้องการแสดงส่วนลด' : 'Enter original price to show discount'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Images */}
            <Card>
              <CardHeader>
                <CardTitle>{t.productForm.images}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center">
                  <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {locale === 'th' ? 'ลากไฟล์มาวางหรือคลิกเพื่ออัพโหลด' : 'Drag and drop or click to upload'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG (max. 5MB)
                  </p>
                  <Button type="button" variant="outline" className="mt-4" size="sm">
                    {locale === 'th' ? 'เลือกไฟล์' : 'Select Files'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => router.back()}
              >
                {t.common.cancel}
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t.productForm.createProduct}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
