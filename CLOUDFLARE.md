# Cloudflare Runbook (Mr Brij — Workers + D1 + Astro SSR)

Full-stack blog on **Cloudflare Workers** with **D1** and **Astro SSR**. API routes (`/api/*`, `/auth/*`) run in a custom Hono worker; pages are server-rendered by Astro.

**Target URL:** `https://mr-brij.bps-brijendra.workers.dev`

---

## Architecture

```
Browser
  │
  ▼
Cloudflare Worker (worker/index.ts)
  ├── /health, /api, /api/*, /auth/*  →  Hono API + D1
  └── /*                               →  Astro SSR (dist/_worker.js)
          │
          ▼
    D1 Database (mr-brij-db)
```

| Layer | Technology | Location |
| ----- | ---------- | -------- |
| Pages | Astro 6 SSR | `src/pages/` |
| API | Hono + express adapter | `worker/hono-app.ts` |
| Controllers | Shared Express handlers | `backend/src/controllers/` |
| Database (production) | Cloudflare D1 | `migrations/` |
| Database (local) | SQLite | `data/mr-brij.sqlite` |
| Astro sessions | KV `SESSION` | Required for Astro v6 SSR |
| Astro images | `IMAGES` binding | Cloudflare Images |

---

## Prerequisites

- Cloudflare account with Workers enabled
- Node.js ≥ 22
- Wrangler CLI (`npx wrangler`)

### Authentication

| Method | When |
| ------ | ---- |
| `CLOUDFLARE_API_TOKEN` | CI, scripts (store in `../cloudflare.txt` locally — **never commit**) |
| `npx wrangler login` | First-time local setup |

**Minimum API token scopes:** Workers Scripts Edit, D1 Edit

---

## One-time setup

### 1. Create D1 database

```bash
export CLOUDFLARE_API_TOKEN="$(cat ../cloudflare.txt)"
chmod +x scripts/setup-cloudflare-d1.sh
./scripts/setup-cloudflare-d1.sh
```

Commit the real `database_id` in `worker/wrangler.toml` (replace `PLACEHOLDER`).

### 2. OAuth secrets (required for sign-in / admin)

**Google Cloud Console** → [APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials):

1. **Create project** (or pick existing).
2. **OAuth consent screen** → External → add your email as test user if in Testing mode.
3. **Create credentials** → **OAuth client ID** → Application type **Web application**.
4. **Authorized redirect URIs** (add both):
   - `https://mr-brij.bps-brijendra.workers.dev/auth/google/callback`
   - `http://localhost:8787/auth/google/callback`
5. Copy **Client ID** and **Client secret**.

**GitHub** (optional): [Developer settings → OAuth Apps](https://github.com/settings/developers) → callback `https://mr-brij.bps-brijendra.workers.dev/auth/github/callback`.

Upload secrets to the worker (interactive):

```bash
chmod +x scripts/setup-oauth-secrets.sh
./scripts/setup-oauth-secrets.sh
```

Or manually:

```bash
cd worker
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GITHUB_CLIENT_ID   # optional
npx wrangler secret put GITHUB_CLIENT_SECRET
cd .. && npm run deploy:cloudflare
```

Until secrets are set, `/auth/google` shows a setup page instead of redirecting to Google with `client_id=undefined`.

### 3. Cloudflare Builds (dashboard)

**Workers & Pages → mr-brij → Settings → Builds:**

| Setting | Value |
| ------- | ----- |
| Root directory | `/` |
| Build command | `npm run build:cloudflare` |
| Deploy command | `npm run db:migrate:remote --workspace=worker && npm run db:seed:remote --workspace=worker && npm run deploy --workspace=worker` |

Add encrypted `CLOUDFLARE_API_TOKEN` in dashboard Variables for CI.

### 4. Seed content (local then remote)

```bash
npm install
npm run seed                    # local SQLite
npm run db:seed:remote          # remote D1 (idempotent; also runs on deploy)
```

**D1 migration note:** Never use `PRAGMA foreign_keys = OFF` in migrations — D1 ignores it. Table swaps that `DROP TABLE users` must use `PRAGMA defer_foreign_keys = ON` or posts are CASCADE-deleted. `deploy:cloudflare` re-runs seed after migrate to restore canonical posts if wiped.

---

## Deploy

```bash
export CLOUDFLARE_API_TOKEN="$(cat ../cloudflare.txt)"
npm run deploy:cloudflare
```

**Full pipeline documentation:** [DEPLOY.md](./DEPLOY.md) — build steps, D1 migrate/seed, worker upload, CI vs manual, rollback, troubleshooting.

---

## Local development

```bash
# Terminal 1 — API + SQLite
npm run dev:api

# Terminal 2 — Astro (proxies /api to :3001)
npm run dev:astro

# Seed posts into local SQLite
npm run seed
```

**Worker + local D1 (production parity):**

```bash
npm run build:cloudflare
cd worker && npm run db:migrate:local && npm run dev:worker
```

---

## Verification

```bash
curl -s https://mr-brij.bps-brijendra.workers.dev/health | jq .
curl -s https://mr-brij.bps-brijendra.workers.dev/api/posts | jq .
curl -s "https://mr-brij.bps-brijendra.workers.dev/api/search?q=automation" | jq .
```

---

## Key files

| File | Purpose |
| ---- | ------- |
| `worker/wrangler.toml` | Worker name, D1 binding, account_id |
| `worker/index.ts` | Routes API vs Astro SSR |
| `worker/hono-app.ts` | All `/api/*` routes |
| `migrations/0001_initial.sql` | Schema |
| `scripts/setup-cloudflare-d1.sh` | D1 bootstrap |
| `scripts/seed-posts-from-markdown.mjs` | Import legacy Markdown posts |

---

## Security

- Never commit `CLOUDFLARE_API_TOKEN` or OAuth secrets
- `ADMIN_EMAILS` in `wrangler.toml` controls who gets admin role on OAuth login
- Rotate tokens shared in chat or logs

---

## Roles

| Role | Access |
| ---- | ------ |
| Anonymous | Read, search published posts |
| Reader | Comment, react, subscribe (OAuth) |
| Author | Write own drafts, submit for review |
| Admin (Mr Brij) | Publish, moderate, edit any post |
