-- Every verified pey webhook delivery, stored once per webhook-id.
-- The payload is stored with the payer's bank details masked.
CREATE TABLE IF NOT EXISTS pey_webhook_events (
  id            BIGSERIAL PRIMARY KEY,
  webhook_id    TEXT NOT NULL UNIQUE,
  event_type    TEXT NOT NULL,
  transaction_id TEXT,
  amount_cents  INTEGER,
  date_paid     TIMESTAMPTZ,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload       JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS pey_webhook_events_received_at_idx
  ON pey_webhook_events (received_at DESC);
