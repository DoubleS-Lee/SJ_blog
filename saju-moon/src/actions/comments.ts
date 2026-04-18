'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const MAX_COMMENT_LENGTH = 2000

function normalizeBody(body: string) {
  return body.replace(/\r\n/g, '\n').trim()
}

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

export async function createPostComment(input: {
  postId: string
  body: string
  parentId?: string | null
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const body = normalizeBody(input.body)
  if (!body) return { error: '내용을 입력해 주세요.' }
  if (body.length > MAX_COMMENT_LENGTH) {
    return { error: `댓글은 ${MAX_COMMENT_LENGTH}자 이하로 작성해 주세요.` }
  }

  const [post, profileRes, sajuRes] = await Promise.all([
    getPublishedPost(input.postId),
    supabase.from('users').select('nickname, custom_avatar_url').eq('id', user.id).maybeSingle(),
    supabase.from('user_saju').select('ilgan').eq('user_id', user.id).maybeSingle(),
  ])

  if (!post) return { error: '댓글을 작성할 수 없는 글입니다.' }

  if (input.parentId) {
    const { data: parent } = await supabase
      .from('post_comments')
      .select('id, post_id, parent_id, is_deleted')
      .eq('id', input.parentId)
      .maybeSingle()

    if (!parent || parent.post_id !== input.postId) {
      return { error: '대댓글 대상 댓글을 찾을 수 없습니다.' }
    }
    if (parent.parent_id) {
      return { error: '대댓글에는 다시 답글을 달 수 없습니다.' }
    }
    if (parent.is_deleted) {
      return { error: '삭제된 댓글에는 답글을 달 수 없습니다.' }
    }
  }

  const nickname = profileRes.data?.nickname?.trim() || '익명'

  const { error } = await supabase
    .from('post_comments')
    .insert({
      post_id: input.postId,
      user_id: user.id,
      parent_id: input.parentId ?? null,
      author_name: nickname,
      author_avatar_url: profileRes.data?.custom_avatar_url ?? null,
      author_ilgan: sajuRes.data?.ilgan ?? null,
      body,
    })

  if (error) {
    console.error('[createPostComment]', error)
    return { error: '댓글 저장 중 오류가 발생했습니다.' }
  }

  revalidatePath(`/posts/${post.slug}`)
  return {}
}

export async function updatePostComment(input: {
  commentId: string
  body: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const body = normalizeBody(input.body)
  if (!body) return { error: '내용을 입력해 주세요.' }
  if (body.length > MAX_COMMENT_LENGTH) {
    return { error: `댓글은 ${MAX_COMMENT_LENGTH}자 이하로 작성해 주세요.` }
  }

  const { data: comment } = await supabase
    .from('post_comments')
    .select('id, user_id, post_id, is_deleted')
    .eq('id', input.commentId)
    .maybeSingle()

  if (!comment) return { error: '댓글을 찾을 수 없습니다.' }
  if (comment.user_id !== user.id) return { error: '수정 권한이 없습니다.' }
  if (comment.is_deleted) return { error: '삭제된 댓글은 수정할 수 없습니다.' }

  const post = await getPublishedPost(comment.post_id)
  if (!post) return { error: '대상 글을 찾을 수 없습니다.' }

  const { error } = await supabase
    .from('post_comments')
    .update({
      body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.commentId)

  if (error) {
    console.error('[updatePostComment]', error)
    return { error: '댓글 수정 중 오류가 발생했습니다.' }
  }

  revalidatePath(`/posts/${post.slug}`)
  return {}
}

export async function deletePostComment(input: {
  commentId: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: comment } = await supabase
    .from('post_comments')
    .select('id, user_id, post_id, is_deleted')
    .eq('id', input.commentId)
    .maybeSingle()

  if (!comment) return { error: '댓글을 찾을 수 없습니다.' }
  if (comment.user_id !== user.id) return { error: '삭제 권한이 없습니다.' }
  if (comment.is_deleted) return { error: '이미 삭제된 댓글입니다.' }

  const post = await getPublishedPost(comment.post_id)
  if (!post) return { error: '대상 글을 찾을 수 없습니다.' }

  const { error } = await supabase
    .from('post_comments')
    .update({
      body: '',
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.commentId)

  if (error) {
    console.error('[deletePostComment]', error)
    return { error: '댓글 삭제 중 오류가 발생했습니다.' }
  }

  revalidatePath(`/posts/${post.slug}`)
  return {}
}

export async function togglePostCommentLike(input: {
  commentId: string
}): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: comment } = await supabase
    .from('post_comments')
    .select('id, post_id, is_deleted')
    .eq('id', input.commentId)
    .maybeSingle()

  if (!comment) return { error: '댓글을 찾을 수 없습니다.' }
  if (comment.is_deleted) return { error: '삭제된 댓글에는 좋아요를 누를 수 없습니다.' }

  const post = await getPublishedPost(comment.post_id)
  if (!post) return { error: '대상 글을 찾을 수 없습니다.' }

  const { data: existing } = await supabase
    .from('post_comment_likes')
    .select('comment_id')
    .eq('comment_id', input.commentId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from('post_comment_likes')
      .delete()
      .eq('comment_id', input.commentId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[togglePostCommentLike][delete]', error)
      return { error: '좋아요 처리 중 오류가 발생했습니다.' }
    }
  } else {
    const { error } = await supabase
      .from('post_comment_likes')
      .insert({
        comment_id: input.commentId,
        user_id: user.id,
      })

    if (error) {
      console.error('[togglePostCommentLike][insert]', error)
      return { error: '좋아요 처리 중 오류가 발생했습니다.' }
    }
  }

  revalidatePath(`/posts/${post.slug}`)
  return {}
}
