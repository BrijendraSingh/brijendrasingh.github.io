import type { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitEntry>();

function getKey(req: Request, prefix: string): string {
  const ip =
    (typeof req.headers['cf-connecting-ip'] === 'string' && req.headers['cf-connecting-ip']) ||
    (typeof req.headers['x-forwarded-for'] === 'string' &&
      req.headers['x-forwarded-for'].split(',')[0]?.trim()) ||
    'local';
  const email = typeof req.body?.email === 'string' ? req.body.email.toLowerCase() : '';
  return `${prefix}:${ip}:${email}`;
}

export function createRateLimiter(options: {
  windowMs: number;
  max: number;
  prefix: string;
  message?: string;
}) {
  const { windowMs, max, prefix, message = 'Too many requests. Try again later.' } = options;
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = getKey(req, prefix);
    const now = Date.now();
    let entry = buckets.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      buckets.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.status(429).json({ success: false, message });
      return;
    }
    next();
  };
}

export const authRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  prefix: 'auth',
});

export const forgotPasswordRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  prefix: 'forgot-password',
});
