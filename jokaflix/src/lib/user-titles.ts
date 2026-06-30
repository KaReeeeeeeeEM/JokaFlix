import { query } from "./db";

export type MediaType = "movie" | "tv";

export type TitlePayload = {
  mediaType: MediaType;
  tmdbId: string;
  title?: string;
  posterPath?: string | null;
  backdropPath?: string | null;
  genres?: string[];
};

export function normalizeTitlePayload(input: any): TitlePayload {
  const mediaType = input?.mediaType === "tv" ? "tv" : "movie";
  return {
    mediaType,
    tmdbId: String(input?.tmdbId || input?.id || ""),
    title: input?.title ? String(input.title) : undefined,
    posterPath: input?.posterPath || null,
    backdropPath: input?.backdropPath || null,
    genres: Array.isArray(input?.genres) ? input.genres.map(String).slice(0, 8) : [],
  };
}

export async function getUserTitleState(userId: string, mediaType: MediaType, tmdbId: string) {
  const [rating, aggregate, watchLater] = await Promise.all([
    query<{ rating: string; comment: string | null }>(
      `select rating, comment from user_title_ratings where user_id = $1 and media_type = $2 and tmdb_id = $3`,
      [userId, mediaType, tmdbId]
    ),
    query<{ average_rating: string | null; rating_count: string }>(
      `select avg(rating)::numeric(3,1) as average_rating, count(*)::text as rating_count
       from user_title_ratings
       where media_type = $1 and tmdb_id = $2`,
      [mediaType, tmdbId]
    ),
    query<{ tmdb_id: string }>(
      `select tmdb_id from user_watch_later where user_id = $1 and media_type = $2 and tmdb_id = $3`,
      [userId, mediaType, tmdbId]
    ),
  ]);

  return {
    rating: rating.rows[0]?.rating ? Number(rating.rows[0].rating) : null,
    ratingComment: rating.rows[0]?.comment || "",
    publicRating:
      Number(aggregate.rows[0]?.rating_count || 0) >= 3 && aggregate.rows[0]?.average_rating
        ? Number(aggregate.rows[0].average_rating)
        : null,
    ratingCount: Number(aggregate.rows[0]?.rating_count || 0),
    watchLater: (watchLater.rowCount ?? 0) > 0,
  };
}
