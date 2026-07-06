import { JsonLd } from "../../components/seo/JsonLd";
import { breadcrumbJsonLd, createMetadata } from "../../lib/seo";
import GenresPage from "../../screens/Genres";

export const metadata = createMetadata({
  title: "Genres",
  description: "Browse JokaFlix by genre and discover movie and series collections for action, comedy, drama, horror, romance, and more.",
  path: "/genres",
  keywords: ["movie genres", "series genres", "browse by genre", "action movies", "drama series"],
});

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Genres", path: "/genres" }])} />
      <GenresPage />
    </>
  );
}
