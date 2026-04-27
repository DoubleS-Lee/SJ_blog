import type { ManseryeokData } from '@/lib/saju/manseryeok'
import { buildDailyCompatibilityFortuneResult } from './fortune'
import { fetchCompatibilityCopyFromDb, fetchCompatibilityFortuneCopyFromDb } from './copy-repository'
import { buildCompatibilityPreviewCards } from './rules'
import { renderCompatibilityTemplate } from './template'

export async function buildCompatibilityPreviewCardsWithDb(
  male: ManseryeokData,
  female: ManseryeokData,
) {
  const localCards = buildCompatibilityPreviewCards(male, female)

  return Promise.all(
    localCards.map(async (card) => {
      const dbCopy = await fetchCompatibilityCopyFromDb(card.section, card.copyKey)

      if (!dbCopy) {
        return card
      }

      return {
        ...card,
        title: dbCopy.title,
        summary: dbCopy.summary,
        detail: dbCopy.detail,
        variant: dbCopy.pattern,
        pattern: dbCopy.pattern,
        detailCase: dbCopy.detailCase,
        maleCondition: dbCopy.maleCondition,
        femaleCondition: dbCopy.femaleCondition,
      }
    }),
  )
}

function periodToDbPeriod(period: 'today' | 'month' | 'year') {
  if (period === 'today') return 'daily'
  if (period === 'month') return 'monthly'
  return 'yearly'
}

export async function buildDailyCompatibilityFortuneResultWithDb(input: {
  meName: string
  targetName: string
  meDayBranch: string
  targetDayBranch: string
  reference: {
    solarDateLabel: string
    solarYear: number
    solarMonth: number
    solarDay: number
    dayBranch: string
    monthBranch: string
    yearBranch: string
  }
}) {
  const localResult = buildDailyCompatibilityFortuneResult(input)

  const [today, month, year] = await Promise.all(
    (['today', 'month', 'year'] as const).map(async (period) => {
      const localCard = localResult[period]
      const copyKey = `${localCard.meRelation}|${localCard.targetRelation}`
      const dbCopy = await fetchCompatibilityFortuneCopyFromDb(
        periodToDbPeriod(period),
        'pair_relation',
        copyKey,
      )

      if (!dbCopy) {
        return localCard
      }

      return {
        ...localCard,
        summary: renderCompatibilityTemplate(dbCopy.summary, {
          meName: input.meName,
          targetName: input.targetName,
        }),
        detail: renderCompatibilityTemplate(dbCopy.detail, {
          meName: input.meName,
          targetName: input.targetName,
        }),
      }
    }),
  )

  return { today, month, year }
}
