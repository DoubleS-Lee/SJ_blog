import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import ConsultationStatusBadge from '@/components/counsel/ConsultationStatusBadge'

export const metadata = {
  title: '익명 고민 상담',
  description: '익명으로 고민을 남기고 관리자와 비공개 상담을 진행할 수 있습니다.',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default async function CounselPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const consultations = user
    ? await supabase
        .from('consultations')
        .select('id, title, status, created_at, updated_at')
        .order('created_at', { ascending: false })
    : { data: null }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <section className="rounded-3xl border border-gray-100 bg-white p-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">Private Counsel</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">익명 고민 상담 게시판</h1>
        <p className="mt-4 text-sm leading-7 text-gray-600">
          이 공간은 공개 게시판이 아니라 비공개 상담함입니다. 작성한 사연은 작성자 본인과 관리자만 볼 수 있고,
          상담은 댓글 형태로 이어집니다. 사연은 필수 동의에 따라 식별 정보를 제거한 뒤 외부 콘텐츠 소재로 활용될 수 있습니다.
        </p>
        <div className="mt-6 rounded-2xl bg-gray-50 p-5 text-sm text-gray-500 leading-7">
          <p>1. 실명, 연락처, 학교명, 회사명, 주소 등 식별 가능한 정보는 적지 않는 것을 권장합니다.</p>
          <p>2. 원문은 공개하지 않고, 외부 활용 시에는 관리자가 수동 익명화한 문안만 사용합니다.</p>
          <p>3. 필수 동의에 체크해야 상담 글을 등록할 수 있습니다.</p>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-3">
          {user ? (
            <Link href="/counsel/new" className={buttonVariants({ size: 'sm' })}>
              익명 상담 등록하기
            </Link>
          ) : (
            <Link href="/login" className={buttonVariants({ size: 'sm' })}>
              로그인하고 상담 남기기
            </Link>
          )}
          {user && (
            <Link href="/mypage/counsel" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              내 상담글 보기
            </Link>
          )}
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold">내 상담 현황</h2>
          {user && (
            <Link href="/counsel/new" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              새 글 작성
            </Link>
          )}
        </div>

        {!user ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-6 py-12 text-center text-sm text-gray-400">
            로그인하면 내가 남긴 상담글과 답변 현황을 볼 수 있습니다.
          </div>
        ) : consultations.data && consultations.data.length > 0 ? (
          <div className="flex flex-col gap-4">
            {consultations.data.map((item) => (
              <Link
                key={item.id}
                href={`/counsel/${item.id}`}
                className="rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:border-gray-300"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">{item.title}</h3>
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
      </section>
    </div>
  )
}
