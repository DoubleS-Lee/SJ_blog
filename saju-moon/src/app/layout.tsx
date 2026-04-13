import type { Metadata } from 'next'
import { Noto_Sans_KR } from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/server'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-kr',
})

export const metadata: Metadata = {
  title: {
    default: '사주 Moon — 나의 사주로 읽는 맞춤 콘텐츠',
    template: '%s | 사주 Moon',
  },
  description:
    '사주 인플루언서 허브 블로그. 내 사주에 해당되는 콘텐츠를 자동으로 찾아드립니다.',
  openGraph: {
    siteName: '사주 Moon',
    locale: 'ko_KR',
    type: 'website',
  },
}

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <html lang="ko" className={`${notoSansKR.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-(--font-noto-sans-kr)">
        <Header user={user} />
        <main className="flex-1">{children}</main>
        <footer className="border-t border-gray-100 py-8 mt-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
            <span>© 2026 사주 Moon. All rights reserved.</span>
            <nav className="flex items-center gap-4">
              <a href="/privacy" className="hover:text-black transition-colors">개인정보 처리방침</a>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  )
}
