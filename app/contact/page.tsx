'use client'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Mail, MessageCircle, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { useLocale } from '@/hooks/use-locale'
import { toast } from 'sonner'
export default function ContactPage() {
  const { locale } = useLocale()
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container max-w-2xl mx-auto px-4 py-12 space-y-8">
        <h1 className="text-3xl font-bold text-center">{locale === 'th' ? 'ติดต่อเรา' : 'Contact Us'}</h1>
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { icon: <Mail className="w-6 h-6 mx-auto mb-1 text-blue-500" />, label: 'Email', value: 'support@gameshop.th' },
            { icon: <MessageCircle className="w-6 h-6 mx-auto mb-1 text-green-500" />, label: 'Line', value: '@gameshop' },
            { icon: <Phone className="w-6 h-6 mx-auto mb-1 text-purple-500" />, label: 'Tel', value: '02-xxx-xxxx' },
          ].map((c, i) => (
            <div key={i} className="p-4 rounded-xl border">{c.icon}<p className="text-xs text-muted-foreground">{c.label}</p><p className="text-sm font-medium">{c.value}</p></div>
          ))}
        </div>
        <div className="space-y-4 p-6 border rounded-xl">
          <h2 className="font-semibold">{locale === 'th' ? 'ส่งข้อความ' : 'Send Message'}</h2>
          <div className="space-y-2"><Label>{locale === 'th' ? 'ชื่อ' : 'Name'}</Label><Input placeholder={locale === 'th' ? 'ชื่อของคุณ' : 'Your name'} /></div>
          <div className="space-y-2"><Label>Email</Label><Input type="email" placeholder="email@example.com" /></div>
          <div className="space-y-2"><Label>{locale === 'th' ? 'ข้อความ' : 'Message'}</Label><Textarea rows={4} placeholder={locale === 'th' ? 'พิมพ์ข้อความ...' : 'Type your message...'} /></div>
          <Button className="w-full" onClick={() => toast.success(locale === 'th' ? 'ส่งข้อความสำเร็จ' : 'Message sent!')}>{locale === 'th' ? 'ส่งข้อความ' : 'Send'}</Button>
        </div>
      </main>
      <Footer />
    </div>
  )
}
