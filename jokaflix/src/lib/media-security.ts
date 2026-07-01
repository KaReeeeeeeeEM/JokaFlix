import { NextResponse, type NextRequest } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";

const MEDIA_SECURITY_HEADERS = {
  "Cache-Control": "no-store, private",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
  "Referrer-Policy": "no-referrer",
  "X-Content-Type-Options": "nosniff",
};

const BLOCKED_USER_AGENT_PARTS = [
  "bot",
  "crawler",
  "curl",
  "scrapy",
  "spider",
  "wget",
  "python-requests",
  "httpclient",
];

type PlaybackTokenInput = {
  category: string;
  id: string;
  player: "vidsrc" | "2embed";
  season?: string | null;
  episode?: string | null;
  full?: boolean;
};

export function mediaHeaders(extra?: HeadersInit) {
  return {
    ...MEDIA_SECURITY_HEADERS,
    ...extra,
  };
}

function playerTokenSecret() {
  return (
    process.env.PLAYER_TOKEN_SECRET ||
    process.env.BETTER_AUTH_SECRET ||
    process.env.DATABASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "jokaflix-local-player-token"
  );
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function signPayload(encodedPayload: string) {
  return createHmac("sha256", playerTokenSecret()).update(encodedPayload).digest("base64url");
}

function normalizePlaybackInput(input: PlaybackTokenInput) {
  return {
    category: input.category === "tv-show" ? "tv-show" : "movie",
    id: String(input.id || ""),
    player: input.player === "2embed" ? "2embed" : "vidsrc",
    season: input.category === "tv-show" ? String(input.season || "1") : "",
    episode: input.category === "tv-show" ? String(input.episode || "1") : "",
    full: Boolean(input.full),
  };
}

function signaturesMatch(received: string, expected: string) {
  const receivedBuffer = Buffer.from(received);
  const expectedBuffer = Buffer.from(expected);

  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}

export function createPlaybackToken(input: PlaybackTokenInput, ttlSeconds = 5 * 60) {
  const payload = {
    ...normalizePlaybackInput(input),
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function verifyPlaybackToken(token: string | null, input: PlaybackTokenInput) {
  if (!token) return false;

  const [encodedPayload, receivedSignature] = token.split(".");
  if (!encodedPayload || !receivedSignature) return false;

  const expectedSignature = signPayload(encodedPayload);
  if (!signaturesMatch(receivedSignature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as ReturnType<typeof normalizePlaybackInput> & { exp?: number };
    const expected = normalizePlaybackInput(input);

    return (
      Number(payload.exp || 0) >= Math.floor(Date.now() / 1000) &&
      payload.category === expected.category &&
      payload.id === expected.id &&
      payload.player === expected.player &&
      payload.season === expected.season &&
      payload.episode === expected.episode &&
      payload.full === expected.full
    );
  } catch {
    return false;
  }
}

export function blockedMediaRequest(request: NextRequest, expectedDest?: "iframe" | "document") {
  const userAgent = request.headers.get("user-agent")?.toLowerCase() || "";
  const fetchSite = request.headers.get("sec-fetch-site");
  const fetchDest = request.headers.get("sec-fetch-dest");

  if (!userAgent || BLOCKED_USER_AGENT_PARTS.some((part) => userAgent.includes(part))) {
    return true;
  }

  if (!fetchSite || !["same-origin", "same-site"].includes(fetchSite)) {
    return true;
  }

  if (expectedDest && fetchDest !== expectedDest) {
    return true;
  }

  return false;
}

export function forbiddenMediaResponse() {
  return NextResponse.json(
    { error: "Playback is only available from the JokaFlix app." },
    {
      status: 403,
      headers: mediaHeaders(),
    }
  );
}
