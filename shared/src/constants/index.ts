export const APP_CONFIG = {
  APP_NAME: 'Mr Brij',
  APP_VERSION: '1.0.0',
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  READING_SPEED_WPM: 200,
  SESSION_COOKIE: 'mr_brij_session',
  SESSION_MAX_AGE_DAYS: 30,
} as const;

export const API_ENDPOINTS = {
  HEALTH: '/health',
  API_ROOT: '/api',
  AUTH_ME: '/api/auth/me',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_SIGNUP: '/api/auth/signup',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_CHANGE_PASSWORD: '/api/auth/change-password',
  AUTH_FORGOT_PASSWORD: '/api/auth/forgot-password',
  AUTH_RESET_PASSWORD: '/api/auth/reset-password',
  PROFILE: '/api/profile',
  PROFILE_AVATAR: '/api/profile/avatar',
  PROFILE_EMAIL_REQUEST: '/api/profile/email/request',
  ADMIN_USERS: '/api/admin/users',
  POSTS: '/api/posts',
  SEARCH: '/api/search',
  AUTHOR_POSTS: '/api/author/posts',
  ADMIN_POSTS: '/api/admin/posts',
  ADMIN_QUEUE: '/api/admin/queue',
} as const;

export const POST_STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending review',
  published: 'Published',
  rejected: 'Rejected',
};
