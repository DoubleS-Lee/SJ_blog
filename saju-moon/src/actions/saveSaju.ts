'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { calculateSaju, type SajuInput } from '@/lib/saju/calculate'
import type { Json } from '@/types/supabase'

export interface SaveSajuInput extends SajuInput {
  saju_name: string
}

export async function saveSaju(input: SaveSajuInput): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: '로그인이 필요합니다.' }

  const sajuName = input.saju_name.trim()
  if (!sajuName) return { error: '만세력 이름을 입력해 주세요.' }

  let result
  try {
    result = calculateSaju(input)
  } catch (error) {
    console.error('[saveSaju] calculate error:', error)
    return { error: '사주 계산 중 오류가 발생했습니다. 입력값을 확인해 주세요.' }
  }

  const now = new Date().toISOString()

  const { error: sajuErr } = await supabase
    .from('user_saju')
    .upsert(
      {
        user_id: user.id,
        saju_name: sajuName,
        year_cheongan: result.year_cheongan,
        year_jiji: result.year_jiji,
        month_cheongan: result.month_cheongan,
        month_jiji: result.month_jiji,
        day_cheongan: result.day_cheongan,
        day_jiji: result.day_jiji,
        hour_cheongan: result.hour_cheongan,
        hour_jiji: result.hour_jiji,
        year_ganji: result.year_ganji,
        month_ganji: result.month_ganji,
        day_ganji: result.day_ganji,
        hour_ganji: result.hour_ganji,
        ilgan: result.ilgan,
        birth_year: input.birth_year,
        birth_month: input.birth_month,
        birth_day: input.birth_day,
        birth_hour: input.birth_hour,
        birth_minute: input.birth_minute,
        gender: input.gender,
        is_lunar: input.is_lunar,
        full_saju_data: result.full_saju_data as Json,
        updated_at: now,
      },
      { onConflict: 'user_id' },
    )

  if (sajuErr) {
    console.error('[saveSaju] user_saju upsert error:', sajuErr)
    return { error: '만세력을 저장하지 못했습니다.' }
  }

  const oh = result.ohang_data
  const { error: ohangErr } = await supabase
    .from('user_saju_ohang')
    .upsert(
      {
        user_id: user.id,
        mok_score: oh.scores['목'],
        hwa_score: oh.scores['화'],
        to_score: oh.scores['토'],
        geum_score: oh.scores['금'],
        su_score: oh.scores['수'],
        has_mok: result.has_mok,
        has_hwa: result.has_hwa,
        has_to: result.has_to,
        has_geum: result.has_geum,
        has_su: result.has_su,
        positions: oh.positions as unknown as Json,
      },
      { onConflict: 'user_id' },
    )

  if (ohangErr) {
    console.error('[saveSaju] user_saju_ohang upsert error:', ohangErr)
    return { error: '오행 정보를 저장하지 못했습니다.' }
  }

  const ss = result.sipsung_data
  const { error: sipsungErr } = await supabase
    .from('user_saju_sipsung')
    .upsert(
      {
        user_id: user.id,
        bigyeon_score: ss.scores['비견'],
        gyeopjae_score: ss.scores['겁재'],
        sikshin_score: ss.scores['식신'],
        sanggwan_score: ss.scores['상관'],
        pyeonjae_score: ss.scores['편재'],
        jeongjae_score: ss.scores['정재'],
        pyeongwan_score: ss.scores['편관'],
        jeonggwan_score: ss.scores['정관'],
        pyeonin_score: ss.scores['편인'],
        jeongin_score: ss.scores['정인'],
        has_bigyeon: result.has_bigyeon,
        has_gyeopjae: result.has_geopjae,
        has_sikshin: result.has_sikshin,
        has_sanggwan: result.has_sangwan,
        has_pyeonjae: result.has_pyeonjae,
        has_jeongjae: result.has_jeongjae,
        has_pyeongwan: result.has_pyeongwan,
        has_jeonggwan: result.has_jeongwan,
        has_pyeonin: result.has_pyeonin,
        has_jeongin: result.has_jeongin,
        positions: ss.positions as unknown as Json,
      },
      { onConflict: 'user_id' },
    )

  if (sipsungErr) {
    console.error('[saveSaju] user_saju_sipsung upsert error:', sipsungErr)
    return { error: '십성 정보를 저장하지 못했습니다.' }
  }

  redirect('/mypage')
}
