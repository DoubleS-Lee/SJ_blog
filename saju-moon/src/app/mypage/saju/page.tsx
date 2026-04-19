import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SajuForm from './SajuForm'
import type { Gender } from '@/types/saju'

export const metadata = { title: '내 만세력 입력' }

export default async function SajuInputPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: existing } = await supabase
    .from('user_saju')
    .select(
      'saju_name, birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, is_lunar',
    )
    .eq('user_id', user.id)
    .maybeSingle()

  const defaultValues = existing
    ? {
        saju_name: existing.saju_name ?? '',
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
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <div className="mb-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          {existing ? '내 만세력 수정' : '내 만세력 입력'}
        </h1>
        <p className="text-sm leading-relaxed text-gray-500">
          이름은 닉네임과 별개로 저장됩니다.
          <br />
          출생 정보를 입력하면 사주 원국과 만세력 해석을 자동으로 계산합니다.
        </p>
      </div>

      <SajuForm defaultValues={defaultValues} />
    </div>
  )
}
