import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

interface GuestCTAProps {
  variant?: 'default' | 'inline'
  mode?: 'login' | 'saju'
}

const CTA_COPY = {
  login: {
    eyebrow: '회원 전용 맞춤 판정',
    title: '이 글이 내 사주에 해당되는지 확인해 보세요',
    description: '로그인 후 생년월일 1회 입력이면 충분합니다.',
    buttonLabel: '로그인',
    href: '/login',
  },
  saju: {
    eyebrow: '내 사주 맞춤 확인',
    title: '이 글이 내 사주에 맞는지 바로 확인해 보세요',
    description: '생년월일시 한 번 입력하면 됩니다.',
    buttonLabel: '내 만세력 입력하기',
    href: '/mypage/saju',
  },
} as const

export default function GuestCTA({
  variant = 'default',
  mode = 'login',
}: GuestCTAProps) {
  const copy = CTA_COPY[mode]

  if (variant === 'inline') {
    return (
      <div className="rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-white to-orange-50 px-5 py-4 shadow-[0_18px_50px_-28px_rgba(180,83,9,0.32)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-700">
              {copy.eyebrow}
            </p>
            <h3 className="text-base font-bold leading-snug text-zinc-900">
              {copy.title}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-zinc-600">
              {copy.description}
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 md:items-end">
            <Link
              href={copy.href}
              scroll={false}
              className={buttonVariants({
                className: 'h-10 rounded-2xl bg-zinc-900 px-5 text-white hover:bg-zinc-800',
              })}
            >
              {copy.buttonLabel}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-[28px] border border-amber-200/70 bg-[radial-gradient(circle_at_top_right,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(135deg,_rgba(255,251,235,0.98),_rgba(255,255,255,1)_42%,_rgba(255,247,237,0.96))] p-6 shadow-[0_24px_70px_-34px_rgba(180,83,9,0.38)]">
      <div className="flex flex-col gap-4">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700">
            {copy.eyebrow}
          </p>
          <h3 className="text-[1.95rem] font-bold leading-tight tracking-tight text-zinc-950">
            {copy.title}
          </h3>
        </div>

        <p className="max-w-xl text-[15px] leading-7 text-zinc-600">
          {copy.description}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={copy.href}
            scroll={false}
            className={buttonVariants({
              className: 'h-11 rounded-2xl bg-zinc-900 px-6 text-white hover:bg-zinc-800 sm:w-auto',
            })}
          >
            {copy.buttonLabel}
          </Link>
        </div>
      </div>
    </div>
  )
}
