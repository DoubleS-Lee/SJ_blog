import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import DeleteAccountButton from './DeleteAccountButton'
import ProfileAvatarSettings from './ProfileAvatarSettings'
import ManseryeokResult from '@/app/manseryeok/ManseryeokResult'
import { getManseryeokData } from '@/lib/saju/manseryeok'
import { sanitizeIlganAvatarMap } from '@/lib/saju/ilgan-avatar'
import type { SajuInput } from '@/lib/saju/calculate'
import type { Gender } from '@/types/saju'

export const metadata = { title: '마이페이지' }

export default async function MyPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: saju }, { data: profile }, { data: settings }] = await Promise.all([
    supabase
      .from('user_saju')
      .select('birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, is_lunar, ilgan')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('users')
      .select('nickname, role, custom_avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('site_settings')
      .select('ilgan_avatar_urls')
      .eq('id', 1)
      .maybeSingle(),
  ])

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
    } catch (error) {
      console.error('[MyPage] 만세력 계산 오류:', error)
      manseryeokError = '만세력 계산 중 오류가 발생했습니다.'
    }
  }

  const ilganAvatarMap = sanitizeIlganAvatarMap(settings?.ilgan_avatar_urls)

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-2xl font-bold tracking-tight">마이페이지</h1>

      <ProfileAvatarSettings
        initialAvatarUrl={profile?.custom_avatar_url ?? null}
        ilgan={saju?.ilgan ?? null}
        nickname={profile?.nickname ?? null}
        ilganAvatarMap={ilganAvatarMap}
      />

      <section className="mb-8 border-b border-gray-100 pb-8">
        <h2 className="mb-4 text-base font-bold text-gray-900">계정</h2>
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-700">
            <span className="inline-block w-16 text-gray-400">닉네임</span>
            {profile?.nickname || '-'}
          </p>
          <p className="text-sm text-gray-700">
            <span className="inline-block w-16 text-gray-400">등급</span>
            {profile?.role ?? 'free'}
          </p>
        </div>
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">내 만세력</h2>
          <Link href="/mypage/saju" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            {saju ? '수정' : '입력하기'}
          </Link>
        </div>

        {manseryeokData ? (
          <ManseryeokResult data={manseryeokData} />
        ) : manseryeokError ? (
          <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{manseryeokError}</div>
        ) : (
          <div className="rounded-lg bg-gray-50 p-5 text-center">
            <p className="mb-3 text-sm text-gray-500">
              사주 정보가 없습니다. 생년월일시를 입력하면 만세력과 글 판정 서비스를 이용할 수 있습니다.
            </p>
            <Link href="/mypage/saju" className={buttonVariants({ size: 'sm' })}>
              사주 입력하기
            </Link>
          </div>
        )}
      </section>

      <section className="mb-8 border-t border-gray-100 pt-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">내 상담글</h2>
          <Link href="/mypage/counsel" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
            보기
          </Link>
        </div>
        <p className="text-sm text-gray-500">
          익명 고민 상담 게시판에 올린 글과 관리자 답변 현황을 확인할 수 있습니다.
        </p>
      </section>

      <section className="border-t border-gray-100 pt-8">
        <h2 className="mb-4 text-base font-bold text-gray-900">계정 관리</h2>
        <DeleteAccountButton />
        <p className="mt-2 text-xs text-gray-400">
          탈퇴 시 모든 사주 데이터와 계정 정보가 즉시 삭제됩니다.
        </p>
      </section>
    </div>
  )
}
