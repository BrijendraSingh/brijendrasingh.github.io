import type { Request, Response, NextFunction } from 'express';
import type { SafeUser } from '@mr-brij/shared';
import { dbGet, dbRun } from '../config/database.api.js';
import { isAdminEmail } from '../middleware/requireSession.js';
import { AppError } from '../utils/AppError.js';
import { getRedirectBase, isSecureRequest, setSessionCookie } from '../utils/authCookies.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { generateSessionToken } from '../utils/session.js';
import { SAFE_USER_SELECT } from '../utils/userQueries.js';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function defaultDisplayName(email: string): string {
  const local = email.split('@')[0] || email;
  return local.replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

async function establishSession(req: Request, res: Response, userId: number): Promise<SafeUser> {
  const token = generateSessionToken();
  await dbRun(
    'UPDATE users SET session_token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [token, userId]
  );
  setSessionCookie(res, token, isSecureRequest(req));
  const user = await dbGet<SafeUser>(
    `SELECT ${SAFE_USER_SELECT} FROM users WHERE id = ?`,
    [userId]
  );
  if (!user) throw AppError.badRequest('Failed to load user.');
  return user;
}

function oauthProviderLabel(provider: string): string {
  if (provider === 'google') return 'Google';
  if (provider === 'github') return 'GitHub';
  return provider;
}

export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = normalizeEmail(String(req.body.email || ''));
    const password = String(req.body.password || '');
    const displayName = String(req.body.display_name || '').trim() || defaultDisplayName(email);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw AppError.badRequest('Enter a valid email address.');
    }
    if (password.length < 8) {
      throw AppError.badRequest('Password must be at least 8 characters.');
    }

    const existing = await dbGet<{ id: number; oauth_provider: string; password_hash: string | null }>(
      'SELECT id, oauth_provider, password_hash FROM users WHERE email = ?',
      [email]
    );

    if (existing) {
      if (existing.password_hash) {
        throw AppError.badRequest('An account with this email already exists. Sign in instead.');
      }
      throw AppError.badRequest(
        `This email is registered via ${oauthProviderLabel(existing.oauth_provider)}. Use that sign-in method.`
      );
    }

    const passwordHash = await hashPassword(password);
    const role = isAdminEmail(email) ? 'admin' : 'reader';
    const result = await dbRun(
      `INSERT INTO users (email, display_name, avatar_url, avatar_source, oauth_provider, oauth_subject, password_hash, role, session_token)
       VALUES (?, ?, NULL, 'url', 'email', ?, ?, ?, NULL)`,
      [email, displayName, email, passwordHash, role]
    );

    const user = await establishSession(req, res, result.lastID);
    res.status(201).json({ success: true, data: user, message: 'Account created.' });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = normalizeEmail(String(req.body.email || ''));
    const password = String(req.body.password || '');

    if (!email || !password) {
      throw AppError.badRequest('Email and password are required.');
    }

    const row = await dbGet<{
      id: number;
      oauth_provider: string;
      password_hash: string | null;
    }>('SELECT id, oauth_provider, password_hash FROM users WHERE email = ?', [email]);

    if (!row || !row.password_hash) {
      if (row && row.oauth_provider !== 'email') {
        throw AppError.unauthorized(
          `This account uses ${oauthProviderLabel(row.oauth_provider)} sign-in. Use that method instead.`
        );
      }
      throw AppError.unauthorized('Invalid email or password.');
    }

    const valid = await verifyPassword(password, row.password_hash);
    if (!valid) throw AppError.unauthorized('Invalid email or password.');

    const user = await establishSession(req, res, row.id);
    res.json({ success: true, data: user, message: 'Signed in.' });
  } catch (err) {
    next(err);
  }
}

export function getSignupPage(req: Request, res: Response): void {
  const returnTo = (req.query.returnTo as string) || '/';
  const base = getRedirectBase(req);
  res.type('html').send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sign in — Mr Brij</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 24rem; margin: 3rem auto; padding: 0 1rem; color: #0f172a; }
    h1 { font-size: 1.25rem; margin-bottom: 1rem; }
    label { display: block; font-size: 0.875rem; margin-bottom: 0.25rem; }
    input { width: 100%; box-sizing: border-box; padding: 0.5rem; margin-bottom: 0.75rem; border: 1px solid #cbd5e1; border-radius: 0.375rem; }
    button, .btn { display: block; width: 100%; padding: 0.5rem; margin-bottom: 0.5rem; border-radius: 0.375rem; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; text-align: center; text-decoration: none; color: inherit; font-size: 0.875rem; }
    button[type="submit"] { background: #0f172a; color: #fff; border-color: #0f172a; }
    .divider { text-align: center; color: #64748b; font-size: 0.75rem; margin: 0.75rem 0; }
    .error { color: #b91c1c; font-size: 0.875rem; margin-bottom: 0.75rem; }
    .tabs { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
    .tab { flex: 1; padding: 0.5rem; border: 1px solid #cbd5e1; background: #f8fafc; cursor: pointer; border-radius: 0.375rem; }
    .tab.active { background: #0f172a; color: #fff; border-color: #0f172a; }
    .panel { display: none; }
    .panel.active { display: block; }
  </style>
</head>
<body>
  <h1>Join the conversation</h1>
  <div class="tabs">
    <button type="button" class="tab active" data-tab="signin">Sign in</button>
    <button type="button" class="tab" data-tab="signup">Sign up</button>
  </div>
  <div id="error" class="error" hidden></div>
  <div id="signin" class="panel active">
    <form id="signin-form">
      <label for="signin-email">Email</label>
      <input id="signin-email" name="email" type="email" autocomplete="email" required />
      <label for="signin-password">Password</label>
      <input id="signin-password" name="password" type="password" autocomplete="current-password" required />
      <button type="submit">Sign in with email</button>
    </form>
    <p class="divider"><a href="/auth/forgot-password">Forgot password?</a></p>
  </div>
  <div id="signup" class="panel">
    <form id="signup-form">
      <label for="signup-name">Display name (optional)</label>
      <input id="signup-name" name="display_name" type="text" autocomplete="name" />
      <label for="signup-email">Email</label>
      <input id="signup-email" name="email" type="email" autocomplete="email" required />
      <label for="signup-password">Password (min 8 characters)</label>
      <input id="signup-password" name="password" type="password" autocomplete="new-password" minlength="8" required />
      <button type="submit">Create account</button>
    </form>
  </div>
  <div class="divider">or continue with</div>
  <a class="btn" href="${base}/auth/google?returnTo=${encodeURIComponent(returnTo)}">Sign in with Google</a>
  <a class="btn" href="${base}/auth/github?returnTo=${encodeURIComponent(returnTo)}">Sign in with GitHub</a>
  <script>
    const returnTo = ${JSON.stringify(returnTo)};
    const errorEl = document.getElementById('error');
    document.querySelectorAll('.tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tab.dataset.tab).classList.add('active');
        errorEl.hidden = true;
      });
    });
    async function submitAuth(path, body) {
      errorEl.hidden = true;
      const res = await fetch(path, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        errorEl.textContent = json.message || 'Request failed.';
        errorEl.hidden = false;
        return;
      }
      window.location.href = returnTo;
    }
    document.getElementById('signin-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      submitAuth('/api/auth/login', { email: fd.get('email'), password: fd.get('password') });
    });
    document.getElementById('signup-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      submitAuth('/api/auth/signup', {
        email: fd.get('email'),
        password: fd.get('password'),
        display_name: fd.get('display_name') || undefined,
      });
    });
  </script>
</body>
</html>`);
}
