import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { ensureAppSchemaOnce, query } from "../../../../lib/db";
import { getServerSession } from "../../../../lib/server-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const validEvents = new Set(["movie_click", "category_click", "search"]);

function safeText(value: unknown, limit = 180) {
  return typeof value === "string" ? value.trim().slice(0, limit) : null;
}

function safeMetadata(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

export async function POST(request: Request) {
  await ensureAppSchemaOnce();

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const eventType = safeText(body.eventType, 60);

  if (!eventType || !validEvents.has(eventType)) {
    return NextResponse.json({ error: "Invalid analytics event" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const existingVisitorId = cookieStore.get("jokaflix_visitor_id")?.value;
  const visitorId = existingVisitorId || randomUUID();
  const session = await getServerSession().catch(() => null);
  const userId = session?.user?.id || null;
  const mediaType = body.mediaType === "tv" ? "tv" : body.mediaType === "movie" ? "movie" : null;
  const tmdbId = typeof body.tmdbId === "number" || typeof body.tmdbId === "string" ? String(body.tmdbId).slice(0, 40) : null;
  const title = safeText(body.title);
  const category = safeText(body.category, 80) || mediaType || null;
  const pathname = safeText(body.pathname, 240);

  await query(
    `
      insert into analytics_events (
        id, event_type, media_type, tmdb_id, title, category, user_id, visitor_id, pathname, metadata
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb)
    `,
    [
      randomUUID(),
      eventType,
      mediaType,
      tmdbId,
      title,
      category,
      userId,
      visitorId,
      pathname,
      JSON.stringify(safeMetadata(body.metadata)),
    ]
  );

  const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
  if (!existingVisitorId) {
    response.cookies.set("jokaflix_visitor_id", visitorId, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  return response;
}
