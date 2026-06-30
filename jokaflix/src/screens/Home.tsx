"use client";

import { Hero } from '../components/global/hero'
import PopularMovies from '../components/global/popular-movies/PopularMovies'
import TrendingMovies  from '../components/global/trending-movies/TrendingMovies'
// import { BottyWidget } from 'botty-widget';
import TVShows from '../components/global/tv-shows/TVShows';
import PersonalizedRecommendations from '../components/global/recommendations/PersonalizedRecommendations';

export default function Home() {
  // const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://jokaflix.vercel.app'
  // const bottyApiUrl = `${baseUrl}/api`

  return (
    <main className='app-shell relative min-h-screen overflow-hidden'>
      <div className='app-ambient pointer-events-none fixed inset-0 z-0' />
      <div className='relative z-10'>
        <Hero />
        <section id='movies' className='jokaflix-catalog'>
          <PersonalizedRecommendations />
          <TrendingMovies />
          <PopularMovies />
          <TVShows />
        </section>
      </div>
      {/* <BottyWidget botId='6968e1a8629bc8c27e18a5bf' apiUrl={bottyApiUrl} /> */}
    </main>
  )
}
