'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

async function getPublishedPost(postId: string) {
  const supabase = await createClient()
  const { data: post } = await supabase
    .from('posts')
    .select('id, slug, is_published, published_at')
    .eq('id', postId)
    .maybeSingle()

  if (!post) return null
  if (!post.is_published) return null
  if (post.published_at && new Date(post.published_at) > new Date()) return null
  return post
}

async function getPostLikeCount(postId: string) {
  const supabase = await createClient()
  const { data: row, error: selectError } = await supabase
    .from('posts')
    .select('like_count')
    .eq('id', postId)
    .single()

  if (selectError) return { error: selectError, likeCount: null as number | null }
  return { error: null, likeCount: row.like_count ?? 0 }
}

export async function togglePostLike(input: {
  postId: string
}): Promise<{ error?: string; liked?: boolean; likeCount?: number }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const post = await getPublishedPost(input.postId)
  if (!post) return { error: '좋아요를 누를 수 없는 글입니다.' }

  const { data: existing } = await supabase
    .from('post_likes')
    .select('post_id')
    .eq('post_id', input.postId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    const { error: deleteError } = await supabase
      .from('post_likes')
      .delete()
      .eq('post_id', input.postId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[togglePostLike][delete]', deleteError)
      return { error: '좋아요 처리 중 오류가 발생했습니다.' }
    }

    const { error: countError, likeCount } = await getPostLikeCount(input.postId)
    if (countError) {
      console.error('[togglePostLike][count decrement]', countError)
      return { error: '좋아요 처리 중 오류가 발생했습니다.' }
    }

    revalidatePath(`/posts/${post.slug}`)
    return { liked: false, likeCount: likeCount ?? 0 }
  }

  const { error: insertError } = await supabase
    .from('post_likes')
    .insert({
      post_id: input.postId,
      user_id: user.id,
    })

  if (insertError) {
    console.error('[togglePostLike][insert]', insertError)
    return { error: '좋아요 처리 중 오류가 발생했습니다.' }
  }

  const { error: countError, likeCount } = await getPostLikeCount(input.postId)
  if (countError) {
    console.error('[togglePostLike][count increment]', countError)
    return { error: '좋아요 처리 중 오류가 발생했습니다.' }
  }

  revalidatePath(`/posts/${post.slug}`)
  return { liked: true, likeCount: likeCount ?? 0 }
}
