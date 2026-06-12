import type { Request, Response, NextFunction } from 'express';
import type { SafeUser } from '@mr-brij/shared';
import { dbGet } from '../config/database.api.js';
import { getSessionTokenFromRequest } from '../utils/session.js';

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
    const user = await dbGet<SafeUser>(
      `SELECT id, email, display_name, avatar_url, role
       FROM users WHERE session_token = ?`,
      [token]
    );
    if (user) req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
