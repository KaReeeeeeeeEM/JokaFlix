import ProfilePage from "../../screens/Profile";
import { createMetadata } from "../../lib/seo";

export const metadata = createMetadata({
  title: "Profile",
  description: "Manage your JokaFlix profile, watch-later list, ratings, and recommendations.",
  path: "/profile",
  noIndex: true,
});

export default function Page() {
  return <ProfilePage />;
}
