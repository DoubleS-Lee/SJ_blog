import type { ManseryeokData } from '@/lib/saju/manseryeok'
import { loadLifeScoreRules } from './load-rules'
import { getThermalProfile } from './johoo'
import type { DomainScoreContributor, LifeDomain, TenGod } from './types'

type YongheegiRole = 'self' | 'resource' | 'output' | 'wealth' | 'officer'
type StrengthProfile = 'weak' | 'balanced' | 'strong'

type YongheegiDomainAdjustment = {
  score: number
  contributors: DomainScoreContributor[]
}

type YongheegiAdjustmentMap = Record<LifeDomain, YongheegiDomainAdjustment>

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function createBaseResult(): YongheegiAdjustmentMap {
  return {
    wealth: { score: 0, contributors: [] },
    health: { score: 0, contributors: [] },
    business: { score: 0, contributors: [] },
    career: { score: 0, contributors: [] },
    relationship: { score: 0, contributors: [] },
    study: { score: 0, contributors: [] },
    social: { score: 0, contributors: [] },
  }
}

function getStrengthProfile(data: ManseryeokData): StrengthProfile {
  const rules = loadLifeScoreRules().yongheegiRules
  if (data.strength <= rules.strength_thresholds.weak_max) return 'weak'
  if (data.strength >= rules.strength_thresholds.strong_min) return 'strong'
  return 'balanced'
}

function getRoleBuckets(starStrengths: Partial<Record<TenGod, number>>) {
  return {
    self: (starStrengths.bigeon ?? 0) + (starStrengths.geopjae ?? 0),
    resource: (starStrengths.pyeonin ?? 0) + (starStrengths.jeongin ?? 0),
    output: (starStrengths.siksin ?? 0) + (starStrengths.sanggwan ?? 0),
    wealth: (starStrengths.pyeonjae ?? 0) + (starStrengths.jeongjae ?? 0),
    officer: (starStrengths.pyeongwan ?? 0) + (starStrengths.jeonggwan ?? 0),
  } satisfies Record<YongheegiRole, number>
}

function getRoleSummaryLabel(role: YongheegiRole, positive: boolean) {
  const phrases: Record<YongheegiRole, [string, string]> = {
    self: ['비겁 기운이 일간을 받쳐 줍니다.', '비겁 기운이 과해 일간 균형을 무겁게 만듭니다.'],
    resource: ['인성 기운이 일간 회복과 보완에 힘을 줍니다.', '인성 기운이 과중해 흐름을 답답하게 만들 수 있습니다.'],
    output: ['식상 기운이 배출과 실행 흐름을 열어 줍니다.', '식상 기운이 부족하거나 눌려 흐름이 막힐 수 있습니다.'],
    wealth: ['재성 기운이 현실성과 수익화 흐름을 살립니다.', '재성 기운이 과하거나 부담이 되어 압박으로 작용할 수 있습니다.'],
    officer: ['관성 기운이 방향성과 규율을 잡아 줍니다.', '관성 기운이 과해 압박과 경직으로 체감될 수 있습니다.'],
  }

  return positive ? phrases[role][0] : phrases[role][1]
}

export function calculateYongheegiAdjustments(
  data: ManseryeokData,
  starStrengths: Partial<Record<TenGod, number>>,
): YongheegiAdjustmentMap {
  const rules = loadLifeScoreRules().yongheegiRules
  const result = createBaseResult()
  const strengthProfile = getStrengthProfile(data)
  const roleBuckets = getRoleBuckets(starStrengths)
  const roleWeights = rules.role_weights[strengthProfile]
  const thermalProfile = getThermalProfile(data)

  const roleBase = (Object.keys(roleBuckets) as YongheegiRole[]).reduce((sum, role) => {
    return sum + roleBuckets[role] * roleWeights[role]
  }, 0)

  let thermalScalar = rules.thermal_weights.balanced.bonus
  let thermalLabel = '계절감이 한쪽으로 크게 치우치지 않아 용희기신 판단이 안정적으로 작동합니다.'

  if (thermalProfile.dominant === 'cold') {
    const favorable = (data.ohangScores['화'] ?? 0) + (data.ohangScores['목'] ?? 0)
    const unfavorable = (data.ohangScores['수'] ?? 0) + (data.ohangScores['금'] ?? 0)
    thermalScalar =
      ((favorable - unfavorable) / Math.max(data.totalScore, 1)) * 2 + rules.thermal_weights.cold.bonus
    thermalLabel =
      favorable >= unfavorable
        ? '차가운 조후를 덥혀 주는 기운이 있어 용신 계열의 작동 여지가 생깁니다.'
        : '차가운 조후를 더 차게 만드는 기운이 겹쳐 기신 부담이 커질 수 있습니다.'
  } else if (thermalProfile.dominant === 'hot') {
    const favorable = (data.ohangScores['수'] ?? 0) + (data.ohangScores['금'] ?? 0)
    const unfavorable = (data.ohangScores['화'] ?? 0) + (data.ohangScores['목'] ?? 0)
    thermalScalar =
      ((favorable - unfavorable) / Math.max(data.totalScore, 1)) * 2 + rules.thermal_weights.hot.bonus
    thermalLabel =
      favorable >= unfavorable
        ? '뜨거운 조후를 식혀 주는 기운이 있어 희신 쪽 보완력이 살아납니다.'
        : '뜨거운 조후를 더 자극하는 기운이 강해 균형 유지가 더 중요합니다.'
  }

  const topRoles = (Object.keys(roleBuckets) as YongheegiRole[])
    .map((role) => ({
      role,
      value: roleBuckets[role] * roleWeights[role],
    }))
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
    .slice(0, 2)

  for (const domain of Object.keys(result) as LifeDomain[]) {
    const weightedBase = roleBase * rules.domain_weights[domain]
    const weightedThermal = thermalScalar * rules.domain_weights[domain] * 0.8
    const score = clamp(weightedBase + weightedThermal, -1, 1)

    result[domain].score = score
    result[domain].contributors.push({
      domain,
      source: 'yongheegi',
      label:
        strengthProfile === 'weak'
          ? '신약 구조 기준으로 비겁·인성 쪽을 용희 방향으로 보는 경량판이 반영됩니다.'
          : strengthProfile === 'strong'
            ? '신강 구조 기준으로 식상·재성·관성 쪽을 용희 방향으로 보는 경량판이 반영됩니다.'
            : '중화에 가까운 구조라 한쪽으로 치우치지 않는 균형형 용희 판단이 반영됩니다.',
      value: weightedBase,
    })

    result[domain].contributors.push({
      domain,
      source: 'yongheegi',
      label: thermalLabel,
      value: weightedThermal,
    })

    for (const role of topRoles) {
      result[domain].contributors.push({
        domain,
        source: 'yongheegi',
        label: getRoleSummaryLabel(role.role, role.value >= 0),
        value: role.value * rules.domain_weights[domain] * 0.7,
      })
    }

    result[domain].contributors.sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
  }

  return result
}
