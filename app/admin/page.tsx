'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, Trash2, Edit2, Eye, EyeOff, RefreshCw, X, Save,
  Copy, BarChart2, Star, Clock, Package, Percent, DollarSign,
  Image, Info, ArrowUp, ArrowDown, Search, ChevronRight, AlertTriangle,
  Upload, ImageIcon,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

// ─── Types ────────────────────────────────────────────────────────────
type Rarity = 'common' | 'rare' | 'epic' | 'legendary'

interface GachaItem {
  id?: string
  pool_id?: string
  name: string
  name_th: string
  rarity: Rarity
  drop_rate: number
  guaranteed_rate: number
  image: string
  value: number
  stock: number | null
  delivered: number
  is_active: boolean
  sort_order: number
}

interface PityRule {
  every_n_pulls: number
  min_rarity: Rarity
  reset_on_win: boolean
}

interface GachaPool {
  id: string
  name: string
  name_th: string
  description: string
  description_th: string
  category: string
  price: number
  image: string
  is_active: boolean
  total_pulls: number
  max_pulls_per_user: number | null
  max_pulls_per_day: number | null
  pity_rules: PityRule[]
  featured: boolean
  sort_order: number
  start_at: string | null
  end_at: string | null
  created_at: string
  gacha_items?: GachaItem[]
}

interface PullLog {
  id: string
  user_id: string
  pool_id: string
  item_id: string
  created_at: string
  pity_count_at_pull?: number
  user_email?: string
  item_name?: string
  item_rarity?: string
  pool_name?: string
}

// ─── Constants ─────────────────────────────────────────────────────────
const RARITY: Record<Rarity, { label: string; color: string; dot: string }> = {
  common:    { label: 'Common',    color: '#6b7280', dot: '#9ca3af' },
  rare:      { label: 'Rare',      color: '#3b82f6', dot: '#60a5fa' },
  epic:      { label: 'Epic',      color: '#8b5cf6', dot: '#a78bfa' },
  legendary: { label: 'Legendary', color: '#f59e0b', dot: '#fbbf24' },
}

const RARITIES: Rarity[] = ['common', 'rare', 'epic', 'legendary']
const CATEGORIES = ['rov', 'freefire', 'mlbb', 'pubg', 'pes', 'genshin', 'other']

const EMPTY_POOL = {
  name: '', name_th: '', description: '', description_th: '',
  category: 'rov', price: 100, image: '',
  is_active: true, max_pulls_per_user: null, max_pulls_per_day: null,
  pity_rules: [], featured: false, sort_order: 0, start_at: null, end_at: null,
}

const EMPTY_ITEM: Omit<GachaItem, 'id' | 'pool_id'> = {
  name: '', name_th: '', rarity: 'common', drop_rate: 0,
  guaranteed_rate: 0, image: '🎁', value: 0,
  stock: null, delivered: 0, is_active: true, sort_order: 0,
}

// ─── Helpers ───────────────────────────────────────────────────────────
const sumRates = (items: GachaItem[]) =>
  items.filter(i => i.is_active).reduce((s, i) => s + Number(i.drop_rate || 0), 0)

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
    reader.readAsDataURL(file)
  })
}

const isImgSrc = (v?: string) =>
  !!v && (v.startsWith('data:') || v.startsWith('http') || v.startsWith('/'))

// ─── Shared styles ─────────────────────────────────────────────────────
const s = {
  input: {
    width: '100%',
    background: 'transparent',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#111827',
    fontSize: '13px',
    boxSizing: 'border-box' as const,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
  } as React.CSSProperties,
  label: {
    display: 'block',
    fontSize: '11px',
    fontWeight: 600,
    color: '#9ca3af',
    marginBottom: '4px',
    letterSpacing: '0.05em',
    textTransform: 'uppercase' as const,
  } as React.CSSProperties,
  btn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 14px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid #e5e7eb',
    background: '#fff',
    color: '#374151',
    fontFamily: 'inherit',
    transition: 'all 0.15s',
  } as React.CSSProperties,
}

// ─── ImageUploadField ──────────────────────────────────────────────────
// ใช้ในทั้ง Pool modal และ Item modal
// รองรับ: อัปโหลดไฟล์จากเครื่อง | วาง URL | พิมพ์ emoji
function ImageUploadField({
  value,
  onChange,
  label = 'ไอคอน',
  placeholder = '🎮 หรือ https://...',
  previewSize = 44,
}: {
  value: string
  onChange: (v: string) => void
  label?: string
  placeholder?: string
  previewSize?: number
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [hoverPreview, setHoverPreview] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('รองรับเฉพาะไฟล์รูปภาพ'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('ไฟล์ใหญ่เกิน 5 MB'); return }
    try {
      const dataUrl = await readFileAsDataURL(file)
      onChange(dataUrl)
      toast.success('อัปโหลดรูปสำเร็จ')
    } catch { toast.error('อ่านไฟล์ไม่สำเร็จ') }
    e.target.value = ''
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>

        {/* Preview / click-to-upload */}
        <div
          onMouseEnter={() => setHoverPreview(true)}
          onMouseLeave={() => setHoverPreview(false)}
          onClick={() => fileRef.current?.click()}
          title="คลิกเพื่ออัปโหลดรูปจากเครื่อง"
          style={{
            width: previewSize, height: previewSize, borderRadius: '10px',
            background: '#f3f4f6', border: `1.5px dashed ${hoverPreview ? '#6366f1' : '#e5e7eb'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: previewSize * 0.5, flexShrink: 0, overflow: 'hidden',
            cursor: 'pointer', position: 'relative', transition: 'border-color 0.15s',
          }}
        >
          {isImgSrc(value)
            ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
            : (value || <ImageIcon size={previewSize * 0.35} color="#d1d5db" />)
          }
          {hoverPreview && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(99,102,241,0.75)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              borderRadius: '8px',
            }}>
              <Upload size={previewSize * 0.3} color="#fff" />
              {previewSize >= 44 && <span style={{ fontSize: 9, color: '#fff', fontWeight: 700, letterSpacing: '0.03em' }}>อัปโหลด</span>}
            </div>
          )}
        </div>

        {/* Text input (URL / emoji) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <label style={s.label}>{label}</label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              style={{ ...s.input, flex: 1 }}
              value={value}
              onChange={e => onChange(e.target.value)}
              placeholder={placeholder}
            />
            {/* Upload button */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="อัปโหลดรูปจากเครื่อง"
              style={{
                ...s.btn,
                padding: '0 12px', height: '36px', flexShrink: 0,
                background: '#6366f1', color: '#fff', border: 'none',
                fontWeight: 600, fontSize: '12px',
                boxShadow: '0 2px 8px rgba(99,102,241,0.3)',
              }}
            >
              <Upload size={13} /> อัปโหลด
            </button>
            {/* Clear button — show only when has value */}
            {value && (
              <button
                type="button"
                onClick={() => onChange('')}
                title="ลบรูป"
                style={{ ...s.btn, padding: '0 8px', height: '36px', color: '#ef4444', borderColor: '#fecaca', flexShrink: 0 }}
              >
                <X size={13} />
              </button>
            )}
          </div>
          <p style={{ margin: 0, fontSize: '10px', color: '#d1d5db' }}>
            JPG · PNG · GIF · WEBP · สูงสุด 5 MB
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
    </div>
  )
}

// ─── Rarity Badge ──────────────────────────────────────────────────────
function RarityBadge({ rarity }: { rarity: string }) {
  const r = RARITY[rarity as Rarity] || RARITY.common
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: r.color }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: r.dot, flexShrink: 0 }} />
      {r.label}
    </span>
  )
}

// ─── Rate Bar ──────────────────────────────────────────────────────────
function RateBar({ items }: { items: GachaItem[] }) {
  const active = items.filter(i => i.is_active)
  const total = sumRates(active)
  const ok = Math.abs(total - 100) < 0.01
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', color: '#9ca3af' }}>Drop rate total</span>
        <span style={{ fontSize: '12px', fontWeight: 600, color: ok ? '#10b981' : total > 100 ? '#ef4444' : '#f59e0b', fontVariantNumeric: 'tabular-nums' }}>
          {total.toFixed(2)}%
        </span>
      </div>
      <div style={{ height: '6px', borderRadius: '99px', background: '#f3f4f6', overflow: 'hidden', display: 'flex', gap: '1px' }}>
        {active.map(item => (
          <div key={item.id || item.name} style={{ flex: item.drop_rate, background: RARITY[item.rarity]?.dot || '#9ca3af', transition: 'flex 0.3s' }} />
        ))}
        {total < 100 && <div style={{ flex: 100 - total, background: '#f3f4f6' }} />}
      </div>
    </div>
  )
}

// ─── Toggle ────────────────────────────────────────────────────────────
function Toggle({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) {
  return (
    <button onClick={onChange} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
      <div style={{ width: '36px', height: '20px', borderRadius: '99px', background: value ? '#6366f1' : '#e5e7eb', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: '2px', left: value ? '18px' : '2px', width: '16px', height: '16px', borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
      </div>
      <span style={{ fontSize: '13px', color: '#374151' }}>{label}</span>
    </button>
  )
}

// ─── Pity Rule Editor ──────────────────────────────────────────────────
function PityEditor({ rules, onChange }: { rules: PityRule[]; onChange: (r: PityRule[]) => void }) {
  const add = () => onChange([...rules, { every_n_pulls: 50, min_rarity: 'epic', reset_on_win: true }])
  const remove = (i: number) => onChange(rules.filter((_, idx) => idx !== i))
  const update = (i: number, key: keyof PityRule, val: any) =>
    onChange(rules.map((r, idx) => idx === i ? { ...r, [key]: val } : r))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {rules.map((rule, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto auto', gap: '8px', alignItems: 'center', padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
          <div>
            <div style={s.label}>ทุก N pulls</div>
            <input type="number" min={1} value={rule.every_n_pulls} onChange={e => update(i, 'every_n_pulls', +e.target.value)} style={s.input} />
          </div>
          <div>
            <div style={s.label}>Rarity ขั้นต่ำ</div>
            <select value={rule.min_rarity} onChange={e => update(i, 'min_rarity', e.target.value as Rarity)} style={s.input}>
              {RARITIES.map(r => <option key={r} value={r}>{RARITY[r].label}</option>)}
            </select>
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#6b7280', cursor: 'pointer', marginTop: '14px' }}>
            <input type="checkbox" checked={rule.reset_on_win} onChange={e => update(i, 'reset_on_win', e.target.checked)} />
            Reset เมื่อได้
          </label>
          <button onClick={() => remove(i)} style={{ ...s.btn, padding: '6px', border: 'none', color: '#ef4444', background: 'none', marginTop: '14px' }}>
            <X size={14} />
          </button>
        </div>
      ))}
      <button onClick={add} style={{ ...s.btn, justifyContent: 'center', borderStyle: 'dashed', color: '#6366f1', borderColor: '#c7d2fe' }}>
        <Plus size={13} /> เพิ่มกฎ Pity
      </button>
    </div>
  )
}

// ─── Item Row ──────────────────────────────────────────────────────────
function ItemRow({ item, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast, deleting }: {
  item: GachaItem; onEdit: () => void; onDelete: () => void
  onMoveUp: () => void; onMoveDown: () => void; isFirst: boolean; isLast: boolean
  deleting?: boolean
}) {
  const stockOut = item.stock !== null && (item.delivered || 0) >= (item.stock || 0)
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
      border: '1px solid #f3f4f6', borderRadius: '10px',
      background: item.is_active ? '#fff' : '#fafafa',
      opacity: deleting ? 0.4 : item.is_active ? 1 : 0.6,
      transition: 'opacity 0.2s',
      pointerEvents: deleting ? 'none' : 'auto',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', flexShrink: 0 }}>
        <button onClick={onMoveUp} disabled={isFirst} style={{ background: 'none', border: 'none', cursor: isFirst ? 'default' : 'pointer', color: isFirst ? '#e5e7eb' : '#9ca3af', padding: '1px' }}><ArrowUp size={12} /></button>
        <button onClick={onMoveDown} disabled={isLast} style={{ background: 'none', border: 'none', cursor: isLast ? 'default' : 'pointer', color: isLast ? '#e5e7eb' : '#9ca3af', padding: '1px' }}><ArrowDown size={12} /></button>
      </div>

      {/* item thumbnail */}
      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#f9fafb', border: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, overflow: 'hidden' }}>
        {isImgSrc(item.image)
          ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : (item.image || '🎁')}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.name_th || item.name || '—'}
          </span>
          <RarityBadge rarity={item.rarity} />
          {stockOut && <span style={{ fontSize: '10px', color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '4px', padding: '1px 6px' }}>สต็อกหมด</span>}
          {!item.is_active && <span style={{ fontSize: '10px', color: '#9ca3af', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '4px', padding: '1px 6px' }}>ปิด</span>}
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span style={{ fontSize: '12px', color: '#6b7280', fontVariantNumeric: 'tabular-nums' }}>
            <span style={{ color: RARITY[item.rarity]?.color, fontWeight: 600 }}>{Number(item.drop_rate).toFixed(2)}%</span> drop
          </span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>฿{Number(item.value).toLocaleString()}</span>
          <span style={{ fontSize: '12px', color: '#6b7280' }}>
            {item.stock !== null ? `${item.stock - (item.delivered || 0)} / ${item.stock} เหลือ` : '∞ ไม่จำกัด'}
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        <button onClick={onEdit} style={{ ...s.btn, padding: '6px 8px', fontSize: '12px', color: '#6366f1', borderColor: '#e0e7ff' }}><Edit2 size={12} /></button>
        <button onClick={onDelete} style={{ ...s.btn, padding: '6px 8px', fontSize: '12px', color: '#ef4444', borderColor: '#fee2e2' }}><Trash2 size={12} /></button>
      </div>
    </div>
  )
}

// ─── Section Label ─────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '11px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px', marginTop: '4px' }}>{children}</div>
}

// ─── Field ─────────────────────────────────────────────────────────────
function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', marginBottom: '4px' }}>
        <label style={s.label}>{label}</label>
        {hint && <span title={hint} style={{ color: '#d1d5db', cursor: 'help' }}><Info size={10} /></span>}
      </div>
      {children}
    </div>
  )
}

// ─── Confirm Modal ──────────────────────────────────────────────────────
function ConfirmModal({ open, title, message, confirmLabel = 'ยืนยัน', danger = false, onConfirm, onCancel, loading }: {
  open: boolean; title: string; message: React.ReactNode; confirmLabel?: string
  danger?: boolean; onConfirm: () => void; onCancel: () => void; loading?: boolean
}) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: '16px' }} onClick={onCancel}>
      <div style={{ background: '#fff', borderRadius: '16px', padding: '28px 24px', width: '360px', textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: danger ? '#fef2f2' : '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
          <AlertTriangle size={22} color={danger ? '#ef4444' : '#3b82f6'} />
        </div>
        <h3 style={{ margin: '0 0 8px', fontWeight: 700, fontSize: '16px', color: '#111827' }}>{title}</h3>
        <div style={{ margin: '0 0 22px', color: '#6b7280', fontSize: '13px', lineHeight: 1.6 }}>{message}</div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
          <button onClick={onCancel} disabled={loading} style={s.btn}>ยกเลิก</button>
          <button onClick={onConfirm} disabled={loading} style={{ ...s.btn, border: 'none', fontWeight: 600, background: danger ? '#ef4444' : '#6366f1', color: '#fff', opacity: loading ? 0.7 : 1 }}>
            {loading ? 'กำลังดำเนินการ...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════
export default function AdminGachaPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [pools, setPools] = useState<GachaPool[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPool, setSelectedPool] = useState<GachaPool | null>(null)
  const [rightTab, setRightTab] = useState<'items' | 'analytics' | 'logs'>('items')
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')

  const [poolModal, setPoolModal] = useState(false)
  const [itemModal, setItemModal] = useState(false)
  const [logsModal, setLogsModal] = useState(false)

  const [confirmState, setConfirmState] = useState<{
    open: boolean; title: string; message: React.ReactNode
    confirmLabel?: string; danger?: boolean; loading?: boolean
    onConfirm: () => void
  }>({ open: false, title: '', message: '', onConfirm: () => {} })

  const [cloneTarget, setCloneTarget] = useState<GachaPool | null>(null)
  const [editPool, setEditPool] = useState<any>({ ...EMPTY_POOL })
  const [editPoolId, setEditPoolId] = useState<string | null>(null)
  const [editItem, setEditItem] = useState<any>({ ...EMPTY_ITEM })
  const [editItemId, setEditItemId] = useState<string | null>(null)
  const [pullLogs, setPullLogs] = useState<PullLog[]>([])
  const [logsLoading, setLogsLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())
  const reorderInProgress = useRef(false)

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
    fetchPools()
  }, [user])

  const fetchPools = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('gacha_pools')
        .select('*, gacha_items(*)')
        .order('sort_order')
        .order('created_at', { ascending: false })
      if (error) throw error
      setPools(data || [])
    } catch { toast.error('โหลดข้อมูลไม่สำเร็จ') }
    finally { setLoading(false) }
  }

  const fetchLogs = async (poolId?: string) => {
    setLogsLoading(true)
    try {
      let q = supabase
        .from('gacha_pulls')
        .select('*, profiles(email), gacha_items(name, name_th, rarity), gacha_pools(name, name_th)')
        .order('created_at', { ascending: false })
        .limit(200)
      if (poolId) q = q.eq('pool_id', poolId)
      const { data } = await q
      setPullLogs((data || []).map((r: any) => ({
        id: r.id, user_id: r.user_id, pool_id: r.pool_id, item_id: r.item_id,
        created_at: r.created_at, pity_count_at_pull: r.pity_count_at_pull,
        user_email: r.profiles?.email,
        item_name: r.gacha_items?.name_th || r.gacha_items?.name,
        item_rarity: r.gacha_items?.rarity,
        pool_name: r.gacha_pools?.name_th || r.gacha_pools?.name,
      })))
    } catch { toast.error('โหลด logs ไม่สำเร็จ') }
    finally { setLogsLoading(false) }
  }

  const savePool = async () => {
    if (!editPool.name || !editPool.price) { toast.error('ชื่อและราคาต้องกรอก'); return }
    setSaving(true)
    try {
      const payload = {
        ...editPool,
        price: Number(editPool.price),
        sort_order: Number(editPool.sort_order || 0),
        max_pulls_per_user: editPool.max_pulls_per_user ? Number(editPool.max_pulls_per_user) : null,
        max_pulls_per_day: editPool.max_pulls_per_day ? Number(editPool.max_pulls_per_day) : null,
        pity_rules: editPool.pity_rules || [],
        start_at: editPool.start_at || null,
        end_at: editPool.end_at || null,
      }
      if (editPoolId) {
        const { error } = await supabase.from('gacha_pools').update(payload).eq('id', editPoolId)
        if (error) throw error
        setPools(prev => prev.map(p => p.id === editPoolId ? { ...p, ...payload } : p))
        toast.success('อัปเดตแล้ว')
      } else {
        const { error } = await supabase.from('gacha_pools').insert({ ...payload, total_pulls: 0 })
        if (error) throw error
        toast.success('สร้างตู้สุ่มใหม่แล้ว')
        fetchPools()
      }
      setPoolModal(false)
    } catch (e: any) { toast.error(e.message || 'เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  const saveItem = async () => {
    if (!selectedPoolFull || !editItem.name || editItem.drop_rate === '') {
      toast.error('กรุณากรอกข้อมูลให้ครบ'); return
    }
    const items = selectedPoolFull.gacha_items || []
    const others = items.filter(i => i.id !== editItemId)
    const othersSum = others.filter(i => i.is_active).reduce((s, i) => s + Number(i.drop_rate), 0)
    if (othersSum + Number(editItem.drop_rate) > 100.005) { toast.error('อัตรารวมเกิน 100%'); return }
    setSaving(true)
    try {
      const payload = {
        name: editItem.name, name_th: editItem.name_th, rarity: editItem.rarity,
        drop_rate: Number(editItem.drop_rate), guaranteed_rate: Number(editItem.guaranteed_rate || 0),
        image: editItem.image || '🎁', value: Number(editItem.value || 0),
        stock: editItem.stock === '' || editItem.stock === null ? null : Number(editItem.stock),
        is_active: editItem.is_active, sort_order: Number(editItem.sort_order || 0),
      }
      if (editItemId) {
        const { error } = await supabase.from('gacha_items').update(payload).eq('id', editItemId)
        if (error) throw error
        toast.success('อัปเดต item แล้ว')
      } else {
        const { error } = await supabase.from('gacha_items').insert({ ...payload, pool_id: selectedPoolFull.id, delivered: 0 })
        if (error) throw error
        toast.success('เพิ่ม item แล้ว')
      }
      setItemModal(false)
      fetchPools()
    } catch (e: any) { toast.error(e.message || 'เกิดข้อผิดพลาด') }
    finally { setSaving(false) }
  }

  const deletePool = (pool: GachaPool) => {
    setConfirmState({
      open: true, title: 'ลบตู้สุ่ม?',
      message: <><strong>{pool.name_th || pool.name}</strong> และ items ทั้งหมด {pool.gacha_items?.length || 0} รายการจะถูกลบถาวร</>,
      confirmLabel: 'ลบเลย', danger: true,
      onConfirm: async () => {
        setConfirmState(c => ({ ...c, loading: true }))
        try {
          await supabase.from('gacha_items').delete().eq('pool_id', pool.id)
          await supabase.from('gacha_pools').delete().eq('id', pool.id)
          setPools(prev => prev.filter(p => p.id !== pool.id))
          if (selectedPool?.id === pool.id) setSelectedPool(null)
          toast.success('ลบแล้ว')
        } catch { toast.error('ลบไม่สำเร็จ') }
        finally { setConfirmState(c => ({ ...c, open: false, loading: false })) }
      },
    })
  }

  const deleteItem = (item: GachaItem) => {
    setConfirmState({
      open: true, title: 'ลบ Item?',
      message: <><strong>{item.name_th || item.name}</strong> จะถูกลบถาวร</>,
      confirmLabel: 'ลบ Item', danger: true,
      onConfirm: async () => {
        setConfirmState(c => ({ ...c, loading: true }))
        setDeletingIds(prev => new Set([...prev, item.id!]))
        try {
          const { error } = await supabase.from('gacha_items').delete().eq('id', item.id!)
          if (error) throw error
          toast.success('ลบแล้ว')
          fetchPools()
        } catch { toast.error('ลบไม่สำเร็จ') }
        finally {
          setDeletingIds(prev => { const s = new Set(prev); s.delete(item.id!); return s })
          setConfirmState(c => ({ ...c, open: false, loading: false }))
        }
      },
    })
  }

  const toggleActive = async (pool: GachaPool) => {
    const next = !pool.is_active
    setPools(prev => prev.map(p => p.id === pool.id ? { ...p, is_active: next } : p))
    try {
      const { error } = await supabase.from('gacha_pools').update({ is_active: next }).eq('id', pool.id)
      if (error) throw error
    } catch {
      toast.error('เกิดข้อผิดพลาด')
      setPools(prev => prev.map(p => p.id === pool.id ? { ...p, is_active: !next } : p))
    }
  }

  const clonePool = async (pool: GachaPool) => {
    try {
      const { id, created_at, gacha_items, total_pulls, ...rest } = pool as any
      const { data: np, error } = await supabase
        .from('gacha_pools')
        .insert({ ...rest, name: `${rest.name} (Copy)`, name_th: `${rest.name_th} (สำเนา)`, is_active: false, total_pulls: 0 })
        .select().single()
      if (error) throw error
      if (pool.gacha_items?.length) {
        const cloned = pool.gacha_items.map(({ id: _id, pool_id: _pid, delivered: _d, ...iRest }) => ({ ...iRest, pool_id: np.id, delivered: 0 }))
        await supabase.from('gacha_items').insert(cloned)
      }
      toast.success('Clone สำเร็จ')
      setCloneTarget(null)
      fetchPools()
    } catch (e: any) { toast.error(e.message) }
  }

  const moveItem = async (items: GachaItem[], from: number, to: number) => {
    if (reorderInProgress.current) return
    reorderInProgress.current = true
    const arr = [...items]
    const [moved] = arr.splice(from, 1)
    arr.splice(to, 0, moved)
    setPools(prev => prev.map(p => {
      if (p.id !== selectedPoolFull?.id) return p
      return { ...p, gacha_items: arr.map((item, idx) => ({ ...item, sort_order: idx })) }
    }))
    try {
      const { error } = await supabase.from('gacha_items').upsert(arr.map((item, idx) => ({ id: item.id!, sort_order: idx })))
      if (error) throw error
    } catch {
      toast.error('เรียงลำดับไม่สำเร็จ')
      fetchPools()
    } finally { reorderInProgress.current = false }
  }

  // ─── Derived ──────────────────────────────────────────────────────
  const filteredPools = pools.filter(p => {
    if (filterCat !== 'all' && p.category !== filterCat) return false
    if (search) {
      const q = search.toLowerCase()
      if (!p.name.toLowerCase().includes(q) && !p.name_th.includes(q)) return false
    }
    return true
  })
  const selectedPoolFull = pools.find(p => p.id === selectedPool?.id) || null
  const sortedItems = [...(selectedPoolFull?.gacha_items || [])].sort((a, b) => a.sort_order - b.sort_order)
  const totalRevenue = pools.reduce((s, p) => s + (p.total_pulls || 0) * p.price, 0)
  const totalPulls = pools.reduce((s, p) => s + (p.total_pulls || 0), 0)

  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px',
  }
  const modalBox: React.CSSProperties = {
    background: '#fff', borderRadius: '16px', padding: '24px',
    maxHeight: '88vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb', fontFamily: "'DM Sans','Noto Sans Thai',sans-serif", color: '#111827' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#111827' }}>ตู้สุ่ม</h1>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9ca3af' }}>
              {pools.filter(p => p.is_active).length} เปิดอยู่ · {totalPulls.toLocaleString()} pulls · ฿{totalRevenue.toLocaleString()} รายได้
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={fetchPools} style={s.btn}>
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            </button>
            <button onClick={() => { fetchLogs(); setLogsModal(true) }} style={s.btn}>
              <BarChart2 size={13} /> Logs
            </button>
            <button
              onClick={() => { setEditPool({ ...EMPTY_POOL }); setEditPoolId(null); setPoolModal(true) }}
              style={{ ...s.btn, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 600 }}
            >
              <Plus size={13} /> สร้างตู้สุ่ม
            </button>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'ตู้สุ่มทั้งหมด', value: pools.length },
            { label: 'เปิดอยู่', value: pools.filter(p => p.is_active).length },
            { label: 'Total pulls', value: totalPulls.toLocaleString() },
            { label: 'รายได้', value: `฿${totalRevenue.toLocaleString()}` },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: '12px', padding: '16px 20px' }}>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>{stat.value}</div>
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── Main 2-col ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', alignItems: 'start' }}>

          {/* ══ LEFT ══ */}
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหา..." style={{ ...s.input, paddingLeft: '32px' }} />
              </div>
              <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...s.input, width: '90px' }}>
                <option value="all">ทั้งหมด</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>กำลังโหลด...</div>
            ) : filteredPools.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px', background: '#fff', border: '1px dashed #e5e7eb', borderRadius: '12px' }}>ยังไม่มีตู้สุ่ม</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filteredPools.map(pool => {
                  const isSel = selectedPool?.id === pool.id
                  return (
                    <div key={pool.id} onClick={() => setSelectedPool(pool)} style={{
                      padding: '12px 14px', border: `1px solid ${isSel ? '#c7d2fe' : '#f3f4f6'}`,
                      borderRadius: '10px', cursor: 'pointer', background: isSel ? '#eef2ff' : '#fff',
                      transition: 'all 0.12s',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Pool thumbnail in list */}
                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0, overflow: 'hidden' }}>
                          {isImgSrc(pool.image)
                            ? <img src={pool.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : (pool.image || '🎮')}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <span style={{ fontSize: '13px', fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {pool.name_th || pool.name}
                            </span>
                            <span style={{ fontSize: '11px', fontWeight: 600, flexShrink: 0, color: pool.is_active ? '#10b981' : '#9ca3af' }}>
                              {pool.is_active ? 'เปิด' : 'ปิด'}
                            </span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                            {pool.category} · ฿{pool.price} · {(pool.gacha_items || []).length} items
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ color: '#d1d5db', flexShrink: 0 }} />
                      </div>

                      {isSel && (
                        <div style={{ display: 'flex', gap: '4px', marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #e0e7ff' }} onClick={e => e.stopPropagation()}>
                          {[
                            { icon: pool.is_active ? <EyeOff size={12} /> : <Eye size={12} />, label: pool.is_active ? 'ปิด' : 'เปิด', action: () => toggleActive(pool) },
                            { icon: <Copy size={12} />, label: 'Clone', action: () => setCloneTarget(pool) },
                            { icon: <Edit2 size={12} />, label: 'แก้ไข', action: () => { const { id: _, created_at: __, gacha_items: ___, total_pulls: ____, ...rest } = pool as any; setEditPool({ ...rest, pity_rules: rest.pity_rules || [] }); setEditPoolId(pool.id); setPoolModal(true) } },
                            { icon: <Trash2 size={12} />, label: 'ลบ', action: () => deletePool(pool) },
                          ].map((btn, i) => (
                            <button key={i} onClick={btn.action} style={{ ...s.btn, fontSize: '11px', padding: '4px 8px', color: '#6b7280' }}>
                              {btn.icon} {btn.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* ══ RIGHT ══ */}
          <div>
            {!selectedPoolFull ? (
              <div style={{ background: '#fff', border: '1px dashed #e5e7eb', borderRadius: '16px', padding: '60px', textAlign: 'center', color: '#9ca3af' }}>
                <Package size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p style={{ margin: 0, fontSize: '14px', fontWeight: 500 }}>เลือกตู้สุ่มทางซ้าย</p>
              </div>
            ) : (
              <div style={{ background: '#fff', border: '1px solid #f3f4f6', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ padding: '18px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eef2ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0, overflow: 'hidden' }}>
                    {isImgSrc(selectedPoolFull.image)
                      ? <img src={selectedPoolFull.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : (selectedPoolFull.image || '🎮')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '15px' }}>{selectedPoolFull.name_th || selectedPoolFull.name}</div>
                    <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
                      {selectedPoolFull.category} · ฿{selectedPoolFull.price}/pull · {(selectedPoolFull.total_pulls || 0).toLocaleString()} pulls
                    </div>
                  </div>
                  <button onClick={() => { setEditItem({ ...EMPTY_ITEM }); setEditItemId(null); setItemModal(true) }} style={{ ...s.btn, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 600 }}>
                    <Plus size={13} /> เพิ่ม Item
                  </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6' }}>
                  {([{ id: 'items', label: `Items (${sortedItems.length})` }, { id: 'analytics', label: 'Analytics' }, { id: 'logs', label: 'Logs' }] as const).map(tab => (
                    <button key={tab.id} onClick={() => { setRightTab(tab.id); if (tab.id === 'logs') fetchLogs(selectedPoolFull.id) }} style={{
                      flex: 1, padding: '12px', background: 'none', border: 'none',
                      borderBottom: `2px solid ${rightTab === tab.id ? '#6366f1' : 'transparent'}`,
                      color: rightTab === tab.id ? '#6366f1' : '#9ca3af',
                      cursor: 'pointer', fontSize: '13px', fontWeight: 500, fontFamily: 'inherit', transition: 'all 0.15s',
                    }}>{tab.label}</button>
                  ))}
                </div>

                <div style={{ padding: '20px' }}>
                  {rightTab === 'items' && (
                    <div>
                      <div style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px 16px', marginBottom: '16px' }}>
                        <RateBar items={sortedItems} />
                      </div>
                      {sortedItems.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px', border: '1px dashed #e5e7eb', borderRadius: '10px' }}>
                          ยังไม่มี item — กด "เพิ่ม Item" ด้านบน
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {sortedItems.map((item, idx) => (
                            <ItemRow
                              key={item.id} item={item}
                              isFirst={idx === 0} isLast={idx === sortedItems.length - 1}
                              deleting={deletingIds.has(item.id!)}
                              onMoveUp={() => moveItem(sortedItems, idx, idx - 1)}
                              onMoveDown={() => moveItem(sortedItems, idx, idx + 1)}
                              onEdit={() => { setEditItem({ ...item }); setEditItemId(item.id!); setItemModal(true) }}
                              onDelete={() => deleteItem(item)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {rightTab === 'analytics' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: '10px' }}>
                        {[
                          { label: 'Total pulls', value: (selectedPoolFull.total_pulls || 0).toLocaleString() },
                          { label: 'Revenue', value: `฿${((selectedPoolFull.total_pulls || 0) * selectedPoolFull.price).toLocaleString()}` },
                        ].map(s => (
                          <div key={s.label} style={{ background: '#f9fafb', borderRadius: '10px', padding: '14px 16px' }}>
                            <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '2px' }}>{s.value}</div>
                            <div style={{ fontSize: '12px', color: '#9ca3af' }}>{s.label}</div>
                          </div>
                        ))}
                      </div>
                      <div>
                        <SectionLabel>Rarity distribution</SectionLabel>
                        {RARITIES.map(r => {
                          const rRate = sortedItems.filter(i => i.rarity === r && i.is_active).reduce((sum, i) => sum + Number(i.drop_rate), 0)
                          if (!rRate) return null
                          return (
                            <div key={r} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 50px', gap: '10px', alignItems: 'center', marginBottom: '8px' }}>
                              <RarityBadge rarity={r} />
                              <div style={{ height: '6px', background: '#f3f4f6', borderRadius: '99px', overflow: 'hidden' }}>
                                <div style={{ width: `${rRate}%`, height: '100%', background: RARITY[r].dot }} />
                              </div>
                              <span style={{ fontSize: '12px', color: RARITY[r].color, fontWeight: 600, textAlign: 'right' }}>{rRate.toFixed(1)}%</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {rightTab === 'logs' && (
                    logsLoading ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>กำลังโหลด...</div>
                    ) : pullLogs.filter(l => l.pool_id === selectedPoolFull.id).length === 0 ? (
                      <div style={{ padding: '30px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>ยังไม่มีประวัติสุ่ม</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '400px', overflowY: 'auto' }}>
                        {pullLogs.filter(l => l.pool_id === selectedPoolFull.id).map((log, i) => (
                          <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '12px', padding: '10px 12px', background: i % 2 === 0 ? '#f9fafb' : '#fff', borderRadius: '8px', alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 500 }}>{log.user_email || log.user_id.slice(0, 10) + '…'}</div>
                              <div style={{ fontSize: '11px', color: '#9ca3af' }}>{log.item_name}</div>
                            </div>
                            <RarityBadge rarity={log.item_rarity || 'common'} />
                            <span style={{ fontSize: '11px', color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
                              {new Date(log.created_at).toLocaleString('th-TH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════ POOL MODAL ════ */}
      {poolModal && (
        <div style={overlay} onClick={() => setPoolModal(false)}>
          <div style={{ ...modalBox, width: '580px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>{editPoolId ? 'แก้ไขตู้สุ่ม' : 'สร้างตู้สุ่มใหม่'}</h2>
              <button onClick={() => setPoolModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <SectionLabel>ชื่อและรายละเอียด</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Field label="ชื่อ (EN) *"><input style={s.input} value={editPool.name} onChange={e => setEditPool((p: any) => ({ ...p, name: e.target.value }))} placeholder="Pool Name" /></Field>
                  <Field label="ชื่อ (TH)"><input style={s.input} value={editPool.name_th} onChange={e => setEditPool((p: any) => ({ ...p, name_th: e.target.value }))} placeholder="ชื่อตู้สุ่ม" /></Field>
                  <Field label="รายละเอียด (EN)"><input style={s.input} value={editPool.description} onChange={e => setEditPool((p: any) => ({ ...p, description: e.target.value }))} /></Field>
                  <Field label="รายละเอียด (TH)"><input style={s.input} value={editPool.description_th} onChange={e => setEditPool((p: any) => ({ ...p, description_th: e.target.value }))} /></Field>
                </div>
              </div>

              <div>
                <SectionLabel>ราคาและหมวดหมู่</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                  <Field label="ราคา/ครั้ง (฿) *">
                    <input style={s.input} type="number" min={1} value={editPool.price} onChange={e => setEditPool((p: any) => ({ ...p, price: e.target.value }))} />
                  </Field>
                  <Field label="หมวดหมู่">
                    <select style={s.input} value={editPool.category} onChange={e => setEditPool((p: any) => ({ ...p, category: e.target.value }))}>
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                  <Field label="Sort order">
                    <input style={s.input} type="number" value={editPool.sort_order || 0} onChange={e => setEditPool((p: any) => ({ ...p, sort_order: e.target.value }))} />
                  </Field>
                </div>
              </div>

              <div>
                <SectionLabel>จำกัดการสุ่ม</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Field label="สูงสุดต่อ User" hint="ว่าง = ไม่จำกัด">
                    <input style={s.input} type="number" value={editPool.max_pulls_per_user || ''} onChange={e => setEditPool((p: any) => ({ ...p, max_pulls_per_user: e.target.value || null }))} placeholder="ไม่จำกัด" />
                  </Field>
                  <Field label="สูงสุดต่อวัน" hint="ว่าง = ไม่จำกัด">
                    <input style={s.input} type="number" value={editPool.max_pulls_per_day || ''} onChange={e => setEditPool((p: any) => ({ ...p, max_pulls_per_day: e.target.value || null }))} placeholder="ไม่จำกัด" />
                  </Field>
                </div>
              </div>

              <div>
                <SectionLabel>กำหนดเวลา</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Field label="วันเริ่ม">
                    <input style={s.input} type="datetime-local" value={editPool.start_at ? editPool.start_at.slice(0, 16) : ''} onChange={e => setEditPool((p: any) => ({ ...p, start_at: e.target.value || null }))} />
                  </Field>
                  <Field label="วันหมดอายุ">
                    <input style={s.input} type="datetime-local" value={editPool.end_at ? editPool.end_at.slice(0, 16) : ''} onChange={e => setEditPool((p: any) => ({ ...p, end_at: e.target.value || null }))} />
                  </Field>
                </div>
              </div>

              <div>
                <SectionLabel>กฎ Pity · {editPool.pity_rules?.length || 0} กฎ</SectionLabel>
                <PityEditor rules={editPool.pity_rules || []} onChange={r => setEditPool((p: any) => ({ ...p, pity_rules: r }))} />
              </div>

              {/* ── ไอคอน — ใช้ ImageUploadField ── */}
              <div>
                <SectionLabel>ไอคอน</SectionLabel>
                <ImageUploadField
                  label="Emoji หรือ URL"
                  placeholder="🎮 หรือ https://..."
                  value={editPool.image || ''}
                  onChange={v => setEditPool((p: any) => ({ ...p, image: v }))}
                  previewSize={44}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px', paddingTop: '4px' }}>
                <Toggle value={editPool.is_active} onChange={() => setEditPool((p: any) => ({ ...p, is_active: !p.is_active }))} label="เปิดให้ใช้งาน" />
                <Toggle value={editPool.featured} onChange={() => setEditPool((p: any) => ({ ...p, featured: !p.featured }))} label="Featured" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setPoolModal(false)} style={s.btn}>ยกเลิก</button>
              <button onClick={savePool} disabled={saving} style={{ ...s.btn, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                <Save size={14} /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ ITEM MODAL ════ */}
      {itemModal && selectedPoolFull && (
        <div style={overlay} onClick={() => setItemModal(false)}>
          <div style={{ ...modalBox, width: '520px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>{editItemId ? 'แก้ไข Item' : 'เพิ่ม Item ใหม่'}</h2>
              <button onClick={() => setItemModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <SectionLabel>ชื่อรางวัล</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Field label="ชื่อ (EN) *"><input style={s.input} value={editItem.name} onChange={e => setEditItem((p: any) => ({ ...p, name: e.target.value }))} placeholder="Item Name" /></Field>
                  <Field label="ชื่อ (TH)"><input style={s.input} value={editItem.name_th} onChange={e => setEditItem((p: any) => ({ ...p, name_th: e.target.value }))} placeholder="ชื่อรางวัล" /></Field>
                </div>
              </div>

              <div>
                <SectionLabel>Rarity</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
                  {RARITIES.map(r => (
                    <button key={r} onClick={() => setEditItem((p: any) => ({ ...p, rarity: r }))} style={{
                      padding: '10px 6px', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit',
                      border: `1.5px solid ${editItem.rarity === r ? RARITY[r].color : '#e5e7eb'}`,
                      background: editItem.rarity === r ? `${RARITY[r].dot}18` : '#fff',
                      color: editItem.rarity === r ? RARITY[r].color : '#9ca3af',
                      fontSize: '12px', fontWeight: 600, textAlign: 'center', transition: 'all 0.15s',
                    }}>
                      {RARITY[r].label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel>อัตราดรอป</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <Field label="Drop Rate (%)">
                    <input style={s.input} type="number" min={0.01} max={100} step={0.01} value={editItem.drop_rate} onChange={e => setEditItem((p: any) => ({ ...p, drop_rate: e.target.value }))} />
                  </Field>
                  <Field label="Guaranteed Rate (%)" hint="0 = ไม่มีการันตี">
                    <input style={s.input} type="number" min={0} max={100} step={0.01} value={editItem.guaranteed_rate} onChange={e => setEditItem((p: any) => ({ ...p, guaranteed_rate: e.target.value }))} />
                  </Field>
                </div>
                {(() => {
                  const others = (selectedPoolFull.gacha_items || []).filter(i => i.id !== editItemId && i.is_active)
                  const othersSum = others.reduce((sum, i) => sum + Number(i.drop_rate), 0)
                  const newTotal = othersSum + Number(editItem.drop_rate || 0)
                  const ok = Math.abs(newTotal - 100) < 0.005
                  const over = newTotal > 100.005
                  return (
                    <div style={{ marginTop: '8px', padding: '10px 12px', borderRadius: '8px', background: ok ? '#f0fdf4' : over ? '#fef2f2' : '#fffbeb', border: `1px solid ${ok ? '#bbf7d0' : over ? '#fecaca' : '#fde68a'}` }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: ok ? '#10b981' : over ? '#ef4444' : '#f59e0b' }}>
                        {ok ? '✓ อัตรารวมครบ 100%' : over ? `เกิน 100% (${newTotal.toFixed(2)}%)` : `รวม ${newTotal.toFixed(2)}% — เหลือ ${(100 - newTotal).toFixed(2)}%`}
                      </span>
                    </div>
                  )
                })()}
              </div>

              <div>
                <SectionLabel>มูลค่าและสต็อก</SectionLabel>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px' }}>
                  <Field label="มูลค่า (฿)"><input style={s.input} type="number" min={0} value={editItem.value} onChange={e => setEditItem((p: any) => ({ ...p, value: e.target.value }))} /></Field>
                  <Field label="สต็อก" hint="ว่าง = ไม่จำกัด"><input style={s.input} type="number" min={0} value={editItem.stock ?? ''} onChange={e => setEditItem((p: any) => ({ ...p, stock: e.target.value === '' ? null : e.target.value }))} placeholder="ไม่จำกัด" /></Field>
                  <Field label="Sort order"><input style={s.input} type="number" value={editItem.sort_order || 0} onChange={e => setEditItem((p: any) => ({ ...p, sort_order: e.target.value }))} /></Field>
                </div>
              </div>

              {/* ── ไอคอน — ใช้ ImageUploadField ── */}
              <div>
                <SectionLabel>ไอคอน</SectionLabel>
                <ImageUploadField
                  label="Emoji หรือ URL"
                  placeholder="🎁 หรือ https://..."
                  value={editItem.image || ''}
                  onChange={v => setEditItem((p: any) => ({ ...p, image: v }))}
                  previewSize={44}
                />
                {/* Quick emoji picker */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                  {['🎁', '👑', '💎', '🔮', '⚔️', '🛡️', '🌟', '💰', '🏆', '🎯'].map(e => (
                    <button key={e} onClick={() => setEditItem((p: any) => ({ ...p, image: e }))} style={{
                      background: editItem.image === e ? '#eef2ff' : '#fff',
                      border: `1px solid ${editItem.image === e ? '#c7d2fe' : '#e5e7eb'}`,
                      borderRadius: '8px', padding: '6px 10px', cursor: 'pointer', fontSize: '16px',
                    }}>{e}</button>
                  ))}
                </div>
              </div>

              <Toggle value={editItem.is_active} onChange={() => setEditItem((p: any) => ({ ...p, is_active: !p.is_active }))} label="เปิดใช้งาน item นี้" />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '24px', justifyContent: 'flex-end' }}>
              <button onClick={() => setItemModal(false)} style={s.btn}>ยกเลิก</button>
              <button onClick={saveItem} disabled={saving} style={{ ...s.btn, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 600, opacity: saving ? 0.7 : 1 }}>
                <Save size={14} /> {saving ? 'กำลังบันทึก...' : 'บันทึก Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════ ALL LOGS MODAL ════ */}
      {logsModal && (
        <div style={overlay} onClick={() => setLogsModal(false)}>
          <div style={{ ...modalBox, width: '640px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700 }}>Pull Logs</h2>
              <button onClick={() => setLogsModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}><X size={18} /></button>
            </div>
            {logsLoading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>กำลังโหลด...</div>
            ) : pullLogs.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>ยังไม่มีประวัติ</div>
            ) : (
              <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                {pullLogs.map((log, i) => (
                  <div key={log.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 90px 90px', gap: '12px', padding: '10px 12px', background: i % 2 === 0 ? '#f9fafb' : '#fff', borderRadius: '8px', marginBottom: '2px', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 500 }}>{log.user_email || log.user_id.slice(0, 12) + '…'}</div>
                      <div style={{ fontSize: '11px', color: '#9ca3af' }}>{log.item_name}</div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.pool_name}</div>
                    <RarityBadge rarity={log.item_rarity || 'common'} />
                    <div style={{ fontSize: '11px', color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
                      {new Date(log.created_at).toLocaleString('th-TH', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ════ CLONE CONFIRM ════ */}
      {cloneTarget && (
        <div style={overlay} onClick={() => setCloneTarget(null)}>
          <div style={{ ...modalBox, width: '360px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: '32px', marginBottom: '12px' }}>📋</div>
            <h3 style={{ margin: '0 0 6px', fontWeight: 700, fontSize: '16px' }}>Clone ตู้สุ่ม?</h3>
            <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: '14px' }}>{cloneTarget.name_th || cloneTarget.name}</p>
            <p style={{ margin: '0 0 20px', color: '#9ca3af', fontSize: '13px' }}>
              จะสร้างสำเนาพร้อม {cloneTarget.gacha_items?.length || 0} items ตู้ใหม่จะถูกปิดไว้ก่อน
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
              <button onClick={() => setCloneTarget(null)} style={s.btn}>ยกเลิก</button>
              <button onClick={() => clonePool(cloneTarget)} style={{ ...s.btn, background: '#6366f1', color: '#fff', border: 'none', fontWeight: 600 }}>
                <Copy size={13} /> Clone เลย
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        danger={confirmState.danger}
        loading={confirmState.loading}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(c => ({ ...c, open: false }))}
      />

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input:focus, select:focus, textarea:focus { border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        select option { background: #fff; color: #111827; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 99px; }
      `}</style>
    </div>
  )
}