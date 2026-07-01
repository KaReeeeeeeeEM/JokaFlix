"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Check, CheckCircle2, ChevronLeft, Copy, Play, Plus, Share2, Star, ThumbsUp, X } from "lucide-react";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../components/ui/dialog";
import { useFetch } from "../api";
import { MovieCard } from "../components/global/cards/MovieCard";
import { SeriesCard } from "../components/global/cards/SeriesCard";
import type { TrendingMovie } from "../../types";
import { toast } from "sonner";

type DetailPageProps = {
  mediaType: "movie" | "tv";
};

type PublicRating = {
  average: number | null;
  count: number;
};

type TmdbGenre = {
  name: string;
};

type TmdbSeason = {
  id: number;
  name: string;
  season_number: number;
  episode_count?: number;
};

type TmdbEpisode = {
  id?: number;
  episode?: number;
  episode_number?: number;
  name?: string;
  still_path?: string | null;
};

type TmdbCastMember = {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
};

type TmdbVideo = {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
};

type TmdbDetails = {
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  backdrop_path?: string | null;
  poster_path?: string | null;
  vote_average?: number;
  runtime?: number;
  number_of_seasons?: number;
  overview?: string;
  genres?: TmdbGenre[];
  seasons?: TmdbSeason[];
  credits?: { cast?: TmdbCastMember[] };
  similar?: { results?: TrendingMovie[] };
  videos?: { results?: TmdbVideo[] };
};

type TmdbSeasonDetails = {
  episodes?: TmdbEpisode[];
};

type RatingTarget =
  | { kind: "title"; label: string; existingRating: number | null; existingComment: string }
  | { kind: "episode"; label: string; episode: TmdbEpisode; episodeNumber: number; existingRating: number | null; existingComment: string };

const RATING_SCALE = 10;

function ratingTone(value: number) {
  if (value >= 9) return "Outstanding";
  if (value >= 7) return "Excellent";
  if (value >= 5) return "Good";
  if (value >= 3) return "Fair";
  if (value > 0) return "Needs work";
  return "Choose your rating";
}

export default function DetailPage({ mediaType }: DetailPageProps) {
  const params = useParams<{ id: string }>();
  const id = params?.id ?? "";
  const router = useRouter();
  const [activeSeason, setActiveSeason] = React.useState(0);
  const [titleState, setTitleState] = React.useState<{
    authenticated: boolean;
    rating: number | null;
    ratingComment: string;
    publicRating: number | null;
    ratingCount: number;
    watchLater: boolean;
  }>({
    authenticated: false,
    rating: null,
    ratingComment: "",
    publicRating: null,
    ratingCount: 0,
    watchLater: false,
  });
  const [episodeRatings, setEpisodeRatings] = React.useState<Record<string, number>>({});
  const [episodeRatingComments, setEpisodeRatingComments] = React.useState<Record<string, string>>({});
  const [episodePublicRatings, setEpisodePublicRatings] = React.useState<Record<string, PublicRating>>({});
  const [ratingTarget, setRatingTarget] = React.useState<RatingTarget | null>(null);
  const [ratingStep, setRatingStep] = React.useState<"review" | "thanks">("review");
  const [pendingRating, setPendingRating] = React.useState(0);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [ratingComment, setRatingComment] = React.useState("");
  const [ratingSubmitting, setRatingSubmitting] = React.useState(false);
  const isMovie = mediaType === "movie";
  const apiType = isMovie ? "movie" : "tv";
  const titleKey = isMovie ? "title" : "name";
  const dateKey = isMovie ? "release_date" : "first_air_date";

  const { data: details, loading } = useFetch<TmdbDetails>(
    {
      url: `https://api.themoviedb.org/3/${apiType}/${id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=credits,videos,similar`,
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
  const rating = details?.vote_average && details.vote_average > 0 ? details.vote_average.toFixed(1) : "NR";
  const runtimeLabel = isMovie
    ? details?.runtime
      ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m`
      : null
    : details?.number_of_seasons
      ? `${details.number_of_seasons} season${details.number_of_seasons === 1 ? "" : "s"}`
      : null;
  const genres = React.useMemo(() => details?.genres?.slice(0, 3).map((genre) => genre.name) || [], [details?.genres]);
  const seasons = details?.seasons?.filter((season) => season.season_number > 0) || [];
  const activeSeasonData = seasons[activeSeason];
  const activeSeasonNumber = activeSeasonData?.season_number || 1;
  const cast = details?.credits?.cast?.slice(0, 12) || [];
  const similar = details?.similar?.results?.slice(0, 12) || [];
  const trailers =
    details?.videos?.results?.filter((video) => video.site === "YouTube" && video.type === "Trailer").slice(0, 2) || [];

  const { data: activeSeasonDetails, loading: activeSeasonLoading } = useFetch<TmdbSeasonDetails>(
    {
      url: `https://api.themoviedb.org/3/tv/${id}/season/${activeSeasonNumber}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
    },
    { enabled: !isMovie && !!id && seasons.length > 0 }
  );

  React.useEffect(() => {
    setActiveSeason(0);
  }, [id]);

  React.useEffect(() => {
    if (!id) return;
    fetch(`/api/user/title?mediaType=${apiType}&tmdbId=${id}`, { credentials: "include" })
      .then((response) => response.json())
      .then(setTitleState)
      .catch(() =>
        setTitleState({
          authenticated: false,
          rating: null,
          ratingComment: "",
          publicRating: null,
          ratingCount: 0,
          watchLater: false,
        })
      );
  }, [apiType, id]);

  React.useEffect(() => {
    if (isMovie || !id || !activeSeasonNumber) return;
    fetch(`/api/user/episode-rating?tmdbId=${id}&season=${activeSeasonNumber}`, { credentials: "include" })
      .then((response) => response.json())
      .then((result) => {
        setEpisodeRatings(result.ratings || {});
        setEpisodeRatingComments(result.comments || {});
        setEpisodePublicRatings(result.publicRatings || {});
      })
      .catch(() => {
        setEpisodeRatings({});
        setEpisodeRatingComments({});
        setEpisodePublicRatings({});
      });
  }, [activeSeasonNumber, id, isMovie]);

  const titlePayload = React.useMemo(
    () => ({
      tmdbId: id,
      mediaType: apiType,
      title,
      posterPath: details?.poster_path || null,
      backdropPath: details?.backdrop_path || null,
      genres,
    }),
    [apiType, details?.backdrop_path, details?.poster_path, genres, id, title]
  );

  const promptLogin = () => {
    window.dispatchEvent(new CustomEvent("jokaflix:login-nudge"));
  };

  const updateTitleAction = async (action: string, extra: Record<string, unknown> = {}) => {
    const response = await fetch("/api/user/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ ...titlePayload, action, ...extra }),
    });

    if (response.status === 401) {
      promptLogin();
      return false;
    }

    const next = await response.json();
    if (!response.ok) {
      if (response.status === 409 && typeof next.rating === "number") {
        setTitleState((current) => ({ ...current, ...next, authenticated: true }));
      }
      toast.error(next.error || "Could not update title");
      return false;
    }

    setTitleState((current) => ({ ...current, ...next, authenticated: true }));
    return true;
  };

  const toggleWatchLater = async () => {
    const updated = await updateTitleAction(titleState.watchLater ? "remove-watch-later" : "watch-later");
    if (!updated) return;
    toast.success(titleState.watchLater ? "Removed from watch later" : "Saved to watch later");
  };

  const openTitleRating = () => {
    setRatingTarget({
      kind: "title",
      label: title,
      existingRating: titleState.rating,
      existingComment: titleState.ratingComment || "",
    });
    setRatingStep("review");
    setPendingRating(titleState.rating || 0);
    setHoverRating(0);
    setRatingComment(titleState.ratingComment || "");
  };

  const openEpisodeRating = (episodeItem: TmdbEpisode, event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const episodeNumber = Number(episodeItem.episode_number || episodeItem.episode || 0);
    if (!episodeNumber) return;
    const ratingKey = `${activeSeasonNumber}-${episodeNumber}`;
    setRatingTarget({
      kind: "episode",
      label: episodeItem.name || `Episode ${episodeNumber}`,
      episode: episodeItem,
      episodeNumber,
      existingRating: episodeRatings[ratingKey] ?? null,
      existingComment: episodeRatingComments[ratingKey] || "",
    });
    setRatingStep("review");
    setPendingRating(episodeRatings[ratingKey] || 0);
    setHoverRating(0);
    setRatingComment(episodeRatingComments[ratingKey] || "");
  };

  const closeRatingDialog = () => {
    setRatingTarget(null);
    setRatingStep("review");
    setHoverRating(0);
    setRatingSubmitting(false);
  };

  const submitRating = async () => {
    if (!ratingTarget || !pendingRating) return;
    setRatingSubmitting(true);

    if (ratingTarget.kind === "title") {
      const updated = await updateTitleAction("rate", { rating: pendingRating, comment: ratingComment });
      setRatingSubmitting(false);
      if (!updated) return;
      toast.success(`Rated ${pendingRating}/${RATING_SCALE}`);
      setRatingStep("thanks");
      return;
    }

    const episodeItem = ratingTarget.episode;
    const episodeNumber = ratingTarget.episodeNumber;

    const response = await fetch("/api/user/episode-rating", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        tmdbId: id,
        season: activeSeasonNumber,
        episode: episodeNumber,
        rating: pendingRating,
        comment: ratingComment,
        seriesTitle: title,
        episodeTitle: episodeItem.name || `Episode ${episodeNumber}`,
        stillPath: episodeItem.still_path || null,
      }),
    });

    if (response.status === 401) {
      setRatingSubmitting(false);
      promptLogin();
      return;
    }

    const result = await response.json();
    if (!response.ok) {
      if (response.status === 409 && typeof result.rating === "number") {
        setEpisodeRatings((current) => ({ ...current, [result.key]: Number(result.rating) }));
        setEpisodeRatingComments((current) => ({ ...current, [result.key]: result.comment || "" }));
      }
      setRatingSubmitting(false);
      toast.error(result.error || "Could not rate episode");
      return;
    }

    setEpisodeRatings((current) => ({ ...current, [result.key]: pendingRating }));
    setEpisodeRatingComments((current) => ({ ...current, [result.key]: ratingComment }));
    if (result.publicRating) {
      setEpisodePublicRatings((current) => ({ ...current, [result.key]: result.publicRating }));
    }
    setRatingSubmitting(false);
    setRatingStep("thanks");
    toast.success(`Episode rated ${pendingRating}/${RATING_SCALE}`);
  };

  const play = () => {
    if (isMovie) {
      router.push(`/play/movie/${id}`);
      return;
    }
    router.push(`/play/tv-show/${id}?season=${activeSeasonNumber}&episode=1`);
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

  if (loading) {
    return (
      <main className="detail-page detail-cinema-page detail-skeleton-page min-h-screen" aria-busy="true" aria-label="Loading title">
        <div className="detail-skeleton-bg" />
        <div className="detail-cinema-overlay detail-skeleton-overlay" />

        <section className="detail-cinema-shell detail-skeleton-shell">
          <div className="detail-cinema-topbar detail-skeleton-topbar">
            <div className="skeleton-token skeleton-round-button" />
            <div className="detail-top-actions">
              <div className="skeleton-token skeleton-round-button" />
              <div className="skeleton-token skeleton-action-pill" />
            </div>
          </div>

          <div className="detail-cinema-copy detail-skeleton-copy reveal-up">
            <div className="detail-brand-row detail-brand-row-skeleton">
              <div className="skeleton-token skeleton-brand-mark" />
              <div className="skeleton-token skeleton-brand-line" />
            </div>

            <div className="skeleton-token skeleton-title-line skeleton-title-line-wide" />
            <div className="skeleton-token skeleton-title-line skeleton-title-line-short" />

            <div className="detail-cinema-meta detail-skeleton-meta">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="skeleton-token skeleton-chip" key={index} />
              ))}
            </div>

            <div className="skeleton-paragraph">
              <div className="skeleton-token skeleton-copy-line" />
              <div className="skeleton-token skeleton-copy-line is-medium" />
              <div className="skeleton-token skeleton-copy-line is-short" />
            </div>

            <div className="detail-cinema-actions detail-skeleton-actions">
              <div className="skeleton-token skeleton-primary-button" />
              <div className="skeleton-token skeleton-soft-button" />
              <div className="skeleton-token skeleton-soft-button" />
            </div>
          </div>

          <div className="detail-bottom-dock detail-skeleton-dock reveal-up">
            <div className="season-tab-row detail-skeleton-tabs">
              {Array.from({ length: 4 }).map((_, index) => (
                <div className="skeleton-token skeleton-season-tab" key={index} />
              ))}
            </div>
            <div className="detail-episode-strip">
              {Array.from({ length: 5 }).map((_, index) => (
                <article className="detail-episode-card skeleton-episode-card" key={index}>
                  <div className="skeleton-token skeleton-episode-title" />
                  <div className="skeleton-token skeleton-episode-meta" />
                </article>
              ))}
            </div>
          </div>
        </section>
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
          <button type="button" onClick={() => router.back()} className="detail-round-button" aria-label="Go back">
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
            <button
              type="button"
              onClick={toggleWatchLater}
              className={`detail-soft-action ${titleState.watchLater ? "is-saved" : ""}`}
              aria-label={titleState.watchLater ? "Remove from watch later" : "Add to watch later"}
            >
              {titleState.watchLater ? (
                <Check className="h-5 w-5 text-white" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </button>
            <button type="button" onClick={openTitleRating} className="detail-soft-action detail-rate-action" aria-label="Rate this title">
              <ThumbsUp className="h-5 w-5" fill={titleState.rating ? "currentColor" : "none"} />
            </button>
          </div>
          {titleState.publicRating !== null && (
            <div className="jokaflix-public-rating">
              <img src="/logo-sub.png" alt="" />
              <span>{titleState.publicRating.toFixed(1)}</span>
              <small>{titleState.ratingCount} ratings</small>
            </div>
          )}
        </div>

        {hasPrimaryRail && (
          <div className="detail-bottom-dock reveal-up">
            {!isMovie && seasons.length > 0 && (
              <div className="season-tab-row" role="tablist" aria-label="Seasons">
                {seasons.slice(0, 8).map((season, index) => (
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
                    ? activeEpisodes.map((episodeItem) => {
                        const episodeNumber = Number(episodeItem.episode_number || 1);
                        const ratingKey = `${activeSeasonNumber}-${episodeNumber}`;
                        const publicRating = episodePublicRatings[ratingKey];
                        return (
                          <article className="detail-episode-card" key={episodeItem.id || episodeItem.episode_number}>
                            <Link
                              href={`/play/tv-show/${id}?season=${activeSeasonNumber}&episode=${episodeNumber}`}
                              className="detail-episode-card-link"
                            >
                              <img
                                src={
                                  episodeItem.still_path
                                    ? `https://image.tmdb.org/t/p/w500${episodeItem.still_path}`
                                    : backdropUrl || posterUrl
                                }
                                alt={episodeItem.name}
                              />
                              <span>{episodeItem.name || `Episode ${episodeNumber}`}</span>
                              <small>Episode {episodeNumber}</small>
                            </Link>
                            {publicRating?.average !== null && publicRating?.average !== undefined && (
                              <div className="episode-public-rating">
                                <img src="/logo-sub.png" alt="" />
                                <Star className="h-3.5 w-3.5" fill="currentColor" />
                                <strong>{publicRating.average.toFixed(1)}</strong>
                              </div>
                            )}
                            <button
                              type="button"
                              className="episode-rate-button"
                              onClick={(event) => openEpisodeRating(episodeItem, event)}
                              aria-label={`Rate episode ${episodeNumber}`}
                            >
                              <ThumbsUp className="h-4 w-4" fill={episodeRatings[ratingKey] ? "currentColor" : "none"} />
                            </button>
                          </article>
                        );
                      })
                    : Array.from({ length: activeSeasonData?.episode_count || 6 }).map((_, index) => {
                        const episodeNumber = index + 1;
                        const ratingKey = `${activeSeasonNumber}-${episodeNumber}`;
                        const fallbackEpisode = { episode_number: episodeNumber, name: `Episode ${episodeNumber}`, still_path: null };
                        const publicRating = episodePublicRatings[ratingKey];
                        return (
                          <article className="detail-episode-card" key={`${activeSeasonNumber}-${episodeNumber}`}>
                            <Link
                              href={`/play/tv-show/${id}?season=${activeSeasonNumber}&episode=${episodeNumber}`}
                              className="detail-episode-card-link"
                            >
                              <img src={backdropUrl || posterUrl} alt="" />
                              <span>Episode {episodeNumber}</span>
                              <small>Season {activeSeasonNumber}</small>
                            </Link>
                            {publicRating?.average !== null && publicRating?.average !== undefined && (
                              <div className="episode-public-rating">
                                <img src="/logo-sub.png" alt="" />
                                <Star className="h-3.5 w-3.5" fill="currentColor" />
                                <strong>{publicRating.average.toFixed(1)}</strong>
                              </div>
                            )}
                            <button
                              type="button"
                              className="episode-rate-button"
                              onClick={(event) => openEpisodeRating(fallbackEpisode, event)}
                              aria-label={`Rate episode ${episodeNumber}`}
                            >
                              <ThumbsUp className="h-4 w-4" fill={episodeRatings[ratingKey] ? "currentColor" : "none"} />
                            </button>
                          </article>
                        );
                      })
                : similar.map((item: TrendingMovie) => {
                    const itemTitle = item.title || item.name;
                    return (
                      <Link href={`/movie/${item.id}`} className="detail-episode-card" key={item.id}>
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
              {cast.map((actor) => (
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
              {trailers.map((trailer) => (
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
      <Dialog open={!!ratingTarget} onOpenChange={(open) => !open && closeRatingDialog()}>
        <DialogContent className={`rating-dialog ${ratingStep === "thanks" ? "is-thanks" : ""}`} showCloseButton={false}>
          <div className="rating-dialog-header">
            <span className="rating-dialog-icon-spacer" />
            <DialogTitle className="rating-dialog-title">
              {ratingStep === "thanks" ? "THANK YOU" : ratingTarget?.existingRating ? "YOUR RATING" : "REVIEW"}
            </DialogTitle>
            <button type="button" className="rating-dialog-icon-button is-close" onClick={closeRatingDialog} aria-label="Close rating modal">
              <X className="h-5 w-5" />
            </button>
          </div>
          <DialogDescription className="rating-dialog-copy">
            {ratingStep === "thanks"
              ? "Your JokaFlix rating has been saved."
              : ratingTarget?.label || "Rate this title"}
          </DialogDescription>
          {ratingTarget?.existingRating ? (
            <div className="rating-existing">
              <span>You already rated this {ratingTarget.kind === "episode" ? "episode" : "title"}.</span>
              <strong>{ratingTarget.existingRating}/{RATING_SCALE}</strong>
              {ratingTarget.existingComment && <small>{ratingTarget.existingComment}</small>}
            </div>
          ) : ratingStep === "thanks" ? (
            <div className="rating-thanks">
              <img src="/logo-sub.png" alt="" />
              <CheckCircle2 className="rating-thanks-icon" />
              <strong>Thanks for sharing your taste.</strong>
              <span>Your rating helps shape JokaFlix recommendations.</span>
              <Button className="rating-submit" onClick={closeRatingDialog}>Done</Button>
            </div>
          ) : (
            <>
              <div className="rating-title-strip">
                <img
                  src={
                    ratingTarget?.kind === "episode" && ratingTarget.episode.still_path
                      ? `https://image.tmdb.org/t/p/w185${ratingTarget.episode.still_path}`
                      : posterUrl || "/logo-sub.png"
                  }
                  alt=""
                />
                <div>
                  <strong>{ratingTarget?.label}</strong>
                  <span>{ratingTarget?.kind === "episode" ? `Season ${activeSeasonNumber} · Episode ${ratingTarget.episodeNumber}` : isMovie ? "Movie" : "Series"}</span>
                </div>
              </div>
              <strong className="rating-tone">{ratingTone(pendingRating)}</strong>
              <div className="rating-scale">
                <div
                  className="rating-star-grid"
                  aria-label={`Choose rating out of ${RATING_SCALE}`}
                  onMouseLeave={() => setHoverRating(0)}
                  onPointerLeave={() => setHoverRating(0)}
                >
                  {Array.from({ length: RATING_SCALE }).map((_, index) => {
                    const value = index + 1;
                    const displayRating = hoverRating || pendingRating;
                    return (
                      <button
                        type="button"
                        className={displayRating >= value ? "is-active" : ""}
                        key={value}
                        onClick={() => setPendingRating(value)}
                        onBlur={() => setHoverRating(0)}
                        onFocus={() => setHoverRating(value)}
                        onMouseEnter={() => setHoverRating(value)}
                        onPointerEnter={() => setHoverRating(value)}
                        aria-label={`Rate ${value} out of ${RATING_SCALE}`}
                      >
                        <Star fill="currentColor" />
                        <span>{value}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="rating-scale-labels" aria-hidden="true">
                  <span>1</span>
                  <span>{RATING_SCALE}</span>
                </div>
              </div>
              <label className="rating-comment-wrap">
                <span>Write your review</span>
                <textarea
                  className="rating-comment"
                  value={ratingComment}
                  onChange={(event) => setRatingComment(event.target.value)}
                  maxLength={500}
                  placeholder="Please share your experience with this title..."
                />
              </label>
              <Button className="rating-submit" onClick={submitRating} disabled={!pendingRating || ratingSubmitting}>
                {ratingSubmitting ? "Saving..." : `Submit Review`}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
