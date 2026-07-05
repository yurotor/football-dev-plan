# עולים רמה ⚽ — Football Development Tracker

A single-page tracker for a young player's training, tests, records and streaks
(Hebrew / RTL). Data lives in **Upstash Redis** and syncs automatically across
every device that opens the app — no more manual file export/import.

## How it works

- `public/index.html` — the whole app (UI + logic). Uses `localStorage` as an
  **offline cache** so it keeps working with no connection.
- `api/data.js` — a Vercel serverless function:
  - `GET /api/data` → returns the saved state `{ player, sessions, tests }`
  - `POST /api/data` → saves the full state (validated) to Redis
- On load the app pulls the server state, **merges** it with anything stored
  locally (union by id, local edits win), re-renders, then pushes the union
  back. Every change is saved locally instantly and pushed to the server
  (debounced ~0.7s). The ☁️ icon in the header shows sync status.

There is **one shared dataset** and no login — anyone with the URL can view and
edit it. Keep the URL private.

## One-time setup

### 1. Provision Upstash Redis (via Vercel — easiest)

1. In the Vercel dashboard: **Storage → Create Database → Upstash for Redis**
   (or add it from the Marketplace) and connect it to this project.
2. Vercel injects the credentials as env vars automatically
   (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — or the `KV_REST_API_*`
   equivalents; the function accepts either).

Alternatively, create a database at [upstash.com](https://upstash.com), copy the
**REST URL** and **REST TOKEN**, and set them as project env vars.

### 2. Deploy

```bash
npm i -g vercel      # if needed
vercel               # preview deploy
vercel --prod        # production
```

Vercel auto-detects `public/` (static) and `api/` (functions) — no build step.

## Local development

```bash
cp .env.example .env.local   # fill in your Upstash REST URL + token
npm install
vercel dev                   # serves the app + /api/data locally
```

> Opening `public/index.html` directly as a file also works — it just runs in
> offline mode (localStorage only), since `/api/data` isn't available.

## Notes

- Deletions apply on the device that made them and propagate when that device
  next syncs. If two devices edit while offline at the same time, the union of
  both is kept (nothing silently lost) — matching the app's original "merge"
  philosophy.
- `progress-app.html` is the original pre-database version, kept for reference.
  The live app is `public/index.html`.
