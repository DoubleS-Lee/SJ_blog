import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GuestCTA from '@/components/blog/GuestCTA'
import GradeCTA from '@/components/blog/GradeCTA'
import CommentsSection from '@/components/blog/CommentsSection'
import TiptapRenderer from '@/components/editor/TiptapRenderer'
import { evaluateJudgment, type JudgmentUserData } from '@/lib/saju/judgment'
import { sanitizeIlganAvatarMap } from '@/lib/saju/ilgan-avatar'
import type { JSONContent } from '@tiptap/react'
import type { CommentNode } from '@/types/comment'
import type { JudgmentRules } from '@/types/judgment'

function formatDate(iso: string | null) {
  if (!iso) return ''

  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
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
    .select('id, slug, title, summary, content, category, published_at, target_year, judgment_rules, judgment_detail')
    .eq('slug', slug)
    .eq('is_published', true)
    .lte('published_at', new Date().toISOString())
    .single()

  if (!post) notFound()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  const isLoggedIn = !!user

  const [settingsRes, profileRes] = await Promise.all([
    supabase
      .from('site_settings')
      .select('grade_separation_enabled, ilgan_avatar_urls')
      .eq('id', 1)
      .maybeSingle(),
    isLoggedIn
      ? supabase.from('users').select('role, nickname').eq('id', user!.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const gradeSeparationEnabled = settingsRes.data?.grade_separation_enabled ?? false
  const ilganAvatarMap = sanitizeIlganAvatarMap(settingsRes.data?.ilgan_avatar_urls)
  const role = profileRes.data?.role ?? 'free'
  const displayName = profileRes.data?.nickname?.trim() || '회원님'

  let canSeeJudgment = false
  if (isLoggedIn) {
    if (!gradeSeparationEnabled) {
      canSeeJudgment = true
    } else {
      canSeeJudgment = role === 'plus' || role === 'premium'
    }
  }

  let judgmentResult: boolean | null = null
  let hasSaju = false
  let matchedDetailContent: JSONContent | null = null

  if (canSeeJudgment && post.judgment_rules) {
    const [sajuRes, ohangRes, sipsungRes] = await Promise.all([
      supabase
        .from('user_saju')
        .select('year_cheongan,year_jiji,month_cheongan,month_jiji,day_cheongan,day_jiji,hour_cheongan,hour_jiji,year_ganji,month_ganji,day_ganji,hour_ganji,ilgan,full_saju_data')
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
    ])

    if (sajuRes.data && ohangRes.data && sipsungRes.data) {
      hasSaju = true

      const userData: JudgmentUserData = {
        ...sajuRes.data,
        ...ohangRes.data,
        ...sipsungRes.data,
        full_saju_data: sajuRes.data.full_saju_data as Record<string, unknown>,
      } as unknown as JudgmentUserData

      const evaluation = evaluateJudgment(
        post.judgment_rules as unknown as JudgmentRules,
        userData,
        post.target_year,
      )

      judgmentResult = evaluation.result
      matchedDetailContent =
        (evaluation.matchedGroup?.detail as JSONContent | null | undefined) ??
        (post.judgment_detail as JSONContent | null)
    }
  }
  const showTopJudgmentNotice = hasSaju && judgmentResult === true
  const showBottomJudgmentDetail = showTopJudgmentNotice && !!matchedDetailContent

  const { data: commentRows } = await supabase
    .from('post_comments')
    .select('id, post_id, user_id, parent_id, author_name, author_avatar_url, author_ilgan, body, is_deleted, created_at, updated_at')
    .eq('post_id', post.id)
    .order('created_at', { ascending: true })

  const commentIds = commentRows?.map((comment) => comment.id) ?? []
  let comments: CommentNode[] = []

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
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-col gap-12 lg:flex-row">
        <article className="w-full lg:w-[60%]">
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
              사주 Moon
              {post.published_at && ` · ${formatDate(post.published_at)}`}
            </span>
          </div>

          {showTopJudgmentNotice && (
            <div className="mb-8 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4">
              <p className="text-sm font-semibold leading-6 text-sky-900">
                {displayName}은 이 글에 해당하는 사주를 갖고 계십니다.
                <br />
                자세히 읽어보세요!
              </p>
            </div>
          )}

          <div className="prose prose-gray max-w-none">
            <TiptapRenderer content={post.content as JSONContent} />
          </div>

          {showBottomJudgmentDetail && (
            <section className="mt-10 rounded-3xl border border-sky-100 bg-sky-50/80 px-6 py-6">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-500">
                  Matching Note
                </p>
                <h2 className="mt-2 text-xl font-bold tracking-tight text-sky-950">
                  회원님께 더 와닿는 해설
                </h2>
              </div>
              <div className="prose prose-gray max-w-none prose-headings:text-sky-950">
                <TiptapRenderer content={matchedDetailContent} />
              </div>
            </section>
          )}
        </article>

        <aside className="w-full shrink-0 lg:w-[40%] lg:max-w-sm">
          <div className="sticky top-20 flex flex-col gap-6">
            {!isLoggedIn ? (
              <GuestCTA />
            ) : gradeSeparationEnabled && role === 'free' ? (
              post.judgment_rules ? <GradeCTA /> : null
            ) : null}
          </div>
        </aside>
      </div>

      <CommentsSection
        postId={post.id}
        comments={comments}
        currentUserId={user?.id ?? null}
        isLoggedIn={isLoggedIn}
        ilganAvatarMap={ilganAvatarMap}
      />
    </div>
  )
}
