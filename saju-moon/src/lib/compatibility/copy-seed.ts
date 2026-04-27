import { COMPATIBILITY_COPY } from './copy'
import {
  DAILY_PAIR_TEXT,
  DAEWOON_SUPPORT_TEXT_BY_KEY,
  DAEWOON_TRACK_TEXT_BY_RELATION,
  DAEWOON_TRANSITION_TEXT,
  MONTHLY_PAIR_TEXT,
  YEARLY_PAIR_TEXT,
} from './fortune-copy'
import type { CompatibilityFortuneCategory, CompatibilityFortunePeriodType, CompatibilitySection } from './types'

export type CompatibilityCopySeedRow = {
  section: CompatibilitySection
  copy_key: string
  title: string
  summary: string
  detail: string
  pattern: string
  detail_case: string
  male_condition: string
  female_condition: string
  is_active: boolean
}

export type CompatibilityFortuneCopySeedRow = {
  period_type: CompatibilityFortunePeriodType
  category: CompatibilityFortuneCategory
  copy_key: string
  summary: string
  detail: string
  is_active: boolean
}

export const COMPATIBILITY_COPY_SEED_ROWS: CompatibilityCopySeedRow[] = Object.entries(COMPATIBILITY_COPY).flatMap(
  ([section, copyMap]) =>
    Object.entries(copyMap).map(([copyKey, item]) => ({
      section: section as CompatibilitySection,
      copy_key: copyKey,
      title: item.title,
      summary: item.summary,
      detail: item.detail,
      pattern: item.pattern,
      detail_case: item.detailCase,
      male_condition: item.maleCondition,
      female_condition: item.femaleCondition,
      is_active: true,
    })),
)

function buildFortuneRows(
  periodType: CompatibilityFortunePeriodType,
  category: CompatibilityFortuneCategory,
  source: Record<string, { summary: string; detail: string }>,
) {
  return Object.entries(source).map(([copyKey, item]) => ({
    period_type: periodType,
    category,
    copy_key: copyKey,
    summary: item.summary,
    detail: item.detail,
    is_active: true,
  }))
}

export const COMPATIBILITY_FORTUNE_COPY_SEED_ROWS: CompatibilityFortuneCopySeedRow[] = [
  ...buildFortuneRows('daily', 'pair_relation', DAILY_PAIR_TEXT),
  ...buildFortuneRows('monthly', 'pair_relation', MONTHLY_PAIR_TEXT),
  ...buildFortuneRows('yearly', 'pair_relation', YEARLY_PAIR_TEXT),
  ...buildFortuneRows('daewoon', 'track_match', DAEWOON_TRACK_TEXT_BY_RELATION),
  ...buildFortuneRows('daewoon', 'ohang_support', DAEWOON_SUPPORT_TEXT_BY_KEY),
  ...buildFortuneRows('daewoon', 'transition', DAEWOON_TRANSITION_TEXT),
]
