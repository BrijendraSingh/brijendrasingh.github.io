# Mr. Brij — Personal Website

Personal brand site for **Brijendra Singh** — software quality practitioner.

**Live:** https://brijendrasingh.github.io/

Built with [Astro](https://astro.build) + Tailwind CSS, deployed free on GitHub Pages.

## Local development

```bash
npm install
npm run dev      # http://localhost:4321
npm run build
npm run preview
```

## Publish a new blog post

```bash
# 1. Copy the template
cp src/content/blog/_template.md src/content/blog/my-post-slug.md

# 2. Edit frontmatter + content (set draft: false when ready)

# 3. Publish
git add . && git commit -m "blog: my post title" && git push
```

GitHub Actions deploys to GitHub Pages automatically (~2 minutes).

### Frontmatter

```yaml
---
title: "Your Post Title"
description: "120-160 char SEO summary"
pubDate: 2026-06-11
tags: ["test-strategy", "automation"]
draft: false
---
```

## Site config

All contact links live in `src/config/site.ts` — never hardcode in components.

## GitHub Pages setup

1. Push this repo to `BrijendraSingh/brijendrasingh.github.io`
2. Settings → Pages → Source: **GitHub Actions**
3. Enforce HTTPS: enabled

## Agent ecosystem

See [AGENTS.md](AGENTS.md) for workspace skills, subagents, and rules.

## Resume PDF

Replace `public/resume.pdf` with your actual resume file.
