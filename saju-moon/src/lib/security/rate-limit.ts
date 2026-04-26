import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

type RateLimitedAction =
  | 'consultation_create'
  | 'consultation_comment_create'
  | 'post_comment_create'
  | 'profile_image_upload'
  | 'admin_image_upload'

type RateLimitPreset = {
  windowSeconds: number
  maxRequests: number
  errorMessage: string
}

const RATE_LIMIT_PRESETS: Record<RateLimitedAction, RateLimitPreset> = {
  consultation_create: {
    windowSeconds: 60 * 60,
    maxRequests: 3,
    errorMessage: '상담 글은 한 시간에 3개까지만 등록할 수 있습니다. 잠시 후 다시 시도해 주세요.',
  },
  consultation_comment_create: {
    windowSeconds: 5 * 60,
    maxRequests: 10,
    errorMessage: '상담 댓글은 잠시 쉬었다가 다시 남겨 주세요.',
  },
  post_comment_create: {
    windowSeconds: 5 * 60,
    maxRequests: 12,
    errorMessage: '댓글 작성이 너무 빠릅니다. 잠시 후 다시 시도해 주세요.',
  },
  profile_image_upload: {
    windowSeconds: 10 * 60,
    maxRequests: 5,
    errorMessage: '프로필 이미지는 잠시 후 다시 업로드해 주세요.',
  },
  admin_image_upload: {
    windowSeconds: 10 * 60,
    maxRequests: 20,
    errorMessage: '이미지 업로드 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
  },
}

type LimitResult = { error?: string }

export async function enforceRateLimit(
  supabase: SupabaseClient<Database>,
  action: RateLimitedAction,
  userId: string,
  scope?: string,
): Promise<LimitResult> {
  const preset = RATE_LIMIT_PRESETS[action]
  const normalizedScope = scope?.trim() ? `:${scope.trim()}` : ''
  const key = `${action}:${userId}${normalizedScope}`

  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_key: key,
    p_window_seconds: preset.windowSeconds,
    p_max_count: preset.maxRequests,
  })

  if (error) {
    console.error('[enforceRateLimit]', { action, userId, scope, error })
    return { error: '요청 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }
  }

  if (!data) {
    return { error: preset.errorMessage }
  }

  return {}
}
