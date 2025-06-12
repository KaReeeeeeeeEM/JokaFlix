import { useEffect, useState } from "react";
import { Drawer, DrawerContent } from "../../ui/drawer";
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

  // Close drawer and clear url to /
  const handleClose = () => {
    navigate("/", { replace: true });
  };

  return (
    <Drawer open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DrawerContent className="w-full max-w-2xl p-6 mx-auto bg-black rounded-t-2xl">
        <div className="flex flex-col gap-4">
          <Input
            autoFocus
            placeholder="Search for movies, TV shows, people..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full px-4 py-3 text-lg text-white bg-gray-900 rounded-lg"
          />
          <div
            className="grid grid-cols-2 gap-4 py-4 overflow-y-auto md:grid-cols-3"
            style={{ maxHeight: "60vh" }}
          >
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-64 rounded-lg dark:bg-gray-900 w-44 md:w-52 md:h-[350px] animate-pulse" />
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
      </DrawerContent>
    </Drawer>
  );
}
