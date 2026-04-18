import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import TaekilPlanner from './TaekilPlanner'
import {
  getDateSelectionMonthResult,
  parseSelectionPurpose,
  type DateSelectionUserData,
} from '@/lib/saju/date-selection'

export const metadata: Metadata = {
  title: '택일 | 사주 Moon',
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
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
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-[2rem] border border-gray-200 bg-white p-8 text-center sm:p-12">
          <p className="text-sm font-medium text-gray-400">Personalized Date Selection</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">택일 추천</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-gray-500">
            저장된 사주를 기준으로 목적별 추천일과 추천 시간대를 골라주는 메뉴입니다.
            로그인 후 사주 정보를 입력하면 바로 개인화 택일 캘린더를 사용할 수 있습니다.
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <Link href="/login" className={buttonVariants({ size: 'sm' })}>
              로그인
            </Link>
            <Link href="/mypage/saju" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
              사주 입력 안내
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { data: saju } = await supabase
    .from('user_saju')
    .select('year_jiji, month_jiji, day_jiji')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!saju) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="rounded-[2rem] border border-gray-200 bg-white p-8 sm:p-12">
          <p className="text-sm font-medium text-gray-400">Personalized Date Selection</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">택일 추천</h1>
          <p className="mt-4 text-sm leading-6 text-gray-500">
            택일 추천은 저장된 사주를 기준으로 개인화 필터가 적용됩니다.
            먼저 마이페이지에서 사주 정보를 입력해 주세요.
          </p>
          <div className="mt-6">
            <Link href="/mypage/saju" className={buttonVariants({ size: 'sm' })}>
              사주 정보 입력하기
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const userData: DateSelectionUserData = {
    year_jiji: saju.year_jiji as DateSelectionUserData['year_jiji'],
    month_jiji: saju.month_jiji as DateSelectionUserData['month_jiji'],
    day_jiji: saju.day_jiji as DateSelectionUserData['day_jiji'],
  }

  const data = getDateSelectionMonthResult(userData, year, month, purpose)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 max-w-3xl">
        <p className="text-sm font-medium text-gray-400">Personalized Date Selection</p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">택일 추천</h1>
        <p className="mt-3 text-sm leading-6 text-gray-500">
          저장된 사주 기준으로 개인화 필터를 적용해 목적별 추천일을 보여줍니다.
          결과는 일정 보조용으로 활용하고, 중요한 결정일수록 직접 한 번 더 검토해 주세요.
        </p>
      </div>

      <TaekilPlanner data={data} currentDate={selectedDate} />
    </div>
  )
}
