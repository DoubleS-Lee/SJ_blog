import { createClient } from '@/lib/supabase/server'
import FeaturedCard from '@/components/blog/FeaturedCard'
import PostCard from '@/components/blog/PostCard'
import CategoryFilter from '@/components/blog/CategoryFilter'
import Pagination from '@/components/blog/Pagination'
import { judgePost, type JudgmentUserData } from '@/lib/saju/judgment'
import type { JudgmentRules } from '@/types/judgment'

const PAGE_SIZE = 10

interface Props {
  searchParams: Promise<{ category?: string; page?: string }>
}

export default async function BlogListPage({ searchParams }: Props) {
  const { category, page } = await searchParams
  const currentPage = Math.max(1, parseInt(page ?? '1'))
  const supabase = await createClient()

  // 로그인 사용자 확인
  const { data: { user } } = await supabase.auth.getUser()

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
    .select('slug, title, summary, thumbnail_url, category, published_at, target_year, judgment_rules', { count: 'exact' })
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

  // 로그인 회원 사주 데이터 (판정 뱃지용)
  let userData: JudgmentUserData | null = null
  if (user) {
    const [sajuRes, ohangRes, sipsungRes] = await Promise.all([
      supabase.from('user_saju')
        .select('year_cheongan,year_jiji,month_cheongan,month_jiji,day_cheongan,day_jiji,hour_cheongan,hour_jiji,year_ganji,month_ganji,day_ganji,hour_ganji,ilgan,full_saju_data')
        .eq('user_id', user.id).single(),
      supabase.from('user_saju_ohang')
        .select('mok_score,hwa_score,to_score,geum_score,su_score,has_mok,has_hwa,has_to,has_geum,has_su')
        .eq('user_id', user.id).single(),
      supabase.from('user_saju_sipsung')
        .select('bigyeon_score,gyeopjae_score,sikshin_score,sanggwan_score,pyeonjae_score,jeongjae_score,pyeongwan_score,jeonggwan_score,pyeonin_score,jeongin_score,has_bigyeon,has_gyeopjae,has_sikshin,has_sanggwan,has_pyeonjae,has_jeongjae,has_pyeongwan,has_jeonggwan,has_pyeonin,has_jeongin')
        .eq('user_id', user.id).single(),
    ])
    if (sajuRes.data && ohangRes.data && sipsungRes.data) {
      userData = {
        ...sajuRes.data,
        ...ohangRes.data,
        ...sipsungRes.data,
        full_saju_data: sajuRes.data.full_saju_data as Record<string, unknown>,
      } as unknown as JudgmentUserData
    }
  }

  // 각 포스트 판정 계산
  function getJudgment(post: { judgment_rules?: unknown; target_year?: number | null }): 'match' | 'no_match' | undefined {
    if (!userData || !post.judgment_rules) return undefined
    const result = judgePost(post.judgment_rules as JudgmentRules, userData, post.target_year)
    if (result === null) return undefined
    return result ? 'match' : 'no_match'
  }

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
              <PostCard key={post.slug} post={{ ...post, judgment: getJudgment(post) }} />
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
