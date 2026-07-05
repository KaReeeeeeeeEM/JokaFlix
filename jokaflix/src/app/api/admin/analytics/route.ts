import { NextResponse } from "next/server";
import { getAdminUser } from "../../../../lib/admin";
import { adminDurationCondition, adminDurationLabel, adminDurationSeriesStart, sanitizeAdminDuration } from "../../../../lib/admin-duration";
import { ensureAppSchemaOnce, query } from "../../../../lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type CountRow = {
  count: string;
};

type StatRow = Record<string, string | number | null>;

function toNumber(value: unknown) {
  return Number(value || 0);
}

export async function GET(request: Request) {
  await ensureAppSchemaOnce();
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const url = new URL(request.url);
  const duration = sanitizeAdminDuration(url.searchParams.get("duration"));
  const eventPeriod = adminDurationCondition("created_at", duration);
  const aliasedEventPeriod = adminDurationCondition("e.created_at", duration);
  const userPeriod = adminDurationCondition(`"createdAt"`, duration);
  const aliasedUserPeriod = adminDurationCondition(`u."createdAt"`, duration);
  const seriesStart = adminDurationSeriesStart(duration);

  const [
    clicksToday,
    activeToday,
    totalUsers,
    registeredToday,
    totals30Days,
    topMovies,
    topSeries,
    clickTrend,
    weeklyTrend,
    bestCategories,
    leaderboard,
    activeUsers,
    mediaSplit,
    engagementSplit,
    newUsersTrend,
    userDirectory,
    reportHistory,
    reportTemplates,
    auditLogs,
    auditHeatmap,
    recentActivity,
  ] = await Promise.all([
    query<CountRow>(`select count(*)::text as count from analytics_events where event_type = 'movie_click' and ${eventPeriod}`),
    query<CountRow>(`select count(distinct coalesce(user_id, visitor_id))::text as count from analytics_events where ${eventPeriod}`),
    query<CountRow>(`select count(*)::text as count from "user"`),
    query<CountRow>(`select count(*)::text as count from "user" where ${userPeriod}`),
    query<StatRow>(`
      select
        count(*)::int as clicks,
        count(*) filter (where media_type = 'movie')::int as movie_clicks,
        count(*) filter (where media_type = 'tv')::int as series_clicks,
        count(distinct coalesce(user_id, visitor_id))::int as active_users,
        count(distinct tmdb_id) filter (where media_type = 'movie')::int as movies_touched,
        count(distinct tmdb_id) filter (where media_type = 'tv')::int as series_touched
      from analytics_events
      where event_type = 'movie_click'
        and ${eventPeriod}
    `),
    query<StatRow>(`
      select
        coalesce(title, 'Untitled') as title,
        'movie' as media_type,
        tmdb_id,
        count(*)::int as clicks
      from analytics_events
      where event_type = 'movie_click'
        and media_type = 'movie'
        and ${eventPeriod}
      group by title, tmdb_id
      order by clicks desc, title asc
      limit 10
    `),
    query<StatRow>(`
      select
        coalesce(title, 'Untitled') as title,
        'tv' as media_type,
        tmdb_id,
        count(*)::int as clicks
      from analytics_events
      where event_type = 'movie_click'
        and media_type = 'tv'
        and ${eventPeriod}
      group by title, tmdb_id
      order by clicks desc, title asc
      limit 10
    `),
    query<StatRow>(`
      select
        to_char(hour_bucket, 'HH24:00') as label,
        coalesce(count(e.id), 0)::int as clicks
      from generate_series(date_trunc('day', now()), date_trunc('hour', now()), interval '1 hour') as hour_bucket
      left join analytics_events e
        on e.created_at >= hour_bucket
        and e.created_at < hour_bucket + interval '1 hour'
        and e.event_type = 'movie_click'
        and ${aliasedEventPeriod}
      group by hour_bucket
      order by hour_bucket
    `),
    query<StatRow>(`
      select
        to_char(day_bucket, 'Mon DD') as day,
        coalesce(count(e.id) filter (where e.media_type = 'movie'), 0)::int as movies,
        coalesce(count(e.id) filter (where e.media_type = 'tv'), 0)::int as series,
        coalesce(count(e.id), 0)::int as clicks,
        coalesce(count(distinct coalesce(e.user_id, e.visitor_id)), 0)::int as users
      from generate_series(${seriesStart}, date_trunc('day', now()), interval '1 day') as day_bucket
      left join analytics_events e
        on e.created_at >= day_bucket
        and e.created_at < day_bucket + interval '1 day'
        and e.event_type = 'movie_click'
        and ${aliasedEventPeriod}
      group by day_bucket
      order by day_bucket
    `),
    query<StatRow>(`
      select coalesce(category, 'Uncategorized') as category, count(*)::int as clicks
      from analytics_events
      where event_type = 'movie_click'
        and ${eventPeriod}
      group by category
      order by clicks desc, category asc
      limit 8
    `),
    query<StatRow>(`
      select
        coalesce(u.username, u.name, u.email, 'Guest ' || right(coalesce(e.visitor_id, 'unknown'), 4)) as label,
        count(*)::int as clicks
      from analytics_events e
      left join "user" u on u.id = e.user_id
      where e.event_type = 'movie_click'
        and ${aliasedEventPeriod}
      group by label
      order by clicks desc, label asc
      limit 10
    `),
    query<StatRow>(`
      select
        to_char(day_bucket, 'Mon DD') as day,
        coalesce(count(distinct coalesce(e.user_id, e.visitor_id)), 0)::int as users
      from generate_series(${seriesStart}, date_trunc('day', now()), interval '1 day') as day_bucket
      left join analytics_events e
        on e.created_at >= day_bucket
        and e.created_at < day_bucket + interval '1 day'
        and ${aliasedEventPeriod}
      group by day_bucket
      order by day_bucket
    `),
    query<StatRow>(`
      select coalesce(media_type, 'other') as name, count(*)::int as value
      from analytics_events
      where event_type = 'movie_click'
        and ${eventPeriod}
      group by media_type
      order by value desc
    `),
    query<StatRow>(`
      select 'Registered users' as name, count(*)::int as value from "user"
      union all
      select $analytics$Active period$analytics$ as name, count(distinct coalesce(user_id, visitor_id))::int as value
      from analytics_events
      where ${eventPeriod}
      union all
      select 'Active today' as name, count(distinct coalesce(user_id, visitor_id))::int as value
      from analytics_events
      where created_at >= date_trunc('day', now())
    `),
    query<StatRow>(`
      select
        to_char(day_bucket, 'Mon DD') as day,
        coalesce(count(u.id), 0)::int as users
      from generate_series(${seriesStart}, date_trunc('day', now()), interval '1 day') as day_bucket
      left join "user" u
        on u."createdAt" >= day_bucket
        and u."createdAt" < day_bucket + interval '1 day'
        and ${aliasedUserPeriod}
      group by day_bucket
      order by day_bucket
    `),
    query<StatRow>(`
      select
        u.id,
        coalesce(u.username, u.name, u.email) as label,
        u.email,
        coalesce(u.role, 'user') as role,
        to_char(u."createdAt", 'Mon DD, YYYY') as joined_at,
        max(e.created_at) as last_seen_at,
        to_char(max(e.created_at), 'Mon DD, HH24:MI') as last_seen,
        count(e.id) filter (where ${aliasedEventPeriod})::int as clicks_30d,
        count(distinct date_trunc('hour', e.created_at)) filter (where ${aliasedEventPeriod})::int as active_hours_30d,
        coalesce((
          select e2.category
          from analytics_events e2
          where e2.user_id = u.id
            and ${adminDurationCondition("e2.created_at", duration)}
          group by e2.category
          order by count(*) desc
          limit 1
        ), 'Unclassified') as favorite_category,
        coalesce((
          select e3.title
          from analytics_events e3
          where e3.user_id = u.id
            and e3.event_type = 'movie_click'
            and e3.title is not null
            and ${adminDurationCondition("e3.created_at", duration)}
          group by e3.title
          order by count(*) desc
          limit 1
        ), 'No clear favorite') as favorite_title
      from "user" u
      left join analytics_events e on e.user_id = u.id
      group by u.id, u.username, u.name, u.email, u.role, u."createdAt"
      order by coalesce(max(e.created_at), u."createdAt") desc
      limit 60
    `),
    query<StatRow>(`
      select
        r.id,
        r.title,
        r.report_type,
        r.format,
        r.row_count::int as row_count,
        coalesce(u.username, u.name, u.email, 'System') as generated_by,
        to_char(r.created_at, 'Mon DD, YYYY HH24:MI') as generated_at,
        coalesce(r.duration, 'last_30_days') as duration,
        coalesce(r.sections, '[]'::jsonb)::text as sections
      from admin_reports r
      left join "user" u on u.id = r.generated_by
      order by r.created_at desc
      limit 80
    `),
    query<StatRow>(`
      select
        t.id,
        t.name,
        coalesce(t.description, '') as description,
        t.report_type,
        t.duration,
        t.sections::text as sections,
        t.fields::text as fields,
        coalesce(t.ai_prompt, '') as ai_prompt,
        t.template_body,
        coalesce(u.username, u.name, u.email, 'System') as created_by,
        to_char(t.updated_at, 'Mon DD, YYYY HH24:MI') as updated_at
      from admin_report_templates t
      left join "user" u on u.id = t.created_by
      order by t.updated_at desc
      limit 80
    `),
    query<StatRow>(`
      select
        e.id,
        e.event_type,
        coalesce(e.media_type, 'platform') as media_type,
        coalesce(e.title, e.pathname, 'Platform event') as target,
        coalesce(e.category, 'Uncategorized') as category,
        coalesce(u.username, u.name, u.email, 'Guest ' || right(coalesce(e.visitor_id, 'unknown'), 4)) as actor,
        coalesce(e.pathname, '/') as pathname,
        to_char(e.created_at, 'Mon DD, YYYY HH24:MI') as happened_at
      from analytics_events e
      left join "user" u on u.id = e.user_id
      order by e.created_at desc
      limit 80
    `),
    query<StatRow>(`
      select
        extract(dow from hour_bucket)::int as dow,
        extract(hour from hour_bucket)::int as hour,
        coalesce(count(e.id), 0)::int as value
      from generate_series(date_trunc('day', now()) - interval '6 days', date_trunc('hour', now()), interval '1 hour') as hour_bucket
      left join analytics_events e
        on e.created_at >= hour_bucket
        and e.created_at < hour_bucket + interval '1 hour'
      group by hour_bucket
      order by hour_bucket
    `),
    query<StatRow>(`
      select
        coalesce(title, 'Untitled') as title,
        coalesce(media_type, 'other') as media_type,
        coalesce(category, 'Uncategorized') as category,
        coalesce(u.username, u.name, u.email, 'Guest ' || right(coalesce(e.visitor_id, 'unknown'), 4)) as user_label,
        to_char(e.created_at, 'Mon DD, HH24:MI') as happened_at
      from analytics_events e
      left join "user" u on u.id = e.user_id
      where e.event_type = 'movie_click'
      order by e.created_at desc
      limit 12
    `),
  ]);

  const totals = totals30Days.rows[0] || {};
  const active30Days = toNumber(totals.active_users);
  const totalClicks30Days = toNumber(totals.clicks);

  return NextResponse.json(
    {
      admin,
      period: {
        duration,
        label: adminDurationLabel(duration),
      },
      summary: {
        clicksToday: toNumber(clicksToday.rows[0]?.count),
        activeToday: toNumber(activeToday.rows[0]?.count),
        totalUsers: toNumber(totalUsers.rows[0]?.count),
        registeredToday: toNumber(registeredToday.rows[0]?.count),
        totalClicks30Days,
        active30Days,
        movieClicks30Days: toNumber(totals.movie_clicks),
        seriesClicks30Days: toNumber(totals.series_clicks),
        moviesTouched30Days: toNumber(totals.movies_touched),
        seriesTouched30Days: toNumber(totals.series_touched),
        clicksPerActiveUser: active30Days > 0 ? Number((totalClicks30Days / active30Days).toFixed(1)) : 0,
      },
      topMovies: topMovies.rows,
      topSeries: topSeries.rows,
      clickTrend: clickTrend.rows,
      weeklyTrend: weeklyTrend.rows,
      bestCategories: bestCategories.rows,
      leaderboard: leaderboard.rows,
      activeUsers: activeUsers.rows,
      mediaSplit: mediaSplit.rows,
      engagementSplit: engagementSplit.rows,
      newUsersTrend: newUsersTrend.rows,
      userDirectory: userDirectory.rows.map((user) => ({
        ...user,
        online: user.last_seen_at ? Date.now() - new Date(String(user.last_seen_at)).getTime() <= 5 * 60 * 1000 : false,
      })),
      reportHistory: reportHistory.rows,
      reportTemplates: reportTemplates.rows,
      auditLogs: auditLogs.rows,
      auditHeatmap: auditHeatmap.rows,
      recentActivity: recentActivity.rows,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
