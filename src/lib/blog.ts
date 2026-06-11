import { getCollection, type CollectionEntry } from "astro:content";

export type BlogPost = CollectionEntry<"blog">;

export async function getPublishedPosts() {
  return (await getCollection("blog"))
    .filter((post) => !post.data.draft)
    .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function postHref(id: string) {
  return `/blog/${id}/`;
}

export function estimateReadingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function groupPostsByYear(posts: BlogPost[]) {
  const byYear = posts.reduce<Record<number, BlogPost[]>>((acc, post) => {
    const year = post.data.pubDate.getFullYear();
    (acc[year] ??= []).push(post);
    return acc;
  }, {});
  return Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a)
    .map((year) => ({ year, posts: byYear[year] }));
}

export function getAllTags(posts: BlogPost[]): string[] {
  const tagSet = new Set(posts.flatMap((post) => post.data.tags));
  return [...tagSet].sort((a, b) => a.localeCompare(b));
}

/** Human-readable tag label for UI (keeps slug in data attributes). */
export function formatTagLabel(tag: string): string {
  return tag
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
