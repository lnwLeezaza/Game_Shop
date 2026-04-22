'use client'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { useLocale } from '@/hooks/use-locale'
const meta: Record<string, { th: string; en: string; items: { q: string; qth: string; a: string; ath: string }[] }> = {
  'how-to-buy': { th: 'วิธีการซื้อ', en: 'How to Buy',
    items: [
      { q: 'Browse products', qth: 'เลือกสินค้า', a: 'Go to Products page, filter by game and type', ath: 'ไปที่หน้าสินค้า เลือกเกมและประเภท' },
      { q: 'Top up wallet', qth: 'เติมเงินกระเป๋า', a: 'Go to Wallet, upload slip to top up', ath: 'ไปที่กระเป๋า แนบสลิปเพื่อเติมเงิน' },
      { q: 'Purchase', qth: 'ซื้อสินค้า', a: 'Click Buy, confirm order. Funds go to escrow.', ath: 'กดซื้อ ยืนยัน เงินจะถูกพักไว้ใน Escrow' },
      { q: 'Receive item', qth: 'รับสินค้า', a: 'Seller sends item info, confirm to release funds', ath: 'ผู้ขายส่งข้อมูล กดยืนยันเพื่อปล่อยเงิน' },
    ]
  },
  'how-to-sell': { th: 'วิธีการขาย', en: 'How to Sell',
    items: [
      { q: 'Verify KYC', qth: 'ยืนยัน KYC', a: 'Go to Profile > KYC tab, submit your ID', ath: 'ไปที่โปรไฟล์ > แท็บ KYC ส่งบัตรประชาชน' },
      { q: 'List product', qth: 'ลงสินค้า', a: 'Go to Dashboard, create new listing', ath: 'ไปที่แดชบอร์ด สร้างรายการขายใหม่' },
      { q: 'Deliver to buyer', qth: 'ส่งสินค้า', a: 'When order placed, send item info in Orders page', ath: 'เมื่อมีออเดอร์ ส่งข้อมูลในหน้าออเดอร์' },
      { q: 'Receive payment', qth: 'รับเงิน', a: 'Funds released after buyer confirms receipt', ath: 'เงินปล่อยหลังผู้ซื้อยืนยัน' },
    ]
  },
  safety: { th: 'ความปลอดภัย', en: 'Safety Guide',
    items: [
      { q: 'Escrow system', qth: 'ระบบ Escrow', a: 'All funds held in escrow until delivery confirmed', ath: 'เงินทั้งหมดถูกพักไว้จนกว่าจะยืนยันรับสินค้า' },
      { q: 'KYC verification', qth: 'ยืนยันตัวตน', a: 'All sellers must verify identity before listing', ath: 'ผู้ขายทุกรายต้องยืนยันตัวตนก่อนลงขาย' },
      { q: 'Dispute resolution', qth: 'แก้ไขข้อพิพาท', a: 'Our team mediates disputes within 24h', ath: 'ทีมงานช่วยไกล่เกลี่ยภายใน 24 ชั่วโมง' },
      { q: 'Tips', qth: 'เคล็ดลับ', a: 'Never share passwords. Use platform chat only.', ath: 'อย่าแชร์รหัสผ่าน ใช้ช่องทางในแพลตฟอร์มเท่านั้น' },
    ]
  },
  faq: { th: 'คำถามที่พบบ่อย', en: 'FAQ',
    items: [
      { q: 'How long does delivery take?', qth: 'ใช้เวลานานแค่ไหน?', a: 'Usually within 30 minutes after order placed', ath: 'ปกติภายใน 30 นาทีหลังสั่งซื้อ' },
      { q: 'What if I have a problem?', qth: 'ถ้ามีปัญหาทำอย่างไร?', a: 'File a dispute in Orders page, team responds in 24h', ath: 'แจ้งปัญหาในหน้าออเดอร์ ทีมตอบภายใน 24 ชั่วโมง' },
      { q: 'Can I get a refund?', qth: 'ขอคืนเงินได้ไหม?', a: 'Yes, if item not delivered or not as described', ath: 'ได้ ถ้าไม่ได้รับสินค้าหรือสินค้าไม่ตรงปก' },
      { q: 'Platform fee?', qth: 'ค่าธรรมเนียม?', a: '5% platform fee charged on each sale', ath: 'ค่าธรรมเนียม 5% ต่อการขายแต่ละครั้ง' },
    ]
  },
}
export default function HelpPage() {
  const { locale } = useLocale()
  const key = 'how-to-buy'
  const info = meta[key]
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">{locale === 'th' ? info.th : info.en}</h1>
        <div className="space-y-4">
          {info.items.map((item, i) => (
            <div key={i} className="p-5 border rounded-xl">
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center">{i + 1}</span>
                <div>
                  <p className="font-semibold">{locale === 'th' ? item.qth : item.q}</p>
                  <p className="text-sm text-muted-foreground mt-1">{locale === 'th' ? item.ath : item.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  )
}
