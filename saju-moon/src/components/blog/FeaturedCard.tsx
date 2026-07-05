import Image from 'next/image'
import TrackedLink from '@/components/analytics/TrackedLink'
import { StarMark } from '@/components/ui/StarMark'
import { CardCorners } from '@/components/ui/CardCorners'

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
      className="group relative block overflow-hidden rounded-2xl border p-4 transition-all hover:shadow-sm md:border-0 md:bg-transparent md:p-0 md:shadow-none"
      style={{ borderColor: 'rgba(30,45,77,0.09)', background: '#FBF7EE' }}
      eventName="content_click"
      pageType="blog_list"
      contentType="blog_post"
      contentId={post.slug}
      contentTitle={post.title}
      category={post.category}
      properties={{ list_context: 'featured_card' }}
    >
      <CardCorners />
      <div className="flex items-start gap-3 md:flex-row md:items-stretch md:gap-8">
        <div
          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl md:h-90 md:w-[42%] md:rounded-2xl"
          style={{ background: '#EDE5D5' }}
        >
          {post.thumbnail_url ? (
            <Image
              src={post.thumbnail_url}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 96px, 40vw"
              className="object-cover transition-opacity group-hover:opacity-90 md:object-contain"
            />
          ) : (
            <>
              <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 44%,#FCF8EF 0%,#F1E9D8 55%,transparent 74%)' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <StarMark size={22} color="#C4A24E" />
              </div>
            </>
          )}

          {post.target_year && (
            <span
              className="absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-medium md:left-4 md:top-4 md:px-2 md:text-[10px]"
              style={{ background: 'rgba(246,239,227,0.92)', color: '#8a6d28' }}
            >
              {post.target_year}년 기준
            </span>
          )}
        </div>

        <div className="flex min-h-24 min-w-0 flex-1 flex-col justify-between md:w-[58%] md:py-4">
          <span
            className="mb-1 text-[11px] tracking-wide md:mb-3 md:text-xs"
            style={{ color: '#C4A24E', fontFamily: 'var(--font-cormorant-garamond), serif', fontWeight: 500 }}
          >
            {post.category}
          </span>

          <h2
            className="line-clamp-2 text-base leading-snug tracking-tight underline-offset-4 group-hover:underline md:mb-4 md:text-3xl md:line-clamp-none"
            style={{ color: '#1E2D4D', fontFamily: 'var(--font-nanum-myeongjo), serif', fontWeight: 700 }}
          >
            {post.title}
          </h2>

          {post.summary ? (
            <p className="hidden text-sm leading-7 md:mb-6 md:block md:line-clamp-4" style={{ color: '#4a5673' }}>
              {post.summary}
            </p>
          ) : null}

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] md:mt-0 md:text-xs" style={{ color: '#9a8e7a' }}>
            <p>{formatDate(post.published_at)}</p>
            <p>조회 {formatCount(post.view_count)}</p>
            <p>좋아요 {formatCount(post.like_count)}</p>
          </div>
        </div>
      </div>
    </TrackedLink>
  )
}
