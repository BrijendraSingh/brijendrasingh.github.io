import type {
  ApiResponse,
  CommentListResponse,
  CommentWithMeta,
  Post,
  PostWithAuthor,
  ReactionCounts,
  ReactionType,
  SafeUser,
  SetReactionRequest,
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
  me: () => request<SafeUser | null>('/api/auth/me'),
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
  adminQueue: () => request<Post[]>('/api/admin/queue'),
  adminPosts: (status?: string) =>
    request<Post[]>(status ? `/api/admin/posts?status=${encodeURIComponent(status)}` : '/api/admin/posts'),
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
