import { lookup, setDefaultResultOrder } from "node:dns";
import net from "node:net";
import { Pool as NeonPool, neonConfig } from "@neondatabase/serverless";
import { Pool as PgPool, type PoolConfig, type QueryResult, type QueryResultRow } from "pg";
import ws from "ws";

type AppPool = NeonPool | PgPool;

setDefaultResultOrder("ipv4first");
neonConfig.poolQueryViaFetch = false;
neonConfig.webSocketConstructor = ws;

const poolWrapped = Symbol.for("jokaflix.database.poolWrapped");

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
const isNeonConnection = normalizedConnectionString ? new URL(normalizedConnectionString).hostname.endsWith(".neon.tech") : false;
const useNeonServerless = process.env.NODE_ENV === "production" && isNeonConnection;
const poolKey = `${normalizedConnectionString ?? ""}:driver-${useNeonServerless ? "neon-serverless-ws" : isNeonConnection ? "pg-neon-pooler-ipv4" : "pg"}:timeout-15000:max-5`;

function findNestedError(error: unknown): Error | undefined {
  if (error instanceof Error) return error;
  if (!error || typeof error !== "object") return undefined;

  for (const symbol of Object.getOwnPropertySymbols(error)) {
    const value = (error as Record<symbol, unknown>)[symbol];
    if (value instanceof Error) return value;
  }

  return undefined;
}

function databaseErrorMessage(error: unknown) {
  const nested = findNestedError(error);
  if (nested) {
    const code = "code" in nested && typeof nested.code === "string" ? nested.code : undefined;
    return `Database connection failed${code ? ` (${code})` : ""}: ${nested.message || "connection error"}`;
  }

  if (error instanceof Error) {
    return `Database connection failed: ${error.message}`;
  }

  return "Database connection failed before the auth query could complete.";
}

function normalizeDatabaseError(error: unknown) {
  const normalized = new Error(databaseErrorMessage(error), { cause: error });
  normalized.name = "JokaFlixDatabaseError";
  return normalized;
}

function wrapPool<T extends AppPool>(poolToWrap: T): T {
  const poolRecord = poolToWrap as unknown as {
    [poolWrapped]?: boolean;
    connect?: (...args: unknown[]) => unknown;
    query?: (...args: unknown[]) => unknown;
  };

  if (poolRecord[poolWrapped]) return poolToWrap;
  poolRecord[poolWrapped] = true;

  const originalQuery = poolRecord.query?.bind(poolToWrap);
  if (originalQuery) {
    poolRecord.query = (...args: unknown[]) => {
      try {
        const result = originalQuery(...args);
        if (result && typeof (result as Promise<unknown>).then === "function") {
          return (result as Promise<unknown>).catch((error) => {
            throw normalizeDatabaseError(error);
          });
        }
        return result;
      } catch (error) {
        throw normalizeDatabaseError(error);
      }
    };
  }

  const originalConnect = poolRecord.connect?.bind(poolToWrap);
  if (originalConnect) {
    poolRecord.connect = (...args: unknown[]) => {
      try {
        const result = originalConnect(...args);
        if (result && typeof (result as Promise<unknown>).then === "function") {
          return (result as Promise<unknown>)
            .then((client) => wrapPoolClient(client))
            .catch((error) => {
              throw normalizeDatabaseError(error);
            });
        }
        return result;
      } catch (error) {
        throw normalizeDatabaseError(error);
      }
    };
  }

  return poolToWrap;
}

function wrapPoolClient(client: unknown) {
  const clientRecord = client as {
    [poolWrapped]?: boolean;
    query?: (...args: unknown[]) => unknown;
  };

  if (!clientRecord || typeof clientRecord !== "object" || clientRecord[poolWrapped]) return client;
  clientRecord[poolWrapped] = true;

  const originalQuery = clientRecord.query?.bind(client);
  if (originalQuery) {
    clientRecord.query = (...args: unknown[]) => {
      try {
        const result = originalQuery(...args);
        if (result && typeof (result as Promise<unknown>).then === "function") {
          return (result as Promise<unknown>).catch((error) => {
            throw normalizeDatabaseError(error);
          });
        }
        return result;
      } catch (error) {
        throw normalizeDatabaseError(error);
      }
    };
  }

  return client;
}

function createNeonPgPoolConfig(value: string): PoolConfig {
  const url = new URL(value);
  const poolerHost = url.hostname.replace(/^(ep-[^.]+)\./, "$1-pooler.");
  const port = Number(url.port || 5432);

  return {
    host: poolerHost,
    port,
    database: url.pathname.slice(1),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
    idleTimeoutMillis: 30000,
    max: 5,
    stream: () => {
      const socket = new net.Socket();
      const originalConnect = socket.connect.bind(socket);

      socket.connect = ((connectPort: number, _host?: string | (() => void), listener?: () => void) => {
        const callback = typeof _host === "function" ? _host : listener;

        lookup(poolerHost, { family: 4 }, (error, address) => {
          if (error) {
            socket.destroy(error);
            return;
          }
          originalConnect(connectPort || port, address, callback);
        });

        return socket;
      }) as typeof socket.connect;

      return socket;
    },
  };
}

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

  if (isNeonConnection && normalizedConnectionString) {
    const pgPool = new PgPool(createNeonPgPoolConfig(normalizedConnectionString));
    pgPool.on("error", (error: Error) => {
      console.error("[JokaFlix database] Neon Postgres pool error", error);
    });
    return pgPool;
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
    : wrapPool(createPool());

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
    alter table if exists "user"
      add column if not exists role text not null default 'user';

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

    create table if not exists analytics_events (
      id text primary key,
      event_type text not null,
      media_type text,
      tmdb_id text,
      title text,
      category text,
      user_id text references "user"(id) on delete set null,
      visitor_id text,
      pathname text,
      metadata jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );

    create index if not exists analytics_events_created_at_idx
      on analytics_events (created_at desc);

    create index if not exists analytics_events_movie_click_idx
      on analytics_events (event_type, media_type, tmdb_id, created_at desc);

    create index if not exists analytics_events_visitor_idx
      on analytics_events (coalesce(user_id, visitor_id), created_at desc);

    create table if not exists admin_reports (
      id text primary key,
      report_type text not null,
      format text not null,
      title text not null,
      generated_by text references "user"(id) on delete set null,
      template_id text,
      duration text not null default 'last_30_days',
      sections jsonb not null default '[]'::jsonb,
      row_count integer not null default 0,
      created_at timestamptz not null default now()
    );

    alter table admin_reports
      add column if not exists template_id text,
      add column if not exists duration text not null default 'last_30_days',
      add column if not exists sections jsonb not null default '[]'::jsonb;

    create index if not exists admin_reports_created_at_idx
      on admin_reports (created_at desc);

    create table if not exists admin_report_templates (
      id text primary key,
      name text not null,
      description text,
      report_type text not null,
      sections jsonb not null default '[]'::jsonb,
      fields jsonb not null default '[]'::jsonb,
      duration text not null default 'last_30_days',
      ai_prompt text,
      template_body text not null,
      created_by text references "user"(id) on delete set null,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );

    create index if not exists admin_report_templates_created_at_idx
      on admin_report_templates (created_at desc);
  `);
}

let appSchemaPromise: Promise<void> | null = null;

export function ensureAppSchemaOnce() {
  appSchemaPromise ??= ensureAppSchema().catch((error) => {
    appSchemaPromise = null;
    throw error;
  });
  return appSchemaPromise;
}
