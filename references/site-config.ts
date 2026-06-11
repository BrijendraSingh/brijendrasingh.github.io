/**
 * Single source of truth for Mr. Brij site config.
 * Copy to src/config/site.ts when scaffolding Astro.
 * Never hardcode these values in components — always import from site.ts.
 */
export const site = {
  name: "Brijendra Singh",
  brand: "Mr. Brij",
  tagline: "Software Quality Practitioner",
  description:
    "14+ years in software quality — test strategy, automation, and quality culture.",
  url: "https://brijendrasingh.github.io",
  email: "bps.brijendra@gmail.com",
  github: "https://github.com/brijendrasingh",
  linkedin: "https://www.linkedin.com/in/brijendrapsingh/",
  copyrightYear: 2026,
} as const;

export type SiteConfig = typeof site;
