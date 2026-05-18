'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Wallet, Plus, ArrowUpRight, ArrowDownRight, QrCode,
  Smartphone, Building2, Upload, AlertCircle, RefreshCw,
  Shield, Zap, Clock, CheckCircle2, XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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

// ── Step Indicator ────────────────────────────────────────
function DepositStepBar({ current }: { current: 'amount' | 'payment' | 'qr' | 'slip' }) {
  const steps = [
    { key: 'amount',  label: 'ยอดเงิน' },
    { key: 'payment', label: 'ช่องทาง' },
    { key: 'qr',      label: 'QR/บัญชี' },
    { key: 'slip',    label: 'สลิป' },
  ]
  const idx = steps.findIndex(s => s.key === current)
  return (
    <div className="flex items-center justify-between mb-5">
      {steps.map((step, i) => (
        <div key={step.key} className="flex items-center flex-1">
          <div className="flex flex-col items-center shrink-0">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                i < idx ? 'text-white' : i === idx ? 'text-white ring-4 ring-primary/20' : 'bg-secondary text-muted-foreground border border-border'
              }`}
              style={i <= idx ? { background: 'linear-gradient(135deg, #d946a8, #7c3aed)' } : {}}
            >
              {i < idx ? '✓' : i + 1}
            </div>
            <span className={`mt-1 text-[9px] font-semibold whitespace-nowrap ${i === idx ? 'text-primary' : 'text-muted-foreground'}`}>
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-[2px] flex-1 mx-1.5 mb-4 rounded-full ${i < idx ? 'bg-primary' : 'bg-border'}`} />
          )}
        </div>
      ))}
    </div>
  )
}

// ── Transaction Icon ──────────────────────────────────────
function TxIcon({ type, amount }: { type: string; amount: number }) {
  const up = amount < 0 || type === 'purchase' || type === 'withdrawal' || type === 'gacha'
  if (type === 'gacha') return <span className="text-sm">🎲</span>
  return up
    ? <ArrowUpRight className="w-4 h-4 text-red-500" />
    : <ArrowDownRight className="w-4 h-4 text-emerald-500" />
}

// ── Status Badge ──────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  if (status === 'completed') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
      <CheckCircle2 size={9} /> สำเร็จ
    </span>
  )
  if (status === 'pending') return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
      <Clock size={9} /> รอดำเนินการ
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-500 border border-red-200">
      <XCircle size={9} /> ล้มเหลว
    </span>
  )
}

// ── Main Page ─────────────────────────────────────────────
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
  const [isRefreshing, setIsRefreshing]     = useState(false)
  const [shopSettings, setShopSettings]     = useState({
    promptpay_number: '0812345678',
    promptpay_name: 'GameShop',
    promptpay_qr_url: '',
  })

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    fetchTransactions(user.id)
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
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const userTxns = transactions.filter(t => t.userId === user.id)
  const finalAmount = customAmount ? parseInt(customAmount) || 0 : depositAmount

  const handleSlipChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    console.log('file selected:', file)
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('ไฟล์ใหญ่เกิน 5MB'); return }
    setSlipFile(file)
    const url = URL.createObjectURL(file)
    console.log('preview url:', url)
    setSlipPreview(url)
  }

  const handleDepositSubmit = async () => {
    if (finalAmount < 20) { toast.error('จำนวนขั้นต่ำ 20 บาท'); return }
    if (!slipFile) { toast.error('กรุณาแนบสลิป'); return }
    setDepositLoading(true)

    try {
      const form = new FormData()
      form.append("slip", slipFile)
      form.append("amount", String(finalAmount))
      form.append("paymentMethod", paymentMethod)

      const res = await fetch("/api/verify-slip", { method: "POST", body: form })
      const data = await res.json()

      if (!res.ok) {
        toast.error(`❌ ${data.error}`)
        return
      }

      updateBalance(data.amount)
      addTransaction({
        userId: user.id,
        type: 'deposit',
        amount: data.amount,
        balanceBefore: user.balance,
        balanceAfter: user.balance + data.amount,
        status: 'completed',
        description: `เติมเงินผ่านสลิป ฿${data.amount.toLocaleString()}`,
      })

        await fetchTransactions(user.id) // เพิ่มบรรทัดนี้

      toast.success(`✅ เติมเงิน ฿${data.amount.toLocaleString()} สำเร็จ!`)
      setDepositOpen(false)
      setDepositStep('amount')
      setSlipFile(null)
      setSlipPreview('')
      setCustomAmount('')

    } catch {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่')
    } finally {
      setDepositLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await refreshUser()
    await fetchTransactions(user.id)
    setIsRefreshing(false)
    toast.success('อัปเดตแล้ว')
  }

  const inputCls = "w-full bg-background border-2 border-border rounded-xl px-4 py-2.5 text-foreground text-sm font-medium placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary transition-all"

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8 space-y-5">

          {/* ── Balance Card ── */}
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #c026d3 0%, #7c3aed 50%, #1e1b4b 100%)' }} />
            <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none">
              <defs>
                <pattern id="wgrid" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#wgrid)" />
            </svg>
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: '#f0abfc', filter: 'blur(60px)', opacity: 0.2 }} />

            <div className="relative z-10 p-7">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-1">ยอดเงินคงเหลือ</p>
                  <p className="text-4xl font-black text-white">{formatPrice(user.balance, locale)}</p>
                  <p className="text-white/40 text-xs mt-1">อัปเดต: {new Date().toLocaleTimeString('th-TH')}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button onClick={handleRefresh} disabled={isRefreshing} className="w-8 h-8 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors">
                    <RefreshCw size={13} className={`text-white ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                  <Wallet size={36} className="text-white/20" />
                </div>
              </div>

              {/* Trust row */}
              <div className="flex gap-3 mb-5 flex-wrap">
                {[{ icon: <Shield size={10} />, label: 'ปลอดภัย 100%' }, { icon: <Zap size={10} />, label: 'เติมทันที' }, { icon: <Clock size={10} />, label: '24/7' }].map((t, i) => (
                  <div key={i} className="flex items-center gap-1 text-[10px] font-semibold text-white/60 bg-white/10 px-2.5 py-1 rounded-full border border-white/10">
                    {t.icon} {t.label}
                  </div>
                ))}
              </div>

              {/* Action button - Deposit only */}
              <Dialog open={depositOpen} onOpenChange={(o) => { setDepositOpen(o); if (!o) { setDepositStep('amount'); setSlipFile(null); setSlipPreview('') } }}>
                <DialogTrigger asChild>
                  <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all hover:opacity-90 active:scale-95 shadow-lg"
                    style={{ background: '#fff', color: '#7c3aed' }}>
                    <Plus size={15} /> เติมเงิน
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-white border border-border max-w-md w-[calc(100vw-32px)] rounded-3xl p-0 overflow-hidden">
                  <div className="h-1" style={{ background: 'linear-gradient(90deg, #d946a8, #7c3aed, #6366f1)' }} />
                  <div className="p-6">
                    <DialogHeader className="mb-4">
                      <DialogTitle className="text-[#1a1028] font-extrabold text-lg">เติมเงินเข้ากระเป๋า</DialogTitle>
                      <DialogDescription className="text-muted-foreground text-sm">
                        {depositStep === 'amount'  && 'เลือกหรือกรอกจำนวนเงิน'}
                        {depositStep === 'payment' && 'เลือกช่องทางการชำระเงิน'}
                        {depositStep === 'qr'      && 'สแกน QR หรือโอนตามข้อมูลด้านล่าง'}
                        {depositStep === 'slip'    && 'แนบสลิปหลักฐานการโอนเงิน'}
                      </DialogDescription>
                    </DialogHeader>

                    <DepositStepBar current={depositStep} />

                    {/* STEP 1: Amount */}
                    {depositStep === 'amount' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-3 gap-2">
                          {depositAmounts.map(a => (
                            <button key={a} onClick={() => { setDepositAmount(a); setCustomAmount('') }}
                              className={`py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                                depositAmount === a && !customAmount
                                  ? 'border-primary bg-primary/8 text-primary scale-[1.02]'
                                  : 'border-border bg-background text-foreground hover:border-primary/40'
                              }`}>
                              ฿{a.toLocaleString()}
                            </button>
                          ))}
                        </div>
                        <input type="number" placeholder="หรือใส่จำนวนเอง (ขั้นต่ำ 20 บาท)" value={customAmount}
                          onChange={e => setCustomAmount(e.target.value)} min={20} className={inputCls} />
                        <button onClick={() => setDepositStep('payment')} disabled={finalAmount < 20}
                          className="w-full py-3 rounded-2xl text-white font-bold text-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-40"
                          style={{ background: 'linear-gradient(135deg, #d946a8, #7c3aed)', boxShadow: '0 4px 16px rgba(124,58,237,0.25)' }}>
                          ถัดไป: เติม ฿{finalAmount.toLocaleString()} →
                        </button>
                      </div>
                    )}

                    {/* STEP 2: Payment Method */}
                    {depositStep === 'payment' && (
                      <div className="space-y-3">
                        {paymentMethods.map(m => (
                          <button key={m.id} onClick={() => setPaymentMethod(m.id)}
                            className={`w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left ${
                              paymentMethod === m.id ? 'border-primary bg-primary/5' : 'border-border bg-background hover:border-primary/40'
                            }`}>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === m.id ? 'bg-primary/10' : 'bg-secondary'}`}>
                              <m.icon size={18} className={paymentMethod === m.id ? 'text-primary' : 'text-muted-foreground'} />
                            </div>
                            <div>
                              <div className="text-sm font-bold text-foreground">{th ? m.label.th : m.label.en}</div>
                              <div className="text-xs text-muted-foreground">{th ? m.info.th : m.info.en}</div>
                            </div>
                            {paymentMethod === m.id && (
                              <div className="ml-auto w-5 h-5 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #d946a8, #7c3aed)' }}>
                                <svg viewBox="0 0 10 10" className="w-3 h-3"><path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
                              </div>
                            )}
                          </button>
                        ))}
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => setDepositStep('amount')} className="flex-1 py-2.5 rounded-xl border-2 border-border text-muted-foreground text-sm font-semibold hover:border-primary/40 transition-colors">← ย้อนกลับ</button>
                          <button onClick={() => setDepositStep('qr')}
                            className="flex-[2] py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                            style={{ background: 'linear-gradient(135deg, #d946a8, #7c3aed)' }}>
                            ถัดไป: ดูข้อมูลโอน →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: QR / Account */}
                    {depositStep === 'qr' && (
                      <div className="space-y-4">
                        <div className="rounded-2xl p-4 text-center" style={{ background: 'linear-gradient(135deg, rgba(217,70,168,0.07), rgba(124,58,237,0.07))', border: '1px solid rgba(124,58,237,0.15)' }}>
                          <p className="text-muted-foreground text-xs mb-1">ยอดที่ต้องโอน</p>
                          <p className="text-3xl font-black" style={{ background: 'linear-gradient(135deg, #d946a8, #7c3aed)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            ฿{finalAmount.toLocaleString()}
                          </p>
                        </div>

                        <div className="bg-secondary/40 border border-border rounded-2xl p-5 flex flex-col items-center gap-3">
                          {paymentMethod === 'promptpay' && (
                            <>
                              <img
                                src={`https://promptpay.io/${shopSettings.promptpay_number}/${finalAmount}.png`}
                                alt="QR PromptPay"
                                className="w-40 h-40 rounded-xl object-cover"
                              />
                              <div className="text-center">
                                <div className="font-bold text-foreground text-sm">พร้อมเพย์: {shopSettings.promptpay_number}</div>
                                <div className="text-muted-foreground text-xs">{shopSettings.promptpay_name}</div>
                              </div>
                            </>
                          )}
                          {paymentMethod === 'truemoney' && (
                            <>
                              <Smartphone size={48} className="text-amber-500" />
                              <div className="text-center">
                                <div className="font-black text-foreground text-xl">0812345678</div>
                                <div className="text-muted-foreground text-xs">TrueMoney Wallet</div>
                              </div>
                            </>
                          )}
                          {paymentMethod === 'bank' && (
                            <>
                              <Building2 size={48} className="text-emerald-500" />
                              <div className="text-center">
                                <div className="font-bold text-foreground text-sm">กสิกรไทย (KBank)</div>
                                <div className="font-black text-2xl" style={{ color: '#7c3aed' }}>123-4-56789-0</div>
                                <div className="text-muted-foreground text-xs">ชื่อบัญชี: นาย GameShop</div>
                              </div>
                            </>
                          )}
                        </div>

                        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 text-xs font-medium">
                          <AlertCircle size={13} className="shrink-0 mt-0.5" />
                          โอนตามยอดที่แสดงด้านบน แล้วกดถัดไปเพื่อแนบสลิป
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => setDepositStep('payment')} className="flex-1 py-2.5 rounded-xl border-2 border-border text-muted-foreground text-sm font-semibold hover:border-primary/40 transition-colors">← ย้อนกลับ</button>
                          <button onClick={() => setDepositStep('slip')}
                            className="flex-[2] py-2.5 rounded-xl text-white font-bold text-sm hover:opacity-90 transition-opacity"
                            style={{ background: 'linear-gradient(135deg, #d946a8, #7c3aed)' }}>
                            ถัดไป: แนบสลิป →
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 4: Slip */}
                    {depositStep === 'slip' && (
                      <div className="space-y-4">
                        <label htmlFor="slip-upload"
                          className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition-all min-h-[140px] ${slipPreview ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30 hover:border-primary/40'}`}>
                          {slipPreview
                            ? <img src={slipPreview} alt="slip" className="max-h-44 rounded-xl object-contain" />
                            : <>
                                <Upload size={32} className="text-muted-foreground/50 mb-2" />
                                <p className="text-sm text-muted-foreground font-medium">คลิกเพื่ออัปโหลดสลิป</p>
                                <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG (สูงสุด 5MB)</p>
                              </>
                          }
                          <input id="slip-upload" type="file" accept="image/*" onChange={handleSlipChange} className="hidden" />
                        </label>

                        <div className="flex items-center justify-between bg-secondary/50 border border-border rounded-xl px-4 py-3 text-sm">
                          <span className="text-muted-foreground">ยอด</span>
                          <span className="font-bold text-foreground">฿{finalAmount.toLocaleString()}</span>
                          <span className="text-muted-foreground">ช่องทาง</span>
                          <span className="font-bold text-foreground">{paymentMethods.find(m => m.id === paymentMethod)?.label.th}</span>
                        </div>

                        <div className="flex gap-2">
                          <button onClick={() => setDepositStep('qr')} className="flex-1 py-2.5 rounded-xl border-2 border-border text-muted-foreground text-sm font-semibold hover:border-primary/40 transition-colors">← ย้อนกลับ</button>
                          <button onClick={handleDepositSubmit} disabled={!slipFile || depositLoading}
                            className="flex-[2] py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-40 hover:opacity-90 active:scale-95 transition-all"
                            style={{ background: 'linear-gradient(135deg, #d946a8, #7c3aed)' }}>
                            {depositLoading ? '⏳ กำลังส่ง...' : '📤 ส่งสลิป'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* ── Quick Stats ── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'ฝากทั้งหมด',     val: userTxns.filter(t => t.type === 'deposit' && t.status === 'completed').reduce((s, t) => s + t.amount, 0),                color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', icon: <ArrowDownRight size={14} className="text-emerald-500" /> },
              { label: 'ใช้จ่ายทั้งหมด', val: Math.abs(userTxns.filter(t => t.type === 'purchase' || t.type === 'gacha').reduce((s, t) => s + t.amount, 0)),           color: 'text-amber-600',   bg: 'bg-amber-50 border-amber-100',     icon: <ArrowUpRight size={14} className="text-amber-500" /> },
              { label: 'รายได้จากขาย',   val: userTxns.filter(t => t.type === 'sale').reduce((s, t) => s + t.amount, 0),                                               color: 'text-primary',     bg: 'bg-primary/5 border-primary/10',   icon: <Wallet size={14} className="text-primary" /> },
            ].map((stat, i) => (
              <div key={i} className={`rounded-2xl border p-4 ${stat.bg}`}>
                <div className="flex items-center gap-1.5 mb-2">{stat.icon}<span className="text-[10px] text-muted-foreground font-semibold">{stat.label}</span></div>
                <div className={`text-lg font-black ${stat.color}`}>฿{stat.val.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* ── Transaction History ── */}
          <div className="bg-white border border-border rounded-3xl overflow-hidden shadow-sm">
            <div className="h-1" style={{ background: 'linear-gradient(90deg, #d946a8, #7c3aed, #6366f1)' }} />
            <div className="p-5">
              <h2 className="text-[#1a1028] font-extrabold text-base mb-0.5">ประวัติธุรกรรม</h2>
              <p className="text-muted-foreground text-xs mb-4">รายการทั้งหมดของคุณ</p>

              {userTxns.length === 0 ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <Wallet size={40} className="text-muted-foreground/20" />
                  <p className="text-muted-foreground text-sm">ยังไม่มีธุรกรรม</p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {userTxns.slice(0, 50).map((txn, i) => (
                    <div key={txn.id} className="flex items-center gap-3 py-3.5">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${txn.amount >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        <TxIcon type={txn.type} amount={txn.amount} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1a1028] truncate">{txn.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(txn.createdAt, locale)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-black ${txn.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {txn.amount >= 0 ? '+' : ''}{formatPrice(txn.amount, locale)}
                        </p>
                        <div className="mt-1"><StatusBadge status={txn.status} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer trust */}
          <div className="flex items-center justify-center gap-5 py-2">
            {[{ icon: '🔒', label: 'SSL Secured' }, { icon: '⚡', label: 'ฝาก-ถอนไว' }, { icon: '🛡️', label: 'ปลอดภัย 100%' }].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                <span>{item.icon}</span>{item.label}
              </div>
            ))}
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}