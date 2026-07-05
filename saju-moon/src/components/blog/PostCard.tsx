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

export default function PostCard({ post }: { post: Post }) {
  return (
    <TrackedLink
      href={`/posts/${post.slug}`}
      className="group relative block rounded-2xl border p-4 transition-all hover:shadow-sm md:rounded-none md:border-0 md:bg-transparent md:p-0 md:shadow-none"
      style={{ borderColor: 'rgba(30,45,77,0.09)', background: '#FBF7EE' }}
      eventName="content_click"
      pageType="blog_list"
      contentType="blog_post"
      contentId={post.slug}
      contentTitle={post.title}
      category={post.category}
      properties={{ list_context: 'post_grid' }}
    >
      <CardCorners />
      <div className="flex items-start gap-3 md:block">
        <div
          className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl md:mb-4 md:aspect-square md:h-auto md:w-full md:rounded-2xl"
          style={{ background: '#EDE5D5' }}
        >
          {post.thumbnail_url ? (
            <Image
              src={post.thumbnail_url}
              alt={post.title}
              fill
              sizes="(max-width: 768px) 96px, 33vw"
              className="object-cover transition-opacity group-hover:opacity-90"
            />
          ) : (
            <>
              <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 44%,#FCF8EF 0%,#F1E9D8 55%,transparent 74%)' }} />
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
                <StarMark size={14} color="#C4A24E" />
              </div>
            </>
          )}

          {post.target_year && (
            <span
              className="absolute left-1.5 top-1.5 rounded px-1.5 py-0.5 text-[9px] font-medium md:left-2 md:top-2 md:px-2 md:text-[10px]"
              style={{ background: 'rgba(246,239,227,0.92)', color: '#8a6d28' }}
            >
              {post.target_year}년 기준
            </span>
          )}
        </div>

        <div className="flex min-h-24 min-w-0 flex-1 flex-col justify-between">
          <span
            className="text-[11px] tracking-wide"
            style={{ color: '#C4A24E', fontFamily: 'var(--font-cormorant-garamond), serif', fontWeight: 500 }}
          >
            {post.category}
          </span>

          <h3
            className="mt-1 line-clamp-2 text-base leading-snug underline-offset-4 group-hover:underline md:text-base"
            style={{ color: '#1E2D4D', fontFamily: 'var(--font-nanum-myeongjo), serif', fontWeight: 700 }}
          >
            {post.title}
          </h3>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]" style={{ color: '#9a8e7a' }}>
            <p>{formatDate(post.published_at)}</p>
            <p>조회 {formatCount(post.view_count)}</p>
            <p>좋아요 {formatCount(post.like_count)}</p>
          </div>
        </div>
      </div>
    </TrackedLink>
  )
}
