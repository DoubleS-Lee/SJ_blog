import type { Metadata } from 'next'
import Link from 'next/link'
import ManseryeokForm from './ManseryeokForm'
import ManseryeokResult from './ManseryeokResult'
import { getManseryeokData } from '@/lib/saju/manseryeok'
import type { SajuInput } from '@/lib/saju/calculate'
import type { Gender } from '@/types/saju'

export const metadata: Metadata = { title: '만세력 조회 — 월덕요정의 사주이야기' }

interface Props {
  searchParams: Promise<Record<string, string>>
}

export default async function ManseryeokPage({ searchParams }: Props) {
  const params = await searchParams

  const year  = parseInt(params.year  ?? '')
  const month = parseInt(params.month ?? '')
  const day   = parseInt(params.day   ?? '')
  const hour  = params.hour   !== undefined ? parseInt(params.hour)   : null
  const minute = params.minute !== undefined ? parseInt(params.minute) : null
  const gender: Gender = params.gender === 'female' ? 'female' : 'male'
  const isLunar = params.is_lunar === 'true'

  const hasInput = !isNaN(year) && !isNaN(month) && !isNaN(day)

  // ── 결과 계산 ─────────────────────────────────────────────────────────
  let result = null
  let calcError: string | null = null

  if (hasInput) {
    try {
      const input: SajuInput = {
        birth_year: year,
        birth_month: month,
        birth_day: day,
        birth_hour: hour,
        birth_minute: minute ?? (hour !== null ? 0 : null),
        gender,
        is_lunar: isLunar,
      }
      result = getManseryeokData(input)
    } catch (e) {
      console.error('[Manseryeok] calc error:', e)
      calcError = '입력값을 확인해 주세요. 날짜가 올바른지 다시 시도해 보세요.'
    }
  }

  // ── defaultValues (재입력 폼) ──────────────────────────────────────────
  const formDefaults = hasInput ? {
    year: String(year),
    month: String(month),
    day: String(day),
    hour: hour !== null ? `${String(hour).padStart(2, '0')}:${String(minute ?? 0).padStart(2, '0')}` : '',
    gender: gender,
    isLunar: String(isLunar),
  } : undefined

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-8">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/" className="text-gray-400 hover:text-gray-700 transition-colors text-sm">
          ← 홈
        </Link>
        <h1 className="text-lg font-bold">만세력</h1>
        <div className="w-8" />
      </div>

      {/* 입력 폼 */}
      <div className={result ? 'mb-6 border border-gray-100 rounded-xl p-4 bg-gray-50' : ''}>
        {result ? (
          <details className="group">
            <summary className="text-sm text-gray-500 cursor-pointer list-none flex items-center justify-between">
              <span>입력 수정</span>
              <span className="text-gray-300 group-open:rotate-180 transition-transform inline-block">▼</span>
            </summary>
            <div className="mt-4">
              <ManseryeokForm defaultValues={formDefaults} />
            </div>
          </details>
        ) : (
          <ManseryeokForm defaultValues={formDefaults} />
        )}
      </div>

      {/* 에러 */}
      {calcError && (
        <div className="bg-red-50 text-red-600 rounded-lg px-4 py-3 text-sm mb-4">
          {calcError}
        </div>
      )}

      {/* 결과 */}
      {result && <ManseryeokResult data={result} />}

      {/* 초기 상태 안내 */}
      {!hasInput && !calcError && (
        <div className="text-center py-12 text-gray-400 text-sm">
          생년월일시를 입력하면 사주 원국을 조회할 수 있습니다.
        </div>
      )}
    </div>
  )
}
