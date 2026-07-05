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

function markdownTable(headers: string[], rows: Array<Array<string | number>>) {
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map((cell) => String(cell).replace(/\|/g, "\\|")).join(" | ")} |`),
  ].join("\n");
}

function extractOpenAIText(payload: unknown) {
  const outputText = (payload as { output_text?: unknown })?.output_text;
  if (typeof outputText === "string" && outputText.trim()) return outputText.trim();

  const output = (payload as { output?: unknown })?.output;
  if (!Array.isArray(output)) return null;

  const chunks: string[] = [];
  output.forEach((item) => {
    const content = (item as { content?: unknown })?.content;
    if (!Array.isArray(content)) return;
    content.forEach((part) => {
      const text = (part as { text?: unknown })?.text;
      if (typeof text === "string") chunks.push(text);
    });
  });

  const text = chunks.join("\n").trim();
  return text || null;
}

function snapshotPrompt(snapshot: Awaited<ReturnType<typeof buildSnapshot>>) {
  return JSON.stringify(
    {
      period: snapshot.period,
      summary: snapshot.summary,
      topMovies: snapshot.topMovies,
      topSeries: snapshot.topSeries,
      todayTopMovies: snapshot.todayTopMovies,
      todayTopSeries: snapshot.todayTopSeries,
      bestCategories: snapshot.bestCategories,
      leaderboard: snapshot.leaderboard,
      onlineUsers: snapshot.onlineUsers,
      activeUsersTrend: snapshot.activeUsers,
      recentActivity: snapshot.recentActivity,
      reportHistory: snapshot.reportHistory,
      reportTemplates: snapshot.reportTemplates,
    },
    null,
    2
  ).slice(0, 14000);
}

async function openAIAnswer(question: string, snapshot: Awaited<ReturnType<typeof buildSnapshot>>) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      max_output_tokens: 1400,
      input: [
        {
          role: "system",
          content: [
            "You are JokaFlix AI Manager inside an admin analytics dashboard.",
            "You can answer broad business, product, analytics, platform, and general questions.",
            "For JokaFlix analytics, users, reports, online status, titles, categories, or activity, use ONLY the supplied live dashboard snapshot. If the snapshot lacks a fact, say so clearly instead of guessing.",
            "For general non-JokaFlix questions, answer from general knowledge and make clear when the answer is not based on JokaFlix data.",
            "Be accurate, concise, and useful. Prefer direct answers before explanation.",
            "Use rich markdown formatting: **bold** for key numbers or findings, *italics* for nuance, and <u>underline</u> for warnings or important action items.",
            "When comparing metrics, reporting statistical data, listing rankings, or summarizing several records, use a markdown table.",
            "Do not use code fences unless the user specifically asks for code.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Question: ${question}`,
            "",
            "Live JokaFlix dashboard snapshot:",
            snapshotPrompt(snapshot),
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  return extractOpenAIText(payload);
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
        (select count(distinct "userId") from "session" where "expiresAt" > now())::int as online_users,
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
      where event_type in ('movie_click', 'category_click')
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
      select coalesce(u.username, u.name, u.email) as label, to_char(s."expiresAt", 'Mon DD, HH24:MI') as last_seen
      from "session" s
      join "user" u on u.id = s."userId"
      where s."expiresAt" > now()
      order by s."expiresAt" desc
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
    return [
      `**${toNumber(summary.online_users)} registered users are online right now**, based on active unexpired sessions.`,
      names ? `Online users: ${names}.` : "No active registered-user sessions are visible in the current snapshot.",
    ].join("\n\n");
  }

  if (asksSeries) {
    if (lower.includes("today")) {
      return `**Series clicks today:** ${toNumber(summary.series_clicks_today)}.\n\n${markdownTable(["Rank", "Series", "Clicks"], snapshot.todayTopSeries.slice(0, 5).map((item, index) => [index + 1, item.title || "Untitled", toNumber(item.clicks)]))}`;
    }
    return `**Series clicks for ${periodLabel}:** ${toNumber(summary.series_clicks_period)}.\n\n${markdownTable(["Rank", "Series", "Clicks"], snapshot.topSeries.slice(0, 5).map((item, index) => [index + 1, item.title || "Untitled", toNumber(item.clicks)]))}`;
  }

  if (asksMovie) {
    if (lower.includes("today")) {
      return `**Movie clicks today:** ${toNumber(summary.movie_clicks_today)}.\n\n${markdownTable(["Rank", "Movie", "Clicks"], snapshot.todayTopMovies.slice(0, 5).map((item, index) => [index + 1, item.title || "Untitled", toNumber(item.clicks)]))}`;
    }
    return `**Movie clicks for ${periodLabel}:** ${toNumber(summary.movie_clicks_period)}.\n\n${markdownTable(["Rank", "Movie", "Clicks"], snapshot.topMovies.slice(0, 5).map((item, index) => [index + 1, item.title || "Untitled", toNumber(item.clicks)]))}`;
  }

  if (lower.includes("today") && (lower.includes("clicked") || lower.includes("click"))) {
    return [
      `There have been **${toNumber(summary.clicks_today)} content clicks today**.`,
      markdownTable(
        ["Metric", "Value"],
        [
          ["Movie clicks", toNumber(summary.movie_clicks_today)],
          ["Series clicks", toNumber(summary.series_clicks_today)],
          ["Active today", toNumber(summary.active_today)],
        ]
      ),
      "*Top movie signal:* " + listTop(snapshot.todayTopMovies) + ".",
      "*Top series signal:* " + listTop(snapshot.todayTopSeries) + ".",
    ].join("\n\n");
  }

  if (lower.includes("clicked") || lower.includes("click")) {
    return [
      `For ${periodLabel}, JokaFlix has **${toNumber(summary.clicks_period)} content clicks**.`,
      markdownTable(
        ["Metric", "Value"],
        [
          ["Movie clicks", toNumber(summary.movie_clicks_period)],
          ["Series clicks", toNumber(summary.series_clicks_period)],
          ["Active users", toNumber(summary.active_period)],
        ]
      ),
      "<u>Action:</u> compare the leaders below against release timing and recommendation placement.",
    ].join("\n\n");
  }

  if (lower.includes("categor")) {
    return `Best categories for ${periodLabel}:\n\n${markdownTable(["Rank", "Category", "Clicks"], snapshot.bestCategories.slice(0, 5).map((item, index) => [index + 1, item.category || "Uncategorized", toNumber(item.clicks)]))}`;
  }

  if (lower.includes("leaderboard") || lower.includes("top user") || lower.includes("most active")) {
    return `The user leaderboard for ${periodLabel}:\n\n${markdownTable(["Rank", "User", "Clicks"], snapshot.leaderboard.slice(0, 5).map((item, index) => [index + 1, item.label || "Guest", toNumber(item.clicks)]))}`;
  }

  if (lower.includes("report") || lower.includes("template")) {
    const reports = snapshot.reportHistory.map((report) => `${report.title || "Untitled"} (${report.format || "file"}, ${report.generated_at || "recent"})`).join(", ") || "none generated yet";
    const templates = snapshot.reportTemplates.map((template) => `${template.name || "Untitled"} (${template.duration || "saved period"})`).join(", ") || "none saved yet";
    return `Latest reports: ${reports}. Report templates: ${templates}.`;
  }

  if (lower.includes("user")) {
    return [
      `JokaFlix has **${toNumber(summary.total_users)} total registered users**.`,
      markdownTable(
        ["Metric", "Value"],
        [
          ["New users in period", toNumber(summary.new_users_period)],
          ["Active users in period", toNumber(summary.active_period)],
          ["New users today", toNumber(summary.new_users_today)],
          ["Active users today", toNumber(summary.active_today)],
          ["Online now", toNumber(summary.online_users)],
        ]
      ),
    ].join("\n\n");
  }

  return [
    `For ${periodLabel}, JokaFlix has **${toNumber(summary.active_period)} active users** and **${toNumber(summary.clicks_period)} content clicks**.`,
    markdownTable(
      ["Signal", "Current Value"],
      [
        ["Top movies", listTop(snapshot.topMovies)],
        ["Top series", listTop(snapshot.topSeries)],
        ["Best categories", listCategories(snapshot.bestCategories)],
      ]
    ),
  ].join("\n\n");
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
  const answer = (await openAIAnswer(question, snapshot).catch(() => null)) || localAnswer(question, snapshot);

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
