import type { JSONContent } from '@tiptap/react'
import { copyImportedImagesToStorage } from './image-copy'
import { fetchAndParsePublicNaverPost } from './fetch'
import type { NaverImportResult } from './types'

function cloneContent<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function forceCenterAlignForImages(node: JSONContent) {
  if (node.type === 'image') {
    node.attrs = {
      ...(node.attrs ?? {}),
      align: 'center',
    }
  }

  if (Array.isArray(node.content)) {
    for (const child of node.content) {
      forceCenterAlignForImages(child)
    }
  }
}

export async function importPublicNaverPostToDraft(
  inputUrl: string,
  userId: string,
): Promise<NaverImportResult> {
  const fetchedPost = await fetchAndParsePublicNaverPost(inputUrl)
  const copiedImages = await copyImportedImagesToStorage(
    cloneContent(fetchedPost.content),
    userId,
    fetchedPost.heroImageUrl,
  )
  forceCenterAlignForImages(copiedImages.content)

  return {
    title: fetchedPost.title,
    content: copiedImages.content,
    summary: '',
    thumbnailUrl: copiedImages.thumbnailUrl,
    warnings: copiedImages.warnings,
  }
}
