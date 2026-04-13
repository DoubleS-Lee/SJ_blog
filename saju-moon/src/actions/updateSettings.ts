'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function setGradeSeparation(enabled: boolean): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return { error: '권한이 없습니다.' }

  const { error } = await supabase
    .from('site_settings')
    .upsert({ id: 1, grade_separation_enabled: enabled })

  if (error) {
    console.error('[updateSettings]', error)
    return { error: '설정 저장 중 오류가 발생했습니다.' }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/posts', 'layout')
  return {}
}
