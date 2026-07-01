import MediaPlayer from "../../../../components/global/play/MediaPlayer";
import { createPlaybackToken } from "../../../../lib/media-security";

type PageProps = {
  params: Promise<{ category: string; id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function Page({ params, searchParams }: PageProps) {
  const [{ category, id }, query] = await Promise.all([params, searchParams]);
  const player = firstParam(query.player) === "2embed" ? "2embed" : "vidsrc";
  const season = firstParam(query.season) || "1";
  const episode = firstParam(query.episode) || "1";
  const full = firstParam(query.full) === "1";
  const playbackToken = createPlaybackToken({ category, id, player, season, episode, full });

  return <MediaPlayer playbackToken={playbackToken} />;
}
