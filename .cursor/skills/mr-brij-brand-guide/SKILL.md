---
name: mr-brij-brand-guide
description: >-
  Brand and voice guide for Mr. Brij community blog platform. Enforces community-first
  positioning, platform vs maintainer config in src/config/site.ts, professional minimal
  design, and correct contact links. Use when writing About copy, hero text, credits page,
  blog intros, SEO descriptions, or reviewing any UI/copy for brand alignment.
recommended_model_tier: inherit
---

# Mr. Brij Brand Guide

## Identity

| Field | Value |
|-------|-------|
| Brand | Mr. Brij |
| Positioning | Community blog for software quality practitioners |
| Tagline | Community for software quality |
| Maintainer | Brijendra Singh (credits page only) |

## Public vs hidden surfaces

| Surface | Content |
|---------|---------|
| Home, Blog, About, Header, Footer | Platform voice — no maintainer name |
| `/credits/` | Maintainer bio and personal contact (noindex, footer easter egg) |

## Voice

- **Community-first** — written for practitioners, open to contributors
- **Professional** — credible for test leads, QAs, engineers, managers
- **Practical** — lessons from experience, not theory-only
- **Approachable** — invite discussion, not lecturing
- **Avoid** — hype, buzzword soup, generic AI aesthetics, flashy design

## Topics (use on About, tags)

1. Test Strategy
2. Test Automation
3. Mobile Testing
4. API / Microservices Testing
5. Quality Culture & Defect Prevention
6. CI/CD Quality Gates

## Contact — Single Source of Truth

**Never hardcode** contact URLs in components. Always import `src/config/site.ts`:

- `site.platform` — footer and public About (GitHub repo, platform email)
- `site.maintainer` — credits page only (personal GitHub, LinkedIn, email)

Full template: [references/site-config.ts](../../../references/site-config.ts)

## Design Principles

- Clean typography, generous whitespace
- Slate/navy palette, blue accent sparingly
- Mobile-first, accessible (contrast, semantic HTML, alt text)
- No stock-photo hero clichés

## Blog Content Guidelines

- Write for practitioners: test leads, QAs, engineers, managers
- Prefer concrete examples from testing work
- Tags should reflect topic pillars
- SEO descriptions: 120–160 chars, community angle (not personal byline)

## Review Checklist

Before merging copy or design changes:

- [ ] Public pages use platform copy from `site.ts` — no maintainer name on home/about
- [ ] Contact links come from `site.platform` or `site.maintainer` only
- [ ] Maintainer LinkedIn is `https://www.linkedin.com/in/brijendrapsingh/` (credits only)
- [ ] Tone is professional, not salesy
- [ ] Design stays minimal and readable
- [ ] No Resume nav link or page

Delegate visual review to `brand-alignment-reviewer` subagent when unsure.
