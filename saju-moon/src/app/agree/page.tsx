import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AgreeForm from './AgreeForm'

export const metadata = { title: '서비스 이용 동의' }

interface Props {
  searchParams: Promise<{ next?: string }>
}

export default async function AgreePage({ searchParams }: Props) {
  const { next } = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 이미 동의한 사용자는 바로 이동
  const { data: profile } = await supabase
    .from('users')
    .select('terms_agreed_at')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.terms_agreed_at) {
    redirect(next?.startsWith('/') ? next : '/')
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">월덕요정의 사주이야기</p>
        <h1 className="text-2xl font-bold tracking-tight mb-3">서비스 이용 동의</h1>
        <p className="text-sm text-gray-500">
          월덕요정의 사주이야기 서비스를 이용하기 전에 아래 약관에 동의해 주세요.
        </p>
      </div>

      <AgreeForm next={next ?? '/'} />
    </div>
  )
}
