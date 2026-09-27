import { createClient } from '@/lib/supabase/server'
import MenuHero from '@/components/layout/MenuHero'

export const metadata = {
  title: '익명 고민 상담',
  description: '익명으로 고민을 남기고 관리자와 비공개 상담을 진행할 수 있습니다.',
  alternates: { canonical: '/counsel' },
}

const HERO_PALETTE = {
  borderClass: 'border-violet-100',
  gradientClass:
    'bg-[radial-gradient(circle_at_top_left,_rgba(167,139,250,0.2),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(196,181,253,0.24),_transparent_24%),linear-gradient(135deg,_#faf7ff_0%,_#ffffff_58%,_#f5f3ff_100%)]',
  eyebrowClass: 'text-violet-500',
}

export default async function CounselPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <MenuHero
        eyebrow="1:1 Private Counsel"
        title="1:1 프라이빗 사주 상담"
        description={`운영자 로아가 사주 정보와 남겨주신 고민을 바탕으로 텍스트 상담을 진행합니다.
상담 내용과 답변은 작성자 본인과 관리자만 확인할 수 있습니다.
다른 이용자에게 공개하지 않고 현재 상황과 질문을 정리해 이야기할 수 있는 공간입니다.`}
        palette={HERO_PALETTE}
        titleActions={
          user
            ? [
                {
                  href: '/counsel/new',
                  label: '1:1 맞춤 상담 신청하기',
                  size: 'lg',
                  className: 'h-12 rounded-full px-6 text-base font-semibold',
                },
              ]
            : undefined
        }
        actions={
          user
            ? [{ href: '/mypage/counsel', label: '내 상담글 보기' }]
            : [{ href: '/login?next=/counsel/new', label: '로그인하고 상담 신청하기' }]
        }
      >
        <div
          className="mt-6 rounded-xl border p-5 text-sm leading-7"
          style={{ borderColor: 'rgba(30,45,77,0.09)', background: 'rgba(30,45,77,0.03)', color: '#4a5673' }}
        >
          <p>1. 정확한 사주 분석을 위해 <strong style={{ color: '#1E2D4D' }}>생년월일시(양력/음력 필수)</strong>를 반드시 기입해 주세요.</p>
          <p>2. 고민이 있으신 현재 상황과 구체적인 질문을 자세히 적어주실수록 더욱 명확하고 깊이 있는 상담이 가능합니다.</p>
          <p>3. 본 상담은 유료입니다. 신청 후 안내받는 상담 범위와 금액을 확인하고 결제를 진행해 주세요. 답변은 로그인 후 내 상담글에서 확인할 수 있습니다.</p>
        </div>
      </MenuHero>
      <div className="mx-auto mt-10 max-w-3xl space-y-8 text-sm leading-8 text-gray-700">
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">어떤 내용을 상담하나요?</h2>
          <p>관계에서 반복되는 고민, 진로와 일에 대한 선택, 일상에서 돌아보고 싶은 성향 등을 질문할 수 있습니다. 현재 상황과 궁금한 점을 구체적으로 적어주시면 명리학적 해석을 바탕으로 함께 살펴봅니다.</p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">신청부터 답변 확인까지</h2>
          <ol className="list-decimal space-y-2 pl-5">
            <li>로그인 후 생년월일시와 양력·음력 구분, 연락처, 상담 질문을 작성합니다. 출생 시간을 모르면 모른다고 적어주세요.</li>
            <li>운영자의 개별 결제 안내를 확인합니다. 비용이나 진행 방법이 궁금하면 결제 전에 문의해 주세요.</li>
            <li>결제 완료 후 순차적으로 상담 답변이 등록됩니다. 진행 상황과 답변은 <a href="/mypage/counsel" className="underline">내 상담글</a>에서 확인합니다.</li>
          </ol>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">익명 상담은 어떻게 보호되나요?</h2>
          <p>여기서 익명은 다른 이용자에게 상담 내용이 공개되지 않는다는 의미입니다. 상담을 처리하는 운영자는 작성한 사연과 연락처를 확인합니다. 주민등록번호나 계정 비밀번호처럼 상담에 필요하지 않은 정보는 적지 마세요.</p>
        </section>
        <section>
          <h2 className="mb-3 text-xl font-semibold text-gray-900">상담의 범위와 문의</h2>
          <p>사주 해석은 미래의 결과를 보장하거나 의료 진단·투자 판단·법률 자문을 대신하지 않습니다. 건강과 재산 등 중요한 결정에는 해당 분야 전문가의 확인이 필요합니다.</p>
          <p className="mt-3">신청 변경·취소나 사이트 이용 문의는 <a href="/contact" className="underline">문의하기</a>를 이용해 주세요. 개인정보 처리 방법은 <a href="/privacy" className="underline">개인정보처리방침</a>에서 확인할 수 있습니다.</p>
        </section>
      </div>
    </div>
  )
}
