import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: { default: '관리자', template: '%s | 관리자' } }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // DB 레벨에서 is_admin 확인 (UI 체크가 아닌 서버 강제)
  const { data } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!data?.is_admin) redirect('/')

  return (
    <div className="min-h-screen flex flex-col">
      {/* 관리자 전용 헤더 */}
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-12 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-sm font-semibold tracking-tight">
              사주 Moon 관리자
            </Link>
            <nav className="flex items-center gap-4">
              <Link href="/admin/posts" className="text-sm text-gray-500 hover:text-black transition-colors">
                글 관리
              </Link>
              <Link href="/admin/counsel" className="text-sm text-gray-500 hover:text-black transition-colors">
                상담 관리
              </Link>
              <Link href="/admin/settings" className="text-sm text-gray-500 hover:text-black transition-colors">
                설정
              </Link>
            </nav>
          </div>
          <Link href="/" className="text-xs text-gray-400 hover:text-black transition-colors">
            사이트 보기 →
          </Link>
        </div>
      </header>

      <main className="flex-1 bg-gray-50">
        {children}
      </main>
    </div>
  )
}
