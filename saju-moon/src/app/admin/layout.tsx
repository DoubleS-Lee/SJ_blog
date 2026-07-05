import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/admin'

export const metadata = {
  title: {
    default: '관리자',
    template: '%s | 관리자',
  },
}

const NAV_ITEMS = [
  { href: '/admin/analytics', label: '분석' },
  { href: '/admin/posts', label: '글 관리' },
  { href: '/admin/users', label: '회원 관리' },
  { href: '/admin/counsel', label: '상담 관리' },
  { href: '/admin/compatibility-copy', label: '궁합 문구' },
  { href: '/admin/taekil-copy', label: '택일 문구' },
  { href: '/life-graph', label: '생애 그래프' },
  { href: '/interpretation', label: '사주 해석' },
  { href: '/admin/settings', label: '설정' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="min-h-screen flex flex-col">
      <header style={{ background: '#F6EFE3', borderBottom: '1px solid rgba(30,45,77,0.10)' }}>
        {/* 타이틀 행 */}
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/admin"
              scroll={false}
              className="shrink-0 text-sm font-bold tracking-tight"
              style={{ color: '#1E2D4D', fontFamily: 'var(--font-nanum-myeongjo), serif' }}
            >
              관리자
            </Link>
            {/* 데스크탑 네비 */}
            <nav className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  scroll={false}
                  className="rounded-full px-3 py-1.5 text-sm transition-colors hover:opacity-80"
                  style={{ color: '#4a5673' }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <Link
            href="/"
            scroll={false}
            className="shrink-0 rounded-full px-3 py-1.5 text-xs transition-opacity hover:opacity-60"
            style={{ color: '#4a5673', border: '1px solid rgba(30,45,77,0.18)' }}
          >
            사이트 보기
          </Link>
        </div>

        {/* 모바일 네비 — 가로 스크롤 */}
        <div
          className="md:hidden"
          style={{ borderTop: '1px solid rgba(30,45,77,0.07)' }}
        >
          <nav
            className="flex items-center gap-1 overflow-x-auto px-3 py-2"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                scroll={false}
                className="shrink-0 rounded-full px-3 py-1.5 text-[13px] whitespace-nowrap transition-opacity hover:opacity-70"
                style={{
                  color: '#1E2D4D',
                  background: 'rgba(30,45,77,0.06)',
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1" style={{ background: '#F6EFE3' }}>{children}</main>
    </div>
  )
}
