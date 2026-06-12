import type { Request, Response, NextFunction } from 'express';
import type { OAuthProvider, SafeUser } from '@mr-brij/shared';
import { APP_CONFIG } from '@mr-brij/shared';
import { dbGet, dbRun } from '../config/database.api.js';
import { getRedirectBase, isSecureRequest, setSessionCookie } from '../utils/authCookies.js';
import { generateSessionToken } from '../utils/session.js';
import { isAdminEmail } from '../middleware/requireSession.js';
import { AppError } from '../utils/AppError.js';
import { SAFE_USER_SELECT } from '../utils/userQueries.js';
import {
  getOAuthEnv,
  isGitHubOAuthConfigured,
  isGoogleOAuthConfigured,
  oauthSetupHtml,
} from '../utils/oauthConfig.js';

const OAUTH_STATE_COOKIE = 'oauth_state';

interface OAuthProfile {
  provider: OAuthProvider;
  subject: string;
  email: string;
  name: string;
  avatar: string | null;
}

function clearOAuthStateCookie(res: Response): void {
  res.append('Set-Cookie', `${OAUTH_STATE_COOKIE}=; Path=/; HttpOnly; Max-Age=0`);
}

async function updateExistingUser(
  userId: number,
  currentRole: string,
  profile: OAuthProfile,
  token: string
): Promise<SafeUser> {
  const existing = await dbGet<{ avatar_source: string }>(
    'SELECT avatar_source FROM users WHERE id = ?',
    [userId]
  );
  const updateAvatar = existing?.avatar_source === 'oauth';
  await dbRun(
    `UPDATE users SET email = ?, display_name = ?,
     avatar_url = CASE WHEN ? THEN ? ELSE avatar_url END,
     oauth_provider = ?, oauth_subject = ?, session_token = ?,
     updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
    [
      profile.email,
      profile.name,
      updateAvatar ? 1 : 0,
      profile.avatar,
      profile.provider,
      profile.subject,
      token,
      userId,
    ]
  );
  const user = await dbGet<SafeUser>(
    `SELECT ${SAFE_USER_SELECT} FROM users WHERE id = ?`,
    [userId]
  );
  if (!user) throw AppError.badRequest('Failed to load user.');
  return user;
}

async function upsertUser(profile: OAuthProfile): Promise<SafeUser> {
  const existing = await dbGet<{ id: number; role: string }>(
    `SELECT id, role FROM users WHERE oauth_provider = ? AND oauth_subject = ?`,
    [profile.provider, profile.subject]
  );

  const token = generateSessionToken();

  if (existing) {
    return updateExistingUser(existing.id, existing.role, profile, token);
  }

  const byEmail = await dbGet<{ id: number; role: string }>(
    `SELECT id, role FROM users WHERE email = ?`,
    [profile.email]
  );
  if (byEmail) {
    return updateExistingUser(byEmail.id, byEmail.role, profile, token);
  }

  const role = isAdminEmail(profile.email) ? 'admin' : 'reader';
  const result = await dbRun(
    `INSERT INTO users (email, display_name, avatar_url, avatar_source, oauth_provider, oauth_subject, role, session_token)
     VALUES (?, ?, ?, 'oauth', ?, ?, ?, ?)`,
    [profile.email, profile.name, profile.avatar, profile.provider, profile.subject, role, token]
  );
  const user = await dbGet<SafeUser>(
    `SELECT ${SAFE_USER_SELECT} FROM users WHERE id = ?`,
    [result.lastID]
  );
  if (!user) throw AppError.badRequest('Failed to create user.');
  return user;
}

async function fetchGoogleProfile(code: string, redirectUri: string): Promise<OAuthProfile> {
  const clientId = getOAuthEnv('GOOGLE_CLIENT_ID');
  const clientSecret = getOAuthEnv('GOOGLE_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw AppError.badRequest('Google OAuth not configured.');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenRes.ok || !tokenData.access_token) {
    throw AppError.badRequest(tokenData.error || 'Google token exchange failed.');
  }

  const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });
  const profile = (await profileRes.json()) as {
    id: string;
    email: string;
    name: string;
    picture?: string;
  };
  return {
    provider: 'google',
    subject: profile.id,
    email: profile.email,
    name: profile.name || profile.email,
    avatar: profile.picture ?? null,
  };
}

async function fetchGitHubProfile(code: string, redirectUri: string): Promise<OAuthProfile> {
  const clientId = getOAuthEnv('GITHUB_CLIENT_ID');
  const clientSecret = getOAuthEnv('GITHUB_CLIENT_SECRET');
  if (!clientId || !clientSecret) throw AppError.badRequest('GitHub OAuth not configured.');

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code, redirect_uri: redirectUri }),
  });
  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenRes.ok || !tokenData.access_token) {
    throw AppError.badRequest(tokenData.error || 'GitHub token exchange failed.');
  }

  const profileRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'mr-brij-blog',
    },
  });
  const profile = (await profileRes.json()) as {
    id: number;
    login: string;
    name: string | null;
    avatar_url?: string;
    email?: string | null;
  };

  let email = profile.email;
  if (!email) {
    const emailsRes = await fetch('https://api.github.com/user/emails', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'mr-brij-blog',
      },
    });
    const emails = (await emailsRes.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
    email = emails.find((e) => e.primary && e.verified)?.email || emails[0]?.email;
  }
  if (!email) throw AppError.badRequest('GitHub account has no public email.');

  return {
    provider: 'github',
    subject: String(profile.id),
    email,
    name: profile.name || profile.login,
    avatar: profile.avatar_url ?? null,
  };
}

export async function startGoogle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!isGoogleOAuthConfigured()) {
      res.status(503).type('html').send(oauthSetupHtml('google', getRedirectBase(req)));
      return;
    }
    const clientId = getOAuthEnv('GOOGLE_CLIENT_ID')!;
    const redirectUri = `${getRedirectBase(req)}/auth/google/callback`;
    const returnTo = (req.query.returnTo as string) || '/';
    const state = Buffer.from(JSON.stringify({ returnTo })).toString('base64url');
    res.append('Set-Cookie', `${OAUTH_STATE_COOKIE}=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid email profile');
    url.searchParams.set('state', state);
    res.redirect(url.toString());
  } catch (err) {
    next(err);
  }
}

export async function callbackGoogle(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const code = req.query.code as string;
    if (!code) throw AppError.badRequest('Missing OAuth code.');
    const redirectUri = `${getRedirectBase(req)}/auth/google/callback`;
    const profile = await fetchGoogleProfile(code, redirectUri);
    const user = await upsertUser(profile);
    const tokenRow = await dbGet<{ session_token: string }>(
      'SELECT session_token FROM users WHERE id = ?',
      [user.id]
    );
    if (tokenRow?.session_token) setSessionCookie(res, tokenRow.session_token, isSecureRequest(req));
    clearOAuthStateCookie(res);
    const stateRaw = req.query.state as string;
    let returnTo = '/';
    try {
      if (stateRaw) returnTo = JSON.parse(Buffer.from(stateRaw, 'base64url').toString()).returnTo || '/';
    } catch {
      /* use default */
    }
    res.redirect(returnTo);
  } catch (err) {
    next(err);
  }
}

export async function startGitHub(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!isGitHubOAuthConfigured()) {
      res.status(503).type('html').send(oauthSetupHtml('github', getRedirectBase(req)));
      return;
    }
    const clientId = getOAuthEnv('GITHUB_CLIENT_ID')!;
    const redirectUri = `${getRedirectBase(req)}/auth/github/callback`;
    const returnTo = (req.query.returnTo as string) || '/';
    const state = Buffer.from(JSON.stringify({ returnTo })).toString('base64url');
    res.append('Set-Cookie', `${OAUTH_STATE_COOKIE}=${state}; Path=/; HttpOnly; SameSite=Lax; Max-Age=600`);
    const url = new URL('https://github.com/login/oauth/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', 'read:user user:email');
    url.searchParams.set('state', state);
    res.redirect(url.toString());
  } catch (err) {
    next(err);
  }
}

export async function callbackGitHub(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const code = req.query.code as string;
    if (!code) throw AppError.badRequest('Missing OAuth code.');
    const redirectUri = `${getRedirectBase(req)}/auth/github/callback`;
    const profile = await fetchGitHubProfile(code, redirectUri);
    const user = await upsertUser(profile);
    const tokenRow = await dbGet<{ session_token: string }>(
      'SELECT session_token FROM users WHERE id = ?',
      [user.id]
    );
    if (tokenRow?.session_token) setSessionCookie(res, tokenRow.session_token, isSecureRequest(req));
    clearOAuthStateCookie(res);
    const stateRaw = req.query.state as string;
    let returnTo = '/';
    try {
      if (stateRaw) returnTo = JSON.parse(Buffer.from(stateRaw, 'base64url').toString()).returnTo || '/';
    } catch {
      /* use default */
    }
    res.redirect(returnTo);
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (req.user) {
      await dbRun('UPDATE users SET session_token = NULL WHERE id = ?', [req.user.id]);
    }
    res.append('Set-Cookie', `${APP_CONFIG.SESSION_COOKIE}=; Path=/; HttpOnly; Max-Age=0`);
    res.json({ success: true, message: 'Logged out.' });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.json({ success: true, data: null });
      return;
    }
    res.json({ success: true, data: req.user });
  } catch (err) {
    next(err);
  }
}
