import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import DeleteAccountButton from './DeleteAccountButton'
import ManseryeokResult from '@/app/manseryeok/ManseryeokResult'
import { getManseryeokData } from '@/lib/saju/manseryeok'
import type { SajuInput } from '@/lib/saju/calculate'
import type { Gender } from '@/types/saju'

export const metadata = { title: '마이페이지' }

export default async function MyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: saju } = await supabase
    .from('user_saju')
    .select('birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, is_lunar')
    .eq('user_id', user.id)
    .maybeSingle()

  const { data: profile } = await supabase
    .from('users')
    .select('nickname, role')
    .eq('id', user.id)
    .maybeSingle()

  // 만세력 계산
  let manseryeokData = null
  let manseryeokError: string | null = null

  if (saju) {
    try {
      const input: SajuInput = {
        birth_year: saju.birth_year,
        birth_month: saju.birth_month,
        birth_day: saju.birth_day,
        birth_hour: saju.birth_hour ?? null,
        birth_minute: saju.birth_minute ?? null,
        gender: (saju.gender as Gender) ?? 'male',
        is_lunar: saju.is_lunar ?? false,
      }
      manseryeokData = getManseryeokData(input)
    } catch (e) {
      console.error('[MyPage] 만세력 계산 오류:', e)
      manseryeokError = '만세력 계산 중 오류가 발생했습니다.'
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight mb-8">마이페이지</h1>

      {/* 계정 정보 */}
      <section className="mb-8 pb-8 border-b border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-4">계정</h2>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-700">
            <span className="text-gray-400 w-16 inline-block">닉네임</span>
            {profile?.nickname || '—'}
          </p>
          <p className="text-sm text-gray-700">
            <span className="text-gray-400 w-16 inline-block">등급</span>
            {profile?.role ?? 'free'}
          </p>
        </div>
      </section>

      {/* 만세력 */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-gray-900">내 만세력</h2>
          <Link
            href="/mypage/saju"
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            {saju ? '수정' : '입력하기'}
          </Link>
        </div>

        {manseryeokData ? (
          <ManseryeokResult data={manseryeokData} />
        ) : manseryeokError ? (
          <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm">
            {manseryeokError}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-5 text-center">
            <p className="text-sm text-gray-500 mb-3">
              사주 정보가 없습니다. 생년월일시를 입력하면 만세력과 글 판정 서비스를 이용할 수 있습니다.
            </p>
            <Link href="/mypage/saju" className={buttonVariants({ size: 'sm' })}>
              사주 입력하기
            </Link>
          </div>
        )}
      </section>

      {/* 계정 관리 */}
      <section className="pt-8 border-t border-gray-100">
        <h2 className="text-base font-bold text-gray-900 mb-4">계정 관리</h2>
        <DeleteAccountButton />
        <p className="text-xs text-gray-400 mt-2">
          탈퇴 시 모든 사주 데이터와 계정 정보가 즉시 삭제됩니다.
        </p>
      </section>
    </div>
  )
}
