import { APP_CONFIG, TextUtils, type Post, type PostWithAuthor, type Tag } from '@mr-brij/shared';
import { dbAll, dbGet, dbRun } from '../config/database.api.js';
import { AppError } from '../utils/AppError.js';

export async function attachTags(postId: number): Promise<Tag[]> {
  return dbAll<Tag>(
    `SELECT t.id, t.name, t.slug, t.created_at
     FROM tags t INNER JOIN post_tags pt ON pt.tag_id = t.id
     WHERE pt.post_id = ?`,
    [postId]
  );
}

export async function syncTags(postId: number, tagNames: string[]): Promise<void> {
  await dbRun('DELETE FROM post_tags WHERE post_id = ?', [postId]);
  for (const name of tagNames) {
    const slug = TextUtils.slugify(name);
    if (!slug) continue;
    let tag = await dbGet<Tag>('SELECT * FROM tags WHERE slug = ?', [slug]);
    if (!tag) {
      const result = await dbRun('INSERT INTO tags (name, slug) VALUES (?, ?)', [name.trim(), slug]);
      tag = await dbGet<Tag>('SELECT * FROM tags WHERE id = ?', [result.lastID]);
    }
    if (tag) {
      await dbRun('INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)', [postId, tag.id]);
    }
  }
}

export async function generateUniqueSlug(title: string, excludeId?: number): Promise<string> {
  const base = TextUtils.slugify(title) || `post-${Date.now()}`;
  let slug = base;
  let counter = 1;
  while (true) {
    const params: unknown[] = [slug, 'published'];
    let query = `SELECT id FROM posts WHERE slug = ? AND status = ?`;
    if (excludeId) {
      query += ' AND id != ?';
      params.push(excludeId);
    }
    const existing = await dbGet<{ id: number }>(query, params);
    if (!existing) return slug;
    counter += 1;
    slug = `${base}-${counter}`;
  }
}

export async function getPostWithAuthor(postId: number): Promise<PostWithAuthor | undefined> {
  const post = await dbGet<PostWithAuthor>(
    `SELECT p.*, u.display_name AS author_name, u.avatar_url AS author_avatar
     FROM posts p JOIN users u ON u.id = p.author_id WHERE p.id = ?`,
    [postId]
  );
  if (!post) return undefined;
  post.tags = await attachTags(postId);
  return post;
}

export async function getPublishedPostBySlug(slug: string): Promise<PostWithAuthor | undefined> {
  const post = await dbGet<PostWithAuthor>(
    `SELECT p.*, u.display_name AS author_name, u.avatar_url AS author_avatar
     FROM posts p JOIN users u ON u.id = p.author_id
     WHERE p.slug = ? AND p.status = 'published'`,
    [slug]
  );
  if (!post) return undefined;
  post.tags = await attachTags(post.id);
  return post;
}

export async function listPublishedPosts(options: {
  page?: number;
  limit?: number;
  tag?: string;
  search?: string;
}): Promise<{ posts: PostWithAuthor[]; total: number }> {
  const page = Math.max(1, options.page || 1);
  const limit = Math.min(APP_CONFIG.MAX_PAGE_SIZE, Math.max(1, options.limit || APP_CONFIG.DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * limit;
  const conditions = [`p.status = 'published'`];
  const params: unknown[] = [];

  if (options.tag) {
    conditions.push(`EXISTS (
      SELECT 1 FROM post_tags pt JOIN tags t ON t.id = pt.tag_id
      WHERE pt.post_id = p.id AND t.slug = ?
    )`);
    params.push(options.tag);
  }

  if (options.search) {
    const term = `%${options.search}%`;
    conditions.push(`(p.title LIKE ? OR p.description LIKE ? OR p.body_md LIKE ?)`);
    params.push(term, term, term);
  }

  const where = conditions.join(' AND ');
  const countRow = await dbGet<{ total: number }>(
    `SELECT COUNT(*) AS total FROM posts p WHERE ${where}`,
    params
  );
  const posts = await dbAll<PostWithAuthor>(
    `SELECT p.*, u.display_name AS author_name, u.avatar_url AS author_avatar
     FROM posts p JOIN users u ON u.id = p.author_id
     WHERE ${where}
     ORDER BY p.published_at DESC, p.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  for (const post of posts) {
    post.tags = await attachTags(post.id);
  }
  return { posts, total: countRow?.total ?? 0 };
}

export async function assertPostAccess(
  postId: number,
  userId: number,
  isAdmin: boolean
): Promise<Post> {
  const post = await dbGet<Post>('SELECT * FROM posts WHERE id = ?', [postId]);
  if (!post) throw AppError.notFound('Post not found.');
  if (!isAdmin && post.author_id !== userId) {
    throw AppError.forbidden('You can only manage your own posts.');
  }
  return post;
}

export async function recordReview(
  postId: number,
  reviewerId: number,
  action: string,
  note?: string
): Promise<void> {
  await dbRun(
    `INSERT INTO post_reviews (post_id, reviewer_id, action, note) VALUES (?, ?, ?, ?)`,
    [postId, reviewerId, action, note ?? null]
  );
}
