/* eslint-disable @next/next/no-img-element */
import { cn } from '@/lib/utils'

const ILGAN_TO_CHINESE: Record<string, string> = {
  갑: '甲',
  을: '乙',
  병: '丙',
  정: '丁',
  무: '戊',
  기: '己',
  경: '庚',
  신: '辛',
  임: '壬',
  계: '癸',
}

const ILGAN_TO_ELEMENT: Record<string, 'wood' | 'fire' | 'earth' | 'metal' | 'water'> = {
  갑: 'wood',
  을: 'wood',
  병: 'fire',
  정: 'fire',
  무: 'earth',
  기: 'earth',
  경: 'metal',
  신: 'metal',
  임: 'water',
  계: 'water',
}

const ELEMENT_STYLES = {
  wood: {
    bg: 'bg-blue-500',
    text: 'text-white',
  },
  fire: {
    bg: 'bg-rose-500',
    text: 'text-white',
  },
  earth: {
    bg: 'bg-amber-400',
    text: 'text-white',
  },
  metal: {
    bg: 'bg-gray-200',
    text: 'text-gray-800',
  },
  water: {
    bg: 'bg-gray-800',
    text: 'text-white',
  },
  fallback: {
    bg: 'bg-gray-100',
    text: 'text-gray-500',
  },
} as const

interface IlganBadgeProps {
  ilgan?: string | null
  imageUrl?: string | null
  fallbackText?: string
  className?: string
  textClassName?: string
}

export default function IlganBadge({
  ilgan,
  imageUrl,
  fallbackText = '?',
  className,
  textClassName,
}: IlganBadgeProps) {
  const normalizedIlgan = ilgan?.trim() ?? ''
  const chinese = ILGAN_TO_CHINESE[normalizedIlgan]
  const element = ILGAN_TO_ELEMENT[normalizedIlgan]
  const palette = element ? ELEMENT_STYLES[element] : ELEMENT_STYLES.fallback
  const displayText = chinese ?? (fallbackText.trim().charAt(0) || '?')

  return (
    <div
      className={cn(
        'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl font-bold',
        palette.bg,
        className,
      )}
      aria-label={normalizedIlgan ? `${normalizedIlgan} 일간` : '기본 프로필 배지'}
      title={normalizedIlgan ? `${normalizedIlgan} 일간` : undefined}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={normalizedIlgan ? `${normalizedIlgan} 일간 아이콘` : '프로필 아이콘'}
          className="h-full w-full rounded-full object-cover"
        />
      ) : (
        <span
          className={cn(
            'leading-none',
            palette.text,
            textClassName,
          )}
        >
          {displayText}
        </span>
      )}
    </div>
  )
}
