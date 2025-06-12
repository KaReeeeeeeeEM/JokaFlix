import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../../ui/carousel"
import { useFetch } from "../../../api"
import type { TrendingMovie } from "../../../../types"

// Movie interface

export function Hero() {
  const plugin = React.useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  )

  // Use the useFetch hook to get trending movies
  const { data, loading } = useFetch<{ results: TrendingMovie[] }>(
    { url: `https://api.themoviedb.org/3/trending/movie/day?api_key=${import.meta.env.VITE_TMDB_API_KEY}` }
  )

  const movies = data?.results?.slice(0, 10) || []

  return (
    <div className="relative w-full h-screen">
      <Carousel
        plugins={[plugin.current]}
        className="relative w-full h-screen"
        onMouseEnter={plugin.current.stop}
        onMouseLeave={plugin.current.reset}
      >
        <CarouselContent className="w-full h-screen">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <CarouselItem key={index} className="h-screen pl-0">
                <div className="relative w-full h-screen">
                  <div className="absolute inset-0 bg-black/70" />
                  <div className="flex items-center justify-center h-full">
                    <span className="text-4xl font-semibold text-white animate-pulse">...</span>
                  </div>
                </div>
              </CarouselItem>
            ))
          ) : (
            movies.map((movie) => (
              <CarouselItem key={movie.id} className="w-full pl-0">
                <div className="relative w-full h-screen">
                  {/* Background image */}
                  <div
                    className="absolute inset-0 w-full h-full transition-all duration-700 bg-center bg-cover"
                    style={{
                      backgroundImage: `url(https://image.tmdb.org/t/p/original${movie.backdrop_path || movie.poster_path})`,
                    }}
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-b from-black/40 via-black/60 to-black/95" />
                  {/* Content */}
                  <div className="relative z-10 flex flex-col justify-end h-full px-4 sm:px-8 md:py-24 ">
                    <div className="flex flex-col items-center gap-8 md:flex-row md:items-end md:absolute md:bottom-24 md:left-24 lg:bottom-32 lg:left-32">
                      <img
                        src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                        alt={movie.title}
                        className="w-32 mb-6 rounded-lg shadow-lg md:w-56 md:mb-0"
                      />
                      <div>
                        <h2 className="mb-4 text-3xl font-extrabold text-white lg:text-5xl md:text-5xl drop-shadow">{movie.title}</h2>
                        <div className="flex items-center gap-4 mb-2">
                          <span className="text-lg font-bold text-orange-400">{movie.vote_average.toFixed(1)}</span>
                          <span className="text-gray-300">{movie.release_date?.slice(0, 4)}</span>
                        </div>
                        <p className="max-w-xl text-base text-gray-200 md:text-lg line-clamp-4">{movie.overview}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))
          )}
        </CarouselContent>
        <CarouselPrevious className="cursor-pointer z-30 !left-4 !top-1/2 !-translate-y-1/2 bg-black/60 hover:bg-black/80 border-none shadow-lg text-white w-12 h-12 rounded-full flex items-center justify-center" />
        <CarouselNext className="cursor-pointer z-30 !right-4 !top-1/2 !-translate-y-1/2 bg-black/60 hover:bg-black/80 border-none shadow-lg text-white w-12 h-12 rounded-full flex items-center justify-center" />
      </Carousel>
    </div>
  )
}
