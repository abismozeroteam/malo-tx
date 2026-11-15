CREATE TABLE IF NOT EXISTS sign_in_requests (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  code_hash TEXT,
  profile_name TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  code_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sign_in_requests_phone_idx ON sign_in_requests (phone, created_at DESC);
