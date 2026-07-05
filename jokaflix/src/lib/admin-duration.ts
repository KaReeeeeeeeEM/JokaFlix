export type AdminDuration =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "all_time";

export const adminDurationOptions: { id: AdminDuration; label: string }[] = [
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

const durationSql: Record<AdminDuration, { start: string | null; end: string | null }> = {
  today: { start: "date_trunc('day', now())", end: "now()" },
  yesterday: { start: "date_trunc('day', now()) - interval '1 day'", end: "date_trunc('day', now())" },
  this_week: { start: "date_trunc('week', now())", end: "now()" },
  last_week: { start: "date_trunc('week', now()) - interval '1 week'", end: "date_trunc('week', now())" },
  this_month: { start: "date_trunc('month', now())", end: "now()" },
  last_month: { start: "date_trunc('month', now()) - interval '1 month'", end: "date_trunc('month', now())" },
  last_7_days: { start: "now() - interval '7 days'", end: "now()" },
  last_30_days: { start: "now() - interval '30 days'", end: "now()" },
  last_90_days: { start: "now() - interval '90 days'", end: "now()" },
  all_time: { start: null, end: null },
};

export function sanitizeAdminDuration(value: string | null | undefined): AdminDuration {
  return adminDurationOptions.some((option) => option.id === value) ? (value as AdminDuration) : "last_30_days";
}

export function adminDurationLabel(duration: AdminDuration) {
  return adminDurationOptions.find((option) => option.id === duration)?.label ?? "Last 30 days";
}

export function adminDurationCondition(column: string, duration: AdminDuration) {
  const range = durationSql[duration];
  if (!range.start) return "true";
  return `${column} >= ${range.start} and ${column} < ${range.end}`;
}

export function adminDurationSeriesStart(duration: AdminDuration) {
  if (duration === "yesterday") return "date_trunc('day', now()) - interval '1 day'";
  if (duration === "today") return "date_trunc('day', now())";
  if (duration === "this_week" || duration === "last_week" || duration === "last_7_days") return "date_trunc('day', now()) - interval '6 days'";
  if (duration === "last_90_days") return "date_trunc('day', now()) - interval '89 days'";
  return "date_trunc('day', now()) - interval '29 days'";
}
