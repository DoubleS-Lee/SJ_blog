import { createClient } from '@/lib/supabase/server'
import { setGradeSeparation } from '@/actions/updateSettings'
import AdminIlganAvatarSettings from './AdminIlganAvatarSettings'
import { sanitizeIlganAvatarMap } from '@/lib/saju/ilgan-avatar'

export const metadata = { title: '사이트 설정' }

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('site_settings')
    .select('grade_separation_enabled, ilgan_avatar_urls')
    .eq('id', 1)
    .maybeSingle()

  const enabled = settings?.grade_separation_enabled ?? false
  const avatarMap = sanitizeIlganAvatarMap(settings?.ilgan_avatar_urls)

  async function enable() {
    'use server'
    await setGradeSeparation(true)
  }

  async function disable() {
    'use server'
    await setGradeSeparation(false)
  }

  const labelClassName = 'mb-1 block text-sm font-medium text-gray-700'

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-8 text-xl font-bold">사이트 설정</h1>

      <section className="mb-6 rounded-lg border border-gray-100 bg-white p-6">
        <h2 className="mb-1 text-base font-semibold">등급 분리</h2>
        <p className="mb-6 text-sm text-gray-500">
          켜면 등급별로 사주 판정 글 열람 권한을 제한합니다. 끄면 로그인한 모든 회원이 판정 결과와 상세
          설명을 볼 수 있습니다.
        </p>

        <div className="mb-4 flex items-center gap-4">
          <span className={`text-sm font-medium ${enabled ? 'text-black' : 'text-gray-400'}`}>
            현재: {enabled ? '켜짐 (등급별 제한 활성)' : '꺼짐 (전체 공개)'}
          </span>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className={labelClassName}>등급별 열람 권한</p>
          <div className="mb-6 space-y-1 text-sm text-gray-500">
            <p>`free`: 본문만 열람</p>
            <p>`plus`: 본문 + 판정 결과</p>
            <p>`premium`: 본문 + 판정 결과 + 상세 설명</p>
          </div>

          <div className="flex gap-3">
            {enabled ? (
              <form action={disable}>
                <button
                  type="submit"
                  className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
                >
                  끄기
                </button>
              </form>
            ) : (
              <form action={enable}>
                <button
                  type="submit"
                  className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
                >
                  켜기
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      <div className="mb-6">
        <AdminIlganAvatarSettings initialAvatarMap={avatarMap} />
      </div>

      <section className="rounded-lg border border-gray-100 bg-white p-6">
        <h2 className="mb-1 text-base font-semibold">회원 등급 변경</h2>
        <p className="text-sm text-gray-500">
          개별 회원 등급 변경은 Supabase 대시보드의 `users` 테이블에서 `role` 컬럼을 직접 수정하거나 추후
          회원 관리 페이지에서 처리할 수 있습니다.
        </p>
      </section>
    </div>
  )
}
