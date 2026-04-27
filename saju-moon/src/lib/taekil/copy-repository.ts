import 'server-only'

import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/supabase'

type TaekilCopyRow = Database['public']['Tables']['taekil_copy']['Row']

export async function fetchTaekilCopyRowsFromDb(options?: { includeInactive?: boolean }) {
  const supabase = await createClient()

  let query = supabase
    .from('taekil_copy')
    .select('*')
    .order('copy_group', { ascending: true })
    .order('copy_key', { ascending: true })

  if (!options?.includeInactive) {
    query = query.eq('is_active', true)
  }

  const { data, error } = await query

  if (error) {
    console.error('Failed to fetch taekil copy from DB', { error })
    return []
  }

  return (data ?? []) as TaekilCopyRow[]
}
