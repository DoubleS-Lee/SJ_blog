import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { buttonVariants } from '@/components/ui/button'

interface Props {
  params: Promise<{
    kind: string
    id: string
  }>
}

export async function generateMetadata({ params }: Props) {
  const { kind } = await params
  return {
    title: kind === 'fortune' ? '기간별 궁합 문구 수정' : '궁합 총운 문구 수정',
  }
}

function isFortuneKind(kind: string) {
  return kind === 'fortune'
}

export default async function AdminCompatibilityCopyDetailPage({ params }: Props) {
  await requireAdmin()
  const { kind, id } = await params
  const fortuneKind = isFortuneKind(kind)
  const supabase = await createClient()

  if (!fortuneKind && kind !== 'total') {
    notFound()
  }

  async function updateCopy(formData: FormData) {
    'use server'

    await requireAdmin()

    const currentKind = String(formData.get('kind') ?? '')
    const currentId = String(formData.get('id') ?? '')
    const isActive = formData.get('is_active') === 'on'

    if (currentKind === 'fortune') {
      const payload = {
        summary: String(formData.get('summary') ?? ''),
        detail: String(formData.get('detail') ?? ''),
        is_active: isActive,
      }

      const { error } = await supabaseAdmin
        .from('compatibility_fortune_copy')
        .update(payload)
        .eq('id', currentId)

      if (error) {
        throw new Error(`compatibility_fortune_copy update failed: ${error.message}`)
      }
    } else {
      const payload = {
        title: String(formData.get('title') ?? ''),
        summary: String(formData.get('summary') ?? ''),
        detail: String(formData.get('detail') ?? ''),
        pattern: String(formData.get('pattern') ?? ''),
        detail_case: String(formData.get('detail_case') ?? ''),
        male_condition: String(formData.get('male_condition') ?? ''),
        female_condition: String(formData.get('female_condition') ?? ''),
        is_active: isActive,
      }

      const { error } = await supabaseAdmin
        .from('compatibility_copy')
        .update(payload)
        .eq('id', currentId)

      if (error) {
        throw new Error(`compatibility_copy update failed: ${error.message}`)
      }
    }

    revalidatePath('/admin/compatibility-copy')
    revalidatePath(`/admin/compatibility-copy/${currentKind}/${currentId}`)
    revalidatePath('/compatibility')
    revalidatePath('/compatibility/today')
    revalidatePath('/compatibility/month')
    revalidatePath('/compatibility/year')
  }

  const { data: fortuneRow } = fortuneKind
    ? await supabase
        .from('compatibility_fortune_copy')
        .select('*')
        .eq('id', id)
        .maybeSingle()
    : { data: null }

  const { data: totalRow } = !fortuneKind
    ? await supabase
        .from('compatibility_copy')
        .select('*')
        .eq('id', id)
        .maybeSingle()
    : { data: null }

  if (fortuneKind && !fortuneRow) {
    notFound()
  }

  if (!fortuneKind && !totalRow) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {fortuneKind ? '기간별 궁합 문구 수정' : '궁합 총운 문구 수정'}
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            {fortuneKind
              ? '오늘·이달·올해 궁합에서 노출되는 문구를 수정합니다.'
              : '궁합 총운 카드에서 노출되는 문구를 수정합니다.'}
          </p>
        </div>
        <Link
          href={`/admin/compatibility-copy?mode=${fortuneKind ? 'fortune' : 'total'}`}
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          목록으로
        </Link>
      </div>

      <form action={updateCopy} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <input type="hidden" name="kind" value={fortuneKind ? 'fortune' : 'total'} />
        <input type="hidden" name="id" value={id} />

        <div className="grid gap-4 sm:grid-cols-2">
          {fortuneKind && fortuneRow ? (
            <>
              <ReadOnlyField label="기간" value={fortuneRow.period_type} />
              <ReadOnlyField label="카테고리" value={fortuneRow.category} />
              <ReadOnlyField label="키" value={fortuneRow.copy_key} className="sm:col-span-2" />
            </>
          ) : (
            <>
              <ReadOnlyField label="섹션" value={totalRow!.section} />
              <ReadOnlyField label="키" value={totalRow!.copy_key} />
              <EditableInput label="제목" name="title" defaultValue={totalRow!.title} className="sm:col-span-2" />
              <EditableInput label="패턴" name="pattern" defaultValue={totalRow!.pattern} />
              <EditableInput label="상세 케이스" name="detail_case" defaultValue={totalRow!.detail_case} />
              <EditableInput label="남성 조건" name="male_condition" defaultValue={totalRow!.male_condition} />
              <EditableInput label="여성 조건" name="female_condition" defaultValue={totalRow!.female_condition} />
            </>
          )}
        </div>

        <div className="mt-6 space-y-5">
          <EditableTextarea
            label="요약 문구"
            name="summary"
            defaultValue={fortuneKind ? fortuneRow!.summary : totalRow!.summary}
            rows={4}
          />
          <EditableTextarea
            label="상세 문구"
            name="detail"
            defaultValue={fortuneKind ? fortuneRow!.detail : totalRow!.detail}
            rows={14}
          />

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={fortuneKind ? fortuneRow!.is_active : totalRow!.is_active}
              className="h-4 w-4 rounded border-gray-300"
            />
            활성화된 문구로 노출하기
          </label>
        </div>

        <div className="mt-6 flex justify-end">
          <button type="submit" className={buttonVariants({ size: 'sm' })}>
            저장하기
          </button>
        </div>
      </form>
    </div>
  )
}

function ReadOnlyField({
  label,
  value,
  className = '',
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <p className="mb-1 text-sm font-medium text-gray-700">{label}</p>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
        {value}
      </div>
    </div>
  )
}

function EditableInput({
  label,
  name,
  defaultValue,
  className = '',
}: {
  label: string
  name: string
  defaultValue: string
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <p className="mb-1 text-sm font-medium text-gray-700">{label}</p>
      <input
        type="text"
        name={name}
        defaultValue={defaultValue}
        className="h-11 w-full rounded-2xl border border-gray-200 px-3 text-sm text-gray-900 outline-none transition focus:border-black"
      />
    </label>
  )
}

function EditableTextarea({
  label,
  name,
  defaultValue,
  rows,
}: {
  label: string
  name: string
  defaultValue: string
  rows: number
}) {
  return (
    <label className="block">
      <p className="mb-1 text-sm font-medium text-gray-700">{label}</p>
      <textarea
        name={name}
        defaultValue={defaultValue}
        rows={rows}
        className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm leading-7 text-gray-900 outline-none transition focus:border-black"
      />
    </label>
  )
}
