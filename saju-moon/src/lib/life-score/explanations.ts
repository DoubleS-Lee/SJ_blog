import type { ManseryeokData } from '@/lib/saju/manseryeok'
import { calculateDaYunScore, findDaYunForAge } from './daewoon-score'
import { calculateSeWunScore, findSeWunForAge } from './sewoon-score'
import type {
  BaseScoreBreakdown,
  BaseScoreResult,
  DomainScoreContributor,
  LifeDomain,
  LifeGraphSeriesPoint,
} from './types'

export type DomainExplanation = {
  domain: LifeDomain
  headline: string
  summary: string
  currentReason: string
  trendReason: string
  caution: string
}

export type NearFutureSummary = {
  currentAge: number
  futureAge: number
  risingDomains: LifeDomain[]
  fallingDomains: LifeDomain[]
  avgIntensity: number
  avgVolatility: number
  summary: string
}

const DOMAIN_LABELS: Record<LifeDomain, string> = {
  wealth: '재물운',
  health: '건강운',
  business: '사업운',
  career: '직장운',
  relationship: '연애/관계운',
  study: '학업/성장운',
  social: '대인관계운',
}

function formatScore(value: number) {
  return Math.round(value * 10) / 10
}

function findPreviousPoint(series: LifeGraphSeriesPoint[], age: number, step: number) {
  return series.find((point) => point.age === Math.max(0, age - step)) ?? series[0] ?? null
}

function getScoreBandLabel(score: number) {
  if (score >= 72) return '강한 상승권'
  if (score >= 58) return '안정 상승권'
  if (score >= 45) return '중간 흐름'
  if (score >= 30) return '조정 구간'
  return '보수 대응 구간'
}

function getLuckDriverSentence(
  domain: LifeDomain,
  type: 'base' | 'daYun' | 'seWun',
  value: number,
) {
  const positive = value >= 0

  const phrases: Record<LifeDomain, Record<typeof type, [string, string]>> = {
    wealth: {
      base: ['원국에서 재물 흐름의 기본 체력이 받쳐주는 편입니다.', '원국에서 재물 흐름의 기본 체력이 약한 편입니다.'],
      daYun: ['현재 대운이 재물 흐름을 밀어주는 방향입니다.', '현재 대운이 재물 흐름을 눌러주는 방향입니다.'],
      seWun: ['세운에서 돈의 흐름과 기회가 보강되고 있습니다.', '세운에서 지출과 재물 변동성이 커질 수 있습니다.'],
    },
    health: {
      base: ['원국 기준 체력과 회복 리듬이 비교적 안정적입니다.', '원국 기준 체력 관리에 더 신경 써야 하는 구조입니다.'],
      daYun: ['현재 대운이 생활 리듬을 안정시키는 쪽으로 작용합니다.', '현재 대운이 피로 누적과 생활 리듬 흔들림을 키우는 편입니다.'],
      seWun: ['세운에서 회복력과 컨디션 관리 여지가 생깁니다.', '세운에서 과로와 컨디션 저하 신호가 커질 수 있습니다.'],
    },
    business: {
      base: ['원국의 실행력과 수익화 구조가 사업운의 바탕을 받칩니다.', '원국의 사업 추진 축은 보완이 필요한 편입니다.'],
      daYun: ['현재 대운이 확장과 실행 쪽으로 힘을 실어줍니다.', '현재 대운은 사업 판단을 보수적으로 가져가게 합니다.'],
      seWun: ['세운에서 작은 기회와 실행 타이밍이 살아납니다.', '세운에서 사업 방향 조정 이슈가 커질 수 있습니다.'],
    },
    career: {
      base: ['원국의 조직 적응력과 책임 구조가 직장운의 기반입니다.', '원국에서 직장운은 성과보다 적응 관리가 먼저 필요한 편입니다.'],
      daYun: ['현재 대운이 역할 확장과 직장 성과를 밀어줍니다.', '현재 대운은 직장 내 압박과 방향 조정 가능성을 높입니다.'],
      seWun: ['세운에서 평가와 자리 이동 흐름이 보강됩니다.', '세운에서 직장 내 긴장이나 재정비 이슈가 생길 수 있습니다.'],
    },
    relationship: {
      base: ['원국의 관계 체력과 정서 구조가 기본 바탕을 만듭니다.', '원국에서 관계 안정성은 꾸준한 관리가 필요한 편입니다.'],
      daYun: ['현재 대운이 만남과 관계 흐름을 부드럽게 열어줍니다.', '현재 대운은 거리감과 관계 재정비를 요구하는 흐름입니다.'],
      seWun: ['세운에서 감정 교류와 관계 이벤트가 살아납니다.', '세운에서 감정 기복과 관계 피로가 커질 수 있습니다.'],
    },
    study: {
      base: ['원국의 흡수력과 성장 구조가 학업운의 기본점이 됩니다.', '원국에서 학업운은 집중과 리듬 관리가 더 중요합니다.'],
      daYun: ['현재 대운이 배움과 자기계발 흐름을 밀어줍니다.', '현재 대운은 성장보다 현실 과제가 더 앞서는 흐름입니다.'],
      seWun: ['세운에서 학습 동기와 성과 출력이 살아납니다.', '세운에서 집중 분산이나 목표 재정리가 필요할 수 있습니다.'],
    },
    social: {
      base: ['원국의 네트워크 체력과 소통 구조가 바탕입니다.', '원국에서 대인관계는 거리 조절이 중요한 편입니다.'],
      daYun: ['현재 대운이 인맥과 협업 흐름을 넓혀줍니다.', '현재 대운은 인간관계 조정과 거리 두기를 요구합니다.'],
      seWun: ['세운에서 새로운 연결과 교류가 늘어나기 쉽습니다.', '세운에서 사람 문제나 감정 소모가 커질 수 있습니다.'],
    },
  }

  return positive ? phrases[domain][type][0] : phrases[domain][type][1]
}

function getTrendPhrase(delta: number) {
  if (delta >= 8) return '최근 10년과 비교하면 상승 탄력이 분명한 구간입니다.'
  if (delta >= 3) return '최근 10년과 비교하면 완만한 상승 흐름으로 읽힙니다.'
  if (delta <= -8) return '최근 10년과 비교하면 조정 폭이 커져 속도 조절이 필요한 구간입니다.'
  if (delta <= -3) return '최근 10년보다 다소 눌린 흐름이라 체력 안배가 중요합니다.'
  return '최근 10년과 비교하면 큰 출렁임보다 미세 조정에 가까운 흐름입니다.'
}

function getCautionPhrase(score: number, volatility: number, downside: DomainScoreContributor[]) {
  if (downside.length > 0) {
    return `주의 포인트는 ${downside[0]!.label}`
  }
  if (volatility >= 45) {
    return '변동성이 큰 시기라서 좋은 점수가 보여도 무리한 확장은 피하는 편이 좋습니다.'
  }
  if (score <= 35) {
    return '점수가 낮은 구간이므로 성과 확장보다 회복과 정비 쪽에 무게를 두는 편이 안전합니다.'
  }
  if (score >= 70) {
    return '상승 구간이어도 과속하면 피로가 누적되기 쉬우니 균형을 함께 보세요.'
  }
  return '무난한 흐름이지만 선택과 집중에 따라 체감 차이가 벌어질 수 있습니다.'
}

function getDomainBreakdown(baseScore: BaseScoreResult, domain: LifeDomain): BaseScoreBreakdown {
  return baseScore.breakdowns.find((item) => item.domain === domain) ?? {
    domain,
    starScore: 0,
    interactionScore: 0,
    healthAdjustmentScore: 0,
    johuScore: 0,
    yongheeScore: 0,
    contributors: [],
    total: baseScore.domains[domain],
  }
}

function pickTopContributors(contributors: DomainScoreContributor[], positive: boolean, limit: number) {
  return contributors
    .filter((item) => (positive ? item.value > 0 : item.value < 0))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, limit)
}

function joinContributorLabels(items: DomainScoreContributor[]) {
  return items.map((item) => item.label).join(' ')
}

export function buildDomainExplanations(
  data: ManseryeokData,
  baseScore: BaseScoreResult,
  series: LifeGraphSeriesPoint[],
  currentAge: number,
): Record<LifeDomain, DomainExplanation> {
  const currentPoint =
    series.find((point) => point.age === currentAge) ??
    series[series.length - 1] ??
    null

  if (!currentPoint) {
    throw new Error('Life graph series is empty.')
  }

  const previousPoint = findPreviousPoint(series, currentAge, 10) ?? currentPoint
  const daYunScores = calculateDaYunScore(data, currentAge)
  const seWunScores = calculateSeWunScore(data, currentAge)
  const currentDaYun = findDaYunForAge(data, currentAge)
  const currentSeWun = findSeWunForAge(data, currentAge)

  const explanations = {} as Record<LifeDomain, DomainExplanation>

  for (const domain of Object.keys(currentPoint.domains) as LifeDomain[]) {
    const score = currentPoint.domains[domain]
    const delta10 = score - previousPoint.domains[domain]
    const daYun = daYunScores[domain]
    const seWun = seWunScores[domain]
    const breakdown = getDomainBreakdown(baseScore, domain)
    const positiveDrivers = pickTopContributors(breakdown.contributors, true, 2)
    const downsideDrivers = pickTopContributors(breakdown.contributors, false, 2)
    const strongestLuckDriver =
      Math.abs(daYun) >= Math.abs(seWun)
        ? getLuckDriverSentence(domain, 'daYun', daYun)
        : getLuckDriverSentence(domain, 'seWun', seWun)

    const summaryParts = [
      `${DOMAIN_LABELS[domain]}은 현재 ${formatScore(score)}점으로 ${getScoreBandLabel(score)}에 들어 있습니다.`,
      `원국 기본점은 ${formatScore(baseScore.domains[domain])}점이라 타고난 바탕은 ${baseScore.domains[domain] >= 55 ? '상대적으로 안정적인 편' : baseScore.domains[domain] >= 45 ? '보통 수준' : '보완이 필요한 편'}입니다.`,
    ]

    const currentReasonParts = [
      getLuckDriverSentence(domain, 'base', breakdown.total - 50),
      positiveDrivers.length > 0 ? `지금 점수를 받치는 핵심 요인은 ${joinContributorLabels(positiveDrivers)}` : null,
      strongestLuckDriver,
      currentDaYun ? `${currentDaYun.cheonganKR}${currentDaYun.jijiKR} 대운이 현재 구간의 큰 방향을 만들고 있습니다.` : null,
      currentSeWun ? `${currentSeWun.year}년 ${currentSeWun.cheonganKR}${currentSeWun.jijiKR} 세운이 올해 체감의 미세 조정을 맡고 있습니다.` : null,
    ].filter(Boolean)

    const trendReasonParts = [
      getTrendPhrase(delta10),
      Math.abs(daYun) >= Math.abs(seWun)
        ? `지금은 세운보다 대운의 영향이 더 크게 작용합니다.`
        : `지금은 대운보다 세운의 체감 변동이 더 크게 드러납니다.`,
    ]

    explanations[domain] = {
      domain,
      headline: `${currentPoint.labels[domain]} · ${getScoreBandLabel(score)}`,
      summary: summaryParts.join(' '),
      currentReason: currentReasonParts.join(' '),
      trendReason: trendReasonParts.join(' '),
      caution: getCautionPhrase(score, currentPoint.volatility, downsideDrivers),
    }
  }

  return explanations
}

export function buildNearFutureSummary(
  series: LifeGraphSeriesPoint[],
  currentAge: number,
): NearFutureSummary {
  const currentPoint =
    series.find((point) => point.age === currentAge) ??
    series[series.length - 1] ??
    null

  if (!currentPoint) {
    throw new Error('Life graph series is empty.')
  }

  const futureAge = Math.min(100, currentAge + 10)
  const futurePoint =
    series.find((point) => point.age === futureAge) ??
    series[series.length - 1] ??
    currentPoint

  const deltaEntries = (Object.keys(currentPoint.domains) as LifeDomain[]).map((domain) => ({
    domain,
    delta: futurePoint.domains[domain] - currentPoint.domains[domain],
  }))

  const risingDomains = [...deltaEntries]
    .sort((a, b) => b.delta - a.delta)
    .filter((entry) => entry.delta > 1)
    .slice(0, 2)
    .map((entry) => entry.domain)

  const fallingDomains = [...deltaEntries]
    .sort((a, b) => a.delta - b.delta)
    .filter((entry) => entry.delta < -1)
    .slice(0, 2)
    .map((entry) => entry.domain)

  const windowSeries = series.filter((point) => point.age >= currentAge && point.age <= futureAge)
  const avgIntensity =
    windowSeries.reduce((sum, point) => sum + point.intensity, 0) / Math.max(windowSeries.length, 1)
  const avgVolatility =
    windowSeries.reduce((sum, point) => sum + point.volatility, 0) / Math.max(windowSeries.length, 1)

  const summaryParts = [
    risingDomains.length > 0
      ? `상승 여지가 큰 축은 ${risingDomains.map((domain) => DOMAIN_LABELS[domain]).join(', ')}입니다.`
      : `상승폭이 한쪽으로 치우치기보다 고르게 움직이는 10년입니다.`,
    fallingDomains.length > 0
      ? `조정 가능성이 큰 축은 ${fallingDomains.map((domain) => DOMAIN_LABELS[domain]).join(', ')}입니다.`
      : `강한 하락축보다 완만한 조정 흐름이 이어질 가능성이 큽니다.`,
    avgVolatility >= 40
      ? '변동성이 다소 큰 구간이라 선택과 타이밍에 따라 체감 차이가 커질 수 있습니다.'
      : '변동성이 과도하지 않아 방향만 잘 잡으면 비교적 읽기 쉬운 흐름입니다.',
  ]

  return {
    currentAge,
    futureAge,
    risingDomains,
    fallingDomains,
    avgIntensity: formatScore(avgIntensity),
    avgVolatility: formatScore(avgVolatility),
    summary: summaryParts.join(' '),
  }
}
