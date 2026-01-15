import { Hero } from '../components/global/hero'
import PopularMovies from '../components/global/popular-movies/PopularMovies'
import TrendingMovies  from '../components/global/trending-movies/TrendingMovies'
import { BottyWidget } from 'botty-widget';

export default function Home() {
  return (
    <div className='relative w-full h-screen overflow-hidden'>
      <Hero />
      <TrendingMovies />
      <PopularMovies />
      <BottyWidget botId='6968e1a8629bc8c27e18a5bf' />
    </div>
  )
}
