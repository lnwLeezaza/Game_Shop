'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Wallet, Plus, ArrowUpRight, ArrowDownRight, QrCode,
  Smartphone, Building2, Upload, AlertCircle, RefreshCw, X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore, useTransactionStore } from '@/lib/store'
import { useLocale, formatPrice, formatDate } from '@/hooks/use-locale'
import { storageAPI } from '@/lib/supabase'

const depositAmounts = [100, 300, 500, 1000, 2000, 5000]

const paymentMethods = [
  { id: 'promptpay', icon: QrCode,     label: { th: 'พร้อมเพย์',       en: 'PromptPay'     }, info: { th: '0812345678 (นาย GameShop)', en: '0812345678 (GameShop Ltd.)' } },
  { id: 'truemoney', icon: Smartphone, label: { th: 'TrueMoney Wallet', en: 'TrueMoney'     }, info: { th: '0812345678',               en: '0812345678'                } },
  { id: 'bank',      icon: Building2,  label: { th: 'โอนผ่านธนาคาร',   en: 'Bank Transfer' }, info: { th: 'กสิกรไทย 123-4-56789-0',  en: 'KBank 123-4-56789-0'       } },
]

const banks = [
  'กสิกรไทย (KBank)', 'ไทยพาณิชย์ (SCB)', 'กรุงเทพ (BBL)', 'กรุงไทย (KTB)',
  'กรุงศรี (BAY)', 'ทหารไทยธนชาต (TTB)', 'ออมสิน', 'ธ.ก.ส.',
]

export default function WalletPage() {
  const router = useRouter()
  const { user, updateBalance, refreshUser } = useAuthStore()
  const { transactions, fetchTransactions, addTransaction } = useTransactionStore()
  const { locale } = useLocale()
  const th = locale === 'th'

  const [depositAmount, setDepositAmount]   = useState(500)
  const [customAmount, setCustomAmount]     = useState('')
  const [paymentMethod, setPaymentMethod]   = useState('promptpay')
  const [slipFile, setSlipFile]             = useState<File | null>(null)
  const [slipPreview, setSlipPreview]       = useState('')
  const [depositOpen, setDepositOpen]       = useState(false)
  const [depositStep, setDepositStep]       = useState<'amount' | 'payment' | 'qr' | 'slip'>('amount')
  const [depositLoading, setDepositLoading] = useState(false)

  const [withdrawOpen, setWithdrawOpen]     = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawBank, setWithdrawBank]     = useState('')
  const [withdrawAccount, setWithdrawAccount] = useState('')
  const [withdrawLoading, setWithdrawLoading] = useState(false)

  const [isRefreshing, setIsRefreshing]     = useState(false)
  const [shopSettings, setShopSettings]     = useState({ promptpay_number: '0812345678', promptpay_name: 'GameShop', promptpay_qr_url: '' })

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchTransactions(user.id)
    // Load shop settings from Supabase
    const loadSettings = async () => {
      try {
        const { supabase } = await import('@/lib/supabase')
        const { data } = await supabase.from('shop_settings').select('*').single()
        if (data) setShopSettings({
          promptpay_number: data.promptpay_number || '0812345678',
          promptpay_name: data.promptpay_name || 'GameShop',
          promptpay_qr_url: data.promptpay_qr_url || '',
        })
      } catch {}
    }
    loadSettings()
  }, [user])

  if (!user) return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '32px', height: '32px', border: '3px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  )

  const userTxns = transactions.filter(t => t.userId === user.id)
  const finalAmount = customAmount ? parseInt(customAmount) || 0 : depositAmount

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error(th ? 'ไฟล์ใหญ่เกิน 5MB' : 'File too large (max 5MB)'); return }
    setSlipFile(file)
    setSlipPreview(URL.createObjectURL(file))
  }

  const handleDepositSubmit = async () => {
    if (finalAmount < 20) { toast.error(th ? 'จำนวนขั้นต่ำ 20 บาท' : 'Min 20 THB'); return }
    if (!slipFile) { toast.error(th ? 'กรุณาแนบสลิป' : 'Please upload slip'); return }
    setDepositLoading(true)
    try {
      let slipUrl = '/placeholder.jpg'
      try { slipUrl = await storageAPI.uploadSlip(user.id, slipFile) } catch {}
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('deposits').insert({
        user_id: user.id,
        amount: finalAmount,
        slip_url: slipUrl,
        status: 'pending',
        payment_method: paymentMethod,
        slip_uploaded_at: new Date().toISOString(),
      })
      addTransaction({
        userId: user.id, type: 'deposit', amount: finalAmount,
        balanceBefore: user.balance, balanceAfter: user.balance + finalAmount,
        status: 'pending',
        description: th ? `รอตรวจสลิป ฿${finalAmount.toLocaleString()}` : `Slip pending ฿${finalAmount.toLocaleString()}`,
      })
      toast.success(th ? '📋 ส่งสลิปสำเร็จ รอ admin ตรวจสอบ (ประมาณ 5-30 นาที)' : '📋 Slip submitted! Admin review in 5-30 min')
      setDepositOpen(false); setDepositStep('amount'); setSlipFile(null); setSlipPreview(''); setCustomAmount('')
    } catch {
      addTransaction({
        userId: user.id, type: 'deposit', amount: finalAmount,
        balanceBefore: user.balance, balanceAfter: user.balance + finalAmount,
        status: 'pending', description: th ? `รอตรวจสลิป ฿${finalAmount.toLocaleString()}` : `Slip pending`,
      })
      toast.success(th ? '📋 ส่งสลิปสำเร็จ รอ admin ตรวจสอบ' : '📋 Slip submitted! Pending review')
      setDepositOpen(false); setDepositStep('amount'); setSlipFile(null); setSlipPreview(''); setCustomAmount('')
    } finally { setDepositLoading(false) }
  }

  const handleWithdraw = async () => {
    const amt = parseInt(withdrawAmount)
    if (!amt || amt < 100) { toast.error(th ? 'ถอนขั้นต่ำ 100 บาท' : 'Min withdrawal 100 THB'); return }
    if (amt > user.balance) { toast.error(th ? 'ยอดเงินไม่พอ' : 'Insufficient balance'); return }
    if (!withdrawBank) { toast.error(th ? 'เลือกธนาคาร' : 'Select bank'); return }
    if (!withdrawAccount || withdrawAccount.length < 10) { toast.error(th ? 'กรอกเลขบัญชีให้ถูกต้อง' : 'Enter valid account number'); return }
    setWithdrawLoading(true)
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.from('withdrawals').insert({ user_id: user.id, amount: amt, bank_account: withdrawAccount, bank_name: withdrawBank, status: 'pending' })
      await supabase.from('users').update({ balance: user.balance - amt }).eq('id', user.id)
      updateBalance(-amt)
    } catch { updateBalance(-amt) }
    addTransaction({ userId: user.id, type: 'withdrawal', amount: -amt, balanceBefore: user.balance, balanceAfter: user.balance - amt, status: 'pending', description: th ? `ถอนเงิน ${withdrawBank}` : `Withdrawal ${withdrawBank}` })
    toast.success(th ? `💸 ส่งคำขอถอนเงิน ฿${amt.toLocaleString()} รอ admin อนุมัติ` : `💸 Withdrawal ฿${amt.toLocaleString()} submitted`)
    setWithdrawOpen(false); setWithdrawAmount(''); setWithdrawBank(''); setWithdrawAccount('')
    setWithdrawLoading(false)
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshUser()
    await fetchTransactions(user.id)
    setIsRefreshing(false)
    toast.success(th ? 'อัปเดตแล้ว' : 'Refreshed')
  }

  const txIcon = (type: string, amt: number) => {
    if (type === 'deposit')    return <ArrowDownRight style={{ width: 16, height: 16, color: '#10b981' }} />
    if (type === 'withdrawal') return <ArrowUpRight   style={{ width: 16, height: 16, color: '#ef4444' }} />
    if (type === 'sale')       return <ArrowDownRight style={{ width: 16, height: 16, color: '#10b981' }} />
    if (type === 'gacha')      return <span style={{ fontSize: '14px' }}>🎲</span>
    if (type === 'purchase')   return <ArrowUpRight   style={{ width: 16, height: 16, color: '#ef4444' }} />
    return amt >= 0 ? <ArrowDownRight style={{ width: 16, height: 16, color: '#10b981' }} /> : <ArrowUpRight style={{ width: 16, height: 16, color: '#ef4444' }} />
  }

  const txStatusBadge = (status: string) => {
    if (status === 'completed') return <span style={{ fontSize: '11px', background: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '999px', padding: '2px 8px' }}>✓ {th ? 'สำเร็จ' : 'Done'}</span>
    if (status === 'pending')   return <span style={{ fontSize: '11px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '999px', padding: '2px 8px' }}>⏳ {th ? 'รอ' : 'Pending'}</span>
    return <span style={{ fontSize: '11px', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '999px', padding: '2px 8px' }}>✕ {th ? 'ล้มเหลว' : 'Failed'}</span>
  }

  const card = { background: '#0f0f1a', border: '1px solid #2a2a45', borderRadius: '14px', padding: '20px' }
  const stepBack = (to: 'amount' | 'payment' | 'qr' | 'slip') => <button onClick={() => setDepositStep(to)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #2a2a45', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px' }}>← {th ? 'ย้อนกลับ' : 'Back'}</button>

  const stepIndicator = (current: 'amount' | 'payment' | 'qr' | 'slip') => {
    const steps = [
      { key: 'amount',  label: th ? 'ยอด' : 'Amount' },
      { key: 'payment', label: th ? 'ช่องทาง' : 'Method' },
      { key: 'qr',      label: th ? 'QR/บัญชี' : 'QR/Account' },
      { key: 'slip',    label: th ? 'สลิป' : 'Slip' },
    ]
    const idx = steps.findIndex(s => s.key === current)
    return (
      <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
        {steps.map((s, i) => (
          <div key={s.key} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ height: '3px', borderRadius: '2px', background: i <= idx ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : '#2a2a45', marginBottom: '4px' }} />
            <span style={{ fontSize: '10px', color: i <= idx ? '#a78bfa' : '#64748b', fontFamily: 'monospace' }}>{s.label}</span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, maxWidth: '800px', margin: '0 auto', padding: '24px 16px', width: '100%', boxSizing: 'border-box' }}>

        {/* Balance Card */}
        <div style={{ ...card, marginBottom: '20px', background: 'linear-gradient(135deg,#1a0a2e,#0a0a2e)', border: '1px solid rgba(139,92,246,0.3)', boxShadow: '0 0 40px rgba(139,92,246,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '4px', fontFamily: 'monospace' }}>{th ? 'ยอดเงินคงเหลือ' : 'Available Balance'}</p>
              <p style={{ fontSize: '36px', fontWeight: '800', color: '#f1f5f9', margin: 0 }}>{formatPrice(user.balance, locale)}</p>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', fontFamily: 'monospace' }}>{th ? 'อัปเดตล่าสุด' : 'Last updated'}: {new Date().toLocaleTimeString(th ? 'th-TH' : 'en-US')}</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
              <button onClick={handleRefresh} disabled={isRefreshing} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '6px' }}>
                <RefreshCw style={{ width: 16, height: 16, animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
              </button>
              <Wallet style={{ width: '40px', height: '40px', color: 'rgba(139,92,246,0.4)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>

            {/* Deposit Dialog */}
            <Dialog open={depositOpen} onOpenChange={(o) => { setDepositOpen(o); if (!o) { setDepositStep('amount'); setSlipFile(null); setSlipPreview('') } }}>
              <DialogTrigger asChild>
                <button style={{ flex: '1 1 140px', padding: '12px', borderRadius: '10px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#ffffff', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 0 20px rgba(139,92,246,0.3)' }}>
                  <Plus style={{ width: 16, height: 16 }} /> {th ? 'เติมเงิน' : 'Deposit'}
                </button>
              </DialogTrigger>
              <DialogContent style={{ background: '#0f0f1a', border: '1px solid #2a2a45', color: '#f1f5f9', maxWidth: '440px', width: 'calc(100vw - 32px)' }}>
                <DialogHeader>
                  <DialogTitle style={{ color: '#f1f5f9', fontFamily: 'monospace' }}>{th ? '// เติมเงินเข้ากระเป๋า' : '// DEPOSIT TO WALLET'}</DialogTitle>
                  <DialogDescription style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>
                    {depositStep === 'amount'  && (th ? 'เลือกจำนวนเงินที่ต้องการเติม' : 'Select deposit amount')}
                    {depositStep === 'payment' && (th ? 'เลือกช่องทางการชำระเงิน' : 'Select payment method')}
                    {depositStep === 'qr'      && (th ? 'สแกน QR หรือโอนตามข้อมูลด้านล่าง' : 'Scan QR or transfer using info below')}
                    {depositStep === 'slip'    && (th ? 'แนบสลิปหรือหลักฐานการโอน' : 'Upload transfer slip or proof')}
                  </DialogDescription>
                </DialogHeader>

                <div style={{ padding: '0 0 8px' }}>
                  {stepIndicator(depositStep)}

                  {/* STEP: Amount */}
                  {depositStep === 'amount' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                        {depositAmounts.map(a => (
                          <button key={a} onClick={() => { setDepositAmount(a); setCustomAmount('') }} style={{ padding: '10px', borderRadius: '8px', border: `1px solid ${depositAmount === a && !customAmount ? '#8b5cf6' : '#2a2a45'}`, background: depositAmount === a && !customAmount ? 'rgba(139,92,246,0.15)' : '#1a1a2e', color: depositAmount === a && !customAmount ? '#a78bfa' : '#f1f5f9', fontWeight: '600', cursor: 'pointer', fontSize: '14px', fontFamily: 'monospace' }}>
                            ฿{a.toLocaleString()}
                          </button>
                        ))}
                      </div>
                      <input type="number" placeholder={th ? 'หรือใส่จำนวนเอง (ขั้นต่ำ 20 บาท)' : 'Custom amount (min ฿20)'} value={customAmount} onChange={e => setCustomAmount(e.target.value)} min={20} style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', fontFamily: 'monospace' }} />
                      <button onClick={() => setDepositStep('payment')} disabled={finalAmount < 20} style={{ padding: '12px', borderRadius: '8px', border: 'none', cursor: finalAmount >= 20 ? 'pointer' : 'not-allowed', background: finalAmount >= 20 ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : '#1e1e35', color: '#fff', fontWeight: '700', fontSize: '14px', fontFamily: 'monospace' }}>
                        {th ? `ถัดไป: เติม ฿${finalAmount.toLocaleString()}` : `Next: Deposit ฿${finalAmount.toLocaleString()}`} →
                      </button>
                    </div>
                  )}

                  {/* STEP: Payment Method */}
                  {depositStep === 'payment' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {paymentMethods.map(m => (
                        <button key={m.id} onClick={() => setPaymentMethod(m.id)} style={{ padding: '14px', borderRadius: '10px', cursor: 'pointer', textAlign: 'left', border: `1px solid ${paymentMethod === m.id ? '#8b5cf6' : '#2a2a45'}`, background: paymentMethod === m.id ? 'rgba(139,92,246,0.1)' : '#1a1a2e', width: '100%', display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ width: '36px', height: '36px', background: paymentMethod === m.id ? 'rgba(139,92,246,0.2)' : '#2a2a45', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <m.icon style={{ width: 18, height: 18, color: paymentMethod === m.id ? '#a78bfa' : '#64748b' }} />
                          </div>
                          <div>
                            <div style={{ fontWeight: '700', color: '#f1f5f9', fontSize: '14px', fontFamily: 'monospace' }}>{th ? m.label.th : m.label.en}</div>
                            <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>{th ? m.info.th : m.info.en}</div>
                          </div>
                        </button>
                      ))}
                      <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                        {stepBack('amount')}
                        <button onClick={() => setDepositStep('qr')} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'monospace' }}>
                          {th ? 'ถัดไป: ดูข้อมูลโอน' : 'Next: View Transfer Info'} →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP: QR Code / Account Info */}
                  {depositStep === 'qr' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {/* Amount highlight */}
                      <div style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                        <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', marginBottom: '4px' }}>{th ? 'ยอดที่ต้องโอน' : 'Amount to Transfer'}</div>
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#a78bfa', fontFamily: 'monospace' }}>฿{finalAmount.toLocaleString()}</div>
                      </div>

                      {/* QR Code or Account Info */}
                      {paymentMethod === 'promptpay' && (
                        <div style={{ background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                          {shopSettings.promptpay_qr_url ? (
                            <img src={shopSettings.promptpay_qr_url} alt="PromptPay QR" style={{ maxWidth: '200px', width: '100%', borderRadius: '8px', margin: '0 auto 12px' }} />
                          ) : (
                            <div style={{ width: '160px', height: '160px', margin: '0 auto 12px', background: '#2a2a45', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
                              <QrCode style={{ width: 48, height: 48, color: '#64748b' }} />
                              <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>{th ? 'ไม่มี QR Code' : 'No QR Code'}</span>
                            </div>
                          )}
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f1f5f9', fontFamily: 'monospace' }}>{th ? 'พร้อมเพย์:' : 'PromptPay:'} {shopSettings.promptpay_number}</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '4px' }}>{shopSettings.promptpay_name}</div>
                        </div>
                      )}
                      {paymentMethod === 'truemoney' && (
                        <div style={{ background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                          <Smartphone style={{ width: 48, height: 48, color: '#f59e0b', margin: '0 auto 12px' }} />
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1f5f9', fontFamily: 'monospace' }}>0812345678</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '4px' }}>TrueMoney Wallet</div>
                        </div>
                      )}
                      {paymentMethod === 'bank' && (
                        <div style={{ background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                          <Building2 style={{ width: 48, height: 48, color: '#34d399', margin: '0 auto 12px' }} />
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#f1f5f9', fontFamily: 'monospace' }}>{th ? 'กสิกรไทย (KBank)' : 'KBank'}</div>
                          <div style={{ fontSize: '20px', fontWeight: '900', color: '#a78bfa', fontFamily: 'monospace', marginTop: '4px' }}>123-4-56789-0</div>
                          <div style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace', marginTop: '4px' }}>{th ? 'ชื่อบัญชี: นาย GameShop' : 'Account: GameShop'}</div>
                        </div>
                      )}

                      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', padding: '10px 14px', fontSize: '12px', color: '#fbbf24', display: 'flex', gap: '8px', alignItems: 'flex-start', fontFamily: 'monospace' }}>
                        <AlertCircle style={{ width: 14, height: 14, flexShrink: 0, marginTop: '1px' }} />
                        {th ? 'โอนตามยอดที่แสดงด้านบน แล้วกดถัดไปเพื่อแนบสลิป' : 'Transfer the exact amount shown above, then upload your slip'}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {stepBack('payment')}
                        <button onClick={() => setDepositStep('slip')} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', fontWeight: '700', fontSize: '14px', cursor: 'pointer', fontFamily: 'monospace' }}>
                          {th ? 'ถัดไป: แนบสลิป' : 'Next: Upload Slip'} →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* STEP: Slip Upload */}
                  {depositStep === 'slip' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <label htmlFor="slip-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `2px dashed ${slipPreview ? '#8b5cf6' : '#2a2a45'}`, borderRadius: '12px', padding: '24px', cursor: 'pointer', background: slipPreview ? 'rgba(139,92,246,0.05)' : '#1a1a2e', minHeight: '140px' }}>
                        {slipPreview
                          ? <img src={slipPreview} alt="slip" style={{ maxHeight: '180px', borderRadius: '8px', objectFit: 'contain' }} />
                          : <>
                              <Upload style={{ width: 32, height: 32, color: '#64748b', marginBottom: '8px' }} />
                              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0, fontFamily: 'monospace' }}>{th ? 'คลิกเพื่ออัปโหลดสลิป' : 'Click to upload slip'}</p>
                              <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0', fontFamily: 'monospace' }}>PNG, JPG (max 5MB)</p>
                            </>
                        }
                        <input id="slip-upload" type="file" accept="image/*" onChange={handleSlipChange} style={{ display: 'none' }} />
                      </label>

                      <div style={{ background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', color: '#94a3b8', fontFamily: 'monospace' }}>
                        <strong style={{ color: '#f1f5f9' }}>{th ? 'ยอด:' : 'Amount:'}</strong> ฿{finalAmount.toLocaleString()}{' '}
                        <strong style={{ color: '#f1f5f9' }}>{th ? 'ช่องทาง:' : 'Method:'}</strong> {paymentMethods.find(m => m.id === paymentMethod)?.label[locale]}
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        {stepBack('qr')}
                        <button onClick={handleDepositSubmit} disabled={!slipFile || depositLoading} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', cursor: !slipFile || depositLoading ? 'not-allowed' : 'pointer', background: !slipFile || depositLoading ? '#1e1e35' : 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', fontWeight: '700', fontSize: '14px', fontFamily: 'monospace' }}>
                          {depositLoading ? '⏳ ...' : th ? '📤 ส่งสลิป' : '📤 Submit Slip'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {/* Withdraw Dialog */}
            <Dialog open={withdrawOpen} onOpenChange={setWithdrawOpen}>
              <DialogTrigger asChild>
                <button style={{ flex: '1 1 140px', padding: '12px', borderRadius: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.15)', color: '#f1f5f9', fontWeight: '700', fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <ArrowUpRight style={{ width: 16, height: 16 }} /> {th ? 'ถอนเงิน' : 'Withdraw'}
                </button>
              </DialogTrigger>
              <DialogContent style={{ background: '#0f0f1a', border: '1px solid #2a2a45', color: '#f1f5f9', maxWidth: '400px', width: 'calc(100vw - 32px)' }}>
                <DialogHeader>
                  <DialogTitle style={{ color: '#f1f5f9', fontFamily: 'monospace' }}>{th ? '// ถอนเงิน' : '// WITHDRAW'}</DialogTitle>
                  <DialogDescription style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: '12px' }}>
                    {th ? `ยอดที่ถอนได้: ${formatPrice(user.balance, locale)}` : `Available: ${formatPrice(user.balance, locale)}`}
                  </DialogDescription>
                </DialogHeader>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px 0 8px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', display: 'block', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{th ? 'จำนวนเงิน (ขั้นต่ำ 100 บาท)' : 'AMOUNT (MIN ฿100)'}</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="number" placeholder="0" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} max={user.balance} min={100} style={{ flex: 1, padding: '10px 14px', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', fontFamily: 'monospace', outline: 'none', boxSizing: 'border-box' }} />
                      <button onClick={() => setWithdrawAmount(user.balance.toString())} style={{ padding: '10px 12px', borderRadius: '8px', border: '1px solid #2a2a45', background: '#1a1a2e', color: '#94a3b8', cursor: 'pointer', fontSize: '12px', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{th ? 'ทั้งหมด' : 'All'}</button>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', display: 'block', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{th ? 'ธนาคาร' : 'BANK'}</label>
                    <select value={withdrawBank} onChange={e => setWithdrawBank(e.target.value)} style={{ width: '100%', padding: '10px 14px', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', color: withdrawBank ? '#f1f5f9' : '#64748b', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'monospace' }}>
                      <option value="">{th ? 'เลือกธนาคาร...' : 'Select bank...'}</option>
                      {banks.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#64748b', marginBottom: '6px', display: 'block', fontFamily: 'monospace', letterSpacing: '0.05em' }}>{th ? 'เลขที่บัญชี' : 'ACCOUNT NUMBER'}</label>
                    <input type="text" placeholder="xxx-x-xxxxx-x" value={withdrawAccount} onChange={e => setWithdrawAccount(e.target.value)} style={{ width: '100%', padding: '10px 14px', boxSizing: 'border-box', background: '#1a1a2e', border: '1px solid #2a2a45', borderRadius: '8px', color: '#f1f5f9', fontSize: '14px', fontFamily: 'monospace', outline: 'none' }} />
                  </div>
                  <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '8px', padding: '10px 12px', fontSize: '12px', color: '#fbbf24', fontFamily: 'monospace' }}>
                    ⚠️ {th ? 'การถอนเงินจะถูกตรวจสอบโดย admin ก่อนโอน (1-24 ชั่วโมง)' : 'Withdrawal reviewed by admin before transfer (1-24 hours)'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setWithdrawOpen(false)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #2a2a45', background: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '14px', fontFamily: 'monospace' }}>{th ? 'ยกเลิก' : 'Cancel'}</button>
                    <button onClick={handleWithdraw} disabled={withdrawLoading || !withdrawAmount || parseInt(withdrawAmount) > user.balance || !withdrawBank || !withdrawAccount} style={{ flex: 2, padding: '10px', borderRadius: '8px', border: 'none', fontWeight: '700', fontSize: '14px', cursor: 'pointer', background: withdrawLoading ? '#1e1e35' : 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', fontFamily: 'monospace' }}>
                      {withdrawLoading ? '⏳...' : th ? '💸 ส่งคำขอถอน' : '💸 Submit Withdrawal'}
                    </button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '10px', marginBottom: '20px' }}>
          {[
            { label: th ? 'ฝากทั้งหมด' : 'Total Deposited',  val: userTxns.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((s, t) => s + t.amount, 0), color: '#10b981' },
            { label: th ? 'ใช้จ่ายทั้งหมด' : 'Total Spent',  val: Math.abs(userTxns.filter(t => t.type === 'purchase' || t.type === 'gacha').reduce((s, t) => s + t.amount, 0)), color: '#f59e0b' },
            { label: th ? 'รายได้จากขาย' : 'Sales Revenue',  val: userTxns.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0), color: '#8b5cf6' },
          ].map((stat, i) => (
            <div key={i} style={{ ...card, textAlign: 'center', padding: '14px' }}>
              <div style={{ fontSize: '18px', fontWeight: '800', color: stat.color, fontFamily: 'monospace' }}>฿{stat.val.toLocaleString()}</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', fontFamily: 'monospace' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Transaction History */}
        <div style={card}>
          <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f1f5f9', marginBottom: '4px', fontFamily: 'monospace' }}>{th ? '📋 ประวัติธุรกรรม' : '📋 Transaction History'}</h2>
          <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', fontFamily: 'monospace' }}>{th ? 'รายการทั้งหมดของคุณ' : 'All your transactions'}</p>
          {userTxns.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
              <Wallet style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.3 }} />
              <p style={{ margin: 0, fontFamily: 'monospace' }}>{th ? 'ยังไม่มีธุรกรรม' : 'No transactions yet'}</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {userTxns.slice(0, 50).map((txn, i) => (
                <div key={txn.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', borderBottom: i < userTxns.length - 1 ? '1px solid #1e1e35' : 'none' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: txn.amount >= 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {txIcon(txn.type, txn.amount)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', color: '#f1f5f9', fontWeight: '500', fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{txn.description}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>{formatDate(txn.createdAt, locale)}</div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: txn.amount >= 0 ? '#10b981' : '#ef4444', fontFamily: 'monospace' }}>{txn.amount >= 0 ? '+' : ''}{formatPrice(txn.amount, locale)}</div>
                    <div style={{ marginTop: '4px' }}>{txStatusBadge(txn.status)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        input:focus, select:focus { border-color: #8b5cf6 !important; outline: none !important; }
      `}</style>
    </div>
  )
}
