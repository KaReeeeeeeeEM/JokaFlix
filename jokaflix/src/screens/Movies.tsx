"use client";

import * as React from "react";
import { Flame, PlayCircle } from "lucide-react";
import { MovieCard } from "../components/global/cards/MovieCard";
import { Skeleton } from "../components/ui/skeleton";
import type { TrendingMovie } from "../../types";

type MovieTab = "popular" | "now";

type MoviePageResponse = {
  page: number;
  total_pages: number;
  results: TrendingMovie[];
};

const tabs: Array<{ id: MovieTab; label: string; icon: React.ElementType }> = [
  { id: "popular", label: "Popular", icon: Flame },
  { id: "now", label: "Now streaming", icon: PlayCircle },
];

const tabEndpoint = (tab: MovieTab, page: number) => {
  const key = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (tab === "popular") {
    return `https://api.themoviedb.org/3/movie/popular?api_key=${key}&page=${page}`;
  }

  return `https://api.themoviedb.org/3/movie/now_playing?api_key=${key}&page=${page}`;
};

export default function MoviesPage() {
  const [activeTab, setActiveTab] = React.useState<MovieTab>("popular");
  const [page, setPage] = React.useState(1);
  const [movies, setMovies] = React.useState<TrendingMovie[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const requestRef = React.useRef(0);

  React.useEffect(() => {
    setPage(1);
    setMovies([]);
    setHasMore(true);
    setError(null);
  }, [activeTab]);

  React.useEffect(() => {
    let cancelled = false;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    async function loadMovies() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(tabEndpoint(activeTab, page));
        if (!response.ok) throw new Error("Unable to load movies.");
        const data = (await response.json()) as MoviePageResponse;
        if (cancelled || requestRef.current !== requestId) return;

        setMovies((current) => {
          const seen = new Set(current.map((movie) => movie.id));
          const next = data.results
            .filter((movie) => movie.poster_path || movie.backdrop_path)
            .filter((movie) => !seen.has(movie.id))
            .map((movie) => ({ ...movie, media_type: "movie" }));
          return page === 1 ? next : [...current, ...next];
        });
        setHasMore(data.page < data.total_pages);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load movies.");
      } finally {
        if (!cancelled && requestRef.current === requestId) setLoading(false);
      }
    }

    loadMovies();
    return () => {
      cancelled = true;
    };
  }, [activeTab, page]);

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
    <main className="page-shell movies-page">
      <section className="page-hero movies-page-hero">
        <p className="section-kicker">Movies</p>
        <h1>Movies built for discovery</h1>
        <p>Switch between what is popular and what is streaming now.</p>
      </section>

      <section className="movies-library">
        <div className="movies-tabs" role="tablist" aria-label="Movie categories">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={active ? "movies-tab is-active" : "movies-tab"}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="movies-grid">
          {movies.map((movie, index) => (
            <MovieCard key={`${activeTab}-${movie.id}`} movie={movie} index={index} />
          ))}
          {loading &&
            Array.from({ length: page === 1 ? 10 : 5 }).map((_, index) => (
              <Skeleton key={`${activeTab}-loading-${page}-${index}`} className="movies-card-skeleton" />
            ))}
        </div>

        {error && <p className="movies-page-error">{error}</p>}
        <div ref={sentinelRef} className="movies-scroll-sentinel" aria-hidden="true" />
      </section>
    </main>
  );
}
