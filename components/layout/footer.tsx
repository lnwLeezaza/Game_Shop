'use client'

import Link from 'next/link'
import { ShoppingBag, ArrowUpRight } from 'lucide-react'
import { useLocale } from '@/hooks/use-locale'

export function Footer() {
  const { locale } = useLocale()

  const t = {
    th: {
      about: 'เกี่ยวกับเรา', howToBuy: 'วิธีการซื้อ', howToSell: 'วิธีการขาย',
      safety: 'ความปลอดภัย', faq: 'คำถามที่พบบ่อย', contact: 'ติดต่อเรา',
      terms: 'ข้อกำหนดการใช้งาน', privacy: 'นโยบายความเป็นส่วนตัว',
      refund: 'นโยบายคืนเงิน', support: 'ช่วยเหลือ', legal: 'ข้อกฎหมาย',
      rights: 'สงวนลิขสิทธิ์',
      desc: 'แพลตฟอร์มซื้อขายไอดีเกมและไอเทมที่ปลอดภัยที่สุดในประเทศไทย',
      followUs: 'ติดตามเรา', payment: 'ช่องทางชำระเงิน',
      secure: 'SSL 256-bit เข้ารหัสทุกธุรกรรม',
      join: 'เข้าร่วม', follow: 'ติดตาม', online: 'ระบบออนไลน์ 24/7',
    },
    en: {
      about: 'About Us', howToBuy: 'How to Buy', howToSell: 'How to Sell',
      safety: 'Safety', faq: 'FAQ', contact: 'Contact Us',
      terms: 'Terms of Service', privacy: 'Privacy Policy',
      refund: 'Refund Policy', support: 'Support', legal: 'Legal',
      rights: 'All rights reserved',
      desc: 'The most secure game ID and item trading platform in Thailand',
      followUs: 'Follow Us', payment: 'Payment Methods',
      secure: 'SSL 256-bit encrypted. All transactions protected.',
      join: 'Join', follow: 'Follow', online: 'Online 24/7',
    },
  }[locale]

  const FACEBOOK_URL = 'https://www.facebook.com/YourPageNameHere'
  const DISCORD_URL  = 'https://discord.gg/YourInviteHere'

  const banks = [
    { name: 'SCB', bg: '#4c0099' }, { name: 'KBNK', bg: '#138f2d' },
    { name: 'BBL', bg: '#1e3a8a' }, { name: 'KTB',  bg: '#009fda' },
    { name: 'TMB', bg: '#f97316' }, { name: 'BAY',  bg: '#f59e0b' },
  ]

  return (
    <footer style={{ background: '#f0f6ff', borderTop: '1px solid #e0edff' }}>

      {/* Social + Payment */}
      <div style={{ borderBottom: '1px solid #e0edff' }}>
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Social */}
            <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #e0edff' }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#93c5fd' }}>{t.followUs}</p>
              <div className="flex flex-col gap-2">

                <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-xl transition-all"
                  style={{ background: '#f0f6ff', border: '1px solid #e0edff' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#93c5fd'; el.style.background = '#eff6ff' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#e0edff'; el.style.background = '#f0f6ff' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg,#1877f2,#0a5fd4)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold leading-tight" style={{ color: '#0a1628' }}>Facebook Page</p>
                    <p className="text-[10px]" style={{ color: '#60a5fa' }}>ติดตามโปรและข่าวสารใหม่</p>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"
                    style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                    {t.follow} <ArrowUpRight size={8} />
                  </span>
                </a>

                <a href={DISCORD_URL} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-xl transition-all"
                  style={{ background: '#f0f6ff', border: '1px solid #e0edff' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#c4b5fd'; el.style.background = '#faf5ff' }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = '#e0edff'; el.style.background = '#f0f6ff' }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'linear-gradient(135deg,#5865f2,#4752c4)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="white">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold leading-tight" style={{ color: '#0a1628' }}>Discord Server</p>
                    <p className="text-[10px]" style={{ color: '#818cf8' }}>คุยกับทีมและสมาชิก</p>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5"
                    style={{ background: '#ede9fe', color: '#5865f2' }}>
                    {t.join} <ArrowUpRight size={8} />
                  </span>
                </a>

              </div>
            </div>

            {/* Payment */}
            <div className="rounded-2xl p-4" style={{ background: '#fff', border: '1px solid #e0edff' }}>
              <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: '#93c5fd' }}>{t.payment}</p>

              <div className="grid grid-cols-4 gap-1.5 mb-3">
                {[
                  { icon: '🇹🇭', label: 'พร้อมเพย์',  accent: '#1d4ed8', bg: '#eff6ff' },
                  { icon: '🟠',  label: 'TrueMoney', accent: '#ea580c', bg: '#fff7ed' },
                  { icon: '📱',  label: 'QR Code',   accent: '#15803d', bg: '#f0fdf4' },
                  { icon: '🏦',  label: 'โอนธนาคาร', accent: '#7c3aed', bg: '#faf5ff' },
                ].map(item => (
                  <div key={item.label}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all cursor-pointer"
                    style={{ background: item.bg, border: '1px solid #e0edff' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = '' }}>
                    <span className="text-[16px]">{item.icon}</span>
                    <span className="text-[8px] font-bold text-center leading-tight" style={{ color: item.accent }}>{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {banks.map(b => (
                  <div key={b.name} className="px-2 py-0.5 rounded-md text-[9px] font-bold text-white"
                    style={{ background: b.bg }}>{b.name}</div>
                ))}
              </div>

              <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
                style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                <span className="text-[12px]">🔒</span>
                <p className="text-[10px] font-medium" style={{ color: '#15803d' }}>{t.secure}</p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Links */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          <div className="space-y-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl transition-transform group-hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#2563eb,#06b6d4)' }}>
                <ShoppingBag className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold" style={{ color: '#0a1628' }}>GameShop</span>
            </Link>
            <p className="text-xs leading-relaxed" style={{ color: '#60a5fa' }}>{t.desc}</p>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#93c5fd' }}>{t.support}</p>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/help/how-to-buy',  label: t.howToBuy },
                { href: '/help/how-to-sell', label: t.howToSell },
                { href: '/help/safety',      label: t.safety },
                { href: '/help/faq',         label: t.faq },
              ].map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-blue-600"
                    style={{ color: '#1d4ed8' }}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#93c5fd' }}>{t.about}</p>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/about',   label: t.about },
                { href: '/contact', label: t.contact },
                { href: '/roblox',  label: '🟥 Roblox Robux' },
                { href: '/products?category=roblox', label: locale === 'th' ? 'สินค้า Roblox' : 'Roblox Products' },
              ].map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-blue-600"
                    style={{ color: '#1d4ed8' }}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#93c5fd' }}>{t.legal}</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/terms"   className="transition-colors hover:text-blue-600" style={{ color: '#1d4ed8' }}>{t.terms}</Link></li>
              <li><Link href="/privacy" className="transition-colors hover:text-blue-600" style={{ color: '#1d4ed8' }}>{t.privacy}</Link></li>
              <li><Link href="/refund"  className="font-semibold transition-colors hover:text-cyan-500" style={{ color: '#0891b2' }}>{t.refund}</Link></li>
            </ul>
          </div>

        </div>

        <div className="mt-8 pt-5 flex flex-col sm:flex-row items-center justify-between gap-2"
          style={{ borderTop: '1px solid #e0edff' }}>
          <p className="text-[11px]" style={{ color: '#bfdbfe' }}>
            &copy; {new Date().getFullYear()} GameShop. {t.rights}.
          </p>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px]" style={{ color: '#60a5fa' }}>{t.online}</span>
          </div>
        </div>
      </div>

    </footer>
  )
}
