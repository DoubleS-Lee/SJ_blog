import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase/admin'

export const PUBLIC_POST_PAGE_SIZE = 12
const PUBLIC_POST_LIST_SELECT =
  'slug, title, summary, thumbnail_url, category, published_at, target_year, view_count, like_count'

export function getPublicPostsVisibilityIso() {
  const now = new Date()
  now.setSeconds(0, 0)
  return now.toISOString()
}

const getFeaturedPostCached = unstable_cache(
  async (nowIso: string) => {
    const { data } = await supabaseAdmin
      .from('posts')
      .select(PUBLIC_POST_LIST_SELECT)
      .eq('is_published', true)
      .eq('is_featured', true)
      .or(`published_at.is.null,published_at.lte.${nowIso}`)
      .order('published_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    return data
  },
  ['public-featured-post'],
  {
    tags: ['posts'],
    revalidate: 60,
  },
)

const getPublicPostsPageCached = unstable_cache(
  async (category: string | null, searchKeyword: string, currentPage: number, nowIso: string) => {
    let query = supabaseAdmin
      .from('posts')
      .select(PUBLIC_POST_LIST_SELECT, { count: 'exact' })
      .eq('is_published', true)
      .or(`published_at.is.null,published_at.lte.${nowIso}`)

    if (category) {
      query = query.filter('category', 'eq', category)
    }

    if (searchKeyword) {
      query = query.or(`title.ilike.%${searchKeyword}%,summary.ilike.%${searchKeyword}%`)
    }

    const from = (currentPage - 1) * PUBLIC_POST_PAGE_SIZE
    const { data, count } = await query
      .order('published_at', { ascending: false })
      .range(from, from + PUBLIC_POST_PAGE_SIZE)

    const posts = data ?? []
    const totalCount = count ?? 0
    const totalPages = Math.max(1, Math.ceil(totalCount / PUBLIC_POST_PAGE_SIZE))

    return {
      posts: posts.slice(0, PUBLIC_POST_PAGE_SIZE),
      hasNextPage: posts.length > PUBLIC_POST_PAGE_SIZE,
      totalPages,
    }
  },
  ['public-posts-page'],
  {
    tags: ['posts'],
    revalidate: 60,
  },
)

export async function getCachedFeaturedPost(nowIso: string) {
  return getFeaturedPostCached(nowIso)
}

export async function getCachedPublicPostsPage(
  category: string | undefined,
  searchKeyword: string,
  currentPage: number,
  nowIso: string,
) {
  return getPublicPostsPageCached(category ?? null, searchKeyword, currentPage, nowIso)
}
