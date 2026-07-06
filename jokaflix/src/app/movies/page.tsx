import { JsonLd } from "../../components/seo/JsonLd";
import { breadcrumbJsonLd, createMetadata } from "../../lib/seo";
import MoviesPage from "../../screens/Movies";

export const metadata = createMetadata({
  title: "Movies",
  description: "Explore popular movies and now-playing titles with posters, ratings, trailers, and dedicated JokaFlix movie pages.",
  path: "/movies",
  keywords: ["popular movies", "now playing movies", "movie ratings", "movie trailers"],
});

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Movies", path: "/movies" }])} />
      <MoviesPage />
    </>
  );
}
