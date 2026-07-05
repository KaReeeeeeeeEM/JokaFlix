import Link from "next/link";
import { ArrowLeft, ListOrdered } from "lucide-react";
import type { AdminUser } from "../lib/admin";
import { adminLeaderboardTitle, type AdminLeaderboardRow, type AdminLeaderboardType } from "../lib/admin-leaderboards";

function formatNumber(value: number | string | undefined | null) {
  const numericValue = Number(value || 0);
  if (!Number.isFinite(numericValue)) return "0";

  const absoluteValue = Math.abs(numericValue);
  const suffixes = [
    { value: 1_000_000_000_000, suffix: "T" },
    { value: 1_000_000_000, suffix: "B" },
    { value: 1_000_000, suffix: "M" },
    { value: 1_000, suffix: "k" },
  ];
  const match = suffixes.find((item) => absoluteValue >= item.value);
  if (!match) return Number.isInteger(numericValue) ? numericValue.toLocaleString() : numericValue.toLocaleString(undefined, { maximumFractionDigits: 1 });

  const compactValue = numericValue / match.value;
  return `${compactValue.toLocaleString(undefined, { maximumFractionDigits: Math.abs(compactValue) >= 10 ? 0 : 1 })}${match.suffix}`;
}

export default function AdminLeaderboardPage({
  admin,
  type,
  periodLabel,
  rows,
}: {
  admin: AdminUser;
  type: AdminLeaderboardType;
  periodLabel: string;
  rows: AdminLeaderboardRow[];
}) {
  const title = adminLeaderboardTitle(type);
  const isRecentActivity = type === "recent-activity";
  const dashboardHref = type === "recent-activity" ? "/admin?section=users" : `/admin?section=leaderboards&leaderboardTab=${type}`;

  return (
    <main className="admin-console-page admin-leaderboard-page">
      <section className="admin-console-main">
        <header className="admin-console-topbar">
          <Link className="admin-console-back-link" href={dashboardHref}>
            <ArrowLeft />
            Back to dashboard
          </Link>
          <div>
            <p className="section-kicker">Full list</p>
            <h1>{title}</h1>
            <span>{admin.username || admin.name || admin.email} · {periodLabel}</span>
          </div>
        </header>

        <section className="admin-console-grid">
          <article className="admin-console-panel is-wide">
            <div className="admin-console-panel-heading">
              <div>
                <p className="section-kicker">{isRecentActivity ? "Live feed" : "Leaderboard"}</p>
                <h2>{formatNumber(rows.length)} items</h2>
              </div>
              <ListOrdered />
            </div>
            <div className="admin-console-table-wrap">
              <table className="admin-console-table">
                <thead>
                  <tr>
                    <th>{isRecentActivity ? "No." : "Rank"}</th>
                    <th>{isRecentActivity ? "Activity" : type === "genres" ? "Category" : "Name"}</th>
                    <th>{isRecentActivity ? "Actor / Source" : "Signal"}</th>
                    <th>{isRecentActivity ? "Time" : "Clicks"}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${row.id}-${index}`}>
                      <td>{String(index + 1).padStart(2, "0")}</td>
                      <td><strong>{row.label}</strong></td>
                      <td><span>{row.meta}</span></td>
                      <td>{isRecentActivity ? row.valueLabel : formatNumber(row.value)}</td>
                    </tr>
                  ))}
                  {!rows.length && (
                    <tr>
                      <td className="admin-console-table-empty" colSpan={4}>No data found for this period.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </section>
    </main>
  );
}
