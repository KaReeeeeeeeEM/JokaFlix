"use client";

import * as React from "react";
import Link from "next/link";
import { Search, UsersRound } from "lucide-react";
import { Skeleton } from "../components/ui/skeleton";

type KnownForTitle = {
  title?: string;
  name?: string;
};

type Actor = {
  id: number;
  name: string;
  profile_path?: string | null;
  known_for_department?: string;
  known_for?: KnownForTitle[];
};

type ActorSearchResponse = {
  page: number;
  total_pages: number;
  results: Actor[];
};

const tmdbKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;

function actorImage(path?: string | null) {
  return path ? `https://image.tmdb.org/t/p/w342${path}` : "";
}

function actorsEndpoint(query: string, page: number) {
  if (query.length > 1) {
    return `https://api.themoviedb.org/3/search/person?api_key=${tmdbKey}&query=${encodeURIComponent(query)}&include_adult=false&page=${page}`;
  }

  return `https://api.themoviedb.org/3/person/popular?api_key=${tmdbKey}&page=${page}`;
}

function knownFor(actor: Actor) {
  const titles = (actor.known_for || [])
    .map((item) => item.title || item.name)
    .filter(Boolean)
    .slice(0, 2);

  return titles.length ? titles.join(", ") : "Explore movies";
}

export default function ActorsPage() {
  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [actors, setActors] = React.useState<Actor[]>([]);
  const [actorsLoading, setActorsLoading] = React.useState(false);
  const [actorsError, setActorsError] = React.useState<string | null>(null);
  const [hasMore, setHasMore] = React.useState(true);
  const actorRequestRef = React.useRef(0);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebounced(query.trim()), 350);
    return () => window.clearTimeout(timeout);
  }, [query]);

  React.useEffect(() => {
    setPage(1);
    setActors([]);
    setHasMore(true);
    setActorsError(null);
  }, [debounced]);

  React.useEffect(() => {
    let cancelled = false;
    const requestId = actorRequestRef.current + 1;
    actorRequestRef.current = requestId;

    async function loadActors() {
      setActorsLoading(true);
      setActorsError(null);

      try {
        const response = await fetch(actorsEndpoint(debounced, page));
        if (!response.ok) throw new Error("Unable to load actors.");
        const data = (await response.json()) as ActorSearchResponse;
        if (cancelled || actorRequestRef.current !== requestId) return;

        const nextActors = data.results.filter(
          (actor) => actor.profile_path && (!actor.known_for_department || actor.known_for_department === "Acting")
        );

        setActors((current) => {
          const seen = new Set(current.map((actor) => actor.id));
          const unique = nextActors.filter((actor) => {
            if (seen.has(actor.id)) return false;
            seen.add(actor.id);
            return true;
          });
          return page === 1 ? unique : [...current, ...unique];
        });
        setHasMore(data.page < data.total_pages);
      } catch (err) {
        if (!cancelled) setActorsError(err instanceof Error ? err.message : "Unable to load actors.");
      } finally {
        if (!cancelled && actorRequestRef.current === requestId) setActorsLoading(false);
      }
    }

    loadActors();
    return () => {
      cancelled = true;
    };
  }, [debounced, page]);

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !actorsLoading) {
          setPage((current) => current + 1);
        }
      },
      { root: null, rootMargin: "760px 0px", threshold: 0.01 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, actorsLoading]);

  return (
    <main className="page-shell actors-page">
      <section className="page-hero actors-page-hero">
        <p className="section-kicker">Actors</p>
        <h1>Find actors, then find their movies</h1>
        <p>Browse popular actors or search any name. Select an actor to open a dedicated page with their movies.</p>
      </section>

      <section className="actors-library" aria-label="Actor search">
        <div className="actor-search-panel">
          <div className="actor-search-input">
            <Search className="h-5 w-5" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search actors"
              aria-label="Search actors"
            />
          </div>
        </div>

        <div className="actors-grid">
          {actors.map((actor) => (
            <Link className="actor-card" href={`/actors/${actor.id}`} key={actor.id} aria-label={`View movies for ${actor.name}`}>
              <img src={actorImage(actor.profile_path)} alt={actor.name} />
              <span>{actor.name}</span>
              <small>{knownFor(actor)}</small>
            </Link>
          ))}
          {actorsLoading &&
            Array.from({ length: page === 1 ? 12 : 6 }).map((_, index) => (
              <Skeleton className="actor-card-skeleton" key={`actor-loading-${page}-${index}`} />
            ))}
        </div>

        {actorsError && <p className="movies-page-error">{actorsError}</p>}
        {!actorsLoading && !actorsError && actors.length === 0 && (
          <div className="genre-empty-state">
            <UsersRound />
            <p>No actors found.</p>
          </div>
        )}
        {hasMore && !actorsError && (
          <div className="actors-load-more-row">
            <button
              type="button"
              className="actors-load-more-button"
              disabled={actorsLoading}
              onClick={() => setPage((current) => current + 1)}
            >
              {actorsLoading ? "Loading actors..." : "Load more actors"}
            </button>
          </div>
        )}
        <div ref={sentinelRef} className="movies-scroll-sentinel" aria-hidden="true" />
      </section>
    </main>
  );
}
