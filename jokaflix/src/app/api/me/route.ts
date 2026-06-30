import { NextResponse } from "next/server";
import { query } from "../../../lib/db";
import { requireUser } from "../../../lib/server-session";

export async function GET() {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ user: null });
  }

  const [profile, ratings, watchLater, history] = await Promise.all([
    query(`select nationality, gender, avatar_url, passkey_prompted from user_profiles where user_id = $1`, [user.id]),
    query(`select media_type, tmdb_id, rating, title, poster_path, backdrop_path, updated_at from user_title_ratings where user_id = $1 order by updated_at desc limit 30`, [user.id]),
    query(`select media_type, tmdb_id, title, poster_path, backdrop_path, genres, created_at from user_watch_later where user_id = $1 order by created_at desc limit 30`, [user.id]),
    query(`select media_type, tmdb_id, title, poster_path, backdrop_path, season, episode, progress_seconds, duration_seconds, watched_at from user_watch_history where user_id = $1 order by watched_at desc limit 30`, [user.id]),
  ]);

  return NextResponse.json({
    user,
    profile: profile.rows[0] || null,
    ratings: ratings.rows,
    watchLater: watchLater.rows,
    continueWatching: history.rows,
  });
}

export async function PATCH(request: Request) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const updates: string[] = [];
  const values: unknown[] = [user.id];

  if ("passkeyPrompted" in body) {
    values.push(Boolean(body.passkeyPrompted));
    updates.push(`passkey_prompted = $${values.length}`);
  }

  if ("avatarUrl" in body) {
    const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim() : "";
    if (avatarUrl) {
      try {
        const url = new URL(avatarUrl);
        if (url.protocol !== "https:" && url.protocol !== "http:") {
          return NextResponse.json({ error: "Avatar URL must be an http or https URL" }, { status: 400 });
        }
      } catch {
        return NextResponse.json({ error: "Enter a valid image URL" }, { status: 400 });
      }
    }
    values.push(avatarUrl || null);
    updates.push(`avatar_url = $${values.length}`);
  }

  if (!updates.length) {
    return NextResponse.json({ ok: true });
  }

  await query(
    `insert into user_profiles (user_id)
     values ($1)
     on conflict (user_id) do nothing`,
    [user.id]
  );

  await query(
    `update user_profiles set ${updates.join(", ")}, updated_at = now() where user_id = $1`,
    values
  );

  return NextResponse.json({ ok: true });
}
