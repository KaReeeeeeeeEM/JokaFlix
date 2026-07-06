import { redirect } from "next/navigation";
import AdminDashboard from "../../screens/AdminDashboard";
import { getAdminUser } from "../../lib/admin";
import { ensureAppSchemaOnce } from "../../lib/db";
import { createMetadata } from "../../lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createMetadata({
  title: "Admin",
  description: "JokaFlix admin dashboard.",
  path: "/admin",
  noIndex: true,
});

export default async function Page() {
  await ensureAppSchemaOnce();
  const admin = await getAdminUser();

  if (!admin) {
    redirect(`/signin?next=${encodeURIComponent("/admin")}`);
  }

  return <AdminDashboard admin={admin} />;
}
