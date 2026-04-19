import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getManseryeokData } from '@/lib/saju/manseryeok'
import type { SajuInput } from '@/lib/saju/calculate'
import type { Gender } from '@/types/saju'
import { buildCompatibilityPreviewCards } from '@/lib/compatibility/rules'
import type { CompatibilitySection } from '@/lib/compatibility/types'
import MenuHero from '@/components/layout/MenuHero'

export const metadata: Metadata = {
  title: '궁합 | 사주 Moon',
  description: '내 사주와 저장된 상대 사주를 비교하는 궁합 페이지입니다.',
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

type RoleSource = 'me' | 'target'
const HERO_PALETTE = {
  borderClass: 'border-pink-100',
  gradientClass:
    'bg-[radial-gradient(circle_at_top_left,_rgba(244,114,182,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(251,207,232,0.26),_transparent_24%),linear-gradient(135deg,_#fff8fb_0%,_#ffffff_58%,_#fdf2f8_100%)]',
  eyebrowClass: 'text-pink-500',
}

function parseStringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

function buildRoleHref(targetId: string, maleRole: RoleSource) {
  return `/compatibility?target=${targetId}&maleRole=${maleRole}`
}

function formatDate(year: number, month: number, day: number) {
  return `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`
}

function formatTime(hour: number | null, minute: number | null) {
  if (hour === null) return '출생시 모름'
  return `${String(hour).padStart(2, '0')}:${String(minute ?? 0).padStart(2, '0')}`
}

function getCompatibilityMetricLabel(section: CompatibilitySection) {
  switch (section) {
    case 'dayGan':
      return '대화 티키타카 & 소울메이트 지수'
    case 'dayJi':
      return '라이프스타일 & 속궁합 지수'
    case 'ohang':
      return '퍼즐 조각 매칭 지수 (서로의 빈틈 채우기)'
    case 'johoo':
      return '힐링 & 본능적 끌림 지수'
    case 'sipsung':
      return '연애 스타일 & 밀당 지수'
  }
}

function splitDetailIntoParagraphs(detail: string) {
  const normalized = detail.replace(/\r\n/g, '\n').replace(/\n+/g, ' ').trim()
  if (!normalized) return []

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)

  if (sentences.length <= 2) return [normalized]

  const paragraphs: string[] = []
  const chunkSize = 3

  for (let i = 0; i < sentences.length; i += chunkSize) {
    paragraphs.push(sentences.slice(i, i + chunkSize).join(' '))
  }

  return paragraphs
}

export default async function CompatibilityPage({ searchParams }: Props) {
  const params = await searchParams
  const selectedId = parseStringParam(params.target)
  const maleRoleParam = parseStringParam(params.maleRole)

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [
    { data: mySaju },
    { data: profile },
    { data: compatibilityEntries },
  ] = await Promise.all([
    supabase
      .from('user_saju')
      .select('saju_name, birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, is_lunar, ilgan')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('users')
      .select('nickname, role, is_admin')
      .eq('id', user.id)
      .maybeSingle(),
    supabase
      .from('user_compatibility_saju')
      .select('id, nickname, birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, is_lunar, full_saju_data')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
  ])

  const selectedEntry = compatibilityEntries?.find((entry) => entry.id === selectedId) ?? compatibilityEntries?.[0] ?? null
  const myGender = mySaju?.gender as Gender | undefined
  const targetGender = selectedEntry?.gender as Gender | undefined
  const sameGenderPair = Boolean(myGender && targetGender && myGender === targetGender)
  const validMaleRole: RoleSource | null =
    sameGenderPair && (maleRoleParam === 'me' || maleRoleParam === 'target')
      ? maleRoleParam
      : !sameGenderPair && myGender && targetGender
        ? myGender === 'male'
          ? 'me'
          : 'target'
        : null
  const validFemaleRole: RoleSource | null =
    validMaleRole === 'me' ? 'target' : validMaleRole === 'target' ? 'me' : null

  let myManseryeok = null
  if (mySaju) {
    const input: SajuInput = {
      birth_year: mySaju.birth_year,
      birth_month: mySaju.birth_month,
      birth_day: mySaju.birth_day,
      birth_hour: mySaju.birth_hour ?? null,
      birth_minute: mySaju.birth_minute ?? null,
      gender: (mySaju.gender as Gender) ?? 'male',
      is_lunar: mySaju.is_lunar ?? false,
    }
    myManseryeok = getManseryeokData(input)
  }

  let targetManseryeok = null
  if (selectedEntry) {
    const targetInput: SajuInput = {
      birth_year: selectedEntry.birth_year,
      birth_month: selectedEntry.birth_month,
      birth_day: selectedEntry.birth_day,
      birth_hour: selectedEntry.birth_hour ?? null,
      birth_minute: selectedEntry.birth_minute ?? null,
      gender: (selectedEntry.gender as Gender) ?? 'female',
      is_lunar: selectedEntry.is_lunar ?? false,
    }
    targetManseryeok = getManseryeokData(targetInput)
  }

  const maleManseryeok =
    validMaleRole === 'me' ? myManseryeok : validMaleRole === 'target' ? targetManseryeok : null
  const femaleManseryeok =
    validFemaleRole === 'me' ? myManseryeok : validFemaleRole === 'target' ? targetManseryeok : null

  const previewCards =
    maleManseryeok && femaleManseryeok
      ? buildCompatibilityPreviewCards(maleManseryeok, femaleManseryeok)
      : []
  const myDisplayName = mySaju?.saju_name?.trim() || profile?.nickname || '회원님'
  const canSeePremiumMeta =
    profile?.is_admin || profile?.role === 'plus' || profile?.role === 'premium'

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <MenuHero
        eyebrow="Compatibility"
        title="궁합"
        description={`저장해 둔 상대 만세력 중 하나를 골라 내 사주와 비교합니다.
지금은 선택 화면을 먼저 열어두고, 다음 단계에서 궁합 점수와 해설을 붙입니다.`}
        palette={HERO_PALETTE}
      />

      <section className="mt-8 grid grid-cols-2 gap-3 sm:gap-4">
        <article className="order-2 rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm sm:order-1 sm:p-6">
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

        <article className="order-1 rounded-[1.5rem] border border-gray-100 bg-white p-4 shadow-sm sm:order-2 sm:p-6">
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

      <section className="mt-8 rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">저장된 상대 선택</h2>
            <p className="mt-2 text-sm leading-6 text-gray-500">
              아래 목록에서 궁합을 볼 상대를 선택하세요. 선택된 사람은 화면 상단 Target 카드에 표시됩니다.
            </p>
          </div>
          <span className="rounded-full bg-pink-50 px-3 py-1 text-xs font-medium text-pink-600">
            {compatibilityEntries?.length ?? 0}명 저장됨
          </span>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {(compatibilityEntries ?? []).length > 0 ? (
            compatibilityEntries!.map((entry) => {
              const selected = entry.id === selectedEntry?.id
              const href = maleRoleParam
                ? `/compatibility?target=${entry.id}&maleRole=${maleRoleParam}`
                : `/compatibility?target=${entry.id}`
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
      </section>

      {sameGenderPair && (
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
              href={selectedEntry ? buildRoleHref(selectedEntry.id, 'me') : '/compatibility'}
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
              href={selectedEntry ? buildRoleHref(selectedEntry.id, 'target') : '/compatibility'}
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

      {previewCards.length > 0 && (
        <section className="mt-8 rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">워크북 궁합 결과</h2>
              <p className="mt-2 text-sm leading-6 text-gray-500">
                선택한 두 사람의 사주를 기준으로 항목별 궁합 해설을 보여줍니다.
                유료 회원에게는 패턴과 남/여 조건이 함께 표시됩니다.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {previewCards.map((card) => (
              <article
                key={card.section}
                className="rounded-[1.25rem] border border-gray-100 bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)] p-5 shadow-sm"
              >
                <h3 className="text-lg font-semibold text-gray-900">
                  {getCompatibilityMetricLabel(card.section)}
                </h3>
                {canSeePremiumMeta ? (
                  <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-medium text-gray-500">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1">{card.pattern}</span>
                    <span className="rounded-full bg-pink-50 px-2.5 py-1 text-pink-700">남: {card.maleCondition}</span>
                    <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-700">여: {card.femaleCondition}</span>
                  </div>
                ) : null}
                <p className="mt-3 text-sm font-semibold leading-6 text-gray-700">{card.summary}</p>
                <div className="mt-3 space-y-3 text-sm leading-7 text-gray-500">
                  {splitDetailIntoParagraphs(card.detail).map((paragraph, index) => (
                    <p key={`${card.section}-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8 rounded-[1.5rem] border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">다음 단계</h2>
        <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
          <li>선택된 내 사주와 상대 사주를 비교하는 궁합 점수 계산</li>
          <li>성향 궁합 / 감정 궁합 / 생활 리듬 궁합 분리</li>
          <li>잘 맞는 점과 주의할 점을 카드로 표시</li>
        </ul>
      </section>
    </div>
  )
}
