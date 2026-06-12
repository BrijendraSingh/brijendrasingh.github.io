import { Hono } from 'hono';
import { body } from 'express-validator';
import { APP_CONFIG, API_ENDPOINTS } from '@mr-brij/shared';
import { optionalSession } from '../backend/src/middleware/optionalSession.js';
import {
  requireSession,
  requireAdmin,
  requireAuthorOrAdmin,
  requireWriter,
} from '../backend/src/middleware/requireSession.js';
import { validate } from '../backend/src/middleware/validation.js';
import * as oauth from '../backend/src/controllers/oauthController.js';
import * as emailAuth from '../backend/src/controllers/emailAuthController.js';
import * as posts from '../backend/src/controllers/postController.js';
import * as comments from '../backend/src/controllers/commentController.js';
import * as reactions from '../backend/src/controllers/reactionController.js';
import * as subscribe from '../backend/src/controllers/subscribeController.js';
import { fromExpress } from './express-adapter.js';

const optionalAuth = fromExpress(optionalSession);
const auth = fromExpress(optionalSession, requireSession);
const author = fromExpress(optionalSession, requireSession, requireWriter);
const admin = fromExpress(optionalSession, requireSession, requireAdmin);

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

  app.get(API_ENDPOINTS.AUTH_ME, fromExpress(optionalSession, oauth.me));
  app.post(API_ENDPOINTS.AUTH_LOGOUT, fromExpress(optionalSession, requireSession, oauth.logout));
  app.post(
    API_ENDPOINTS.AUTH_SIGNUP,
    fromExpress(
      optionalSession,
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
      validate([
        body('email').trim().isEmail().normalizeEmail(),
        body('password').isLength({ min: 1, max: 128 }),
      ]),
      emailAuth.login
    )
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
  app.delete('/api/author/posts/:id', fromExpress(optionalSession, requireSession, requireWriter, posts.deleteAuthor));

  app.get(API_ENDPOINTS.ADMIN_POSTS, fromExpress(optionalSession, requireSession, requireAdmin, posts.listAdmin));
  app.get(API_ENDPOINTS.ADMIN_QUEUE, fromExpress(optionalSession, requireSession, requireAdmin, posts.adminQueue));
  app.post(API_ENDPOINTS.ADMIN_POSTS, fromExpress(optionalSession, requireSession, requireAdmin, posts.createAdmin));
  app.patch('/api/admin/posts/:id', fromExpress(optionalSession, requireSession, requireAdmin, posts.updateAdmin));
  app.post('/api/admin/posts/:id/publish', fromExpress(optionalSession, requireSession, requireAdmin, posts.publishAdmin));
  app.post(
    '/api/admin/posts/:id/reject',
    fromExpress(
      optionalSession,
      requireSession,
      requireAdmin,
      validate([body('note').optional().trim()]),
      posts.rejectAdmin
    )
  );
  app.post('/api/admin/posts/:id/unpublish', fromExpress(optionalSession, requireSession, requireAdmin, posts.unpublishAdmin));
  app.delete('/api/admin/posts/:id', fromExpress(optionalSession, requireSession, requireAdmin, posts.deleteAdmin));
  app.get('/api/admin/comments', fromExpress(optionalSession, requireSession, requireAdmin, comments.listAdminComments));
  app.patch('/api/admin/comments/:id', fromExpress(optionalSession, requireSession, requireAdmin, comments.moderateComment));

  return app;
}
