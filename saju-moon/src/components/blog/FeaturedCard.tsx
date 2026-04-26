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
      <div className="flex flex-col md:flex-row gap-0 overflow-hidden">
        {/* 이미지 (40%) */}
        <div className="relative w-full md:w-[40%] aspect-square bg-zinc-900 shrink-0 self-start">
          {post.thumbnail_url ? (
            <Image
              src={post.thumbnail_url}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover group-hover:opacity-90 transition-opacity"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-4xl opacity-20 select-none">☽</span>
            </div>
          )}
          {post.target_year && (
            <span className="absolute top-3 left-3 bg-white/90 text-xs font-medium px-2 py-0.5 rounded">
              {post.target_year}년 기준
            </span>
          )}
        </div>

        {/* 텍스트 (60%) */}
        <div className="flex flex-col justify-center md:w-[60%] px-0 md:px-10 py-6 md:py-0">
          <span className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">
            {post.category}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold leading-snug tracking-tight mb-4 group-hover:underline underline-offset-4">
            {post.title}
          </h2>
          {post.summary && (
            <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
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
