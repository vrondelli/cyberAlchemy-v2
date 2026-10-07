export const PENDING_STEER_STORAGE_KEY = "are.pendingSteer.v1";

function valid(value) {
  return value?.schema_version === "are.codex-client-pending-steer/v1"
    && typeof value.thread_id === "string" && value.thread_id.length > 0 && value.thread_id.length <= 256
    && value.thread_id === value.thread_id.trim()
    && typeof value.turn_id === "string" && value.turn_id.length > 0 && value.turn_id.length <= 256
    && value.turn_id === value.turn_id.trim()
    && typeof value.request_key === "string" && /^steer:[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/u.test(value.request_key)
    && typeof value.text_digest === "string" && /^[0-9a-f]{64}$/u.test(value.text_digest)
    && Object.keys(value).sort().join(",") === "request_key,schema_version,text_digest,thread_id,turn_id";
}

function same(left, right) {
  return left?.schema_version === right?.schema_version && left?.thread_id === right?.thread_id
    && left?.turn_id === right?.turn_id && left?.request_key === right?.request_key
    && left?.text_digest === right?.text_digest;
}

export function readPendingSteer(storage) {
  const raw = storage.getItem(PENDING_STEER_STORAGE_KEY);
  if (raw === null) return null;
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error("Stored pending steer is unreadable; new sends are blocked."); }
  if (!valid(value)) throw new Error("Stored pending steer is invalid; new sends are blocked.");
  return value;
}

export function adoptPendingSteer(storage, hostEntry) {
  const current = readPendingSteer(storage);
  if (hostEntry === null || hostEntry === undefined) return current;
  const {created_at: createdAt, ...entry} = hostEntry;
  if (typeof createdAt !== "string" || !Number.isFinite(Date.parse(createdAt)) || !valid(entry)) {
    throw new Error("Host pending steer is invalid; new sends are blocked.");
  }
  if (current) {
    if (!same(current, entry)) {
      throw new Error("Host and tab pending steer disagree; new sends are blocked.");
    }
    return current;
  }
  storage.setItem(PENDING_STEER_STORAGE_KEY, JSON.stringify(entry));
  const saved = readPendingSteer(storage);
  if (!same(saved, entry)) {
    throw new Error("Host pending steer could not be checkpointed; new sends are blocked.");
  }
  return saved;
}

export async function preparePendingSteer(storage, threadId, turnId, text, cryptoProvider = globalThis.crypto) {
  if (readPendingSteer(storage)) throw new Error("An earlier steer outcome is unresolved; no new steer was sent.");
  if (typeof threadId !== "string" || !threadId || threadId.length > 256
    || typeof turnId !== "string" || !turnId || turnId.length > 256
    || typeof text !== "string" || !text.trim() || text.length > 65536) {
    throw new Error("Steer input is invalid; no steer was sent.");
  }
  const bytes = new TextEncoder().encode(text);
  const digest = await cryptoProvider.subtle.digest("SHA-256", bytes);
  const entry = Object.freeze({schema_version: "are.codex-client-pending-steer/v1",
    thread_id: threadId, turn_id: turnId, request_key: `steer:${cryptoProvider.randomUUID()}`,
    text_digest: Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("")});
  storage.setItem(PENDING_STEER_STORAGE_KEY, JSON.stringify(entry));
  if (readPendingSteer(storage)?.request_key !== entry.request_key) {
    throw new Error("Pending steer checkpoint failed; no steer was sent.");
  }
  return entry;
}

export function clearPendingSteer(storage, entry) {
  const current = readPendingSteer(storage);
  if (!valid(entry) || !current || current.request_key !== entry.request_key
    || current.thread_id !== entry.thread_id || current.turn_id !== entry.turn_id
    || current.text_digest !== entry.text_digest) {
    throw new Error("Pending steer changed; cannot clear its checkpoint.");
  }
  storage.removeItem(PENDING_STEER_STORAGE_KEY);
  if (readPendingSteer(storage)) throw new Error("Pending steer checkpoint could not be cleared.");
}
