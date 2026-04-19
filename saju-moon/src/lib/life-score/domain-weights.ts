import { TEN_GOD_KR_TO_CODE } from './constants'
import { loadLifeScoreRules } from './load-rules'
import type { DomainScoreMap, LifeDomain, TenGod } from './types'

export type DomainWeightContribution = {
  domain: LifeDomain
  star: TenGod
  strength: number
  weight: number
  contribution: number
}

export function getDomainWeights() {
  return loadLifeScoreRules().domainWeights
}

export function mapKoreanStarScoresToCodes(starScores: Record<string, number>): Partial<Record<TenGod, number>> {
  const mapped: Partial<Record<TenGod, number>> = {}
  for (const [kr, score] of Object.entries(starScores)) {
    const code = TEN_GOD_KR_TO_CODE[kr]
    if (code) mapped[code] = score
  }
  return mapped
}

export function calculateDomainScoresFromStarStrengths(
  starStrengths: Partial<Record<TenGod, number>>,
): { scores: DomainScoreMap; contributions: DomainWeightContribution[] } {
  const rules = getDomainWeights()
  const scores = {
    wealth: 0,
    health: 0,
    business: 0,
    career: 0,
    relationship: 0,
    study: 0,
    social: 0,
  } satisfies DomainScoreMap
  const contributions: DomainWeightContribution[] = []

  for (const [domain, weightMap] of Object.entries(rules) as [LifeDomain, Record<TenGod, number>][]) {
    for (const [star, weight] of Object.entries(weightMap) as [TenGod, number][]) {
      const strength = starStrengths[star] ?? 0
      const contribution = strength * weight
      scores[domain] += contribution
      contributions.push({ domain, star, strength, weight, contribution })
    }
  }

  return { scores, contributions }
}
