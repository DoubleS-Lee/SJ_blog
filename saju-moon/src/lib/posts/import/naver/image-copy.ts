import type { JSONContent } from '@tiptap/react'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { detectImageMimeType, getImageExtension } from '@/lib/security/image-validation'
import type { CopiedImageResult } from './types'

const BUCKET = 'post-images'

function cloneContent<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function collectImageNodes(node: JSONContent, target: JSONContent[] = []) {
  if (node.type === 'image' && node.attrs && typeof node.attrs === 'object') {
    target.push(node)
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      collectImageNodes(child, target)
    }
  }

  return target
}

function replaceFailedImageNode(node: JSONContent, originalUrl: string) {
  node.type = 'paragraph'
  delete node.attrs
  node.content = [
    {
      type: 'text',
      text: '원본 이미지 보기',
      marks: [
        {
          type: 'link',
          attrs: {
            href: originalUrl,
          },
        },
      ],
    },
  ]
}

async function copyImageToStorage(imageUrl: string, userId: string) {
  const response = await fetch(imageUrl, {
    headers: {
      referer: 'https://blog.naver.com/',
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`이미지 다운로드 실패 (${response.status})`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  const detectedMimeType = detectImageMimeType(bytes)

  if (!detectedMimeType) {
    throw new Error('지원하지 않는 이미지 형식입니다.')
  }

  const extension = getImageExtension(detectedMimeType)
  const path = `${userId}/naver-import-${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${extension}`
  const { error } = await supabaseAdmin.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: detectedMimeType,
    upsert: false,
  })

  if (error) {
    throw new Error(error.message)
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)

  return publicUrl
}

export async function copyImportedImagesToStorage(
  content: JSONContent,
  userId: string,
  heroImageUrl: string | null,
): Promise<CopiedImageResult> {
  const clonedContent = cloneContent(content)
  const imageNodes = collectImageNodes(clonedContent)
  const warnings: string[] = []
  const copiedImageMap = new Map<string, string>()
  let thumbnailUrl: string | null = null

  for (const imageNode of imageNodes) {
    const attrs = imageNode.attrs as Record<string, unknown> | undefined
    const src = typeof attrs?.src === 'string' ? attrs.src : null
    if (!src) continue

    if (!copiedImageMap.has(src)) {
      try {
        copiedImageMap.set(src, await copyImageToStorage(src, userId))
      } catch (error) {
        const message = error instanceof Error ? error.message : '알 수 없는 오류'
        warnings.push(`본문 이미지 복사 실패: ${message}`)
        copiedImageMap.set(src, '')
      }
    }

    const copiedUrl = copiedImageMap.get(src)
    if (!copiedUrl) {
      replaceFailedImageNode(imageNode, src)
      continue
    }

    attrs!.src = copiedUrl
    if (!thumbnailUrl) thumbnailUrl = copiedUrl
  }

  if (!thumbnailUrl && heroImageUrl) {
    try {
      thumbnailUrl = await copyImageToStorage(heroImageUrl, userId)
    } catch (error) {
      const message = error instanceof Error ? error.message : '알 수 없는 오류'
      warnings.push(`대표 이미지 복사 실패: ${message}`)
    }
  }

  return {
    content: clonedContent,
    thumbnailUrl,
    warnings,
  }
}
