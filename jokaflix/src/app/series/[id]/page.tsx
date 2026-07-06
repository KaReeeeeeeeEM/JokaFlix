import type { Metadata } from "next";
import { JsonLd } from "../../../components/seo/JsonLd";
import { breadcrumbJsonLd, createTitleMetadata, fetchTmdbTitle, titleJsonLd, titleName } from "../../../lib/seo";
import DetailPage from "../../../screens/Detail";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const details = await fetchTmdbTitle("tv", id);
  return createTitleMetadata("tv", id, details);
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const details = await fetchTmdbTitle("tv", id);
  const name = titleName(details, "tv") || "Series";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Series", path: "/series" }, { name, path: `/series/${id}` }])} />
      <JsonLd data={titleJsonLd("tv", id, details)} />
      <DetailPage mediaType="tv" />
    </>
  );
}
