import { NextResponse } from "next/server";
import { getAdminUser } from "../../../../../lib/admin";
import { ensureAppSchemaOnce, query } from "../../../../../lib/db";
import { sendEmail } from "../../../../../lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const fallbackCampaignBackdrop = "https://image.tmdb.org/t/p/original/3Rfvhy1Nl6sSGJwyjb0QiZzZYlB.jpg";

type RecipientMode = "all" | "selected";
type PosterInput = { title?: unknown; type?: unknown; clicks?: unknown; imageUrl?: unknown };
type UserRow = { id: string; email: string; label: string };

function sanitizeText(value: unknown, fallback: string, max = 2000) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : fallback;
}

function sanitizeRecipientMode(value: unknown): RecipientMode {
  return value === "selected" ? "selected" : "all";
}

function sanitizeUrl(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return /^https:\/\/image\.tmdb\.org\/t\/p\//.test(trimmed) ? trimmed.slice(0, 400) : "";
}

function sanitizeIdArray(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 300);
}

function sanitizePosters(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 12).map((item: PosterInput) => ({
    title: sanitizeText(item?.title, "JokaFlix pick", 120),
    type: sanitizeText(item?.type, "Title", 40),
    clicks: Number(item?.clicks || 0),
    imageUrl: sanitizeUrl(item?.imageUrl),
  }));
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatCampaignInline(value: string) {
  return escapeHtml(value)
    .replace(/\*\*([^*]+)\*\*/g, '<strong style="color:#ffffff;font-weight:900">$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em style="color:rgba(255,255,255,0.92)">$1</em>')
    .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, '<u style="color:#ffffff;text-decoration-color:#e50914;text-decoration-thickness:2px;text-underline-offset:4px">$1</u>');
}

function formatCampaignBody(value: string) {
  const blocks = value.split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  if (!blocks.length) return "";

  return blocks.map((block) => {
    const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
    if (lines.every((line) => line.startsWith("- "))) {
      return `
        <ul style="margin:16px 0 0;padding-left:22px;color:rgba(255,255,255,0.82);font-size:18px;line-height:1.65">
          ${lines.map((line) => `<li style="margin:0 0 8px">${formatCampaignInline(line.slice(2))}</li>`).join("")}
        </ul>
      `;
    }

    return `<p style="margin:18px 0 0;max-width:760px;color:rgba(255,255,255,0.82);font-size:18px;line-height:1.65">${formatCampaignInline(lines.join(" "))}</p>`;
  }).join("");
}

function campaignEmailTemplate({ subject, body, cta, posters }: { subject: string; body: string; cta: string; posters: ReturnType<typeof sanitizePosters> }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.BETTER_AUTH_URL || "https://jokaflix.com";
  const posterCards = posters.length ? posters : [{ title: "Trending picks", type: "JokaFlix", clicks: 0, imageUrl: "" }];
  const heroImage = posterCards.find((poster) => poster.imageUrl)?.imageUrl || fallbackCampaignBackdrop;

  return `
    <!doctype html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
      </head>
      <body style="margin:0;background:#050506;color:#ffffff;font-family:Arial,Helvetica,sans-serif">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#050506;padding:0">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="width:100%;max-width:none;overflow:hidden;border-radius:0;background:#0b0b0d;border:0">
              <tr>
                <td background="${escapeHtml(heroImage)}" style="background-image:linear-gradient(90deg,rgba(0,0,0,0.94),rgba(0,0,0,0.62)),url('${escapeHtml(heroImage)}');background-size:cover;background-position:center;padding:42px 38px 34px">
              <div style="display:inline-block;background:#e50914;color:#fff;border-radius:0;padding:9px 14px;font-size:12px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase">JokaFlix</div>
              <h1 style="margin:24px 0 0;max-width:760px;color:#ffffff !important;font-size:38px;line-height:1.05;font-weight:900;letter-spacing:-0.02em">${escapeHtml(subject)}</h1>
              ${formatCampaignBody(body)}
              <a href="${escapeHtml(siteUrl)}" style="display:inline-block;margin-top:28px;background:#e50914;color:#ffffff;text-decoration:none;border-radius:0;padding:16px 24px;font-weight:900">${escapeHtml(cta)}</a>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 38px 38px;background:#0b0b0d">
              <h2 style="margin:0 0 18px;color:#ffffff;font-size:22px;font-weight:900">Featured for your next watch</h2>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                ${Array.from({ length: Math.ceil(posterCards.length / 4) }).map((_, rowIndex) => {
                  const row = posterCards.slice(rowIndex * 4, rowIndex * 4 + 4);
                  return `<tr>${row.map((poster) => `
                    <td width="25%" style="padding:0 8px 16px 0;vertical-align:top">
                      <div style="min-height:164px;border:1px solid rgba(255,255,255,0.16);background:${poster.imageUrl ? `linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.9)),url('${escapeHtml(poster.imageUrl)}')` : "linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.92)),#260507"};background-size:cover;background-position:center;padding:14px;vertical-align:bottom">
                        <div style="min-height:136px;display:flex;flex-direction:column;justify-content:flex-end">
                          <strong style="display:block;color:#ffffff;font-size:15px;line-height:1.25">${escapeHtml(poster.title)}</strong>
                        </div>
                      </div>
                    </td>
                  `).join("")}${Array.from({ length: 4 - row.length }).map(() => `<td width="25%"></td>`).join("")}</tr>`;
                }).join("")}
              </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      </body>
    </html>
  `;
}

export async function POST(request: Request) {
  await ensureAppSchemaOnce();
  const admin = await getAdminUser();

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const subject = sanitizeText(body.subject, "", 160);
  const message = sanitizeText(body.body, "", 4000);
  const cta = sanitizeText(body.cta, "Watch now", 80);
  const recipientMode = sanitizeRecipientMode(body.recipientMode);
  const selectedUserIds = sanitizeIdArray(body.selectedUserIds);
  const posters = sanitizePosters(body.posters);

  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and campaign message are required." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  if (recipientMode === "selected" && selectedUserIds.length === 0) {
    return NextResponse.json({ error: "Select at least one member before sending." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const recipients = recipientMode === "all"
    ? await query<UserRow>(`select id, email, coalesce(username, name, email) as label from "user" where email is not null and email <> '' order by "createdAt" desc limit 500`)
    : await query<UserRow>(
      `select id, email, coalesce(username, name, email) as label from "user" where id = any($1::text[]) and email is not null and email <> '' order by "createdAt" desc`,
      [selectedUserIds],
    );

  if (!recipients.rows.length) {
    return NextResponse.json({ error: "No reachable email recipients were found." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const html = campaignEmailTemplate({ subject, body: message, cta, posters });
  let sent = 0;
  const failed: string[] = [];

  for (const recipient of recipients.rows) {
    try {
      await sendEmail({
        to: recipient.email,
        subject,
        html,
        text: `${subject}\n\n${message}\n\n${cta}`,
      });
      sent += 1;
    } catch {
      failed.push(recipient.email);
    }
  }

  if (sent === 0) {
    return NextResponse.json({ error: "Campaign could not be sent to any recipient." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json({ sent, failed: failed.length }, { headers: { "Cache-Control": "no-store" } });
}
