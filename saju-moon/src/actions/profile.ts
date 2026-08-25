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

  // updated_at은 건드리지 않는다 — CommentsSection이 updated_at !== created_at으로 "수정됨"
  // 배지를 띄우므로, 아바타만 바뀐 댓글이 본문을 고친 것처럼 보이게 된다.
  const [postCommentResult, consultationCommentResult] = await Promise.all([
    supabase
      .from('post_comments')
      .update({ author_avatar_url: normalizedAvatarUrl })
      .eq('user_id', user.id),
    supabase
      .from('consultation_comments')
      .update({ author_avatar_url: normalizedAvatarUrl })
      .eq('user_id', user.id),
  ])

  if (postCommentResult.error) {
    console.error('[setProfileAvatar][post_comments]', postCommentResult.error)
  }

  if (consultationCommentResult.error) {
    console.error('[setProfileAvatar][consultation_comments]', consultationCommentResult.error)
  }

  revalidatePath('/mypage')
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
    if (error.code === '23505') {
      return { error: '이미 사용 중인 닉네임입니다.' }
    }
    console.error('[updateNickname]', error)
    return { error: '닉네임을 저장하지 못했습니다.' }
  }

  // updated_at 제외 — 위 setProfileAvatar와 같은 이유("수정됨" 오표시 방지).
  const { error: postCommentsError } = await supabase
    .from('post_comments')
    .update({
      author_name: normalizedNickname,
    })
    .eq('user_id', user.id)

  if (postCommentsError) {
    console.error('[updateNickname][post_comments]', postCommentsError)
  }

  // '/posts'는 일부러 제외한다 — 글 상세에서 캐시되는 건 getPublicPost의 공개 필드뿐이고,
  // 닉네임/아바타가 쓰이는 개인화 영역은 쿠키를 읽는 동적 렌더라 무효화할 대상이 없다.
  // 넣으면 프로필 저장 한 번에 전체 글 캐시가 날아가고 다음 방문자가 콜드 DB 읽기를 낸다.
  revalidatePath('/mypage')
  revalidatePath('/counsel', 'layout')
  revalidatePath('/compatibility')
  revalidatePath('/admin/counsel')

  return {}
}
