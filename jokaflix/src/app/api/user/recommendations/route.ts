import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import { requireUser } from "../../../../lib/server-session";

type RecommendationSeed = {
  media_type: string;
  tmdb_id: string;
  title?: string | null;
  genres?: string[] | null;
  signal: number;
  source: "rated" | "saved" | "watched";
};

type TmdbRecommendation = {
  id: number;
  media_type?: string;
  popularity?: number;
  vote_average?: number;
  genre_ids?: number[];
};

async function fetchTmdbResults(path: string, apiKey: string) {
  const response = await fetch(`https://api.themoviedb.org/3${path}${path.includes("?") ? "&" : "?"}api_key=${apiKey}`, {
    next: { revalidate: 1800 },
  });

  if (!response.ok) return [];
  const data = await response.json().catch(() => ({}));
  return Array.isArray(data.results) ? data.results as TmdbRecommendation[] : [];
}

export async function GET() {
  const user = await requireUser().catch(() => null);

  if (!user) {
    return NextResponse.json({ authenticated: false, recommendations: [] });
  }

  const [ratings, watchLater, history] = await Promise.all([
    query<RecommendationSeed>(
      `
        select media_type, tmdb_id, title, genres, (rating::numeric * 3)::int as signal, 'rated' as source
        from user_title_ratings
        where user_id = $1 and rating >= 6
        order by rating desc, updated_at desc
        limit 8
      `,
      [user.id]
    ),
    query<RecommendationSeed>(
      `
        select media_type, tmdb_id, title, genres, 16 as signal, 'saved' as source
        from user_watch_later
        where user_id = $1
        order by created_at desc
        limit 8
      `,
      [user.id]
    ),
    query<RecommendationSeed>(
      `
        select media_type, tmdb_id, title, null::text[] as genres, 12 as signal, 'watched' as source
        from user_watch_history
        where user_id = $1
        order by watched_at desc
        limit 8
      `,
      [user.id]
    ),
  ]);

  const seeds = [...ratings.rows, ...watchLater.rows, ...history.rows]
    .filter((seed, index, all) => all.findIndex((item) => item.media_type === seed.media_type && String(item.tmdb_id) === String(seed.tmdb_id)) === index)
    .slice(0, 12);
  const reasonSeed = history.rows[0] || ratings.rows[0] || watchLater.rows[0] || seeds[0];
  const reasonTitle = reasonSeed?.title || (reasonSeed ? `${reasonSeed.media_type === "tv" ? "that series" : "that movie"}` : "");
  const reason =
    reasonSeed?.source === "rated"
      ? `Because you rated ${reasonTitle}`
      : reasonSeed?.source === "saved"
        ? `Because you saved ${reasonTitle}`
        : reasonSeed
          ? `Because you watched ${reasonTitle}`
          : "Because of what viewers love right now";

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ authenticated: true, recommendations: [], reason });
  }

  if (seeds.length === 0) {
    const fallback = await fetchTmdbResults("/trending/all/week?include_adult=false", apiKey);
    return NextResponse.json({ authenticated: true, recommendations: fallback.slice(0, 18), reason });
  }

  const genreScores = new Map<string, number>();
  seeds.forEach((seed) => {
    (seed.genres || []).forEach((genre) => {
      genreScores.set(String(genre), (genreScores.get(String(genre)) || 0) + seed.signal);
    });
  });

  const genreIds = Array.from(genreScores.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([genre]) => genre)
    .filter(Boolean);

  const recommendationCalls = seeds.slice(0, 6).map((seed) => {
    const endpoint = seed.media_type === "tv" ? "tv" : "movie";
    return fetchTmdbResults(`/${endpoint}/${seed.tmdb_id}/recommendations?include_adult=false`, apiKey);
  });

  if (genreIds.length > 0) {
    recommendationCalls.push(fetchTmdbResults(`/discover/movie?include_adult=false&sort_by=popularity.desc&with_genres=${genreIds.join("|")}`, apiKey));
    recommendationCalls.push(fetchTmdbResults(`/discover/tv?include_adult=false&sort_by=popularity.desc&with_genres=${genreIds.join("|")}`, apiKey));
  }

  recommendationCalls.push(fetchTmdbResults("/trending/all/week?include_adult=false", apiKey));

  const sourceResults = (await Promise.all(recommendationCalls)).flat();
  const seedIds = new Set(seeds.map((seed) => `${seed.media_type === "tv" ? "tv" : "movie"}-${seed.tmdb_id}`));
  const ranked = new Map<string, TmdbRecommendation & { score: number }>();

  sourceResults.forEach((item, index) => {
    const mediaType = item.media_type === "tv" ? "tv" : item.media_type === "movie" || (item as { title?: string }).title ? "movie" : "tv";
    const key = `${mediaType}-${item.id}`;
    if (!item.id || seedIds.has(key)) return;
    const genreBoost = (item.genre_ids || []).reduce((sum, genreId) => sum + (genreScores.get(String(genreId)) || 0), 0);
    const score = (item.popularity || 0) + (item.vote_average || 0) * 2 + genreBoost - index * 0.02;
    const existing = ranked.get(key);
    if (!existing || existing.score < score) {
      ranked.set(key, { ...item, media_type: mediaType, score });
    }
  });

  const recommendations = Array.from(ranked.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 24);

  return NextResponse.json({ authenticated: true, recommendations, reason });
}
