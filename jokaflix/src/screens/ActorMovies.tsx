"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Film, UserRound } from "lucide-react";
import { MovieCard } from "../components/global/cards/MovieCard";
import { Skeleton } from "../components/ui/skeleton";
import type { TrendingMovie } from "../../types";

type ActorDetails = {
  id: number;
  name: string;
  biography?: string | null;
  profile_path?: string | null;
  known_for_department?: string | null;
};

type ActorCredit = Partial<TrendingMovie> & {
  id: number;
  title?: string;
  original_title?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  popularity?: number;
};

type ActorCreditsResponse = {
  cast: ActorCredit[];
};

const tmdbKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

function actorImage(path?: string | null) {
  return path ? `https://image.tmdb.org/t/p/w500${path}` : "";
}

function detailsEndpoint(actorId: string) {
  return `https://api.themoviedb.org/3/person/${actorId}?api_key=${tmdbKey}`;
}

function creditsEndpoint(actorId: string) {
  return `https://api.themoviedb.org/3/person/${actorId}/movie_credits?api_key=${tmdbKey}`;
}

function normalizeMovie(movie: ActorCredit): TrendingMovie {
  return {
    adult: Boolean(movie.adult),
    backdrop_path: movie.backdrop_path || "",
    first_air_date: undefined,
    genre_ids: movie.genre_ids || [],
    id: movie.id,
    media_type: "movie",
    name: undefined,
    original_language: movie.original_language || "",
    original_name: false,
    original_title: movie.original_title || movie.title || "",
    overview: movie.overview || "Explore this actor's filmography on JokaFlix.",
    popularity: movie.popularity || 0,
    poster_path: movie.poster_path || "",
    release_date: movie.release_date || "",
    title: movie.title || movie.original_title || "Untitled movie",
    video: Boolean(movie.video),
    vote_average: movie.vote_average || 0,
    vote_count: movie.vote_count || 0,
  };
}

export default function ActorMoviesPage() {
  const params = useParams<{ id?: string | string[] }>();
  const actorId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [actor, setActor] = React.useState<ActorDetails | null>(null);
  const [movies, setMovies] = React.useState<TrendingMovie[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!actorId) return;

    let cancelled = false;
    const currentActorId = actorId;

    async function loadActorMovies() {
      setLoading(true);
      setError(null);

      try {
        const [detailsResponse, creditsResponse] = await Promise.all([
          fetch(detailsEndpoint(currentActorId)),
          fetch(creditsEndpoint(currentActorId)),
        ]);

        if (!detailsResponse.ok || !creditsResponse.ok) {
          throw new Error("Unable to load actor movies.");
        }

        const details = (await detailsResponse.json()) as ActorDetails;
        const credits = (await creditsResponse.json()) as ActorCreditsResponse;
        if (cancelled) return;

        const seen = new Set<number>();
        const nextMovies = credits.cast
          .filter((movie) => movie.poster_path || movie.backdrop_path)
          .filter((movie) => {
            if (seen.has(movie.id)) return false;
            seen.add(movie.id);
            return true;
          })
          .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
          .map(normalizeMovie);

        setActor(details);
        setMovies(nextMovies);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load actor movies.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadActorMovies();
    return () => {
      cancelled = true;
    };
  }, [actorId]);

  return (
    <main className="page-shell actors-page actor-detail-page">
      <section className="actors-library actor-detail-hero">
        <Link href="/actors" className="genre-back-button">
          <ArrowLeft />
          Back to actors
        </Link>

        <div className="actor-detail-layout">
          <div className="actor-detail-portrait">
            {actor?.profile_path ? <img src={actorImage(actor.profile_path)} alt={actor.name} /> : <UserRound />}
          </div>
          <div className="actor-detail-copy">
            <p className="section-kicker">{actor?.known_for_department || "Actor"}</p>
            <h1>{actor?.name || "Actor movies"}</h1>
            <p>{actor?.biography || "Browse movies connected to this actor."}</p>
          </div>
        </div>
      </section>

      <section className="actors-library actor-movies-section" aria-live="polite">
        <div className="actor-movies-heading">
          <div>
            <p className="section-kicker">Movies</p>
            <h2>{actor ? `${actor.name} movies` : "Loading movies"}</h2>
          </div>
          {loading && <div className="netflix-loader" aria-label="Loading actor movies" />}
        </div>

        <div className="movies-grid actor-movies-grid">
          {movies.map((movie, index) => (
            <MovieCard key={`${actorId}-${movie.id}`} movie={movie} index={index} />
          ))}
          {loading &&
            Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={`actor-movie-loading-${index}`} className="movies-card-skeleton" />
            ))}
        </div>

        {error && <p className="movies-page-error">{error}</p>}
        {!loading && !error && movies.length === 0 && (
          <div className="genre-empty-state">
            <Film />
            <p>No movies found for this actor.</p>
          </div>
        )}
      </section>
    </main>
  );
}
