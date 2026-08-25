'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/types/supabase'
import type { IlganAvatarMap } from '@/lib/saju/ilgan-avatar'

async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, isAdmin: false }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  return { supabase, isAdmin: !!profile?.is_admin }
}

// '/posts'는 일부러 제외한다 — site_settings 값(grade_separation_enabled, ilgan_avatar_urls 등)은
// 전부 글 상세의 동적 영역에서 매 요청 읽히므로 캐시된 사본이 없다. 넣으면 설정 한 번 바꿀 때마다
// 전체 글의 'use cache' 엔트리만 날아간다.
function revalidateSettingTargets() {
  revalidatePath('/admin/settings')
  revalidatePath('/counsel', 'layout')
  revalidatePath('/taekil', 'layout')
}

export async function bumpCounselSocialProof(): Promise<{ error?: string; amount?: number }> {
  const { supabase, isAdmin } = await requireAdmin()
  if (!isAdmin) return { error: '권한이 없습니다.' }

  const amount = Math.floor(Math.random() * 10) + 1

  const { data: current, error: fetchError } = await supabase
    .from('site_settings')
    .select('counsel_social_proof_boost')
    .eq('id', 1)
    .maybeSingle()

  if (fetchError) {
    console.error('[bumpCounselSocialProof][fetch]', fetchError)
    return { error: '현재 설정을 불러오는 중 오류가 발생했습니다.' }
  }

  const nextValue = (current?.counsel_social_proof_boost ?? 0) + amount

  const { error } = await supabase
    .from('site_settings')
    .update({ counsel_social_proof_boost: nextValue })
    .eq('id', 1)

  if (error) {
    console.error('[bumpCounselSocialProof][update]', error)
    return { error: '상담 신청 수 보정치 업데이트 중 오류가 발생했습니다.' }
  }

  revalidateSettingTargets()
  return { amount }
}

export async function setGradeSeparation(enabled: boolean): Promise<{ error?: string }> {
  const { supabase, isAdmin } = await requireAdmin()
  if (!isAdmin) return { error: '권한이 없습니다.' }

  const { error } = await supabase
    .from('site_settings')
    .update({ grade_separation_enabled: enabled })
    .eq('id', 1)

  if (error) {
    console.error('[setGradeSeparation]', error)
    return { error: '설정 저장 중 오류가 발생했습니다.' }
  }

  revalidatePath('/admin/settings')
  return {}
}

export async function setIlganAvatarSettings(
  avatarMap: IlganAvatarMap,
): Promise<{ error?: string }> {
  const { supabase, isAdmin } = await requireAdmin()
  if (!isAdmin) return { error: '권한이 없습니다.' }

  const { error } = await supabase
    .from('site_settings')
    .update({
      ilgan_avatar_urls: avatarMap as unknown as Json,
    })
    .eq('id', 1)

  if (error) {
    console.error('[setIlganAvatarSettings]', error)
    return { error: '설정 저장 중 오류가 발생했습니다.' }
  }

  revalidateSettingTargets()
  return {}
}
