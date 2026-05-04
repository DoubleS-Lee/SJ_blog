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
      className="group block overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:border-0 md:bg-transparent md:p-0 md:shadow-none"
      eventName="content_click"
      pageType="blog_list"
      contentType="blog_post"
      contentId={post.slug}
      contentTitle={post.title}
      category={post.category}
      properties={{ list_context: 'featured_card' }}
    >
      <div className="flex items-start gap-3 md:flex-row md:items-stretch md:gap-8">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-900 md:h-[360px] md:w-[42%] md:rounded-3xl md:bg-[#f7f3ea]">
          {post.thumbnail_url ? (
            <Image
              src={post.thumbnail_url}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 96px, 40vw"
              className="object-cover transition-opacity group-hover:opacity-90 md:object-contain"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="select-none text-xl opacity-20 md:text-4xl">SAJU</span>
            </div>
          )}

          {post.target_year && (
            <span className="absolute left-1.5 top-1.5 rounded bg-white/90 px-1.5 py-0.5 text-[9px] font-medium md:left-4 md:top-4 md:px-2 md:text-xs">
              {post.target_year}년 기준
            </span>
          )}
        </div>

        <div className="flex min-h-24 min-w-0 flex-1 flex-col justify-between md:w-[58%] md:py-4">
          <span className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-400 md:mb-3 md:text-xs">
            {post.category}
          </span>

          <h2 className="line-clamp-2 text-base font-bold leading-snug tracking-tight underline-offset-4 group-hover:underline md:mb-4 md:text-3xl md:line-clamp-none">
            {post.title}
          </h2>

          {post.summary ? (
            <p className="hidden text-sm leading-7 text-gray-500 md:mb-6 md:block md:line-clamp-4">
              {post.summary}
            </p>
          ) : null}

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-400 md:mt-0 md:text-xs">
            <p>{formatDate(post.published_at)}</p>
            <p>조회 {formatCount(post.view_count)}</p>
            <p>좋아요 {formatCount(post.like_count)}</p>
          </div>
        </div>
      </div>
    </TrackedLink>
  )
}
