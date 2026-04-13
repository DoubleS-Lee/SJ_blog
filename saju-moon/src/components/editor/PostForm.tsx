'use client'

import { useState, useTransition } from 'react'
import { savePost, deletePost, type PostFormData } from '@/actions/savePost'
import { buttonVariants } from '@/components/ui/button'
import RichEditor from './RichEditor'
import JudgmentEditor from './JudgmentEditor'
import type { JSONContent } from '@tiptap/react'
import type { JudgmentRules } from '@/types/judgment'

// Next.js Server Action의 깊은 객체 직렬화 버그 우회: JSON 문자열로 변환
function toJsonString(val: unknown): string {
  return JSON.stringify(val)
}

const CATEGORIES = ['연애·궁합', '커리어·이직', '재물·투자', '건강·체질', '육아·자녀교육', '기타'] as const

interface Props {
  initialData?: {
    id: string
    title: string
    summary: string | null
    thumbnail_url: string | null
    category: PostFormData['category']
    content: JSONContent
    judgment_rules: JudgmentRules | null
    judgment_detail: JSONContent | null
    target_year: number | null
    is_featured: boolean
    is_published: boolean
    published_at: string | null
  }
}

// datetime-local 형식 (YYYY-MM-DDTHH:mm) → ISO string
function localToISO(local: string): string {
  return new Date(local).toISOString()
}

// ISO string → datetime-local 형식
function isoToLocal(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function PostForm({ initialData }: Props) {
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [summary, setSummary] = useState(initialData?.summary ?? '')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(initialData?.thumbnail_url ?? null)
  const [isUploading, setIsUploading] = useState(false)
  const [category, setCategory] = useState<PostFormData['category']>(initialData?.category ?? '커리어·이직')
  const [content, setContent] = useState<JSONContent>(initialData?.content ?? { type: 'doc', content: [] })
  const [judgmentRules, setJudgmentRules] = useState<JudgmentRules | null>(initialData?.judgment_rules ?? null)
  const [showJudgmentRules, setShowJudgmentRules] = useState(!!initialData?.judgment_rules)
  const [judgmentDetail, setJudgmentDetail] = useState<JSONContent | null>(initialData?.judgment_detail ?? null)
  const [showJudgmentDetail, setShowJudgmentDetail] = useState(!!initialData?.judgment_detail)
  const [targetYear, setTargetYear] = useState(String(initialData?.target_year ?? ''))
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false)
  const [isPublished] = useState(initialData?.is_published ?? false)

  // 예약 발행: published_at이 미래인 초안은 예약 상태
  const initScheduled = (() => {
    if (!initialData?.published_at) return ''
    const pub = new Date(initialData.published_at)
    return pub > new Date() ? isoToLocal(initialData.published_at) : ''
  })()
  const [scheduledAt, setScheduledAt] = useState(initScheduled)
  const [showSchedule, setShowSchedule] = useState(!!initScheduled)

  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, startDeleteTransition] = useTransition()

  async function handleThumbnailUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setIsUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/upload/image', { method: 'POST', body: fd })
    const json = await res.json()
    setIsUploading(false)
    if (json.url) setThumbnailUrl(json.url)
    else alert('썸네일 업로드 실패: ' + (json.error ?? '알 수 없는 오류'))
    e.target.value = ''
  }

  function buildPayload(publish: boolean, overridePublishedAt?: string | null): PostFormData {
    return {
      id: initialData?.id,
      title,
      summary,
      thumbnail_url: thumbnailUrl,
      category,
      content: toJsonString(content),
      judgment_rules: showJudgmentRules ? (judgmentRules ?? { groups: [] }) : null,
      judgment_detail: showJudgmentDetail ? toJsonString(judgmentDetail ?? { type: 'doc', content: [] }) : null,
      target_year: targetYear ? parseInt(targetYear) : null,
      is_featured: isFeatured,
      is_published: publish,
      published_at: overridePublishedAt !== undefined
        ? overridePublishedAt
        : (initialData?.published_at ?? null),
    }
  }

  function handleDraft() {
    setError(null)
    startTransition(async () => {
      const result = await savePost(buildPayload(false, null))
      if (result?.error) setError(result.error)
    })
  }

  function handlePublish() {
    setError(null)
    startTransition(async () => {
      // published_at = null → server uses now
      const result = await savePost(buildPayload(true, null))
      if (result?.error) setError(result.error)
    })
  }

  function handleSchedule() {
    if (!scheduledAt) { setError('예약 날짜/시간을 선택하세요.'); return }
    const iso = localToISO(scheduledAt)
    if (new Date(iso) <= new Date()) { setError('예약 시간은 현재보다 미래여야 합니다.'); return }
    setError(null)
    startTransition(async () => {
      const result = await savePost(buildPayload(true, iso))
      if (result?.error) setError(result.error)
    })
  }

  function handleDelete() {
    if (!initialData?.id) return
    if (!confirm('이 글을 삭제하시겠습니까? 되돌릴 수 없습니다.')) return
    startDeleteTransition(async () => {
      const result = await deletePost(initialData.id)
      if (result?.error) setError(result.error)
    })
  }

  const inputCls = 'w-full border border-gray-200 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-black bg-white'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <div className="flex flex-col gap-6">
      {/* 제목 */}
      <div>
        <label className={labelCls}>제목 *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="글 제목"
          className={inputCls}
          required
        />
      </div>

      {/* 요약 */}
      <div>
        <label className={labelCls}>요약</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="블로그 목록에 표시될 요약 (선택)"
          rows={2}
          className={`${inputCls} resize-none`}
        />
      </div>

      {/* 썸네일 */}
      <div>
        <label className={labelCls}>썸네일</label>
        {thumbnailUrl && (
          <div className="relative mb-2 w-48 aspect-video bg-zinc-900 overflow-hidden rounded">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumbnailUrl} alt="썸네일 미리보기" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => setThumbnailUrl(null)}
              className="absolute top-1 right-1 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded hover:bg-black"
            >
              삭제
            </button>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleThumbnailUpload}
          disabled={isUploading}
          className="text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:text-sm file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 disabled:opacity-50"
        />
        {isUploading && <p className="text-xs text-gray-400 mt-1">업로드 중...</p>}
      </div>

      {/* 카테고리 + 연도 */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>카테고리 *</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PostFormData['category'])}
            className={inputCls}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>기준 연도</label>
          <input
            type="number"
            value={targetYear}
            onChange={(e) => setTargetYear(e.target.value)}
            placeholder="예) 2026"
            className={inputCls}
          />
        </div>
      </div>

      {/* 본문 에디터 */}
      <div>
        <label className={labelCls}>본문 *</label>
        <RichEditor
          initialContent={initialData?.content}
          onChange={setContent}
          placeholder="본문을 작성하세요..."
          minHeight="400px"
        />
      </div>

      {/* 판정 조건 */}
      <div>
        <div className="flex items-center gap-3 mb-3">
          <label className={labelCls + ' mb-0'}>판정 조건</label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showJudgmentRules}
              onChange={(e) => setShowJudgmentRules(e.target.checked)}
              className="accent-black"
            />
            <span className="text-xs text-gray-500">사용</span>
          </label>
        </div>
        {showJudgmentRules && (
          <JudgmentEditor value={judgmentRules} onChange={setJudgmentRules} />
        )}
      </div>

      {/* 판정 상세 설명 */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <label className={labelCls + ' mb-0'}>판정 상세 설명</label>
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={showJudgmentDetail}
              onChange={(e) => setShowJudgmentDetail(e.target.checked)}
              className="accent-black"
            />
            <span className="text-xs text-gray-500">사용</span>
          </label>
        </div>
        {showJudgmentDetail && (
          <RichEditor
            initialContent={initialData?.judgment_detail ?? undefined}
            onChange={setJudgmentDetail}
            placeholder="판정 결과 해설을 작성하세요..."
            minHeight="200px"
          />
        )}
      </div>

      {/* 옵션 */}
      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="accent-black"
          />
          <span className="text-sm">피처드 글</span>
        </label>
      </div>

      {/* 예약 발행 */}
      <div className="border border-gray-100 rounded-md p-4 bg-gray-50">
        <label className="flex items-center gap-2 cursor-pointer mb-3">
          <input
            type="checkbox"
            checked={showSchedule}
            onChange={(e) => setShowSchedule(e.target.checked)}
            className="accent-black"
          />
          <span className="text-sm font-medium">예약 발행</span>
        </label>
        {showSchedule && (
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className={inputCls}
          />
        )}
      </div>

      {/* 에러 */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div>
          {initialData?.id && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-sm text-red-400 hover:text-red-600 transition-colors disabled:opacity-50"
            >
              {isDeleting ? '삭제 중...' : '글 삭제'}
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDraft}
            disabled={isPending}
            className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'disabled:opacity-50' })}
          >
            초안 저장
          </button>
          {showSchedule ? (
            <button
              type="button"
              onClick={handleSchedule}
              disabled={isPending}
              className={buttonVariants({ size: 'sm', className: 'disabled:opacity-50 bg-blue-600 hover:bg-blue-700' })}
            >
              {isPending ? '저장 중...' : '예약 발행'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isPending}
              className={buttonVariants({ size: 'sm', className: 'disabled:opacity-50' })}
            >
              {isPending ? '저장 중...' : isPublished ? '수정 발행' : '발행'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
