'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Eye, RefreshCw, Download, ZoomIn, X, QrCode, Upload, Settings, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { formatPrice } from '@/hooks/use-locale'
import { toast } from 'sonner'
import type { Deposit } from '@/lib/types'

interface DepositWithUser extends Deposit {
  userName: string
  userEmail?: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (days > 0)  return `${days} วันที่แล้ว`
  if (hrs > 0)   return `${hrs} ชั่วโมงที่แล้ว`
  if (mins > 0)  return `${mins} นาทีที่แล้ว`
  return 'เมื่อกี้'
}

function payMethodLabel(method?: string) {
  if (method === 'promptpay')  return { label: 'PromptPay', color: '#a78bfa' }
  if (method === 'truemoney')  return { label: 'TrueMoney',  color: '#f59e0b' }
  if (method === 'bank')       return { label: 'Bank',       color: '#34d399' }
  return { label: method || '?', color: '#94a3b8' }
}

function userInitial(name: string) {
  return name.charAt(0).toUpperCase()
}

function userColor(id: string) {
  const colors = ['#7c3aed', '#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed']
  let hash = 0
  for (const c of id) hash = (hash + c.charCodeAt(0)) % colors.length
  return colors[hash]
}

export default function AdminDepositsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [deposits, setDeposits]           = useState<DepositWithUser[]>([])
  const [loading, setLoading]             = useState(true)
  const [filterStatus, setFilterStatus]   = useState('all')
  const [selected, setSelected]           = useState<DepositWithUser | null>(null)
  const [showModal, setShowModal]         = useState(false)
  const [zoomSlip, setZoomSlip]           = useState(false)
  const [adminNote, setAdminNote]         = useState('')
  const [refNumber, setRefNumber]         = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [checkedIds, setCheckedIds]       = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading]     = useState(false)
  const [newBadge, setNewBadge]           = useState(0)
  const [settingsOpen, setSettingsOpen]   = useState(false)
  const [qrUploading, setQrUploading]     = useState(false)
  const [shopSettings, setShopSettings]   = useState({ promptpay_number: '0812345678', promptpay_name: 'GameShop', promptpay_qr_url: '', bank_name: 'กสิกรไทย', bank_account: '123-4-56789-0', bank_account_name: 'นาย GameShop' })
  const lastCount = useRef(0)
  const pollRef   = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
    fetchDeposits()
    // Load shop settings from Supabase
    const loadSettings = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data } = await supabase.from('shop_settings').select('*').single()
        if (data) setShopSettings({
          promptpay_number: data.promptpay_number || '0812345678',
          promptpay_name: data.promptpay_name || 'GameShop',
          promptpay_qr_url: data.promptpay_qr_url || '',
          bank_name: data.bank_name || 'กสิกรไทย',
          bank_account: data.bank_account || '123-4-56789-0',
          bank_account_name: data.bank_account_name || 'นาย GameShop',
        })
      } catch {}
    }
    loadSettings()
  }, [user])

 // Realtime subscription
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>
    timer = setInterval(() => { fetchDeposits() }, 10_000)
    return () => clearInterval(timer)
  }, [])

  const fetchDeposits = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase.from('deposits').select('*, users(username, display_name)').order('created_at', { ascending: false })
      if (!error && data) {
        const mapped = data.map((d: any) => ({ ...d, userName: d.users?.display_name || d.users?.username || d.user_id }))
        setDeposits(mapped)
        lastCount.current = mapped.filter((d: DepositWithUser) => d.status === 'pending').length
      } else throw new Error()
    } catch {
      setDeposits([])
      lastCount.current = 0
    } finally { setLoading(false) }
  }

  const openModal = (dep: DepositWithUser) => {
    setSelected(dep)
    setAdminNote(dep.admin_note || '')
    setRefNumber('')
    setShowModal(true)
    setZoomSlip(false)
  }

  const approve = async (dep: DepositWithUser, note?: string) => {
    setActionLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const fullNote = note || adminNote
      const noteJson = JSON.stringify({ note: fullNote, ref: refNumber, reviewed_by: user?.id, reviewed_at: new Date().toISOString() })
      await supabase.rpc('approve_deposit', { p_deposit_id: dep.id, p_admin_id: user!.id })
      await supabase.from('deposits').update({ admin_note: noteJson, reviewed_at: new Date().toISOString(), reviewed_by: user!.id }).eq('id', dep.id)
      toast.success(`✅ อนุมัติ ฿${dep.amount.toLocaleString()} ให้ ${dep.userName}`)
    } catch {
      toast.success(`✅ อนุมัติ ฿${dep.amount.toLocaleString()} (offline)`)
    }
    setDeposits(d => d.map(x => x.id === dep.id ? { ...x, status: 'approved', reviewed_at: new Date().toISOString() } : x))
    setShowModal(false)
    setActionLoading(false)
  }

  const reject = async (dep: DepositWithUser) => {
    if (!adminNote.trim()) { toast.error('กรุณาระบุเหตุผลการปฏิเสธ'); return }
    setActionLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('deposits').update({ status: 'rejected', admin_note: adminNote, reviewed_by: user!.id, reviewed_at: new Date().toISOString() }).eq('id', dep.id)
      toast.error(`❌ ปฏิเสธ ฿${dep.amount.toLocaleString()}`)
    } catch { toast.error('❌ ปฏิเสธแล้ว (offline)') }
    setDeposits(d => d.map(x => x.id === dep.id ? { ...x, status: 'rejected', admin_note: adminNote } : x))
    setShowModal(false)
    setActionLoading(false)
  }

  const bulkApprove = async () => {
    setBulkLoading(true)
    const toApprove = deposits.filter(d => checkedIds.has(d.id) && d.status === 'pending')
    for (const dep of toApprove) {
      try {
        const { supabase } = await import('@/lib/supabase')
        await supabase.rpc('approve_deposit', { p_deposit_id: dep.id, p_admin_id: user!.id })
      } catch {}
      setDeposits(d => d.map(x => x.id === dep.id ? { ...x, status: 'approved' } : x))
      await new Promise(r => setTimeout(r, 200))
    }
    toast.success(`✅ อนุมัติ ${toApprove.length} รายการสำเร็จ`)
    setCheckedIds(new Set())
    setBulkLoading(false)
  }

  const saveSettings = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('shop_settings').upsert({ id: 1, ...shopSettings }, { onConflict: 'id' })
      toast.success('บันทึกการตั้งค่าแล้ว')
    } catch { toast.error('บันทึกไม่สำเร็จ') }
    setSettingsOpen(false)
  }

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setQrUploading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const path = `qr-codes/${Date.now()}.${file.name.split('.').pop()}`
      const { data } = await supabase.storage.from('qr-codes').upload(path, file, { upsert: true })
      if (data) {
        const { data: urlData } = supabase.storage.from('qr-codes').getPublicUrl(path)
        setShopSettings(s => ({ ...s, promptpay_qr_url: urlData.publicUrl }))
        toast.success('อัปโหลด QR Code สำเร็จ')
      }
    } catch { toast.error('อัปโหลดไม่สำเร็จ ลอง URL แทน') }
    setQrUploading(false)
  }

  const filtered  = filterStatus === 'all' ? deposits : deposits.filter(d => d.status === filterStatus)
  const counts    = { all: deposits.length, pending: deposits.filter(d => d.status === 'pending').length, approved: deposits.filter(d => d.status === 'approved').length, rejected: deposits.filter(d => d.status === 'rejected').length }
  const pendingAmt = deposits.filter(d => d.status === 'pending').reduce((s, d) => s + d.amount, 0)
  const checkedPending = Array.from(checkedIds).filter(id => deposits.find(d => d.id === id)?.status === 'pending').length

  const card = { background: '#0f0f1a', border: '1px solid #2a2a45', borderRadius: '12px', padding: '16px' }

  return (
    <div style={{ padding: '20px 16px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#f1f5f9', margin: 0, fontFamily: 'monospace' }}>💰 จัดการการเติมเงิน</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0', fontFamily: 'monospace' }}>
            ตรวจสลิปและอนุมัติการเติมเงิน
            {newBadge > 0 && (
              <span onClick={() => { setNewBadge(0); setFilterStatus('pending') }} style={{ marginLeft: '12px', background: '#ef4444', color: 'white', borderRadius: '999px', padding: '2px 10px', fontSize: '11px', cursor: 'pointer', animation: 'pulse 1s ease-in-out infinite' }}>
                🔴 ใหม่ {newBadge} รายการ
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => { fetchDeposits(); setNewBadge(0) }} style={{ background: 'none', border: '1px solid #2a2a45', borderRadius: '8px', padding: '8px 14px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontFamily: 'monospace' }}>
            <RefreshCw style={{ width: 14, height: 14 }} /> รีเฟรช
          </button>
          <button onClick={() => setSettingsOpen(!settingsOpen)} style={{ background: 'none', border: '1px solid #2a2a45', borderRadius: '8px', padding: '8px 14px', color: '#a78bfa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontFamily: 'monospace' }}>
            <Settings style={{ width: 14, height: 14 }} /> ตั้งค่า QR
            {settingsOpen ? <ChevronUp style={{ width: 12, height: 12 }} /> : <ChevronDown style={{ width: 12, height: 12 }} />}
          </button>
        </div>
      </div>

      {/* QR Settings Panel */}
      {settingsOpen && (
        <div style={{ ...card, marginBottom: '20px', border: '1px solid rgba(139,92,246,0.3)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#a78bfa', fontFamily: 'monospace', fontSize: '14px' }}>⚙️ ตั้งค่า QR Code / บัญชีรับเงิน</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>PROMPTPAY NUMBER</label>
              <input value={shopSettings.promptpay_number} onChange={e => setShopSettings(s => ({ ...s, promptpay_number: e.target.value }))} style={{ width: '100%', padding: '8px 12px', boxSizing: 'border-box', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', fontFamily: 'monospace', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>PROMPTPAY NAME</label>
              <input value={shopSettings.promptpay_name} onChange={e => setShopSettings(s => ({ ...s, promptpay_name: e.target.value }))} style={{ width: '100%', padding: '8px 12px', boxSizing: 'border-box', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', fontFamily: 'monospace', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>BANK ACCOUNT</label>
              <input value={shopSettings.bank_account} onChange={e => setShopSettings(s => ({ ...s, bank_account: e.target.value }))} style={{ width: '100%', padding: '8px 12px', boxSizing: 'border-box', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', fontFamily: 'monospace', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>QR CODE IMAGE URL หรือ UPLOAD</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input value={shopSettings.promptpay_qr_url} onChange={e => setShopSettings(s => ({ ...s, promptpay_qr_url: e.target.value }))} placeholder="https://..." style={{ flex: 1, padding: '8px 12px', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', fontFamily: 'monospace', outline: 'none' }} />
                <label style={{ padding: '8px 12px', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                  <Upload style={{ width: 13, height: 13 }} /> {qrUploading ? '...' : 'Upload'}
                  <input type="file" accept="image/*" onChange={handleQrUpload} style={{ display: 'none' }} />
                </label>
              </div>
            </div>
          </div>
          <button onClick={saveSettings} style={{ marginTop: '14px', padding: '10px 20px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', border: 'none', borderRadius: '8px', color: 'white', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer' }}>
            บันทึกการตั้งค่า
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {[
          { label: 'ทั้งหมด',    val: counts.all,      color: '#94a3b8', extra: null },
          { label: 'รอตรวจ',    val: counts.pending,   color: '#fbbf24', extra: pendingAmt > 0 ? `฿${pendingAmt.toLocaleString()}` : null },
          { label: 'อนุมัติแล้ว', val: counts.approved, color: '#34d399', extra: null },
          { label: 'ปฏิเสธ',    val: counts.rejected,  color: '#f87171', extra: null },
        ].map((s, i) => (
          <div key={i} style={{ ...card, textAlign: 'center', cursor: 'pointer', border: filterStatus === ['all','pending','approved','rejected'][i] ? '1px solid rgba(139,92,246,0.5)' : '1px solid #2a2a45' }}
            onClick={() => setFilterStatus(['all','pending','approved','rejected'][i])}>
            <div style={{ fontSize: '28px', fontWeight: '800', color: s.color, fontFamily: 'monospace' }}>{s.val}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>{s.label}</div>
            {s.extra && <div style={{ fontSize: '11px', color: '#fbbf24', fontFamily: 'monospace', marginTop: '4px' }}>{s.extra}</div>}
          </div>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {checkedPending > 0 && (
        <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <span style={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: '14px' }}>เลือก {checkedPending} รายการ</span>
          <button onClick={bulkApprove} disabled={bulkLoading} style={{ padding: '8px 20px', background: 'linear-gradient(135deg,#059669,#047857)', border: 'none', borderRadius: '8px', color: 'white', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '13px', cursor: bulkLoading ? 'not-allowed' : 'pointer' }}>
            {bulkLoading ? '⏳ กำลังอนุมัติ...' : `✅ อนุมัติที่เลือก (${checkedPending})`}
          </button>
        </div>
      )}

      {/* Deposit List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: '#64748b', fontFamily: 'monospace' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          กำลังโหลด...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '48px', color: '#64748b', fontFamily: 'monospace' }}>
          ไม่มีรายการ{filterStatus !== 'all' ? `ที่ ${filterStatus}` : ''}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(dep => {
            const method = payMethodLabel(dep.payment_method)
            const isChecked = checkedIds.has(dep.id)
            return (
              <div key={dep.id} style={{ ...card, display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', border: isChecked ? '1px solid rgba(139,92,246,0.4)' : '1px solid #2a2a45', transition: 'border-color 0.2s' }}>
                {/* Checkbox */}
                {dep.status === 'pending' && (
                  <input type="checkbox" checked={isChecked} onChange={e => {
                    const s = new Set(checkedIds)
                    e.target.checked ? s.add(dep.id) : s.delete(dep.id)
                    setCheckedIds(s)
                  }} style={{ width: '16px', height: '16px', accentColor: '#8b5cf6', cursor: 'pointer', flexShrink: 0 }} />
                )}

                {/* Avatar */}
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: userColor(dep.user_id), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 'bold', color: 'white', fontFamily: 'monospace', flexShrink: 0 }}>
                  {userInitial(dep.userName)}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: '120px' }}>
                  <div style={{ fontWeight: 'bold', color: '#f1f5f9', fontFamily: 'monospace', fontSize: '14px' }}>{dep.userName}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                    {timeAgo(dep.created_at)}
                    {' · '}
                    <span style={{ color: method.color }}>{method.label}</span>
                  </div>
                </div>

                {/* Amount */}
                <div style={{ fontSize: '20px', fontWeight: '900', fontFamily: 'monospace', color: dep.status === 'approved' ? '#34d399' : dep.status === 'rejected' ? '#f87171' : '#fbbf24', flexShrink: 0 }}>
                  ฿{dep.amount.toLocaleString()}
                </div>

                {/* Status Badge */}
                <div style={{ flexShrink: 0 }}>
                  {dep.status === 'pending'  && <span style={{ fontSize: '12px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '999px', padding: '3px 10px', fontFamily: 'monospace' }}>⏳ รอตรวจ</span>}
                  {dep.status === 'approved' && <span style={{ fontSize: '12px', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '999px', padding: '3px 10px', fontFamily: 'monospace' }}>✅ อนุมัติ</span>}
                  {dep.status === 'rejected' && <span style={{ fontSize: '12px', background: 'rgba(239,68,68,0.15)',  color: '#f87171', border: '1px solid rgba(239,68,68,0.3)',  borderRadius: '999px', padding: '3px 10px', fontFamily: 'monospace' }}>❌ ปฏิเสธ</span>}
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => openModal(dep)} title="ดูสลิป" style={{ padding: '7px 12px', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '7px', color: '#a78bfa', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace' }}>
                    <Eye style={{ width: 13, height: 13 }} /> ดูสลิป
                  </button>
                  {dep.status === 'pending' && (
                    <>
                      <button onClick={() => { setSelected(dep); approve(dep, '') }} disabled={actionLoading} title="อนุมัติ" style={{ padding: '7px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '7px', color: '#34d399', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace' }}>
                        <CheckCircle style={{ width: 13, height: 13 }} /> อนุมัติ
                      </button>
                      <button onClick={() => openModal(dep)} title="ปฏิเสธ" style={{ padding: '7px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '7px', color: '#f87171', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'monospace' }}>
                        <XCircle style={{ width: 13, height: 13 }} /> ปฏิเสธ
                      </button>
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ===== SLIP VERIFICATION MODAL ===== */}
      {showModal && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{ background: '#0f0f1a', border: '1px solid #2a2a45', borderRadius: '16px', width: '100%', maxWidth: '900px', maxHeight: '90vh', overflow: 'auto', boxShadow: '0 0 60px rgba(0,0,0,0.8)' }}>

            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid #2a2a45' }}>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 'bold', color: '#f1f5f9', fontFamily: 'monospace' }}>🔍 ตรวจสอบสลิปการโอนเงิน</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}><X style={{ width: 20, height: 20 }} /></button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '0' }}>

              {/* LEFT: Slip Image */}
              <div style={{ padding: '20px', borderRight: '1px solid #2a2a45', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ position: 'relative', background: '#070710', borderRadius: '12px', overflow: 'hidden', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-in' }}
                  onClick={() => setZoomSlip(true)}>
                  <img src={selected.slip_url} alt="slip" style={{ width: '100%', objectFit: 'contain', maxHeight: '400px', borderRadius: '8px' }} onError={e => { (e.target as HTMLImageElement).src = 'https://placehold.co/400x600/1a1a2e/64748b?text=NO+IMAGE' }} />
                  <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', borderRadius: '6px', padding: '4px 8px', display: 'flex', alignItems: 'center', gap: '4px', color: '#94a3b8', fontSize: '11px', fontFamily: 'monospace' }}>
                    <ZoomIn style={{ width: 12, height: 12 }} /> คลิกเพื่อซูม
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <a href={selected.slip_url} download target="_blank" rel="noreferrer" style={{ flex: 1, padding: '8px', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', color: '#94a3b8', textDecoration: 'none', fontFamily: 'monospace', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Download style={{ width: 13, height: 13 }} /> ดาวน์โหลด
                  </a>
                  <button onClick={() => setZoomSlip(true)} style={{ flex: 1, padding: '8px', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', fontFamily: 'monospace', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <ZoomIn style={{ width: 13, height: 13 }} /> ขยายภาพ
                  </button>
                </div>

                {/* Ref Number Input */}
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>🔢 เลข REF จากสลิป (ถ้ามี)</label>
                  <input value={refNumber} onChange={e => setRefNumber(e.target.value)} placeholder="xxxxxxxxxx" style={{ width: '100%', padding: '8px 12px', boxSizing: 'border-box', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', fontFamily: 'monospace', outline: 'none' }} />
                </div>

                {/* Quick checks */}
                <div style={{ background: '#070710', border: '1px solid #1a1a2e', borderRadius: '8px', padding: '12px' }}>
                  {['ยอดตรงกับที่สั่ง', 'บัญชีปลายทางถูกต้อง', 'เวลาโอนสมเหตุสมผล'].map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: i < 2 ? '8px' : 0, fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>
                      <span style={{ color: '#64748b' }}>☐</span> {c}
                    </div>
                  ))}
                </div>
              </div>

              {/* RIGHT: Deposit Info + Actions */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ background: '#070710', border: '1px solid #1a1a2e', borderRadius: '12px', padding: '16px' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '13px', color: '#64748b', fontFamily: 'monospace', letterSpacing: '0.05em' }}>📋 ข้อมูลการเติมเงิน</h3>
                  {[
                    ['ผู้โอน', selected.userName],
                    ['จำนวน', `฿${selected.amount.toLocaleString()}`],
                    ['ช่องทาง', payMethodLabel(selected.payment_method).label],
                    ['เวลาส่ง', selected.slip_uploaded_at ? new Date(selected.slip_uploaded_at).toLocaleString('th-TH') : new Date(selected.created_at).toLocaleString('th-TH')],
                    ['สถานะ', selected.status],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', fontFamily: 'monospace' }}>
                      <span style={{ color: '#64748b' }}>{k}:</span>
                      <span style={{ color: '#f1f5f9', fontWeight: 'bold', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-all' }}>{v}</span>
                    </div>
                  ))}
                </div>

                {/* QR Code reference */}
                <div style={{ background: '#070710', border: '1px solid #1a1a2e', borderRadius: '12px', padding: '16px' }}>
                  <h3 style={{ margin: '0 0 10px', fontSize: '13px', color: '#64748b', fontFamily: 'monospace', letterSpacing: '0.05em' }}>📊 บัญชีที่ใช้รับเงิน</h3>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    {shopSettings.promptpay_qr_url ? (
                      <img src={shopSettings.promptpay_qr_url} alt="QR" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'contain', background: 'white', padding: '4px' }} />
                    ) : (
                      <div style={{ width: '60px', height: '60px', background: '#2a2a45', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <QrCode style={{ width: 28, height: 28, color: '#64748b' }} />
                      </div>
                    )}
                    <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#94a3b8' }}>
                      <div style={{ color: '#a78bfa', fontWeight: 'bold', marginBottom: '2px' }}>PromptPay: {shopSettings.promptpay_number}</div>
                      <div style={{ marginBottom: '4px' }}>{shopSettings.promptpay_name}</div>
                      <div style={{ color: '#64748b' }}>KBank: {shopSettings.bank_account}</div>
                    </div>
                  </div>
                </div>

                {/* Admin Note */}
                <div>
                  <label style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', display: 'block', marginBottom: '6px', letterSpacing: '0.05em' }}>📝 หมายเหตุแอดมิน {selected.status === 'pending' ? '(ต้องกรอกหากปฏิเสธ)' : ''}</label>
                  <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} placeholder="ระบุเหตุผลหรือหมายเหตุ..." rows={3} style={{ width: '100%', padding: '10px 12px', boxSizing: 'border-box', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', fontFamily: 'monospace', resize: 'vertical', outline: 'none' }} />
                </div>

                {/* Action Buttons */}
                {selected.status === 'pending' ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => approve(selected)} disabled={actionLoading} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg,#059669,#047857)', border: 'none', borderRadius: '10px', color: 'white', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '15px', cursor: actionLoading ? 'not-allowed' : 'pointer', boxShadow: '0 0 20px rgba(16,185,129,0.25)' }}>
                      {actionLoading ? '...' : '✅ อนุมัติ'}
                    </button>
                    <button onClick={() => reject(selected)} disabled={actionLoading} style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', borderRadius: '10px', color: 'white', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '15px', cursor: actionLoading ? 'not-allowed' : 'pointer', boxShadow: '0 0 20px rgba(239,68,68,0.25)' }}>
                      {actionLoading ? '...' : '❌ ปฏิเสธ'}
                    </button>
                  </div>
                ) : (
                  <div style={{ padding: '14px', background: selected.status === 'approved' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${selected.status === 'approved' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: '10px', textAlign: 'center', fontFamily: 'monospace', fontSize: '14px', color: selected.status === 'approved' ? '#34d399' : '#f87171' }}>
                    {selected.status === 'approved' ? '✅ อนุมัติแล้ว' : '❌ ปฏิเสธแล้ว'}
                    {selected.reviewed_at && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{new Date(selected.reviewed_at).toLocaleString('th-TH')}</div>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoom Overlay */}
      {zoomSlip && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
          onClick={() => setZoomSlip(false)}>
          <img src={selected.slip_url} alt="slip-zoom" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: '12px' }} />
          <button onClick={() => setZoomSlip(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.6)', border: 'none', color: 'white', cursor: 'pointer', padding: '8px', borderRadius: '50%' }}>
            <X style={{ width: 20, height: 20 }} />
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.7} }
        input:focus, textarea:focus { border-color: #8b5cf6 !important; box-shadow: 0 0 0 2px rgba(139,92,246,0.15) !important; }
        @media (max-width: 640px) {
          .modal-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
