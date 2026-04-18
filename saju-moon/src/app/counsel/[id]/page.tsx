import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConsultationConversation from '@/components/counsel/ConsultationConversation'
import ConsultationStatusBadge from '@/components/counsel/ConsultationStatusBadge'
import AdminConsultationEditor from '@/components/counsel/AdminConsultationEditor'
import {
  sanitizeIlganAvatarMap,
} from '@/lib/saju/ilgan-avatar'
import type { ConsultationComment, ConsultationRecord } from '@/types/consultation'

export const metadata = { title: '상담 상세' }

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default async function ConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: consultation }, { data: profile }, { data: comments }, { data: settings }] = await Promise.all([
    supabase
      .from('consultations')
      .select('id, user_id, title, body, status, content_usage_agreed, content_usage_agreed_at, content_usage_version, admin_note, anonymized_content, is_external_use_ready, created_at, updated_at')
      .eq('id', id)
      .maybeSingle(),
    supabase.from('users').select('id, nickname, email, is_admin').eq('id', user.id).maybeSingle(),
    supabase
      .from('consultation_comments')
      .select('id, consultation_id, user_id, author_avatar_url, author_ilgan, body, is_deleted, created_at, updated_at')
      .eq('consultation_id', id)
      .order('created_at', { ascending: true }),
    supabase.from('site_settings').select('ilgan_avatar_urls').eq('id', 1).maybeSingle(),
  ])

  if (!consultation || !profile) notFound()

  const isAdmin = profile.is_admin
  const ilganAvatarMap = sanitizeIlganAvatarMap(settings?.ilgan_avatar_urls)

  let authorProfile: { nickname: string | null; email: string | null } | null = null
  if (isAdmin) {
    const { data } = await supabase
      .from('users')
      .select('nickname, email')
      .eq('id', consultation.user_id)
      .maybeSingle()
    authorProfile = data ?? null
  }

  const commentItems: ConsultationComment[] = (comments ?? []).map((comment) => ({
    ...comment,
    role_label: comment.user_id === consultation.user_id ? '작성자' : '상담자',
    is_mine: comment.user_id === user.id,
  }))

  const record = consultation as ConsultationRecord

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-8">
          <section className="rounded-3xl border border-gray-100 bg-white p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.2em] text-gray-400">Anonymous Counsel</p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight">{record.title}</h1>
                <p className="mt-3 text-sm text-gray-400">
                  작성일 {formatDateTime(record.created_at)}
                </p>
              </div>
              <ConsultationStatusBadge status={record.status} />
            </div>

            <div className="mt-8 rounded-2xl bg-gray-50 p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">{record.body}</p>
            </div>
          </section>

          <ConsultationConversation
            consultationId={record.id}
            comments={commentItems}
            canWrite={record.status !== 'closed'}
            ilganAvatarMap={ilganAvatarMap}
          />
        </div>

        <aside className="flex flex-col gap-6">
          <section className="rounded-2xl border border-gray-100 bg-white p-5">
            <h2 className="text-sm font-bold text-gray-900">이용 동의 정보</h2>
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p>필수 동의 완료</p>
              <p className="text-xs text-gray-400">
                {formatDateTime(record.content_usage_agreed_at)} · 버전 {record.content_usage_version}
              </p>
            </div>
          </section>

          {!isAdmin && (
            <section className="rounded-2xl border border-gray-100 bg-white p-5">
              <h2 className="text-sm font-bold text-gray-900">안내</h2>
              <p className="mt-3 text-sm leading-6 text-gray-500">
                이 상담글은 비공개이며, 본인과 관리자만 열람할 수 있습니다.
                외부 콘텐츠 활용 시에는 원문을 직접 쓰지 않고 관리자가 수동 익명화한 문안만 사용합니다.
              </p>
            </section>
          )}

          {isAdmin && (
            <>
              <section className="rounded-2xl border border-gray-100 bg-white p-5">
                <h2 className="text-sm font-bold text-gray-900">작성자 정보</h2>
                <div className="mt-4 space-y-2 text-sm text-gray-600">
                  <p>닉네임: {authorProfile?.nickname || '—'}</p>
                  <p>이메일: {authorProfile?.email || '—'}</p>
                  <p className="text-xs text-gray-400">
                    공개 화면에는 이 정보가 노출되지 않습니다.
                  </p>
                </div>
              </section>

              <section className="rounded-2xl border border-gray-100 bg-white p-5">
                <h2 className="text-sm font-bold text-gray-900">관리자 편집</h2>
                <div className="mt-4">
                  <AdminConsultationEditor
                    consultationId={record.id}
                    initialStatus={record.status}
                    initialAdminNote={record.admin_note}
                    initialAnonymizedContent={record.anonymized_content}
                    initialIsExternalUseReady={record.is_external_use_ready}
                  />
                </div>
              </section>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}
