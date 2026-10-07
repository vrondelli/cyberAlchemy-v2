import {textDigest} from "./pending-turn.js";

export const PENDING_FEEDBACK_STORAGE_KEY = "are.pendingFeedback.v1";
const DIGEST = /^[0-9a-f]{64}$/;
const KEY = /^feedback:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function readPendingFeedback(storage) {
  const raw = storage.getItem(PENDING_FEEDBACK_STORAGE_KEY);
  if (raw === null) return null;
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error("Stored pending feedback is unreadable; new sends are blocked."); }
  if (!value || typeof value !== "object" || Array.isArray(value)
    || Object.keys(value).sort().join(",") !== "created_at,request_key,schema_version,text_digest,thread_id"
    || !["are.codex-client-pending-feedback/v1", "are.codex-client-pending-feedback-review/v1"].includes(value.schema_version)
    || typeof value.thread_id !== "string" || !value.thread_id || value.thread_id.length > 256
    || !KEY.test(value.request_key) || !DIGEST.test(value.text_digest)
    || typeof value.created_at !== "string" || !Number.isFinite(Date.parse(value.created_at))) {
    throw new Error("Stored pending feedback is invalid; new sends are blocked.");
  }
  return Object.freeze(value);
}

export async function preparePendingFeedback(storage, threadId, text, cryptoProvider = globalThis.crypto) {
  const digest = await textDigest(text, cryptoProvider);
  const existing = readPendingFeedback(storage);
  if (existing) {
    if (existing.thread_id !== threadId) throw new Error("Pending feedback belongs to another thread; rejoin it first.");
    if (existing.text_digest !== digest) throw new Error("Re-enter the exact prior feedback to recover its submission.");
    return {entry: existing, recovered: true};
  }
  const entry = Object.freeze({schema_version: "are.codex-client-pending-feedback/v1", thread_id: threadId,
    request_key: `feedback:${cryptoProvider.randomUUID()}`, text_digest: digest, created_at: new Date().toISOString()});
  storage.setItem(PENDING_FEEDBACK_STORAGE_KEY, JSON.stringify(entry));
  if (readPendingFeedback(storage)?.request_key !== entry.request_key) throw new Error("Feedback checkpoint failed; nothing was submitted.");
  return {entry, recovered: false};
}

export function markFeedbackPendingReview(storage, entry) {
  const current = readPendingFeedback(storage);
  if (!current || current.request_key !== entry?.request_key || current.text_digest !== entry?.text_digest
    || current.thread_id !== entry.thread_id) throw new Error("Pending feedback changed; review cannot be marked.");
  if (current.schema_version === "are.codex-client-pending-feedback-review/v1") return current;
  const reviewed = Object.freeze({...current, schema_version: "are.codex-client-pending-feedback-review/v1"});
  storage.setItem(PENDING_FEEDBACK_STORAGE_KEY, JSON.stringify(reviewed));
  if (readPendingFeedback(storage)?.schema_version !== reviewed.schema_version) {
    throw new Error("Pending feedback review marker could not be checkpointed.");
  }
  return reviewed;
}

export function adoptPendingFeedbackReview(storage, threadId, item) {
  if (readPendingFeedback(storage)) throw new Error("Resolve the existing feedback checkpoint before recovering another review.");
  if (typeof threadId !== "string" || !threadId || threadId.length > 256
    || !item || !KEY.test(item.feedback_id) || !DIGEST.test(item.text_digest)) {
    throw new Error("Pending feedback recovery identity is invalid.");
  }
  const entry = Object.freeze({schema_version: "are.codex-client-pending-feedback-review/v1", thread_id: threadId,
    request_key: item.feedback_id, text_digest: item.text_digest, created_at: new Date().toISOString()});
  storage.setItem(PENDING_FEEDBACK_STORAGE_KEY, JSON.stringify(entry));
  if (readPendingFeedback(storage)?.request_key !== entry.request_key) {
    throw new Error("Pending feedback recovery marker could not be checkpointed.");
  }
  return entry;
}

export function clearPendingFeedback(storage, entry) {
  const current = readPendingFeedback(storage);
  if (!current || current.request_key !== entry?.request_key || current.text_digest !== entry?.text_digest) {
    throw new Error("Pending feedback changed; its checkpoint cannot be cleared.");
  }
  storage.removeItem(PENDING_FEEDBACK_STORAGE_KEY);
  if (readPendingFeedback(storage)) throw new Error("Pending feedback checkpoint could not be cleared.");
}
