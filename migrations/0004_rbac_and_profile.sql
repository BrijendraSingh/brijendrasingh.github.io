-- RBAC (moderator role), profile fields, password reset, email change, audit log

-- D1 ignores PRAGMA foreign_keys=OFF; defer_foreign_keys prevents CASCADE on DROP TABLE users.
PRAGMA defer_foreign_keys = ON;

CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  avatar_source TEXT NOT NULL DEFAULT 'oauth' CHECK (avatar_source IN ('oauth', 'url', 'upload')),
  bio TEXT,
  oauth_provider TEXT NOT NULL CHECK (oauth_provider IN ('google', 'github', 'email')),
  oauth_subject TEXT NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('admin', 'moderator', 'author', 'reader')),
  is_active INTEGER NOT NULL DEFAULT 1,
  session_token TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(oauth_provider, oauth_subject)
);

INSERT INTO users_new (
  id, email, display_name, avatar_url, avatar_source, bio, oauth_provider, oauth_subject,
  password_hash, role, is_active, session_token, created_at, updated_at
)
SELECT
  id, email, display_name, avatar_url,
  CASE WHEN oauth_provider = 'email' THEN 'url' ELSE 'oauth' END,
  NULL, oauth_provider, oauth_subject,
  password_hash, role, 1, session_token, created_at, updated_at
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);

CREATE TABLE IF NOT EXISTS email_change_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  new_email TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_email_change_tokens_token ON email_change_tokens(token);

CREATE TABLE IF NOT EXISTS user_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  actor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_user_audit_log_target ON user_audit_log(target_id);

PRAGMA defer_foreign_keys = OFF;
