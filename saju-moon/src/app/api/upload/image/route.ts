import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { detectImageMimeType, getImageExtension } from '@/lib/security/image-validation'
import { enforceRateLimit } from '@/lib/security/rate-limit'

const BUCKET = 'post-images'
const MAX_SIZE = 10 * 1024 * 1024

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 })
  }

  const { data: profile } = await supabase.from('users').select('is_admin').eq('id', user.id).single()

  if (!profile?.is_admin) {
    return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  }

  const rateLimitResult = await enforceRateLimit(supabase, 'admin_image_upload', user.id)
  if (rateLimitResult.error) {
    return NextResponse.json({ error: rateLimitResult.error }, { status: 429 })
  }

  const formData = await request.formData()
  const file = formData.get('file')

  if (!(file instanceof File)) {
    return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  const detectedMimeType = detectImageMimeType(bytes)

  if (!detectedMimeType) {
    return NextResponse.json(
      { error: 'JPG, PNG, WEBP, GIF 형식만 업로드할 수 있습니다.' },
      { status: 400 },
    )
  }

  const extension = getImageExtension(detectedMimeType)
  const path = `${user.id}/${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: detectedMimeType,
    upsert: false,
  })

  if (uploadError) {
    console.error('[upload/image]', uploadError)
    return NextResponse.json({ error: `업로드에 실패했습니다: ${uploadError.message}` }, { status: 500 })
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET).getPublicUrl(path)

  return NextResponse.json({ url: publicUrl })
}
