import type { Request, Response, NextFunction } from 'express';
import {
  APP_CONFIG,
  TextUtils,
  canModeratePosts,
  type CreatePostRequest,
  type UpdatePostRequest,
} from '@mr-brij/shared';
import { dbAll, dbGet, dbRun } from '../config/database.api.js';
import { AppError } from '../utils/AppError.js';
import {
  assertPostAccess,
  generateUniqueSlug,
  getPostWithAuthor,
  getPublishedPostBySlug,
  listPublishedPosts,
  recordReview,
  syncTags,
} from '../services/postService.js';
import { promoteToAuthorIfNeeded } from '../middleware/requireSession.js';

export async function listPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || APP_CONFIG.DEFAULT_PAGE_SIZE;
    const tag = req.query.tag as string | undefined;
    const search = req.query.search as string | undefined;
    const { posts, total } = await listPublishedPosts({ page, limit, tag, search });
    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function searchPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = (req.query.q as string) || '';
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || APP_CONFIG.DEFAULT_PAGE_SIZE;
    const { posts, total } = await listPublishedPosts({ page, limit, search: q });
    res.json({
      success: true,
      data: { query: q, posts, total },
    });
  } catch (err) {
    next(err);
  }
}

export async function getPublicBySlug(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const post = await getPublishedPostBySlug(req.params.slug);
    if (!post) {
      res.status(404).json({ success: false, message: 'Post not found.' });
      return;
    }
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

export async function listAuthor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const posts = await dbAll(
      `SELECT * FROM posts WHERE author_id = ? ORDER BY updated_date DESC`,
      [userId]
    );
    res.json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
}

export async function createAuthor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    await promoteToAuthorIfNeeded(user.id, user.role);
    const body = req.body as CreatePostRequest;
    const slug = await generateUniqueSlug(body.title);
    const readingTime = TextUtils.readingTime(body.body_md);
    const result = await dbRun(
      `INSERT INTO posts (slug, title, description, body_md, status, author_id, hero_image, reading_time, comments_disabled, updated_date)
       VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        slug,
        body.title,
        body.description || '',
        body.body_md || '',
        user.id,
        body.hero_image ?? null,
        readingTime,
        body.comments_disabled ? 1 : 0,
      ]
    );
    if (body.tag_names?.length) await syncTags(result.lastID, body.tag_names);
    const post = await getPostWithAuthor(result.lastID);
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

export async function updateAuthor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const postId = parseInt(req.params.id, 10);
    const post = await assertPostAccess(postId, user.id, canModeratePosts(user.role));
    const body = req.body as UpdatePostRequest;
    const readingTime = body.body_md ? TextUtils.readingTime(body.body_md) : post.reading_time;
    await dbRun(
      `UPDATE posts SET title = COALESCE(?, title), description = COALESCE(?, description),
       body_md = COALESCE(?, body_md), hero_image = COALESCE(?, hero_image),
       comments_disabled = COALESCE(?, comments_disabled), reading_time = ?,
       updated_date = CURRENT_TIMESTAMP WHERE id = ?`,
      [
        body.title ?? null,
        body.description ?? null,
        body.body_md ?? null,
        body.hero_image ?? null,
        body.comments_disabled === undefined ? null : body.comments_disabled ? 1 : 0,
        readingTime,
        postId,
      ]
    );
    if (body.tag_names) await syncTags(postId, body.tag_names);
    const updated = await getPostWithAuthor(postId);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function submitAuthor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const postId = parseInt(req.params.id, 10);
    const post = await assertPostAccess(postId, user.id, false);
    if (!['draft', 'rejected'].includes(post.status)) {
      throw AppError.badRequest('Only draft or rejected posts can be submitted.');
    }
    await dbRun(
      `UPDATE posts SET status = 'pending_review', submitted_at = CURRENT_TIMESTAMP,
       review_note = NULL, updated_date = CURRENT_TIMESTAMP WHERE id = ?`,
      [postId]
    );
    await recordReview(postId, user.id, 'submitted');
    const updated = await getPostWithAuthor(postId);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function deleteAuthor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const postId = parseInt(req.params.id, 10);
    const post = await assertPostAccess(postId, user.id, false);
    await dbRun('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ success: true, message: `Deleted “${post.title}”.` });
  } catch (err) {
    next(err);
  }
}

export async function unpublishAuthor(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = req.user!;
    const postId = parseInt(req.params.id, 10);
    const post = await assertPostAccess(postId, user.id, false);
    if (post.status !== 'published') {
      throw AppError.badRequest('Only published posts can be unpublished.');
    }
    await dbRun(
      `UPDATE posts SET status = 'draft', updated_date = CURRENT_TIMESTAMP WHERE id = ?`,
      [postId]
    );
    await recordReview(postId, user.id, 'changes_requested');
    const updated = await getPostWithAuthor(postId);
    res.json({ success: true, data: updated, message: 'Post unpublished.' });
  } catch (err) {
    next(err);
  }
}

export async function getAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = parseInt(req.params.id, 10);
    const post = await getPostWithAuthor(postId);
    if (!post) throw AppError.notFound('Post not found.');
    res.json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

export async function listAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const status = req.query.status as string | undefined;
    const params: unknown[] = [];
    let query = `SELECT p.*, u.display_name AS author_name FROM posts p JOIN users u ON u.id = p.author_id`;
    if (status) {
      query += ' WHERE p.status = ?';
      params.push(status);
    }
    query += ' ORDER BY p.updated_date DESC';
    const posts = await dbAll(query, params);
    res.json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
}

export async function adminQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const posts = await dbAll(
      `SELECT p.*, u.display_name AS author_name, u.email AS author_email
       FROM posts p JOIN users u ON u.id = p.author_id
       WHERE p.status = 'pending_review' ORDER BY p.submitted_at ASC`
    );
    res.json({ success: true, data: posts });
  } catch (err) {
    next(err);
  }
}

export async function createAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const admin = req.user!;
    const body = req.body as CreatePostRequest;
    const authorId = body.author_id ?? admin.id;
    const author = await dbGet('SELECT id FROM users WHERE id = ?', [authorId]);
    if (!author) throw AppError.badRequest('Author not found.');
    const slug = await generateUniqueSlug(body.title);
    const readingTime = TextUtils.readingTime(body.body_md);
    const result = await dbRun(
      `INSERT INTO posts (slug, title, description, body_md, status, author_id, hero_image, reading_time, comments_disabled, updated_date)
       VALUES (?, ?, ?, ?, 'draft', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        slug,
        body.title,
        body.description || '',
        body.body_md || '',
        authorId,
        body.hero_image ?? null,
        readingTime,
        body.comments_disabled ? 1 : 0,
      ]
    );
    if (body.tag_names?.length) await syncTags(result.lastID, body.tag_names);
    const post = await getPostWithAuthor(result.lastID);
    res.status(201).json({ success: true, data: post });
  } catch (err) {
    next(err);
  }
}

export async function updateAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = parseInt(req.params.id, 10);
    const post = await dbGet('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) throw AppError.notFound('Post not found.');
    req.params.id = String(postId);
    await updateAuthor(req, res, next);
  } catch (err) {
    next(err);
  }
}

export async function publishAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const admin = req.user!;
    const postId = parseInt(req.params.id, 10);
    const post = await dbGet<{ id: number; title: string; status: string }>(
      'SELECT id, title, status FROM posts WHERE id = ?',
      [postId]
    );
    if (!post) throw AppError.notFound('Post not found.');
    const slug = await generateUniqueSlug(post.title, postId);
    const now = new Date().toISOString();
    await dbRun(
      `UPDATE posts SET status = 'published', slug = ?, published_by = ?, published_at = ?,
       pub_date = COALESCE(pub_date, ?), updated_date = CURRENT_TIMESTAMP WHERE id = ?`,
      [slug, admin.id, now, now, postId]
    );
    await recordReview(postId, admin.id, 'approved');
    const updated = await getPostWithAuthor(postId);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function rejectAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const admin = req.user!;
    const postId = parseInt(req.params.id, 10);
    const note = (req.body as { note?: string }).note || 'Changes requested.';
    const post = await dbGet('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) throw AppError.notFound('Post not found.');
    await dbRun(
      `UPDATE posts SET status = 'rejected', review_note = ?, updated_date = CURRENT_TIMESTAMP WHERE id = ?`,
      [note, postId]
    );
    await recordReview(postId, admin.id, 'rejected', note);
    const updated = await getPostWithAuthor(postId);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
}

export async function unpublishAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const admin = req.user!;
    const postId = parseInt(req.params.id, 10);
    const post = await dbGet('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) throw AppError.notFound('Post not found.');
    await dbRun(
      `UPDATE posts SET status = 'draft', updated_date = CURRENT_TIMESTAMP WHERE id = ?`,
      [postId]
    );
    await recordReview(postId, admin.id, 'changes_requested');
    res.json({ success: true, message: 'Post unpublished.' });
  } catch (err) {
    next(err);
  }
}

export async function deleteAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const postId = parseInt(req.params.id, 10);
    const post = await dbGet<{ id: number; title: string }>(
      'SELECT id, title FROM posts WHERE id = ?',
      [postId]
    );
    if (!post) throw AppError.notFound('Post not found.');
    await dbRun('DELETE FROM posts WHERE id = ?', [postId]);
    res.json({ success: true, message: `Deleted “${post.title}”.` });
  } catch (err) {
    next(err);
  }
}
