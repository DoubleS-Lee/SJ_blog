'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const NAV_LINKS = [
  { href: '/', label: '블로그' },
]

interface HeaderProps {
  user: User | null
}

export default function Header({ user }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* 로고 */}
        <Link href="/" className="text-lg font-bold tracking-tight">
          사주 Moon
        </Link>

        {/* 데스크탑 네비 (중앙) */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-600 hover:text-black transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* 데스크탑 우측 */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link
                href="/mypage"
                className="text-sm text-gray-600 hover:text-black transition-colors px-3 py-1"
              >
                마이페이지
              </Link>
              <button
                onClick={handleLogout}
                className={buttonVariants({ variant: 'ghost', size: 'sm' })}
              >
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
                로그인
              </Link>
              <Link href="/login" className={buttonVariants({ size: 'sm' })}>
                회원가입
              </Link>
            </>
          )}
        </div>

        {/* 모바일 우측 */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <button
              onClick={handleLogout}
              className={buttonVariants({ size: 'sm', variant: 'ghost' })}
            >
              로그아웃
            </button>
          ) : (
            <Link href="/login" className={buttonVariants({ size: 'sm' })}>
              로그인
            </Link>
          )}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1 text-gray-600"
            aria-label="메뉴"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* 모바일 드롭다운 */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-700"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          {user && (
            <Link
              href="/mypage"
              className="text-sm text-gray-700"
              onClick={() => setMenuOpen(false)}
            >
              마이페이지
            </Link>
          )}
        </div>
      )}
    </header>
  )
}
