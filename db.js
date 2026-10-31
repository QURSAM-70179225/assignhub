// Database layer — Postgres (e.g. Neon) when DATABASE_URL is set, otherwise a local SQLite file.
// Both expose the same async API: all(sql, params), get(sql, params), run(sql, params) -> { changes }.
// Write SQL with `?` placeholders; they are converted to $1, $2… for Postgres.

const fs = require('fs');
const path = require('path');

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS requests (
    id           TEXT PRIMARY KEY,
    name         TEXT NOT NULL,
    whatsapp     TEXT NOT NULL,
    email        TEXT,
    university   TEXT,
    field        TEXT NOT NULL,
    service      TEXT NOT NULL,
    title        TEXT NOT NULL,
    description  TEXT NOT NULL,
    deadline     TEXT NOT NULL,
    budget       TEXT,
    file_link    TEXT,
    promo        TEXT,
    estimate     TEXT,
    status       TEXT NOT NULL DEFAULT 'New',
    price        INTEGER,
    client_note  TEXT,
    admin_notes  TEXT,
    created_at   TEXT NOT NULL,
    updated_at   TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_requests_created ON requests(created_at);
`;

function createPostgres(url) {
  const { Pool } = require('pg');
  const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);
  const pool = new Pool({ connectionString: url, ssl: isLocal ? false : { rejectUnauthorized: false }, max: 5 });
  const toPg = (sql) => { let i = 0; return sql.replace(/\?/g, () => '$' + ++i); };
  return {
    kind: 'postgres',
    async init() { await pool.query(SCHEMA); },
    async all(sql, params = []) { return (await pool.query(toPg(sql), params)).rows; },
    async get(sql, params = []) { return (await pool.query(toPg(sql), params)).rows[0]; },
    async run(sql, params = []) { return { changes: (await pool.query(toPg(sql), params)).rowCount }; },
  };
}

function createSqlite(dir) {
  const { DatabaseSync } = require('node:sqlite');
  fs.mkdirSync(dir, { recursive: true });
  const db = new DatabaseSync(path.join(dir, 'assignhub.db'));
  return {
    kind: 'sqlite',
    async init() { db.exec(SCHEMA); },
    async all(sql, params = []) { return db.prepare(sql).all(...params); },
    async get(sql, params = []) { return db.prepare(sql).get(...params); },
    async run(sql, params = []) { return { changes: Number(db.prepare(sql).run(...params).changes) }; },
  };
}

module.exports = process.env.DATABASE_URL
  ? createPostgres(process.env.DATABASE_URL)
  : createSqlite(path.join(__dirname, 'data'));
