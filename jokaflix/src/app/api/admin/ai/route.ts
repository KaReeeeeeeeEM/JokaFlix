import { NextResponse } from "next/server";
import { getAdminUser } from "../../../../lib/admin";
import { AdminDuration, adminDurationCondition, adminDurationLabel, adminDurationSeriesStart, sanitizeAdminDuration } from "../../../../lib/admin-duration";
import { ensureAppSchemaOnce, query } from "../../../../lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type StatRow = Record<string, string | number | null>;

function toNumber(value: unknown) {
  return Number(value || 0);
}

function safeQuestion(value: unknown) {
  return typeof value === "string" ? value.trim().slice(0, 700) : "";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function streamText(text: string) {
  const encoder = new TextEncoder();

  return new Response(
    new ReadableStream({
      async start(controller) {
        const chunks = text.match(/\S+\s*/g) || [text];
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
          await sleep(18);
        }
        controller.close();
      },
    }),
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "text/plain; charset=utf-8",
      },
    }
  );
}

function listTop(items: StatRow[], labelKey = "title") {
  if (!items.length) return "none yet";
  return items.slice(0, 5).map((item) => `${item[labelKey] || "Untitled"} (${toNumber(item.clicks)} clicks)`).join(", ");
}

function listCategories(items: StatRow[]) {
  if (!items.length) return "none yet";
  return items.slice(0, 5).map((item) => `${item.category || "Uncategorized"} (${toNumber(item.clicks)} clicks)`).join(", ");
}

function listUsers(items: StatRow[]) {
  if (!items.length) return "none yet";
  return items.slice(0, 5).map((item) => `${item.label || "Guest"} (${toNumber(item.clicks)} clicks)`).join(", ");
}

async function buildSnapshot(duration: AdminDuration) {
  const eventPeriod = adminDurationCondition("created_at", duration);
  const aliasedEventPeriod = adminDurationCondition("e.created_at", duration);
  const userPeriod = adminDurationCondition(`"createdAt"`, duration);
  const seriesStart = adminDurationSeriesStart(duration);

  const [
    summary,
    topMovies,
    topSeries,
    todayTopMovies,
    todayTopSeries,
    bestCategories,
    leaderboard,
    onlineUsers,
    activeUsers,
    recentActivity,
    reportHistory,
    reportTemplates,
  ] = await Promise.all([
    query<StatRow>(`
      select
        (select count(*) from "user")::int as total_users,
        (select count(*) from "user" where ${userPeriod})::int as new_users_period,
        (select count(*) from "user" where "createdAt" >= date_trunc('day', now()))::int as new_users_today,
        count(*) filter (where event_type = 'movie_click' and ${eventPeriod})::int as clicks_period,
        count(*) filter (where event_type = 'movie_click' and media_type = 'movie' and ${eventPeriod})::int as movie_clicks_period,
        count(*) filter (where event_type = 'movie_click' and media_type = 'tv' and ${eventPeriod})::int as series_clicks_period,
        count(distinct coalesce(user_id, visitor_id)) filter (where ${eventPeriod})::int as active_period,
        count(*) filter (where event_type = 'movie_click' and created_at >= date_trunc('day', now()))::int as clicks_today,
        count(*) filter (where event_type = 'movie_click' and media_type = 'movie' and created_at >= date_trunc('day', now()))::int as movie_clicks_today,
        count(*) filter (where event_type = 'movie_click' and media_type = 'tv' and created_at >= date_trunc('day', now()))::int as series_clicks_today,
        count(distinct coalesce(user_id, visitor_id)) filter (where created_at >= date_trunc('day', now()))::int as active_today,
        count(distinct user_id) filter (where user_id is not null and created_at >= now() - interval '5 minutes')::int as online_users,
        count(distinct coalesce(user_id, visitor_id)) filter (where created_at >= now() - interval '30 days')::int as active_30d
      from analytics_events
    `),
    query<StatRow>(`
      select coalesce(title, 'Untitled') as title, count(*)::int as clicks
      from analytics_events
      where event_type = 'movie_click'
        and media_type = 'movie'
        and ${eventPeriod}
      group by title
      order by clicks desc, title asc
      limit 8
    `),
    query<StatRow>(`
      select coalesce(title, 'Untitled') as title, count(*)::int as clicks
      from analytics_events
      where event_type = 'movie_click'
        and media_type = 'tv'
        and ${eventPeriod}
      group by title
      order by clicks desc, title asc
      limit 8
    `),
    query<StatRow>(`
      select coalesce(title, 'Untitled') as title, count(*)::int as clicks
      from analytics_events
      where event_type = 'movie_click'
        and media_type = 'movie'
        and created_at >= date_trunc('day', now())
      group by title
      order by clicks desc, title asc
      limit 8
    `),
    query<StatRow>(`
      select coalesce(title, 'Untitled') as title, count(*)::int as clicks
      from analytics_events
      where event_type = 'movie_click'
        and media_type = 'tv'
        and created_at >= date_trunc('day', now())
      group by title
      order by clicks desc, title asc
      limit 8
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
      select coalesce(u.username, u.name, u.email) as label, to_char(max(e.created_at), 'Mon DD, HH24:MI') as last_seen
      from analytics_events e
      join "user" u on u.id = e.user_id
      where e.created_at >= now() - interval '5 minutes'
      group by u.id, u.username, u.name, u.email
      order by max(e.created_at) desc
      limit 10
    `),
    query<StatRow>(`
      select
        to_char(day_bucket, 'Mon DD') as day,
        coalesce(count(distinct coalesce(e.user_id, e.visitor_id)), 0)::int as users,
        coalesce(count(e.id), 0)::int as events
      from generate_series(${seriesStart}, date_trunc('day', now()), interval '1 day') as day_bucket
      left join analytics_events e
        on e.created_at >= day_bucket
        and e.created_at < day_bucket + interval '1 day'
        and ${aliasedEventPeriod}
      group by day_bucket
      order by day_bucket
    `),
    query<StatRow>(`
      select
        coalesce(title, pathname, 'Platform event') as target,
        event_type,
        coalesce(category, 'Uncategorized') as category,
        to_char(created_at, 'Mon DD, HH24:MI') as happened_at
      from analytics_events
      where ${eventPeriod}
      order by created_at desc
      limit 8
    `),
    query<StatRow>(`
      select
        title,
        report_type,
        format,
        to_char(created_at, 'Mon DD, YYYY HH24:MI') as generated_at
      from admin_reports
      order by created_at desc
      limit 5
    `),
    query<StatRow>(`
      select
        name,
        report_type,
        duration,
        to_char(updated_at, 'Mon DD, YYYY HH24:MI') as updated_at
      from admin_report_templates
      order by updated_at desc
      limit 5
    `),
  ]);

  return {
    period: {
      duration,
      label: adminDurationLabel(duration),
    },
    summary: summary.rows[0] || {},
    topMovies: topMovies.rows,
    topSeries: topSeries.rows,
    todayTopMovies: todayTopMovies.rows,
    todayTopSeries: todayTopSeries.rows,
    bestCategories: bestCategories.rows,
    leaderboard: leaderboard.rows,
    onlineUsers: onlineUsers.rows,
    activeUsers: activeUsers.rows,
    recentActivity: recentActivity.rows,
    reportHistory: reportHistory.rows,
    reportTemplates: reportTemplates.rows,
  };
}

function localAnswer(question: string, snapshot: Awaited<ReturnType<typeof buildSnapshot>>) {
  const lower = question.toLowerCase();
  const summary = snapshot.summary;
  const periodLabel = snapshot.period.label.toLowerCase();
  const asksSeries = lower.includes("series") || lower.includes("tv show") || lower.includes("shows");
  const asksMovie = lower.includes("movie") || lower.includes("film");

  if (lower.includes("online") || lower.includes("logged in") || lower.includes("right now")) {
    const names = snapshot.onlineUsers.map((user) => user.label).filter(Boolean).join(", ");
    return `${toNumber(summary.online_users)} registered users are online right now, based on activity in the last 5 minutes.${names ? ` Active users: ${names}.` : ""}`;
  }

  if (asksSeries) {
    if (lower.includes("today")) {
      return `Top series today: ${listTop(snapshot.todayTopSeries)}. Series clicks today: ${toNumber(summary.series_clicks_today)}.`;
    }
    return `Top series for ${periodLabel}: ${listTop(snapshot.topSeries)}. Series clicks for ${periodLabel}: ${toNumber(summary.series_clicks_period)}.`;
  }

  if (asksMovie) {
    if (lower.includes("today")) {
      return `Top movies today: ${listTop(snapshot.todayTopMovies)}. Movie clicks today: ${toNumber(summary.movie_clicks_today)}.`;
    }
    return `Top movies for ${periodLabel}: ${listTop(snapshot.topMovies)}. Movie clicks for ${periodLabel}: ${toNumber(summary.movie_clicks_period)}.`;
  }

  if (lower.includes("today") && (lower.includes("clicked") || lower.includes("click"))) {
    return `There have been ${toNumber(summary.clicks_today)} content clicks today: ${toNumber(summary.movie_clicks_today)} movie clicks and ${toNumber(summary.series_clicks_today)} series clicks. Top movies today: ${listTop(snapshot.todayTopMovies)}. Top series today: ${listTop(snapshot.todayTopSeries)}.`;
  }

  if (lower.includes("clicked") || lower.includes("click")) {
    return `For ${periodLabel}, JokaFlix has ${toNumber(summary.clicks_period)} content clicks: ${toNumber(summary.movie_clicks_period)} movie clicks and ${toNumber(summary.series_clicks_period)} series clicks. Top movies: ${listTop(snapshot.topMovies)}. Top series: ${listTop(snapshot.topSeries)}.`;
  }

  if (lower.includes("categor")) {
    return `Best categories for ${periodLabel}: ${listCategories(snapshot.bestCategories)}.`;
  }

  if (lower.includes("leaderboard") || lower.includes("top user") || lower.includes("most active")) {
    return `The user leaderboard for ${periodLabel}: ${listUsers(snapshot.leaderboard)}.`;
  }

  if (lower.includes("report") || lower.includes("template")) {
    const reports = snapshot.reportHistory.map((report) => `${report.title || "Untitled"} (${report.format || "file"}, ${report.generated_at || "recent"})`).join(", ") || "none generated yet";
    const templates = snapshot.reportTemplates.map((template) => `${template.name || "Untitled"} (${template.duration || "saved period"})`).join(", ") || "none saved yet";
    return `Latest reports: ${reports}. Report templates: ${templates}.`;
  }

  if (lower.includes("user")) {
    return `JokaFlix has ${toNumber(summary.total_users)} total registered users. For ${periodLabel}, there are ${toNumber(summary.new_users_period)} new users and ${toNumber(summary.active_period)} active users. Today specifically, there are ${toNumber(summary.new_users_today)} new users and ${toNumber(summary.active_today)} active users.`;
  }

  return `For ${periodLabel}, JokaFlix has ${toNumber(summary.active_period)} active users and ${toNumber(summary.clicks_period)} content clicks. The top movies are ${listTop(snapshot.topMovies)}, top series are ${listTop(snapshot.topSeries)}, and best categories are ${listCategories(snapshot.bestCategories)}.`;
}

export async function POST(request: Request) {
  await ensureAppSchemaOnce();
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const question = safeQuestion(body.question);
  const duration = sanitizeAdminDuration(typeof body.duration === "string" ? body.duration : undefined);
  const wantsStream = body.stream === true;

  if (!question) {
    return NextResponse.json({ error: "Question is required" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const snapshot = await buildSnapshot(duration);
  const answer = localAnswer(question, snapshot);

  if (wantsStream) {
    return streamText(answer);
  }

  return NextResponse.json(
    {
      answer,
      mode: "database",
      period: snapshot.period,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
