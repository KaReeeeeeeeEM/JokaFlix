import { NextResponse, type NextRequest } from "next/server";
import { buildProviderPlayerUrl } from "../../../../../lib/player-sources";
import { forbiddenMediaResponse, mediaHeaders, verifyPlaybackToken } from "../../../../../lib/media-security";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ category: string; id: string }> }
) {
  const { category, id } = await params;
  const type = category === "tv-show" ? "tv" : category === "movie" ? "movie" : null;

  if (!type || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid player request" }, { status: 400, headers: mediaHeaders() });
  }

  const searchParams = request.nextUrl.searchParams;
  const player = searchParams.get("player") === "2embed" ? "2embed" : "vidsrc";
  const season = searchParams.get("season") || "1";
  const episode = searchParams.get("episode") || "1";
  const full = searchParams.get("full") === "1";

  if (!verifyPlaybackToken(searchParams.get("token"), { category, id, player, season, episode, full })) {
    return forbiddenMediaResponse();
  }

  const resumeSeconds = Math.max(0, Math.floor(Number(searchParams.get("resume") || 0)));
  const sourceUrl = buildProviderPlayerUrl({
    tmdbId: id,
    type,
    player,
    season,
    episode,
    full,
    resumeSeconds,
  });

  return NextResponse.redirect(sourceUrl, {
    status: 307,
    headers: mediaHeaders(),
  });
}
