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
  tags: '', imageUrl: '', stockPool: 'none',
  isOnSale: false, isFeatured: false,
  popupEnabled: false, popupBadge: '', popupLabel: '', popupExpiresAt: '',
  // ── Highlights ──
  rank: '', heroCount: '', skinCount: '', highlight1: '', highlight2: '',
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
  const [stockPreview, setStockPreview] = useState<any[]>([])
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
      tags: p.tags.join(', '), imageUrl: '', stockPool: (p as any).stockPool || 'none',
      isOnSale:       (p as any).is_on_sale       ?? false,
      isFeatured: (p as any).is_featured ?? false,
      popupEnabled:   (p as any).popup_enabled     ?? false,
      popupBadge:     (p as any).popup_badge       ?? '',
      popupLabel:     (p as any).popup_label       ?? '',
      popupExpiresAt: (p as any).popup_expires_at
        ? (p as any).popup_expires_at.slice(0, 16)
        : '',
      // ── Highlights ──
      rank:       (p as any).details?.rank       ?? '',
      heroCount:  (p as any).details?.heroCount  ?? '',
      skinCount:  (p as any).details?.skinCount  ?? '',
      highlight1: (p as any).details?.highlight1 ?? '',
      highlight2: (p as any).details?.highlight2 ?? '',
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
        details: {
          rank:       form.rank       || null,
          heroCount:  form.heroCount  || null,
          skinCount:  form.skinCount  || null,
          highlight1: form.highlight1 || null,
          highlight2: form.highlight2 || null,
        },
        stockPool: form.stockPool,
        // ── sale fields ──
        is_on_sale: form.isOnSale,
        is_featured: form.isFeatured,
        discount_percent: form.originalPrice && Number(form.originalPrice) > Number(form.price)
          ? Math.round((1 - Number(form.price) / Number(form.originalPrice)) * 100)
          : null,
        // ── popup fields ──
        popup_enabled:    form.popupEnabled,
        popup_badge:      form.popupBadge      || null,
        popup_label:      form.popupLabel      || null,
        popup_expires_at: form.popupExpiresAt
          ? new Date(form.popupExpiresAt).toISOString()
          : null,
      }

      if (editProduct) {
        await updateProduct(editProduct.id, payload as any, imageFiles.length ? imageFiles : undefined)
      } else {
        await createProduct(payload as any, imageFiles.length ? imageFiles : undefined)
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

            {/* Stock Pool */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>📦 STOCK POOL (ดึง account อัตโนมัติจาก pool)</label>
              <select value={form.stockPool} onChange={async e => {
                const val = e.target.value
                setForm(f => ({ ...f, stockPool: val }))
                if (val !== 'none') {
                  try {
                    const { supabase } = await import('@/lib/supabase')
                    const { data } = await supabase.from('stock_items').select('id, account_id, account_password, note').eq('game_category', val).eq('status', 'available').order('created_at').limit(5)
                    setStockPreview(data || [])
                  } catch { setStockPreview([]) }
                } else { setStockPreview([]) }
              }} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="none">ไม่ใช้ stock pool</option>
                <option value="rov">⚔️ RoV Pool</option>
                <option value="freefire">🔥 Free Fire Pool</option>
                <option value="efootball">⚽ eFootball Pool</option>
                <option value="pubg">🎯 PUBG Pool</option>
                <option value="genshin">✨ Genshin Pool</option>
                <option value="roblox">🧱 Roblox Pool</option>
                <option value="other">🎮 Other Pool</option>
              </select>
              {stockPreview.length > 0 && (
                <div style={{ marginTop: '8px', background: '#070710', border: '1px solid #1a1a2e', borderRadius: '8px', padding: '10px' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '6px', fontFamily: 'monospace' }}>
                    📋 STOCK ที่พร้อมขาย ({stockPreview.length} รายการแรก)
                  </div>
                  {stockPreview.map((s: any, i: number) => (
                    <div key={s.id} style={{ display: 'flex', gap: '12px', padding: '6px 0', borderBottom: i < stockPreview.length - 1 ? '1px solid #1a1a2e' : 'none', fontSize: '12px', fontFamily: 'monospace' }}>
                      <span style={{ color: '#94a3b8', minWidth: '20px' }}>{i + 1}.</span>
                      <span style={{ color: '#f1f5f9' }}>ID: {s.account_id}</span>
                      <span style={{ color: '#64748b' }}>Pass: {s.account_password}</span>
                      {s.note && <span style={{ color: '#8b5cf6' }}>{s.note}</span>}
                    </div>
                  ))}
                </div>
              )}
              {form.stockPool !== 'none' && stockPreview.length === 0 && (
                <div style={{ marginTop: '8px', padding: '8px 12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', fontSize: '12px', color: '#f87171', fontFamily: 'monospace' }}>
                  ⚠️ ไม่มี stock ใน pool นี้ — กรุณาเพิ่ม stock ก่อนลงสินค้า
                </div>
              )}
            </div>

            {/* ── Sale / โปรโมชั่น ── */}
            <div style={{ gridColumn: '1 / -1', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: '10px', padding: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.isOnSale}
                  onChange={e => setForm(f => ({ ...f, isOnSale: e.target.checked }))}
                  style={{ width: 15, height: 15, accentColor: '#4ade80', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#4ade80', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                  🏷️ แสดงในหน้า "ลดราคา / โปรโมชั่น"
                </span>
              </label>
              {form.isOnSale && (
                <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                  {form.originalPrice && Number(form.originalPrice) > Number(form.price)
                    ? `✅ ลด ${Math.round((1 - Number(form.price) / Number(form.originalPrice)) * 100)}% จากราคาเดิม ฿${form.originalPrice}`
                    : '⚠️ ใส่ "ราคาเดิม" ด้วยเพื่อแสดง % ส่วนลด (ไม่บังคับ)'}
                </div>
              )}
            </div>
              {/* ── Featured / ปักหมุดหน้าแรก ── */}
              <div style={{ gridColumn: '1 / -1', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '10px', padding: '14px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.isFeatured}
                    onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))}
                    style={{ width: 15, height: 15, accentColor: '#8b5cf6', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#a78bfa', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                    📌 ปักหมุดแสดงในหน้าแรก (ซื้อ-ขายไอดี)
                  </span>
                </label>
                <div style={{ marginTop: '6px', fontSize: '11px', color: '#475569', fontFamily: 'monospace' }}>
                  💡 ไอดีที่ติ๊กจะแสดงในส่วน "ซื้อ-ขายไอดีเกม" หน้าแรกก่อนรายการอื่น
                </div>
              </div>
            {/* ── Popup Promotion ── */}
            <div style={{ gridColumn: '1 / -1', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: '10px', padding: '14px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: form.popupEnabled ? '12px' : 0 }}>
                <input
                  type="checkbox"
                  checked={form.popupEnabled}
                  onChange={e => setForm(f => ({ ...f, popupEnabled: e.target.checked }))}
                  style={{ width: 15, height: 15, accentColor: '#ef4444', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#f87171', fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                  🔥 แสดงใน POPUP โปรโมชั่นหน้าแรก
                </span>
              </label>
              {form.popupEnabled && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={labelStyle}>BADGE เช่น FLASH SALE</label>
                    <input
                      type="text"
                      value={form.popupBadge}
                      onChange={e => setForm(f => ({ ...f, popupBadge: e.target.value }))}
                      placeholder="FLASH SALE"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>ข้อความโปร เช่น ลด 30%!</label>
                    <input
                      type="text"
                      value={form.popupLabel}
                      onChange={e => setForm(f => ({ ...f, popupLabel: e.target.value }))}
                      placeholder="วันนี้เท่านั้น!"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>หมดเวลา (ไม่บังคับ)</label>
                    <input
                      type="datetime-local"
                      value={form.popupExpiresAt}
                      onChange={e => setForm(f => ({ ...f, popupExpiresAt: e.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* ── Highlights / จุดเด่น ── */}
            <div style={{ gridColumn: '1 / -1', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px', padding: '14px' }}>
              <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#fbbf24', fontFamily: 'monospace', marginBottom: '12px' }}>
                ⭐ จุดเด่นของไอดี (แสดงในการ์ด)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={labelStyle}>🏆 Rank / ระดับ</label>
                  <input type="text" value={form.rank}
                    onChange={e => setForm(f => ({ ...f, rank: e.target.value }))}
                    placeholder="เช่น Conqueror, Heroic, Diamond"
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>🎮 จำนวนฮีโร่ / ตัวละคร</label>
                  <input type="text" value={form.heroCount}
                    onChange={e => setForm(f => ({ ...f, heroCount: e.target.value }))}
                    placeholder="เช่น 80+ ตัว, ครบทุกตัว"
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>✨ จำนวนสกิน</label>
                  <input type="text" value={form.skinCount}
                    onChange={e => setForm(f => ({ ...f, skinCount: e.target.value }))}
                    placeholder="เช่น Legendary 5, Epic 12"
                    style={inputStyle} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={labelStyle}>💎 จุดเด่นพิเศษ 1</label>
                  <input type="text" value={form.highlight1}
                    onChange={e => setForm(f => ({ ...f, highlight1: e.target.value }))}
                    placeholder="เช่น พร้อมโอน, บัญชีเก่า 5 ปี"
                    style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>🔥 จุดเด่นพิเศษ 2</label>
                  <input type="text" value={form.highlight2}
                    onChange={e => setForm(f => ({ ...f, highlight2: e.target.value }))}
                    placeholder="เช่น ไม่เคยโดนแบน, อีเมลพร้อมส่ง"
                    style={inputStyle} />
                </div>
              </div>
            </div>

            {/* Tags */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>แท็กค้นหา (คั่น , )</label>
              <input type="text" value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                placeholder="เช่น rov, conqueror, legendary, hero-ครบ"
                style={inputStyle} />
              <div style={{ fontSize: '10px', color: '#475569', fontFamily: 'monospace', marginTop: '4px' }}>
                💡 ใส่ keyword สำหรับค้นหา แยกด้วยจุลภาค
              </div>
            </div>

            {/* Image Upload */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>รูปภาพสินค้า</label>

              <div style={{ marginBottom: '12px', padding: '8px 12px', background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '8px', fontSize: '11px', color: '#a78bfa', fontFamily: 'monospace' }}>
                🖼️ รูปที่ 1 = Logo เกม &nbsp;|&nbsp; 🎨 รูปที่ 2 = Background Header
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                {/* รูปที่ 1 — Logo */}
                <div>
                  <div style={{ fontSize: '10px', color: '#60a5fa', fontFamily: 'monospace', marginBottom: '6px', fontWeight: 'bold' }}>
                    🖼️ รูปที่ 1 — Logo เกม
                  </div>
                  <div
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = ev => {
                          setImagePreviews(prev => { const next = [...prev]; next[0] = ev.target?.result as string; return next })
                          setImageFiles(prev => { const next = [...prev]; next[0] = file; return next })
                        }
                        reader.readAsDataURL(file)
                      }
                      input.click()
                    }}
                    style={{
                      width: '100%', height: '100px', borderRadius: '10px', overflow: 'hidden',
                      border: `2px dashed ${imagePreviews[0] ? '#60a5fa' : '#2a2a3e'}`,
                      cursor: 'pointer', position: 'relative', background: '#070710',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {imagePreviews[0] ? (
                      <>
                        <img src={imagePreviews[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0 }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0'}>
                          <span style={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}>เปลี่ยนรูป</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#475569', fontSize: '11px', fontFamily: 'monospace' }}>
                        <Upload style={{ width: 24, height: 24, margin: '0 auto 4px' }} />
                        คลิกเพื่ออัพโหลด
                      </div>
                    )}
                  </div>
                  {imagePreviews[0] && (
                    <button type="button" onClick={() => {
                      setImagePreviews(prev => { const n = [...prev]; n[0] = ''; return n })
                      setImageFiles(prev => { const n = [...prev]; n[0] = undefined as any; return n })
                    }} style={{ marginTop: '4px', fontSize: '10px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace' }}>
                      ✕ ลบรูป
                    </button>
                  )}
                </div>

                {/* รูปที่ 2 — Background */}
                <div>
                  <div style={{ fontSize: '10px', color: '#a78bfa', fontFamily: 'monospace', marginBottom: '6px', fontWeight: 'bold' }}>
                    🎨 รูปที่ 2 — Background Header
                  </div>
                  <div
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'file'
                      input.accept = 'image/*'
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = ev => {
                          setImagePreviews(prev => { const next = [...prev]; next[1] = ev.target?.result as string; return next })
                          setImageFiles(prev => { const next = [...prev]; next[1] = file; return next })
                        }
                        reader.readAsDataURL(file)
                      }
                      input.click()
                    }}
                    style={{
                      width: '100%', height: '100px', borderRadius: '10px', overflow: 'hidden',
                      border: `2px dashed ${imagePreviews[1] ? '#a78bfa' : '#2a2a3e'}`,
                      cursor: 'pointer', position: 'relative', background: '#070710',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {imagePreviews[1] ? (
                      <>
                        <img src={imagePreviews[1]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0 }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '1'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '0'}>
                          <span style={{ color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}>เปลี่ยนรูป</span>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#475569', fontSize: '11px', fontFamily: 'monospace' }}>
                        <Upload style={{ width: 24, height: 24, margin: '0 auto 4px' }} />
                        คลิกเพื่ออัพโหลด
                      </div>
                    )}
                  </div>
                  {imagePreviews[1] && (
                    <button type="button" onClick={() => {
                      setImagePreviews(prev => { const n = [...prev]; n[1] = ''; return n })
                      setImageFiles(prev => { const n = [...prev]; n[1] = undefined as any; return n })
                    }} style={{ marginTop: '4px', fontSize: '10px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'monospace' }}>
                      ✕ ลบรูป
                    </button>
                  )}
                </div>
              </div>

              {/* URL input */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                  หรือใส่ URL (รูปที่ 1):
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
              <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px', display: 'flex', alignItems: 'center', gap: 6 }}>
                {product.sellerName} · {new Date(product.createdAt).toLocaleDateString('th-TH')}
                {(product as any).is_on_sale && (
                  <span style={{ fontSize: 9, fontWeight: 'bold', padding: '1px 6px', borderRadius: 999, background: 'rgba(74,222,128,0.15)', color: '#4ade80', border: '1px solid rgba(74,222,128,0.3)' }}>
                    🏷️ SALE
                  </span>
                )}
                {(product as any).popup_enabled && (
                  <span style={{ fontSize: 9, fontWeight: 'bold', padding: '1px 6px', borderRadius: 999, background: 'rgba(220,38,38,0.2)', color: '#f87171', border: '1px solid rgba(220,38,38,0.3)' }}>
                    🔥 POPUP
                  </span>
                )}
              </div>
            </div>
            {/* Category */}
            <div style={{ fontSize: '10px', color: '#a78bfa', fontFamily: 'monospace', padding: '3px 7px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '4px', display: 'inline-block', textAlign: 'center' }}>
              {product.category.toUpperCase()}
            </div>
            {/* Price */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: '13px', color: (product as any).is_on_sale ? '#ef4444' : '#fbbf24', fontFamily: 'monospace', fontWeight: 'bold' }}>
                {formatPrice(product.price, locale)}
              </span>
              {product.originalPrice && product.originalPrice > product.price && (
                <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', textDecoration: 'line-through' }}>
                  {formatPrice(product.originalPrice, locale)}
                </span>
              )}
              {(product as any).discount_percent && (
                <span style={{ fontSize: '9px', fontWeight: 'bold', color: '#fff', background: '#ef4444', padding: '1px 5px', borderRadius: 999, width: 'fit-content' }}>
                  -{(product as any).discount_percent}%
                </span>
              )}
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
