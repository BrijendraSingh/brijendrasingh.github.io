/**
 * Single source of truth for Mr. Brij site config.
 * Copy to src/config/site.ts when scaffolding Astro.
 * Never hardcode these values in components — always import from site.ts.
 */
export const site = {
  brand: "Mr. Brij",
  tagline: "Community for software quality",
  description:
    "Practical articles on test strategy, automation, and quality culture — written by practitioners, for practitioners.",
  footerTagline: "Practical quality writing from practitioners",
  url: "https://mr-brij.bps-brijendra.workers.dev",
  copyrightYear: 2026,

  platform: {
    github: "https://github.com/BrijendraSingh/brijendrasingh.github.io/tree/dynamic-web",
    contactEmail: "bps.brijendra@gmail.com",
  },

  maintainer: {
    name: "Brijendra Singh",
    email: "bps.brijendra@gmail.com",
    github: "https://github.com/brijendrasingh",
    linkedin: "https://www.linkedin.com/in/brijendrapsingh/",
    bio:
      "Software quality practitioner with over 14 years in the software industry. Experience spans mobile applications, microservices, and large-scale test automation — focused on what helps teams ship with confidence.",
  },

  topics: [
    "Test Strategy",
    "Test Automation",
    "Mobile Testing",
    "API & Microservices Testing",
    "Quality Culture & Defect Prevention",
    "CI/CD Quality Gates",
  ],
} as const;

export type SiteConfig = typeof site;
