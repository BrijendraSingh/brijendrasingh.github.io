# Mr. Brij — Community Blog Platform

**Mr. Brij** is a community blog for software quality practitioners — test leads, QAs, engineers, and managers who care about test strategy, automation, and building quality into software teams.

**Live:** https://mr-brij.bps-brijendra.workers.dev  
**Source:** https://github.com/BrijendraSingh/brijendrasingh.github.io/tree/dynamic-web

## Purpose

Mr. Brij exists to share practical lessons on software testing and quality — not theory alone, but experience from real projects. The platform is open to readers and contributors:

- **Read** — articles on test strategy, automation, mobile testing, microservices, and quality culture
- **Discuss** — comments and reader engagement on every published post
- **Write** — sign in, draft an article, and submit it for community review before publication

We believe quality improves when practitioners learn from each other. Mr. Brij is built for that exchange.

## Who it's for

- QA engineers and test leads designing test strategy
- Engineers adopting automation and CI/CD quality gates
- Managers building a defect-prevention mindset in their teams
- Anyone who wants practical, practitioner-written content on software quality

## Topics we cover

- Test Strategy
- Test Automation
- Mobile Testing
- API & Microservices Testing
- Quality Culture & Defect Prevention
- CI/CD Quality Gates

## How it works

1. **Readers** browse articles, search the archive, and join discussions.
2. **Contributors** sign in (OAuth), open **Write**, and draft a new article.
3. **Review** — submitted articles go through a moderation queue.
4. **Publish** — approved articles appear on the blog for the community.

## Tech stack

Full-stack blog on **Cloudflare Workers + D1** with **Astro 6 SSR**, Hono API, OAuth, and a D1-backed CMS.

| Layer | Technology |
|-------|------------|
| Frontend | Astro 6, React islands, Tailwind CSS |
| API | Hono (Node locally, Workers in production) |
| Database | Cloudflare D1 (SQLite locally) |
| Auth | Google / GitHub OAuth |
| Hosting | Cloudflare Workers |

## Local development

```bash
npm install
npm run dev      # Astro :4321 + API :3001 (SQLite)
npm run build
npm run preview
```

Open http://localhost:4321/ to verify changes locally.

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

All platform and contact links live in `src/config/site.ts` — never hardcode in components.

- **Platform links** (`site.platform`) — footer and public About page
- **Maintainer info** (`site.maintainer`) — credits page only (`/credits/`, linked via footer easter egg)

## Agent ecosystem

See [AGENTS.md](AGENTS.md) for workspace skills, subagents, and rules.
