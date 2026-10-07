import {createHash} from "node:crypto";
import {mkdirSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {DatabaseSync} from "node:sqlite";

const STORE_SCHEMA = "are.evolution-sqlite-ledger-store/v1";
const MAX_BATCH_ENTRIES = 256;
const MAX_BATCH_BYTES = 64 * 1024 * 1024;
const ENTRY_KEY = /^(?:objects\/sha256\/[a-f0-9]{2}\/[a-f0-9]{62}|ledgers\/(?:events|receipts|commits|artifacts)\/[a-zA-Z0-9._-]{1,256}\.json)$/u;

function entryKey(value) {
  if (typeof value !== "string" || !ENTRY_KEY.test(value)) throw new TypeError("EVOLUTION_SQLITE_LEDGER_KEY_INVALID");
  return value;
}

function entryBytes(value) {
  if (!Buffer.isBuffer(value) || value.length === 0) throw new TypeError("EVOLUTION_SQLITE_LEDGER_BYTES_INVALID");
  return value;
}

function digest(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

export function openSqliteEvolutionLedgerStore({path, read_only = false, fault_injector = null} = {}) {
  if (typeof path !== "string" || path.trim().length === 0) throw new TypeError("EVOLUTION_SQLITE_LEDGER_PATH_REQUIRED");
  if (typeof read_only !== "boolean") throw new TypeError("EVOLUTION_SQLITE_LEDGER_READ_ONLY_INVALID");
  if (fault_injector !== null && typeof fault_injector !== "function") throw new TypeError("EVOLUTION_SQLITE_LEDGER_FAULT_INJECTOR_INVALID");
  const absolutePath = resolve(path);
  if (!read_only) mkdirSync(dirname(absolutePath), {recursive: true, mode: 0o700});
  const database = new DatabaseSync(absolutePath, {readOnly: read_only});
  let closed = false;
  try {
    if (!read_only) {
      const journalMode = database.prepare("PRAGMA journal_mode=WAL").get()?.journal_mode;
      if (journalMode !== "wal") throw new Error("EVOLUTION_SQLITE_LEDGER_WAL_UNAVAILABLE");
      database.exec("PRAGMA synchronous=FULL; PRAGMA busy_timeout=5000;");
      if (database.prepare("PRAGMA synchronous").get()?.synchronous !== 2) throw new Error("EVOLUTION_SQLITE_LEDGER_SYNC_UNAVAILABLE");
      database.exec("CREATE TABLE IF NOT EXISTS ledger_entries (entry_key TEXT PRIMARY KEY, content BLOB NOT NULL, sha256 TEXT NOT NULL) WITHOUT ROWID; CREATE TABLE IF NOT EXISTS ledger_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL) WITHOUT ROWID;");
      const metadata = database.prepare("SELECT value FROM ledger_meta WHERE key='schema_version'").get()?.value;
      if (metadata === undefined) database.prepare("INSERT INTO ledger_meta(key,value) VALUES ('schema_version',?)").run(STORE_SCHEMA);
      else if (metadata !== STORE_SCHEMA) throw new Error("EVOLUTION_SQLITE_LEDGER_SCHEMA_INCOMPATIBLE");
    } else {
      const metadata = database.prepare("SELECT value FROM ledger_meta WHERE key='schema_version'").get()?.value;
      if (metadata !== STORE_SCHEMA) throw new Error("EVOLUTION_SQLITE_LEDGER_SCHEMA_INCOMPATIBLE");
    }
    if (database.prepare("PRAGMA integrity_check").get()?.integrity_check !== "ok") throw new Error("EVOLUTION_SQLITE_LEDGER_CORRUPT");
  } catch (error) {
    database.close();
    throw error;
  }

  function assertOpen() {
    if (closed) throw new Error("EVOLUTION_SQLITE_LEDGER_CLOSED");
  }

  function read(key) {
    assertOpen();
    const validKey = entryKey(key);
    const row = database.prepare("SELECT content,sha256 FROM ledger_entries WHERE entry_key=?").get(validKey);
    if (!row) return null;
    const bytes = Buffer.from(row.content);
    if (digest(bytes) !== row.sha256 || (validKey.startsWith("objects/sha256/")
      && validKey.slice("objects/sha256/".length).replace("/", "") !== row.sha256)) {
      throw new Error("EVOLUTION_SQLITE_LEDGER_ENTRY_CORRUPT");
    }
    return bytes;
  }

  function list(prefix) {
    assertOpen();
    if (typeof prefix !== "string" || !/^(?:objects\/sha256\/|ledgers\/(?:events|receipts|commits|artifacts)\/)$/u.test(prefix)) {
      throw new TypeError("EVOLUTION_SQLITE_LEDGER_PREFIX_INVALID");
    }
    return database.prepare("SELECT entry_key FROM ledger_entries WHERE entry_key>=? AND entry_key<? ORDER BY entry_key")
      .all(prefix, `${prefix}\uffff`).map((row) => row.entry_key);
  }

  function writeBatch(entries) {
    assertOpen();
    if (read_only) throw new Error("EVOLUTION_SQLITE_LEDGER_READ_ONLY");
    if (!Array.isArray(entries) || entries.length < 1 || entries.length > MAX_BATCH_ENTRIES) throw new TypeError("EVOLUTION_SQLITE_LEDGER_BATCH_INVALID");
    const seen = new Set();
    let totalBytes = 0;
    const normalized = entries.map((entry) => {
      const key = entryKey(entry?.key);
      const bytes = entryBytes(entry?.bytes);
      if (seen.has(key)) throw new TypeError("EVOLUTION_SQLITE_LEDGER_DUPLICATE_KEY");
      seen.add(key);
      totalBytes += bytes.length;
      if (totalBytes > MAX_BATCH_BYTES) throw new TypeError("EVOLUTION_SQLITE_LEDGER_BATCH_TOO_LARGE");
      const sha256 = digest(bytes);
      if (key.startsWith("objects/sha256/")
        && key.slice("objects/sha256/".length).replace("/", "") !== sha256) {
        throw new TypeError("EVOLUTION_SQLITE_LEDGER_OBJECT_DIGEST_MISMATCH");
      }
      return {key, bytes, sha256};
    });
    let created = 0;
    database.exec("BEGIN IMMEDIATE");
    try {
      const find = database.prepare("SELECT content,sha256 FROM ledger_entries WHERE entry_key=?");
      const insert = database.prepare("INSERT INTO ledger_entries(entry_key,content,sha256) VALUES (?,?,?)");
      for (const entry of normalized) {
        const prior = find.get(entry.key);
        if (prior) {
          if (prior.sha256 !== entry.sha256 || !Buffer.from(prior.content).equals(entry.bytes)) {
            throw new Error("EVOLUTION_SQLITE_LEDGER_CONTENT_CONFLICT");
          }
        } else {
          insert.run(entry.key, entry.bytes, entry.sha256);
          created += 1;
        }
      }
      fault_injector?.("before-commit");
      database.exec("COMMIT");
    } catch (error) {
      try { database.exec("ROLLBACK"); } catch {}
      throw error;
    }
    fault_injector?.("after-commit");
    return Object.freeze({created, replayed: normalized.length - created});
  }

  return Object.freeze({schema_version: STORE_SCHEMA, read_only, read, list, writeBatch,
    close() { if (closed) return; closed = true; database.close(); }});
}
