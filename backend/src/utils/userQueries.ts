export const SAFE_USER_SELECT = `id, email, display_name, avatar_url, role, avatar_source, bio`;

export const PROFILE_USER_SELECT = `
  id, email, display_name, avatar_url, role, avatar_source, bio,
  oauth_provider,
  CASE WHEN password_hash IS NOT NULL AND password_hash != '' THEN 1 ELSE 0 END AS has_password,
  created_at, updated_at
`;
