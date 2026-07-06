import { JsonLd } from "../components/seo/JsonLd";
import { breadcrumbJsonLd, createMetadata } from "../lib/seo";
import Home from "../screens/Home";

export const metadata = createMetadata({
  title: "Discover Movies, Series, Genres & Actors",
  description:
    "Browse trending movies, popular series, hand-picked genres, actors, ratings, trailers, and watch-later picks on JokaFlix.",
  path: "/",
  keywords: ["movie app", "series app", "entertainment discovery", "watchlist"],
});

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }])} />
      <Home />
    </>
  );
}
