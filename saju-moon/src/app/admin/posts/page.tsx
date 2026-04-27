import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'

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
  searchParams: Promise<{ q?: string; page?: string }>
}

export default async function AdminPostsPage({ searchParams }: Props) {
  const { q, page } = await searchParams
  const queryText = q?.trim() ?? ''
  const searchKeyword = sanitizeLikeQuery(queryText)
  const requestedPage = Math.max(1, Number.parseInt(page ?? '1', 10) || 1)
  const supabase = await createClient()

  let countQuery = supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })

  let postsQuery = supabase
    .from('posts')
    .select('id, slug, title, category, is_published, is_featured, published_at, target_year, created_at')
    .order('created_at', { ascending: false })

  if (searchKeyword) {
    const filter = `title.ilike.%${searchKeyword}%,category.ilike.%${searchKeyword}%,slug.ilike.%${searchKeyword}%`
    countQuery = countQuery.or(filter)
    postsQuery = postsQuery.or(filter)
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">글 관리</h1>
          <Link href="/admin/posts/new" className={buttonVariants({ size: 'sm' })}>
            + 새 글 작성
          </Link>
        </div>

        <form
          action="/admin/posts"
          method="get"
          className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <input
            type="text"
            name="q"
            defaultValue={queryText}
            placeholder="제목, 카테고리, slug로 검색"
            className="h-11 flex-1 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition focus:border-black"
          />
          <div className="flex gap-2">
            <button type="submit" className={buttonVariants()}>
              검색
            </button>
            {queryText ? (
              <Link href="/admin/posts" className={buttonVariants({ variant: 'outline' })}>
                초기화
              </Link>
            ) : null}
          </div>
        </form>

        <div className="flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {queryText ? (
              <>
                <span className="font-medium text-gray-900">'{queryText}'</span> 검색 결과입니다.
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
        <div className="rounded-lg border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
          {queryText ? '검색된 글이 없습니다.' : '작성된 글이 없습니다.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium">카테고리</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">연도</th>
                <th className="px-4 py-3 font-medium">발행일</th>
                <th className="w-20 px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-gray-50 transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {post.is_featured ? (
                        <span className="rounded bg-black px-1.5 py-0.5 text-xs text-white">추천</span>
                      ) : null}
                      <div className="min-w-0">
                        <span className="line-clamp-1 font-medium">{post.title}</span>
                        <p className="mt-1 text-xs text-gray-400">{post.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{post.category}</td>
                  <td className="px-4 py-3">
                    {post.is_published && post.published_at && new Date(post.published_at) > new Date() ? (
                      <span className="text-xs font-medium text-blue-500">예약 발행</span>
                    ) : post.is_published ? (
                      <span className="text-xs font-medium text-green-600">발행됨</span>
                    ) : (
                      <span className="text-xs text-gray-400">초안</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{post.target_year ?? '-'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(post.published_at)}</td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/posts/${post.id}`} className="text-xs text-gray-500 transition-colors hover:text-black">
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
        <PaginationLinks currentPage={currentPage} totalPages={totalPages} queryText={queryText} />
      ) : null}
    </div>
  )
}

function PaginationLinks({
  currentPage,
  totalPages,
  queryText,
}: {
  currentPage: number
  totalPages: number
  queryText: string
}) {
  const buildHref = (page: number) => {
    const params = new URLSearchParams()
    if (queryText) params.set('q', queryText)
    if (page > 1) params.set('page', String(page))
    const query = params.toString()
    return query ? `/admin/posts?${query}` : '/admin/posts'
  }

  return (
    <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage <= 1}
        scroll={false}
        className={[
          'rounded-full border border-gray-200 px-4 py-2 transition hover:border-black hover:text-black',
          currentPage <= 1 ? 'pointer-events-none opacity-40' : '',
        ].join(' ')}
      >
        이전
      </Link>
      <span className="font-medium text-gray-700">
        {currentPage} / {totalPages}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage >= totalPages}
        scroll={false}
        className={[
          'rounded-full border border-gray-200 px-4 py-2 transition hover:border-black hover:text-black',
          currentPage >= totalPages ? 'pointer-events-none opacity-40' : '',
        ].join(' ')}
      >
        다음
      </Link>
    </div>
  )
}
