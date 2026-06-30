import { setDefaultResultOrder } from "node:dns";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { Pool as PgPool, type QueryResult, type QueryResultRow } from "pg";

type AppPool = NeonPool | PgPool;

setDefaultResultOrder("ipv4first");
neonConfig.poolQueryViaFetch = true;

declare global {
  // eslint-disable-next-line no-var
  var jokaflixPool: AppPool | undefined;
  // eslint-disable-next-line no-var
  var jokaflixPoolKey: string | undefined;
}

const connectionString = process.env.DATABASE_URL;

function normalizeConnectionString(value: string | undefined) {
  if (!value) return value;

  const url = new URL(value);
  const sslMode = url.searchParams.get("sslmode");
  if (sslMode === "prefer" || sslMode === "require" || sslMode === "verify-ca") {
    url.searchParams.set("sslmode", "verify-full");
  }
  return url.toString();
}

const normalizedConnectionString = normalizeConnectionString(connectionString);
const useNeonServerless = normalizedConnectionString ? new URL(normalizedConnectionString).hostname.endsWith(".neon.tech") : false;
const poolKey = `${normalizedConnectionString ?? ""}:driver-${useNeonServerless ? "neon-serverless" : "pg"}:timeout-15000:max-5`;

function createPool() {
  if (useNeonServerless) {
    const neonPool = new NeonPool({
      connectionString: normalizedConnectionString,
    });
    neonPool.on("error", (error: Error) => {
      console.error("[JokaFlix database] Neon pool error", error);
    });
    return neonPool;
  }

  const pgPool = new PgPool({
    connectionString: normalizedConnectionString,
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    max: 5,
  });
  pgPool.on("error", (error: Error) => {
    console.error("[JokaFlix database] Postgres pool error", error);
  });
  return pgPool;
}

export const pool =
  globalThis.jokaflixPoolKey === poolKey && globalThis.jokaflixPool
    ? globalThis.jokaflixPool
    : createPool();

if (process.env.NODE_ENV !== "production") {
  globalThis.jokaflixPool = pool;
  globalThis.jokaflixPoolKey = poolKey;
}

export async function query<T extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const result = await (pool as { query: (queryText: string, values: unknown[]) => Promise<QueryResult<T>> }).query(text, params);
  return result;
}

export async function ensureAppSchema() {
  await query(`
    create table if not exists user_profiles (
      user_id text primary key references "user"(id) on delete cascade,
      nationality text,
      gender text,
      avatar_url text,
      passkey_prompted boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    alter table user_profiles
      add column if not exists avatar_url text;

    create table if not exists user_title_ratings (
      user_id text not null references "user"(id) on delete cascade,
      media_type text not null check (media_type in ('movie', 'tv')),
      tmdb_id text not null,
      rating numeric(3,1) not null check (rating >= 0 and rating <= 10),
      comment text,
      title text,
      poster_path text,
      backdrop_path text,
      genres text[] not null default '{}',
      updated_at timestamptz not null default now(),
      primary key (user_id, media_type, tmdb_id)
    );

    create table if not exists user_episode_ratings (
      user_id text not null references "user"(id) on delete cascade,
      tmdb_id text not null,
      season integer not null,
      episode integer not null,
      rating numeric(3,1) not null check (rating >= 0 and rating <= 10),
      comment text,
      series_title text,
      episode_title text,
      still_path text,
      updated_at timestamptz not null default now(),
      primary key (user_id, tmdb_id, season, episode)
    );

    create table if not exists user_watch_later (
      user_id text not null references "user"(id) on delete cascade,
      media_type text not null check (media_type in ('movie', 'tv')),
      tmdb_id text not null,
      title text not null,
      poster_path text,
      backdrop_path text,
      genres text[] not null default '{}',
      created_at timestamptz not null default now(),
      primary key (user_id, media_type, tmdb_id)
    );

    create table if not exists user_watch_history (
      user_id text not null references "user"(id) on delete cascade,
      media_type text not null check (media_type in ('movie', 'tv')),
      tmdb_id text not null,
      title text,
      poster_path text,
      backdrop_path text,
      season integer not null default 0,
      episode integer not null default 0,
      progress_seconds integer not null default 0,
      duration_seconds integer,
      watched_at timestamptz not null default now(),
      primary key (user_id, media_type, tmdb_id, season, episode)
    );

    create index if not exists user_watch_history_recent_idx
      on user_watch_history (user_id, watched_at desc);
  `);
}
