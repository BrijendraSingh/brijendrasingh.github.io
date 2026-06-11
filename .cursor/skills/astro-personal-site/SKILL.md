---
name: astro-personal-site
description: >-
  Build and maintain the Mr. Brij Astro 5 personal site — scaffold, layouts, components,
  pages, Tailwind design system, content collections, and RSS. Use when scaffolding
  Astro, creating Header/Footer/BlogCard, implementing Home/About/Resume/Blog/Archive
  pages, configuring astro.config.mjs, or fixing Astro/TypeScript build errors in this
  repo. Triggers on astro, tailwind, layout, component, content collection, or static
  site structure work for brijendrasingh.github.io.
recommended_model_tier: inherit
---

# Astro Personal Site Builder

Build the **Mr. Brij** site with Astro 5 + TypeScript + Tailwind on GitHub Pages.

## Reference

- Plan: [docs/PLAN.md](../../../docs/PLAN.md)
- Site config template: [references/site-config.ts](../../../references/site-config.ts)
- Project structure: [references/project-structure.md](references/project-structure.md)

## Scaffold Checklist

```bash
npm create astro@latest . -- --template minimal --typescript strict --install --git false
npx astro add tailwind sitemap mdx
```

### astro.config.mjs essentials

```javascript
export default defineConfig({
  site: 'https://brijendrasingh.github.io',
  base: '/',
  output: 'static',
  integrations: [tailwind(), sitemap()],
});
```

## Content Collection Schema

`src/content/config.ts`:

```typescript
const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    heroImage: z.string().optional(),
  }),
});
```

## Required Components

| File | Role |
|------|------|
| `src/layouts/BaseLayout.astro` | HTML shell, nav, footer |
| `src/layouts/PostLayout.astro` | Blog post wrapper |
| `src/components/Header.astro` | Nav: Home, Blog, About, Resume |
| `src/components/Footer.astro` | Copyright + ContactLinks |
| `src/components/ContactLinks.astro` | Import from `src/config/site.ts` only |
| `src/components/SEO.astro` | title, description, OG tags |
| `src/components/BlogCard.astro` | Listing card |
| `src/components/PostMeta.astro` | Date, tags, reading time |

## Required Pages

| Route | File |
|-------|------|
| `/` | `src/pages/index.astro` |
| `/about` | `src/pages/about.astro` |
| `/resume` | `src/pages/resume.astro` |
| `/blog` | `src/pages/blog/index.astro` |
| `/blog/[...slug]` | `src/pages/blog/[...slug].astro` |
| `/archive` | `src/pages/archive.astro` |
| `/404` | `src/pages/404.astro` |
| `/rss.xml` | `src/pages/rss.xml.ts` |

## Design System

- Fonts: Inter (UI), Source Serif 4 (prose)
- Colors: `slate-800` text, `slate-50` bg, `blue-700` accent
- Max prose width ~65ch
- Professional & minimal — see `mr-brij-brand-guide`

## Verification

```bash
npm run build
npm run preview
```

Before claiming done: all routes render, zero build errors.
