import type { PostWithAuthor } from '@mr-brij/shared';
import { listPublishedPosts, getPublishedPostBySlug } from '../../../backend/src/services/postService.js';
import { initServerDb, usesApiFallback, fetchApi } from './db.js';

export async function getPublishedPostsForSite(
  options?: { tag?: string; search?: string; page?: number; limit?: number }
): Promise<{ posts: PostWithAuthor[]; total: number }> {
  await initServerDb();
  if (usesApiFallback()) {
    const params = new URLSearchParams();
    if (options?.tag) params.set('tag', options.tag);
    if (options?.search) params.set('search', options.search);
    if (options?.page) params.set('page', String(options.page));
    if (options?.limit) params.set('limit', String(options.limit));
    const q = params.toString();
    const data = await fetchApi<{ posts: PostWithAuthor[]; pagination: { total: number } }>(
      `/api/posts${q ? `?${q}` : ''}`
    );
    return { posts: data.posts, total: data.pagination.total };
  }
  return listPublishedPosts(options ?? {});
}

export async function getPostBySlug(slug: string): Promise<PostWithAuthor | undefined> {
  await initServerDb();
  if (usesApiFallback()) {
    try {
      return await fetchApi<PostWithAuthor>(`/api/posts/${slug}`);
    } catch {
      return undefined;
    }
  }
  return getPublishedPostBySlug(slug);
}
