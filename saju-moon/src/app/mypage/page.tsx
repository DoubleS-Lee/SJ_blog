import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import DeleteAccountButton from './DeleteAccountButton'
import ProfileAvatarSettings from './ProfileAvatarSettings'
import NicknameSettings from './NicknameSettings'
import CompatibilitySajuManager from './CompatibilitySajuManager'
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

  const [{ data: saju }, { data: profile }, { data: compatibilityEntries }, { data: settings }] =
    await Promise.all([
      supabase
        .from('user_saju')
        .select(
          'saju_name, birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, is_lunar, ilgan',
        )
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('users')
        .select('nickname, role, is_admin, custom_avatar_url')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('user_compatibility_saju')
        .select(
          'id, nickname, birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, is_lunar',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
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
      console.error('[MyPage] manseryeok calculation error:', error)
      manseryeokError = '만세력 계산 중 오류가 발생했습니다.'
    }
  }

  const ilganAvatarMap = sanitizeIlganAvatarMap(settings?.ilgan_avatar_urls)
  const displaySajuName = saju?.saju_name?.trim() || '미설정'

  const cardStyle = { background: '#FBF7EE', borderColor: 'rgba(30,45,77,0.09)' }
  const innerStyle = { background: 'rgba(30,45,77,0.05)', borderColor: 'rgba(30,45,77,0.08)' }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1
        className="mb-8 text-2xl font-bold tracking-tight"
        style={{ color: '#1E2D4D', fontFamily: 'var(--font-nanum-myeongjo), serif' }}
      >
        마이페이지
      </h1>

      <div className="space-y-6">
        <section className="rounded-2xl border p-6" style={cardStyle}>
          <h2 className="mb-4 text-base font-bold" style={{ color: '#1E2D4D' }}>계정</h2>

          <div className="space-y-3 rounded-2xl border p-4" style={innerStyle}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm" style={{ color: '#4a5673' }}>
                <span className="inline-block w-16" style={{ color: '#9a8e7a' }}>닉네임</span>
                <span className="font-medium" style={{ color: '#1E2D4D' }}>{profile?.nickname || '-'}</span>
              </p>
              <NicknameSettings initialNickname={profile?.nickname ?? null} />
            </div>

            <p className="text-sm" style={{ color: '#4a5673' }}>
              <span className="inline-block w-16" style={{ color: '#9a8e7a' }}>권한</span>
              {profile?.role ?? 'free'}
            </p>

            {profile?.is_admin && (
              <div className="flex flex-wrap gap-2 pt-2">
                <Link
                  href="/admin"
                  scroll={false}
                  className="rounded-full px-4 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-80"
                  style={{ background: '#1E2D4D' }}
                >
                  관리자 페이지
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-2xl border p-6" style={cardStyle}>
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold" style={{ color: '#1E2D4D' }}>내 만세력</h2>
              <p className="mt-1 text-sm" style={{ color: '#4a5673' }}>
                이름: <span className="font-medium" style={{ color: '#1E2D4D' }}>{displaySajuName}</span>
              </p>
            </div>
            <Link href="/mypage/saju" scroll={false} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              {saju ? '수정' : '입력하기'}
            </Link>
          </div>

          {manseryeokData ? (
            <ManseryeokResult data={manseryeokData} />
          ) : manseryeokError ? (
            <div className="rounded-xl px-4 py-3 text-sm text-red-600" style={{ background: 'rgba(220,38,38,0.07)' }}>{manseryeokError}</div>
          ) : (
            <div className="rounded-xl p-5 text-center" style={{ background: 'rgba(30,45,77,0.04)' }}>
              <p className="mb-3 text-sm" style={{ color: '#4a5673' }}>
                내 만세력이 아직 없습니다. 출생 정보를 입력하면 만세력과 기본 해석 리포트를 확인할 수 있습니다.
              </p>
              <Link href="/mypage/saju" scroll={false} className={buttonVariants({ size: 'sm' })}>
                만세력 입력하기
              </Link>
            </div>
          )}
        </section>

        <section className="rounded-2xl border p-6" style={cardStyle}>
          <CompatibilitySajuManager
            entries={compatibilityEntries ?? []}
            role={profile?.role ?? 'free'}
            isAdmin={profile?.is_admin ?? false}
          />
        </section>

        {profile?.is_admin && (
          <section className="rounded-2xl border p-6" style={cardStyle}>
            <h2 className="mb-4 text-base font-bold" style={{ color: '#1E2D4D' }}>관리자 전용 메뉴</h2>
            <div className="flex flex-wrap gap-3">
              <Link href="/interpretation" scroll={false} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                사주해석
              </Link>
              <Link href="/compatibility" scroll={false} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                궁합
              </Link>
              <Link href="/taekil" scroll={false} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                택일
              </Link>
            </div>
          </section>
        )}

        <section className="rounded-2xl border p-6" style={cardStyle}>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-base font-bold" style={{ color: '#1E2D4D' }}>내 상담글</h2>
            <Link href="/mypage/counsel" scroll={false} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              보기
            </Link>
          </div>
          <p className="text-sm" style={{ color: '#4a5673' }}>
            익명 공개 상담 게시판에 남긴 글과 관리자 답변을 한 번에 확인할 수 있습니다.
          </p>
        </section>

        <section className="rounded-2xl border p-6" style={cardStyle}>
          <ProfileAvatarSettings
            initialAvatarUrl={profile?.custom_avatar_url ?? null}
            ilgan={saju?.ilgan ?? null}
            nickname={profile?.nickname ?? null}
            ilganAvatarMap={ilganAvatarMap}
          />
        </section>

        <section className="rounded-2xl border p-6" style={cardStyle}>
          <h2 className="mb-4 text-base font-bold" style={{ color: '#1E2D4D' }}>계정 관리</h2>
          <DeleteAccountButton />
          <p className="mt-2 text-xs" style={{ color: '#9a8e7a' }}>
            회원 탈퇴 시 모든 사주 데이터와 계정 정보가 즉시 삭제됩니다.
          </p>
        </section>
      </div>
    </div>
  )
}
