import type { Cheongan } from '@/types/saju'

export const ILGAN_OPTIONS: Array<{ value: Cheongan; hanja: string }> = [
  { value: '갑', hanja: '甲' },
  { value: '을', hanja: '乙' },
  { value: '병', hanja: '丙' },
  { value: '정', hanja: '丁' },
  { value: '무', hanja: '戊' },
  { value: '기', hanja: '己' },
  { value: '경', hanja: '庚' },
  { value: '신', hanja: '辛' },
  { value: '임', hanja: '壬' },
  { value: '계', hanja: '癸' },
]

export type IlganAvatarMap = Partial<Record<Cheongan, string>>

export function sanitizeIlganAvatarMap(value: unknown): IlganAvatarMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  const sanitized: IlganAvatarMap = {}

  for (const option of ILGAN_OPTIONS) {
    const raw = (value as Record<string, unknown>)[option.value]
    if (typeof raw === 'string' && raw.trim()) {
      sanitized[option.value] = raw.trim()
    }
  }

  return sanitized
}

export function getIlganAvatarUrl(
  avatarMap: IlganAvatarMap | null | undefined,
  ilgan: string | null | undefined,
) {
  if (!ilgan) return null
  return avatarMap?.[ilgan as Cheongan] ?? null
}

export function resolveAvatarImageUrl(params: {
  avatarUrl?: string | null
  ilganAvatarMap?: IlganAvatarMap | null
  ilgan?: string | null
}) {
  return params.avatarUrl ?? getIlganAvatarUrl(params.ilganAvatarMap, params.ilgan) ?? null
}

export function getIlganDisplayLabel(ilgan: string | null | undefined) {
  if (!ilgan) return ''

  const option = ILGAN_OPTIONS.find((item) => item.value === ilgan)
  if (!option) return ilgan

  return `${option.hanja}(${option.value})`
}
