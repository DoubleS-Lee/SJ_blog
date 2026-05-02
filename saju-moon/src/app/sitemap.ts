import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { buildAbsoluteUrl } from '@/lib/seo/site'

const CATEGORY_PATHS = ['연애·궁합', '커리어·이직', '재물·투자', '건강·체질', '육아·자녀교육', '기타']

function applyPublishedVisibilityFilter<T>(query: T, nowIso: string) {
  return (query as { or: (filters: string) => T }).or(`published_at.is.null,published_at.lte.${nowIso}`)
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: buildAbsoluteUrl('/'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: buildAbsoluteUrl('/compatibility'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: buildAbsoluteUrl('/compatibility/today'),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: buildAbsoluteUrl('/compatibility/month'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: buildAbsoluteUrl('/compatibility/year'),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: buildAbsoluteUrl('/taekil'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: buildAbsoluteUrl('/interpretation'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: buildAbsoluteUrl('/manseryeok'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: buildAbsoluteUrl('/counsel'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: buildAbsoluteUrl('/privacy'),
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    ...CATEGORY_PATHS.map((category) => ({
      url: buildAbsoluteUrl(`/?category=${encodeURIComponent(category)}`),
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.7,
    })),
  ]

  const { data: posts } = await applyPublishedVisibilityFilter(
    supabase
      .from('posts')
      .select('slug, published_at, updated_at')
      .eq('is_published', true)
      .order('published_at', { ascending: false }),
    now.toISOString(),
  )

  const postRoutes: MetadataRoute.Sitemap =
    posts?.map((post) => ({
      url: buildAbsoluteUrl(`/posts/${post.slug}`),
      lastModified: post.updated_at ?? post.published_at ?? now.toISOString(),
      changeFrequency: 'weekly',
      priority: 0.9,
    })) ?? []

  return [...staticRoutes, ...postRoutes]
}
