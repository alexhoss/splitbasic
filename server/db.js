import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH =
  process.env.DB_PATH ||
  path.join(__dirname, '..', 'data', 'splitbasic.db')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS trips (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS friends (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS expenses (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id     INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    amount      REAL NOT NULL CHECK (amount > 0),
    paid_by     INTEGER NOT NULL REFERENCES friends(id),
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS expense_participants (
    expense_id INTEGER NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
    friend_id  INTEGER NOT NULL REFERENCES friends(id),
    PRIMARY KEY (expense_id, friend_id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id    INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    from_id    INTEGER NOT NULL REFERENCES friends(id),
    to_id      INTEGER NOT NULL REFERENCES friends(id),
    amount     REAL NOT NULL CHECK (amount > 0),
    note       TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trip_logs (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id    INTEGER NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    action     TEXT NOT NULL,
    detail     TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS trip_notes (
    trip_id    INTEGER PRIMARY KEY REFERENCES trips(id) ON DELETE CASCADE,
    content    TEXT NOT NULL DEFAULT '',
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_friends_trip ON friends(trip_id);
  CREATE INDEX IF NOT EXISTS idx_expenses_trip ON expenses(trip_id);
  CREATE INDEX IF NOT EXISTS idx_payments_trip ON payments(trip_id);
  CREATE INDEX IF NOT EXISTS idx_trip_logs ON trip_logs(trip_id, created_at);
`)

export default db
