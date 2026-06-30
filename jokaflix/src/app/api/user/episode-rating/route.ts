import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";
import { requireUser } from "../../../../lib/server-session";

function keyFor(season: number, episode: number) {
  return `${season}-${episode}`;
}

async function getPublicEpisodeRating(tmdbId: string, season: number, episode: number) {
  const aggregate = await query<{ average_rating: string | null; rating_count: string }>(
    `
      select avg(rating)::numeric(3,1) as average_rating, count(*)::text as rating_count
      from user_episode_ratings
      where tmdb_id = $1 and season = $2 and episode = $3
    `,
    [tmdbId, season, episode]
  );
  const count = Number(aggregate.rows[0]?.rating_count || 0);

  return {
    average: count >= 3 && aggregate.rows[0]?.average_rating ? Number(aggregate.rows[0].average_rating) : null,
    count,
  };
}

export async function GET(request: Request) {
  const user = await requireUser();
  const url = new URL(request.url);
  const tmdbId = url.searchParams.get("tmdbId") || "";
  const season = Number(url.searchParams.get("season") || 0);

  if (!tmdbId || !Number.isInteger(season) || season <= 0) {
    return NextResponse.json({ error: "Missing series or season" }, { status: 400 });
  }

  const [result, aggregate] = await Promise.all([
    user
      ? query<{ season: number; episode: number; rating: string; comment: string | null }>(
          `
            select season, episode, rating, comment
            from user_episode_ratings
            where user_id = $1 and tmdb_id = $2 and season = $3
            order by episode asc
          `,
          [user.id, tmdbId, season]
        )
      : Promise.resolve({ rows: [] }),
    query<{ episode: number; average_rating: string | null; rating_count: string }>(
      `
        select episode, avg(rating)::numeric(3,1) as average_rating, count(*)::text as rating_count
        from user_episode_ratings
        where tmdb_id = $1 and season = $2
        group by episode
      `,
      [tmdbId, season]
    ),
  ]);

  const ratings = Object.fromEntries(
    result.rows.map((row) => [keyFor(Number(row.season), Number(row.episode)), Number(row.rating)])
  );
  const comments = Object.fromEntries(
    result.rows.map((row) => [keyFor(Number(row.season), Number(row.episode)), row.comment || ""])
  );
  const publicRatings = Object.fromEntries(
    aggregate.rows.map((row) => [
      keyFor(season, Number(row.episode)),
      {
        average: Number(row.rating_count || 0) >= 3 && row.average_rating ? Number(row.average_rating) : null,
        count: Number(row.rating_count || 0),
      },
    ])
  );

  return NextResponse.json({ authenticated: !!user, ratings, comments, publicRatings });
}

export async function POST(request: Request) {
  const user = await requireUser();

  if (!user) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const body = await request.json();
  const tmdbId = String(body.tmdbId || "");
  const season = Number(body.season);
  const episode = Number(body.episode);
  const rating = Number(body.rating);
  const comment = body.comment ? String(body.comment).slice(0, 500) : null;

  if (!tmdbId || !Number.isInteger(season) || !Number.isInteger(episode) || season <= 0 || episode <= 0) {
    return NextResponse.json({ error: "Missing episode details" }, { status: 400 });
  }

  if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
    return NextResponse.json({ error: "Rating must be between 0 and 10" }, { status: 400 });
  }

  const existing = await query<{ rating: string; comment: string | null }>(
    `select rating, comment from user_episode_ratings where user_id = $1 and tmdb_id = $2 and season = $3 and episode = $4`,
    [user.id, tmdbId, season, episode]
  );

  if ((existing.rowCount ?? 0) > 0) {
    return NextResponse.json(
      {
        error: "You have already rated this episode.",
        rating: Number(existing.rows[0].rating),
        comment: existing.rows[0].comment || "",
        key: keyFor(season, episode),
        publicRating: await getPublicEpisodeRating(tmdbId, season, episode),
      },
      { status: 409 }
    );
  }

  await query(
    `
      insert into user_episode_ratings (
        user_id, tmdb_id, season, episode, rating, comment, series_title, episode_title, still_path
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
    [
      user.id,
      tmdbId,
      season,
      episode,
      rating,
      comment,
      body.seriesTitle ? String(body.seriesTitle) : null,
      body.episodeTitle ? String(body.episodeTitle) : null,
      body.stillPath ? String(body.stillPath) : null,
    ]
  );

  return NextResponse.json({
    ok: true,
    rating,
    key: keyFor(season, episode),
    publicRating: await getPublicEpisodeRating(tmdbId, season, episode),
  });
}
