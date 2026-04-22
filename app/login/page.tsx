'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, ShoppingBag, Loader2, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store'
import { useLocale } from '@/hooks/use-locale'

export default function LoginPage() {
  const router = useRouter()
  const { login, isLoading } = useAuthStore()
  const { locale } = useLocale()
  const th = locale === 'th'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast.error(th ? 'กรุณากรอกข้อมูลให้ครบ' : 'Please fill in all fields')
      return
    }
    const success = await login(email, password)
    if (success) {
      toast.success(th ? 'เข้าสู่ระบบสำเร็จ!' : 'Login successful!')
      router.push('/dashboard')
    } else {
      toast.error(th ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'Invalid email or password')
    }
  }

  const demoAccounts = [
    { email: 'buyer@example.com', password: 'password', label: th ? '👤 ผู้ซื้อ' : '👤 Buyer', color: '#60a5fa' },
    { email: 'seller@example.com', password: 'password', label: th ? '🏪 ผู้ขาย' : '🏪 Seller', color: '#34d399' },
    { email: 'admin@example.com', password: 'password', label: '🛡️ Admin', color: '#f472b6' },
  ]

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
            {th ? '// เข้าสู่ระบบ' : '// LOGIN'}
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
              {th ? 'เข้าสู่ระบบ' : 'SIGN IN'}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
              {th ? 'ซื้อขายไอดีเกมได้ทันที' : 'Buy & sell game IDs instantly'}
            </p>
          </div>

          <div style={{ padding: '24px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginBottom: '6px', letterSpacing: '0.05em' }}>
                  {th ? 'อีเมล' : 'EMAIL'}
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '10px 14px', boxSizing: 'border-box',
                    background: '#070710', border: '1px solid #1a1a2e',
                    borderRadius: '8px', color: '#f1f5f9', fontSize: '14px',
                    fontFamily: 'monospace', outline: 'none',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                    {th ? 'รหัสผ่าน' : 'PASSWORD'}
                  </label>
                  <Link href="/forgot-password" style={{ fontSize: '11px', color: '#8b5cf6', fontFamily: 'monospace', textDecoration: 'none' }}>
                    {th ? 'ลืมรหัสผ่าน?' : 'Forgot?'}
                  </Link>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%', padding: '10px 40px 10px 14px', boxSizing: 'border-box',
                      background: '#070710', border: '1px solid #1a1a2e',
                      borderRadius: '8px', color: '#f1f5f9', fontSize: '14px',
                      fontFamily: 'monospace', outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                  >
                    {showPassword ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%', padding: '13px',
                  background: isLoading ? '#1a1a2e' : 'linear-gradient(135deg,#7c3aed,#2563eb)',
                  border: 'none', borderRadius: '8px',
                  color: isLoading ? '#94a3b8' : 'white',
                  fontFamily: 'monospace', fontSize: '14px', fontWeight: 'bold',
                  letterSpacing: '0.05em', cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: isLoading ? 'none' : '0 0 20px rgba(139,92,246,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  transition: 'all 0.2s',
                }}
              >
                {isLoading
                  ? <><Loader2 style={{ width: 16, height: 16 }} />{th ? 'กำลังเข้าสู่ระบบ...' : 'Signing in...'}</>
                  : <><Zap style={{ width: 16, height: 16 }} />{th ? '[ เข้าสู่ระบบ ]' : '[ SIGN IN ]'}</>
                }
              </button>
            </form>

            {/* Demo accounts */}
            <div style={{ marginTop: '20px' }}>
              <p style={{ fontSize: '10px', color: '#94a3b8', fontFamily: 'monospace', textAlign: 'center', marginBottom: '10px', letterSpacing: '0.1em' }}>
                // DEMO_ACCOUNTS (password: password)
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                {demoAccounts.map(a => (
                  <button
                    key={a.email}
                    type="button"
                    onClick={() => { setEmail(a.email); setPassword(a.password) }}
                    style={{
                      flex: 1, padding: '8px 4px',
                      background: '#070710', border: `1px solid ${a.color}30`,
                      borderRadius: '6px', cursor: 'pointer',
                      fontSize: '10px', color: a.color, fontFamily: 'monospace',
                      transition: 'all 0.2s',
                    }}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>
              {th ? 'ยังไม่มีบัญชี?' : "Don't have an account?"}{' '}
              <Link href="/register" style={{ color: '#a78bfa', textDecoration: 'none' }}>
                {th ? 'สมัครสมาชิก →' : 'Register →'}
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
