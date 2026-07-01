"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ChevronDown, ChevronLeft, ListVideo, Server, SkipForward, SlidersHorizontal, X } from "lucide-react";
import { useFetch } from "../../../api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";

type TvSeasonSummary = {
  id?: number;
  name?: string;
  season_number?: number;
  episode_count?: number;
};

type PlayableDetails = {
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  first_air_date?: string | null;
  seasons?: TvSeasonSummary[];
};

type WatchHistoryItem = {
  media_type?: "movie" | "tv";
  tmdb_id?: string | number;
  season?: string | number | null;
  episode?: string | number | null;
  progress_seconds?: string | number | null;
};

type SeasonEpisode = {
  id?: number;
  episode_number?: number;
  name?: string;
  overview?: string;
  still_path?: string | null;
  runtime?: number | null;
};

type SeasonDetails = {
  episodes?: SeasonEpisode[];
  name?: string;
  season_number?: number;
};

function buildPlayerPath({
  tmdbId,
  type,
  player,
  season,
  episode,
}: {
  tmdbId: string;
  type: "movie" | "tv";
  player: "vidsrc" | "2embed";
  season?: string | number | null;
  episode?: string | number | null;
}) {
  const params = new URLSearchParams();

  if (player === "2embed") params.set("player", "2embed");

  if (type === "tv") {
    params.set("season", String(season || 1));
    params.set("episode", String(episode || 1));
  }

  const path = `/play/${type === "tv" ? "tv-show" : "movie"}/${tmdbId}`;
  const query = params.toString();

  return query ? `${path}?${query}` : path;
}

function buildPlayerEmbedPath({
  tmdbId,
  type,
  player,
  season,
  episode,
  full,
  resumeSeconds,
  playbackToken,
}: {
  tmdbId: string;
  type: "movie" | "tv";
  player: "vidsrc" | "2embed";
  season?: string | number | null;
  episode?: string | number | null;
  full?: boolean;
  resumeSeconds?: number;
  playbackToken?: string;
}) {
  const params = new URLSearchParams();

  if (player === "2embed") params.set("player", "2embed");
  if (full) params.set("full", "1");
  if (resumeSeconds && resumeSeconds > 0) params.set("resume", String(resumeSeconds));
  if (playbackToken) params.set("token", playbackToken);

  if (type === "tv") {
    params.set("season", String(season || 1));
    params.set("episode", String(episode || 1));
  }

  const path = `/api/player/${type === "tv" ? "tv-show" : "movie"}/${tmdbId}`;
  const query = params.toString();

  return query ? `${path}?${query}` : path;
}

export default function MediaPlayer({ playbackToken }: { playbackToken?: string }) {
  const params = useParams<{ category: string; id: string }>();
  const category = params?.category ?? "";
  const tmdbId = params?.id ?? "";
  const searchParams = useSearchParams();

  const full = searchParams?.get("full") === "1";
  const season = searchParams?.get("season");
  const episode = searchParams?.get("episode");
  const selectedPlayer = searchParams?.get("player") === "2embed" ? "2embed" : "vidsrc";
  const queryResumeSeconds = Math.max(0, Math.floor(Number(searchParams?.get("resume") || 0)));
  const [storedResumeSeconds, setStoredResumeSeconds] = React.useState(0);
  const [isResumeLookupPending, setIsResumeLookupPending] = React.useState(false);
  const [isEpisodeDrawerOpen, setIsEpisodeDrawerOpen] = React.useState(false);
  const [areMobileControlsOpen, setAreMobileControlsOpen] = React.useState(false);
  const [drawerSeason, setDrawerSeason] = React.useState("1");
  const type = category === "tv-show" ? "tv" : "movie";
  const titleKey = type === "tv" ? "name" : "title";
  const resumeSeconds = queryResumeSeconds || storedResumeSeconds;
  const activeSeason = season || "1";
  const activeEpisode = episode || "1";
  const activeSeasonNumber = Number(activeSeason || 1);
  const activeEpisodeNumber = Number(activeEpisode || 1);

  const { data: details } = useFetch<PlayableDetails>(
    {
      url: `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
    },
    { enabled: Boolean(tmdbId) }
  );

  const { data: seasonDetails, loading: seasonLoading } = useFetch<SeasonDetails>(
    {
      url: `https://api.themoviedb.org/3/tv/${tmdbId}/season/${drawerSeason}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
    },
    { enabled: Boolean(tmdbId) && type === "tv" }
  );

  const postProgress = React.useCallback((progressSeconds: number) => {
    if (!tmdbId || !details) return;

    const payload = {
      tmdbId,
      mediaType: type,
      title: details?.[titleKey],
      posterPath: details?.poster_path || null,
      backdropPath: details?.backdrop_path || null,
      season: type === "tv" ? Number(activeSeason || 1) : undefined,
      episode: type === "tv" ? Number(activeEpisode || 1) : undefined,
      progressSeconds,
      durationSeconds: null,
    };

    fetch("/api/user/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    }).catch(() => {
      // Progress tracking is optional and should never interrupt playback.
    });
  }, [activeEpisode, activeSeason, details, tmdbId, titleKey, type]);

  React.useEffect(() => {
    const controller = new AbortController();

    setStoredResumeSeconds(0);

    if (!tmdbId || queryResumeSeconds > 0) {
      setIsResumeLookupPending(false);
      return () => controller.abort();
    }

    setIsResumeLookupPending(true);

    fetch("/api/me", {
      credentials: "include",
      signal: controller.signal,
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { continueWatching?: WatchHistoryItem[] } | null) => {
        const history = data?.continueWatching || [];
        const matchingTitle = history.find((item) => {
          if (item.media_type !== type || String(item.tmdb_id) !== String(tmdbId)) return false;

          if (type === "movie") return true;

          const currentSeason = Number(activeSeason || 1);
          const currentEpisode = Number(activeEpisode || 1);

          return Number(item.season || 1) === currentSeason && Number(item.episode || 1) === currentEpisode;
        });
        const progress = Math.max(0, Math.floor(Number(matchingTitle?.progress_seconds || 0)));

        if (progress > 1) setStoredResumeSeconds(progress);
      })
      .catch(() => {
        // If progress cannot be loaded, playback should still start normally.
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsResumeLookupPending(false);
      });

    return () => controller.abort();
  }, [activeEpisode, activeSeason, queryResumeSeconds, tmdbId, type]);

  const src = tmdbId
    ? buildPlayerEmbedPath({
        tmdbId,
        type,
        player: selectedPlayer,
        season: activeSeason,
        episode: activeEpisode,
        full,
        resumeSeconds,
        playbackToken,
      })
    : "";
  const title = type === "tv" ? `Series Player - S${activeSeason}E${activeEpisode}` : "Movie Player";

  React.useEffect(() => {
    if (!tmdbId || !details) return;

    const startedAt = Date.now();
    const startingProgress = resumeSeconds || 1;
    const updateProgress = () => {
      const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      postProgress(startingProgress + elapsedSeconds);
    };

    updateProgress();
    const interval = window.setInterval(updateProgress, 30000);
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") updateProgress();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      updateProgress();
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [details, postProgress, resumeSeconds, tmdbId]);

  const serverOptions = [
    { id: "vidsrc" as const, label: "Src 1", href: buildPlayerPath({ tmdbId, type, player: "vidsrc", season: activeSeason, episode: activeEpisode }) },
    { id: "2embed" as const, label: "Src 2", href: buildPlayerPath({ tmdbId, type, player: "2embed", season: activeSeason, episode: activeEpisode }) },
  ];

  const seasons = React.useMemo(() => {
    return (details?.seasons || [])
      .filter((item) => Number(item.season_number) > 0)
      .sort((a, b) => Number(a.season_number) - Number(b.season_number));
  }, [details?.seasons]);
  const drawerSeasonData = seasons.find((item) => Number(item.season_number) === Number(drawerSeason));
  const drawerSeasonLabel = drawerSeasonData?.name || `Season ${drawerSeason}`;
  const playingSeasonData = seasons.find((item) => Number(item.season_number) === activeSeasonNumber);
  const nextSeasonData = seasons.find((item) => Number(item.season_number) > activeSeasonNumber);
  const episodes = seasonDetails?.episodes || [];
  const showEpisodeDrawer = type === "tv";
  const nextEpisodeHref = React.useMemo(() => {
    if (!showEpisodeDrawer || !tmdbId || !playingSeasonData?.episode_count) return "";

    if (activeEpisodeNumber < Number(playingSeasonData.episode_count)) {
      return buildPlayerPath({
        tmdbId,
        type,
        player: selectedPlayer,
        season: activeSeasonNumber,
        episode: activeEpisodeNumber + 1,
      });
    }

    if (nextSeasonData?.season_number) {
      return buildPlayerPath({
        tmdbId,
        type,
        player: selectedPlayer,
        season: nextSeasonData.season_number,
        episode: 1,
      });
    }

    return "";
  }, [
    activeEpisodeNumber,
    activeSeasonNumber,
    nextSeasonData?.season_number,
    playingSeasonData?.episode_count,
    selectedPlayer,
    showEpisodeDrawer,
    tmdbId,
    type,
  ]);
  const switchSeason = React.useCallback((nextSeason: number) => {
    if (nextSeason === Number(drawerSeason)) return;
    setDrawerSeason(String(nextSeason));
  }, [drawerSeason]);

  React.useEffect(() => {
    setIsEpisodeDrawerOpen(false);
    setAreMobileControlsOpen(false);
  }, [selectedPlayer]);

  React.useEffect(() => {
    if (!isEpisodeDrawerOpen) setDrawerSeason(activeSeason);
  }, [activeSeason, isEpisodeDrawerOpen]);

  return (
    <main className="player-page">
      <header className="player-topbar">
        <Link href={type === "tv" ? `/series/${tmdbId}` : `/movie/${tmdbId}`} className="player-action" aria-label="Back to details">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="section-kicker">Now playing</p>
          <h1>{details?.[titleKey] ? `${details[titleKey]}${type === "tv" ? ` - S${activeSeason}E${activeEpisode}` : ""}` : title}</h1>
        </div>
        <button
          type="button"
          className="player-action player-mobile-controls-toggle"
          onClick={() => setAreMobileControlsOpen((current) => !current)}
          aria-expanded={areMobileControlsOpen}
          aria-controls="player-mobile-controls"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Controls
        </button>
        <div id="player-mobile-controls" className={`player-topbar-actions ${areMobileControlsOpen ? "is-open" : ""}`}>
          {nextEpisodeHref && (
            <Link href={nextEpisodeHref} className="player-action player-next-episode" aria-label="Play next episode">
              <SkipForward className="h-4 w-4" />
              Play next
            </Link>
          )}
          {showEpisodeDrawer && (
            <button
              type="button"
              className="player-action player-episodes-toggle"
              onClick={() => {
                setDrawerSeason(activeSeason);
                setIsEpisodeDrawerOpen(true);
              }}
              aria-expanded={isEpisodeDrawerOpen}
              aria-controls="player-episodes-drawer"
            >
              <ListVideo className="h-4 w-4" />
              Episodes
            </button>
          )}
          <div className="player-server-switcher" aria-label="Player servers">
            {serverOptions.map((option) => (
              <Link href={option.href} className={selectedPlayer === option.id ? "is-active" : ""} key={option.id}>
                <Server className="h-4 w-4" />
                {option.label}
              </Link>
            ))}
          </div>
        </div>
      </header>

      <section className="player-frame-shell">
        {isResumeLookupPending ? (
          <div className="player-frame-loading">Preparing playback...</div>
        ) : (
          <iframe
            title={title}
            src={src}
            width="100%"
            height="100%"
            allow="autoplay *; encrypted-media *; fullscreen *; picture-in-picture *"
            referrerPolicy="no-referrer"
            allowFullScreen
            frameBorder={0}
            className="player-frame"
          />
        )}
      </section>

      {showEpisodeDrawer && (
        <div className={`player-episodes-drawer-shell ${isEpisodeDrawerOpen ? "is-open" : ""}`} aria-hidden={!isEpisodeDrawerOpen}>
          <button
            type="button"
            className="player-episodes-backdrop"
            onClick={() => setIsEpisodeDrawerOpen(false)}
            aria-label="Close episodes"
            tabIndex={isEpisodeDrawerOpen ? 0 : -1}
          />
          <aside
            className="player-episodes-panel"
            id="player-episodes-drawer"
            aria-label={`${drawerSeasonLabel} episodes`}
            aria-modal={isEpisodeDrawerOpen}
            inert={!isEpisodeDrawerOpen ? true : undefined}
            role="dialog"
          >
          <div className="player-episodes-heading">
            <div className="player-episodes-title-group">
              <div>
                <p className="section-kicker">Episodes</p>
                <h2>{seasonDetails?.name || drawerSeasonLabel}</h2>
              </div>
            </div>
            <button type="button" onClick={() => setIsEpisodeDrawerOpen(false)} aria-label="Close episodes">
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="player-episode-controls-row">
            {seasons.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button type="button" className="player-season-trigger" aria-label="Switch season">
                    {drawerSeasonLabel}
                    <ChevronDown className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="player-season-menu" style={{ zIndex: 140 }}>
                  {seasons.map((seasonItem) => {
                    const seasonNumber = Number(seasonItem.season_number);
                    const isActiveSeason = seasonNumber === Number(drawerSeason);

                    return (
                      <DropdownMenuItem
                        className={isActiveSeason ? "is-active" : ""}
                        onSelect={() => switchSeason(seasonNumber)}
                        key={seasonItem.id || seasonNumber}
                      >
                        <span>{seasonItem.name || `Season ${seasonNumber}`}</span>
                        {seasonItem.episode_count ? <small>{seasonItem.episode_count} episodes</small> : null}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <span />
            )}
            <div className="player-episode-now">
              <ListVideo className="h-4 w-4" />
              S{activeSeason}E{activeEpisode} playing
            </div>
          </div>
          <div className="player-episode-strip">
            {seasonLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div className="player-episode-card is-loading" key={index} />
                ))
              : episodes.length
                ? episodes.map((episodeItem) => {
                    const episodeNumber = Number(episodeItem.episode_number || 1);
                    const isActive = Number(drawerSeason) === Number(activeSeason) && episodeNumber === Number(activeEpisode);
                    return (
                      <Link
                        href={buildPlayerPath({ tmdbId, type, player: selectedPlayer, season: drawerSeason, episode: episodeNumber })}
                        className={`player-episode-card ${isActive ? "is-active" : ""}`}
                        aria-current={isActive ? "true" : undefined}
                        onClick={() => setIsEpisodeDrawerOpen(false)}
                        tabIndex={isEpisodeDrawerOpen ? 0 : -1}
                        key={episodeItem.id || episodeNumber}
                      >
                        {episodeItem.still_path ? (
                          <img src={`https://image.tmdb.org/t/p/w500${episodeItem.still_path}`} alt="" />
                        ) : (
                          <div className="player-episode-fallback" />
                        )}
                        <span>Episode {episodeNumber}</span>
                        <strong>{episodeItem.name || `Episode ${episodeNumber}`}</strong>
                        {episodeItem.runtime ? <small>{episodeItem.runtime} min</small> : null}
                      </Link>
                    );
                  })
                : (
                    <div className="player-episodes-empty">No episodes available for this season.</div>
                  )}
          </div>
          </aside>
        </div>
      )}
    </main>
  );
}
