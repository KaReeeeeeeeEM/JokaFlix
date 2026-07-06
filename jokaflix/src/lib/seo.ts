import type { Metadata } from "next";

export const siteConfig = {
  name: "JokaFlix",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://jokaflix.vercel.app",
  description:
    "Discover trending movies, popular series, actor filmographies, genres, trailers, ratings, and watch-later picks on JokaFlix.",
  keywords: [
    "JokaFlix",
    "movies",
    "series",
    "TV shows",
    "movie discovery",
    "streaming guide",
    "trending movies",
    "popular series",
    "actor filmography",
  ],
  defaultImage: "/logo-sub.png",
  themeColor: "#e50914",
};

type SeoOptions = {
  title?: string;
  description?: string;
  path?: string;
  image?: string | null;
  type?: "website" | "article";
  noIndex?: boolean;
  keywords?: string[];
};

export type TmdbTitleDetails = {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  vote_count?: number;
  runtime?: number;
  number_of_seasons?: number;
  genres?: Array<{ id: number; name: string }>;
  credits?: { cast?: Array<{ id: number; name: string }> };
  videos?: { results?: Array<{ key: string; site: string; type: string; name: string }> };
};

export type TmdbPersonDetails = {
  id: number;
  name: string;
  biography?: string | null;
  profile_path?: string | null;
  known_for_department?: string | null;
};

type TmdbListResponse<T> = {
  results?: T[];
  genres?: Array<{ id: number; name: string }>;
};

const tmdbApiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.VITE_TMDB_API_KEY;

function normalizedBaseUrl() {
  return siteConfig.url.replace(/\/+$/, "");
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  return `${normalizedBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function canonicalPath(path = "/") {
  if (path === "/") return "/";
  return `/${path.replace(/^\/+|\/+$/g, "")}`;
}

export function truncateDescription(value: string, fallback = siteConfig.description) {
  const text = value.replace(/\s+/g, " ").trim() || fallback;
  return text.length > 158 ? `${text.slice(0, 155).trim()}...` : text;
}

export function createMetadata({
  title,
  description = siteConfig.description,
  path = "/",
  image = siteConfig.defaultImage,
  type = "website",
  noIndex = false,
  keywords = [],
}: SeoOptions = {}): Metadata {
  const canonical = absoluteUrl(canonicalPath(path));
  const metaTitle = title ? `${title} | ${siteConfig.name}` : `${siteConfig.name} | Movies, Series, Genres & Actors`;
  const metaDescription = truncateDescription(description);
  const imageUrl = image ? absoluteUrl(image) : absoluteUrl(siteConfig.defaultImage);

  return {
    metadataBase: new URL(normalizedBaseUrl()),
    title: metaTitle,
    description: metaDescription,
    applicationName: siteConfig.name,
    keywords: [...siteConfig.keywords, ...keywords],
    alternates: {
      canonical,
    },
    openGraph: {
      type,
      siteName: siteConfig.name,
      title: metaTitle,
      description: metaDescription,
      url: canonical,
      images: [
        {
          url: imageUrl,
          width: 500,
          height: 500,
          alt: siteConfig.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description: metaDescription,
      images: [imageUrl],
    },
    robots: noIndex
      ? {
          index: false,
          follow: false,
          nocache: true,
          googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
          },
        }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
  };
}

export async function tmdbFetch<T>(path: string): Promise<T | null> {
  if (!tmdbApiKey) return null;

  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`https://api.themoviedb.org/3${path}${separator}api_key=${tmdbApiKey}`, {
    next: { revalidate: 60 * 60 * 12 },
  });

  if (!response.ok) return null;
  return (await response.json()) as T;
}

export function tmdbImage(path?: string | null, size = "w780") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export async function fetchTmdbTitle(mediaType: "movie" | "tv", id: string) {
  return tmdbFetch<TmdbTitleDetails>(`/${mediaType}/${id}?append_to_response=credits,videos`);
}

export async function fetchTmdbPerson(id: string) {
  return tmdbFetch<TmdbPersonDetails>(`/person/${id}`);
}

export async function fetchTmdbList<T>(path: string) {
  return tmdbFetch<TmdbListResponse<T>>(path);
}

export function titleName(details: TmdbTitleDetails | null, mediaType: "movie" | "tv") {
  return (mediaType === "movie" ? details?.title : details?.name) || null;
}

export function titleDate(details: TmdbTitleDetails | null, mediaType: "movie" | "tv") {
  return (mediaType === "movie" ? details?.release_date : details?.first_air_date) || undefined;
}

export function createTitleMetadata(mediaType: "movie" | "tv", id: string, details: TmdbTitleDetails | null) {
  const name = titleName(details, mediaType);
  const kind = mediaType === "movie" ? "Movie" : "Series";
  const year = titleDate(details, mediaType)?.slice(0, 4);
  const image = tmdbImage(details?.backdrop_path || details?.poster_path, "w1280");

  return createMetadata({
    title: name ? `${name}${year ? ` (${year})` : ""}` : `${kind} ${id}`,
    description: details?.overview || `Explore ${name || `this ${kind.toLowerCase()}`} on JokaFlix.`,
    path: mediaType === "movie" ? `/movie/${id}` : `/series/${id}`,
    image,
    type: "article",
    keywords: [kind, name || "", ...(details?.genres?.map((genre) => genre.name) || [])].filter(Boolean),
  });
}

export function siteJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": absoluteUrl("/#organization"),
      name: siteConfig.name,
      url: absoluteUrl("/"),
      logo: absoluteUrl(siteConfig.defaultImage),
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": absoluteUrl("/#website"),
      name: siteConfig.name,
      url: absoluteUrl("/"),
      description: siteConfig.description,
      publisher: {
        "@id": absoluteUrl("/#organization"),
      },
      potentialAction: {
        "@type": "SearchAction",
        target: `${absoluteUrl("/")}?search=1&q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    },
  ];
}

export function titleJsonLd(mediaType: "movie" | "tv", id: string, details: TmdbTitleDetails | null) {
  const name = titleName(details, mediaType);
  if (!name) return null;

  const image = tmdbImage(details?.poster_path || details?.backdrop_path, "w780");
  const datePublished = titleDate(details, mediaType);
  const cast = details?.credits?.cast?.slice(0, 8).map((person) => ({
    "@type": "Person",
    name: person.name,
  }));
  const rating =
    details?.vote_average && details.vote_average > 0 && details.vote_count && details.vote_count > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: Number(details.vote_average.toFixed(1)),
          bestRating: 10,
          worstRating: 1,
          ratingCount: details.vote_count,
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": mediaType === "movie" ? "Movie" : "TVSeries",
    "@id": absoluteUrl(`${mediaType === "movie" ? "/movie" : "/series"}/${id}#title`),
    name,
    description: details?.overview || undefined,
    image: image || undefined,
    url: absoluteUrl(mediaType === "movie" ? `/movie/${id}` : `/series/${id}`),
    datePublished,
    genre: details?.genres?.map((genre) => genre.name),
    actor: cast,
    aggregateRating: rating,
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
