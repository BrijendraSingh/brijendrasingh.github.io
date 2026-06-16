import type { Request, Response, NextFunction } from 'express';
import type { ReactionType, SetReactionRequest } from '@mr-brij/shared';
import { dbAll, dbGet, dbRun } from '../config/database.api.js';
import { getEngagementStatsBySlugs } from '../services/engagementService.js';
import { getPublishedPostBySlug } from '../services/postService.js';
import { AppError } from '../utils/AppError.js';

async function getCounts(postId: number, userId?: number) {
  const rows = await dbAll<{ type: ReactionType; count: number }>(
    `SELECT type, COUNT(*) AS count FROM reactions WHERE post_id = ? GROUP BY type`,
    [postId]
  );
  const counts = { like: 0, thumbs_up: 0, thumbs_down: 0, user_reaction: null as ReactionType | null };
  for (const row of rows) counts[row.type] = row.count;
  if (userId) {
    const userReaction = await dbGet<{ type: ReactionType }>(
      'SELECT type FROM reactions WHERE post_id = ? AND user_id = ?',
      [postId, userId]
    );
    counts.user_reaction = userReaction?.type ?? null;
  }
  return counts;
}

export async function getBatchEngagementStats(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const raw = req.query.slugs;
    const slugs =
      typeof raw === 'string'
        ? raw.split(',').map((slug) => slug.trim()).filter(Boolean)
        : Array.isArray(raw)
          ? raw.flatMap((value) =>
              typeof value === 'string' ? value.split(',').map((slug) => slug.trim()) : []
            ).filter(Boolean)
          : [];
    const data = await getEngagementStatsBySlugs(slugs);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function getReactions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await getPublishedPostBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found.' });
      return;
    }
    const counts = await getCounts(post.id, req.user?.id);
    res.json({ success: true, data: counts });
  } catch (err) {
    next(err);
  }
}

export async function setReaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const post = await getPublishedPostBySlug(req.params.slug);
    if (!post) throw AppError.notFound('Post not found.');
    const { type } = req.body as SetReactionRequest;
    await dbRun('DELETE FROM reactions WHERE post_id = ? AND user_id = ?', [post.id, user.id]);
    if (type) {
      await dbRun('INSERT INTO reactions (post_id, user_id, type) VALUES (?, ?, ?)', [
        post.id,
        user.id,
        type,
      ]);
    }
    const counts = await getCounts(post.id, user.id);
    res.json({ success: true, data: counts });
  } catch (err) {
    next(err);
  }
}

export async function getUpdates(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await getPublishedPostBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found.' });
      return;
    }
    const since = req.query.since as string | undefined;
    let commentQuery = `SELECT COUNT(*) AS count FROM comments WHERE post_id = ? AND is_deleted = 0 AND is_hidden = 0`;
    const params: unknown[] = [post.id];
    if (since) {
      commentQuery += ' AND created_at > ?';
      params.push(since);
    }
    const commentRow = await dbGet<{ count: number }>(commentQuery, params);
    const reactions = await getCounts(post.id, req.user?.id);
    res.json({
      success: true,
      data: { new_comments: commentRow?.count ?? 0, reactions },
    });
  } catch (err) {
    next(err);
  }
}
