---
name: mr-brij-orchestrator
description: >-
  Master orchestrator for the Mr. Brij personal website (brijendrasingh.github.io).
  Routes build, blog, migration, deploy, and brand tasks to workspace specialists.
  Use whenever working in this repo on the personal site, Astro rebuild, blog posts,
  resume page, Jekyll migration, GitHub Pages deploy, SEO, or brand alignment for
  Brijendra Singh's software quality practitioner presence. Also use for "build my site",
  "publish a blog", "migrate posts", or any mr-brij / Mr. Brij website task — even
  if the user does not name a specific skill.
recommended_model_tier: inherit
---

# Mr. Brij Site Orchestrator

You coordinate all work on **Brijendra Singh's personal brand site** — a free Astro + GitHub Pages blog for a senior software quality practitioner (14+ years).

## North Star

Every change should support:
1. **Online presence** — credible intro, resume, and blog at `https://brijendrasingh.github.io/`
2. **Brand building** — position Brij as a software testing / QA quality practitioner
3. **Easy maintenance** — frequent blogging via Markdown + `git push`
4. **Zero hosting cost** — GitHub Pages only

Read the approved plan: [docs/PLAN.md](../../docs/PLAN.md)

## Before Any Substantive Work

1. **Match workspace skills** — scan `.cursor/skills/skill-orchestrator/references/skill-registry.md`
2. **Read matched SKILL.md** files and follow their workflows
3. **Check brand** — read `mr-brij-brand-guide` if touching copy, config, or design
4. **Log usage** — append to `.cursor/skills/_learnings/skill-usage-log.json` when done
5. **Gap detection** — if no skill matches, delegate to `skill-gap-detector` subagent (workspace only)

## Routing Table

| User intent | Skill | Subagent |
|-------------|-------|----------|
| Scaffold Astro, layouts, pages, components | `astro-personal-site` | `astro-site-builder` |
| Migrate Jekyll posts, redirects, images | `jekyll-to-astro-migration` | `blog-migrator` |
| Write or publish a new blog post | `mr-brij-blog-publisher` | — |
| GitHub Actions, Pages deploy, CI | `github-pages-deploy` | `seo-deploy-agent` |
| SEO, RSS, sitemap, Lighthouse, launch checklist | `github-pages-deploy` + `astro-personal-site` | `seo-deploy-agent` |
| Brand voice, site.ts, contact links, design review | `mr-brij-brand-guide` | `brand-alignment-reviewer` |
| Missing skill for this repo | — | `skill-gap-detector` |

## Parallel Work

When phases are independent (e.g., migration + deploy workflow), use `dispatching-parallel-agents` pattern — launch `astro-site-builder` and `blog-migrator` in parallel only after scaffold exists.

## Locked Decisions (do not change without user approval)

| Item | Value |
|------|-------|
| Stack | Astro 5 + TypeScript + Tailwind |
| Hosting | GitHub Pages, `site: https://brijendrasingh.github.io`, `base: /` |
| LinkedIn | `https://www.linkedin.com/in/brijendrapsingh/` |
| Email | `bps.brijendra@gmail.com` |
| GitHub | `https://github.com/brijendrasingh` |
| Design | Professional & minimal |
| Blog URL pattern | `/blog/{slug}/` |
| Contact config | Single source: `src/config/site.ts` |

## Definition of Done (project-level)

See [docs/PLAN.md](../../docs/PLAN.md) — verify `npm run build` passes before claiming complete.

## Self-Learning

- Gaps → `.cursor/skills/_learnings/skill-gaps.json`
- Usage → `.cursor/skills/_learnings/skill-usage-log.json`
- Performance → `.cursor/skills/_learnings/skill-performance.json`

Only create new skills under `.cursor/skills/` in **this workspace**. Never modify `~/.cursor/`.
