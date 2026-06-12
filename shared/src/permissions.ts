import type { UserRole } from './types/index.js';

export type Permission =
  | 'comments:write'
  | 'posts:write'
  | 'posts:moderate'
  | 'comments:moderate'
  | 'users:manage';

export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  reader: ['comments:write'],
  author: ['comments:write', 'posts:write'],
  moderator: ['comments:write', 'posts:moderate', 'comments:moderate'],
  admin: [
    'comments:write',
    'posts:write',
    'posts:moderate',
    'comments:moderate',
    'users:manage',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function canModeratePosts(role: UserRole): boolean {
  return hasPermission(role, 'posts:moderate');
}

export function canModerateComments(role: UserRole): boolean {
  return hasPermission(role, 'comments:moderate');
}

export function canManageUsers(role: UserRole): boolean {
  return hasPermission(role, 'users:manage');
}

export function canWritePosts(role: UserRole): boolean {
  return hasPermission(role, 'posts:write');
}

export const USER_ROLES: UserRole[] = ['reader', 'author', 'moderator', 'admin'];

export const ROLE_LABELS: Record<UserRole, string> = {
  reader: 'Reader',
  author: 'Author',
  moderator: 'Moderator',
  admin: 'Admin',
};
