import type { Request, Response, NextFunction } from 'express';
import type { SafeUser } from '@mr-brij/shared';
import { dbGet } from '../config/database.api.js';
import { getSessionTokenFromRequest } from '../utils/session.js';
import { SAFE_USER_SELECT } from '../utils/userQueries.js';

declare global {
  namespace Express {
    interface Request {
      user?: SafeUser;
    }
  }
}

export async function optionalSession(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = getSessionTokenFromRequest(req);
    if (!token) {
      next();
      return;
    }
    const user = await dbGet<SafeUser & { is_active: number }>(
      `SELECT ${SAFE_USER_SELECT}, is_active
       FROM users WHERE session_token = ?`,
      [token]
    );
    if (user && user.is_active) {
      const { is_active: _active, ...safeUser } = user;
      req.user = safeUser;
    }
    next();
  } catch (err) {
    next(err);
  }
}
