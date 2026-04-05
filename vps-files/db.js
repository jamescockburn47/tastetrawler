/**
 * SQLite persistence for Taste Trawler bot.
 *
 * One file, four tables:
 *   conversations  — per-JID chat history, survives restart
 *   audit          — every tool call: name, input, output summary, duration, error
 *   facts          — key-value store for learned prefs, rate-limit timestamps, etc
 *   jobs           — scheduler state: last_run_at, last_result per named job
 *
 * Synchronous API (better-sqlite3) — this is a single-process bot, no pool needed.
 * All writes wrapped in try/catch at callsites; if the DB blows up, the bot
 * degrades to in-memory behaviour rather than crashing.
 */

import Database from 'better-sqlite3';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import pino from 'pino';

const log = pino({ name: 'db' });

const DB_PATH = process.env.TT_DB_PATH || '/opt/taste-trawler-agent/data/tt.db';

let db;

export function openDb() {
  if (db) return db;
  mkdirSync(dirname(DB_PATH), { recursive: true });
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jid TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      ts INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_conv_jid_ts ON conversations(jid, ts);

    CREATE TABLE IF NOT EXISTS audit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      tool TEXT NOT NULL,
      input_json TEXT,
      output_summary TEXT,
      duration_ms INTEGER,
      error TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit(ts);

    CREATE TABLE IF NOT EXISTS facts (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      source TEXT,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS jobs (
      name TEXT PRIMARY KEY,
      last_run_at INTEGER,
      last_result TEXT,
      last_error TEXT
    );
  `);
  log.info({ path: DB_PATH }, 'db opened');
  return db;
}

// ─── Conversations ──────────────────────────────────────────────────────────

/** Append a message to a JID's history. */
export function appendMessage(jid, role, content) {
  try {
    const d = openDb();
    d.prepare('INSERT INTO conversations (jid, role, content, ts) VALUES (?, ?, ?, ?)')
      .run(jid, role, typeof content === 'string' ? content : JSON.stringify(content), Date.now());
  } catch (e) {
    log.error({ err: e.message }, 'appendMessage failed');
  }
}

/** Load the last N messages for a JID, oldest first. Returns [{role, content}]. */
export function getHistory(jid, limit = 20) {
  try {
    const d = openDb();
    const rows = d
      .prepare('SELECT role, content FROM conversations WHERE jid = ? ORDER BY id DESC LIMIT ?')
      .all(jid, limit);
    return rows.reverse().map((r) => ({ role: r.role, content: r.content }));
  } catch (e) {
    log.error({ err: e.message }, 'getHistory failed');
    return [];
  }
}

// ─── Audit ──────────────────────────────────────────────────────────────────

export function logTool(tool, input, output, durationMs, error = null) {
  try {
    const d = openDb();
    const summary = typeof output === 'string' ? output.slice(0, 500) : JSON.stringify(output).slice(0, 500);
    d.prepare(
      'INSERT INTO audit (ts, tool, input_json, output_summary, duration_ms, error) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(Date.now(), tool, JSON.stringify(input || {}).slice(0, 1000), summary, durationMs, error);
  } catch (e) {
    log.error({ err: e.message }, 'logTool failed');
  }
}

/** Audit rows since a timestamp (ms). */
export function auditSince(sinceTs) {
  try {
    const d = openDb();
    return d.prepare('SELECT * FROM audit WHERE ts >= ? ORDER BY ts DESC').all(sinceTs);
  } catch (e) {
    log.error({ err: e.message }, 'auditSince failed');
    return [];
  }
}

// ─── Facts ──────────────────────────────────────────────────────────────────

export function setFact(key, value, source = 'auto') {
  try {
    const d = openDb();
    d.prepare(
      'INSERT INTO facts (key, value, source, updated_at) VALUES (?, ?, ?, ?) ' +
        'ON CONFLICT(key) DO UPDATE SET value = excluded.value, source = excluded.source, updated_at = excluded.updated_at',
    ).run(key, typeof value === 'string' ? value : JSON.stringify(value), source, Date.now());
  } catch (e) {
    log.error({ err: e.message }, 'setFact failed');
  }
}

export function getFact(key) {
  try {
    const d = openDb();
    const row = d.prepare('SELECT value, updated_at FROM facts WHERE key = ?').get(key);
    return row || null;
  } catch (e) {
    log.error({ err: e.message }, 'getFact failed');
    return null;
  }
}

// ─── Jobs ───────────────────────────────────────────────────────────────────

export function recordJobRun(name, result, error = null) {
  try {
    const d = openDb();
    d.prepare(
      'INSERT INTO jobs (name, last_run_at, last_result, last_error) VALUES (?, ?, ?, ?) ' +
        'ON CONFLICT(name) DO UPDATE SET last_run_at = excluded.last_run_at, last_result = excluded.last_result, last_error = excluded.last_error',
    ).run(
      name,
      Date.now(),
      result ? JSON.stringify(result).slice(0, 2000) : null,
      error ? String(error).slice(0, 500) : null,
    );
  } catch (e) {
    log.error({ err: e.message }, 'recordJobRun failed');
  }
}

export function getJobState(name) {
  try {
    const d = openDb();
    return d.prepare('SELECT * FROM jobs WHERE name = ?').get(name) || null;
  } catch (e) {
    return null;
  }
}

/**
 * Rate-limit helper. Returns true if `key` has NOT been triggered in the last
 * `windowMs` milliseconds, and records the trigger. Otherwise returns false.
 */
export function rateLimitOk(key, windowMs) {
  const existing = getFact(`ratelimit:${key}`);
  const now = Date.now();
  if (existing && now - existing.updated_at < windowMs) return false;
  setFact(`ratelimit:${key}`, String(now), 'ratelimit');
  return true;
}
