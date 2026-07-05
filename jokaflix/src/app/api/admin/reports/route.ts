import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminUser } from "../../../../lib/admin";
import { adminDurationCondition, sanitizeAdminDuration, type AdminDuration } from "../../../../lib/admin-duration";
import { ensureAppSchemaOnce, query } from "../../../../lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type ReportType = "executive" | "activity" | "users" | "content" | "audit";
type ReportFormat = "csv" | "pdf";
type ReportRow = Record<string, string | number | null>;
type ReportTemplate = ReportRow & { id?: string | null; name?: string | null; template_body?: string | null };
type KpiCard = { label: string; value: string; note: string };

const reportLabels: Record<ReportType, string> = {
  executive: "Executive Investor Summary",
  activity: "Platform Activity Report",
  users: "User Growth and Status Report",
  content: "Content Performance Report",
  audit: "Audit Logs Report",
};

function sanitizeReportType(value: string | null): ReportType {
  return value === "activity" || value === "users" || value === "content" || value === "audit" ? value : "executive";
}

function sanitizeFormat(value: string | null): ReportFormat {
  return value === "csv" ? "csv" : "pdf";
}

function sanitizeSections(value: string | null) {
  if (!value) return ["summary", "audience", "content", "activity"];
  return value.split(",").map((section) => section.trim()).filter(Boolean).slice(0, 12);
}

function csvEscape(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function toCsv(rows: ReportRow[]) {
  if (!rows.length) return "No data\n";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))].join("\n");
}

function pdfEscape(value: unknown) {
  return String(value ?? "")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function fillColor(hex: string) {
  const clean = hex.replace("#", "");
  const r = Number.parseInt(clean.slice(0, 2), 16) / 255;
  const g = Number.parseInt(clean.slice(2, 4), 16) / 255;
  const b = Number.parseInt(clean.slice(4, 6), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} rg\n`;
}

function strokeColor(hex: string) {
  const clean = hex.replace("#", "");
  const r = Number.parseInt(clean.slice(0, 2), 16) / 255;
  const g = Number.parseInt(clean.slice(2, 4), 16) / 255;
  const b = Number.parseInt(clean.slice(4, 6), 16) / 255;
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} RG\n`;
}

function line(text: string, x: number, y: number, size = 11, font = "F1", color = "#111827") {
  return `${fillColor(color)}BT /${font} ${size} Tf ${x} ${y} Td (${pdfEscape(text)}) Tj ET\n`;
}

function rect(x: number, y: number, width: number, height: number, color: string) {
  return `${fillColor(color)}${x} ${y} ${width} ${height} re f\n`;
}

function strokedRect(x: number, y: number, width: number, height: number, fill: string, stroke = "#e5e7eb") {
  return `${fillColor(fill)}${strokeColor(stroke)}${x} ${y} ${width} ${height} re B\n`;
}

function logoLockup(x: number, y: number, scale = 1) {
  const markSize = 30 * scale;
  const textSize = 14 * scale;
  const subSize = 6.5 * scale;
  return [
    rect(x, y, markSize, markSize, "#e50914"),
    line("JF", x + 7 * scale, y + 11 * scale, 11 * scale, "F2", "#ffffff"),
    line("JokaFlix", x + markSize + 8 * scale, y + 17 * scale, textSize, "F2", "#ffffff"),
    line("STREAMING ANALYTICS", x + markSize + 9 * scale, y + 7 * scale, subSize, "F2", "#f8fafc"),
  ].join("");
}

function wrapText(text: string, maxChars: number) {
  const words = String(text || "").replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let current = "";

  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });

  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function cleanMarkdownLine(value: string) {
  return value.replace(/^#{1,6}\s*/, "").replace(/^[-*]\s*/, "").trim();
}

function extractOpenAIText(payload: unknown) {
  const outputText = (payload as { output_text?: unknown })?.output_text;
  if (typeof outputText === "string" && outputText.trim()) return outputText.trim();

  const output = (payload as { output?: unknown })?.output;
  if (!Array.isArray(output)) return null;

  const chunks: string[] = [];
  output.forEach((item) => {
    const content = (item as { content?: unknown })?.content;
    if (!Array.isArray(content)) return;
    content.forEach((part) => {
      const text = (part as { text?: unknown })?.text;
      if (typeof text === "string") chunks.push(text);
    });
  });

  const text = chunks.join("\n").trim();
  return text || null;
}

function getRowValue(row: ReportRow, candidates: string[]) {
  for (const key of candidates) {
    const value = row[key];
    if (value !== null && value !== undefined && String(value).trim()) return String(value);
  }
  return "";
}

function getNumericValue(row: ReportRow) {
  const preferredKeys = ["value", "clicks_30d", "period_activity", "events", "active_users", "audience", "movie_clicks", "series_clicks"];
  for (const key of preferredKeys) {
    const value = Number(row[key]);
    if (Number.isFinite(value)) return value;
  }
  for (const value of Object.values(row)) {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return numeric;
  }
  return 0;
}

function getRowLabel(row: ReportRow) {
  return getRowValue(row, ["metric", "title", "user", "day", "timestamp", "event", "actor", "category"]) || "Data point";
}

function summarizeRows(rows: ReportRow[]) {
  if (!rows.length) return "No rows are available yet for this report.";
  return rows.slice(0, 10).map((row, index) => `${index + 1}. ${Object.entries(row).map(([key, value]) => `${key}: ${value ?? ""}`).join(", ")}`).join("\n");
}

function buildKpiCards(type: ReportType, rows: ReportRow[]): KpiCard[] {
  const first = rows[0] || {};
  if (type === "executive") {
    return rows.slice(0, 4).map((row) => ({
      label: getRowValue(row, ["metric", "category"]) || "Metric",
      value: getRowValue(row, ["value"]) || "0",
      note: getRowValue(row, ["category"]) || "Platform signal",
    }));
  }

  const total = rows.reduce((sum, row) => sum + getNumericValue(row), 0);
  const top = getRowLabel(first);
  return [
    { label: "Rows analyzed", value: String(rows.length), note: "Records included in this export" },
    { label: "Total signal", value: total.toLocaleString(), note: "Combined measurable activity" },
    { label: "Top result", value: top.slice(0, 22), note: "Highest ranked row in the dataset" },
    { label: "Report type", value: reportLabels[type].replace(" Report", ""), note: "Selected analysis track" },
  ];
}

function fallbackNarrative(title: string, type: ReportType, rows: ReportRow[], template: ReportTemplate | null) {
  const top = rows[0] ? getRowLabel(rows[0]) : "No dominant signal yet";
  const templateNote = template?.template_body ? "This report follows the saved AI template structure selected by the superadmin." : "This report uses the standard JokaFlix executive document structure.";
  return [
    `${title} summarizes the strongest JokaFlix operating signals for the selected reporting period.`,
    `${templateNote} The document is designed for management review, investor updates, and clear follow-up decisions.`,
    `The leading signal is ${top}. Use this as the starting point for reviewing demand, user behavior, and operational priorities.`,
    "Recommended next step: compare these signals against acquisition spend, release timing, and user retention before making catalog or product decisions.",
  ];
}

async function generateAiNarrative(input: {
  title: string;
  type: ReportType;
  duration: AdminDuration;
  sections: string[];
  rows: ReportRow[];
  template: ReportTemplate | null;
}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      max_output_tokens: 900,
      input: [
        {
          role: "system",
          content: [
            "You write polished executive report copy for JokaFlix, a movie and series streaming platform.",
            "Return only 4 to 6 short paragraphs. No markdown tables. No code fences.",
            "Write in professional investor-ready language with concrete management implications.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Report title: ${input.title}`,
            `Report type: ${input.type}`,
            `Duration: ${input.duration}`,
            `Sections: ${input.sections.join(", ")}`,
            `Saved template: ${input.template?.template_body ? String(input.template.template_body).slice(0, 1800) : "standard JokaFlix report"}`,
            "Dataset sample:",
            summarizeRows(input.rows),
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) return null;
  const payload = await response.json().catch(() => null);
  const text = extractOpenAIText(payload);
  if (!text) return null;
  return text.split("\n").map(cleanMarkdownLine).filter(Boolean).slice(0, 6);
}

function createPdf({
  title,
  type,
  duration,
  sections,
  rows,
  template,
  narrative,
}: {
  title: string;
  type: ReportType;
  duration: AdminDuration;
  sections: string[];
  rows: ReportRow[];
  template: ReportTemplate | null;
  narrative: string[];
}) {
  const generatedAt = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Dar_es_Salaam" }).format(new Date());
  const objects: string[] = [];
  const pageStreams: string[] = [];
  const cards = buildKpiCards(type, rows).slice(0, 4);
  const headers = rows[0] ? Object.keys(rows[0]).slice(0, 5) : [];
  const accent = type === "audit" ? "#38bdf8" : type === "users" ? "#22c55e" : type === "content" ? "#facc15" : "#e50914";
  let chunks: string[] = [];
  let pageNumber = 0;
  let y = 720;

  const addFooter = () => {
    chunks.push(strokeColor("#e5e7eb"));
    chunks.push("48 48 m 564 48 l S\n");
    chunks.push(line("JokaFlix Confidential", 48, 30, 8, "F2"));
    chunks.push(line(`Page ${pageNumber}`, 526, 30, 8));
  };

  const newPage = () => {
    if (chunks.length) {
      addFooter();
      pageStreams.push(chunks.join(""));
    }
    pageNumber += 1;
    chunks = [];
    chunks.push(rect(0, 0, 612, 792, "#ffffff"));
    y = 720;
  };

  const drawWrapped = (text: string, x: number, startY: number, maxChars: number, size = 10, font = "F1", leading = 14) => {
    let currentY = startY;
    wrapText(text, maxChars).forEach((wrappedLine) => {
      chunks.push(line(wrappedLine, x, currentY, size, font));
      currentY -= leading;
    });
    return currentY;
  };

  newPage();
  chunks.push(rect(0, 692, 612, 100, "#111111"));
  chunks.push(rect(0, 692, 178, 100, "#e50914"));
  chunks.push(logoLockup(48, 732, 1.15));
  chunks.push(line("SUPERADMIN REPORT", 392, 748, 9, "F2", "#ffffff"));
  chunks.push(line(generatedAt, 392, 730, 9, "F1", "#ffffff"));
  chunks.push(line(title, 48, 642, 26, "F2"));
  chunks.push(line(reportLabels[type], 48, 614, 12, "F2"));
  chunks.push(line(`Duration: ${duration.replaceAll("_", " ")} | Sections: ${sections.join(", ") || "standard"}`, 48, 594, 9));
  chunks.push(line(template?.name ? `Template: ${template.name}` : "Template: Standard JokaFlix executive document", 48, 578, 9));

  const cardWidth = 120;
  cards.forEach((card, index) => {
    const x = 48 + index * 130;
    chunks.push(strokedRect(x, 488, cardWidth, 72, "#f8fafc", "#e2e8f0"));
    chunks.push(line(card.label.slice(0, 20), x + 12, 540, 8, "F2"));
    chunks.push(line(card.value.slice(0, 18), x + 12, 516, 17, "F2"));
    chunks.push(line(card.note.slice(0, 24), x + 12, 500, 7));
  });

  chunks.push(rect(48, 446, 516, 4, accent));
  chunks.push(line("Executive Narrative", 48, 420, 16, "F2"));
  y = 396;
  narrative.slice(0, 5).forEach((paragraph) => {
    y = drawWrapped(paragraph, 48, y, 92, 10, "F1", 14) - 8;
  });

  chunks.push(line("Visual Signal Snapshot", 48, Math.max(y - 12, 154), 15, "F2"));
  const chartTop = Math.max(y - 42, 122);
  const chartRows = rows.slice(0, 6).map((row) => ({ label: getRowLabel(row), value: getNumericValue(row) }));
  const maxValue = Math.max(...chartRows.map((row) => row.value), 1);
  chartRows.forEach((row, index) => {
    const rowY = chartTop - index * 18;
    const width = Math.max(10, Math.round((row.value / maxValue) * 250));
    chunks.push(line(row.label.slice(0, 28), 48, rowY, 8));
    chunks.push(rect(190, rowY - 3, width, 8, accent));
    chunks.push(line(row.value.toLocaleString(), 456, rowY, 8, "F2"));
  });

  newPage();
  chunks.push(rect(0, 742, 612, 50, "#111111"));
  chunks.push(logoLockup(48, 752, 0.78));
  chunks.push(line("Template Structure and Management Notes", 48, 704, 18, "F2"));
  y = 676;
  const templateLines = (template?.template_body ? String(template.template_body) : "Standard report structure: executive summary, KPI scorecard, activity evidence, ranked table, recommendations, appendix.")
    .split("\n")
    .map(cleanMarkdownLine)
    .filter(Boolean)
    .slice(0, 18);
  templateLines.forEach((templateLine) => {
    if (y < 110) {
      newPage();
      chunks.push(rect(0, 742, 612, 50, "#111111"));
      chunks.push(logoLockup(48, 752, 0.78));
      y = 704;
    }
    y = drawWrapped(templateLine, 64, y, 82, 9.5, templateLine.includes(":") ? "F1" : "F2", 13) - 3;
  });

  newPage();
  chunks.push(rect(0, 742, 612, 50, "#111111"));
  chunks.push(logoLockup(48, 752, 0.78));
  chunks.push(line("Dataset Appendix", 48, 704, 18, "F2"));
  chunks.push(line(`${rows.length.toLocaleString()} rows included | ${headers.length || 0} visible columns`, 48, 682, 9));
  y = 648;

  if (!rows.length || !headers.length) {
    chunks.push(strokedRect(48, 560, 516, 62, "#f8fafc", "#e2e8f0"));
    chunks.push(line("No data is available for this report yet.", 68, 592, 11, "F2"));
  } else {
    chunks.push(strokedRect(48, y, 516, 24, "#111111", "#111111"));
    headers.forEach((header, index) => {
      chunks.push(line(header.slice(0, 15), 58 + index * 100, y + 8, 8, "F2", "#ffffff"));
    });
    y -= 24;
    rows.slice(0, 48).forEach((row, rowIndex) => {
      if (y < 82) {
        newPage();
        chunks.push(rect(0, 742, 612, 50, "#111111"));
        chunks.push(logoLockup(48, 752, 0.78));
        chunks.push(line("Dataset Appendix Continued", 48, 704, 18, "F2"));
        y = 666;
      }
      chunks.push(strokedRect(48, y, 516, 22, rowIndex % 2 ? "#ffffff" : "#f8fafc", "#edf2f7"));
      headers.forEach((header, index) => {
        chunks.push(line(String(row[header] ?? "").slice(0, 18), 58 + index * 100, y + 8, 7.5));
      });
      y -= 22;
    });
  }
  addFooter();
  pageStreams.push(chunks.join(""));

  const pagesId = 2;
  objects.push("<< /Type /Catalog /Pages 2 0 R >>");
  objects.push("");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
  objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique >>");

  const pageIds: number[] = [];
  pageStreams.forEach((stream) => {
    const streamId = objects.length + 1;
    objects.push(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}endstream`);
    const pageId = objects.length + 1;
    pageIds.push(pageId);
    objects.push(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${streamId} 0 R >>`);
  });
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new TextEncoder().encode(pdf);
}

async function getTemplate(templateId: string | null) {
  if (!templateId) return null;
  const result = await query<ReportTemplate>(
    `
      select id, name, report_type, duration, sections::text as sections, template_body
      from admin_report_templates
      where id = $1
      limit 1
    `,
    [templateId]
  );
  return result.rows[0] || null;
}

async function getReportRows(type: ReportType, duration: AdminDuration) {
  const eventPeriod = adminDurationCondition("e.created_at", duration);
  const rawEventPeriod = adminDurationCondition("created_at", duration);

  if (type === "users") {
    return query<ReportRow>(`
      select
        coalesce(u.username, u.name, u.email) as user,
        u.email,
        coalesce(u.role, 'user') as role,
        to_char(u."createdAt", 'YYYY-MM-DD') as joined,
        case when max(e.created_at) >= now() - interval '5 minutes' then 'online' else 'offline' end as status,
        coalesce(count(e.id) filter (where ${eventPeriod}), 0)::int as period_activity
      from "user" u
      left join analytics_events e on e.user_id = u.id
      group by u.id, u.username, u.name, u.email, u.role, u."createdAt"
      order by period_activity desc, joined desc
      limit 500
    `);
  }

  if (type === "content") {
    return query<ReportRow>(`
      select
        coalesce(title, 'Untitled') as title,
        case when media_type = 'tv' then 'Series' when media_type = 'movie' then 'Movie' else coalesce(media_type, 'Other') end as media,
        coalesce(category, 'Uncategorized') as category,
        count(*)::int as clicks_30d,
        count(distinct coalesce(user_id, visitor_id))::int as audience
      from analytics_events
      where event_type = 'movie_click'
        and ${rawEventPeriod}
      group by title, media_type, category
      order by clicks_30d desc, title asc
      limit 500
    `);
  }

  if (type === "audit") {
    return query<ReportRow>(`
      select
        to_char(e.created_at, 'YYYY-MM-DD HH24:MI') as timestamp,
        e.event_type as event,
        coalesce(u.username, u.name, u.email, 'Guest ' || right(coalesce(e.visitor_id, 'unknown'), 4)) as actor,
        coalesce(e.title, e.pathname, 'Platform event') as target,
        coalesce(e.category, 'Uncategorized') as category
      from analytics_events e
      left join "user" u on u.id = e.user_id
      where ${eventPeriod}
      order by e.created_at desc
      limit 500
    `);
  }

  if (type === "activity") {
    return query<ReportRow>(`
      select
        to_char(day_bucket, 'YYYY-MM-DD') as day,
        coalesce(count(e.id), 0)::int as events,
        coalesce(count(e.id) filter (where e.media_type = 'movie'), 0)::int as movie_clicks,
        coalesce(count(e.id) filter (where e.media_type = 'tv'), 0)::int as series_clicks,
        coalesce(count(distinct coalesce(e.user_id, e.visitor_id)), 0)::int as active_users
      from generate_series(date_trunc('day', now()) - interval '29 days', date_trunc('day', now()), interval '1 day') as day_bucket
      left join analytics_events e
        on e.created_at >= day_bucket
        and e.created_at < day_bucket + interval '1 day'
        and ${eventPeriod}
      group by day_bucket
      order by day_bucket desc
    `);
  }

  return query<ReportRow>(`
    select 'Total users' as metric, count(*)::text as value, 'Audience' as category from "user"
    union all
    select 'New users today' as metric, count(*)::text as value, 'Audience' as category from "user" where "createdAt" >= date_trunc('day', now())
    union all
    select 'Clicks today' as metric, count(*)::text as value, 'Engagement' as category from analytics_events where event_type = 'movie_click' and created_at >= date_trunc('day', now())
    union all
    select 'Active users in period' as metric, count(distinct coalesce(user_id, visitor_id))::text as value, 'Engagement' as category from analytics_events where ${rawEventPeriod}
    union all
    select 'Top category' as metric, coalesce((select category from analytics_events where ${rawEventPeriod} group by category order by count(*) desc limit 1), 'No activity') as value, 'Content' as category
  `);
}

export async function GET(request: Request) {
  await ensureAppSchemaOnce();
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const url = new URL(request.url);
  const type = sanitizeReportType(url.searchParams.get("type"));
  const format = sanitizeFormat(url.searchParams.get("format"));
  const duration = sanitizeAdminDuration(url.searchParams.get("duration"));
  const sections = sanitizeSections(url.searchParams.get("sections"));
  const template = await getTemplate(url.searchParams.get("templateId"));
  const effectiveType = sanitizeReportType((template?.report_type as string | null) || type);
  const rows = (await getReportRows(effectiveType, duration)).rows;
  const fileBase = `jokaflix-${type}-report`;
  const title = template?.name ? String(template.name) : reportLabels[effectiveType];
  const narrative = format === "pdf"
    ? (await generateAiNarrative({ title, type: effectiveType, duration, sections, rows, template }).catch(() => null)) || fallbackNarrative(title, effectiveType, rows, template)
    : [];

  await query(
    `
      insert into admin_reports (id, report_type, format, title, generated_by, template_id, duration, sections, row_count)
      values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
    `,
    [randomUUID(), effectiveType, format, title, admin.id, template?.id || null, duration, JSON.stringify(sections), rows.length]
  );

  if (format === "csv") {
    return new NextResponse(toCsv(rows), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename="${fileBase}.csv"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  }

  return new NextResponse(createPdf({ title, type: effectiveType, duration, sections, rows, template, narrative }), {
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": `attachment; filename="${fileBase}.pdf"`,
      "Content-Type": "application/pdf",
    },
  });
}
