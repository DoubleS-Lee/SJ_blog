'use client'

import { useState, useTransition } from 'react'
import { saveSaju } from '@/actions/saveSaju'
import { buttonVariants } from '@/components/ui/button'
import type { Gender } from '@/types/saju'

interface Props {
  defaultValues?: {
    birth_year: number
    birth_month: number
    birth_day: number
    birth_hour: number | null
    birth_minute: number | null
    gender: Gender
    is_lunar: boolean
  }
}

export default function SajuForm({ defaultValues }: Props) {
  const currentYear = new Date().getFullYear()

  const [year, setYear] = useState(String(defaultValues?.birth_year ?? ''))
  const [month, setMonth] = useState(String(defaultValues?.birth_month ?? ''))
  const [day, setDay] = useState(String(defaultValues?.birth_day ?? ''))
  const [unknownHour, setUnknownHour] = useState(defaultValues?.birth_hour === null && defaultValues !== undefined ? true : defaultValues === undefined ? false : false)
  const [hour, setHour] = useState(defaultValues?.birth_hour !== null && defaultValues?.birth_hour !== undefined ? String(defaultValues.birth_hour) : '')
  const [minute, setMinute] = useState(defaultValues?.birth_minute !== null && defaultValues?.birth_minute !== undefined ? String(defaultValues.birth_minute) : '')
  const [gender, setGender] = useState<Gender>(defaultValues?.gender ?? 'female')
  const [isLunar, setIsLunar] = useState(defaultValues?.is_lunar ?? false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const y = parseInt(year)
    const m = parseInt(month)
    const d = parseInt(day)

    if (!y || y < 1900 || y > currentYear) {
      setError('올바른 출생 연도를 입력해 주세요.')
      return
    }
    if (!m || m < 1 || m > 12) {
      setError('올바른 월을 입력해 주세요.')
      return
    }
    if (!d || d < 1 || d > 31) {
      setError('올바른 일을 입력해 주세요.')
      return
    }

    let parsedHour: number | null = null
    let parsedMinute: number | null = null

    if (!unknownHour) {
      const h = parseInt(hour)
      const min = parseInt(minute || '0')
      if (isNaN(h) || h < 0 || h > 23) {
        setError('시는 0–23 사이로 입력해 주세요.')
        return
      }
      if (isNaN(min) || min < 0 || min > 59) {
        setError('분은 0–59 사이로 입력해 주세요.')
        return
      }
      parsedHour = h
      parsedMinute = min
    }

    startTransition(async () => {
      const result = await saveSaju({
        birth_year: y,
        birth_month: m,
        birth_day: d,
        birth_hour: parsedHour,
        birth_minute: parsedMinute,
        gender,
        is_lunar: isLunar,
      })
      if (result?.error) setError(result.error)
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* 양력/음력 */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">달력 유형</legend>
        <div className="flex gap-4">
          {[
            { value: false, label: '양력' },
            { value: true, label: '음력' },
          ].map(({ value, label }) => (
            <label key={label} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="calendar"
                checked={isLunar === value}
                onChange={() => setIsLunar(value)}
                className="accent-black"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 생년월일 */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">출생 연도</label>
          <input
            type="number"
            placeholder="예) 1990"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min={1900}
            max={currentYear}
            required
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">월</label>
          <input
            type="number"
            placeholder="1–12"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            min={1}
            max={12}
            required
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">일</label>
          <input
            type="number"
            placeholder="1–31"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            min={1}
            max={31}
            required
            className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      {/* 생시 */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">출생 시각</span>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={unknownHour}
              onChange={(e) => setUnknownHour(e.target.checked)}
              className="accent-black"
            />
            <span className="text-sm text-gray-500">모름</span>
          </label>
        </div>

        {!unknownHour && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="시 (0–23)"
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              min={0}
              max={23}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
            <span className="text-gray-400 shrink-0">:</span>
            <input
              type="number"
              placeholder="분 (0–59)"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              min={0}
              max={59}
              className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        )}

        {unknownHour && (
          <p className="text-xs text-gray-400">
            생시를 모르시면 대운 판정은 제외됩니다.
          </p>
        )}
      </div>

      {/* 성별 */}
      <fieldset>
        <legend className="text-sm font-medium text-gray-700 mb-2">성별</legend>
        <div className="flex gap-4">
          {[
            { value: 'male' as Gender, label: '남성' },
            { value: 'female' as Gender, label: '여성' },
          ].map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="gender"
                checked={gender === value}
                onChange={() => setGender(value)}
                className="accent-black"
              />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {/* 에러 */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* 제출 */}
      <button
        type="submit"
        disabled={isPending}
        className={buttonVariants({ className: 'w-full disabled:opacity-60' })}
      >
        {isPending ? '계산 중...' : '사주 저장하기'}
      </button>
    </form>
  )
}
