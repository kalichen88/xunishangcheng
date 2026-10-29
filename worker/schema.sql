CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_contact TEXT NOT NULL,
  customer_email TEXT,
  payment TEXT NOT NULL,
  note TEXT,
  items TEXT NOT NULL,
  total_cents INTEGER NOT NULL,
  telegram_sent INTEGER NOT NULL DEFAULT 0,
  channel TEXT NOT NULL DEFAULT 'database'
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders (created_at DESC);
