import { JsonLd } from "../../components/seo/JsonLd";
import { breadcrumbJsonLd, createMetadata } from "../../lib/seo";
import SeriesPage from "../../screens/Series";

export const metadata = createMetadata({
  title: "Series",
  description: "Find popular and currently airing TV series with dedicated show pages, seasons, ratings, cast, trailers, and similar picks.",
  path: "/series",
  keywords: ["popular series", "TV shows", "airing now", "series ratings", "show trailers"],
});

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Series", path: "/series" }])} />
      <SeriesPage />
    </>
  );
}
