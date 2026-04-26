'use client'

import { useState, useTransition } from 'react'
import type { Gender } from '@/types/saju'
import { buttonVariants } from '@/components/ui/button'
import { deleteCompatibilitySaju, saveCompatibilitySaju } from '@/actions/saveCompatibilitySaju'

type CompatibilityEntry = {
  id: string
  nickname: string
  birth_year: number
  birth_month: number
  birth_day: number
  birth_hour: number | null
  birth_minute: number | null
  gender: Gender
  is_lunar: boolean
}

interface Props {
  entries: CompatibilityEntry[]
  role: 'free' | 'plus' | 'premium'
  isAdmin: boolean
}

export default function CompatibilitySajuManager({ entries, role, isAdmin }: Props) {
  const currentYear = new Date().getFullYear()
  const maxCount = isAdmin || role !== 'free' ? 4 : 1

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [nickname, setNickname] = useState('')
  const [year, setYear] = useState('')
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [unknownHour, setUnknownHour] = useState(false)
  const [hour, setHour] = useState('')
  const [minute, setMinute] = useState('')
  const [gender, setGender] = useState<Gender>('female')
  const [isLunar, setIsLunar] = useState(false)

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const isEditing = editingId !== null

  function resetForm() {
    setEditingId(null)
    setNickname('')
    setYear('')
    setMonth('')
    setDay('')
    setHour('')
    setMinute('')
    setUnknownHour(false)
    setGender('female')
    setIsLunar(false)
    setError(null)
  }

  function toggleForm() {
    if (showForm) {
      setShowForm(false)
      resetForm()
      return
    }

    setShowForm(true)
    setError(null)
  }

  function startEdit(entry: CompatibilityEntry) {
    setEditingId(entry.id)
    setNickname(entry.nickname)
    setYear(String(entry.birth_year))
    setMonth(String(entry.birth_month))
    setDay(String(entry.birth_day))
    setUnknownHour(entry.birth_hour === null)
    setHour(entry.birth_hour !== null ? String(entry.birth_hour) : '')
    setMinute(entry.birth_minute !== null ? String(entry.birth_minute) : '')
    setGender(entry.gender)
    setIsLunar(entry.is_lunar)
    setError(null)
    setShowForm(true)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const y = Number(year)
    const m = Number(month)
    const d = Number(day)

    if (!nickname.trim()) return setError('상대 이름을 입력해 주세요.')
    if (!y || y < 1900 || y > currentYear) return setError('출생 연도를 정확히 입력해 주세요.')
    if (!m || m < 1 || m > 12) return setError('출생 월을 정확히 입력해 주세요.')
    if (!d || d < 1 || d > 31) return setError('출생 일을 정확히 입력해 주세요.')

    let parsedHour: number | null = null
    let parsedMinute: number | null = null

    if (!unknownHour) {
      const h = Number(hour)
      const min = Number(minute || '0')
      if (Number.isNaN(h) || h < 0 || h > 23) return setError('시간은 0~23으로 입력해 주세요.')
      if (Number.isNaN(min) || min < 0 || min > 59) return setError('분은 0~59로 입력해 주세요.')
      parsedHour = h
      parsedMinute = min
    }

    startTransition(async () => {
      const result = await saveCompatibilitySaju({
        id: editingId ?? undefined,
        nickname: nickname.trim(),
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
        return
      }

      resetForm()
      setShowForm(false)
    })
  }

  return (
    <div className="space-y-6">
      <section>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">저장된 만세력</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              만세력은 본인 포함 2개까지 저장할 수 있습니다.
            </p>
          </div>
          <button
            type="button"
            onClick={toggleForm}
            className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-gray-900 hover:shadow-md"
            aria-expanded={showForm}
          >
            {showForm ? '입력 닫기' : '추가 만세력 등록'}
          </button>
        </div>

        {showForm ? (
          <form onSubmit={handleSubmit} className="mt-5 grid gap-4 border-t border-gray-100 pt-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">{isEditing ? '저장된 만세력 수정' : '새 만세력 등록'}</p>
              {isEditing ? (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-medium text-gray-500 hover:text-gray-900"
                >
                  수정 취소
                </button>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">이름</label>
              <input
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                placeholder="예: 민수"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">출생 연도</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  min={1900}
                  max={currentYear}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">출생 월</label>
                <input
                  type="number"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  min={1}
                  max={12}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">출생 일</label>
                <input
                  type="number"
                  value={day}
                  onChange={(e) => setDay(e.target.value)}
                  min={1}
                  max={31}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={unknownHour}
                  onChange={(e) => setUnknownHour(e.target.checked)}
                  className="accent-black"
                />
                출생시 모름
              </label>

              <div className="flex gap-4">
                {[
                  { value: 'female' as Gender, label: '여성' },
                  { value: 'male' as Gender, label: '남성' },
                ].map((item) => (
                  <label key={item.value} className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="radio"
                      name="compatibility-gender"
                      checked={gender === item.value}
                      onChange={() => setGender(item.value)}
                      className="accent-black"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            {!unknownHour ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <input
                  type="number"
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  placeholder="시(0~23)"
                  min={0}
                  max={23}
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
                <input
                  type="number"
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  placeholder="분(0~59)"
                  min={0}
                  max={59}
                  className="rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
            ) : null}

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={isLunar}
                onChange={(e) => setIsLunar(e.target.checked)}
                className="accent-black"
              />
              음력
            </label>

            {error ? <p className="text-sm text-red-500">{error}</p> : null}

            <button
              type="submit"
              disabled={isPending}
              className={buttonVariants({ className: 'w-full disabled:opacity-60' })}
            >
              {isPending ? '저장 중...' : isEditing ? '수정 저장' : '만세력 등록'}
            </button>
          </form>
        ) : null}

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-gray-50 px-4 py-4 text-sm text-gray-600">
            현재 저장 수: {entries.length} / {maxCount}
          </div>

          {entries.length === 0 ? (
            <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">
              아직 저장된 만세력이 없습니다.
            </div>
          ) : (
            entries.map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-gray-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{item.nickname}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {item.birth_year}.{String(item.birth_month).padStart(2, '0')}.{String(item.birth_day).padStart(2, '0')}
                    {item.birth_hour !== null
                      ? ` ${String(item.birth_hour).padStart(2, '0')}:${String(item.birth_minute ?? 0).padStart(2, '0')}`
                      : ' 출생시 모름'}
                    {' · '}
                    {item.gender === 'male' ? '남성' : '여성'}
                    {' · '}
                    {item.is_lunar ? '음력' : '양력'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(item)}
                    className="text-sm font-medium text-gray-600 hover:text-black"
                  >
                    수정
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={() => {
                      if (editingId === item.id) resetForm()
                      setDeletingId(item.id)
                      startTransition(async () => {
                        await deleteCompatibilitySaju(item.id)
                        setDeletingId(null)
                      })
                    }}
                    className="text-sm font-medium text-gray-500 hover:text-black disabled:opacity-60"
                  >
                    {deletingId === item.id ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
