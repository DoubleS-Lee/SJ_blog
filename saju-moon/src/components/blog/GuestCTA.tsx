import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'

export default function GuestCTA() {
  return (
    <div className="bg-zinc-950 text-white rounded-lg p-6 flex flex-col gap-4">
      <div>
        <p className="text-xs text-zinc-400 uppercase tracking-wider mb-2">회원 전용</p>
        <h3 className="text-lg font-bold leading-snug">
          이 글이 내 사주에<br />해당되는지 확인하세요
        </h3>
      </div>
      <p className="text-sm text-zinc-400 leading-relaxed">
        생년월일시를 입력하면 이 글의 내용이 나에게
        해당되는지 자동으로 판정해 드립니다.
      </p>
      <div className="flex flex-col gap-2">
        <Link
          href="/signup"
          className={buttonVariants({ className: 'w-full bg-white text-black hover:bg-zinc-100' })}
        >
          무료로 시작하기
        </Link>
        <Link
          href="/login"
          className={buttonVariants({ variant: 'ghost', className: 'w-full text-zinc-400 hover:text-white hover:bg-zinc-800' })}
        >
          로그인
        </Link>
      </div>
    </div>
  )
}
