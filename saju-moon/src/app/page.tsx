import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import FeaturedCard from '@/components/blog/FeaturedCard'
import PostCard from '@/components/blog/PostCard'
import CategoryFilter from '@/components/blog/CategoryFilter'
import Pagination from '@/components/blog/Pagination'
import { buildAbsoluteUrl, SITE_NAME } from '@/lib/seo/site'

const PAGE_SIZE = 10
const VALID_CATEGORIES = ['연애·궁합', '커리어·이직', '재물·투자', '건강·체질', '육아·자녀교육', '기타'] as const
type Category = (typeof VALID_CATEGORIES)[number]

const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  '연애·궁합': '연애 흐름, 궁합, 관계 해석처럼 감정과 인연에 관한 사주 콘텐츠를 모아봅니다.',
  '커리어·이직': '직장, 이직, 커리어 방향과 관련한 사주 해석 콘텐츠를 한눈에 살펴볼 수 있습니다.',
  '재물·투자': '재물운, 투자 감각, 돈의 흐름과 연결되는 사주 콘텐츠를 모아둡니다.',
  '건강·체질': '건강운과 체질, 컨디션 관리에 도움이 되는 사주 콘텐츠를 확인할 수 있습니다.',
  '육아·자녀교육': '자녀 성향, 교육 방향, 육아 고민과 연결되는 사주 콘텐츠를 모아봅니다.',
  기타: '일상 속 다양한 사주 이야기와 해석 콘텐츠를 폭넓게 살펴볼 수 있습니다.',
}

interface Props {
  searchParams: Promise<{ category?: string; page?: string; q?: string }>
}

function normalizeSearchQuery(raw?: string) {
  return raw?.trim() ?? ''
}

function sanitizeLikeQuery(value: string) {
  return value.replace(/[%_,()]/g, ' ').trim()
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { category, page, q } = await searchParams
  const currentPage = Math.max(1, parseInt(page ?? '1'))
  const validCategory = VALID_CATEGORIES.includes(category as Category) ? (category as Category) : undefined
  const queryText = normalizeSearchQuery(q)

  const titleBase = validCategory ? `${validCategory} 블로그` : '블로그'
  const pageTitle = currentPage > 1 ? `${titleBase} ${currentPage}페이지` : titleBase
  const title = queryText ? `${queryText} 검색 결과 | ${pageTitle}` : pageTitle
  const description = queryText
    ? `'${queryText}' 검색 결과를 모아봤습니다. 사주 해석과 궁합, 재물운, 건강운 관련 글을 빠르게 찾아보세요.`
    : validCategory
      ? CATEGORY_DESCRIPTIONS[validCategory]
      : '사주 해석과 궁합, 재물운, 건강운 등 다양한 주제를 블로그 글로 엮어보고 있습니다.'

  const query = new URLSearchParams()
  if (validCategory) query.set('category', validCategory)
  if (queryText) query.set('q', queryText)
  if (currentPage > 1) query.set('page', String(currentPage))
  const canonicalPath = query.size > 0 ? `/?${query.toString()}` : '/'

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url: buildAbsoluteUrl(canonicalPath),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
    },
  }
}

export default async function BlogListPage({ searchParams }: Props) {
  const { category, page, q } = await searchParams
  const currentPage = Math.max(1, parseInt(page ?? '1'))
  const queryText = normalizeSearchQuery(q)
  const searchKeyword = sanitizeLikeQuery(queryText)
  const supabase = await createClient()

  const { data: featured } = await supabase
    .from('posts')
    .select('slug, title, summary, thumbnail_url, category, published_at, target_year, view_count, like_count')
    .eq('is_published', true)
    .eq('is_featured', true)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  let query = supabase
    .from('posts')
    .select('slug, title, summary, thumbnail_url, category, published_at, target_year, view_count, like_count', {
      count: 'exact',
    })
    .eq('is_published', true)
    .lte('published_at', new Date().toISOString())

  const validCategory = VALID_CATEGORIES.includes(category as Category) ? (category as Category) : undefined
  if (validCategory) query = query.eq('category', validCategory)
  if (searchKeyword) {
    query = query.or(`title.ilike.%${searchKeyword}%,summary.ilike.%${searchKeyword}%`)
  }

  const from = (currentPage - 1) * PAGE_SIZE
  const { data: posts, count } = await query
    .order('published_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-10 flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight">블로그</h1>
          <CategoryFilter />
        </div>

        <form action="/" method="get" className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center">
          {validCategory ? <input type="hidden" name="category" value={validCategory} /> : null}
          <input
            type="text"
            name="q"
            defaultValue={queryText}
            placeholder="제목이나 요약으로 글 검색"
            className="h-11 flex-1 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition focus:border-black"
          />
          <div className="flex gap-2">
            <button type="submit" className="inline-flex h-11 items-center justify-center rounded-2xl bg-black px-5 text-sm font-medium text-white transition hover:bg-gray-800">
              검색
            </button>
            {queryText ? (
              <a
                href={validCategory ? `/?category=${encodeURIComponent(validCategory)}` : '/'}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-gray-200 px-5 text-sm font-medium text-gray-600 transition hover:border-gray-400 hover:text-black"
              >
                초기화
              </a>
            ) : null}
          </div>
        </form>

        {queryText ? (
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">'{queryText}'</span> 검색 결과입니다.
          </p>
        ) : null}
      </div>

      {featured && !validCategory && currentPage === 1 && !queryText && (
        <section className="mb-12">
          <FeaturedCard post={featured} />
        </section>
      )}

      {posts && posts.length > 0 ? (
        <section>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ) : (
        <div className="py-20 text-center text-sm text-gray-400">
          {queryText
            ? `'${queryText}'와 관련된 글이 아직 없습니다.`
            : validCategory
              ? `'${validCategory}' 카테고리의 글이 아직 없습니다.`
              : '아직 발행된 글이 없습니다.'}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-12">
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      )}
    </div>
  )
}
