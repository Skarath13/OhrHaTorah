-- Apply only to the Chuck staging site database first:
-- ohrhatorah-staging-db (3452876a-7ea9-499c-8efe-e1205e83d9a5)
--
-- Additive only. Creates the exclusive-access tables used by code-gated pages.
-- It reads, rewrites, and deletes no existing rows.

-- Shared access codes handed to select people. Only a SHA-256 hash of the
-- normalized code is stored; the plain code is shown to the admin once.
CREATE TABLE IF NOT EXISTS access_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  area TEXT NOT NULL CHECK (length(area) BETWEEN 1 AND 40),
  label TEXT NOT NULL CHECK (length(label) BETWEEN 1 AND 120),
  code_hash TEXT NOT NULL UNIQUE,
  expires_at TEXT,
  revoked_at TEXT,
  last_used_at TEXT,
  use_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL
);

-- Browser sessions opened by a code. Revoking a code removes its sessions.
CREATE TABLE IF NOT EXISTS access_sessions (
  id TEXT PRIMARY KEY,
  code_id INTEGER NOT NULL REFERENCES access_codes(id) ON DELETE CASCADE,
  area TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_access_codes_area ON access_codes(area);
CREATE INDEX IF NOT EXISTS idx_access_sessions_code ON access_sessions(code_id);
CREATE INDEX IF NOT EXISTS idx_access_sessions_expires_at ON access_sessions(expires_at);
