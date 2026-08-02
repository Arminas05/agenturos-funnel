-- D1 schema. Paleisti VIENĄ kartą po duomenų bazės sukūrimo:
--   npx wrangler d1 execute renginiai-leads --remote --file=./schema.sql

CREATE TABLE IF NOT EXISTS leads (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  email       TEXT,
  event_type  TEXT,
  event_date  TEXT,
  city        TEXT,
  guest_count TEXT,
  message     TEXT,
  page        TEXT,
  referrer    TEXT,
  country     TEXT,
  user_agent  TEXT,
  created_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_leads_created ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_phone   ON leads (phone);
