"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type ContinueWatchingItem = {
  media_type: "movie" | "tv";
  tmdb_id: string | number;
  title?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  season?: number | null;
  episode?: number | null;
  progress_seconds?: number | string | null;
  duration_seconds?: number | string | null;
};

function posterUrl(path?: string | null) {
  return path ? `https://image.tmdb.org/t/p/w500${path}` : "";
}

function playerHref(item: ContinueWatchingItem) {
  const progress = Math.max(0, Math.floor(Number(item.progress_seconds || 0)));
  const params = new URLSearchParams();

  params.set("player", "vidsrc");

  if (item.media_type === "tv") {
    params.set("season", String(item.season || 1));
    params.set("episode", String(item.episode || 1));
  }

  if (progress > 1) {
    params.set("resume", String(progress));
  }

  const query = params.toString();
  const path = `/play/${item.media_type === "tv" ? "tv-show" : "movie"}/${item.tmdb_id}`;
  return query ? `${path}?${query}` : path;
}

function formatProgress(seconds?: number | string | null) {
  const total = Math.max(0, Math.floor(Number(seconds || 0)));
  if (!total) return "";
  const minutes = Math.floor(total / 60);
  const remainingSeconds = total % 60;
  if (minutes < 60) return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
  const hours = Math.floor(minutes / 60);
  return `${hours}:${String(minutes % 60).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function progressRatio(item: ContinueWatchingItem) {
  const progress = Math.max(0, Math.floor(Number(item.progress_seconds || 0)));
  const duration = Math.max(0, Math.floor(Number(item.duration_seconds || 0)));

  if (!progress) return 0;

  if (duration > 0) {
    return Math.min(1, Math.max(0.03, progress / duration));
  }

  const fallbackDuration = item.media_type === "tv" ? 45 * 60 : 2 * 60 * 60;
  return Math.min(0.96, Math.max(0.03, progress / fallbackDuration));
}

function EmptyRail({ message }: { message: string }) {
  return (
    <div className="profile-empty-rail">
      <p>{message}</p>
    </div>
  );
}

function ContinueWatchingSkeleton() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, index) => (
        <div className="profile-title-card continue-watching-card continue-watching-skeleton" aria-hidden="true" key={index} />
      ))}
    </>
  );
}

export default function ContinueWatchingRail({
  items,
  emptyMessage = "No movies yet",
  isLoading = false,
}: {
  items: ContinueWatchingItem[];
  emptyMessage?: string;
  isLoading?: boolean;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [canScrollPrevious, setCanScrollPrevious] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);

  const updateControls = React.useCallback(() => {
    const track = trackRef.current;
    if (!track) return;

    const maxScroll = track.scrollWidth - track.clientWidth;
    setCanScrollPrevious(track.scrollLeft > 4);
    setCanScrollNext(track.scrollLeft < maxScroll - 4);
  }, []);

  React.useEffect(() => {
    updateControls();
    const track = trackRef.current;
    if (!track) return;

    track.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);
    return () => {
      track.removeEventListener("scroll", updateControls);
      window.removeEventListener("resize", updateControls);
    };
  }, [items.length, updateControls]);

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: "smooth" });
  };

  const showControls = !isLoading && items.length > 5;

  return (
    <div className="continue-carousel">
      {showControls && (
        <div className="continue-carousel-actions" aria-label="Continue watching carousel controls">
          <button type="button" onClick={() => scrollByPage(-1)} disabled={!canScrollPrevious} aria-label="Previous continue watching titles">
            <ChevronLeft />
          </button>
          <button type="button" onClick={() => scrollByPage(1)} disabled={!canScrollNext} aria-label="Next continue watching titles">
            <ChevronRight />
          </button>
        </div>
      )}
      <div className="profile-rail profile-rail-horizontal" ref={trackRef}>
        {isLoading ? <ContinueWatchingSkeleton /> : items.length ? items.map((item) => {
          const ratio = progressRatio(item);
          const resumeLabel = formatProgress(item.progress_seconds);

          return (
            <Link href={playerHref(item)} className="profile-title-card continue-watching-card" key={`${item.media_type}-${item.tmdb_id}-${item.season || 0}-${item.episode || 0}`}>
              {posterUrl(item.backdrop_path || item.poster_path) && <img src={posterUrl(item.backdrop_path || item.poster_path)} alt="" />}
              <span>{item.title || `${item.media_type === "tv" ? "Series" : "Movie"} ${item.tmdb_id}`}</span>
              <small>
                {item.season ? `S${item.season} E${item.episode || 1}` : "Movie"}
                {resumeLabel ? ` - Resume ${resumeLabel}` : ""}
              </small>
              {ratio > 0 && (
                <div className="continue-watch-progress" role="progressbar" aria-label="Watch progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(ratio * 100)}>
                  <span style={{ transform: `scaleX(${ratio})` }} />
                </div>
              )}
            </Link>
          );
        }) : <EmptyRail message={emptyMessage} />}
      </div>
    </div>
  );
}
