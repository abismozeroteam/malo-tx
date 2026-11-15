CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE,
  display_name TEXT NOT NULL,
  handle TEXT UNIQUE,
  last_inbound_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users (id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS debts (
  id UUID PRIMARY KEY,
  ref TEXT NOT NULL UNIQUE,
  creditor_id UUID NOT NULL REFERENCES users (id),
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  due_date DATE,
  meme_kind TEXT NOT NULL CHECK (meme_kind IN ('catalog', 'upload')),
  meme_key TEXT,
  upload_id UUID,
  caption TEXT NOT NULL,
  total_cents INTEGER NOT NULL CHECK (total_cents > 0),
  creditor_share_cents INTEGER CHECK (creditor_share_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS debts_creditor_idx ON debts (creditor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS debtors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL REFERENCES debts (id),
  position INTEGER NOT NULL,
  first_name TEXT NOT NULL,
  phone TEXT,
  user_id UUID REFERENCES users (id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'claims_paid', 'disputed', 'paid', 'cancelled')),
  settlement TEXT CHECK (settlement IN ('codi', 'outside')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (debt_id, position)
);

CREATE TABLE IF NOT EXISTS rate_limits (
  key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  count INTEGER NOT NULL
);
