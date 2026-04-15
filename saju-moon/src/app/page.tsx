import { createClient } from '@/lib/supabase/server'
import FeaturedCard from '@/components/blog/FeaturedCard'
import PostCard from '@/components/blog/PostCard'
import CategoryFilter from '@/components/blog/CategoryFilter'
import Pagination from '@/components/blog/Pagination'

const PAGE_SIZE = 10

interface Props {
  searchParams: Promise<{ category?: string; page?: string }>
}

export default async function BlogListPage({ searchParams }: Props) {
  const { category, page } = await searchParams
  const currentPage = Math.max(1, parseInt(page ?? '1'))
  const supabase = await createClient()

  // 피처드 글 (발행됨 + is_featured)
  const { data: featured } = await supabase
    .from('posts')
    .select('slug, title, summary, thumbnail_url, category, published_at, target_year')
    .eq('is_published', true)
    .eq('is_featured', true)
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // 일반 글 목록 (페이지네이션)
  let query = supabase
    .from('posts')
    .select('slug, title, summary, thumbnail_url, category, published_at, target_year', { count: 'exact' })
    .eq('is_published', true)
    .lte('published_at', new Date().toISOString())

  const VALID_CATEGORIES = ['연애·궁합', '커리어·이직', '재물·투자', '건강·체질', '육아·자녀교육', '기타'] as const
  type Category = typeof VALID_CATEGORIES[number]
  const validCategory = VALID_CATEGORIES.includes(category as Category) ? (category as Category) : undefined
  if (validCategory) query = query.eq('category', validCategory)

  const from = (currentPage - 1) * PAGE_SIZE
  const { data: posts, count } = await query
    .order('published_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE)


  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      {/* 페이지 타이틀 + 필터 */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <h1 className="text-3xl font-bold tracking-tight">사주 Moon 블로그</h1>
        <CategoryFilter />
      </div>

      {/* 피처드 카드 */}
      {featured && !category && currentPage === 1 && (
        <section className="mb-12">
          <FeaturedCard post={featured} />
        </section>
      )}

      {/* 포스트 그리드 (3열) */}
      {posts && posts.length > 0 ? (
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-20 text-gray-400 text-sm">
          {category ? `'${category}' 카테고리의 글이 없습니다.` : '아직 발행된 글이 없습니다.'}
        </div>
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="mt-12">
          <Pagination currentPage={currentPage} totalPages={totalPages} />
        </div>
      )}
    </div>
  )
}
