import { useEffect, useState } from "react";
import { Drawer, DrawerContent } from "../../ui/drawer";
import { Dialog, DialogContent } from "../../ui/dialog";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "../../ui/input";
import { MovieCard } from "../cards/MovieCard";
import { Skeleton } from "../../ui/skeleton";
import type { TrendingMovie } from "../../../../types";
import { useFetch } from "../../../api";

export default function SearchDrawer() {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const open = searchParams.get("search") === "1";

  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState(query);

  // Responsive: detect large screens (lg: 1024px+)
  const [isLargeScreen, setIsLargeScreen] = useState(() =>
    typeof window !== "undefined"
      ? window.matchMedia("(min-width: 1024px)").matches
      : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = () => setIsLargeScreen(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  // Fetch search results
  const { data, loading } = useFetch<{ results: TrendingMovie[] }>(
    debounced
      ? {
          url: `https://api.themoviedb.org/3/search/multi?api_key=${import.meta.env.VITE_TMDB_API_KEY}&query=${encodeURIComponent(
            debounced
          )}`,
        }
      : { url: "" },
    { enabled: open && !!debounced }
  );
  const results = data?.results || [];

  // Close and clear url to /
  const handleClose = () => {
    navigate("/", { replace: true });
  };

  // Shared content
  const content = (
    <div className="flex flex-col flex-1 min-h-0 gap-4">
      <div className="sticky top-0 z-10 pt-6 pb-2 bg-black">
        <Input
          autoFocus
          placeholder="Search for movies, TV shows, people..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full px-4 py-3 text-lg text-white bg-gray-900 rounded-lg"
        />
      </div>
      <div
        className="grid flex-1 min-h-0 grid-cols-2 gap-2 pb-4 overflow-x-hidden overflow-y-auto md:grid-cols-3"
      >
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg dark:bg-gray-900 w-44 md:w-48 md:h-[350px] animate-pulse" />
            ))
          : results
              .filter((item: any) => item.media_type === "movie" || item.media_type === "tv")
              .map((item: any) => (
                <MovieCard key={item.id + item.media_type} movie={item} />
              ))}
        {!loading && results.length === 0 && debounced && (
          <div className="text-center text-gray-400 col-span-full">No results found.</div>
        )}
      </div>
    </div>
  );

  if (isLargeScreen) {
    // Drawer for large screens
    return (
      <Drawer open={open} onOpenChange={v => { if (!v) handleClose(); }}>
        <DrawerContent className="flex flex-col w-full max-w-2xl mx-auto bg-black rounded-t-2xl overflow-hidden h-[100dvh] min-h-[60dvh]">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  // Modal for small/medium screens
  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent className="flex flex-col w-full max-w-lg mx-auto bg-black rounded-lg overflow-hidden h-[85dvh] min-h-[60dvh] p-0">
        {content}
      </DialogContent>
    </Dialog>
  );
}
