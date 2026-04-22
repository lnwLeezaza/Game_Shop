'use client'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useLocale } from '@/hooks/use-locale'
const titles: Record<string, { th: string; en: string }> = {
  terms: { th: 'ข้อกำหนดการใช้งาน', en: 'Terms of Service' },
  privacy: { th: 'นโยบายความเป็นส่วนตัว', en: 'Privacy Policy' },
  refund: { th: 'นโยบายการคืนเงิน', en: 'Refund Policy' },
}
export default function Page() {
  const { locale } = useLocale()
  const key = 'refund'
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">{locale === 'th' ? titles[key].th : titles[key].en}</h1>
        <div className="prose prose-sm max-w-none space-y-4 text-muted-foreground">
          <p>{locale === 'th' ? 'อัปเดตล่าสุด: 1 มกราคม 2567' : 'Last updated: January 1, 2025'}</p>
          <p>{locale === 'th' ? 'GameShop ให้ความสำคัญกับผู้ใช้ทุกท่าน เนื้อหาในหน้านี้จะถูกอัปเดตเร็วๆ นี้ กรุณาติดต่อทีมงานหากมีข้อสงสัย' : 'GameShop values all our users. This content will be updated soon. Please contact our team if you have any questions.'}</p>
          <p>{locale === 'th' ? 'ติดต่อทีมงาน: support@gameshop.th' : 'Contact us: support@gameshop.th'}</p>
        </div>
      </main>
      <Footer />
    </div>
  )
}
