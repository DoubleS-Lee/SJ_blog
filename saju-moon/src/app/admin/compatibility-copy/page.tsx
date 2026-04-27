import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/admin'
import { buttonVariants } from '@/components/ui/button'

export const metadata = { title: '궁합 문구 관리' }

type SearchParams = Promise<{
  q?: string
  mode?: string
  page?: string
}>

const PAGE_SIZE = 50

function normalizeMode(raw: string | undefined) {
  return raw === 'fortune' ? 'fortune' : 'total'
}

function normalizePage(raw: string | undefined) {
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 1
}

function buildListUrl(params: { mode: 'total' | 'fortune'; q?: string; page?: number }) {
  const search = new URLSearchParams()
  search.set('mode', params.mode)
  if (params.q) search.set('q', params.q)
  if (params.page && params.page > 1) search.set('page', String(params.page))
  return `/admin/compatibility-copy?${search.toString()}`
}

export default async function AdminCompatibilityCopyPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  await requireAdmin()
  const supabase = await createClient()
  const params = await searchParams
  const query = params.q?.trim() ?? ''
  const mode = normalizeMode(params.mode)
  const page = normalizePage(params.page)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  let mainRowsQuery = supabase
    .from('compatibility_copy')
    .select('id, section, copy_key, title, updated_at, is_active', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(from, to)

  let fortuneRowsQuery = supabase
    .from('compatibility_fortune_copy')
    .select('id, period_type, category, copy_key, summary, updated_at, is_active', { count: 'exact' })
    .order('updated_at', { ascending: false })
    .range(from, to)

  if (query) {
    mainRowsQuery = mainRowsQuery.or(
      `title.ilike.%${query}%,copy_key.ilike.%${query}%,section.ilike.%${query}%`,
    )
    fortuneRowsQuery = fortuneRowsQuery.or(
      `copy_key.ilike.%${query}%,category.ilike.%${query}%,period_type.ilike.%${query}%,summary.ilike.%${query}%`,
    )
  }

  const [{ count: totalMainCopy }, { count: totalFortuneCopy }, mainCopyResult, fortuneCopyResult] =
    await Promise.all([
      supabase.from('compatibility_copy').select('*', { count: 'exact', head: true }),
      supabase.from('compatibility_fortune_copy').select('*', { count: 'exact', head: true }),
      mainRowsQuery,
      fortuneRowsQuery,
    ])

  const mainCopyRows = mainCopyResult.data ?? []
  const fortuneCopyRows = fortuneCopyResult.data ?? []
  const currentRows = mode === 'total' ? mainCopyRows : fortuneCopyRows
  const filteredCount = (mode === 'total' ? mainCopyResult.count : fortuneCopyResult.count) ?? 0
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const startItem = filteredCount === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1
  const endItem = filteredCount === 0 ? 0 : Math.min(safePage * PAGE_SIZE, filteredCount)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">궁합 문구 관리</h1>
        <p className="mt-2 text-sm leading-6 text-gray-500">
          궁합 총운과 오늘·이달·올해 궁합에 노출되는 문구를 관리하는 화면입니다. 계산 로직은 코드에
          두고, 유저에게 보여주는 표현 문구만 운영 중에 수정할 수 있도록 분리했습니다.
        </p>
        <p className="mt-2 text-xs leading-6 text-gray-400">
          초기 하드코딩 이관은 끝났으므로 이제 이 화면에서 DB 문구만 관리하면 됩니다.
        </p>
      </div>

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <StatCard
          label="궁합 총운 문구"
          value={(totalMainCopy ?? 0).toLocaleString('ko-KR')}
          hint="일간, 일지, 오행, 조후, 십성 기준 총운 문구"
        />
        <StatCard
          label="기간별 궁합 문구"
          value={(totalFortuneCopy ?? 0).toLocaleString('ko-KR')}
          hint="오늘·이달·올해 궁합 결과 문구"
        />
      </section>

      <section className="mt-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-gray-900">문구 목록</h2>
            <p className="mt-1 text-sm text-gray-500">
              총운 문구와 기간별 궁합 문구를 검색하고, 각 항목에서 바로 편집 화면으로 이동할 수 있습니다.
            </p>
          </div>

          <form action="/admin/compatibility-copy" method="get" className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex rounded-2xl border border-gray-200 bg-gray-50 p-1">
              <Link
                href={buildListUrl({ mode: 'total', q: query })}
                scroll={false}
                className={buttonVariants({
                  size: 'xs',
                  variant: mode === 'total' ? 'default' : 'ghost',
                })}
              >
                총운
              </Link>
              <Link
                href={buildListUrl({ mode: 'fortune', q: query })}
                scroll={false}
                className={buttonVariants({
                  size: 'xs',
                  variant: mode === 'fortune' ? 'default' : 'ghost',
                })}
              >
                기간별 궁합
              </Link>
            </div>
            <input type="hidden" name="mode" value={mode} />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder={mode === 'total' ? '제목, 키, 섹션 검색' : '키, 기간, 카테고리 검색'}
              className="h-10 min-w-[220px] rounded-2xl border border-gray-200 px-3 text-sm text-gray-900 outline-none transition focus:border-black"
            />
            <button type="submit" className={buttonVariants({ size: 'sm' })}>
              검색
            </button>
            {query ? (
              <Link
                href={buildListUrl({ mode })}
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
            buildHref={(nextPage) => buildListUrl({ mode, q: query, page: nextPage })}
          />
        </div>

        {mode === 'total' ? (
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">섹션</th>
                  <th className="px-4 py-3 font-medium">키</th>
                  <th className="px-4 py-3 font-medium">제목</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? (
                  mainCopyRows.map((row) => (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-gray-700">{row.section}</td>
                      <td className="px-4 py-3 text-gray-500">{row.copy_key}</td>
                      <td className="px-4 py-3 text-gray-800">{row.title}</td>
                      <td className="px-4 py-3 text-gray-500">{row.is_active ? '노출 중' : '비활성'}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/compatibility-copy/total/${row.id}`}
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
                      조건에 맞는 총운 문구가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-4 py-3 font-medium">기간</th>
                  <th className="px-4 py-3 font-medium">카테고리</th>
                  <th className="px-4 py-3 font-medium">키</th>
                  <th className="px-4 py-3 font-medium">상태</th>
                  <th className="px-4 py-3 font-medium">관리</th>
                </tr>
              </thead>
              <tbody>
                {currentRows.length > 0 ? (
                  fortuneCopyRows.map((row) => (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 text-gray-700">{row.period_type}</td>
                      <td className="px-4 py-3 text-gray-500">{row.category}</td>
                      <td className="px-4 py-3 text-gray-800">{row.copy_key}</td>
                      <td className="px-4 py-3 text-gray-500">{row.is_active ? '노출 중' : '비활성'}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/compatibility-copy/fortune/${row.id}`}
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
                      조건에 맞는 기간별 궁합 문구가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
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
