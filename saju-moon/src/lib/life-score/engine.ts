import type { ManseryeokData } from '@/lib/saju/manseryeok'
import { calculateBaseScore } from './base-score'
import { calculateDaYunScore } from './daewoon-score'
import {
  applyAgeActivation,
  applyDisplayAdjust,
  getAgeActivationMeta,
  getTransitionPenalty,
  getTransitionVolatilityBonus,
} from './display-adjust'
import { calculateLuckInteractionScore } from './luck-interaction'
import { calculateSeWunScore } from './sewoon-score'
import type { DomainScoreMap, LifeGraphSeriesPoint, LifeScoreEngineSnapshot } from './types'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function getVolatilityWeight(type: string) {
  switch (type) {
    case 'chung':
      return 18
    case 'gongmang':
      return 14
    case 'hyeong':
      return 12
    case 'pa':
      return 10
    case 'hae':
      return 8
    case 'samhap':
      return 7
    case 'he':
      return 6
    case 'cheongan_he':
      return 5
    default:
      return 6
  }
}

function createEmptyDomainScoreMap(): DomainScoreMap {
  return {
    wealth: 0,
    health: 0,
    business: 0,
    career: 0,
    relationship: 0,
    study: 0,
    social: 0,
  }
}

function combineDomainScores(...scoreMaps: DomainScoreMap[]): DomainScoreMap {
  const result = createEmptyDomainScoreMap()

  for (const scoreMap of scoreMaps) {
    for (const key of Object.keys(result) as Array<keyof DomainScoreMap>) {
      result[key] += scoreMap[key]
    }
  }

  return result
}

export function buildLifeScoreEngineSnapshot(data: ManseryeokData): LifeScoreEngineSnapshot {
  const { result, interactionEvents } = calculateBaseScore(data)

  const intensity = clamp(interactionEvents.length * 14, 0, 100)
  const volatility = clamp(
    interactionEvents.reduce((sum, event) => sum + getVolatilityWeight(event.type), 0),
    0,
    100,
  )

  const tokens = interactionEvents.map((event) => event.note ?? `${event.palace}:${event.type}`)

  return {
    baseScore: result,
    intensity,
    volatility,
    tokens,
  }
}

export function buildLifeGraphSeries(
  data: ManseryeokData,
  options?: { startAge?: number; endAge?: number },
): LifeGraphSeriesPoint[] {
  const startAge = options?.startAge ?? 0
  const endAge = options?.endAge ?? 100
  const base = calculateBaseScore(data).result.domains
  const points: LifeGraphSeriesPoint[] = []
  let previousDisplayed: DomainScoreMap | null = null

  for (let age = startAge; age <= endAge; age += 1) {
    const daYun = calculateDaYunScore(data, age)
    const seWun = calculateSeWunScore(data, age)
    const currentDaYun = data.daYun.find((card) => age >= card.startAge && age < card.endAge) ?? null
    const currentSeWun = data.allSeWun.find((card) => card.year === data.solarYear + age) ?? null
    const luckInteraction = calculateLuckInteractionScore(data, currentDaYun, currentSeWun)
    const combined = combineDomainScores(base, daYun, seWun, luckInteraction.scores)
    const activated = applyAgeActivation(combined, age)
    const transitionPenalty = getTransitionPenalty(data, age)
    const adjusted = combineDomainScores(activated, transitionPenalty)
    const displayed = applyDisplayAdjust(adjusted, previousDisplayed)
    const { labels } = getAgeActivationMeta(age)

    const intensity = clamp(
      Object.values(seWun).reduce((sum, value) => sum + Math.abs(value), 0) * 0.8
        + Object.values(daYun).reduce((sum, value) => sum + Math.abs(value), 0) * 0.5
        + luckInteraction.intensityBoost,
      0,
      100,
    )

    const volatility = clamp(
      Object.values(seWun).reduce((sum, value) => sum + Math.abs(value), 0) * 1.1
        + luckInteraction.volatilityBoost
        + getTransitionVolatilityBonus(data, age),
      0,
      100,
    )

    points.push({
      age,
      year: data.solarYear + age,
      domains: displayed,
      labels,
      intensity,
      volatility,
    })

    previousDisplayed = displayed
  }

  return points
}
