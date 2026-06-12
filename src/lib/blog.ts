import type { PostWithAuthor } from '@mr-brij/shared';
import { getPublishedPostsForSite } from './server/posts.js';

export interface BlogListEntry {
  id: string;
  data: {
    title: string;
    description: string;
    pubDate: Date;
    updatedDate?: Date;
    tags: string[];
    draft: boolean;
    commentsDisable: boolean;
  };
  body?: string;
}

export type BlogPost = BlogListEntry;

function toEntry(post: PostWithAuthor): BlogListEntry {
  return {
    id: post.slug,
    data: {
      title: post.title,
      description: post.description,
      pubDate: new Date(post.published_at || post.pub_date || post.created_at),
      updatedDate: post.updated_date ? new Date(post.updated_date) : undefined,
      tags: post.tags?.map((t) => t.slug) ?? [],
      draft: false,
      commentsDisable: Boolean(post.comments_disabled),
    },
    body: post.body_md,
  };
}

export async function getPublishedPosts(): Promise<BlogListEntry[]> {
  const { posts } = await getPublishedPostsForSite({ limit: 100 });
  return posts.map(toEntry);
}

export function postHref(id: string) {
  return `/blog/${id}/`;
}

export function estimateReadingTime(body: string): number {
  const words = body.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

export function groupPostsByYear(posts: BlogListEntry[]) {
  const byYear = posts.reduce<Record<number, BlogListEntry[]>>((acc, post) => {
    const year = post.data.pubDate.getFullYear();
    (acc[year] ??= []).push(post);
    return acc;
  }, {});
  return Object.keys(byYear)
    .map(Number)
    .sort((a, b) => b - a)
    .map((year) => ({ year, posts: byYear[year] }));
}

export function getAllTags(posts: BlogListEntry[]): string[] {
  const tagSet = new Set(posts.flatMap((post) => post.data.tags));
  return [...tagSet].sort((a, b) => a.localeCompare(b));
}

export function formatTagLabel(tag: string): string {
  return tag
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
