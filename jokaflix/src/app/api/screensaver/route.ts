import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const fallbackScreensaverItems = [
  {
    id: 447273,
    media_type: "movie",
    title: "Snow White",
    release_date: "2025-03-19",
    vote_average: 4.3,
    backdrop_path: "/xWWg47tTfparvjK0WJNX4xL8lW2.jpg",
    poster_path: "/oLxWocqheC8XbXbxqJ3x422j9PW.jpg",
  },
  {
    id: 950387,
    media_type: "movie",
    title: "A Minecraft Movie",
    release_date: "2025-03-31",
    vote_average: 6.1,
    backdrop_path: "/2Nti3gYAX513wvhp8IiLL6ZDyOm.jpg",
    poster_path: "/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg",
  },
  {
    id: 552524,
    media_type: "movie",
    title: "Lilo & Stitch",
    release_date: "2025-05-17",
    vote_average: 7.1,
    backdrop_path: "/7Zx3wDG5bBtcfk8lcnCWDOLM4Y4.jpg",
    poster_path: "/tUae3mefrDVTgm5mRzqWnZK6fOP.jpg",
  },
  {
    id: 1087192,
    media_type: "movie",
    title: "How to Train Your Dragon",
    release_date: "2025-06-06",
    vote_average: 8.0,
    backdrop_path: "/8eifdha9GQeZAkexgtD45546XKx.jpg",
    poster_path: "/q5pXRYTycaeW6dEgsCrd4mYPmxM.jpg",
  },
  {
    id: 575265,
    media_type: "movie",
    title: "Mission: Impossible - The Final Reckoning",
    release_date: "2025-05-17",
    vote_average: 7.2,
    backdrop_path: "/b85bJfrTOSJ7M5Ox0yp4lxIxdG1.jpg",
    poster_path: "/z53D72EAOxGRqdr7KXXWp9dJiDe.jpg",
  },
];

type TmdbScreensaverItem = {
  backdrop_path?: string | null;
  poster_path?: string | null;
};

export async function GET() {
  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY || process.env.TMDB_API_KEY;

  if (apiKey) {
    const response = await fetch(`https://api.themoviedb.org/3/trending/all/week?api_key=${apiKey}&include_adult=false`, {
      next: { revalidate: 1800 },
    }).catch(() => null);

    if (response?.ok) {
      const data = await response.json().catch(() => ({}));
      const results = Array.isArray(data.results) ? data.results as TmdbScreensaverItem[] : [];
      const usableResults = results.filter((item) => item?.backdrop_path || item?.poster_path).slice(0, 12);

      if (usableResults.length) {
        return NextResponse.json({ results: usableResults }, { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
      }
    }
  }

  return NextResponse.json({ results: fallbackScreensaverItems }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
