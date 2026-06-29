import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, ExternalLink } from "lucide-react";

export default function MediaPlayer() {
  const { category, id: tmdbId } = useParams<{ category: string; id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(location.search);
  const full = searchParams.get("full") === "1";
  const season = searchParams.get("season");
  const episode = searchParams.get("episode");
  const type = category === "tv-show" ? "tv" : "movie";

  let src = "";
  let title = "";
  if (type === "movie") {
    src = `https://www.2embed.cc/embed/${tmdbId}`;
    title = "Movie Player";
  } else if (type === "tv") {
    if (full) {
      src = `https://www.2embed.cc/embedtvfull/${tmdbId}`;
      title = "Series Player";
    } else if (season && episode) {
      src = `https://www.2embed.skin/embedtv/${tmdbId}&s=${season}&e=${episode}`;
      title = `Series Player - S${season}E${episode}`;
    } else {
      src = `https://www.2embed.skin/embedtvfull/${tmdbId}`;
      title = "Series Player";
    }
  }

  return (
    <main className="player-page">
      <header className="player-topbar">
        <button type="button" onClick={() => navigate(-1)} className="player-action" aria-label="Go back">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="section-kicker">Now playing</p>
          <h1>{title}</h1>
        </div>
        <Link to={type === "tv" ? `/series/${tmdbId}` : `/movie/${tmdbId}`} className="player-action player-detail-link">
          Details
          <ExternalLink className="h-4 w-4" />
        </Link>
      </header>

      <section className="player-frame-shell">
        <iframe
          title={title}
          src={src}
          width="100%"
          height="100%"
          allowFullScreen
          frameBorder={0}
          className="player-frame"
        />
      </section>
    </main>
  );
}
