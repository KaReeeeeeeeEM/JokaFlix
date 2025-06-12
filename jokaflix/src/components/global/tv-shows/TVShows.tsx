import * as React from "react";
import { useFetch } from "../../../api";
import { SeriesCard } from "../cards/SeriesCard";
import type { TrendingMovie } from "../../../../types";
import { Drawer, DrawerContent, DrawerTrigger } from "../../ui/drawer";
import { FaTv } from "react-icons/fa";
import { Skeleton } from "../../ui/skeleton";
import { Button } from "../../ui/button";

export default function TVShows() {
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [allShows, setAllShows] = React.useState<TrendingMovie[]>([]);
  const [hasMore, setHasMore] = React.useState(true);
  const [isFetchingNext, setIsFetchingNext] = React.useState(false);

  // Fetch TV shows for the current page
  const { data, loading } = useFetch<{ results: TrendingMovie[] }>(
    {
      url: `https://api.themoviedb.org/3/tv/popular?api_key=${import.meta.env.VITE_TMDB_API_KEY}&page=${page}`,
    },
    { enabled: drawerOpen }
  );

  // Reset on drawer open/close
  React.useEffect(() => {
    if (!drawerOpen) {
      setPage(1);
      setAllShows([]);
      setHasMore(true);
      setIsFetchingNext(false);
    }
  }, [drawerOpen]);

  // Append new shows when data changes
  React.useEffect(() => {
    if (data?.results && drawerOpen) {
      setAllShows((prev) => {
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

  // Initial fetch for gallery (first 8 shows)
  const { data: initialData, loading: initialLoading } = useFetch<{ results: TrendingMovie[] }>({
    url: `https://api.themoviedb.org/3/tv/popular?api_key=${import.meta.env.VITE_TMDB_API_KEY}`,
  });
  const shows = initialData?.results || [];

  return (
    <section className="w-full px-4 py-8 mx-auto xl:px-16">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2 mb-6">
          <FaTv className="text-2xl text-primary" />
          <h2 className="text-2xl font-bold text-white">Series</h2>
        </div>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button
              variant={"ghost"}
              className="px-4 py-2 text-sm font-semibold text-white transition rounded cursor-pointer"
              onClick={() => setDrawerOpen(true)}
            >
              See More
            </Button>
          </DrawerTrigger>
          <DrawerContent className="w-full py-6 mx-auto overflow-hidden xl:px-12" style={{ maxHeight: "90vh" }}>
            <h3 className="flex items-center gap-2 py-6 text-xl font-bold text-primary">
              <FaTv /> All Series
            </h3>
            <div
              ref={gridRef}
              className="grid h-full grid-cols-2 gap-2 px-2 py-12 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-8"
              style={{ maxHeight: "80vh" }}
            >
              {allShows.map((show) => (
                <SeriesCard key={show.id} movie={show} />
              ))}
              {loading || isFetchingNext
                ? Array.from({ length: 16 }).map((_, i) => (
                    <Skeleton
                      key={i}
                      className="h-64 rounded-lg dark:bg-gray-900 w-42 md:w-48 md:h-[350px] animate-pulse"
                    />
                  ))
                : null}
              {!hasMore && allShows.length === 0 && (
                <div className="text-center text-gray-400 col-span-full">No popular TV shows found.</div>
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
      <div className="grid grid-cols-2 gap-2 py-4 sm:grid-cols-3 md:grid-cols-8">
        {initialLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <Skeleton
                key={i}
                className="h-[350px] rounded-lg dark:bg-gray-800 w-42 md:w-48 animate-pulse"
              />
            ))
          : shows
              .slice(0, 8)
              .map((show) => <SeriesCard key={show.id} movie={show} />)}
      </div>
    </section>
  );
}
