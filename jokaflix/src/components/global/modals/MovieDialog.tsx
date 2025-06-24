import React from "react";
import type { TrendingMovie } from "../../../../types";
import { useFetch } from "../../../api";
import { Dialog, DialogContent } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { FaDownload, FaPlay, FaShare, FaTimes } from "react-icons/fa";
import { MovieCard } from "../cards/MovieCard";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Dialog as ShadDialog,
  DialogContent as ShadDialogContent,
} from "../../ui/dialog";

// Custom type for normalized torrent data
interface Torrent {
  source: string;
  quality: string;
  size: string;
  hash: string;
  magnet: string;
  title: string;
  coverImage?: string;
}

// Custom hook to fetch torrents from multiple sources
function useTorrents(imdbId: string | null, enabled: boolean) {
  // YTS fetch
  const { data: ytsData, loading: ytsLoading } = useFetch<any>(
    enabled && imdbId
      ? {
          url: `https://yts.mx/api/v2/list_movies.json?query_term=${imdbId}`,
        }
      : { url: "" },
    { enabled: enabled && !!imdbId }
  );

  // 1337x fetch (hypothetical API)
  const { data: leetxData, loading: leetxLoading } = useFetch<any>(
    enabled && imdbId
      ? {
          url: `https://api.1337x.to/search?imdb=${imdbId}`,
        }
      : { url: "" },
    { enabled: enabled && !!imdbId }
  );

  // RARBG fetch (hypothetical API)
  const { data: rarbgData, loading: rarbgLoading } = useFetch<any>(
    enabled && imdbId
      ? {
          url: `https://api.rarbg.to/search?imdb=${imdbId}`,
        }
      : { url: "" },
    { enabled: enabled && !!imdbId }
  );

  // Normalize and combine torrents
  const torrents = React.useMemo(() => {
    const allTorrents: Torrent[] = [];

    // Normalize YTS torrents
    if (ytsData?.data?.movies?.[0]?.torrents) {
      const movie = ytsData.data.movies[0];
      movie.torrents.forEach((torrent: any) => {
        allTorrents.push({
          source: "YTS",
          quality: torrent.quality,
          size: torrent.size,
          hash: torrent.hash,
          magnet: `magnet:?xt=urn:btih:${torrent.hash}&dn=${encodeURIComponent(
            movie.title
          )}&tr=udp://open.demonii.com:1337/announce&tr=udp://tracker.openbittorrent.com:80/announce&tr=udp://tracker.coppersurfer.tk:6969/announce&tr=udp://tracker.leechers-paradise.org:6969/announce`,
          title: movie.title,
          coverImage: movie.large_cover_image,
        });
      });
    }

    // Normalize 1337x torrents (hypothetical structure)
    if (leetxData?.results) {
      leetxData.results.forEach((torrent: any) => {
        allTorrents.push({
          source: "1337x",
          quality: torrent.quality || "Unknown",
          size: torrent.size || "Unknown",
          hash: torrent.hash,
          magnet: torrent.magnet,
          title: torrent.title,
          coverImage:
            torrent.cover || ytsData?.data?.movies?.[0]?.large_cover_image,
        });
      });
    }

    // Normalize RARBG torrents (hypothetical structure)
    if (rarbgData?.torrents) {
      rarbgData.torrents.forEach((torrent: any) => {
        allTorrents.push({
          source: "RARBG",
          quality: torrent.quality || "Unknown",
          size: torrent.size || "Unknown",
          hash: torrent.hash,
          magnet: torrent.magnet,
          title: torrent.title,
          coverImage:
            torrent.cover || ytsData?.data?.movies?.[0]?.large_cover_image,
        });
      });
    }

    // Deduplicate by hash
    const seenHashes = new Set<string>();
    return allTorrents.filter((torrent) => {
      if (seenHashes.has(torrent.hash)) return false;
      seenHashes.add(torrent.hash);
      return true;
    });
  }, [ytsData, leetxData, rarbgData]);

  const loading = ytsLoading || leetxLoading || rarbgLoading;

  return { torrents, loading };
}

export default function MovieDialog({
  movie,
  open,
  setOpen,
}: {
  movie: TrendingMovie;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [relatedPage, setRelatedPage] = React.useState(1);
  const [relatedMovies, setRelatedMovies] = React.useState<TrendingMovie[]>([]);
  const [hasMoreRelated, setHasMoreRelated] = React.useState(true);
  const [isFetchingRelated, setIsFetchingRelated] = React.useState(false);
  const [showDownload, setShowDownload] = React.useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const handlePlay = () => {
    const basePath = `/play/movie/${movie.id}`;
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
    navigate(
      {
        pathname: basePath,
        search: searchParams.toString(),
      },
      { replace: false }
    );
  };

  const shareUrl =
    window.location.origin +
    `/play/${movie.media_type === "tv" ? "tv" : "movie"}/${movie.id}?play=1${
      movie.media_type === "movie" ? "&full=1" : ""
    }`;

  function ShareButton({
    url,
    title,
    text,
  }: {
    url: string;
    title: string;
    text: string;
  }) {
    const handleShare = async () => {
      if (navigator.share) {
        try {
          await navigator.share({
            title,
            text,
            url,
          });
          console.log("Movie shared successfully!");
        } catch (error) {
          console.error("Error sharing:", error);
        }
      } else {
        console.warn(
          "Web Share API not supported. Please open this on a mobile device or a browser that supports it."
        );
        alert(
          "Your browser does not support sharing directly. You can manually copy the link: " +
            url
        );
      }
    };

    return (
      <Button
        onClick={handleShare}
        className="flex items-center px-2 py-2 mx-2 font-semibold transition duration-700 ease-in-out bg-white rounded-md cursor-pointer md:mx-0 md:py-2 md:px-4 hover:opacity-65 hover:bg-white"
        aria-label="Share"
      >
        <FaShare className="mr-2" />
      </Button>
    );
  }

  const { data: movieDetails, loading: movieDetailsLoading } = useFetch<any>(
    {
      url: `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${
        import.meta.env.VITE_TMDB_API_KEY
      }&append_to_response=credits,external_ids`,
    },
    { enabled: open }
  );

  // Fetch torrents using custom hook
  const { torrents, loading: torrentsLoading } = useTorrents(
    movie.media_type === "movie" && movieDetails?.external_ids?.imdb_id
      ? movieDetails.external_ids.imdb_id
      : null,
    showDownload && movie.media_type === "movie"
  );

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

  const { data: genresData } = useFetch<{
    genres: { id: number; name: string }[];
  }>(
    {
      url: `https://api.themoviedb.org/3/genre/movie/list?api_key=${
        import.meta.env.VITE_TMDB_API_KEY
      }`,
    },
    { enabled: open }
  );

  const { data: videosData } = useFetch<any>(
    {
      url: `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${
        import.meta.env.VITE_TMDB_API_KEY
      }`,
    },
    { enabled: open }
  );
  const trailers =
    videosData?.results?.filter(
      (v: any) => v.site === "YouTube" && v.type === "Trailer"
    ) || [];

  React.useEffect(() => {
    if (open && movie.media_type === "movie") {
      setRelatedMovies([]);
      setRelatedPage(1);
      setHasMoreRelated(true);
    }
  }, [open, movie.id]);

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

  const genreMap = React.useMemo(() => {
    if (!genresData?.genres) return {};
    const map: Record<number, string> = {};
    genresData.genres.forEach((g) => (map[g.id] = g.name));
    return map;
  }, [genresData]);

  const details = movie.media_type === "movie" ? movieDetails : null;
  const productionCompanies = details?.production_companies || [];
  const spokenLanguages = details?.spoken_languages || [];
  const credits = details?.credits;
  const actors = credits?.cast?.slice(0, 20) || [];

  const showRating =
    typeof movie.vote_average === "number" && movie.vote_average > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
      modal
      // onInteractOutside={e => {
      //   // Prevent closing on outside click/touch for small/medium screens
      //   if (window.innerWidth < 1280) e.preventDefault();
      // }}
    >
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
        {/* Make all content scrollable, including the backdrop/title section */}
        <div className="px-2 overflow-y-auto md:py-8 flex-1 bg-black/90">
          {/* Backdrop with gradient and poster overlay */}
          <div
            className="relative w-full mb-6"
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
            <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-black/10 via-black/60 to-black/95" />
            <div className="relative z-10 flex items-end h-full gap-6 pb-8 md:px-8">
              <img
                src={`https://image.tmdb.org/t/p/w342${
                  movie.poster_path || movie.backdrop_path
                }`}
                alt={movie.title}
                className="hidden -mb-8 rounded-lg shadow-lg xl:flex w-28 md:w-44"
                style={{ boxShadow: "0 8px 32px 0 rgba(0,0,0,0.7)" }}
              />
              <div className="mb-2">
                <h2 className="mb-2 text-3xl font-bold text-white drop-shadow">
                  {movie.title}
                </h2>
                {movie.original_title &&
                  movie.original_title !== movie.title && (
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
                  {typeof movie.vote_count === "number" && (
                    <span className="hidden text-xs text-gray-400 xl:flex">
                      {movie.vote_count} votes
                    </span>
                  )}
                  <span className="text-gray-300">
                    {movie.release_date?.slice(0, 4) ||
                      movie.first_air_date?.slice(0, 4) ||
                      "N/A"}
                  </span>
                  <span className="text-xs text-gray-400 uppercase">
                    {movie.original_language || "N/A"}
                  </span>
                  {movie.media_type === "movie" && details?.runtime && (
                    <span className="text-xs text-gray-400">
                      {getRuntime(details.runtime)}
                    </span>
                  )}
                  {typeof movie.popularity === "number" && (
                    <span className="hidden text-xs text-gray-400 xl:flex">
                      Popularity: {movie.popularity.toFixed(0)}
                    </span>
                  )}
                  {"adult" in movie && (
                    <span
                      className={`text-xs font-bold ${
                        movie.adult ? "text-red-500" : "text-green-400"
                      }`}
                    >
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
                  <Button
                    className="flex items-center gap-2 px-4 py-2 font-semibold text-white transition bg-gray-700 rounded cursor-pointer hover:bg-gray-800"
                    onClick={() => setShowDownload(true)}
                  >
                    <FaDownload /> Download
                  </Button>
                  <ShareButton
                    url={shareUrl}
                    title={movie.title || "JokaFlix"}
                    text={`Watch ${movie.title} for FREE on JokaFlix`}
                  />
                </div>
              </div>
            </div>
          </div>
          <h3 className="font-semibold text-primary">Overview</h3>
          <p className="mb-4 text-gray-200">
            {movie.overview && movie.overview.trim().length > 0 ? (
              movie.overview
            ) : (
              <span className="italic text-gray-400">
                No overview available for this title.
              </span>
            )}
          </p>
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
            {(!movie.genre_ids || movie.genre_ids.length === 0) &&
              (!details?.genres || details.genres.length === 0) && (
                <span className="px-2 py-1 text-xs text-gray-400 bg-gray-700 rounded">
                  No genres available
                </span>
              )}
          </div>
          {productionCompanies.length > 0 && (
            <div className="mb-4">
              <h4 className="py-2 text-sm font-bold text-primary">
                Production Companies
              </h4>
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
          {spokenLanguages.length > 0 && (
            <div className="py-4">
              <h4 className="mb-1 text-sm font-bold text-primary">Languages</h4>
              <div className="flex flex-wrap gap-2 py-1">
                {spokenLanguages.map((lang: any) => (
                  <span
                    key={lang.iso_639_1}
                    className="px-2 py-1 text-xs text-white bg-gray-700 rounded"
                  >
                    {lang.english_name || lang.name}
                  </span>
                ))}
              </div>
            </div>
          )}
          {actors.length > 0 && (
            <div className="py-4">
              <h4 className="py-1 text-sm font-bold text-primary">Actors</h4>
              <div className="flex gap-4 py-2 overflow-x-auto">
                {actors.map((actor: any) => (
                  <div
                    key={actor.id}
                    className="flex flex-col items-center min-w-[80px]"
                  >
                    <img
                      src={
                        actor.profile_path
                          ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                          : "https://ui-avatars.com/api/?name=" +
                            encodeURIComponent(actor.name)
                      }
                      alt={actor.name}
                      className="object-cover w-16 h-16 mb-1 bg-gray-800 rounded-full"
                    />
                    <span className="text-xs text-center text-white">
                      {actor.name}
                    </span>
                    <span className="text-[10px] text-gray-400 text-center">
                      {actor.character}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {trailers.length > 0 && (
            <div className="py-4">
              <h4 className="py-1 text-sm font-bold text-primary">Trailers</h4>
              <div className="flex gap-4 py-2 overflow-x-auto">
                {trailers.map((trailer: any) => (
                  <div
                    key={trailer.id}
                    className="min-w-[320px] max-w-[400px] border border-neutral-300 dark:border-neutral-700 rounded-lg"
                  >
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
                    <div className="py-1 text-xs text-center text-white truncate">
                      {trailer.name}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {movie.media_type === "movie" && (
            <div>
              <h3 className="py-2 text-lg font-bold text-primary">
                Related Movies
              </h3>
              <div
                ref={relatedListRef}
                className="grid w-full grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5"
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
        <ShadDialog open={showDownload} onOpenChange={setShowDownload}>
          <ShadDialogContent
            className="flex flex-col p-0 bg-black rounded-lg"
            style={{
              width: "100vw",
              maxWidth: "500px",
              maxHeight: "90vh",
              minHeight: "200px",
              padding: 0,
            }}
          >
            <Button
              className="absolute z-20 flex items-center justify-center w-10 h-10 text-xl text-white transition rounded-full cursor-pointer top-4 right-4 bg-black/70 hover:bg-black/90"
              onClick={() => setShowDownload(false)}
              aria-label="Close"
              type="button"
            >
              <FaTimes />
            </Button>
            <div className="flex flex-col flex-1 px-4 py-6 overflow-y-auto">
              <h2 className="py-2 text-xl font-bold text-white">
                Download Torrents
              </h2>
              <p className="mb-4 text-sm text-gray-400">
                Note: Downloading copyrighted material may be illegal in your
                region. Please ensure you have the right to download and use
                these files.
              </p>
              {movieDetailsLoading || torrentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-4xl text-white animate-pulse">...</span>
                </div>
              ) : movie.media_type === "movie" && torrents.length > 0 ? (
                <div className="space-y-4">
                  {torrents.map((torrent, index) => (
                    <div
                      key={`${torrent.source}-${torrent.hash}-${index}`}
                      className="flex items-center p-4 pb-2 space-x-4 border border-gray-700 rounded-lg"
                    >
                      <img
                        src={
                          torrent.coverImage ||
                          `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                        }
                        alt={torrent.title}
                        className="w-20 h-32 rounded-lg"
                      />
                      <div className="flex-1 px-3">
                        <p className="text-white">
                          {torrent.quality} - {torrent.size}
                        </p>
                        <p className="py-2 text-xs text-gray-400">
                          Source: {torrent.source}
                        </p>
                        <div className="flex flex-col md:flex-row gap-2">
                          <Button
                            className="w-full mt-2 bg-white cursor-pointer hover:bg-white"
                            aria-label="Download Torrent"
                            type="button"
                            onClick={() => {
                              // Try to open magnet link
                              const magnetUrl = torrent.magnet;
                              const now = Date.now();
                              // Open magnet link in a new (hidden) window/tab
                              // Fallback: after 1.5s, if user is still on the page, open web handler
                              setTimeout(() => {
                                // If the user is still on the page (hasn't navigated away)
                                if (Date.now() - now < 2000) {
                                  window.open(`https://webtor.io/show?magnet=${encodeURIComponent(magnetUrl)}`, '_blank');
                                }
                              }, 1500);
                            }}
                          >
                            <FaDownload className="mr-2" />
                            Download Torrent
                          </Button>
                          <Button
                            className="w-full md:w-32 rounded-lg mt-2 bg-neutral-200 text-gray-900 cursor-pointer hover:bg-gray-300"
                            aria-label="Copy Magnet Link"
                            type="button"
                            onClick={() => {
                              navigator.clipboard
                                .writeText(torrent.magnet)
                                .then(() => {
                                  // Optionally show feedback
                                  alert("Magnet link copied!");
                                })
                                .catch(() => {
                                  alert("Failed to copy magnet link.");
                                });
                            }}
                          >
                            <svg
                              className="mr-2"
                              width="16"
                              height="16"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <rect x="9" y="9" width="13" height="13" rx="2" />
                              <path d="M5 15V5a2 2 0 0 1 2-2h10" />
                            </svg>
                            Copy Torrent
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <span className="text-white">
                    No torrents found for this movie.
                  </span>
                </div>
              )}
            </div>
          </ShadDialogContent>
        </ShadDialog>
      </DialogContent>
    </Dialog>
  );
}
