import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { buttonVariants } from '@/components/ui/button'

export const metadata = { title: '택일 문구 관리' }

type SearchParams = Promise<{
  q?: string
  page?: string
}>

const PAGE_SIZE = 50

function normalizePage(raw: string | undefined) {
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
}

function buildListUrl(params: {
  q?: string
  page?: number
}) {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.page && params.page > 1) search.set('page', String(params.page))
  const query = search.toString()
  return `/admin/taekil-copy${query ? `?${query}` : ''}`
}

export default async function AdminTaekilCopyPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await requireAdmin()
  const supabase = await createClient()
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const page = normalizePage(params.page)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let rowsQuery = supabase
    .from('taekil_copy')
    .select('id, copy_group, copy_key, title, summary, is_active, updated_at', { count: 'exact' })
    .order('copy_group', { ascending: true })
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (query) {
    rowsQuery = rowsQuery.or(
      `copy_group.ilike.%${query}%,copy_key.ilike.%${query}%,title.ilike.%${query}%,summary.ilike.%${query}%,detail.ilike.%${query}%`,
    )
  }

  const [{ count }, rowsResult] = await Promise.all([
    supabase.from('taekil_copy').select('*', { count: 'exact', head: true }),
    rowsQuery,
  ])

  const rows = rowsResult.data ?? []
  const filteredCount = rowsResult.count ?? 0
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const startItem = filteredCount === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const endItem = filteredCount === 0 ? 0 : Math.min(safePage * PAGE_SIZE, filteredCount)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">택일 문구 관리</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          택일 페이지에서 유저에게 보여주는 목적 라벨, 결과 제목, 안내 문구를 DB로 관리합니다.
          점수 계산 로직은 코드에 두고, 표현 문구만 운영 중에 수정할 수 있도록 분리한 화면입니다.
        </p>
        <p className="mt-2 text-xs leading-6 text-gray-400">
          초기 하드코딩 이관은 끝났으므로 이제 이 화면에서 DB 문구만 관리하면 됩니다.
        </p>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="택일 문구"
          value={(count ?? 0).toLocaleString('ko-KR')}
          hint="페이지, 목적, 레벨, 패널, 템플릿 문구"
        />
        <StatCard
          label="현재 검색 결과"
          value={filteredCount.toLocaleString('ko-KR')}
          hint={query ? `검색어: ${query}` : '전체 문구를 50개씩 나눠서 표시'}
        />
      </section>

      <section className="mt-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">문구 목록</h2>
            <p className="mt-1 text-sm text-gray-500">
              그룹과 키를 기준으로 문구를 검색하고, 각 항목에서 바로 편집 화면으로 이동할 수 있습니다.
            </p>
          </div>

          <form action="/admin/taekil-copy" method="get" className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="그룹, 키, 제목, 요약 검색"
              className="h-10 min-w-[240px] rounded-2xl border border-gray-200 px-3 text-sm text-gray-900 outline-none transition focus:border-black"
            />
            <button type="submit" className={buttonVariants({ size: 'sm' })}>
              검색
            </button>
            {query ? (
              <Link
                href="/admin/taekil-copy"
                scroll={false}
                className={buttonVariants({ variant: 'outline', size: 'sm' })}
              >
                초기화
              </Link>
            ) : null}
          </form>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
          <p>
            전체 {filteredCount.toLocaleString('ko-KR')}개 중 {startItem.toLocaleString('ko-KR')}~
            {endItem.toLocaleString('ko-KR')}개 표시
          </p>
          <PaginationLinks
            currentPage={safePage}
            totalPages={totalPages}
            buildHref={(nextPage) => buildListUrl({ q: query, page: nextPage })}
          />
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-400">
              <tr>
                <th className="px-4 py-3 font-medium">그룹</th>
                <th className="px-4 py-3 font-medium">키</th>
                <th className="px-4 py-3 font-medium">제목</th>
                <th className="px-4 py-3 font-medium">상태</th>
                <th className="px-4 py-3 font-medium">관리</th>
              </tr>
            </thead>
            <tbody>
              {rows.length > 0 ? (
                rows.map((row) => (
                  <tr key={row.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 text-gray-700">{row.copy_group}</td>
                    <td className="px-4 py-3 text-gray-500">{row.copy_key}</td>
                    <td className="px-4 py-3 text-gray-800">{row.title || row.summary || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{row.is_active ? '노출 중' : '비활성'}</td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/taekil-copy/${row.id}`}
                        className={buttonVariants({ variant: 'outline', size: 'xs' })}
                      >
                        편집
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-sm text-gray-400">
                    조건에 맞는 택일 문구가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-gray-900">{value}</p>
      <p className="mt-2 text-xs text-gray-400">{hint}</p>
    </div>
  )
}

function PaginationLinks({
  currentPage,
  totalPages,
  buildHref,
}: {
  currentPage: number
  totalPages: number
  buildHref: (page: number) => string
}) {
  return (
    <div className="flex items-center gap-2">
      <Link
        href={buildHref(Math.max(1, currentPage - 1))}
        scroll={false}
        aria-disabled={currentPage <= 1}
        className={buttonVariants({
          variant: 'outline',
          size: 'xs',
          className: currentPage <= 1 ? 'pointer-events-none opacity-40' : '',
        })}
      >
        이전
      </Link>
      <span className="text-xs text-gray-500">
        {currentPage} / {totalPages}
      </span>
      <Link
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        scroll={false}
        aria-disabled={currentPage >= totalPages}
        className={buttonVariants({
          variant: 'outline',
          size: 'xs',
          className: currentPage >= totalPages ? 'pointer-events-none opacity-40' : '',
        })}
      >
        다음
      </Link>
    </div>
  )
}
