"use client";

import { Card } from "../../ui/card";
import type { TrendingMovie } from "../../../../types";
import Link from "next/link";
import { Play } from "lucide-react";
import { trackAnalyticsEvent } from "../../../lib/analytics-client";

type MovieCardProps = {
  movie: TrendingMovie;
  index?: number;
  active?: boolean;
  source?: string;
};

export function SeriesCard({ movie, index, active = false, source }: MovieCardProps) {
  const poster = movie.backdrop_path || movie.poster_path;
  const title = movie.name || movie.title || "Untitled";
  const year = (movie.first_air_date || movie.release_date)?.slice(0, 4);
  const summary = movie.overview || "Watch popular shows on JokaFlix.";
  const category = source || "Series";

  return (
    <Link
      href={`/series/${movie.id}`}
      aria-label={`Open details for ${title}`}
      className={`movie-card-link block ${active ? "is-mobile-active" : ""}`}
      onClick={() => {
        trackAnalyticsEvent({
          eventType: "movie_click",
          mediaType: "tv",
          tmdbId: movie.id,
          title,
          category,
          metadata: { source: category },
        });
      }}
    >
      <Card className="movie-card group relative overflow-hidden border border-white/10 bg-neutral-950 py-0 shadow-2xl shadow-black/30">
        {poster && (
          <img
            src={`https://image.tmdb.org/t/p/w780${poster}`}
            alt={title}
            className="movie-card-cover"
          />
        )}
        <span className="movie-card-shade" />
        {typeof index === "number" && <span className="movie-card-count">{String(index + 1).padStart(2, "0")}</span>}
        <div className="movie-card-body">
          <span className="movie-card-genre">Series{year ? ` · ${year}` : ""}</span>
          <h3>{title}</h3>
          <p>{summary}</p>
        </div>
        <span className="movie-card-play" aria-hidden="true">
          <Play size={20} fill="currentColor" />
        </span>
      </Card>
    </Link>
  );
}
