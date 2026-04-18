'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import {
  getSelectionPurposes,
  type DateSelectionMonthResult,
  type DateSelectionRecommendation,
  type SelectionPurpose,
} from '@/lib/saju/date-selection'
import { formatGanjiWithReading } from '@/lib/saju/ganji-label'

const WEEKDAY_HEADERS = ['일', '월', '화', '수', '목', '금', '토']

function getInitialDate(
  currentDate: string | undefined,
  recommendations: DateSelectionRecommendation[],
) {
  if (currentDate && recommendations.some((item) => item.date === currentDate)) {
    return currentDate
  }

  return (
    recommendations.find((item) => item.level === 'best' || item.level === 'good')?.date
    ?? recommendations[0]?.date
    ?? ''
  )
}

function getPublicLevelLabel(level: DateSelectionRecommendation['level']) {
  switch (level) {
    case 'best':
      return '강추천'
    case 'good':
      return '추천'
    case 'normal':
      return '보통'
    case 'caution':
      return '비추천'
    case 'avoid':
      return '제외'
  }
}

function getLevelDotClass(level: DateSelectionRecommendation['level']) {
  switch (level) {
    case 'best':
      return 'bg-emerald-500'
    case 'good':
      return 'bg-sky-500'
    case 'normal':
      return 'bg-amber-400'
    case 'caution':
      return 'bg-gray-400'
    case 'avoid':
      return 'bg-gray-300'
  }
}

function getLevelChipClass(level: DateSelectionRecommendation['level']) {
  switch (level) {
    case 'best':
      return 'bg-emerald-50 text-emerald-700'
    case 'good':
      return 'bg-sky-50 text-sky-700'
    case 'normal':
      return 'bg-amber-50 text-amber-700'
    case 'caution':
      return 'bg-gray-100 text-gray-600'
    case 'avoid':
      return 'bg-gray-100 text-gray-500'
  }
}

function getReasonPanelClass(level: DateSelectionRecommendation['level']) {
  switch (level) {
    case 'best':
      return 'bg-emerald-50'
    case 'good':
      return 'bg-sky-50'
    default:
      return 'bg-gray-50'
  }
}

function getCellClass(level: DateSelectionRecommendation['level'], isSelected: boolean) {
  if (isSelected) {
    return 'border-black bg-black text-white shadow-sm'
  }

  switch (level) {
    case 'best':
      return 'border-emerald-200 bg-white text-gray-900 hover:border-emerald-400'
    case 'good':
      return 'border-sky-200 bg-white text-gray-900 hover:border-sky-400'
    case 'normal':
      return 'border-amber-200 bg-white text-gray-900 hover:border-amber-400'
    case 'caution':
      return 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
    case 'avoid':
      return 'border-gray-200 bg-gray-50 text-gray-400 hover:border-gray-300'
  }
}

interface Props {
  data: DateSelectionMonthResult
  currentDate?: string
}

export default function TaekilPlanner({ data, currentDate }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const purposes = getSelectionPurposes()
  const [manualSelectedDate, setManualSelectedDate] = useState<string | null>(null)

  const selectedDate =
    manualSelectedDate && data.recommendations.some((item) => item.date === manualSelectedDate)
      ? manualSelectedDate
      : getInitialDate(currentDate, data.recommendations)

  const selected =
    data.recommendations.find((item) => item.date === selectedDate)
    ?? data.recommendations[0]

  const firstWeekday = new Date(data.year, data.month - 1, 1).getDay()
  const emptyCells = Array.from({ length: firstWeekday }, (_, index) => `empty-${index}`)
  const prevMonth = data.month === 1
    ? { year: data.year - 1, month: 12 }
    : { year: data.year, month: data.month - 1 }
  const nextMonth = data.month === 12
    ? { year: data.year + 1, month: 1 }
    : { year: data.year, month: data.month + 1 }

  function updateQuery(nextPurpose: SelectionPurpose, year: number, month: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('purpose', nextPurpose)
    params.set('year', String(year))
    params.set('month', String(month))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="rounded-[1.75rem] border border-gray-200 bg-white p-4 sm:rounded-[2rem] sm:p-6">
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">목적 선택</p>
            <p className="mt-1 text-sm leading-6 text-gray-500">
              목적을 바꾸면 저장된 사주 기준으로 추천일과 추천 시간대가 다시 계산됩니다.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {purposes.map((purpose) => {
              const active = purpose.id === data.purpose
              return (
                <button
                  key={purpose.id}
                  type="button"
                  onClick={() => updateQuery(purpose.id, data.year, data.month)}
                  className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                    active
                      ? 'border-black bg-black text-white'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-black'
                  }`}
                >
                  {purpose.label}
                </button>
              )
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.9fr)]">
        <div className="rounded-[1.75rem] border border-gray-200 bg-white p-3 sm:rounded-[2rem] sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-2 sm:mb-5 sm:gap-3">
            <button
              type="button"
              onClick={() => updateQuery(data.purpose, prevMonth.year, prevMonth.month)}
              className="rounded-full border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:border-gray-300 hover:text-black sm:text-sm"
            >
              이전달
            </button>
            <div className="text-center">
              <p className="text-base font-bold text-gray-900 sm:text-lg">
                {data.year}년 {data.month}월
              </p>
              <p className="text-[11px] text-gray-400 sm:text-xs">개인화 택일 캘린더</p>
            </div>
            <button
              type="button"
              onClick={() => updateQuery(data.purpose, nextMonth.year, nextMonth.month)}
              className="rounded-full border border-gray-200 px-3 py-2 text-xs text-gray-600 hover:border-gray-300 hover:text-black sm:text-sm"
            >
              다음달
            </button>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-gray-400 sm:mb-3 sm:gap-2 sm:text-xs">
            {WEEKDAY_HEADERS.map((weekday) => (
              <div key={weekday}>{weekday}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {emptyCells.map((key) => (
              <div key={key} className="aspect-square rounded-2xl bg-transparent" />
            ))}

            {data.recommendations.map((item) => {
              const isSelected = item.date === selected?.date

              return (
                <button
                  key={item.date}
                  type="button"
                  onClick={() => setManualSelectedDate(item.date)}
                  className={`aspect-square flex flex-col rounded-2xl border px-2 py-2 text-left transition-colors sm:px-3 ${getCellClass(item.level, isSelected)}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-semibold sm:text-base">{item.day}</span>
                    <span
                      className={`mt-0.5 inline-block size-2 shrink-0 rounded-full ${
                        isSelected ? 'bg-white' : getLevelDotClass(item.level)
                      }`}
                    />
                  </div>

                  <div className="mt-auto">
                    <p
                      className={`text-center text-[10px] font-medium leading-none sm:text-xs ${
                        isSelected ? 'text-white/85' : 'text-gray-500'
                      }`}
                    >
                      {getPublicLevelLabel(item.level)}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-gray-500 sm:text-xs">
            {(['best', 'good', 'normal', 'caution', 'avoid'] as const).map((level) => (
              <div key={level} className="flex items-center gap-1.5 rounded-full bg-gray-50 px-2.5 py-1.5">
                <span className={`size-2 rounded-full ${getLevelDotClass(level)}`} />
                <span>{getPublicLevelLabel(level)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <section className="rounded-[1.75rem] border border-gray-200 bg-white p-4 sm:rounded-[2rem] sm:p-6">
            <div className="mb-4">
              <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-gray-400 sm:text-xs">
                Selected
              </p>
              <div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-1">
                <h2 className="text-lg font-bold text-gray-900 sm:text-xl">
                  {selected.year}년 {selected.month}월 {selected.day}일 ({selected.weekdayLabel})
                </h2>
                <span className="text-xs font-medium text-gray-400 sm:text-sm">
                  음력 {selected.lunarMonth}월 {selected.lunarDay}일
                </span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${getLevelChipClass(selected.level)}`}>
                  {getPublicLevelLabel(selected.level)}
                </span>
                <span className="text-sm text-gray-500">
                  {formatGanjiWithReading(selected.dayGanji)}일
                </span>
              </div>
            </div>

            {selected.level === 'avoid' ? (
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">제외 이유</p>
                <div className="mt-3 space-y-2">
                  <p className="text-sm leading-6 text-gray-600">
                    {selected.filteredOutReason ?? '이번 달 추천 후보로 보지는 않는 날짜입니다. 다른 추천일을 먼저 비교해 보세요.'}
                  </p>
                </div>
              </div>
            ) : selected.level === 'caution' ? (
              <div className="rounded-2xl bg-gray-50 p-4">
                <p className="text-sm font-semibold text-gray-900">비추천 이유</p>
                <div className="mt-3 space-y-2">
                  {selected.cautions.length > 0 ? (
                    selected.cautions.map((reason) => (
                      <p key={reason} className="text-sm leading-6 text-gray-600">
                        {reason}
                      </p>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-gray-600">
                      크게 제외할 날짜는 아니지만 이번 목적에는 우선 추천하지 않는 날입니다.
                    </p>
                  )}
                </div>
              </div>
            ) : selected.level === 'normal' ? (
              <div className="space-y-4">
                <div className={`rounded-2xl p-4 ${getReasonPanelClass(selected.level)}`}>
                  <p className="text-sm font-semibold text-gray-900">보통 포인트</p>
                  <div className="mt-3 space-y-2">
                    {selected.reasons.length > 0 ? (
                      selected.reasons.map((reason) => (
                        <p key={reason} className="text-sm leading-6 text-gray-600">
                          {reason}
                        </p>
                      ))
                    ) : (
                      <p className="text-sm leading-6 text-gray-600">
                        크게 강한 추천 포인트는 아니지만 무난하게 검토할 수 있는 날입니다.
                      </p>
                    )}
                  </div>
                </div>

                {selected.cautions.length > 0 ? (
                  <div className="rounded-2xl bg-amber-50 p-4">
                    <p className="text-sm font-semibold text-gray-900">참고할 점</p>
                    <div className="mt-3 space-y-2">
                      {selected.cautions.map((reason) => (
                        <p key={reason} className="text-sm leading-6 text-gray-600">
                          {reason}
                        </p>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="space-y-4">
                <div className={`rounded-2xl p-4 ${getReasonPanelClass(selected.level)}`}>
                  <p className="text-sm font-semibold text-gray-900">추천 이유</p>
                  <div className="mt-3 space-y-2">
                    {selected.reasons.map((reason) => (
                      <p key={reason} className="text-sm leading-6 text-gray-600">
                        {reason}
                      </p>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">추천 시간대</p>
                    <span className="text-xs text-gray-400">(추천 순서 순)</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {selected.goodHours.length > 0 ? (
                      selected.goodHours.map((time) => (
                        <div
                          key={`${selected.date}-${time.start}`}
                          className="rounded-2xl border border-gray-200 px-4 py-3"
                        >
                          <span className="text-sm font-semibold text-gray-900">{time.label}</span>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-500">
                        날짜 자체는 검토할 만하지만 추천 시간대가 뚜렷하지 않아 시간 선택에 제약이 있습니다.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </section>

          <section className="rounded-[1.75rem] border border-gray-200 bg-white p-4 sm:rounded-[2rem] sm:p-6">
            <p className="text-sm font-semibold text-gray-900">이 달의 상위 추천일</p>
            <div className="mt-4 space-y-3">
              {data.bestDates.length > 0 ? (
                data.bestDates.map((item, index) => (
                  <button
                    key={`best-${item.date}`}
                    type="button"
                    onClick={() => setManualSelectedDate(item.date)}
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-left hover:border-gray-300"
                  >
                    <p className="text-sm font-semibold text-gray-900">
                      {index + 1}. {item.month}월 {item.day}일 ({item.weekdayLabel})
                    </p>
                  </button>
                ))
              ) : (
                <p className="rounded-2xl bg-gray-50 px-4 py-3 text-sm leading-6 text-gray-500">
                  이번 달에는 강한 추천일이 많지 않습니다. 다른 목적이나 다음 달도 함께 비교해보세요.
                </p>
              )}
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
