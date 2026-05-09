import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PostForm from '@/components/editor/PostForm'
import type { JSONContent } from '@tiptap/react'
import type { PostFormData } from '@/actions/savePost'
import type { JudgmentRules } from '@/types/judgment'

export const metadata = { title: '글 수정' }

interface Props {
  params: Promise<{ id: string }>
  searchParams: Promise<{ importWarning?: string; imported?: string }>
}

export default async function EditPostPage({ params, searchParams }: Props) {
  const { id } = await params
  const { importWarning, imported } = await searchParams
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('id, title, summary, thumbnail_url, category, content, judgment_rules, target_year, is_featured, is_published, published_at, tags')
    .eq('id', id)
    .single()

  if (!post) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-xl font-bold">글 수정</h1>
      {importWarning ? (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {importWarning}
        </div>
      ) : imported ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          네이버 글을 초안으로 가져왔습니다. 필요한 부분만 다듬어 발행해 주세요.
        </div>
      ) : null}
      <PostForm
        initialData={{
          id: post.id,
          title: post.title,
          summary: post.summary,
          thumbnail_url: post.thumbnail_url,
          category: post.category as PostFormData['category'],
          content: post.content as JSONContent,
          judgment_rules: post.judgment_rules as JudgmentRules | null,
          target_year: post.target_year,
          is_featured: post.is_featured,
          is_published: post.is_published,
          published_at: post.published_at,
          tags: post.tags,
        }}
      />
    </div>
  )
}
