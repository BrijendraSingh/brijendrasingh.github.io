import { Hono } from 'hono';
import type { RequestHandler } from 'express';
import { body } from 'express-validator';
import { APP_CONFIG, API_ENDPOINTS } from '@mr-brij/shared';
import { optionalSession } from '../backend/src/middleware/optionalSession.js';
import {
  requireSession,
  requirePermission,
  requireWriter,
} from '../backend/src/middleware/requireSession.js';
import {
  authRateLimit,
  forgotPasswordRateLimit,
} from '../backend/src/middleware/rateLimit.js';
import { validate } from '../backend/src/middleware/validation.js';
import * as oauth from '../backend/src/controllers/oauthController.js';
import * as emailAuth from '../backend/src/controllers/emailAuthController.js';
import * as profile from '../backend/src/controllers/profileController.js';
import * as password from '../backend/src/controllers/passwordController.js';
import * as adminUsers from '../backend/src/controllers/adminUserController.js';
import * as posts from '../backend/src/controllers/postController.js';
import * as comments from '../backend/src/controllers/commentController.js';
import * as reactions from '../backend/src/controllers/reactionController.js';
import * as subscribe from '../backend/src/controllers/subscribeController.js';
import { fromExpress } from './express-adapter.js';

const author = fromExpress(optionalSession, requireSession, requireWriter);

const withPostModerator = (...handlers: RequestHandler[]) =>
  fromExpress(optionalSession, requireSession, requirePermission('posts:moderate'), ...handlers);
const withCommentModerator = (...handlers: RequestHandler[]) =>
  fromExpress(optionalSession, requireSession, requirePermission('comments:moderate'), ...handlers);
const withUserManager = (...handlers: RequestHandler[]) =>
  fromExpress(optionalSession, requireSession, requirePermission('users:manage'), ...handlers);

export function createHonoApp(nodeEnv = 'production'): Hono {
  const app = new Hono();

  app.get(API_ENDPOINTS.HEALTH, (c) =>
    c.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: nodeEnv,
        runtime: 'worker',
      },
    })
  );

  app.get(API_ENDPOINTS.API_ROOT, (c) =>
    c.json({
      success: true,
      data: { message: `Welcome to ${APP_CONFIG.APP_NAME} API`, version: APP_CONFIG.APP_VERSION },
    })
  );

  app.get('/auth/google', fromExpress(oauth.startGoogle));
  app.get('/auth/google/callback', fromExpress(oauth.callbackGoogle));
  app.get('/auth/github', fromExpress(oauth.startGitHub));
  app.get('/auth/github/callback', fromExpress(oauth.callbackGitHub));
  app.get('/auth/signin', fromExpress(emailAuth.getSignupPage));
  app.get('/auth/forgot-password', fromExpress(password.getForgotPasswordPage));
  app.get('/auth/reset-password', fromExpress(password.getResetPasswordPage));

  app.get(API_ENDPOINTS.AUTH_ME, fromExpress(optionalSession, oauth.me));
  app.post(API_ENDPOINTS.AUTH_LOGOUT, fromExpress(optionalSession, requireSession, oauth.logout));
  app.post(
    API_ENDPOINTS.AUTH_SIGNUP,
    fromExpress(
      optionalSession,
      authRateLimit,
      validate([
        body('email').trim().isEmail().normalizeEmail(),
        body('password').isLength({ min: 8, max: 128 }),
        body('display_name').optional().trim().isLength({ max: 100 }),
      ]),
      emailAuth.signup
    )
  );
  app.post(
    API_ENDPOINTS.AUTH_LOGIN,
    fromExpress(
      optionalSession,
      authRateLimit,
      validate([
        body('email').trim().isEmail().normalizeEmail(),
        body('password').isLength({ min: 1, max: 128 }),
      ]),
      emailAuth.login
    )
  );
  app.post(
    API_ENDPOINTS.AUTH_CHANGE_PASSWORD,
    fromExpress(
      optionalSession,
      requireSession,
      validate([body('new_password').isLength({ min: 8, max: 128 })]),
      password.changePassword
    )
  );
  app.post(
    API_ENDPOINTS.AUTH_FORGOT_PASSWORD,
    fromExpress(
      optionalSession,
      forgotPasswordRateLimit,
      validate([body('email').trim().isEmail().normalizeEmail()]),
      password.forgotPassword
    )
  );
  app.post(
    API_ENDPOINTS.AUTH_RESET_PASSWORD,
    fromExpress(
      optionalSession,
      authRateLimit,
      validate([body('new_password').isLength({ min: 8, max: 128 }), body('token').trim().notEmpty()]),
      password.resetPassword
    )
  );

  app.get(API_ENDPOINTS.PROFILE, fromExpress(optionalSession, requireSession, profile.getProfile));
  app.patch(
    API_ENDPOINTS.PROFILE,
    fromExpress(
      optionalSession,
      requireSession,
      validate([
        body('display_name').optional().trim().isLength({ min: 1, max: 100 }),
        body('bio').optional().trim().isLength({ max: 500 }),
        body('avatar_url').optional().trim(),
        body('avatar_source').optional().isIn(['oauth', 'url', 'upload']),
      ]),
      profile.updateProfile
    )
  );
  app.post(
    API_ENDPOINTS.PROFILE_AVATAR,
    fromExpress(
      optionalSession,
      requireSession,
      validate([
        body('image').notEmpty(),
        body('content_type').isIn(['image/jpeg', 'image/png', 'image/webp']),
      ]),
      profile.uploadAvatar
    )
  );
  app.post(
    API_ENDPOINTS.PROFILE_EMAIL_REQUEST,
    fromExpress(
      optionalSession,
      requireSession,
      validate([body('new_email').trim().isEmail().normalizeEmail()]),
      password.requestEmailChange
    )
  );
  app.get(
    '/api/profile/email/confirm/:token',
    fromExpress(optionalSession, password.confirmEmailChange)
  );

  app.get(API_ENDPOINTS.POSTS, fromExpress(optionalSession, posts.listPublic));
  app.get(API_ENDPOINTS.SEARCH, fromExpress(optionalSession, posts.searchPublic));
  app.get('/api/posts/:slug', fromExpress(optionalSession, posts.getPublicBySlug));
  app.get('/api/posts/:slug/comments', fromExpress(optionalSession, comments.listComments));
  app.get('/api/posts/:slug/reactions', fromExpress(optionalSession, reactions.getReactions));
  app.get('/api/posts/:slug/updates', fromExpress(optionalSession, reactions.getUpdates));
  app.get('/api/subscribe/confirm/:token', fromExpress(subscribe.confirmSubscribe));

  app.post(
    '/api/posts/:slug/comments',
    fromExpress(
      optionalSession,
      requireSession,
      validate([body('body').trim().isLength({ min: 1, max: 5000 })]),
      comments.createComment
    )
  );
  app.patch(
    '/api/comments/:id',
    fromExpress(
      optionalSession,
      requireSession,
      validate([body('body').trim().isLength({ min: 1, max: 5000 })]),
      comments.updateComment
    )
  );
  app.delete('/api/comments/:id', fromExpress(optionalSession, requireSession, comments.deleteComment));
  app.put(
    '/api/comments/:id/reactions',
    fromExpress(optionalSession, requireSession, comments.setCommentReaction)
  );
  app.put(
    '/api/posts/:slug/reactions',
    fromExpress(
      optionalSession,
      requireSession,
      validate([body('type').optional().isIn(['like', 'thumbs_up', 'thumbs_down', null])]),
      reactions.setReaction
    )
  );
  app.post('/api/subscribe', fromExpress(optionalSession, subscribe.subscribe));

  app.get(API_ENDPOINTS.AUTHOR_POSTS, fromExpress(optionalSession, requireSession, requireWriter, posts.listAuthor));
  app.post(
    API_ENDPOINTS.AUTHOR_POSTS,
    fromExpress(
      optionalSession,
      requireSession,
      requireWriter,
      validate([
        body('title').trim().isLength({ min: 1, max: 200 }),
        body('description').optional().trim(),
        body('body_md').optional(),
      ]),
      posts.createAuthor
    )
  );
  app.patch('/api/author/posts/:id', fromExpress(optionalSession, requireSession, requireWriter, posts.updateAuthor));
  app.post('/api/author/posts/:id/submit', fromExpress(optionalSession, requireSession, requireWriter, posts.submitAuthor));
  app.post('/api/author/posts/:id/unpublish', fromExpress(optionalSession, requireSession, requireWriter, posts.unpublishAuthor));
  app.delete('/api/author/posts/:id', fromExpress(optionalSession, requireSession, requireWriter, posts.deleteAuthor));

  app.get(API_ENDPOINTS.ADMIN_POSTS, withPostModerator(posts.listAdmin));
  app.get('/api/admin/posts/:id', withPostModerator(posts.getAdmin));
  app.get(API_ENDPOINTS.ADMIN_QUEUE, withPostModerator(posts.adminQueue));
  app.post(API_ENDPOINTS.ADMIN_POSTS, withPostModerator(posts.createAdmin));
  app.patch('/api/admin/posts/:id', withPostModerator(posts.updateAdmin));
  app.post('/api/admin/posts/:id/publish', withPostModerator(posts.publishAdmin));
  app.post(
    '/api/admin/posts/:id/reject',
    fromExpress(
      optionalSession,
      requireSession,
      requirePermission('posts:moderate'),
      validate([body('note').optional().trim()]),
      posts.rejectAdmin
    )
  );
  app.post('/api/admin/posts/:id/unpublish', withPostModerator(posts.unpublishAdmin));
  app.delete('/api/admin/posts/:id', withPostModerator(posts.deleteAdmin));
  app.get('/api/admin/comments', withCommentModerator(comments.listAdminComments));
  app.patch('/api/admin/comments/:id', withCommentModerator(comments.moderateComment));

  app.get(API_ENDPOINTS.ADMIN_USERS, withUserManager(adminUsers.listUsers));
  app.get('/api/admin/users/:id', withUserManager(adminUsers.getUser));
  app.patch(
    '/api/admin/users/:id',
    fromExpress(
      optionalSession,
      requireSession,
      requirePermission('users:manage'),
      validate([
        body('role').optional().isIn(['admin', 'moderator', 'author', 'reader']),
        body('is_active').optional().isBoolean(),
      ]),
      adminUsers.updateUser
    )
  );
  app.post('/api/admin/users/:id/reset-sessions', withUserManager(adminUsers.resetUserSessions));

  return app;
}
