import { createClient } from '@/lib/supabase/server'
import MenuHero from '@/components/layout/MenuHero'

export const metadata = {
  title: '익명 고민 상담',
  description: '익명으로 고민을 남기고 관리자와 비공개 상담을 진행할 수 있습니다.',
}

const HERO_PALETTE = {
  borderClass: 'border-violet-100',
  gradientClass:
    'bg-[radial-gradient(circle_at_top_left,_rgba(167,139,250,0.2),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(196,181,253,0.24),_transparent_24%),linear-gradient(135deg,_#faf7ff_0%,_#ffffff_58%,_#f5f3ff_100%)]',
  eyebrowClass: 'text-violet-500',
}

export default async function CounselPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <MenuHero
        eyebrow="Private Counsel"
        title="익명 고민 상담"
        description={`이 공간은 공개 게시판이 아니라 비공개 상담함입니다.
작성한 사연은 작성자 본인과 관리자만 볼 수 있고, 상담은 댓글 형태로 이어집니다.
사연은 필수 동의에 따라 식별 정보를 제거한 뒤 외부 콘텐츠 소재로 활용될 수 있습니다.`}
        palette={HERO_PALETTE}
        titleActions={
          user
            ? [
                {
                  href: '/counsel/new',
                  label: '익명 상담 등록하기',
                  size: 'lg',
                  className:
                    'h-12 rounded-2xl border-violet-600 bg-violet-600 px-6 text-base font-semibold text-white shadow-lg shadow-violet-500/25 hover:bg-violet-500',
                },
              ]
            : undefined
        }
        actions={
          user
            ? [{ href: '/mypage/counsel', label: '내 상담글 보기' }]
            : [{ href: '/login', label: '로그인하고 상담 남기기' }]
        }
      >
        <div className="mt-6 rounded-2xl bg-gray-50 p-5 text-sm text-gray-500 leading-7">
          <p>1. 실명, 연락처, 학교명, 회사명, 주소 등 식별 가능한 정보는 적지 않는 것을 권장합니다.</p>
          <p>2. 필수 동의에 체크해야 상담 글을 등록할 수 있습니다.</p>
        </div>
      </MenuHero>
    </div>
  )
}
