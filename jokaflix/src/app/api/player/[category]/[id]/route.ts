import { NextResponse, type NextRequest } from "next/server";
import { buildProviderPlayerUrl } from "../../../../../lib/player-sources";
import { blockedMediaRequest, forbiddenMediaResponse, mediaHeaders } from "../../../../../lib/media-security";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; id: string }> }
) {
  if (blockedMediaRequest(request, "iframe")) {
    return forbiddenMediaResponse();
  }

  const { category, id } = await params;
  const type = category === "tv-show" ? "tv" : category === "movie" ? "movie" : null;

  if (!type || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid player request" }, { status: 400, headers: mediaHeaders() });
  }

  const searchParams = request.nextUrl.searchParams;
  const player = searchParams.get("player") === "2embed" ? "2embed" : "vidsrc";
  const resumeSeconds = Math.max(0, Math.floor(Number(searchParams.get("resume") || 0)));
  const sourceUrl = buildProviderPlayerUrl({
    tmdbId: id,
    type,
    player,
    season: searchParams.get("season") || "1",
    episode: searchParams.get("episode") || "1",
    full: searchParams.get("full") === "1",
    resumeSeconds,
  });

  return NextResponse.redirect(sourceUrl, {
    status: 307,
    headers: mediaHeaders(),
  });
}
