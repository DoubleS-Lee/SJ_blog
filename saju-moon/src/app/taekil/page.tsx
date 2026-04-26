import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import TaekilPlanner from './TaekilPlanner'
import MenuHero from '@/components/layout/MenuHero'
import {
  getDateSelectionMonthResult,
  parseSelectionPurpose,
  type DateSelectionUserData,
} from '@/lib/saju/date-selection'

export const metadata: Metadata = {
  title: '택일 | 월덕요정의 사주이야기',
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

const HERO_PALETTE = {
  borderClass: 'border-amber-100',
  gradientClass:
    'bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(163,230,53,0.2),_transparent_24%),linear-gradient(135deg,_#fffdf5_0%,_#ffffff_58%,_#f7fee7_100%)]',
  eyebrowClass: 'text-amber-500',
}

function parseNumberParam(value: string | string[] | undefined, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export default async function TaekilPage({ searchParams }: Props) {
  const params = await searchParams
  const now = new Date()
  const year = parseNumberParam(params.year, now.getFullYear())
  const month = parseNumberParam(params.month, now.getMonth() + 1)
  const purpose = parseSelectionPurpose(parseStringParam(params.purpose))
  const selectedDate = parseStringParam(params.date)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <MenuHero
          eyebrow="Personalized Date Selection"
          title="나만의 택일 추천"
          description={`등록하신 생년월일을 기준으로 목적에 맞는 좋은 날을 추천해 드립니다.
로그인 후 사주 정보를 입력하면 바로 개인화 택일 캘린더를 사용할 수 있습니다.`}
          palette={HERO_PALETTE}
          actions={[
            { href: '/login', label: '로그인' },
            { href: '/mypage/saju', label: '사주 입력 안내', variant: 'ghost' },
          ]}
        />
      </div>
    )
  }

  const { data: saju } = await supabase
    .from('user_saju')
    .select('year_jiji, month_jiji, day_cheongan, day_jiji, hour_jiji, full_saju_data')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!saju) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <MenuHero
          eyebrow="Personalized Date Selection"
          title="나만의 택일 추천"
          description={`등록하신 생년월일을 기준으로 목적에 맞는 좋은 날을 추천해 드립니다.
먼저 마이페이지에서 사주 정보를 입력해 주세요.`}
          palette={HERO_PALETTE}
          actions={[
            { href: '/mypage/saju', label: '사주 정보 입력하기' },
            { href: '/mypage', label: '마이페이지', variant: 'ghost' },
          ]}
        />
      </div>
    )
  }

  const userData: DateSelectionUserData = {
    year_jiji: saju.year_jiji as DateSelectionUserData['year_jiji'],
    month_jiji: saju.month_jiji as DateSelectionUserData['month_jiji'],
    day_cheongan: saju.day_cheongan as DateSelectionUserData['day_cheongan'],
    day_jiji: saju.day_jiji as DateSelectionUserData['day_jiji'],
    hour_jiji: saju.hour_jiji as DateSelectionUserData['hour_jiji'],
    day_xun_kong:
      typeof saju.full_saju_data === 'object'
      && saju.full_saju_data
      && 'day_xun_kong' in saju.full_saju_data
        ? String(saju.full_saju_data.day_xun_kong ?? '')
        : null,
  }

  const data = getDateSelectionMonthResult(userData, year, month, purpose)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <MenuHero
        eyebrow="Personalized Date Selection"
        title="나만의 택일 추천"
        description={`등록하신 생년월일을 기준으로 목적에 맞는 좋은 날을 추천해 드립니다.
결과는 참고용으로 활용하시고, 중요한 결정일수록 전문가와 함께 검토해 보시길 권장합니다.`}
        palette={HERO_PALETTE}
        actions={undefined}
        className="mb-8"
      />

      <TaekilPlanner data={data} currentDate={selectedDate} />
    </div>
  )
}
