import { createClient } from '@/lib/supabase/server'
import { setGradeSeparation } from '@/actions/updateSettings'

export const metadata = { title: '사이트 설정' }

export default async function AdminSettingsPage() {
  const supabase = await createClient()

  const { data: settings } = await supabase
    .from('site_settings')
    .select('grade_separation_enabled')
    .eq('id', 1)
    .maybeSingle()

  const enabled = settings?.grade_separation_enabled ?? false

  async function enable() {
    'use server'
    await setGradeSeparation(true)
  }

  async function disable() {
    'use server'
    await setGradeSeparation(false)
  }

  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-xl font-bold mb-8">사이트 설정</h1>

      {/* 등급 분리 */}
      <section className="bg-white rounded-lg border border-gray-100 p-6 mb-6">
        <h2 className="text-base font-semibold mb-1">등급 분리</h2>
        <p className="text-sm text-gray-500 mb-6">
          켜면 등급별로 판정 기능 접근이 제한됩니다.
          꺼져 있으면 로그인한 모든 회원이 판정 결과와 상세 설명을 볼 수 있습니다.
        </p>

        <div className="flex items-center gap-4 mb-4">
          <span className={`text-sm font-medium ${enabled ? 'text-black' : 'text-gray-400'}`}>
            현재: {enabled ? '켜짐 (등급별 제한 활성)' : '꺼짐 (전체 공개)'}
          </span>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <p className={labelCls}>등급별 접근 권한 (활성 시)</p>
          <div className="text-sm text-gray-500 space-y-1 mb-6">
            <p>· free: 본문만 열람 (판정 없음)</p>
            <p>· plus: 본문 + 판정 결과 (해당/비해당)</p>
            <p>· premium: 본문 + 판정 결과 + 상세 설명</p>
          </div>

          <div className="flex gap-3">
            {enabled ? (
              <form action={disable}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
                >
                  끄기 (전체 공개로 전환)
                </button>
              </form>
            ) : (
              <form action={enable}>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium bg-black text-white rounded-md hover:opacity-80 transition-opacity"
                >
                  켜기 (등급별 제한 활성)
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 회원 등급 안내 */}
      <section className="bg-white rounded-lg border border-gray-100 p-6">
        <h2 className="text-base font-semibold mb-1">회원 등급 변경</h2>
        <p className="text-sm text-gray-500">
          개별 회원 등급 변경은 Supabase 대시보드 → users 테이블에서 role 컬럼을 직접 수정하거나,
          추후 회원 관리 페이지에서 처리합니다.
        </p>
      </section>
    </div>
  )
}
