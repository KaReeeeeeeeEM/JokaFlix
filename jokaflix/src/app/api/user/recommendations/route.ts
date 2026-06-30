import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import { requireUser } from "../../../../lib/server-session";

export async function GET() {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ authenticated: false, recommendations: [] });
  }

  const favorites = await query<{ media_type: string; tmdb_id: string; genres: string[] }>(
    `
      select media_type, tmdb_id, genres
      from user_title_ratings
      where user_id = $1 and rating >= 7
      order by updated_at desc
      limit 5
    `,
    [user.id]
  );

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const seed = favorites.rows[0];

  if (!apiKey || !seed) {
    return NextResponse.json({ authenticated: true, recommendations: [] });
  }

  const endpoint = seed.media_type === "tv" ? "tv" : "movie";
  const response = await fetch(
    `https://api.themoviedb.org/3/${endpoint}/${seed.tmdb_id}/recommendations?api_key=${apiKey}`,
    { next: { revalidate: 3600 } }
  );

  if (!response.ok) {
    return NextResponse.json({ authenticated: true, recommendations: [] });
  }

  const data = await response.json();
  return NextResponse.json({ authenticated: true, recommendations: data.results?.slice(0, 10) || [] });
}
