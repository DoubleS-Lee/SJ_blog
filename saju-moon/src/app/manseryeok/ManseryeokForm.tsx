'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

const HOURS = [
  { value: '', label: '생시 모름' },
  { value: '23:00', label: '자시 (23:00~01:00)' },
  { value: '01:00', label: '축시 (01:00~03:00)' },
  { value: '03:00', label: '인시 (03:00~05:00)' },
  { value: '05:00', label: '묘시 (05:00~07:00)' },
  { value: '07:00', label: '진시 (07:00~09:00)' },
  { value: '09:00', label: '사시 (09:00~11:00)' },
  { value: '11:00', label: '오시 (11:00~13:00)' },
  { value: '13:00', label: '미시 (13:00~15:00)' },
  { value: '15:00', label: '신시 (15:00~17:00)' },
  { value: '17:00', label: '유시 (17:00~19:00)' },
  { value: '19:00', label: '술시 (19:00~21:00)' },
  { value: '21:00', label: '해시 (21:00~23:00)' },
]

interface Props {
  defaultValues?: {
    year?: string; month?: string; day?: string
    hour?: string; gender?: string; isLunar?: string
  }
}

export default function ManseryeokForm({ defaultValues }: Props) {
  const router = useRouter()
  const [year, setYear] = useState(defaultValues?.year ?? '')
  const [month, setMonth] = useState(defaultValues?.month ?? '')
  const [day, setDay] = useState(defaultValues?.day ?? '')
  const [hour, setHour] = useState(defaultValues?.hour ?? '')
  const [gender, setGender] = useState(defaultValues?.gender ?? 'male')
  const [isLunar, setIsLunar] = useState(defaultValues?.isLunar === 'true')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!year || !month || !day) return
    const params = new URLSearchParams({
      year, month, day,
      ...(hour ? { hour: hour.split(':')[0], minute: hour.split(':')[1] } : {}),
      gender,
      is_lunar: String(isLunar),
    })
    router.push(`/manseryeok?${params.toString()}`)
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white'
  const labelCls = 'block text-xs font-medium text-gray-500 mb-1.5'

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* 양력/음력 */}
      <div>
        <p className={labelCls}>달력 구분</p>
        <div className="flex gap-3">
          {[{ v: false, l: '양력' }, { v: true, l: '음력' }].map(({ v, l }) => (
            <label key={l} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="calendar"
                checked={isLunar === v}
                onChange={() => setIsLunar(v)}
                className="accent-black"
              />
              <span className="text-sm">{l}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 생년월일 */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className={labelCls}>년</label>
          <input
            type="number" value={year} onChange={e => setYear(e.target.value)}
            placeholder="1990" min="1900" max="2100"
            className={inputCls} required
          />
        </div>
        <div>
          <label className={labelCls}>월</label>
          <input
            type="number" value={month} onChange={e => setMonth(e.target.value)}
            placeholder="1" min="1" max="12"
            className={inputCls} required
          />
        </div>
        <div>
          <label className={labelCls}>일</label>
          <input
            type="number" value={day} onChange={e => setDay(e.target.value)}
            placeholder="1" min="1" max="31"
            className={inputCls} required
          />
        </div>
      </div>

      {/* 생시 */}
      <div>
        <label className={labelCls}>생시</label>
        <select value={hour} onChange={e => setHour(e.target.value)} className={inputCls}>
          {HOURS.map(h => (
            <option key={h.value} value={h.value}>{h.label}</option>
          ))}
        </select>
        <p className="text-xs text-gray-400 mt-1">서울 기준 진태양시 32분 자동 보정</p>
      </div>

      {/* 성별 */}
      <div>
        <p className={labelCls}>성별</p>
        <div className="flex gap-3">
          {[{ v: 'male', l: '남성' }, { v: 'female', l: '여성' }].map(({ v, l }) => (
            <label key={v} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio" name="gender"
                checked={gender === v}
                onChange={() => setGender(v)}
                className="accent-black"
              />
              <span className="text-sm">{l}</span>
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        className="w-full bg-black text-white rounded-lg py-3 text-sm font-medium hover:bg-gray-800 transition-colors mt-1"
      >
        만세력 조회
      </button>
    </form>
  )
}
