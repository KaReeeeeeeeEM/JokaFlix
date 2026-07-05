"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowRight, ChevronLeft, Film } from "lucide-react";
import { useFetch } from "../api";
import { Skeleton } from "../components/ui/skeleton";
import type { TrendingMovie } from "../../types";
import { MovieCard } from "../components/global/cards/MovieCard";
import { SeriesCard } from "../components/global/cards/SeriesCard";
import { trackAnalyticsEvent } from "../lib/analytics-client";

type Genre = {
  id: number;
  name: string;
};

export default function GenresPage() {
  const { data: genresData, loading: genresLoading } = useFetch<{ genres: Genre[] }>(
    {
      url: `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
    }
  );

  const { data: sampleData } = useFetch<{ results: TrendingMovie[] }>(
    {
      url: `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&page=1`,
    }
  );

  const genres = genresData?.genres || [];
  const samples = (sampleData?.results || []).filter((movie) => movie.poster_path || movie.backdrop_path);

  const genreSamples = React.useMemo(() => {
    return genres.map((genre) => {
      const matches = samples.filter((movie) => movie.genre_ids?.includes(genre.id));
      const pool = matches.length > 0 ? matches : samples;
      const cover = pool.length > 0 ? pool[(genre.id + genre.name.length) % pool.length] : undefined;
      return { ...genre, cover };
    });
  }, [genres, samples]);

  return (
    <main className="page-shell genres-page">
      <section className="page-hero centered-page-hero">
        <p className="section-kicker">Genres</p>
        <h1>Browse by mood</h1>
        <p>Pick a category and jump into a poster-backed shelf of movies in that genre.</p>
      </section>

      <section className="genre-card-grid">
        {genresLoading
          ? Array.from({ length: 8 }).map((_, index) => <Skeleton className="h-64 rounded-3xl" key={index} />)
          : genreSamples.map((genre) => (
              <Link
                href={`/genres/${genre.id}?name=${encodeURIComponent(genre.name)}`}
                className="genre-sample-card"
                onClick={() =>
                  trackAnalyticsEvent({
                    eventType: "category_click",
                    category: genre.name,
                    metadata: { genreId: genre.id, source: "genres-page" },
                  })
                }
                key={genre.id}
              >
                {genre.cover && (
                  <img
                    className="genre-sample-cover"
                    src={`https://image.tmdb.org/t/p/w780${genre.cover.backdrop_path || genre.cover.poster_path}`}
                    alt=""
                  />
                )}
                <span>{genre.name}</span>
                <ArrowRight className="h-5 w-5" />
              </Link>
            ))}
      </section>
    </main>
  );
}

type GenreTab = "movies" | "shows";

type GenrePageResponse = {
  page: number;
  total_pages: number;
  results: TrendingMovie[];
};

const normalizeGenreName = (name: string) =>
  name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const genreEndpoint = (tab: GenreTab, genreId: string, page: number) => {
  const key = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  const media = tab === "movies" ? "movie" : "tv";
  return `https://api.themoviedb.org/3/discover/${media}?api_key=${key}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`;
};

export function GenreDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = React.useState<GenreTab>("movies");
  const [page, setPage] = React.useState(1);
  const [items, setItems] = React.useState<TrendingMovie[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const requestRef = React.useRef(0);
  const genreName = searchParams?.get("name") || "Genre";
  const emptyLabel = activeTab === "movies" ? "movie" : "show";

  const { data: tvGenresData } = useFetch<{ genres: Genre[] }>(
    {
      url: `https://api.themoviedb.org/3/genre/tv/list?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
    }
  );

  const tvGenreId = React.useMemo(() => {
    const tvGenres = tvGenresData?.genres || [];
    const currentName = normalizeGenreName(genreName);
    const aliases: Record<string, string> = {
      action: "action and adventure",
      adventure: "action and adventure",
      "science fiction": "sci fi and fantasy",
      fantasy: "sci fi and fantasy",
      war: "war and politics",
    };
    const targetName = aliases[currentName] || currentName;
    return tvGenres.find((genre) => normalizeGenreName(genre.name) === targetName)?.id.toString() || id;
  }, [genreName, id, tvGenresData]);

  const selectedGenreId = activeTab === "shows" ? tvGenreId : id;

  React.useEffect(() => {
    setPage(1);
    setItems([]);
    setHasMore(true);
    setError(null);
  }, [activeTab, selectedGenreId]);

  React.useEffect(() => {
    if (!id) return;
    let cancelled = false;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    async function loadGenreItems() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(genreEndpoint(activeTab, selectedGenreId, page));
        if (!response.ok) throw new Error("Unable to load this genre.");
        const data = (await response.json()) as GenrePageResponse;
        if (cancelled || requestRef.current !== requestId) return;

        setItems((current) => {
          const seen = new Set(current.map((item) => item.id));
          const next = data.results
            .filter((item) => item.poster_path || item.backdrop_path)
            .filter((item) => !seen.has(item.id))
            .map((item) => ({ ...item, media_type: activeTab === "movies" ? "movie" : "tv" }));
          return page === 1 ? next : [...current, ...next];
        });
        setHasMore(data.page < data.total_pages);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load this genre.");
      } finally {
        if (!cancelled && requestRef.current === requestId) setLoading(false);
      }
    }

    loadGenreItems();
    return () => {
      cancelled = true;
    };
  }, [activeTab, id, page, selectedGenreId]);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading) {
          setPage((current) => current + 1);
        }
      },
      { root: null, rootMargin: "720px 0px", threshold: 0.01 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading]);

  return (
    <main className="page-shell movies-page genre-detail-page">
      <section className="page-hero movies-page-hero">
        <Link href="/genres" className="genre-back-button">
          <ChevronLeft aria-hidden="true" />
          Back to genres
        </Link>
        <p className="section-kicker">Selected mood</p>
        <h1>{genreName}</h1>
        <p>Movies and shows collected for this genre.</p>
      </section>

      <section className="movies-library">
        <div className="movies-tabs" role="tablist" aria-label={`${genreName} categories`}>
          {[
            ["movies", "Movies"],
            ["shows", "Shows"],
          ].map(([idValue, label]) => (
            <button
              key={idValue}
              type="button"
              role="tab"
              aria-selected={activeTab === idValue}
              className={activeTab === idValue ? "movies-tab is-active" : "movies-tab"}
              onClick={() => setActiveTab(idValue as GenreTab)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="movies-grid">
          {items.map((item, index) =>
            activeTab === "movies" ? (
              <MovieCard key={`${activeTab}-${item.id}`} movie={item} index={index} source={`${genreName} Movies`} />
            ) : (
              <SeriesCard key={`${activeTab}-${item.id}`} movie={item} index={index} source={`${genreName} Series`} />
            )
          )}
          {loading &&
            Array.from({ length: page === 1 ? 10 : 5 }).map((_, index) => (
              <Skeleton key={`${activeTab}-loading-${page}-${index}`} className="movies-card-skeleton" />
            ))}
        </div>

        {!loading && !error && items.length === 0 && (
          <div className="genre-empty-state" role="status">
            <Film aria-hidden="true" />
            <p>There is no {emptyLabel} for this category.</p>
          </div>
        )}

        {error && <p className="movies-page-error">{error}</p>}
        <div ref={sentinelRef} className="movies-scroll-sentinel" aria-hidden="true" />
      </section>
    </main>
  );
}
