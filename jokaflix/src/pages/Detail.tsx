import * as React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Copy, Info, Play, Plus, Share2, Star } from "lucide-react";
import { Button } from "../components/ui/button";
import { useFetch } from "../api";
import { MovieCard } from "../components/global/cards/MovieCard";
import { SeriesCard } from "../components/global/cards/SeriesCard";
import type { TrendingMovie } from "../../types";
import { toast } from "sonner";

type DetailPageProps = {
  mediaType: "movie" | "tv";
};

export default function DetailPage({ mediaType }: DetailPageProps) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeSeason, setActiveSeason] = React.useState(0);
  const isMovie = mediaType === "movie";
  const apiType = isMovie ? "movie" : "tv";
  const titleKey = isMovie ? "title" : "name";
  const dateKey = isMovie ? "release_date" : "first_air_date";

  const { data: details, loading } = useFetch<any>(
    {
      url: `https://api.themoviedb.org/3/${apiType}/${id}?api_key=${import.meta.env.VITE_TMDB_API_KEY}&append_to_response=credits,videos,similar`,
    },
    { enabled: !!id }
  );

  const title = details?.[titleKey] || "JokaFlix";
  const isLongTitle = title.length > 26;
  const backdrop = details?.backdrop_path || details?.poster_path;
  const poster = details?.poster_path || details?.backdrop_path;
  const backdropUrl = backdrop ? `https://image.tmdb.org/t/p/original${backdrop}` : "";
  const posterUrl = poster ? `https://image.tmdb.org/t/p/w500${poster}` : "";
  const year = details?.[dateKey]?.slice(0, 4);
  const rating = details?.vote_average > 0 ? details.vote_average.toFixed(1) : "NR";
  const runtimeLabel = isMovie
    ? details?.runtime
      ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
      : null
    : details?.number_of_seasons
      ? `${details.number_of_seasons} season${details.number_of_seasons === 1 ? "" : "s"}`
      : null;
  const genres = details?.genres?.slice(0, 3).map((genre: any) => genre.name) || [];
  const seasons = details?.seasons?.filter((season: any) => season.season_number > 0) || [];
  const activeSeasonData = seasons[activeSeason];
  const activeSeasonNumber = activeSeasonData?.season_number || 1;
  const cast = details?.credits?.cast?.slice(0, 12) || [];
  const similar = details?.similar?.results?.slice(0, 12) || [];
  const trailers =
    details?.videos?.results?.filter((video: any) => video.site === "YouTube" && video.type === "Trailer").slice(0, 2) || [];

  const { data: activeSeasonDetails, loading: activeSeasonLoading } = useFetch<any>(
    {
      url: `https://api.themoviedb.org/3/tv/${id}/season/${activeSeasonNumber}?api_key=${import.meta.env.VITE_TMDB_API_KEY}`,
    },
    { enabled: !isMovie && !!id && seasons.length > 0 }
  );

  React.useEffect(() => {
    setActiveSeason(0);
  }, [id]);

  const play = () => {
    if (isMovie) {
      navigate(`/play/movie/${id}`);
      return;
    }
    navigate(`/play/tv-show/${id}?season=${activeSeasonNumber}&episode=1`);
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, text: `Watch ${title} on JokaFlix`, url });
      toast.success("Share sheet opened");
      return;
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied");
  };

  const addToList = () => {
    toast.success("Added to your list");
  };

  const showInfoToast = () => {
    toast.message("Details are already open", {
      description: "Use the cast, trailers, and recommendations below.",
    });
  };

  if (loading) {
    return (
      <main className="page-shell">
        <div className="detail-loading">
          <div className="netflix-loader" />
          <span>Loading title</span>
        </div>
      </main>
    );
  }

  const activeEpisodes = activeSeasonDetails?.episodes || [];
  const hasPrimaryRail = !isMovie ? seasons.length > 0 : similar.length > 0;

  return (
    <main className="detail-page detail-cinema-page min-h-screen">
      {backdropUrl && <img src={backdropUrl} alt="" className="detail-cinema-bg" />}
      <div className="detail-cinema-overlay" />

      <section className="detail-cinema-shell">
        <div className="detail-cinema-topbar">
          <button type="button" onClick={() => navigate(-1)} className="detail-round-button" aria-label="Go back">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div className="detail-top-actions">
            <button type="button" onClick={copyLink} className="detail-round-button" aria-label="Copy link">
              <Copy className="h-5 w-5" />
            </button>
            <button type="button" onClick={share} className="detail-pill-button">
              <Share2 className="h-4 w-4" />
              Share
            </button>
          </div>
        </div>

        <div className={`detail-cinema-copy reveal-up ${isLongTitle ? "is-long-title" : ""}`}>
          <div className="detail-brand-row">
            {posterUrl && <img src={posterUrl} alt="" />}
            <span>Streaming on JokaFlix</span>
          </div>
          <h1>{title}</h1>
          <div className="detail-cinema-meta">
            {year && <span>{year}</span>}
            {runtimeLabel && <span>{runtimeLabel}</span>}
            {genres.map((genre: string) => (
              <span className="detail-outline-chip" key={genre}>{genre}</span>
            ))}
            <span className="detail-stars">
              <Star className="h-4 w-4" fill="currentColor" />
              {rating}
            </span>
          </div>
          <p>{details?.overview || "No overview is available for this title yet."}</p>
          <div className="detail-cinema-actions">
            <Button onClick={play} className="detail-watch-action">
              <Play className="h-6 w-6" fill="currentColor" />
              {isMovie ? "Play movie" : `Play S${activeSeasonNumber} E1`}
            </Button>
            <button type="button" onClick={addToList} className="detail-soft-action" aria-label="Add to list">
              <Plus className="h-5 w-5" />
            </button>
            <button type="button" onClick={showInfoToast} className="detail-soft-action" aria-label="More details">
              <Info className="h-5 w-5" />
            </button>
          </div>
        </div>

        {hasPrimaryRail && (
          <div className="detail-bottom-dock reveal-up">
            {!isMovie && seasons.length > 0 && (
              <div className="season-tab-row" role="tablist" aria-label="Seasons">
                {seasons.slice(0, 8).map((season: any, index: number) => (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={index === activeSeason}
                    key={season.id}
                    className={index === activeSeason ? "is-active" : ""}
                    onClick={() => setActiveSeason(index)}
                  >
                    {season.name}
                  </button>
                ))}
              </div>
            )}
            <div className="detail-episode-strip">
              {!isMovie && seasons.length > 0
                ? activeSeasonLoading
                  ? Array.from({ length: 6 }).map((_, index) => (
                      <article className="detail-episode-card detail-episode-loading" key={index}>
                        <span>Loading episode</span>
                      </article>
                    ))
                  : activeEpisodes.length > 0
                    ? activeEpisodes.map((episodeItem: any) => (
                        <Link
                          to={`/play/tv-show/${id}?season=${activeSeasonNumber}&episode=${episodeItem.episode_number || 1}`}
                          className="detail-episode-card"
                          key={episodeItem.id || episodeItem.episode_number}
                        >
                          <img
                            src={
                              episodeItem.still_path
                                ? `https://image.tmdb.org/t/p/w500${episodeItem.still_path}`
                                : backdropUrl || posterUrl
                            }
                            alt={episodeItem.name}
                          />
                          <span>{episodeItem.name || `Episode ${episodeItem.episode_number}`}</span>
                          <small>Episode {episodeItem.episode_number}</small>
                        </Link>
                      ))
                    : Array.from({ length: activeSeasonData?.episode_count || 6 }).map((_, index) => {
                        const episodeNumber = index + 1;
                        return (
                          <Link
                            to={`/play/tv-show/${id}?season=${activeSeasonNumber}&episode=${episodeNumber}`}
                            className="detail-episode-card"
                            key={`${activeSeasonNumber}-${episodeNumber}`}
                          >
                            <img src={backdropUrl || posterUrl} alt="" />
                            <span>Episode {episodeNumber}</span>
                            <small>Season {activeSeasonNumber}</small>
                          </Link>
                        );
                      })
                : similar.map((item: TrendingMovie) => {
                    const itemTitle = item.title || item.name;
                    return (
                      <Link to={`/movie/${item.id}`} className="detail-episode-card" key={item.id}>
                        <img src={`https://image.tmdb.org/t/p/w500${item.backdrop_path || item.poster_path}`} alt={itemTitle} />
                        <span>{itemTitle}</span>
                        <small>{(item.release_date || item.first_air_date || "").slice(0, 4) || "Movie"}</small>
                      </Link>
                    );
                  })}
            </div>
          </div>
        )}
      </section>

      <section className="detail-cinema-more">
        {cast.length > 0 && (
          <div className="detail-social-section">
            <div className="detail-section-heading">
              <div>
                <p className="section-kicker">Cast</p>
                <h2>People in this title</h2>
              </div>
            </div>
            <div className="cast-strip">
              {cast.map((actor: any) => (
                <article key={actor.id}>
                  <img
                    src={
                      actor.profile_path
                        ? `https://image.tmdb.org/t/p/w185${actor.profile_path}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(actor.name)}`
                    }
                    alt={actor.name}
                  />
                  <strong>{actor.name}</strong>
                  <span>{actor.character}</span>
                </article>
              ))}
            </div>
          </div>
        )}

        {trailers.length > 0 && (
          <div className="detail-social-section">
            <div className="detail-section-heading">
              <div>
                <p className="section-kicker">Preview</p>
                <h2>Trailers</h2>
              </div>
            </div>
            <div className="trailer-grid">
              {trailers.map((trailer: any) => (
                <iframe
                  key={trailer.id}
                  src={`https://www.youtube.com/embed/${trailer.key}`}
                  title={trailer.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ))}
            </div>
          </div>
        )}

        {similar.length > 0 && (
          <div className="detail-social-section">
            <div className="detail-section-heading">
              <div>
                <p className="section-kicker">Keep browsing</p>
                <h2>More like this</h2>
              </div>
            </div>
            <div className="detail-more-grid">
              {similar.map((item: TrendingMovie) =>
                isMovie ? <MovieCard key={item.id} movie={{ ...item, media_type: "movie" }} /> : <SeriesCard key={item.id} movie={{ ...item, media_type: "tv" }} />
              )}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
