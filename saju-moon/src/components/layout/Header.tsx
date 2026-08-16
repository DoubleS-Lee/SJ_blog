'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { LogoMark, StarMark } from '@/components/ui/StarMark'
import { getOrCreateAnalyticsSessionId, trackAnalyticsEvent } from '@/lib/analytics/client'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/counsel', label: '익명상담' },
  { href: '/reviews', label: '후기' },
  { href: '/interpretation', label: '사주해석', adminOnly: true },
  { href: '/compatibility', label: '궁합', adminOnly: true },
  { href: '/taekil', label: '택일', adminOnly: true },
  { href: '/', label: '블로그' },
]

interface HeaderProps {
  user: User | null
  isAdmin: boolean
}

export default function Header({ user, isAdmin }: HeaderProps) {
  const visibleLinks = NAV_LINKS.filter((link) => !link.adminOnly || isAdmin)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  function trackMenuClick(label: string, href: string) {
    if (typeof window === 'undefined') return
    const { sessionId } = getOrCreateAnalyticsSessionId()
    void trackAnalyticsEvent({
      eventName: 'menu_click',
      sessionId,
      pagePath: `${window.location.pathname}${window.location.search}`,
      pageType: 'global_navigation',
      properties: { menu_name: label, target_path: href },
    })
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <>
      {/* ── 헤더 바 ── */}
      <header
        className="sticky top-0 z-40"
        style={{ background: '#F6EFE3', borderBottom: '1px solid rgba(30,45,77,0.08)' }}
      >
        <div className="mx-auto flex h-16.5 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* 로고 */}
          <Link href="/" prefetch={false} className="flex items-center gap-2.5" style={{ color: '#1E2D4D' }}>
            <LogoMark size={30} />
            <span
              className="text-[20px] font-bold tracking-[1px]"
              style={{ fontFamily: 'var(--font-nanum-myeongjo), serif' }}
            >
              사주로아
            </span>
          </Link>

          {/* 데스크탑 네비 (중앙) */}
          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 md:flex">
            {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={false}
                className="text-[15px] transition-colors"
                style={{ color: isActive(link.href) ? '#1E2D4D' : '#4a5673', fontWeight: isActive(link.href) ? 500 : 400 }}
                onClick={() => trackMenuClick(link.label, link.href)}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* 데스크탑 인증 (오른쪽) */}
          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <>
                <Link
                  href="/mypage"
                  prefetch={false}
                  className="text-[14px] transition-opacity hover:opacity-60"
                  style={{ color: '#4a5673' }}
                >
                  마이페이지
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="text-[14px] transition-opacity hover:opacity-60"
                  style={{ color: '#4a5673' }}
                >
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  scroll={false}
                  prefetch={false}
                  className="rounded-full px-4.5 py-2 text-[14px] transition-opacity hover:opacity-70"
                  style={{ border: '1px solid rgba(74,86,115,0.45)', color: '#4a5673' }}
                >
                  로그인
                </Link>
                <Link
                  href="/login"
                  scroll={false}
                  prefetch={false}
                  className="rounded-full px-4.5 py-2 text-[14px] transition-opacity hover:opacity-80"
                  style={{ border: '1px solid #C4A24E', color: '#8a6d28' }}
                >
                  회원가입
                </Link>
              </>
            )}
          </div>

          {/* 모바일 오른쪽: 로그인 + 햄버거 */}
          <div className="flex items-center gap-3 md:hidden">
            {!user && (
              <Link href="/login" prefetch={false} className="text-[13px]" style={{ color: '#4a5673' }}>
                로그인
              </Link>
            )}
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="메뉴 열기"
              className="p-1"
              style={{ color: '#1E2D4D' }}
            >
              <Menu size={22} />
            </button>
          </div>
        </div>
      </header>

      {/* ── 모바일 사이드바 (오른쪽 슬라이드인) ── */}
      <div className="md:hidden">
        {/* 백드롭 */}
        <div
          className={`fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 ${
            menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />

        {/* 사이드바 패널 */}
        <div
          className={`fixed right-0 top-0 z-51 flex h-full w-[78%] max-w-xs flex-col overflow-hidden transition-transform duration-300 ease-in-out ${
            menuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ background: '#182543' }}
          aria-label="사이드 메뉴"
        >
          {/* 장식 별 */}
          <div className="pointer-events-none absolute" style={{ left: '14%', top: 120, width: 4, height: 4, borderRadius: '50%', background: '#D9C48A', opacity: 0.7 }} />
          <div className="pointer-events-none absolute" style={{ right: '20%', top: 90, width: 3, height: 3, borderRadius: '50%', background: '#F6EFE3', opacity: 0.5 }} />
          <div className="pointer-events-none absolute" style={{ right: '26%', top: 200, width: 4, height: 4, borderRadius: '50%', background: '#D9C48A', opacity: 0.5 }} />

          {/* 사이드바 헤더 */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid rgba(246,239,227,0.08)' }}
          >
            <Link
              href="/"
              prefetch={false}
              className="flex items-center gap-2"
              style={{ color: '#D9C48A' }}
              onClick={() => setMenuOpen(false)}
            >
              <LogoMark size={24} />
              <span
                className="text-[18px] font-bold tracking-[1px]"
                style={{ fontFamily: 'var(--font-nanum-myeongjo), serif' }}
              >
                사주로아
              </span>
            </Link>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="메뉴 닫기"
              className="p-1 transition-opacity hover:opacity-60"
              style={{ color: '#F6EFE3' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* 네비게이션 링크 */}
          <nav className="flex flex-1 flex-col px-8 pt-14">
            {visibleLinks.map((link, i) => {
              const isLast = i === NAV_LINKS.length - 1
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={false}
                  className="flex items-center gap-3 py-4.5 text-[28px] font-bold transition-opacity hover:opacity-70"
                  style={{
                    fontFamily: 'var(--font-nanum-myeongjo), serif',
                    color: active ? '#D9C48A' : '#F6EFE3',
                    borderBottom: '1px solid rgba(246,239,227,0.12)',
                  }}
                  onClick={() => { trackMenuClick(link.label, link.href); setMenuOpen(false) }}
                >
                  {link.label}
                </Link>
              )
            })}
            {user && (
              <Link
                href="/mypage"
                prefetch={false}
                className="py-4.5 text-[28px] font-bold transition-opacity hover:opacity-70"
                style={{
                  fontFamily: 'var(--font-nanum-myeongjo), serif',
                  color: isActive('/mypage') ? '#D9C48A' : '#F6EFE3',
                  borderBottom: '1px solid rgba(246,239,227,0.12)',
                }}
                onClick={() => setMenuOpen(false)}
              >
                마이페이지
              </Link>
            )}
          </nav>

          {/* 하단: 인증 버튼 + 소셜 */}
          <div className="px-8 pb-12">
            {user ? (
              <div className="flex gap-3">
                <Link
                  href="/mypage"
                  prefetch={false}
                  className="flex-1 rounded-full py-3.25 text-center text-[15px] transition-opacity hover:opacity-80"
                  style={{ border: '1px solid rgba(217,196,138,0.5)', color: '#F6EFE3' }}
                  onClick={() => setMenuOpen(false)}
                >
                  마이페이지
                </Link>
                <button
                  type="button"
                  onClick={() => { void handleLogout(); setMenuOpen(false) }}
                  className="flex-1 rounded-full py-3.25 text-center text-[15px] font-bold transition-opacity hover:opacity-80"
                  style={{ background: '#C4A24E', color: '#182543' }}
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link
                  href="/login"
                  scroll={false}
                  prefetch={false}
                  className="flex-1 rounded-full py-3.25 text-center text-[15px] transition-opacity hover:opacity-80"
                  style={{ border: '1px solid rgba(217,196,138,0.5)', color: '#F6EFE3' }}
                  onClick={() => setMenuOpen(false)}
                >
                  로그인
                </Link>
                <Link
                  href="/login"
                  scroll={false}
                  prefetch={false}
                  className="flex-1 rounded-full py-3.25 text-center text-[15px] font-bold transition-opacity hover:opacity-80"
                  style={{ background: '#C4A24E', color: '#182543' }}
                  onClick={() => setMenuOpen(false)}
                >
                  회원가입
                </Link>
              </div>
            )}
            <div className="mt-5 flex justify-center gap-5 text-[12px]" style={{ color: '#aeb8cf' }}>
              <a href="https://www.youtube.com/@saju_roa" target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-60">YouTube</a>
              <a href="https://www.instagram.com/saju.roa/" target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-60">Instagram</a>
              <a href="https://www.threads.com/@saju.roa" target="_blank" rel="noreferrer" className="transition-opacity hover:opacity-60">Threads</a>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
