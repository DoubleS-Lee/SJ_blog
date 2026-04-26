import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function getCurrentUserAdminState() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { supabase, user: null, isAdmin: false }
  }

  const { data } = await supabase.from('users').select('is_admin').eq('id', user.id).maybeSingle()

  return {
    supabase,
    user,
    isAdmin: Boolean(data?.is_admin),
  }
}

export async function requireAdmin() {
  const state = await getCurrentUserAdminState()

  if (!state.user) redirect('/login')
  if (!state.isAdmin) redirect('/')

  return state
}
