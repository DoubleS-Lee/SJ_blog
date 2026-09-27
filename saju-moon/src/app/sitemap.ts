import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { buildAbsoluteUrl } from '@/lib/seo/site'
import { POST_CATEGORIES } from '@/lib/posts/categories'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const nowIso = new Date().toISOString()
  const { data: posts, error } = await supabase
    .from('posts')
    .select('slug, category, published_at, updated_at')
    .eq('is_published', true)
    .or(`published_at.is.null,published_at.lte.${nowIso}`)
    .order('published_at', { ascending: false })

  // Do not cache an incomplete sitemap if the database is temporarily unavailable.
  if (error) throw new Error(`[sitemap] failed to load posts: ${error.message}`)

  const publicRoutes: MetadataRoute.Sitemap = [
    { url: buildAbsoluteUrl('/'), changeFrequency: 'daily', priority: 1 },
    ...['/about', '/contact', '/counsel', '/privacy', '/terms'].map((path) => ({
      url: buildAbsoluteUrl(path),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    })),
  ]
  const populatedCategories = new Set(posts?.map((post) => post.category))
  const categoryRoutes: MetadataRoute.Sitemap = POST_CATEGORIES
    .filter((category) => populatedCategories.has(category))
    .map((category) => ({
      url: buildAbsoluteUrl(`/?category=${encodeURIComponent(category)}`),
      changeFrequency: 'weekly',
      priority: 0.6,
    }))
  const postRoutes: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: buildAbsoluteUrl(`/posts/${post.slug}`),
    lastModified: post.updated_at ?? post.published_at ?? undefined,
    changeFrequency: 'weekly',
    priority: 0.9,
  }))

  return [...publicRoutes, ...categoryRoutes, ...postRoutes]
}
