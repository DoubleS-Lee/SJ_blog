'use server'

import { createClient } from '@/lib/supabase/server'
import { calculateSaju, type SajuInput } from '@/lib/saju/calculate'
import { redirect } from 'next/navigation'
import type { Json } from '@/types/supabase'

export async function saveSaju(input: SajuInput): Promise<{ error?: string }> {
  // 1. 인증 확인
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  // 2. 만세력 계산
  let result
  try {
    result = calculateSaju(input)
  } catch (e) {
    console.error('[saveSaju] calculate error:', e)
    return { error: '사주 계산 중 오류가 발생했습니다. 입력값을 확인해 주세요.' }
  }

  const userId = user.id

  // 3. user_saju upsert
  const { error: sajuErr } = await supabase
    .from('user_saju')
    .upsert(
      {
        user_id: userId,
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
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    )

  if (sajuErr) {
    console.error('[saveSaju] user_saju upsert error:', sajuErr)
    return { error: '저장 중 오류가 발생했습니다.' }
  }

  // 4. user_saju_ohang upsert
  const oh = result.ohang_data
  const { error: ohangErr } = await supabase
    .from('user_saju_ohang')
    .upsert(
      {
        user_id: userId,
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
      { onConflict: 'user_id' }
    )

  if (ohangErr) {
    console.error('[saveSaju] user_saju_ohang upsert error:', ohangErr)
    return { error: '저장 중 오류가 발생했습니다.' }
  }

  // 5. user_saju_sipsung upsert
  // ※ DB 컬럼명: gyeopjae(겁재), sanggwan(상관), jeonggwan(정관) — 오탈자 통일
  const ss = result.sipsung_data
  const { error: sipsungErr } = await supabase
    .from('user_saju_sipsung')
    .upsert(
      {
        user_id: userId,
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
      { onConflict: 'user_id' }
    )

  if (sipsungErr) {
    console.error('[saveSaju] user_saju_sipsung upsert error:', sipsungErr)
    return { error: '저장 중 오류가 발생했습니다.' }
  }

  // 6. 저장 완료 → 마이페이지로 이동
  redirect('/mypage')
}
