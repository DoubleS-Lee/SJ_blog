import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConsultationStatusBadge from '@/components/counsel/ConsultationStatusBadge'
import { buttonVariants } from '@/components/ui/button'

export const metadata = { title: '내 상담글' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function MyConsultationsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: consultations } = await supabase
    .from('consultations')
    .select('id, title, status, created_at, updated_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">내 상담글</h1>
          <p className="mt-2 text-sm text-gray-500">
            내가 작성한 익명 상담글과 답변 현황을 확인할 수 있습니다.
          </p>
        </div>
        <Link href="/counsel/new" className={buttonVariants({ size: 'sm' })}>
          새 상담 등록
        </Link>
      </div>

      {consultations && consultations.length > 0 ? (
        <div className="flex flex-col gap-4">
          {consultations.map((item) => (
            <Link
              key={item.id}
              href={`/counsel/${item.id}`}
              className="rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:border-gray-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-gray-900">{item.title}</h2>
                  <p className="mt-2 text-xs text-gray-400">
                    작성일 {formatDate(item.created_at)} · 최근 업데이트 {formatDate(item.updated_at)}
                  </p>
                </div>
                <ConsultationStatusBadge status={item.status} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-400">
          아직 등록한 상담글이 없습니다.
        </div>
      )}
    </div>
  )
}
