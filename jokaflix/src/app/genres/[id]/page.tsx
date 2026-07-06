import type { Metadata } from "next";
import { JsonLd } from "../../../components/seo/JsonLd";
import { breadcrumbJsonLd, createMetadata } from "../../../lib/seo";
import { GenreDetailPage } from "../../../screens/Genres";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ name?: string | string[] }>;
};

function genreNameFromSearch(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const genreName = genreNameFromSearch(query.name) || "Genre";

  return createMetadata({
    title: `${genreName} Movies & Series`,
    description: `Browse ${genreName.toLowerCase()} movies and TV shows on JokaFlix, with posters, ratings, and dedicated title pages.`,
    path: `/genres/${id}?name=${encodeURIComponent(genreName)}`,
    keywords: [genreName, `${genreName} movies`, `${genreName} series`],
  });
}

export default async function Page({ params, searchParams }: PageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const genreName = genreNameFromSearch(query.name) || "Genre";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Genres", path: "/genres" }, { name: genreName, path: `/genres/${id}?name=${encodeURIComponent(genreName)}` }])} />
      <GenreDetailPage />
    </>
  );
}
