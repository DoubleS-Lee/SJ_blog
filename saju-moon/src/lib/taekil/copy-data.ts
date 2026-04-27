import type { SelectionPurpose } from '@/lib/saju/date-selection'

export type TaekilLevel = 'best' | 'good' | 'normal' | 'caution' | 'avoid'
export type TaekilCopyGroup = 'page' | 'purpose' | 'level' | 'panel' | 'template'

export type TaekilCopySeedRow = {
  copy_group: TaekilCopyGroup
  copy_key: string
  title: string
  summary: string
  detail: string
  is_active: boolean
}

export type TaekilPurposeCopy = {
  label: string
  shortLabel: string
  description: string
}

export type TaekilLevelCopy = {
  publicLabel: string
  compactLabel: string
}

export type TaekilPageCopy = {
  guestTitle: string
  guestDescription: string
  guestPrimaryCta: string
  guestSecondaryCta: string
  noSajuTitle: string
  noSajuDescription: string
  noSajuPrimaryCta: string
  noSajuSecondaryCta: string
  mainTitle: string
  mainDescription: string
  purposeSectionTitle: string
  purposeSectionDescription: string
  previousMonthLabel: string
  nextMonthLabel: string
  calendarSubtitle: string
  selectedEyebrow: string
  lunarPrefix: string
}

export type TaekilPanelCopy = {
  avoidTitle: string
  avoidFallback: string
  cautionTitle: string
  cautionFallback: string
  normalTitle: string
  normalFallback: string
  noteTitle: string
  recommendedTitle: string
  bestDatesTitle: string
  bestDatesEmpty: string
}

export type TaekilTemplateCopy = {
  diShiReason: string
  diShiCaution: string
  purposeReason: string
  harmonyReason: string
  godReasonMoving: string
  godReasonFormality: string
  godReasonTransaction: string
  godReasonProtection: string
  godReasonRefined: string
  godReasonResponsibility: string
  godReasonDefault: string
  godCautionDelay: string
  godCautionDamage: string
  godCautionGossip: string
  godCautionBlockage: string
  godCautionPressure: string
  godCautionHiddenProblem: string
  godCautionDefault: string
  summaryFallback: string
  normalizeAvoidFallback: string
  timeIncludeReason: string
  timeDayHarmonyReason: string
  timeGeneralFallback: string
  filteredReasonDayClash: string
  cautionDayClash: string
  filteredReasonDayAvoid: string
  cautionXunKong: string
  cautionYearClash: string
  cautionHourClash: string
  cautionMonthClash: string
  cautionHyeong: string
  cautionDayAvoidGeneral: string
  cautionXiongSha: string
  cautionNoGoodHours: string
}

export type TaekilUiCopyBundle = {
  page: TaekilPageCopy
  purposes: Record<SelectionPurpose, TaekilPurposeCopy>
  levels: Record<TaekilLevel, TaekilLevelCopy>
  panels: TaekilPanelCopy
  templates: TaekilTemplateCopy
  weekdays: string[]
}

export const TAEKIL_LOCAL_COPY: TaekilUiCopyBundle = {
  page: {
    guestTitle: '나만의 택일 추천',
    guestDescription:
      '등록하신 생년월일을 기준으로 목적에 맞는 좋은 날을 추천해드립니다.\n로그인 후 사주 정보를 입력하면 바로 개인화 택일 캘린더를 사용할 수 있습니다.',
    guestPrimaryCta: '로그인',
    guestSecondaryCta: '사주 입력 안내',
    noSajuTitle: '나만의 택일 추천',
    noSajuDescription:
      '등록하신 생년월일을 기준으로 목적에 맞는 좋은 날을 추천해드립니다.\n먼저 마이페이지에서 사주 정보를 입력해 주세요.',
    noSajuPrimaryCta: '사주 정보 입력하기',
    noSajuSecondaryCta: '마이페이지',
    mainTitle: '나만의 택일 추천',
    mainDescription:
      '등록하신 생년월일을 기준으로 목적에 맞는 좋은 날을 추천해드립니다.\n결과는 참고용으로 활용하시고 중요한 결정일수록 한 번 더 검토해 보세요.',
    purposeSectionTitle: '목적 선택',
    purposeSectionDescription:
      '목적을 바꾸면 등록한 사주 기준으로 추천일이 다시 계산됩니다.',
    previousMonthLabel: '이전달',
    nextMonthLabel: '다음달',
    calendarSubtitle: '개인화 택일 캘린더',
    selectedEyebrow: 'Selected',
    lunarPrefix: '음력',
  },
  purposes: {
    romance: {
      label: '연애/소개팅',
      shortLabel: '연애',
      description: '호감과 만남의 흐름이 부드러운 날짜를 추천합니다.',
    },
    marriage: {
      label: '결혼/상견례',
      shortLabel: '결혼',
      description: '인연과 만남의 성취감이 강한 날짜를 우선 추천합니다.',
    },
    moving: {
      label: '이사',
      shortLabel: '이사',
      description: '이동과 입주 흐름이 비교적 안정적인 날짜를 추천합니다.',
    },
    opening: {
      label: '개업/오픈',
      shortLabel: '개업',
      description: '문을 열고 손님을 받기 좋은 날짜를 추천합니다.',
    },
    contract: {
      label: '계약/서명',
      shortLabel: '계약',
      description: '문서와 약정, 거래 흐름이 매끄러운 날짜를 추천합니다.',
    },
    interview: {
      label: '면접/시험',
      shortLabel: '면접',
      description: '말과 평가, 출발 흐름이 무난한 날짜를 추천합니다.',
    },
    treatment: {
      label: '수술/시술',
      shortLabel: '수술',
      description: '치료와 회복 관점에서 비교적 무난한 날짜를 추천합니다.',
    },
    travel: {
      label: '여행/출발',
      shortLabel: '여행',
      description: '출행과 이동 흐름이 비교적 편안한 날짜를 추천합니다.',
    },
  },
  levels: {
    best: { publicLabel: '강추천', compactLabel: '강추' },
    good: { publicLabel: '추천', compactLabel: '추천' },
    normal: { publicLabel: '보통', compactLabel: '보통' },
    caution: { publicLabel: '비추천', compactLabel: '비추' },
    avoid: { publicLabel: '제외', compactLabel: '제외' },
  },
  panels: {
    avoidTitle: '제외 이유',
    avoidFallback: '이번 달 추천 후보로 보지는 않는 날짜입니다. 다른 추천일을 먼저 비교해 보세요.',
    cautionTitle: '비추천 이유',
    cautionFallback: '강한 제외 사유는 아니지만 이번 목적에는 우선 추천하지 않는 흐름입니다.',
    normalTitle: '보통 포인트',
    normalFallback: '강한 추천 사인은 아니지만 무난하게 검토할 수 있는 흐름입니다.',
    noteTitle: '참고 포인트',
    recommendedTitle: '추천 이유',
    bestDatesTitle: '이번 달 상위 추천일',
    bestDatesEmpty: '이번 달에는 강한 추천일이 많지 않습니다. 다른 목적이나 다음 달도 함께 비교해보세요.',
  },
  templates: {
    diShiReason: '일간 기준 12운성(십이운성)이 {{stage}}(으)로 들어와 개인 흐름과 비교적 잘 맞습니다.',
    diShiCaution: '일간 기준 12운성(십이운성)이 {{stage}}(으)로 들어와 개인 흐름상 기운이 다소 약합니다.',
    purposeReason: '{{purposeLabel}} 목적과 맞는 宜(의)가 잡혀 기본 흐름이 좋습니다.',
    harmonyReason: '{{targetLabel}}와 충돌이 적고 흐름이 비교적 안정적입니다.',
    godReasonMoving: '{{godLabel}}라 움직임과 만남의 흐름이 살아 {{purposeLabel}} 일정과 잘 맞습니다.',
    godReasonFormality: '{{godLabel}}라 격식과 공식성이 살아 있어 {{purposeLabel}} 일정에 힘을 실어줍니다.',
    godReasonTransaction: '{{godLabel}}라 재물·문서·거래 성격이 강해 {{purposeLabel}} 목적에 유리합니다.',
    godReasonProtection: '{{godLabel}}라 조화와 보호의 기운이 있어 {{purposeLabel}} 일정을 부드럽게 받쳐줍니다.',
    godReasonRefined: '{{godLabel}}라 문서·품격·정제된 흐름이 살아 {{purposeLabel}} 목적과 잘 맞습니다.',
    godReasonResponsibility: '{{godLabel}}라 책임감과 정리력이 필요한 {{purposeLabel}} 일정에 안정감을 더합니다.',
    godReasonDefault: '{{godLabel}} 기운이 들어 {{purposeLabel}} 목적에 보탬이 됩니다.',
    godCautionDelay: '{{godLabel}}라 일정이 얽히거나 지연되기 쉬워 {{purposeLabel}} 진행은 답답할 수 있습니다.',
    godCautionDamage: '{{godLabel}}라 충돌과 손상 기운이 있어 {{purposeLabel}} 일정은 강하게 피하는 편이 좋습니다.',
    godCautionGossip: '{{godLabel}}라 말실수·구설·언쟁이 붙기 쉬워 {{purposeLabel}} 일정에는 불리합니다.',
    godCautionBlockage: '{{godLabel}}라 흐름이 막히고 정체되기 쉬워 {{purposeLabel}} 추진력에 제약이 생길 수 있습니다.',
    godCautionPressure: '{{godLabel}}라 압박과 시비 성격이 있어 {{purposeLabel}} 일정은 신중하게 봐야 합니다.',
    godCautionHiddenProblem: '{{godLabel}}라 숨은 문제나 불투명성이 생기기 쉬워 {{purposeLabel}} 판단에 불리합니다.',
    godCautionDefault: '{{godLabel}} 기운이 걸려 {{purposeLabel}} 목적에는 주의가 필요합니다.',
    summaryFallback: '크게 강한 추천 포인트는 아니지만 무난하게 검토할 수 있는 날입니다.',
    normalizeAvoidFallback: '이번 달 추천 후보로 보지 않는 날짜입니다.',
    timeIncludeReason: '시간 宜(의) 중 {{matchedKeywords}}가 들어와 {{purposeLabel}} 일정과 잘 맞습니다.',
    timeDayHarmonyReason: '본인 일지와 합이 들어와 무리감이 적은 시간대입니다.',
    timeGeneralFallback: '시간 흐름은 비교적 무난해 일정 후보로 볼 수 있습니다.',
    filteredReasonDayClash: '본인 일지와 정면 충이 들어오는 날이라 이번 목적에는 제외했습니다.',
    cautionDayClash: '본인 일지와 충이 들어와 개인 흐름상 마찰이 생기기 쉬운 날입니다.',
    filteredReasonDayAvoid: '{{purposeLabel}} 목적과 상충하는 忌(기)가 강해 이번 달 추천에서 뺐습니다.',
    cautionXunKong: '개인 공망(空亡)에 닿는 날이라 {{purposeLabel}} 일정은 보수적으로 보는 편이 좋습니다.',
    cautionYearClash: '연지와 충이 있어 큰 결정은 한 번 더 체크하는 편이 좋습니다.',
    cautionHourClash: '시지와 충이 있어 실제 실행 타이밍에서 피로감이나 엇박자가 생길 수 있습니다.',
    cautionMonthClash: '월지와 충이 있어 기반이나 환경이 흔들리기 쉬운 날입니다.',
    cautionHyeong: '일지와 형(刑)이 걸려 긴장감이나 삐걱거림이 생기기 쉬운 날입니다.',
    cautionDayAvoidGeneral: '{{purposeLabel}} 관련 忌(기)가 함께 보여 신중한 판단이 필요합니다.',
    cautionXiongSha: '흉살 표기가 비교적 많은 날입니다.',
    cautionNoGoodHours: '날짜 흐름은 검토할 만하지만 추천 시간대가 뚜렷하지 않아 시간 선택에 제약이 있습니다.',
  },
  weekdays: ['일', '월', '화', '수', '목', '금', '토'],
}

export const TAEKIL_COPY_SEED_ROWS: TaekilCopySeedRow[] = [
  {
    copy_group: 'page',
    copy_key: 'guest_hero',
    title: TAEKIL_LOCAL_COPY.page.guestTitle,
    summary: TAEKIL_LOCAL_COPY.page.guestDescription,
    detail: '',
    is_active: true,
  },
  {
    copy_group: 'page',
    copy_key: 'guest_primary_cta',
    title: TAEKIL_LOCAL_COPY.page.guestPrimaryCta,
    summary: '',
    detail: '',
    is_active: true,
  },
  {
    copy_group: 'page',
    copy_key: 'guest_secondary_cta',
    title: TAEKIL_LOCAL_COPY.page.guestSecondaryCta,
    summary: '',
    detail: '',
    is_active: true,
  },
  {
    copy_group: 'page',
    copy_key: 'no_saju_hero',
    title: TAEKIL_LOCAL_COPY.page.noSajuTitle,
    summary: TAEKIL_LOCAL_COPY.page.noSajuDescription,
    detail: '',
    is_active: true,
  },
  {
    copy_group: 'page',
    copy_key: 'no_saju_primary_cta',
    title: TAEKIL_LOCAL_COPY.page.noSajuPrimaryCta,
    summary: '',
    detail: '',
    is_active: true,
  },
  {
    copy_group: 'page',
    copy_key: 'no_saju_secondary_cta',
    title: TAEKIL_LOCAL_COPY.page.noSajuSecondaryCta,
    summary: '',
    detail: '',
    is_active: true,
  },
  {
    copy_group: 'page',
    copy_key: 'main_hero',
    title: TAEKIL_LOCAL_COPY.page.mainTitle,
    summary: TAEKIL_LOCAL_COPY.page.mainDescription,
    detail: '',
    is_active: true,
  },
  {
    copy_group: 'page',
    copy_key: 'purpose_section',
    title: TAEKIL_LOCAL_COPY.page.purposeSectionTitle,
    summary: TAEKIL_LOCAL_COPY.page.purposeSectionDescription,
    detail: '',
    is_active: true,
  },
  {
    copy_group: 'page',
    copy_key: 'calendar_navigation',
    title: TAEKIL_LOCAL_COPY.page.previousMonthLabel,
    summary: TAEKIL_LOCAL_COPY.page.nextMonthLabel,
    detail: TAEKIL_LOCAL_COPY.page.calendarSubtitle,
    is_active: true,
  },
  {
    copy_group: 'page',
    copy_key: 'selected_meta',
    title: TAEKIL_LOCAL_COPY.page.selectedEyebrow,
    summary: TAEKIL_LOCAL_COPY.page.lunarPrefix,
    detail: '',
    is_active: true,
  },
  ...Object.entries(TAEKIL_LOCAL_COPY.purposes).map(([copyKey, item]) => ({
    copy_group: 'purpose' as const,
    copy_key: copyKey,
    title: item.label,
    summary: item.shortLabel,
    detail: item.description,
    is_active: true,
  })),
  ...Object.entries(TAEKIL_LOCAL_COPY.levels).map(([copyKey, item]) => ({
    copy_group: 'level' as const,
    copy_key: copyKey,
    title: item.publicLabel,
    summary: item.compactLabel,
    detail: '',
    is_active: true,
  })),
  ...[
    ['avoid_title', TAEKIL_LOCAL_COPY.panels.avoidTitle, '', ''],
    ['avoid_fallback', TAEKIL_LOCAL_COPY.panels.avoidFallback, '', ''],
    ['caution_title', TAEKIL_LOCAL_COPY.panels.cautionTitle, '', ''],
    ['caution_fallback', TAEKIL_LOCAL_COPY.panels.cautionFallback, '', ''],
    ['normal_title', TAEKIL_LOCAL_COPY.panels.normalTitle, '', ''],
    ['normal_fallback', TAEKIL_LOCAL_COPY.panels.normalFallback, '', ''],
    ['note_title', TAEKIL_LOCAL_COPY.panels.noteTitle, '', ''],
    ['recommended_title', TAEKIL_LOCAL_COPY.panels.recommendedTitle, '', ''],
    ['best_dates_title', TAEKIL_LOCAL_COPY.panels.bestDatesTitle, '', ''],
    ['best_dates_empty', TAEKIL_LOCAL_COPY.panels.bestDatesEmpty, '', ''],
  ].map(([copyKey, title, summary, detail]) => ({
    copy_group: 'panel' as const,
    copy_key: copyKey,
    title,
    summary,
    detail,
    is_active: true,
  })),
  ...Object.entries(TAEKIL_LOCAL_COPY.templates).map(([copyKey, title]) => ({
    copy_group: 'template' as const,
    copy_key: copyKey,
    title,
    summary: '',
    detail: '',
    is_active: true,
  })),
]
