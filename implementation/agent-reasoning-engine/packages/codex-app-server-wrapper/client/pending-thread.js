import {textDigest} from "./pending-turn.js";

export const PENDING_THREAD_STORAGE_KEY = "are.pendingThread.v1";
const DIGEST = /^[0-9a-f]{64}$/;
const KEY = /^thread:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function readPendingThread(storage) {
  const raw = storage.getItem(PENDING_THREAD_STORAGE_KEY);
  if (raw === null) return null;
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error("Stored pending thread is unreadable; new thread creation is blocked."); }
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== "created_at,cwd_digest,request_key,schema_version"
    || value.schema_version !== "are.codex-client-pending-thread/v1"
    || !KEY.test(value.request_key) || !DIGEST.test(value.cwd_digest)
    || typeof value.created_at !== "string" || !Number.isFinite(Date.parse(value.created_at))) {
    throw new Error("Stored pending thread is invalid; new thread creation is blocked.");
  }
  return Object.freeze(value);
}

export async function preparePendingThread(storage, cwd, cryptoProvider = globalThis.crypto) {
  if (typeof cwd !== "string" || !cwd) throw new Error("Select a workspace before starting a thread.");
  const digest = await textDigest(cwd, cryptoProvider);
  const existing = readPendingThread(storage);
  if (existing) {
    if (existing.cwd_digest !== digest) throw new Error("Re-enter the exact prior workspace to recover thread creation.");
    return {entry: existing, recovered: true};
  }
  const entry = Object.freeze({schema_version: "are.codex-client-pending-thread/v1",
    request_key: `thread:${cryptoProvider.randomUUID()}`, cwd_digest: digest, created_at: new Date().toISOString()});
  storage.setItem(PENDING_THREAD_STORAGE_KEY, JSON.stringify(entry));
  if (readPendingThread(storage)?.request_key !== entry.request_key) {
    throw new Error("Pending thread checkpoint failed; no thread was requested.");
  }
  return {entry, recovered: false};
}

export function clearPendingThread(storage, entry) {
  const current = readPendingThread(storage);
  if (!current || current.request_key !== entry?.request_key || current.cwd_digest !== entry?.cwd_digest) {
    throw new Error("Pending thread changed; its checkpoint cannot be cleared.");
  }
  storage.removeItem(PENDING_THREAD_STORAGE_KEY);
  if (readPendingThread(storage)) throw new Error("Pending thread checkpoint could not be cleared.");
}
