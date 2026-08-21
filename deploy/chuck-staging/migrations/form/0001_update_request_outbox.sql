-- Apply only to the Chuck staging form database:
-- ohrhatorah-staging-form-db (f7686528-4a2b-4bb2-a419-3f4707fa9c70)

CREATE TABLE IF NOT EXISTS update_requests (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  phone TEXT,
  consent_text TEXT NOT NULL,
  consented_at TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source = 'website_footer'),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS update_request_outbox (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE REFERENCES update_requests(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'failed', 'dead', 'delivered')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  lease_token TEXT,
  lease_expires_at TEXT,
  provider_message_id TEXT,
  last_error_code TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  delivered_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_update_requests_email ON update_requests(email);
CREATE INDEX IF NOT EXISTS idx_update_request_outbox_delivery
  ON update_request_outbox(status, created_at);
CREATE INDEX IF NOT EXISTS idx_update_request_outbox_lease
  ON update_request_outbox(status, lease_expires_at);
