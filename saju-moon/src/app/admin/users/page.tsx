import { supabaseAdmin } from '@/lib/supabase/admin'
import { buttonVariants } from '@/components/ui/button'
import AdminUserRow from './AdminUserRow'

export const metadata = { title: '회원 관리' }

const PAGE_SIZE = 20

function sanitizeLikeQuery(value: string) {
  return value.replace(/[%_,()]/g, ' ').trim()
}

type SearchParams = Promise<{ q?: string; page?: string }>

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const { q, page } = await searchParams
  const queryText = q?.trim() ?? ''
  const searchKeyword = sanitizeLikeQuery(queryText)
  const requestedPage = Math.max(1, Number.parseInt(page ?? '1', 10) || 1)

  let countQuery = supabaseAdmin
    .from('users')
    .select('*', { count: 'exact', head: true })

  let usersQuery = supabaseAdmin
    .from('users')
    .select('id, email, nickname, role, is_admin, terms_agreed_at, created_at, updated_at')
    .order('created_at', { ascending: false })

  if (searchKeyword) {
    const filter = `email.ilike.%${searchKeyword}%,nickname.ilike.%${searchKeyword}%`
    countQuery = countQuery.or(filter)
    usersQuery = usersQuery.or(filter)
  }

  const { count } = await countQuery
  const filteredCount = count ?? 0
  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE))
  const currentPage = Math.min(requestedPage, totalPages)
  const from = (currentPage - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const { data: users } = await usersQuery.range(from, to)
  const userIds = (users ?? []).map((user) => user.id)

  const [{ data: sajuRows }, { count: adminCount }] = await Promise.all([
    userIds.length
      ? supabaseAdmin.from('user_saju').select('user_id').in('user_id', userIds)
      : Promise.resolve({ data: [] as { user_id: string }[] }),
    supabaseAdmin.from('users').select('*', { count: 'exact', head: true }).eq('is_admin', true),
  ])

  const sajuUserIds = new Set((sajuRows ?? []).map((row) => row.user_id))
  const startItem = filteredCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const endItem = filteredCount === 0 ? 0 : Math.min(currentPage * PAGE_SIZE, filteredCount)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="mb-5 flex flex-col gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">회원 관리</h1>
            <p className="mt-1 text-sm text-gray-500">
              회원을 빠르게 훑어보고 등급과 관리자 여부를 바로 조정할 수 있습니다.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3 text-sm text-gray-500 shadow-sm">
            전체 회원 <span className="font-semibold text-gray-900">{filteredCount.toLocaleString('ko-KR')}</span>명
            <span className="mx-2 text-gray-300">|</span>
            관리자 <span className="font-semibold text-gray-900">{(adminCount ?? 0).toLocaleString('ko-KR')}</span>명
          </div>
        </div>

        <form
          action="/admin/users"
          method="get"
          className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
        >
          <input
            type="text"
            name="q"
            defaultValue={queryText}
            placeholder="이메일 또는 닉네임으로 검색"
            className="h-11 flex-1 rounded-2xl border border-gray-200 px-4 text-sm text-gray-900 outline-none transition focus:border-black"
          />
          <div className="flex gap-2">
            <button type="submit" className={buttonVariants()}>
              검색
            </button>
            {queryText ? (
              <a href="/admin/users" className={buttonVariants({ variant: 'outline' })}>
                초기화
              </a>
            ) : null}
          </div>
        </form>

        <div className="flex flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {queryText ? (
              <>
                <span className="font-medium text-gray-900">'{queryText}'</span> 검색 결과입니다.
              </>
            ) : (
              '회원 전체 목록입니다.'
            )}
          </p>
          <p>
            총 <span className="font-semibold text-gray-900">{filteredCount.toLocaleString('ko-KR')}</span>명 중{' '}
            <span className="font-semibold text-gray-900">
              {startItem}~{endItem}
            </span>
            명을 보고 있습니다.
          </p>
        </div>
      </div>

      {!users || users.length === 0 ? (
        <div className="rounded-lg border border-gray-100 bg-white p-12 text-center text-sm text-gray-400">
          {queryText ? '검색된 회원이 없습니다.' : '가입한 회원이 없습니다.'}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="grid grid-cols-[minmax(0,2.8fr)_120px_380px_90px] gap-4 border-b border-gray-100 bg-gray-50 px-4 py-3 text-xs font-medium uppercase tracking-wide text-gray-400">
            <div>회원</div>
            <div>사주</div>
            <div>관리</div>
            <div>상세</div>
          </div>

          <div>
            {users.map((user) => (
              <AdminUserRow key={user.id} user={user} hasSaju={sajuUserIds.has(user.id)} />
            ))}
          </div>
        </div>
      )}

      {filteredCount > 0 ? (
        <PaginationLinks currentPage={currentPage} totalPages={totalPages} queryText={queryText} />
      ) : null}
    </div>
  )
}

function PaginationLinks({
  currentPage,
  totalPages,
  queryText,
}: {
  currentPage: number
  totalPages: number
  queryText: string
}) {
  const buildHref = (page: number) => {
    const params = new URLSearchParams()
    if (queryText) params.set('q', queryText)
    if (page > 1) params.set('page', String(page))
    const query = params.toString()
    return query ? `/admin/users?${query}` : '/admin/users'
  }

  return (
    <div className="mt-6 flex items-center justify-between text-sm text-gray-500">
      <a
        href={buildHref(Math.max(1, currentPage - 1))}
        aria-disabled={currentPage <= 1}
        className={[
          'rounded-full border border-gray-200 px-4 py-2 transition hover:border-black hover:text-black',
          currentPage <= 1 ? 'pointer-events-none opacity-40' : '',
        ].join(' ')}
      >
        이전
      </a>
      <span className="font-medium text-gray-700">
        {currentPage} / {totalPages}
      </span>
      <a
        href={buildHref(Math.min(totalPages, currentPage + 1))}
        aria-disabled={currentPage >= totalPages}
        className={[
          'rounded-full border border-gray-200 px-4 py-2 transition hover:border-black hover:text-black',
          currentPage >= totalPages ? 'pointer-events-none opacity-40' : '',
        ].join(' ')}
      >
        다음
      </a>
    </div>
  )
}
