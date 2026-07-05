import { NextResponse } from "next/server";
import { getAdminUser } from "../../../../../lib/admin";
import { ensureAppSchemaOnce, query } from "../../../../../lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StatRow = Record<string, string | number | boolean | null>;

function toNumber(value: unknown) {
  return Number(value || 0);
}

function behaviorTags(stats: StatRow) {
  const clicks = toNumber(stats.clicks_30d);
  const activeHours = toNumber(stats.active_hours_30d);
  const movieShare = toNumber(stats.movie_clicks_30d);
  const seriesShare = toNumber(stats.series_clicks_30d);
  const tags = [];

  if (clicks >= 50) tags.push("Power watcher");
  else if (clicks >= 15) tags.push("Regular explorer");
  else tags.push("Light viewer");

  if (activeHours >= 20) tags.push("Always-on");
  if (movieShare > seriesShare * 1.5) tags.push("Movie-first");
  if (seriesShare > movieShare * 1.5) tags.push("Series loyalist");
  if (toNumber(stats.distinct_categories_30d) >= 5) tags.push("Genre hopper");
  return tags;
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await ensureAppSchemaOnce();
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const { id } = await context.params;
  const [profile, stats, activityTrend, mediaMix, categoryMix, topTitles, recentEvents] = await Promise.all([
    query<StatRow>(
      `
        select
          id,
          coalesce(username, name, email) as label,
          email,
          name,
          username,
          coalesce(role, 'user') as role,
          to_char("createdAt", 'Mon DD, YYYY') as joined_at
        from "user"
        where id = $1
      `,
      [id]
    ),
    query<StatRow>(
      `
        select
          count(e.id) filter (where e.created_at >= now() - interval '30 days')::int as clicks_30d,
          count(e.id) filter (where e.media_type = 'movie' and e.created_at >= now() - interval '30 days')::int as movie_clicks_30d,
          count(e.id) filter (where e.media_type = 'tv' and e.created_at >= now() - interval '30 days')::int as series_clicks_30d,
          count(distinct date_trunc('hour', e.created_at)) filter (where e.created_at >= now() - interval '30 days')::int as active_hours_30d,
          count(distinct e.category) filter (where e.created_at >= now() - interval '30 days')::int as distinct_categories_30d,
          max(e.created_at) as last_seen_at,
          to_char(max(e.created_at), 'Mon DD, HH24:MI') as last_seen
        from analytics_events e
        where e.user_id = $1
      `,
      [id]
    ),
    query<StatRow>(
      `
        select
          to_char(day_bucket, 'Mon DD') as day,
          coalesce(count(e.id), 0)::int as clicks,
          coalesce(count(distinct date_trunc('hour', e.created_at)), 0)::int as active_hours
        from generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day') as day_bucket
        left join analytics_events e
          on e.user_id = $1
          and e.created_at >= day_bucket
          and e.created_at < day_bucket + interval '1 day'
        group by day_bucket
        order by day_bucket
      `,
      [id]
    ),
    query<StatRow>(
      `
        select coalesce(media_type, 'other') as name, count(*)::int as value
        from analytics_events
        where user_id = $1
          and created_at >= now() - interval '30 days'
        group by media_type
        order by value desc
      `,
      [id]
    ),
    query<StatRow>(
      `
        select coalesce(category, 'Uncategorized') as category, count(*)::int as clicks
        from analytics_events
        where user_id = $1
          and created_at >= now() - interval '30 days'
        group by category
        order by clicks desc, category asc
        limit 8
      `,
      [id]
    ),
    query<StatRow>(
      `
        select coalesce(title, 'Untitled') as title, coalesce(media_type, 'other') as media_type, count(*)::int as clicks
        from analytics_events
        where user_id = $1
          and event_type = 'movie_click'
          and created_at >= now() - interval '30 days'
        group by title, media_type
        order by clicks desc, title asc
        limit 10
      `,
      [id]
    ),
    query<StatRow>(
      `
        select
          id,
          event_type,
          coalesce(title, pathname, 'Platform event') as target,
          coalesce(category, 'Uncategorized') as category,
          coalesce(media_type, 'platform') as media_type,
          to_char(created_at, 'Mon DD, YYYY HH24:MI') as happened_at
        from analytics_events
        where user_id = $1
        order by created_at desc
        limit 20
      `,
      [id]
    ),
  ]);

  const profileRow = profile.rows[0];
  if (!profileRow) {
    return NextResponse.json({ error: "User not found" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const statRow = stats.rows[0] || {};
  return NextResponse.json(
    {
      profile: profileRow,
      stats: {
        ...statRow,
        online: statRow.last_seen_at ? Date.now() - new Date(String(statRow.last_seen_at)).getTime() <= 5 * 60 * 1000 : false,
        behaviorTags: behaviorTags(statRow),
      },
      activityTrend: activityTrend.rows,
      mediaMix: mediaMix.rows,
      categoryMix: categoryMix.rows,
      topTitles: topTitles.rows,
      recentEvents: recentEvents.rows,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
