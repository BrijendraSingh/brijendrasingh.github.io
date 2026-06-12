import { randomBytes } from 'node:crypto';

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex');
}

export function generateUnsubscribeToken(): string {
  return randomBytes(24).toString('hex');
}

export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  return Object.fromEntries(
    cookieHeader.split(';').map((part) => {
      const [key, ...rest] = part.trim().split('=');
      return [key, decodeURIComponent(rest.join('='))];
    })
  );
}

export function getSessionTokenFromRequest(req: {
  headers: Record<string, string | string[] | undefined>;
}): string | undefined {
  const auth = req.headers.authorization;
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) {
    return auth.slice(7);
  }
  const cookieHeader =
    typeof req.headers.cookie === 'string'
      ? req.headers.cookie
      : typeof req.headers.Cookie === 'string'
        ? req.headers.Cookie
        : undefined;
  const cookies = parseCookies(cookieHeader);
  return cookies.mr_brij_session;
}
