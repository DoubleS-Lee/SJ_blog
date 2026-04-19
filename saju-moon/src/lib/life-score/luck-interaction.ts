import type { DaYunCard, ManseryeokData, SeWunCard } from '@/lib/saju/manseryeok'
import {
  INTERACTION_LABELS,
  PALACE_LABELS,
} from './constants'
import {
  completesSamhap,
  detectBranchRelation,
  detectStemRelation,
  isBranchInGongMang,
  scoreInteractionEvent,
} from './interactions'
import type { DomainScoreMap, InteractionType, LifeDomain } from './types'

export type LuckInteractionResult = {
  scores: DomainScoreMap
  tokens: string[]
  intensityBoost: number
  volatilityBoost: number
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function normalizeInteractionScore(raw: number) {
  return clamp(raw, -10, 10)
}

function isNegativeRelation(type: InteractionType) {
  return type === 'chung' || type === 'hyeong' || type === 'pa' || type === 'hae' || type === 'gongmang'
}

function isPositiveRelation(type: InteractionType) {
  return type === 'he' || type === 'samhap' || type === 'cheongan_he'
}

export function calculateLuckInteractionScore(
  data: ManseryeokData,
  daYun: DaYunCard | null,
  seWun: SeWunCard | null,
): LuckInteractionResult {
  const scores = createEmptyDomainScoreMap()
  const tokens: string[] = []

  if (!daYun || !seWun) {
    return {
      scores,
      tokens,
      intensityBoost: 0,
      volatilityBoost: 0,
    }
  }

  const natalBranches = data.pillars.map((pillar) => pillar.jijiKR).filter(Boolean)
  const natalStems = data.pillars.map((pillar) => pillar.cheonganKR).filter(Boolean)
  const dayPillarKongMang = data.pillars[2]?.kongMang ?? ''

  let interactionCount = 0
  let volatilitySeed = 0

  const luckBranchRelation = detectBranchRelation(daYun.jijiKR, seWun.jijiKR)
  const luckStemRelation = detectStemRelation(daYun.cheonganKR, seWun.cheonganKR)
  const completesSharedSamhap = completesSamhap(seWun.jijiKR, [daYun.jijiKR, ...natalBranches])
  const sharedGongMang =
    dayPillarKongMang
      && isBranchInGongMang(daYun.jijiKR, dayPillarKongMang)
      && isBranchInGongMang(seWun.jijiKR, dayPillarKongMang)

  for (const domain of Object.keys(scores) as LifeDomain[]) {
    let raw = 0

    if (luckBranchRelation) {
      raw += scoreInteractionEvent(luckBranchRelation, 'month_branch', domain, 0.95) * 5
    }

    if (luckStemRelation) {
      raw += scoreInteractionEvent(luckStemRelation, 'month_branch', domain, 0.8) * 4
    }

    if (completesSharedSamhap) {
      raw += scoreInteractionEvent('samhap', 'month_branch', domain, 0.95) * 6
    }

    if (sharedGongMang) {
      raw += scoreInteractionEvent('gongmang', 'day_branch', domain, 1) * 8
    }

    for (const natalBranch of natalBranches) {
      const daRel = detectBranchRelation(daYun.jijiKR, natalBranch)
      const seRel = detectBranchRelation(seWun.jijiKR, natalBranch)

      if (daRel && seRel) {
        if (isNegativeRelation(daRel) && isNegativeRelation(seRel)) {
          raw += scoreInteractionEvent(daRel, 'day_branch', domain, 0.65) * 5
        } else if (isPositiveRelation(daRel) && isPositiveRelation(seRel)) {
          raw += scoreInteractionEvent(daRel, 'day_branch', domain, 0.5) * 4
        }
      }
    }

    for (const natalStem of natalStems) {
      const daRel = detectStemRelation(daYun.cheonganKR, natalStem)
      const seRel = detectStemRelation(seWun.cheonganKR, natalStem)

      if (daRel && seRel && isPositiveRelation(daRel) && isPositiveRelation(seRel)) {
        raw += scoreInteractionEvent('cheongan_he', 'month_branch', domain, 0.55) * 3.5
      }
    }

    scores[domain] = normalizeInteractionScore(raw)
  }

  if (luckBranchRelation) {
    interactionCount += 1
    tokens.push(`대운-세운 ${INTERACTION_LABELS[luckBranchRelation]}이 동시에 걸립니다.`)
    volatilitySeed += isNegativeRelation(luckBranchRelation) ? 12 : 5
  }

  if (luckStemRelation) {
    interactionCount += 1
    tokens.push(`대운 천간과 세운 천간에 ${INTERACTION_LABELS[luckStemRelation]}이 형성됩니다.`)
    volatilitySeed += 4
  }

  if (completesSharedSamhap) {
    interactionCount += 1
    tokens.push(`원국-대운-세운이 함께 삼합 구도를 만들어 힘이 집중됩니다.`)
    volatilitySeed += 6
  }

  if (sharedGongMang) {
    interactionCount += 1
    tokens.push(`대운과 세운이 모두 일주 공망에 닿아 체감 변동이 커질 수 있습니다.`)
    volatilitySeed += 14
  }

  for (const natalBranch of natalBranches) {
    const daRel = detectBranchRelation(daYun.jijiKR, natalBranch)
    const seRel = detectBranchRelation(seWun.jijiKR, natalBranch)

    if (daRel && seRel) {
      interactionCount += 1
      const palaceLabel = PALACE_LABELS[
        natalBranch === data.pillars[2]?.jijiKR
          ? 'day_branch'
          : natalBranch === data.pillars[1]?.jijiKR
            ? 'month_branch'
            : natalBranch === data.pillars[3]?.jijiKR
              ? 'time_branch'
              : 'year_branch'
      ]
      if (isNegativeRelation(daRel) && isNegativeRelation(seRel)) {
        tokens.push(`원국 ${palaceLabel}에 대운·세운의 부정 신호가 겹쳐 체감 압박이 커질 수 있습니다.`)
        volatilitySeed += 10
      } else if (isPositiveRelation(daRel) && isPositiveRelation(seRel)) {
        tokens.push(`원국 ${palaceLabel}에 대운·세운의 보강 신호가 겹쳐 상승 체감이 커질 수 있습니다.`)
        volatilitySeed += 4
      }
    }
  }

  return {
    scores,
    tokens,
    intensityBoost: clamp(interactionCount * 5, 0, 30),
    volatilityBoost: clamp(volatilitySeed, 0, 35),
  }
}
