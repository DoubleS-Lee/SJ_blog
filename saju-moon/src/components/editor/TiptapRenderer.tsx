import type { JSONContent } from '@tiptap/react'

// generateHTML(prosemirror DOMSerializer)은 브라우저 window 가 필요해 SSR에서 실패합니다.
// DOM 없이 Tiptap JSON → HTML 문자열로 직접 변환합니다.

function escHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function sanitizeUrl(raw: unknown, options?: { allowRelative?: boolean }) {
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  if (!value) return null

  if (options?.allowRelative && value.startsWith('/')) {
    return escHtml(value)
  }

  if (/^(https?:|mailto:|tel:)/i.test(value)) {
    return escHtml(value)
  }

  return null
}

function sanitizeColor(raw: unknown) {
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  if (/^#[0-9a-fA-F]{3,8}$/.test(value)) return value
  if (/^rgba?\([\d\s.,%]+\)$/.test(value)) return value
  if (/^hsla?\([\d\s.,%]+\)$/.test(value)) return value
  if (/^[a-zA-Z]{3,20}$/.test(value)) return value
  return null
}

function sanitizeFontSize(raw: unknown) {
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  return /^\d+(\.\d+)?(px|rem|em|%)$/.test(value) ? value : null
}

function sanitizeFontFamily(raw: unknown) {
  if (typeof raw !== 'string') return null
  const value = raw.trim()
  return /^[a-zA-Z0-9\s,'"-]{1,80}$/.test(value) ? value : null
}

function nodeToHtml(node: JSONContent): string {
  const inner = () => node.content?.map(nodeToHtml).join('') ?? ''

  switch (node.type) {
    case 'doc':
      return inner()

    case 'text': {
      let text = escHtml(node.text ?? '')
      const marks = [...(node.marks ?? [])].reverse()
      for (const m of marks) {
        switch (m.type) {
          case 'bold':      text = `<strong>${text}</strong>`; break
          case 'italic':    text = `<em>${text}</em>`; break
          case 'underline': text = `<u>${text}</u>`; break
          case 'strike':    text = `<s>${text}</s>`; break
          case 'code':      text = `<code>${text}</code>`; break
          case 'link': {
            const href = sanitizeUrl(m.attrs?.href, { allowRelative: true })
            if (!href) break
            const target = m.attrs?.target === '_self' ? '_self' : '_blank'
            text = `<a href="${href}" class="underline text-blue-600" target="${target}" rel="noopener noreferrer">${text}</a>`
            break
          }
          case 'textStyle': {
            const styles: string[] = []
            const color = sanitizeColor(m.attrs?.color)
            const fontSize = sanitizeFontSize(m.attrs?.fontSize)
            const fontFamily = sanitizeFontFamily(m.attrs?.fontFamily)
            if (color) styles.push(`color:${color}`)
            if (fontSize) styles.push(`font-size:${fontSize}`)
            if (fontFamily) styles.push(`font-family:${fontFamily}`)
            if (styles.length) text = `<span style="${styles.join(';')}">${text}</span>`
            break
          }
          case 'highlight': {
            const color = sanitizeColor(m.attrs?.color) ?? '#FEF08A'
            text = `<mark style="background-color:${color}">${text}</mark>`
            break
          }
        }
      }
      return text
    }

    case 'paragraph': {
      const align = node.attrs?.textAlign
      const style = align && align !== 'left' ? ` style="text-align:${align}"` : ''
      const html = inner()
      return `<p${style}>${html || '<br>'}</p>`
    }

    case 'heading': {
      const level = node.attrs?.level ?? 2
      const align = node.attrs?.textAlign
      const style = align && align !== 'left' ? ` style="text-align:${align}"` : ''
      return `<h${level}${style}>${inner()}</h${level}>`
    }

    case 'image': {
      const src = sanitizeUrl(node.attrs?.src, { allowRelative: true })
      const alt   = escHtml(node.attrs?.alt ?? '')
      const title = node.attrs?.title ? ` title="${escHtml(node.attrs.title)}"` : ''
      const width = node.attrs?.width as number | null
      const align = (node.attrs?.align as string | undefined) ?? 'left'
      if (!src) return ''
      const imgStyle = `display:inline-block;max-width:100%${width ? `;width:${width}px` : ''}`
      const wrapAlign = align === 'center' ? 'center' : align === 'right' ? 'right' : 'left'
      return `<div style="text-align:${wrapAlign};margin:8px 0"><img src="${src}" alt="${alt}"${title} class="rounded" style="${imgStyle}"></div>`
    }

    case 'bulletList':
      return `<ul>${inner()}</ul>`

    case 'orderedList':
      return `<ol>${inner()}</ol>`

    case 'listItem':
      return `<li>${inner()}</li>`

    case 'blockquote':
      return `<blockquote>${inner()}</blockquote>`

    case 'codeBlock': {
      const lang = node.attrs?.language ?? ''
      const code = node.content?.map(n => escHtml(n.text ?? '')).join('') ?? ''
      return `<pre${lang ? ` data-language="${lang}"` : ''}><code>${code}</code></pre>`
    }

    case 'horizontalRule':
      return '<hr>'

    case 'hardBreak':
      return '<br>'

    case 'callout': {
      const CALLOUT = {
        info:    { bg: '#eff6ff', border: '#3b82f6', icon: '💡' },
        warning: { bg: '#fffbeb', border: '#f59e0b', icon: '⚠️' },
        tip:     { bg: '#f0fdf4', border: '#22c55e', icon: '✅' },
      }
      type CalloutKey = keyof typeof CALLOUT
      const ct = (node.attrs?.calloutType ?? 'info') as CalloutKey
      const c = CALLOUT[ct] ?? CALLOUT.info
      return `<div style="display:flex;gap:10px;align-items:flex-start;background-color:${c.bg};border-left:4px solid ${c.border};padding:12px 16px;border-radius:0 6px 6px 0;margin:8px 0"><span style="flex-shrink:0;line-height:1.6">${c.icon}</span><div style="flex:1;min-width:0">${inner()}</div></div>`
    }

    case 'pullquote':
      return `<div style="border-top:2px solid #111;border-bottom:2px solid #111;padding:20px 24px;margin:24px 0;text-align:center;font-size:1.5rem;font-style:italic;font-weight:300;line-height:1.5;color:#1a1a1a">${inner()}</div>`

    case 'speechBubble':
      return `<div style="display:flex;justify-content:center;margin:16px 0 28px 0"><div style="position:relative;border:1.5px solid #aaa;border-radius:8px;padding:16px 20px;background:#fff;display:inline-block;min-width:80px;max-width:80%;box-sizing:border-box">${inner()}<div style="position:absolute;bottom:-16px;left:28px;width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-top:16px solid #aaa"></div><div style="position:absolute;bottom:-13px;left:30px;width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;border-top:13px solid #fff"></div></div></div>`

    case 'memoBox':
      return `<div style="display:flex;justify-content:center;margin:16px 0"><div style="position:relative;border:1.5px solid #c0c0c0;padding:16px 20px;background:#fff;overflow:hidden;display:inline-block;min-width:80px;max-width:80%;box-sizing:border-box">${inner()}<div style="position:absolute;bottom:0;right:0;width:26px;height:26px;background:#b8b8b8;clip-path:polygon(100% 0,100% 100%,0 100%)"></div><div style="position:absolute;bottom:1px;right:1px;width:24px;height:24px;background:#e8e8e8;clip-path:polygon(100% 0,100% 100%,0 100%)"></div></div></div>`

    case 'bracketFrame': {
      const b = '2px solid #666'
      const s = 'position:absolute;width:16px;height:16px'
      return `<div style="display:flex;justify-content:center;margin:16px 0"><div style="position:relative;padding:20px 24px;display:inline-block;min-width:80px;max-width:80%;box-sizing:border-box">${inner()}<div style="${s};top:0;left:0;border-top:${b};border-left:${b}"></div><div style="${s};top:0;right:0;border-top:${b};border-right:${b}"></div><div style="${s};bottom:0;left:0;border-bottom:${b};border-left:${b}"></div><div style="${s};bottom:0;right:0;border-bottom:${b};border-right:${b}"></div></div></div>`
    }

    default:
      // 알 수 없는 노드: 자식 노드만 렌더링
      return inner()
  }
}

export default function TiptapRenderer({ content }: { content: JSONContent | null }) {
  if (!content || !content.content?.length) {
    return <p className="text-gray-400 italic">내용이 없습니다.</p>
  }

  const html = nodeToHtml(content)

  if (!html.trim()) {
    return <p className="text-gray-400 italic">내용이 없습니다.</p>
  }

  return (
    <div
      className="prose prose-gray max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
