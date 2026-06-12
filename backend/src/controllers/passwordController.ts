import type { Request, Response, NextFunction } from 'express';
import type {
  ChangePasswordRequest,
  ForgotPasswordRequest,
  RequestEmailChangeRequest,
  ResetPasswordRequest,
} from '@mr-brij/shared';
import { dbAll, dbGet, dbRun } from '../config/database.api.js';
import { AppError } from '../utils/AppError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import { constantTimeEqual, generateResetToken } from '../utils/session.js';
import { sendEmailChangeConfirmation, sendPasswordResetEmail } from '../utils/email.js';
import { isSecureRequest, setSessionCookie } from '../utils/authCookies.js';
import { generateSessionToken } from '../utils/session.js';
import { PROFILE_USER_SELECT } from '../utils/userQueries.js';
import type { ProfileUser } from '@mr-brij/shared';

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function loadProfile(userId: number): Promise<ProfileUser> {
  const row = await dbGet<ProfileUser & { has_password: number }>(
    `SELECT ${PROFILE_USER_SELECT} FROM users WHERE id = ?`,
    [userId]
  );
  if (!row) throw AppError.notFound('User not found.');
  return { ...row, has_password: Boolean(row.has_password) };
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const body = req.body as ChangePasswordRequest;
    const newPassword = String(body.new_password || '');
    if (newPassword.length < 8) {
      throw AppError.badRequest('New password must be at least 8 characters.');
    }

    const row = await dbGet<{ password_hash: string | null; oauth_provider: string }>(
      'SELECT password_hash, oauth_provider FROM users WHERE id = ?',
      [userId]
    );
    if (!row) throw AppError.notFound('User not found.');

    if (row.password_hash) {
      const current = String(body.current_password || '');
      if (!current) throw AppError.badRequest('Current password is required.');
      const valid = await verifyPassword(current, row.password_hash);
      if (!valid) throw AppError.unauthorized('Current password is incorrect.');
    }

    const passwordHash = await hashPassword(newPassword);
    await dbRun(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, userId]
    );
    res.json({ success: true, message: row.password_hash ? 'Password updated.' : 'Password set.' });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const email = normalizeEmail(String((req.body as ForgotPasswordRequest).email || ''));
    const genericMessage = 'If an account exists, we sent a reset link to that email.';

    if (!email) {
      res.json({ success: true, message: genericMessage });
      return;
    }

    const user = await dbGet<{ id: number; password_hash: string | null }>(
      'SELECT id, password_hash FROM users WHERE email = ? AND is_active = 1',
      [email]
    );

    if (user?.password_hash) {
      const token = generateResetToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await dbRun(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, token, expiresAt]
      );
      try {
        await sendPasswordResetEmail(req, email, token);
      } catch (err) {
        console.error('[forgot-password] email send failed:', err);
      }
    }

    res.json({ success: true, message: genericMessage });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as ResetPasswordRequest;
    const token = String(body.token || '');
    const newPassword = String(body.new_password || '');
    if (!token || newPassword.length < 8) {
      throw AppError.badRequest('Valid token and password (min 8 characters) are required.');
    }

    const allRows = await dbAll<{
      id: number;
      user_id: number;
      token: string;
      expires_at: string;
      used_at: string | null;
    }>(
      `SELECT id, user_id, token, expires_at, used_at FROM password_reset_tokens
       WHERE used_at IS NULL AND expires_at > datetime('now')
       ORDER BY created_at DESC LIMIT 50`
    );

    const match = allRows.find((row) => constantTimeEqual(row.token, token));
    if (!match) throw AppError.badRequest('Invalid or expired reset link.');

    const passwordHash = await hashPassword(newPassword);
    await dbRun(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, match.user_id]
    );
    await dbRun(
      'UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?',
      [match.id]
    );
    await dbRun('UPDATE users SET session_token = NULL WHERE id = ?', [match.user_id]);

    res.json({ success: true, message: 'Password reset. You can sign in with your new password.' });
  } catch (err) {
    next(err);
  }
}

export async function requestEmailChange(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user!.id;
    const body = req.body as RequestEmailChangeRequest;
    const newEmail = normalizeEmail(String(body.new_email || ''));
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      throw AppError.badRequest('Enter a valid email address.');
    }

    const row = await dbGet<{ email: string; password_hash: string | null }>(
      'SELECT email, password_hash FROM users WHERE id = ?',
      [userId]
    );
    if (!row) throw AppError.notFound('User not found.');
    if (row.email === newEmail) throw AppError.badRequest('That is already your email.');

    const taken = await dbGet('SELECT id FROM users WHERE email = ? AND id != ?', [newEmail, userId]);
    if (taken) throw AppError.badRequest('That email is already in use.');

    if (row.password_hash) {
      const current = String(body.current_password || '');
      if (!current) throw AppError.badRequest('Current password is required.');
      const valid = await verifyPassword(current, row.password_hash);
      if (!valid) throw AppError.unauthorized('Current password is incorrect.');
    }

    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await dbRun('DELETE FROM email_change_tokens WHERE user_id = ?', [userId]);
    await dbRun(
      'INSERT INTO email_change_tokens (user_id, new_email, token, expires_at) VALUES (?, ?, ?, ?)',
      [userId, newEmail, token, expiresAt]
    );
    try {
      await sendEmailChangeConfirmation(req, newEmail, token);
    } catch (err) {
      console.error('[email-change] send failed:', err);
      throw AppError.badRequest('Could not send confirmation email. Try again later.');
    }
    res.json({ success: true, message: 'Confirmation email sent to the new address.' });
  } catch (err) {
    next(err);
  }
}

export async function confirmEmailChange(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = String(req.params.token || '');
    if (!token) throw AppError.badRequest('Invalid confirmation link.');

    const rows = await dbAll<{
      id: number;
      user_id: number;
      new_email: string;
      token: string;
      used_at: string | null;
    }>(
      `SELECT id, user_id, new_email, token, used_at FROM email_change_tokens
       WHERE used_at IS NULL AND expires_at > datetime('now')
       ORDER BY created_at DESC LIMIT 50`
    );
    const match = rows.find((row) => constantTimeEqual(row.token, token));
    if (!match) throw AppError.badRequest('Invalid or expired confirmation link.');

    const taken = await dbGet('SELECT id FROM users WHERE email = ? AND id != ?', [
      match.new_email,
      match.user_id,
    ]);
    if (taken) throw AppError.badRequest('That email is no longer available.');

    await dbRun(
      'UPDATE users SET email = ?, session_token = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [match.new_email, match.user_id]
    );
    await dbRun('UPDATE email_change_tokens SET used_at = CURRENT_TIMESTAMP WHERE id = ?', [match.id]);

    const sessionToken = generateSessionToken();
    await dbRun('UPDATE users SET session_token = ? WHERE id = ?', [sessionToken, match.user_id]);
    setSessionCookie(res, sessionToken, isSecureRequest(req));

    const profile = await loadProfile(match.user_id);
    res.json({ success: true, data: profile, message: 'Email updated successfully.' });
  } catch (err) {
    next(err);
  }
}

export function getForgotPasswordPage(req: Request, res: Response): void {
  res.type('html').send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Forgot password — Mr Brij</title>
<style>body{font-family:system-ui,sans-serif;max-width:24rem;margin:3rem auto;padding:0 1rem;color:#0f172a}
label{display:block;font-size:.875rem;margin-bottom:.25rem}input{width:100%;box-sizing:border-box;padding:.5rem;margin-bottom:.75rem;border:1px solid #cbd5e1;border-radius:.375rem}
button{width:100%;padding:.5rem;background:#0f172a;color:#fff;border:none;border-radius:.375rem;cursor:pointer}
.error{color:#b91c1c;font-size:.875rem}.ok{color:#15803d;font-size:.875rem}a{color:#0f172a}</style></head><body>
<h1>Forgot password</h1><p id="msg"></p>
<form id="form"><label for="email">Email</label><input id="email" type="email" required autocomplete="email"/>
<button type="submit">Send reset link</button></form>
<p><a href="/auth/signin">Back to sign in</a></p>
<script>
document.getElementById('form').addEventListener('submit',async(e)=>{e.preventDefault();
const email=document.getElementById('email').value;const msg=document.getElementById('msg');
const res=await fetch('/api/auth/forgot-password',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
const json=await res.json();msg.className=res.ok?'ok':'error';msg.textContent=json.message||'Request failed.';});
</script></body></html>`);
}

export function getResetPasswordPage(req: Request, res: Response): void {
  const token = String(req.query.token || '');
  res.type('html').send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Reset password — Mr Brij</title>
<style>body{font-family:system-ui,sans-serif;max-width:24rem;margin:3rem auto;padding:0 1rem;color:#0f172a}
label{display:block;font-size:.875rem;margin-bottom:.25rem}input{width:100%;box-sizing:border-box;padding:.5rem;margin-bottom:.75rem;border:1px solid #cbd5e1;border-radius:.375rem}
button{width:100%;padding:.5rem;background:#0f172a;color:#fff;border:none;border-radius:.375rem;cursor:pointer}
.error{color:#b91c1c;font-size:.875rem}.ok{color:#15803d;font-size:.875rem}</style></head><body>
<h1>Reset password</h1><p id="msg"></p>
<form id="form"><label for="password">New password (min 8)</label><input id="password" type="password" minlength="8" required autocomplete="new-password"/>
<button type="submit">Update password</button></form>
<script>
const token=${JSON.stringify(token)};
document.getElementById('form').addEventListener('submit',async(e)=>{e.preventDefault();
const password=document.getElementById('password').value;const msg=document.getElementById('msg');
const res=await fetch('/api/auth/reset-password',{method:'POST',headers:{'Content-Type':'application/json'},credentials:'include',body:JSON.stringify({token,password})});
const json=await res.json();msg.className=res.ok?'ok':'error';msg.textContent=json.message||'Request failed.';
if(res.ok)setTimeout(()=>location.href='/auth/signin',1500);});
</script></body></html>`);
}
