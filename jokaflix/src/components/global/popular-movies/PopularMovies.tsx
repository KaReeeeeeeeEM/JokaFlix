"use client";

import * as React from "react";
import { useFetch } from "../../../api";
import { MediaCardSkeleton, MovieCard } from "../cards/MovieCard";
import type { TrendingMovie } from "../../../../types";
import { Drawer, DrawerContent, DrawerTrigger } from "../../ui/drawer";
import { Skeleton } from "../../ui/skeleton";
import { Button } from "../../ui/button";
import { ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function PopularMovies() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [allMovies, setAllMovies] = React.useState<TrendingMovie[]>([]);
  const [hasMore, setHasMore] = React.useState(true);
  const [isFetchingNext, setIsFetchingNext] = React.useState(false);
  const [activePreview, setActivePreview] = React.useState(0);
  const stripRef = React.useRef<HTMLDivElement>(null);

  // Fetch movies for the current page
  const { data, loading } = useFetch<{ results: TrendingMovie[] }>(
    {
      url: `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&page=${page}`,
    },
    { enabled: drawerOpen }
  );

  // Reset on drawer open/close
  React.useEffect(() => {
    if (!drawerOpen) {
      setPage(1);
      setAllMovies([]);
      setHasMore(true);
      setIsFetchingNext(false);
    }
  }, [drawerOpen]);

  // Append new movies when data changes
  React.useEffect(() => {
    if (data?.results && drawerOpen) {
      setAllMovies((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        return [...prev, ...data.results.filter((m) => !ids.has(m.id))];
      });
      if (data.results.length < 20) setHasMore(false);
      setIsFetchingNext(false);
    }
  }, [data, drawerOpen]);

  // Infinite scroll handler (attach to the grid, not the drawer)
  const gridRef = React.useRef<HTMLDivElement>(null);
  const handleGridScroll = React.useCallback(() => {
    const el = gridRef.current;
    if (!el || !hasMore || loading || isFetchingNext) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      setIsFetchingNext(true);
      setPage((p) => p + 1);
    }
  }, [hasMore, loading, isFetchingNext]);

  React.useEffect(() => {
    if (!drawerOpen) return;
    const el = gridRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleGridScroll);
    return () => el.removeEventListener("scroll", handleGridScroll);
  }, [drawerOpen, handleGridScroll]);

  // Initial fetch for gallery (first 8 movies)
  const { data: initialData, loading: initialLoading } = useFetch<{ results: TrendingMovie[] }>({
    url: `https://api.themoviedb.org/3/movie/popular?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=credits,external_ids,videos,images`,
  });
  const movies = initialData?.results || [];

  const handleStripScroll = React.useCallback(() => {
    const strip = stripRef.current;
    if (!strip || window.innerWidth >= 768) return;

    const stripCenter = strip.getBoundingClientRect().left + strip.clientWidth / 2;
    const cards = Array.from(strip.querySelectorAll<HTMLElement>(".movie-card-link"));
    const nearest = cards.reduce(
      (best, card, index) => {
        const rect = card.getBoundingClientRect();
        const distance = Math.abs(rect.left + rect.width / 2 - stripCenter);
        return distance < best.distance ? { distance, index } : best;
      },
      { distance: Number.POSITIVE_INFINITY, index: 0 }
    );
    setActivePreview(nearest.index);
  }, []);

  return (
    <section className="catalog-section reveal-up">
      <div className="catalog-heading">
        <h2 className="catalog-title">Your Next Watch</h2>
        <Button asChild variant={"ghost"} className="catalog-more-button">
          <Link href="/movies">
            See more <ArrowRight size={18} />
          </Link>
        </Button>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              variant={"ghost"}
              className="catalog-more-button hidden"
              onClick={() => setDrawerOpen(true)}
            >
              See more <ArrowRight size={18} />
            </Button>
          </DrawerTrigger>
          <DrawerContent className="app-drawer mx-auto w-full overflow-hidden px-4 py-6 xl:px-12" style={{ maxHeight: "90vh" }}>
            <h3 className="flex items-center gap-2 py-6 text-xl font-bold text-[#e50914]">
              <TrendingUp /> All Popular Movies
            </h3>
            <div
              ref={gridRef}
              className="grid h-full grid-cols-2 gap-3 overflow-y-auto px-2 py-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6"
              style={{ maxHeight: "80vh" }}
            >
              {allMovies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
              {loading || isFetchingNext
                ? Array.from({ length: 16 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-64 rounded-lg dark:bg-gray-900 w-42 md:w-48 md:h-[350px] animate-pulse"
                    />
                  ))
                : null}
              {!hasMore && allMovies.length === 0 && (
                <div className="text-center text-gray-400 col-span-full">No popular movies found.</div>
              )}
            </div>
            {isFetchingNext && (
              <div className="flex justify-center py-4">
                <span className="text-4xl text-white animate-pulse">...</span>
              </div>
            )}
          </DrawerContent>
        </Drawer>
      </div>
      <div className="movie-strip" ref={stripRef} onScroll={handleStripScroll}>
        {initialLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <MediaCardSkeleton key={i} index={i} active={i === activePreview} />
            ))
          : movies
              .slice(0, 5)
              .map((movie, index) => <MovieCard key={movie.id} movie={movie} index={index} active={index === activePreview} />)}
      </div>
    </section>
  );
}
