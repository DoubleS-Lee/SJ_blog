import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'
import { AdminPostsFilters } from './AdminPostsFilters'

export const metadata = { title: '글 관리' }

const PAGE_SIZE = 20

function formatDate(iso: string | null) {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function sanitizeLikeQuery(value: string) {
  return value.replace(/[%_,()]/g, ' ').trim()
}

interface Props {
  searchParams: Promise<{
    q?: string
    page?: string
    category?: string
    status?: string
    year?: string
    month?: string
  }>
}

export default async function AdminPostsPage({ searchParams }: Props) {
  const { q, page, category, status, year, month } = await searchParams

  const queryText = q?.trim() ?? ''
  const searchKeyword = sanitizeLikeQuery(queryText)
  const filterCategory = category?.trim() ?? ''
  const filterStatus = status?.trim() ?? ''
  const filterYear = year ? parseInt(year, 10) : null
  const filterMonth = month ? parseInt(month, 10) : null

  const requestedPage = Math.max(1, Number.parseInt(page ?? '1', 10) || 1)
  const supabase = await createClient()

  // 카테고리 목록 (드롭다운용)
  const { data: categoryRows } = await supabase
    .from('posts')
    .select('category')
    .not('category', 'is', null)

  const categories = [
    ...new Set((categoryRows?.map(r => r.category) ?? []).filter(Boolean) as string[]),
  ].sort()

  // 연도 범위 (현재 연도 ~ 2024)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: Math.max(1, currentYear - 2023) }, (_, i) => currentYear - i)

  // 날짜 필터 범위 계산 (published_at 기준)
  let dateStart: Date | null = null
  let dateEnd: Date | null = null
  if (filterYear) {
    if (filterMonth) {
      dateStart = new Date(filterYear, filterMonth - 1, 1)
      dateEnd = new Date(filterYear, filterMonth, 1)
    } else {
      dateStart = new Date(filterYear, 0, 1)
      dateEnd = new Date(filterYear + 1, 0, 1)
    }
  }

  const now = new Date().toISOString()

  // 카운트 쿼리
  let countQuery = supabase.from('posts').select('*', { count: 'exact', head: true })

  // 데이터 쿼리 — 초안(미발행) 먼저, 그 다음 발행일 최신순
  // nullsFirst: false → published_at 없는 초안은 created_at 기준으로 폴백
  let postsQuery = supabase
    .from('posts')
    .select('id, slug, title, category, is_published, is_featured, published_at, scheduled_publish_at, target_year, created_at')
    .order('is_published', { ascending: true })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  // 검색어
  if (searchKeyword) {
    const filter = `title.ilike.%${searchKeyword}%,category.ilike.%${searchKeyword}%,slug.ilike.%${searchKeyword}%`
    countQuery = countQuery.or(filter)
    postsQuery = postsQuery.or(filter)
  }

  // 카테고리 필터
  if (filterCategory) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    countQuery = countQuery.eq('category', filterCategory as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    postsQuery = postsQuery.eq('category', filterCategory as any)
  }

  // 상태 필터
  if (filterStatus === 'draft') {
    countQuery = countQuery.eq('is_published', false).or(`scheduled_publish_at.is.null,scheduled_publish_at.lte.${now}`)
    postsQuery = postsQuery.eq('is_published', false).or(`scheduled_publish_at.is.null,scheduled_publish_at.lte.${now}`)
  } else if (filterStatus === 'scheduled') {
    countQuery = countQuery.eq('is_published', false).not('scheduled_publish_at', 'is', null).gt('scheduled_publish_at', now)
    postsQuery = postsQuery.eq('is_published', false).not('scheduled_publish_at', 'is', null).gt('scheduled_publish_at', now)
  } else if (filterStatus === 'published') {
    countQuery = countQuery.eq('is_published', true)
    postsQuery = postsQuery.eq('is_published', true)
  }

  // 발행일 필터 (published_at 기준)
  if (dateStart && dateEnd) {
    const s = dateStart.toISOString()
    const e = dateEnd.toISOString()
    countQuery = countQuery.gte('published_at', s).lt('published_at', e)
    postsQuery = postsQuery.gte('published_at', s).lt('published_at', e)
  }

  const { count } = await countQuery
  const filteredCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE))
  const currentPage = Math.min(requestedPage, totalPages)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1
  const { data: posts } = await postsQuery.range(from, to)

  const startItem = filteredCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const endItem = filteredCount === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, filteredCount)

  // 적용 중인 필터 설명
  const activeFilters = [
    queryText && `"${queryText}"`,
    filterCategory && filterCategory,
    filterStatus === 'draft' && '초안',
    filterStatus === 'scheduled' && '예약 발행',
    filterStatus === 'published' && '발행됨',
    filterYear && (filterMonth ? `${filterYear}년 ${filterMonth}월` : `${filterYear}년`),
  ].filter(Boolean)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ color: '#1E2D4D' }}>글 관리</h1>
          <div className="flex items-center gap-2">
            <Link href="/admin/posts/import" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
              네이버 글 가져오기
            </Link>
            <Link href="/admin/posts/new" className={buttonVariants({ size: 'sm' })}>
              + 새 글 작성
            </Link>
          </div>
        </div>

        <AdminPostsFilters
          categories={categories}
          years={years}
          currentQ={queryText}
          currentCategory={filterCategory}
          currentStatus={filterStatus}
          currentYear={year ?? ''}
          currentMonth={month ?? ''}
        />

        <div className="flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {activeFilters.length > 0 ? (
              <>
                <span className="font-medium text-gray-900">{activeFilters.join(' · ')}</span> 필터 적용 중
              </>
            ) : (
              '전체 글 목록입니다.'
            )}
          </p>
          <p>
            총 <span className="font-semibold text-gray-900">{filteredCount.toLocaleString('ko-KR')}</span>개 중{' '}
            <span className="font-semibold text-gray-900">
              {startItem}~{endItem}
            </span>
            개를 보고 있습니다.
          </p>
        </div>
      </div>

      {!posts || posts.length === 0 ? (
        <div className="rounded-2xl border p-12 text-center text-sm" style={{ background: '#FBF7EE', borderColor: 'rgba(30,45,77,0.09)', color: '#9a8e7a' }}>
          {activeFilters.length > 0 ? '조건에 맞는 글이 없습니다.' : '작성된 글이 없습니다.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border" style={{ background: '#FBF7EE', borderColor: 'rgba(30,45,77,0.09)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wider" style={{ borderColor: 'rgba(30,45,77,0.09)', background: 'rgba(30,45,77,0.05)', color: '#9a8e7a' }}>
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium">카테고리</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">연도</th>
                <th className="px-4 py-3 font-medium">발행일</th>
                <th className="w-20 px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id} className="border-b transition-colors" style={{ borderColor: 'rgba(30,45,77,0.06)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {post.is_featured ? (
                        <span className="rounded-full px-1.5 py-0.5 text-xs text-white" style={{ background: '#1E2D4D' }}>추천</span>
                      ) : null}
                      <div className="min-w-0">
                        <span className="line-clamp-1 font-medium" style={{ color: '#1E2D4D' }}>{post.title}</span>
                        <p className="mt-1 text-xs" style={{ color: '#9a8e7a' }}>{post.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{post.category}</td>
                  <td className="px-4 py-3">
                    {post.scheduled_publish_at && new Date(post.scheduled_publish_at) > new Date() ? (
                      <span className="text-xs font-medium text-blue-500">예약 발행</span>
                    ) : post.is_published ? (
                      <span className="text-xs font-medium text-green-600">발행됨</span>
                    ) : (
                      <span className="text-xs text-gray-400">초안</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{post.target_year ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(post.published_at ?? post.scheduled_publish_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="text-xs transition-opacity hover:opacity-60" style={{ color: '#4a5673' }}
                    >
                      수정
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredCount > 0 ? (
        <PaginationLinks
          currentPage={currentPage}
          totalPages={totalPages}
          queryText={queryText}
          filterCategory={filterCategory}
          filterStatus={filterStatus}
          filterYear={year ?? ''}
          filterMonth={month ?? ''}
        />
      ) : null}
    </div>
  )
}

function PaginationLinks({
  currentPage,
  totalPages,
  queryText,
  filterCategory,
  filterStatus,
  filterYear,
  filterMonth,
}: {
  currentPage: number
  totalPages: number
  queryText: string
  filterCategory: string
  filterStatus: string
  filterYear: string
  filterMonth: string
}) {
  function buildHref(page: number) {
    const params = new URLSearchParams()
    if (queryText) params.set('q', queryText)
    if (filterCategory) params.set('category', filterCategory)
    if (filterStatus) params.set('status', filterStatus)
    if (filterYear) params.set('year', filterYear)
    if (filterMonth) params.set('month', filterMonth)
    if (page > 1) params.set('page', String(page))
    const qs = params.toString()
    return qs ? `/admin/posts?${qs}` : '/admin/posts'
  }

  return (
    <div className="mt-6 flex items-center justify-between text-sm" style={{ color: '#4a5673' }}>
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage <= 1}
        scroll={false}
        className={[
          'rounded-full border px-4 py-2 transition hover:opacity-70',
          currentPage <= 1 ? 'pointer-events-none opacity-40' : '',
        ].join(' ')}
        style={{ borderColor: 'rgba(30,45,77,0.2)', color: '#4a5673' }}
      >
        이전
      </Link>
      <span className="font-medium" style={{ color: '#1E2D4D' }}>
        {currentPage} / {totalPages}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage >= totalPages}
        scroll={false}
        className={[
          'rounded-full border px-4 py-2 transition hover:opacity-70',
          currentPage >= totalPages ? 'pointer-events-none opacity-40' : '',
        ].join(' ')}
        style={{ borderColor: 'rgba(30,45,77,0.2)', color: '#4a5673' }}
      >
        다음
      </Link>
    </div>
  )
}
