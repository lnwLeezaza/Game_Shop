'use client'

import Link from 'next/link'
import { ShoppingBag, Facebook, MessageCircle } from 'lucide-react'
import { useLocale } from '@/hooks/use-locale'

export function Footer() {
  const { locale } = useLocale()

  const footerLinks = {
    th: {
      about: 'เกี่ยวกับเรา',
      howToBuy: 'วิธีการซื้อ',
      howToSell: 'วิธีการขาย',
      safety: 'ความปลอดภัย',
      faq: 'คำถามที่พบบ่อย',
      contact: 'ติดต่อเรา',
      terms: 'ข้อกำหนดการใช้งาน',
      privacy: 'นโยบายความเป็นส่วนตัว',
      refund: 'นโยบายคืนเงิน',
      support: 'ช่วยเหลือ',
      legal: 'ข้อกฎหมาย',
      rights: 'สงวนลิขสิทธิ์',
    },
    en: {
      about: 'About Us',
      howToBuy: 'How to Buy',
      howToSell: 'How to Sell',
      safety: 'Safety',
      faq: 'FAQ',
      contact: 'Contact Us',
      terms: 'Terms of Service',
      privacy: 'Privacy Policy',
      refund: 'Refund Policy',
      support: 'Support',
      legal: 'Legal',
      rights: 'All rights reserved',
    },
  }

  const t = footerLinks[locale]

  // FIX #7: ใส่ลิงก์จริงสำหรับ Social Media (แก้ href ให้ตรงกับเพจจริง)
  const FACEBOOK_URL = 'https://www.facebook.com/YourPageNameHere'
  const MESSENGER_URL = 'https://m.me/YourPageNameHere'

  return (
    <footer className="border-t border-border bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <ShoppingBag className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">GameShop</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {locale === 'th'
                ? 'แพลตฟอร์มซื้อขายไอดีเกมและไอเทมที่ปลอดภัยที่สุดในประเทศไทย'
                : 'The most secure game ID and item trading platform in Thailand'}
            </p>
            {/* FIX #7: Social icons มี href จริง + เพิ่ม title/aria-label */}
            <div className="flex gap-3">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook Page"
                title="ติดตามเราบน Facebook"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1877F2] text-white transition-opacity hover:opacity-80"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={MESSENGER_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Messenger"
                title="ติดต่อผ่าน Messenger"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#00B2FF] to-[#006AFF] text-white transition-opacity hover:opacity-80"
              >
                <MessageCircle className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Support Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t.support}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/help/how-to-buy" className="hover:text-foreground">{t.howToBuy}</Link></li>
              <li><Link href="/help/how-to-sell" className="hover:text-foreground">{t.howToSell}</Link></li>
              <li><Link href="/help/safety" className="hover:text-foreground">{t.safety}</Link></li>
              <li><Link href="/help/faq" className="hover:text-foreground">{t.faq}</Link></li>
            </ul>
          </div>

          {/* Company Links */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t.about}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/about" className="hover:text-foreground">{t.about}</Link></li>
              <li><Link href="/contact" className="hover:text-foreground">{t.contact}</Link></li>
              <li>
                <Link href="/roblox" className="flex items-center gap-1.5 hover:text-foreground">
                  <span>🟥</span> Roblox Robux
                </Link>
              </li>
              <li>
                <Link href="/products?category=roblox" className="hover:text-foreground">
                  {locale === 'th' ? 'สินค้า Roblox' : 'Roblox Products'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal Links — FIX #7: refund policy มีลิงก์ชัดเจน */}
          <div className="space-y-4">
            <h3 className="font-semibold">{t.legal}</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/terms" className="hover:text-foreground">{t.terms}</Link></li>
              <li><Link href="/privacy" className="hover:text-foreground">{t.privacy}</Link></li>
              {/* FIX #7: นโยบายคืนเงิน — สำคัญมากสำหรับเว็บขายไอดีเกม */}
              <li>
                <Link href="/refund" className="font-medium text-primary hover:text-primary/80">
                  {t.refund}
                </Link>
              </li>
            </ul>

            {/* Trust badges */}
            <div className="mt-4 space-y-2 rounded-lg border border-border bg-background p-3">
              <p className="text-xs font-semibold text-foreground">
                {locale === 'th' ? '🔒 ความปลอดภัย' : '🔒 Security'}
              </p>
              <p className="text-xs text-muted-foreground">
                {locale === 'th'
                  ? 'ระบบ Escrow ปกป้องทุกธุรกรรม รับประกัน 100%'
                  : 'Escrow system protects all transactions. 100% guaranteed.'}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} GameShop. {t.rights}.
          </p>
        </div>
      </div>
    </footer>
  )
}
