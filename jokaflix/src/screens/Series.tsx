"use client";

import * as React from "react";
import { MonitorPlay, Tv } from "lucide-react";
import { SeriesCard } from "../components/global/cards/SeriesCard";
import { Skeleton } from "../components/ui/skeleton";
import type { TrendingMovie } from "../../types";

type SeriesTab = "popular" | "airing";

type SeriesPageResponse = {
  page: number;
  total_pages: number;
  results: TrendingMovie[];
};

const tabs: Array<{ id: SeriesTab; label: string; icon: React.ElementType }> = [
  { id: "popular", label: "Popular", icon: Tv },
  { id: "airing", label: "Airing now", icon: MonitorPlay },
];

const tabEndpoint = (tab: SeriesTab, page: number) => {
  const key = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (tab === "airing") {
    return `https://api.themoviedb.org/3/tv/on_the_air?api_key=${key}&page=${page}`;
  }

  return `https://api.themoviedb.org/3/tv/popular?api_key=${key}&page=${page}`;
};

export default function SeriesPage() {
  const [activeTab, setActiveTab] = React.useState<SeriesTab>("popular");
  const [page, setPage] = React.useState(1);
  const [shows, setShows] = React.useState<TrendingMovie[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  const requestRef = React.useRef(0);

  React.useEffect(() => {
    setPage(1);
    setShows([]);
    setHasMore(true);
    setError(null);
  }, [activeTab]);

  React.useEffect(() => {
    let cancelled = false;
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;

    async function loadShows() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(tabEndpoint(activeTab, page));
        if (!response.ok) throw new Error("Unable to load shows.");
        const data = (await response.json()) as SeriesPageResponse;
        if (cancelled || requestRef.current !== requestId) return;

        setShows((current) => {
          const seen = new Set(current.map((show) => show.id));
          const next = data.results
            .filter((show) => show.poster_path || show.backdrop_path)
            .filter((show) => !seen.has(show.id))
            .map((show) => ({ ...show, media_type: "tv" }));
          return page === 1 ? next : [...current, ...next];
        });
        setHasMore(data.page < data.total_pages);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Unable to load shows.");
      } finally {
        if (!cancelled && requestRef.current === requestId) setLoading(false);
      }
    }

    loadShows();
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
    <main className="page-shell series-page movies-page">
      <section className="page-hero movies-page-hero">
        <p className="section-kicker">Series</p>
        <h1>Series worth coming back to</h1>
        <p>Browse shows on dedicated shareable pages.</p>
      </section>

      <section className="movies-library">
        <div className="movies-tabs" role="tablist" aria-label="Series categories">
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
          {shows.map((show, index) => (
            <SeriesCard key={`${activeTab}-${show.id}`} movie={show} index={index} />
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
