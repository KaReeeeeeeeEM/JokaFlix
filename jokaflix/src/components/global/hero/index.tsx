import * as React from "react"
import { useFetch } from "../../../api"
import type { TrendingMovie } from "../../../../types"
import { Play } from "lucide-react"
import { Link } from "react-router-dom"

const imageUrl = (path?: string) =>
  path ? `https://image.tmdb.org/t/p/original${path}` : ""

const thumbUrl = (path?: string) =>
  path ? `https://image.tmdb.org/t/p/w342${path}` : ""

export function Hero() {
  const [activeIndex, setActiveIndex] = React.useState(0)
  const [displayedImage, setDisplayedImage] = React.useState("")
  const [imageReady, setImageReady] = React.useState(false)

  const { data, loading } = useFetch<{ results: TrendingMovie[] }>(
    { url: `https://api.themoviedb.org/3/trending/movie/day?api_key=${import.meta.env.VITE_TMDB_API_KEY}` }
  )

  const movies = React.useMemo(() => data?.results?.filter((movie) => movie.backdrop_path || movie.poster_path).slice(0, 5) || [], [data])
  const activeMovie = movies[activeIndex] || movies[0]

  React.useEffect(() => {
    if (movies.length < 2) return

    const timeout = window.setTimeout(() => {
      setActiveIndex((current) => (current + 1) % movies.length)
    }, 5200)

    return () => window.clearTimeout(timeout)
  }, [activeIndex, movies.length])

  React.useEffect(() => {
    if (activeIndex > Math.max(movies.length - 1, 0)) {
      setActiveIndex(0)
    }
  }, [activeIndex, movies.length])

  const title = activeMovie?.title || activeMovie?.name || "JokaFlix"
  const activeImage = imageUrl(activeMovie?.backdrop_path || activeMovie?.poster_path)
  const releaseDate = activeMovie?.release_date || activeMovie?.first_air_date
  const releaseLabel = releaseDate
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(releaseDate))
    : "Now"
  const year = releaseDate?.slice(0, 4) || "Streaming"

  React.useEffect(() => {
    if (!activeImage) return
    let cancelled = false
    const nextImage = new Image()
    setImageReady(false)
    nextImage.onload = () => {
      if (cancelled) return
      setDisplayedImage(activeImage)
      requestAnimationFrame(() => setImageReady(true))
    }
    nextImage.src = activeImage

    return () => {
      cancelled = true
    }
  }, [activeImage])

  return (
    <section id="top" className="cinema-home-hero reveal-up">
      {loading || !activeMovie || !displayedImage ? (
        <div className="cinema-home-loading" />
      ) : (
        <>
          <div
            className={`cinema-home-bg ${imageReady ? "is-ready" : ""}`}
            style={{ backgroundImage: `url(${displayedImage})` }}
            aria-hidden="true"
          />
          <div className="cinema-home-shade" />
          <div className="cinema-home-copy" key={`copy-${activeMovie.id}`}>
            <div className="cinema-home-meta-line">
              <span>{releaseLabel}</span>
              <span>movie, streaming</span>
            </div>
            <h1>{title}</h1>
            <p>{year} · {activeMovie?.overview || "Stream the latest picks on JokaFlix."}</p>
            <div className="cinema-home-actions">
              <Link to={`/movie/${activeMovie?.id}`} className="cinema-primary-action">
                <Play size={16} fill="currentColor" />
                Watch now
              </Link>
              <Link to={`/movie/${activeMovie?.id}`} className="cinema-secondary-action">
                Details
              </Link>
            </div>
          </div>

          <div className="cinema-thumb-strip" aria-label="Featured titles">
            {movies.map((movie, index) => (
              <button
                key={movie.id}
                type="button"
                className={`cinema-thumb-button ${index === activeIndex ? "is-active" : ""}`}
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${movie.title || movie.name}`}
                style={{ "--thumb-index": index } as React.CSSProperties}
              >
                <img src={thumbUrl(movie.poster_path || movie.backdrop_path)} alt="" />
              </button>
            ))}
            <span className="cinema-thumb-progress" />
          </div>
        </>
      )}
    </section>
  )
}
