'use client'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Shield, Users, Zap, Trophy } from 'lucide-react'
import { useLocale } from '@/hooks/use-locale'

export default function AboutPage() {
  const { locale } = useLocale()
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12 space-y-10">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-3">{locale === 'th' ? 'เกี่ยวกับเรา' : 'About Us'}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{locale === 'th' ? 'GameShop คือตลาดกลางซื้อขายไอเทมเกมที่ปลอดภัยและน่าเชื่อถือที่สุดในไทย' : 'GameShop is Thailand\'s safest and most trusted marketplace for in-game items.'}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: <Shield className="w-8 h-8 text-blue-500" />, title: locale === 'th' ? 'ปลอดภัย 100%' : '100% Secure', desc: locale === 'th' ? 'ระบบ Escrow ปกป้องทุกธุรกรรม' : 'Escrow system protects every transaction' },
            { icon: <Users className="w-8 h-8 text-green-500" />, title: locale === 'th' ? 'ผู้ใช้มากกว่า 50,000+' : '50,000+ Users', desc: locale === 'th' ? 'ชุมชนนักเล่นเกมขนาดใหญ่' : 'Large gaming community' },
            { icon: <Zap className="w-8 h-8 text-yellow-500" />, title: locale === 'th' ? 'โอนเร็ว' : 'Fast Transfer', desc: locale === 'th' ? 'รับไอเทมภายในไม่กี่นาที' : 'Receive items within minutes' },
            { icon: <Trophy className="w-8 h-8 text-purple-500" />, title: locale === 'th' ? 'รับประกันคุณภาพ' : 'Quality Guaranteed', desc: locale === 'th' ? 'ผู้ขายผ่านการยืนยันทุกราย' : 'All sellers are verified' },
          ].map((f, i) => (
            <div key={i} className="p-5 rounded-xl border text-center space-y-2">
              <div className="flex justify-center">{f.icon}</div>
              <p className="font-semibold">{f.title}</p>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
