"use client";

import { useFetch } from "../../../api";
import { MovieCard } from "../cards/MovieCard";
import type { TrendingMovie } from "../../../../types";

export default function PersonalizedRecommendations() {
  const { data, loading } = useFetch<{ authenticated: boolean; recommendations: TrendingMovie[] }>({
    url: "/api/user/recommendations",
  });

  const recommendations = data?.recommendations || [];

  if (loading || !data?.authenticated || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="catalog-section reveal-up">
      <div className="catalog-heading">
        <h2 className="catalog-title">For You</h2>
      </div>
      <div className="movie-strip">
        {recommendations.slice(0, 5).map((movie, index) => (
          <MovieCard key={movie.id} movie={movie} index={index} active={index === 0} source="For You" />
        ))}
      </div>
    </section>
  );
}
