import type { DaYunCard, ManseryeokData } from '@/lib/saju/manseryeok'
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
  return clamp(raw, -18, 18)
}

function getLuckDiShiBonus(diShi: string) {
  if (STRONG_DI_SHI.has(diShi)) return 1.8
  if (WEAK_DI_SHI.has(diShi)) return -1.8
  return 0
}

function scoreSingleDaYunCard(data: ManseryeokData, card: DaYunCard): DomainScoreMap {
  const scores = createEmptyDomainScoreMap()
  const domainWeights = getDomainWeights()
  const ganStar = TEN_GOD_KR_TO_CODE[card.sipsung_gan]
  const jiStar = TEN_GOD_KR_TO_CODE[card.sipsung_jiji]
  const natalBranches = data.pillars.map((pillar) => pillar.jijiKR).filter(Boolean)
  const natalStems = data.pillars.map((pillar) => pillar.cheonganKR).filter(Boolean)
  const dayPillarKongMang = data.pillars[2]?.kongMang ?? ''

  for (const domain of Object.keys(scores) as LifeDomain[]) {
    let raw = 0

    if (ganStar) raw += domainWeights[domain][ganStar] * 7
    if (jiStar) raw += domainWeights[domain][jiStar] * 5
    raw += getLuckDiShiBonus(card.diShi)

    for (const natalBranch of natalBranches) {
      const relation = detectBranchRelation(card.jijiKR, natalBranch)
      if (!relation) continue
      raw += scoreInteractionEvent(relation, 'month_branch', domain, 0.8) * 6
    }

    if (completesSamhap(card.jijiKR, natalBranches)) {
      raw += scoreInteractionEvent('samhap', 'month_branch', domain, 0.85) * 6
    }

    for (const natalStem of natalStems) {
      const relation = detectStemRelation(card.cheonganKR, natalStem)
      if (!relation) continue
      raw += scoreInteractionEvent(relation, 'month_branch', domain, 0.75) * 5
    }

    if (dayPillarKongMang && isBranchInGongMang(card.jijiKR, dayPillarKongMang)) {
      raw += scoreInteractionEvent('gongmang', 'day_branch', domain, 0.95) * 7
    }

    scores[domain] = normalizeLuckScore(raw)
  }

  return scores
}

export function findDaYunForAge(data: ManseryeokData, age: number): DaYunCard | null {
  return data.daYun.find((card) => age >= card.startAge && age < card.endAge) ?? null
}

export function calculateDaYunScore(data: ManseryeokData, age: number): DomainScoreMap {
  const current = findDaYunForAge(data, age)
  if (!current) return createEmptyDomainScoreMap()
  return scoreSingleDaYunCard(data, current)
}
