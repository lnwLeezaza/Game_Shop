"use client";

import Link from "next/link";
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Zap, ShieldCheck, Clock, Star, Tag, Headphones, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const games = [
  {
    slug: "rov",
    name: "ROV",
    fullName: "Arena of Valor",
    image: '/gamespic/rov.png',
    currency: "Voucher",
    badge: "ยอดนิยม",
    badgeVariant: "secondary" as const,
    colorA: '#ef4444',
    colorB: '#991b1b',
    letter: "R",
  },
  {
    slug: "free-fire",
    name: "Free Fire",
    fullName: "Garena",
    image: '/gamespic/freefire.jpg',
    currency: "เพชร",
    badge: "HOT",
    badgeVariant: "destructive" as const,
    colorA: '#f97316',
    colorB: '#c2410c',
    letter: "F",
  },
  {
    slug: "mobile-legends",
    name: "Mobile Legends",
    fullName: "Bang Bang",
    image: '/gamespic/mmlb.jpg',
    currency: "Diamond",
    badge: "ยอดนิยม",
    badgeVariant: "secondary" as const,
    colorA: '#2563eb',
    colorB: '#1e3a8a',
    letter: "M",
  },
  {
    slug: "pubg-mobile",
    name: "PUBG Mobile",
    fullName: "Krafton",
    image: '/gamespic/pubg.jpg',
    currency: "UC",
    badge: "HOT",
    badgeVariant: "destructive" as const,
    colorA: '#ca8a04',
    colorB: '#78350f',
    letter: "P",
  },
  {
    slug: "valorant",
    name: "Valorant",
    fullName: "Riot Games",
    image: '/gamespic/valorant.jpg',
    currency: "VP",
    badge: null,
    badgeVariant: "outline" as const,
    colorA: '#dc2626',
    colorB: '#450a0a',
    letter: "V",
  },
  {
    slug: "Heartopia",
    name: "Heartopia",
    fullName: "เกมใหม่",
    image: '/gamespic/hajpg.jpg',
    currency: "Diamond",
    badge: "NEW",
    badgeVariant: "default" as const,
    colorA: '#a21caf',
    colorB: '#581c87',
    letter: "H",
  },
  {
    slug: "undawn",
    name: "Undawn",
    fullName: "Level Infinite",
    image: undefined,
    currency: "Gold",
    badge: "NEW",
    badgeVariant: "default" as const,
    colorA: '#16a34a',
    colorB: '#14532d',
    letter: "U",
  },
  {
    slug: "delta-force",
    name: "Delta Force",
    fullName: "Mobile",
    image: '/gamespic/delta force.jpg',
    currency: "Token",
    badge: "NEW",
    badgeVariant: "default" as const,
    colorA: '#475569',
    colorB: '#0f172a',
    letter: "D",
  },
  {
    slug: "call-of-duty-mobile",
    name: "Call of Duty",
    fullName: "Mobile",
    image: undefined,
    currency: "CP",
    badge: null,
    badgeVariant: "outline" as const,
    colorA: '#b45309',
    colorB: '#451a03',
    letter: "C",
  },
  {
    slug: "haikyu",
    name: "HAIKYU!!",
    fullName: "Fly High",
    image: undefined,
    currency: "Gem",
    badge: "NEW",
    badgeVariant: "default" as const,
    colorA: '#ea580c',
    colorB: '#7c2d12',
    letter: "H",
  },
];

const whyUs = [
  {
    icon: Zap,
    title: "ส่งทันที",
    desc: "รับไอเทมภายในไม่กี่วินาที ระบบอัตโนมัติ 100%",
    iconBg: 'rgba(37,99,235,0.10)',
    iconColor: '#2563eb',
    glowColor: 'rgba(37,99,235,0.18)',
  },
  {
    icon: Tag,
    title: "ราคาดีที่สุด",
    desc: "ถูกกว่าช่องทางอื่น มีโปรโมชั่นและส่วนลดต่อเนื่อง",
    iconBg: 'rgba(6,182,212,0.10)',
    iconColor: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.18)',
  },
  {
    icon: ShieldCheck,
    title: "ปลอดภัย 100%",
    desc: "เติมผ่านช่องทางทางการ ไม่มีความเสี่ยงต่อบัญชีเกม",
    iconBg: 'rgba(37,99,235,0.10)',
    iconColor: '#2563eb',
    glowColor: 'rgba(37,99,235,0.18)',
  },
  {
    icon: Headphones,
    title: "ซัพพอร์ต 24/7",
    desc: "ทีมงานพร้อมช่วยเหลือตลอด 24 ชั่วโมงทุกวัน",
    iconBg: 'rgba(6,182,212,0.10)',
    iconColor: '#06b6d4',
    glowColor: 'rgba(6,182,212,0.18)',
  },
];

function GameCard({ game }: { game: typeof games[0] }) {
  const [imgErr, setImgErr] = React.useState(false)

  return (
    <Link href={`/topup/${game.slug}`} className="group block">
      <div
        className="relative flex flex-col overflow-hidden rounded-2xl bg-white border border-border cursor-pointer transition-all duration-200 hover:-translate-y-1.5"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = `0 10px 32px ${game.colorA}28, 0 0 0 1.5px ${game.colorA}38`
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)'
        }}
      >
        {/* Top color accent bar */}
        <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${game.colorA}, ${game.colorB})` }} />

        {/* Badge */}
        {game.badge && (
          <div className="absolute right-2.5 top-3 z-10">
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: game.colorA }}
            >
              {game.badge}
            </span>
          </div>
        )}

        {/* Logo */}
        <div className="flex justify-center pb-2 pt-5">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-xl overflow-hidden transition-transform duration-200 group-hover:scale-110 group-hover:rotate-1"
            style={{
              background: `linear-gradient(135deg, ${game.colorA}, ${game.colorB})`,
              boxShadow: `0 4px 14px ${game.colorA}45`,
            }}
          >
            {game.image && !imgErr ? (
              <img
                src={game.image}
                alt={game.name}
                className="h-full w-full object-cover"
                onError={() => setImgErr(true)}
              />
            ) : (
              <span className="text-white text-[13px] font-black">{game.letter}</span>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="px-3 pb-1 text-center">
          <p className="text-[12px] font-bold leading-tight text-foreground truncate">{game.name}</p>
          <p className="text-[10px] mt-0.5" style={{ color: '#1d4ed8' }}>{game.fullName}</p>
        </div>

        {/* Currency chip */}
        <div className="px-3 pb-3 pt-1">
          <div
            className="rounded-lg px-2 py-1.5 text-center"
            style={{ background: `${game.colorA}12`, border: `1px solid ${game.colorA}25` }}
          >
            <span className="text-[11px] font-bold" style={{ color: game.colorA }}>{game.currency}</span>
          </div>
        </div>

        {/* CTA */}
        <div className="px-3 pb-3.5">
          <button
            className="w-full rounded-xl py-2 text-[12px] font-bold text-white transition-all duration-150 hover:brightness-110 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-1.5"
            style={{
              background: 'linear-gradient(135deg, #2563eb, #06b6d4)',
              boxShadow: '0 4px 14px rgba(37,99,235,0.35)',
            }}
          >
            เติมเกมเลย
            <ChevronRight size={11} />
          </button>
        </div>
      </div>
    </Link>
  )
}

// Need React import for useState in GameCard
import React from 'react'

export default function TopUpPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden py-20 text-center text-white"
        style={{
          background: 'linear-gradient(130deg, #1e40af 0%, #2563eb 45%, #0891b2 100%)',
        }}
      >
        {/* Grid texture */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06] pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="tgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#tgrid)" />
        </svg>

        {/* Glow orbs */}
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(6,182,212,0.25)' }} />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full blur-3xl" style={{ background: 'rgba(37,99,235,0.3)' }} />

        <div className="relative z-10 mx-auto max-w-2xl px-4">
          <div
            className="mb-4 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest backdrop-blur-sm"
            style={{ border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)', color: '#bfdbfe' }}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300" style={{ boxShadow: '0 0 6px #67e8f9' }} />
            Top Up Center
          </div>

          <h1 className="mb-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl" style={{ color: '#fff', textShadow: '0 2px 20px rgba(0,0,0,0.25)' }}>
            เติมเกม{' '}
            <span style={{ color: '#67e8f9', textShadow: '0 0 32px rgba(6,182,212,0.7)' }}>ง่าย ไว</span>{' '}
            ปลอดภัย
          </h1>

          <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed sm:text-base" style={{ color: 'rgba(255,255,255,0.72)' }}>
            เลือกเกมที่ต้องการเติม รองรับ 10+ เกมยอดนิยม
            <br />
            รับไอเทมทันที ทุกวัน ตลอด 24 ชั่วโมง
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {[
              { icon: Zap, label: "ส่งทันที" },
              { icon: ShieldCheck, label: "ปลอดภัย 100%" },
              { icon: Clock, label: "24/7" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm"
                style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.10)' }}
              >
                <Icon className="h-3.5 w-3.5" style={{ color: '#67e8f9' }} />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Game Grid ── */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
              style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}
            >
              <Zap size={13} />
            </span>
            <h2 className="text-[15px] font-bold tracking-tight text-foreground">
              เลือกเกมที่{' '}
              <span style={{ color: '#2563eb' }}>ต้องการเติม</span>
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: '#1d4ed8' }}>
            <Star className="h-3.5 w-3.5 fill-current" style={{ color: '#06b6d4' }} />
            10 เกมยอดนิยม พร้อมให้บริการ
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {games.map((game) => (
            <GameCard key={game.slug} game={game} />
          ))}
        </div>
      </section>

      {/* Divider */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, #bfdbfe, transparent)' }} />
      </div>

      {/* ── Why us ── */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex items-center gap-2 mb-6">
          <span
            className="w-6 h-6 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ background: 'linear-gradient(135deg, #2563eb, #06b6d4)' }}
          >
            <ShieldCheck size={13} />
          </span>
          <h2 className="text-[15px] font-bold tracking-tight text-foreground">
            ทำไมต้อง{' '}
            <span style={{ color: '#2563eb' }}>เติมกับเรา?</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {whyUs.map(({ icon: Icon, title, desc, iconBg, iconColor, glowColor }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-2xl bg-white p-5 border border-border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
              style={{ '--hover-shadow': glowColor } as React.CSSProperties}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 24px ${glowColor}`
                ;(e.currentTarget as HTMLElement).style.borderColor = iconColor
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = ''
                ;(e.currentTarget as HTMLElement).style.borderColor = ''
              }}
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: iconBg }}
              >
                <Icon className="h-5 w-5" style={{ color: iconColor }} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{title}</p>
                <p className="mt-1 text-xs leading-relaxed" style={{ color: '#1d4ed8' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div
          className="rounded-2xl px-8 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center"
          style={{
            background: 'linear-gradient(130deg, #1e40af 0%, #2563eb 50%, #0891b2 100%)',
            boxShadow: '0 8px 32px rgba(37,99,235,0.25)',
          }}
        >
          {[
            { num: '50K+', label: 'ออร์เดอร์' },
            { num: '4.9★', label: 'รีวิวเฉลี่ย' },
            { num: '<1 นาที', label: 'ส่งทันที' },
            { num: '100%', label: 'ปลอดภัย' },
          ].map(item => (
            <div key={item.label}>
              <div className="text-2xl font-extrabold text-white leading-none">{item.num}</div>
              <div className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
