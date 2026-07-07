"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useFetch } from "../../../api";
import { MediaCardSkeleton, MovieCard } from "../cards/MovieCard";
import type { TrendingMovie } from "../../../../types";

export default function PersonalizedRecommendations({ placement = "home" }: { placement?: "home" | "profile" }) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [canScrollPrevious, setCanScrollPrevious] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  const { data, loading } = useFetch<{ authenticated: boolean; recommendations: TrendingMovie[]; reason?: string }>({
    url: "/api/user/recommendations",
  });

  const recommendations = data?.recommendations || [];
  const isProfile = placement === "profile";
  const sectionTitle = isProfile ? data?.reason || "Because of what you watch" : "For You";

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
  }, [recommendations.length, loading, updateControls]);

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollBy({ left: direction * track.clientWidth, behavior: "smooth" });
  };

  if (!loading && (!data?.authenticated || recommendations.length === 0)) {
    return null;
  }

  return (
    <section className={`${isProfile ? "profile-section" : "catalog-section"} for-you-section reveal-up`}>
      <div className="catalog-heading for-you-heading">
        <div>
          <h2 className={isProfile ? "" : "catalog-title"}>{sectionTitle}</h2>
          <p className="catalog-subtitle">
            {isProfile ? "More movies and series tuned for you." : data?.reason || "Updated from your ratings, watch later list, and recent watching."}
          </p>
        </div>
        {!loading && recommendations.length > 5 && (
          <div className="continue-carousel-actions for-you-carousel-actions" aria-label="For You carousel controls">
            <button type="button" onClick={() => scrollByPage(-1)} disabled={!canScrollPrevious} aria-label="Previous recommendations">
              <ChevronLeft />
            </button>
            <button type="button" onClick={() => scrollByPage(1)} disabled={!canScrollNext} aria-label="Next recommendations">
              <ChevronRight />
            </button>
          </div>
        )}
      </div>
      <div className="movie-strip for-you-strip" ref={trackRef}>
        {loading
          ? Array.from({ length: 8 }).map((_, index) => (
              <MediaCardSkeleton key={`for-you-loading-${index}`} index={index} active={index === 0} />
            ))
          : recommendations.slice(0, 18).map((movie, index) => (
              <MovieCard key={`${movie.media_type || "movie"}-${movie.id}`} movie={movie} index={index} active={index === 0} source="For You" />
            ))}
      </div>
    </section>
  );
}
