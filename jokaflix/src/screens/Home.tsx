"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Hero } from '../components/global/hero'
import PopularMovies from '../components/global/popular-movies/PopularMovies'
import TrendingMovies  from '../components/global/trending-movies/TrendingMovies'
// import { BottyWidget } from 'botty-widget';
import TVShows from '../components/global/tv-shows/TVShows';
import PersonalizedRecommendations from '../components/global/recommendations/PersonalizedRecommendations';
import ContinueWatchingRail, { type ContinueWatchingItem } from '../components/profile/ContinueWatchingRail';
import { authClient } from '../lib/auth-client';

export default function Home() {
  // const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://jokaflix.vercel.app'
  // const bottyApiUrl = `${baseUrl}/api`
  const session = authClient.useSession();
  const [continueWatching, setContinueWatching] = React.useState<ContinueWatchingItem[]>([]);
  const [continueWatchingLoading, setContinueWatchingLoading] = React.useState(false);

  React.useEffect(() => {
    if (!session.data?.user) {
      setContinueWatching([]);
      setContinueWatchingLoading(false);
      return;
    }

    let ignore = false;
    setContinueWatchingLoading(true);
    fetch("/api/me", { credentials: "include" })
      .then((response) => response.json())
      .then((result) => {
        if (!ignore) setContinueWatching(result?.continueWatching || []);
      })
      .catch(() => {
        if (!ignore) setContinueWatching([]);
      })
      .finally(() => {
        if (!ignore) setContinueWatchingLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [session.data?.user]);

  return (
    <main className='app-shell relative min-h-screen overflow-x-hidden'>
      <div className='app-ambient pointer-events-none fixed inset-0 z-0' />
      <div className='relative z-10'>
        <Hero />
        {session.data?.user && (
          <section className="profile-section home-continue-section reveal-up">
            <div className="profile-section-title">
              <Clock />
              <h2>Continue Watching</h2>
            </div>
            <ContinueWatchingRail items={continueWatching} isLoading={continueWatchingLoading} />
          </section>
        )}
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
