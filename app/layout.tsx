import React from "react"
import type { Metadata, Viewport } from 'next'
import { Noto_Sans_JP } from 'next/font/google'

import './globals.css'

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'FooCo - 食材管理アプリ',
  description: '献立に基づいた買い物リストで、無駄のない食材管理',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#C19A6B',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ja">
      <body className={`${notoSansJP.variable} font-sans antialiased`}>{children}</body>
    </html>
  )
}
