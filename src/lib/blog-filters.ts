import type { BlogPost } from "./blog";
import { formatTagLabel, getAllTags } from "./blog";

export interface FilterGroup {
  id: string;
  label: string;
  tags: string[];
}

/** Broad content areas — "blog type" */
export const BLOG_TYPES: FilterGroup[] = [
  {
    id: "mobile",
    label: "Mobile",
    tags: ["mobile-test-strategy", "mobile-testing", "mobile-automation", "detox"],
  },
  {
    id: "microservices",
    label: "Microservices",
    tags: ["microservices", "api-automation", "contract-test", "component-test"],
  },
  {
    id: "strategy",
    label: "Test Strategy",
    tags: ["test-strategy", "test-pyramid"],
  },
  {
    id: "automation",
    label: "Automation",
    tags: ["test-automation", "api-automation", "mobile-automation", "flaky-test"],
  },
  {
    id: "tools",
    label: "Tools",
    tags: ["tools", "tools-selection"],
  },
  {
    id: "quality",
    label: "Quality & Data",
    tags: ["software-quality", "quality-culture", "engineered-test-data", "test-data"],
  },
];

/** Focus areas — "category" */
export const BLOG_CATEGORIES: FilterGroup[] = [
  {
    id: "pyramid-components",
    label: "Pyramid & Components",
    tags: ["test-pyramid", "component-test"],
  },
  {
    id: "api-contracts",
    label: "API & Contracts",
    tags: ["api-automation", "contract-test", "microservices"],
  },
  {
    id: "mobile-stack",
    label: "Mobile Stack",
    tags: ["mobile-testing", "mobile-test-strategy", "mobile-automation", "detox"],
  },
  {
    id: "automation-practice",
    label: "Automation Practice",
    tags: ["test-automation", "flaky-test"],
  },
  { id: "tooling", label: "Tooling", tags: ["tools", "tools-selection"] },
  { id: "test-data", label: "Test Data", tags: ["engineered-test-data", "test-data"] },
  {
    id: "culture",
    label: "Quality Culture",
    tags: ["quality-culture", "software-quality"],
  },
  { id: "strategy", label: "Strategy", tags: ["test-strategy"] },
];

export function getMatchingGroupIds(postTags: string[], groups: FilterGroup[]): string[] {
  return groups
    .filter((group) => group.tags.some((tag) => postTags.includes(tag)))
    .map((group) => group.id);
}

export function groupsWithPosts(posts: BlogPost[], groups: FilterGroup[]): FilterGroup[] {
  return groups.filter((group) =>
    posts.some((post) => group.tags.some((tag) => post.data.tags.includes(tag))),
  );
}

export function getTopicFilters(posts: BlogPost[]) {
  return getAllTags(posts).map((tag) => ({
    id: tag,
    label: formatTagLabel(tag),
  }));
}

export function postMatchesFilters(
  postTags: string[],
  selected: { types: string[]; categories: string[]; topics: string[] },
): boolean {
  const { types, categories, topics } = selected;
  if (types.length > 0 && !types.some((id) => getMatchingGroupIds(postTags, BLOG_TYPES).includes(id))) {
    return false;
  }
  if (
    categories.length > 0 &&
    !categories.some((id) => getMatchingGroupIds(postTags, BLOG_CATEGORIES).includes(id))
  ) {
    return false;
  }
  if (topics.length > 0 && !topics.some((topic) => postTags.includes(topic))) {
    return false;
  }
  return true;
}
