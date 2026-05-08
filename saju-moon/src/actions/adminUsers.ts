'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import type { Database } from '@/types/supabase'

type UserRole = Database['public']['Tables']['users']['Row']['role']

const ALLOWED_ROLES: UserRole[] = ['free', 'plus', 'premium']

async function requireAdminUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { ok: false as const }
  }

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile?.is_admin) {
    return { ok: false as const }
  }

  return { ok: true as const, userId: user.id }
}

export async function updateManagedUser(formData: FormData): Promise<void> {
  const admin = await requireAdminUser()
  if (!admin.ok) {
    return
  }

  const userId = String(formData.get('userId') ?? '').trim()
  const nextRole = String(formData.get('role') ?? '').trim() as UserRole
  const nextIsAdmin = formData.get('isAdmin') === 'on'

  if (!userId) {
    return
  }

  if (!ALLOWED_ROLES.includes(nextRole)) {
    return
  }

  if (userId === admin.userId && !nextIsAdmin) {
    return
  }

  const { error } = await supabaseAdmin
    .from('users')
    .update({
      role: nextRole,
      is_admin: nextIsAdmin,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (error) {
    console.error('[updateManagedUser]', error)
    return
  }

  revalidatePath('/admin/users')
}
