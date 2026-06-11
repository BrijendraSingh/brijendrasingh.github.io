---
name: mr-brij-brand-guide
description: >-
  Brand and voice guide for Mr. Brij (Brijendra Singh) personal website. Enforces
  software quality practitioner positioning, contact config in src/config/site.ts,
  professional minimal design, and correct social links. Use when writing About copy,
  hero text, resume content, blog intros, SEO descriptions, or reviewing any UI/copy
  for brand alignment. Also use when adding contact links, LinkedIn, taglines, or
  checking the site presents 14+ years QA experience credibly.
recommended_model_tier: inherit
---

# Mr. Brij Brand Guide

## Identity

| Field | Value |
|-------|-------|
| Legal name | Brijendra Singh |
| Brand | Mr. Brij |
| Role | Software Quality / QA practitioner |
| Experience | 14+ years in software industry |
| Focus | Software quality practices from real-world experience |
| Tagline | Software Quality Practitioner |

## Voice

- **Professional** — credible for senior practitioners and hiring managers
- **Practical** — lessons from experience, not theory-only
- **Approachable** — invite discussion, not lecturing
- **Avoid** — hype, buzzword soup, generic AI aesthetics, flashy design

## Expertise Pillars (use on About, tags, resume)

1. Test Strategy
2. Test Automation
3. Mobile Testing
4. API / Microservices Testing
5. Quality Culture & Defect Prevention
6. CI/CD Quality Gates

## Contact — Single Source of Truth

**Never hardcode** contact URLs in components. Always import `src/config/site.ts`:

```typescript
export const site = {
  name: "Brijendra Singh",
  brand: "Mr. Brij",
  tagline: "Software Quality Practitioner",
  description: "14+ years in software quality — test strategy, automation, and quality culture.",
  url: "https://brijendrasingh.github.io",
  email: "bps.brijendra@gmail.com",
  github: "https://github.com/brijendrasingh",
  linkedin: "https://www.linkedin.com/in/brijendrapsingh/",
  copyrightYear: 2026,
} as const;
```

Full template: [references/site-config.ts](../../../references/site-config.ts)

## Design Principles

- Clean typography, generous whitespace
- Slate/navy palette, blue accent sparingly
- Mobile-first, accessible (contrast, semantic HTML, alt text)
- No stock-photo hero clichés; optional professional headshot only

## Blog Content Guidelines

- Write for practitioners: test leads, QAs, engineers, managers
- Prefer concrete examples from testing work
- Tags should reflect expertise pillars
- SEO descriptions: 120–160 chars, include topic + practitioner angle

## Review Checklist

Before merging copy or design changes:

- [ ] Contact links come from `site.ts` only
- [ ] LinkedIn is `https://www.linkedin.com/in/brijendrapsingh/`
- [ ] Tone is professional, not salesy
- [ ] Positioning reflects 14+ years experience
- [ ] Design stays minimal and readable

Delegate visual review to `brand-alignment-reviewer` subagent when unsure.
