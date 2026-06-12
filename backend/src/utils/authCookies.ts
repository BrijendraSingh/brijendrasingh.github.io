import type { Request, Response } from 'express';
import { APP_CONFIG } from '@mr-brij/shared';

export function getRedirectBase(req: Request): string {
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:8787';
  return `${proto}://${host}`;
}

export function setSessionCookie(res: Response, token: string, secure: boolean): void {
  const maxAge = APP_CONFIG.SESSION_MAX_AGE_DAYS * 24 * 60 * 60;
  const parts = [
    `${APP_CONFIG.SESSION_COOKIE}=${token}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAge}`,
  ];
  if (secure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}

export function isSecureRequest(req: Request): boolean {
  return getRedirectBase(req).startsWith('https');
}
