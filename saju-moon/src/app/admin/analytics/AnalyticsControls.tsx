'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { buttonVariants } from '@/components/ui/button'

type RankingSortKey = 'views' | 'engagement' | 'likes'
type CategorySortKey = 'views' | 'likes' | 'engagement'

const ACTIVE_RANKING_SORT_OPTIONS: Array<{ key: RankingSortKey; label: string }> = [
  { key: 'views', label: '조회수 순' },
  { key: 'engagement', label: '체류시간 순' },
  { key: 'likes', label: '좋아요 순' },
]

const CATEGORY_SORT_OPTIONS: Array<{ key: CategorySortKey; label: string }> = [
  { key: 'views', label: '조회수 순' },
  { key: 'likes', label: '좋아요 순' },
  { key: 'engagement', label: '평균 체류시간 순' },
]

function buildAnalyticsHref(
  startDate: string,
  endDate: string,
  sort: RankingSortKey,
  category: string,
  categorySort: CategorySortKey,
  allPeriod: boolean,
) {
  const base = `/admin/analytics?sort=${sort}&category=${encodeURIComponent(category)}&categorySort=${categorySort}`
  if (allPeriod) {
    return `${base}&allPeriod=1`
  }

  return `${base}&startDate=${startDate}&endDate=${endDate}`
}

export function AnalyticsDateFilter({
  startDate,
  endDate,
  sort,
  category,
  categorySort,
  allPeriod,
}: {
  startDate: string
  endDate: string
  sort: RankingSortKey
  category: string
  categorySort: CategorySortKey
  allPeriod: boolean
}) {
  const router = useRouter()

  function handleSubmit(formData: FormData) {
    const nextStartDate = String(formData.get('startDate') ?? startDate)
    const nextEndDate = String(formData.get('endDate') ?? endDate)
    router.push(
      buildAnalyticsHref(nextStartDate, nextEndDate, sort, category, categorySort, false),
      { scroll: false },
    )
  }

  return (
    <form
      action={handleSubmit}
      className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          시작일
          <input
            type="date"
            name="startDate"
            defaultValue={startDate}
            className="h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-900 outline-none transition focus:border-black"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs text-gray-500">
          종료일
          <input
            type="date"
            name="endDate"
            defaultValue={endDate}
            className="h-10 rounded-xl border border-gray-200 px-3 text-sm text-gray-900 outline-none transition focus:border-black"
          />
        </label>
        <button type="submit" className={buttonVariants({ size: 'sm' })}>
          적용
        </button>
        <Link
          href={buildAnalyticsHref(startDate, endDate, sort, category, categorySort, true)}
          scroll={false}
          className={buttonVariants({
            size: 'sm',
            variant: allPeriod ? 'default' : 'outline',
          })}
        >
          전체 기간
        </Link>
      </div>
    </form>
  )
}

export function AnalyticsCategorySortControls({
  startDate,
  endDate,
  sort,
  category,
  categorySort,
  allPeriod,
}: {
  startDate: string
  endDate: string
  sort: RankingSortKey
  category: string
  categorySort: CategorySortKey
  allPeriod: boolean
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {CATEGORY_SORT_OPTIONS.map((option) => (
        <Link
          key={option.key}
          href={buildAnalyticsHref(startDate, endDate, sort, category, option.key, allPeriod)}
          scroll={false}
          className={buttonVariants({
            size: 'xs',
            variant: categorySort === option.key ? 'default' : 'outline',
          })}
        >
          {option.label}
        </Link>
      ))}
    </div>
  )
}

export function AnalyticsRankingSortControls({
  startDate,
  endDate,
  sort,
  category,
  categorySort,
  allPeriod,
}: {
  startDate: string
  endDate: string
  sort: RankingSortKey
  category: string
  categorySort: CategorySortKey
  allPeriod: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIVE_RANKING_SORT_OPTIONS.map((option) => (
        <Link
          key={option.key}
          href={buildAnalyticsHref(startDate, endDate, option.key, category, categorySort, allPeriod)}
          scroll={false}
          className={buttonVariants({
            size: 'xs',
            variant: sort === option.key ? 'default' : 'outline',
          })}
        >
          {option.label}
        </Link>
      ))}
    </div>
  )
}

export function AnalyticsCategoryFilters({
  startDate,
  endDate,
  sort,
  category,
  categorySort,
  allPeriod,
  categories,
}: {
  startDate: string
  endDate: string
  sort: RankingSortKey
  category: string
  categorySort: CategorySortKey
  allPeriod: boolean
  categories: string[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={buildAnalyticsHref(startDate, endDate, sort, 'all', categorySort, allPeriod)}
        scroll={false}
        className={buttonVariants({
          size: 'xs',
          variant: category === 'all' ? 'default' : 'outline',
        })}
      >
        전체
      </Link>
      {categories.map((item) => (
        <Link
          key={item}
          href={buildAnalyticsHref(startDate, endDate, sort, item, categorySort, allPeriod)}
          scroll={false}
          className={buttonVariants({
            size: 'xs',
            variant: category === item ? 'default' : 'outline',
          })}
        >
          {item}
        </Link>
      ))}
    </div>
  )
}

export function AnalyticsCategoryRowLink({
  startDate,
  endDate,
  sort,
  category,
  categorySort,
  allPeriod,
  children,
}: {
  startDate: string
  endDate: string
  sort: RankingSortKey
  category: string
  categorySort: CategorySortKey
  allPeriod: boolean
  children: React.ReactNode
}) {
  return (
    <Link
      href={buildAnalyticsHref(startDate, endDate, sort, category, categorySort, allPeriod)}
      scroll={false}
      className="inline-flex items-center gap-2 hover:text-pink-600"
    >
      {children}
    </Link>
  )
}
