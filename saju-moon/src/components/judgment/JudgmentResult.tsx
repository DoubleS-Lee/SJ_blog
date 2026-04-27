import Link from 'next/link'
import TiptapRenderer from '@/components/editor/TiptapRenderer'
import type { JSONContent } from '@tiptap/react'

interface Props {
  /** true=해당됨 / false=해당안됨 / null=사주 미입력 */
  result: boolean | null
  detail: JSONContent | null
  /** 상세 설명 표시 여부 (plus 등급은 false) — 기본 true */
  showDetail?: boolean
}

export default function JudgmentResult({ result, detail, showDetail = true }: Props) {
  if (result === null) {
    // 사주 미입력 상태
    return (
      <div className="border border-gray-100 rounded-lg p-6">
        <p className="text-sm font-medium text-gray-700 mb-2">이 글이 나에게 해당되나요?</p>
        <p className="text-sm text-gray-400 mb-4">
          사주 정보를 입력하면 이 글이 내 사주에 해당되는지 자동으로 확인할 수 있어요.
        </p>
        <Link
          href="/mypage/saju"
          scroll={false}
          className="inline-block text-sm font-medium bg-black text-white px-4 py-2 rounded hover:opacity-80 transition-opacity"
        >
          사주 입력하기
        </Link>
      </div>
    )
  }

  return (
    <div className={`border rounded-lg p-6 ${result ? 'border-black bg-black text-white' : 'border-gray-200 bg-gray-50'}`}>
      {/* 판정 결과 헤더 */}
      <p className={`text-xs font-medium uppercase tracking-wider mb-3 ${result ? 'text-gray-400' : 'text-gray-400'}`}>
        판정 결과
      </p>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">{result ? '✓' : '✗'}</span>
        <p className={`text-lg font-bold ${result ? 'text-white' : 'text-gray-700'}`}>
          {result ? '해당됩니다' : '해당 안됩니다'}
        </p>
      </div>

      {/* 판정 상세 설명 */}
      {showDetail && detail && (
        <div className={`pt-4 border-t text-sm ${result ? 'border-white/20' : 'border-gray-200'}`}>
          <div className={result ? '[&_.prose]:text-gray-200 [&_.prose_h2]:text-white [&_.prose_h3]:text-white' : ''}>
            <TiptapRenderer content={detail} />
          </div>
        </div>
      )}
      {!showDetail && (
        <p className={`text-xs mt-3 ${result ? 'text-gray-400' : 'text-gray-400'}`}>
          상세 설명은 프리미엄 회원에게 제공됩니다.
        </p>
      )}
    </div>
  )
}
