import { NextResponse } from "next/server";
import { query } from "../../../../lib/db";

function normalizeUsername(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 24);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const username = normalizeUsername(body.username);

  if (username.length < 3) {
    return NextResponse.json({ available: false, message: "Username must be at least 3 characters." }, { status: 400 });
  }

  try {
    const result = await query<{ exists: boolean }>(
      `
        select exists(
          select 1
          from "user"
          where lower(username) = lower($1)
            or lower("displayUsername") = lower($1)
        ) as exists
      `,
      [username]
    );

    return NextResponse.json({ available: !result.rows[0]?.exists });
  } catch (error) {
    console.warn("[JokaFlix auth] username availability check failed", error);
    return NextResponse.json({ available: null });
  }
}
