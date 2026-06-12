import type {
  AdminUserRow,
  ApiResponse,
  CommentListResponse,
  CommentWithMeta,
  PaginationMeta,
  Post,
  PostWithAuthor,
  ProfileUser,
  ReactionCounts,
  ReactionType,
  SafeUser,
  SetReactionRequest,
  UserRole,
} from '@mr-brij/shared';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  const json = (await res.json()) as ApiResponse<T>;
  if (!res.ok || !json.success) {
    throw new Error(json.message || `Request failed: ${res.status}`);
  }
  return json.data as T;
}

export const api = {
  me: async () => {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const json = (await res.json()) as ApiResponse<SafeUser | null>;
    if (!res.ok || !json.success) {
      throw new Error(json.message || `Request failed: ${res.status}`);
    }
    return json.data ?? null;
  },
  logout: () => request<void>('/api/auth/logout', { method: 'POST' }),
  signup: (email: string, password: string, display_name?: string) =>
    request<SafeUser>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, display_name }),
    }),
  login: (email: string, password: string) =>
    request<SafeUser>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getProfile: () => request<ProfileUser>('/api/profile'),
  updateProfile: (data: Record<string, unknown>) =>
    request<ProfileUser>('/api/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  uploadAvatar: (image: string, content_type: 'image/jpeg' | 'image/png' | 'image/webp') =>
    request<ProfileUser>('/api/profile/avatar', {
      method: 'POST',
      body: JSON.stringify({ image, content_type }),
    }),
  changePassword: (new_password: string, current_password?: string) =>
    request<void>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ new_password, current_password }),
    }),
  forgotPassword: (email: string) =>
    request<void>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
  resetPassword: (token: string, new_password: string) =>
    request<void>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, new_password }),
    }),
  requestEmailChange: (new_email: string, current_password?: string) =>
    request<void>('/api/profile/email/request', {
      method: 'POST',
      body: JSON.stringify({ new_email, current_password }),
    }),
  adminUsers: (q?: string, role?: string, page = 1) => {
    const params = new URLSearchParams({ page: String(page) });
    if (q) params.set('q', q);
    if (role) params.set('role', role);
    return request<{ users: AdminUserRow[]; pagination: PaginationMeta }>(
      `/api/admin/users?${params}`
    );
  },
  updateAdminUser: (id: number, data: { role?: UserRole; is_active?: boolean }) =>
    request<AdminUserRow>(`/api/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  resetUserSessions: (id: number) =>
    request<void>(`/api/admin/users/${id}/reset-sessions`, { method: 'POST' }),
  search: (q: string) =>
    request<{ query: string; posts: PostWithAuthor[]; total: number }>(
      `/api/search?q=${encodeURIComponent(q)}`
    ),
  getReactions: (slug: string) =>
    request<ReactionCounts>(`/api/posts/${slug}/reactions`),
  setReaction: (slug: string, type: SetReactionRequest['type']) =>
    request<ReactionCounts>(`/api/posts/${slug}/reactions`, {
      method: 'PUT',
      body: JSON.stringify({ type }),
    }),
  getComments: (slug: string) => request<CommentListResponse>(`/api/posts/${slug}/comments`),
  postComment: (slug: string, body: string, parent_id?: number) =>
    request<CommentWithMeta>(`/api/posts/${slug}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body, parent_id }),
    }),
  updateComment: (id: number, body: string) =>
    request<CommentWithMeta>(`/api/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ body }),
    }),
  deleteComment: (id: number) => request<void>(`/api/comments/${id}`, { method: 'DELETE' }),
  setCommentReaction: (id: number, type: ReactionType | null) =>
    request<ReactionCounts>(`/api/comments/${id}/reactions`, {
      method: 'PUT',
      body: JSON.stringify({ type } satisfies SetReactionRequest),
    }),
  moderateComment: (id: number, hidden: boolean) =>
    request<void>(`/api/admin/comments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ hidden }),
    }),
  adminHiddenComments: () =>
    request<Array<CommentWithMeta & { post_slug: string; post_title: string }>>(
      '/api/admin/comments?hidden=1'
    ),
  subscribe: (scope: 'blog' | 'post', post_id?: number, email?: string) =>
    request<void>('/api/subscribe', {
      method: 'POST',
      body: JSON.stringify({ scope, post_id, email }),
    }),
  authorPosts: () => request<Post[]>('/api/author/posts'),
  createPost: (data: Record<string, unknown>) =>
    request<PostWithAuthor>('/api/author/posts', { method: 'POST', body: JSON.stringify(data) }),
  updatePost: (id: number, data: Record<string, unknown>) =>
    request<PostWithAuthor>(`/api/author/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  submitPost: (id: number) =>
    request<PostWithAuthor>(`/api/author/posts/${id}/submit`, { method: 'POST' }),
  unpublishPost: (id: number) =>
    request<PostWithAuthor>(`/api/author/posts/${id}/unpublish`, { method: 'POST' }),
  deletePost: (id: number) =>
    request<void>(`/api/author/posts/${id}`, { method: 'DELETE' }),
  adminQueue: () => request<Post[]>('/api/admin/queue'),
  adminPosts: (status?: string) =>
    request<Post[]>(status ? `/api/admin/posts?status=${encodeURIComponent(status)}` : '/api/admin/posts'),
  getAdminPost: (id: number) => request<PostWithAuthor>(`/api/admin/posts/${id}`),
  updateAdminPost: (id: number, data: Record<string, unknown>) =>
    request<PostWithAuthor>(`/api/admin/posts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteAdminPost: (id: number) =>
    request<void>(`/api/admin/posts/${id}`, { method: 'DELETE' }),
  publishPost: (id: number) =>
    request<PostWithAuthor>(`/api/admin/posts/${id}/publish`, { method: 'POST' }),
  rejectPost: (id: number, note: string) =>
    request<PostWithAuthor>(`/api/admin/posts/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ note }),
    }),
};
