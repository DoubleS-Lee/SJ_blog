import { StarMark } from './StarMark'

interface StarDividerProps {
  lineWidth?: number
  starSize?: number
  className?: string
}

/** ── ★ ── 구분선. 섹션 구분 및 푸터 상단에 사용. */
export function StarDivider({ lineWidth = 70, starSize = 12, className }: StarDividerProps) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className ?? ''}`}>
      <div style={{ width: lineWidth, height: 1, background: '#D9C48A', flexShrink: 0 }} />
      <StarMark size={starSize} color="#C4A24E" />
      <div style={{ width: lineWidth, height: 1, background: '#D9C48A', flexShrink: 0 }} />
    </div>
  )
}
