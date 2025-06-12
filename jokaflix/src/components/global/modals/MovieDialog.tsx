import React from "react";
import type { TrendingMovie } from "../../../../types";
import { useFetch } from "../../../api";
import { Dialog, DialogContent } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { FaDownload, FaPlay, FaTimes } from "react-icons/fa";
import { MovieCard } from "../cards/MovieCard";
import { useNavigate, useLocation } from "react-router-dom";

export default function MovieDialog({ movie, open, setOpen }: { movie: TrendingMovie; open: boolean; setOpen: (v: boolean) => void }) {
  const [relatedPage, setRelatedPage] = React.useState(1);
  const [relatedMovies, setRelatedMovies] = React.useState<TrendingMovie[]>([]);
  const [hasMoreRelated, setHasMoreRelated] = React.useState(true);
  const [isFetchingRelated, setIsFetchingRelated] = React.useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handlePlay = () => {
    const basePath = `/play/movie/${movie.id}`
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("play", "1");
    searchParams.set("type", movie.media_type === "tv" ? "tv" : "movie");
    if (movie.media_type === "tv") {
      searchParams.set("full", "1");
    } else {
      searchParams.delete("full");
    }
    searchParams.delete("season");
    searchParams.delete("episode");
    navigate({
      pathname: basePath,
      search: searchParams.toString(),
    }, { replace: false });
  };

  // Fetch related movies
  const { data: relatedData, loading: relatedLoading } = useFetch<{
    results: TrendingMovie[];
  }>(
    movie.media_type === "movie"
      ? {
          url: `https://api.themoviedb.org/3/movie/${
            movie.id
          }/similar?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&page=${relatedPage}`,
        }
      : { url: "" },
    { enabled: open && movie.media_type === "movie" }
  );

  // Fetch movie details (for runtime, production companies, languages)
  const { data: movieDetails } = useFetch<any>(
    movie.media_type === "movie"
      ? {
          url: `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&append_to_response=credits`,
        }
      : { url: "" },
    { enabled: open && movie.media_type === "movie" }
  );

  // Fetch TV details (for seasons, production companies, languages, credits)
  const { data: seriesData, loading: seriesLoading } = useFetch<any>(
    movie.media_type === "tv"
      ? {
          url: `https://api.themoviedb.org/3/tv/${movie.id}?api_key=${
            import.meta.env.VITE_TMDB_API_KEY
          }&append_to_response=credits`,
        }
      : { url: "" },
    { enabled: open && movie.media_type === "tv" }
  );

  // Fetch genres list (global TMDB genres)
  const { data: genresData } = useFetch<{ genres: { id: number; name: string }[] }>(
    {
      url: `https://api.themoviedb.org/3/genre/${movie.media_type === "tv" ? "tv" : "movie"}/list?api_key=${import.meta.env.VITE_TMDB_API_KEY}`,
    },
    { enabled: open }
  );

  // Fetch videos (trailers, teasers, etc)
  const { data: videosData } = useFetch<any>(
    {
      url: `https://api.themoviedb.org/3/${movie.media_type}/${movie.id}/videos?api_key=${import.meta.env.VITE_TMDB_API_KEY}`,
    },
    { enabled: open }
  );
  const trailers = videosData?.results?.filter(
    (v: any) => v.site === "YouTube" && v.type === "Trailer"
  ) || [];

  React.useEffect(() => {
    if (open && movie.media_type === "movie") {
      setRelatedMovies([]);
      setRelatedPage(1);
      setHasMoreRelated(true);
    }
  }, [open, movie.id, movie.media_type]);

  React.useEffect(() => {
    if (relatedData?.results && open && movie.media_type === "movie") {
      setRelatedMovies((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        return [...prev, ...relatedData.results.filter((m) => !ids.has(m.id))];
      });
      if (relatedData.results.length < 20) setHasMoreRelated(false);
      setIsFetchingRelated(false);
    }
  }, [relatedData, open, movie.media_type]);

  const relatedListRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open || movie.media_type !== "movie") return;
    const el = relatedListRef.current;
    if (!el) return;
    const handleScroll = () => {
      if (!hasMoreRelated || relatedLoading || isFetchingRelated) return;
      if (el.scrollTop + el.clientHeight >= el.scrollHeight - 100) {
        setIsFetchingRelated(true);
        setRelatedPage((p) => p + 1);
      }
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, [
    open,
    hasMoreRelated,
    relatedLoading,
    isFetchingRelated,
    movie.media_type,
  ]);

  const getRuntime = (min: number) => {
    if (!min) return "";
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  // Map genre ids to names
  const genreMap = React.useMemo(() => {
    if (!genresData?.genres) return {};
    const map: Record<number, string> = {};
    genresData.genres.forEach((g) => (map[g.id] = g.name));
    return map;
  }, [genresData]);

  // Get details for display
  const details = movie.media_type === "movie" ? movieDetails : seriesData;
  const productionCompanies = details?.production_companies || [];
  const spokenLanguages = details?.spoken_languages || [];
  const credits = details?.credits;
  const actors = credits?.cast?.slice(0, 20) || [];

  // Only show rating if > 0
  const showRating =
    typeof movie.vote_average === "number" && movie.vote_average > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="flex flex-col p-0 bg-black rounded-lg md:overflow-hidden"
        style={{
          width: "100vw",
          maxWidth: "1200px",
          height: "95vh",
          maxHeight: "95vh",
          minHeight: "400px",
          padding: 0,
        }}
      >
        {/* Close button */}
        <Button
          className="absolute z-20 flex items-center justify-center w-10 h-10 text-xl text-white transition rounded-full cursor-pointer top-4 right-4 bg-black/70 hover:bg-black/90"
          onClick={() => setOpen(false)}
          aria-label="Close"
          type="button"
        >
          <FaTimes />
        </Button>
        {/* Backdrop with gradient and poster overlay */}
        <div
          className="relative w-full"
          style={{ height: "45vh", minHeight: 420 }}
        >
          <div
            className="absolute inset-0 w-full h-full bg-center bg-cover"
            style={{
              backgroundImage: `url(https://image.tmdb.org/t/p/original${
                movie.backdrop_path || movie.poster_path
              })`,
            }}
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-black/10 via-black/60 to-black/95" />
          {/* Poster and title at the bottom left */}
          <div className="relative z-10 flex items-end h-full gap-6 px-2 pb-8 md:px-8">
            <img
              src={`https://image.tmdb.org/t/p/w342${movie.poster_path || movie.backdrop_path}`}
              alt={movie.title}
              className="hidden -mb-8 rounded-lg shadow-lg w-28 md:w-44 xl:flex"
              style={{ boxShadow: "0 8px 32px 0 rgba(0,0,0,0.7)" }}
            />
            <div className="mb-2">
              <h2 className="mb-2 text-3xl font-bold text-white drop-shadow">
                {movie.title}
              </h2>
              {/* Show original title if different */}
              {movie.original_title && movie.original_title !== movie.title && (
                <div className="mb-1 text-sm italic text-gray-300">
                  Original Title: {movie.original_title}
                </div>
              )}
              <div className="flex items-center gap-4 mb-2">
                {showRating && (
                  <span className="text-lg font-bold text-primary">
                    {movie.vote_average.toFixed(1)}
                  </span>
                )}
                {/* Show vote count if available */}
                {typeof movie.vote_count === "number" && (
                  <span className="hidden text-xs text-gray-400 xl:flex">
                    {movie.vote_count} votes
                  </span>
                )}
                <span className="text-gray-300">
                  {movie.release_date?.slice(0, 4) || movie.first_air_date?.slice(0, 4) || "N/A"}
                </span>
                <span className="text-xs text-gray-400 uppercase">
                  {movie.original_language || "N/A"}
                </span>
                {movie.media_type === "movie" && details?.runtime && (
                  <span className="text-xs text-gray-400">
                    {getRuntime(details.runtime)}
                  </span>
                )}
                {movie.media_type === "tv" && details?.seasons && (
                  <span className="text-xs text-gray-400">
                    {details.seasons.length} season
                    {details.seasons.length > 1 ? "s" : ""}
                  </span>
                )}
                {/* Show popularity if available */}
                {typeof movie.popularity === "number" && (
                  <span className="hidden text-xs text-gray-400 xl:flex">
                    Popularity: {movie.popularity.toFixed(0)}
                  </span>
                )}
                {/* Show adult flag if present */}
                {"adult" in movie && (
                  <span className={`text-xs font-bold ${movie.adult ? "text-red-500" : "text-green-400"}`}>
                    {movie.adult ? "18+" : "Family"}
                  </span>
                )}
              </div>
              <div className="flex gap-4 pt-2">
                <Button
                  variant={"outline"}
                  className="flex items-center gap-2 px-6 py-2 font-semibold text-white transition bg-orange-600 rounded cursor-pointer hover:bg-orange-700"
                  onClick={handlePlay}
                >
                  <FaPlay /> Play
                </Button>
                <Button className="flex items-center gap-2 px-4 py-2 font-semibold text-white transition bg-gray-700 rounded cursor-pointer hover:bg-gray-800">
                  <FaDownload /> Download
                </Button>
              </div>
            </div>
          </div>
        </div>
        {/* Details at the bottom */}
        <div className="px-2 overflow-y-auto md:py-8 flex-1px bg-black/90">
          <h3 className="font-semibold text-primary">Overview</h3>
          {/* Show overview or fallback if missing */}
          <p className="mb-4 text-gray-200">
            {movie.overview && movie.overview.trim().length > 0
              ? movie.overview
              : <span className="italic text-gray-400">No overview available for this title.</span>
            }
          </p>
          {/* Genres */}
          <div className="flex flex-wrap gap-2 py-4">
            {movie.genre_ids && movie.genre_ids.length > 0
              ? movie.genre_ids.map((id) =>
                  genreMap[id] ? (
                    <span
                      key={id}
                      className="px-2 py-1 text-xs text-white rounded bg-orange-600/80"
                    >
                      {genreMap[id]}
                    </span>
                  ) : null
                )
              : details?.genres?.map((g: any) => (
                  <span
                    key={g.id}
                    className="px-2 py-1 text-xs text-white rounded bg-orange-600/80"
                  >
                    {g.name}
                  </span>
                ))}
            {/* Fallback if no genres */}
            {(!movie.genre_ids || movie.genre_ids.length === 0) && (!details?.genres || details.genres.length === 0) && (
              <span className="px-2 py-1 text-xs text-gray-400 bg-gray-700 rounded">
                No genres available
              </span>
            )}
          </div>
          {/* Production Companies */}
          {productionCompanies.length > 0 && (
            <div className="mb-4">
              <h4 className="py-2 text-sm font-bold text-primary">Production Companies</h4>
              <div className="flex flex-wrap gap-3 py-1">
                {productionCompanies.map((company: any) => (
                  <div key={company.id} className="flex items-center gap-2">
                    {company.logo_path && (
                      <img
                        src={`https://image.tmdb.org/t/p/w45${company.logo_path}`}
                        alt={company.name}
                        className="object-cover w-6 h-6 bg-white rounded"
                        style={{ background: "#fff" }}
                      />
                    )}
                    <span className="text-xs text-white">{company.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Spoken Languages */}
          {spokenLanguages.length > 0 && (
            <div className="py-4">
              <h4 className="mb-1 text-sm font-bold text-primary">Languages</h4>
              <div className="flex flex-wrap gap-2 py-1">
                {spokenLanguages.map((lang: any) => (
                  <span key={lang.iso_639_1} className="px-2 py-1 text-xs text-white bg-gray-700 rounded">
                    {lang.english_name || lang.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {/* Actors */}
          {actors.length > 0 && (
            <div className="py-4">
              <h4 className="py-1 text-sm font-bold text-primary">Actors</h4>
              <div className="flex gap-4 py-2 overflow-x-auto">
                {actors.map((actor: any) => (
                  <div key={actor.id} className="flex flex-col items-center min-w-[80px]">
                    <img
                      src={
                        actor.profile_path
                          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                          : "https://ui-avatars.com/api/?name=" + encodeURIComponent(actor.name)
                      }
                      alt={actor.name}
                      className="object-cover w-16 h-16 mb-1 bg-gray-800 rounded-full"
                    />
                    <span className="text-xs text-center text-white">{actor.name}</span>
                    <span className="text-[10px] text-gray-400 text-center">{actor.character}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Trailers */}
          {trailers.length > 0 && (
            <div className="py-4">
              <h4 className="py-1 text-sm font-bold text-primary">Trailers</h4>
              <div className="flex gap-4 py-2 overflow-x-auto">
                {trailers.map((trailer: any) => (
                  <div key={trailer.id} className="min-w-[320px] max-w-[400px] border border-neutral-300 dark:border-neutral-700 rounded-lg">
                    <div className="w-full overflow-hidden bg-black rounded-lg aspect-video">
                      <iframe
                        width="100%"
                        height="200"
                        src={`https://www.youtube.com/embed/${trailer.key}`}
                        title={trailer.name}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                    <div className="py-1 text-xs text-center text-white truncate">{trailer.name}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {/* Series: Show seasons */}
          {movie.media_type === "tv" && (
            <div className="py-4">
              <h3 className="mb-2 text-lg font-bold text-primary">
                Seasons
              </h3>
              {seriesLoading ? (
                <div className="text-gray-400">Loading seasons...</div>
              ) : (
                <div className="flex gap-4 overflow-x-auto">
                  {details?.seasons?.map((season: any) => (
                    <div
                      key={season.id}
                      className="flex flex-col items-center min-w-[100px]"
                    >
                      <img
                        src={
                          season.poster_path
                            ? `https://image.tmdb.org/t/p/w185${season.poster_path}`
                            : ""
                        }
                        alt={season.name}
                        className="object-cover w-20 mb-1 bg-gray-800 rounded h-28"
                      />
                      <span className="text-xs text-center text-white">
                        {season.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Movie: Show related movies in a grid with infinite vertical scroll */}
          {movie.media_type === "movie" && (
            <div>
              <h3 className="py-2 text-lg font-bold text-primary">
                Related Movies
              </h3>
              <div
                ref={relatedListRef}
                className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 md:overflow-y-auto xl:grid-cols-5 max-h-72"
                style={{ minHeight: 160 }}
              >
                {relatedMovies.map((related) => (
                  <MovieCard key={related.id} movie={related} />
                ))}
                {relatedLoading || isFetchingRelated ? (
                  <div className="text-center text-gray-400 col-span-full">
                    Loading...
                  </div>
                ) : null}
                {!hasMoreRelated && relatedMovies.length === 0 && (
                  <div className="text-center text-gray-400 col-span-full">
                    No related movies found.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}