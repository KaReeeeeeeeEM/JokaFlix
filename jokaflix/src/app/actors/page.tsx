import { JsonLd } from "../../components/seo/JsonLd";
import { breadcrumbJsonLd, createMetadata } from "../../lib/seo";
import ActorsPage from "../../screens/Actors";

export const metadata = createMetadata({
  title: "Actors",
  description: "Search popular actors and open dedicated JokaFlix filmography pages with their best-known movies.",
  path: "/actors",
  keywords: ["actors", "filmography", "movie actors", "actor movies", "cast"],
});

export default function Page() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Actors", path: "/actors" }])} />
      <ActorsPage />
    </>
  );
}
