'use client'

import { useState, useTransition } from 'react'
import { buttonVariants } from '@/components/ui/button'
import { saveSaju } from '@/actions/saveSaju'
import type { Gender } from '@/types/saju'

interface Props {
  defaultValues?: {
    saju_name: string
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

  const [sajuName, setSajuName] = useState(defaultValues?.saju_name ?? '')
  const [year, setYear] = useState(String(defaultValues?.birth_year ?? ''))
  const [month, setMonth] = useState(String(defaultValues?.birth_month ?? ''))
  const [day, setDay] = useState(String(defaultValues?.birth_day ?? ''))
  const [unknownHour, setUnknownHour] = useState(defaultValues?.birth_hour === null ? true : false)
  const [hour, setHour] = useState(
    defaultValues?.birth_hour !== null && defaultValues?.birth_hour !== undefined
      ? String(defaultValues.birth_hour)
      : '',
  )
  const [minute, setMinute] = useState(
    defaultValues?.birth_minute !== null && defaultValues?.birth_minute !== undefined
      ? String(defaultValues.birth_minute)
      : '',
  )
  const [gender, setGender] = useState<Gender>(defaultValues?.gender ?? 'female')
  const [isLunar, setIsLunar] = useState(defaultValues?.is_lunar ?? false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const normalizedName = sajuName.trim()
    const y = Number(year)
    const m = Number(month)
    const d = Number(day)

    if (!normalizedName) {
      setError('만세력 이름을 입력해 주세요.')
      return
    }
    if (!y || y < 1900 || y > currentYear) {
      setError('출생 연도를 정확히 입력해 주세요.')
      return
    }
    if (!m || m < 1 || m > 12) {
      setError('출생 월을 정확히 입력해 주세요.')
      return
    }
    if (!d || d < 1 || d > 31) {
      setError('출생 일을 정확히 입력해 주세요.')
      return
    }

    let parsedHour: number | null = null
    let parsedMinute: number | null = null

    if (!unknownHour) {
      const h = Number(hour)
      const min = Number(minute || '0')
      if (Number.isNaN(h) || h < 0 || h > 23) {
        setError('시간은 0~23 사이로 입력해 주세요.')
        return
      }
      if (Number.isNaN(min) || min < 0 || min > 59) {
        setError('분은 0~59 사이로 입력해 주세요.')
        return
      }
      parsedHour = h
      parsedMinute = min
    }

    startTransition(async () => {
      const result = await saveSaju({
        saju_name: normalizedName,
        birth_year: y,
        birth_month: m,
        birth_day: d,
        birth_hour: parsedHour,
        birth_minute: parsedMinute,
        gender,
        is_lunar: isLunar,
      })

      if (result?.error) {
        setError(result.error)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">만세력 이름</label>
        <input
          type="text"
          value={sajuName}
          onChange={(e) => setSajuName(e.target.value)}
          placeholder="예: 민지, 현우"
          className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
        />
        <p className="text-xs text-gray-400">닉네임과 별개로, 내 만세력에서만 쓰는 이름입니다.</p>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-700">달력 종류</legend>
        <div className="flex gap-4">
          {[
            { value: false, label: '양력' },
            { value: true, label: '음력' },
          ].map(({ value, label }) => (
            <label key={label} className="flex cursor-pointer items-center gap-2">
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

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">출생 연도</label>
          <input
            type="number"
            placeholder="예: 1990"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min={1900}
            max={currentYear}
            required
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">월</label>
          <input
            type="number"
            placeholder="1~12"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            min={1}
            max={12}
            required
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">일</label>
          <input
            type="number"
            placeholder="1~31"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            min={1}
            max={31}
            required
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">출생 시간</span>
          <label className="flex cursor-pointer items-center gap-2">
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
              placeholder="시(0~23)"
              value={hour}
              onChange={(e) => setHour(e.target.value)}
              min={0}
              max={23}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
            <span className="shrink-0 text-gray-400">:</span>
            <input
              type="number"
              placeholder="분(0~59)"
              value={minute}
              onChange={(e) => setMinute(e.target.value)}
              min={0}
              max={59}
              className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        )}

        {unknownHour && (
          <p className="text-xs text-gray-400">출생 시간을 모르면 시간 보정은 제외하고 계산됩니다.</p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-gray-700">성별</legend>
        <div className="flex gap-4">
          {[
            { value: 'male' as Gender, label: '남성' },
            { value: 'female' as Gender, label: '여성' },
          ].map(({ value, label }) => (
            <label key={value} className="flex cursor-pointer items-center gap-2">
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

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className={buttonVariants({ className: 'w-full disabled:opacity-60' })}
      >
        {isPending ? '계산 중...' : '내 만세력 저장'}
      </button>
    </form>
  )
}
