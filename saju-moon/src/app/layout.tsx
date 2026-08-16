import type { Metadata } from 'next'
import { Suspense } from 'react'
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
  Cormorant_Garamond,
} from 'next/font/google'
import { cookies } from 'next/headers'
import './globals.css'
import AnalyticsTracker from '@/components/analytics/AnalyticsTracker'
import Header from '@/components/layout/Header'
import SocialChannelsFooter from '@/components/layout/SocialChannelsFooter'
import { getSiteUrlObject, SITE_NAME } from '@/lib/seo/site'
import { createClient } from '@/lib/supabase/server'
import { hasSupabaseSessionCookie } from '@/lib/supabase/session-cookie'

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
  weight: ['400', '700', '800'],
  variable: '--font-nanum-myeongjo',
})

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-cormorant-garamond',
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

function HeaderFallback() {
  return (
    <header
      className="sticky top-0 z-40 h-16.5"
      style={{ background: '#F6EFE3', borderBottom: '1px solid rgba(30,45,77,0.08)' }}
    />
  )
}

async function HeaderAuthGate() {
  let user = null
  let isAdmin = false

  if (hasSupabaseSessionCookie((await cookies()).getAll())) {
    const supabase = await createClient()

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser()
      user = currentUser

      if (user) {
        const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).maybeSingle()
        isAdmin = Boolean(data?.is_admin)
      }
    } catch (error) {
      const authCode = error && typeof error === 'object' && 'code' in error ? String(error.code) : null
      if (authCode !== 'refresh_token_not_found') {
        throw error
      }
    }
  }

  return <Header user={user} isAdmin={isAdmin} />
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="ko"
      className={`${notoSansKR.variable} ${doHyeon.variable} ${nanumGothic.variable} ${nanumMyeongjo.variable} ${cormorantGaramond.variable} ${jua.variable} ${blackHanSans.variable} ${gaegu.variable} ${sunflower.variable} ${gothicA1.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col font-(--font-noto-sans-kr)">
        <Suspense fallback={null}>
          <AnalyticsTracker />
        </Suspense>
        <Suspense fallback={<HeaderFallback />}>
          <HeaderAuthGate />
        </Suspense>
        <main className="flex-1">
          <Suspense fallback={null}>{children}</Suspense>
        </main>
        <footer
          className="mt-16 border-t"
          style={{ borderColor: 'rgba(30,45,77,0.08)', background: '#F6EFE3' }}
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 text-center">
            {/* 별 구분선 */}
            <div className="flex items-center justify-center gap-4 mb-5">
              <div style={{ width: 56, height: 1, background: '#D9C48A' }} />
              <div style={{ width: 11, height: 11, background: '#C4A24E', clipPath: 'polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)' }} />
              <div style={{ width: 56, height: 1, background: '#D9C48A' }} />
            </div>
            {/* FOLLOW */}
            <p
              className="mb-3 tracking-[5px]"
              style={{ fontFamily: 'var(--font-cormorant-garamond), serif', fontSize: 14, fontWeight: 600, color: '#B78D3C' }}
            >
              FOLLOW SAJU ROA
            </p>
            {/* 소셜 링크 */}
            <div className="flex justify-center gap-5 mb-5" style={{ fontSize: 13, color: '#4a5673' }}>
              <a href="https://www.youtube.com/@saju_roa" target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-60">YouTube</a>
              <a href="https://www.instagram.com/saju.roa/" target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-60">Instagram</a>
              <a href="https://www.threads.com/@saju.roa" target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-60">Threads</a>
            </div>
            {/* 저작권 */}
            <p style={{ fontSize: 12, color: '#a39c8c' }}>
              Copyright 2026 {SITE_NAME}. All rights reserved.
              {' | '}
              <a href="/privacy" className="transition-opacity hover:opacity-60" style={{ color: '#a39c8c' }}>개인정보처리방침</a>
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
