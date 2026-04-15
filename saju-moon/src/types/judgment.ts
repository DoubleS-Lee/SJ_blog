import type { JSONContent } from '@tiptap/react'
import type { Ohang, Sipsung, Cheongan, Jiji } from './saju'

export type PillarKey = 'year' | 'month' | 'day' | 'hour'

// ① ③ ⑤ ⑦  원국 천간 조건 (연간/월간/일간/시간 중 하나 선택)
export interface PillarCheonganCondition {
  type: 'pillar_cheongan'
  pillar: PillarKey
  values: Cheongan[]   // 선택된 천간 목록 — 하나라도 일치하면 충족
  enabled: boolean
}

// ② ④ ⑥ ⑧  원국 지지 조건 (연지/월지/일지/시지 중 하나 선택)
export interface PillarJijiCondition {
  type: 'pillar_jiji'
  pillar: PillarKey
  values: Jiji[]       // 선택된 지지 목록 — 하나라도 일치하면 충족
  enabled: boolean
}

// ⑨  오행 유무 조건
export interface OhangPresenceCondition {
  type: 'ohang_presence'
  ohang: Ohang
  mode: 'has' | 'no'   // 있음 / 없음
  enabled: boolean
}

// ⑩  오행 점수 임계값 조건
export interface OhangScoreCondition {
  type: 'ohang_score'
  ohang: Ohang
  operator: 'gte' | 'lte'   // ≥ / ≤
  threshold: number
  enabled: boolean
}

// ⑪  십성 유무 조건
export interface SipsungPresenceCondition {
  type: 'sipsung_presence'
  sipsung: Sipsung
  mode: 'has' | 'no'
  enabled: boolean
}

// ⑫  십성 점수 임계값 조건
export interface SipsungScoreCondition {
  type: 'sipsung_score'
  sipsung: Sipsung
  operator: 'gte' | 'lte'
  threshold: number
  enabled: boolean
}

// ⑬  60갑자 범위 조건
export interface SixtyGanjiCondition {
  type: 'sixty_ganji'
  scope: 'ilju' | 'all'   // 일주만 / 4주전체
  values: string[]          // e.g. ["갑자", "을축"]
  enabled: boolean
}

// ⑭  세운 천간 십성 조건
export interface SewoonCheonganCondition {
  type: 'sewoon_cheongan'
  values: Sipsung[]   // 하나라도 일치하면 충족
  enabled: boolean
}

// ⑮  세운 지지 십성 조건
export interface SewoonJijiCondition {
  type: 'sewoon_jiji'
  values: Sipsung[]
  enabled: boolean
}

// ⑯  대운 천간 십성 조건
export interface DaewoonCheonganCondition {
  type: 'daewoon_cheongan'
  values: Sipsung[]
  enabled: boolean
}

// ⑰  대운 지지 십성 조건
export interface DaewoonJijiCondition {
  type: 'daewoon_jiji'
  values: Sipsung[]
  enabled: boolean
}

export type JudgmentCondition =
  | PillarCheonganCondition
  | PillarJijiCondition
  | OhangPresenceCondition
  | OhangScoreCondition
  | SipsungPresenceCondition
  | SipsungScoreCondition
  | SixtyGanjiCondition
  | SewoonCheonganCondition
  | SewoonJijiCondition
  | DaewoonCheonganCondition
  | DaewoonJijiCondition

export interface ConditionGroup {
  id: string
  conditions: JudgmentCondition[]
  detail?: JSONContent | null
}

// posts.judgment_rules 컬럼에 저장되는 최상위 구조
export interface JudgmentRules {
  groups: ConditionGroup[]
}
