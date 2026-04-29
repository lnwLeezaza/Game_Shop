"use client";

import Link from "next/link";
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Zap, ShieldCheck, Clock, Star, Tag, Headphones } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const games = [
  {
    slug: "rov",
    name: "ROV",
    image: '/gamespic/rov.png',  // ← ใส่ path รูป
    currency: "Voucher",
    badge: "ยอดนิยม",
    badgeVariant: "secondary" as const,
    // grad: "from-sky-400 to-cyan-400",
    // shadow: "shadow-sky-400/40",
    letter: "R",
  },
  {
    slug: "free-fire",
    name: "Free Fire",
    image: '/gamespic/freefire.jpg',  // ← ใส่ path รูป
    currency: "เพชร",
    badge: "HOT",
    badgeVariant: "destructive" as const,
    // grad: "from-orange-400 to-amber-400",
    // shadow: "shadow-orange-400/40",
    letter: "F",
  },
  {
    slug: "mobile-legends",
    name: "Mobile Legends",
   image: '/gamespic/mmlb.jpg',  // ← ใส่ path รูป
    currency: "Diamond",
    badge: "ยอดนิยม",
    badgeVariant: "secondary" as const,
    // grad: "from-blue-500 to-indigo-500",
    // shadow: "shadow-blue-500/40",
    letter: "M",
  },
  {
    slug: "pubg-mobile",
    name: "PUBG Mobile",
    image: '/gamespic/pubg.jpg',  // ← ใส่ path รูป
    currency: "UC",
    badge: "HOT",
    badgeVariant: "destructive" as const,
    // grad: "from-amber-500 to-yellow-400",
    // shadow: "shadow-amber-500/40",
    letter: "P",
  },
  {
    slug: "valorant",
    name: "Valorant",
    image: '/gamespic/valorant.jpg',  // ← ใส่ path รูป
    currency: "VP",
    badge: null,
    badgeVariant: "outline" as const,
    // grad: "from-red-500 to-rose-500",
    // shadow: "shadow-red-500/40",
    letter: "V",
  },
  {
    slug: "Heartopia - เกมใหม่",
    name: "Heartopia ",
    image: '/gamespic/hajpg.jpg',
    currency: "Diamond",
    badge: "NEW",
    badgeVariant: "default" as const,
    // grad: "from-violet-500 to-purple-500",
    // shadow: "shadow-violet-500/40",
    letter: "G",
  },
  {
    slug: "undawn",
    name: "Undawn",
    currency: "Gold",
    badge: "NEW",
    badgeVariant: "default" as const,
    grad: "from-emerald-500 to-green-500",
    shadow: "shadow-emerald-500/40",
    letter: "U",
  },
  {
    slug: "delta-force",
    name: "Delta Force",
    image: '/gamespic/delta force.jpg ',
    currency: "Token",
    badge: "NEW",
    badgeVariant: "default" as const,
    // grad: "from-slate-500 to-slate-600",
    // shadow: "shadow-slate-500/30",
    letter: "D",
  },
  {
    slug: "call-of-duty-mobile",
    name: "Call of Duty Mobile",
    currency: "CP",
    badge: null,
    badgeVariant: "outline" as const,
    grad: "from-stone-500 to-yellow-600",
    shadow: "shadow-stone-500/30",
    letter: "C",
  },
  {
    slug: "haikyu",
    name: "HAIKYU!!",
    currency: "Gem",
    badge: "NEW",
    badgeVariant: "default" as const,
    grad: "from-orange-400 to-pink-500",
    shadow: "shadow-pink-500/40",
    letter: "H",
  },
];

const whyUs = [
  {
    icon: Zap,
    title: "ส่งทันที",
    desc: "รับไอเทมภายในไม่กี่วินาที ระบบอัตโนมัติ 100%",
    bg: "bg-yellow-50",
    iconColor: "text-yellow-500",
  },
  {
    icon: Tag,
    title: "ราคาดีที่สุด",
    desc: "ถูกกว่าช่องทางอื่น มีโปรโมชั่นและส่วนลดต่อเนื่อง",
    bg: "bg-green-50",
    iconColor: "text-green-500",
  },
  {
    icon: ShieldCheck,
    title: "ปลอดภัย 100%",
    desc: "เติมผ่านช่องทางทางการ ไม่มีความเสี่ยงต่อบัญชีเกม",
    bg: "bg-blue-50",
    iconColor: "text-blue-500",
  },
  {
    icon: Headphones,
    title: "ซัพพอร์ต 24/7",
    desc: "ทีมงานพร้อมช่วยเหลือตลอด 24 ชั่วโมงทุกวัน",
    bg: "bg-purple-50",
    iconColor: "text-purple-500",
  },
];

export default function TopUpPage() {
  return (
    <div className="min-h-screen bg-[#f5f3ff] text-foreground">
      <Header />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#c026d3] via-[#7c3aed] to-[#4f46e5] py-20 text-center text-white">
        <div className="pointer-events-none absolute -left-16 -top-16 h-72 w-72 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-white/5 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-2xl px-4">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-purple-100 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-300 shadow-[0_0_6px_#fde68a]" />
            Top Up Center
          </div>

          <h1 className="mb-3 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            เติมเกม <span className="text-yellow-300">ง่าย ไว</span> ปลอดภัย
          </h1>

          <p className="mx-auto mb-8 max-w-md text-sm leading-relaxed text-white/75 sm:text-base">
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
                className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-sm"
              >
                <Icon className="h-3.5 w-3.5 text-yellow-300" />
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Game Grid ── */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-[#1e1b4b]">
            เลือกเกมที่ <span className="text-[#7c3aed]">ต้องการเติม</span>
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
            10 เกมยอดนิยม พร้อมให้บริการ
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {games.map((game) => (
            <Link key={game.slug} href={`/topup/${game.slug}`} className="group block">
              <div className="relative flex flex-col overflow-hidden rounded-2xl border-[1.5px] border-[#ede9fe] bg-white transition-all duration-300 hover:-translate-y-1.5 hover:border-[#c4b5fd] hover:shadow-[0_12px_32px_rgba(124,58,237,0.14)]">

                {/* top accent bar */}
                <div className={`h-1 w-full bg-gradient-to-r ${game.grad}`} />

                {/* badge */}
                {game.badge && (
                  <div className="absolute right-2.5 top-3 z-10">
                    <Badge variant={game.badgeVariant} className="px-1.5 py-0.5 text-[10px] font-bold">
                      {game.badge}
                    </Badge>
                  </div>
                )}
                <div className="flex justify-center pb-2 pt-5">
  <div
    className={`flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br ${game.grad} shadow-lg ${game.shadow} overflow-hidden transition-transform duration-200 group-hover:scale-105`}
  >
    {game.image ? (
      <img
        src={game.image}
        alt={game.name}
        className="h-full w-full object-cover"
      />
    ) : (
      <span className="text-xl font-extrabold text-white">{game.letter}</span>
    )}
  </div>
</div>

                {/* info */}
                <div className="px-3 pb-2 text-center">
                  <p className="text-[13px] font-bold leading-tight text-[#1e1b4b]">
                    {game.name}
                  </p>
                  <span className="mt-1 inline-block rounded-md bg-[#f5f3ff] px-2 py-0.5 text-[11px] font-semibold text-[#7c3aed]">
                    {game.currency}
                  </span>
                </div>

                {/* CTA button */}
                <div className="px-3 pb-3.5 pt-1">
                  <button
                    className="relative w-full overflow-hidden rounded-xl py-2.5 text-[13px] font-bold tracking-wide text-white transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(124,58,237,0.45)] active:scale-95"
                    style={{
                      background: "linear-gradient(135deg,#d946a8,#7c3aed)",
                      boxShadow: "0 4px 14px rgba(124,58,237,0.35)",
                    }}
                  >
                    <span className="pointer-events-none absolute inset-0 rounded-xl bg-gradient-to-br from-white/20 to-transparent" />
                    <span className="relative flex items-center justify-center gap-2">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25">
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                          <path d="M1 5h8M5 1l4 4-4 4" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      เติมเกมเลย
                    </span>
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* divider */}
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-px bg-gradient-to-r from-transparent via-[#ddd6fe] to-transparent" />
      </div>

      {/* ── Why us ── */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-xl font-bold text-[#1e1b4b]">
          ทำไมต้อง <span className="text-[#7c3aed]">เติมกับเรา?</span>
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {whyUs.map(({ icon: Icon, title, desc, bg, iconColor }) => (
            <div
              key={title}
              className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-[#ede9fe] bg-white p-5 transition-all duration-200 hover:-translate-y-1 hover:border-[#c4b5fd] hover:shadow-[0_8px_20px_rgba(124,58,237,0.08)]"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-[#1e1b4b]">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
