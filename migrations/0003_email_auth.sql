-- Email/password sign-up alongside OAuth providers

-- D1 ignores PRAGMA foreign_keys=OFF; defer_foreign_keys prevents CASCADE on DROP TABLE users.
PRAGMA defer_foreign_keys = ON;

CREATE TABLE users_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  oauth_provider TEXT NOT NULL CHECK (oauth_provider IN ('google', 'github', 'email')),
  oauth_subject TEXT NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'reader' CHECK (role IN ('admin', 'author', 'reader')),
  session_token TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(oauth_provider, oauth_subject)
);

INSERT INTO users_new (
  id, email, display_name, avatar_url, oauth_provider, oauth_subject,
  password_hash, role, session_token, created_at, updated_at
)
SELECT
  id, email, display_name, avatar_url, oauth_provider, oauth_subject,
  NULL, role, session_token, created_at, updated_at
FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

PRAGMA defer_foreign_keys = OFF;
