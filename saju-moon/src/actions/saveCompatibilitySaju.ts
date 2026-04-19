'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { calculateSaju, type SajuInput } from '@/lib/saju/calculate'
import type { Json } from '@/types/supabase'

export interface CompatibilitySajuInput extends SajuInput {
  id?: string
  nickname: string
}

export async function saveCompatibilitySaju(
  input: CompatibilitySajuInput,
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const nickname = input.nickname.trim()
  if (!nickname) return { error: '상대 이름을 입력해 주세요.' }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    console.error('[saveCompatibilitySaju][profile]', profileError)
    return { error: '회원 정보를 확인하지 못했습니다.' }
  }

  const isPaidLike = profile?.is_admin || profile?.role !== 'free'
  const maxCount = isPaidLike ? 4 : 1

  if (!input.id) {
    const { count, error: countError } = await supabase
      .from('user_compatibility_saju')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if (countError) {
      console.error('[saveCompatibilitySaju][count]', countError)
      return { error: '저장 가능한 개수를 확인하지 못했습니다.' }
    }

    if ((count ?? 0) >= maxCount) {
      return {
        error:
          !isPaidLike
            ? '무료 회원은 나 포함 만세력 2개까지만 저장할 수 있습니다.'
            : '유료/관리자 회원은 나 포함 만세력 5개까지만 저장할 수 있습니다.',
      }
    }
  }

  let result
  try {
    result = calculateSaju(input)
  } catch (error) {
    console.error('[saveCompatibilitySaju] calculate error:', error)
    return { error: '상대 만세력 계산 중 오류가 발생했습니다.' }
  }

  const now = new Date().toISOString()
  const payload = {
    nickname,
    birth_year: input.birth_year,
    birth_month: input.birth_month,
    birth_day: input.birth_day,
    birth_hour: input.birth_hour,
    birth_minute: input.birth_minute,
    gender: input.gender,
    is_lunar: input.is_lunar,
    full_saju_data: result.full_saju_data as Json,
    updated_at: now,
  }

  let error: { message?: string } | null = null

  if (input.id) {
    const updateResult = await supabase
      .from('user_compatibility_saju')
      .update(payload)
      .eq('id', input.id)
      .eq('user_id', user.id)
    error = updateResult.error
  } else {
    const insertResult = await supabase.from('user_compatibility_saju').insert({
      user_id: user.id,
      ...payload,
    })
    error = insertResult.error
  }

  if (error) {
    console.error('[saveCompatibilitySaju]', error)
    return { error: input.id ? '상대 만세력 수정에 실패했습니다.' : '상대 만세력 저장에 실패했습니다.' }
  }

  revalidatePath('/mypage')
  revalidatePath('/compatibility')

  return {}
}

export async function deleteCompatibilitySaju(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const { error } = await supabase
    .from('user_compatibility_saju')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) {
    console.error('[deleteCompatibilitySaju]', error)
    return { error: '상대 만세력 삭제에 실패했습니다.' }
  }

  revalidatePath('/mypage')
  revalidatePath('/compatibility')
  return {}
}
