"use client";

import * as React from "react";
import Link from "next/link";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BarChart3,
  Ban,
  BrainCircuit,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Clipboard,
  Crown,
  Download,
  Eye,
  FileText,
  Film,
  Gauge,
  Heart,
  LayoutDashboard,
  LineChartIcon,
  ListOrdered,
  LogOut,
  Menu,
  MoreVertical,
  PieChartIcon,
  Plus,
  RefreshCw,
  ScrollText,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Tags,
  Trash2,
  Trophy,
  Tv,
  User,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { AdminUser } from "../lib/admin";
import { authClient } from "../lib/auth-client";
import { notifyAuthChanged } from "../lib/auth-events";
import { ThemeToggle } from "../components/global/header/theme-toggle";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";

type Summary = {
  clicksToday: number;
  activeToday: number;
  onlineNow: number;
  totalUsers: number;
  registeredToday: number;
  totalClicks30Days: number;
  active30Days: number;
  movieClicks30Days: number;
  seriesClicks30Days: number;
  moviesTouched30Days: number;
  seriesTouched30Days: number;
  clicksPerActiveUser: number;
};

type TitleRank = { title: string; media_type: string; tmdb_id: string | null; clicks: number; total_count?: number; poster_path?: string | null; backdrop_path?: string | null };
type CategoryRank = { category: string; clicks: number; total_count?: number };
type UserRank = { label: string; clicks: number; total_count?: number };
type WeeklyPoint = { day: string; movies: number; series: number; clicks: number; users: number };
type RecentActivity = { title: string; media_type: string; category: string; user_label: string; happened_at: string; total_count?: number };
type EngagementSplit = { name: string; value: number };
type NewUserPoint = { day: string; users: number };
type UserDirectoryItem = {
  id: string;
  label: string;
  email: string;
  role: string;
  joined_at: string;
  last_seen: string | null;
  clicks_30d: number;
  active_hours_30d: number;
  favorite_category: string;
  favorite_title: string;
  online: boolean;
};
type AuditLog = { id: string; event_type: string; media_type: string; target: string; category: string; actor: string; pathname: string; happened_at: string };
type AuditHeatmapPoint = { dow: number; hour: number; value: number };
type AdminDuration = "today" | "yesterday" | "this_week" | "last_week" | "this_month" | "last_month" | "last_7_days" | "last_30_days" | "last_90_days" | "all_time";
type ReportHistoryItem = { id: string; title: string; report_type: string; format: string; row_count: number; generated_by: string; generated_at: string; duration: AdminDuration; sections: string };
type ReportTemplateItem = {
  id: string;
  name: string;
  description: string;
  report_type: ReportType;
  duration: AdminDuration;
  sections: string;
  fields: string;
  ai_prompt: string;
  template_body: string;
  created_by: string;
  updated_at: string;
};
type UserDetail = {
  profile: { id: string; label: string; email: string; name: string | null; username: string | null; role: string; joined_at: string };
  stats: {
    clicks_30d: number;
    movie_clicks_30d: number;
    series_clicks_30d: number;
    active_hours_30d: number;
    distinct_categories_30d: number;
    last_seen: string | null;
    online: boolean;
    behaviorTags: string[];
  };
  activityTrend: { day: string; clicks: number; active_hours: number }[];
  mediaMix: { name: string; value: number }[];
  categoryMix: CategoryRank[];
  topTitles: { title: string; media_type: string; clicks: number }[];
  recentEvents: { id: string; event_type: string; target: string; category: string; media_type: string; happened_at: string }[];
};
type ChatMessage = { id: string; role: "assistant" | "user"; content: string; pending?: boolean };

type AnalyticsData = {
  period: { duration: AdminDuration; label: string };
  summary: Summary;
  topMovies: TitleRank[];
  topSeries: TitleRank[];
  clickTrend: { label: string; clicks: number }[];
  weeklyTrend: WeeklyPoint[];
  bestCategories: CategoryRank[];
  leaderboard: UserRank[];
  activeUsers: { day: string; users: number }[];
  mediaSplit: { name: string; value: number }[];
  engagementSplit: EngagementSplit[];
  newUsersTrend: NewUserPoint[];
  userDirectory: UserDirectoryItem[];
  reportHistory: ReportHistoryItem[];
  reportTemplates: ReportTemplateItem[];
  auditLogs: AuditLog[];
  auditHeatmap: AuditHeatmapPoint[];
  recentActivity: RecentActivity[];
};

type SectionId = "overview" | "traffic" | "content" | "users" | "leaderboards" | "audit" | "reports" | "campaign" | "ai" | "health" | "profile";
type LeaderboardTab = "movies" | "series" | "genres" | "users";
type ReportType = "executive" | "activity" | "users" | "content" | "audit";
type ReportFormat = "csv" | "pdf";
type CampaignTemplateId = "weekly" | "winback" | "premiere" | "family";
type CampaignPosterCriteria = "trending" | "top_movies" | "top_series" | "personalized";
type CampaignPosterLayout = "strip" | "grid" | "hero";
type CampaignRecipientMode = "all" | "selected";
type CampaignPosterItem = TitleRank & { type: string; imageUrl?: string };

const chartColors = ["#e50914", "#38bdf8", "#22c55e", "#facc15", "#f97316", "#a78bfa"];
const tooltipStyle = { background: "#101010", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 8, color: "#fff" };

const durationOptions: { id: AdminDuration; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "this_week", label: "This week" },
  { id: "last_week", label: "Last week" },
  { id: "this_month", label: "This month" },
  { id: "last_month", label: "Last month" },
  { id: "last_7_days", label: "Last 7 days" },
  { id: "last_30_days", label: "Last 30 days" },
  { id: "last_90_days", label: "Last 90 days" },
  { id: "all_time", label: "All time" },
];

const reportSectionOptions = [
  { id: "summary", label: "Executive summary" },
  { id: "audience", label: "Audience growth" },
  { id: "content", label: "Content performance" },
  { id: "activity", label: "Activity trend" },
  { id: "users", label: "User table" },
  { id: "leaderboards", label: "Leaderboards" },
  { id: "audit", label: "Audit logs" },
  { id: "health", label: "Platform health" },
  { id: "recommendations", label: "Recommendations" },
];

const navItems: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "traffic", label: "Traffic", icon: LineChartIcon },
  { id: "content", label: "Content", icon: Film },
  { id: "users", label: "Users", icon: Users },
  { id: "leaderboards", label: "Leaderboards", icon: Trophy },
  { id: "audit", label: "Audit Logs", icon: ScrollText },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "campaign", label: "Campaign", icon: Send },
  { id: "ai", label: "AI Manager", icon: BrainCircuit },
  { id: "health", label: "Health", icon: Gauge },
];

const sectionIds: SectionId[] = [...navItems.map((item) => item.id), "profile"];

const leaderboardTabs: { id: LeaderboardTab; label: string; icon: LucideIcon }[] = [
  { id: "movies", label: "Movies", icon: Film },
  { id: "series", label: "Series", icon: Tv },
  { id: "genres", label: "Genres", icon: Tags },
  { id: "users", label: "Users", icon: Crown },
];

function readQueryOption<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  if (typeof window === "undefined") return fallback;
  const value = new URL(window.location.href).searchParams.get(key);
  return value && allowed.includes(value as T) ? (value as T) : fallback;
}

function updateDashboardQuery(updates: Record<string, string | null>) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  Object.entries(updates).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  });
  window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

const reportOptions: { id: ReportType; label: string; description: string }[] = [
  { id: "executive", label: "Executive summary", description: "Board-ready KPIs for investors and strategic updates." },
  { id: "activity", label: "Activity report", description: "Daily events, active users, movie clicks, and series clicks." },
  { id: "users", label: "Users report", description: "User status, roles, join dates, and 30-day activity." },
  { id: "content", label: "Content report", description: "Top titles, categories, audience reach, and engagement." },
  { id: "audit", label: "Audit logs", description: "Recent tracked user and guest activity for governance." },
];

const reportTypeDropdownOptions = reportOptions.map(({ id, label }) => ({ id, label }));
const reportFormatOptions: { id: ReportFormat; label: string }[] = [
  { id: "pdf", label: "PDF document" },
  { id: "csv", label: "CSV data file" },
];

const campaignTemplates: { id: CampaignTemplateId; label: string; subject: string; tone: string; body: string; cta: string }[] = [
  {
    id: "weekly",
    label: "Weekly watch night",
    subject: "Your next JokaFlix watch night is ready",
    tone: "Warm, cinematic, and recommendation-led",
    body: "We picked a fresh set of movies and series based on what JokaFlix viewers are opening, saving, and rating this week. Start with the highlights below and keep building your personal watchlist.",
    cta: "Open JokaFlix",
  },
  {
    id: "winback",
    label: "Come back",
    subject: "New stories are waiting on JokaFlix",
    tone: "Short, direct, and reactivation-focused",
    body: "You have new titles waiting in JokaFlix. Jump back in, continue where you stopped, and discover the picks that are trending with viewers right now.",
    cta: "Continue watching",
  },
  {
    id: "premiere",
    label: "Premiere alert",
    subject: "Tonight's featured premieres on JokaFlix",
    tone: "Premium, urgent, and launch-focused",
    body: "Make tonight feel like a premiere. We have assembled standout titles with strong audience momentum so every viewer has something worth opening first.",
    cta: "See premieres",
  },
  {
    id: "family",
    label: "Family picks",
    subject: "Easy picks for everyone watching together",
    tone: "Friendly, clear, and family-watch focused",
    body: "Bring everyone into one watch night. These picks are selected to make browsing faster and help viewers choose a title without scrolling for too long.",
    cta: "Browse picks",
  },
];

const campaignPosterCriteriaOptions: { id: CampaignPosterCriteria; label: string }[] = [
  { id: "trending", label: "Trending now" },
  { id: "top_movies", label: "Top movies" },
  { id: "top_series", label: "Top series" },
  { id: "personalized", label: "Personalized mix" },
];

const campaignPosterLayouts: { id: CampaignPosterLayout; label: string }[] = [
  { id: "strip", label: "Poster strip" },
  { id: "grid", label: "Poster grid" },
  { id: "hero", label: "Hero with posters" },
];

const reportSamples: Record<ReportType, { title: string; audience: string; sections: string[]; highlights: string[] }> = {
  executive: {
    title: "JokaFlix Executive Investor Summary",
    audience: "Investors, board updates, and strategic partners",
    sections: ["Executive KPI snapshot", "Audience growth", "Engagement quality", "Content winners", "Risks and next actions"],
    highlights: ["Registered users and active audience", "Top categories and highest-intent content", "Momentum narrative for investor pitch decks"],
  },
  activity: {
    title: "Platform Activity Report",
    audience: "Operations, product, and growth teams",
    sections: ["Daily active users", "Hourly clicks", "Movie vs series activity", "Traffic spikes", "Retention signals"],
    highlights: ["Activity by day and hour", "User engagement concentration", "Operational periods that need attention"],
  },
  users: {
    title: "User Growth and Status Report",
    audience: "Customer success and management",
    sections: ["New user trend", "Online and offline status", "Role distribution", "High-value users", "Dormant accounts"],
    highlights: ["Currently online users", "30-day active users", "Profiles with the highest activity"],
  },
  content: {
    title: "Content Performance Report",
    audience: "Content acquisition and marketing",
    sections: ["Top movies", "Top series", "Best categories", "Audience reach", "Catalog gaps"],
    highlights: ["Most-loved titles", "Category demand", "Content that can support campaigns"],
  },
  audit: {
    title: "Audit Logs Report",
    audience: "Governance, support, and security",
    sections: ["Recent activity ledger", "Actor and target", "Event categories", "Heatmap by day and hour", "Follow-up notes"],
    highlights: ["Traceable user actions", "Guest activity patterns", "Governance-ready event history"],
  },
};

const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatMediaType(value: string) {
  if (value === "tv") return "Series";
  if (value === "movie") return "Movies";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

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

  if (!match) {
    return Number.isInteger(numericValue)
      ? numericValue.toLocaleString()
      : numericValue.toLocaleString(undefined, { maximumFractionDigits: 1 });
  }

  const compactValue = numericValue / match.value;
  const maximumFractionDigits = Math.abs(compactValue) >= 10 ? 0 : 1;
  return `${compactValue.toLocaleString(undefined, {
    maximumFractionDigits,
    minimumFractionDigits: 0,
  })}${match.suffix}`;
}

function formatChartValue(value: unknown) {
  return formatNumber(typeof value === "number" || typeof value === "string" ? value : 0);
}

function formatChartLabel(value: unknown) {
  const label = String(value || "");
  const compactLabels: Record<string, string> = {
    "Registered users": "Users",
    "Active period": "Period",
    "Active today": "Today",
    "Total clicks": "Clicks",
    "Movie clicks": "Movies",
    "Series clicks": "Series",
  };

  if (compactLabels[label]) return compactLabels[label];
  return label.length > 12 ? `${label.slice(0, 11)}...` : label;
}

function formatChartTooltip(value: unknown, name: unknown) {
  return [formatChartValue(value), String(name)];
}

function formatMediaTooltip(value: unknown, name: unknown) {
  return [formatChartValue(value), formatMediaType(String(name))];
}

function totalCount<T extends { total_count?: number }>(items: T[] | undefined) {
  return Number(items?.[0]?.total_count || items?.length || 0);
}

function moreCount<T extends { total_count?: number }>(items: T[] | undefined, visible = 5) {
  return Math.max(0, totalCount(items) - Math.min(items?.length || 0, visible));
}

function fullListHref(type: string, duration?: AdminDuration) {
  const params = new URLSearchParams();
  if (duration) params.set("duration", duration);
  const query = params.toString();
  return `/admin/leaderboards/${type}${query ? `?${query}` : ""}`;
}

function hasValues<T extends Record<string, unknown>>(data: T[] | undefined, keys: (keyof T)[]) {
  return Boolean(data?.some((item) => keys.some((key) => Number(item[key] || 0) > 0)));
}

function parseJsonArray(value: string | undefined, fallback: string[] = []) {
  if (!value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : fallback;
  } catch {
    return fallback;
  }
}

function templateTypeLabel(value: ReportType) {
  return reportOptions.find((option) => option.id === value)?.label ?? value;
}

function downloadReport(type: ReportType, format: ReportFormat, options: { duration?: AdminDuration; sections?: string[]; templateId?: string | null } = {}) {
  const params = new URLSearchParams({ type, format });
  if (options.duration) params.set("duration", options.duration);
  if (options.sections?.length) params.set("sections", options.sections.join(","));
  if (options.templateId) params.set("templateId", options.templateId);
  const url = `/api/admin/reports?${params.toString()}`;
  const link = document.createElement("a");
  link.href = url;
  link.download = `jokaflix-${type}-report.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

function acknowledgeAction(label: string) {
  window.dispatchEvent(new CustomEvent("jokaflix-admin-action", { detail: { message: `${label} action is ready to connect to moderation workflow.` } }));
}

function useAnimatedPresence(open: boolean, delay = 260) {
  const [present, setPresent] = React.useState(open);

  React.useEffect(() => {
    if (open) {
      setPresent(true);
      return;
    }

    const timer = window.setTimeout(() => setPresent(false), delay);
    return () => window.clearTimeout(timer);
  }, [delay, open]);

  return present;
}

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`admin-console-skeleton ${className}`} aria-hidden="true" />;
}

function StatGridSkeleton() {
  return (
    <section className="admin-console-stat-grid" aria-label="Loading statistics">
      {Array.from({ length: 4 }, (_, index) => (
        <article className="admin-console-stat is-loading" key={index}>
          <SkeletonBlock className="is-icon" />
          <SkeletonBlock className="is-line" />
          <SkeletonBlock className="is-value" />
          <SkeletonBlock className="is-small" />
        </article>
      ))}
    </section>
  );
}

function PanelSkeleton({ wide = false, tall = false, rows = 0 }: { wide?: boolean; tall?: boolean; rows?: number }) {
  return (
    <article className={`admin-console-panel ${wide ? "is-wide" : ""}`}>
      <SkeletonBlock className="is-heading" />
      {rows ? <SkeletonRows count={rows} /> : <SkeletonBlock className={tall ? "is-chart-tall" : "is-chart"} />}
    </article>
  );
}

function SkeletonRows({ count = 5 }: { count?: number }) {
  return (
    <div className="admin-console-skeleton-rows">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonBlock className="is-row" key={index} />
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="admin-console-table-wrap">
      <table className="admin-console-table">
        <thead>
          <tr>{Array.from({ length: 6 }, (_, index) => <th key={index}><SkeletonBlock className="is-table-head" /></th>)}</tr>
        </thead>
        <tbody>
          {Array.from({ length: 6 }, (_, row) => (
            <tr key={row}>{Array.from({ length: 6 }, (_, cell) => <td key={cell}><SkeletonBlock className="is-table-cell" /></td>)}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AdminPageSkeleton({ section }: { section: SectionId }) {
  if (section === "ai") {
    return (
      <section className="admin-console-ai-page" aria-label="Loading AI Manager chat">
        <header className="admin-console-ai-page-header">
          <div><SkeletonBlock className="is-kicker" /></div>
          <div className="admin-console-ai-context">
            {Array.from({ length: 3 }, (_, index) => <SkeletonBlock className="is-context-chip" key={index} />)}
          </div>
        </header>
        <div className="admin-console-ai-chat">
          <div className="admin-console-chat-window">
            <article className="admin-console-chat-bubble is-assistant">
              <SkeletonBlock className="is-chat-label" />
              <SkeletonBlock className="is-chat-line is-wide" />
              <SkeletonBlock className="is-chat-line" />
              <div className="admin-console-ai-suggestions">
                {Array.from({ length: 3 }, (_, index) => <SkeletonBlock className="is-suggestion" key={index} />)}
              </div>
            </article>
            <article className="admin-console-chat-bubble is-user">
              <SkeletonBlock className="is-chat-line" />
            </article>
          </div>
          <div className="admin-console-chat-composer">
            <div className="admin-console-chat-composer-field">
              <SkeletonBlock className="is-composer" />
              <SkeletonBlock className="is-send" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (section === "users") {
    return (
      <>
        <SkeletonBlock className="is-tabs" />
        <StatGridSkeleton />
        <section className="admin-console-grid">
          <PanelSkeleton rows={5} />
          <PanelSkeleton />
          <PanelSkeleton wide />
          <PanelSkeleton rows={4} />
        </section>
      </>
    );
  }

  if (section === "content") {
    return (
      <section className="admin-console-grid">
        <PanelSkeleton rows={5} />
        <PanelSkeleton rows={5} />
        <PanelSkeleton wide rows={6} />
        <PanelSkeleton wide rows={2} />
      </section>
    );
  }

  if (section === "leaderboards") {
    return (
      <section className="admin-console-grid">
        <article className="admin-console-panel is-wide">
          <SkeletonBlock className="is-heading" />
          <SkeletonBlock className="is-tabs" />
          <div className="admin-console-leaderboard-layout">
            <SkeletonRows count={5} />
            <SkeletonBlock className="is-chart" />
          </div>
        </article>
      </section>
    );
  }

  if (section === "audit") {
    return (
      <section className="admin-console-grid">
        <article className="admin-console-panel is-wide">
          <SkeletonBlock className="is-heading" />
          <div className="admin-console-skeleton-heatmap">
            {Array.from({ length: 8 }, (_, row) => <SkeletonBlock className="is-heatmap-row" key={row} />)}
          </div>
        </article>
        <article className="admin-console-panel is-wide">
          <SkeletonBlock className="is-heading" />
          <TableSkeleton />
        </article>
      </section>
    );
  }

  if (section === "reports") {
    return (
      <>
        <SkeletonBlock className="is-tabs" />
        <StatGridSkeleton />
        <section className="admin-console-grid">
          <article className="admin-console-panel is-wide">
            <SkeletonBlock className="is-heading" />
            <div className="admin-console-template-grid">
              {Array.from({ length: 4 }, (_, index) => <SkeletonBlock className="is-template-card" key={index} />)}
            </div>
          </article>
          <article className="admin-console-panel is-wide">
            <SkeletonBlock className="is-heading" />
            <TableSkeleton />
          </article>
        </section>
      </>
    );
  }

  if (section === "profile") {
    return (
      <>
        <StatGridSkeleton />
        <section className="admin-console-grid">
          <PanelSkeleton wide rows={2} />
          <PanelSkeleton rows={4} />
          <PanelSkeleton rows={4} />
        </section>
      </>
    );
  }

  if (section === "traffic") {
    return (
      <section className="admin-console-grid">
        <PanelSkeleton wide tall />
        <PanelSkeleton wide />
        <PanelSkeleton />
      </section>
    );
  }

  if (section === "health") {
    return (
      <section className="admin-console-grid">
        <PanelSkeleton wide rows={3} />
        <PanelSkeleton wide />
        <PanelSkeleton />
        <PanelSkeleton />
      </section>
    );
  }

  return (
    <>
      <StatGridSkeleton />
      <section className="admin-console-grid is-overview" aria-label="Loading overview dashboard">
        <PanelSkeleton wide tall />
        <PanelSkeleton />
        <PanelSkeleton />
        <PanelSkeleton wide />
      </section>
    </>
  );
}

function EmptyChart({ label }: { label: string }) {
  return <div className="admin-console-empty">{label}</div>;
}

function AdminRefreshOverlay() {
  return (
    <div className="admin-console-refresh-overlay" role="status" aria-live="polite" aria-label="Refreshing dashboard data">
      <div>
        <span />
        <p>Refreshing dashboard data</p>
      </div>
    </div>
  );
}

function Panel({
  title,
  kicker,
  icon: Icon,
  children,
  className = "",
  action,
}: {
  title: string;
  kicker: string;
  icon?: LucideIcon;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  return (
    <article className={`admin-console-panel ${className}`}>
      <div className="admin-console-panel-heading">
        <div>
          <p className="section-kicker">{kicker}</p>
          <h2>{title}</h2>
        </div>
        <div className="admin-console-panel-heading-actions">
          {action}
          {Icon && <Icon />}
        </div>
      </div>
      {children}
    </article>
  );
}

function ChartBox({ children, tall = false }: { children: React.ReactNode; tall?: boolean }) {
  return <div className={`admin-console-chart ${tall ? "is-tall" : ""}`}>{children}</div>;
}

function AdminProfileChartCard({
  title,
  kicker,
  icon: Icon,
  children,
  wide = false,
}: {
  title: string;
  kicker: string;
  icon: LucideIcon;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <article className={`admin-profile-chart-card ${wide ? "is-wide" : ""}`}>
      <header>
        <div>
          <p>{kicker}</p>
          <h3>{title}</h3>
        </div>
        <Icon aria-hidden="true" />
      </header>
      {children}
    </article>
  );
}

function StatCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: LucideIcon }) {
  return (
    <article className="admin-console-stat">
      <span>
        <Icon />
      </span>
      <p>{label}</p>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function PreviewFooter({ remaining, href }: { remaining: number; href: string }) {
  if (remaining <= 0) return null;

  return (
    <div className="admin-console-preview-footer">
      <span>+ {formatNumber(remaining)} more</span>
      <Link href={href}>View all</Link>
    </div>
  );
}

function RankingList({ items, maxItems = 5 }: { items: { label: string; meta: string; clicks: number }[]; maxItems?: number }) {
  const visibleItems = items.slice(0, maxItems);
  return (
    <ol className="admin-console-ranking">
      {visibleItems.map((item, index) => (
        <li key={`${item.label}-${index}`}>
          <span>{String(index + 1).padStart(2, "0")}</span>
          <div>
            <strong>{item.label}</strong>
            <p>{item.meta}</p>
          </div>
          <b>{formatNumber(item.clicks)}</b>
        </li>
      ))}
      {!visibleItems.length && <li className="admin-console-empty-list">No activity tracked yet.</li>}
    </ol>
  );
}

type TableColumn<T> = {
  key: string;
  header: string;
  render: (item: T) => React.ReactNode;
};

type TableAction = {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
};

function AdminDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled = false,
}: {
  label?: string;
  value: T;
  options: { id: T; label: string }[];
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const selectedLabel = options.find((option) => option.id === value)?.label ?? value;

  return (
    <label className="admin-console-dropdown-field">
      {label && <span>{label}</span>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button type="button" className="admin-console-dropdown-trigger" disabled={disabled}>
            <span>{selectedLabel}</span>
            <ChevronDown />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="admin-console-dropdown-content" align="start">
          <DropdownMenuRadioGroup value={value} onValueChange={(nextValue) => onChange(nextValue as T)}>
            {options.map((option) => (
              <DropdownMenuRadioItem className="admin-console-dropdown-item" value={option.id} key={option.id}>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </label>
  );
}

function CampaignUserSelect({
  users,
  selectedIds,
  onChange,
  disabled = false,
}: {
  users: UserDirectoryItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const selectedUsers = users.filter((user) => selectedIds.includes(user.id));
  const filteredUsers = users.filter((user) => {
    const haystack = `${user.label} ${user.email} ${user.role}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const toggleUser = (userId: string) => {
    onChange(selectedIds.includes(userId) ? selectedIds.filter((id) => id !== userId) : [...selectedIds, userId]);
  };

  return (
    <label className="admin-console-dropdown-field campaign-recipient-select">
      <span>Selected members</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button type="button" className="admin-console-dropdown-trigger" disabled={disabled}>
            <span>{selectedIds.length ? `${selectedIds.length} member${selectedIds.length === 1 ? "" : "s"} selected` : "Choose members"}</span>
            <ChevronDown />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="admin-console-dropdown-content campaign-recipient-dropdown" align="start">
          <div className="campaign-recipient-search">
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
              placeholder="Search users..."
            />
          </div>
          <div className="campaign-recipient-list">
            {filteredUsers.map((user) => (
              <button
                type="button"
                className={`campaign-recipient-option ${selectedIds.includes(user.id) ? "is-selected" : ""}`}
                key={user.id}
                onClick={() => toggleUser(user.id)}
              >
                <span>{selectedIds.includes(user.id) ? <CheckCircle2 /> : <User />}</span>
                <strong>{user.label}</strong>
                <small>{user.email}</small>
              </button>
            ))}
            {!filteredUsers.length && <p className="campaign-recipient-empty">No users match that search.</p>}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      {selectedUsers.length > 0 && (
        <div className="campaign-recipient-chips">
          {selectedUsers.slice(0, 4).map((user) => (
            <button type="button" key={user.id} onClick={() => toggleUser(user.id)}>
              {user.label}
              <X />
            </button>
          ))}
          {selectedUsers.length > 4 && <span>+{selectedUsers.length - 4} more</span>}
        </div>
      )}
    </label>
  );
}

function AdminAccountMenu({ admin, onViewProfile }: { admin: AdminUser; onViewProfile: () => void }) {
  const router = useRouter();
  const displayName = admin.username || admin.name || admin.email || "JokaFlix Admin";
  const initials = displayName.trim().slice(0, 1).toUpperCase() || "J";
  const email = admin.email || "No email";

  const handleLogout = async () => {
    await authClient.signOut();
    notifyAuthChanged({ signedOut: true, user: null, profile: null });
    router.replace(`/signin?next=${encodeURIComponent("/admin")}`);
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="admin-console-avatar-trigger" aria-label="Admin account menu">
          <span>{initials}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="admin-console-account-menu">
        <DropdownMenuLabel className="admin-console-account-label">
          <span>{displayName}</span>
          <small>{email}</small>
          <em>{admin.role}</em>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="admin-console-account-separator" />
        <DropdownMenuItem className="admin-console-account-item" onClick={onViewProfile}>
          <User />
          View profile
        </DropdownMenuItem>
        <DropdownMenuItem className="admin-console-account-item is-danger" onClick={() => void handleLogout()}>
          <LogOut />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function TableActionMenu({ actions }: { actions: TableAction[] }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="admin-console-action-menu">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-label="Open row actions">
        <MoreVertical />
      </button>
      {open && (
        <div role="menu">
          {actions.map(({ label, icon: Icon, onClick }) => (
            <button
              key={label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onClick();
              }}
            >
              <Icon />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function AdminActionModal() {
  const [message, setMessage] = React.useState<string | null>(null);
  const [visibleMessage, setVisibleMessage] = React.useState<string | null>(null);
  const modalPresent = useAnimatedPresence(Boolean(message));

  React.useEffect(() => {
    const handleAction = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      const nextMessage = detail?.message || "Action is ready to connect to moderation workflow.";
      setVisibleMessage(nextMessage);
      setMessage(nextMessage);
    };

    window.addEventListener("jokaflix-admin-action", handleAction);
    return () => window.removeEventListener("jokaflix-admin-action", handleAction);
  }, []);

  React.useEffect(() => {
    if (!modalPresent) setVisibleMessage(null);
  }, [modalPresent]);

  const closeModal = () => setMessage(null);

  if (!modalPresent || !visibleMessage) return null;

  return (
    <div className={`admin-console-modal-layer ${message ? "is-open" : "is-closing"}`} role="presentation">
      <button type="button" className="admin-console-modal-backdrop" onClick={closeModal} aria-label="Close action message" />
      <section className="admin-console-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="admin-action-modal-title">
        <header>
          <span>
            <CheckCircle2 />
          </span>
          <div>
            <p className="section-kicker">Action</p>
            <h2 id="admin-action-modal-title">Workflow notice</h2>
          </div>
        </header>
        <p>{visibleMessage}</p>
        <footer>
          <button type="button" className="is-primary" onClick={closeModal}>Done</button>
        </footer>
      </section>
    </div>
  );
}

function PaginatedTable<T>({
  rows,
  columns,
  getRowKey,
  emptyLabel,
  renderActions,
  pageSize = 10,
}: {
  rows: T[];
  columns: TableColumn<T>[];
  getRowKey: (item: T) => string;
  emptyLabel: string;
  renderActions?: (item: T) => TableAction[];
  pageSize?: number;
}) {
  const [page, setPage] = React.useState(1);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);

  React.useEffect(() => {
    setPage(1);
  }, [rows, pageSize]);

  return (
    <div>
      <div className="admin-console-table-wrap">
        <table className="admin-console-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key}>{column.header}</th>
              ))}
              {renderActions && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={getRowKey(row)}>
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row)}</td>
                ))}
                {renderActions && (
                  <td>
                    <TableActionMenu actions={renderActions(row)} />
                  </td>
                )}
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td className="admin-console-table-empty" colSpan={columns.length + (renderActions ? 1 : 0)}>{emptyLabel}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="admin-console-pagination">
        <span>
          Showing {rows.length ? (safePage - 1) * pageSize + 1 : 0}-{Math.min(safePage * pageSize, rows.length)} of {rows.length}
        </span>
        <div>
          <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={safePage <= 1}>
            Previous
          </button>
          <strong>{safePage} / {pageCount}</strong>
          <button type="button" onClick={() => setPage((value) => Math.min(pageCount, value + 1))} disabled={safePage >= pageCount}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryBars({ items, maxItems = 5 }: { items: CategoryRank[]; maxItems?: number }) {
  const visibleItems = items.slice(0, maxItems);
  const max = Math.max(...visibleItems.map((item) => item.clicks), 1);

  return (
    <div className="admin-console-bars">
      {visibleItems.map((item) => (
        <div key={item.category}>
          <span>{item.category}</span>
          <i style={{ width: `${Math.max(8, (item.clicks / max) * 100)}%` }} />
          <b>{formatNumber(item.clicks)}</b>
        </div>
      ))}
      {!visibleItems.length && <p className="admin-console-empty-list">No category activity tracked yet.</p>}
    </div>
  );
}

export function AdminSidenav({
  activeSection,
  collapsed,
  mobileOpen,
  setActiveSection,
  setCollapsed,
  setMobileOpen,
}: {
  activeSection: SectionId;
  collapsed: boolean;
  mobileOpen: boolean;
  setActiveSection: (section: SectionId) => void;
  setCollapsed: (value: boolean) => void;
  setMobileOpen: (value: boolean) => void;
}) {
  const handleSelect = (section: SectionId) => {
    setActiveSection(section);
    setMobileOpen(false);
  };

  return (
    <>
      <button
        type="button"
        className={`admin-console-mobile-backdrop ${mobileOpen ? "is-visible" : ""}`}
        onClick={() => setMobileOpen(false)}
        aria-label="Close admin navigation"
        tabIndex={mobileOpen ? 0 : -1}
      />
      <aside className={`admin-console-sidenav ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-mobile-open" : ""}`}>
        <div className="admin-console-brand">
          <span>JF</span>
          <div>
            <strong>JokaFlix</strong>
            <p>Admin Console</p>
          </div>
          <button type="button" className="admin-console-drawer-close" onClick={() => setMobileOpen(false)} aria-label="Close admin navigation">
            <X />
          </button>
        </div>
        <nav aria-label="Admin pages">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              type="button"
              key={id}
              className={activeSection === id ? "is-active" : ""}
              onClick={() => handleSelect(id)}
              aria-label={label}
              data-tooltip={label}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </aside>
      <button type="button" className="admin-console-collapse" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand admin navigation" : "Collapse admin navigation"}>
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </button>
    </>
  );
}

function OverviewPage({ data, loading }: { data: AnalyticsData | null; loading: boolean }) {
  const summary = data?.summary;
  const hasWeeklyTrend = hasValues(data?.weeklyTrend, ["clicks", "users"]);
  const hasMediaSplit = hasValues(data?.mediaSplit, ["value"]);
  const hasEngagementSplit = hasValues(data?.engagementSplit, ["value"]);
  const hasNewUsers = hasValues(data?.newUsersTrend, ["users"]);
  const mixData = hasMediaSplit ? data?.mediaSplit ?? [] : data?.engagementSplit ?? [];

  return (
    <>
      <section className="admin-console-stat-grid">
        <StatCard label="Clicks today" value={loading ? "..." : formatNumber(summary?.clicksToday)} detail="movie and series opens" icon={Activity} />
        <StatCard label="Active today" value={loading ? "..." : formatNumber(summary?.activeToday)} detail="users and guest sessions" icon={Users} />
        <StatCard label="30 day clicks" value={loading ? "..." : formatNumber(summary?.totalClicks30Days)} detail={`${formatNumber(summary?.clicksPerActiveUser)} per active user`} icon={BarChart3} />
        <StatCard label="Total users" value={loading ? "..." : formatNumber(summary?.totalUsers)} detail={`${formatNumber(summary?.registeredToday)} joined today`} icon={ShieldCheck} />
      </section>

      <section className="admin-console-grid is-overview">
        <Panel title="Audience and Click Momentum" kicker="14 days" icon={LineChartIcon} className="is-wide">
          <ChartBox tall>
            {hasWeeklyTrend ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data?.weeklyTrend ?? []}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatChartValue} width={38} />
                  <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
                  <Legend />
                  <Area type="monotone" dataKey="clicks" fill="#e50914" fillOpacity={0.16} stroke="#e50914" strokeWidth={3} />
                  <Bar dataKey="users" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                  <Line type="monotone" dataKey="series" stroke="#facc15" strokeWidth={3} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Traffic momentum appears after users open movies or series." />
            )}
          </ChartBox>
        </Panel>

        <Panel title="Media Mix" kicker="Catalog" icon={PieChartIcon}>
          <ChartBox>
            {hasMediaSplit || hasEngagementSplit ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={mixData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={104} paddingAngle={5}>
                    {mixData.map((entry, index) => (
                      <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={formatMediaTooltip} contentStyle={tooltipStyle} />
                  <Legend formatter={(value) => formatMediaType(String(value))} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Media split appears after users or catalog clicks are tracked." />
            )}
          </ChartBox>
        </Panel>

        <Panel title="Engagement Split" kicker="Audience" icon={Sparkles}>
          <ChartBox>
            {hasEngagementSplit ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.engagementSplit ?? []}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} interval={0} tickFormatter={formatChartLabel} />
                  <YAxis stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatChartValue} width={38} />
                  <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Audience composition appears as users and activity are tracked." />
            )}
          </ChartBox>
        </Panel>

        <Panel title="New User Trend" kicker="30 days" icon={CalendarDays} className="is-wide">
          <ChartBox>
            {hasNewUsers ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.newUsersTrend ?? []}>
                  <defs>
                    <linearGradient id="adminNewUsersFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} minTickGap={18} />
                  <YAxis stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatChartValue} width={38} />
                  <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="users" name="new users" stroke="#22c55e" strokeWidth={3} fill="url(#adminNewUsersFill)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="New user growth appears as accounts are created." />
            )}
          </ChartBox>
        </Panel>
      </section>
    </>
  );
}

function TrafficPage({ data }: { data: AnalyticsData | null }) {
  const hasHourly = hasValues(data?.clickTrend, ["clicks"]);
  const hasActiveUsers = hasValues(data?.activeUsers, ["users"]);

  return (
    <section className="admin-console-grid">
      <Panel title="Today by Hour" kicker="Clicks" icon={BarChart3} className="is-wide">
        <ChartBox tall>
          {hasHourly ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.clickTrend ?? []}>
                <defs>
                  <linearGradient id="adminHourlyFill" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="5%" stopColor="#e50914" stopOpacity={0.72} />
                    <stop offset="95%" stopColor="#e50914" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatChartValue} width={38} />
                <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="clicks" stroke="#e50914" strokeWidth={3} fill="url(#adminHourlyFill)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Hourly click data appears after today’s first interaction." />
          )}
        </ChartBox>
      </Panel>

      <Panel title="Daily Active Users" kicker="Uptime" icon={Users} className="is-wide">
        <ChartBox>
          {hasActiveUsers ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.activeUsers ?? []}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatChartValue} width={34} />
                <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="users" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Daily active users build from visit activity." />
          )}
        </ChartBox>
      </Panel>

      <Panel title="Movies vs Series" kicker="14 days" icon={Tv}>
        <ChartBox>
          {hasValues(data?.weeklyTrend, ["movies", "series"]) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.weeklyTrend ?? []}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatChartValue} width={34} />
                <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
                <Legend />
                <Bar dataKey="movies" fill="#e50914" radius={[8, 8, 0, 0]} />
                <Bar dataKey="series" fill="#facc15" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Movie and series trends appear after content opens." />
          )}
        </ChartBox>
      </Panel>
    </section>
  );
}

function ContentPage({ data }: { data: AnalyticsData | null }) {
  return (
    <section className="admin-console-grid">
      <Panel title="Top Movies" kicker="Most loved" icon={Film}>
        <RankingList items={(data?.topMovies ?? []).map((item) => ({ label: item.title, meta: "Movie clicks", clicks: item.clicks }))} />
        <PreviewFooter remaining={moreCount(data?.topMovies)} href={fullListHref("movies", data?.period.duration)} />
      </Panel>

      <Panel title="Top Series" kicker="Most loved" icon={Tv}>
        <RankingList items={(data?.topSeries ?? []).map((item) => ({ label: item.title, meta: "Series clicks", clicks: item.clicks }))} />
        <PreviewFooter remaining={moreCount(data?.topSeries)} href={fullListHref("series", data?.period.duration)} />
      </Panel>

      <Panel title="Best Categories" kicker="Discovery" icon={Tags} className="is-wide">
        <CategoryBars items={data?.bestCategories ?? []} />
        <PreviewFooter remaining={moreCount(data?.bestCategories)} href={fullListHref("genres", data?.period.duration)} />
      </Panel>

      <Panel title="Content Reach" kicker="30 days" icon={Heart} className="is-wide">
        <div className="admin-console-meter-grid">
          <StatCard label="Movies touched" value={formatNumber(data?.summary.moviesTouched30Days)} detail={`${formatNumber(data?.summary.movieClicks30Days)} clicks`} icon={Film} />
          <StatCard label="Series touched" value={formatNumber(data?.summary.seriesTouched30Days)} detail={`${formatNumber(data?.summary.seriesClicks30Days)} clicks`} icon={Tv} />
        </div>
      </Panel>
    </section>
  );
}

function AdminProfilePage({ admin, data }: { admin: AdminUser; data: AnalyticsData | null }) {
  const displayName = admin.name || admin.username || admin.email || "JokaFlix Admin";
  const username = admin.username || "Not set";
  const email = admin.email || "No email";
  const initial = displayName.trim().charAt(0).toUpperCase() || "J";
  const hasWeeklyTrend = hasValues(data?.weeklyTrend, ["clicks", "users"]);
  const hasMediaSplit = hasValues(data?.mediaSplit, ["value"]);
  const hasActiveUsers = hasValues(data?.activeUsers, ["users"]);
  const hasBestCategories = Boolean(data?.bestCategories?.length);

  return (
    <div className="admin-profile-page">
      <section className="profile-hero admin-profile-hero reveal-up">
        <div className="profile-identity">
          <div className="profile-avatar admin-profile-avatar" aria-hidden="true">
            <span>{initial}</span>
          </div>
          <div>
            <p className="section-kicker">Admin Profile</p>
            <h1>{displayName}</h1>
            <p>{email}</p>
          </div>
        </div>

        <div className="profile-side-actions">
          <div className="admin-profile-badges">
            <span><ShieldCheck />{admin.role}</span>
            <span><User />@{username}</span>
            <span><CheckCircle2 />{formatNumber(data?.summary.onlineNow)} online</span>
          </div>
        </div>
      </section>

      <section className="profile-section admin-profile-section">
        <div className="profile-section-title">
          <Activity />
          <h2>Activity Charts</h2>
        </div>
        <div className="admin-profile-chart-grid">
          <AdminProfileChartCard title="Clicks And Users" kicker={data?.period.label || "Selected period"} icon={LineChartIcon} wide>
            <ChartBox tall>
              {hasWeeklyTrend ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data?.weeklyTrend ?? []}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatChartValue} width={42} />
                    <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
                    <Legend />
                    <Area type="monotone" dataKey="clicks" fill="#e50914" fillOpacity={0.18} stroke="#e50914" strokeWidth={3} />
                    <Bar dataKey="users" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart label="Clicks and user activity will appear after people interact with titles." />
              )}
            </ChartBox>
          </AdminProfileChartCard>

          <AdminProfileChartCard title="Media Split" kicker="Movie versus series demand" icon={PieChartIcon}>
            <ChartBox>
              {hasMediaSplit ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={data?.mediaSplit ?? []} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={5}>
                      {(data?.mediaSplit ?? []).map((entry, index) => (
                        <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart label="Media split appears when movies or series are opened." />
              )}
            </ChartBox>
          </AdminProfileChartCard>

          <AdminProfileChartCard title="Category Winners" kicker="Highest intent shelves" icon={Tags}>
            {hasBestCategories ? (
              <CategoryBars items={data?.bestCategories ?? []} />
            ) : (
              <EmptyChart label="Top categories will appear after tracked title clicks." />
            )}
          </AdminProfileChartCard>
        </div>
      </section>

      <section className="profile-section admin-profile-section">
        <div className="profile-section-title">
          <Users />
          <h2>Audience Charts</h2>
        </div>
        <div className="admin-profile-chart-grid">
          <AdminProfileChartCard title="Active Users" kicker="Daily unique visitors" icon={Users} wide>
            <ChartBox>
              {hasActiveUsers ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.activeUsers ?? []}>
                    <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatChartValue} width={42} />
                    <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
                    <Line type="monotone" dataKey="users" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart label="Active user charts will appear after traffic is recorded." />
              )}
            </ChartBox>
          </AdminProfileChartCard>

          <AdminProfileChartCard title="Admin Access" kicker="Current operating scope" icon={Gauge}>
            <div className="admin-console-signal-list">
              <div><span />Analytics access</div>
              <div><span />Reports access</div>
              <div><span />User operations</div>
              <div><span />Audit visibility</div>
              <div><span />Admin ID: {admin.id.slice(0, 8)}</div>
            </div>
          </AdminProfileChartCard>

          <AdminProfileChartCard title="Live Snapshot" kicker="Session-backed presence" icon={CheckCircle2}>
            <div className="admin-console-signal-list">
              <div><span />Online now: {formatNumber(data?.summary.onlineNow)}</div>
              <div><span />Total users: {formatNumber(data?.summary.totalUsers)}</div>
              <div><span />Active today: {formatNumber(data?.summary.activeToday)}</div>
              <div><span />Registered today: {formatNumber(data?.summary.registeredToday)}</div>
            </div>
          </AdminProfileChartCard>
        </div>
      </section>
    </div>
  );
}

function UserDetailView({ detail, loading, onBack }: { detail: UserDetail | null; loading: boolean; onBack: () => void }) {
  const hasActivity = hasValues(detail?.activityTrend, ["clicks", "active_hours"]);
  const hasMediaMix = hasValues(detail?.mediaMix, ["value"]);

  return (
    <>
      <div className="admin-console-page-actions">
        <button type="button" onClick={onBack}>
          <ChevronLeft />
          Back to users
        </button>
      </div>
      {loading && !detail ? (
        <AdminPageSkeleton section="profile" />
      ) : detail ? (
        <>
          <section className="admin-console-stat-grid">
            <StatCard label="30d clicks" value={formatNumber(detail.stats.clicks_30d)} detail="all tracked opens" icon={Activity} />
            <StatCard label="Active hours" value={formatNumber(detail.stats.active_hours_30d)} detail="distinct hours online" icon={Clock3} />
            <StatCard label="Category range" value={formatNumber(detail.stats.distinct_categories_30d)} detail="genres explored" icon={Tags} />
            <StatCard label="Presence" value={detail.stats.online ? "Online" : "Offline"} detail={detail.stats.last_seen || "No activity"} icon={Users} />
          </section>
          <section className="admin-console-grid">
            <Panel title={detail.profile.label} kicker="User details" icon={Users} className="is-wide">
              <div className="admin-console-user-profile">
                <div>
                  <strong>{detail.profile.email}</strong>
                  <p>{detail.profile.role} · Joined {detail.profile.joined_at}</p>
                </div>
                <div>
                  {detail.stats.behaviorTags.map((tag) => (
                    <span key={tag}>{tag}</span>
                  ))}
                </div>
              </div>
            </Panel>
            <Panel title="Activity Pattern" kicker="14 days" icon={LineChartIcon} className="is-wide">
              <ChartBox>
                {hasActivity ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={detail.activityTrend}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatChartValue} width={38} />
                      <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
                      <Legend />
                      <Area type="monotone" dataKey="clicks" fill="#e50914" fillOpacity={0.16} stroke="#e50914" strokeWidth={3} />
                      <Bar dataKey="active_hours" name="active hours" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="This user has no tracked activity trend yet." />
                )}
              </ChartBox>
            </Panel>
            <Panel title="Personal Media Mix" kicker="Taste" icon={PieChartIcon}>
              <ChartBox>
                {hasMediaMix ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={detail.mediaMix} dataKey="value" nameKey="name" innerRadius={58} outerRadius={104} paddingAngle={5}>
                        {detail.mediaMix.map((entry, index) => (
                          <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={formatMediaTooltip} contentStyle={tooltipStyle} />
                      <Legend formatter={(value) => formatMediaType(String(value))} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="Personal media mix appears after user activity." />
                )}
              </ChartBox>
            </Panel>
            <Panel title="Favorite Categories" kicker="Behavior" icon={Tags}>
              <CategoryBars items={detail.categoryMix} />
            </Panel>
            <Panel title="Favorite Titles" kicker="Most watched" icon={Heart}>
              <RankingList items={detail.topTitles.map((item) => ({ label: item.title, meta: formatMediaType(item.media_type), clicks: item.clicks }))} />
            </Panel>
            <Panel title="Recent Footprints" kicker="Audit" icon={ScrollText} className="is-wide">
              <PaginatedTable
                rows={detail.recentEvents}
                getRowKey={(event) => event.id}
                emptyLabel="This user has no recent tracked events."
                columns={[
                  { key: "time", header: "Time", render: (event) => event.happened_at },
                  { key: "event", header: "Event", render: (event) => event.event_type },
                  { key: "target", header: "Target", render: (event) => <><strong>{event.target}</strong><span>{formatMediaType(event.media_type)}</span></> },
                  { key: "category", header: "Category", render: (event) => event.category },
                ]}
                renderActions={(event) => [
                  { label: "View event details", icon: Eye, onClick: () => acknowledgeAction(`View ${event.event_type}`) },
                ]}
              />
            </Panel>
          </section>
        </>
      ) : (
        <div className="admin-console-empty">Unable to load user details.</div>
      )}
    </>
  );
}

function UsersPage({ data }: { data: AnalyticsData | null }) {
  const [tab, setTab] = React.useState<"overview" | "table">(() => readQueryOption("usersTab", "overview", ["overview", "table"]));
  const [detail, setDetail] = React.useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);
  const onlineUsers = data?.summary.onlineNow ?? (data?.userDirectory ?? []).filter((user) => user.online).length;
  const setUsersTab = (nextTab: "overview" | "table") => {
    setTab(nextTab);
    updateDashboardQuery({ usersTab: nextTab === "overview" ? null : nextTab });
  };

  const viewUser = async (user: UserDirectoryItem) => {
    setUsersTab("table");
    setDetailLoading(true);
    setDetail(null);
    try {
      const response = await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`, { credentials: "include", cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Unable to load user details");
      setDetail(payload as UserDetail);
    } catch (error) {
      acknowledgeAction(error instanceof Error ? error.message : "Unable to load user details");
    } finally {
      setDetailLoading(false);
    }
  };

  if (detail || detailLoading) {
    return <UserDetailView detail={detail} loading={detailLoading} onBack={() => setDetail(null)} />;
  }

  return (
    <>
      <div className="admin-console-tabs movies-tabs is-page-tabs" role="tablist" aria-label="User page views">
        <button type="button" role="tab" aria-selected={tab === "overview"} className={tab === "overview" ? "movies-tab is-active" : "movies-tab"} onClick={() => setUsersTab("overview")}>
          <BarChart3 />
          Overview
        </button>
        <button type="button" role="tab" aria-selected={tab === "table"} className={tab === "table" ? "movies-tab is-active" : "movies-tab"} onClick={() => setUsersTab("table")}>
          <Users />
          Users
        </button>
      </div>

      {tab === "overview" ? (
        <>
          <section className="admin-console-stat-grid">
            <StatCard label="Total users" value={formatNumber(data?.summary.totalUsers)} detail={`${formatNumber(data?.summary.registeredToday)} joined today`} icon={Users} />
            <StatCard label="Online now" value={formatNumber(onlineUsers)} detail="active sessions" icon={CheckCircle2} />
            <StatCard label="Active today" value={formatNumber(data?.summary.activeToday)} detail="users and guest sessions" icon={Activity} />
            <StatCard label="30d active" value={formatNumber(data?.summary.active30Days)} detail={`${formatNumber(data?.summary.clicksPerActiveUser)} clicks per active`} icon={BarChart3} />
          </section>
          <section className="admin-console-grid">
            <Panel title="User Leaderboard" kicker="Engagement" icon={Crown}>
              <RankingList items={(data?.leaderboard ?? []).map((item) => ({ label: item.label, meta: "tracked clicks", clicks: item.clicks }))} />
              <PreviewFooter remaining={moreCount(data?.leaderboard)} href={fullListHref("users", data?.period.duration)} />
            </Panel>
            <Panel title="Active Users" kicker="7 days" icon={Users}>
              <ChartBox>
                {hasValues(data?.activeUsers, ["users"]) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.activeUsers ?? []}>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} />
                      <YAxis stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatChartValue} width={36} />
                      <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
                      <Bar dataKey="users" fill="#22c55e" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="User uptime appears after daily activity is tracked." />
                )}
              </ChartBox>
            </Panel>
            <Panel title="New Users" kicker="30 days" icon={CalendarDays} className="is-wide">
              <ChartBox>
                {hasValues(data?.newUsersTrend, ["users"]) ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data?.newUsersTrend ?? []}>
                      <defs>
                        <linearGradient id="adminUsersPageFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.58} />
                          <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.04} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                      <XAxis dataKey="day" stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} minTickGap={18} />
                      <YAxis stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatChartValue} width={36} />
                      <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
                      <Area type="monotone" dataKey="users" name="new users" stroke="#38bdf8" strokeWidth={3} fill="url(#adminUsersPageFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyChart label="New user trend appears as users create accounts." />
                )}
              </ChartBox>
            </Panel>
            <Panel title="Recent Activity" kicker="Live feed" icon={Clock3} className="is-wide">
              <div className="admin-console-feed">
                {(data?.recentActivity ?? []).map((item, index) => (
                  <div key={`${item.title}-${item.happened_at}-${index}`}>
                    <span>{formatMediaType(item.media_type)}</span>
                    <strong>{item.title}</strong>
                    <p>{item.user_label} · {item.category} · {item.happened_at}</p>
                  </div>
                ))}
                {!data?.recentActivity?.length && <p className="admin-console-empty-list">No recent activity tracked yet.</p>}
              </div>
              <PreviewFooter remaining={moreCount(data?.recentActivity)} href={fullListHref("recent-activity", data?.period.duration)} />
            </Panel>
          </section>
        </>
      ) : (
        <section className="admin-console-grid">
          <Panel title="Users Table" kicker="Online presence" icon={Users} className="is-wide">
            <PaginatedTable
              rows={data?.userDirectory ?? []}
              getRowKey={(user) => user.id}
              emptyLabel="No users found."
              columns={[
                { key: "user", header: "User", render: (user) => <><strong>{user.label}</strong><span>{user.email}</span></> },
                { key: "role", header: "Role", render: (user) => user.role },
                { key: "status", header: "Status", render: (user) => <><i className={`admin-console-status ${user.online ? "is-online" : ""}`} />{user.online ? "Online" : "Offline"}</> },
                { key: "joined", header: "Joined", render: (user) => user.joined_at },
                { key: "lastSeen", header: "Last seen", render: (user) => user.last_seen || "No activity" },
                { key: "clicks", header: "30d clicks", render: (user) => formatNumber(user.clicks_30d) },
                { key: "favorite", header: "Favorite", render: (user) => <><strong>{user.favorite_title}</strong><span>{user.favorite_category}</span></> },
              ]}
              renderActions={(user) => [
                { label: "View details", icon: Eye, onClick: () => void viewUser(user) },
                { label: "Suspend user", icon: Ban, onClick: () => acknowledgeAction(`Suspend ${user.label}`) },
                { label: "Activate user", icon: CheckCircle2, onClick: () => acknowledgeAction(`Activate ${user.label}`) },
              ]}
            />
          </Panel>
        </section>
      )}
    </>
  );
}

function LeaderboardsPage({ data }: { data: AnalyticsData | null }) {
  const [tab, setTab] = React.useState<LeaderboardTab>(() => readQueryOption("leaderboardTab", "movies", ["movies", "series", "genres", "users"]));
  const setLeaderboardTab = (nextTab: LeaderboardTab) => {
    setTab(nextTab);
    updateDashboardQuery({ leaderboardTab: nextTab === "movies" ? null : nextTab });
  };
  const rankingItems = React.useMemo(() => {
    if (tab === "movies") return (data?.topMovies ?? []).map((item) => ({ label: item.title, meta: "most opened movie", clicks: item.clicks, total_count: item.total_count }));
    if (tab === "series") return (data?.topSeries ?? []).map((item) => ({ label: item.title, meta: "most opened series", clicks: item.clicks, total_count: item.total_count }));
    if (tab === "genres") return (data?.bestCategories ?? []).map((item) => ({ label: item.category, meta: "best category/source", clicks: item.clicks, total_count: item.total_count }));
    return (data?.leaderboard ?? []).map((item) => ({ label: item.label, meta: "most active viewer", clicks: item.clicks, total_count: item.total_count }));
  }, [data, tab]);
  const topRankingItems = rankingItems.slice(0, 5);

  return (
    <section className="admin-console-grid">
      <Panel title="Leaderboards" kicker="Most loved" icon={ListOrdered} className="is-wide">
        <div className="admin-console-leaderboard-toolbar">
          <div className="admin-console-tabs movies-tabs" role="tablist" aria-label="Leaderboard categories">
            {leaderboardTabs.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} className={tab === id ? "movies-tab is-active" : "movies-tab"} onClick={() => setLeaderboardTab(id)}>
                <Icon />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="admin-console-leaderboard-layout">
          <RankingList items={topRankingItems} />
          <div
            className="admin-console-leaderboard-chart"
            style={{ minHeight: Math.max(330, topRankingItems.length * 76 - 12) }}
          >
            {topRankingItems.some((item) => item.clicks > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topRankingItems} layout="vertical" margin={{ left: 0, right: 18, top: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.08)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatChartValue} />
                  <YAxis type="category" dataKey="label" tick={false} tickLine={false} axisLine={false} width={0} />
                  <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
                  <Bar dataKey="clicks" fill="#e50914" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart label="Leaderboard charts appear after activity is tracked." />
            )}
          </div>
        </div>
        <PreviewFooter remaining={moreCount(rankingItems)} href={fullListHref(tab, data?.period.duration)} />
      </Panel>
    </section>
  );
}

function AuditLogsPage({ data }: { data: AnalyticsData | null }) {
  const heatmap = React.useMemo(() => {
    const values = new Map((data?.auditHeatmap ?? []).map((point) => [`${point.dow}-${point.hour}`, point.value]));
    const max = Math.max(...(data?.auditHeatmap ?? []).map((point) => point.value), 1);
    return weekdays.map((day, dow) => ({
      day,
      hours: Array.from({ length: 24 }, (_, hour) => {
        const value = values.get(`${dow}-${hour}`) ?? 0;
        return { hour, value, intensity: value > 0 ? Math.max(0.14, value / max) : 0 };
      }),
    }));
  }, [data?.auditHeatmap]);

  return (
    <section className="admin-console-grid">
      <Panel title="Audit Heatmap" kicker="7 days" icon={ScrollText} className="is-wide">
        <div className="admin-console-heatmap" aria-label="Audit activity heatmap">
          <div className="admin-console-heatmap-hours" aria-hidden="true">
            {Array.from({ length: 24 }, (_, hour) => (
              <span key={hour}>{hour % 6 === 0 ? `${String(hour).padStart(2, "0")}:00` : ""}</span>
            ))}
          </div>
          {heatmap.map((row) => (
            <div className="admin-console-heatmap-row" key={row.day}>
              <strong>{row.day}</strong>
              {row.hours.map((cell) => (
                <span
                  key={`${row.day}-${cell.hour}`}
                  title={`${row.day} ${String(cell.hour).padStart(2, "0")}:00 · ${cell.value} events`}
                  style={{ opacity: cell.value ? 1 : 0.38, background: `rgba(229, 9, 20, ${cell.intensity})` }}
                />
              ))}
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Audit Logs" kicker="Governance" icon={ListOrdered} className="is-wide">
        <PaginatedTable
          rows={data?.auditLogs ?? []}
          getRowKey={(log) => log.id}
          emptyLabel="No audit activity tracked yet."
          columns={[
            { key: "time", header: "Time", render: (log) => log.happened_at },
            { key: "actor", header: "Actor", render: (log) => log.actor },
            { key: "event", header: "Event", render: (log) => log.event_type },
            { key: "target", header: "Target", render: (log) => <><strong>{log.target}</strong><span>{formatMediaType(log.media_type)}</span></> },
            { key: "category", header: "Category", render: (log) => log.category },
            { key: "path", header: "Path", render: (log) => log.pathname },
          ]}
          renderActions={(log) => [
            { label: "View details", icon: Eye, onClick: () => acknowledgeAction(`View ${log.event_type}`) },
            { label: "Export audit row", icon: Download, onClick: () => downloadReport("audit", "csv") },
          ]}
        />
      </Panel>
    </section>
  );
}

function ReportPreview({ type }: { type: ReportType }) {
  const sample = reportSamples[type];

  return (
    <article className="admin-console-report-preview">
      <header>
        <span>JokaFlix</span>
        <small>Sample document</small>
      </header>
      <h3>{sample.title}</h3>
      <p>{sample.audience}</p>
      <div className="admin-console-report-preview-grid">
        <section>
          <strong>Sections</strong>
          {sample.sections.map((section) => (
            <span key={section}>{section}</span>
          ))}
        </section>
        <section>
          <strong>Highlights</strong>
          {sample.highlights.map((highlight) => (
            <span key={highlight}>{highlight}</span>
          ))}
        </section>
      </div>
      <footer>
        <b>Prepared for JokaFlix leadership</b>
        <small>PDF export includes branded header, timestamp, and selected dataset.</small>
      </footer>
    </article>
  );
}

function ReportTemplateCard({
  template,
  onUse,
  onDelete,
}: {
  template: ReportTemplateItem;
  onUse: () => void;
  onDelete: () => void;
}) {
  const sections = parseJsonArray(template.sections).slice(0, 4);
  const fields = parseJsonArray(template.fields).slice(0, 3);
  const durationLabel = durationOptions.find((option) => option.id === template.duration)?.label || template.duration;

  return (
    <article className="admin-console-template-card">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button type="button" className="admin-console-template-card-menu-trigger" aria-label={`Open actions for ${template.name}`}>
            <MoreVertical />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="admin-console-template-card-menu" align="end" sideOffset={8}>
          <DropdownMenuItem className="admin-console-template-card-menu-item" onClick={onUse}>
            <Eye />
            Use
          </DropdownMenuItem>
          <DropdownMenuItem
            className="admin-console-template-card-menu-item"
            onClick={() => downloadReport(template.report_type, "pdf", { duration: template.duration, sections: parseJsonArray(template.sections), templateId: template.id })}
          >
            <FileText />
            PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            className="admin-console-template-card-menu-item"
            onClick={() => downloadReport(template.report_type, "csv", { duration: template.duration, sections: parseJsonArray(template.sections), templateId: template.id })}
          >
            <Download />
            CSV
          </DropdownMenuItem>
          <DropdownMenuSeparator className="admin-console-account-separator" />
          <DropdownMenuItem className="admin-console-template-card-menu-item is-danger" onClick={onDelete}>
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <div className="admin-console-template-card-body">
        <div>
          <span>{templateTypeLabel(template.report_type)}</span>
          <small>{durationLabel}</small>
        </div>
        <strong>{template.name}</strong>
        <p>{template.description}</p>
        <div className="admin-console-template-card-tags">
          {(sections.length ? sections : fields).map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <footer>
          <small>Updated {template.updated_at}</small>
        </footer>
      </div>
    </article>
  );
}

function ReportsPage({ data }: { data: AnalyticsData | null }) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedReport, setSelectedReport] = React.useState<ReportType>("executive");
  const [selectedFormat, setSelectedFormat] = React.useState<ReportFormat>("pdf");
  const [selectedDuration, setSelectedDuration] = React.useState<AdminDuration>(data?.period.duration || "last_30_days");
  const [selectedSections, setSelectedSections] = React.useState<string[]>(["summary", "audience", "content", "activity"]);
  const [selectedTemplateId, setSelectedTemplateId] = React.useState("");
  const [templateName, setTemplateName] = React.useState("JokaFlix Investor Operating Report");
  const [templateDescription, setTemplateDescription] = React.useState("Premium investor-ready report with branded cover, KPI scorecards, charts, recommendations, and appendix tables.");
  const [templatePrompt, setTemplatePrompt] = React.useState("Create a beautiful board-level report document with a premium cover, executive narrative, KPI cards, visual chart sections, management recommendations, and polished export rules.");
  const [templateFields, setTemplateFields] = React.useState("active users, clicks today, top movies, best categories, user growth, content demand, management recommendations");
  const [localTemplates, setLocalTemplates] = React.useState<ReportTemplateItem[]>([]);
  const [deletedTemplateIds, setDeletedTemplateIds] = React.useState<Set<string>>(() => new Set());
  const [confirmTemplate, setConfirmTemplate] = React.useState<ReportTemplateItem | null>(null);
  const [visibleConfirmTemplate, setVisibleConfirmTemplate] = React.useState<ReportTemplateItem | null>(null);
  const [savingTemplate, setSavingTemplate] = React.useState(false);
  const [tab, setTab] = React.useState<"overview" | "table">(() => readQueryOption("reportsTab", "overview", ["overview", "table"]));
  const reportModalPresent = useAnimatedPresence(modalOpen);
  const confirmTemplatePresent = useAnimatedPresence(Boolean(confirmTemplate));
  const setReportsTab = (nextTab: "overview" | "table") => {
    setTab(nextTab);
    updateDashboardQuery({ reportsTab: nextTab === "overview" ? null : nextTab });
  };
  const selectedOption = reportOptions.find((report) => report.id === selectedReport) ?? reportOptions[0];
  const reportHistory = data?.reportHistory ?? [];
  const reportTemplates = React.useMemo(() => {
    const merged = [...localTemplates, ...(data?.reportTemplates ?? [])].filter((template) => !deletedTemplateIds.has(template.id));
    const seen = new Set<string>();
    return merged.filter((template) => {
      if (seen.has(template.id)) return false;
      seen.add(template.id);
      return true;
    });
  }, [data?.reportTemplates, deletedTemplateIds, localTemplates]);
  const selectedTemplate = reportTemplates.find((template) => template.id === selectedTemplateId);
  const pdfCount = reportHistory.filter((report) => report.format === "pdf").length;
  const csvCount = reportHistory.filter((report) => report.format === "csv").length;

  React.useEffect(() => {
    if (data?.period.duration) setSelectedDuration(data.period.duration);
  }, [data?.period.duration]);

  React.useEffect(() => {
    if (confirmTemplate) setVisibleConfirmTemplate(confirmTemplate);
  }, [confirmTemplate]);

  React.useEffect(() => {
    if (!confirmTemplatePresent) setVisibleConfirmTemplate(null);
  }, [confirmTemplatePresent]);

  const createReport = () => {
    downloadReport(selectedTemplate ? selectedTemplate.report_type : selectedReport, selectedFormat, {
      duration: selectedTemplate ? selectedTemplate.duration : selectedDuration,
      sections: selectedTemplate ? parseJsonArray(selectedTemplate.sections, selectedSections) : selectedSections,
      templateId: selectedTemplate?.id || null,
    });
    setModalOpen(false);
  };

  const applyTemplate = (template: ReportTemplateItem) => {
    setSelectedTemplateId(template.id);
    setSelectedReport(template.report_type);
    setSelectedDuration(template.duration);
    setSelectedSections(parseJsonArray(template.sections, selectedSections));
    setSelectedFormat("pdf");
    setModalOpen(true);
  };

  const toggleSection = (section: string) => {
    setSelectedSections((current) => (
      current.includes(section)
        ? current.filter((item) => item !== section)
        : [...current, section]
    ));
  };

  const saveTemplate = async () => {
    if (savingTemplate) return;
    setSavingTemplate(true);
    try {
      const response = await fetch("/api/admin/report-templates", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: templateName,
          description: templateDescription,
          reportType: selectedReport,
          duration: selectedDuration,
          sections: selectedSections,
          fields: templateFields.split(",").map((field) => field.trim()).filter(Boolean),
          prompt: templatePrompt,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Unable to save template");
      const saved = payload.template as ReportTemplateItem;
      setLocalTemplates((current) => [saved, ...current]);
      setSelectedTemplateId(saved.id);
      setModalOpen(false);
    } catch (error) {
      acknowledgeAction(error instanceof Error ? error.message : "Unable to save template");
    } finally {
      setSavingTemplate(false);
    }
  };

  const deleteTemplate = async (template: ReportTemplateItem) => {
    try {
      const response = await fetch(`/api/admin/report-templates?id=${encodeURIComponent(template.id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Unable to delete template");
      setDeletedTemplateIds((current) => new Set(current).add(template.id));
      setLocalTemplates((current) => current.filter((item) => item.id !== template.id));
      if (selectedTemplateId === template.id) setSelectedTemplateId("");
      setConfirmTemplate(null);
    } catch (error) {
      acknowledgeAction(error instanceof Error ? error.message : "Unable to delete template");
    }
  };

  return (
    <>
      <div className="admin-console-tabs movies-tabs is-page-tabs" role="tablist" aria-label="Report page views">
        <button type="button" role="tab" aria-selected={tab === "overview"} className={tab === "overview" ? "movies-tab is-active" : "movies-tab"} onClick={() => setReportsTab("overview")}>
          <BarChart3 />
          Overview
        </button>
        <button type="button" role="tab" aria-selected={tab === "table"} className={tab === "table" ? "movies-tab is-active" : "movies-tab"} onClick={() => setReportsTab("table")}>
          <FileText />
          Table
        </button>
      </div>

      {tab === "overview" ? (
        <>
          <section className="admin-console-stat-grid">
            <StatCard label="Reports generated" value={formatNumber(reportHistory.length)} detail="stored export history" icon={FileText} />
            <StatCard label="PDF exports" value={formatNumber(pdfCount)} detail="branded documents" icon={Download} />
            <StatCard label="CSV exports" value={formatNumber(csvCount)} detail="raw analysis files" icon={ListOrdered} />
            <StatCard label="Templates" value={formatNumber(reportTemplates.length)} detail="saved reusable layouts" icon={Sparkles} />
          </section>
          <section className="admin-console-grid">
            <Panel title="AI Template Library" kicker="Reusable documents" icon={Sparkles} className="is-wide">
              <div className="admin-console-template-library-head">
                <div>
                  <strong>Reusable report documents</strong>
                  <p>Use premium AI templates for investor-ready PDF exports and management reporting.</p>
                </div>
                <button type="button" className="admin-console-new-report" onClick={() => setModalOpen(true)}>
                  <Plus />
                  New Report
                </button>
              </div>
              {reportTemplates.length ? (
                <div className="admin-console-template-grid">
                  {reportTemplates.map((template) => (
                    <ReportTemplateCard key={template.id} template={template} onUse={() => applyTemplate(template)} onDelete={() => setConfirmTemplate(template)} />
                  ))}
                </div>
              ) : (
                <div className="admin-console-empty-template-library">
                  <Sparkles />
                  <strong>No AI templates yet</strong>
                  <p>Create a reusable report template and it will appear here as a visual document card.</p>
                  <button type="button" className="admin-console-new-report" onClick={() => setModalOpen(true)}>
                    <Plus />
                    New Report
                  </button>
                </div>
              )}
            </Panel>
          </section>
        </>
      ) : (
        <section className="admin-console-grid">
          <Panel title="Generated Reports" kicker="History" icon={FileText} className="is-wide">
            <PaginatedTable
              rows={reportHistory}
              getRowKey={(report) => report.id}
              emptyLabel="No reports have been generated yet."
              columns={[
                { key: "title", header: "Report", render: (report) => <><strong>{report.title}</strong><span>{report.report_type}</span></> },
                { key: "format", header: "Format", render: (report) => report.format.toUpperCase() },
                { key: "rows", header: "Rows", render: (report) => formatNumber(report.row_count) },
                { key: "duration", header: "Duration", render: (report) => durationOptions.find((option) => option.id === report.duration)?.label || report.duration },
                { key: "generatedBy", header: "Generated by", render: (report) => report.generated_by },
                { key: "timestamp", header: "Timestamp", render: (report) => report.generated_at },
              ]}
              renderActions={(report) => [
                { label: "View details", icon: Eye, onClick: () => acknowledgeAction(`View ${report.title}`) },
                { label: "Download PDF", icon: FileText, onClick: () => downloadReport(report.report_type as ReportType, "pdf", { duration: report.duration, sections: parseJsonArray(report.sections) }) },
                { label: "Download CSV", icon: Download, onClick: () => downloadReport(report.report_type as ReportType, "csv", { duration: report.duration, sections: parseJsonArray(report.sections) }) },
              ]}
            />
          </Panel>
        </section>
      )}

      {reportModalPresent && (
        <div className={`admin-console-modal-layer ${modalOpen ? "is-open" : "is-closing"}`} role="presentation">
          <button type="button" className="admin-console-modal-backdrop" onClick={() => setModalOpen(false)} aria-label="Close report creator" />
          <section className="admin-console-modal" role="dialog" aria-modal="true" aria-labelledby="admin-report-modal-title">
            <header>
              <div>
                <p className="section-kicker">Create</p>
                <h2 id="admin-report-modal-title">New Report</h2>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close report creator">
                <X />
              </button>
            </header>
            <div className="admin-console-modal-grid">
              <div className="admin-console-report-form">
                <AdminDropdown
                  label="Reuse template"
                  value={selectedTemplateId}
                  options={[
                    { id: "", label: "Start from scratch" },
                    ...reportTemplates.map((template) => ({ id: template.id, label: template.name })),
                  ]}
                  onChange={setSelectedTemplateId}
                />
                <AdminDropdown
                  label="Report type"
                  value={selectedTemplate?.report_type || selectedReport}
                  options={reportTypeDropdownOptions}
                  onChange={setSelectedReport}
                  disabled={Boolean(selectedTemplate)}
                />
                <AdminDropdown
                  label="Duration"
                  value={selectedTemplate?.duration || selectedDuration}
                  options={durationOptions}
                  onChange={setSelectedDuration}
                  disabled={Boolean(selectedTemplate)}
                />
                <AdminDropdown label="Export format" value={selectedFormat} options={reportFormatOptions} onChange={setSelectedFormat} />
                <div className="admin-console-report-selection">
                  <strong>{selectedTemplate?.name || selectedOption.label}</strong>
                  <p>{selectedTemplate?.description || selectedOption.description}</p>
                </div>
                {!selectedTemplate && (
                  <>
                    <div className="admin-console-report-checks">
                      <span>Report sections</span>
                      {reportSectionOptions.map((section) => (
                        <label key={section.id}>
                          <input type="checkbox" checked={selectedSections.includes(section.id)} onChange={() => toggleSection(section.id)} />
                          {section.label}
                        </label>
                      ))}
                    </div>
                    <label>
                      <span>Template name</span>
                      <input value={templateName} onChange={(event) => setTemplateName(event.target.value)} />
                    </label>
                    <label>
                      <span>Description</span>
                      <textarea value={templateDescription} onChange={(event) => setTemplateDescription(event.target.value)} />
                    </label>
                    <label>
                      <span>Fields to emphasize</span>
                      <input value={templateFields} onChange={(event) => setTemplateFields(event.target.value)} />
                    </label>
                    <label>
                      <span>AI template instruction</span>
                      <textarea value={templatePrompt} onChange={(event) => setTemplatePrompt(event.target.value)} />
                    </label>
                    <button type="button" className="admin-console-template-save" onClick={() => void saveTemplate()} disabled={savingTemplate || !selectedSections.length}>
                      <Sparkles />
                      {savingTemplate ? "Creating template..." : "Create reusable AI template"}
                    </button>
                  </>
                )}
                <button type="button" className="admin-console-create-report" onClick={createReport}>
                  {selectedFormat === "pdf" ? <FileText /> : <Download />}
                  Create report
                </button>
              </div>
              {selectedTemplate ? (
                <article className="admin-console-report-preview">
                  <header>
                    <span>JokaFlix</span>
                    <small>Saved template</small>
                  </header>
                  <h3>{selectedTemplate.name}</h3>
                  <p>{selectedTemplate.description}</p>
                  <div className="admin-console-template-body">
                    {selectedTemplate.template_body.split("\n").slice(0, 18).map((line, index) => (
                      <p key={`${line}-${index}`}>{line || " "}</p>
                    ))}
                  </div>
                  <footer>
                    <b>Reusable report template</b>
                    <small>Updated {selectedTemplate.updated_at}</small>
                  </footer>
                </article>
              ) : (
                <ReportPreview type={selectedReport} />
              )}
            </div>
          </section>
        </div>
      )}

      {confirmTemplatePresent && visibleConfirmTemplate && (
        <div className={`admin-console-modal-layer ${confirmTemplate ? "is-open" : "is-closing"}`} role="presentation">
          <button type="button" className="admin-console-modal-backdrop" onClick={() => setConfirmTemplate(null)} aria-label="Cancel template deletion" />
          <section className="admin-console-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="admin-template-delete-title">
            <header>
              <span>
                <Trash2 />
              </span>
              <div>
                <p className="section-kicker">Delete template</p>
                <h2 id="admin-template-delete-title">Remove this report template?</h2>
              </div>
            </header>
            <p>Deleting <strong>{visibleConfirmTemplate.name}</strong> removes it from reusable report templates. Generated report history will remain untouched.</p>
            <footer>
              <button type="button" onClick={() => setConfirmTemplate(null)}>Cancel</button>
              <button type="button" className="is-danger" onClick={() => void deleteTemplate(visibleConfirmTemplate)}>
                <Trash2 />
                Delete template
              </button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

function FormattedMessage({ content }: { content: string }) {
  const parseInline = (value: string, keyPrefix: string): React.ReactNode[] => {
    const nodes: React.ReactNode[] = [];
    const pattern = /(<u>.*?<\/u>|\+\+.*?\+\+|\*\*.*?\*\*|__.*?__|\*[^*\n]+\*|_[^_\n]+_)/g;
    let cursor = 0;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(value)) !== null) {
      if (match.index > cursor) nodes.push(value.slice(cursor, match.index));
      const token = match[0];
      const key = `${keyPrefix}-${match.index}`;

      if (token.startsWith("**") && token.endsWith("**")) {
        nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
      } else if (token.startsWith("__") && token.endsWith("__")) {
        nodes.push(<u key={key}>{token.slice(2, -2)}</u>);
      } else if (token.startsWith("++") && token.endsWith("++")) {
        nodes.push(<u key={key}>{token.slice(2, -2)}</u>);
      } else if (token.startsWith("<u>") && token.endsWith("</u>")) {
        nodes.push(<u key={key}>{token.slice(3, -4)}</u>);
      } else if ((token.startsWith("*") && token.endsWith("*")) || (token.startsWith("_") && token.endsWith("_"))) {
        nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
      } else {
        nodes.push(token);
      }

      cursor = match.index + token.length;
    }

    if (cursor < value.length) nodes.push(value.slice(cursor));
    return nodes;
  };

  const normalizeTableRow = (line: string) =>
    line
      .trim()
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());

  const blocks = content
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (!blocks.length) return null;

  return (
    <>
      {blocks.map((block, index) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        const looksLikeTable = lines.length >= 2 && lines.every((line) => line.includes("|")) && /^:?-{3,}:?$/.test(normalizeTableRow(lines[1])[0] || "");

        if (looksLikeTable) {
          const [headLine, , ...bodyLines] = lines;
          const headers = normalizeTableRow(headLine);
          const rows = bodyLines.map(normalizeTableRow);
          return (
            <div className="admin-console-chat-table-wrap" key={`table-${index}`}>
              <table className="admin-console-chat-table">
                <thead>
                  <tr>
                    {headers.map((header, cellIndex) => (
                      <th key={`${header}-${cellIndex}`}>{parseInline(header, `th-${index}-${cellIndex}`)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, rowIndex) => (
                    <tr key={`row-${index}-${rowIndex}`}>
                      {headers.map((_, cellIndex) => (
                        <td key={`cell-${index}-${rowIndex}-${cellIndex}`}>
                          {parseInline(row[cellIndex] || "", `td-${index}-${rowIndex}-${cellIndex}`)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }

        if (lines.every((line) => line.startsWith("- ") || line.startsWith("* "))) {
          return (
            <ul key={`list-${index}`}>
              {lines.map((line, lineIndex) => (
                <li key={`${line}-${lineIndex}`}>{parseInline(line.slice(2), `li-${index}-${lineIndex}`)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`paragraph-${index}`}>
            {parseInline(lines.join(" "), `p-${index}`)}
          </p>
        );
      })}
    </>
  );
}

function TypingDots() {
  return (
    <span className="admin-console-typing" aria-label="AI Manager is typing">
      <span className="admin-console-typing-orb is-red" />
      <span className="admin-console-typing-orb is-white" />
    </span>
  );
}

function renderCampaignInline(text: string, keyPrefix: string): React.ReactNode[] {
  const tokens = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|<u>[\s\S]*?<\/u>)/g).filter(Boolean);
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;
    if (token.startsWith("**") && token.endsWith("**")) return <strong key={key}>{token.slice(2, -2)}</strong>;
    if (token.startsWith("*") && token.endsWith("*")) return <em key={key}>{token.slice(1, -1)}</em>;
    if (token.startsWith("<u>") && token.endsWith("</u>")) return <u key={key}>{token.slice(3, -4)}</u>;
    return <React.Fragment key={key}>{token}</React.Fragment>;
  });
}

function CampaignFormattedMessage({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  if (!blocks.length) return null;

  return (
    <div className="campaign-formatted-message">
      {blocks.map((block, blockIndex) => {
        const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
        if (lines.every((line) => line.startsWith("- "))) {
          return (
            <ul key={`campaign-list-${blockIndex}`}>
              {lines.map((line, lineIndex) => (
                <li key={`campaign-list-${blockIndex}-${lineIndex}`}>{renderCampaignInline(line.slice(2), `campaign-li-${blockIndex}-${lineIndex}`)}</li>
              ))}
            </ul>
          );
        }

        return <p key={`campaign-copy-${blockIndex}`}>{renderCampaignInline(lines.join(" "), `campaign-p-${blockIndex}`)}</p>;
      })}
    </div>
  );
}

function tmdbCampaignImage(path?: string | null, size = "w780") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : "";
}

async function fetchCampaignCover(item: CampaignPosterItem) {
  if (item.backdrop_path || item.poster_path) return item.backdrop_path || item.poster_path || "";
  if (!item.tmdb_id) return "";

  const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
  if (!apiKey) return "";

  const mediaType = item.media_type === "tv" ? "tv" : "movie";
  const response = await fetch(`https://api.themoviedb.org/3/${mediaType}/${item.tmdb_id}?api_key=${apiKey}`, { cache: "force-cache" });
  if (!response.ok) return "";
  const details = (await response.json().catch(() => null)) as { backdrop_path?: string | null; poster_path?: string | null } | null;
  return details?.backdrop_path || details?.poster_path || "";
}

function CampaignPage({ data }: { data: AnalyticsData | null }) {
  const [templateId, setTemplateId] = React.useState<CampaignTemplateId>("weekly");
  const [posterCriteria, setPosterCriteria] = React.useState<CampaignPosterCriteria>("trending");
  const [posterLayout, setPosterLayout] = React.useState<CampaignPosterLayout>("strip");
  const [posterCount, setPosterCount] = React.useState(5);
  const [subject, setSubject] = React.useState(campaignTemplates[0].subject);
  const [body, setBody] = React.useState(campaignTemplates[0].body);
  const [cta, setCta] = React.useState(campaignTemplates[0].cta);
  const [aiOpen, setAiOpen] = React.useState(false);
  const [aiPrompt, setAiPrompt] = React.useState("");
  const [aiResult, setAiResult] = React.useState("");
  const [aiLoading, setAiLoading] = React.useState(false);
  const [aiCopied, setAiCopied] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [campaignSending, setCampaignSending] = React.useState(false);
  const [recipientMode, setRecipientMode] = React.useState<CampaignRecipientMode>("all");
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);
  const [posterCoverMap, setPosterCoverMap] = React.useState<Record<string, string>>({});
  const aiModalPresent = useAnimatedPresence(aiOpen);
  const previewModalPresent = useAnimatedPresence(previewOpen);

  const template = campaignTemplates.find((item) => item.id === templateId) || campaignTemplates[0];
  const posterSources = React.useMemo<CampaignPosterItem[]>(() => {
    const topMovies = (data?.topMovies || []).map((item) => ({ ...item, type: "Movie" }));
    const topSeries = (data?.topSeries || []).map((item) => ({ ...item, type: "Series" }));

    if (posterCriteria === "top_movies") return topMovies;
    if (posterCriteria === "top_series") return topSeries;
    if (posterCriteria === "personalized") return [...topMovies.slice(0, 3), ...topSeries.slice(0, 3)];
    return [...topMovies, ...topSeries].sort((a, b) => b.clicks - a.clicks);
  }, [data?.topMovies, data?.topSeries, posterCriteria]);
  const posterSourceKey = posterSources.map((item) => `${item.media_type}-${item.tmdb_id || item.title}`).join("|");
  const posterItems = posterSources.slice(0, posterCount).map((item) => {
    const key = `${item.media_type}-${item.tmdb_id || item.title}`;
    const imagePath = posterCoverMap[key] || item.backdrop_path || item.poster_path || "";
    return { ...item, imageUrl: tmdbCampaignImage(imagePath) };
  });
  const campaignHeroImage = posterItems.find((item) => item.imageUrl)?.imageUrl;
  const posterSummary = posterItems.length
    ? posterItems.map((item) => item.title).join(", ")
    : "fresh trending movies and series";
  const selectedUsers = (data?.userDirectory || []).filter((user) => selectedUserIds.includes(user.id));
  const recipientSummary = recipientMode === "all"
    ? `All members (${formatNumber(data?.summary.totalUsers || data?.userDirectory?.length || 0)})`
    : selectedUsers.length
      ? `${selectedUsers.length} selected member${selectedUsers.length === 1 ? "" : "s"}`
      : "No selected members yet";

  React.useEffect(() => {
    let cancelled = false;
    const visibleItems = posterSources.slice(0, posterCount);
    if (!visibleItems.length) return;

    void Promise.all(visibleItems.map(async (item) => {
      const key = `${item.media_type}-${item.tmdb_id || item.title}`;
      if (posterCoverMap[key]) return null;
      const cover = await fetchCampaignCover(item).catch(() => "");
      return cover ? [key, cover] as const : null;
    })).then((entries) => {
      if (cancelled) return;
      const nextEntries = entries.filter((entry): entry is readonly [string, string] => Boolean(entry));
      if (!nextEntries.length) return;
      setPosterCoverMap((current) => ({ ...current, ...Object.fromEntries(nextEntries) }));
    });

    return () => {
      cancelled = true;
    };
  }, [posterCount, posterSourceKey]);

  const applyTemplate = (nextTemplateId: CampaignTemplateId) => {
    const nextTemplate = campaignTemplates.find((item) => item.id === nextTemplateId) || campaignTemplates[0];
    setTemplateId(nextTemplate.id);
    setSubject(nextTemplate.subject);
    setBody(nextTemplate.body);
    setCta(nextTemplate.cta);
  };

  const buildAiInstruction = () => {
    const instruction = aiPrompt.trim();
    return [
      "Write a commercial JokaFlix campaign email message for subscribers.",
      `Template tone: ${template.tone}.`,
      `Current subject: ${subject}.`,
      `CTA: ${cta}.`,
      `Feature these titles: ${posterSummary}.`,
      instruction ? `Admin prompt: ${instruction}.` : "Admin prompt: make it clear, persuasive, and easy to paste into the campaign message field.",
      "You may use **bold headings**, *italic title names*, <u>underlined calls to action</u>, blank-line paragraphs, and - bullet lists.",
      "Return only the email body copy, not a subject line.",
    ].join(" ");
  };

  const composeWithAi = async () => {
    if (aiLoading) return;
    setAiLoading(true);
    setAiResult("");
    setAiCopied(false);
    try {
      const response = await fetch("/api/admin/ai", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: buildAiInstruction(), duration: data?.period.duration }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "AI composer failed to generate content.");
      setAiResult(String(payload?.answer || "").trim());
    } catch (error) {
      setAiResult(error instanceof Error ? error.message : "AI composer failed to generate content.");
    } finally {
      setAiLoading(false);
    }
  };

  const copyAiResult = async () => {
    if (!aiResult.trim()) return;
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(aiResult);
    }
    setAiCopied(true);
    toast.success("Copied successfully");
    window.setTimeout(() => setAiCopied(false), 1600);
  };

  const sendCampaign = async () => {
    if (campaignSending) return;
    if (recipientMode === "selected" && selectedUserIds.length === 0) {
      toast.error("Select at least one member before sending");
      return;
    }

    setCampaignSending(true);
    try {
      const response = await fetch("/api/admin/campaign/send", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          cta,
          recipientMode,
          selectedUserIds,
          posters: posterItems,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Campaign could not be sent");
      toast.success(`Campaign sent to ${formatNumber(payload?.sent)} member${Number(payload?.sent) === 1 ? "" : "s"}`);
      setPreviewOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Campaign could not be sent");
    } finally {
      setCampaignSending(false);
    }
  };

  return (
    <section className="admin-console-grid campaign-console">
      <Panel
        title="Campaign composer"
        kicker="Email campaign"
        className="is-wide"
        action={(
          <Button className="admin-refresh-button campaign-heading-action" type="button" onClick={() => setAiOpen(true)}>
            <Sparkles /> Compose with AI
          </Button>
        )}
      >
        <div className="campaign-builder">
          <div className="campaign-form-grid">
            <AdminDropdown label="Template" value={templateId} options={campaignTemplates.map(({ id, label }) => ({ id, label }))} onChange={applyTemplate} />
            <AdminDropdown label="Poster criteria" value={posterCriteria} options={campaignPosterCriteriaOptions} onChange={setPosterCriteria} />
            <AdminDropdown label="Poster layout" value={posterLayout} options={campaignPosterLayouts} onChange={setPosterLayout} />
            <label className="campaign-field">
              <span>Poster count</span>
              <input type="number" min={3} max={10} value={posterCount} onChange={(event) => setPosterCount(Math.min(10, Math.max(3, Number(event.target.value) || 5)))} />
            </label>
          </div>

          <label className="campaign-field">
            <span>Subject</span>
            <input value={subject} onChange={(event) => setSubject(event.target.value)} />
          </label>

          <label className="campaign-field">
            <span>Campaign message</span>
            <textarea value={body} onChange={(event) => setBody(event.target.value)} rows={6} />
          </label>

          <div className="campaign-form-grid">
            <label className="campaign-field">
              <span>CTA label</span>
              <input value={cta} onChange={(event) => setCta(event.target.value)} />
            </label>
            <AdminDropdown
              label="Audience"
              value={recipientMode}
              options={[
                { id: "all", label: "All members" },
                { id: "selected", label: "Selected members" },
              ]}
              onChange={setRecipientMode}
            />
          </div>

          {recipientMode === "selected" && (
            <CampaignUserSelect
              users={data?.userDirectory || []}
              selectedIds={selectedUserIds}
              onChange={setSelectedUserIds}
            />
          )}
          <p className="campaign-recipient-summary">Recipients: {recipientSummary}</p>

          <div className="campaign-actions">
            <Button className="admin-refresh-button" type="button" onClick={() => setPreviewOpen(true)}>
              <Eye /> Preview
            </Button>
            <Button
              className={`admin-refresh-button ${campaignSending ? "is-loading" : ""}`}
              type="button"
              onClick={sendCampaign}
              disabled={campaignSending || (recipientMode === "selected" && selectedUserIds.length === 0)}
            >
              {campaignSending ? <span className="button-loading-spinner" aria-label="Sending campaign" /> : <><Send /> Send</>}
            </Button>
          </div>
        </div>
      </Panel>

      {aiModalPresent && (
        <div className={`admin-console-modal-layer ${aiOpen ? "is-open" : "is-closing"}`} role="presentation">
          <button type="button" className="admin-console-modal-backdrop" onClick={() => setAiOpen(false)} aria-label="Close AI composer" />
          <section className="admin-console-modal campaign-ai-modal" role="dialog" aria-modal="true" aria-labelledby="campaign-ai-modal-title">
            <header>
              <div>
                <p className="section-kicker">AI composer</p>
                <h2 id="campaign-ai-modal-title">Compose with AI</h2>
              </div>
              <button type="button" onClick={() => setAiOpen(false)} aria-label="Close AI composer">
                <X />
              </button>
            </header>
            <div className="campaign-modal-stack">
              <label className="campaign-field">
                <span>Prompt</span>
                <textarea
                  value={aiPrompt}
                  onChange={(event) => setAiPrompt(event.target.value)}
                  placeholder="Example: write a short urgent weekend email for people who love fantasy series."
                  rows={5}
                />
              </label>
              <Button className={`admin-refresh-button ${aiLoading ? "is-loading" : ""}`} type="button" onClick={composeWithAi} disabled={aiLoading}>
                {aiLoading ? <span className="button-loading-spinner" aria-label="Composing" /> : <><Sparkles /> Generate message</>}
              </Button>
              <div className="campaign-ai-result">
                <div>
                  <span>AI result</span>
                  <button
                    type="button"
                    className="campaign-ai-copy-button"
                    onClick={copyAiResult}
                    disabled={!aiResult.trim()}
                    aria-label={aiCopied ? "Copied campaign message" : "Copy campaign message"}
                    title={aiCopied ? "Copied" : "Copy"}
                  >
                    {aiCopied ? <Check /> : <Clipboard />}
                  </button>
                </div>
                <p>{aiResult || "The generated campaign message will appear here. Copy it, close this modal, and paste it into Campaign message if you want to use it."}</p>
              </div>
            </div>
          </section>
        </div>
      )}

      {previewModalPresent && (
        <div className={`admin-console-modal-layer ${previewOpen ? "is-open" : "is-closing"}`} role="presentation">
          <button type="button" className="admin-console-modal-backdrop" onClick={() => setPreviewOpen(false)} aria-label="Close campaign preview" />
          <section className="admin-console-modal campaign-preview-modal" role="dialog" aria-modal="true" aria-labelledby="campaign-preview-modal-title">
            <header>
              <div>
                <p className="section-kicker">Send preview</p>
                <h2 id="campaign-preview-modal-title">Preview campaign email</h2>
              </div>
              <button type="button" onClick={() => setPreviewOpen(false)} aria-label="Close campaign preview">
                <X />
              </button>
            </header>
            <div className="campaign-modal-stack">
              <p className="campaign-recipient-summary">Recipients: {recipientSummary}</p>
              <div className={`campaign-preview is-${posterLayout}`}>
                <div
                  className="campaign-preview-hero"
                  style={campaignHeroImage ? { backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.94), rgba(0,0,0,0.62)), url("${campaignHeroImage}")` } : undefined}
                >
                  <div className="campaign-preview-brand">JokaFlix</div>
                  <h3>{subject}</h3>
                  <CampaignFormattedMessage text={body} />
                  <button type="button">{cta}</button>
                </div>
                <div className="campaign-preview-posters">
                  {posterItems.length ? posterItems.map((item, index) => (
                    <article
                      className={item.imageUrl ? "has-cover" : ""}
                      key={`modal-${item.title}-${index}`}
                      style={item.imageUrl ? { backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.88)), url("${item.imageUrl}")` } : undefined}
                    >
                      <strong>{item.title}</strong>
                    </article>
                  )) : (
                    <article>
                      <strong>Trending picks</strong>
                      <span>Campaign posters appear after analytics data is available.</span>
                    </article>
                  )}
                </div>
              </div>
              <div className="campaign-modal-actions">
                <Button type="button" variant="ghost" onClick={() => setPreviewOpen(false)}>Close preview</Button>
                <Button
                  className={`admin-refresh-button ${campaignSending ? "is-loading" : ""}`}
                  type="button"
                  onClick={sendCampaign}
                  disabled={campaignSending || (recipientMode === "selected" && selectedUserIds.length === 0)}
                >
                  {campaignSending ? <span className="button-loading-spinner" aria-label="Sending campaign" /> : <><Send /> Send campaign</>}
                </Button>
              </div>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

function AIManagerPage({ data }: { data: AnalyticsData | null }) {
  const [question, setQuestion] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "intro",
      role: "assistant",
      content: "Ask me about JokaFlix analytics, online users, movie clicks, reports, leaderboards, content categories, or platform health.",
    },
  ]);
  const [loading, setLoading] = React.useState(false);

  const askAI = async () => {
    const trimmed = question.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", content: trimmed };
    const assistantId = `assistant-${Date.now()}`;
    setMessages((current) => [...current, userMessage, { id: assistantId, role: "assistant", content: "", pending: true }]);
    setQuestion("");
    setLoading(true);
    try {
      const response = await fetch("/api/admin/ai", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed, duration: data?.period.duration, stream: true }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload?.error || "Unable to ask AI Manager");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("AI Manager did not return a readable stream.");
      const decoder = new TextDecoder();
      let nextContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        nextContent += decoder.decode(value, { stream: true });
        setMessages((current) => current.map((message) => (
          message.id === assistantId ? { ...message, content: nextContent, pending: true } : message
        )));
      }

      const tail = decoder.decode();
      if (tail) nextContent += tail;
      setMessages((current) => current.map((message) => (
        message.id === assistantId ? { ...message, content: nextContent || "I could not produce an answer from the current dashboard data.", pending: false } : message
      )));
    } catch (askError) {
      setMessages((current) => current.map((message) => (
        message.id === assistantId
          ? { ...message, content: askError instanceof Error ? askError.message : "Unable to ask AI Manager", pending: false }
          : message
      )));
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="admin-console-ai-page" aria-label="AI Manager chat">
      <header className="admin-console-ai-page-header">
        <div>
          <p className="section-kicker">Ask JokaFlix</p>
        </div>
        <div className="admin-console-ai-context">
          <span>{formatNumber(data?.summary.activeToday)} active today</span>
          <span>{formatNumber(data?.summary.clicksToday)} clicks today</span>
          <span>{formatNumber(data?.summary.totalUsers)} total users</span>
        </div>
      </header>

      <div className="admin-console-ai-chat">
        <div className="admin-console-chat-window" aria-live="polite">
          {messages.map((message, index) => (
            <article key={message.id} className={`admin-console-chat-bubble is-${message.role} ${message.pending && !message.content ? "is-thinking" : ""}`}>
              {!(message.pending && !message.content) && <span>{message.role === "assistant" ? "AI Manager" : "You"}</span>}
              {message.pending && !message.content ? <TypingDots /> : <FormattedMessage content={message.content} />}
              {message.pending && message.content && <TypingDots />}
              {index === 0 && message.role === "assistant" && (
                <div className="admin-console-ai-suggestions" aria-label="Suggested prompts">
                  <button type="button" onClick={() => setQuestion("How many users are online right now?")}>Show online users right now.</button>
                  <button type="button" onClick={() => setQuestion("Which movies got the most clicks today?")}>Summarize today&apos;s top movies.</button>
                  <button type="button" onClick={() => setQuestion("Which categories are performing best?")}>Compare the best categories.</button>
                </div>
              )}
            </article>
          ))}
        </div>
        <div className="admin-console-chat-composer">
          <div className="admin-console-chat-composer-field">
            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void askAI();
                }
              }}
              placeholder="Ask anything about JokaFlix analytics..."
            />
            <button type="button" onClick={() => void askAI()} disabled={loading || !question.trim()} aria-label="Send question to AI Manager">
              <Send />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function HealthPage({ data }: { data: AnalyticsData | null }) {
  const activeRatio = data?.summary.totalUsers ? Math.min(100, Math.round(((data.summary.active30Days || 0) / data.summary.totalUsers) * 100)) : 0;
  const movieShare = data?.summary.totalClicks30Days ? Math.round(((data.summary.movieClicks30Days || 0) / data.summary.totalClicks30Days) * 100) : 0;
  const seriesShare = data?.summary.totalClicks30Days ? Math.round(((data.summary.seriesClicks30Days || 0) / data.summary.totalClicks30Days) * 100) : 0;
  const hasWeeklyTrend = hasValues(data?.weeklyTrend, ["clicks", "users"]);
  const hasActiveUsers = hasValues(data?.activeUsers, ["users"]);
  const hasMediaSplit = hasValues(data?.mediaSplit, ["value"]);
  const signalData = [
    { name: "Tracking", value: data?.summary.totalClicks30Days ?? 0 },
    { name: "Users", value: data?.summary.active30Days ?? 0 },
    { name: "Movies", value: data?.summary.moviesTouched30Days ?? 0 },
    { name: "Series", value: data?.summary.seriesTouched30Days ?? 0 },
  ];

  return (
    <section className="admin-console-grid">
      <Panel title="Platform Health" kicker="Operational" icon={Gauge} className="is-wide">
        <div className="admin-console-health-grid">
          <div>
            <span>{activeRatio}%</span>
            <strong>30 day user uptime</strong>
            <i style={{ width: `${activeRatio}%` }} />
          </div>
          <div>
            <span>{movieShare}%</span>
            <strong>movie share</strong>
            <i style={{ width: `${movieShare}%` }} />
          </div>
          <div>
            <span>{seriesShare}%</span>
            <strong>series share</strong>
            <i style={{ width: `${seriesShare}%` }} />
          </div>
        </div>
      </Panel>

      <Panel title="Health Trend" kicker="14 days" icon={LineChartIcon} className="is-wide">
        <ChartBox>
          {hasWeeklyTrend ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data?.weeklyTrend ?? []}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatChartValue} width={38} />
                <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="clicks" fill="#e50914" fillOpacity={0.14} stroke="#e50914" strokeWidth={3} />
                <Line type="monotone" dataKey="users" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Health trend appears after daily usage is tracked." />
          )}
        </ChartBox>
      </Panel>

      <Panel title="Daily User Uptime" kicker="7 days" icon={Users}>
        <ChartBox>
          {hasActiveUsers ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.activeUsers ?? []}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatChartValue} width={36} />
                <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
                <Bar dataKey="users" fill="#22c55e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="User uptime appears after user sessions are tracked." />
          )}
        </ChartBox>
      </Panel>

      <Panel title="Catalog Load" kicker="Signals" icon={Activity}>
        <ChartBox>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={signalData}>
              <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="name" stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} tickFormatter={formatChartLabel} />
              <YAxis stroke="rgba(255,255,255,0.58)" tickLine={false} axisLine={false} allowDecimals={false} tickFormatter={formatChartValue} width={38} />
              <Tooltip formatter={formatChartTooltip} contentStyle={tooltipStyle} />
              <Bar dataKey="value" fill="#facc15" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </Panel>

      <Panel title="Media Reliability Mix" kicker="Content health" icon={PieChartIcon}>
        <ChartBox>
          {hasMediaSplit ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data?.mediaSplit ?? []} dataKey="value" nameKey="name" innerRadius={58} outerRadius={104} paddingAngle={5}>
                  {(data?.mediaSplit ?? []).map((entry, index) => (
                    <Cell key={entry.name} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={formatMediaTooltip} contentStyle={tooltipStyle} />
                <Legend formatter={(value) => formatMediaType(String(value))} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Content health mix appears after movie and series clicks." />
          )}
        </ChartBox>
      </Panel>

      <Panel title="System Signals" kicker="Status" icon={ShieldCheck}>
        <div className="admin-console-signal-list">
          <div><span />Tracking API</div>
          <div><span />Admin auth</div>
          <div><span />Neon database</div>
          <div><span />Charts renderer</div>
        </div>
      </Panel>
    </section>
  );
}

export default function AdminDashboard({ admin }: { admin: AdminUser }) {
  const mainRef = React.useRef<HTMLElement | null>(null);
  const analyticsRequestRef = React.useRef(0);
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeSection, setActiveSection] = React.useState<SectionId>(() => readQueryOption("section", "overview", sectionIds));
  const [collapsed, setCollapsed] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [duration, setDuration] = React.useState<AdminDuration>("last_30_days");

  React.useEffect(() => {
    document.body.classList.add("is-admin-console");
    return () => document.body.classList.remove("is-admin-console");
  }, []);

  const loadAnalytics = React.useCallback(async (nextDuration = duration) => {
    const requestId = analyticsRequestRef.current + 1;
    analyticsRequestRef.current = requestId;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/analytics?duration=${encodeURIComponent(nextDuration)}`, { credentials: "include", cache: "no-store" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload?.error || "Unable to load analytics");
      if (requestId !== analyticsRequestRef.current) return;
      setData(payload as AnalyticsData);
    } catch (loadError) {
      if (requestId !== analyticsRequestRef.current) return;
      setError(loadError instanceof Error ? loadError.message : "Unable to load analytics");
    } finally {
      if (requestId === analyticsRequestRef.current) setLoading(false);
    }
  }, [duration]);

  React.useEffect(() => {
    void loadAnalytics(duration);
  }, [duration, loadAnalytics]);

  React.useEffect(() => {
    const root = mainRef.current;
    if (!root) return;

    const targets = Array.from(
      root.querySelectorAll<HTMLElement>(
        [
          ".admin-console-topbar",
          ".admin-console-tabs",
          ".admin-console-page-actions",
          ".admin-console-stat",
          ".admin-console-panel",
          ".admin-profile-hero",
          ".admin-profile-section",
          ".admin-profile-chart-card",
          ".admin-console-report-card",
          ".admin-console-template-card",
          ".admin-console-table-wrap",
          ".admin-console-ai-page",
          ".admin-console-error",
        ].join(", ")
      )
    );

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    targets.forEach((target, index) => {
      target.classList.add("admin-reveal");
      target.style.setProperty("--admin-reveal-index", String(Math.min(index, 10)));
      if (prefersReducedMotion) target.classList.add("is-visible");
    });

    if (prefersReducedMotion) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { root: null, rootMargin: "0px 0px -8% 0px", threshold: 0.12 }
    );

    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [activeSection, data, loading, error]);

  const setDashboardSection = React.useCallback((section: SectionId) => {
    setActiveSection(section);
    updateDashboardQuery({ section: section === "overview" ? null : section });
  }, []);

  const handleDurationChange = React.useCallback((nextDuration: AdminDuration) => {
    setDuration(nextDuration);
    setData((current) => current ? { ...current, period: { duration: nextDuration, label: durationOptions.find((option) => option.id === nextDuration)?.label || current.period.label } } : current);
  }, []);

  const activePage = activeSection === "profile" ? { label: "Admin Profile" } : navItems.find((item) => item.id === activeSection) ?? navItems[0];

  return (
    <main className={`admin-console-page ${collapsed ? "is-nav-collapsed" : ""} ${mobileOpen ? "is-mobile-nav-open" : ""}`}>
      <AdminSidenav
        activeSection={activeSection}
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        setActiveSection={setDashboardSection}
        setCollapsed={setCollapsed}
        setMobileOpen={setMobileOpen}
      />
      <div className="admin-console-utility-row" aria-label="Admin utilities">
        <div className="admin-console-theme-toggle">
          <ThemeToggle />
        </div>
        <AdminAccountMenu admin={admin} onViewProfile={() => setDashboardSection("profile")} />
      </div>
      <section className="admin-console-main" ref={mainRef}>
        <header className="admin-console-topbar">
          <button type="button" className="admin-console-mobile-menu" onClick={() => setMobileOpen(true)} aria-label="Open admin navigation">
            <Menu />
          </button>
          <div>
            <p className="section-kicker">Superadmin</p>
            <h1>{activePage.label}</h1>
            <span>{admin.username || admin.name || admin.email} · {data?.period.label || "Last 30 days"} analytics</span>
          </div>
          <div className="admin-console-topbar-actions">
            <div className="admin-console-filter">
              <AdminDropdown label="Duration" value={duration} options={durationOptions} onChange={handleDurationChange} />
            </div>
            <Button className="admin-refresh-button" onClick={() => void loadAnalytics(duration)} disabled={loading}>
              <RefreshCw className={loading ? "is-spinning" : ""} />
              Refresh
            </Button>
          </div>
        </header>

        {error && <div className="admin-console-error">{error}</div>}
        {loading && data && <AdminRefreshOverlay />}

        {loading && !data ? (
          <AdminPageSkeleton section={activeSection} />
        ) : (
          <div className="admin-console-section-enter" key={`${activeSection}-${data?.period.duration || duration}`}>
            {activeSection === "overview" && <OverviewPage data={data} loading={loading} />}
            {activeSection === "traffic" && <TrafficPage data={data} />}
            {activeSection === "content" && <ContentPage data={data} />}
            {activeSection === "users" && <UsersPage data={data} />}
            {activeSection === "leaderboards" && <LeaderboardsPage data={data} />}
            {activeSection === "audit" && <AuditLogsPage data={data} />}
            {activeSection === "reports" && <ReportsPage data={data} />}
            {activeSection === "campaign" && <CampaignPage data={data} />}
            {activeSection === "ai" && <AIManagerPage data={data} />}
            {activeSection === "health" && <HealthPage data={data} />}
            {activeSection === "profile" && <AdminProfilePage admin={admin} data={data} />}
          </div>
        )}
      </section>
      <AdminActionModal />
    </main>
  );
}
