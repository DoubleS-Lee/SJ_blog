import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ConsultationStatusBadge from '@/components/counsel/ConsultationStatusBadge'

export const metadata = { title: '상담 관리' }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export default async function AdminCounselPage() {
  const supabase = await createClient()

  const { data: consultations } = await supabase
    .from('consultations')
    .select('id, user_id, title, status, created_at, updated_at')
    .order('created_at', { ascending: false })

  const authorIds = Array.from(new Set((consultations ?? []).map((item) => item.user_id)))
  const profiles = authorIds.length > 0
    ? await supabase
        .from('users')
        .select('id, nickname, email')
        .in('id', authorIds)
    : { data: [] as { id: string; nickname: string | null; email: string | null }[] }

  const profileMap = new Map((profiles.data ?? []).map((profile) => [profile.id, profile]))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold">상담 관리</h1>
        <p className="mt-1 text-sm text-gray-500">
          작성자 원문과 상담 대화를 관리자만 볼 수 있습니다.
        </p>
      </div>

      {consultations && consultations.length > 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
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
                  <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <Link href={`/admin/counsel/${item.id}`} className="font-medium hover:underline underline-offset-4">
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
    </div>
  )
}
