'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ShoppingBag, Loader2, Mail, CheckCircle2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useLocale } from '@/hooks/use-locale'

export default function ForgotPasswordPage() {
  const { locale } = useLocale()
  const th = locale === 'th'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast.error(th ? 'กรุณากรอกอีเมล' : 'Please enter your email')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) throw new Error()
      setSent(true)
    } catch {
      toast.error(th ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'Something went wrong, please try again')
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
        {/* Logo */}
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
            {th ? '// ลืมรหัสผ่าน' : '// FORGOT PASSWORD'}
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
              {th ? 'ลืมรหัสผ่าน' : 'FORGOT PASSWORD'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
              {th ? 'รับลิงก์รีเซ็ตรหัสผ่านทางอีเมล' : 'Get a password reset link via email'}
            </p>
          </div>

          <div style={{ padding: '24px' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{
                  width: '60px', height: '60px', margin: '0 auto 16px',
                  background: 'rgba(52,211,153,0.1)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <CheckCircle2 style={{ width: '30px', height: '30px', color: '#34d399' }} />
                </div>
                <h3 style={{ color: '#f1f5f9', fontFamily: 'monospace', marginBottom: '8px' }}>
                  {th ? 'ตรวจสอบอีเมลของคุณ' : 'Check Your Email'}
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', fontFamily: 'monospace', lineHeight: '1.6' }}>
                  {th
                    ? `เราส่งลิงก์รีเซ็ตรหัสผ่านไปที่\n${email}\nแล้ว กรุณาตรวจสอบกล่องจดหมาย`
                    : `We sent a password reset link to ${email}. Please check your inbox.`}
                </p>
                <p style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace', marginTop: '12px' }}>
                  {th ? 'ไม่เห็นอีเมล? ตรวจสอบโฟลเดอร์ Spam' : "Don't see it? Check your Spam folder"}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: '#94a3b8', fontSize: '13px', fontFamily: 'monospace', margin: 0, lineHeight: '1.6' }}>
                  {th
                    ? 'กรอกอีเมลที่ใช้สมัครสมาชิก เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้คุณ'
                    : 'Enter the email you registered with. We\'ll send you a reset link.'}
                </p>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginBottom: '6px', letterSpacing: '0.05em' }}>
                    {th ? 'อีเมล' : 'EMAIL'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#64748b' }} />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      style={{
                        width: '100%', padding: '10px 14px 10px 36px', boxSizing: 'border-box',
                        background: '#070710', border: '1px solid #1a1a2e',
                        borderRadius: '8px', color: '#f1f5f9', fontSize: '14px',
                        fontFamily: 'monospace', outline: 'none',
                      }}
                    />
                  </div>
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
                    ? <><Loader2 style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} />{th ? 'กำลังส่ง...' : 'Sending...'}</>
                    : (th ? '[ ส่งลิงก์รีเซ็ต ]' : '[ SEND RESET LINK ]')
                  }
                </button>
              </form>
            )}

            <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
              <Link href="/login" style={{ color: '#a78bfa', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <ArrowLeft style={{ width: 12, height: 12 }} />
                {th ? 'กลับไปหน้าเข้าสู่ระบบ' : 'Back to Login'}
              </Link>
            </p>
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
