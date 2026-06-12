import type { Request, Response, NextFunction } from 'express';
import type { SafeUser } from '@mr-brij/shared';
import { dbGet } from '../config/database.api.js';
import { getSessionTokenFromRequest } from '../utils/session.js';
import { AppError } from '../utils/AppError.js';

export async function requireSession(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getSessionTokenFromRequest(req);
    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }
    const user = await dbGet<SafeUser>(
      `SELECT id, email, display_name, avatar_url, role
       FROM users WHERE session_token = ?`,
      [token]
    );
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid or expired session.' });
      return;
    }
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required.' });
    return;
  }
  next();
}

export function requireAuthorOrAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'author')) {
    res.status(403).json({ success: false, message: 'Author access required.' });
    return;
  }
  next();
}

/** Any signed-in user may write; readers are promoted to author on first write action. */
export async function requireWriter(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Authentication required.' });
    return;
  }
  if (req.user.role === 'reader') {
    await promoteToAuthorIfNeeded(req.user.id, req.user.role);
    req.user.role = 'author';
  }
  if (req.user.role !== 'admin' && req.user.role !== 'author') {
    res.status(403).json({ success: false, message: 'Cannot write posts.' });
    return;
  }
  next();
}

export async function promoteToAuthorIfNeeded(userId: number, currentRole: string): Promise<void> {
  if (currentRole === 'reader') {
    const { dbRun } = await import('../config/database.api.js');
    await dbRun(
      `UPDATE users SET role = 'author', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND role = 'reader'`,
      [userId]
    );
  }
}

export function isAdminEmail(email: string): boolean {
  const list = (process.env.ADMIN_EMAILS || 'bps.brijendra@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase());
  return list.includes(email.toLowerCase());
}
