import * as React from "react";
import { Card } from "../../ui/card";
import { Dialog, DialogTrigger } from "../../ui/dialog";
import type { TrendingMovie } from "../../../../types";
import SeriesDialog from "../modals/SeriesDialog";

type MovieCardProps = {
  movie: TrendingMovie;
};

export function SeriesCard({ movie }: MovieCardProps) {
  const [open, setOpen] = React.useState(false);

  // Use poster_path, fallback to backdrop_path if poster_path is missing
  const poster = movie.poster_path || movie.backdrop_path;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className="cursor-pointer"
          tabIndex={0}
          aria-label={`Open details for ${movie.title || movie.name}`}
          onClick={() => setOpen(true)}
        >
          <Card className="relative h-[350px] overflow-hidden shadow-lg group w-44 md:w-48 py-0 bg-neutral-900 rounded-lg">
            <img
              src={poster ? `https://image.tmdb.org/t/p/w500${poster}` : ""}
              alt={movie.title || movie.name}
              className="object-cover w-full h-[350px] transition-transform duration-300 rounded-lg group-hover:scale-105"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 flex flex-col justify-end p-4 transition-opacity duration-300 opacity-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:opacity-100">
              <h3 className="text-lg font-bold text-white truncate">
                {movie.title || movie.name}
              </h3>
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-400">
                <span>{movie.vote_average.toFixed(1)}</span>
                <span className="text-gray-300">
                  | {(movie.release_date || movie.first_air_date)?.slice(0, 4)}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-200 line-clamp-2">
                {movie.overview}
              </p>
            </div>
          </Card>
        </div>
      </DialogTrigger>
      <SeriesDialog series={movie} open={open} setOpen={setOpen} />
    </Dialog>
  );
}
