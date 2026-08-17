import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { buttonVariants } from '@/components/ui/button'
import {
  AnalyticsCategoryFilters,
  AnalyticsCategoryRowLink,
  AnalyticsCategorySortControls,
  AnalyticsDateFilter,
  AnalyticsRankingSortControls,
} from './AnalyticsControls'

export const metadata = { title: '분석 대시보드' }

type RankingSortKey = 'views' | 'engagement' | 'likes' | 'landing'
type CategorySortKey = 'views' | 'likes' | 'engagement'

type AnalyticsDailyOverviewRow = {
  metric_date: string
  unique_visitors: number
  sessions: number
  new_visitors: number
  returning_visitors: number
  page_views: number
  total_engagement_ms: number
  engagement_events: number
  engaged_sessions: number
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
  visitors: number
  engaged_sessions: number
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
  landing_sessions: number
  visitors: number
  engaged_sessions: number
}

type AnalyticsSessionStartRow = {
  created_at: string
  user_id: string | null
  visitor_id: string
  session_id: string
  referrer: string | null
  landing_post_slug: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  landing_page: string | null
}

type AnalyticsFirstSeenRow = {
  created_at: string
  user_id: string | null
  visitor_id: string
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
  { key: 'landing', label: '유입 기여 순', description: '외부 유입이나 첫 진입을 가장 많이 만든 글 위주로 봅니다.' },
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

function parseDateInput(value: string | undefined) {
  if (!value) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null
}

function normalizeDateRange(startDateRaw: string | undefined, endDateRaw: string | undefined) {
  const today = getKstDateKey(new Date().toISOString())
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

function getCategoryFilter(raw: string | undefined, categories: string[]) {
  if (!raw) return 'all'
  return categories.includes(raw) ? raw : 'all'
}

function isAllPeriodEnabled(raw: string | undefined) {
  return raw === '1'
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

function matchesAnalyticsSlug(candidateSlug: string, analyticsSlug: string) {
  if (candidateSlug === analyticsSlug) return true

  const encodedCandidate = encodeURIComponent(candidateSlug)
  if (encodedCandidate === analyticsSlug) return true

  if (analyticsSlug.includes('%') && encodedCandidate.startsWith(analyticsSlug)) {
    return true
  }

  return candidateSlug.startsWith(analyticsSlug)
}

function getRangeIsoBounds(startDate: string, endDate: string) {
  return {
    startIso: `${startDate}T00:00:00+09:00`,
    endIso: `${endDate}T23:59:59.999+09:00`,
  }
}

function getAnalyticsPersonKey(row: Pick<AnalyticsSessionStartRow, 'user_id' | 'visitor_id'>) {
  return row.user_id ? `user:${row.user_id}` : `visitor:${row.visitor_id}`
}

function classifyAcquisitionChannel(row: Pick<AnalyticsSessionStartRow, 'referrer' | 'utm_source' | 'utm_medium'>) {
  const referrer = (row.referrer ?? '').trim().toLowerCase()
  const source = (row.utm_source ?? '').trim().toLowerCase()
  const medium = (row.utm_medium ?? '').trim().toLowerCase()

  if (source === 'google' || source === 'google-search') return '구글 검색'
  if (source === 'naver' || source === 'naver-search') return '네이버 검색'
  if (['instagram', 'ig', 'insta'].includes(source)) return '인스타그램'
  if (['kakaotalk', 'kakao', 'kakao-talk'].includes(source)) return '카카오톡'
  if (['youtube', 'youtu', 'youtube-search'].includes(source)) return '유튜브'
  if (source === 'threads') return '쓰레드'
  if (['social', 'social-media', 'social_network', 'social-network', 'social network'].includes(medium)) {
    return '기타 소셜'
  }
  if (['cpc', 'ppc', 'paid', 'paid-social', 'display', 'banner'].includes(medium) && source) {
    return '유료 캠페인'
  }
  if (!referrer) return '직접접속'
  if (referrer.includes('google.')) return '구글 검색'
  if (referrer.includes('search.naver.') || referrer.includes('m.search.naver.')) return '네이버 검색'
  if (referrer.includes('blog.naver.')) return '네이버 블로그'
  if (referrer.includes('instagram.')) return '인스타그램'
  if (referrer.includes('kakao.') || referrer.includes('kakaotalk.')) return '카카오톡'
  if (referrer.includes('youtube.') || referrer.includes('youtu.be')) return '유튜브'
  if (referrer.includes('threads.')) return '쓰레드'
  if (
    referrer.includes('facebook.') ||
    referrer.includes('fb.') ||
    referrer.includes('twitter.') ||
    referrer.includes('x.com') ||
    referrer.includes('t.co') ||
    referrer.includes('linkedin.') ||
    referrer.includes('m.blog.')
  ) {
    return '기타 소셜'
  }
  return '기타'
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
  const { startIso, endIso } = getRangeIsoBounds(startDate, endDate)
  const startTimestamp = new Date(startIso).getTime()
  const endTimestamp = new Date(endIso).getTime()
  const allPeriod = isAllPeriodEnabled(allPeriodRaw)
  const sortConfig = getSortConfig(sort)
  const categorySortConfig = getCategorySortConfig(categorySortRaw)
  const rangeLabel = allPeriod ? '전체 기간' : formatRangeLabel(startDate, endDate)
  const supabase = await createClient()

  let overviewQuery = supabase
    .from('analytics_daily_overview')
    .select('metric_date, unique_visitors, sessions, new_visitors, returning_visitors, page_views, total_engagement_ms, engagement_events, engaged_sessions')
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
    .select('metric_date, channel, sessions, visitors, engaged_sessions')

  let postQuery = supabase
    .from('analytics_daily_post')
    .select('metric_date, slug, title, category, views, likes, total_engagement_ms, engagement_events, landing_sessions, visitors, engaged_sessions')

  let sessionHistoryQuery = supabaseAdmin
    .from('analytics_events')
    .select('created_at, user_id, visitor_id, session_id, referrer, landing_post_slug, utm_source, utm_medium, utm_campaign, landing_page')
    .eq('event_name', 'session_start')
    .order('created_at', { ascending: true })

  // 신규/재방문 판별용 — 선택 기간과 무관하게 "이 사람을 언제 처음 봤는지"를 알아야 하므로
  // 하한 없이 종료일까지 전부 조회한다. rangeSessionRows(기간 내 표시용)와는 별도 쿼리로 분리.
  let firstSeenQuery = supabaseAdmin
    .from('analytics_events')
    .select('created_at, user_id, visitor_id')
    .eq('event_name', 'session_start')
    .order('created_at', { ascending: true })

  if (!allPeriod) {
    overviewQuery = overviewQuery.gte('metric_date', startDate).lte('metric_date', endDate)
    pageTypeQuery = pageTypeQuery.gte('metric_date', startDate).lte('metric_date', endDate)
    categoryQuery = categoryQuery.gte('metric_date', startDate).lte('metric_date', endDate)
    menuQuery = menuQuery.gte('metric_date', startDate).lte('metric_date', endDate)
    channelQuery = channelQuery.gte('metric_date', startDate).lte('metric_date', endDate)
    postQuery = postQuery.gte('metric_date', startDate).lte('metric_date', endDate)
    sessionHistoryQuery = sessionHistoryQuery.gte('created_at', startIso).lte('created_at', endIso)
    firstSeenQuery = firstSeenQuery.lte('created_at', endIso)
  }

  const [
    { data: overviewRowsData },
    { data: pageTypeRowsData },
    { data: categoryRowsData },
    { data: menuRowsData },
    { data: channelRowsData },
    { data: postRowsData },
    { data: sessionHistoryRowsData },
    { data: firstSeenRowsData },
  ] = await Promise.all([
    overviewQuery,
    pageTypeQuery,
    categoryQuery,
    menuQuery,
    channelQuery,
    postQuery,
    sessionHistoryQuery,
    firstSeenQuery,
  ])

  const overviewRows = (overviewRowsData ?? []) as AnalyticsDailyOverviewRow[]
  const pageTypeDailyRows = (pageTypeRowsData ?? []) as AnalyticsDailyPageTypeRow[]
  const categoryDailyRows = (categoryRowsData ?? []) as AnalyticsDailyCategoryRow[]
  const menuDailyRows = (menuRowsData ?? []) as AnalyticsDailyMenuRow[]
  const channelDailyRows = (channelRowsData ?? []) as AnalyticsDailyChannelRow[]
  const postDailyRows = (postRowsData ?? []) as AnalyticsDailyPostRow[]
  const sessionHistoryRows = (sessionHistoryRowsData ?? []) as AnalyticsSessionStartRow[]
  const firstSeenRows = (firstSeenRowsData ?? []) as AnalyticsFirstSeenRow[]

  const rangeSessionRows = allPeriod
    ? sessionHistoryRows
    : sessionHistoryRows.filter((row) => {
        const createdAt = new Date(row.created_at).getTime()
        return createdAt >= startTimestamp && createdAt <= endTimestamp
      })

  const firstSeenByPerson = new Map<string, string>()
  for (const row of firstSeenRows) {
    const personKey = getAnalyticsPersonKey(row)
    if (!firstSeenByPerson.has(personKey)) {
      firstSeenByPerson.set(personKey, row.created_at)
    }
  }

  const distinctVisitors = new Set(rangeSessionRows.map((row) => getAnalyticsPersonKey(row)))
  const newVisitors = new Set(
    rangeSessionRows
      .filter((row) => {
        const firstSeenAt = firstSeenByPerson.get(getAnalyticsPersonKey(row))
        return firstSeenAt ? getKstDateKey(firstSeenAt) >= startDate && getKstDateKey(firstSeenAt) <= endDate : false
      })
      .map((row) => getAnalyticsPersonKey(row)),
  )
  const returningVisitors = new Set(
    Array.from(distinctVisitors).filter((visitorId) => !newVisitors.has(visitorId)),
  )

  const overviewByDate = new Map(overviewRows.map((row) => [row.metric_date, row]))
  const pageViewCount = overviewRows.reduce((sum, row) => sum + row.page_views, 0)
  const totalEngagementMs = overviewRows.reduce((sum, row) => sum + row.total_engagement_ms, 0)
  const totalEngagementEvents = overviewRows.reduce((sum, row) => sum + row.engagement_events, 0)
  const engagedSessions = overviewRows.reduce((sum, row) => sum + row.engaged_sessions, 0)
  const sessionCount = rangeSessionRows.length
  const uniqueVisitorCount = distinctVisitors.size
  const newVisitorCount = newVisitors.size
  const returningVisitorCount = returningVisitors.size
  const averageEngagementMs =
    totalEngagementEvents > 0 ? Math.round(totalEngagementMs / totalEngagementEvents) : 0

  const dailyVisitorMap = new Map<string, Set<string>>()
  for (const row of rangeSessionRows) {
    const dateKey = getKstDateKey(row.created_at)
    const visitors = dailyVisitorMap.get(dateKey) ?? new Set<string>()
    visitors.add(getAnalyticsPersonKey(row))
    dailyVisitorMap.set(dateKey, visitors)
  }

  const dailyVisitorKeys = allPeriod
    ? Array.from(dailyVisitorMap.keys()).sort()
    : buildDateKeys(startDate, endDate)

  const dailyVisitors = dailyVisitorKeys.map((dateKey) => ({
    key: dateKey,
    label: formatDayLabel(dateKey),
    value: dailyVisitorMap.get(dateKey)?.size ?? 0,
  }))

  const maxDailyVisitors = Math.max(1, ...dailyVisitors.map((item) => item.value))

  const availableCategories = Array.from(
    new Set(
      categoryDailyRows
        .map((row) => row.category?.trim())
        .filter((category): category is string => Boolean(category)),
    ),
  ).sort((a, b) => a.localeCompare(b, 'ko-KR'))

  const selectedCategory = getCategoryFilter(categoryRaw, availableCategories)

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

  const channelStats = new Map<string, { sessions: number; engagedSessions: number; people: Set<string> }>()
  for (const row of channelDailyRows) {
    const entry = channelStats.get(row.channel) ?? { sessions: 0, engagedSessions: 0, people: new Set<string>() }
    entry.sessions += row.sessions
    entry.engagedSessions += row.engaged_sessions
    channelStats.set(row.channel, entry)
  }
  for (const row of rangeSessionRows) {
    const channel = classifyAcquisitionChannel(row)
    const entry = channelStats.get(channel) ?? { sessions: 0, engagedSessions: 0, people: new Set<string>() }
    entry.people.add(getAnalyticsPersonKey(row))
    channelStats.set(channel, entry)
  }

  const channelRows = Array.from(channelStats.entries())
    .map(([channel, stats]) => ({ channel, sessions: stats.sessions, engagedSessions: stats.engagedSessions, visitors: stats.people.size }))
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
      visitors: number
      landingSessions: number
      engagedSessions: number
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
      visitors: 0,
      landingSessions: 0,
      engagedSessions: 0,
      engagementMs: 0,
      engagements: 0,
    }
    entry.views += row.views
    entry.likes += row.likes
    entry.visitors += row.visitors
    entry.landingSessions += row.landing_sessions
    entry.engagedSessions += row.engaged_sessions
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
      if (sortConfig.key === 'landing') {
        if (b.landingSessions !== a.landingSessions) return b.landingSessions - a.landingSessions
        if (b.engagedSessions !== a.engagedSessions) return b.engagedSessions - a.engagedSessions
        if (b.views !== a.views) return b.views - a.views
        return b.likes - a.likes
      }

      if (sortConfig.key === 'engagement') {
        if (b.averageEngagementMs !== a.averageEngagementMs) return b.averageEngagementMs - a.averageEngagementMs
        if (b.engagedSessions !== a.engagedSessions) return b.engagedSessions - a.engagedSessions
        return b.views - a.views
      }

      if (sortConfig.key === 'likes') {
        if (b.likes !== a.likes) return b.likes - a.likes
        if (b.views !== a.views) return b.views - a.views
        return b.engagedSessions - a.engagedSessions
      }

      if (b.views !== a.views) return b.views - a.views
      if (b.engagedSessions !== a.engagedSessions) return b.engagedSessions - a.engagedSessions
      return b.likes - a.likes
    })
    .slice(0, 10)

  const topPostSlugCandidates = Array.from(
    new Set(
      topPostRows.flatMap((item) => {
        const decoded = safeDecodeURIComponent(item.slug)
        return decoded === item.slug ? [item.slug] : [item.slug, decoded]
      }),
    ),
  )

  const exactPostMatches =
    topPostSlugCandidates.length > 0
      ? (
          await supabase
            .from('posts')
            .select('id, slug, title')
            .in('slug', topPostSlugCandidates)
        ).data ?? []
      : []

  const exactPostMetaMap = new Map(
    exactPostMatches.flatMap((post) => {
      const encodedSlug = encodeURIComponent(post.slug)
      const entry = [post.slug, { id: post.id, slug: post.slug, title: post.title }] as const
      if (encodedSlug === post.slug) {
        return [entry]
      }
      return [entry, [encodedSlug, { id: post.id, slug: post.slug, title: post.title }] as const]
    }),
  )

  const unresolvedPostSlugs = topPostRows
    .map((item) => item.slug)
    .filter((slug) => !exactPostMetaMap.has(slug) && !exactPostMetaMap.has(safeDecodeURIComponent(slug)))

  const allPosts =
    unresolvedPostSlugs.length > 0
      ? (
          await supabase
            .from('posts')
            .select('id, slug, title')
        ).data ?? []
      : []

  const rankedPostRows = topPostRows.map((item) => ({
    ...item,
    title:
      exactPostMetaMap.get(item.slug)?.title?.trim() ||
      exactPostMetaMap.get(safeDecodeURIComponent(item.slug))?.title?.trim() ||
      allPosts.find((post) => matchesAnalyticsSlug(post.slug, item.slug))?.title?.trim() ||
      (item.title && item.title !== item.slug ? item.title : '제목을 찾을 수 없는 글'),
    postId:
      exactPostMetaMap.get(item.slug)?.id ??
      exactPostMetaMap.get(safeDecodeURIComponent(item.slug))?.id ??
      allPosts.find((post) => matchesAnalyticsSlug(post.slug, item.slug))?.id ??
      null,
    publicSlug:
      exactPostMetaMap.get(item.slug)?.slug ??
      exactPostMetaMap.get(safeDecodeURIComponent(item.slug))?.slug ??
      allPosts.find((post) => matchesAnalyticsSlug(post.slug, item.slug))?.slug ??
      safeDecodeURIComponent(item.slug),
  }))

  const topPostHighlight = rankedPostRows[0] ?? null
  const topChannelHighlight = channelRows[0] ?? null
  const topMenuHighlight = topMenuRows[0] ?? null

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: '#1E2D4D' }}>분석 대시보드</h1>
          <p className="text-sm" style={{ color: '#4a5673' }}>
            방문자 수만 세는 대신, 어떤 유입이 어떤 글을 읽게 만들었는지 중심으로 봅니다.
          </p>
          <p className="text-xs" style={{ color: '#9a8e7a' }}>현재 기준: {rangeLabel}</p>
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="들어온 사람" value={uniqueVisitorCount.toLocaleString('ko-KR')} hint="선택 기간 동안 사이트에 들어온 사람 추정치" />
        <MetricCard label="방문 횟수" value={sessionCount.toLocaleString('ko-KR')} hint="사이트에 들어온 총 횟수" />
        <MetricCard label="실제로 읽은 방문" value={engagedSessions.toLocaleString('ko-KR')} hint="15초 이상 머물거나 50% 이상 읽은 방문" />
        <MetricCard
          label="인기 글 1위"
          value={topPostHighlight?.title ?? '아직 데이터 없음'}
          hint={
            topPostHighlight
              ? '가장 많이 읽힌 글'
              : '선택 기간에 집계된 글 데이터가 아직 없습니다.'
          }
        />
        <MetricCard
          label="가장 강한 유입 채널"
          value={topChannelHighlight?.channel ?? '아직 데이터 없음'}
          hint={
            topChannelHighlight
              ? '사람이 가장 많이 들어온 유입 경로'
              : '선택 기간에 집계된 유입 채널이 아직 없습니다.'
          }
        />
        <MetricCard
          label="가장 많이 본 메뉴"
          value={topMenuHighlight ? MENU_LABELS[topMenuHighlight.menuName] ?? topMenuHighlight.menuName : '아직 데이터 없음'}
          hint={
            topMenuHighlight
              ? '가장 많이 눌러본 메뉴'
              : '선택 기간에 집계된 메뉴 클릭이 아직 없습니다.'
          }
        />
      </section>

      <section className="rounded-2xl border p-6" style={{ background: '#FBF7EE', borderColor: 'rgba(30,45,77,0.09)' }}>
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
          {selectedCategory !== 'all' ? ` 현재 선택: ${selectedCategory}` : ' 현재 선택: 전체'}
        </p>
        <div className="mt-6 overflow-hidden rounded-2xl border" style={{ borderColor: 'rgba(30,45,77,0.09)' }}>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider" style={{ background: 'rgba(30,45,77,0.05)', color: '#9a8e7a' }}>
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
        <div className="rounded-2xl border p-6" style={{ background: '#FBF7EE', borderColor: 'rgba(30,45,77,0.09)' }}>
          <h2 className="text-lg font-semibold tracking-tight">날짜별 방문자 추정</h2>
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

        <div className="rounded-2xl border p-6" style={{ background: '#FBF7EE', borderColor: 'rgba(30,45,77,0.09)' }}>
          <h2 className="text-lg font-semibold tracking-tight">유입 채널</h2>
          <p className="mt-1 text-xs text-gray-400">
            채널별 방문자 추정치와 참여 세션을 함께 보면 어떤 유입이 실제 반응으로 이어지는지 읽기 쉽습니다.
          </p>
          <div className="mt-6 space-y-4">
            {channelRows.length > 0 ? (
              channelRows.map((item) => {
                const ratio = totalChannelSessions > 0 ? Math.round((item.sessions / totalChannelSessions) * 100) : 0

                return (
                  <div key={item.channel} className="space-y-2">
                    <div className="flex items-center justify-between gap-4 text-sm">
                      <span className="font-medium text-gray-800">{item.channel}</span>
                      <span className="text-right text-gray-500">
                        세션 {item.sessions.toLocaleString('ko-KR')} · 방문자 추정 {item.visitors.toLocaleString('ko-KR')} · 참여 {item.engagedSessions.toLocaleString('ko-KR')}
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
        <div className="rounded-2xl border p-6" style={{ background: '#FBF7EE', borderColor: 'rgba(30,45,77,0.09)' }}>
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

        <div className="rounded-2xl border p-6" style={{ background: '#FBF7EE', borderColor: 'rgba(30,45,77,0.09)' }}>
          <h2 className="text-lg font-semibold tracking-tight">메뉴별 체류시간</h2>
          <p className="mt-1 text-xs text-gray-400">어떤 메뉴가 실제로 오래 머물게 하는지 보는 지표입니다.</p>
          <div className="mt-6 overflow-hidden rounded-2xl border" style={{ borderColor: 'rgba(30,45,77,0.09)' }}>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider" style={{ background: 'rgba(30,45,77,0.05)', color: '#9a8e7a' }}>
                <tr>
                  <th className="px-4 py-3 font-medium">메뉴</th>
                  <th className="px-4 py-3 font-medium">방문 수</th>
                  <th className="px-4 py-3 font-medium">평균 체류시간</th>
                </tr>
              </thead>
              <tbody>
                {pageTypeRows.length > 0 ? (
                  pageTypeRows.map((row) => (
                    <tr key={row.pageType} className="border-t" style={{ borderColor: 'rgba(30,45,77,0.08)' }}>
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

        <div className="rounded-2xl border p-6" style={{ background: '#FBF7EE', borderColor: 'rgba(30,45,77,0.09)' }}>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold tracking-tight">성장 기여 글 랭킹</h2>
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
                        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-700">
                          유입 세션 {item.landingSessions.toLocaleString('ko-KR')}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2.5 py-1">
                          조회 {item.views.toLocaleString('ko-KR')}
                        </span>
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">
                          고유 방문 {item.visitors.toLocaleString('ko-KR')}
                        </span>
                        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">
                          참여 세션 {item.engagedSessions.toLocaleString('ko-KR')}
                        </span>
                        <span className="rounded-full bg-pink-50 px-2.5 py-1 text-pink-600">
                          좋아요 {item.likes.toLocaleString('ko-KR')}
                        </span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Link
                          href={`/posts/${item.publicSlug}`}
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
              <EmptyState text="선택한 조건에서 글 랭킹을 만들 데이터가 아직 없습니다." />
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

function MetricCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  const isNumericValue = /^[\d,]+$/.test(value)

  return (
    <div className="rounded-2xl border p-5" style={{ background: '#FBF7EE', borderColor: 'rgba(30,45,77,0.09)' }}>
      <p className="text-sm" style={{ color: '#4a5673' }}>{label}</p>
      <p
        className={`mt-3 font-bold tracking-tight ${isNumericValue ? 'text-3xl' : 'text-xl leading-snug'}`}
        style={{ color: '#1E2D4D' }}
      >
        {value}
      </p>
      <p className="mt-2 text-xs" style={{ color: '#9a8e7a' }}>{hint}</p>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <p className="text-sm" style={{ color: '#9a8e7a' }}>{text}</p>
}
