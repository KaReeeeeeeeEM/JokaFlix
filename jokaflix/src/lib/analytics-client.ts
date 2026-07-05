"use client";

type AnalyticsPayload = {
  eventType: "movie_click" | "category_click" | "search";
  mediaType?: "movie" | "tv";
  tmdbId?: string | number;
  title?: string | null;
  category?: string;
  metadata?: Record<string, unknown>;
};

export function trackAnalyticsEvent(payload: AnalyticsPayload) {
  if (typeof window === "undefined") return;

  const body = JSON.stringify({
    ...payload,
    pathname: window.location.pathname,
  });

  if (navigator.sendBeacon) {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/analytics/track", blob);
    return;
  }

  void fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}
