/**
 * 판정 로직 — 서버/클라이언트 공용 (pure 함수, lunar-javascript 불필요)
 *
 * 예외 처리 규칙 (CLAUDE.md):
 * - 생시 모름 + 시간/시지 조건 → skip
 * - 생시 모름 + 대운 조건(⑯⑰) → skip
 * - 생시 모름 + 세운 조건(⑭⑮) → 정상 적용
 * - 생시 모름 + 60갑자 4주 전체 → 시주 null → 연/월/일 3주만 비교
 * - 조건 그룹 전체 비활성 → 해당 그룹 skip (통과 아님)
 */

import type { Cheongan, Jiji, Ohang, Sipsung } from '@/types/saju'
import type {
  JudgmentRules,
  JudgmentCondition,
  PillarKey,
  ConditionGroup,
} from '@/types/judgment'

// ─────────────────────────────────────────────
// 십성 계산 상수
// ─────────────────────────────────────────────

const CHEONGAN_INFO: Record<Cheongan, { ohang: Ohang; yang: boolean }> = {
  갑: { ohang: '목', yang: true },
  을: { ohang: '목', yang: false },
  병: { ohang: '화', yang: true },
  정: { ohang: '화', yang: false },
  무: { ohang: '토', yang: true },
  기: { ohang: '토', yang: false },
  경: { ohang: '금', yang: true },
  신: { ohang: '금', yang: false },
  임: { ohang: '수', yang: true },
  계: { ohang: '수', yang: false },
}

// 지지 주오행(본기 기준) + 음양
const JIJI_INFO: Record<Jiji, { ohang: Ohang; yang: boolean }> = {
  자: { ohang: '수', yang: false }, // 癸水 음
  축: { ohang: '토', yang: false }, // 己土 음
  인: { ohang: '목', yang: true },  // 甲木 양
  묘: { ohang: '목', yang: false }, // 乙木 음
  진: { ohang: '토', yang: true },  // 戊土 양
  사: { ohang: '화', yang: true },  // 丙火 양
  오: { ohang: '화', yang: false }, // 丁火 음
  미: { ohang: '토', yang: false }, // 己土 음
  신: { ohang: '금', yang: true },  // 庚金 양
  유: { ohang: '금', yang: false }, // 辛金 음
  술: { ohang: '토', yang: true },  // 戊土 양
  해: { ohang: '수', yang: true },  // 壬水 양
}

// A가 B를 생한다 (목→화→토→금→수→목)
const OHANG_SAENG: Record<Ohang, Ohang> = {
  목: '화', 화: '토', 토: '금', 금: '수', 수: '목',
}

// A가 B를 극한다 (목→토→수→화→금→목)
const OHANG_GEUK: Record<Ohang, Ohang> = {
  목: '토', 화: '금', 토: '수', 금: '목', 수: '화',
}

/** 일간 오행 기준, target 오행/음양으로 십성 계산 */
function calcSipsung(
  ilganOhang: Ohang, ilganYang: boolean,
  targetOhang: Ohang, targetYang: boolean
): Sipsung {
  const same = ilganYang === targetYang

  if (targetOhang === ilganOhang) return same ? '비견' : '겁재'
  if (OHANG_SAENG[ilganOhang] === targetOhang) return same ? '식신' : '상관'
  if (OHANG_GEUK[ilganOhang] === targetOhang) return same ? '편재' : '정재'
  if (OHANG_GEUK[targetOhang] === ilganOhang) return same ? '편관' : '정관'
  if (OHANG_SAENG[targetOhang] === ilganOhang) return same ? '편인' : '정인'
  return '비견' // fallback
}

/** 천간 → 십성 (일간 기준) */
export function getCheonganSipsung(ilgan: Cheongan, target: Cheongan): Sipsung {
  const il = CHEONGAN_INFO[ilgan]
  const tg = CHEONGAN_INFO[target]
  return calcSipsung(il.ohang, il.yang, tg.ohang, tg.yang)
}

/** 지지 → 십성 (일간 기준) */
export function getJijiSipsung(ilgan: Cheongan, target: Jiji): Sipsung {
  const il = CHEONGAN_INFO[ilgan]
  const tg = JIJI_INFO[target]
  return calcSipsung(il.ohang, il.yang, tg.ohang, tg.yang)
}

// ─────────────────────────────────────────────
// 세운/대운 데이터 추출
// ─────────────────────────────────────────────

interface DaYunEntry {
  ganzi: string
  start_age: number
  end_age: number
  liuNian: { year: number; ganzi: string }[]
}

function getDaYunList(fullSajuData: Record<string, unknown>): DaYunEntry[] {
  const raw = fullSajuData['da_yun']
  if (!Array.isArray(raw)) return []
  return raw as DaYunEntry[]
}

/** 대상 연도의 세운(유년) 간지 반환 — 없으면 null */
function getSeWoonGanzi(fullSajuData: Record<string, unknown>, year: number): string | null {
  for (const dy of getDaYunList(fullSajuData)) {
    const ln = dy.liuNian.find((l) => l.year === year)
    if (ln) return ln.ganzi
  }
  return null
}

/** 대상 연도의 대운 간지 반환 — 없으면 null */
function getDaeWoonGanzi(fullSajuData: Record<string, unknown>, year: number): string | null {
  for (const dy of getDaYunList(fullSajuData)) {
    if (dy.liuNian.some((l) => l.year === year)) return dy.ganzi
  }
  return null
}

/** 간지 문자열 → [cheongan, jiji] 분리 */
function parseGanzi(ganzi: string): [Cheongan, Jiji] | null {
  if (ganzi.length < 2) return null
  const cg = ganzi[0] as Cheongan
  const jj = ganzi[1] as Jiji
  if (!CHEONGAN_INFO[cg] || !JIJI_INFO[jj]) return null
  return [cg, jj]
}

// ─────────────────────────────────────────────
// 사용자 사주 데이터 (판정에 필요한 필드)
// ─────────────────────────────────────────────

export interface JudgmentUserData {
  // 원국 8글자
  year_cheongan: Cheongan
  year_jiji: Jiji
  month_cheongan: Cheongan
  month_jiji: Jiji
  day_cheongan: Cheongan
  day_jiji: Jiji
  hour_cheongan: Cheongan | null   // null = 생시 모름
  hour_jiji: Jiji | null
  // 60갑자
  year_ganji: string
  month_ganji: string
  day_ganji: string
  hour_ganji: string | null
  // 일간
  ilgan: Cheongan
  // 오행 (user_saju_ohang)
  mok_score: number; hwa_score: number; to_score: number; geum_score: number; su_score: number
  has_mok: boolean; has_hwa: boolean; has_to: boolean; has_geum: boolean; has_su: boolean
  // 십성 (user_saju_sipsung)
  bigyeon_score: number; gyeopjae_score: number; sikshin_score: number; sanggwan_score: number
  pyeonjae_score: number; jeongjae_score: number; pyeongwan_score: number; jeonggwan_score: number
  pyeonin_score: number; jeongin_score: number
  has_bigyeon: boolean; has_gyeopjae: boolean; has_sikshin: boolean; has_sanggwan: boolean
  has_pyeonjae: boolean; has_jeongjae: boolean; has_pyeongwan: boolean; has_jeonggwan: boolean
  has_pyeonin: boolean; has_jeongin: boolean
  // 대운/세운 계산용
  full_saju_data: Record<string, unknown>
}

export interface JudgmentEvaluationResult {
  result: boolean | null
  matchedGroup: ConditionGroup | null
}

// ─────────────────────────────────────────────
// 조건 판정 헬퍼
// ─────────────────────────────────────────────

const PILLAR_CHEONGAN: Record<PillarKey, keyof JudgmentUserData> = {
  year: 'year_cheongan', month: 'month_cheongan', day: 'day_cheongan', hour: 'hour_cheongan',
}
const PILLAR_JIJI: Record<PillarKey, keyof JudgmentUserData> = {
  year: 'year_jiji', month: 'month_jiji', day: 'day_jiji', hour: 'hour_jiji',
}
const OHANG_HAS: Record<Ohang, keyof JudgmentUserData> = {
  목: 'has_mok', 화: 'has_hwa', 토: 'has_to', 금: 'has_geum', 수: 'has_su',
}
const OHANG_SCORE: Record<Ohang, keyof JudgmentUserData> = {
  목: 'mok_score', 화: 'hwa_score', 토: 'to_score', 금: 'geum_score', 수: 'su_score',
}
const SIPSUNG_HAS: Record<Sipsung, keyof JudgmentUserData> = {
  비견: 'has_bigyeon', 겁재: 'has_gyeopjae', 식신: 'has_sikshin', 상관: 'has_sanggwan',
  편재: 'has_pyeonjae', 정재: 'has_jeongjae', 편관: 'has_pyeongwan', 정관: 'has_jeonggwan',
  편인: 'has_pyeonin', 정인: 'has_jeongin',
}
const SIPSUNG_SCORE: Record<Sipsung, keyof JudgmentUserData> = {
  비견: 'bigyeon_score', 겁재: 'gyeopjae_score', 식신: 'sikshin_score', 상관: 'sanggwan_score',
  편재: 'pyeonjae_score', 정재: 'jeongjae_score', 편관: 'pyeongwan_score', 정관: 'jeonggwan_score',
  편인: 'pyeonin_score', 정인: 'jeongin_score',
}

/**
 * 단일 조건 판정
 * - enabled=false → null (skip)
 * - 생시 모름 + 시간/시지 조건 → null (skip)
 * - 생시 모름 + 대운 조건 → null (skip)
 * - 조건 충족 → true, 불충족 → false
 */
function judgeCondition(
  cond: JudgmentCondition,
  user: JudgmentUserData,
  seWoonGanzi: string | null,
  daeWoonGanzi: string | null,
): boolean | null {
  if (!cond.enabled) return null

  const hasHour = user.hour_cheongan !== null

  switch (cond.type) {
    case 'pillar_cheongan': {
      if (!hasHour && cond.pillar === 'hour') return null  // 생시 모름 skip
      const val = user[PILLAR_CHEONGAN[cond.pillar]] as Cheongan | null
      if (!val) return null
      return cond.values.includes(val)
    }
    case 'pillar_jiji': {
      if (!hasHour && cond.pillar === 'hour') return null
      const val = user[PILLAR_JIJI[cond.pillar]] as Jiji | null
      if (!val) return null
      return cond.values.includes(val)
    }
    case 'ohang_presence': {
      const has = user[OHANG_HAS[cond.ohang]] as boolean
      return cond.mode === 'has' ? has : !has
    }
    case 'ohang_score': {
      const score = user[OHANG_SCORE[cond.ohang]] as number
      return cond.operator === 'gte' ? score >= cond.threshold : score <= cond.threshold
    }
    case 'sipsung_presence': {
      const has = user[SIPSUNG_HAS[cond.sipsung]] as boolean
      return cond.mode === 'has' ? has : !has
    }
    case 'sipsung_score': {
      const score = user[SIPSUNG_SCORE[cond.sipsung]] as number
      return cond.operator === 'gte' ? score >= cond.threshold : score <= cond.threshold
    }
    case 'sixty_ganji': {
      if (cond.scope === 'ilju') {
        // 일주만 비교
        return cond.values.includes(user.day_ganji)
      } else {
        // 4주 전체 — 생시 모름이면 연/월/일 3주만
        const ganjiList = [user.year_ganji, user.month_ganji, user.day_ganji]
        if (hasHour && user.hour_ganji) ganjiList.push(user.hour_ganji)
        return ganjiList.some((g) => cond.values.includes(g))
      }
    }
    case 'sewoon_cheongan': {
      if (!seWoonGanzi) return null
      const parsed = parseGanzi(seWoonGanzi)
      if (!parsed) return null
      const sipsung = getCheonganSipsung(user.ilgan, parsed[0])
      return cond.values.includes(sipsung)
    }
    case 'sewoon_jiji': {
      if (!seWoonGanzi) return null
      const parsed = parseGanzi(seWoonGanzi)
      if (!parsed) return null
      const sipsung = getJijiSipsung(user.ilgan, parsed[1])
      return cond.values.includes(sipsung)
    }
    case 'daewoon_cheongan': {
      if (!hasHour) return null  // 생시 모름 → 대운 skip
      if (!daeWoonGanzi) return null
      const parsed = parseGanzi(daeWoonGanzi)
      if (!parsed) return null
      const sipsung = getCheonganSipsung(user.ilgan, parsed[0])
      return cond.values.includes(sipsung)
    }
    case 'daewoon_jiji': {
      if (!hasHour) return null  // 생시 모름 → 대운 skip
      if (!daeWoonGanzi) return null
      const parsed = parseGanzi(daeWoonGanzi)
      if (!parsed) return null
      const sipsung = getJijiSipsung(user.ilgan, parsed[1])
      return cond.values.includes(sipsung)
    }
    default:
      return null  // 미지의 조건 타입 skip
  }
}

/**
 * 그룹 판정 (AND 로직)
 * - 활성 조건이 0개이면 null (skip — 통과 아님)
 * - 모든 활성 조건이 충족되면 true
 * - 하나라도 불충족이면 false
 */
function judgeGroup(
  group: { conditions: JudgmentCondition[] },
  user: JudgmentUserData,
  seWoonGanzi: string | null,
  daeWoonGanzi: string | null,
): boolean | null {
  let activeCount = 0
  for (const cond of group.conditions) {
    const result = judgeCondition(cond, user, seWoonGanzi, daeWoonGanzi)
    if (result === null) continue   // skip (비활성 or 생시 모름 예외)
    activeCount++
    if (!result) return false       // AND: 하나라도 false이면 그룹 실패
  }
  return activeCount > 0 ? true : null  // 활성 조건 0개 → skip
}

/**
 * 포스트 판정 (OR 로직)
 * - rules가 없거나 그룹이 없으면 null
 * - 하나의 그룹이라도 통과하면 true
 * - 모든 그룹이 실패하면 false
 */
export function judgePost(
  rules: JudgmentRules,
  user: JudgmentUserData,
  targetYear?: number | null,
): boolean | null {
  if (!rules.groups.length) return null

  const year = targetYear ?? new Date().getFullYear()
  const seWoon = getSeWoonGanzi(user.full_saju_data, year)
  const daeWoon = getDaeWoonGanzi(user.full_saju_data, year)

  let hasActiveGroup = false
  for (const group of rules.groups) {
    const result = judgeGroup(group, user, seWoon, daeWoon)
    if (result === null) continue
    hasActiveGroup = true
    if (result) return true   // OR: 하나라도 통과
  }
  return hasActiveGroup ? false : null
}

export function evaluateJudgment(
  rules: JudgmentRules,
  user: JudgmentUserData,
  targetYear?: number | null,
): JudgmentEvaluationResult {
  if (!rules.groups.length) {
    return { result: null, matchedGroup: null }
  }

  const year = targetYear ?? new Date().getFullYear()
  const seWoon = getSeWoonGanzi(user.full_saju_data, year)
  const daeWoon = getDaeWoonGanzi(user.full_saju_data, year)

  let hasActiveGroup = false
  for (const group of rules.groups) {
    const result = judgeGroup(group, user, seWoon, daeWoon)
    if (result === null) continue
    hasActiveGroup = true
    if (result) {
      return {
        result: true,
        matchedGroup: group,
      }
    }
  }

  return {
    result: hasActiveGroup ? false : null,
    matchedGroup: null,
  }
}
