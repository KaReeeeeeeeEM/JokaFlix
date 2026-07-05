## Environment Variables

JokaFlix uses TMDB for catalog metadata and a configurable download source for movie and series files.

```env
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key

DATABASE_URL=postgresql://user:password@host/database?sslmode=require
BETTER_AUTH_SECRET=replace_with_a_long_random_secret
BETTER_AUTH_URL=https://your-domain.example
NEXT_PUBLIC_APP_URL=https://your-domain.example
BETTER_AUTH_RP_ID=your-domain.example
SUPERADMIN_EMAIL=superadmin@jokaflix.local
SUPERADMIN_USERNAME=superadmin
SUPERADMIN_NAME=JokaFlix Superadmin
SUPERADMIN_PASSWORD=replace_with_a_strong_admin_password
OPENAI_API_KEY=optional_openai_api_key_for_ai_manager
OPENAI_MODEL=gpt-4.1-mini

# Email verification through Nodemailer Gmail SMTP.
GMAIL_USER=your_gmail_address@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password
EMAIL_FROM_NAME=JokaFlix

MOVIE_DOWNLOAD_BASE_URL=https://your-download-source.example/movies/{id}/{quality}.mp4
SERIES_DOWNLOAD_BASE_URL=https://your-download-source.example/series/{id}/season-{season}/{quality}.mp4
```

Run database migrations after setting `DATABASE_URL`:

```bash
pnpm db:migrate
```

Seed or promote a superadmin account after migrations:

```bash
SUPERADMIN_PASSWORD='replace_with_a_strong_admin_password' pnpm db:seed:superadmin
```

`OPENAI_API_KEY` is optional. When it is missing, the admin AI Manager still answers from live JokaFlix analytics using deterministic database summaries.

The download API supports these placeholders:

- `{id}` or `{tmdbId}`: TMDB title id
- `{quality}`: `1080p`, `720p`, or `480p`
- `{season}`: season number for series downloads
- `{mediaType}` or `{type}`: `movie` or `tv`

If one provider handles both movies and series with the same URL shape, use:

```env
NEXT_PUBLIC_DOWNLOAD_BASE_URL=https://your-download-source.example/download
```

Without a configured download source, JokaFlix falls back to a local test file so the download UI can still be tested.
