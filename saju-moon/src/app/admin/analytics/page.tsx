import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import {
  AnalyticsCategoryFilters,
  AnalyticsCategoryRowLink,
  AnalyticsCategorySortControls,
  AnalyticsDateFilter,
  AnalyticsRankingSortControls,
} from './AnalyticsControls'

export const metadata = { title: '분석 대시보드' }

type RankingSortKey = 'views' | 'engagement' | 'likes'
type CategorySortKey = 'views' | 'likes' | 'engagement'

type AnalyticsDailyOverviewRow = {
  metric_date: string
  unique_visitors: number
  page_views: number
  total_engagement_ms: number
  engagement_events: number
}

type AnalyticsDailyPageTypeRow = {
  metric_date: string
  page_type: string
  views: number
  total_engagement_ms: number
  engagement_events: number
}

type AnalyticsDailyCategoryRow = {
  metric_date: string
  category: string
  views: number
  likes: number
  total_engagement_ms: number
  engagement_events: number
}

type AnalyticsDailyMenuRow = {
  metric_date: string
  menu_name: string
  clicks: number
}

type AnalyticsDailyChannelRow = {
  metric_date: string
  channel: string
  sessions: number
}

type AnalyticsDailyPostRow = {
  metric_date: string
  slug: string
  title: string
  category: string | null
  views: number
  likes: number
  total_engagement_ms: number
  engagement_events: number
}

type SearchParams = Promise<{
  startDate?: string
  endDate?: string
  sort?: string
  category?: string
  categorySort?: string
  allPeriod?: string
}>

const ACTIVE_RANKING_SORT_OPTIONS: Array<{ key: RankingSortKey; label: string; description: string }> = [
  { key: 'views', label: '조회수 순', description: '가장 많이 본 글 위주로 봅니다.' },
  { key: 'engagement', label: '체류시간 순', description: '실제로 오래 읽힌 글 위주로 봅니다.' },
  { key: 'likes', label: '좋아요 순', description: '좋아요가 많이 쌓인 글 위주로 봅니다.' },
]

const CATEGORY_SORT_OPTIONS: Array<{ key: CategorySortKey; label: string }> = [
  { key: 'views', label: '조회수 순' },
  { key: 'likes', label: '좋아요 순' },
  { key: 'engagement', label: '평균 체류시간 순' },
]

const MENU_LABELS: Record<string, string> = {
  blog_list: '블로그',
  post_detail: '블로그 글',
  counsel: '익명 고민 상담',
  counsel_new: '익명 상담 등록',
  compatibility: '궁합',
  compatibility_period: '기간별 궁합',
  taekil: '택일',
  life_graph: '사주 생애 그래프',
  interpretation: '사주 해석',
  mypage: '마이페이지',
  admin: '관리자',
  login: '로그인',
  agree: '약관 동의',
  global_navigation: '상단 메뉴',
  other: '기타',
}

function getKstDateKey(iso: string) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

function getTodayDateKey() {
  return getKstDateKey(new Date().toISOString())
}

function parseDateInput(value: string | undefined) {
  if (!value) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function normalizeDateRange(startDateRaw: string | undefined, endDateRaw: string | undefined) {
  const today = getTodayDateKey()
  const fallbackStart = parseDateInput(startDateRaw) ?? today
  const fallbackEnd = parseDateInput(endDateRaw) ?? today

  if (fallbackStart <= fallbackEnd) {
    return { startDate: fallbackStart, endDate: fallbackEnd }
  }

  return { startDate: fallbackEnd, endDate: fallbackStart }
}

function getSortConfig(raw: string | undefined) {
  return ACTIVE_RANKING_SORT_OPTIONS.find((option) => option.key === raw) ?? ACTIVE_RANKING_SORT_OPTIONS[0]
}

function getCategorySortConfig(raw: string | undefined) {
  return CATEGORY_SORT_OPTIONS.find((option) => option.key === raw) ?? CATEGORY_SORT_OPTIONS[0]
}

function formatDuration(ms: number) {
  if (ms <= 0) return '0초'
  if (ms < 1000) return `${ms}ms`
  if (ms < 60_000) return `${Math.round(ms / 1000)}초`
  return `${Math.round(ms / 60_000)}분`
}

function formatDayLabel(dateKey: string) {
  return new Date(`${dateKey}T00:00:00+09:00`).toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
  })
}

function buildDateKeys(startDate: string, endDate: string) {
  const result: string[] = []
  const cursor = new Date(`${startDate}T00:00:00+09:00`)
  const limit = new Date(`${endDate}T00:00:00+09:00`)

  while (cursor <= limit) {
    result.push(getKstDateKey(cursor.toISOString()))
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

function formatRangeLabel(startDate: string, endDate: string) {
  if (startDate === endDate) {
    return new Date(`${startDate}T00:00:00+09:00`).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return `${startDate} ~ ${endDate}`
}

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

function getCategoryFilter(raw: string | undefined, categories: string[]) {
  if (!raw) return 'all'
  return categories.includes(raw) ? raw : 'all'
}

function isAllPeriodEnabled(raw: string | undefined) {
  return raw === '1'
}

interface Props {
  searchParams: SearchParams
}

export default async function AdminAnalyticsPage({ searchParams }: Props) {
  const {
    startDate: startDateRaw,
    endDate: endDateRaw,
    sort,
    category: categoryRaw,
    categorySort: categorySortRaw,
    allPeriod: allPeriodRaw,
  } = await searchParams
  const { startDate, endDate } = normalizeDateRange(startDateRaw, endDateRaw)
  const allPeriod = isAllPeriodEnabled(allPeriodRaw)
  const sortConfig = getSortConfig(sort)
  const categorySortConfig = getCategorySortConfig(categorySortRaw)
  const rangeLabel = allPeriod ? '전체 기간' : formatRangeLabel(startDate, endDate)
  const supabase = await createClient()

  let overviewQuery = supabase
    .from('analytics_daily_overview')
    .select('metric_date, unique_visitors, page_views, total_engagement_ms, engagement_events')
    .order('metric_date', { ascending: true })

  let pageTypeQuery = supabase
    .from('analytics_daily_page_type')
    .select('metric_date, page_type, views, total_engagement_ms, engagement_events')

  let categoryQuery = supabase
    .from('analytics_daily_category')
    .select('metric_date, category, views, likes, total_engagement_ms, engagement_events')

  let menuQuery = supabase
    .from('analytics_daily_menu')
    .select('metric_date, menu_name, clicks')

  let channelQuery = supabase
    .from('analytics_daily_channel')
    .select('metric_date, channel, sessions')

  let postQuery = supabase
    .from('analytics_daily_post')
    .select('metric_date, slug, title, category, views, likes, total_engagement_ms, engagement_events')

  if (!allPeriod) {
    overviewQuery = overviewQuery.gte('metric_date', startDate).lte('metric_date', endDate)
    pageTypeQuery = pageTypeQuery.gte('metric_date', startDate).lte('metric_date', endDate)
    categoryQuery = categoryQuery.gte('metric_date', startDate).lte('metric_date', endDate)
    menuQuery = menuQuery.gte('metric_date', startDate).lte('metric_date', endDate)
    channelQuery = channelQuery.gte('metric_date', startDate).lte('metric_date', endDate)
    postQuery = postQuery.gte('metric_date', startDate).lte('metric_date', endDate)
  }

  const [
    { data: overviewRowsData },
    { data: pageTypeRowsData },
    { data: categoryRowsData },
    { data: menuRowsData },
    { data: channelRowsData },
    { data: postRowsData },
    { data: todayOverviewRow },
  ] = await Promise.all([
    overviewQuery,
    pageTypeQuery,
    categoryQuery,
    menuQuery,
    channelQuery,
    postQuery,
    supabase
      .from('analytics_daily_overview')
      .select('metric_date, unique_visitors, page_views, total_engagement_ms, engagement_events')
      .eq('metric_date', getTodayDateKey())
      .maybeSingle(),
  ])

  const overviewRows = (overviewRowsData ?? []) as AnalyticsDailyOverviewRow[]
  const pageTypeDailyRows = (pageTypeRowsData ?? []) as AnalyticsDailyPageTypeRow[]
  const categoryDailyRows = (categoryRowsData ?? []) as AnalyticsDailyCategoryRow[]
  const menuDailyRows = (menuRowsData ?? []) as AnalyticsDailyMenuRow[]
  const channelDailyRows = (channelRowsData ?? []) as AnalyticsDailyChannelRow[]
  const postDailyRows = (postRowsData ?? []) as AnalyticsDailyPostRow[]

  const availableCategories = Array.from(
    new Set(
      categoryDailyRows
        .map((row) => row.category?.trim())
        .filter((category): category is string => Boolean(category)),
    ),
  ).sort((a, b) => a.localeCompare(b, 'ko-KR'))

  const selectedCategory = getCategoryFilter(categoryRaw, availableCategories)

  const todayVisitors = (todayOverviewRow as AnalyticsDailyOverviewRow | null)?.unique_visitors ?? 0
  const periodVisitors = overviewRows.reduce((sum, row) => sum + row.unique_visitors, 0)
  const pageViewCount = overviewRows.reduce((sum, row) => sum + row.page_views, 0)
  const totalEngagementMs = overviewRows.reduce((sum, row) => sum + row.total_engagement_ms, 0)
  const totalEngagementEvents = overviewRows.reduce((sum, row) => sum + row.engagement_events, 0)
  const averageEngagementMs =
    totalEngagementEvents > 0 ? Math.round(totalEngagementMs / totalEngagementEvents) : 0

  const dailyVisitors = (
    allPeriod
      ? overviewRows.map((row) => row.metric_date)
      : buildDateKeys(startDate, endDate)
  ).map((dateKey) => {
    const row = overviewRows.find((item) => item.metric_date === dateKey)
    return {
      key: dateKey,
      label: formatDayLabel(dateKey),
      value: row?.unique_visitors ?? 0,
    }
  })

  const maxDailyVisitors = Math.max(1, ...dailyVisitors.map((item) => item.value))

  const pageTypeStats = new Map<string, { views: number; engagementMs: number; engagements: number }>()
  for (const row of pageTypeDailyRows) {
    const entry = pageTypeStats.get(row.page_type) ?? { views: 0, engagementMs: 0, engagements: 0 }
    entry.views += row.views
    entry.engagementMs += row.total_engagement_ms
    entry.engagements += row.engagement_events
    pageTypeStats.set(row.page_type, entry)
  }

  const pageTypeRows = Array.from(pageTypeStats.entries())
    .map(([pageType, stats]) => ({
      pageType,
      label: MENU_LABELS[pageType] ?? pageType,
      views: stats.views,
      averageEngagementMs: stats.engagements > 0 ? Math.round(stats.engagementMs / stats.engagements) : 0,
    }))
    .sort((a, b) => b.views - a.views)

  const categoryStats = new Map<
    string,
    {
      category: string
      views: number
      likes: number
      engagementMs: number
      engagements: number
    }
  >()

  for (const row of categoryDailyRows) {
    const entry = categoryStats.get(row.category) ?? {
      category: row.category,
      views: 0,
      likes: 0,
      engagementMs: 0,
      engagements: 0,
    }
    entry.views += row.views
    entry.likes += row.likes
    entry.engagementMs += row.total_engagement_ms
    entry.engagements += row.engagement_events
    categoryStats.set(row.category, entry)
  }

  const categoryRows = Array.from(categoryStats.values())
    .map((item) => ({
      ...item,
      averageEngagementMs: item.engagements > 0 ? Math.round(item.engagementMs / item.engagements) : 0,
    }))
    .sort((a, b) => {
      if (categorySortConfig.key === 'likes') {
        if (b.likes !== a.likes) return b.likes - a.likes
        if (b.views !== a.views) return b.views - a.views
        return b.averageEngagementMs - a.averageEngagementMs
      }

      if (categorySortConfig.key === 'engagement') {
        if (b.averageEngagementMs !== a.averageEngagementMs) return b.averageEngagementMs - a.averageEngagementMs
        if (b.views !== a.views) return b.views - a.views
        return b.likes - a.likes
      }

      if (b.views !== a.views) return b.views - a.views
      if (b.likes !== a.likes) return b.likes - a.likes
      return b.averageEngagementMs - a.averageEngagementMs
    })

  const menuStats = new Map<string, number>()
  for (const row of menuDailyRows) {
    menuStats.set(row.menu_name, (menuStats.get(row.menu_name) ?? 0) + row.clicks)
  }

  const topMenuRows = Array.from(menuStats.entries())
    .map(([menuName, count]) => ({ menuName, count }))
    .sort((a, b) => b.count - a.count)

  const channelStats = new Map<string, number>()
  for (const row of channelDailyRows) {
    channelStats.set(row.channel, (channelStats.get(row.channel) ?? 0) + row.sessions)
  }

  const channelRows = Array.from(channelStats.entries())
    .map(([channel, sessions]) => ({ channel, sessions }))
    .sort((a, b) => b.sessions - a.sessions)

  const totalChannelSessions = channelRows.reduce((sum, row) => sum + row.sessions, 0)

  const filteredPostDailyRows =
    selectedCategory === 'all'
      ? postDailyRows
      : postDailyRows.filter((row) => row.category === selectedCategory)

  const contentStats = new Map<
    string,
    {
      slug: string
      title: string
      category: string | null
      views: number
      likes: number
      engagementMs: number
      engagements: number
    }
  >()

  for (const row of filteredPostDailyRows) {
    const entry = contentStats.get(row.slug) ?? {
      slug: row.slug,
      title: row.title,
      category: row.category,
      views: 0,
      likes: 0,
      engagementMs: 0,
      engagements: 0,
    }
    entry.views += row.views
    entry.likes += row.likes
    entry.engagementMs += row.total_engagement_ms
    entry.engagements += row.engagement_events
    entry.title = row.title || entry.title
    entry.category = row.category ?? entry.category
    contentStats.set(row.slug, entry)
  }

  const topPostRows = Array.from(contentStats.values())
    .map((item) => ({
      ...item,
      averageEngagementMs: item.engagements > 0 ? Math.round(item.engagementMs / item.engagements) : 0,
    }))
    .sort((a, b) => {
      if (sortConfig.key === 'engagement') {
        if (b.averageEngagementMs !== a.averageEngagementMs) return b.averageEngagementMs - a.averageEngagementMs
        if (b.views !== a.views) return b.views - a.views
        return b.likes - a.likes
      }

      if (sortConfig.key === 'likes') {
        if (b.likes !== a.likes) return b.likes - a.likes
        if (b.views !== a.views) return b.views - a.views
        return b.averageEngagementMs - a.averageEngagementMs
      }

      if (b.views !== a.views) return b.views - a.views
      if (b.likes !== a.likes) return b.likes - a.likes
      return b.averageEngagementMs - a.averageEngagementMs
    })
    .slice(0, 10)

  const topPostSlugs = topPostRows.map((item) => item.slug)
  const postMetaMap =
    topPostSlugs.length > 0
      ? new Map(
          (
            await supabase
              .from('posts')
              .select('id, slug, title')
              .in('slug', topPostSlugs)
          ).data?.map((post) => [post.slug, { id: post.id, title: post.title }]) ?? [],
        )
      : new Map<string, { id: string; title: string | null }>()

  const rankedPostRows = topPostRows.map((item) => ({
    ...item,
    title: postMetaMap.get(item.slug)?.title?.trim() || item.title,
    postId: postMetaMap.get(item.slug)?.id ?? null,
  }))

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">분석 대시보드</h1>
          <p className="text-sm text-gray-500">
            날짜 범위를 직접 지정해 방문 흐름과 콘텐츠 반응을 확인할 수 있습니다.
          </p>
          <p className="text-xs text-gray-400">현재 기준: {rangeLabel}</p>
        </div>

        <AnalyticsDateFilter
          startDate={startDate}
          endDate={endDate}
          sort={sortConfig.key}
          category={selectedCategory}
          categorySort={categorySortConfig.key}
          allPeriod={allPeriod}
        />
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="오늘 방문자" value={todayVisitors.toLocaleString('ko-KR')} hint="고유 세션 기준" />
        <MetricCard label="선택 기간 방문자" value={periodVisitors.toLocaleString('ko-KR')} hint="일별 고유 세션 합계" />
        <MetricCard label="선택 기간 페이지뷰" value={pageViewCount.toLocaleString('ko-KR')} hint="page_view 이벤트" />
        <MetricCard label="평균 체류시간" value={formatDuration(averageEngagementMs)} hint="engagement_time 기준" />
      </section>

      <section className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold tracking-tight">카테고리별 관심도</h2>
        <p className="mt-1 text-xs text-gray-400">
          카테고리별 조회 수, 좋아요 수, 평균 체류시간을 함께 보면 실제로 반응이 이어지는 주제를 빠르게 파악할 수 있습니다.
        </p>
        <AnalyticsCategorySortControls
          startDate={startDate}
          endDate={endDate}
          sort={sortConfig.key}
          category={selectedCategory}
          categorySort={categorySortConfig.key}
          allPeriod={allPeriod}
        />
        <p className="mt-3 text-xs text-gray-500">
          카테고리를 클릭하면 바로 아래 인기 글 랭킹이 해당 카테고리 기준으로 연동됩니다.
          {selectedCategory !== 'all' ? ' 현재 선택: ' + selectedCategory : ' 현재 선택: 전체'}
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">카테고리</th>
                <th className="px-4 py-3 font-medium">조회 수</th>
                <th className="px-4 py-3 font-medium">좋아요 수</th>
                <th className="px-4 py-3 font-medium">평균 체류시간</th>
              </tr>
            </thead>
            <tbody>
              {categoryRows.length > 0 ? (
                categoryRows.map((row) => (
                  <tr
                    key={row.category}
                    className={row.category === selectedCategory ? 'border-t border-pink-100 bg-pink-50/60' : 'border-t border-gray-100'}
                  >
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <AnalyticsCategoryRowLink
                        startDate={startDate}
                        endDate={endDate}
                        sort={sortConfig.key}
                        category={row.category}
                        categorySort={categorySortConfig.key}
                        allPeriod={allPeriod}
                      >
                        {row.category}
                        {row.category === selectedCategory ? (
                          <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[11px] text-pink-600">선택됨</span>
                        ) : null}
                      </AnalyticsCategoryRowLink>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{row.views.toLocaleString('ko-KR')}</td>
                    <td className="px-4 py-3 text-gray-500">{row.likes.toLocaleString('ko-KR')}</td>
                    <td className="px-4 py-3 text-gray-500">{formatDuration(row.averageEngagementMs)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8">
                    <EmptyState text="카테고리별 반응 데이터를 계산할 만큼 이벤트가 아직 충분히 쌓이지 않았습니다." />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_1fr]">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">날짜별 방문 추이</h2>
          <div className="mt-6 space-y-4">
            {dailyVisitors.map((item) => (
              <div key={item.key} className="grid grid-cols-[92px_1fr_52px] items-center gap-3">
                <span className="text-sm text-gray-500">{item.label}</span>
                <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500"
                    style={{ width: `${(item.value / maxDailyVisitors) * 100}%` }}
                  />
                </div>
                <span className="text-right text-sm font-medium text-gray-700">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">유입 채널</h2>
          <p className="mt-1 text-xs text-gray-400">
            세션 시작 시점의 referrer를 기준으로 구글, 네이버, 인스타그램, 유튜브, 쓰레드, 직접접속으로 분류합니다.
          </p>
          <div className="mt-6 space-y-4">
            {channelRows.length > 0 ? (
              channelRows.map((item) => {
                const ratio = totalChannelSessions > 0 ? Math.round((item.sessions / totalChannelSessions) * 100) : 0

                return (
                  <div key={item.channel} className="space-y-2">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-gray-800">{item.channel}</span>
                      <span className="text-gray-500">
                        {item.sessions.toLocaleString('ko-KR')}회 · {ratio}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-pink-400 to-fuchsia-500"
                        style={{ width: `${Math.max(ratio, item.sessions > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <EmptyState text="유입 채널 데이터가 아직 없습니다." />
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">상위 메뉴 클릭</h2>
          <div className="mt-6 space-y-4">
            {topMenuRows.length > 0 ? (
              topMenuRows.map((item, index) => (
                <div key={item.menuName} className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-500">
                      {index + 1}
                    </span>
                    <span className="text-sm font-medium text-gray-800">{item.menuName}</span>
                  </div>
                  <span className="text-sm text-gray-500">{item.count}회</span>
                </div>
              ))
            ) : (
              <EmptyState text="메뉴 클릭 데이터가 아직 없습니다." />
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold tracking-tight">메뉴별 체류시간</h2>
          <p className="mt-1 text-xs text-gray-400">어떤 메뉴가 실제로 오래 머물게 하는지 보는 지표입니다.</p>
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">메뉴</th>
                  <th className="px-4 py-3 font-medium">방문 수</th>
                  <th className="px-4 py-3 font-medium">평균 체류시간</th>
                </tr>
              </thead>
              <tbody>
                {pageTypeRows.length > 0 ? (
                  pageTypeRows.map((row) => (
                    <tr key={row.pageType} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-800">{row.label}</td>
                      <td className="px-4 py-3 text-gray-500">{row.views.toLocaleString('ko-KR')}</td>
                      <td className="px-4 py-3 text-gray-500">{formatDuration(row.averageEngagementMs)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-4 py-8">
                      <EmptyState text="체류시간 데이터가 아직 없습니다." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">인기 글 랭킹</h2>
                <p className="mt-1 text-xs text-gray-400">
                  {sortConfig.description}
                  {selectedCategory !== 'all'
                    ? ` 현재는 ${selectedCategory} 카테고리만 반영 중입니다.`
                    : ' 현재는 전체 카테고리 기준입니다.'}
                </p>
              </div>
              <AnalyticsRankingSortControls
                startDate={startDate}
                endDate={endDate}
                sort={sortConfig.key}
                category={selectedCategory}
                categorySort={categorySortConfig.key}
                allPeriod={allPeriod}
              />
            </div>

            <AnalyticsCategoryFilters
              startDate={startDate}
              endDate={endDate}
              sort={sortConfig.key}
              category={selectedCategory}
              categorySort={categorySortConfig.key}
              allPeriod={allPeriod}
              categories={availableCategories}
            />
          </div>

          <div className="mt-6 space-y-4">
            {rankedPostRows.length > 0 ? (
              rankedPostRows.map((item, index) => (
                <div key={`${item.title}-${index}`} className="rounded-2xl border border-gray-100 px-4 py-4">
                  <div className="flex items-start gap-4">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-900 text-sm font-semibold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      {item.category ? (
                        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">{item.category}</p>
                      ) : null}
                      <p className="mt-1 text-sm font-semibold leading-6 text-gray-900">{item.title}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="rounded-full bg-gray-100 px-2.5 py-1">
                          조회 {item.views.toLocaleString('ko-KR')}
                        </span>
                        <span className="rounded-full bg-pink-50 px-2.5 py-1 text-pink-600">
                          좋아요 {item.likes.toLocaleString('ko-KR')}
                        </span>
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">
                          평균 체류 {formatDuration(item.averageEngagementMs)}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/posts/${item.slug}`}
                          scroll={false}
                          className={buttonVariants({ variant: 'outline', size: 'xs' })}
                        >
                          공개 글 보기
                        </Link>
                        {item.postId ? (
                          <Link
                            href={`/admin/posts/${item.postId}`}
                            scroll={false}
                            className={buttonVariants({ size: 'xs' })}
                          >
                            관리자 수정
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="선택한 조건에서 인기 글 랭킹을 만들 데이터가 아직 없습니다." />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
      <p className="mt-2 text-xs text-gray-400">{hint}</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm text-gray-400">{text}</p>
}
