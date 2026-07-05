"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, ListOrdered } from "lucide-react";
import type { AdminUser } from "../lib/admin";
import type { AdminLeaderboardRow, AdminLeaderboardType } from "../lib/admin-leaderboards";
import { AdminSidenav } from "./AdminDashboard";

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

function adminLeaderboardDisplayTitle(type: AdminLeaderboardType) {
  if (type === "movies") return "Movie Leaderboard";
  if (type === "series") return "Series Leaderboard";
  if (type === "genres") return "Genre Leaderboard";
  if (type === "users") return "User Leaderboard";
  return "Recent Activity";
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
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const title = adminLeaderboardDisplayTitle(type);
  const isRecentActivity = type === "recent-activity";
  const dashboardHref = type === "recent-activity" ? "/admin?section=users" : `/admin?section=leaderboards&leaderboardTab=${type}`;
  const activeSection = type === "recent-activity" ? "users" : "leaderboards";

  React.useEffect(() => {
    document.body.classList.add("is-admin-console");
    return () => document.body.classList.remove("is-admin-console");
  }, []);

  return (
    <main className={`admin-console-page admin-leaderboard-page ${collapsed ? "is-nav-collapsed" : ""} ${mobileOpen ? "is-mobile-nav-open" : ""}`}>
      <AdminSidenav
        activeSection={activeSection}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        setActiveSection={() => undefined}
        setCollapsed={setCollapsed}
        setMobileOpen={setMobileOpen}
      />
      <section className="admin-console-main">
        <div className="admin-leaderboard-back-row">
          <Link className="admin-console-back-link" href={dashboardHref}>
            <ArrowLeft />
            Back to dashboard
          </Link>
        </div>
        <header className="admin-console-topbar admin-leaderboard-topbar">
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
              <table className="admin-console-table admin-leaderboard-table">
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
