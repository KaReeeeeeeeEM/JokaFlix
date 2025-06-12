import { Hero } from '../components/global/hero'
import PopularMovies from '../components/global/popular-movies/PopularMovies'
import TrendingMovies  from '../components/global/trending-movies/TrendingMovies'

export default function Home() {
  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <Hero />
      <TrendingMovies />
      <PopularMovies />
    </div>
  )
}
