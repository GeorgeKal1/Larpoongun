import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "larpoongun.db");

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  email         TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  name          TEXT    NOT NULL,
  password_hash TEXT    NOT NULL,
  created_at    INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT    PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS cart_items (
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slug       TEXT    NOT NULL,
  qty        INTEGER NOT NULL CHECK (qty > 0),
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, slug)
);

-- Every checkout attempt is an order. Status: pending -> paid | failed | cancelled.
CREATE TABLE IF NOT EXISTS orders (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  public_id        TEXT    NOT NULL UNIQUE,
  user_id          INTEGER REFERENCES users(id) ON DELETE SET NULL,
  email            TEXT    NOT NULL,
  name             TEXT    NOT NULL,
  address          TEXT    NOT NULL,
  city             TEXT    NOT NULL,
  postcode         TEXT    NOT NULL,
  status           TEXT    NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'paid', 'failed', 'cancelled')),
  subtotal_cents   INTEGER NOT NULL,
  shipping_cents   INTEGER NOT NULL,
  total_cents      INTEGER NOT NULL,
  currency         TEXT    NOT NULL,
  payment_provider TEXT    NOT NULL CHECK (payment_provider IN ('demo', 'stripe')),
  payment_ref      TEXT,
  created_at       INTEGER NOT NULL,
  paid_at          INTEGER
);
CREATE INDEX IF NOT EXISTS orders_user ON orders(user_id, created_at);
CREATE INDEX IF NOT EXISTS orders_payment_ref ON orders(payment_ref);

-- Name and price are copied at purchase time so old orders don't change with the catalog.
CREATE TABLE IF NOT EXISTS order_items (
  order_id         INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  slug             TEXT    NOT NULL,
  name             TEXT    NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  qty              INTEGER NOT NULL CHECK (qty > 0),
  PRIMARY KEY (order_id, slug)
);
`;

/**
 * Changes to existing tables, applied in order. PRAGMA user_version records how many have run,
 * so each runs exactly once per database. Only ever append to this list.
 */
const MIGRATIONS: string[] = [
  // 1: admin area — fulfilment tracking, notes, an audit trail and admin sessions.
  `
  ALTER TABLE orders ADD COLUMN fulfillment TEXT NOT NULL DEFAULT 'unfulfilled'
    CHECK (fulfillment IN ('unfulfilled', 'shipped', 'delivered', 'returned'));
  ALTER TABLE orders ADD COLUMN admin_note TEXT;
  ALTER TABLE orders ADD COLUMN updated_at INTEGER;

  CREATE TABLE order_events (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    at       INTEGER NOT NULL,
    actor    TEXT    NOT NULL,
    message  TEXT    NOT NULL
  );
  CREATE INDEX order_events_order ON order_events(order_id, at);

  CREATE TABLE admin_sessions (
    token_hash TEXT    PRIMARY KEY,
    username   TEXT    NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );
  `,
];

function migrate(db: Database.Database) {
  const version = db.pragma("user_version", { simple: true }) as number;
  for (let v = version; v < MIGRATIONS.length; v++) {
    db.transaction(() => {
      db.exec(MIGRATIONS[v]);
      db.pragma(`user_version = ${v + 1}`);
    })();
  }
}

function open(): Database.Database {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

// Reuse one connection across hot reloads in dev.
const globalForDb = globalThis as unknown as { __larpoonDb?: Database.Database };
// Per module load, so schema changes get applied after a hot reload too.
let schemaApplied = false;

export function getDb(): Database.Database {
  const db = (globalForDb.__larpoonDb ??= open());
  if (!schemaApplied) {
    db.exec(SCHEMA);
    migrate(db);
    schemaApplied = true;
  }
  return db;
}
