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
      router.push('/')
    } else {
      toast.error(th ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' : 'Invalid email or password')
    }
  }


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
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
            <div style={{
              width: '42px', height: '42px',
              background: 'linear-gradient(135deg,#2563eb,#06b6d4)',
              borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 18px rgba(37,99,235,0.35)',
            }}>
              <ShoppingBag style={{ width: '20px', height: '20px', color: 'white' }} />
            </div>
            <span style={{
              fontSize: '21px', fontWeight: 'bold', fontFamily: 'monospace',
              background: 'linear-gradient(135deg,#2563eb,#06b6d4)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>GameShop</span>
          </Link>
          <p style={{ marginTop: '6px', color: '#1d4ed8', fontSize: '12px', fontFamily: 'monospace', opacity: 0.7 }}>
            {th ? '// เข้าสู่ระบบ' : '// LOGIN'}
          </p>
        </div>

        <div style={{
          background: '#ffffff',
          border: '1px solid #bfdbfe',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(37,99,235,0.10)',
        }}>
          <div style={{ background: '#f0f8ff', borderBottom: '1px solid #bfdbfe', padding: '14px 22px' }}>
            <h1 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold', color: '#0a1628', fontFamily: 'monospace' }}>
              {th ? 'เข้าสู่ระบบ' : 'SIGN IN'}
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '11px', color: '#1d4ed8', fontFamily: 'monospace', opacity: 0.8 }}>
              {th ? 'ซื้อขายไอดีเกมได้ทันที' : 'Buy & sell game IDs instantly'}
            </p>
          </div>

          <div style={{ padding: '22px' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '10px', color: '#1d4ed8', fontFamily: 'monospace', marginBottom: '5px', letterSpacing: '0.08em' }}>
                  {th ? 'อีเมล' : 'EMAIL'}
                </label>
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%', padding: '9px 12px', boxSizing: 'border-box',
                    background: '#f0f8ff', border: '1px solid #bfdbfe',
                    borderRadius: '7px', color: '#0a1628', fontSize: '13px',
                    fontFamily: 'monospace', outline: 'none',
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <label style={{ fontSize: '10px', color: '#1d4ed8', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
                    {th ? 'รหัสผ่าน' : 'PASSWORD'}
                  </label>
                  <Link href="/forgot-password" style={{ fontSize: '10px', color: '#2563eb', fontFamily: 'monospace', textDecoration: 'none' }}>
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
                      width: '100%', padding: '9px 36px 9px 12px', boxSizing: 'border-box',
                      background: '#f0f8ff', border: '1px solid #bfdbfe',
                      borderRadius: '7px', color: '#0a1628', fontSize: '13px',
                      fontFamily: 'monospace', outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#60a5fa' }}
                  >
                    {showPassword ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  width: '100%', padding: '11px',
                  background: isLoading ? '#e0f0ff' : 'linear-gradient(135deg,#2563eb,#06b6d4)',
                  border: 'none', borderRadius: '7px',
                  color: isLoading ? '#1d4ed8' : 'white',
                  fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold',
                  letterSpacing: '0.06em', cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: isLoading ? 'none' : '0 0 16px rgba(37,99,235,0.30)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                  transition: 'opacity 0.2s',
                }}
              >
                {isLoading
                  ? <><Loader2 style={{ width: 15, height: 15 }} />{th ? 'กำลังเข้าสู่ระบบ...' : 'Signing in...'}</>
                  : <><Zap style={{ width: 15, height: 15 }} />{th ? '[ เข้าสู่ระบบ ]' : '[ SIGN IN ]'}</>
                }
              </button>
            </form>

            <hr style={{ border: 'none', borderTop: '1px solid #bfdbfe', margin: '16px 0' }} />

            <p style={{ textAlign: 'center', fontSize: '12px', color: '#60a5fa', fontFamily: 'monospace' }}>
              {th ? 'ยังไม่มีบัญชี?' : "Don't have an account?"}{' '}
              <Link href="/register" style={{ color: '#2563eb', textDecoration: 'none' }}>
                {th ? 'สมัครสมาชิก →' : 'Register →'}
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        input:focus { border-color: #2563eb !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.15) !important; }
        button.demo:hover { background: #dbeafe !important; border-color: #93c5fd !important; }
      `}</style>
    </div>
  )
}