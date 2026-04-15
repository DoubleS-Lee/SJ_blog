import Link from 'next/link'
import Image from 'next/image'

interface Post {
  slug: string
  title: string
  summary: string | null
  thumbnail_url: string | null
  category: string
  published_at: string | null
  target_year: number | null
}

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function PostCard({ post }: { post: Post }) {
  return (
    <Link href={`/posts/${post.slug}`} className="group block">
      {/* 썸네일 */}
      <div className="relative aspect-square bg-zinc-900 mb-4 overflow-hidden">
        {post.thumbnail_url ? (
          <Image
            src={post.thumbnail_url}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover group-hover:opacity-90 transition-opacity"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl opacity-20 select-none">☽</span>
          </div>
        )}
        {/* 연도 뱃지 */}
        {post.target_year && (
          <span className="absolute top-2 left-2 bg-white/90 text-xs font-medium px-2 py-0.5 rounded">
            {post.target_year}년 기준
          </span>
        )}

      </div>

      {/* 메타 */}
      <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
        {post.category}
      </span>

      {/* 제목 */}
      <h3 className="mt-1.5 text-base font-bold leading-snug group-hover:underline underline-offset-4 line-clamp-2">
        {post.title}
      </h3>

      {/* 날짜 */}
      <p className="mt-2 text-xs text-gray-400">
        {formatDate(post.published_at)}
      </p>
    </Link>
  )
}
