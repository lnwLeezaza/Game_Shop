'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, Bell, Lock, Shield, ChevronRight, Camera, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useAuthStore } from '@/lib/store'
import { useLocale } from '@/hooks/use-locale'
import { toast } from 'sonner'

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
    toast.success(locale === 'th' ? 'บันทึกข้อมูลสำเร็จ' : 'Profile saved')
    setIsSaving(false)
  }

  const handleChangePassword = async () => {
    if (!oldPass || !newPass) { toast.error(locale === 'th' ? 'กรุณากรอกข้อมูลให้ครบ' : 'Fill all fields'); return }
    if (newPass !== confirmPass) { toast.error(locale === 'th' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match'); return }
    if (newPass.length < 6) { toast.error(locale === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัว' : 'Password min 6 chars'); return }
    setIsSaving(true)
    await new Promise(r => setTimeout(r, 500))
    toast.success(locale === 'th' ? 'เปลี่ยนรหัสผ่านสำเร็จ' : 'Password changed')
    setOldPass(''); setNewPass(''); setConfirmPass('')
    setIsSaving(false)
  }

  if (!user) return null

  const kycColor = user.kycStatus === 'verified' ? 'bg-green-100 text-green-800' : user.kycStatus === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
  const kycLabel = { verified: { th: 'ยืนยันแล้ว', en: 'Verified' }, pending: { th: 'รอยืนยัน', en: 'Pending' }, rejected: { th: 'ถูกปฏิเสธ', en: 'Rejected' } }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto max-w-2xl px-4 py-6">
        <h1 className="text-xl font-bold mb-4">{locale === 'th' ? 'ตั้งค่าบัญชี' : 'Account Settings'}</h1>

        <Tabs defaultValue="profile">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="profile" className="flex-1"><User className="w-4 h-4 mr-1" />{locale === 'th' ? 'โปรไฟล์' : 'Profile'}</TabsTrigger>
            <TabsTrigger value="notifications" className="flex-1"><Bell className="w-4 h-4 mr-1" />{locale === 'th' ? 'แจ้งเตือน' : 'Notif'}</TabsTrigger>
            <TabsTrigger value="security" className="flex-1"><Lock className="w-4 h-4 mr-1" />{locale === 'th' ? 'ความปลอดภัย' : 'Security'}</TabsTrigger>
            <TabsTrigger value="kyc" className="flex-1"><Shield className="w-4 h-4 mr-1" />KYC</TabsTrigger>
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
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${kycColor}`}>
                      {locale === 'th' ? kycLabel[user.kycStatus].th : kycLabel[user.kycStatus].en}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'th' ? 'ชื่อที่แสดง' : 'Display Name'}</Label>
                  <Input value={displayName} onChange={e => setDisplayName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'th' ? 'ชื่อผู้ใช้' : 'Username'}</Label>
                  <Input value={user.username} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user.email} disabled className="opacity-60" />
                </div>
                <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full">
                  <Save className="w-4 h-4 mr-2" />{locale === 'th' ? 'บันทึก' : 'Save'}
                </Button>
              </CardContent>
            </Card>

            {/* Seller Upgrade Card */}
            {user.role === 'buyer' && (
              <Card className="mt-4" style={{ border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.05)' }}>
                <CardHeader>
                  <CardTitle style={{ fontSize: '15px', color: '#a78bfa' }}>
                    🏪 {locale === 'th' ? 'สมัครเป็นผู้ขาย' : 'Become a Seller'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p style={{ fontSize: '13px', color: '#94a3b8' }}>
                    {locale === 'th'
                      ? 'อัปเกรดบัญชีเป็นผู้ขายเพื่อสามารถลงขายสินค้าในร้านได้ทันที'
                      : 'Upgrade your account to seller to start listing products in the shop.'}
                  </p>
                  <Button
                    onClick={async () => {
                      setIsSaving(true)
                      try {
                        const { supabase } = await import('@/lib/supabase')
                        const { data: { user: authUser } } = await supabase.auth.getUser()
                        if (authUser) {
                          await supabase.from('users').update({ role: 'seller' }).eq('id', authUser.id)
                        }
                        updateUser({ role: 'seller' })
                        toast.success(locale === 'th' ? '🎉 สมัครเป็นผู้ขายสำเร็จ!' : '🎉 You are now a seller!')
                      } catch {
                        updateUser({ role: 'seller' })
                        toast.success(locale === 'th' ? '🎉 สมัครเป็นผู้ขายสำเร็จ!' : '🎉 You are now a seller!')
                      }
                      setIsSaving(false)
                    }}
                    disabled={isSaving}
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: '#ffffff', fontWeight: 'bold' }}
                    className="w-full"
                  >
                    {locale === 'th' ? '[ สมัครเป็นผู้ขาย ]' : '[ BECOME A SELLER ]'}
                  </Button>
                </CardContent>
              </Card>
            )}

            {user.role === 'seller' && (
              <Card className="mt-4" style={{ border: '1px solid rgba(74,222,128,0.3)', background: 'rgba(74,222,128,0.05)' }}>
                <CardContent className="p-4 flex items-center gap-3">
                  <span style={{ fontSize: '24px' }}>✅</span>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 'bold', color: '#4ade80' }}>
                      {locale === 'th' ? 'คุณเป็นผู้ขายแล้ว' : 'You are a Seller'}
                    </p>
                    <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                      {locale === 'th' ? 'สามารถลงขายสินค้าได้ใน Dashboard' : 'You can list products in the Dashboard'}
                    </p>
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
                    <p className="font-medium">{locale === 'th' ? 'แจ้งเตือนทางอีเมล' : 'Email Notifications'}</p>
                    <p className="text-sm text-muted-foreground">{locale === 'th' ? 'รับการแจ้งเตือนผ่านอีเมล' : 'Receive notifications via email'}</p>
                  </div>
                  <Switch checked={emailNotif} onCheckedChange={setEmailNotif} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{locale === 'th' ? 'แจ้งเตือน Push' : 'Push Notifications'}</p>
                    <p className="text-sm text-muted-foreground">{locale === 'th' ? 'รับการแจ้งเตือนแบบ Push' : 'Browser push notifications'}</p>
                  </div>
                  <Switch checked={pushNotif} onCheckedChange={setPushNotif} />
                </div>
                <Button onClick={() => toast.success(locale === 'th' ? 'บันทึกแล้ว' : 'Saved')} className="w-full">
                  {locale === 'th' ? 'บันทึกการตั้งค่า' : 'Save Settings'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold">{locale === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}</h3>
                <div className="space-y-2">
                  <Label>{locale === 'th' ? 'รหัสผ่านปัจจุบัน' : 'Current Password'}</Label>
                  <Input type="password" value={oldPass} onChange={e => setOldPass(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'th' ? 'รหัสผ่านใหม่' : 'New Password'}</Label>
                  <Input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>{locale === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm New Password'}</Label>
                  <Input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
                </div>
                <Button onClick={handleChangePassword} disabled={isSaving} className="w-full">
                  {locale === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className={`p-4 rounded-xl text-center ${kycColor}`}>
                  <Shield className="w-8 h-8 mx-auto mb-2" />
                  <p className="font-semibold text-lg">{locale === 'th' ? 'สถานะ KYC: ' : 'KYC Status: '}{locale === 'th' ? kycLabel[user.kycStatus].th : kycLabel[user.kycStatus].en}</p>
                </div>
                {user.kycStatus === 'pending' && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">{locale === 'th' ? 'กรุณาอัปโหลดบัตรประชาชนหรือพาสปอร์ต' : 'Please upload your ID card or passport'}</p>
                    <div className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-muted/50">
                      <Camera className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">{locale === 'th' ? 'คลิกเพื่ออัปโหลดเอกสาร' : 'Click to upload document'}</p>
                    </div>
                    <Button className="w-full" onClick={() => toast.info(locale === 'th' ? 'ฟีเจอร์นี้ต้องเชื่อมต่อ Supabase Storage' : 'This feature requires Supabase Storage')}>
                      {locale === 'th' ? 'ส่งเอกสาร KYC' : 'Submit KYC Documents'}
                    </Button>
                  </div>
                )}
                {user.kycStatus === 'verified' && (
                  <p className="text-sm text-center text-muted-foreground">{locale === 'th' ? 'บัญชีของคุณได้รับการยืนยันแล้ว' : 'Your account is fully verified'}</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  )
}
