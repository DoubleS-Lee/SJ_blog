'use server'

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'

export async function deleteAccount(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  // 서비스 롤로 auth.users 삭제 (FK CASCADE → users, user_saju 등 자동 삭제)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('[deleteAccount]', error)
    return { error: '탈퇴 처리 중 오류가 발생했습니다.' }
  }

  await supabase.auth.signOut()
  redirect('/')
}
