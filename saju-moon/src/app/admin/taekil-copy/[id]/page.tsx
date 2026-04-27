import Link from 'next/link'
import { notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/auth/admin'
import { buttonVariants } from '@/components/ui/button'

interface Props {
  params: Promise<{
    id: string
  }>
}

export const metadata = {
  title: '택일 문구 편집',
}

export default async function AdminTaekilCopyDetailPage({ params }: Props) {
  await requireAdmin()
  const { id } = await params
  const supabase = await createClient()

  async function updateCopy(formData: FormData) {
    'use server'

    await requireAdmin()

    const currentId = String(formData.get('id') ?? '')
    const payload = {
      title: String(formData.get('title') ?? ''),
      summary: String(formData.get('summary') ?? ''),
      detail: String(formData.get('detail') ?? ''),
      is_active: formData.get('is_active') === 'on',
    }

    const { error } = await supabaseAdmin
      .from('taekil_copy')
      .update(payload)
      .eq('id', currentId)

    if (error) {
      throw new Error(`taekil_copy update failed: ${error.message}`)
    }

    revalidatePath('/admin/taekil-copy')
    revalidatePath(`/admin/taekil-copy/${currentId}`)
    revalidatePath('/taekil')
  }

  const { data: row } = await supabase
    .from('taekil_copy')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (!row) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">택일 문구 편집</h1>
          <p className="mt-2 text-sm text-gray-500">
            선택한 택일 문구를 수정하면 택일 페이지에서 DB 값을 우선 사용합니다.
          </p>
        </div>
        <Link href="/admin/taekil-copy" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          목록으로
        </Link>
      </div>

      <form action={updateCopy} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <input type="hidden" name="id" value={row.id} />

        <div className="grid gap-4 sm:grid-cols-2">
          <ReadOnlyField label="그룹" value={row.copy_group} />
          <ReadOnlyField label="키" value={row.copy_key} />
        </div>

        <div className="mt-6 space-y-5">
          <EditableInput label="제목" name="title" defaultValue={row.title} />
          <EditableTextarea label="요약" name="summary" defaultValue={row.summary} rows={5} />
          <EditableTextarea label="상세" name="detail" defaultValue={row.detail} rows={8} />

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={row.is_active}
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
}: {
  label: string
  value: string
}) {
  return (
    <div>
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
}: {
  label: string
  name: string
  defaultValue: string
}) {
  return (
    <label className="block">
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
