---
name: jekyll-to-astro-migration
description: >-
  Migrate Jekyll blog posts from brijendrasingh.github.io-main to Astro content
  collections, recover hero images, and generate legacy URL redirects for GitHub
  Pages. Use when migrating posts, converting frontmatter, fixing old /posts/ URLs,
  fetching images from the live site, or running generate-redirects.mjs in this repo.
recommended_model_tier: inherit
---

# Jekyll to Astro Migration

Migrate legacy content from `brijendrasingh.github.io-main/` to `src/content/blog/`.

## Source

- Posts: `brijendrasingh.github.io-main/_posts/*.markdown`
- Redirect map: [references/post-migration-map.json](references/post-migration-map.json)

## Post Inventory (9 posts)

| Source file | New slug | Old URL |
|-------------|----------|---------|
| `2021-10-21-how-to-choose-tools` | `how-to-choose-tools` | `/posts/2021-10-21-how-to-choose-tools/` |
| `2021-11-07-engineered-test-data` | `engineered-test-data` | `/posts/2021-11-07-engineered-test-data/` |
| `2021-11-22-art-of-automation` | `art-of-automation` | `/posts/2021-11-22-art-of-automation/` |
| `2021-12-10-component-tests` | `component-tests` | `/posts/2021-12-10-component-tests/` |
| `2022-02-02-who-tests-your-test` | `who-tests-your-test` | `/posts/2022-02-02-who-tests-your-test/` |
| `2022-04-27-detox-e2e` | `detox-e2e` | `/posts/2022-04-27-detox-e2e/` |
| `2022-05-07-mobile-test-strategy` | `mobile-test-strategy` | `/posts/2022-05-07-mobile-test-strategy/` |
| `2022-05-11-testing-microservices` | `testing-microservices` | `/posts/2022-05-11-testing-microservices/` |
| `2022-05-25-defect-prevention-mindset` | `defect-prevention-mindset` | `/posts/2022-05-25-defect-prevention-mindset/` |

## Per-Post Migration Steps

1. Read Jekyll `.markdown` file
2. Map frontmatter:
   - `title` → `title`
   - `date` → `pubDate`
   - `tags` → `tags` (normalize to kebab-case)
   - `meta_description` or first paragraph → `description`
   - `img` → `heroImage` (path under `/images/blog/`)
3. Strip: `author`, `category`, `img` Jekyll syntax, Liquid tags
4. Fix image refs: `:filename.jpg` → `/images/blog/filename.jpg`
5. Write to `src/content/blog/{slug}.md`

## Hero Images

Zip may lack binaries. Fetch from live site:

```
https://brijendrasingh.github.io/assets/img/posts/{filename}
```

Save to `public/images/blog/`. If unavailable, omit `heroImage` — content still ships.

## Legacy Redirects

GitHub Pages has no server redirects. Run:

```bash
node scripts/generate-redirects.mjs
```

Script reads `references/post-migration-map.json` and writes:

```
public/posts/2022-05-25-defect-prevention-mindset/index.html
```

Each file:

```html
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv="refresh" content="0; url=/blog/defect-prevention-mindset/">
  <link rel="canonical" href="/blog/defect-prevention-mindset/">
</head>
<body><p>Redirecting to <a href="/blog/defect-prevention-mindset/">new post</a>...</p></body>
</html>
```

## Cleanup (after verification)

Remove `brijendrasingh.github.io-main/` and `brijendrasingh.github.io-main.zip` from repo.

## Verify

- All 9 posts at `/blog/{slug}/`
- `npm run build` passes
- Spot-check 2–3 old `/posts/...` URLs redirect
