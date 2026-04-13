'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import { TextStyle, FontSize } from '@tiptap/extension-text-style'
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

interface RichEditorProps {
  initialContent?: JSONContent | null
  onChange: (json: JSONContent) => void
  placeholder?: string
  minHeight?: string
}

export default function RichEditor({ initialContent, onChange, placeholder = '내용을 입력하세요...', minHeight = '320px' }: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<Editor | null>(null)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showHighlightPicker, setShowHighlightPicker] = useState(false)

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
      StarterKit.configure({
        link: false,
        underline: false,
      }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'underline text-blue-600' } }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full rounded' } }),
      TextStyle,
      FontSize,
      Color,
      Highlight.configure({ multicolor: true }),
    ],
    content: initialContent ?? '',
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3',
        style: `min-height: ${minHeight}`,
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

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useEffect(() => {
    if (editor && initialContent && editor.isEmpty) {
      editor.commands.setContent(initialContent)
    }
  }, [editor, initialContent])

  if (!editor) return null

  function handleImageButtonClick() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editor) return
    e.target.value = ''
    await uploadImage(file, editor)
  }

  // 현재 선택된 글자색
  const currentColor = editor.getAttributes('textStyle').color as string | undefined
  // 현재 선택된 음영색
  const currentHighlight = editor.getAttributes('highlight').color as string | undefined

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-100 px-2 py-1.5 bg-gray-50">
        {/* 굵기·기울임·밑줄 */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="굵게">
          B
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="기울임">
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="밑줄">
          <span className="underline">U</span>
        </ToolbarButton>
        <Divider />

        {/* 글자 크기 */}
        <select
          title="글자 크기"
          className="text-xs text-gray-600 bg-transparent border border-gray-200 rounded px-1 py-0.5 focus:outline-none cursor-pointer"
          value={editor.getAttributes('textStyle').fontSize ?? ''}
          onChange={e => {
            if (e.target.value) {
              editor.chain().focus().setFontSize(e.target.value).run()
            } else {
              editor.chain().focus().unsetFontSize().run()
            }
          }}
        >
          <option value="">크기</option>
          {FONT_SIZES.map(s => (
            <option key={s} value={s}>{s.replace('px', '')}</option>
          ))}
        </select>
        <Divider />

        {/* 글자색 */}
        <div className="relative">
          <button
            type="button"
            title="글자색"
            onMouseDown={e => { e.preventDefault(); setShowColorPicker(v => !v); setShowHighlightPicker(false) }}
            className="flex flex-col items-center px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors"
          >
            <span className="text-xs font-mono font-bold text-gray-700 leading-none">A</span>
            <span
              className="w-4 h-1 rounded-sm mt-0.5"
              style={{ backgroundColor: currentColor ?? '#000000' }}
            />
          </button>
          {showColorPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
              <div className="grid grid-cols-5 gap-1 mb-1">
                {TEXT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onMouseDown={e => {
                      e.preventDefault()
                      editor.chain().focus().setColor(color).run()
                      setShowColorPicker(false)
                    }}
                    className="w-5 h-5 rounded border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  editor.chain().focus().unsetColor().run()
                  setShowColorPicker(false)
                }}
                className="w-full text-xs text-gray-500 hover:text-black py-0.5"
              >
                기본색
              </button>
            </div>
          )}
        </div>

        {/* 음영색 (하이라이트) */}
        <div className="relative">
          <button
            type="button"
            title="음영색"
            onMouseDown={e => { e.preventDefault(); setShowHighlightPicker(v => !v); setShowColorPicker(false) }}
            className="flex flex-col items-center px-1.5 py-0.5 rounded hover:bg-gray-200 transition-colors"
          >
            <span className="text-xs font-mono font-bold text-gray-700 leading-none">A</span>
            <span
              className="w-4 h-1 rounded-sm mt-0.5 border border-gray-200"
              style={{ backgroundColor: currentHighlight ?? '#FEF08A' }}
            />
          </button>
          {showHighlightPicker && (
            <div className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
              <div className="grid grid-cols-4 gap-1 mb-1">
                {HIGHLIGHT_COLORS.map(color => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onMouseDown={e => {
                      e.preventDefault()
                      editor.chain().focus().setHighlight({ color }).run()
                      setShowHighlightPicker(false)
                    }}
                    className="w-5 h-5 rounded border border-gray-200 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  editor.chain().focus().unsetHighlight().run()
                  setShowHighlightPicker(false)
                }}
                className="w-full text-xs text-gray-500 hover:text-black py-0.5"
              >
                제거
              </button>
            </div>
          )}
        </div>
        <Divider />

        {/* 제목 */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="제목2">
          H2
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="제목3">
          H3
        </ToolbarButton>
        <Divider />

        {/* 목록 */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="불릿 목록">
          •≡
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="번호 목록">
          1≡
        </ToolbarButton>
        <Divider />

        {/* 인용·구분선 */}
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="인용">
          ❝
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} active={false} title="구분선">
          —
        </ToolbarButton>
        <Divider />

        {/* 정렬 */}
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="왼쪽 정렬">
          ≡←
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="가운데 정렬">
          ≡
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="오른쪽 정렬">
          →≡
        </ToolbarButton>
        <Divider />

        {/* 링크·이미지 */}
        <ToolbarButton
          onClick={() => {
            const url = window.prompt('링크 URL을 입력하세요:')
            if (url) editor.chain().focus().setLink({ href: url }).run()
          }}
          active={editor.isActive('link')}
          title="링크"
        >
          🔗
        </ToolbarButton>
        <ToolbarButton onClick={handleImageButtonClick} active={false} title="이미지 삽입">
          🖼
        </ToolbarButton>
        <Divider />

        {/* 되돌리기 */}
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} active={false} title="되돌리기">
          ↩
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} active={false} title="다시실행">
          ↪
        </ToolbarButton>
      </div>

      <EditorContent editor={editor} />
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
