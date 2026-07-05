import { adminDurationCondition, type AdminDuration } from "./admin-duration";
import { query } from "./db";

export type AdminLeaderboardType = "movies" | "series" | "genres" | "users" | "recent-activity";

export type AdminLeaderboardRow = {
  id: string;
  label: string;
  meta: string;
  value: number;
  valueLabel: string;
  total_count?: number;
  media_type?: string;
  category?: string;
  actor?: string;
};

export const adminLeaderboardTypes: AdminLeaderboardType[] = ["movies", "series", "genres", "users", "recent-activity"];

export function sanitizeAdminLeaderboardType(value: string | undefined): AdminLeaderboardType {
  return adminLeaderboardTypes.includes(value as AdminLeaderboardType) ? (value as AdminLeaderboardType) : "movies";
}

export function adminLeaderboardTitle(type: AdminLeaderboardType) {
  if (type === "movies") return "Movie Leaderboard";
  if (type === "series") return "Series Leaderboard";
  if (type === "genres") return "Genre Leaderboard";
  if (type === "users") return "User Leaderboard";
  return "Recent Activity";
}

function limitClause(limit?: number) {
  return typeof limit === "number" && limit > 0 ? `limit ${Math.floor(limit)}` : "";
}

export async function getAdminLeaderboardRows(type: AdminLeaderboardType, duration: AdminDuration, limit?: number) {
  const eventPeriod = adminDurationCondition("created_at", duration);
  const aliasedEventPeriod = adminDurationCondition("e.created_at", duration);
  const safeLimit = limitClause(limit);

  if (type === "movies" || type === "series") {
    const mediaType = type === "movies" ? "movie" : "tv";
    const result = await query<AdminLeaderboardRow>(`
      with ranked as (
        select
          coalesce(tmdb_id, title, 'unknown')::text as id,
          coalesce(title, 'Untitled') as label,
          ${type === "movies" ? "'Movie clicks'" : "'Series clicks'"} as meta,
          count(*)::int as value,
          count(*)::text || ' clicks' as value_label
        from analytics_events
        where event_type = 'movie_click'
          and media_type = '${mediaType}'
          and ${eventPeriod}
        group by title, tmdb_id
      )
      select *, count(*) over()::int as total_count
      from ranked
      order by value desc, label asc
      ${safeLimit}
    `);
    return result.rows;
  }

  if (type === "genres") {
    const result = await query<AdminLeaderboardRow>(`
      with ranked as (
        select
          coalesce(category, 'Uncategorized') as id,
          coalesce(category, 'Uncategorized') as label,
          'Category/source' as meta,
          count(*)::int as value,
          count(*)::text || ' clicks' as value_label
        from analytics_events
        where event_type in ('movie_click', 'category_click')
          and ${eventPeriod}
        group by category
      )
      select *, count(*) over()::int as total_count
      from ranked
      order by value desc, label asc
      ${safeLimit}
    `);
    return result.rows;
  }

  if (type === "users") {
    const result = await query<AdminLeaderboardRow>(`
      with ranked as (
        select
          coalesce(e.user_id, e.visitor_id, 'unknown') as id,
          coalesce(u.username, u.name, u.email, 'Guest ' || right(coalesce(e.visitor_id, 'unknown'), 4)) as label,
          case when e.user_id is null then 'guest activity' else 'registered user' end as meta,
          count(*)::int as value,
          count(*)::text || ' clicks' as value_label
        from analytics_events e
        left join "user" u on u.id = e.user_id
        where e.event_type = 'movie_click'
          and ${aliasedEventPeriod}
        group by 1, 2, 3
      )
      select *, count(*) over()::int as total_count
      from ranked
      order by value desc, label asc
      ${safeLimit}
    `);
    return result.rows;
  }

  const result = await query<AdminLeaderboardRow>(`
    with ranked as (
      select
        e.id,
        coalesce(e.title, e.pathname, 'Platform event') as label,
        coalesce(u.username, u.name, u.email, 'Guest ' || right(coalesce(e.visitor_id, 'unknown'), 4)) as actor,
        coalesce(e.category, 'Uncategorized') as category,
        coalesce(e.media_type, 'platform') as media_type,
        coalesce(u.username, u.name, u.email, 'Guest ' || right(coalesce(e.visitor_id, 'unknown'), 4))
          || ' · '
          || coalesce(e.category, 'Uncategorized') as meta,
        extract(epoch from e.created_at)::int as value,
        to_char(e.created_at, 'Mon DD, HH24:MI') as value_label
      from analytics_events e
      left join "user" u on u.id = e.user_id
      where e.event_type = 'movie_click'
        and ${aliasedEventPeriod}
      order by e.created_at desc
    )
    select *, count(*) over()::int as total_count
    from ranked
    order by value desc
    ${safeLimit}
  `);
  return result.rows;
}
