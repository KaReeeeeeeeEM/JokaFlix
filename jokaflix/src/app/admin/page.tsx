import { redirect } from "next/navigation";
import AdminDashboard from "../../screens/AdminDashboard";
import { getAdminUser } from "../../lib/admin";
import { ensureAppSchemaOnce } from "../../lib/db";

export const dynamic = "force-dynamic";

export default async function Page() {
  await ensureAppSchemaOnce();
  const admin = await getAdminUser();

  if (!admin) {
    redirect(`/signin?next=${encodeURIComponent("/admin")}`);
  }

  return <AdminDashboard admin={admin} />;
}
