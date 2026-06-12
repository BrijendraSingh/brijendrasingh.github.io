import type { Request, Response, NextFunction } from 'express';
import type { AdminUpdateUserRequest, AdminUserRow, UserRole } from '@mr-brij/shared';
import { APP_CONFIG } from '@mr-brij/shared';
import { dbAll, dbGet, dbRun } from '../config/database.api.js';
import { AppError } from '../utils/AppError.js';
import { isValidRole } from '../middleware/requireSession.js';

async function countActiveAdmins(): Promise<number> {
  const row = await dbGet<{ total: number }>(
    `SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND is_active = 1`
  );
  return row?.total ?? 0;
}

async function logAudit(
  actorId: number,
  targetId: number,
  action: string,
  oldValue: string | null,
  newValue: string | null
): Promise<void> {
  await dbRun(
    `INSERT INTO user_audit_log (actor_id, target_id, action, old_value, new_value) VALUES (?, ?, ?, ?, ?)`,
    [actorId, targetId, action, oldValue, newValue]
  );
}

export async function listUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
    const limit = Math.min(
      APP_CONFIG.MAX_PAGE_SIZE,
      Math.max(1, parseInt(req.query.limit as string, 10) || APP_CONFIG.DEFAULT_PAGE_SIZE)
    );
    const offset = (page - 1) * limit;
    const q = String(req.query.q || '').trim().toLowerCase();
    const roleFilter = String(req.query.role || '').trim();

    const conditions: string[] = [];
    const params: unknown[] = [];
    if (q) {
      conditions.push('(LOWER(email) LIKE ? OR LOWER(display_name) LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (roleFilter && isValidRole(roleFilter)) {
      conditions.push('role = ?');
      params.push(roleFilter);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = await dbGet<{ total: number }>(
      `SELECT COUNT(*) AS total FROM users ${where}`,
      params
    );
    const users = await dbAll<AdminUserRow>(
      `SELECT id, email, display_name, avatar_url, role, oauth_provider, is_active, created_at, updated_at
       FROM users ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total: countRow?.total ?? 0,
          totalPages: Math.ceil((countRow?.total ?? 0) / limit),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = parseInt(req.params.id, 10);
    const user = await dbGet<AdminUserRow>(
      `SELECT id, email, display_name, avatar_url, role, oauth_provider, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );
    if (!user) throw AppError.notFound('User not found.');

    const postCount = await dbGet<{ total: number }>(
      'SELECT COUNT(*) AS total FROM posts WHERE author_id = ?',
      [userId]
    );
    const commentCount = await dbGet<{ total: number }>(
      'SELECT COUNT(*) AS total FROM comments WHERE user_id = ? AND is_deleted = 0',
      [userId]
    );

    res.json({
      success: true,
      data: {
        ...user,
        stats: {
          posts: postCount?.total ?? 0,
          comments: commentCount?.total ?? 0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = req.user!;
    const userId = parseInt(req.params.id, 10);
    const body = req.body as AdminUpdateUserRequest;

    const target = await dbGet<{ id: number; role: UserRole; is_active: number }>(
      'SELECT id, role, is_active FROM users WHERE id = ?',
      [userId]
    );
    if (!target) throw AppError.notFound('User not found.');

    if (body.role !== undefined) {
      if (!isValidRole(body.role)) throw AppError.badRequest('Invalid role.');
      if (actor.id === userId) {
        throw AppError.forbidden('You cannot change your own role.');
      }
      if (target.role === 'admin' && body.role !== 'admin') {
        const adminCount = await countActiveAdmins();
        if (adminCount <= 1) {
          throw AppError.forbidden('Cannot demote the last active admin.');
        }
      }
      if (body.role !== target.role) {
        await dbRun(
          'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [body.role, userId]
        );
        await logAudit(actor.id, userId, 'role_change', target.role, body.role);
      }
    }

    if (body.is_active !== undefined) {
      const nextActive = body.is_active ? 1 : 0;
      if (actor.id === userId && !body.is_active) {
        throw AppError.forbidden('You cannot deactivate your own account.');
      }
      if (target.role === 'admin' && !body.is_active) {
        const adminCount = await countActiveAdmins();
        if (adminCount <= 1) {
          throw AppError.forbidden('Cannot deactivate the last active admin.');
        }
      }
      if (nextActive !== target.is_active) {
        await dbRun(
          'UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [nextActive, userId]
        );
        if (!body.is_active) {
          await dbRun('UPDATE users SET session_token = NULL WHERE id = ?', [userId]);
        }
        await logAudit(
          actor.id,
          userId,
          'is_active_change',
          String(target.is_active),
          String(nextActive)
        );
      }
    }

    const updated = await dbGet<AdminUserRow>(
      `SELECT id, email, display_name, avatar_url, role, oauth_provider, is_active, created_at, updated_at
       FROM users WHERE id = ?`,
      [userId]
    );
    res.json({ success: true, data: updated, message: 'User updated.' });
  } catch (err) {
    next(err);
  }
}

export async function resetUserSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const actor = req.user!;
    const userId = parseInt(req.params.id, 10);
    const target = await dbGet('SELECT id FROM users WHERE id = ?', [userId]);
    if (!target) throw AppError.notFound('User not found.');
    await dbRun('UPDATE users SET session_token = NULL WHERE id = ?', [userId]);
    await logAudit(actor.id, userId, 'session_reset', null, null);
    res.json({ success: true, message: 'User sessions cleared.' });
  } catch (err) {
    next(err);
  }
}
