import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SajuForm from './SajuForm'
import type { Gender } from '@/types/saju'

export const metadata = { title: '사주 정보 입력' }

export default async function SajuInputPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // 기존 사주 데이터 조회
  const { data: existing } = await supabase
    .from('user_saju')
    .select('birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, is_lunar')
    .eq('user_id', user.id)
    .maybeSingle()

  const defaultValues = existing
    ? {
        birth_year: existing.birth_year as number,
        birth_month: existing.birth_month as number,
        birth_day: existing.birth_day as number,
        birth_hour: existing.birth_hour as number | null,
        birth_minute: existing.birth_minute as number | null,
        gender: existing.gender as Gender,
        is_lunar: existing.is_lunar as boolean,
      }
    : undefined

  return (
    <div className="max-w-lg mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-2">
          {existing ? '사주 정보 수정' : '사주 정보 입력'}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          생년월일시를 입력하면 사주를 자동으로 계산합니다.
          <br />
          이 정보는 글 판정에 사용되며 언제든 수정할 수 있습니다.
        </p>
      </div>

      <SajuForm defaultValues={defaultValues} />
    </div>
  )
}
