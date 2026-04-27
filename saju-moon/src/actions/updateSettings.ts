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

function revalidateSettingTargets() {
  revalidatePath('/admin/settings')
  revalidatePath('/posts', 'layout')
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
  revalidatePath('/posts', 'layout')
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
