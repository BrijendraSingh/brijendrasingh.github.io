---
name: mr-brij-blog-publisher
description: >-
  Publish new blog posts on the Mr. Brij Astro site — create Markdown in
  src/content/blog/, frontmatter, tags, SEO description, and git workflow.
  Use when the user wants to write a blog, publish a post, add an article,
  draft QA/testing content, or asks how to blog on brijendrasingh.github.io.
  Also triggers on "new post", "write about testing", or frequent blogging workflow.
recommended_model_tier: fast
---

# Mr. Brij Blog Publisher

Frequent blogging = one Markdown file + `git push`. Auto-deploy via GitHub Actions.

## Quick Publish (3 steps)

```bash
cp src/content/blog/_template.md src/content/blog/my-post-slug.md
# Edit frontmatter + body
git add . && git commit -m "blog: post title" && git push
```

Site updates in ~2 minutes.

## Post Template

File: `src/content/blog/_template.md`

```markdown
---
title: "Your Post Title"
description: "120-160 char SEO summary for software quality practitioners."
pubDate: 2026-06-11
tags: ["test-strategy", "automation"]
draft: false
# heroImage: "/images/blog/optional-hero.jpg"
---

Opening paragraph hooks the reader with a practical insight from your experience.

## Section Heading

Content...
```

## Slug Rules

- Filename = URL slug: `src/content/blog/mobile-test-patterns.md` → `/blog/mobile-test-patterns/`
- Lowercase, hyphens, no date prefix (dates live in frontmatter)
- Keep slugs short and descriptive

## Frontmatter Rules

| Field | Required | Notes |
|-------|----------|-------|
| `title` | Yes | Clear, practitioner-focused |
| `description` | Yes | SEO meta, 120–160 chars |
| `pubDate` | Yes | ISO date `YYYY-MM-DD` |
| `tags` | Yes | From expertise pillars in `mr-brij-brand-guide` |
| `draft` | No | `true` hides from production build |
| `heroImage` | No | Path under `/images/blog/` |

## Content Guidelines

See `mr-brij-brand-guide` for voice. Blog posts should:
- Share lessons from 14+ years in software quality
- Use concrete examples (test strategy, automation, mobile, microservices)
- End with a question or call to discuss (optional)

## Draft Mode

Set `draft: true` to work in progress. Astro content collections filter drafts in production when configured in `src/pages/blog/`.

## Images

1. Save to `public/images/blog/descriptive-name.jpg`
2. Reference: `heroImage: "/images/blog/descriptive-name.jpg"`
3. In body: `![Alt text](/images/blog/descriptive-name.jpg)`

## After Publishing

- Verify post appears at `/blog/{slug}/`
- Check RSS at `/rss.xml`
- Optional: share on LinkedIn (`site.linkedin` from config)
