import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import GuestCTA from '@/components/blog/GuestCTA'
import GradeCTA from '@/components/blog/GradeCTA'
import CommentsSection from '@/components/blog/CommentsSection'
import PostEngagementBar from '@/components/blog/PostEngagementBar'
import TiptapRenderer from '@/components/editor/TiptapRenderer'
import { evaluateJudgment, type JudgmentUserData } from '@/lib/saju/judgment'
import { calculateSaju, type SajuResult } from '@/lib/saju/calculate'
import { sanitizeIlganAvatarMap } from '@/lib/saju/ilgan-avatar'
import type { JSONContent } from '@tiptap/react'
import type { CommentNode } from '@/types/comment'
import type { JudgmentRules } from '@/types/judgment'
import type { Gender } from '@/types/saju'
import { buildAbsoluteUrl, buildSeoDescription, SITE_NAME } from '@/lib/seo/site'

function formatDate(iso: string | null) {
  if (!iso) return ''

  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function applyPublishedVisibilityFilter<T>(query: T, nowIso: string) {
  return (query as { or: (filters: string) => T }).or(`published_at.is.null,published_at.lte.${nowIso}`)
}

function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

function splitContentForInlineGuestCta(content: JSONContent | null): {
  before: JSONContent
  after: JSONContent
} | null {
  if (!content || content.type !== 'doc' || !Array.isArray(content.content)) return null
  if (content.content.length < 4) return null

  const splitIndex = Math.min(
    content.content.length - 2,
    Math.max(2, Math.ceil(content.content.length * 0.35)),
  )

  const beforeContent = content.content.slice(0, splitIndex)
  const afterContent = content.content.slice(splitIndex)

  if (beforeContent.length === 0 || afterContent.length === 0) return null

  return {
    before: { ...content, content: beforeContent },
    after: { ...content, content: afterContent },
  }
}

interface Props {
  params: Promise<{ slug: string }>
}

function buildCommentTree(
  comments: Array<{
    id: string
    post_id: string
    user_id: string
    parent_id: string | null
    author_name: string
    author_avatar_url: string | null
    author_ilgan: string | null
    body: string
    is_deleted: boolean
    created_at: string
    updated_at: string
  }>,
  likedCommentIds: Set<string>,
  likeCountMap: Map<string, number>,
): CommentNode[] {
  const nodes = comments.map((comment) => ({
    ...comment,
    like_count: likeCountMap.get(comment.id) ?? 0,
    liked_by_me: likedCommentIds.has(comment.id),
    replies: [] as CommentNode[],
  }))

  const nodeMap = new Map(nodes.map((node) => [node.id, node]))
  const roots: CommentNode[] = []

  for (const node of nodes) {
    if (node.parent_id) {
      const parent = nodeMap.get(node.parent_id)
      if (parent) {
        parent.replies.push(node)
        continue
      }
    }

    roots.push(node)
  }

  roots.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
  for (const root of roots) {
    root.replies.sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
  }

  return roots
}

type MatchedResult = {
  name: string
  groupIndex: number
  detail: JSONContent | null
}

function buildJudgmentUserDataFromCalculated(result: SajuResult): JudgmentUserData {
  const oh = result.ohang_data.scores
  const ss = result.sipsung_data.scores

  return {
    year_cheongan: result.year_cheongan,
    year_jiji: result.year_jiji,
    month_cheongan: result.month_cheongan,
    month_jiji: result.month_jiji,
    day_cheongan: result.day_cheongan,
    day_jiji: result.day_jiji,
    hour_cheongan: result.hour_cheongan,
    hour_jiji: result.hour_jiji,
    year_ganji: result.year_ganji,
    month_ganji: result.month_ganji,
    day_ganji: result.day_ganji,
    hour_ganji: result.hour_ganji,
    ilgan: result.ilgan,
    mok_score: oh['목'],
    hwa_score: oh['화'],
    to_score: oh['토'],
    geum_score: oh['금'],
    su_score: oh['수'],
    has_mok: result.has_mok,
    has_hwa: result.has_hwa,
    has_to: result.has_to,
    has_geum: result.has_geum,
    has_su: result.has_su,
    bigyeon_score: ss['비견'],
    gyeopjae_score: ss['겁재'],
    sikshin_score: ss['식신'],
    sanggwan_score: ss['상관'],
    pyeonjae_score: ss['편재'],
    jeongjae_score: ss['정재'],
    pyeongwan_score: ss['편관'],
    jeonggwan_score: ss['정관'],
    pyeonin_score: ss['편인'],
    jeongin_score: ss['정인'],
    has_bigyeon: result.has_bigyeon,
    has_gyeopjae: result.has_geopjae,
    has_sikshin: result.has_sikshin,
    has_sanggwan: result.has_sangwan,
    has_pyeonjae: result.has_pyeonjae,
    has_jeongjae: result.has_jeongjae,
    has_pyeongwan: result.has_pyeongwan,
    has_jeonggwan: result.has_jeongwan,
    has_pyeonin: result.has_pyeonin,
    has_jeongin: result.has_jeongin,
    full_saju_data: result.full_saju_data,
  }
}

/**
 * 글의 "누가 봐도 똑같은" 필드만 조회 — 로그인 여부와 무관하므로 캐시 가능.
 * service-role 클라이언트를 써서 쿠키(요청별 동적 값)에 의존하지 않게 하고,
 * 공개 노출 조건(is_published + 발행시각)은 쿼리에서 그대로 명시적으로 재현한다.
 */
async function getPublicPost(slug: string) {
  'use cache'

  const nowIso = new Date().toISOString()
  const { data: post } = await applyPublishedVisibilityFilter(
    supabaseAdmin
      .from('posts')
      .select('id, slug, title, summary, content, thumbnail_url, category, published_at, updated_at, target_year, judgment_rules, judgment_detail, view_count, like_count, tags')
      .eq('slug', slug)
      .eq('is_published', true)
      .single(),
    nowIso,
  )

  return post
}

export async function generateMetadata({ params }: Props) {
  const { slug: rawSlug } = await params
  const slug = decodeSlug(rawSlug)
  const data = await getPublicPost(slug)

  if (!data) return {}

  const canonicalPath = `/posts/${data.slug}`
  const description = buildSeoDescription(
    data.summary,
    `${data.title}에 대한 사주 해석과 블로그 글을 확인해보세요.`,
  )
  const image = data.thumbnail_url ?? undefined

  return {
    title: data.title,
    description,
    keywords: data.tags?.length ? data.tags.join(', ') : undefined,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: `${data.title} | ${SITE_NAME}`,
      description,
      url: buildAbsoluteUrl(canonicalPath),
      type: 'article',
      publishedTime: data.published_at ?? undefined,
      modifiedTime: data.updated_at ?? undefined,
      section: data.category ?? undefined,
      tags: data.tags ?? undefined,
      images: image ? [{ url: image, alt: data.title }] : undefined,
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title: `${data.title} | ${SITE_NAME}`,
      description,
      images: image ? [image] : undefined,
    },
  }
}

type PublicPost = NonNullable<Awaited<ReturnType<typeof getPublicPost>>>

/**
 * 로그인 여부·회원 등급·판정 결과·좋아요·댓글처럼 사람마다 달라지는 부분을 전부 묶은 동적 블록.
 * 기존 페이지 컴포넌트에 있던 로직/실행 순서를 그대로 유지 — 조회수 증가도 여기서 매 요청 실행된다.
 */
async function PostPersonalizedSection({ post }: { post: PublicPost }) {
  const supabase = await createClient()

  await supabase.rpc('increment_post_view_count', { p_post_id: post.id })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const [settingsRes, profileRes, sajuStatusRes] = await Promise.all([
    supabase
      .from('site_settings')
      .select('grade_separation_enabled, ilgan_avatar_urls')
      .eq('id', 1)
      .maybeSingle(),
    isLoggedIn
      ? supabase.from('users').select('role, nickname, is_admin').eq('id', user!.id).maybeSingle()
      : Promise.resolve({ data: null }),
    isLoggedIn
      ? supabase.from('user_saju').select('user_id').eq('user_id', user!.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const gradeSeparationEnabled = settingsRes.data?.grade_separation_enabled ?? false
  const ilganAvatarMap = sanitizeIlganAvatarMap(settingsRes.data?.ilgan_avatar_urls)
  const role = profileRes.data?.role ?? 'free'
  const hasSavedSaju = Boolean(sajuStatusRes.data)
  const displayName = profileRes.data?.nickname?.trim() || '회원'
  const displayNameWithHonorific = displayName.endsWith('님') ? displayName : `${displayName}님`

  let canSeeJudgment = false
  if (isLoggedIn) {
    if (!gradeSeparationEnabled) {
      canSeeJudgment = true
    } else {
      canSeeJudgment = Boolean(profileRes.data?.is_admin) || role === 'plus' || role === 'premium'
    }
  }

  let hasJudgmentTarget = false
  const matchedResults: MatchedResult[] = []

  if (canSeeJudgment && post.judgment_rules) {
    const rules = post.judgment_rules as unknown as JudgmentRules
    const [sajuRes, ohangRes, sipsungRes, compatibilitySajuRes] = await Promise.all([
      supabase
        .from('user_saju')
        .select('saju_name,year_cheongan,year_jiji,month_cheongan,month_jiji,day_cheongan,day_jiji,hour_cheongan,hour_jiji,year_ganji,month_ganji,day_ganji,hour_ganji,ilgan,full_saju_data')
        .eq('user_id', user!.id)
        .single(),
      supabase
        .from('user_saju_ohang')
        .select('mok_score,hwa_score,to_score,geum_score,su_score,has_mok,has_hwa,has_to,has_geum,has_su')
        .eq('user_id', user!.id)
        .single(),
      supabase
        .from('user_saju_sipsung')
        .select('bigyeon_score,gyeopjae_score,sikshin_score,sanggwan_score,pyeonjae_score,jeongjae_score,pyeongwan_score,jeonggwan_score,pyeonin_score,jeongin_score,has_bigyeon,has_gyeopjae,has_sikshin,has_sanggwan,has_pyeonjae,has_jeongjae,has_pyeongwan,has_jeonggwan,has_pyeonin,has_jeongin')
        .eq('user_id', user!.id)
        .single(),
      supabase
        .from('user_compatibility_saju')
        .select('id, nickname, birth_year, birth_month, birth_day, birth_hour, birth_minute, gender, is_lunar')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: true }),
    ])

    if (sajuRes.data && ohangRes.data && sipsungRes.data) {
      hasJudgmentTarget = true

      const userData: JudgmentUserData = {
        ...sajuRes.data,
        ...ohangRes.data,
        ...sipsungRes.data,
        full_saju_data: sajuRes.data.full_saju_data as Record<string, unknown>,
      } as unknown as JudgmentUserData

      const evaluation = evaluateJudgment(rules, userData, post.target_year)

      if (evaluation.result && evaluation.matchedGroup) {
        matchedResults.push({
          name: displayNameWithHonorific,
          groupIndex: rules.groups.findIndex((g) => g === evaluation.matchedGroup),
          detail:
            (evaluation.matchedGroup.detail as JSONContent | null | undefined) ??
            (post.judgment_detail as JSONContent | null),
        })
      }
    }

    for (const entry of compatibilitySajuRes.data ?? []) {
      hasJudgmentTarget = true

      try {
        const result = calculateSaju({
          birth_year: entry.birth_year,
          birth_month: entry.birth_month,
          birth_day: entry.birth_day,
          birth_hour: entry.birth_hour ?? null,
          birth_minute: entry.birth_minute ?? null,
          gender: (entry.gender as Gender) ?? 'male',
          is_lunar: entry.is_lunar ?? false,
        })

        const evaluation = evaluateJudgment(
          rules,
          buildJudgmentUserDataFromCalculated(result),
          post.target_year,
        )

        if (evaluation.result && evaluation.matchedGroup) {
          const name = entry.nickname?.trim() || '저장된 만세력'
          const nameWithHonorific = name.endsWith('님') ? name : `${name}님`
          matchedResults.push({
            name: nameWithHonorific,
            groupIndex: rules.groups.findIndex((g) => g === evaluation.matchedGroup),
            detail:
              (evaluation.matchedGroup.detail as JSONContent | null | undefined) ??
              (post.judgment_detail as JSONContent | null),
          })
        }
      } catch (error) {
        console.error('[PostDetailPage][compatibility judgment calculation]', {
          entryId: entry.id,
          error,
        })
      }
    }
  }

  // 판정 그룹별로 묶어서 표시 (다른 그룹 해당자는 별도 블록)
  const groupedMatches = new Map<number, { names: string[]; detail: JSONContent | null }>()
  for (const match of matchedResults) {
    const existing = groupedMatches.get(match.groupIndex)
    if (existing) {
      existing.names.push(match.name)
    } else {
      groupedMatches.set(match.groupIndex, { names: [match.name], detail: match.detail })
    }
  }

  const showTopJudgmentNotice = hasJudgmentTarget && matchedResults.length > 0
  const ctaMode = !isLoggedIn ? 'login' : !hasSavedSaju ? 'saju' : null
  const inlineGuestSplit = ctaMode ? splitContentForInlineGuestCta(post.content as JSONContent) : null

  const { data: commentRows } = await supabase
    .from('post_comments')
    .select('id, post_id, user_id, parent_id, author_name, author_avatar_url, author_ilgan, body, is_deleted, created_at, updated_at')
    .eq('post_id', post.id)
    .order('created_at', { ascending: true })

  const commentIds = commentRows?.map((comment) => comment.id) ?? []
  let comments: CommentNode[] = []
  let likedByMe = false

  if (user) {
    const { data: likeRow } = await supabase
      .from('post_likes')
      .select('post_id')
      .eq('post_id', post.id)
      .eq('user_id', user.id)
      .maybeSingle()

    likedByMe = !!likeRow
  }

  if (commentRows && commentRows.length > 0) {
    const { data: likeRows } = await supabase
      .from('post_comment_likes')
      .select('comment_id, user_id')
      .in('comment_id', commentIds)

    const likeCountMap = new Map<string, number>()
    const likedCommentIds = new Set<string>()

    for (const like of likeRows ?? []) {
      likeCountMap.set(like.comment_id, (likeCountMap.get(like.comment_id) ?? 0) + 1)
      if (user && like.user_id === user.id) likedCommentIds.add(like.comment_id)
    }

    comments = buildCommentTree(commentRows, likedCommentIds, likeCountMap)
  }

  return (
    <>
      <div className="flex flex-col gap-12 lg:flex-row">
        <article className="w-full lg:w-[60%]">
          {ctaMode ? (
            <div className="mb-8">
              <GuestCTA mode={ctaMode} />
            </div>
          ) : null}

          {showTopJudgmentNotice && (
            <div className="mb-8 flex flex-col gap-3">
              {Array.from(groupedMatches.entries()).map(([groupIndex, { names, detail }]) => (
                <div key={groupIndex} className="rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-center">
                  <p className="text-sm font-semibold leading-6 text-sky-900">
                    {names.length === 1
                      ? `${names[0]}은 이 글에 해당하는 사주를 갖고 계십니다.`
                      : '내 만세력/저장된 만세력 중 이 글에 해당하는 사람이 있습니다.'}
                    <br />
                    자세히 읽어보세요!
                  </p>
                  {names.length > 1 && (
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      {names.map((name, index) => (
                        <span
                          key={`matched-${groupIndex}-${name}-${index}`}
                          className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-100"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                  {detail && (
                    <div className="mt-4 border-t border-sky-200/70 pt-4">
                      <div className="prose prose-sm mx-auto max-w-2xl text-center prose-p:my-0 prose-p:text-[15px] prose-p:leading-7 prose-p:text-sky-900 prose-strong:text-sky-950 prose-underline:text-sky-950 prose-headings:text-sky-950 prose-a:text-sky-700">
                        <TiptapRenderer content={detail} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {inlineGuestSplit ? (
            <>
              <div className="prose prose-gray max-w-none">
                <TiptapRenderer content={inlineGuestSplit.before} />
              </div>

              <div className="my-10">
                <GuestCTA variant="inline" mode={ctaMode ?? 'login'} />
              </div>

              <div className="prose prose-gray max-w-none">
                <TiptapRenderer content={inlineGuestSplit.after} />
              </div>
            </>
          ) : (
            <div className="prose prose-gray max-w-none">
              <TiptapRenderer content={post.content as JSONContent} />
            </div>
          )}

        </article>

        <aside className="w-full shrink-0 lg:w-[40%] lg:max-w-sm">
          <div className="sticky top-20 flex flex-col gap-6">
            {isLoggedIn && gradeSeparationEnabled && role === 'free' ? (
              post.judgment_rules ? <GradeCTA /> : null
            ) : null}
          </div>
        </aside>
      </div>

      <PostEngagementBar
        postId={post.id}
        title={post.title}
        summary={post.summary}
        thumbnailUrl={post.thumbnail_url ?? null}
        initialLikeCount={post.like_count ?? 0}
        initialLikedByMe={likedByMe}
        isLoggedIn={isLoggedIn}
      />

      <CommentsSection
        postId={post.id}
        comments={comments}
        currentUserId={user?.id ?? null}
        isLoggedIn={isLoggedIn}
        ilganAvatarMap={ilganAvatarMap}
      />
    </>
  )
}

function PostPersonalizedFallback({ post }: { post: PublicPost }) {
  return (
    <div className="flex flex-col gap-12 lg:flex-row">
      <article className="w-full animate-pulse lg:w-[60%]">
        <div className="prose prose-gray max-w-none">
          <TiptapRenderer content={post.content as JSONContent} />
        </div>
      </article>
      <aside className="w-full shrink-0 lg:w-[40%] lg:max-w-sm" />
    </div>
  )
}

export default async function PostDetailPage({ params }: Props) {
  const { slug: rawSlug } = await params
  const slug = decodeSlug(rawSlug)
  const post = await getPublicPost(slug)

  if (!post) notFound()

  const postDescription = buildSeoDescription(
    post.summary,
    `${post.title}에 대한 사주 해석과 블로그 글입니다.`,
  )
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: postDescription,
    image: post.thumbnail_url ? [post.thumbnail_url] : undefined,
    datePublished: post.published_at ?? undefined,
    dateModified: post.updated_at ?? post.published_at ?? undefined,
    mainEntityOfPage: buildAbsoluteUrl(`/posts/${post.slug}`),
    author: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
    },
    articleSection: post.category,
    keywords: post.tags?.join(', ') || undefined,
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="mb-6 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
          {post.category}
        </span>
        {post.target_year && (
          <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
            {post.target_year}년 기준
          </span>
        )}
      </div>

      <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight md:text-4xl">
        {post.title}
      </h1>

      <div className="mb-10 flex items-center gap-3 border-b border-gray-100 pb-6">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
          문
        </div>
        <span className="text-sm text-gray-500">
          사주로아의 사주이야기
          {post.published_at && ` · ${formatDate(post.published_at)}`}
        </span>
      </div>

      <Suspense fallback={<PostPersonalizedFallback post={post} />}>
        <PostPersonalizedSection post={post} />
      </Suspense>
    </div>
  )
}
