import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConsultationForm from '@/components/counsel/ConsultationForm'

export const metadata = { title: '1:1 맞춤 상담 신청' }

export default async function NewConsultationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <p
          className="mb-2 text-xs font-semibold uppercase tracking-[0.2em]"
          style={{ color: '#C4A24E', fontFamily: 'var(--font-cormorant-garamond), serif' }}
        >
          1:1 Private Counsel
        </p>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ color: '#1E2D4D', fontFamily: 'var(--font-nanum-myeongjo), serif' }}
        >
          1:1 맞춤 상담 신청
        </h1>
        <p className="mt-3 text-sm leading-7" style={{ color: '#4a5673' }}>
          정확한 분석을 위해 <strong style={{ color: '#1E2D4D' }}>생년월일시(양력/음력 필수)</strong>를 제목 또는 사연에 꼭 기재해 주세요.
          고민 상황을 구체적으로 적어 주실수록 더 깊이 있는 상담이 가능합니다.
          본 상담은 <strong style={{ color: '#1E2D4D' }}>유료</strong>로 진행되며, 접수 후 결제 안내가 순차적으로 진행됩니다.
        </p>
      </div>

      <ConsultationForm />
    </div>
  )
}
