'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Edit2, Eye, EyeOff, Gift, RefreshCw, X, Save, Upload, ImageIcon } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

interface GachaItem {
  id?: string
  pool_id?: string
  name: string
  name_th: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  drop_rate: number
  image: string
  value: number
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
  created_at: string
  gacha_items?: GachaItem[]
}

const RARITY_COLOR: Record<string, string> = {
  common: '#64748b',
  rare: '#3b82f6',
  epic: '#8b5cf6',
  legendary: '#f59e0b',
}

const EMPTY_POOL = {
  name: '', name_th: '', description: '', description_th: '',
  category: 'rov', price: 100, image: '', is_active: true,
}

const EMPTY_ITEM: GachaItem = {
  name: '', name_th: '', rarity: 'common', drop_rate: 10, image: '', value: 0,
}

// ─── readFileAsDataURL ────────────────────────────────────────────────
function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('อ่านไฟล์ไม่สำเร็จ'))
    reader.readAsDataURL(file)
  })
}

// ─── ImageUploadField ─────────────────────────────────────────────────
// ใช้แทน input URL รูปภาพ — รองรับทั้งพิมพ์ URL และอัปโหลดจากเครื่อง
function ImageUploadField({
  value,
  onChange,
  label = 'รูปภาพ',
}: {
  value: string
  onChange: (v: string) => void
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hover, setHover] = useState(false)
  const isImage = value.startsWith('data:') || value.startsWith('http') || value.startsWith('/')

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('รองรับเฉพาะไฟล์รูปภาพ'); return }
    if (file.size > 5 * 1024 * 1024) { toast.error('ไฟล์ใหญ่เกิน 5 MB'); return }
    try {
      const dataUrl = await readFileAsDataURL(file)
      onChange(dataUrl)
    } catch {
      toast.error('อ่านไฟล์ไม่สำเร็จ')
    }
    e.target.value = ''
  }

  const s: Record<string, any> = {
    label: { fontSize: '12px', color: '#64748b', marginBottom: '6px', display: 'block' },
    input: { flex: 1, background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', padding: '9px 12px', color: '#f1f5f9', fontSize: '13px', outline: 'none', minWidth: 0 },
    uploadBtn: {
      background: '#7c3aed', border: '1px solid #6d28d9', borderRadius: '8px',
      padding: '0 14px', color: '#fff', cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px',
      fontWeight: 600, whiteSpace: 'nowrap', height: '38px',
      boxShadow: '0 2px 8px rgba(124,58,237,0.35)',
    },
  }

  return (
    <div>
      <label style={s.label}>{label}</label>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
        {/* Preview */}
        <div
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          onClick={() => inputRef.current?.click()}
          style={{
            width: 38, height: 38, borderRadius: '8px', flexShrink: 0,
            background: isImage ? 'transparent' : '#1a1a2e',
            border: '1px solid #2a2a45',
            overflow: 'hidden', cursor: 'pointer', position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {isImage
            ? <img src={value} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <ImageIcon style={{ width: 16, height: 16, color: '#475569' }} />
          }
          {hover && (
            <div style={{
              position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Upload style={{ width: 14, height: 14, color: '#fff' }} />
            </div>
          )}
        </div>

        {/* URL input */}
        <input
          style={s.input}
          value={value}
          placeholder="วาง URL หรือคลิกอัปโหลด"
          onChange={e => onChange(e.target.value)}
        />

        {/* Upload button */}
        <button type="button" style={s.uploadBtn} onClick={() => inputRef.current?.click()}>
          <Upload size={13} /> อัปโหลด
        </button>

        {/* Clear */}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{ ...s.uploadBtn, padding: '0 10px', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* hidden file input */}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      {/* size hint */}
      <p style={{ margin: '4px 0 0', fontSize: '10px', color: '#475569' }}>
        รองรับ JPG, PNG, GIF, WEBP · ขนาดสูงสุด 5 MB
      </p>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────
export default function AdminGachaPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [pools, setPools] = useState<GachaPool[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPool, setSelectedPool] = useState<GachaPool | null>(null)
  const [showPoolModal, setShowPoolModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)
  const [editPool, setEditPool] = useState<any>(EMPTY_POOL)
  const [editItem, setEditItem] = useState<GachaItem>(EMPTY_ITEM)
  const [editingPoolId, setEditingPoolId] = useState<string | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
    fetchPools()
  }, [user])

  const fetchPools = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('gacha_pools')
        .select('*, gacha_items(*)')
        .order('created_at', { ascending: false })
      if (error) throw error
      setPools(data || [])
    } catch {
      toast.error('โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const savePool = async () => {
    if (!editPool.name || !editPool.price) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return }
    setSaving(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      if (editingPoolId) {
        const { error } = await supabase.from('gacha_pools').update(editPool).eq('id', editingPoolId)
        if (error) throw error
        toast.success('อัปเดตตู้สุ่มแล้ว')
      } else {
        const { error } = await supabase.from('gacha_pools').insert({ ...editPool, total_pulls: 0 })
        if (error) throw error
        toast.success('สร้างตู้สุ่มแล้ว')
      }
      setShowPoolModal(false)
      fetchPools()
    } catch (e: any) {
      toast.error(e.message || 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const saveItem = async () => {
    if (!selectedPool || !editItem.name || !editItem.drop_rate) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return }
    setSaving(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      if (editingItemId) {
        const { error } = await supabase.from('gacha_items').update(editItem).eq('id', editingItemId)
        if (error) throw error
        toast.success('อัปเดต item แล้ว')
      } else {
        const { error } = await supabase.from('gacha_items').insert({ ...editItem, pool_id: selectedPool.id })
        if (error) throw error
        toast.success('เพิ่ม item แล้ว')
      }
      setShowItemModal(false)
      fetchPools()
    } catch (e: any) {
      toast.error(e.message || 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const deletePool = async (id: string) => {
    if (!confirm('ลบตู้สุ่มนี้?')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('gacha_items').delete().eq('pool_id', id)
      await supabase.from('gacha_pools').delete().eq('id', id)
      toast.success('ลบแล้ว')
      if (selectedPool?.id === id) setSelectedPool(null)
      fetchPools()
    } catch { toast.error('ลบไม่สำเร็จ') }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('ลบ item นี้?')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('gacha_items').delete().eq('id', id)
      toast.success('ลบแล้ว')
      fetchPools()
    } catch { toast.error('ลบไม่สำเร็จ') }
  }

  const toggleActive = async (pool: GachaPool) => {
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('gacha_pools').update({ is_active: !pool.is_active }).eq('id', pool.id)
      toast.success(pool.is_active ? 'ปิดตู้สุ่มแล้ว' : 'เปิดตู้สุ่มแล้ว')
      fetchPools()
    } catch { toast.error('เกิดข้อผิดพลาด') }
  }

  const selectedPoolFull = pools.find(p => p.id === selectedPool?.id)

  const s: Record<string, any> = {
    page: { minHeight: '100vh', color: '#f1f5f9', fontFamily: 'monospace' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' },
    title: { fontSize: '22px', fontWeight: 'bold', color: '#f1f5f9', margin: 0 },
    btn: (color = '#7c3aed') => ({ background: color, border: 'none', borderRadius: '8px', padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }),
    card: { background: '#0d0d1a', border: '1px solid #1a1a2e', borderRadius: '12px', padding: '16px' },
    grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' },
    poolCard: (active: boolean) => ({ background: active ? 'rgba(139,92,246,0.08)' : '#0d0d1a', border: `1px solid ${active ? 'rgba(139,92,246,0.3)' : '#1a1a2e'}`, borderRadius: '10px', padding: '14px', cursor: 'pointer', marginBottom: '10px' }),
    badge: (color: string) => ({ background: color + '22', color, border: `1px solid ${color}44`, borderRadius: '4px', padding: '2px 8px', fontSize: '11px' }),
    input: { width: '100%', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', padding: '9px 12px', color: '#f1f5f9', fontSize: '13px', boxSizing: 'border-box' as any, outline: 'none' },
    label: { fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block' },
    modal: { position: 'fixed' as any, inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 },
    modalBox: { background: '#0d0d1a', border: '1px solid #2a2a45', borderRadius: '14px', padding: '24px', width: '520px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' as any },
  }

  return (
    <div style={s.page}>
      <div style={s.header}>
        <h1 style={s.title}>🎰 จัดการตู้สุ่ม</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={s.btn('#1e293b')} onClick={fetchPools}><RefreshCw size={14} /> รีเฟรช</button>
          <button style={s.btn()} onClick={() => { setEditPool(EMPTY_POOL); setEditingPoolId(null); setShowPoolModal(true) }}>
            <Plus size={14} /> สร้างตู้สุ่มใหม่
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: '#64748b', padding: '60px' }}>กำลังโหลด...</div>
      ) : (
        <div style={s.grid}>
          {/* Left: Pool list */}
          <div>
            <p style={{ color: '#64748b', fontSize: '12px', marginBottom: '12px' }}>ตู้สุ่มทั้งหมด ({pools.length})</p>
            {pools.length === 0 && (
              <div style={{ ...s.card, textAlign: 'center', color: '#64748b', padding: '40px' }}>
                ยังไม่มีตู้สุ่ม กดสร้างใหม่ได้เลย
              </div>
            )}
            {pools.map(pool => (
              <div key={pool.id} style={s.poolCard(selectedPool?.id === pool.id)} onClick={() => setSelectedPool(pool)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                    {/* Pool thumbnail */}
                    <div style={{ width: 36, height: 36, borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: '#1a1a2e', border: '1px solid #2a2a45', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {pool.image
                        ? <img src={pool.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <ImageIcon style={{ width: 16, height: 16, color: '#475569' }} />}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 'bold', color: '#f1f5f9', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pool.name_th || pool.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                        ฿{pool.price} · {pool.gacha_items?.length || 0} items · {pool.total_pulls} pulls
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0, marginLeft: '8px' }}>
                    <span style={s.badge(pool.is_active ? '#10b981' : '#ef4444')}>{pool.is_active ? 'เปิด' : 'ปิด'}</span>
                    <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                      onClick={e => { e.stopPropagation(); toggleActive(pool) }}>
                      {pool.is_active ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '4px' }}
                      onClick={e => {
                        e.stopPropagation()
                        setEditPool({ name: pool.name, name_th: pool.name_th, description: pool.description, description_th: pool.description_th, category: pool.category, price: pool.price, image: pool.image, is_active: pool.is_active })
                        setEditingPoolId(pool.id)
                        setShowPoolModal(true)
                      }}>
                      <Edit2 size={14} />
                    </button>
                    <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                      onClick={e => { e.stopPropagation(); deletePool(pool.id) }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Items */}
          <div>
            {!selectedPoolFull ? (
              <div style={{ ...s.card, textAlign: 'center', color: '#64748b', padding: '60px' }}>
                <Gift size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                <p>เลือกตู้สุ่มเพื่อดู items</p>
              </div>
            ) : (
              <div style={s.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#f1f5f9' }}>{selectedPoolFull.name_th || selectedPoolFull.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Items ({selectedPoolFull.gacha_items?.length || 0})</div>
                  </div>
                  <button style={s.btn()} onClick={() => { setEditItem(EMPTY_ITEM); setEditingItemId(null); setShowItemModal(true) }}>
                    <Plus size={14} /> เพิ่ม item
                  </button>
                </div>

                {(!selectedPoolFull.gacha_items || selectedPoolFull.gacha_items.length === 0) && (
                  <div style={{ textAlign: 'center', color: '#64748b', padding: '30px' }}>ยังไม่มี item</div>
                )}

                {selectedPoolFull.gacha_items?.map(item => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #1a1a2e' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                      {/* Item thumbnail */}
                      <div style={{ width: 30, height: 30, borderRadius: '6px', overflow: 'hidden', flexShrink: 0, background: '#1a1a2e', border: '1px solid #2a2a45', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {item.image && (item.image.startsWith('data:') || item.image.startsWith('http') || item.image.startsWith('/'))
                          ? <img src={item.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <span style={{ fontSize: 16 }}>{item.image || '🎁'}</span>}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={s.badge(RARITY_COLOR[item.rarity])}>{item.rarity}</span>
                          <span style={{ color: '#f1f5f9', fontSize: '13px' }}>{item.name_th || item.name}</span>
                        </div>
                        <span style={{ color: '#64748b', fontSize: '11px' }}>{item.drop_rate}% · ฿{item.value}</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
                        onClick={() => {
                          setEditItem({ name: item.name, name_th: item.name_th, rarity: item.rarity, drop_rate: item.drop_rate, image: item.image, value: item.value })
                          setEditingItemId(item.id!)
                          setShowItemModal(true)
                        }}>
                        <Edit2 size={13} />
                      </button>
                      <button style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
                        onClick={() => deleteItem(item.id!)}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Pool Modal ── */}
      {showPoolModal && (
        <div style={s.modal} onClick={() => setShowPoolModal(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#f1f5f9' }}>{editingPoolId ? 'แก้ไขตู้สุ่ม' : 'สร้างตู้สุ่มใหม่'}</h3>
              <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }} onClick={() => setShowPoolModal(false)}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gap: '14px' }}>
              {([['ชื่อ (EN)', 'name'], ['ชื่อ (TH)', 'name_th'], ['รายละเอียด (EN)', 'description'], ['รายละเอียด (TH)', 'description_th']] as [string, string][]).map(([label, key]) => (
                <div key={key}>
                  <label style={s.label}>{label}</label>
                  <input style={s.input} value={editPool[key] || ''} onChange={e => setEditPool((p: any) => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}

              {/* Image upload field */}
              <ImageUploadField
                label="รูปภาพตู้สุ่ม"
                value={editPool.image || ''}
                onChange={v => setEditPool((p: any) => ({ ...p, image: v }))}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={s.label}>ราคา (บาท)</label>
                  <input style={s.input} type="number" value={editPool.price} onChange={e => setEditPool((p: any) => ({ ...p, price: +e.target.value }))} />
                </div>
                <div>
                  <label style={s.label}>หมวดหมู่</label>
                  <select style={s.input} value={editPool.category} onChange={e => setEditPool((p: any) => ({ ...p, category: e.target.value }))}>
                    {['rov', 'freefire', 'efootball', 'pubg', 'genshin', 'roblox', 'other'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '13px', cursor: 'pointer' }}>
                <input type="checkbox" checked={editPool.is_active} onChange={e => setEditPool((p: any) => ({ ...p, is_active: e.target.checked }))} />
                เปิดให้ใช้งาน
              </label>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button style={s.btn('#1e293b')} onClick={() => setShowPoolModal(false)}>ยกเลิก</button>
              <button style={s.btn()} onClick={savePool} disabled={saving}>
                <Save size={14} /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Item Modal ── */}
      {showItemModal && (
        <div style={s.modal} onClick={() => setShowItemModal(false)}>
          <div style={s.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#f1f5f9' }}>{editingItemId ? 'แก้ไข item' : 'เพิ่ม item ใหม่'}</h3>
              <button style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }} onClick={() => setShowItemModal(false)}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gap: '14px' }}>
              {([['ชื่อ (EN)', 'name'], ['ชื่อ (TH)', 'name_th']] as [string, string][]).map(([label, key]) => (
                <div key={key}>
                  <label style={s.label}>{label}</label>
                  <input style={s.input} value={(editItem as any)[key] || ''} onChange={e => setEditItem(p => ({ ...p, [key]: e.target.value }))} />
                </div>
              ))}

              {/* Image upload field */}
              <ImageUploadField
                label="รูปภาพ item (หรือ emoji เช่น 🎁)"
                value={editItem.image || ''}
                onChange={v => setEditItem(p => ({ ...p, image: v }))}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={s.label}>Rarity</label>
                  <select style={s.input} value={editItem.rarity} onChange={e => setEditItem(p => ({ ...p, rarity: e.target.value as any }))}>
                    {['common', 'rare', 'epic', 'legendary'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label style={s.label}>อัตราดรอป (%)</label>
                  <input style={s.input} type="number" step="0.1" value={editItem.drop_rate} onChange={e => setEditItem(p => ({ ...p, drop_rate: +e.target.value }))} />
                </div>
                <div>
                  <label style={s.label}>มูลค่า (บาท)</label>
                  <input style={s.input} type="number" value={editItem.value} onChange={e => setEditItem(p => ({ ...p, value: +e.target.value }))} />
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '20px', justifyContent: 'flex-end' }}>
              <button style={s.btn('#1e293b')} onClick={() => setShowItemModal(false)}>ยกเลิก</button>
              <button style={s.btn()} onClick={saveItem} disabled={saving}>
                <Save size={14} /> {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}