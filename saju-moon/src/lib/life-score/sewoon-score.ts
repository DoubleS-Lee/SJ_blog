import type { ManseryeokData, SeWunCard } from '@/lib/saju/manseryeok'
import { STRONG_DI_SHI, TEN_GOD_KR_TO_CODE, WEAK_DI_SHI } from './constants'
import { getDomainWeights } from './domain-weights'
import { completesSamhap, detectBranchRelation, detectStemRelation, isBranchInGongMang, scoreInteractionEvent } from './interactions'
import type { DomainScoreMap, LifeDomain } from './types'

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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function normalizeLuckScore(raw: number) {
  return clamp(raw, -12, 12)
}

function getLuckDiShiBonus(diShi: string) {
  if (STRONG_DI_SHI.has(diShi)) return 1.2
  if (WEAK_DI_SHI.has(diShi)) return -1.2
  return 0
}

function scoreSingleSeWunCard(data: ManseryeokData, card: SeWunCard): DomainScoreMap {
  const scores = createEmptyDomainScoreMap()
  const domainWeights = getDomainWeights()
  const ganStar = TEN_GOD_KR_TO_CODE[card.sipsung_gan]
  const jiStar = TEN_GOD_KR_TO_CODE[card.sipsung_jiji]
  const natalBranches = data.pillars.map((pillar) => pillar.jijiKR).filter(Boolean)
  const natalStems = data.pillars.map((pillar) => pillar.cheonganKR).filter(Boolean)
  const dayPillarKongMang = data.pillars[2]?.kongMang ?? ''

  for (const domain of Object.keys(scores) as LifeDomain[]) {
    let raw = 0

    if (ganStar) raw += domainWeights[domain][ganStar] * 4
    if (jiStar) raw += domainWeights[domain][jiStar] * 3
    raw += getLuckDiShiBonus(card.diShi)

    for (const natalBranch of natalBranches) {
      const relation = detectBranchRelation(card.jijiKR, natalBranch)
      if (!relation) continue
      raw += scoreInteractionEvent(relation, 'day_branch', domain, 0.5) * 4
    }

    if (completesSamhap(card.jijiKR, natalBranches)) {
      raw += scoreInteractionEvent('samhap', 'day_branch', domain, 0.65) * 4
    }

    for (const natalStem of natalStems) {
      const relation = detectStemRelation(card.cheonganKR, natalStem)
      if (!relation) continue
      raw += scoreInteractionEvent(relation, 'day_branch', domain, 0.55) * 3.5
    }

    if (dayPillarKongMang && isBranchInGongMang(card.jijiKR, dayPillarKongMang)) {
      raw += scoreInteractionEvent('gongmang', 'day_branch', domain, 0.75) * 5
    }

    scores[domain] = normalizeLuckScore(raw)
  }

  return scores
}

export function findSeWunForAge(data: ManseryeokData, age: number): SeWunCard | null {
  const targetYear = data.solarYear + age
  return data.allSeWun.find((card) => card.year === targetYear) ?? null
}

export function calculateSeWunScore(data: ManseryeokData, age: number): DomainScoreMap {
  const current = findSeWunForAge(data, age)
  if (!current) return createEmptyDomainScoreMap()
  return scoreSingleSeWunCard(data, current)
}
