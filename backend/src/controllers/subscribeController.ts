import type { Request, Response, NextFunction } from 'express';
import type { SubscribeRequest } from '@mr-brij/shared';
import { dbGet, dbRun } from '../config/database.api.js';
import { generateUnsubscribeToken } from '../utils/session.js';
import { AppError } from '../utils/AppError.js';

export async function subscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const body = req.body as SubscribeRequest;
    const email = body.email || req.user?.email;
    if (!email) throw AppError.badRequest('Email is required.');
    const token = generateUnsubscribeToken();
    const existing = await dbGet(
      `SELECT id FROM subscriptions WHERE email = ? AND scope = ? AND (post_id = ? OR (post_id IS NULL AND ? IS NULL))`,
      [email, body.scope, body.post_id ?? null, body.post_id ?? null]
    );
    if (existing) {
      res.json({ success: true, message: 'Already subscribed.' });
      return;
    }
    await dbRun(
      `INSERT INTO subscriptions (email, user_id, scope, post_id, confirmed, unsubscribe_token)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [email, req.user?.id ?? null, body.scope, body.post_id ?? null, token]
    );
    res.status(201).json({ success: true, message: 'Subscribed successfully.' });
  } catch (err) {
    next(err);
  }
}

export async function confirmSubscribe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.params.token;
    const row = await dbGet('SELECT id FROM subscriptions WHERE unsubscribe_token = ?', [token]);
    if (!row) throw AppError.notFound('Invalid token.');
    await dbRun('UPDATE subscriptions SET confirmed = 1 WHERE unsubscribe_token = ?', [token]);
    res.json({ success: true, message: 'Subscription confirmed.' });
  } catch (err) {
    next(err);
  }
}
