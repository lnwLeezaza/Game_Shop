'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ShoppingBag, Loader2, Check } from 'lucide-react'
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
        toast.success(
          th
            ? '📧 กรุณาเช็คอีเมลและกดลิงก์ยืนยันก่อนเข้าสู่ระบบ'
            : '📧 Please check your email and click the confirmation link',
          { duration: 10000 }
        )
        router.push('/login')
      } else if (result === true) {
        toast.success(th ? '✅ สมัครสมาชิกสำเร็จ! ยินดีต้อนรับ' : '✅ Registration successful! Welcome!')
        router.push('/')
      } else {
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
        toast.error(th ? '❌ ไม่สามารถเชื่อมต่อ Supabase ได้' : '❌ Cannot connect to Supabase — check .env.local')
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
      background: '#f0f6ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      backgroundImage: 'radial-gradient(ellipse at 15% 10%, rgba(37,99,235,0.10) 0%, transparent 50%), radial-gradient(ellipse at 85% 20%, rgba(6,182,212,0.10) 0%, transparent 50%)',
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '44px', height: '44px',
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 16px rgba(37,99,235,0.35)',
            }}>
              <ShoppingBag style={{ width: '22px', height: '22px', color: 'white' }} />
            </div>
            <span style={{
              fontSize: '22px', fontWeight: 'bold', fontFamily: 'monospace',
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>GameShop</span>
          </Link>
          <p style={{ marginTop: '8px', color: '#1d4ed8', fontSize: '14px', fontFamily: 'monospace' }}>
            {th ? '// สมัครสมาชิกฟรี' : '// CREATE_ACCOUNT'}
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #bfdbfe',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 2px 24px rgba(37,99,235,0.08)',
        }}>
          <div style={{ background: '#f0f8ff', borderBottom: '1px solid #bfdbfe', padding: '16px 24px' }}>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#0a1628', fontFamily: 'monospace' }}>
              {th ? 'สมัครสมาชิก' : 'REGISTER'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#1d4ed8', fontFamily: 'monospace' }}>
              {th ? 'เริ่มต้นซื้อขายได้ทันที' : 'Start trading instantly'}
            </p>
          </div>

          <div style={{ padding: '24px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Email */}
              <div>
                <label style={labelStyle}>{th ? 'อีเมล' : 'EMAIL'}</label>
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
                <label style={labelStyle}>{th ? 'ชื่อผู้ใช้' : 'USERNAME'}</label>
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
                <label style={labelStyle}>{th ? 'รหัสผ่าน' : 'PASSWORD'}</label>
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
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa', padding: '2px' }}
                  >
                    {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
                {password && (
                  <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {passwordReqs.map((req, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: req.met ? '#2563eb' : '#93c5fd', fontFamily: 'monospace' }}>
                        <Check style={{ width: 12, height: 12, opacity: req.met ? 1 : 0.4 }} />
                        {req.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label style={labelStyle}>{th ? 'ยืนยันรหัสผ่าน' : 'CONFIRM PASSWORD'}</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  disabled={busy}
                  required
                  style={{ ...inputStyle, borderColor: confirmPassword && password !== confirmPassword ? '#ef4444' : '#bfdbfe' }}
                />
                {confirmPassword && password !== confirmPassword && (
                  <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#ef4444', fontFamily: 'monospace' }}>
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
                  style={{ marginTop: '2px', accentColor: '#2563eb', cursor: 'pointer' }}
                />
                <label htmlFor="terms" style={{ fontSize: '12px', color: '#1e40af', fontFamily: 'monospace', lineHeight: 1.5, cursor: 'pointer' }}>
                  {th ? (
                    <>ฉันยอมรับ <Link href="/terms" style={{ color: '#2563eb' }}>เงื่อนไขการใช้งาน</Link> และ <Link href="/privacy" style={{ color: '#2563eb' }}>นโยบายความเป็นส่วนตัว</Link></>
                  ) : (
                    <>I accept the <Link href="/terms" style={{ color: '#2563eb' }}>Terms of Service</Link> and <Link href="/privacy" style={{ color: '#2563eb' }}>Privacy Policy</Link></>
                  )}
                </label>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={busy}
                style={{
                  width: '100%', padding: '13px',
                  background: busy ? '#e0f0ff' : 'linear-gradient(135deg, #2563eb, #06b6d4)',
                  border: 'none', borderRadius: '8px',
                  color: busy ? '#93c5fd' : 'white',
                  fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold',
                  letterSpacing: '0.05em', cursor: busy ? 'not-allowed' : 'pointer',
                  boxShadow: busy ? 'none' : '0 0 16px rgba(37,99,235,0.3)',
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

            <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#1d4ed8', fontFamily: 'monospace' }}>
              {th ? 'มีบัญชีแล้ว?' : 'Already have an account?'}{' '}
              <Link href="/login" style={{ color: '#2563eb', textDecoration: 'none' }}>
                {th ? 'เข้าสู่ระบบ →' : 'Login →'}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.15) !important; }
        input::placeholder { color: #60a5fa !important; opacity: 1 !important; }
        a { text-decoration: none; }
      `}</style>
    </div>
  )
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '11px', color: '#1e40af',
  fontFamily: 'monospace', marginBottom: '6px',
  letterSpacing: '0.05em', fontWeight: 600,
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', boxSizing: 'border-box',
  background: '#f0f8ff', border: '1px solid #bfdbfe',
  borderRadius: '8px', color: '#0a1628', fontSize: '14px',
  fontFamily: 'monospace', outline: 'none',
}