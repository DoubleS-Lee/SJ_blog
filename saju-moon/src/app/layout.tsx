import type { Metadata } from 'next'
import {
  Noto_Sans_KR,
  Nanum_Gothic,
  Nanum_Myeongjo,
  Do_Hyeon,
  Jua,
  Black_Han_Sans,
  Gaegu,
  Sunflower,
  Gothic_A1,
} from 'next/font/google'
import './globals.css'
import Header from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/server'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-kr',
})
// 나눔스퀘어 대체 → Do Hyeon (둥글고 현대적인 고딕)
const doHyeon = Do_Hyeon({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-do-hyeon',
})
// 나눔바른고딕 대체 → Nanum Gothic
const nanumGothic = Nanum_Gothic({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-nanum-gothic',
})
// 제주명조 대체 → Nanum Myeongjo
const nanumMyeongjo = Nanum_Myeongjo({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-nanum-myeongjo',
})
const jua = Jua({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-jua',
})
const blackHanSans = Black_Han_Sans({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-black-han-sans',
})
const gaegu = Gaegu({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-gaegu',
})
const sunflower = Sunflower({
  weight: ['300', '500', '700'],
  variable: '--font-sunflower',
})
const gothicA1 = Gothic_A1({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-gothic-a1',
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
    <html lang="ko" className={`${notoSansKR.variable} ${doHyeon.variable} ${nanumGothic.variable} ${nanumMyeongjo.variable} ${jua.variable} ${blackHanSans.variable} ${gaegu.variable} ${sunflower.variable} ${gothicA1.variable} h-full antialiased`}>
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
