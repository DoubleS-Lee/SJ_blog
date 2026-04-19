import { STRONG_DI_SHI, TEN_GOD_KR_TO_CODE, WEAK_DI_SHI } from './constants'
import { loadLifeScoreRules } from './load-rules'
import type { TenGod } from './types'

export type MonthSupportLevel = 'favorable' | 'neutral' | 'unfavorable'
export type HiddenStemGrade = 'main_qi' | 'mid_qi' | 'sub_qi'

export interface StarStrengthInput {
  star: TenGod
  visibleStemCount?: number
  hiddenStemCount?: number
  monthSupport?: MonthSupportLevel
  rootSupportKeys?: Array<
    'month_main_root'
    | 'month_mid_root'
    | 'month_sub_root'
    | 'day_main_root'
    | 'time_main_root'
    | 'year_main_root'
  >
  stemExposureKeys?: Array<'month_stem' | 'time_stem' | 'year_stem'>
  hiddenStemGrades?: HiddenStemGrade[]
  diShi?: string | null
  interactionAdjustments?: Array<'he' | 'chung' | 'hyeong' | 'pa' | 'hae' | 'samhap' | 'cheongan_he' | 'gongmang'>
}

export type StarStrengthBreakdown = {
  star: TenGod
  score: number
  parts: {
    presence: number
    monthSupport: number
    rootSupport: number
    stemExposure: number
    hiddenStemGrade: number
    diShi: number
    interaction: number
  }
}

export function calculateStarStrength(input: StarStrengthInput): StarStrengthBreakdown {
  const rules = loadLifeScoreRules().starStrengthRules

  const presence =
    (input.visibleStemCount ?? 0) * rules.presence.visible_stem +
    (input.hiddenStemCount ?? 0) * rules.presence.hidden_stem

  const monthSupport = input.monthSupport ? rules.month_support[input.monthSupport] : 0

  const rootSupport = (input.rootSupportKeys ?? []).reduce(
    (sum, key) => sum + rules.root_support[key],
    0,
  )

  const stemExposure = (input.stemExposureKeys ?? []).reduce(
    (sum, key) => sum + rules.stem_exposure[key],
    0,
  )

  const hiddenStemGrade = (input.hiddenStemGrades ?? []).reduce(
    (sum, key) => sum + rules.hidden_stem_grade[key],
    0,
  )

  let diShi = 0
  if (input.diShi) {
    if (STRONG_DI_SHI.has(input.diShi)) diShi = rules.di_shi.strong
    else if (WEAK_DI_SHI.has(input.diShi)) diShi = rules.di_shi.weak
    else diShi = rules.di_shi.neutral
  }

  const interaction = (input.interactionAdjustments ?? []).reduce(
    (sum, key) => sum + rules.interaction[key],
    0,
  )

  const rawScore = presence + monthSupport + rootSupport + stemExposure + hiddenStemGrade + diShi + interaction
  const score = Math.max(0, Math.min(1, rawScore))

  return {
    star: input.star,
    score,
    parts: {
      presence,
      monthSupport,
      rootSupport,
      stemExposure,
      hiddenStemGrade,
      diShi,
      interaction,
    },
  }
}

export function calculateStarStrengths(
  inputs: StarStrengthInput[],
): Partial<Record<TenGod, StarStrengthBreakdown>> {
  return inputs.reduce<Partial<Record<TenGod, StarStrengthBreakdown>>>((acc, input) => {
    acc[input.star] = calculateStarStrength(input)
    return acc
  }, {})
}

export function mapKoreanStarNamesToInputs(
  inputs: Array<Omit<StarStrengthInput, 'star'> & { starKr: string }>,
): StarStrengthInput[] {
  return inputs
    .map(({ starKr, ...rest }) => {
      const star = TEN_GOD_KR_TO_CODE[starKr]
      if (!star) return null
      return { star, ...rest }
    })
    .filter((value): value is StarStrengthInput => Boolean(value))
}
