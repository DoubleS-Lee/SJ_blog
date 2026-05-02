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

export default function PostCard({ post }: { post: Post }) {
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
      properties={{ list_context: 'post_grid' }}
    >
      <div className="relative mb-4 aspect-square overflow-hidden bg-zinc-900">
        {post.thumbnail_url ? (
          <Image
            src={post.thumbnail_url}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-opacity group-hover:opacity-90"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="select-none text-3xl opacity-20">SAJU</span>
          </div>
        )}

        {post.target_year && (
          <span className="absolute left-2 top-2 rounded bg-white/90 px-2 py-0.5 text-xs font-medium">
            {post.target_year}년 기준
          </span>
        )}
      </div>

      <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
        {post.category}
      </span>

      <h3 className="mt-1.5 line-clamp-2 text-base font-bold leading-snug underline-offset-4 group-hover:underline">
        {post.title}
      </h3>

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs text-gray-400">{formatDate(post.published_at)}</p>
        <p className="text-[11px] text-gray-400">
          조회 {formatCount(post.view_count)} · 좋아요 {formatCount(post.like_count)}
        </p>
      </div>
    </TrackedLink>
  )
}
