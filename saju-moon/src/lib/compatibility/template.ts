export interface CompatibilityTemplateValues {
  meName: string
  targetName: string
  maleName?: string | null
  femaleName?: string | null
}

const TOKEN_MAP: Record<string, keyof CompatibilityTemplateValues> = {
  ME_NAME: 'meName',
  TARGET_NAME: 'targetName',
  USER_NAME: 'meName',
  PARTNER_NAME: 'targetName',
  MALE_NAME: 'maleName',
  FEMALE_NAME: 'femaleName',
  유저이름: 'meName',
  상대이름: 'targetName',
  남자이름: 'maleName',
  여자이름: 'femaleName',
}

export function renderCompatibilityTemplate(
  text: string,
  values: CompatibilityTemplateValues,
) {
  if (!text) return text

  return text.replace(/\{\{\s*([A-Za-z_가-힣]+)\s*\}\}/g, (full, tokenRaw) => {
    const token = String(tokenRaw ?? '').trim()
    const key = TOKEN_MAP[token]
    if (!key) return full
    const value = values[key]
    return typeof value === 'string' && value.trim().length > 0 ? value : full
  })
}

