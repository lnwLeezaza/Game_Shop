import type { Metadata, Viewport } from 'next'
import { Noto_Sans_Thai, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  variable: '--font-sans',
})

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

export const metadata: Metadata = {
  title: {
    default: 'GameShop - ซื้อขายไอดีเกม',
    template: '%s | GameShop',
  },
  description: 'แพลตฟอร์มซื้อขายไอดีเกมและไอเทมที่ปลอดภัยที่สุด ROV, Free Fire, PUBG, Genshin Impact',
  keywords: ['ซื้อไอดีเกม', 'ขายไอดีเกม', 'ROV', 'Free Fire', 'PUBG', 'Genshin', 'ไอเทมเกม'],
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="th" className={`${notoSansThai.variable} ${geistMono.variable} bg-background`}>
      <body className="min-h-screen font-sans antialiased overflow-x-hidden max-w-[100vw]">
        {children}
        <Toaster position="top-center" richColors />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
