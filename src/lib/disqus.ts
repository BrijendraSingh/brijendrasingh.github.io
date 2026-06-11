import { site } from "../config/site";

/** Legacy Jekyll paths — keeps existing Disqus threads after URL migration. */
const LEGACY_DISQUS_PATHS: Record<string, string> = {
  "how-to-choose-tools": "/posts/2021-10-21-how-to-choose-tools/",
  "engineered-test-data": "/posts/2021-11-07-engineered-test-data/",
  "art-of-automation": "/posts/2021-11-22-art-of-automation/",
  "component-tests": "/posts/2021-12-10-component-tests/",
  "who-tests-your-test": "/posts/2022-02-02-who-tests-your-test/",
  "detox-e2e": "/posts/2022-04-27-detox-e2e/",
  "mobile-test-strategy": "/posts/2022-05-07-mobile-test-strategy/",
  "testing-microservices": "/posts/2022-05-11-testing-microservices/",
  "defect-prevention-mindset": "/posts/2022-05-25-defect-prevention-mindset/",
};

export function getDisqusPath(slug: string) {
  return LEGACY_DISQUS_PATHS[slug] ?? `/blog/${slug}/`;
}

export function getDisqusPageConfig(slug: string) {
  const path = getDisqusPath(slug);
  return {
    pageUrl: `${site.url}${path}`,
    pageIdentifier: path,
  };
}
