'use client'

import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useLocale } from '@/hooks/use-locale'

export function Footer() {
  const { locale } = useLocale()

  const t = {
    th: {
      desc: 'แพลตฟอร์มเติมเกมและตู้สุ่มไอดีที่ปลอดภัย ครบวงจร รองรับ 10+ เกมยอดนิยม',
      support: 'บริการลูกค้า', about: 'เกี่ยวกับเรา', legal: 'ข้อกฎหมาย',
      howToBuy: 'วิธีการสั่งซื้อ', howToSell: 'วิธีการขาย',
      safety: 'ความปลอดภัย', faq: 'คำถามที่พบบ่อย', contact: 'ติดต่อเรา',
      terms: 'ข้อกำหนดการใช้งาน', privacy: 'นโยบายความเป็นส่วนตัว',
      rights: 'สงวนลิขสิทธิ์', online: 'ระบบออนไลน์ 24/7',
      payment: 'ช่องทางชำระเงิน', secure: 'ธุรกรรมทุกรายการเข้ารหัสด้วย SSL 256-bit',
    },
    en: {
      desc: 'Secure game top-up and gacha platform supporting 10+ popular games.',
      support: 'Support', about: 'Company', legal: 'Legal',
      howToBuy: 'How to Buy', howToSell: 'How to Sell',
      safety: 'Security', faq: 'FAQ', contact: 'Contact',
      terms: 'Terms of Service', privacy: 'Privacy Policy',
      rights: 'All rights reserved', online: 'Online 24/7',
      payment: 'Payment', secure: 'All transactions secured with SSL 256-bit encryption',
    },
  }[locale]

  const FACEBOOK_URL = 'https://www.facebook.com/YourPageNameHere'
  const DISCORD_URL  = 'https://discord.gg/YourInviteHere'

  const banks = [
    { name: 'SCB', bg: '#4c0099' }, { name: 'KBANK', bg: '#138f2d' },
    { name: 'BBL', bg: '#1e3a8a' }, { name: 'KTB',  bg: '#009fda' },
    { name: 'TMB', bg: '#ea580c' }, { name: 'BAY',  bg: '#d97706' },
  ]

  const linkStyle = {
    fontSize: 13, color: 'rgba(148,197,253,0.6)', textDecoration: 'none', transition: 'color 0.15s',
  }

  return (
    <footer style={{
      background: 'linear-gradient(180deg, #0d1f3c 0%, #050e1f 100%)',
      borderTop: '1px solid rgba(37,99,235,0.2)',
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Background glow orbs */}
      <div style={{ position: 'absolute', top: -80, left: '10%', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.08), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -60, right: '15%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.07), transparent 70%)', pointerEvents: 'none' }} />

      {/* ── Main content ── */}
      <div className="mx-auto max-w-7xl px-6 py-14" style={{ position: 'relative', zIndex: 1 }}>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

          {/* Brand col */}
          <div className="lg:col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11,
                background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 20px rgba(37,99,235,0.4), 0 0 40px rgba(6,182,212,0.15)',
              }}>
                <ShoppingBag size={18} color="#fff" />
              </div>
              <span style={{
                fontSize: 22, fontWeight: 800, letterSpacing: '-0.03em',
                background: 'linear-gradient(90deg, #60a5fa, #06b6d4)',
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>GameShop</span>
            </Link>

            <p style={{ fontSize: 13, lineHeight: 1.9, color: 'rgba(148,197,253,0.5)', maxWidth: 280 }}>
              {t.desc}
            </p>

            {/* Social icons */}
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                {
                  href: FACEBOOK_URL, hoverColor: '#1877f2',
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>,
                },
                {
                  href: DISCORD_URL, hoverColor: '#5865f2',
                  icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>,
                },
              ].map((s, i) => (
                <a key={i} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(148,197,253,0.5)', textDecoration: 'none', transition: 'all 0.2s' }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = s.hoverColor; el.style.color = s.hoverColor; el.style.boxShadow = `0 0 12px ${s.hoverColor}40` }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'rgba(37,99,235,0.2)'; el.style.color = 'rgba(148,197,253,0.5)'; el.style.boxShadow = 'none' }}>
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Links grid */}
          <div className="lg:col-span-3 grid grid-cols-3 gap-8">
            {[
              {
                label: t.support,
                links: [
                  { href: '/help/how-to-buy',  label: t.howToBuy },
                  { href: '/help/how-to-sell', label: t.howToSell },
                  { href: '/help/safety',      label: t.safety },
                  { href: '/help/faq',         label: t.faq },
                  { href: '/contact',          label: t.contact },
                ],
              },
              {
                label: t.about,
                links: [
                  { href: '/about',  label: locale === 'th' ? 'เกี่ยวกับเรา' : 'About Us' },
                  { href: '/topup',  label: locale === 'th' ? 'เติมเกม' : 'Top Up' },
                  { href: '/gacha',  label: locale === 'th' ? 'ตู้สุ่มไอดี' : 'Gacha' },
                  { href: '/orders', label: locale === 'th' ? 'ประวัติการสั่งซื้อ' : 'Orders' },
                  { href: '/wallet', label: locale === 'th' ? 'กระเป๋าเงิน' : 'Wallet' },
                ],
              },
              {
                label: t.legal,
                links: [
                  { href: '/terms',   label: t.terms },
                  { href: '/privacy', label: t.privacy },
                ],
              },
            ].map(col => (
              <div key={col.label}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(37,99,235,0.6)', marginBottom: 18 }}>
                  {col.label}
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
                  {col.links.map(item => (
                    <li key={item.href}>
                      <Link href={item.href} style={linkStyle}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#93c5fd' }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(148,197,253,0.6)' }}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(37,99,235,0.25), rgba(6,182,212,0.2), transparent)', margin: '0 24px' }} />

      {/* ── Bottom bar ── */}
      <div className="mx-auto max-w-7xl px-6 py-5" style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>

          {/* Copyright + status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 12, color: 'rgba(148,197,253,0.35)', margin: 0 }}>
              &copy; {new Date().getFullYear()} GameShop. {t.rights}.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#22c55e', boxShadow: '0 0 6px #22c55e' }} />
              <span style={{ fontSize: 11, color: 'rgba(148,197,253,0.4)' }}>{t.online}</span>
            </div>
          </div>

          {/* Payment + SSL */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {[
              { icon: '🇹🇭', label: 'PromptPay' },
              { icon: '🟠',  label: 'TrueMoney' },
              { icon: '📱',  label: 'QR' },
            ].map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 9px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 5, fontSize: 10, color: 'rgba(148,197,253,0.45)' }}>
                <span style={{ fontSize: 11 }}>{p.icon}</span>{p.label}
              </div>
            ))}
            <div style={{ display: 'flex', gap: 4 }}>
              {banks.map(b => (
                <div key={b.name} style={{ padding: '2px 6px', borderRadius: 4, fontSize: 8, fontWeight: 700, color: '#fff', background: b.bg, opacity: 0.55 }}>{b.name}</div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 8, borderLeft: '1px solid rgba(37,99,235,0.15)' }}>
              <span style={{ fontSize: 11 }}>🔒</span>
              <span style={{ fontSize: 10, color: 'rgba(148,197,253,0.35)' }}>SSL 256-bit</span>
            </div>
          </div>

        </div>
      </div>

    </footer>
  )
}