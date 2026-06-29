## Environment Variables

JokaFlix uses TMDB for catalog metadata and a configurable download source for movie and series files.

```env
NEXT_PUBLIC_TMDB_API_KEY=your_tmdb_api_key

MOVIE_DOWNLOAD_BASE_URL=https://your-download-source.example/movies/{id}/{quality}.mp4
SERIES_DOWNLOAD_BASE_URL=https://your-download-source.example/series/{id}/season-{season}/{quality}.mp4
```

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
