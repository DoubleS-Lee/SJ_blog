import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ConsultationForm from '@/components/counsel/ConsultationForm'

export const metadata = { title: '익명 상담 등록' }

export default async function NewConsultationPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">익명 상담 등록</h1>
        <p className="mt-2 text-sm leading-7 text-gray-500">
          작성한 사연은 비공개로 접수되며, 본인과 관리자만 열람할 수 있습니다.
          상담 답변은 댓글 형태로 이어집니다.
        </p>
      </div>

      <ConsultationForm />
    </div>
  )
}
