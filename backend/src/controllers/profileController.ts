import type { Request, Response, NextFunction } from 'express';
import type { ProfileUser, UpdateProfileRequest, UploadAvatarRequest } from '@mr-brij/shared';
import { dbGet, dbRun } from '../config/database.api.js';
import { AppError } from '../utils/AppError.js';
import { PROFILE_USER_SELECT } from '../utils/userQueries.js';
import { uploadAvatarToCloudflare, validateAvatarPayload } from '../utils/images.js';

async function loadProfile(userId: number): Promise<ProfileUser> {
  const row = await dbGet<ProfileUser & { has_password: number }>(
    `SELECT ${PROFILE_USER_SELECT} FROM users WHERE id = ?`,
    [userId]
  );
  if (!row) throw AppError.notFound('User not found.');
  return { ...row, has_password: Boolean(row.has_password) };
}

export async function getProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const profile = await loadProfile(req.user!.id);
    res.json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const body = req.body as UpdateProfileRequest;
    const current = await dbGet<{
      oauth_provider: string;
      avatar_url: string | null;
      avatar_source: string;
    }>('SELECT oauth_provider, avatar_url, avatar_source FROM users WHERE id = ?', [userId]);
    if (!current) throw AppError.notFound('User not found.');

    const displayName = body.display_name?.trim();
    if (displayName !== undefined && (displayName.length < 1 || displayName.length > 100)) {
      throw AppError.badRequest('Display name must be 1–100 characters.');
    }
    const bio = body.bio === undefined ? undefined : body.bio?.trim().slice(0, 500) || null;

    let avatarUrl = body.avatar_url;
    let avatarSource = body.avatar_source;
    if (avatarSource === 'oauth') {
      if (current.oauth_provider === 'email') {
        throw AppError.badRequest('Email accounts cannot revert to OAuth avatar.');
      }
      avatarSource = 'oauth';
    } else if (avatarUrl !== undefined) {
      if (avatarUrl && !/^https?:\/\//i.test(avatarUrl)) {
        throw AppError.badRequest('Avatar URL must start with http:// or https://');
      }
      avatarSource = avatarUrl ? 'url' : current.avatar_source;
    }

    await dbRun(
      `UPDATE users SET
        display_name = COALESCE(?, display_name),
        bio = COALESCE(?, bio),
        avatar_url = COALESCE(?, avatar_url),
        avatar_source = COALESCE(?, avatar_source),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        displayName ?? null,
        bio === undefined ? null : bio,
        avatarUrl === undefined ? null : avatarUrl,
        avatarSource ?? null,
        userId,
      ]
    );
    const profile = await loadProfile(userId);
    res.json({ success: true, data: profile, message: 'Profile updated.' });
  } catch (err) {
    next(err);
  }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const body = req.body as UploadAvatarRequest;
    if (!body.image || !body.content_type) {
      throw AppError.badRequest('Image payload is required.');
    }
    const { bytes, contentType } = validateAvatarPayload(body.image, body.content_type);
    const url = await uploadAvatarToCloudflare(bytes, contentType);
    await dbRun(
      `UPDATE users SET avatar_url = ?, avatar_source = 'upload', updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [url, userId]
    );
    const profile = await loadProfile(userId);
    res.json({ success: true, data: profile, message: 'Avatar uploaded.' });
  } catch (err) {
    if (err instanceof Error && err.message.includes('not configured')) {
      next(AppError.badRequest(err.message));
      return;
    }
    next(err);
  }
}
