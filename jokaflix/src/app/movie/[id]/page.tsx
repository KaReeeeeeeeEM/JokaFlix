import type { Metadata } from "next";
import { JsonLd } from "../../../components/seo/JsonLd";
import { breadcrumbJsonLd, createTitleMetadata, fetchTmdbTitle, titleJsonLd, titleName } from "../../../lib/seo";
import DetailPage from "../../../screens/Detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const details = await fetchTmdbTitle("movie", id);
  return createTitleMetadata("movie", id, details);
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const details = await fetchTmdbTitle("movie", id);
  const name = titleName(details, "movie") || "Movie";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Movies", path: "/movies" }, { name, path: `/movie/${id}` }])} />
      <JsonLd data={titleJsonLd("movie", id, details)} />
      <DetailPage mediaType="movie" />
    </>
  );
}
