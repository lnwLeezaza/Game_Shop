'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Bell, Lock, Camera, Save, Trophy, Star, Zap, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore } from '@/lib/store'
import { useLocale } from '@/hooks/use-locale'
import { toast } from 'sonner'

const TIER_CONFIG = {
  bronze: { label: 'Bronze', icon: '🥉', color: '#cd7f32', bg: 'linear-gradient(135deg,#fdf0e8,#fde8d4)', border: '#e8a87c', next: 500,  prev: 0    },
  silver: { label: 'Silver', icon: '🥈', color: '#94a3b8', bg: 'linear-gradient(135deg,#f1f5f9,#e2e8f0)', border: '#94a3b8', next: 2000, prev: 500  },
  gold:   { label: 'Gold',   icon: '🥇', color: '#ca8a04', bg: 'linear-gradient(135deg,#fefce8,#fef9c3)', border: '#fbbf24', next: 5000, prev: 2000 },
  vip:    { label: 'VIP',    icon: '👑', color: '#7c3aed', bg: 'linear-gradient(135deg,#f5f3ff,#ede9fe)', border: '#a78bfa', next: null, prev: 5000 },
}

const TIER_PERKS: Record<string, { icon: string; text: string }[]> = {
  bronze: [
    { icon: '🛒', text: 'ซื้อ/สุ่มได้ปกติ' },
    { icon: '📊', text: 'ดูประวัติแต้ม' },
    { icon: '🎁', text: 'แลกของได้ (ถ้ามี balance)' },
    { icon: '💬', text: 'ยังไม่มียศ Discord' },
  ],
  silver: [
    { icon: '🛍️', text: 'แลกของในร้าน' },
    { icon: '🎮', text: 'ยศ Silver ใน Discord' },
    { icon: '🚪', text: 'ห้อง #silver-lounge' },
    { icon: '🔔', text: 'ping สินค้าใหม่' },
  ],
  gold: [
    { icon: '💰', text: 'แลกของ + cashback' },
    { icon: '⚡', text: 'Early access 24 ชม.' },
    { icon: '🎮', text: 'ยศ Gold ใน Discord' },
    { icon: '🚪', text: 'ห้อง #gold-deals' },
    { icon: '🎯', text: 'Priority support' },
  ],
  vip: [
    { icon: '💎', text: 'แลกของ exclusive' },
    { icon: '⚡', text: 'Early access 72 ชม.' },
    { icon: '👑', text: 'ยศ VIP + ชื่อสีพิเศษ' },
    { icon: '🚪', text: 'ห้อง #vip-only' },
    { icon: '🗳️', text: 'โหวต gacha pool' },
  ],
}

export default function ProfilePage() {
  const router = useRouter()
  const { user, updateUser } = useAuthStore()
  const { locale } = useLocale()

  const [displayName, setDisplayName] = useState('')
  const [emailNotif, setEmailNotif] = useState(true)
  const [pushNotif, setPushNotif] = useState(true)
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!user) { router.push('/login'); return }
    setDisplayName(user.displayName)
  }, [user])

  const handleSaveProfile = async () => {
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 500))
    updateUser({ displayName })
    toast.success('บันทึกข้อมูลสำเร็จ')
    setIsSaving(false)
  }

  const handleChangePassword = async () => {
    if (!oldPass || !newPass) { toast.error('กรุณากรอกข้อมูลให้ครบ'); return }
    if (newPass !== confirmPass) { toast.error('รหัสผ่านไม่ตรงกัน'); return }
    if (newPass.length < 6) { toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัว'); return }
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 500))
    toast.success('เปลี่ยนรหัสผ่านสำเร็จ')
    setOldPass(''); setNewPass(''); setConfirmPass('')
    setIsSaving(false)
  }

  if (!user) return null

  const tier = TIER_CONFIG[user.tier] || TIER_CONFIG.bronze
  const perks = TIER_PERKS[user.tier] || TIER_PERKS.bronze
  const pct = tier.next ? Math.min(((user.lifetimePoints - tier.prev) / (tier.next - tier.prev)) * 100, 100) : 100
  const nextTierLabel = user.tier === 'silver' ? '🥇 Gold' : user.tier === 'bronze' ? '🥈 Silver' : user.tier === 'gold' ? '👑 VIP' : null

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold mb-4">ตั้งค่าบัญชี</h1>

        {/* ── Tier Card ── */}
        <div className="relative rounded-3xl overflow-hidden mb-5"
          style={{ background: tier.bg, border: `1.5px solid ${tier.border}`, boxShadow: `0 8px 32px ${tier.color}22` }}>
          {/* bg glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
            style={{ background: tier.color, filter: 'blur(60px)', opacity: 0.15 }} />

          <div className="relative z-10 p-5">
            {/* top row */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                  style={{ background: 'rgba(255,255,255,0.6)', boxShadow: `0 4px 16px ${tier.color}30` }}>
                  {tier.icon}
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: tier.color }}>ระดับปัจจุบัน</div>
                  <div className="text-[22px] font-extrabold leading-tight" style={{ color: tier.color }}>{tier.label}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold" style={{ color: `${tier.color}99` }}>แต้มสะสม</div>
                <div className="text-[28px] font-extrabold leading-none" style={{ color: tier.color }}>{user.lifetimePoints.toLocaleString()}</div>
                <div className="text-[10px]" style={{ color: `${tier.color}88` }}>lifetime points</div>
              </div>
            </div>

            {/* progress bar */}
            {tier.next && (
              <div className="mb-4">
                <div className="flex justify-between text-[10px] font-semibold mb-1.5" style={{ color: `${tier.color}99` }}>
                  <span>{tier.label} ({tier.prev.toLocaleString()} pt)</span>
                  <span>{nextTierLabel} ({tier.next.toLocaleString()} pt)</span>
                </div>
                <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.5)', border: `1px solid ${tier.border}` }}>
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${tier.color}, ${tier.color}bb)`, boxShadow: `0 0 10px ${tier.color}66` }} />
                </div>
                <div className="flex justify-between mt-1.5">
                  <div className="text-[10px] font-semibold" style={{ color: tier.color }}>
                    {pct.toFixed(0)}% ของ {nextTierLabel}
                  </div>
                  <div className="text-[10px] font-bold" style={{ color: tier.color }}>
                    อีก {(tier.next - user.lifetimePoints).toLocaleString()} pt ✨
                  </div>
                </div>
              </div>
            )}

            {user.tier === 'vip' && (
              <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)' }}>
                <Crown size={14} style={{ color: '#7c3aed' }} />
                <span className="text-[12px] font-bold" style={{ color: '#7c3aed' }}>คุณอยู่ในระดับสูงสุดแล้ว! 🎉</span>
              </div>
            )}

            {/* balance points */}
            <div className="flex items-center gap-3 p-3 rounded-2xl mb-4"
              style={{ background: 'rgba(255,255,255,0.6)', border: `1px solid ${tier.border}` }}>
              <Star size={16} style={{ color: tier.color, flexShrink: 0 }} />
              <div className="flex-1">
                <div className="text-[11px] font-semibold" style={{ color: `${tier.color}99` }}>แต้มคงเหลือ (ใช้แลกของได้)</div>
                <div className="text-[18px] font-extrabold leading-none" style={{ color: tier.color }}>{user.balancePoints.toLocaleString()} pt</div>
              </div>
              <Zap size={14} style={{ color: tier.color }} />
            </div>

            {/* perks */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: `${tier.color}88` }}>สิทธิประโยชน์ของคุณ</div>
              <div className="grid grid-cols-2 gap-1.5">
                {perks.map((perk, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xl text-[11px] font-semibold"
                    style={{ background: 'rgba(255,255,255,0.7)', border: `1px solid ${tier.border}`, color: '#334155' }}>
                    <span>{perk.icon}</span>{perk.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="profile">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="profile" className="flex-1"><User className="w-4 h-4 mr-1" />โปรไฟล์</TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1"><Bell className="w-4 h-4 mr-1" />แจ้งเตือน</TabsTrigger>
            <TabsTrigger value="security" className="flex-1"><Lock className="w-4 h-4 mr-1" />ความปลอดภัย</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={user.avatar} />
                      <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <button className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1">
                      <Camera className="w-3 h-3" />
                    </button>
                  </div>
                  <div>
                    <p className="font-semibold">{user.displayName}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-sm">{tier.icon}</span>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full text-white"
                        style={{ background: tier.color }}>{tier.label}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>ชื่อที่แสดง</Label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ชื่อผู้ใช้</Label>
                  <Input value={user.username} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="opacity-60" />
                </div>
                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
                  <Save className="w-4 h-4 mr-2" />บันทึก
                </Button>
              </CardContent>
            </Card>

            {user.role === 'buyer' && (
              <Card className="mt-4" style={{ border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.05)' }}>
                <CardContent className="p-5 space-y-3">
                  <p className="font-bold" style={{ color: '#a78bfa' }}>🏪 สมัครเป็นผู้ขาย</p>
                  <p className="text-sm text-muted-foreground">อัปเกรดบัญชีเพื่อลงขายสินค้าในร้านได้ทันที</p>
                  <Button onClick={async () => {
                    setIsSaving(true)
                    try {
                      const { supabase } = await import('@/lib/supabase')
                      const { data: { user: authUser } } = await supabase.auth.getUser()
                      if (authUser) await supabase.from('users').update({ role: 'seller' }).eq('id', authUser.id)
                      updateUser({ role: 'seller' })
                      toast.success('🎉 สมัครเป็นผู้ขายสำเร็จ!')
                    } catch {
                      updateUser({ role: 'seller' })
                      toast.success('🎉 สมัครเป็นผู้ขายสำเร็จ!')
                    }
                    setIsSaving(false)
                  }} disabled={isSaving}
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#fff', fontWeight: 'bold' }}
                    className="w-full">
                    [ สมัครเป็นผู้ขาย ]
                  </Button>
                </CardContent>
              </Card>
            )}

            {user.role === 'seller' && (
              <Card className="mt-4" style={{ border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.05)' }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#4ade80' }}>คุณเป็นผู้ขายแล้ว</p>
                    <p className="text-xs text-muted-foreground">สามารถลงขายสินค้าได้ใน Dashboard</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">แจ้งเตือนทางอีเมล</p>
                    <p className="text-sm text-muted-foreground">รับการแจ้งเตือนผ่านอีเมล</p>
                  </div>
                  <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">แจ้งเตือน Push</p>
                    <p className="text-sm text-muted-foreground">รับการแจ้งเตือนแบบ Push</p>
                  </div>
                  <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
                </div>
                <Button onClick={() => toast.success('บันทึกแล้ว')} className="w-full">บันทึกการตั้งค่า</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">เปลี่ยนรหัสผ่าน</h3>
                <div className="space-y-2">
                  <Label>รหัสผ่านปัจจุบัน</Label>
                  <Input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>รหัสผ่านใหม่</Label>
                  <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>ยืนยันรหัสผ่านใหม่</Label>
                  <Input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
                </div>
                <Button onClick={handleChangePassword} disabled={isSaving} className="w-full">เปลี่ยนรหัสผ่าน</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}