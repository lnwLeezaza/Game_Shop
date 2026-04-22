'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowRight, Shield, Zap, Star, Package, Users, ShoppingCart } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ProductCard } from '@/components/product-card'
import { useLocale } from '@/hooks/use-locale'
import { useProductStore } from '@/lib/store'

const robuxPackages = [
  { robux: '400 R$',    price: 150,  original: 220,  popular: false, icon: '💎' },
  { robux: '800 R$',    price: 290,  original: 420,  popular: false, icon: '💎' },
  { robux: '1,700 R$',  price: 590,  original: 850,  popular: true,  icon: '👑' },
  { robux: '4,500 R$',  price: 1290, original: 1800, popular: false, icon: '🔥' },
  { robux: '10,000 R$', price: 2690, original: 3800, popular: false, icon: '⚡' },
]

const features = [
  { icon: Zap,    title: { th: 'ส่งไว 5 นาที',   en: 'Delivered in 5 min' },   desc: { th: 'รับ Robux ทันทีหลังยืนยันการชำระ', en: 'Instant after payment confirmed' } },
  { icon: Shield, title: { th: 'ปลอดภัย 100%',  en: '100% Safe' },             desc: { th: 'ระบบ Escrow ป้องกันทุกธุรกรรม',    en: 'Escrow system protects every transaction' } },
  { icon: Users,  title: { th: 'ซัพพอร์ต 24/7', en: '24/7 Support' },          desc: { th: 'ทีมงานพร้อมช่วยเหลือตลอดเวลา',     en: 'Always here to help you' } },
  { icon: Package,title: { th: 'ราคาถูกที่สุด', en: 'Best Price in TH' },      desc: { th: 'ถูกกว่าซื้อในเกม 30-40%',           en: '30-40% cheaper than in-game' } },
]

const howToSteps = [
  { step: 1, title: { th: 'เลือกแพ็คเกจ',     en: 'Choose Package' },    desc: { th: 'เลือกจำนวน R$ ที่ต้องการ',             en: 'Pick the R$ amount you need' } },
  { step: 2, title: { th: 'ชำระเงิน',          en: 'Make Payment' },      desc: { th: 'พร้อมเพย์ / บัตรเครดิต / โอนธนาคาร', en: 'PromptPay / Card / Bank transfer' } },
  { step: 3, title: { th: 'เข้ากลุ่ม Payout', en: 'Join Payout Group' }, desc: { th: 'ระบบแจ้งขั้นตอนรับ Robux อัตโนมัติ',  en: 'System guides you automatically' } },
  { step: 4, title: { th: 'รับ Robux',         en: 'Receive Robux' },     desc: { th: 'ได้รับ Robux ภายใน 5 นาที!',           en: 'Receive Robux within 5 minutes!' } },
]

const reviews = [
  { name: 'NightWolf_TH',  rating: 5, text: { th: 'เร็วมากครับ สั่ง 5 นาทีได้เลย ใช้มาหลายครั้งแล้ว',  en: 'Super fast! 5 mins. Used many times already.' } },
  { name: 'Sakura99',      rating: 5, text: { th: 'ราคาถูกกว่าที่อื่นมาก ไว้ใจได้ 100%',               en: 'Cheapest around, 100% trustworthy.' } },
  { name: 'PixelMaster_Z', rating: 5, text: { th: 'ซัพพอร์ตดีมาก มีปัญหาก็ช่วยแก้ให้ทันที',            en: 'Excellent support, resolved issues instantly.' } },
]

function SkeletonCard() {
  return (
    <div style={{ background: '#0f0f1a', border: '1px solid #2a2a45', borderRadius: '14px', padding: '20px', animation: 'pulse 1.5s ease-in-out infinite' }}>
      <div style={{ height: '20px', background: '#1a1a2e', borderRadius: '4px', marginBottom: '12px', width: '60%' }} />
      <div style={{ height: '36px', background: '#1a1a2e', borderRadius: '4px', marginBottom: '8px' }} />
      <div style={{ height: '16px', background: '#1a1a2e', borderRadius: '4px', width: '40%' }} />
    </div>
  )
}

export default function RobloxPage() {
  const { locale } = useLocale()
  const th = locale === 'th'
  const { products, fetchProducts } = useProductStore()
  const [productsLoading, setProductsLoading] = useState(true)

  useEffect(() => { fetchProducts().finally(() => setProductsLoading(false)) }, [fetchProducts])

  const robloxProducts = products.filter(p => p.category === 'roblox')
  const card = { background: '#0f0f1a', border: '1px solid #2a2a45', borderRadius: '14px', padding: '20px' }
  const container = { maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }

  return (
    <div style={{ minHeight: '100vh', background: '#050508', display: 'flex', flexDirection: 'column' }}>
      <Header />

      {/* Hero */}
      <section style={{ padding: '80px 16px 64px', background: 'radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.08) 0%, transparent 60%)', borderBottom: '1px solid #1a1a2e' }}>
        <div style={{ ...container, textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', background: '#EF4444', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '48px', fontWeight: '900', color: 'white', fontFamily: 'monospace', boxShadow: '0 0 40px rgba(239,68,68,0.3)', margin: '0 auto 24px' }}>R</div>
          <h1 style={{ fontSize: 'clamp(32px,6vw,52px)', fontWeight: '900', margin: '0 0 16px', lineHeight: 1.1 }}>
            <span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ซื้อ </span>
            <span style={{ background: 'linear-gradient(135deg,#ef4444,#f97316)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Robux</span>
            <span style={{ background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}> ราคาถูก</span>
          </h1>
          <p style={{ fontSize: '16px', color: '#94a3b8', maxWidth: '480px', margin: '0 auto 28px', lineHeight: 1.6, fontFamily: 'monospace' }}>
            {th ? '// ถูกกว่าราคาทางการ 30-40% ส่งภายใน 5 นาที ปลอดภัย 100%' : '// 30-40% cheaper than official prices. Delivered in 5 min. 100% safe.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '28px' }}>
            {[{ icon: '⚡', label: th ? 'ส่งไว 5 นาที' : '5 Min Delivery' }, { icon: '🔒', label: th ? 'ปลอดภัย 100%' : '100% Safe' }, { icon: '💰', label: th ? 'ราคาถูกสุด' : 'Best Price' }, { icon: '🎧', label: th ? 'ซัพพอร์ต 24/7' : '24/7 Support' }].map(b => (
              <div key={b.label} style={{ background: '#0f0f1a', border: '1px solid #2a2a45', borderRadius: '20px', padding: '6px 14px', fontSize: '12px', color: '#cbd5e1', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '6px' }}><span>{b.icon}</span>{b.label}</div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#packages" style={{ padding: '13px 28px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: 'white', textDecoration: 'none', borderRadius: '10px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px', boxShadow: '0 0 24px rgba(239,68,68,0.35)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingCart style={{ width: 15, height: 15 }} />{th ? '[ ซื้อ Robux ]' : '[ BUY ROBUX ]'}
            </a>
            <Link href="/products?category=roblox" style={{ padding: '13px 28px', background: 'transparent', color: '#a78bfa', textDecoration: 'none', borderRadius: '10px', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '14px', border: '1px solid #4c1d95', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {th ? 'ดูสินค้าทั้งหมด' : 'Browse All'} <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '56px 16px' }}>
        <div style={container}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '16px' }}>
            {features.map((f, i) => (
              <div key={i} style={{ ...card, display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', flexShrink: 0, background: 'linear-gradient(135deg,rgba(124,58,237,0.2),rgba(37,99,235,0.2))', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <f.icon style={{ width: 18, height: 18, color: '#a78bfa' }} />
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', color: '#f1f5f9', fontFamily: 'monospace', fontSize: '14px', marginBottom: '4px' }}>{th ? f.title.th : f.title.en}</div>
                  <div style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace', lineHeight: 1.5 }}>{th ? f.desc.th : f.desc.en}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Packages */}
      <section id="packages" style={{ padding: '56px 16px', background: 'rgba(15,15,26,0.5)' }}>
        <div style={container}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 8px', background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {th ? '// เลือกแพ็คเกจ Robux' : '// ROBUX PACKAGES'}
            </h2>
            <p style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '13px', margin: 0 }}>{th ? 'ราคาถูกกว่าทางการ 30-40% — ไม่มีค่าธรรมเนียมซ่อน' : '30-40% off official prices — no hidden fees'}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(190px,1fr))', gap: '16px' }}>
            {robuxPackages.map((pkg, i) => (
              <div key={i} style={{ ...card, position: 'relative', border: pkg.popular ? '1px solid rgba(239,68,68,0.5)' : '1px solid #2a2a45', boxShadow: pkg.popular ? '0 0 20px rgba(239,68,68,0.1)' : 'none', cursor: 'pointer' }}>
                {pkg.popular && (
                  <div style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: 'white', fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace', padding: '3px 10px', borderRadius: '10px', whiteSpace: 'nowrap' }}>
                    ⭐ {th ? 'ยอดนิยม' : 'POPULAR'}
                  </div>
                )}
                <div style={{ textAlign: 'center', paddingTop: pkg.popular ? '8px' : '0' }}>
                  <div style={{ fontSize: '26px', marginBottom: '8px' }}>{pkg.icon}</div>
                  <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f1f5f9', fontFamily: 'monospace', marginBottom: '4px' }}>{pkg.robux}</div>
                  <div style={{ fontSize: '24px', fontWeight: '900', color: '#a78bfa', fontFamily: 'monospace', marginBottom: '2px' }}>฿{pkg.price.toLocaleString()}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace', textDecoration: 'line-through', marginBottom: '4px' }}>฿{pkg.original.toLocaleString()}</div>
                  <div style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 'bold', color: '#34d399', marginBottom: '16px' }}>
                    -{Math.round((1 - pkg.price / pkg.original) * 100)}% {th ? 'ประหยัด' : 'SAVE'}
                  </div>
                  <button style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', borderRadius: '8px', color: 'white', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', boxShadow: '0 0 16px rgba(239,68,68,0.25)' }}>
                    {th ? '[ ซื้อเลย ]' : '[ BUY NOW ]'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How To */}
      <section style={{ padding: '56px 16px' }}>
        <div style={container}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 8px', background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {th ? '// วิธีการสั่งซื้อ' : '// HOW IT WORKS'}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px' }}>
            {howToSteps.map(step => (
              <div key={step.step} style={{ ...card, textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', margin: '0 auto 14px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900', color: 'white', fontFamily: 'monospace', boxShadow: '0 0 16px rgba(124,58,237,0.3)' }}>
                  {step.step}
                </div>
                <div style={{ fontWeight: 'bold', color: '#f1f5f9', fontFamily: 'monospace', fontSize: '14px', marginBottom: '8px' }}>{th ? step.title.th : step.title.en}</div>
                <div style={{ color: '#64748b', fontSize: '12px', fontFamily: 'monospace', lineHeight: 1.6 }}>{th ? step.desc.th : step.desc.en}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section style={{ padding: '56px 16px', background: 'rgba(15,15,26,0.5)' }}>
        <div style={container}>
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <h2 style={{ fontSize: '26px', fontWeight: 'bold', margin: '0 0 8px', background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {th ? '// รีวิวจากลูกค้า' : '// CUSTOMER REVIEWS'}
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: '16px' }}>
            {reviews.map((r, i) => (
              <div key={i} style={card}>
                <div style={{ display: 'flex', gap: '2px', marginBottom: '10px' }}>
                  {Array.from({ length: r.rating }).map((_, j) => <Star key={j} style={{ width: 14, height: 14, color: '#f59e0b', fill: '#f59e0b' }} />)}
                </div>
                <p style={{ color: '#cbd5e1', fontSize: '14px', fontFamily: 'monospace', lineHeight: 1.6, margin: '0 0 12px' }}>"{th ? r.text.th : r.text.en}"</p>
                <div style={{ color: '#a78bfa', fontSize: '12px', fontFamily: 'monospace', fontWeight: 'bold' }}>— {r.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section style={{ padding: '56px 16px' }}>
        <div style={container}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 4px', background: 'linear-gradient(135deg,#a78bfa,#60a5fa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {th ? '// สินค้า Roblox' : '// ROBLOX ITEMS'}
              </h2>
              <p style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '13px', margin: 0 }}>{th ? 'ไอเทมและบัญชีจากผู้ขายที่ยืนยันแล้ว' : 'Items & accounts from verified sellers'}</p>
            </div>
            <Link href="/products?category=roblox" style={{ color: '#a78bfa', textDecoration: 'none', fontFamily: 'monospace', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {th ? 'ดูทั้งหมด' : 'View all'} <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>
          {productsLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px' }}>
              <SkeletonCard /><SkeletonCard /><SkeletonCard />
            </div>
          ) : robloxProducts.length === 0 ? (
            <div style={{ ...card, textAlign: 'center', padding: '48px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
              <h3 style={{ color: '#f1f5f9', fontFamily: 'monospace', marginBottom: '8px' }}>{th ? 'ไม่มีสินค้าในขณะนี้' : 'No items available right now'}</h3>
              <p style={{ color: '#64748b', fontFamily: 'monospace', fontSize: '13px', marginBottom: '20px' }}>{th ? 'กลับมาตรวจสอบในภายหลัง หรือดูสินค้าหมวดอื่น' : 'Check back later or browse other categories'}</p>
              <Link href="/products?category=roblox" style={{ display: 'inline-block', padding: '10px 20px', background: 'linear-gradient(135deg,#7c3aed,#2563eb)', color: 'white', textDecoration: 'none', borderRadius: '8px', fontFamily: 'monospace', fontSize: '13px', fontWeight: 'bold' }}>
                {th ? 'ค้นหาสินค้า Roblox' : 'Search Roblox Items'}
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: '16px' }}>
              {robloxProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </section>

      <Footer />
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
    </div>
  )
}
