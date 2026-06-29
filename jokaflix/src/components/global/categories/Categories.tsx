"use client";

import React from "react";
import { useFetch } from "../../../api";
import { MovieCard } from "../cards/MovieCard";
import { Drawer, DrawerContent, DrawerTrigger } from "../../ui/drawer";
import { Button } from "../../ui/button";
import { Skeleton } from "../../ui/skeleton";
import type { TrendingMovie } from "../../../../types";

export default function Categories() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [selectedGenre, setSelectedGenre] = React.useState<{ id: number; name: string } | null>(null);
  const [page, setPage] = React.useState(1);
  const [allMovies, setAllMovies] = React.useState<TrendingMovie[]>([]);
  const [hasMore, setHasMore] = React.useState(true);
  const [isFetchingNext, setIsFetchingNext] = React.useState(false);

  // Fetch all genres
  const { data: genresData, loading: genresLoading } = useFetch<{ genres: { id: number; name: string }[] }>(
    {
      url: `https://api.themoviedb.org/3/genre/movie/list?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
    }
  );
  const genres = genresData?.genres || [];

  // Fetch movies for the selected genre and page
  const { data: moviesData, loading: moviesLoading } = useFetch<{ results: TrendingMovie[] }>(
    selectedGenre
      ? {
          url: `https://api.themoviedb.org/3/discover/movie?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&with_genres=${selectedGenre.id}&page=${page}`,
        }
      : { url: "" },
    { enabled: drawerOpen && !!selectedGenre }
  );

  // Reset on drawer open/close or genre change
  React.useEffect(() => {
    if (!drawerOpen) {
      setPage(1);
      setAllMovies([]);
      setHasMore(true);
      setIsFetchingNext(false);
    }
  }, [drawerOpen]);

  React.useEffect(() => {
    setPage(1);
    setAllMovies([]);
    setHasMore(true);
    setIsFetchingNext(false);
  }, [selectedGenre]);

  // Append new movies when data changes
  React.useEffect(() => {
    if (moviesData?.results && drawerOpen && selectedGenre) {
      setAllMovies((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        return [...prev, ...moviesData.results.filter((m) => !ids.has(m.id))];
      });
      if (moviesData.results.length < 20) setHasMore(false);
      setIsFetchingNext(false);
    }
  }, [moviesData, drawerOpen, selectedGenre]);

  // Infinite scroll handler (attach to the grid, not the drawer)
  const gridRef = React.useRef<HTMLDivElement>(null);
  const handleGridScroll = React.useCallback(() => {
    const el = gridRef.current;
    if (!el || !hasMore || moviesLoading || isFetchingNext) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
      setIsFetchingNext(true);
      setPage((p) => p + 1);
    }
  }, [hasMore, moviesLoading, isFetchingNext]);

  React.useEffect(() => {
    if (!drawerOpen) return;
    const el = gridRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleGridScroll);
    return () => el.removeEventListener("scroll", handleGridScroll);
  }, [drawerOpen, handleGridScroll]);

  return (
    <section className="catalog-section reveal-up">
      <div className="mx-auto max-w-4xl text-center">
        <p className="section-kicker">Find a mood</p>
        <h2 className="catalog-title">Browse categories</h2>
      </div>
      <div className="mx-auto mt-8 flex max-w-4xl gap-3 overflow-x-auto rounded-full border border-white/10 bg-white/[0.05] p-2">
        {genresLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 bg-gray-800 rounded w-28" />
            ))
          : genres.map((genre) => (
              <Drawer key={genre.id} open={drawerOpen && selectedGenre?.id === genre.id} onOpenChange={(open) => {
                setDrawerOpen(open);
                if (open) setSelectedGenre(genre);
              }}>
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    className="shrink-0 rounded-full border-0 bg-transparent px-5 py-2 text-sm font-semibold text-white/70 hover:bg-[#e50914] hover:text-white"
                    onClick={() => {
                      setSelectedGenre(genre);
                      setDrawerOpen(true);
                    }}
                  >
                    {genre.name}
                  </Button>
                </DrawerTrigger>
                <DrawerContent className="app-drawer mx-auto w-full overflow-hidden px-4 py-6 xl:px-12" style={{ maxHeight: "90vh" }}>
                  <h3 className="flex items-center gap-2 py-6 text-xl font-bold text-[#e50914]">
                    {genre.name} Movies
                  </h3>
                  <div
                    ref={gridRef}
                    className="grid h-full grid-cols-2 gap-3 overflow-y-auto py-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6"
                    style={{ maxHeight: "95vh" }}
                  >
                    {allMovies.map((movie) => (
                      <MovieCard key={movie.id} movie={movie} />
                    ))}
                    {moviesLoading || isFetchingNext
                      ? Array.from({ length: 16 }).map((_, i) => (
                          <Skeleton
                            key={i}
                            className="h-64 rounded-lg dark:bg-gray-900 w-42 md:w-52 md:h-[350px] animate-pulse"
                          />
                        ))
                      : null}
                    {!hasMore && allMovies.length === 0 && (
                      <div className="text-center text-gray-400 col-span-full">No movies found.</div>
                    )}
                  </div>
                  {isFetchingNext && (
                    <div className="flex justify-center py-4">
                      <span className="text-4xl text-white animate-pulse">...</span>
                    </div>
                  )}
                </DrawerContent>
              </Drawer>
            ))}
      </div>
    </section>
  );
}
