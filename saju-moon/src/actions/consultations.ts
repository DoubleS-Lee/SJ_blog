'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { enforceRateLimit } from '@/lib/security/rate-limit'
import type { ConsultationStatus } from '@/types/consultation'

const CONSULTATION_USAGE_VERSION = '2026-04-18-v1'
const MAX_TITLE_LENGTH = 120
const MAX_BODY_LENGTH = 5000
const MAX_COMMENT_LENGTH = 2000

function normalizeText(value: string) {
  return value.replace(/\r\n/g, '\n').trim()
}

async function getCurrentUserProfile() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { supabase, user: null, profile: null }

  const { data: profile } = await supabase
    .from('users')
    .select('id, nickname, email, is_admin, custom_avatar_url')
    .eq('id', user.id)
    .maybeSingle()

  return { supabase, user, profile }
}

async function getConsultationForActor(supabase: Awaited<ReturnType<typeof createClient>>, consultationId: string) {
  const { data } = await supabase
    .from('consultations')
    .select('id, user_id, status')
    .eq('id', consultationId)
    .maybeSingle()

  return data
}

export async function createConsultation(input: {
  title: string
  body: string
  contentUsageAgreed: boolean
}): Promise<{ error?: string; id?: string }> {
  const { supabase, user } = await getCurrentUserProfile()
  if (!user) return { error: '로그인이 필요합니다.' }

  const title = normalizeText(input.title)
  const body = normalizeText(input.body)

  if (!title) return { error: '제목을 입력해 주세요.' }
  if (!body) return { error: '사연 내용을 입력해 주세요.' }
  if (title.length > MAX_TITLE_LENGTH) return { error: `제목은 ${MAX_TITLE_LENGTH}자 이하로 입력해 주세요.` }
  if (body.length > MAX_BODY_LENGTH) return { error: `사연은 ${MAX_BODY_LENGTH}자 이하로 입력해 주세요.` }
  if (!input.contentUsageAgreed) {
    return { error: '필수 동의에 체크해야 상담 게시판을 이용할 수 있습니다.' }
  }

  const rateLimitResult = await enforceRateLimit(supabase, 'consultation_create', user.id)
  if (rateLimitResult.error) return rateLimitResult

  const { data, error } = await supabase
    .from('consultations')
    .insert({
      user_id: user.id,
      title,
      body,
      content_usage_agreed: true,
      content_usage_agreed_at: new Date().toISOString(),
      content_usage_version: CONSULTATION_USAGE_VERSION,
    })
    .select('id')
    .single()

  if (error) {
    console.error('[createConsultation]', error)
    return { error: '상담 글 저장 중 오류가 발생했습니다.' }
  }

  revalidatePath('/counsel')
  revalidatePath('/mypage')
  revalidatePath('/mypage/counsel')
  revalidatePath('/admin/counsel')

  return { id: data.id }
}

export async function createConsultationComment(input: {
  consultationId: string
  body: string
}): Promise<{ error?: string }> {
  const { supabase, user, profile } = await getCurrentUserProfile()
  if (!user || !profile) return { error: '로그인이 필요합니다.' }

  const body = normalizeText(input.body)
  if (!body) return { error: '댓글 내용을 입력해 주세요.' }
  if (body.length > MAX_COMMENT_LENGTH) return { error: `댓글은 ${MAX_COMMENT_LENGTH}자 이하로 입력해 주세요.` }

  const rateLimitResult = await enforceRateLimit(supabase, 'consultation_comment_create', user.id)
  if (rateLimitResult.error) return rateLimitResult

  const consultation = await getConsultationForActor(supabase, input.consultationId)
  if (!consultation) return { error: '상담 글을 찾을 수 없습니다.' }
  if (consultation.status === 'closed') return { error: '종결된 상담에는 새 댓글을 남길 수 없습니다.' }

  const { data: saju } = await supabase
    .from('user_saju')
    .select('ilgan')
    .eq('user_id', user.id)
    .maybeSingle()

  const { error } = await supabase
    .from('consultation_comments')
    .insert({
      consultation_id: input.consultationId,
      user_id: user.id,
      author_avatar_url: profile.custom_avatar_url ?? null,
      author_ilgan: saju?.ilgan ?? null,
      body,
    })

  if (error) {
    console.error('[createConsultationComment]', error)
    return { error: '댓글 저장 중 오류가 발생했습니다.' }
  }

  const nextStatus: ConsultationStatus = profile.is_admin ? 'answered' : 'submitted'

  const { error: consultationError } = await supabase
    .from('consultations')
    .update({
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.consultationId)

  if (consultationError) {
    console.error('[createConsultationComment][consultations]', consultationError)
  }

  revalidatePath(`/counsel/${input.consultationId}`)
  revalidatePath('/counsel')
  revalidatePath('/mypage/counsel')
  revalidatePath(`/admin/counsel/${input.consultationId}`)
  revalidatePath('/admin/counsel')

  return {}
}

export async function updateConsultationComment(input: {
  commentId: string
  body: string
  consultationId: string
}): Promise<{ error?: string }> {
  const { supabase, user } = await getCurrentUserProfile()
  if (!user) return { error: '로그인이 필요합니다.' }

  const body = normalizeText(input.body)
  if (!body) return { error: '댓글 내용을 입력해 주세요.' }
  if (body.length > MAX_COMMENT_LENGTH) return { error: `댓글은 ${MAX_COMMENT_LENGTH}자 이하로 입력해 주세요.` }

  const { data: comment } = await supabase
    .from('consultation_comments')
    .select('id, user_id, is_deleted')
    .eq('id', input.commentId)
    .maybeSingle()

  if (!comment) return { error: '댓글을 찾을 수 없습니다.' }
  if (comment.user_id !== user.id) return { error: '수정 권한이 없습니다.' }
  if (comment.is_deleted) return { error: '삭제된 댓글은 수정할 수 없습니다.' }

  const { error } = await supabase
    .from('consultation_comments')
    .update({
      body,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.commentId)

  if (error) {
    console.error('[updateConsultationComment]', error)
    return { error: '댓글 수정 중 오류가 발생했습니다.' }
  }

  revalidatePath(`/counsel/${input.consultationId}`)
  revalidatePath(`/admin/counsel/${input.consultationId}`)
  return {}
}

export async function deleteConsultationComment(input: {
  commentId: string
  consultationId: string
}): Promise<{ error?: string }> {
  const { supabase, user } = await getCurrentUserProfile()
  if (!user) return { error: '로그인이 필요합니다.' }

  const { data: comment } = await supabase
    .from('consultation_comments')
    .select('id, user_id, is_deleted')
    .eq('id', input.commentId)
    .maybeSingle()

  if (!comment) return { error: '댓글을 찾을 수 없습니다.' }
  if (comment.user_id !== user.id) return { error: '삭제 권한이 없습니다.' }
  if (comment.is_deleted) return { error: '이미 삭제된 댓글입니다.' }

  const { error } = await supabase
    .from('consultation_comments')
    .update({
      body: '',
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.commentId)

  if (error) {
    console.error('[deleteConsultationComment]', error)
    return { error: '댓글 삭제 중 오류가 발생했습니다.' }
  }

  revalidatePath(`/counsel/${input.consultationId}`)
  revalidatePath(`/admin/counsel/${input.consultationId}`)
  return {}
}

export async function updateConsultationByAdmin(input: {
  consultationId: string
  status: ConsultationStatus
  adminNote: string
  anonymizedContent: string
  isExternalUseReady: boolean
}): Promise<{ error?: string }> {
  const { supabase, user, profile } = await getCurrentUserProfile()
  if (!user || !profile?.is_admin) return { error: '권한이 없습니다.' }

  const consultation = await getConsultationForActor(supabase, input.consultationId)
  if (!consultation) return { error: '상담 글을 찾을 수 없습니다.' }

  const { error } = await supabase
    .from('consultations')
    .update({
      status: input.status,
      admin_note: normalizeText(input.adminNote) || null,
      anonymized_content: normalizeText(input.anonymizedContent) || null,
      is_external_use_ready: input.isExternalUseReady,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.consultationId)

  if (error) {
    console.error('[updateConsultationByAdmin]', error)
    return { error: '상담 상태 저장 중 오류가 발생했습니다.' }
  }

  revalidatePath(`/counsel/${input.consultationId}`)
  revalidatePath(`/admin/counsel/${input.consultationId}`)
  revalidatePath('/admin/counsel')
  revalidatePath('/counsel')
  revalidatePath('/mypage/counsel')
  return {}
}
