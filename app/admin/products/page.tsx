'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Package, Search, Trash2, Eye, Check, X, Loader2, Edit2, Upload, ImageIcon, Tag, Star } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { useLocale, formatPrice } from '@/hooks/use-locale'
import { useProductStore, useAuthStore } from '@/lib/store'
import type { Product } from '@/lib/types'

const GAME_CATEGORIES = [
  { id: 'rov', label: 'ROV' },
  { id: 'freefire', label: 'Free Fire' },
  { id: 'efootball', label: 'eFootball' },
  { id: 'pubg', label: 'PUBG' },
  { id: 'genshin', label: 'Genshin Impact' },
  { id: 'roblox', label: 'Roblox' },
  { id: 'other', label: 'อื่นๆ / Other' },
]
const PRODUCT_TYPES = [
  { id: 'account', th: 'บัญชีเกม', en: 'Game Account' },
  { id: 'item', th: 'ไอเทม', en: 'Item' },
  { id: 'topup', th: 'เติมเงิน', en: 'Top-up' },
  { id: 'skin', th: 'สกิน', en: 'Skin' },
]
const STATUS_OPTIONS = ['available', 'hidden', 'sold', 'reserved']
const statusColors: Record<string, string> = {
  available: '#4ade80', sold: '#ef4444', reserved: '#fbbf24', hidden: '#64748b',
}

const EMPTY_FORM = {
  title: '', description: '', price: '', originalPrice: '',
  category: 'rov', type: 'account', status: 'available',
  tags: '', imageUrl: '',
}

export default function AdminProductsPage() {
  const { locale } = useLocale()
  const { user } = useAuthStore()
  const { products, fetchAllProducts, createProduct, updateProduct, deleteProduct, isLoading } = useProductStore()
  const th = locale === 'th'

  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchAllProducts() }, [])

  const openCreate = () => {
    setEditProduct(null)
    setForm({ ...EMPTY_FORM })
    setImageFiles([]); setImagePreviews([])
    setShowForm(true)
  }

  const openEdit = (p: Product) => {
    setEditProduct(p)
    setForm({
      title: p.title, description: p.description,
      price: String(p.price), originalPrice: String(p.originalPrice || ''),
      category: p.category, type: p.type, status: p.status,
      tags: p.tags.join(', '), imageUrl: '',
    })
    setImageFiles([]); setImagePreviews(p.images || [])
    setShowForm(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setImageFiles(prev => [...prev, ...files])
    files.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setImagePreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
  }

  const removePreview = (i: number) => {
    setImagePreviews(prev => prev.filter((_, idx) => idx !== i))
    setImageFiles(prev => prev.filter((_, idx) => idx !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.price || !form.description) {
      toast.error(th ? 'กรุณากรอกข้อมูลให้ครบ' : 'Please fill required fields')
      return
    }
    setIsSubmitting(true)
    try {
      const payload = {
        title: form.title, description: form.description,
        price: Number(form.price), originalPrice: form.originalPrice ? Number(form.originalPrice) : undefined,
        category: form.category as Product['category'],
        type: form.type as Product['type'],
        status: form.status as Product['status'],
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        images: editProduct
          ? imagePreviews.filter(p => p.startsWith('http'))
          : form.imageUrl ? [form.imageUrl] : [],
        sellerId: user!.id,
        sellerName: th ? 'ทีมงาน GameShop' : 'GameShop Official',
        details: {},
      }

      if (editProduct) {
        await updateProduct(editProduct.id, payload, imageFiles.length ? imageFiles : undefined)
        toast.success(th ? '✅ อัพเดตสินค้าแล้ว' : '✅ Product updated')
      } else {
        await createProduct(payload, imageFiles.length ? imageFiles : undefined)
        toast.success(th ? '✅ เพิ่มสินค้าแล้ว' : '✅ Product added')
      }
      setShowForm(false)
    } catch {
      toast.error(th ? 'เกิดข้อผิดพลาด' : 'Something went wrong')
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(th ? `ลบ "${title}" ใช่ไหม?` : `Delete "${title}"?`)) return
    await deleteProduct(id)
    toast.success(th ? 'ลบสินค้าแล้ว' : 'Product deleted')
  }

  const filtered = products.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.category.includes(search)
    const matchStatus = filterStatus === 'all' || p.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#f1f5f9', fontFamily: 'monospace' }}>
            {th ? '📦 จัดการสินค้า' : '📦 MANAGE PRODUCTS'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
            {th ? `ทั้งหมด ${products.length} รายการ` : `${products.length} total • Admin can edit everything`}
          </p>
        </div>
        <button onClick={openCreate} style={btnPrimary}>
          <Plus style={{ width: 15, height: 15 }} />
          {th ? 'เพิ่มสินค้าใหม่' : 'Add Product'}
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div style={{ marginBottom: '24px', background: '#0f0f1a', border: '1px solid rgba(139,92,246,0.35)', borderRadius: '14px', overflow: 'hidden', boxShadow: '0 0 32px rgba(139,92,246,0.1)' }}>
          <div style={{ background: '#070710', borderBottom: '1px solid #1a1a2e', padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#a78bfa', fontFamily: 'monospace' }}>
              {editProduct ? (th ? '// แก้ไขสินค้า' : '// EDIT_PRODUCT') : (th ? '// เพิ่มสินค้าใหม่ (Admin)' : '// ADD_NEW_PRODUCT (Admin)')}
            </span>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
              <X style={{ width: 18, height: 18 }} />
            </button>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Title */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{th ? 'ชื่อสินค้า *' : 'PRODUCT TITLE *'}</label>
              <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder={th ? 'เช่น ไอดี ROV Conqueror มีฮีโร่ครบ' : 'e.g. ROV Conqueror Full Hero Account'}
                style={inputStyle} required />
            </div>

            {/* Description */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{th ? 'คำอธิบาย *' : 'DESCRIPTION *'}</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={3} placeholder={th ? 'รายละเอียดสินค้า...' : 'Product details...'}
                style={{ ...inputStyle, resize: 'vertical' }} required />
            </div>

            {/* Price & Original Price */}
            <div>
              <label style={labelStyle}>{th ? 'ราคาขาย (บาท) *' : 'PRICE (THB) *'}</label>
              <input type="number" min="1" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                placeholder="0" style={inputStyle} required />
            </div>
            <div>
              <label style={labelStyle}>{th ? 'ราคาเดิม (ไม่บังคับ)' : 'ORIGINAL PRICE (optional)'}</label>
              <input type="number" min="1" value={form.originalPrice} onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))}
                placeholder={th ? 'ราคาก่อนลด' : 'Before discount'} style={inputStyle} />
            </div>

            {/* Category & Type */}
            <div>
              <label style={labelStyle}>{th ? 'หมวดหมู่' : 'CATEGORY'}</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {GAME_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>{th ? 'ประเภท' : 'TYPE'}</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {PRODUCT_TYPES.map(t => <option key={t.id} value={t.id}>{th ? t.th : t.en}</option>)}
              </select>
            </div>

            {/* Status */}
            <div>
              <label style={labelStyle}>{th ? 'สถานะ' : 'STATUS'}</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={{ ...inputStyle, cursor: 'pointer' }}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Tags */}
            <div>
              <label style={labelStyle}>{th ? 'แท็ก (คั่น , )' : 'TAGS (comma separated)'}</label>
              <input type="text" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder={th ? 'เช่น rov, conqueror, rank' : 'e.g. rov, conqueror, rank'} style={inputStyle} />
            </div>

            {/* Image Upload */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>{th ? 'รูปภาพสินค้า' : 'PRODUCT IMAGES'}</label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '10px' }}>
                {imagePreviews.map((src, i) => (
                  <div key={i} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #2a2a3e', flexShrink: 0 }}>
                    <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removePreview(i)} style={{
                      position: 'absolute', top: 2, right: 2, width: 18, height: 18,
                      background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '50%',
                      color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <X style={{ width: 10, height: 10 }} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => fileInputRef.current?.click()} style={{
                  width: '80px', height: '80px', borderRadius: '8px', flexShrink: 0,
                  background: '#070710', border: '2px dashed #2a2a3e', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
                  color: '#94a3b8', fontSize: '10px', fontFamily: 'monospace',
                }}>
                  <Upload style={{ width: 20, height: 20 }} />
                  {th ? 'อัพโหลด' : 'Upload'}
                </button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageChange} style={{ display: 'none' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace' }}>
                  {th ? 'หรือใส่ URL รูปภาพ:' : 'or paste image URL:'}
                </span>
                <input type="url" value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                  placeholder="https://..." style={{ ...inputStyle, flex: 1, padding: '6px 10px', fontSize: '12px' }} />
              </div>
            </div>

            {/* Submit */}
            <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowForm(false)} style={btnSecondary}>
                {th ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button type="submit" disabled={isSubmitting} style={{ ...btnPrimary, opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting
                  ? <><Loader2 style={{ width: 14, height: 14 }} />{th ? 'กำลังบันทึก...' : 'Saving...'}</>
                  : <><Check style={{ width: 14, height: 14 }} />{editProduct ? (th ? 'บันทึกการแก้ไข' : 'Save Changes') : (th ? 'เพิ่มสินค้า' : 'Add Product')}</>
                }
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative' }}>
          <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#94a3b8' }} />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={th ? 'ค้นหาสินค้า...' : 'Search products...'}
            style={{ ...inputStyle, paddingLeft: '32px', width: '240px' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: '140px', cursor: 'pointer' }}>
          <option value="all">{th ? 'ทุกสถานะ' : 'All Status'}</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div style={{ marginLeft: 'auto', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', alignSelf: 'center' }}>
          {filtered.length} {th ? 'รายการ' : 'results'}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '12px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ background: '#070710', borderBottom: '1px solid #1a1a2e', padding: '10px 16px', display: 'grid', gridTemplateColumns: '48px 1fr 90px 80px 90px 100px', gap: '10px', alignItems: 'center' }}>
          {['', 'สินค้า', 'หมวด', 'ราคา', 'สถานะ', 'Action'].map(h => (
            <div key={h} style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.08em' }}>{h.toUpperCase()}</div>
          ))}
        </div>

        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ width: 32, height: 32, border: '3px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', fontFamily: 'monospace', fontSize: '13px' }}>
            {th ? '// ไม่พบสินค้า' : '// NO_PRODUCTS_FOUND'}
          </div>
        ) : filtered.map(product => (
          <div key={product.id} style={{
            display: 'grid', gridTemplateColumns: '48px 1fr 90px 80px 90px 100px',
            gap: '10px', padding: '10px 16px', borderBottom: '1px solid #0d0d1a',
            alignItems: 'center', transition: 'background 0.1s',
          }}>
            {/* Image */}
            <div style={{ width: '40px', height: '40px', borderRadius: '6px', overflow: 'hidden', background: '#1a1a2e', flexShrink: 0 }}>
              {product.images?.[0]
                ? <img src={product.images[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon style={{ width: 16, height: 16, color: '#2a2a3e' }} /></div>
              }
            </div>
            {/* Title */}
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '13px', color: '#f1f5f9', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {product.title}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>
                {product.sellerName} · {new Date(product.createdAt).toLocaleDateString('th-TH')}
              </div>
            </div>
            {/* Category */}
            <div style={{ fontSize: '10px', color: '#a78bfa', fontFamily: 'monospace', padding: '3px 7px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '4px', display: 'inline-block', textAlign: 'center' }}>
              {product.category.toUpperCase()}
            </div>
            {/* Price */}
            <div style={{ fontSize: '13px', color: '#fbbf24', fontFamily: 'monospace', fontWeight: 'bold' }}>
              {formatPrice(product.price, locale)}
            </div>
            {/* Status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColors[product.status] || '#64748b', flexShrink: 0, boxShadow: `0 0 6px ${statusColors[product.status] || '#64748b'}` }} />
              <span style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{product.status}</span>
            </div>
            {/* Actions */}
            <div style={{ display: 'flex', gap: '5px' }}>
              <Link href={`/products/${product.id}`} target="_blank">
                <button style={{ padding: '5px 8px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '5px', cursor: 'pointer', color: '#60a5fa' }}>
                  <Eye style={{ width: 12, height: 12 }} />
                </button>
              </Link>
              <button onClick={() => openEdit(product)} style={{ padding: '5px 8px', background: '#1a1a2e', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '5px', cursor: 'pointer', color: '#fbbf24' }}>
                <Edit2 style={{ width: 12, height: 12 }} />
              </button>
              <button onClick={() => handleDelete(product.id, product.title)} style={{ padding: '5px 8px', background: '#1a1a2e', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '5px', cursor: 'pointer', color: '#f87171' }}>
                <Trash2 style={{ width: 12, height: 12 }} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '10px', color: '#64748b',
  fontFamily: 'monospace', marginBottom: '5px', letterSpacing: '0.06em',
}
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', boxSizing: 'border-box',
  background: '#070710', border: '1px solid #1a1a2e',
  borderRadius: '8px', color: '#f1f5f9', fontSize: '13px',
  fontFamily: 'monospace', outline: 'none',
}
const btnPrimary: React.CSSProperties = {
  padding: '10px 18px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
  border: 'none', borderRadius: '8px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '7px',
  fontSize: '13px', fontWeight: 'bold', color: 'white', fontFamily: 'monospace',
  boxShadow: '0 0 16px rgba(139,92,246,0.3)',
}
const btnSecondary: React.CSSProperties = {
  padding: '10px 18px', background: '#1a1a2e', border: '1px solid #2a2a3e',
  borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
  color: '#64748b', fontFamily: 'monospace',
}
