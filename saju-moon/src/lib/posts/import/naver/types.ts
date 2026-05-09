import type { JSONContent } from '@tiptap/react'

export interface ParsedNaverPost {
  title: string
  content: JSONContent
  textContent: string
  imageUrls: string[]
  heroImageUrl: string | null
  sourceUrl: string
}

export interface CopiedImageResult {
  content: JSONContent
  thumbnailUrl: string | null
  warnings: string[]
}

export interface NaverImportResult {
  title: string
  content: JSONContent
  summary: string
  thumbnailUrl: string | null
  warnings: string[]
}
