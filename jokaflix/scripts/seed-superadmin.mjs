import { randomBytes, randomUUID } from "node:crypto";
import dns from "node:dns/promises";
import fs from "node:fs";
import path from "node:path";
import { hashPassword } from "better-auth/crypto";
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
  console.error("DATABASE_URL is required to seed the superadmin account.");
  process.exit(1);
}

const email = (process.env.SUPERADMIN_EMAIL || "superadmin@jokaflix.local").trim().toLowerCase();
const usernameInput = (process.env.SUPERADMIN_USERNAME || "superadmin").trim();
const username = usernameInput.toLowerCase();
const displayUsername = usernameInput;
const name = (process.env.SUPERADMIN_NAME || "JokaFlix Superadmin").trim();
const generatedPassword = !process.env.SUPERADMIN_PASSWORD;
const password = process.env.SUPERADMIN_PASSWORD || randomBytes(18).toString("base64url");

if (password.length < 10) {
  console.error("SUPERADMIN_PASSWORD must be at least 10 characters.");
  process.exit(1);
}

async function createPoolConfig(value) {
  const url = new URL(value);
  const isNeon = url.hostname.endsWith(".neon.tech");

  if (!isNeon) {
    return {
      connectionString: value,
      ssl: value.includes("sslmode=require") ? { rejectUnauthorized: false } : undefined,
    };
  }

  const poolerHost = url.hostname.replace(/^(ep-[^.]+)\./, "$1-pooler.");
  const address = (await dns.lookup(poolerHost, { all: true, family: 4 }))[0]?.address;

  if (!address) {
    throw new Error(`Could not resolve an IPv4 address for ${poolerHost}.`);
  }

  return {
    host: address,
    port: Number(url.port || 5432),
    database: url.pathname.slice(1),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: { rejectUnauthorized: false, servername: poolerHost },
    connectionTimeoutMillis: 12000,
    max: 1,
  };
}

const pool = new Pool(await createPoolConfig(connectionString));

try {
  await pool.query(`
    create table if not exists "user" (
      id text primary key,
      name text not null,
      email text not null unique,
      "emailVerified" boolean not null default false,
      image text,
      "createdAt" timestamptz not null default now(),
      "updatedAt" timestamptz not null default now(),
      username text unique,
      "displayUsername" text,
      nationality text,
      gender text
    );

    alter table if exists "user"
      add column if not exists role text not null default 'user';

    create table if not exists account (
      id text primary key,
      "accountId" text not null,
      "providerId" text not null,
      "userId" text not null references "user"(id) on delete cascade,
      "accessToken" text,
      "refreshToken" text,
      "idToken" text,
      "accessTokenExpiresAt" timestamptz,
      "refreshTokenExpiresAt" timestamptz,
      scope text,
      password text,
      "createdAt" timestamptz not null default now(),
      "updatedAt" timestamptz not null default now()
    );

    create index if not exists account_user_id_idx
      on account ("userId");

    create table if not exists user_profiles (
      user_id text primary key references "user"(id) on delete cascade,
      nationality text,
      gender text,
      avatar_url text,
      passkey_prompted boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `);

  const existingUser = await pool.query(`select id from "user" where lower(email) = lower($1) limit 1`, [email]);
  const userId = existingUser.rows[0]?.id || randomUUID();
  const passwordHash = await hashPassword(password);

  if (existingUser.rows[0]) {
    await pool.query(
      `
        update "user"
        set name = $2,
            username = $3,
            "displayUsername" = $4,
            role = 'superadmin',
            "emailVerified" = true,
            "updatedAt" = now()
        where id = $1
      `,
      [userId, name, username, displayUsername]
    );
  } else {
    await pool.query(
      `
        insert into "user" (
          id, name, email, "emailVerified", image, "createdAt", "updatedAt", username, "displayUsername", nationality, gender, role
        )
        values ($1, $2, $3, true, null, now(), now(), $4, $5, null, null, 'superadmin')
      `,
      [userId, name, email, username, displayUsername]
    );
  }

  const existingAccount = await pool.query(`select id from account where "userId" = $1 and "providerId" = 'credential' limit 1`, [userId]);

  if (existingAccount.rows[0]?.id) {
    await pool.query(`update account set password = $2, "updatedAt" = now() where id = $1`, [existingAccount.rows[0].id, passwordHash]);
  } else {
    await pool.query(
      `
        insert into account (
          id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt"
        )
        values ($1, $2, 'credential', $2, $3, now(), now())
      `,
      [`credential_${userId}`, userId, passwordHash]
    );
  }

  await pool.query(
    `
      insert into user_profiles (user_id)
      values ($1)
      on conflict (user_id) do nothing
    `,
    [userId]
  );

  console.log("Superadmin account is ready.");
  console.log(`Email: ${email}`);
  console.log(`Username: ${username}`);
  if (generatedPassword) {
    console.log(`Generated password: ${password}`);
    console.log("Save this password now or rerun with SUPERADMIN_PASSWORD to set a known one.");
  } else {
    console.log("Password: from SUPERADMIN_PASSWORD");
  }
} finally {
  await pool.end();
}
