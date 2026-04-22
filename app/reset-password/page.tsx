'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ShoppingBag, Eye, EyeOff, Loader2, KeyRound, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale } from '@/hooks/use-locale'

export default function ResetPasswordPage() {
  const router = useRouter()
  const { locale } = useLocale()
  const th = locale === 'th'

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [accessToken, setAccessToken] = useState('')
  const [refreshToken, setRefreshToken] = useState('')
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Parse hash from URL (Supabase sends access_token in hash)
    const hash = window.location.hash.substring(1)
    const params = new URLSearchParams(hash)
    const type = params.get('type')
    const token = params.get('access_token')
    const refresh = params.get('refresh_token')

    if (type !== 'recovery' || !token) {
      setError(th ? 'ลิงก์ไม่ถูกต้องหรือหมดอายุแล้ว' : 'Invalid or expired reset link')
      return
    }
    setAccessToken(token)
    setRefreshToken(refresh || '')
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword || newPassword.length < 8) {
      toast.error(th ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' : 'Password must be at least 8 characters')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error(th ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match')
      return
    }

    setLoading(true)
    try {
      // Use supabase client directly for password update after setting session
      const { supabase } = await import('@/lib/supabase')
      await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) throw updateError

      setDone(true)
      toast.success(th ? 'รีเซ็ตรหัสผ่านสำเร็จ!' : 'Password reset successful!')
      setTimeout(() => router.push('/login'), 2500)
    } catch {
      toast.error(th ? 'เกิดข้อผิดพลาด กรุณาลองขอลิงก์ใหม่' : 'Error occurred, please request a new link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#050508',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      backgroundImage: 'radial-gradient(ellipse at 30% 20%, rgba(139,92,246,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(59,130,246,0.08) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '44px', height: '44px',
              background: 'linear-gradient(135deg,#7c3aed,#2563eb)',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 20px rgba(139,92,246,0.4)',
            }}>
              <ShoppingBag style={{ width: '22px', height: '22px', color: 'white' }} />
            </div>
            <span style={{
              fontSize: '22px', fontWeight: 'bold', fontFamily: 'monospace',
              background: 'linear-gradient(135deg,#a78bfa,#60a5fa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>GameShop</span>
          </Link>
          <p style={{ marginTop: '8px', color: '#64748b', fontSize: '14px', fontFamily: 'monospace' }}>
            {th ? '// ตั้งรหัสผ่านใหม่' : '// RESET PASSWORD'}
          </p>
        </div>

        <div style={{
          background: '#0f0f1a',
          border: '1px solid #1a1a2e',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(0,0,0,0.5)',
        }}>
          <div style={{ background: '#070710', borderBottom: '1px solid #1a1a2e', padding: '16px 24px' }}>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#f1f5f9', fontFamily: 'monospace' }}>
              {th ? 'ตั้งรหัสผ่านใหม่' : 'SET NEW PASSWORD'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
              {th ? 'เลือกรหัสผ่านที่แข็งแกร่งและจำง่าย' : 'Choose a strong and memorable password'}
            </p>
          </div>

          <div style={{ padding: '24px' }}>
            {error ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <p style={{ color: '#f87171', fontFamily: 'monospace', fontSize: '14px' }}>⚠️ {error}</p>
                <Link href="/forgot-password" style={{ color: '#a78bfa', fontFamily: 'monospace', fontSize: '13px' }}>
                  {th ? 'ขอลิงก์ใหม่ →' : 'Request new link →'}
                </Link>
              </div>
            ) : done ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: '60px', height: '60px', margin: '0 auto 16px',
                  background: 'rgba(52,211,153,0.1)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle2 style={{ width: '30px', height: '30px', color: '#34d399' }} />
                </div>
                <h3 style={{ color: '#f1f5f9', fontFamily: 'monospace', marginBottom: '8px' }}>
                  {th ? 'รีเซ็ตสำเร็จ!' : 'Password Reset!'}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace' }}>
                  {th ? 'กำลังพาคุณไปหน้าเข้าสู่ระบบ...' : 'Redirecting to login...'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginBottom: '6px', letterSpacing: '0.05em' }}>
                    {th ? 'รหัสผ่านใหม่' : 'NEW PASSWORD'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNew ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      style={{
                        width: '100%', padding: '10px 40px 10px 14px', boxSizing: 'border-box',
                        background: '#070710', border: '1px solid #1a1a2e',
                        borderRadius: '8px', color: '#f1f5f9', fontSize: '14px',
                        fontFamily: 'monospace', outline: 'none',
                      }}
                    />
                    <button type="button" onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                      {showNew ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                  <p style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginTop: '4px' }}>
                    {th ? 'อย่างน้อย 8 ตัวอักษร' : 'At least 8 characters'}
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginBottom: '6px', letterSpacing: '0.05em' }}>
                    {th ? 'ยืนยันรหัสผ่าน' : 'CONFIRM PASSWORD'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '10px 40px 10px 14px', boxSizing: 'border-box',
                        background: '#070710', border: '1px solid #1a1a2e',
                        borderRadius: '8px', color: '#f1f5f9', fontSize: '14px',
                        fontFamily: 'monospace', outline: 'none',
                        borderColor: confirmPassword && confirmPassword !== newPassword ? '#ef4444' : undefined,
                      }}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                      {showConfirm ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                    </button>
                  </div>
                  {confirmPassword && confirmPassword !== newPassword && (
                    <p style={{ fontSize: '11px', color: '#ef4444', fontFamily: 'monospace', marginTop: '4px' }}>
                      {th ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match'}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%', padding: '13px',
                    background: loading ? '#1a1a2e' : 'linear-gradient(135deg,#7c3aed,#2563eb)',
                    border: 'none', borderRadius: '8px',
                    color: loading ? '#94a3b8' : 'white',
                    fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold',
                    letterSpacing: '0.05em', cursor: loading ? 'not-allowed' : 'pointer',
                    boxShadow: loading ? 'none' : '0 0 20px rgba(139,92,246,0.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  }}
                >
                  {loading
                    ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} />{th ? 'กำลังบันทึก...' : 'Saving...'}</>
                    : <><KeyRound style={{ width: 16, height: 16 }} />{th ? '[ บันทึกรหัสผ่านใหม่ ]' : '[ SAVE NEW PASSWORD ]'}</>
                  }
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input:focus { border-color: #8b5cf6 !important; box-shadow: 0 0 0 2px rgba(139,92,246,0.15) !important; }
      `}</style>
    </div>
  )
}
