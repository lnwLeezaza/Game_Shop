'use client'

import { useState, useEffect } from 'react'
import { Search, Shield, User, Store, ChevronDown, Check, X, Plus, Minus, Loader2, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale, formatPrice } from '@/hooks/use-locale'
import { useAdminUserStore } from '@/lib/store'
import type { User as UserType } from '@/lib/types'

const roleColors: Record<string, { bg: string; text: string; border: string }> = {
  admin:  { bg: 'rgba(244,114,182,0.15)', text: '#f472b6', border: 'rgba(244,114,182,0.3)' },
  seller: { bg: 'rgba(96,165,250,0.15)',  text: '#60a5fa', border: 'rgba(96,165,250,0.3)' },
  buyer:  { bg: 'rgba(74,222,128,0.15)',  text: '#4ade80', border: 'rgba(74,222,128,0.3)' },
}
const kycColors: Record<string, string> = {
  verified: '#4ade80', pending: '#fbbf24', rejected: '#ef4444',
}

export default function AdminUsersPage() {
  const { locale } = useLocale()
  const { users, fetchUsers, updateRole, updateKYC, adjustBalance, isLoading } = useAdminUserStore()
  const th = locale === 'th'

  const [search, setSearch] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [editUser, setEditUser] = useState<UserType | null>(null)
  const [adjustAmount, setAdjustAmount] = useState('')
  const [adjusting, setAdjusting] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchUsers() }, [])

  const filtered = users.filter(u => {
    const matchSearch = u.username.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.displayName.toLowerCase().includes(search.toLowerCase())
    const matchRole = filterRole === 'all' || u.role === filterRole
    return matchSearch && matchRole
  })

  const handleRoleChange = async (userId: string, role: UserType['role']) => {
    setSaving(true)
    await updateRole(userId, role)
    if (editUser?.id === userId) setEditUser(u => u ? { ...u, role } : u)
    toast.success(th ? `เปลี่ยน role เป็น ${role} แล้ว` : `Role updated to ${role}`)
    setSaving(false)
  }

  const handleKYCChange = async (userId: string, status: UserType['kycStatus']) => {
    setSaving(true)
    await updateKYC(userId, status)
    if (editUser?.id === userId) setEditUser(u => u ? { ...u, kycStatus: status } : u)
    toast.success(th ? `อัพเดต KYC เป็น ${status} แล้ว` : `KYC updated to ${status}`)
    setSaving(false)
  }

  const handleAdjustBalance = async (positive: boolean) => {
    if (!editUser || !adjustAmount || isNaN(Number(adjustAmount))) return
    setAdjusting(true)
    const amount = Number(adjustAmount) * (positive ? 1 : -1)
    await adjustBalance(editUser.id, amount)
    setEditUser(u => u ? { ...u, balance: Math.max(0, u.balance + amount) } : u)
    toast.success(th
      ? `${positive ? 'เพิ่ม' : 'ลด'} ยอดเงิน ${formatPrice(Math.abs(amount), locale)} แล้ว`
      : `Balance ${positive ? 'added' : 'deducted'}: ${formatPrice(Math.abs(amount), locale)}`
    )
    setAdjustAmount('')
    setAdjusting(false)
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 'bold', color: '#f1f5f9', fontFamily: 'monospace' }}>
            {th ? '👥 จัดการผู้ใช้' : '👥 MANAGE USERS'}
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
            {th ? `ผู้ใช้ทั้งหมด ${users.length} คน` : `${users.length} total users`}
          </p>
        </div>
        <button onClick={() => fetchUsers()} style={{ padding: '8px 14px', background: '#1a1a2e', border: '1px solid #2a2a3e', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
          <RefreshCw style={{ width: 13, height: 13 }} />
          {th ? 'รีเฟรช' : 'Refresh'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: editUser ? '1fr 340px' : '1fr', gap: '20px' }}>
        {/* Left: User Table */}
        <div>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', width: 13, height: 13, color: '#94a3b8' }} />
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={th ? 'ค้นหาชื่อ, อีเมล...' : 'Search name, email...'}
                style={{ ...iStyle, paddingLeft: '30px', width: '220px' }} />
            </div>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ ...iStyle, width: '120px', cursor: 'pointer' }}>
              <option value="all">{th ? 'ทุก Role' : 'All Roles'}</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
              <option value="admin">Admin</option>
            </select>
            <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', alignSelf: 'center' }}>
              {filtered.length} {th ? 'คน' : 'users'}
            </div>
          </div>

          {/* Table */}
          <div style={{ background: '#0f0f1a', border: '1px solid #1a1a2e', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ background: '#070710', borderBottom: '1px solid #1a1a2e', padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 90px 90px 100px 90px', gap: '8px' }}>
              {['ผู้ใช้', 'Role', 'KYC', 'ยอดเงิน', 'Action'].map(h => (
                <div key={h} style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.08em' }}>{h.toUpperCase()}</div>
              ))}
            </div>

            {isLoading ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ width: 28, height: 28, border: '3px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : filtered.map(u => {
              const rc = roleColors[u.role] || roleColors.buyer
              const isSelected = editUser?.id === u.id
              return (
                <div key={u.id} style={{
                  display: 'grid', gridTemplateColumns: '1fr 90px 90px 100px 90px', gap: '8px',
                  padding: '10px 14px', borderBottom: '1px solid #0d0d1a', alignItems: 'center',
                  background: isSelected ? 'rgba(139,92,246,0.06)' : 'transparent',
                  cursor: 'pointer', transition: 'background 0.1s',
                }} onClick={() => setEditUser(isSelected ? null : u)}>
                  {/* User info */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: '#f1f5f9', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.displayName}
                    </div>
                    <div style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u.email}
                    </div>
                  </div>
                  {/* Role */}
                  <div style={{ padding: '3px 7px', background: rc.bg, border: `1px solid ${rc.border}`, borderRadius: '4px', fontSize: '10px', color: rc.text, fontFamily: 'monospace', textAlign: 'center' }}>
                    {u.role}
                  </div>
                  {/* KYC */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: kycColors[u.kycStatus], boxShadow: `0 0 5px ${kycColors[u.kycStatus]}` }} />
                    <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>{u.kycStatus}</span>
                  </div>
                  {/* Balance */}
                  <div style={{ fontSize: '12px', color: '#fbbf24', fontFamily: 'monospace', fontWeight: 'bold' }}>
                    {formatPrice(u.balance, locale)}
                  </div>
                  {/* Edit btn */}
                  <button onClick={e => { e.stopPropagation(); setEditUser(isSelected ? null : u) }}
                    style={{ padding: '5px 10px', background: isSelected ? 'rgba(139,92,246,0.2)' : '#1a1a2e', border: `1px solid ${isSelected ? '#8b5cf6' : '#2a2a3e'}`, borderRadius: '5px', cursor: 'pointer', fontSize: '11px', color: isSelected ? '#a78bfa' : '#64748b', fontFamily: 'monospace' }}>
                    {isSelected ? (th ? 'ปิด' : 'Close') : (th ? 'แก้ไข' : 'Edit')}
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Edit Panel */}
        {editUser && (
          <div style={{ background: '#0f0f1a', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', overflow: 'hidden', alignSelf: 'start', position: 'sticky', top: '80px' }}>
            <div style={{ background: '#070710', borderBottom: '1px solid #1a1a2e', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#a78bfa', fontFamily: 'monospace' }}>
                // {th ? 'แก้ไขผู้ใช้' : 'EDIT_USER'}
              </span>
              <button onClick={() => setEditUser(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X style={{ width: 16, height: 16 }} />
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* User Info */}
              <div style={{ padding: '12px', background: '#070710', border: '1px solid #1a1a2e', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f1f5f9', fontFamily: 'monospace' }}>{editUser.displayName}</div>
                <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>{editUser.email}</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>
                  {th ? 'สมัครเมื่อ:' : 'Joined:'} {new Date(editUser.createdAt).toLocaleDateString('th-TH')}
                </div>
              </div>

              {/* Role */}
              <div>
                <label style={{ ...labelSt, marginBottom: '8px' }}>{th ? 'เปลี่ยน Role' : 'CHANGE ROLE'}</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['buyer', 'seller', 'admin'] as const).map(r => {
                    const rc = roleColors[r]
                    return (
                      <button key={r} onClick={() => handleRoleChange(editUser.id, r)} disabled={saving}
                        style={{
                          flex: 1, padding: '7px 4px',
                          background: editUser.role === r ? rc.bg : '#070710',
                          border: `1px solid ${editUser.role === r ? rc.border : '#1a1a2e'}`,
                          borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer',
                          fontSize: '11px', color: editUser.role === r ? rc.text : '#94a3b8',
                          fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px',
                        }}>
                        {editUser.role === r && <Check style={{ width: 10, height: 10 }} />}
                        {r}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* KYC */}
              <div>
                <label style={{ ...labelSt, marginBottom: '8px' }}>{th ? 'สถานะ KYC' : 'KYC STATUS'}</label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['pending', 'verified', 'rejected'] as const).map(k => (
                    <button key={k} onClick={() => handleKYCChange(editUser.id, k)} disabled={saving}
                      style={{
                        flex: 1, padding: '7px 4px',
                        background: editUser.kycStatus === k ? `${kycColors[k]}20` : '#070710',
                        border: `1px solid ${editUser.kycStatus === k ? kycColors[k] : '#1a1a2e'}`,
                        borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer',
                        fontSize: '10px', color: editUser.kycStatus === k ? kycColors[k] : '#94a3b8',
                        fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '3px',
                      }}>
                      {editUser.kycStatus === k && <Check style={{ width: 9, height: 9 }} />}
                      {k}
                    </button>
                  ))}
                </div>
              </div>

              {/* Balance */}
              <div>
                <label style={labelSt}>{th ? 'ปรับยอดเงิน' : 'ADJUST BALANCE'}</label>
                <div style={{ padding: '10px', background: '#070710', border: '1px solid #1a1a2e', borderRadius: '8px', marginBottom: '8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginBottom: '2px' }}>{th ? 'ยอดปัจจุบัน' : 'Current Balance'}</div>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#fbbf24', fontFamily: 'monospace' }}>{formatPrice(editUser.balance, locale)}</div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <input type="number" min="1" value={adjustAmount} onChange={e => setAdjustAmount(e.target.value)}
                    placeholder={th ? 'จำนวนเงิน' : 'Amount'}
                    style={{ ...iStyle, flex: 1, textAlign: 'center' }} />
                  <button onClick={() => handleAdjustBalance(true)} disabled={adjusting || !adjustAmount}
                    style={{ padding: '8px 12px', background: 'rgba(74,222,128,0.15)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '6px', cursor: 'pointer', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                    {adjusting ? <Loader2 style={{ width: 12, height: 12 }} /> : <Plus style={{ width: 12, height: 12 }} />}
                    {th ? 'เพิ่ม' : 'Add'}
                  </button>
                  <button onClick={() => handleAdjustBalance(false)} disabled={adjusting || !adjustAmount}
                    style={{ padding: '8px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '6px', cursor: 'pointer', color: '#f87171', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                    {adjusting ? <Loader2 style={{ width: 12, height: 12 }} /> : <Minus style={{ width: 12, height: 12 }} />}
                    {th ? 'ลด' : 'Deduct'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const iStyle: React.CSSProperties = {
  padding: '8px 11px', background: '#070710', border: '1px solid #1a1a2e',
  borderRadius: '7px', color: '#f1f5f9', fontSize: '12px', fontFamily: 'monospace', outline: 'none',
}
const labelSt: React.CSSProperties = {
  display: 'block', fontSize: '10px', color: '#64748b',
  fontFamily: 'monospace', letterSpacing: '0.08em',
}
