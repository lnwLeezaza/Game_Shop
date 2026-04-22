'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ShoppingBag, Loader2, Check, User } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store'
import { useLocale } from '@/hooks/use-locale'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isLoading } = useAuthStore()
  const { locale } = useLocale()
  const th = locale === 'th'

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const passwordReqs = [
    { text: th ? 'อย่างน้อย 8 ตัวอักษร' : 'At least 8 characters', met: password.length >= 8 },
    { text: th ? 'มีตัวเลข' : 'Contains a number', met: /\d/.test(password) },
    { text: th ? 'มีตัวพิมพ์ใหญ่' : 'Contains uppercase', met: /[A-Z]/.test(password) },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || isLoading) return

    // Client-side validation
    if (!email.trim() || !username.trim() || !password || !confirmPassword) {
      toast.error(th ? 'กรุณากรอกข้อมูลให้ครบ' : 'Please fill in all fields')
      return
    }
    if (password !== confirmPassword) {
      toast.error(th ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match')
      return
    }
    if (password.length < 8) {
      toast.error(th ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' : 'Password must be at least 8 characters')
      return
    }
    if (!acceptTerms) {
      toast.error(th ? 'กรุณายอมรับเงื่อนไขการใช้งาน' : 'Please accept the terms')
      return
    }

    setSubmitting(true)
    const loadingToast = toast.loading(th ? 'กำลังสมัครสมาชิก...' : 'Creating account...')

    try {
      const result = await register(email.trim(), username.trim(), password)

      toast.dismiss(loadingToast)

      if (result === 'confirm_email') {
        // Supabase เปิด email confirmation — ต้องกดยืนยันอีเมลก่อน
        toast.success(
          th
            ? '📧 กรุณาเช็คอีเมลและกดลิงก์ยืนยันก่อนเข้าสู่ระบบ'
            : '📧 Please check your email and click the confirmation link',
          { duration: 10000 }
        )
        router.push('/login')

      } else if (result === true) {
        // สมัครสำเร็จและ login ทันที
        toast.success(th ? '✅ สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ' : '✅ Registration successful! Welcome!')
        router.push('/')

      } else {
        // result = false — ไม่ควรเกิด แต่ handle ไว้
        toast.error(th ? 'เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่' : 'Unexpected error, please try again')
      }

    } catch (err: any) {
      toast.dismiss(loadingToast)
      const msg: string = err?.message || ''
      console.error('[Register Error]', msg, err)

      if (msg.includes('already registered') || msg.includes('User already registered')) {
        toast.error(th ? 'อีเมลนี้มีบัญชีอยู่แล้ว' : 'Email already registered')
        router.push('/login')
      } else if (msg.includes('Password should be at least 6')) {
        toast.error(th ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters')
      } else if (msg.includes('invalid') && msg.includes('email')) {
        toast.error(th ? 'รูปแบบอีเมลไม่ถูกต้อง' : 'Invalid email format')
      } else if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('fetch')) {
        toast.error(th ? '❌ ไม่สามารถเชื่อมต่อ Supabase ได้ — ตรวจสอบ .env.local' : '❌ Cannot connect to Supabase — check .env.local')
      } else {
        toast.error(msg || (th ? 'เกิดข้อผิดพลาด กรุณาลองใหม่' : 'Registration failed, please try again'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const busy = submitting || isLoading

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
      <div style={{ width: '100%', maxWidth: '480px' }}>

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
            {th ? '// สมัครสมาชิกฟรี' : '// CREATE_ACCOUNT'}
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
              {th ? 'สมัครสมาชิก' : 'REGISTER'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
              {th ? 'เริ่มต้นซื้อขายได้ทันที' : 'Start trading instantly'}
            </p>
          </div>

          <div style={{ padding: '24px' }}>
            {/* Account type */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                padding: '14px 16px',
                background: 'rgba(139,92,246,0.1)',
                border: '1px solid rgba(139,92,246,0.3)',
                borderRadius: '10px',
                display: 'flex', alignItems: 'center', gap: '12px',
              }}>
                <div style={{
                  width: '36px', height: '36px', flexShrink: 0,
                  background: 'rgba(139,92,246,0.2)',
                  borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <User style={{ width: '18px', height: '18px', color: '#a78bfa' }} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#a78bfa', fontFamily: 'monospace' }}>
                    {th ? 'ผู้ซื้อ (BUYER)' : 'BUYER'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '2px' }}>
                    {th ? 'สมัครเป็นผู้ซื้อก่อน — อัปเกรดเป็นผู้ขายได้ใน Settings' : 'Register as buyer — upgrade to seller in Settings'}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginBottom: '6px', letterSpacing: '0.05em' }}>
                  {th ? 'อีเมล' : 'EMAIL'}
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={busy}
                  required
                  style={inputStyle}
                />
              </div>

              {/* Username */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginBottom: '6px', letterSpacing: '0.05em' }}>
                  {th ? 'ชื่อผู้ใช้' : 'USERNAME'}
                </label>
                <input
                  type="text"
                  placeholder={th ? 'ชื่อที่แสดงในร้านค้า' : 'Display name in shop'}
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  disabled={busy}
                  required
                  style={inputStyle}
                />
              </div>

              {/* Password */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginBottom: '6px', letterSpacing: '0.05em' }}>
                  {th ? 'รหัสผ่าน' : 'PASSWORD'}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={busy}
                    required
                    style={{ ...inputStyle, paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px' }}
                  >
                    {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
                {password && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {passwordReqs.map((req, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: req.met ? '#4ade80' : '#94a3b8', fontFamily: 'monospace' }}>
                        <Check style={{ width: 12, height: 12, opacity: req.met ? 1 : 0.3 }} />
                        {req.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginBottom: '6px', letterSpacing: '0.05em' }}>
                  {th ? 'ยืนยันรหัสผ่าน' : 'CONFIRM PASSWORD'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={busy}
                  required
                  style={{ ...inputStyle, borderColor: confirmPassword && password !== confirmPassword ? '#ef4444' : '#1a1a2e' }}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#f87171', fontFamily: 'monospace' }}>
                    {th ? '❌ รหัสผ่านไม่ตรงกัน' : '❌ Passwords do not match'}
                  </p>
                )}
              </div>

              {/* Terms */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <input
                  type="checkbox"
                  id="terms"
                  checked={acceptTerms}
                  onChange={e => setAcceptTerms(e.target.checked)}
                  disabled={busy}
                  style={{ marginTop: '2px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                />
                <label htmlFor="terms" style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', lineHeight: 1.5, cursor: 'pointer' }}>
                  {th ? (
                    <>ฉันยอมรับ <Link href="/terms" style={{ color: '#a78bfa' }}>เงื่อนไขการใช้งาน</Link> และ <Link href="/privacy" style={{ color: '#a78bfa' }}>นโยบายความเป็นส่วนตัว</Link></>
                  ) : (
                    <>I accept the <Link href="/terms" style={{ color: '#a78bfa' }}>Terms of Service</Link> and <Link href="/privacy" style={{ color: '#a78bfa' }}>Privacy Policy</Link></>
                  )}
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={busy}
                style={{
                  width: '100%', padding: '13px',
                  background: busy ? '#1a1a2e' : 'linear-gradient(135deg,#7c3aed,#2563eb)',
                  border: 'none', borderRadius: '8px',
                  color: busy ? '#94a3b8' : 'white',
                  fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold',
                  letterSpacing: '0.05em', cursor: busy ? 'not-allowed' : 'pointer',
                  boxShadow: busy ? 'none' : '0 0 20px rgba(139,92,246,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                {busy && <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />}
                {busy
                  ? (th ? 'กำลังสมัคร...' : 'Creating...')
                  : (th ? '[ สมัครสมาชิก ]' : '[ CREATE ACCOUNT ]')
                }
              </button>
            </form>

            <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
              {th ? 'มีบัญชีแล้ว?' : 'Already have an account?'}{' '}
              <Link href="/login" style={{ color: '#a78bfa', textDecoration: 'none' }}>
                {th ? 'เข้าสู่ระบบ →' : 'Login →'}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input:focus { border-color: #8b5cf6 !important; box-shadow: 0 0 0 2px rgba(139,92,246,0.15) !important; }
        a { text-decoration: none; }
      `}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', boxSizing: 'border-box',
  background: '#070710', border: '1px solid #1a1a2e',
  borderRadius: '8px', color: '#f1f5f9', fontSize: '14px',
  fontFamily: 'monospace', outline: 'none',
}
