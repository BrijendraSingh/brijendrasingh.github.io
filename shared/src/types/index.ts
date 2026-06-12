export type UserRole = 'admin' | 'moderator' | 'author' | 'reader';
export type OAuthProvider = 'google' | 'github' | 'email';
export type AvatarSource = 'oauth' | 'url' | 'upload';
export type PostStatus = 'draft' | 'pending_review' | 'published' | 'rejected';
export type ReactionType = 'like' | 'thumbs_up' | 'thumbs_down';
export type ReviewAction = 'submitted' | 'approved' | 'rejected' | 'changes_requested';
export type SubscriptionScope = 'blog' | 'post';

export interface User {
  id: number;
  email: string;
  display_name: string;
  avatar_url: string | null;
  avatar_source: AvatarSource;
  bio: string | null;
  oauth_provider: OAuthProvider;
  oauth_subject: string;
  password_hash?: string | null;
  role: UserRole;
  is_active: number;
  session_token: string | null;
  created_at: string;
  updated_at: string;
}

export interface SafeUser {
  id: number;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  avatar_source?: AvatarSource;
  bio?: string | null;
}

export interface ProfileUser extends SafeUser {
  oauth_provider: OAuthProvider;
  has_password: boolean;
  bio: string | null;
  avatar_source: AvatarSource;
  created_at: string;
  updated_at: string;
}

export interface AdminUserRow {
  id: number;
  email: string;
  display_name: string;
  avatar_url: string | null;
  role: UserRole;
  oauth_provider: OAuthProvider;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
  slug: string;
  created_at: string;
}

export interface Post {
  id: number;
  slug: string;
  title: string;
  description: string;
  body_md: string;
  status: PostStatus;
  author_id: number;
  published_by: number | null;
  pub_date: string | null;
  published_at: string | null;
  submitted_at: string | null;
  updated_date: string;
  review_note: string | null;
  hero_image: string | null;
  reading_time: number | null;
  comments_disabled: number;
  created_at: string;
}

export interface PostWithAuthor extends Post {
  author_name: string;
  author_avatar: string | null;
  tags: Tag[];
}

export interface Comment {
  id: number;
  post_id: number;
  user_id: number;
  parent_id: number | null;
  body: string;
  created_at: string;
  updated_at?: string | null;
  is_deleted: number;
  is_hidden: number;
  user_name: string;
  user_avatar: string | null;
}

export interface CommentWithMeta extends Comment {
  reactions: ReactionCounts;
  replies?: CommentWithMeta[];
}

export interface CommentListResponse {
  comments: CommentWithMeta[];
  total: number;
}

export interface ReactionCounts {
  like: number;
  thumbs_up: number;
  thumbs_down: number;
  user_reaction: ReactionType | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
}

export interface CreatePostRequest {
  title: string;
  description: string;
  body_md: string;
  hero_image?: string;
  comments_disabled?: boolean;
  tag_names?: string[];
  author_id?: number;
}

export interface UpdatePostRequest {
  title?: string;
  description?: string;
  body_md?: string;
  hero_image?: string;
  comments_disabled?: boolean;
  tag_names?: string[];
}

export interface CreateCommentRequest {
  body: string;
  parent_id?: number;
}

export interface UpdateCommentRequest {
  body: string;
}

export interface SetReactionRequest {
  type: ReactionType | null;
}

export interface SubscribeRequest {
  email?: string;
  scope: SubscriptionScope;
  post_id?: number;
}

export interface EmailSignupRequest {
  email: string;
  password: string;
  display_name?: string;
}

export interface EmailLoginRequest {
  email: string;
  password: string;
}

export interface UpdateProfileRequest {
  display_name?: string;
  bio?: string | null;
  avatar_url?: string | null;
  avatar_source?: AvatarSource;
}

export interface ChangePasswordRequest {
  current_password?: string;
  new_password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface RequestEmailChangeRequest {
  new_email: string;
  current_password?: string;
}

export interface AdminUpdateUserRequest {
  role?: UserRole;
  is_active?: boolean;
}

export interface UploadAvatarRequest {
  image: string;
  content_type: 'image/jpeg' | 'image/png' | 'image/webp';
}
