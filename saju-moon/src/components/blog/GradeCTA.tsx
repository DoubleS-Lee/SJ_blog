interface Props {
  /** 현재 판정 글이 있음을 명시 (복수 메시지 분기용) */
  hasJudgment?: boolean
}

export default function GradeCTA({ hasJudgment = true }: Props) {
  if (!hasJudgment) return null

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <p className="text-sm font-medium text-gray-700 mb-2">판정 기능 이용 안내</p>
      <p className="text-sm text-gray-400 mb-4 leading-relaxed">
        이 글에는 내 사주 해당 여부를 자동으로 확인하는 판정 기능이 포함되어 있습니다.
        판정 기능은 <span className="font-medium text-gray-600">플러스(plus) 이상</span> 회원에게 제공됩니다.
      </p>
      <p className="text-xs text-gray-400">
        등급 업그레이드 문의는 인스타그램{' '}
        <span className="font-medium">@saju_moonfairy</span> 로 연락해 주세요.
      </p>
    </div>
  )
}
