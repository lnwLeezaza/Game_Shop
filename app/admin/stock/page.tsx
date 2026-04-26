'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'
import { Plus, Trash2, Search, RefreshCw, Package, Eye, EyeOff, Copy, X } from 'lucide-react'

interface StockItem {
  id: string
  game_category: string
  account_id: string
  account_password: string
  note?: string
  status: 'available' | 'sold' | 'reserved'
  order_id?: string
  created_at: string
}

const GAME_CATEGORIES = [
  { value: 'rov', label: '⚔️ RoV', color: '#f97316' },
  { value: 'freefire', label: '🔥 Free Fire', color: '#fbbf24' },
  { value: 'efootball', label: '⚽ eFootball', color: '#34d399' },
  { value: 'pubg', label: '🎯 PUBG', color: '#f59e0b' },
  { value: 'genshin', label: '✨ Genshin', color: '#60a5fa' },
  { value: 'roblox', label: '🧱 Roblox', color: '#f87171' },
  { value: 'other', label: '🎮 อื่นๆ', color: '#94a3b8' },
]

const STATUS_INFO: Record<string, { bg: string; color: string; label: string }> = {
  available: { bg: 'rgba(16,185,129,0.12)', color: '#34d399', label: '✅ พร้อมขาย' },
  sold: { bg: 'rgba(100,116,139,0.12)', color: '#94a3b8', label: '🔒 ขายแล้ว' },
  reserved: { bg: 'rgba(245,158,11,0.12)', color: '#fbbf24', label: '⏳ จอง' },
}

export default function AdminStockPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [stock, setStock] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showPassId, setShowPassId] = useState<string | null>(null)
  const [addMode, setAddMode] = useState<'single' | 'bulk'>('single')
  const [singleForm, setSingleForm] = useState({ game_category: 'rov', account_id: '', account_password: '', note: '' })
  const [bulkText, setBulkText] = useState('')
  const [bulkCategory, setBulkCategory] = useState('rov')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
    fetchStock()
  }, [user])

  const fetchStock = useCallback(async () => {
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data } = await supabase.from('stock_items').select('*').order('created_at', { ascending: false })
      setStock(data || [])
    } catch { toast.error('โหลดไม่สำเร็จ') }
    finally { setLoading(false) }
  }, [])

  const addSingle = async () => {
    if (!singleForm.account_id || !singleForm.account_password) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return }
    setSaving(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase.from('stock_items').insert({
        game_category: singleForm.game_category,
        account_id: singleForm.account_id,
        account_password: singleForm.account_password,
        note: singleForm.note || null,
        status: 'available',
      })
      if (error) throw error
      toast.success('เพิ่มแล้ว')
      setSingleForm({ game_category: 'rov', account_id: '', account_password: '', note: '' })
      setShowAddModal(false)
      fetchStock()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const addBulk = async () => {
    if (!bulkText.trim()) { toast.error('กรุณากรอกข้อมูล'); return }
    const lines = bulkText.trim().split('\n').filter(l => l.trim())
    const items = lines.map(line => {
      const parts = line.split('|').map(p => p.trim())
      return { game_category: bulkCategory, account_id: parts[0] || '', account_password: parts[1] || '', note: parts[2] || null, status: 'available' }
    }).filter(i => i.account_id && i.account_password)
    if (items.length === 0) { toast.error('รูปแบบไม่ถูกต้อง'); return }
    setSaving(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { error } = await supabase.from('stock_items').insert(items)
      if (error) throw error
      toast.success(`เพิ่ม ${items.length} รายการแล้ว`)
      setBulkText(''); setShowAddModal(false); fetchStock()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  const deleteItem = async (id: string) => {
    if (!confirm('ลบ stock นี้?')) return
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('stock_items').delete().eq('id', id)
      toast.success('ลบแล้ว')
      setStock(s => s.filter(x => x.id !== id))
    } catch { toast.error('ลบไม่สำเร็จ') }
  }

  const copyText = (text: string) => { navigator.clipboard.writeText(text); toast.success('คัดลอกแล้ว') }

  const filtered = stock.filter(s => {
    if (filterCat !== 'all' && s.game_category !== filterCat) return false
    if (filterStatus !== 'all' && s.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return s.account_id.toLowerCase().includes(q) || s.order_id?.includes(q) || false
    }
    return true
  })

  const poolStats = GAME_CATEGORIES.map(cat => ({
    ...cat,
    available: stock.filter(s => s.game_category === cat.value && s.status === 'available').length,
    total: stock.filter(s => s.game_category === cat.value).length,
  }))

  const st: Record<string, any> = {
    card: { background: '#0d0d1a', border: '1px solid #1a1a2e', borderRadius: '12px', padding: '16px' },
    input: { width: '100%', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', padding: '9px 12px', color: '#f1f5f9', fontSize: '13px', outline: 'none', boxSizing: 'border-box' as const },
    label: { fontSize: '11px', color: '#64748b', display: 'block', marginBottom: '5px' },
    btn: (c = '#7c3aed') => ({ background: c, border: 'none', borderRadius: '8px', padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }),
    modal: { position: 'fixed' as const, inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' },
    modalBox: { background: '#0d0d1a', border: '1px solid #2a2a45', borderRadius: '14px', padding: '24px', width: '520px', maxWidth: '95vw', maxHeight: '85vh', overflowY: 'auto' as const },
  }

  return (
    <div style={{ color: '#f1f5f9', fontFamily: 'monospace' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>📦 จัดการสต็อก</h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>บัญชีเกมแบ่งตาม Pool ประเภท</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={st.btn('#1e293b')} onClick={fetchStock}><RefreshCw size={14} /> รีเฟรช</button>
          <button style={st.btn()} onClick={() => setShowAddModal(true)}><Plus size={14} /> เพิ่ม Stock</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))', gap: '10px', marginBottom: '20px' }}>
        {poolStats.map(cat => (
          <div key={cat.value} onClick={() => setFilterCat(filterCat === cat.value ? 'all' : cat.value)}
            style={{ ...st.card, cursor: 'pointer', textAlign: 'center', padding: '12px', border: filterCat === cat.value ? `1px solid ${cat.color}44` : '1px solid #1a1a2e', background: filterCat === cat.value ? cat.color + '11' : '#0d0d1a' }}>
            <div style={{ fontSize: '18px', marginBottom: '4px' }}>{cat.label.split(' ')[0]}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: cat.color }}>{cat.available}</div>
            <div style={{ fontSize: '10px', color: '#64748b' }}>/ {cat.total} พร้อมขาย</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{cat.label.split(' ').slice(1).join(' ')}</div>
          </div>
        ))}
      </div>

      <div style={{ ...st.card, marginBottom: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input style={{ ...st.input, paddingLeft: '32px' }} placeholder="ค้นหา ID, Order..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select style={{ ...st.input, width: 'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">ทุกสถานะ</option>
          <option value="available">พร้อมขาย</option>
          <option value="sold">ขายแล้ว</option>
        </select>
        <span style={{ fontSize: '12px', color: '#64748b' }}>{filtered.length} รายการ</span>
      </div>

      {loading ? (
        <div style={{ ...st.card, textAlign: 'center', padding: '60px', color: '#64748b' }}>กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...st.card, textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <p>ไม่มี stock ในหมวดนี้</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(item => {
            const cat = GAME_CATEGORIES.find(c => c.value === item.game_category)
            const statusInfo = STATUS_INFO[item.status]
            const isRevealed = showPassId === item.id
            return (
              <div key={item.id} style={{ ...st.card, display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', borderLeft: `3px solid ${cat?.color || '#64748b'}` }}>
                <div style={{ minWidth: '80px', fontSize: '12px', color: cat?.color, fontWeight: 700 }}>{cat?.label}</div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Account ID</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#f1f5f9' }}>{item.account_id}</span>
                    <button onClick={() => copyText(item.account_id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}><Copy size={12} /></button>
                  </div>
                </div>
                <div style={{ minWidth: '160px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Password</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13px', color: '#f1f5f9' }}>{isRevealed ? item.account_password : '••••••••'}</span>
                    <button onClick={() => setShowPassId(isRevealed ? null : item.id)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}>
                      {isRevealed ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                    {isRevealed && <button onClick={() => copyText(item.account_password)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: '2px' }}><Copy size={12} /></button>}
                  </div>
                </div>
                {item.note && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{item.note}</div>}
                <div style={{ fontSize: '11px', color: '#64748b', minWidth: '80px' }}>
                  {new Date(item.created_at).toLocaleDateString('th-TH')}
                  {item.order_id && <div style={{ color: '#8b5cf6' }}>#{item.order_id.slice(0,8)}</div>}
                </div>
                <span style={{ background: statusInfo.bg, color: statusInfo.color, borderRadius: '999px', padding: '3px 10px', fontSize: '11px', fontWeight: 600, flexShrink: 0 }}>
                  {statusInfo.label}
                </span>
                {item.status === 'available' && (
                  <button onClick={() => deleteItem(item.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}><Trash2 size={14} /></button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {showAddModal && (
        <div style={st.modal} onClick={() => setShowAddModal(false)}>
          <div style={st.modalBox} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, color: '#f1f5f9' }}>📦 เพิ่ม Stock</h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', gap: '4px', background: '#1a1a2e', borderRadius: '8px', padding: '4px', marginBottom: '20px' }}>
              {(['single', 'bulk'] as const).map(m => (
                <button key={m} onClick={() => setAddMode(m)} style={{ flex: 1, padding: '8px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 600, background: addMode === m ? '#2a2a45' : 'transparent', color: addMode === m ? '#f1f5f9' : '#64748b' }}>
                  {m === 'single' ? '➕ ทีละรายการ' : '📋 หลายรายการ'}
                </button>
              ))}
            </div>

            {addMode === 'single' ? (
              <div style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label style={st.label}>ประเภทเกม (Pool) *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
                    {GAME_CATEGORIES.map(cat => (
                      <button key={cat.value} onClick={() => setSingleForm(f => ({ ...f, game_category: cat.value }))}
                        style={{ padding: '8px 4px', borderRadius: '8px', border: `1px solid ${singleForm.game_category === cat.value ? cat.color : '#2a2a45'}`, background: singleForm.game_category === cat.value ? cat.color + '22' : '#1a1a2e', color: singleForm.game_category === cat.value ? cat.color : '#64748b', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={st.label}>Account ID *</label>
                  <input style={st.input} value={singleForm.account_id} onChange={e => setSingleForm(f => ({ ...f, account_id: e.target.value }))} placeholder="เช่น player123" />
                </div>
                <div>
                  <label style={st.label}>รหัสผ่าน *</label>
                  <input style={st.input} value={singleForm.account_password} onChange={e => setSingleForm(f => ({ ...f, account_password: e.target.value }))} placeholder="รหัสผ่าน" />
                </div>
                <div>
                  <label style={st.label}>หมายเหตุ</label>
                  <input style={st.input} value={singleForm.note} onChange={e => setSingleForm(f => ({ ...f, note: e.target.value }))} placeholder="เช่น เซิร์ฟ Asia" />
                </div>
                <button style={{ ...st.btn(), justifyContent: 'center', width: '100%', padding: '12px' }} onClick={addSingle} disabled={saving}>
                  {saving ? 'กำลังบันทึก...' : '✅ บันทึก'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '14px' }}>
                <div>
                  <label style={st.label}>ประเภทเกม (Pool) *</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px' }}>
                    {GAME_CATEGORIES.map(cat => (
                      <button key={cat.value} onClick={() => setBulkCategory(cat.value)}
                        style={{ padding: '8px 4px', borderRadius: '8px', border: `1px solid ${bulkCategory === cat.value ? cat.color : '#2a2a45'}`, background: bulkCategory === cat.value ? cat.color + '22' : '#1a1a2e', color: bulkCategory === cat.value ? cat.color : '#64748b', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={st.label}>ข้อมูล (account_id|password|หมายเหตุ) — 1 บรรทัด/รายการ</label>
                  <textarea style={{ ...st.input, height: '160px', resize: 'vertical' as const }} value={bulkText} onChange={e => setBulkText(e.target.value)} placeholder={"player001|pass123\nplayer002|pass456\nplayer003|pass789"} />
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                    {bulkText.trim() ? `${bulkText.trim().split('\n').filter(l => l.trim()).length} รายการ` : ''}
                  </div>
                </div>
                <button style={{ ...st.btn(), justifyContent: 'center', width: '100%', padding: '12px' }} onClick={addBulk} disabled={saving}>
                  {saving ? 'กำลังบันทึก...' : '✅ เพิ่มทั้งหมด'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
