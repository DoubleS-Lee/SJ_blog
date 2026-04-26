import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getManseryeokData } from '@/lib/saju/manseryeok'
import type { SajuInput } from '@/lib/saju/calculate'
import type { Gender } from '@/types/saju'

export type RoleSource = 'me' | 'target'

export interface CompatibilityUserSaju {
  saju_name: string | null
  birth_year: number
  birth_month: number
  birth_day: number
  birth_hour: number | null
  birth_minute: number | null
  gender: Gender
  is_lunar: boolean
  ilgan: string | null
}

export interface CompatibilityProfile {
  nickname: string | null
  role: string | null
  is_admin: boolean | null
}

export interface CompatibilityEntry {
  id: string
  nickname: string
  birth_year: number
  birth_month: number
  birth_day: number
  birth_hour: number | null
  birth_minute: number | null
  gender: Gender
  is_lunar: boolean
}

export interface CompatibilityPageContext {
  selectedId: string | null
  maleRoleParam: RoleSource | null
  mySaju: CompatibilityUserSaju | null
  profile: CompatibilityProfile | null
  compatibilityEntries: CompatibilityEntry[]
  selectedEntry: CompatibilityEntry | null
  myGender?: Gender
  targetGender?: Gender
  sameGenderPair: boolean
  validMaleRole: RoleSource | null
  validFemaleRole: RoleSource | null
  myManseryeok: ReturnType<typeof getManseryeokData> | null
  targetManseryeok: ReturnType<typeof getManseryeokData> | null
  maleManseryeok: ReturnType<typeof getManseryeokData> | null
  femaleManseryeok: ReturnType<typeof getManseryeokData> | null
  myDisplayName: string
  canSeePremiumMeta: boolean
}

export function parseStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function formatDate(year: number, month: number, day: number) {
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`
}

export function formatTime(hour: number | null, minute: number | null) {
  if (hour === null) return '출생시 모름'
  return `${String(hour).padStart(2, '0')}:${String(minute ?? 0).padStart(2, '0')}`
}

export function buildRoleHref(basePath: string, targetId: string, maleRole: RoleSource) {
  return `${basePath}?target=${targetId}&maleRole=${maleRole}`
}

export function buildTargetHref(basePath: string, targetId: string, maleRole?: RoleSource | null) {
  if (maleRole) return `${basePath}?target=${targetId}&maleRole=${maleRole}`
  return `${basePath}?target=${targetId}`
}

function toManseryeokInput(
  row: {
    birth_year: number
    birth_month: number
    birth_day: number
    birth_hour: number | null
    birth_minute: number | null
    gender: Gender
    is_lunar: boolean
  },
): SajuInput {
  return {
    birth_year: row.birth_year,
    birth_month: row.birth_month,
    birth_day: row.birth_day,
    birth_hour: row.birth_hour ?? null,
    birth_minute: row.birth_minute ?? null,
    gender: row.gender ?? 'male',
    is_lunar: row.is_lunar ?? false,
  }
}

export async function loadCompatibilityPageContext(
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<CompatibilityPageContext> {
  const selectedId = parseStringParam(rawSearchParams.target) ?? null
  const maleRoleRaw = parseStringParam(rawSearchParams.maleRole)
  const maleRoleParam: RoleSource | null =
    maleRoleRaw === 'me' || maleRoleRaw === 'target' ? maleRoleRaw : null

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: mySaju },
    { data: profile },
    { data: compatibilityEntries },
  ] = await Promise.all([
    supabase
      .from('user_saju')
      .select('saju_name, birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, is_lunar, ilgan')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('users')
      .select('nickname, role, is_admin')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('user_compatibility_saju')
      .select('id, nickname, birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, is_lunar')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const entries = (compatibilityEntries ?? []) as CompatibilityEntry[]
  const selectedEntry = entries.find((entry) => entry.id === selectedId) ?? entries[0] ?? null

  const myGender = mySaju?.gender as Gender | undefined
  const targetGender = selectedEntry?.gender as Gender | undefined
  const sameGenderPair = Boolean(myGender && targetGender && myGender === targetGender)

  const validMaleRole: RoleSource | null =
    sameGenderPair && maleRoleParam
      ? maleRoleParam
      : !sameGenderPair && myGender && targetGender
        ? myGender === 'male'
          ? 'me'
          : 'target'
        : null
  const validFemaleRole: RoleSource | null =
    validMaleRole === 'me' ? 'target' : validMaleRole === 'target' ? 'me' : null

  const myManseryeok = mySaju ? getManseryeokData(toManseryeokInput(mySaju as CompatibilityUserSaju)) : null
  const targetManseryeok = selectedEntry ? getManseryeokData(toManseryeokInput(selectedEntry)) : null

  const maleManseryeok =
    validMaleRole === 'me' ? myManseryeok : validMaleRole === 'target' ? targetManseryeok : null
  const femaleManseryeok =
    validFemaleRole === 'me' ? myManseryeok : validFemaleRole === 'target' ? targetManseryeok : null

  const myDisplayName = (mySaju as CompatibilityUserSaju | null)?.saju_name?.trim() || profile?.nickname || '회원님'
  const canSeePremiumMeta =
    Boolean(profile?.is_admin) || profile?.role === 'plus' || profile?.role === 'premium'

  return {
    selectedId,
    maleRoleParam,
    mySaju: (mySaju as CompatibilityUserSaju | null) ?? null,
    profile: (profile as CompatibilityProfile | null) ?? null,
    compatibilityEntries: entries,
    selectedEntry,
    myGender,
    targetGender,
    sameGenderPair,
    validMaleRole,
    validFemaleRole,
    myManseryeok,
    targetManseryeok,
    maleManseryeok,
    femaleManseryeok,
    myDisplayName,
    canSeePremiumMeta,
  }
}
