import React from "react";
import type { TrendingMovie } from "../../../../types";
import { useFetch } from "../../../api";
import { Dialog, DialogContent } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { FaPlay, FaTimes, FaPlayCircle } from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";

function ShareButton({ url, title, text }: { url: string; title: string; text: string }) {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (error) {
        // Optionally handle error
      }
    } else {
      // Optionally fallback (e.g., copy to clipboard)
    }
  };

  return (
    <Button
      onClick={handleShare}
      className="flex items-center px-2 py-2 mx-2 font-semibold transition duration-700 ease-in-out bg-white rounded-md cursor-pointer md:mx-0 md:py-2 md:px-4 hover:opacity-65 hover:bg-white"
      aria-label="Share"
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="black" viewBox="0 0 24 24" strokeWidth="1.5" stroke="black" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
      </svg>
    </Button>
  );
}

// --- EpisodeModal: Shows episodes for a season ---
function EpisodeModal({
  open,
  setOpen,
  seriesId,
  seasonNumber,
  seriesTitle,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  seriesId: number;
  seasonNumber: number;
  seriesTitle: string;
}) {
  const { data: seasonData, loading } = useFetch<any>(
    {
      url: `https://api.themoviedb.org/3/tv/${seriesId}/season/${seasonNumber}?api_key=${
        import.meta.env.VITE_TMDB_API_KEY
      }`,
    },
    { enabled: open }
  );
  const episodes = seasonData?.episodes || [];
  const navigate = useNavigate();
  const location = useLocation();

  const handlePlay = (ep: any) => {
    const basePath = `/play/tv-show/${seriesId}`;
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("season", String(seasonNumber));
    searchParams.set("episode", String(ep.episode_number));
    searchParams.set("play", "1");
    navigate(
      {
        pathname: basePath,
        search: searchParams.toString(),
      },
      { replace: false }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="flex flex-col p-0 bg-black rounded-lg md:overflow-hidden"
        style={{
          width: "100vw",
          maxWidth: "900px",
          height: "90vh",
          maxHeight: "90vh",
          minHeight: "300px",
          padding: 0,
        }}
      >
        <Button
          className="absolute z-20 flex items-center justify-center w-10 h-10 text-xl text-white transition rounded-full cursor-pointer top-4 right-4 bg-black/70 hover:bg-black/90"
          onClick={() => setOpen(false)}
          aria-label="Close"
          type="button"
        >
          <FaTimes />
        </Button>
        <div className="flex flex-col flex-1 px-4 py-6 overflow-y-auto">
          <h2 className="py-2 text-xl font-bold text-primary">
            {seriesTitle} - Season {seasonNumber}
          </h2>
          {loading ? (
            <div className="text-4xl text-center text-gray-400 animate-pulse">...</div>
          ) : (
            <div className="flex flex-col gap-4">
              {episodes.map((ep: any) => (
                <div
                  key={ep.id}
                  className="flex flex-col items-start gap-4 px-2 py-3 rounded-lg md:py-1 md:flex-row bg-gray-950"
                >
                  <div className="relative w-full group md:w-auto">
                    <img
                      src={
                        ep.still_path
                          ? `https://image.tmdb.org/t/p/w300${ep.still_path}`
                          : "https://ui-avatars.com/api/?name=" +
                            encodeURIComponent(ep.name)
                      }
                      alt={ep.name}
                      className="flex-shrink-0 object-cover w-full h-32 bg-gray-800 rounded-md cursor-pointer md:rounded-lg md:w-48"
                    />
                    <button
                      className="absolute inset-0 flex items-center justify-center transition-opacity opacity-0 cursor-pointer group-hover:opacity-100"
                      style={{ pointerEvents: "auto" }}
                      aria-label="Play episode"
                      onClick={() => handlePlay(ep)}
                    >
                      <FaPlayCircle className="text-5xl text-white drop-shadow-lg" />
                    </button>
                  </div>
                  <div className="flex flex-col flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">
                        Ep {ep.episode_number}:
                      </span>
                      <span className="font-semibold text-white">
                        {ep.name}
                      </span>
                      <span className="ml-2 text-xs text-gray-400">
                        {ep.runtime
                          ? ep.runtime > 60
                            ? `${Math.floor(ep.runtime / 60)}h ${
                                ep.runtime % 60
                              }m`
                            : `${ep.runtime}m`
                          : "Coming soon"}
                      </span>
                    </div>
                    <div className="text-xs text-gray-300">
                      {ep.overview ? (
                        ep.overview.length > 300 ? (
                          ep.overview.slice(0, 300) + "..."
                        ) : (
                          ep.overview
                        )
                      ) : (
                        <span className="italic text-gray-500">
                          No overview.
                        </span>
                      )}
                    </div>
                    {/* <div className="flex w-full px-2 py-3">
                      <Button
                        variant={"outline"}
                        className="flex items-center gap-2 px-4 text-white bg-green-600 rounded cursor-pointer hover:bg-green-700"
                        aria-label="Play episode"
                        onClick={() => handlePlay(ep)}
                      >
                        <FaPlayCircle className="text-white" />
                        Play
                      </Button>
                    </div> */}
                  </div>
                </div>
              ))}
              {episodes.length === 0 && (
                <div className="text-gray-400 col-span-full">
                  No episodes found for this season.
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// --- SeriesDialog: Main modal for TV series ---
export default function SeriesDialog({
  series,
  open,
  setOpen,
}: {
  series: TrendingMovie;
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [seasonModal, setSeasonModal] = React.useState<{
    open: boolean;
    seasonNumber: number | null;
  }>({ open: false, seasonNumber: null });

  // Fetch series details (for seasons, production companies, languages, credits)
  const { data: details, loading } = useFetch<any>(
    {
      url: `https://api.themoviedb.org/3/tv/${series.id}?api_key=${
        import.meta.env.VITE_TMDB_API_KEY
      }&append_to_response=credits`,
    },
    { enabled: open }
  );

  // Fetch genres list (global TMDB genres)
  const { data: genresData } = useFetch<{
    genres: { id: number; name: string }[];
  }>(
    {
      url: `https://api.themoviedb.org/3/genre/tv/list?api_key=${
        import.meta.env.VITE_TMDB_API_KEY
      }`,
    },
    { enabled: open }
  );

  // Fetch videos (trailers, teasers, etc)
  const { data: videosData } = useFetch<any>(
    {
      url: `https://api.themoviedb.org/3/tv/${series.id}/videos?api_key=${
        import.meta.env.VITE_TMDB_API_KEY
      }`,
    },
    { enabled: open }
  );
  const trailers =
    videosData?.results?.filter(
      (v: any) => v.site === "YouTube" && v.type === "Trailer"
    ) || [];

  // Map genre ids to names
  const genreMap = React.useMemo(() => {
    if (!genresData?.genres) return {};
    const map: Record<number, string> = {};
    genresData.genres.forEach((g) => (map[g.id] = g.name));
    return map;
  }, [genresData]);

  const productionCompanies = details?.production_companies || [];
  const spokenLanguages = details?.spoken_languages || [];
  const credits = details?.credits;
  const actors = credits?.cast?.slice(0, 20) || [];
  const seasons = details?.seasons || [];

  // Only show rating if > 0
  const showRating =
    typeof series.vote_average === "number" && series.vote_average > 0;

  const navigate = useNavigate();

  const handlePlaySeries = () => {
    const basePath = `/play/tv-show/${series.id}`;
    const searchParams = new URLSearchParams();
    searchParams.set("play", "1");
    searchParams.set("type", "tv");
    searchParams.set("season", "1");
    searchParams.set("episode", "1");
    navigate(
      {
        pathname: basePath,
        search: searchParams.toString(),
      },
      { replace: false }
    );
  };

  // Compose share URL for the play modal (full series)
  const shareUrl =
    window.location.origin + `/play/tv-show/${series.id}?play=1&full=1`;

  return (
    <>
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
            style={{ height: "45vh", minHeight: 320 }}
          >
            <div
              className="absolute inset-0 w-full h-full bg-center bg-cover"
              style={{
                backgroundImage: `url(https://image.tmdb.org/t/p/original${
                  series.backdrop_path || series.poster_path
                })`,
              }}
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-black/10 via-black/60 to-black/95" />
            {/* Poster and title at the bottom left */}
            <div className="relative z-10 flex items-end h-full gap-6 px-2 pb-8 md:px-8">
              <img
                src={`https://image.tmdb.org/t/p/w342${
                  series.poster_path || series.backdrop_path
                }`}
                alt={series.name}
                className="hidden -mb-8 rounded-lg shadow-lg w-28 md:w-44 xl:flex"
                style={{ boxShadow: "0 8px 32px 0 rgba(0,0,0,0.7)" }}
              />
              <div className="mb-2">
                <h2 className="mb-2 text-3xl font-bold text-white drop-shadow">
                  {series.name}
                </h2>
                {/* Show original name if different */}
                {series.original_name &&
                  typeof series.original_name === "string" &&
                  series.original_name !== series.name && (
                    <div className="mb-1 text-sm italic text-gray-300">
                      Original Name: {series.original_name}
                    </div>
                  )}
                <div className="flex items-center gap-4 mb-2">
                  {showRating && (
                    <span className="text-lg font-bold text-primary">
                      {series.vote_average.toFixed(1)}
                    </span>
                  )}
                  {/* Show vote count if available */}
                  {typeof series.vote_count === "number" && (
                    <span className="hidden text-xs text-gray-400 xl:flex">
                      {series.vote_count} votes
                    </span>
                  )}
                  <span className="text-gray-300">
                    {series.first_air_date?.slice(0, 4) || "N/A"}
                  </span>
                  <span className="text-xs text-gray-400 uppercase">
                    {series.original_language || "N/A"}
                  </span>
                  {seasons.length > 0 && (
                    <span className="text-xs text-gray-400">
                      {seasons.length} season{seasons.length > 1 ? "s" : ""}
                    </span>
                  )}
                  {/* Show popularity if available */}
                  {typeof series.popularity === "number" && (
                    <span className="hidden text-xs text-gray-400 xl:flex">
                      Popularity: {series.popularity.toFixed(0)}
                    </span>
                  )}
                  {/* Show adult flag if present */}
                  {"adult" in series && (
                    <span
                      className={`text-xs font-bold ${
                        series.adult ? "text-red-500" : "text-green-400"
                      }`}
                    >
                      {series.adult ? "18+" : "Family"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 pt-2">
                  <Button
                    variant={"outline"}
                    className="flex items-center gap-2 px-6 py-2 font-semibold text-white transition bg-orange-600 rounded cursor-pointer hover:bg-orange-700"
                    onClick={handlePlaySeries}
                  >
                    <FaPlay /> Play
                  </Button>
                  <ShareButton
                    url={shareUrl}
                    title={series.name || "JokaFlix"}
                    text={`Watch ${series.name} on JokaFlix`}
                  />
                </div>
              </div>
            </div>
          </div>
          {/* Details at the bottom */}
          <div className="px-2 overflow-y-auto md:py-8 flex-1px bg-black/90">
            <h3 className="font-semibold text-primary">Overview</h3>
            {/* Show overview or fallback if missing */}
            <p className="mb-4 text-gray-200">
              {series.overview && series.overview.trim().length > 0 ? (
                series.overview
              ) : (
                <span className="italic text-gray-400">
                  No overview available for this title.
                </span>
              )}
            </p>
            {/* Genres */}
            <div className="flex flex-wrap gap-2 py-4">
              {series.genre_ids && series.genre_ids.length > 0
                ? series.genre_ids.map((id) =>
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
              {(!series.genre_ids || series.genre_ids.length === 0) &&
                (!details?.genres || details.genres.length === 0) && (
                  <span className="px-2 py-1 text-xs text-gray-400 bg-gray-700 rounded">
                    No genres available
                  </span>
                )}
            </div>
            {/* Production Companies */}
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
            {/* Spoken Languages */}
            {spokenLanguages.length > 0 && (
              <div className="py-4">
                <h4 className="mb-1 text-sm font-bold text-primary">
                  Languages
                </h4>
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
            {/* Actors */}
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
            {/* Trailers */}
            {trailers.length > 0 && (
              <div className="py-4">
                <h4 className="py-1 text-sm font-bold text-primary">
                  Trailers
                </h4>
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
            {/* Show seasons as cards */}
            <div className="py-4">
              <h3 className="py-2 text-lg font-bold text-primary">Seasons</h3>
              {loading ? (
                <div className="text-gray-400">Loading seasons...</div>
              ) : (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                  {seasons.map((season: any) => (
                    <button
                      key={season.id}
                      className="flex flex-col items-center p-0 transition rounded-lg shadow-lg hover:scale-105"
                      onClick={() =>
                        setSeasonModal({
                          open: true,
                          seasonNumber: season.season_number,
                        })
                      }
                      type="button"
                    >
                      <img
                        src={
                          season.poster_path
                            ? `https://image.tmdb.org/t/p/w400${season.poster_path}`
                            : ""
                        }
                        alt={season.name}
                        className="object-cover w-full h-[70%] rounded-t-lg bg-gray-800"
                        style={{ minHeight: 120, maxHeight: 180 }}
                      />
                      <div className="flex items-center justify-between w-full h-[30%] px-2 py-2">
                        <span className="text-base font-bold text-white truncate">
                          {season.name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {season.episode_count} episode
                          {season.episode_count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Season episode modal */}
      {seasonModal.open && seasonModal.seasonNumber !== null && (
        <EpisodeModal
          open={seasonModal.open}
          setOpen={(v) => setSeasonModal((s) => ({ ...s, open: v }))}
          seriesId={series.id}
          seasonNumber={seasonModal.seasonNumber}
          seriesTitle={series.name || ""}
        />
      )}
    </>
  );
}
