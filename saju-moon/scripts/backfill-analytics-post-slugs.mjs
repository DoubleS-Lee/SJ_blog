import fs from 'node:fs'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'

function loadEnvFile(envPath) {
  if (!fs.existsSync(envPath)) return

  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (!match) continue
    const [, key, value] = match
    if (!process.env[key]) {
      process.env[key] = value
    }
  }
}

function isSuspiciousSlug(value) {
  return typeof value === 'string' && (value.includes('%') || value.length >= 180)
}

function buildEncodedSlug(slug) {
  return encodeURIComponent(slug)
}

function findMatchingPosts(posts, rawSlug) {
  const decodedSlug = (() => {
    try {
      return decodeURIComponent(rawSlug)
    } catch {
      return rawSlug
    }
  })()

  const matches = posts.filter((post) => {
    const encodedSlug = buildEncodedSlug(post.slug)
    return (
      post.slug === rawSlug ||
      post.slug === decodedSlug ||
      encodedSlug === rawSlug ||
      encodedSlug.startsWith(rawSlug) ||
      rawSlug.startsWith(post.slug)
    )
  })

  const unique = new Map(matches.map((post) => [post.id, post]))
  return Array.from(unique.values())
}

async function main() {
  const rootDir = path.resolve(process.cwd())
  loadEnvFile(path.join(rootDir, '.env.local'))

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase environment variables.')
  }

  const dryRun = process.argv.includes('--dry-run')

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const [{ data: posts, error: postsError }, { data: dailyRows, error: dailyError }] = await Promise.all([
    supabase.from('posts').select('id, slug, title, category'),
    supabase
      .from('analytics_daily_post')
      .select('metric_date, slug, title, category, views, likes, total_engagement_ms, engagement_events, landing_sessions, visitors, engaged_sessions')
      .order('metric_date', { ascending: true }),
  ])

  if (postsError) throw postsError
  if (dailyError) throw dailyError

  const suspiciousRows = (dailyRows ?? []).filter((row) => isSuspiciousSlug(row.slug))
  const postList = posts ?? []

  let updatedDailyRows = 0
  let mergedDailyRows = 0
  let updatedEventRows = 0
  let skippedRows = 0

  for (const row of suspiciousRows) {
    const matches = findMatchingPosts(postList, row.slug)

    if (matches.length !== 1) {
      skippedRows += 1
      console.log(`[skip] ${row.metric_date} ${row.slug} -> matches=${matches.length}`)
      continue
    }

    const match = matches[0]

    if (dryRun) {
      console.log(`[dry-run] ${row.metric_date} ${row.slug} -> ${match.slug}`)
      continue
    }

    if (row.slug === match.slug) {
      const { error: updateSameSlugError } = await supabase
        .from('analytics_daily_post')
        .update({
          title: match.title,
          category: match.category,
        })
        .eq('metric_date', row.metric_date)
        .eq('slug', row.slug)

      if (updateSameSlugError) throw updateSameSlugError
      updatedDailyRows += 1
    } else {
      const { data: existingTargetRow, error: existingTargetError } = await supabase
        .from('analytics_daily_post')
        .select('metric_date, slug, title, category, views, likes, total_engagement_ms, engagement_events, landing_sessions, visitors, engaged_sessions')
        .eq('metric_date', row.metric_date)
        .eq('slug', match.slug)
        .maybeSingle()

      if (existingTargetError) throw existingTargetError

      if (existingTargetRow) {
        const { error: mergeError } = await supabase
          .from('analytics_daily_post')
          .update({
            title: match.title,
            category: match.category,
            views: existingTargetRow.views + row.views,
            likes: existingTargetRow.likes + row.likes,
            total_engagement_ms: existingTargetRow.total_engagement_ms + row.total_engagement_ms,
            engagement_events: existingTargetRow.engagement_events + row.engagement_events,
            landing_sessions: existingTargetRow.landing_sessions + row.landing_sessions,
            visitors: existingTargetRow.visitors + row.visitors,
            engaged_sessions: existingTargetRow.engaged_sessions + row.engaged_sessions,
          })
          .eq('metric_date', row.metric_date)
          .eq('slug', match.slug)

        if (mergeError) throw mergeError

        const { error: deleteError } = await supabase
          .from('analytics_daily_post')
          .delete()
          .eq('metric_date', row.metric_date)
          .eq('slug', row.slug)

        if (deleteError) throw deleteError
        mergedDailyRows += 1
      } else {
        const { error: updateSlugError } = await supabase
          .from('analytics_daily_post')
          .update({
            slug: match.slug,
            title: match.title,
            category: match.category,
          })
          .eq('metric_date', row.metric_date)
          .eq('slug', row.slug)

        if (updateSlugError) throw updateSlugError
        updatedDailyRows += 1
      }
    }

    const eventMatchFilters = [
      ['content_id', row.slug],
      ['landing_post_slug', row.slug],
    ]

    for (const [column, oldValue] of eventMatchFilters) {
      const { data: eventRows, error: eventRowsError } = await supabase
        .from('analytics_events')
        .select('id')
        .eq(column, oldValue)

      if (eventRowsError) throw eventRowsError
      if (!eventRows || eventRows.length === 0) continue

      const payload = {
        [column]: match.slug,
        content_title: match.title,
        category: match.category,
      }

      const { error: updateEventsError } = await supabase
        .from('analytics_events')
        .update(payload)
        .eq(column, oldValue)

      if (updateEventsError) throw updateEventsError
      updatedEventRows += eventRows.length
    }

    console.log(`[fixed] ${row.metric_date} ${row.slug} -> ${match.slug}`)
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        suspiciousRows: suspiciousRows.length,
        updatedDailyRows,
        mergedDailyRows,
        updatedEventRows,
        skippedRows,
      },
      null,
      2,
    ),
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
