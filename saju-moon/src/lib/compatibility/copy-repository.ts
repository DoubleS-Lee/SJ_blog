import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'
import type {
  CompatibilityCopyItem,
  CompatibilityFortuneCategory,
  CompatibilityFortunePeriodType,
  CompatibilitySection,
} from './types'
import type { FortuneCopyEntry } from './fortune-copy'

type CompatibilityCopyRow = Database['public']['Tables']['compatibility_copy']['Row']
type CompatibilityFortuneCopyRow = Database['public']['Tables']['compatibility_fortune_copy']['Row']

function mapCompatibilityCopyRow(row: CompatibilityCopyRow): CompatibilityCopyItem {
  return {
    title: row.title,
    summary: row.summary,
    detail: row.detail,
    pattern: row.pattern,
    detailCase: row.detail_case,
    maleCondition: row.male_condition,
    femaleCondition: row.female_condition,
  }
}

function mapCompatibilityFortuneCopyRow(row: CompatibilityFortuneCopyRow): FortuneCopyEntry {
  return {
    summary: row.summary,
    detail: row.detail,
  }
}

export async function fetchCompatibilityCopyFromDb(
  section: CompatibilitySection,
  copyKey: string,
  options?: { includeInactive?: boolean },
): Promise<CompatibilityCopyItem | null> {
  const supabase = await createClient()

  let query = supabase
    .from('compatibility_copy')
    .select('*')
    .eq('section', section)
    .eq('copy_key', copyKey)

  if (!options?.includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Failed to fetch compatibility copy from DB', { section, copyKey, error })
    return null
  }

  return data ? mapCompatibilityCopyRow(data) : null
}

export async function fetchCompatibilityFortuneCopyFromDb(
  periodType: CompatibilityFortunePeriodType,
  category: CompatibilityFortuneCategory,
  copyKey: string,
  options?: { includeInactive?: boolean },
): Promise<FortuneCopyEntry | null> {
  const supabase = await createClient()

  let query = supabase
    .from('compatibility_fortune_copy')
    .select('*')
    .eq('period_type', periodType)
    .eq('category', category)
    .eq('copy_key', copyKey)

  if (!options?.includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Failed to fetch compatibility fortune copy from DB', {
      periodType,
      category,
      copyKey,
      error,
    })
    return null
  }

  return data ? mapCompatibilityFortuneCopyRow(data) : null
}
