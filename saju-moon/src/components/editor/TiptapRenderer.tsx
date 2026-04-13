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
            const href = escHtml(m.attrs?.href ?? '')
            text = `<a href="${href}" class="underline text-blue-600" target="${m.attrs?.target ?? '_blank'}" rel="noopener noreferrer">${text}</a>`
            break
          }
        }
      }
      return text
    }

    case 'paragraph': {
      const align = node.attrs?.textAlign
      const style = align && align !== 'left' ? ` style="text-align:${align}"` : ''
      return `<p${style}>${inner()}</p>`
    }

    case 'heading': {
      const level = node.attrs?.level ?? 2
      const align = node.attrs?.textAlign
      const style = align && align !== 'left' ? ` style="text-align:${align}"` : ''
      return `<h${level}${style}>${inner()}</h${level}>`
    }

    case 'image': {
      const src  = escHtml(node.attrs?.src ?? '')
      const alt  = escHtml(node.attrs?.alt ?? '')
      const title = node.attrs?.title ? ` title="${escHtml(node.attrs.title)}"` : ''
      if (!src) return ''
      return `<img src="${src}" alt="${alt}"${title} class="max-w-full rounded">`
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
