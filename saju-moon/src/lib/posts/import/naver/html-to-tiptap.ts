import { parse } from 'parse5'
import type { JSONContent } from '@tiptap/react'
import { resolveBestNaverImageUrl } from './image-url'

type Parse5Node = {
  nodeName?: string
  tagName?: string
  value?: string
  attrs?: Array<{ name: string; value: string }>
  childNodes?: Parse5Node[]
}

type TiptapMark = {
  type: string
  attrs?: Record<string, unknown>
}

const BLOCK_TAGS = new Set([
  'p',
  'div',
  'section',
  'article',
  'blockquote',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'img',
  'figure',
])

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

function addMarkUnique(target: TiptapMark[], mark: TiptapMark) {
  const serialized = JSON.stringify(mark)
  if (target.some((item) => JSON.stringify(item) === serialized)) return
  target.push(mark)
}

function extractStyleValue(styleAttr: string, property: string) {
  const escapedProperty = property.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = styleAttr.match(new RegExp(`${escapedProperty}\\s*:\\s*([^;]+)`, 'i'))
  return match?.[1]?.trim() ?? null
}

function sanitizeCssColor(raw: string | null) {
  if (!raw) return null
  const value = raw.trim()
  if (!value || value === 'transparent' || value === 'inherit' || value === 'initial') return null
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return value
  if (/^rgba?\([\d\s.,%]+\)$/.test(value)) return value
  if (/^hsla?\([\d\s.,%]+\)$/.test(value)) return value
  if (/^[a-zA-Z]{3,20}$/.test(value)) return value
  return null
}

function sanitizeFontSize(raw: string | null) {
  if (!raw) return null
  const value = raw.trim()
  return /^\d+(\.\d+)?(px|rem|em|%)$/.test(value) ? value : null
}

function sanitizeFontFamily(raw: string | null) {
  if (!raw) return null
  const value = raw.trim()
  return /^[a-zA-Z0-9\s,'"-]{1,120}$/.test(value) ? value : null
}

function addInlineStyleMarks(node: Parse5Node, marks: TiptapMark[]) {
  const styleAttr = getAttr(node, 'style') ?? ''
  const classAttr = getAttr(node, 'class') ?? ''

  if (
    /font-weight\s*:\s*(bold|[5-9]00)/i.test(styleAttr) ||
    /\bse-bold\b|\bfont_bold\b/i.test(classAttr)
  ) {
    addMarkUnique(marks, { type: 'bold' })
  }

  if (
    /text-decoration(?:-line)?\s*:\s*[^;]*underline/i.test(styleAttr) ||
    /\bse-underline\b|\btext_underline\b/i.test(classAttr)
  ) {
    addMarkUnique(marks, { type: 'underline' })
  }

  const color = sanitizeCssColor(extractStyleValue(styleAttr, 'color'))
  const fontSize = sanitizeFontSize(extractStyleValue(styleAttr, 'font-size'))
  const fontFamily = sanitizeFontFamily(extractStyleValue(styleAttr, 'font-family'))
  if (color || fontSize || fontFamily) {
    addMarkUnique(marks, {
      type: 'textStyle',
      attrs: {
        ...(color ? { color } : {}),
        ...(fontSize ? { fontSize } : {}),
        ...(fontFamily ? { fontFamily } : {}),
      },
    })
  }

  const backgroundColor =
    sanitizeCssColor(extractStyleValue(styleAttr, 'background-color')) ??
    sanitizeCssColor(extractStyleValue(styleAttr, 'background'))

  if (backgroundColor) {
    addMarkUnique(marks, { type: 'highlight', attrs: { color: backgroundColor } })
  }
}

function normalizeWhitespace(value: string) {
  return value.replace(/\u00a0/g, ' ').replace(/\s+/g, ' ')
}

function extractTextAlign(node: Parse5Node): 'left' | 'center' | 'right' | null {
  const alignAttr = getAttr(node, 'align')
  if (alignAttr === 'left' || alignAttr === 'center' || alignAttr === 'right') {
    return alignAttr
  }

  const styleAttr = getAttr(node, 'style') ?? ''
  const styleMatch = styleAttr.match(/text-align\s*:\s*(left|center|right)/i)
  if (styleMatch) return styleMatch[1].toLowerCase() as 'left' | 'center' | 'right'

  const classAttr = getAttr(node, 'class') ?? ''
  if (/align[-_]?center|text-align-center|se-align-center/i.test(classAttr)) return 'center'
  if (/align[-_]?right|text-align-right|se-align-right/i.test(classAttr)) return 'right'
  if (/align[-_]?left|text-align-left|se-align-left/i.test(classAttr)) return 'left'

  return null
}

function isBlockNode(node: Parse5Node) {
  return isElement(node) && BLOCK_TAGS.has(node.tagName)
}

function pushTextNode(target: JSONContent[], text: string, marks: TiptapMark[]) {
  const normalized = normalizeWhitespace(text)
  if (!normalized.trim()) return

  target.push({
    type: 'text',
    text: normalized,
    ...(marks.length > 0 ? { marks } : {}),
  })
}

function extractImageUrl(node: Parse5Node, baseUrl: string) {
  if (!isElement(node) || node.tagName !== 'img') return null
  return resolveBestNaverImageUrl(node, baseUrl)
}

function extractImageWidth(node: Parse5Node) {
  const widthAttr = getAttr(node, 'width')
  if (widthAttr && /^\d+$/.test(widthAttr.trim())) {
    return Number.parseInt(widthAttr.trim(), 10)
  }

  const styleAttr = getAttr(node, 'style') ?? ''
  const widthFromStyle = extractStyleValue(styleAttr, 'width')
  if (widthFromStyle && /^\d+(\.\d+)?px$/i.test(widthFromStyle)) {
    return Math.round(Number.parseFloat(widthFromStyle))
  }

  return null
}

function convertInlineNodes(
  nodes: Parse5Node[],
  baseUrl: string,
  marks: TiptapMark[] = [],
  output: JSONContent[] = [],
) {
  for (const node of nodes) {
    if (node.nodeName === '#text') {
      pushTextNode(output, node.value ?? '', marks)
      continue
    }

    if (!isElement(node)) continue

    if (node.tagName === 'br') {
      output.push({ type: 'hardBreak' })
      continue
    }

    if (node.tagName === 'img') {
      const src = extractImageUrl(node, baseUrl)
      if (src) output.push({ type: 'image', attrs: { src } })
      continue
    }

    const nextMarks = [...marks]
    if (node.tagName === 'strong' || node.tagName === 'b') addMarkUnique(nextMarks, { type: 'bold' })
    if (node.tagName === 'u') addMarkUnique(nextMarks, { type: 'underline' })
    if (node.tagName === 'mark') {
      const highlightColor =
        sanitizeCssColor(getAttr(node, 'data-color')) ??
        sanitizeCssColor(extractStyleValue(getAttr(node, 'style') ?? '', 'background-color')) ??
        '#FEF08A'
      addMarkUnique(nextMarks, { type: 'highlight', attrs: { color: highlightColor } })
    }
    addInlineStyleMarks(node, nextMarks)

    if (node.tagName === 'a') {
      const href = getAttr(node, 'href')
      if (href) {
        try {
          addMarkUnique(nextMarks, { type: 'link', attrs: { href: new URL(href, baseUrl).toString() } })
        } catch {
          addMarkUnique(nextMarks, { type: 'link', attrs: { href } })
        }
      }
    }

    if (isBlockNode(node)) {
      const blocks = convertBlockNode(node, baseUrl)
      for (const block of blocks) {
        if (block.type === 'paragraph' && Array.isArray(block.content)) {
          output.push(...block.content)
        }
      }
      continue
    }

    convertInlineNodes(getChildNodes(node), baseUrl, nextMarks, output)
  }

  return output
}

function wrapInlineAsParagraph(
  node: Parse5Node,
  baseUrl: string,
  align: 'left' | 'center' | 'right' | null = null,
) {
  const content = convertInlineNodes(getChildNodes(node), baseUrl)
  if (content.length === 0) return []

  return [
    {
      type: 'paragraph',
      ...(align ? { attrs: { textAlign: align } } : {}),
      content,
    },
  ] satisfies JSONContent[]
}

function convertList(node: Parse5Node, baseUrl: string, ordered: boolean) {
  const items = getChildNodes(node)
    .filter((child) => isElement(child) && child.tagName === 'li')
    .map((child) => {
      const blocks = convertBlockChildren(getChildNodes(child), baseUrl)
      return {
        type: 'listItem',
        content: blocks.length > 0 ? blocks : [{ type: 'paragraph' }],
      } satisfies JSONContent
    })

  if (items.length === 0) return []

  return [
    {
      type: ordered ? 'orderedList' : 'bulletList',
      content: items,
    },
  ] satisfies JSONContent[]
}

function convertBlockquote(node: Parse5Node, baseUrl: string) {
  const blocks = convertBlockChildren(getChildNodes(node), baseUrl)
  if (blocks.length === 0) return []

  return [
    {
      type: 'blockquote',
      content: blocks,
    },
  ] satisfies JSONContent[]
}

function convertHeading(node: Parse5Node & { tagName: string; childNodes: Parse5Node[] }, baseUrl: string) {
  const level = Number.parseInt(node.tagName.replace('h', ''), 10)
  const content = convertInlineNodes(getChildNodes(node), baseUrl)
  if (content.length === 0) return []

  const align = extractTextAlign(node)

  return [
    {
      type: 'heading',
      attrs: {
        level: Number.isFinite(level) ? Math.min(Math.max(level, 1), 6) : 2,
        ...(align ? { textAlign: align } : {}),
      },
      content,
    },
  ] satisfies JSONContent[]
}

function convertImage(
  node: Parse5Node,
  baseUrl: string,
  alignOverride: 'left' | 'center' | 'right' | null = null,
) {
  const src = extractImageUrl(node, baseUrl)
  if (!src) return []

  const width = extractImageWidth(node)
  const align = alignOverride ?? extractTextAlign(node) ?? 'center'

  return [
    {
      type: 'image',
      attrs: {
        src,
        align,
        ...(width ? { width } : {}),
      },
    },
  ] satisfies JSONContent[]
}

function hasMeaningfulText(node: Parse5Node): boolean {
  if (node.nodeName === '#text') {
    return normalizeWhitespace(node.value ?? '').trim().length > 0
  }

  return getChildNodes(node).some((child) => hasMeaningfulText(child))
}

function convertSingleImageContainer(
  node: Parse5Node,
  baseUrl: string,
): JSONContent[] | null {
  const childNodes = getChildNodes(node).filter((child) => {
    if (child.nodeName === '#text') {
      return normalizeWhitespace(child.value ?? '').trim().length > 0
    }
    return true
  })

  const imageChildren = childNodes.filter((child) => isElement(child) && child.tagName === 'img')
  const figureChildren = childNodes.filter((child) => isElement(child) && child.tagName === 'figure')

  if (imageChildren.length === 1 && childNodes.length === 1) {
    return convertImage(imageChildren[0], baseUrl, extractTextAlign(node))
  }

  if (figureChildren.length === 1 && childNodes.length === 1) {
    const imageChild = getChildNodes(figureChildren[0]).find((child) => isElement(child) && child.tagName === 'img')
    if (imageChild) return convertImage(imageChild, baseUrl, extractTextAlign(node))
  }

  return null
}

function convertBlockNode(node: Parse5Node, baseUrl: string): JSONContent[] {
  if (!isElement(node)) return []

  if (node.tagName === 'img') return convertImage(node, baseUrl)
  if (node.tagName === 'blockquote') return convertBlockquote(node, baseUrl)
  if (node.tagName === 'ul') return convertList(node, baseUrl, false)
  if (node.tagName === 'ol') return convertList(node, baseUrl, true)
  if (/^h[1-6]$/.test(node.tagName)) return convertHeading(node, baseUrl)

  if (node.tagName === 'figure') {
    const imageChild = getChildNodes(node).find((child) => isElement(child) && child.tagName === 'img')
    if (imageChild && !getChildNodes(node).some((child) => hasMeaningfulText(child) && child !== imageChild)) {
      return convertImage(imageChild, baseUrl, extractTextAlign(node))
    }
  }

  if (node.tagName === 'div' || node.tagName === 'section' || node.tagName === 'article' || node.tagName === 'p') {
    const singleImage = convertSingleImageContainer(node, baseUrl)
    if (singleImage) return singleImage
  }

  const childNodes = getChildNodes(node)
  const childBlocks = childNodes.filter(isBlockNode)
  const align = extractTextAlign(node)

  if (
    childBlocks.length > 0 &&
    !(node.tagName === 'p' || node.tagName === 'div' || node.tagName === 'section' || node.tagName === 'article')
  ) {
    return convertBlockChildren(childNodes, baseUrl)
  }

  if (childBlocks.length > 0) return convertBlockChildren(childNodes, baseUrl)

  return wrapInlineAsParagraph(node, baseUrl, align)
}

function convertBlockChildren(nodes: Parse5Node[], baseUrl: string) {
  const blocks: JSONContent[] = []

  for (const node of nodes) {
    if (node.nodeName === '#text') {
      const text = normalizeWhitespace(node.value ?? '').trim()
      if (!text) continue

      blocks.push({
        type: 'paragraph',
        content: [{ type: 'text', text }],
      })
      continue
    }

    if (!isElement(node)) continue
    if (node.tagName === 'br') continue

    if (isBlockNode(node)) {
      blocks.push(...convertBlockNode(node, baseUrl))
      continue
    }

    blocks.push(...wrapInlineAsParagraph(node, baseUrl, extractTextAlign(node)))
  }

  return blocks
}

function findContentRoot(documentNode: Parse5Node) {
  const queue: Parse5Node[] = [documentNode]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) continue

    if (
      hasClass(current, 'se-main-container') ||
      getAttr(current, 'id') === 'postViewArea' ||
      hasClass(current, 'post-view')
    ) {
      return current
    }

    queue.push(...getChildNodes(current))
  }

  return documentNode
}

export function convertNaverHtmlToTiptapJson(html: string, baseUrl: string): JSONContent {
  const documentNode = parse(html) as Parse5Node
  const contentRoot = findContentRoot(documentNode)
  const content = convertBlockChildren(getChildNodes(contentRoot), baseUrl)

  return {
    type: 'doc',
    content: content.length > 0 ? content : [{ type: 'paragraph' }],
  }
}
