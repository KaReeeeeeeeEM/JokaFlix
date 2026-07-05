"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { PlayCircle, Search } from "lucide-react";
import type { TrendingMovie } from "../../../../types";
import { useFetch } from "../../../api";
import { trackAnalyticsEvent } from "../../../lib/analytics-client";

export default function SearchDrawer() {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const searchParams = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const open = searchParams?.get("search") === "1";

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(query.trim()), 350);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const { data, loading } = useFetch<{ results: TrendingMovie[] }>(
    debounced
      ? {
          url: `https://api.themoviedb.org/3/search/multi?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&query=${encodeURIComponent(debounced)}`,
        }
      : { url: "" },
    { enabled: open && debounced.length > 1 }
  );

  const { data: suggestionsData, loading: suggestionsLoading } = useFetch<{ results: TrendingMovie[] }>(
    {
      url: `https://api.themoviedb.org/3/trending/all/day?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
    },
    { enabled: open && debounced.length <= 1 }
  );

  const mediaFilter = (item: any) =>
    (item.media_type === "movie" || item.media_type === "tv") &&
    (item.poster_path || item.backdrop_path);

  const results = useMemo(
    () => (data?.results || []).filter(mediaFilter),
    [data]
  );

  const suggestions = useMemo(
    () => (suggestionsData?.results || []).filter(mediaFilter).slice(0, 12),
    [suggestionsData]
  );

  const showingResults = debounced.length > 1;
  const visibleItems = showingResults ? results : suggestions;
  const isLoading = showingResults ? loading : suggestionsLoading;

  useEffect(() => {
    if (!open || !resultsRef.current) return;
    const rows = Array.from(resultsRef.current.querySelectorAll(".search-suggestion-row"));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { root: resultsRef.current, threshold: 0.12 }
    );
    rows.forEach((row) => observer.observe(row));
    return () => observer.disconnect();
  }, [open, visibleItems]);

  const handleClose = () => {
    const next = new URLSearchParams(searchParams?.toString());
    next.delete("search");
    setQuery("");
    setDebounced("");
    const queryString = next.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
  };

  const handleResultClick = (item: any, title: string, isSeries: boolean) => {
    trackAnalyticsEvent({
      eventType: "movie_click",
      mediaType: isSeries ? "tv" : "movie",
      tmdbId: item.id,
      title,
      category: showingResults ? "Search" : "Search suggestions",
      metadata: {
        query: debounced,
        source: showingResults ? "search-results" : "search-suggestions",
      },
    });

    if (showingResults) {
      trackAnalyticsEvent({
        eventType: "search",
        category: "Search",
        metadata: {
          query: debounced,
          resultId: item.id,
          resultTitle: title,
          mediaType: isSeries ? "tv" : "movie",
        },
      });
    }

    handleClose();
  };

  if (!open) return null;

  return (
    <div className="search-overlay fixed inset-0 z-50 backdrop-blur-2xl">
      <div className="search-gradient" />
      <div className="search-phone-shell">
        <div className="search-mobile-bar">
          <div className="search-input-wrap">
            <Search className="h-5 w-5 text-[#e50914]" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search Here"
              className="search-input"
            />
          </div>
          <button
            className="search-cancel-button"
            type="button"
            aria-label="Close search"
            onClick={handleClose}
          >
            Cancel
          </button>
        </div>

        <div ref={resultsRef} className="search-list-panel">
          <div className="search-list-heading">
            <h2>{showingResults ? `Results for "${debounced}"` : "Movies & TV"}</h2>
            {isLoading && <div className="netflix-loader" aria-label="Loading search results" />}
          </div>

          {isLoading ? (
            <div className="search-suggestion-list">
              {Array.from({ length: 8 }).map((_, index) => (
                <div className="search-row-skeleton" key={index}>
                  <span />
                  <strong />
                  <i />
                </div>
              ))}
            </div>
          ) : visibleItems.length > 0 ? (
            <div className="search-suggestion-list">
              {visibleItems.map((item: any, index) => {
                const title = item.title || item.name;
                const isSeries = item.media_type === "tv";
                return (
                  <Link
                    href={isSeries ? `/series/${item.id}` : `/movie/${item.id}`}
                    onClick={() => handleResultClick(item, title, isSeries)}
                    className="search-suggestion-row"
                    style={{ transitionDelay: `${Math.min(index, 18) * 35}ms` }}
                    key={`${item.media_type}-${item.id}`}
                  >
                    <img
                      src={`https://image.tmdb.org/t/p/w500${item.poster_path || item.backdrop_path}`}
                      alt={title}
                      className="search-suggestion-thumb"
                    />
                    <span className="search-suggestion-copy">
                      <strong>{title}</strong>
                      <span>
                        {isSeries ? "Series" : "Movie"} • {(item.release_date || item.first_air_date || "").slice(0, 4) || "N/A"}
                      </span>
                    </span>
                    <span className="search-suggestion-play" aria-hidden="true">
                      <PlayCircle className="h-8 w-8" />
                    </span>
                  </Link>
                );
              })}
            </div>
          ) : debounced.length > 1 ? (
            <div className="search-empty-state">
              No movies or series found.
            </div>
          ) : (
            <div className="search-empty-state">
              Start typing to search movies and series.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
