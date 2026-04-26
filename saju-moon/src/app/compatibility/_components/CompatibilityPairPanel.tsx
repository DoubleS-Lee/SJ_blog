import Link from 'next/link'
import type { CompatibilityPageContext } from '@/lib/compatibility/page-context'
import {
  buildRoleHref,
  buildTargetHref,
  formatDate,
  formatTime,
} from '@/lib/compatibility/page-context'

interface CompatibilityPairPanelProps {
  context: CompatibilityPageContext
  basePath: string
  showRoleSelector?: boolean
}

export default function CompatibilityPairPanel({
  context,
  basePath,
  showRoleSelector = true,
}: CompatibilityPairPanelProps) {
  const {
    myDisplayName,
    myManseryeok,
    mySaju,
    selectedEntry,
    compatibilityEntries,
    maleRoleParam,
    sameGenderPair,
    myGender,
  } = context

  return (
    <>
      <section className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
        <article className="rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900">{myDisplayName}</h2>
          {myManseryeok ? (
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p>{formatDate(myManseryeok.solarYear, myManseryeok.solarMonth, myManseryeok.solarDay)}</p>
              <p>{myManseryeok.gender === 'male' ? '남성' : '여성'}</p>
              <p>{myManseryeok.hasHour ? formatTime(myManseryeok.solarHour, myManseryeok.solarMinute) : '출생시 모름'}</p>
              <p>{myManseryeok.isLunarLeap ? '윤달 포함' : mySaju?.is_lunar ? '음력' : '양력'}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">내 사주가 아직 등록되지 않았습니다.</p>
          )}
        </article>

        <article className="rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {selectedEntry ? selectedEntry.nickname : '상대 선택'}
          </h2>
          {selectedEntry ? (
            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <p>{formatDate(selectedEntry.birth_year, selectedEntry.birth_month, selectedEntry.birth_day)}</p>
              <p>{selectedEntry.gender === 'male' ? '남성' : '여성'}</p>
              <p>{selectedEntry.birth_hour !== null ? formatTime(selectedEntry.birth_hour, selectedEntry.birth_minute) : '출생시 모름'}</p>
              <p>{selectedEntry.is_lunar ? '음력' : '양력'}</p>
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">마이페이지에서 저장한 상대가 아직 없습니다.</p>
          )}
        </article>
      </section>

      <section className="mt-8 rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm sm:p-6">
        <details className="group" open={!selectedEntry}>
          <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">저장된 상대</h2>
                <p className="mt-1 text-sm leading-6 text-gray-500">
                  {selectedEntry
                    ? `${selectedEntry.nickname} · ${selectedEntry.gender === 'male' ? '남성' : '여성'} · ${selectedEntry.is_lunar ? '음력' : '양력'}`
                    : '궁합을 볼 상대를 선택해 주세요.'}
                </p>
              </div>
              <div className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors group-hover:border-pink-200 group-hover:text-pink-600">
                상대 변경
              </div>
            </div>
            <div className="mt-3">
              <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-600">
                {compatibilityEntries.length}명 저장됨
              </span>
            </div>
          </summary>

          <div className="mt-4 border-t border-gray-100 pt-4">
            <div className="grid gap-3 md:grid-cols-2">
              {compatibilityEntries.length > 0 ? (
                compatibilityEntries.map((entry) => {
                  const selected = entry.id === selectedEntry?.id
                  const href = buildTargetHref(basePath, entry.id, maleRoleParam)
                  return (
                    <Link
                      key={entry.id}
                      href={href}
                      className={`rounded-2xl border p-4 transition ${
                        selected
                          ? 'border-pink-300 bg-pink-50 shadow-sm'
                          : 'border-gray-100 bg-white hover:border-pink-200 hover:bg-pink-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{entry.nickname}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {formatDate(entry.birth_year, entry.birth_month, entry.birth_day)}
                            {' · '}
                            {entry.gender === 'male' ? '남성' : '여성'}
                            {' · '}
                            {entry.is_lunar ? '음력' : '양력'}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {entry.birth_hour !== null ? formatTime(entry.birth_hour, entry.birth_minute) : '출생시 모름'}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                            selected ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {selected ? '선택됨' : '선택'}
                        </span>
                      </div>
                    </Link>
                  )
                })
              ) : (
                <div className="rounded-2xl bg-gray-50 px-4 py-5 text-sm text-gray-500">
                  저장된 상대가 없습니다. 마이페이지에서 먼저 추가해 주세요.
                </div>
              )}
            </div>
          </div>
        </details>
      </section>

      {showRoleSelector && sameGenderPair && (
        <section className="mt-8 rounded-[1.5rem] border border-amber-100 bg-amber-50 p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-amber-900">역할 지정 필요</h2>
              <p className="mt-2 text-sm leading-6 text-amber-800">
                두 사람의 성별이 같아서, 궁합 분석을 위해 남자 역할과 여자 역할을 먼저 지정해야 합니다.
              </p>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-amber-700">
              {myGender === 'male' ? '남성-남성 조합' : '여성-여성 조합'}
            </span>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link
              href={selectedEntry ? buildRoleHref(basePath, selectedEntry.id, 'me') : basePath}
              className={`rounded-2xl border px-4 py-4 transition ${
                maleRoleParam === 'me'
                  ? 'border-amber-400 bg-white shadow-sm'
                  : 'border-amber-100 bg-white hover:border-amber-200'
              }`}
            >
              <p className="text-sm font-semibold text-gray-900">내 사주가 남자 역할</p>
              <p className="mt-1 text-xs text-gray-500">
                내 사주를 남성 기준으로 두고, 상대 사주를 여성 기준으로 분석합니다.
              </p>
            </Link>

            <Link
              href={selectedEntry ? buildRoleHref(basePath, selectedEntry.id, 'target') : basePath}
              className={`rounded-2xl border px-4 py-4 transition ${
                maleRoleParam === 'target'
                  ? 'border-amber-400 bg-white shadow-sm'
                  : 'border-amber-100 bg-white hover:border-amber-200'
              }`}
            >
              <p className="text-sm font-semibold text-gray-900">상대가 남자 역할</p>
              <p className="mt-1 text-xs text-gray-500">
                상대 사주를 남성 기준으로 두고, 내 사주를 여성 기준으로 분석합니다.
              </p>
            </Link>
          </div>
        </section>
      )}
    </>
  )
}
