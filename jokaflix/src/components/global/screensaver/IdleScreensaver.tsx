"use client";

import * as React from "react";
import { X } from "lucide-react";
import { useFetch } from "../../../api";
import type { TrendingMovie } from "../../../../types";

const idleDelayMs = 22000;
const pointerJitterThreshold = 12;

function backdropUrl(item: TrendingMovie) {
  const path = item.backdrop_path || item.poster_path;
  return path ? `https://image.tmdb.org/t/p/original${path}` : "";
}

function titleFor(item: TrendingMovie) {
  return item.title || item.name || item.original_title || "JokaFlix pick";
}

function metadataFor(item: TrendingMovie) {
  const year = (item.release_date || item.first_air_date || "").slice(0, 4);
  const mediaType = item.media_type === "tv" ? "Series" : "Movie";
  const rating = item.vote_average > 0 ? `${item.vote_average.toFixed(1)} rating` : "";
  return [year, mediaType, rating].filter(Boolean).join(" · ");
}

export default function IdleScreensaver() {
  const [visible, setVisible] = React.useState(false);
  const [exiting, setExiting] = React.useState(false);
  const [index, setIndex] = React.useState(0);
  const idleTimer = React.useRef<number | null>(null);
  const exitTimer = React.useRef<number | null>(null);
  const visibleRef = React.useRef(false);
  const lastPointer = React.useRef<{ x: number; y: number } | null>(null);
  const { data } = useFetch<{ results: TrendingMovie[] }>({
    url: "/api/screensaver",
    queryKey: ["screensaver-items"],
  });

  const items = React.useMemo(
    () => (data?.results || []).filter((item) => backdropUrl(item)).slice(0, 10),
    [data?.results],
  );
  const current = items[index % Math.max(items.length, 1)];

  React.useEffect(() => {
    visibleRef.current = visible;
  }, [visible]);

  const hideScreensaver = React.useCallback(() => {
    if (!visibleRef.current) return;

    setExiting(true);
    if (exitTimer.current) window.clearTimeout(exitTimer.current);
    exitTimer.current = window.setTimeout(() => {
      setVisible(false);
      visibleRef.current = false;
      setExiting(false);
    }, 520);
  }, []);

  const resetIdleTimer = React.useCallback(() => {
    if (idleTimer.current) window.clearTimeout(idleTimer.current);
    hideScreensaver();
    idleTimer.current = window.setTimeout(() => {
      if (items.length > 0) {
        if (exitTimer.current) window.clearTimeout(exitTimer.current);
        setExiting(false);
        visibleRef.current = true;
        setVisible(true);
      }
    }, idleDelayMs);
  }, [hideScreensaver, items.length]);

  React.useEffect(() => {
    resetIdleTimer();

    const handleActivity = (event: Event) => {
      if (event.type === "pointermove" && !visibleRef.current) {
        const pointerEvent = event as PointerEvent;
        const previous = lastPointer.current;
        lastPointer.current = { x: pointerEvent.clientX, y: pointerEvent.clientY };

        if (
          previous &&
          Math.abs(pointerEvent.clientX - previous.x) < pointerJitterThreshold &&
          Math.abs(pointerEvent.clientY - previous.y) < pointerJitterThreshold
        ) {
          return;
        }
      }

      resetIdleTimer();
    };

    const events = ["pointermove", "pointerdown", "keydown", "wheel", "touchstart"];
    events.forEach((eventName) => window.addEventListener(eventName, handleActivity, { passive: true }));
    return () => {
      if (idleTimer.current) window.clearTimeout(idleTimer.current);
      if (exitTimer.current) window.clearTimeout(exitTimer.current);
      events.forEach((eventName) => window.removeEventListener(eventName, handleActivity));
    };
  }, [resetIdleTimer]);

  React.useEffect(() => {
    if (!visible || exiting || items.length <= 1) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % items.length);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [exiting, items.length, visible]);

  if (!visible || !current) return null;

  return (
    <div
      className={`idle-screensaver ${exiting ? "is-exiting" : ""}`}
      role="dialog"
      aria-label="Featured title preview"
      onClick={resetIdleTimer}
    >
      {items.map((item, itemIndex) => (
        <div
          className={`idle-screensaver-slide ${itemIndex === index % items.length ? "is-active" : ""}`}
          key={`${item.media_type || "title"}-${item.id}`}
          style={{ backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.84), rgba(0,0,0,0.24)), url("${backdropUrl(item)}")` }}
        />
      ))}
      <button type="button" className="idle-screensaver-close" onClick={resetIdleTimer} aria-label="Close screensaver">
        <X />
      </button>
      <div className="idle-screensaver-copy">
        <h2>{titleFor(current)}</h2>
        <span>{metadataFor(current)}</span>
      </div>
      <div className="idle-screensaver-progress" aria-hidden="true">
        {items.map((item, itemIndex) => (
          <span className={itemIndex === index % items.length ? "is-active" : ""} key={`screen-dot-${item.id}`} />
        ))}
      </div>
    </div>
  );
}
