import { getMigrations } from "better-auth/db/migration";
import fs from "node:fs";
import path from "node:path";
import pg from "pg";

const { Pool } = pg;

function loadLocalEnv() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(envPath)) continue;

    for (const line of fs.readFileSync(envPath, "utf8").split(/\n/)) {
      const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  }
}

loadLocalEnv();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("DATABASE_URL is required to run migrations.");
  process.exit(1);
}

const { auth } = await import("../src/lib/auth.ts");

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
});

try {
  const { runMigrations } = await getMigrations(auth.options);
  await runMigrations();

  await pool.query(`
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

    alter table if exists user_title_ratings
      alter column rating type numeric(3,1);

    alter table if exists user_episode_ratings
      alter column rating type numeric(3,1);

    alter table if exists user_title_ratings
      add column if not exists comment text;

    alter table if exists user_episode_ratings
      add column if not exists comment text;

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

  console.log("Database migrations completed.");
} finally {
  await pool.end();
}
