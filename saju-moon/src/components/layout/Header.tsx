'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { buttonVariants } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const NAV_LINKS = [
  { href: '/', label: '블로그' },
  { href: '/counsel', label: '익명 상담' },
  { href: '/taekil', label: '택일' },
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
    <header className="sticky top-0 z-50 border-b border-gray-100 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          사주 Moon
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-gray-600 transition-colors hover:text-black"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link
                href="/mypage"
                className="px-3 py-1 text-sm text-gray-600 transition-colors hover:text-black"
              >
                마이페이지
              </Link>
              <button
                type="button"
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

        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <button
              type="button"
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
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            className="p-1 text-gray-600"
            aria-label="메뉴"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="flex flex-col gap-4 border-t border-gray-100 bg-white px-4 py-4 md:hidden">
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
