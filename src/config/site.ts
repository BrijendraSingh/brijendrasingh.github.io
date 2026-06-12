/**
 * Single source of truth for Mr. Brij site config.
 */
export const site = {
  name: 'Brijendra Singh',
  brand: 'Mr. Brij',
  tagline: 'Software Quality Practitioner',
  description:
    '14+ years in software quality — test strategy, automation, and quality culture.',
  url: 'https://mr-brij.bps-brijendra.workers.dev',
  email: 'bps.brijendra@gmail.com',
  github: 'https://github.com/brijendrasingh',
  linkedin: 'https://www.linkedin.com/in/brijendrapsingh/',
  copyrightYear: 2026,
} as const;

export type SiteConfig = typeof site;
