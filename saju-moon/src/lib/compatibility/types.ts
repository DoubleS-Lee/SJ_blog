export type CompatibilitySection = 'dayGan' | 'dayJi' | 'ohang' | 'johoo' | 'sipsung'

export type CompatibilityCopyItem = {
  title: string
  summary: string
  detail: string
  pattern: string
  detailCase: string
  maleCondition: string
  femaleCondition: string
}

export type CompatibilityPreviewCard = {
  section: CompatibilitySection
  sectionLabel: string
  copyKey: string
  variant: string
  pattern: string
  detailCase: string
  maleCondition: string
  femaleCondition: string
  title: string
  summary: string
  detail: string
}
