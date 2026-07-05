import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { getAdminUser } from "../../../../lib/admin";
import { sanitizeAdminDuration } from "../../../../lib/admin-duration";
import { ensureAppSchemaOnce, query } from "../../../../lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TemplateRow = Record<string, string | number | null>;
type ReportType = "executive" | "activity" | "users" | "content" | "audit";

const reportTypes = new Set(["executive", "activity", "users", "content", "audit"]);
const allowedSections = new Set(["summary", "audience", "content", "activity", "users", "leaderboards", "audit", "health", "recommendations"]);

function sanitizeReportType(value: unknown): ReportType {
  return typeof value === "string" && reportTypes.has(value) ? (value as ReportType) : "executive";
}

function sanitizeText(value: unknown, fallback: string, max = 900) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : fallback;
}

function sanitizeStringArray(value: unknown, fallback: string[]) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12);
  return cleaned.length ? cleaned : fallback;
}

function sanitizeSections(value: unknown) {
  const sections = sanitizeStringArray(value, ["summary", "audience", "content"]);
  return sections.filter((section) => allowedSections.has(section));
}

function fallbackTemplate({
  name,
  description,
  reportType,
  duration,
  sections,
  fields,
  prompt,
}: {
  name: string;
  description: string;
  reportType: ReportType;
  duration: string;
  sections: string[];
  fields: string[];
  prompt: string;
}) {
  return [
    `# ${name}`,
    "",
    "## Cover Page",
    `Purpose: ${description}`,
    `Report type: ${reportType}`,
    `Default duration: ${duration}`,
    "Prepared for: JokaFlix leadership, operating team, and investor updates",
    "",
    "## Page 1 - Executive Narrative",
    "Write a concise operating story in plain business language. Explain the strongest signal, the biggest risk, and the management decision this report supports.",
    "",
    "## Page 2 - KPI Scorecard",
    "Use prominent KPI cards for selected metrics. Include current value, period comparison, directional indicator, and a one-sentence interpretation.",
    "",
    "## Page 3 - Charts and Evidence",
    "Include a trend chart, category or media-mix chart, and a ranked table where the selected sections provide enough data.",
    "",
    "## Selected Sections",
    ...sections.map((section) => `- ${section}: include KPIs, chart guidance, table columns, risks, and recommended actions.`),
    "",
    "## Required Fields and Placeholders",
    ...(fields.length ? fields.map((field) => `- ${field}`) : ["- Use all available platform metrics for the selected sections."]),
    "",
    "## Management Notes",
    "- Add an investor-ready conclusion.",
    "- Add action items with owner, priority, and expected business impact.",
    "- Add appendix notes for data limitations.",
    "",
    "## Extra AI Instruction",
    prompt || "Keep the report concise, board-ready, and suitable for investor or management review.",
  ].join("\n");
}

async function openAITemplate(input: {
  name: string;
  description: string;
  reportType: ReportType;
  duration: string;
  sections: string[];
  fields: string[];
  prompt: string;
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
      max_output_tokens: 1800,
      input: [
        {
          role: "system",
          content: [
            "You create premium reusable analytics report template documents for JokaFlix, a movie and series streaming platform.",
            "Return markdown only. Do not include code fences or prefaces.",
            "The output must read like a professional investor report document specification, not a generic outline.",
            "Design the document with a branded cover, page-by-page layout, KPI scorecards, chart panels, callout boxes, table columns, visual hierarchy, investor narrative prompts, management recommendations, appendix rules, and export polish notes.",
            "Be specific about what each page should look like and what each section should contain.",
            "Use placeholders like {{clicks_today}}, {{active_users}}, {{top_movie}}, {{best_category}}, and {{user_growth_rate}} where useful.",
          ].join(" "),
        },
        {
          role: "user",
          content: [
            `Template name: ${input.name}`,
            `Description: ${input.description}`,
            `Report type: ${input.reportType}`,
            `Default duration: ${input.duration}`,
            `Selected sections: ${input.sections.join(", ")}`,
            `Fields to emphasize: ${input.fields.join(", ") || "all relevant JokaFlix analytics"}`,
            `Superadmin instruction: ${input.prompt || "Make it concise, professional, and useful for management and investor updates."}`,
          ].join("\n"),
        },
      ],
    }),
  });

  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as { output_text?: string } | null;
  return payload?.output_text?.trim() || null;
}

export async function GET() {
  await ensureAppSchemaOnce();
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const templates = await query<TemplateRow>(`
    select
      t.id,
      t.name,
      coalesce(t.description, '') as description,
      t.report_type,
      t.duration,
      t.sections::text as sections,
      t.fields::text as fields,
      coalesce(t.ai_prompt, '') as ai_prompt,
      t.template_body,
      coalesce(u.username, u.name, u.email, 'System') as created_by,
      to_char(t.updated_at, 'Mon DD, YYYY HH24:MI') as updated_at
    from admin_report_templates t
    left join "user" u on u.id = t.created_by
    order by t.updated_at desc
    limit 100
  `);

  return NextResponse.json({ templates: templates.rows }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  await ensureAppSchemaOnce();
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const name = sanitizeText(body.name, "JokaFlix Custom Report", 120);
  const description = sanitizeText(body.description, "Reusable JokaFlix analytics report template.", 400);
  const reportType = sanitizeReportType(body.reportType);
  const duration = sanitizeAdminDuration(typeof body.duration === "string" ? body.duration : undefined);
  const sections = sanitizeSections(body.sections);
  const fields = sanitizeStringArray(body.fields, []);
  const prompt = sanitizeText(body.prompt, "", 1200);
  const aiTemplate = await openAITemplate({ name, description, reportType, duration, sections, fields, prompt }).catch(() => null);
  const templateBody = aiTemplate || fallbackTemplate({ name, description, reportType, duration, sections, fields, prompt });
  const id = randomUUID();

  const saved = await query<TemplateRow>(
    `
      insert into admin_report_templates (
        id, name, description, report_type, sections, fields, duration, ai_prompt, template_body, created_by
      )
      values ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7, $8, $9, $10)
      returning
        id,
        name,
        coalesce(description, '') as description,
        report_type,
        duration,
        sections::text as sections,
        fields::text as fields,
        coalesce(ai_prompt, '') as ai_prompt,
        template_body,
        $11::text as created_by,
        to_char(updated_at, 'Mon DD, YYYY HH24:MI') as updated_at
    `,
    [id, name, description, reportType, JSON.stringify(sections), JSON.stringify(fields), duration, prompt, templateBody, admin.id, admin.username || admin.name || admin.email || "System"]
  );

  return NextResponse.json({ template: saved.rows[0] }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE(request: Request) {
  await ensureAppSchemaOnce();
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Template id is required" }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  await query("delete from admin_report_templates where id = $1", [id]);
  return NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
