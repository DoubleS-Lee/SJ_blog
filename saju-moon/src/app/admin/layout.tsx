import Link from 'next/link'
import { requireAdmin } from '@/lib/auth/admin'

export const metadata = {
  title: {
    default: '관리자',
    template: '%s | 관리자',
  },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin()

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-12 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/admin" scroll={false} className="text-sm font-semibold tracking-tight">
              사주로아의 사주이야기 관리자
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/admin/analytics" scroll={false} className="text-sm text-gray-500 transition-colors hover:text-black">
                분석
              </Link>
              <Link href="/admin/posts" scroll={false} className="text-sm text-gray-500 transition-colors hover:text-black">
                글 관리
              </Link>
              <Link href="/admin/counsel" scroll={false} className="text-sm text-gray-500 transition-colors hover:text-black">
                상담 관리
              </Link>
              <Link href="/admin/compatibility-copy" scroll={false} className="text-sm text-gray-500 transition-colors hover:text-black">
                궁합 문구
              </Link>
              <Link href="/admin/taekil-copy" scroll={false} className="text-sm text-gray-500 transition-colors hover:text-black">
                택일 문구
              </Link>
              <Link href="/life-graph" scroll={false} className="text-sm text-gray-500 transition-colors hover:text-black">
                사주 생애 그래프
              </Link>
              <Link href="/interpretation" scroll={false} className="text-sm text-gray-500 transition-colors hover:text-black">
                사주 해석
              </Link>
              <Link href="/admin/settings" scroll={false} className="text-sm text-gray-500 transition-colors hover:text-black">
                설정
              </Link>
            </nav>
          </div>
          <Link href="/" scroll={false} className="text-xs text-gray-400 transition-colors hover:text-black">
            사이트 보기
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-gray-50">{children}</main>
    </div>
  )
}
