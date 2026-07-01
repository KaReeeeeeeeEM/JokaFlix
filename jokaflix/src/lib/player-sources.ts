type PlayerSourceOptions = {
  tmdbId: string;
  type: "movie" | "tv";
  player: "vidsrc" | "2embed";
  season?: string | null;
  episode?: string | null;
  full?: boolean;
  resumeSeconds?: number;
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

export function buildProviderPlayerUrl({
  tmdbId,
  type,
  player,
  season,
  episode,
  full,
  resumeSeconds = 0,
}: PlayerSourceOptions) {
  if (player === "vidsrc") {
    return buildVidsrcUrl({ tmdbId, type, season, episode });
  }

  if (type === "movie") {
    return addResumeToEmbedUrl(`https://www.2embed.cc/embed/${tmdbId}`, resumeSeconds);
  }

  if (full) {
    return addResumeToEmbedUrl(`https://www.2embed.cc/embedtvfull/${tmdbId}`, resumeSeconds);
  }

  if (season && episode) {
    return addResumeToEmbedUrl(`https://www.2embed.skin/embedtv/${tmdbId}&s=${season}&e=${episode}`, resumeSeconds);
  }

  return addResumeToEmbedUrl(`https://www.2embed.skin/embedtvfull/${tmdbId}`, resumeSeconds);
}
