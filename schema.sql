-- Ohr HaTorah static redesign override database schema
-- Run locally with: npm run db:migrate:local
-- Run remotely with: npm run db:migrate

CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  role TEXT DEFAULT 'editor' CHECK (role IN ('admin', 'editor')),
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS admin_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS login_attempts (
  ip_address TEXT PRIMARY KEY,
  attempts INTEGER DEFAULT 0,
  first_attempt_at TEXT DEFAULT CURRENT_TIMESTAMP,
  locked_until TEXT
);

CREATE TABLE IF NOT EXISTS csrf_tokens (
  token TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES admin_sessions(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS content_overrides (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text' CHECK (field_type IN ('text', 'url')),
  label TEXT,
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0, 1)),
  expires_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_by INTEGER REFERENCES admin_users(id)
);

CREATE TABLE IF NOT EXISTS content_override_revisions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_key TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  field_type TEXT NOT NULL DEFAULT 'text',
  change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete')),
  changed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  changed_by INTEGER REFERENCES admin_users(id)
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_login_attempts_locked_until ON login_attempts(locked_until);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_session_id ON csrf_tokens(session_id);
CREATE INDEX IF NOT EXISTS idx_csrf_tokens_expires_at ON csrf_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_content_overrides_active ON content_overrides(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_content_override_revisions_key ON content_override_revisions(content_key);
