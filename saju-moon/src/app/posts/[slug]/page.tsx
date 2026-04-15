import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GuestCTA from '@/components/blog/GuestCTA'
import GradeCTA from '@/components/blog/GradeCTA'
import TiptapRenderer from '@/components/editor/TiptapRenderer'
import JudgmentResult from '@/components/judgment/JudgmentResult'
import { judgePost, type JudgmentUserData } from '@/lib/saju/judgment'
import type { JSONContent } from '@tiptap/react'
import type { JudgmentRules } from '@/types/judgment'

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  })
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts')
    .select('title, summary, tags')
    .eq('slug', slug)
    .eq('is_published', true)
    .lte('published_at', new Date().toISOString())
    .single()

  if (!data) return {}
  return {
    title: data.title,
    description: data.summary,
    keywords: data.tags?.length ? data.tags.join(', ') : undefined,
  }
}

export default async function PostDetailPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: post } = await supabase
    .from('posts')
    .select('slug, title, summary, content, category, published_at, target_year, judgment_rules, judgment_detail')
    .eq('slug', slug)
    .eq('is_published', true)
    .lte('published_at', new Date().toISOString())
    .single()

  if (!post) notFound()

  const { data: { user } } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  // 등급 분리 설정 + 사용자 등급 조회 (병렬)
  const [settingsRes, profileRes] = await Promise.all([
    supabase.from('site_settings').select('grade_separation_enabled').eq('id', 1).maybeSingle(),
    isLoggedIn
      ? supabase.from('users').select('role').eq('id', user!.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const gradeSeparationEnabled = settingsRes.data?.grade_separation_enabled ?? false
  const role = profileRes.data?.role ?? 'free'

  // 판정 열람 권한 결정
  let canSeeJudgment = false
  let canSeeDetail = false

  if (isLoggedIn) {
    if (!gradeSeparationEnabled) {
      // 등급 분리 꺼짐: 모든 로그인 회원 전체 열람
      canSeeJudgment = true
      canSeeDetail = true
    } else {
      // 등급 분리 켜짐
      canSeeJudgment = role === 'plus' || role === 'premium'
      canSeeDetail = role === 'premium'
    }
  }

  // 판정 계산 (권한 있을 때만)
  let judgmentResult: boolean | null = null
  let hasSaju = false

  if (canSeeJudgment && post.judgment_rules) {
    const [sajuRes, ohangRes, sipsungRes] = await Promise.all([
      supabase.from('user_saju')
        .select('year_cheongan,year_jiji,month_cheongan,month_jiji,day_cheongan,day_jiji,hour_cheongan,hour_jiji,year_ganji,month_ganji,day_ganji,hour_ganji,ilgan,full_saju_data')
        .eq('user_id', user!.id).single(),
      supabase.from('user_saju_ohang')
        .select('mok_score,hwa_score,to_score,geum_score,su_score,has_mok,has_hwa,has_to,has_geum,has_su')
        .eq('user_id', user!.id).single(),
      supabase.from('user_saju_sipsung')
        .select('bigyeon_score,gyeopjae_score,sikshin_score,sanggwan_score,pyeonjae_score,jeongjae_score,pyeongwan_score,jeonggwan_score,pyeonin_score,jeongin_score,has_bigyeon,has_gyeopjae,has_sikshin,has_sanggwan,has_pyeonjae,has_jeongjae,has_pyeongwan,has_jeonggwan,has_pyeonin,has_jeongin')
        .eq('user_id', user!.id).single(),
    ])

    if (sajuRes.data && ohangRes.data && sipsungRes.data) {
      hasSaju = true
      const userData: JudgmentUserData = {
        ...sajuRes.data,
        ...ohangRes.data,
        ...sipsungRes.data,
        full_saju_data: sajuRes.data.full_saju_data as Record<string, unknown>,
      } as unknown as JudgmentUserData

      judgmentResult = judgePost(
        post.judgment_rules as unknown as JudgmentRules,
        userData,
        post.target_year,
      )
    }
  }

  // 사이드바에 보여줄 판정 detail (등급에 따라 null 처리)
  const detailContent = canSeeDetail ? (post.judgment_detail as JSONContent | null) : null

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* 본문 (60%) */}
        <article className="w-full lg:w-[60%]">
          {/* 메타 */}
          <div className="mb-6 flex items-center gap-2 flex-wrap">
            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              {post.category}
            </span>
            {post.target_year && (
              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                {post.target_year}년 기준
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-4">
            {post.title}
          </h1>

          {/* 저자 정보 */}
          <div className="flex items-center gap-3 mb-10 pb-6 border-b border-gray-100">
            <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-white text-xs font-bold shrink-0">
              사
            </div>
            <span className="text-sm text-gray-500">
              사주 Moon
              {post.published_at && ` · ${formatDate(post.published_at)}`}
            </span>
          </div>

          {/* 본문 */}
          <div className="prose prose-gray max-w-none">
            <TiptapRenderer content={post.content as JSONContent} />
          </div>
        </article>

        {/* 사이드바 (40%) */}
        <aside className="w-full lg:w-[40%] lg:max-w-sm shrink-0">
          <div className="sticky top-20 flex flex-col gap-6">
            {!isLoggedIn ? (
              <GuestCTA />
            ) : gradeSeparationEnabled && role === 'free' ? (
              post.judgment_rules ? <GradeCTA /> : null
            ) : post.judgment_rules ? (
              <JudgmentResult
                result={hasSaju ? judgmentResult : null}
                detail={detailContent}
                showDetail={canSeeDetail}
              />
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  )
}
