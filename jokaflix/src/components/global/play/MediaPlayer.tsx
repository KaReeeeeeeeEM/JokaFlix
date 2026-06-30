"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ExternalLink } from "lucide-react";
import { useFetch } from "../../../api";

export default function MediaPlayer() {
  const params = useParams<{ category: string; id: string }>();
  const category = params?.category ?? "";
  const tmdbId = params?.id ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();

  const full = searchParams?.get("full") === "1";
  const season = searchParams?.get("season");
  const episode = searchParams?.get("episode");
  const type = category === "tv-show" ? "tv" : "movie";
  const titleKey = type === "tv" ? "name" : "title";
  const dateKey = type === "tv" ? "first_air_date" : "release_date";

  const { data: details } = useFetch<any>(
    {
      url: `https://api.themoviedb.org/3/${type}/${tmdbId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}`,
    },
    { enabled: Boolean(tmdbId) }
  );

  let src = "";
  let title = "";
  if (type === "movie") {
    src = `https://www.2embed.cc/embed/${tmdbId}`;
    title = "Movie Player";
  } else if (type === "tv") {
    if (full) {
      src = `https://www.2embed.cc/embedtvfull/${tmdbId}`;
      title = "Series Player";
    } else if (season && episode) {
      src = `https://www.2embed.skin/embedtv/${tmdbId}&s=${season}&e=${episode}`;
      title = `Series Player - S${season}E${episode}`;
    } else {
      src = `https://www.2embed.skin/embedtvfull/${tmdbId}`;
      title = "Series Player";
    }
  }

  React.useEffect(() => {
    if (!tmdbId || !details) return;

    const payload = {
      tmdbId,
      mediaType: type,
      title: details?.[titleKey],
      posterPath: details?.poster_path || null,
      backdropPath: details?.backdrop_path || null,
      season: season ? Number(season) : undefined,
      episode: episode ? Number(episode) : undefined,
      progressSeconds: 1,
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
  }, [details, episode, season, tmdbId, titleKey, type]);

  return (
    <main className="player-page">
      <header className="player-topbar">
        <button type="button" onClick={() => router.back()} className="player-action" aria-label="Go back">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="section-kicker">Now playing</p>
          <h1>{details?.[titleKey] ? `${details[titleKey]}${type === "tv" && season ? ` - S${season}E${episode || 1}` : ""}` : title}</h1>
          {details?.[dateKey] && <span className="player-year">{String(details[dateKey]).slice(0, 4)}</span>}
        </div>
        <Link href={type === "tv" ? `/series/${tmdbId}` : `/movie/${tmdbId}`} className="player-action player-detail-link">
          Details
          <ExternalLink className="h-4 w-4" />
        </Link>
      </header>

      <section className="player-frame-shell">
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
      </section>
    </main>
  );
}
