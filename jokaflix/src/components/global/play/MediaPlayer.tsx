"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ExternalLink, ListVideo, Server } from "lucide-react";
import { useFetch } from "../../../api";

type PlayableDetails = {
  title?: string;
  name?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  first_air_date?: string | null;
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

function addResumeToEmbedUrl(src: string, resumeSeconds: number) {
  if (!src || resumeSeconds <= 0) return src;

  const separator = src.includes("?") || src.includes("&") ? "&" : "?";
  const encodedResume = encodeURIComponent(String(resumeSeconds));

  return `${src}${separator}start=${encodedResume}&t=${encodedResume}&startTime=${encodedResume}&resume=${encodedResume}`;
}

function buildVidsrcUrl({
  tmdbId,
  type,
  season,
  episode,
}: {
  tmdbId: string;
  type: "movie" | "tv";
  season?: string | null;
  episode?: string | null;
}) {
  const params = new URLSearchParams({
    tmdb: tmdbId,
    autoplay: "1",
  });

  if (type === "tv") {
    if (season) params.set("season", season);
    if (episode) params.set("episode", episode);
    params.set("autonext", "1");
    return `https://vidsrc-embed.ru/embed/tv?${params.toString()}`;
  }

  return `https://vidsrc-embed.ru/embed/movie?${params.toString()}`;
}

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

export default function MediaPlayer() {
  const params = useParams<{ category: string; id: string }>();
  const category = params?.category ?? "";
  const tmdbId = params?.id ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();

  const full = searchParams?.get("full") === "1";
  const season = searchParams?.get("season");
  const episode = searchParams?.get("episode");
  const selectedPlayer = searchParams?.get("player") === "2embed" ? "2embed" : "vidsrc";
  const queryResumeSeconds = Math.max(0, Math.floor(Number(searchParams?.get("resume") || 0)));
  const [storedResumeSeconds, setStoredResumeSeconds] = React.useState(0);
  const [isResumeLookupPending, setIsResumeLookupPending] = React.useState(false);
  const type = category === "tv-show" ? "tv" : "movie";
  const titleKey = type === "tv" ? "name" : "title";
  const dateKey = type === "tv" ? "first_air_date" : "release_date";
  const resumeSeconds = queryResumeSeconds || storedResumeSeconds;
  const activeSeason = season || "1";
  const activeEpisode = episode || "1";

  const { data: details } = useFetch<PlayableDetails>(
    {
      url: `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
    },
    { enabled: Boolean(tmdbId) }
  );

  const { data: seasonDetails, loading: seasonLoading } = useFetch<SeasonDetails>(
    {
      url: `https://api.themoviedb.org/3/tv/${tmdbId}/season/${activeSeason}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
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

  let src = "";
  let title = "";
  if (selectedPlayer === "vidsrc") {
    src = buildVidsrcUrl({ tmdbId, type, season: activeSeason, episode: activeEpisode });
    title = type === "tv" ? `Series Player - S${activeSeason}E${activeEpisode}` : "Movie Player";
  } else if (type === "movie") {
    src = addResumeToEmbedUrl(`https://www.2embed.cc/embed/${tmdbId}`, resumeSeconds);
    title = "Movie Player";
  } else if (type === "tv") {
    if (full) {
      src = addResumeToEmbedUrl(`https://www.2embed.cc/embedtvfull/${tmdbId}`, resumeSeconds);
      title = "Series Player";
    } else if (activeSeason && activeEpisode) {
      src = addResumeToEmbedUrl(`https://www.2embed.skin/embedtv/${tmdbId}&s=${activeSeason}&e=${activeEpisode}`, resumeSeconds);
      title = `Series Player - S${activeSeason}E${activeEpisode}`;
    } else {
      src = addResumeToEmbedUrl(`https://www.2embed.skin/embedtvfull/${tmdbId}`, resumeSeconds);
      title = "Series Player";
    }
  }

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

  const resumeLabel = React.useMemo(() => {
    if (!resumeSeconds) return "";
    const minutes = Math.floor(resumeSeconds / 60);
    const seconds = resumeSeconds % 60;
    if (minutes < 60) return `${minutes}:${String(seconds).padStart(2, "0")}`;
    const hours = Math.floor(minutes / 60);
    return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }, [resumeSeconds]);

  const serverOptions = [
    { id: "vidsrc" as const, label: "Vidsrc", href: buildPlayerPath({ tmdbId, type, player: "vidsrc", season: activeSeason, episode: activeEpisode }) },
    { id: "2embed" as const, label: "Server 2", href: buildPlayerPath({ tmdbId, type, player: "2embed", season: activeSeason, episode: activeEpisode }) },
  ];

  const episodes = seasonDetails?.episodes || [];
  const showEpisodePanel = type === "tv";

  return (
    <main className="player-page">
      <header className="player-topbar">
        <button type="button" onClick={() => router.back()} className="player-action" aria-label="Go back">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="section-kicker">Now playing</p>
          <h1>{details?.[titleKey] ? `${details[titleKey]}${type === "tv" ? ` - S${activeSeason}E${activeEpisode}` : ""}` : title}</h1>
          <div className="player-meta-row">
            {details?.[dateKey] && <span className="player-year">{String(details[dateKey]).slice(0, 4)}</span>}
            <span className="player-server-label">{selectedPlayer === "vidsrc" ? "Vidsrc server" : "Server 2"}</span>
            {resumeLabel && <span className="player-resume-note">Resuming at {resumeLabel}</span>}
          </div>
        </div>
        <div className="player-topbar-actions">
          <div className="player-server-switcher" aria-label="Player servers">
            {serverOptions.map((option) => (
              <Link href={option.href} className={selectedPlayer === option.id ? "is-active" : ""} key={option.id}>
                <Server className="h-4 w-4" />
                {option.label}
              </Link>
            ))}
          </div>
          <Link href={type === "tv" ? `/series/${tmdbId}` : `/movie/${tmdbId}`} className="player-action player-detail-link">
            Details
            <ExternalLink className="h-4 w-4" />
          </Link>
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
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            referrerPolicy="no-referrer"
            allowFullScreen
            frameBorder={0}
            className="player-frame"
          />
        )}
      </section>

      {showEpisodePanel && (
        <section className="player-episodes-panel" aria-label={`Season ${activeSeason} episodes`}>
          <div className="player-episodes-heading">
            <div>
              <p className="section-kicker">Episodes</p>
              <h2>{seasonDetails?.name || `Season ${activeSeason}`}</h2>
            </div>
            <span>
              <ListVideo className="h-4 w-4" />
              Episode {activeEpisode}
            </span>
          </div>
          <div className="player-episode-strip">
            {seasonLoading
              ? Array.from({ length: 8 }).map((_, index) => (
                  <div className="player-episode-card is-loading" key={index} />
                ))
              : episodes.length
                ? episodes.map((episodeItem) => {
                    const episodeNumber = Number(episodeItem.episode_number || 1);
                    const isActive = episodeNumber === Number(activeEpisode);
                    return (
                      <Link
                        href={buildPlayerPath({ tmdbId, type, player: selectedPlayer, season: activeSeason, episode: episodeNumber })}
                        className={`player-episode-card ${isActive ? "is-active" : ""}`}
                        aria-current={isActive ? "true" : undefined}
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
        </section>
      )}
    </main>
  );
}
