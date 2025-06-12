import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "../../ui/dialog";
import { Button } from "../../ui/button";
import { FaTimes } from "react-icons/fa";

export default function MediaPlayer() {
  const { category, id: tmdbId } = useParams<{ category: string; id: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Query params for dialog control and episode/season/full
  const searchParams = new URLSearchParams(location.search);
  const open = searchParams.get("play") === "1";
  const full = searchParams.get("full") === "1";
  const season = searchParams.get("season");
  const episode = searchParams.get("episode");
  const type = category === "tv-show" ? "tv" : "movie";

  // Compose iframe src
  let src = "";
  let title = "";
  if (type === "movie") {
    src = `https://www.2embed.cc/embed/${tmdbId}`;
    title = "Movie Player";
  } else if (type === "tv") {
    if (full) {
      src = `https://www.2embed.cc/embedtvfull/${tmdbId}`;
      title = "TV Show Player (All Seasons)";
    } else if (season && episode) {
      src = `https://www.2embed.skin/embedtv/${tmdbId}&s=${season}&e=${episode}`;
      title = `TV Show Player - S${season}E${episode}`;
    } else {
      src = `https://www.2embed.skin/embedtvfull/${tmdbId}`;
      title = "TV Show Player";
    }
  }

  // Always navigate to home on close for a clean URL
  const handleClose = () => {
    navigate("/", { replace: true });
  };

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={v => { if (!v) handleClose(); }}>
      <DialogContent
        className="flex flex-col p-0 bg-black rounded-lg md:overflow-hidden"
        style={{
          width: "100vw",
          maxWidth: "1200px",
          height: "95vh",
          maxHeight: "95vh",
          minHeight: "400px",
          padding: 0,
        }}
      >
        <DialogTitle>
          <span className="sr-only">{title}</span>
        </DialogTitle>
        <Button
          className="absolute z-20 flex items-center justify-center w-10 h-10 text-xl text-white transition rounded-full cursor-pointer top-4 right-4 bg-black/70 hover:bg-black/90"
          onClick={handleClose}
          aria-label="Close"
          type="button"
        >
          <FaTimes />
        </Button>
        <div className="flex items-center justify-between w-full px-4 py-2 bg-black">
          <span className="text-lg font-semibold text-white">{title}</span>
        </div>
        <div className="flex justify-center items-center w-full h-[80vh]">
          <iframe
            title={title}
            src={src}
            width="100%"
            height="100%"
            allowFullScreen
            frameBorder={0}
            className="w-[98vw] h-[80vh] md:h-[88vh] mx-auto bg-black"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
