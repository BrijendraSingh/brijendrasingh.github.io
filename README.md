# Mr. Brij — Personal Website

Personal brand site for **Brijendra Singh** — software quality practitioner.

**Live:** https://mr-brij.bps-brijendra.workers.dev

Full-stack blog on **Cloudflare Workers + D1** with **Astro 6 SSR**, Hono API, OAuth, and a D1-backed CMS.

## Local development

```bash
npm install
npm run dev      # Astro :4321 + API :3001 (SQLite)
npm run build
npm run preview
```

## Deploy to production

```bash
export CLOUDFLARE_API_TOKEN="$(cat ../cloudflare.txt)"
npm run deploy:cloudflare
```

See **[DEPLOY.md](./DEPLOY.md)** for the full pipeline (build → migrate → seed → wrangler), CI setup, rollback, and troubleshooting.

Cloudflare one-time setup (D1, OAuth secrets): **[CLOUDFLARE.md](./CLOUDFLARE.md)**.

## Publish a new blog post

1. Sign in → **Write** → **New article**
2. Save draft → **Submit for review**
3. Admin approves in **Admin** → moderation queue

Legacy Markdown posts under `src/content/blog/` were imported into D1; new posts are authored in the CMS, not git.

## Site config

All contact links live in `src/config/site.ts` — never hardcode in components.

## Agent ecosystem

See [AGENTS.md](AGENTS.md) for workspace skills, subagents, and rules.

## Resume PDF

Replace `public/resume.pdf` with your actual resume file.
