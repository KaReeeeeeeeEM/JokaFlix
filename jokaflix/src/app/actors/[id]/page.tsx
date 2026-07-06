import type { Metadata } from "next";
import { JsonLd } from "../../../components/seo/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, createMetadata, fetchTmdbPerson, tmdbImage, truncateDescription } from "../../../lib/seo";
import ActorMoviesPage from "../../../screens/ActorMovies";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const actor = await fetchTmdbPerson(id);
  const name = actor?.name || "Actor";

  return createMetadata({
    title: `${name} Movies`,
    description: truncateDescription(actor?.biography || `Explore ${name}'s movie filmography on JokaFlix.`),
    path: `/actors/${id}`,
    image: tmdbImage(actor?.profile_path, "w500"),
    keywords: [name, `${name} movies`, "actor filmography"],
  });
}

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const actor = await fetchTmdbPerson(id);
  const name = actor?.name || "Actor";

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Actors", path: "/actors" }, { name, path: `/actors/${id}` }])} />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Person",
          "@id": absoluteUrl(`/actors/${id}#person`),
          name,
          description: actor?.biography || undefined,
          image: tmdbImage(actor?.profile_path, "w500") || undefined,
          url: absoluteUrl(`/actors/${id}`),
        }}
      />
      <ActorMoviesPage />
    </>
  );
}
