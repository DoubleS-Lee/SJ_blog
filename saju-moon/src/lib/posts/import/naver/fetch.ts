import { parse } from 'parse5'
import { convertNaverHtmlToTiptapJson } from './html-to-tiptap'
import type { ParsedNaverPost } from './types'
import { resolveBestNaverImageUrl } from './image-url'

type Parse5Node = {
  nodeName?: string
  tagName?: string
  value?: string
  attrs?: Array<{ name: string; value: string }>
  childNodes?: Parse5Node[]
}

const NAVER_ALLOWED_HOSTS = new Set(['blog.naver.com', 'm.blog.naver.com'])

function isElement(node: Parse5Node): node is Parse5Node & { tagName: string; childNodes: Parse5Node[] } {
  return typeof node.tagName === 'string'
}

function getChildNodes(node: Parse5Node) {
  return Array.isArray(node.childNodes) ? node.childNodes : []
}

function getAttr(node: Parse5Node, name: string) {
  return node.attrs?.find((attr) => attr.name === name)?.value ?? null
}

function hasClass(node: Parse5Node, className: string) {
  const classAttr = getAttr(node, 'class')
  if (!classAttr) return false

  return classAttr
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .includes(className)
}

function findFirst(node: Parse5Node, matcher: (current: Parse5Node) => boolean): Parse5Node | null {
  if (matcher(node)) return node

  for (const child of getChildNodes(node)) {
    const found = findFirst(child, matcher)
    if (found) return found
  }

  return null
}

function findMetaContent(node: Parse5Node, propertyName: string) {
  const metaNode = findFirst(node, (current) => {
    if (!isElement(current) || current.tagName !== 'meta') return false

    return getAttr(current, 'property') === propertyName || getAttr(current, 'name') === propertyName
  })

  return metaNode ? getAttr(metaNode, 'content') : null
}

function textContent(node: Parse5Node): string {
  if (node.nodeName === '#text') {
    return node.value ?? ''
  }

  return getChildNodes(node).map((child) => textContent(child)).join('')
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function findTitleNode(documentNode: Parse5Node) {
  return (
    findFirst(documentNode, (node) => hasClass(node, 'se-title-text')) ??
    findFirst(documentNode, (node) => hasClass(node, 'pcol1') && normalizeText(textContent(node)).length > 0) ??
    findFirst(documentNode, (node) => hasClass(node, 'htitle')) ??
    findFirst(documentNode, (node) => getAttr(node, 'id') === 'title_1')
  )
}

function findContentRoot(documentNode: Parse5Node) {
  return (
    findFirst(documentNode, (node) => hasClass(node, 'se-main-container')) ??
    findFirst(documentNode, (node) => getAttr(node, 'id') === 'postViewArea') ??
    findFirst(documentNode, (node) => hasClass(node, 'post-view')) ??
    findFirst(documentNode, (node) => isElement(node) && node.tagName === 'body')
  )
}

async function fetchHtml(url: string) {
  const response = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      'accept-language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`네이버 글을 불러오지 못했습니다. (${response.status})`)
  }

  return response.text()
}

function resolveUrl(input: string, base: string) {
  try {
    return new URL(input, base).toString()
  } catch {
    return null
  }
}

function collectImageUrls(node: Parse5Node, baseUrl: string, imageUrls = new Set<string>()) {
  if (isElement(node) && node.tagName === 'img') {
    const resolved = resolveBestNaverImageUrl(node, baseUrl)
    if (resolved) imageUrls.add(resolved)
  }

  for (const child of getChildNodes(node)) {
    collectImageUrls(child, baseUrl, imageUrls)
  }

  return imageUrls
}

function getEmbeddedPostUrl(documentNode: Parse5Node, baseUrl: string) {
  const iframe = findFirst(
    documentNode,
    (node) => isElement(node) && node.tagName === 'iframe' && getAttr(node, 'id') === 'mainFrame',
  )

  const iframeSrc = iframe ? getAttr(iframe, 'src') : null
  if (!iframeSrc) return null

  return resolveUrl(iframeSrc, baseUrl)
}

export async function fetchAndParsePublicNaverPost(inputUrl: string): Promise<ParsedNaverPost> {
  let normalizedUrl: URL

  try {
    normalizedUrl = new URL(inputUrl)
  } catch {
    throw new Error('올바른 네이버 블로그 글 URL을 입력해 주세요.')
  }

  if (!NAVER_ALLOWED_HOSTS.has(normalizedUrl.hostname)) {
    throw new Error('현재는 네이버 블로그 공개 글 URL만 지원합니다.')
  }

  const initialHtml = await fetchHtml(normalizedUrl.toString())
  const initialDocument = parse(initialHtml) as Parse5Node
  const embeddedUrl = getEmbeddedPostUrl(initialDocument, normalizedUrl.toString())
  const sourceUrl = embeddedUrl ?? normalizedUrl.toString()
  const postHtml = embeddedUrl ? await fetchHtml(embeddedUrl) : initialHtml
  const postDocument = embeddedUrl ? (parse(postHtml) as Parse5Node) : initialDocument

  const title =
    normalizeText(textContent(findTitleNode(postDocument) ?? postDocument)) ||
    findMetaContent(postDocument, 'og:title') ||
    findMetaContent(postDocument, 'twitter:title') ||
    '제목 없는 글'

  const contentRoot = findContentRoot(postDocument)
  if (!contentRoot) {
    throw new Error('네이버 글 본문을 찾지 못했습니다.')
  }

  const imageUrls = Array.from(collectImageUrls(contentRoot, sourceUrl))
  const heroImageUrl = (() => {
    const raw = findMetaContent(postDocument, 'og:image')
    return raw ? resolveUrl(raw, sourceUrl) : null
  })()

  return {
    title,
    content: convertNaverHtmlToTiptapJson(postHtml, sourceUrl),
    textContent: normalizeText(textContent(contentRoot)),
    imageUrls,
    heroImageUrl,
    sourceUrl,
  }
}
