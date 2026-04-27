import Link from 'next/link'
import { bumpCounselSocialProof } from '@/actions/updateSettings'
import ConsultationStatusBadge from '@/components/counsel/ConsultationStatusBadge'
import { createClient } from '@/lib/supabase/server'

export const metadata = { title: '상담 관리' }

const PAGE_SIZE = 20

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

interface Props {
  searchParams: Promise<{ page?: string }>
}

export default async function AdminCounselPage({ searchParams }: Props) {
  const { page } = await searchParams
  const requestedPage = Math.max(1, Number.parseInt(page ?? '1', 10) || 1)
  const supabase = await createClient()

  async function addRandomCounselProof() {
    'use server'

    await bumpCounselSocialProof()
  }

  const [
    { data: settings },
    { count: consultationCount },
  ] = await Promise.all([
    supabase
      .from('site_settings')
      .select('counsel_social_proof_boost')
      .eq('id', 1)
      .maybeSingle(),
    supabase.from('consultations').select('*', { count: 'exact', head: true }),
  ])

  const filteredCount = consultationCount ?? 0
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE))
  const currentPage = Math.min(requestedPage, totalPages)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: consultations } = await supabase
    .from('consultations')
    .select('id, user_id, title, status, created_at, updated_at')
    .order('created_at', { ascending: false })
    .range(from, to)

  const authorIds = Array.from(new Set((consultations ?? []).map((item) => item.user_id)))
  const profiles =
    authorIds.length > 0
      ? await supabase.from('users').select('id, nickname, email').in('id', authorIds)
      : { data: [] as { id: string; nickname: string | null; email: string | null }[] }

  const profileMap = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]))
  const actualConsultationCount = filteredCount
  const socialProofBoost = settings?.counsel_social_proof_boost ?? 0
  const displayedConsultationCount = actualConsultationCount + socialProofBoost
  const startItem = filteredCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const endItem = filteredCount === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, filteredCount)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-xl font-bold">상담 관리</h1>
          <p className="text-sm text-gray-500">작성자 원문과 상담 대화를 관리자만 볼 수 있습니다.</p>
          <p className="text-sm text-gray-500">
            총 <span className="font-semibold text-gray-900">{filteredCount.toLocaleString('ko-KR')}</span>개 중{' '}
            <span className="font-semibold text-gray-900">
              {startItem}~{endItem}
            </span>
            개를 보고 있습니다.
          </p>
        </div>

        <section className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-violet-400">
                Social Proof
              </p>
              <h2 className="mt-1 text-sm font-semibold text-gray-900">익명 상담 노출 수 보정</h2>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                실제 상담 글 수에 관리자 보정치를 더해, 유저에게 보이는 숫자를 조절합니다.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">현재 노출 수</p>
              <p className="mt-1 text-xl font-bold text-gray-900">
                {displayedConsultationCount.toLocaleString('ko-KR')}건
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-gray-50 px-3 py-3">
              <p className="text-[11px] text-gray-400">실제 상담 글 수</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {actualConsultationCount.toLocaleString('ko-KR')}건
              </p>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-3">
              <p className="text-[11px] text-gray-400">관리자 보정치</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                +{socialProofBoost.toLocaleString('ko-KR')}
              </p>
            </div>
          </div>

          <form action={addRandomCounselProof} className="mt-4">
            <button
              type="submit"
              className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              익명 상담 신청 수 랜덤 증가
            </button>
          </form>
          <p className="mt-2 text-xs text-gray-400">
            버튼을 누를 때마다 1~10 사이의 랜덤 값이 보정치에 더해집니다.
          </p>
        </section>
      </div>

      {consultations && consultations.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium">작성자</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">작성일</th>
                <th className="px-4 py-3 font-medium">업데이트</th>
              </tr>
            </thead>
            <tbody>
              {consultations.map((item) => {
                const profile = profileMap.get(item.user_id)
                return (
                  <tr key={item.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <Link
                        href={`/admin/counsel/${item.id}`}
                        className="font-medium underline-offset-4 hover:underline"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-gray-500">
                      {(profile?.nickname || '익명')} {profile?.email ? `(${profile.email})` : ''}
                    </td>
                    <td className="px-4 py-4">
                      <ConsultationStatusBadge status={item.status} />
                    </td>
                    <td className="px-4 py-4 text-gray-500">{formatDate(item.created_at)}</td>
                    <td className="px-4 py-4 text-gray-500">{formatDate(item.updated_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-400">
          접수된 상담글이 없습니다.
        </div>
      )}

      {filteredCount > 0 ? <PaginationLinks currentPage={currentPage} totalPages={totalPages} /> : null}
    </div>
  )
}

function PaginationLinks({
  currentPage,
  totalPages,
}: {
  currentPage: number
  totalPages: number
}) {
  const buildHref = (page: number) => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', String(page))
    const query = params.toString()
    return query ? `/admin/counsel?${query}` : '/admin/counsel'
  }

  return (
    <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage <= 1}
        scroll={false}
        className={[
          'rounded-full border border-gray-200 px-4 py-2 transition hover:border-black hover:text-black',
          currentPage <= 1 ? 'pointer-events-none opacity-40' : '',
        ].join(' ')}
      >
        이전
      </Link>
      <span className="font-medium text-gray-700">
        {currentPage} / {totalPages}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage >= totalPages}
        scroll={false}
        className={[
          'rounded-full border border-gray-200 px-4 py-2 transition hover:border-black hover:text-black',
          currentPage >= totalPages ? 'pointer-events-none opacity-40' : '',
        ].join(' ')}
      >
        다음
      </Link>
    </div>
  )
}
