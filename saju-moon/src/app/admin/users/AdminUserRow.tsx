'use client'

import { useState } from 'react'
import { updateManagedUser } from '@/actions/adminUsers'
import { buttonVariants } from '@/components/ui/button'

type UserRow = {
  id: string
  email: string | null
  nickname: string | null
  role: 'free' | 'plus' | 'premium'
  is_admin: boolean
  terms_agreed_at: string | null
  created_at: string
  updated_at: string
}

function formatDateTime(iso: string | null) {
  if (!iso) return '-'

  return new Date(iso).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateOnly(iso: string | null) {
  if (!iso) return '-'

  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  })
}

export default function AdminUserRow({
  user,
  hasSaju,
}: {
  user: UserRow
  hasSaju: boolean
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border-b border-gray-50 last:border-b-0">
      <div className="grid grid-cols-[minmax(0,2.8fr)_120px_380px_90px] gap-4 px-4 py-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900">{user.nickname?.trim() || '닉네임 없음'}</span>
            {user.is_admin ? (
              <span className="rounded-full bg-black px-2 py-0.5 text-[11px] font-medium text-white">관리자</span>
            ) : null}
          </div>
          <p className="mt-1 truncate text-sm text-gray-500">{user.email || '이메일 없음'}</p>
        </div>

        <div className="flex items-center">
          {hasSaju ? (
            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
              입력 완료
            </span>
          ) : (
            <span className="rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-400">미입력</span>
          )}
        </div>

        <div className="flex items-center">
          <form action={updateManagedUser} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="userId" value={user.id} />
            <select
              name="role"
              defaultValue={user.role}
              className="h-9 min-w-[110px] rounded-xl border border-gray-200 px-3 text-sm text-gray-900 outline-none transition focus:border-black"
            >
              <option value="free">free</option>
              <option value="plus">plus</option>
              <option value="premium">premium</option>
            </select>
            <label className="flex h-9 items-center gap-2 rounded-xl border border-gray-200 px-3 text-sm text-gray-700">
              <input type="checkbox" name="isAdmin" defaultChecked={user.is_admin} className="size-4 accent-black" />
              관리자
            </label>
            <button type="submit" className={buttonVariants({ size: 'sm' })}>
              저장
            </button>
          </form>
        </div>

        <div className="flex items-center">
          <button
            type="button"
            onClick={() => setExpanded((current) => !current)}
            className="text-sm font-medium text-gray-500 transition-colors hover:text-black"
          >
            {expanded ? '닫기' : '상세'}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-gray-100 bg-gray-50/70 px-4 py-3 text-sm text-gray-600">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>
              <span className="text-xs text-gray-400">가입일</span>
              <span className="ml-2 font-medium text-gray-800">{formatDateOnly(user.created_at)}</span>
            </span>
            <span>
              <span className="text-xs text-gray-400">약관 동의</span>
              <span className="ml-2 font-medium text-gray-800">
                {user.terms_agreed_at ? formatDateOnly(user.terms_agreed_at) : '미동의'}
              </span>
            </span>
            <span>
              <span className="text-xs text-gray-400">최근 수정</span>
              <span className="ml-2 font-medium text-gray-800">{formatDateTime(user.updated_at)}</span>
            </span>
            <span>
              <span className="text-xs text-gray-400">회원 ID</span>
              <span className="ml-2 font-mono text-gray-700">{user.id.slice(0, 8)}</span>
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
