'use server'

import { nanoid } from 'nanoid'
import { requireAdmin } from '@/lib/auth/admin'
import { slugifyTitle } from '@/lib/posts/slug'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { importPublicNaverPostToDraft } from '@/lib/posts/import/naver'

export async function importNaverPost(input: { url: string }): Promise<{ error?: string; redirectTo?: string }> {
  const url = input.url.trim()
  if (!url) {
    return { error: '네이버 블로그 글 URL을 입력해 주세요.' }
  }

  const { user } = await requireAdmin()

  try {
    const imported = await importPublicNaverPostToDraft(url, user.id)
    const slug = `${slugifyTitle(imported.title)}-${nanoid(6)}`

    const { data: insertedPost, error } = await supabaseAdmin
      .from('posts')
      .insert({
        slug,
        title: imported.title,
        summary: imported.summary || null,
        thumbnail_url: imported.thumbnailUrl,
        category: '기타',
        content: imported.content,
        judgment_rules: null,
        judgment_detail: null,
        target_year: null,
        tags: [],
        is_featured: false,
        is_published: false,
        published_at: null,
        created_by: user.id,
      })
      .select('id')
      .single()

    if (error || !insertedPost) {
      console.error('[importNaverPost][insert]', error)
      return { error: '가져온 글을 저장하는 중 오류가 발생했습니다.' }
    }

    const query =
      imported.warnings.length > 0
        ? `?importWarning=${encodeURIComponent(`일부 이미지 복사에 실패했습니다. (${imported.warnings.length}건)`)}`
        : '?imported=1'

    return {
      redirectTo: `/admin/posts/${insertedPost.id}${query}`,
    }
  } catch (error) {
    console.error('[importNaverPost]', error)
    return {
      error: error instanceof Error ? error.message : '네이버 글을 가져오는 중 알 수 없는 오류가 발생했습니다.',
    }
  }
}
