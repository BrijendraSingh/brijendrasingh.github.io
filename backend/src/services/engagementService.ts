import type { PostEngagementStats, ReactionType } from '@mr-brij/shared';
import { dbAll } from '../config/database.api.js';

const MAX_SLUGS = 50;

export function emptyEngagementStats(): PostEngagementStats {
  return { like: 0, thumbs_up: 0, thumbs_down: 0, comments: 0 };
}

export async function getEngagementStatsBySlugs(
  slugs: string[]
): Promise<Record<string, PostEngagementStats>> {
  const unique = [...new Set(slugs.map((s) => s.trim()).filter(Boolean))].slice(0, MAX_SLUGS);
  const result = Object.fromEntries(unique.map((slug) => [slug, emptyEngagementStats()]));
  if (unique.length === 0) return result;

  const placeholders = unique.map(() => '?').join(',');
  const posts = await dbAll<{ id: number; slug: string }>(
    `SELECT id, slug FROM posts WHERE slug IN (${placeholders}) AND status = 'published'`,
    unique
  );
  if (posts.length === 0) return result;

  const slugById = new Map(posts.map((post) => [post.id, post.slug]));
  const postIds = posts.map((post) => post.id);
  const postPlaceholders = postIds.map(() => '?').join(',');

  const [reactionRows, commentRows] = await Promise.all([
    dbAll<{ post_id: number; type: ReactionType; count: number }>(
      `SELECT post_id, type, COUNT(*) AS count
       FROM reactions WHERE post_id IN (${postPlaceholders})
       GROUP BY post_id, type`,
      postIds
    ),
    dbAll<{ post_id: number; count: number }>(
      `SELECT post_id, COUNT(*) AS count
       FROM comments
       WHERE post_id IN (${postPlaceholders}) AND is_deleted = 0 AND is_hidden = 0
       GROUP BY post_id`,
      postIds
    ),
  ]);

  for (const row of reactionRows) {
    const slug = slugById.get(row.post_id);
    if (!slug) continue;
    result[slug][row.type] = row.count;
  }

  for (const row of commentRows) {
    const slug = slugById.get(row.post_id);
    if (!slug) continue;
    result[slug].comments = row.count;
  }

  return result;
}
