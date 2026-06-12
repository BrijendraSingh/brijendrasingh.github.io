# Deployment guide — Mr Brij

How code reaches **https://mr-brij.bps-brijendra.workers.dev** (Cloudflare Workers + D1).

For one-time Cloudflare setup (D1, OAuth, secrets), see [CLOUDFLARE.md](./CLOUDFLARE.md).

---

## Overview

Mr Brij is a **monorepo** deployed as a **single Cloudflare Worker** that serves:

| Traffic | Handler | Built from |
| ------- | ------- | ---------- |
| `/api/*`, `/auth/*`, `/health` | Hono API (`worker/hono-app.ts`) | TypeScript worker bundle |
| Everything else (`/`, `/blog/*`, …) | Astro 6 SSR | `dist/server/entry.mjs` + static assets |

Production data lives in **Cloudflare D1** (`mr-brij-db`). Local dev can use **SQLite** (`data/mr-brij.sqlite`) via the Express API.

```
npm run deploy:cloudflare
        │
        ├─ 1. build:shared      → compile @mr-brij/shared
        ├─ 2. astro build       → dist/client + dist/server (SSR worker)
        ├─ 3. db:migrate:remote → apply pending SQL migrations to D1
        ├─ 4. db:seed:remote    → idempotent seed (canonical blog posts)
        └─ 5. wrangler deploy   → upload worker + assets to Cloudflare
```

---

## Manual deploy (local machine)

### Prerequisites

- Node.js ≥ 22
- `npm install` at repo root
- `CLOUDFLARE_API_TOKEN` with **Workers Scripts Edit** and **D1 Edit**
- OAuth secrets already set on the worker (see [CLOUDFLARE.md](./CLOUDFLARE.md))

### Command

```bash
export CLOUDFLARE_API_TOKEN="$(cat ../cloudflare.txt)"   # never commit this file
npm run deploy:cloudflare
```

### What each step does

#### 1. `npm run build:shared`

Compiles the `shared/` workspace (types, constants, permissions) used by both frontend and backend.

#### 2. `astro build` (via `build:cloudflare`)

- Output mode: **server** (`astro.config.mjs`)
- Adapter: `@astrojs/cloudflare` — produces SSR entry at `dist/server/entry.mjs`
- Static client assets: `dist/client/` (CSS, JS, images)
- React islands, MDX, Tailwind are bundled into the Astro build

#### 3. `npm run db:migrate:remote --workspace=worker`

Runs:

```bash
wrangler d1 migrations apply mr-brij-db --remote
```

- Reads SQL files from `migrations/` (configured in `worker/wrangler.toml`)
- Applies only **new** migrations (tracked in D1’s `d1_migrations` table)
- **Important:** D1 ignores `PRAGMA foreign_keys = OFF`. Migrations that swap tables must use `PRAGMA defer_foreign_keys = ON` or dependent rows (e.g. posts) can be CASCADE-deleted. See [CLOUDFLARE.md](./CLOUDFLARE.md#4-seed-content-local-then-remote).

#### 4. `npm run db:seed:remote --workspace=worker`

Runs:

```bash
wrangler d1 execute mr-brij-db --remote --file=../scripts/seed-remote.sql
```

- **Idempotent** — uses `INSERT OR IGNORE` for users, posts, tags
- Restores the 9 canonical legacy blog posts if they were wiped (e.g. by a bad migration)
- Does **not** overwrite existing posts with the same IDs
- User-authored content (new post IDs) is untouched

#### 5. `npm run deploy --workspace=worker`

Runs `wrangler deploy` using `worker/wrangler.toml`:

| Binding | Purpose |
| ------- | ------- |
| `DB` | D1 database `mr-brij-db` |
| `SESSION` | KV namespace for Astro SSR sessions |
| `IMAGES` | Cloudflare Images |
| `ASSETS` | `dist/client` static files |
| `ADMIN_EMAILS` | Env var — admin role on OAuth login |

The worker entry (`worker/index.ts`) routes requests:

```text
/health, /api/*, /auth/*  →  Hono (Express controllers + D1)
/*                        →  Astro SSR (dist/server/entry.mjs)
```

`run_worker_first` in `wrangler.toml` ensures API routes hit the worker before the asset handler.

---

## CI deploy (Cloudflare Builds)

Optional dashboard pipeline — **Workers & Pages → mr-brij → Settings → Builds**:

| Setting | Value |
| ------- | ----- |
| Root directory | `/` |
| Build command | `npm run build:cloudflare` |
| Deploy command | `npm run db:migrate:remote --workspace=worker && npm run db:seed:remote --workspace=worker && npm run deploy --workspace=worker` |

Add encrypted `CLOUDFLARE_API_TOKEN` as a build variable.

**Note:** CI deploy does **not** run the full `deploy:cloudflare` script — it skips the redundant second `build:cloudflare` because the build step already compiled Astro. Migrations, seed, and `wrangler deploy` run in the deploy phase.

---

## npm scripts reference

| Script | Description |
| ------ | ----------- |
| `npm run deploy:cloudflare` | Full production deploy (build + migrate + seed + wrangler) |
| `npm run build:cloudflare` | Build shared + Astro only |
| `npm run db:migrate:remote` | Apply D1 migrations on production |
| `npm run db:migrate:local` | Apply D1 migrations on local Wrangler D1 |
| `npm run db:seed:remote` | Seed production D1 with canonical posts |
| `npm run seed` | Seed **local SQLite** from Markdown (`scripts/seed-posts-from-markdown.mjs`) |
| `npm run dev` | Local Astro + Express API (SQLite) |
| `npm run dev:worker` | Wrangler dev with local D1 (production parity) |

---

## Local dev vs production

| | Local (`npm run dev`) | Production |
| - | --------------------- | ---------- |
| Frontend | Astro `:4321` | Worker + Astro SSR |
| API | Express `:3001` | Hono in Worker |
| Database | SQLite `data/mr-brij.sqlite` | D1 `mr-brij-db` |
| Auth secrets | `.env` (gitignored) | Wrangler secrets |
| Deploy needed? | No — hot reload | Yes — `deploy:cloudflare` |

Astro proxies `/api`, `/auth`, `/health` to `localhost:3001` during local dev (`astro.config.mjs`).

**Local changes do not affect production** until you deploy. The remote D1 database is independent of local SQLite.

---

## Verification after deploy

```bash
curl -s https://mr-brij.bps-brijendra.workers.dev/health
curl -s https://mr-brij.bps-brijendra.workers.dev/api/posts | jq '.data.pagination.total'
```

Open the site, sign in, and confirm Write / Admin flows if you changed auth or API routes.

Tail live worker logs:

```bash
cd worker && npm run tail
```

---

## Adding a database migration

1. Create `migrations/0005_your_change.sql` (incrementing number).
2. For table rewrites on D1, start with `PRAGMA defer_foreign_keys = ON` and end with `PRAGMA defer_foreign_keys = OFF`.
3. Test locally: `npm run db:migrate:local --workspace=worker`
4. Deploy: `npm run deploy:cloudflare` (applies migration to remote D1 automatically).

Never edit a migration that has already been applied to production — add a new file instead.

---

## Rollback

Cloudflare Workers keeps version history in the dashboard (**Workers & Pages → mr-brij → Deployments**). You can roll back the **worker code** to a previous deployment instantly.

**D1 migrations are not auto-reverted** on rollback. If a migration caused data issues:

- Restore from D1 backup (Cloudflare dashboard → D1 → Backups), or
- Re-run seed: `npm run db:seed:remote` (restores canonical posts only), or
- Run corrective SQL via `wrangler d1 execute mr-brij-db --remote --command "..."`

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| ------- | ------------ | --- |
| Blog shows “No posts yet” | D1 `posts` table empty | `npm run db:seed:remote` |
| Posts vanished after deploy | Migration used `foreign_keys=OFF` on D1 | Fix migration SQL; re-seed; deploy uses idempotent seed |
| `client_id=undefined` on Google login | OAuth secrets not set | `wrangler secret put GOOGLE_CLIENT_ID` etc. |
| Old API behavior after code change | Stale `worker/*.js` shadowing `.ts` | Delete stale `.js` files; redeploy |
| Local OAuth 404 | Redirect URI not in Google Console | Add `http://localhost:4321/auth/google/callback` |
| 401 on admin while header shows user | Session/API mismatch | Hard refresh; check cookies on workers.dev domain |

---

## Security checklist

- Never commit `CLOUDFLARE_API_TOKEN`, `.env`, `ggl.txt`, or OAuth JSON files
- Rotate tokens if exposed in logs or chat
- `ADMIN_EMAILS` in `wrangler.toml` controls who receives admin role on login
- Production secrets live in Wrangler (`wrangler secret list`), not in git

---

## Related docs

- [CLOUDFLARE.md](./CLOUDFLARE.md) — architecture, one-time setup, OAuth, roles
- [worker/wrangler.toml](./worker/wrangler.toml) — bindings and worker config
- [migrations/](./migrations/) — database schema history
