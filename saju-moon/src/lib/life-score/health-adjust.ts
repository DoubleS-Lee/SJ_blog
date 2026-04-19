import type { ManseryeokData } from '@/lib/saju/manseryeok'
import { detectBranchRelation } from './interactions'
import type { DomainScoreContributor } from './types'

type HealthAdjustmentResult = {
  score: number
  contributors: DomainScoreContributor[]
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export function calculateHealthAdjustment(data: ManseryeokData): HealthAdjustmentResult {
  const contributors: DomainScoreContributor[] = []
  let score = 0

  const ohangValues = Object.values(data.ohangScores)
  const maxOhang = Math.max(...ohangValues)
  const minOhang = Math.min(...ohangValues)
  const ohangGap = maxOhang - minOhang

  if (ohangGap >= 28) {
    score -= 0.42
    contributors.push({
      domain: 'health',
      source: 'health',
      label: '오행 편중이 커서 체력과 회복 리듬이 흔들리기 쉽습니다.',
      value: -0.42,
    })
  } else if (ohangGap >= 18) {
    score -= 0.22
    contributors.push({
      domain: 'health',
      source: 'health',
      label: '오행 편차가 있어 컨디션 기복이 생기기 쉬운 편입니다.',
      value: -0.22,
    })
  } else {
    score += 0.14
    contributors.push({
      domain: 'health',
      source: 'health',
      label: '오행 분포가 비교적 고르게 유지되어 기본 회복력이 안정적입니다.',
      value: 0.14,
    })
  }

  if (data.strength <= 32 || data.strength >= 74) {
    score -= 0.24
    contributors.push({
      domain: 'health',
      source: 'health',
      label: '신강·신약 치우침이 커서 무리하면 소모가 누적되기 쉽습니다.',
      value: -0.24,
    })
  } else if (data.strength >= 42 && data.strength <= 62) {
    score += 0.12
    contributors.push({
      domain: 'health',
      source: 'health',
      label: '신강신약 균형이 중간대라 체력 운용이 비교적 무난합니다.',
      value: 0.12,
    })
  }

  const monthBranch = data.pillars[1]?.jijiKR ?? ''
  const dayBranch = data.pillars[2]?.jijiKR ?? ''
  const timeBranch = data.pillars[3]?.jijiKR ?? ''

  const sensitiveRelations = [
    { relation: detectBranchRelation(monthBranch, dayBranch), label: '월지와 일지 사이 긴장이 몸의 피로 신호로 이어지기 쉽습니다.' },
    { relation: detectBranchRelation(dayBranch, timeBranch), label: '일지와 시지의 압박이 후반 체력 리듬을 흔들 수 있습니다.' },
  ]

  for (const item of sensitiveRelations) {
    if (!item.relation) continue

    if (item.relation === 'chung') {
      score -= 0.22
      contributors.push({
        domain: 'health',
        source: 'interaction',
        label: item.label,
        value: -0.22,
      })
    } else if (item.relation === 'hyeong' || item.relation === 'pa' || item.relation === 'hae') {
      score -= 0.14
      contributors.push({
        domain: 'health',
        source: 'interaction',
        label: item.label,
        value: -0.14,
      })
    } else if (item.relation === 'he' || item.relation === 'samhap') {
      score += 0.08
      contributors.push({
        domain: 'health',
        source: 'interaction',
        label: '생활 리듬을 받쳐주는 결속이 있어 컨디션 관리에 완충 여지가 있습니다.',
        value: 0.08,
      })
    }
  }

  return {
    score: clamp(score, -1, 1),
    contributors: contributors.sort((a, b) => Math.abs(b.value) - Math.abs(a.value)),
  }
}
