/**
 * Single source of truth for Mr. Brij site config.
 * Never hardcode these values in components — always import from here.
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
  disqus: {
    enabled: true,
    shortname: "prafast",
    loadMode: "click_to_load" as const,
  },
} as const;

export type SiteConfig = typeof site;
