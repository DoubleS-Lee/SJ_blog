import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { buttonVariants } from '@/components/ui/button'

export const metadata = { title: '글 관리' }

function formatDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default async function AdminPostsPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts')
    .select('id, slug, title, category, is_published, is_featured, published_at, target_year, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">글 관리</h1>
        <Link href="/admin/posts/new" className={buttonVariants({ size: 'sm' })}>
          + 새 글 작성
        </Link>
      </div>

      {!posts || posts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-100 p-12 text-center text-sm text-gray-400">
          작성된 글이 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium">카테고리</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">연도</th>
                <th className="px-4 py-3 font-medium">발행일</th>
                <th className="px-4 py-3 font-medium w-20"></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {post.is_featured && (
                        <span className="text-xs bg-black text-white px-1.5 py-0.5 rounded">피처드</span>
                      )}
                      <span className="font-medium line-clamp-1">{post.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{post.category}</td>
                  <td className="px-4 py-3">
                    {post.is_published && post.published_at && new Date(post.published_at) > new Date() ? (
                      <span className="text-xs text-blue-500 font-medium">예약됨</span>
                    ) : post.is_published ? (
                      <span className="text-xs text-green-600 font-medium">발행됨</span>
                    ) : (
                      <span className="text-xs text-gray-400">초안</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {post.target_year ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {formatDate(post.published_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="text-xs text-gray-500 hover:text-black transition-colors"
                    >
                      수정
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
