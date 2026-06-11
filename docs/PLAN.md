# Mr. Brij Personal Website — Build Plan

Approved plan for rebuilding https://brijendrasingh.github.io/ as Astro + GitHub Pages.

## Locked Decisions

| Item | Value |
|------|-------|
| Stack | Astro 5 + TypeScript + Tailwind CSS |
| Hosting | GitHub Pages (free) |
| Design | Professional & minimal |
| Blog workflow | Markdown in `src/content/blog/` → `git push` |
| Content | Migrate all 9 Jekyll posts |
| Resume | Inline web page + PDF download |
| LinkedIn | https://www.linkedin.com/in/brijendrapsingh/ |

## Contact Config

Single source: `src/config/site.ts` (template: `references/site-config.ts`)

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Home — hero, latest posts, CTAs |
| `/about` | Bio, expertise, contact |
| `/resume` | Web resume + PDF download |
| `/blog` | Post listing |
| `/blog/{slug}` | Individual posts |
| `/archive` | Chronological archive |

## Phases

1. **Scaffold** — Astro + Tailwind + content collections + `site.ts`
2. **Layouts & pages** — Components, Home, About, Resume, Blog, Archive, 404
3. **Migration** — 9 Jekyll posts, images, legacy `/posts/` redirects
4. **Resume** — Structured sections + `public/resume.pdf`
5. **SEO** — Sitemap, RSS, OG, JSON-LD, robots.txt
6. **Deploy** — `.github/workflows/deploy.yml`, Pages → GitHub Actions
7. **Polish** — Lighthouse, link audit, README, remove old Jekyll files

## Post Migration Map

See `.cursor/skills/jekyll-to-astro-migration/references/post-migration-map.json`

Run redirects: `node scripts/generate-redirects.mjs`

## Definition of Done

- [ ] `npm run build` passes
- [ ] All routes render
- [ ] LinkedIn correct everywhere
- [ ] 9 posts migrated + redirects work
- [ ] Resume + PDF download
- [ ] RSS + sitemap
- [ ] GitHub Actions deploys on push
- [ ] README documents blog workflow

## Agent Ecosystem

See `AGENTS.md` and `.cursor/skills/skill-orchestrator/references/skill-registry.md`
