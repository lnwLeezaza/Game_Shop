'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { formatPrice } from '@/hooks/use-locale'
import { toast } from 'sonner'

interface Withdrawal {
  id: string; userName: string; amount: number; bank_name: string
  bank_account: string; status: string; created_at: string; admin_note?: string
}

export default function AdminWithdrawalsPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const [withdrawals, setWithdrawals]   = useState<Withdrawal[]>([])
  const [loading, setLoading]           = useState(true)
  const [selected, setSelected]         = useState<Withdrawal | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject]     = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
    fetchWithdrawals()
  }, [user])

  const fetchWithdrawals = async () => {
    setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data, error } = await supabase
        .from('withdrawals').select('*, users!withdrawals_user_id_fkey(username, display_name)').order('created_at', { ascending: false })
      if (!error && data) {
        setWithdrawals(data.map((w: any) => ({ ...w, userName: w.users?.display_name || w.users?.username || w.user_id })))
      }
    } catch {
      setWithdrawals([
        { id: 'w1', userName: 'ร้าน TopSeller', amount: 2000, bank_name: 'กสิกรไทย', bank_account: '123-4-56789-0', status: 'pending',  created_at: new Date().toISOString() },
        { id: 'w2', userName: 'นักช้อป',       amount: 500,  bank_name: 'ไทยพาณิชย์', bank_account: '987-6-54321-0', status: 'approved', created_at: new Date(Date.now()-86400000).toISOString() },
      ])
    } finally { setLoading(false) }
  }

  const approve = async (w: Withdrawal) => {
    setActionLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.rpc('approve_withdrawal', { p_withdrawal_id: w.id, p_admin_id: user!.id })
      toast.success(`✅ อนุมัติถอน ฿${w.amount.toLocaleString()} สำเร็จ`)
    } catch { toast.success(`✅ อนุมัติถอน ฿${w.amount.toLocaleString()} (offline)`) }
    setWithdrawals(arr => arr.map(x => x.id === w.id ? { ...x, status: 'approved' } : x))
    setActionLoading(false)
  }

  const reject = async () => {
    if (!selected) return
    setActionLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('withdrawals').update({ status: 'rejected', admin_note: rejectReason, reviewed_by: user!.id }).eq('id', selected.id)
    } catch {}
    setWithdrawals(arr => arr.map(x => x.id === selected.id ? { ...x, status: 'rejected' } : x))
    toast.error('❌ ปฏิเสธแล้ว')
    setShowReject(false); setRejectReason(''); setActionLoading(false)
  }

  const filtered = filterStatus === 'all' ? withdrawals : withdrawals.filter(w => w.status === filterStatus)
  const counts = { all: withdrawals.length, pending: withdrawals.filter(w => w.status==='pending').length, approved: withdrawals.filter(w => w.status==='approved').length, rejected: withdrawals.filter(w => w.status==='rejected').length }
  const cardStyle = { background: '#0f0f1a', border: '1px solid #2a2a45', borderRadius: '12px', padding: '16px' }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '800', color: '#f1f5f9', margin: 0 }}>💸 จัดการการถอนเงิน</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>ตรวจสอบและอนุมัติการถอนเงินของ seller</p>
        </div>
        <button onClick={fetchWithdrawals} style={{ background: 'none', border: '1px solid #2a2a45', borderRadius: '8px', padding: '8px 14px', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
          <RefreshCw style={{ width: 14, height: 14 }} /> รีเฟรช
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'ทั้งหมด', val: counts.all, color: '#94a3b8', bg: '#1a1a2e' },
          { label: 'รออนุมัติ', val: counts.pending, color: '#fbbf24', bg: 'rgba(245,158,11,0.1)' },
          { label: 'อนุมัติแล้ว', val: counts.approved, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
          { label: 'ปฏิเสธ', val: counts.rejected, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
        ].map((s, i) => (
          <div key={i} style={{ ...cardStyle, background: s.bg, textAlign: 'center', cursor: 'pointer', border: `1px solid ${s.color}30` }} onClick={() => setFilterStatus(['all','pending','approved','rejected'][i])}>
            <div style={{ fontSize: '24px', fontWeight: '800', color: s.color }}>{s.val}</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>กำลังโหลด...</div>
      ) : filtered.length === 0 ? (
        <div style={{ ...cardStyle, textAlign: 'center', padding: '40px', color: '#64748b' }}>ไม่มีรายการ</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(w => (
            <div key={w.id} style={{ ...cardStyle, display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <div style={{ fontWeight: '700', color: '#f1f5f9', fontSize: '15px' }}>{w.userName}</div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '2px' }}>
                  <strong style={{ color: '#a78bfa' }}>฿{w.amount.toLocaleString()}</strong>
                  {' · '}{w.bank_name} {w.bank_account}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{new Date(w.created_at).toLocaleString('th-TH')}</div>
                {w.admin_note && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>หมายเหตุ: {w.admin_note}</div>}
              </div>
              <span style={{
                fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '999px',
                background: w.status==='approved' ? 'rgba(16,185,129,0.15)' : w.status==='rejected' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                color: w.status==='approved' ? '#34d399' : w.status==='rejected' ? '#f87171' : '#fbbf24',
                border: `1px solid ${w.status==='approved' ? 'rgba(16,185,129,0.3)' : w.status==='rejected' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
              }}>
                {w.status==='pending' ? '⏳ รอ' : w.status==='approved' ? '✅ อนุมัติ' : '❌ ปฏิเสธ'}
              </span>
              {w.status === 'pending' && (
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  <button disabled={actionLoading} onClick={() => approve(w)} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#10b981', cursor: 'pointer', color: '#fff', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle style={{ width: 14, height: 14 }} /> อนุมัติ
                  </button>
                  <button disabled={actionLoading} onClick={() => { setSelected(w); setShowReject(true) }} style={{ padding: '7px 14px', borderRadius: '8px', border: 'none', background: '#ef4444', cursor: 'pointer', color: '#fff', fontWeight: '700', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <XCircle style={{ width: 14, height: 14 }} /> ปฏิเสธ
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showReject && selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#0f0f1a', border: '1px solid #2a2a45', borderRadius: '16px', padding: '24px', maxWidth: '360px', width: '90%' }}>
            <h3 style={{ color: '#f1f5f9', margin: '0 0 12px' }}>เหตุผลในการปฏิเสธ</h3>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '12px' }}>{selected.userName} · ฿{selected.amount.toLocaleString()}</p>
            <textarea placeholder="ระบุเหตุผล..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} style={{ width: '100%', boxSizing: 'border-box', padding: '10px', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', color: '#f1f5f9', resize: 'vertical', fontSize: '14px' }} />
            <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
              <button onClick={() => { setShowReject(false); setRejectReason('') }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #2a2a45', background: '#1a1a2e', color: '#94a3b8', cursor: 'pointer' }}>ยกเลิก</button>
              <button onClick={reject} disabled={actionLoading} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#ef4444', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>ยืนยัน</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
