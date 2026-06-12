import type { Request, Response, NextFunction } from 'express';
import type { CreateCommentRequest, ReactionType, SetReactionRequest, UpdateCommentRequest } from '@mr-brij/shared';
import { dbAll, dbGet, dbRun } from '../config/database.api.js';
import { AppError } from '../utils/AppError.js';
import { getPublishedPostBySlug } from '../services/postService.js';
import {
  buildCommentTree,
  countComments,
  loadReactionsForComments,
  type CommentRow,
} from '../services/commentService.js';

async function getCommentRow(commentId: number): Promise<CommentRow | null> {
  return dbGet<CommentRow>(
    `SELECT c.id, c.post_id, c.user_id, c.parent_id, c.body, c.created_at, c.updated_at,
            c.is_deleted, c.is_hidden, u.display_name AS user_name, u.avatar_url AS user_avatar
     FROM comments c JOIN users u ON u.id = c.user_id
     WHERE c.id = ?`,
    [commentId]
  );
}

async function listCommentsForPost(postId: number, userId?: number, includeHidden = false) {
  let query = `SELECT c.id, c.post_id, c.user_id, c.parent_id, c.body, c.created_at, c.updated_at,
                      c.is_deleted, c.is_hidden, u.display_name AS user_name, u.avatar_url AS user_avatar
               FROM comments c JOIN users u ON u.id = c.user_id
               WHERE c.post_id = ? AND c.is_deleted = 0`;
  if (!includeHidden) query += ' AND c.is_hidden = 0';
  query += ' ORDER BY c.created_at ASC';

  const flat = await dbAll<CommentRow>(query, [postId]);
  const reactions = await loadReactionsForComments(
    flat.map((c) => c.id),
    userId
  );
  const comments = buildCommentTree(flat, reactions);
  return { comments, total: countComments(comments) };
}

export async function listComments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await getPublishedPostBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found.' });
      return;
    }
    const isAdmin = req.user?.role === 'admin';
    const data = await listCommentsForPost(post.id, req.user?.id, isAdmin);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const post = await getPublishedPostBySlug(req.params.slug);
    if (!post) throw AppError.notFound('Post not found.');
    if (post.comments_disabled) throw AppError.badRequest('Comments are disabled for this post.');
    const body = req.body as CreateCommentRequest;

    if (body.parent_id != null) {
      const parent = await dbGet<{ id: number; post_id: number; is_deleted: number }>(
        'SELECT id, post_id, is_deleted FROM comments WHERE id = ?',
        [body.parent_id]
      );
      if (!parent || parent.post_id !== post.id || parent.is_deleted) {
        throw AppError.badRequest('Invalid reply target.');
      }
    }

    const result = await dbRun(
      `INSERT INTO comments (post_id, user_id, parent_id, body, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [post.id, user.id, body.parent_id ?? null, body.body]
    );
    const comment = await getCommentRow(result.lastID);
    if (!comment) throw AppError.badRequest('Failed to load comment.');
    const reactions = await loadReactionsForComments([comment.id], user.id);
    res.status(201).json({
      success: true,
      data: { ...comment, reactions: reactions.get(comment.id)!, replies: [] },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const commentId = parseInt(req.params.id, 10);
    const { body } = req.body as UpdateCommentRequest;
    const comment = await dbGet<{ id: number; user_id: number; is_deleted: number }>(
      'SELECT id, user_id, is_deleted FROM comments WHERE id = ?',
      [commentId]
    );
    if (!comment || comment.is_deleted) throw AppError.notFound('Comment not found.');
    if (user.role !== 'admin' && comment.user_id !== user.id) {
      throw AppError.forbidden('Cannot edit this comment.');
    }
    await dbRun(
      'UPDATE comments SET body = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [body, commentId]
    );
    const updated = await getCommentRow(commentId);
    if (!updated) throw AppError.badRequest('Failed to load comment.');
    const reactions = await loadReactionsForComments([commentId], user.id);
    res.json({
      success: true,
      data: { ...updated, reactions: reactions.get(commentId)!, replies: [] },
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const commentId = parseInt(req.params.id, 10);
    const comment = await dbGet<{ id: number; user_id: number }>(
      'SELECT id, user_id FROM comments WHERE id = ?',
      [commentId]
    );
    if (!comment) throw AppError.notFound('Comment not found.');
    if (user.role !== 'admin' && comment.user_id !== user.id) {
      throw AppError.forbidden('Cannot delete this comment.');
    }
    await dbRun('UPDATE comments SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      commentId,
    ]);
    res.json({ success: true, message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
}

export async function setCommentReaction(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const commentId = parseInt(req.params.id, 10);
    const { type } = req.body as SetReactionRequest;
    const comment = await dbGet<{ id: number; post_id: number; is_deleted: number; is_hidden: number }>(
      'SELECT id, post_id, is_deleted, is_hidden FROM comments WHERE id = ?',
      [commentId]
    );
    if (!comment || comment.is_deleted || comment.is_hidden) {
      throw AppError.notFound('Comment not found.');
    }
    const post = await dbGet<{ status: string }>('SELECT status FROM posts WHERE id = ?', [comment.post_id]);
    if (!post || post.status !== 'published') throw AppError.notFound('Post not found.');

    await dbRun('DELETE FROM comment_reactions WHERE comment_id = ? AND user_id = ?', [
      commentId,
      user.id,
    ]);
    if (type) {
      await dbRun('INSERT INTO comment_reactions (comment_id, user_id, type) VALUES (?, ?, ?)', [
        commentId,
        user.id,
        type,
      ]);
    }

    const reactions = await loadReactionsForComments([commentId], user.id);
    res.json({ success: true, data: reactions.get(commentId)! });
  } catch (err) {
    next(err);
  }
}

export async function listAdminComments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const hiddenOnly = req.query.hidden === '1' || req.query.hidden === 'true';
    const rows = await dbAll<
      CommentRow & { post_slug: string; post_title: string }
    >(
      `SELECT c.id, c.post_id, c.user_id, c.parent_id, c.body, c.created_at, c.updated_at,
              c.is_deleted, c.is_hidden, u.display_name AS user_name, u.avatar_url AS user_avatar,
              p.slug AS post_slug, p.title AS post_title
       FROM comments c
       JOIN users u ON u.id = c.user_id
       JOIN posts p ON p.id = c.post_id
       WHERE c.is_deleted = 0 AND c.is_hidden = ?
       ORDER BY c.updated_at DESC`,
      [hiddenOnly ? 1 : 0]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
}

export async function moderateComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const commentId = parseInt(req.params.id, 10);
    const comment = await dbGet('SELECT id FROM comments WHERE id = ?', [commentId]);
    if (!comment) throw AppError.notFound('Comment not found.');
    const hidden = (req.body as { hidden?: boolean }).hidden ? 1 : 0;
    await dbRun('UPDATE comments SET is_hidden = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      hidden,
      commentId,
    ]);
    res.json({ success: true, message: hidden ? 'Comment hidden.' : 'Comment visible.' });
  } catch (err) {
    next(err);
  }
}
