const STAR_CLIP = 'polygon(50% 0,58% 42%,100% 50%,58% 58%,50% 100%,42% 58%,0 50%,42% 42%)'

interface StarMarkProps {
  size?: number
  color?: string
  className?: string
}

/** 4방향 별 모양 (clip-path polygon). 기본 골드 포인트. */
export function StarMark({ size = 16, color = '#C4A24E', className }: StarMarkProps) {
  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ width: size, height: size, background: color, clipPath: STAR_CLIP, flexShrink: 0 }}
    />
  )
}

interface LogoMarkProps {
  size?: number
  className?: string
}

/** 원 안에 별 — 로고 마크. currentColor를 상속하므로 부모 text-{color}로 색 지정. */
export function LogoMark({ size = 30, className }: LogoMarkProps) {
  const innerSize = Math.round(size * 0.5)
  return (
    <div
      aria-hidden="true"
      className={`relative flex-shrink-0 ${className ?? ''}`}
      style={{ width: size, height: size }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{ border: `${size > 20 ? 1.5 : 1.4}px solid currentColor` }}
      />
      <div
        className="absolute"
        style={{
          left: '50%', top: '50%',
          width: innerSize, height: innerSize,
          transform: 'translate(-50%,-50%)',
          background: 'currentColor',
          clipPath: STAR_CLIP,
        }}
      />
    </div>
  )
}
