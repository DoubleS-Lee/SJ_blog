'use client'

import { useRouter } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

interface Props {
  categories: string[]
  years: number[]
  currentQ: string
  currentCategory: string
  currentStatus: string
  currentYear: string
  currentMonth: string
}

export function AdminPostsFilters({
  categories,
  years,
  currentQ,
  currentCategory,
  currentStatus,
  currentYear,
  currentMonth,
}: Props) {
  const router = useRouter()

  function buildUrl(overrides: Record<string, string>) {
    const vals: Record<string, string> = {
      q: currentQ,
      category: currentCategory,
      status: currentStatus,
      year: currentYear,
      month: currentMonth,
      ...overrides,
    }
    const params = new URLSearchParams()
    for (const [k, v] of Object.entries(vals)) {
      if (v) params.set(k, v)
    }
    params.delete('page')
    const qs = params.toString()
    return qs ? `/admin/posts?${qs}` : '/admin/posts'
  }

  function handleSelect(key: string, value: string, resetKeys?: string[]) {
    const overrides: Record<string, string> = { [key]: value }
    if (resetKeys) {
      for (const k of resetKeys) overrides[k] = ''
    }
    router.push(buildUrl(overrides))
  }

  const hasFilters = !!(currentQ || currentCategory || currentStatus || currentYear || currentMonth)

  const selectCls =
    'h-9 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none transition focus:border-black cursor-pointer disabled:cursor-not-allowed disabled:opacity-40'

  return (
    <div className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
      <form action="/admin/posts" method="get" className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {currentCategory && <input type="hidden" name="category" value={currentCategory} />}
        {currentStatus && <input type="hidden" name="status" value={currentStatus} />}
        {currentYear && <input type="hidden" name="year" value={currentYear} />}
        {currentMonth && <input type="hidden" name="month" value={currentMonth} />}

        <input
          type="text"
          name="q"
          defaultValue={currentQ}
          placeholder="제목, 카테고리, slug로 검색"
          className="h-11 flex-1 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition focus:border-black"
        />
        <div className="flex shrink-0 gap-2">
          <button type="submit" className={buttonVariants({ size: 'sm' })}>
            검색
          </button>
          {hasFilters && (
            <a href="/admin/posts" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              초기화
            </a>
          )}
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <select
          value={currentCategory}
          onChange={e => handleSelect('category', e.target.value)}
          className={selectCls}
        >
          <option value="">전체 카테고리</option>
          {categories.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={currentStatus}
          onChange={e => handleSelect('status', e.target.value)}
          className={selectCls}
        >
          <option value="">전체 상태</option>
          <option value="draft">초안</option>
          <option value="scheduled">예약 발행</option>
          <option value="published">발행됨</option>
        </select>

        <select
          value={currentYear}
          onChange={e => handleSelect('year', e.target.value, ['month'])}
          className={selectCls}
        >
          <option value="">전체 연도</option>
          {years.map(y => (
            <option key={y} value={String(y)}>
              {y}년
            </option>
          ))}
        </select>

        <select
          value={currentMonth}
          onChange={e => handleSelect('month', e.target.value)}
          disabled={!currentYear}
          className={selectCls}
        >
          <option value="">전체 월</option>
          {MONTHS.map(m => (
            <option key={m} value={String(m)}>
              {m}월
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
