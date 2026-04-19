'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function setProfileAvatar(avatarUrl: string | null): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  const normalizedAvatarUrl = avatarUrl?.trim() || null
  const now = new Date().toISOString()

  const { error: profileError } = await supabase
    .from('users')
    .update({
      custom_avatar_url: normalizedAvatarUrl,
      updated_at: now,
    })
    .eq('id', user.id)

  if (profileError) {
    console.error('[setProfileAvatar][users]', profileError)
    return { error: '프로필 이미지를 저장하지 못했습니다.' }
  }

  const [postCommentResult, consultationCommentResult] = await Promise.all([
    supabase
      .from('post_comments')
      .update({ author_avatar_url: normalizedAvatarUrl, updated_at: now })
      .eq('user_id', user.id),
    supabase
      .from('consultation_comments')
      .update({ author_avatar_url: normalizedAvatarUrl, updated_at: now })
      .eq('user_id', user.id),
  ])

  if (postCommentResult.error) {
    console.error('[setProfileAvatar][post_comments]', postCommentResult.error)
  }

  if (consultationCommentResult.error) {
    console.error('[setProfileAvatar][consultation_comments]', consultationCommentResult.error)
  }

  revalidatePath('/mypage')
  revalidatePath('/posts', 'layout')
  revalidatePath('/counsel', 'layout')

  return {}
}

export async function updateNickname(nickname: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다.' }
  }

  const normalizedNickname = nickname.trim()
  if (!normalizedNickname) {
    return { error: '닉네임을 입력해 주세요.' }
  }
  if (normalizedNickname.length > 20) {
    return { error: '닉네임은 20자 이내로 입력해 주세요.' }
  }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('users')
    .update({
      nickname: normalizedNickname,
      updated_at: now,
    })
    .eq('id', user.id)

  if (error) {
    console.error('[updateNickname]', error)
    return { error: '닉네임을 저장하지 못했습니다.' }
  }

  revalidatePath('/mypage')
  revalidatePath('/posts', 'layout')
  revalidatePath('/counsel', 'layout')
  revalidatePath('/compatibility')
  revalidatePath('/admin/counsel')

  return {}
}
