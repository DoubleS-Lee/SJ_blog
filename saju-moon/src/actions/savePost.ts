'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import type { Json } from '@/types/supabase'
import type { JudgmentRules } from '@/types/judgment'
import { nanoid } from 'nanoid'

export interface PostFormData {
  id?: string                // 수정 시
  title: string
  summary: string
  thumbnail_url: string | null
  category: '연애·궁합' | '커리어·이직' | '재물·투자' | '건강·체질' | '육아·자녀교육' | '기타'
  // Next.js Server Action이 깊은 중첩 객체의 attrs를 드롭하는 문제를 피하기 위해 JSON 문자열로 전달
  content: string
  judgment_rules: JudgmentRules | null
  judgment_detail: string | null
  target_year: number | null
  is_featured: boolean
  is_published: boolean
  published_at: string | null
}

export async function savePost(data: PostFormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  // 관리자 확인
  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return { error: '권한이 없습니다.' }

  if (!data.title.trim()) return { error: '제목을 입력해 주세요.' }
  if (!data.category) return { error: '카테고리를 선택해 주세요.' }

  // JSON 문자열 → 객체 파싱
  let contentJson: Json
  let judgmentDetailJson: Json | null = null
  try {
    contentJson = JSON.parse(data.content) as Json
  } catch {
    return { error: '본문 데이터가 올바르지 않습니다.' }
  }
  if (data.judgment_detail) {
    try {
      judgmentDetailJson = JSON.parse(data.judgment_detail) as Json
    } catch {
      return { error: '판정 상세 데이터가 올바르지 않습니다.' }
    }
  }

  const now = new Date().toISOString()

  if (data.id) {
    // 수정
    const { data: updated, error } = await supabase
      .from('posts')
      .update({
        title: data.title.trim(),
        summary: data.summary.trim() || null,
        thumbnail_url: data.thumbnail_url || null,
        category: data.category,
        content: contentJson,
        judgment_rules: data.judgment_rules as unknown as Json | null,
        judgment_detail: judgmentDetailJson,
        target_year: data.target_year,
        is_featured: data.is_featured,
        is_published: data.is_published,
        published_at: data.is_published ? (data.published_at ?? now) : null,
        updated_at: now,
      })
      .eq('id', data.id)
      .select('slug')
      .single()

    if (error) {
      console.error('[savePost] update error:', error)
      return { error: '저장 중 오류가 발생했습니다.' }
    }

    // 수정된 글 상세 페이지 캐시 무효화
    if (updated?.slug) {
      revalidatePath(`/posts/${updated.slug}`)
    }
    revalidatePath('/')
  } else {
    // 신규 — slug nanoid 7자리 자동 생성
    const slug = nanoid(7)

    const { error } = await supabase
      .from('posts')
      .insert({
        slug,
        title: data.title.trim(),
        summary: data.summary.trim() || null,
        thumbnail_url: data.thumbnail_url || null,
        category: data.category,
        content: contentJson,
        judgment_rules: data.judgment_rules as unknown as Json | null,
        judgment_detail: judgmentDetailJson,
        target_year: data.target_year,
        is_featured: data.is_featured,
        is_published: data.is_published,
        published_at: data.is_published ? (data.published_at ?? now) : null,
        created_by: user.id,
      })

    if (error) {
      console.error('[savePost] insert error:', error)
      return { error: '저장 중 오류가 발생했습니다.' }
    }

    revalidatePath('/')
  }

  redirect('/admin/posts')
}

export async function deletePost(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: profile } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) return { error: '권한이 없습니다.' }

  const { error } = await supabase.from('posts').delete().eq('id', id)
  if (error) return { error: '삭제 중 오류가 발생했습니다.' }

  redirect('/admin/posts')
}
