import type { MetadataRoute } from "next";
import { absoluteUrl, fetchTmdbList, tmdbImage, type TmdbTitleDetails } from "../lib/seo";

type TmdbGenre = {
  id: number;
  name: string;
};

const staticRoutes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
  { path: "/", priority: 1, changeFrequency: "daily" },
  { path: "/movies", priority: 0.9, changeFrequency: "daily" },
  { path: "/series", priority: 0.9, changeFrequency: "daily" },
  { path: "/genres", priority: 0.8, changeFrequency: "weekly" },
  { path: "/actors", priority: 0.7, changeFrequency: "weekly" },
];

function titleImage(title: TmdbTitleDetails) {
  const url = tmdbImage(title.backdrop_path || title.poster_path, "w1280");
  if (!url) return undefined;
  return [url];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const [popularMovies, nowPlayingMovies, popularSeries, onAirSeries, movieGenres] = await Promise.all([
    fetchTmdbList<TmdbTitleDetails>("/movie/popular?page=1"),
    fetchTmdbList<TmdbTitleDetails>("/movie/now_playing?page=1"),
    fetchTmdbList<TmdbTitleDetails>("/tv/popular?page=1"),
    fetchTmdbList<TmdbTitleDetails>("/tv/on_the_air?page=1"),
    fetchTmdbList<TmdbGenre>("/genre/movie/list"),
  ]);

  const movieEntries =
    [...(popularMovies?.results || []), ...(nowPlayingMovies?.results || [])]
      .filter((movie, index, movies) => movie.id && movies.findIndex((item) => item.id === movie.id) === index)
      .slice(0, 40)
      .map((movie) => ({
        url: absoluteUrl(`/movie/${movie.id}`),
        lastModified: movie.release_date ? new Date(movie.release_date) : now,
        changeFrequency: "weekly" as const,
        priority: 0.85,
        images: titleImage(movie),
      }));

  const seriesEntries =
    [...(popularSeries?.results || []), ...(onAirSeries?.results || [])]
      .filter((show, index, shows) => show.id && shows.findIndex((item) => item.id === show.id) === index)
      .slice(0, 40)
      .map((show) => ({
        url: absoluteUrl(`/series/${show.id}`),
        lastModified: show.first_air_date ? new Date(show.first_air_date) : now,
        changeFrequency: "weekly" as const,
        priority: 0.85,
        images: titleImage(show),
      }));

  const genreEntries =
    (movieGenres?.genres || []).map((genre) => ({
      url: absoluteUrl(`/genres/${genre.id}?name=${encodeURIComponent(genre.name)}`),
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [
    ...staticRoutes.map((route) => ({
      url: absoluteUrl(route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    })),
    ...movieEntries,
    ...seriesEntries,
    ...genreEntries,
  ];
}
