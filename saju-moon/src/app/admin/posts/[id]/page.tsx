import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import PostForm from '@/components/editor/PostForm'
import type { JSONContent } from '@tiptap/react'
import type { PostFormData } from '@/actions/savePost'
import type { JudgmentRules } from '@/types/judgment'

export const metadata = { title: '글 수정' }

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('id, title, summary, thumbnail_url, category, content, judgment_rules, judgment_detail, target_year, is_featured, is_published, published_at')
    .eq('id', id)
    .single()

  if (!post) notFound()

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      <h1 className="text-xl font-bold mb-6">글 수정</h1>
      <PostForm
        initialData={{
          id: post.id,
          title: post.title,
          summary: post.summary,
          thumbnail_url: post.thumbnail_url,
          category: post.category as PostFormData['category'],
          content: post.content as JSONContent,
          judgment_rules: post.judgment_rules as JudgmentRules | null,
          judgment_detail: post.judgment_detail as JSONContent | null,
          target_year: post.target_year,
          is_featured: post.is_featured,
          is_published: post.is_published,
          published_at: post.published_at,
        }}
      />
    </div>
  )
}
