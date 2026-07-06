import DownloadsPage from "../../../../screens/Downloads";
import { createMetadata } from "../../../../lib/seo";

export const metadata = createMetadata({
  title: "Download",
  description: "JokaFlix download page.",
  path: "/download",
  noIndex: true,
});

export default function Page() {
  return <DownloadsPage />;
}
