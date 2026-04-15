'use client'

import { useEditor, EditorContent, ReactNodeViewRenderer, NodeViewWrapper, NodeViewContent } from '@tiptap/react'
import { Node, mergeAttributes } from '@tiptap/core'
import type { NodeViewProps } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { TextStyle, FontSize, FontFamily } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { useEffect, useRef, useCallback, useState } from 'react'
import type { JSONContent } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import type { EditorView } from '@tiptap/pm/view'

const FONT_SIZES = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px']

const TEXT_COLORS = [
  '#000000', '#374151', '#6B7280', '#EF4444', '#F97316',
  '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6', '#EC4899',
]

const HIGHLIGHT_COLORS = [
  '#FEF08A', '#FED7AA', '#FECACA', '#BBF7D0', '#BAE6FD',
  '#DDD6FE', '#FBCFE8', '#E5E7EB',
]

const FONT_FAMILIES = [
  { label: '글씨체', value: '' },
  { label: '명조', value: '"Nanum Myeongjo", "Batang", serif' },
  { label: '네이버 고딕', value: '"Nanum Gothic", "Malgun Gothic", sans-serif' },
  { label: '타자기', value: '"Courier New", "Consolas", monospace' },
  { label: '둥근 고딕', value: '"Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif' },
  { label: 'Do Hyeon', value: 'var(--font-do-hyeon)' },
  { label: '나눔고딕', value: 'var(--font-nanum-gothic)' },
  { label: '나눔명조', value: 'var(--font-nanum-myeongjo)' },
  { label: 'Jua', value: 'var(--font-jua)' },
  { label: 'Black Han Sans', value: 'var(--font-black-han-sans)' },
  { label: 'Gaegu', value: 'var(--font-gaegu)' },
  { label: 'Sunflower', value: 'var(--font-sunflower)' },
  { label: 'Gothic A1', value: 'var(--font-gothic-a1)' },
]

type CalloutType = 'info' | 'warning' | 'tip'

const CALLOUT_CONFIG: Record<CalloutType, { bg: string; border: string }> = {
  info:    { bg: '#eff6ff', border: '#3b82f6' },
  warning: { bg: '#fffbeb', border: '#f59e0b' },
  tip:     { bg: '#f0fdf4', border: '#22c55e' },
}

// ─── 콜아웃 노드 ─────────────────────────────────────────────────
const CalloutExtension = Node.create({
  name: 'callout',
  group: 'block',
  content: 'block+',
  defining: true,
  addAttributes() {
    return {
      calloutType: {
        default: 'info',
        parseHTML: (el) => el.getAttribute('data-callout-type') ?? 'info',
        renderHTML: (attrs) => ({ 'data-callout-type': attrs.calloutType }),
      },
    }
  },
  parseHTML() {
    return [{ tag: 'div[data-callout-type]' }]
  },
  renderHTML({ node, HTMLAttributes }) {
    const ct = (node.attrs.calloutType ?? 'info') as CalloutType
    const c = CALLOUT_CONFIG[ct] ?? CALLOUT_CONFIG.info
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        style: `background-color:${c.bg};border-left:4px solid ${c.border};padding:12px 16px;border-radius:0 6px 6px 0;margin:8px 0`,
      }),
      0,
    ]
  },
})

// ─── 풀쿼트 노드 ─────────────────────────────────────────────────
const PullquoteExtension = Node.create({
  name: 'pullquote',
  group: 'block',
  content: 'inline*',
  defining: true,
  parseHTML() {
    return [{ tag: 'div[data-pullquote]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-pullquote': '',
        style: 'border-top:2px solid #111;border-bottom:2px solid #111;padding:20px 24px;margin:24px 0;text-align:center;font-size:1.5rem;font-style:italic;font-weight:300;line-height:1.5;color:#1a1a1a',
      }),
      0,
    ]
  },
})

// ─── 말풍선 NodeView + 노드 ─────────────────────────────────────────
function SpeechBubbleView() {
  return (
    <NodeViewWrapper style={{ display: 'flex', justifyContent: 'center', margin: '16px 0 28px 0' }}>
      <div style={{
        position: 'relative',
        border: '1.5px solid #aaa',
        borderRadius: '8px',
        padding: '16px 20px',
        background: '#fff',
        display: 'inline-block',
        minWidth: '80px',
        maxWidth: '80%',
        boxSizing: 'border-box',
      }}>
        <NodeViewContent />
        <div style={{ position: 'absolute', bottom: -16, left: 28, width: 0, height: 0, borderLeft: '14px solid transparent', borderRight: '14px solid transparent', borderTop: '16px solid #aaa', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -13, left: 30, width: 0, height: 0, borderLeft: '12px solid transparent', borderRight: '12px solid transparent', borderTop: '13px solid #fff', pointerEvents: 'none' }} />
      </div>
    </NodeViewWrapper>
  )
}

const SpeechBubbleExtension = Node.create({
  name: 'speechBubble',
  group: 'block',
  content: 'block+',
  defining: true,
  parseHTML() {
    return [{ tag: 'div[data-speech-bubble]', contentElement: 'div[data-sbc]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-speech-bubble': '',
        style: 'position:relative;border:1.5px solid #aaa;border-radius:8px;padding:16px 20px;margin:16px 0 28px 0;background:#fff',
      }),
      ['div', { 'data-sbc': '' }, 0],
      ['div', { style: 'position:absolute;bottom:-16px;left:28px;width:0;height:0;border-left:14px solid transparent;border-right:14px solid transparent;border-top:16px solid #aaa;pointer-events:none' }],
      ['div', { style: 'position:absolute;bottom:-13px;left:30px;width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;border-top:13px solid #fff;pointer-events:none' }],
    ]
  },
  addNodeView() {
    return ReactNodeViewRenderer(SpeechBubbleView)
  },
})

// ─── 메모박스 NodeView + 노드 ────────────────────────────────────────
function MemoBoxView() {
  return (
    <NodeViewWrapper style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
      <div style={{
        position: 'relative',
        border: '1.5px solid #c0c0c0',
        padding: '16px 20px',
        background: '#fff',
        overflow: 'hidden',
        display: 'inline-block',
        minWidth: '80px',
        maxWidth: '80%',
        boxSizing: 'border-box',
      }}>
        <NodeViewContent />
        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, background: '#b8b8b8', clipPath: 'polygon(100% 0,100% 100%,0 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 1, right: 1, width: 24, height: 24, background: '#e8e8e8', clipPath: 'polygon(100% 0,100% 100%,0 100%)', pointerEvents: 'none' }} />
      </div>
    </NodeViewWrapper>
  )
}

const MemoBoxExtension = Node.create({
  name: 'memoBox',
  group: 'block',
  content: 'block+',
  defining: true,
  parseHTML() {
    return [{ tag: 'div[data-memo-box]', contentElement: 'div[data-mbc]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-memo-box': '',
        style: 'position:relative;border:1.5px solid #c0c0c0;padding:16px 20px;margin:16px 0;background:#fff;overflow:hidden',
      }),
      ['div', { 'data-mbc': '' }, 0],
      ['div', { style: 'position:absolute;bottom:0;right:0;width:26px;height:26px;background:#b8b8b8;clip-path:polygon(100% 0,100% 100%,0 100%);pointer-events:none' }],
      ['div', { style: 'position:absolute;bottom:1px;right:1px;width:24px;height:24px;background:#e8e8e8;clip-path:polygon(100% 0,100% 100%,0 100%);pointer-events:none' }],
    ]
  },
  addNodeView() {
    return ReactNodeViewRenderer(MemoBoxView)
  },
})

// ─── 브라켓 프레임 NodeView + 노드 ──────────────────────────────────
function BracketFrameView() {
  const bStyle = '2px solid #666'
  const corner: React.CSSProperties = { position: 'absolute', width: 16, height: 16, pointerEvents: 'none' }
  return (
    <NodeViewWrapper style={{ display: 'flex', justifyContent: 'center', margin: '16px 0' }}>
      <div style={{
        position: 'relative',
        padding: '20px 24px',
        display: 'inline-block',
        minWidth: '80px',
        maxWidth: '80%',
        boxSizing: 'border-box',
      }}>
        <NodeViewContent />
        <div style={{ ...corner, top: 0, left: 0, borderTop: bStyle, borderLeft: bStyle }} />
        <div style={{ ...corner, top: 0, right: 0, borderTop: bStyle, borderRight: bStyle }} />
        <div style={{ ...corner, bottom: 0, left: 0, borderBottom: bStyle, borderLeft: bStyle }} />
        <div style={{ ...corner, bottom: 0, right: 0, borderBottom: bStyle, borderRight: bStyle }} />
      </div>
    </NodeViewWrapper>
  )
}

const BracketFrameExtension = Node.create({
  name: 'bracketFrame',
  group: 'block',
  content: 'block+',
  defining: true,
  parseHTML() {
    return [{ tag: 'div[data-bracket-frame]', contentElement: 'div[data-bfc]' }]
  },
  renderHTML({ HTMLAttributes }) {
    const b = '2px solid #666'
    const s = 'position:absolute;width:16px;height:16px;pointer-events:none'
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-bracket-frame': '',
        style: 'position:relative;padding:20px 24px;margin:16px 0',
      }),
      ['div', { 'data-bfc': '' }, 0],
      ['div', { style: `${s};top:0;left:0;border-top:${b};border-left:${b}` }],
      ['div', { style: `${s};top:0;right:0;border-top:${b};border-right:${b}` }],
      ['div', { style: `${s};bottom:0;left:0;border-bottom:${b};border-left:${b}` }],
      ['div', { style: `${s};bottom:0;right:0;border-bottom:${b};border-right:${b}` }],
    ]
  },
  addNodeView() {
    return ReactNodeViewRenderer(BracketFrameView)
  },
})

// ─── 이미지 리사이즈 NodeView ──────────────────────────────────────
function ResizableImageView({ node, updateAttributes, selected }: NodeViewProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const startX = useRef(0)
  const startW = useRef(0)

  const src = (node.attrs.src as string) ?? ''
  const alt = (node.attrs.alt as string) ?? ''
  const width = node.attrs.width as number | null
  const align = (node.attrs.align as string | undefined) ?? 'left'

  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startX.current = e.clientX
    startW.current = width ?? (imgRef.current?.offsetWidth ?? 300)

    const onMouseMove = (ev: MouseEvent) => {
      const newW = Math.max(50, startW.current + (ev.clientX - startX.current))
      updateAttributes({ width: Math.round(newW) })
    }
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const justification = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start'

  return (
    <NodeViewWrapper style={{ display: 'flex', justifyContent: justification }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          draggable={false}
          style={{
            width: width ? `${width}px` : undefined,
            maxWidth: '100%',
            display: 'block',
            borderRadius: '4px',
            outline: selected ? '2px solid #3B82F6' : undefined,
            outlineOffset: selected ? '2px' : undefined,
          }}
        />
        {selected && (
          <div
            onMouseDown={handleResizeStart}
            style={{
              position: 'absolute',
              bottom: -5,
              right: -5,
              width: 12,
              height: 12,
              backgroundColor: '#3B82F6',
              border: '2px solid white',
              borderRadius: 2,
              cursor: 'se-resize',
            }}
          />
        )}
      </div>
    </NodeViewWrapper>
  )
}

// ─── 커스텀 이미지 (블록 + 정렬 + 리사이즈) ──────────────────────────
const CustomImage = Image.extend({
  group: 'block',
  inline: false,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: el => {
          const w = el.getAttribute('data-width')
          return w ? parseInt(w) : null
        },
        renderHTML: attrs => (attrs.width ? { 'data-width': String(attrs.width) } : {}),
      },
      align: {
        default: 'left',
        parseHTML: el => el.getAttribute('data-align') ?? 'left',
        renderHTML: attrs => ({ 'data-align': attrs.align ?? 'left' }),
      },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView)
  },
})

interface RichEditorProps {
  initialContent?: JSONContent | null
  onChange: (json: JSONContent) => void
  placeholder?: string
  minHeight?: string
}

export default function RichEditor({
  initialContent,
  onChange,
  placeholder = '내용을 입력하세요...',
  minHeight = '320px',
}: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)
  const [showBlockPicker, setShowBlockPicker] = useState(false)
  const [showFontPicker, setShowFontPicker] = useState(false)

  const uploadImage = useCallback(async (file: File, editor: Editor) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/upload/image', { method: 'POST', body: formData })
    const json = await res.json() as { url?: string; error?: string }
    if (json.url) {
      editor.chain().focus().setImage({ src: json.url }).run()
    } else {
      alert(json.error ?? '이미지 업로드에 실패했습니다.')
    }
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'underline text-blue-600' } }),
      CustomImage,
      TextStyle,
      FontSize,
      FontFamily,
      Color,
      Highlight.configure({ multicolor: true }),
      CalloutExtension,
      PullquoteExtension,
      SpeechBubbleExtension,
      MemoBoxExtension,
      BracketFrameExtension,
    ],
    content: initialContent ?? '',
    onUpdate: ({ editor }) => { onChange(editor.getJSON()) },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3',
        style: 'min-height: 100%',
      },
      handlePaste(_view: EditorView, event: ClipboardEvent) {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (file && editorRef.current) {
              uploadImage(file, editorRef.current).catch(console.error)
              return true
            }
          }
        }
        return false
      },
    },
    immediatelyRender: false,
  })

  useEffect(() => { editorRef.current = editor }, [editor])

  useEffect(() => {
    if (editor && initialContent && editor.isEmpty) {
      editor.commands.setContent(initialContent)
    }
  }, [editor, initialContent])

  if (!editor) return null

  function handleImageButtonClick() { fileInputRef.current?.click() }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    e.target.value = ''
    await uploadImage(file, editor)
  }

  const currentColor = editor.getAttributes('textStyle').color as string | undefined
  const currentHighlight = editor.getAttributes('highlight').color as string | undefined
  const closeAll = () => { setShowColorPicker(false); setShowHighlightPicker(false); setShowBlockPicker(false); setShowFontPicker(false) }

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white flex flex-col">
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 px-2 py-1.5 bg-gray-50">
        {/* 굵기·기울임·밑줄 */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="굵게">B</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="기울임"><em>I</em></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="밑줄"><span className="underline">U</span></ToolbarButton>
        <Divider />

        {/* 글자 크기 */}
        <select
          title="글자 크기"
          className="text-xs text-gray-600 bg-transparent border border-gray-200 rounded px-1 py-0.5 focus:outline-none cursor-pointer"
          value={editor.getAttributes('textStyle').fontSize ?? ''}
          onChange={e => {
            if (e.target.value) editor.chain().focus().setFontSize(e.target.value).run()
            else editor.chain().focus().unsetFontSize().run()
          }}
        >
          <option value="">크기</option>
          {FONT_SIZES.map(s => <option key={s} value={s}>{s.replace('px', '')}</option>)}
        </select>

        {/* 글씨체 */}
        <div className="relative">
          <button
            type="button"
            title="글씨체"
            onMouseDown={e => { e.preventDefault(); setShowFontPicker(v => !v); setShowColorPicker(false); setShowHighlightPicker(false); setShowBlockPicker(false) }}
            className="flex items-center gap-1 text-xs text-gray-600 bg-transparent border border-gray-200 rounded px-1.5 py-0.5 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <span style={{ fontFamily: editor.getAttributes('textStyle').fontFamily || undefined }}>
              {FONT_FAMILIES.find(f => f.value === (editor.getAttributes('textStyle').fontFamily ?? ''))?.label ?? '글씨체'}
            </span>
            <span className="text-gray-400">▾</span>
          </button>
          {showFontPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-36">
              {FONT_FAMILIES.map(f => (
                <button
                  key={f.label}
                  type="button"
                  onMouseDown={e => {
                    e.preventDefault()
                    if (f.value) editor.chain().focus().setFontFamily(f.value).run()
                    else editor.chain().focus().unsetFontFamily().run()
                    setShowFontPicker(false)
                  }}
                  className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 transition-colors ${(editor.getAttributes('textStyle').fontFamily ?? '') === f.value ? 'bg-gray-100' : ''}`}
                  style={{ fontFamily: f.value || undefined }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <Divider />

        {/* 글자색 */}
        <div className="relative">
          <button
            type="button"
            title="글자색"
            onMouseDown={e => { e.preventDefault(); setShowColorPicker(v => !v); setShowHighlightPicker(false); setShowBlockPicker(false) }}
            className="flex flex-col items-center px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors"
          >
            <span className="text-xs font-mono font-bold text-gray-700 leading-none">A</span>
            <span className="w-4 h-1 rounded-sm mt-0.5" style={{ backgroundColor: currentColor ?? '#000000' }} />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-44">
              <div className="grid grid-cols-5 gap-2 mb-2">
                {TEXT_COLORS.map(color => (
                  <button key={color} type="button" title={color}
                    onMouseDown={e => { e.preventDefault(); editor.chain().focus().setColor(color).run(); setShowColorPicker(false) }}
                    className="w-6 h-6 rounded border-2 border-transparent hover:border-gray-500 transition-colors"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button type="button"
                onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetColor().run(); setShowColorPicker(false) }}
                className="w-full text-xs text-gray-500 hover:text-black py-1"
              >기본색</button>
            </div>
          )}
        </div>

        {/* 음영색 */}
        <div className="relative">
          <button
            type="button"
            title="음영색"
            onMouseDown={e => { e.preventDefault(); setShowHighlightPicker(v => !v); setShowColorPicker(false); setShowBlockPicker(false) }}
            className="flex flex-col items-center px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors"
          >
            <span className="text-xs font-mono font-bold text-gray-700 leading-none">A</span>
            <span className="w-4 h-1 rounded-sm mt-0.5 border border-gray-200" style={{ backgroundColor: currentHighlight ?? '#FEF08A' }} />
          </button>
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-36">
              <div className="grid grid-cols-4 gap-2 mb-2">
                {HIGHLIGHT_COLORS.map(color => (
                  <button key={color} type="button" title={color}
                    onMouseDown={e => { e.preventDefault(); editor.chain().focus().setHighlight({ color }).run(); setShowHighlightPicker(false) }}
                    className="w-6 h-6 rounded border-2 border-transparent hover:border-gray-500 transition-colors"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button type="button"
                onMouseDown={e => { e.preventDefault(); editor.chain().focus().unsetHighlight().run(); setShowHighlightPicker(false) }}
                className="w-full text-xs text-gray-500 hover:text-black py-1"
              >제거</button>
            </div>
          )}
        </div>
        <Divider />

        {/* 제목 */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="제목2">H2</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="제목3">H3</ToolbarButton>
        <Divider />

        {/* 목록 */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="불릿 목록">•≡</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 목록">1≡</ToolbarButton>
        <Divider />

        {/* 인용 */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="인용">❝</ToolbarButton>

        {/* 특수 블록 (콜아웃 / 풀쿼트) */}
        <div className="relative">
          <button
            type="button"
            title="특수 블록"
            onMouseDown={e => { e.preventDefault(); setShowBlockPicker(v => !v); setShowColorPicker(false); setShowHighlightPicker(false) }}
            className={`px-2 py-1 rounded text-sm font-mono transition-colors ${
              editor.isActive('callout') || editor.isActive('pullquote') || editor.isActive('speechBubble') || editor.isActive('memoBox') || editor.isActive('bracketFrame')
                ? 'bg-black text-white'
                : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            ¶
          </button>
          {showBlockPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-40">
              {[
                { label: '💡 콜아웃 (정보)', type: 'info' },
                { label: '⚠️ 콜아웃 (주의)', type: 'warning' },
                { label: '✅ 콜아웃 (팁)', type: 'tip' },
              ].map(({ label, type }) => (
                <button key={type} type="button"
                  onMouseDown={e => {
                    e.preventDefault()
                    editor.chain().focus().insertContent({
                      type: 'callout',
                      attrs: { calloutType: type },
                      content: [{ type: 'paragraph' }],
                    }).run()
                    closeAll()
                  }}
                  className="w-full text-left text-xs px-3 py-1.5 hover:bg-gray-100"
                >{label}</button>
              ))}
              <hr className="my-1 border-gray-100" />
              <button type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  editor.chain().focus().insertContent({ type: 'pullquote' }).run()
                  closeAll()
                }}
                className="w-full text-left text-xs px-3 py-1.5 hover:bg-gray-100"
              >❝ 풀쿼트</button>
              <hr className="my-1 border-gray-100" />
              {([
                { label: '💬 말풍선', type: 'speechBubble' },
                { label: '📝 메모박스', type: 'memoBox' },
                { label: '🔲 브라켓 프레임', type: 'bracketFrame' },
              ] as const).map(({ label, type }) => (
                <button key={type} type="button"
                  onMouseDown={e => {
                    e.preventDefault()
                    editor.chain().focus().insertContent({
                      type,
                      content: [{ type: 'paragraph' }],
                    }).run()
                    closeAll()
                  }}
                  className="w-full text-left text-xs px-3 py-1.5 hover:bg-gray-100"
                >{label}</button>
              ))}
            </div>
          )}
        </div>

        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="구분선">—</ToolbarButton>
        <Divider />

        {/* 정렬 */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="왼쪽 정렬">≡←</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="가운데 정렬">≡</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="오른쪽 정렬">→≡</ToolbarButton>
        <Divider />

        {/* 링크·이미지 */}
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('링크 URL을 입력하세요:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
          active={editor.isActive('link')} title="링크"
        >🔗</ToolbarButton>
        <ToolbarButton onClick={handleImageButtonClick} active={false} title="이미지 삽입">🖼</ToolbarButton>
        <Divider />

        {/* 되돌리기 */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} active={false} title="되돌리기">↩</ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} active={false} title="다시실행">↪</ToolbarButton>

        {/* 이미지 정렬 버튼 */}
        <Divider />
        <ToolbarButton
          onClick={() => editor.chain().focus().updateAttributes('image', { align: 'left' }).run()}
          active={editor.isActive('image') && (!editor.getAttributes('image').align || editor.getAttributes('image').align === 'left')}
          title="이미지 왼쪽"
        >🖼←</ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().updateAttributes('image', { align: 'center' }).run()}
          active={editor.isActive('image') && editor.getAttributes('image').align === 'center'}
          title="이미지 가운데"
        >🖼↔</ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().updateAttributes('image', { align: 'right' }).run()}
          active={editor.isActive('image') && editor.getAttributes('image').align === 'right'}
          title="이미지 오른쪽"
        >🖼→</ToolbarButton>
      </div>

      <div className="overflow-y-auto" style={{ height: minHeight }}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function ToolbarButton({
  children, onClick, active, title,
}: {
  children: React.ReactNode
  onClick: () => void
  active: boolean
  title: string
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick() }}
      title={title}
      className={`px-2 py-1 rounded text-sm font-mono transition-colors ${
        active ? 'bg-black text-white' : 'text-gray-600 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  )
}

function Divider() {
    return <div className="w-px h-4 bg-gray-200 mx-1" />

}
