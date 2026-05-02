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
import AnalyticsTracker from '@/components/analytics/AnalyticsTracker'
import Header from '@/components/layout/Header'
import SocialChannelsFooter from '@/components/layout/SocialChannelsFooter'
import { getSiteUrlObject, SITE_NAME } from '@/lib/seo/site'
import { createClient } from '@/lib/supabase/server'

const notoSansKR = Noto_Sans_KR({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-kr',
})

const doHyeon = Do_Hyeon({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-do-hyeon',
})

const nanumGothic = Nanum_Gothic({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-nanum-gothic',
})

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
  metadataBase: getSiteUrlObject(),
  title: {
    default: `${SITE_NAME} | 사주 해석과 맞춤 콘텐츠`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    '사주 해석과 블로그 콘텐츠를 연결해 내 사주에 맞는 글과 서비스를 자연스럽게 찾아보는 사주로아의 콘텐츠 서비스입니다.',
  openGraph: {
    siteName: SITE_NAME,
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
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
    <html
      lang="ko"
      className={`${notoSansKR.variable} ${doHyeon.variable} ${nanumGothic.variable} ${nanumMyeongjo.variable} ${jua.variable} ${blackHanSans.variable} ${gaegu.variable} ${sunflower.variable} ${gothicA1.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-(--font-noto-sans-kr)">
        <AnalyticsTracker />
        <Header user={user} />
        <main className="flex-1">{children}</main>
        <footer className="mt-12 border-t border-gray-100 py-8">
          <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6">
            <SocialChannelsFooter />
            <div className="flex flex-col items-center justify-between gap-4 text-xs text-gray-400 sm:flex-row">
              <span>Copyright 2026 {SITE_NAME}. All rights reserved.</span>
              <nav className="flex items-center gap-4">
                <a href="/privacy" className="transition-colors hover:text-black">
                  개인정보처리방침
                </a>
              </nav>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}
