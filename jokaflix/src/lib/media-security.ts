import { NextResponse, type NextRequest } from "next/server";

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

export function mediaHeaders(extra?: HeadersInit) {
  return {
    ...MEDIA_SECURITY_HEADERS,
    ...extra,
  };
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
