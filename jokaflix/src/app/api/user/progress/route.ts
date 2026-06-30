import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import { requireUser } from "../../../../lib/server-session";
import { normalizeTitlePayload } from "../../../../lib/user-titles";

export async function POST(request: Request) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ ok: true, tracked: false });
  }

  const body = await request.json();
  const title = normalizeTitlePayload(body);

  if (!title.tmdbId) {
    return NextResponse.json({ error: "Missing tmdbId" }, { status: 400 });
  }

  await query(
    `
      insert into user_watch_history (
        user_id, media_type, tmdb_id, title, poster_path, backdrop_path,
        season, episode, progress_seconds, duration_seconds
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      on conflict (user_id, media_type, tmdb_id, season, episode) do update set
        title = coalesce(excluded.title, user_watch_history.title),
        poster_path = coalesce(excluded.poster_path, user_watch_history.poster_path),
        backdrop_path = coalesce(excluded.backdrop_path, user_watch_history.backdrop_path),
        progress_seconds = greatest(user_watch_history.progress_seconds, excluded.progress_seconds),
        duration_seconds = coalesce(excluded.duration_seconds, user_watch_history.duration_seconds),
        watched_at = now()
    `,
    [
      user.id,
      title.mediaType,
      title.tmdbId,
      title.title || null,
      title.posterPath,
      title.backdropPath,
      body.season ? Number(body.season) : 0,
      body.episode ? Number(body.episode) : 0,
      body.progressSeconds ? Number(body.progressSeconds) : 0,
      body.durationSeconds ? Number(body.durationSeconds) : null,
    ]
  );

  return NextResponse.json({ ok: true, tracked: true });
}
