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
      className="group block rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none"
      eventName="content_click"
      pageType="blog_list"
      contentType="blog_post"
      contentId={post.slug}
      contentTitle={post.title}
      category={post.category}
      properties={{ list_context: 'post_grid' }}
    >
      <div className="flex items-start gap-3 md:block">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-900 md:mb-4 md:h-auto md:w-full md:rounded-none md:aspect-square">
          {post.thumbnail_url ? (
            <Image
              src={post.thumbnail_url}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 96px, 33vw"
              className="object-cover transition-opacity group-hover:opacity-90"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="select-none text-xl opacity-20 md:text-3xl">SAJU</span>
            </div>
          )}

          {post.target_year && (
            <span className="absolute left-1.5 top-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-medium md:left-2 md:top-2 md:px-2 md:text-xs">
              {post.target_year}년 기준
            </span>
          )}
        </div>

        <div className="flex min-h-24 min-w-0 flex-1 flex-col justify-between">
          <span className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            {post.category}
          </span>

          <h3 className="mt-1 line-clamp-2 text-base font-bold leading-snug underline-offset-4 group-hover:underline md:text-base">
            {post.title}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400">
            <p>{formatDate(post.published_at)}</p>
            <p>조회 {formatCount(post.view_count)}</p>
            <p>좋아요 {formatCount(post.like_count)}</p>
          </div>
        </div>
      </div>
    </TrackedLink>
  )
}
