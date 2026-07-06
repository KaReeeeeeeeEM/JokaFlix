import { redirect } from "next/navigation";
import { getAdminUser } from "../../../../lib/admin";
import { adminLeaderboardTitle, getAdminLeaderboardRows, sanitizeAdminLeaderboardType } from "../../../../lib/admin-leaderboards";
import { adminDurationLabel, sanitizeAdminDuration } from "../../../../lib/admin-duration";
import { ensureAppSchemaOnce } from "../../../../lib/db";
import { createMetadata } from "../../../../lib/seo";
import AdminLeaderboardPage from "../../../../screens/AdminLeaderboardPage";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const title = adminLeaderboardTitle(sanitizeAdminLeaderboardType(type));
  return createMetadata({
    title: `${title} Admin Leaderboard`,
    description: "Private JokaFlix admin leaderboard.",
    path: `/admin/leaderboards/${type}`,
    noIndex: true,
  });
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ type: string }>;
  searchParams: Promise<{ duration?: string }>;
}) {
  await ensureAppSchemaOnce();
  const admin = await getAdminUser();

  if (!admin) {
    redirect(`/signin?next=${encodeURIComponent("/admin")}`);
  }

  const [{ type }, query] = await Promise.all([params, searchParams]);
  const leaderboardType = sanitizeAdminLeaderboardType(type);
  const duration = sanitizeAdminDuration(query.duration);
  const rows = await getAdminLeaderboardRows(leaderboardType, duration);

  return (
    <AdminLeaderboardPage
      admin={admin}
      type={leaderboardType}
      periodLabel={adminDurationLabel(duration)}
      rows={rows}
    />
  );
}
