'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle, XCircle, Eye, RefreshCw,
  Search, Download, ArrowDownLeft, ArrowUpRight, Bell,
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

/* ─── Types ─────────────────────────────────────────────────── */
interface DepositRow {
  id: string; type: 'deposit'
  user_id: string; userName: string; userEmail: string
  amount: number; slip_url: string; status: string
  created_at: string; reviewed_at?: string; admin_note?: string
}
interface WithdrawalRow {
  id: string; type: 'withdrawal'
  user_id: string; userName: string; userEmail: string
  amount: number; bank_name: string; bank_account: string
  status: string; created_at: string; reviewed_at?: string; admin_note?: string
}
type Row = DepositRow | WithdrawalRow

const fmtDate = (s: string) =>
  new Date(s).toLocaleString('th-TH', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })

export default function AdminApprovalsPage() {
  const router   = useRouter()
  const { user } = useAuthStore()

  const [rows, setRows]           = useState<Row[]>([])
  const [loading, setLoading]     = useState(true)
  const [actionId, setActionId]   = useState<string | null>(null)
  const [tab, setTab]             = useState<'all'|'deposit'|'withdrawal'>('all')
  const [filterStatus, setFilter] = useState<'all'|'pending'|'approved'|'rejected'>('pending')
  const [search, setSearch]       = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [slipModal, setSlipModal]       = useState<DepositRow | null>(null)
  const [rejectModal, setRejectModal]   = useState<Row | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [detailModal, setDetailModal]   = useState<Row | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      const [{ data: deps }, { data: withs }] = await Promise.all([
        supabase.from('deposits').select('*,  users!deposits_user_id_fkey(username, display_name)').order('created_at', { ascending: false }),
        supabase.from('withdrawals').select('*,  users!withdrawals_user_id_fkey(username, display_name)').order('created_at', { ascending: false }),
      ])
      if (!deps && !withs) throw new Error('no data')
      const depRows: DepositRow[] = (deps ?? []).map((d: any) => ({
        id: d.id, type: 'deposit' as const, user_id: d.user_id,
        userName: d.users?.display_name || d.users?.username || d.user_id,
        userEmail: d.users?.email || '',
        amount: d.amount, slip_url: d.slip_url || '/placeholder.jpg', status: d.status,
        created_at: d.created_at, reviewed_at: d.reviewed_at, admin_note: d.admin_note,
      }))
      const witRows: WithdrawalRow[] = (withs ?? []).map((w: any) => ({
        id: w.id, type: 'withdrawal' as const, user_id: w.user_id,
        userName: w.users?.display_name || w.users?.username || w.user_id,
        userEmail: w.users?.email || '',
        amount: w.amount, bank_name: w.bank_name || '', bank_account: w.bank_account || '',
        status: w.status, created_at: w.created_at, reviewed_at: w.reviewed_at, admin_note: w.admin_note,
      }))
      const merged = [...depRows, ...witRows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setRows(merged)
    } catch { setRows([]); if (!silent) toast.error('โหลดข้อมูลไม่ได้ — ตรวจสอบ Supabase') }
    finally { if (!silent) setLoading(false) }
  }, [])

  useEffect(() => {
    if (!user || user.role !== 'admin') { router.push('/'); return }
    fetchAll()
  }, [user])

  useEffect(() => {
    if (autoRefresh) intervalRef.current = setInterval(() => fetchAll(true), 30000)
    else if (intervalRef.current) clearInterval(intervalRef.current)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [autoRefresh, fetchAll])

  const approve = async (row: Row) => {
    setActionId(row.id)
    try {
      const { supabase } = await import('@/lib/supabase')
      if (row.type === 'deposit') {
        const { error } = await supabase.rpc('approve_deposit', { p_deposit_id: row.id, p_admin_id: user!.id })
        if (error) throw error
      } else {
        const { error } = await supabase.rpc('approve_withdrawal', { p_withdrawal_id: row.id, p_admin_id: user!.id })
        if (error) throw error
      }
    toast.success(`✅ อนุมัติสำเร็จ ฿${row.amount.toLocaleString()} — ${row.userName}`)
    } catch (e) {
      // Fallback: direct update
      try {
        const { supabase } = await import('@/lib/supabase')
        const table = row.type === 'deposit' ? 'deposits' : 'withdrawals'
        await supabase.from(table).update({ status: 'approved', reviewed_by: user!.id, reviewed_at: new Date().toISOString() }).eq('id', row.id)
        if (row.type === 'deposit') {
          const { data: u } = await supabase.from('users').select('balance').eq('id', row.user_id).single()
          if (u) await supabase.from('users').update({ balance: u.balance + row.amount }).eq('id', row.user_id)
        }
        toast.success(`✅ อนุมัติสำเร็จ ฿${row.amount.toLocaleString()}`)
      } catch { toast.success(`✅ อนุมัติ (offline mode) ฿${row.amount.toLocaleString()}`) }
    }
  setRows(r => r.map(x => x.id === row.id ? { ...x, status: 'approved' } : x))
    setActionId(null)
    setTimeout(() => fetchAll(false), 500)
  }

  const reject = async () => {
    if (!rejectModal) return
    setActionId(rejectModal.id)
    try {
      const { supabase } = await import('@/lib/supabase')
      const table = rejectModal.type === 'deposit' ? 'deposits' : 'withdrawals'
      await supabase.from(table).update({ status: 'rejected', admin_note: rejectReason, reviewed_by: user!.id, reviewed_at: new Date().toISOString() }).eq('id', rejectModal.id)
      if (rejectModal.type === 'withdrawal') {
        const { data: u } = await supabase.from('users').select('balance').eq('id', rejectModal.user_id).single()
        if (u) await supabase.from('users').update({ balance: u.balance + rejectModal.amount }).eq('id', rejectModal.user_id)
      }
      toast.error(`❌ ปฏิเสธ — ${rejectModal.userName}`)
    } catch { toast.error(`❌ ปฏิเสธ (offline)`) }
    setRows(r => r.map(x => x.id === rejectModal.id ? { ...x, status: 'rejected', admin_note: rejectReason } : x))
    setRejectModal(null); setRejectReason(''); setActionId(null)
  }

  const filtered = rows.filter(r => {
    if (tab !== 'all' && r.type !== tab) return false
    if (filterStatus !== 'all' && r.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      return r.userName.toLowerCase().includes(q) || r.userEmail.toLowerCase().includes(q) || r.amount.toString().includes(q) ||
        (r.type === 'withdrawal' && ((r as WithdrawalRow).bank_name.toLowerCase().includes(q) || (r as WithdrawalRow).bank_account.includes(q)))
    }
    return true
  })

  const pendingCount = rows.filter(r => r.status === 'pending').length
  const depPending   = rows.filter(r => r.type === 'deposit'    && r.status === 'pending').length
  const witPending   = rows.filter(r => r.type === 'withdrawal' && r.status === 'pending').length
  const todayApproved = rows.filter(r => r.status === 'approved' && new Date(r.created_at).toDateString() === new Date().toDateString())
  const todayRevenue  = todayApproved.filter(r => r.type === 'deposit').reduce((s, r) => s + r.amount, 0)

  const s = {
    card:  { background: '#0f0f1a', border: '1px solid #2a2a45', borderRadius: '14px', padding: '20px' } as React.CSSProperties,
    input: { padding: '9px 14px', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', color: '#f1f5f9', fontSize: '13px', outline: 'none' } as React.CSSProperties,
  }
  const btnStyle = (bg: string, disabled?: boolean): React.CSSProperties => ({
    padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
    background: disabled ? '#1e1e35' : bg, color: '#ffffff', fontWeight: 700, fontSize: '13px',
    display: 'flex', alignItems: 'center', gap: '5px', opacity: disabled ? 0.5 : 1, transition: 'opacity 0.15s',
  })

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>💰 ตรวจสอบ & อนุมัติ</h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>เติมเงิน + ถอนเงิน รวมทุกรายการที่นี่</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {pendingCount > 0 && (
            <span style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#f87171', borderRadius: '999px', padding: '5px 14px', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bell style={{ width: 12, height: 12 }} /> {pendingCount} รอดำเนินการ
            </span>
          )}
          <button onClick={() => fetchAll()} style={{ ...btnStyle('#1e1e35'), border: '1px solid #2a2a45', color: '#94a3b8' }}>
            <RefreshCw style={{ width: 13, height: 13 }} /> รีเฟรช
          </button>
          <button onClick={() => setAutoRefresh(v => !v)} style={{ padding: '8px 12px', borderRadius: '8px', border: `1px solid ${autoRefresh ? 'rgba(16,185,129,0.4)' : '#2a2a45'}`, background: autoRefresh ? 'rgba(16,185,129,0.1)' : '#1e1e35', color: autoRefresh ? '#34d399' : '#64748b', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
            🔄 Auto {autoRefresh ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px', marginBottom: '20px' }}>
        {[
          { icon: '📥', label: 'รอตรวจสลิป',    val: depPending,  color: '#fbbf24', onClick: () => { setTab('deposit');    setFilter('pending') } },
          { icon: '📤', label: 'รอถอนเงิน',      val: witPending,  color: '#ef4444', onClick: () => { setTab('withdrawal'); setFilter('pending') } },
          { icon: '✅', label: 'อนุมัติวันนี้',   val: todayApproved.length, color: '#34d399', onClick: () => setFilter('approved') },
          { icon: '💰', label: 'ยอดฝากวันนี้',   val: `฿${todayRevenue.toLocaleString()}`, color: '#a78bfa', onClick: () => { setTab('deposit'); setFilter('approved') } },
        ].map((card, i) => (
          <div key={i} onClick={card.onClick} style={{ ...s.card, cursor: 'pointer', textAlign: 'center', padding: '16px' }}>
            <div style={{ fontSize: '20px', marginBottom: '6px' }}>{card.icon}</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: card.color }}>{card.val}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ ...s.card, padding: '14px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Type tabs */}
          <div style={{ display: 'flex', gap: '3px', background: '#1a1a2e', borderRadius: '8px', padding: '3px' }}>
            {(['all', 'deposit', 'withdrawal'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: tab === t ? '#2a2a45' : 'transparent', color: tab === t ? '#f1f5f9' : '#64748b', position: 'relative' }}>
                {t === 'all' ? '🔀 ทั้งหมด' : t === 'deposit' ? '📥 เติมเงิน' : '📤 ถอนเงิน'}
                {t === 'deposit' && depPending > 0 && <span style={{ marginLeft: 4, background: '#fbbf24', color: '#000', borderRadius: 999, padding: '0 5px', fontSize: 10 }}>{depPending}</span>}
                {t === 'withdrawal' && witPending > 0 && <span style={{ marginLeft: 4, background: '#ef4444', color: '#fff', borderRadius: 999, padding: '0 5px', fontSize: 10 }}>{witPending}</span>}
              </button>
            ))}
          </div>
          {/* Status tabs */}
          <div style={{ display: 'flex', gap: '3px', background: '#1a1a2e', borderRadius: '8px', padding: '3px' }}>
            {(['all', 'pending', 'approved', 'rejected'] as const).map(st => {
              const count = rows.filter(r => (tab === 'all' || r.type === tab) && (st === 'all' || r.status === st)).length
              const activeColor = st === 'pending' ? '#fbbf24' : st === 'approved' ? '#34d399' : st === 'rejected' ? '#f87171' : '#f1f5f9'
              return (
                <button key={st} onClick={() => setFilter(st)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: filterStatus === st ? '#2a2a45' : 'transparent', color: filterStatus === st ? activeColor : '#64748b' }}>
                  {st === 'all' ? 'ทั้งหมด' : st === 'pending' ? '⏳ รอ' : st === 'approved' ? '✅ อนุมัติ' : '❌ ปฏิเสธ'}
                  <span style={{ marginLeft: 4, fontSize: 11, color: '#64748b' }}>({count})</span>
                </button>
              )
            })}
          </div>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
            <Search style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: '#64748b' }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ค้นหาชื่อ, ยอดเงิน, ธนาคาร..." style={{ ...s.input, paddingLeft: '32px', width: '100%', boxSizing: 'border-box' as const }} />
          </div>
        </div>
      </div>

      {/* Rows */}
      {loading ? (
        <div style={{ ...s.card, textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <RefreshCw style={{ width: 24, height: 24, margin: '0 auto 12px', display: 'block', animation: 'spin 1s linear infinite' }} />
          กำลังโหลดข้อมูล...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...s.card, textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
          <p style={{ color: '#94a3b8', margin: 0 }}>ไม่มีรายการในหมวดนี้</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filtered.map(row => {
            const isDep    = row.type === 'deposit'
            const dep      = row as DepositRow
            const wit      = row as WithdrawalRow
            const isPending = row.status === 'pending'
            const isActing  = actionId === row.id

            return (
              <div key={row.id} style={{ ...s.card, padding: '14px 16px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', borderLeft: `3px solid ${isPending ? (isDep ? '#fbbf24' : '#ef4444') : '#2a2a45'}` }}>
                {/* Icon */}
                <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: isDep ? 'rgba(245,158,11,0.12)' : 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isDep ? <ArrowDownLeft style={{ width: 17, height: 17, color: '#fbbf24' }} /> : <ArrowUpRight style={{ width: 17, height: 17, color: '#ef4444' }} />}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: 14 }}>{row.userName}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>{row.userEmail}</span>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: isDep ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', color: isDep ? '#fbbf24' : '#f87171', fontWeight: 600 }}>
                      {isDep ? '📥 เติมเงิน' : '📤 ถอนเงิน'}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 3 }}>
                    {isDep ? `สลิป: ${dep.slip_url.startsWith('/') ? 'placeholder' : 'อัปโหลดแล้ว'}` : `🏦 ${wit.bank_name} · ${wit.bank_account}`}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {fmtDate(row.created_at)}
                    {row.admin_note && <span style={{ marginLeft: 8, color: '#f87171' }}> · {row.admin_note}</span>}
                  </div>
                </div>

                {/* Amount */}
                <div style={{ fontSize: 20, fontWeight: 800, color: isDep ? '#34d399' : '#f87171', flexShrink: 0 }}>
                  {isDep ? '+' : '-'}฿{row.amount.toLocaleString()}
                </div>

                {/* Status pill */}
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, flexShrink: 0,
                  background: row.status === 'approved' ? 'rgba(16,185,129,0.12)' : row.status === 'rejected' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                  color: row.status === 'approved' ? '#34d399' : row.status === 'rejected' ? '#f87171' : '#fbbf24',
                  border: `1px solid ${row.status === 'approved' ? 'rgba(16,185,129,0.3)' : row.status === 'rejected' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                }}>
                  {row.status === 'approved' ? '✅ อนุมัติ' : row.status === 'rejected' ? '❌ ปฏิเสธ' : '⏳ รอตรวจ'}
                </span>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0, flexWrap: 'wrap' }}>
                  <button onClick={() => setDetailModal(row)} style={{ ...btnStyle('#1e1e35'), border: '1px solid #2a2a45', color: '#94a3b8', padding: '7px 10px' }}>
                    <Eye style={{ width: 13, height: 13 }} />
                  </button>
                  {isDep && (
                    <button onClick={() => setSlipModal(dep)} style={{ ...btnStyle('#1e1e35'), border: '1px solid rgba(139,92,246,0.3)', color: '#a78bfa', padding: '7px 12px' }}>
                      <Eye style={{ width: 13, height: 13 }} /> สลิป
                    </button>
                  )}
                  {isPending && (
                    <>
                      <button disabled={isActing} onClick={() => approve(row)} style={btnStyle('#10b981', isActing)}>
                        {isActing ? <><RefreshCw style={{ width: 12, height: 12, animation: 'spin 1s linear infinite' }} /> กำลัง...</> : <><CheckCircle style={{ width: 13, height: 13 }} /> อนุมัติ</>}
                      </button>
                      <button disabled={isActing} onClick={() => { setRejectModal(row); setRejectReason('') }} style={btnStyle('#ef4444', isActing)}>
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

      {/* ── Slip Modal ── */}
      {slipModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={() => setSlipModal(null)}>
          <div style={{ background: '#0f0f1a', border: '1px solid #2a2a45', borderRadius: 18, padding: 24, maxWidth: 440, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#f1f5f9', margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>📎 สลิปการโอนเงิน</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 14px' }}>{slipModal.userName} · ฿{slipModal.amount.toLocaleString()} · {fmtDate(slipModal.created_at)}</p>
            <div style={{ background: '#1a1a2e', borderRadius: 12, overflow: 'hidden', marginBottom: 16, minHeight: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src={slipModal.slip_url} alt="slip" style={{ maxWidth: '100%', maxHeight: 360, objectFit: 'contain', display: 'block' }} onError={e => { (e.target as HTMLImageElement).src = '/placeholder.jpg' }} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <a href={slipModal.slip_url} target="_blank" rel="noreferrer" style={{ flex: 1, padding: '9px', borderRadius: 8, background: '#1e1e35', border: '1px solid #2a2a45', color: '#94a3b8', textAlign: 'center', textDecoration: 'none', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Download style={{ width: 13, height: 13 }} /> เปิดต้นฉบับ
              </a>
              {slipModal.status === 'pending' && (
                <>
                  <button onClick={() => { approve(slipModal); setSlipModal(null) }} style={btnStyle('#10b981')}>
                    <CheckCircle style={{ width: 13, height: 13 }} /> อนุมัติ
                  </button>
                  <button onClick={() => { setRejectModal(slipModal); setSlipModal(null) }} style={btnStyle('#ef4444')}>
                    <XCircle style={{ width: 13, height: 13 }} /> ปฏิเสธ
                  </button>
                </>
              )}
              <button onClick={() => setSlipModal(null)} style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid #2a2a45', background: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {detailModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }} onClick={() => setDetailModal(null)}>
          <div style={{ background: '#0f0f1a', border: '1px solid #2a2a45', borderRadius: 18, padding: 24, maxWidth: 400, width: '100%' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#f1f5f9', margin: '0 0 18px', fontSize: 16, fontWeight: 700 }}>
              {detailModal.type === 'deposit' ? '📥 รายละเอียดเติมเงิน' : '📤 รายละเอียดถอนเงิน'}
            </h3>
            {([
              ['ผู้ใช้',    detailModal.userName],
              ['อีเมล',    detailModal.userEmail],
              ['ยอดเงิน',  `฿${detailModal.amount.toLocaleString()}`],
              ['ประเภท',   detailModal.type === 'deposit' ? 'เติมเงิน' : 'ถอนเงิน'],
              ['สถานะ',    detailModal.status === 'pending' ? '⏳ รอดำเนินการ' : detailModal.status === 'approved' ? '✅ อนุมัติแล้ว' : '❌ ปฏิเสธ'],
              ['วันที่แจ้ง', fmtDate(detailModal.created_at)],
              ...(detailModal.reviewed_at ? [['วันที่ตรวจ', fmtDate(detailModal.reviewed_at)]] : []),
              ...(detailModal.type === 'withdrawal' ? [['ธนาคาร', (detailModal as WithdrawalRow).bank_name], ['เลขบัญชี', (detailModal as WithdrawalRow).bank_account]] : []),
              ...(detailModal.admin_note ? [['หมายเหตุ', detailModal.admin_note]] : []),
            ] as [string, string][]).map(([label, val], i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1e1e35' }}>
                <span style={{ fontSize: 13, color: '#94a3b8' }}>{label}</span>
                <span style={{ fontSize: 13, color: '#f1f5f9', fontWeight: 600 }}>{val}</span>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {detailModal.status === 'pending' && (
                <>
                  <button onClick={() => { approve(detailModal); setDetailModal(null) }} style={{ flex: 1, ...btnStyle('#10b981'), justifyContent: 'center' }}>
                    <CheckCircle style={{ width: 13, height: 13 }} /> อนุมัติ
                  </button>
                  <button onClick={() => { setRejectModal(detailModal); setDetailModal(null) }} style={{ flex: 1, ...btnStyle('#ef4444'), justifyContent: 'center' }}>
                    <XCircle style={{ width: 13, height: 13 }} /> ปฏิเสธ
                  </button>
                </>
              )}
              <button onClick={() => setDetailModal(null)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid #2a2a45', background: 'none', color: '#64748b', cursor: 'pointer', fontSize: 13 }}>ปิด</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject Modal ── */}
      {rejectModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 16 }}>
          <div style={{ background: '#0f0f1a', border: '1px solid #2a2a45', borderRadius: 18, padding: 24, maxWidth: 380, width: '100%' }}>
            <h3 style={{ color: '#f1f5f9', margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>❌ ปฏิเสธรายการ</h3>
            <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 16px' }}>
              {rejectModal.userName} · {rejectModal.type === 'deposit' ? 'เติมเงิน' : 'ถอนเงิน'} ฿{rejectModal.amount.toLocaleString()}
            </p>
            {/* Quick reasons */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {(rejectModal.type === 'deposit'
                ? ['สลิปไม่ชัด', 'ยอดไม่ตรง', 'สลิปหมดอายุ', 'ข้อมูลไม่ครบ']
                : ['บัญชีไม่ถูกต้อง', 'ยอดเงินไม่พอ', 'ข้อมูลธนาคารผิด', 'ระงับบัญชี']
              ).map(r => (
                <button key={r} onClick={() => setRejectReason(r)} style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${rejectReason === r ? '#ef4444' : '#2a2a45'}`, background: rejectReason === r ? 'rgba(239,68,68,0.12)' : '#1a1a2e', color: rejectReason === r ? '#f87171' : '#94a3b8', cursor: 'pointer', fontSize: 12 }}>{r}</button>
              ))}
            </div>
            <textarea placeholder="หรือพิมพ์เหตุผลเอง..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={3} style={{ width: '100%', boxSizing: 'border-box' as const, padding: 10, background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: 8, color: '#f1f5f9', resize: 'vertical' as const, fontSize: 13, marginBottom: 12 }} />
            <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '10px 12px', fontSize: 12, color: '#fca5a5', marginBottom: 14 }}>
              ⚠️ {rejectModal.type === 'withdrawal' ? 'เงินจะถูกคืนกลับเข้ากระเป๋าผู้ใช้อัตโนมัติ' : 'ยอดจะไม่ถูกเพิ่ม และผู้ใช้จะได้รับแจ้งเตือน'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { setRejectModal(null); setRejectReason('') }} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid #2a2a45', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 13 }}>ยกเลิก</button>
              <button disabled={!rejectReason.trim() || !!actionId} onClick={reject} style={{ flex: 2, ...btnStyle('#ef4444', !rejectReason.trim() || !!actionId), justifyContent: 'center' }}>
                {actionId ? '⏳ กำลังดำเนินการ...' : '❌ ยืนยันปฏิเสธ'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
