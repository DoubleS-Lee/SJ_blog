import Image from 'next/image'
import TrackedLink from '@/components/analytics/TrackedLink'

interface Post {
  slug: string
  title: string
  summary: string | null
  thumbnail_url: string | null
  category: string
  published_at: string | null
  target_year: number | null
  view_count: number | null
  like_count: number | null
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatCount(value: number | null) {
  return (value ?? 0).toLocaleString('ko-KR')
}

export default function FeaturedCard({ post }: { post: Post }) {
  return (
    <TrackedLink
      href={`/posts/${post.slug}`}
      className="group block"
      eventName="content_click"
      pageType="blog_list"
      contentType="blog_post"
      contentId={post.slug}
      contentTitle={post.title}
      category={post.category}
      properties={{ list_context: 'featured_card' }}
    >
      <div className="flex flex-col gap-0 overflow-hidden md:flex-row">
        <div className="relative aspect-square w-full shrink-0 self-start bg-zinc-900 md:w-[40%]">
          {post.thumbnail_url ? (
            <Image
              src={post.thumbnail_url}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover transition-opacity group-hover:opacity-90"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="select-none text-4xl opacity-20">SAJU</span>
            </div>
          )}

          {post.target_year && (
            <span className="absolute left-3 top-3 rounded bg-white/90 px-2 py-0.5 text-xs font-medium">
              {post.target_year}년 기준
            </span>
          )}
        </div>

        <div className="flex flex-col justify-center px-0 py-6 md:w-[60%] md:px-10 md:py-0">
          <span className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-400">
            {post.category}
          </span>
          <h2 className="mb-4 text-2xl font-bold leading-snug tracking-tight underline-offset-4 group-hover:underline md:text-3xl">
            {post.title}
          </h2>
          {post.summary && (
            <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-500">
              {post.summary}
            </p>
          )}
          <div className="flex items-center justify-between gap-2 text-xs text-gray-400">
            <p>{formatDate(post.published_at)}</p>
            <p className="text-[11px]">
              조회 {formatCount(post.view_count)} · 좋아요 {formatCount(post.like_count)}
            </p>
          </div>
        </div>
      </div>
    </TrackedLink>
  )
}
