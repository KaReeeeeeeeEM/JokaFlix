import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import { requireUser } from "../../../../lib/server-session";
import { getUserTitleState, normalizeTitlePayload } from "../../../../lib/user-titles";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireUser();

  if (!user) {
    const url = new URL(request.url);
    const mediaType = url.searchParams.get("mediaType") === "tv" ? "tv" : "movie";
    const tmdbId = url.searchParams.get("tmdbId") || "";
    const aggregate = tmdbId
      ? await query<{ average_rating: string | null; rating_count: string }>(
          `select avg(rating)::numeric(3,1) as average_rating, count(*)::text as rating_count
           from user_title_ratings
           where media_type = $1 and tmdb_id = $2`,
          [mediaType, tmdbId]
        )
      : { rows: [] };

    return NextResponse.json(
      {
        authenticated: false,
        rating: null,
        ratingComment: "",
        publicRating:
          Number(aggregate.rows[0]?.rating_count || 0) >= 3 && aggregate.rows[0]?.average_rating
            ? Number(aggregate.rows[0].average_rating)
            : null,
        ratingCount: Number(aggregate.rows[0]?.rating_count || 0),
        watchLater: false,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  }

  const url = new URL(request.url);
  const mediaType = url.searchParams.get("mediaType") === "tv" ? "tv" : "movie";
  const tmdbId = url.searchParams.get("tmdbId") || "";

  if (!tmdbId) {
    return NextResponse.json({ error: "Missing tmdbId" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const state = await getUserTitleState(user.id, mediaType, tmdbId);
  return NextResponse.json({ authenticated: true, ...state }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const body = await request.json();
  const action = String(body.action || "");
  const title = normalizeTitlePayload(body);

  if (!title.tmdbId) {
    return NextResponse.json({ error: "Missing tmdbId" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  if (action === "rate") {
    const rating = Number(body.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
      return NextResponse.json({ error: "Rating must be between 0 and 10" }, { status: 400, headers: { "Cache-Control": "no-store" } });
    }

    const existing = await query<{ rating: string; comment: string | null }>(
      `select rating, comment from user_title_ratings where user_id = $1 and media_type = $2 and tmdb_id = $3`,
      [user.id, title.mediaType, title.tmdbId]
    );

    if ((existing.rowCount ?? 0) > 0) {
      const state = await getUserTitleState(user.id, title.mediaType, title.tmdbId);
      return NextResponse.json(
        { error: "You have already rated this title.", ...state },
        { status: 409, headers: { "Cache-Control": "no-store" } }
      );
    }

    await query(
      `
        insert into user_title_ratings (user_id, media_type, tmdb_id, rating, comment, title, poster_path, backdrop_path, genres)
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `,
      [
        user.id,
        title.mediaType,
        title.tmdbId,
        rating,
        body.comment ? String(body.comment).slice(0, 500) : null,
        title.title || null,
        title.posterPath,
        title.backdropPath,
        title.genres || [],
      ]
    );
  }

  if (action === "watch-later") {
    await query(
      `
        insert into user_watch_later (user_id, media_type, tmdb_id, title, poster_path, backdrop_path, genres)
        values ($1, $2, $3, $4, $5, $6, $7)
        on conflict (user_id, media_type, tmdb_id) do nothing
      `,
      [user.id, title.mediaType, title.tmdbId, title.title || "Untitled", title.posterPath, title.backdropPath, title.genres || []]
    );
  }

  if (action === "remove-watch-later") {
    await query(
      `delete from user_watch_later where user_id = $1 and media_type = $2 and tmdb_id = $3`,
      [user.id, title.mediaType, title.tmdbId]
    );
  }

  const state = await getUserTitleState(user.id, title.mediaType, title.tmdbId);
  return NextResponse.json({ ok: true, ...state }, { headers: { "Cache-Control": "no-store" } });
}
