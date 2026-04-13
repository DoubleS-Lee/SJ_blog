'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function agreeTerms(next: string = '/'): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const now = new Date().toISOString()
  const { error } = await supabase
    .from('users')
    .update({ terms_agreed_at: now, updated_at: now })
    .eq('id', user.id)

  if (error) {
    console.error('[agreeTerms]', error)
    return { error: '동의 처리 중 오류가 발생했습니다.' }
  }

  const safePath = next.startsWith('/') ? next : '/'
  redirect(safePath)
}
