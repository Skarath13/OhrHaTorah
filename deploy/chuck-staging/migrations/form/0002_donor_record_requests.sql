-- Apply only to the Chuck staging form database:
-- ohrhatorah-staging-form-db (f7686528-4a2b-4bb2-a419-3f4707fa9c70)

CREATE TABLE IF NOT EXISTS donor_record_requests (
  id TEXT PRIMARY KEY,
  request_type TEXT NOT NULL
    CHECK (request_type IN ('acknowledgment', 'correction')),
  record_name TEXT NOT NULL
    CHECK (length(trim(record_name)) BETWEEN 1 AND 160),
  email TEXT NOT NULL COLLATE NOCASE
    CHECK (length(trim(email)) BETWEEN 3 AND 254),
  contribution_date TEXT NOT NULL
    CHECK (
      contribution_date GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'
      AND date(contribution_date) = contribution_date
    ),
  amount_text TEXT NOT NULL
    CHECK (length(trim(amount_text)) BETWEEN 1 AND 40),
  payment_method TEXT NOT NULL
    CHECK (payment_method IN ('zelle', 'paypal', 'check', 'other')),
  reference TEXT
    CHECK (reference IS NULL OR length(trim(reference)) BETWEEN 1 AND 120),
  goods_services TEXT NOT NULL
    CHECK (goods_services IN ('no', 'yes_or_unsure')),
  review_details TEXT
    CHECK (review_details IS NULL OR length(trim(review_details)) BETWEEN 1 AND 2000),
  confirmation_text TEXT NOT NULL
    CHECK (length(trim(confirmation_text)) BETWEEN 1 AND 1000),
  confirmed_at TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source = 'website_donate'),
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'matched', 'needs_review', 'completed')),
  match_notes TEXT
    CHECK (match_notes IS NULL OR length(trim(match_notes)) BETWEEN 1 AND 2000),
  acknowledgment_issued_at TEXT,
  CHECK (
    (request_type = 'acknowledgment' AND goods_services = 'no')
    OR review_details IS NOT NULL
  )
);

CREATE TABLE IF NOT EXISTS donor_record_request_outbox (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL UNIQUE
    REFERENCES donor_record_requests(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_donor_record_requests_email
  ON donor_record_requests(email);
CREATE INDEX IF NOT EXISTS idx_donor_record_requests_status_date
  ON donor_record_requests(status, contribution_date);
CREATE INDEX IF NOT EXISTS idx_donor_record_request_outbox_delivery
  ON donor_record_request_outbox(status, created_at);
CREATE INDEX IF NOT EXISTS idx_donor_record_request_outbox_lease
  ON donor_record_request_outbox(status, lease_expires_at);
