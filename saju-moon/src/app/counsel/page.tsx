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
  const [
    {
      data: { user },
    },
    { count: consultationCount },
    { data: settings },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('consultations').select('*', { count: 'exact', head: true }),
    supabase.from('site_settings').select('counsel_social_proof_boost').eq('id', 1).maybeSingle(),
  ])

  const actualConsultationCount = consultationCount ?? 0
  const socialProofCount = actualConsultationCount + (settings?.counsel_social_proof_boost ?? 0)

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <MenuHero
        eyebrow="1:1 Private Counsel"
        title="1:1 프라이빗 사주 상담"
        description={`사주 전문가 로아가 당신만을 위한 깊이 있는 맞춤형 1:1 리딩을 제공합니다.
오직 상담 작성자 본인만 확인할 수 있는 철저한 비밀 상담 공간이며, 답변은 전문적인 텍스트(또는 댓글) 형태로 상세히 제공됩니다.
현실적인 문제로 답답했던 순간, 명쾌한 사주 분석으로 나아갈 길을 찾아보세요.`}
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
            : [{ href: '/login', label: '1:1 맞춤 상담 신청하기' }]
        }
      >
        <div className="mt-5 flex justify-end">
          <p
            className="rounded-full border px-4 py-2 text-xs"
            style={{ borderColor: 'rgba(196,162,78,0.3)', color: '#8a6d28', background: 'rgba(246,239,227,0.7)' }}
          >
            지금까지 수많은 분들이 <span className="font-semibold" style={{ color: '#B78D3C' }}>사주로아의 명쾌한 해답</span>을 경험하셨습니다.
          </p>
        </div>
        <div
          className="mt-6 rounded-xl border p-5 text-sm leading-7"
          style={{ borderColor: 'rgba(30,45,77,0.09)', background: 'rgba(30,45,77,0.03)', color: '#4a5673' }}
        >
          <p>1. 정확한 사주 분석을 위해 <strong style={{ color: '#1E2D4D' }}>생년월일시(양력/음력 필수)</strong>를 반드시 기입해 주세요.</p>
          <p>2. 고민이 있으신 현재 상황과 구체적인 질문을 자세히 적어주실수록 더욱 명확하고 깊이 있는 상담이 가능합니다.</p>
          <p>3. 본 상담은 유료로 진행되며, 결제 완료 후 순차적으로 답변이 등록됩니다. (답변 완료 시 알림 발송)</p>
        </div>
      </MenuHero>
    </div>
  )
}
