---
name: github-pages-deploy
description: >-
  Deploy the Mr. Brij Astro site to GitHub Pages via GitHub Actions, configure
  SEO (sitemap, RSS, robots.txt, JSON-LD), and run launch checklists including
  Lighthouse. Use when setting up deploy.yml, fixing GitHub Pages build failures,
  switching Pages source to GitHub Actions, adding RSS/sitemap, or preparing site
  launch for brijendrasingh.github.io.
recommended_model_tier: fast
---

# GitHub Pages Deploy & Launch

Free hosting for `BrijendraSingh/brijendrasingh.github.io`.

## Deploy Workflow

File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/deploy-pages@v4
        id: deployment
```

## One-Time GitHub Settings

1. Repo: `BrijendraSingh/brijendrasingh.github.io`
2. Settings → Pages → Source: **GitHub Actions** (not "Deploy from branch")
3. Enforce HTTPS: enabled

## SEO Checklist

| Item | Location |
|------|----------|
| Sitemap | `@astrojs/sitemap` → `dist/sitemap-index.xml` |
| RSS | `src/pages/rss.xml.ts` |
| robots.txt | `public/robots.txt` |
| OG tags | `src/components/SEO.astro` |
| Person schema | About page JSON-LD with `sameAs: [linkedin, github]` |

### robots.txt

```
User-agent: *
Allow: /
Sitemap: https://brijendrasingh.github.io/sitemap-index.xml
```

## Launch Checklist

- [ ] `npm run build` passes locally
- [ ] GitHub Action succeeds on push to `main`
- [ ] All routes live: `/`, `/about`, `/resume`, `/blog`, `/archive`
- [ ] LinkedIn link: `https://www.linkedin.com/in/brijendrapsingh/`
- [ ] 9 migrated posts + redirects work
- [ ] RSS and sitemap accessible
- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 90
- [ ] Mobile nav works
- [ ] README documents blog publish workflow

## Troubleshooting

| Issue | Fix |
|-------|-----|
| 404 on all routes | Check `site` and `base` in astro.config.mjs |
| Action permission denied | Ensure `pages: write` and `id-token: write` |
| Old Jekyll site still showing | Clear cache; confirm Actions deploy not branch deploy |
| Build fails on CI | Run `npm ci && npm run build` locally first |

## Cost

$0 — GitHub Pages for public repos.
