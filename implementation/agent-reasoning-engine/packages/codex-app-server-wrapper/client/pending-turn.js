export const PENDING_TURN_STORAGE_KEY = "are.pendingTurn.v1";
const DIGEST = /^[0-9a-f]{64}$/;

function valid(value) {
  const bound = value?.schema_version === "are.codex-client-pending-turn/v2";
  return value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).sort().join(",") === (bound
      ? "created_at,request_binding_digest,request_key,schema_version,text_digest,thread_id"
      : "created_at,request_key,schema_version,text_digest,thread_id")
    && ["are.codex-client-pending-turn/v1", "are.codex-client-pending-turn/v2"].includes(value.schema_version)
    && (!bound || DIGEST.test(value.request_binding_digest))
    && typeof value.thread_id === "string" && value.thread_id.length > 0 && value.thread_id.length <= 256
    && typeof value.request_key === "string" && /^turn:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(value.request_key)
    && DIGEST.test(value.text_digest)
    && typeof value.created_at === "string" && Number.isFinite(Date.parse(value.created_at));
}

function validAccepted(value) {
  const recovered = value?.schema_version === "are.codex-client-recovered-turn/v1";
  const bound = value?.schema_version === "are.codex-client-accepted-turn/v2";
  return value && typeof value === "object" && !Array.isArray(value)
    && Object.keys(value).sort().join(",") === (recovered
      ? "accepted_at,gateway_recovery,request_key,schema_version,text_digest,thread_id,turn_id"
      : bound ? "accepted_at,request_binding_digest,request_key,schema_version,text_digest,thread_id,turn_id"
      : "accepted_at,request_key,schema_version,text_digest,thread_id,turn_id")
    && ["are.codex-client-accepted-turn/v1", "are.codex-client-accepted-turn/v2",
      "are.codex-client-recovered-turn/v1"].includes(value.schema_version)
    && (!bound || DIGEST.test(value.request_binding_digest))
    && (!recovered || (value.gateway_recovery?.schema_version === "are.gateway-turn-recovery/v1"
      && value.gateway_recovery.request_key === value.request_key
      && value.gateway_recovery.thread_id === value.thread_id
      && value.gateway_recovery.turn_id === value.turn_id
      && DIGEST.test(value.gateway_recovery.receipt_digest)))
    && typeof value.thread_id === "string" && value.thread_id.length > 0 && value.thread_id.length <= 256
    && typeof value.turn_id === "string" && value.turn_id.length > 0 && value.turn_id.length <= 256
    && typeof value.request_key === "string" && value.request_key.length > 0 && value.request_key.length <= 256
    && DIGEST.test(value.text_digest)
    && typeof value.accepted_at === "string" && Number.isFinite(Date.parse(value.accepted_at));
}

export function readPendingTurn(storage) {
  const raw = storage.getItem(PENDING_TURN_STORAGE_KEY);
  if (raw === null) return null;
  let value;
  try { value = JSON.parse(raw); } catch { throw new Error("Stored pending turn is unreadable; new sends are blocked."); }
  if (!valid(value)) throw new Error("Stored pending turn is invalid; new sends are blocked.");
  return Object.freeze(value);
}

export function migratePendingTurnStorage(sharedStorage, tabStorage) {
  const legacy = readPendingTurn(sharedStorage);
  if (!legacy) return readPendingTurn(tabStorage);
  const local = readPendingTurn(tabStorage);
  if (local && (local.thread_id !== legacy.thread_id || local.request_key !== legacy.request_key
    || local.text_digest !== legacy.text_digest)) {
    throw new Error("Shared and tab-local pending turns conflict; new sends are blocked.");
  }
  if (!local) {
    tabStorage.setItem(PENDING_TURN_STORAGE_KEY, JSON.stringify(legacy));
    const saved = readPendingTurn(tabStorage);
    if (saved?.request_key !== legacy.request_key || saved.text_digest !== legacy.text_digest) {
      throw new Error("Pending turn migration could not be verified; new sends are blocked.");
    }
  }
  clearPendingTurn(sharedStorage, legacy);
  return readPendingTurn(tabStorage);
}

export function adoptPendingTurn(storage, serverEntry) {
  const local = readPendingTurn(storage);
  if (serverEntry === null || serverEntry === undefined) return local;
  if (!valid(serverEntry)) throw new Error("Host pending turn is invalid; new sends are blocked.");
  if (local) {
    if (local.thread_id !== serverEntry.thread_id || local.request_key !== serverEntry.request_key
      || local.text_digest !== serverEntry.text_digest) throw new Error("Host and browser pending turns conflict; new sends are blocked.");
    if (local.schema_version === "are.codex-client-pending-turn/v1"
      && serverEntry.schema_version === "are.codex-client-pending-turn/v2") {
      storage.setItem(PENDING_TURN_STORAGE_KEY, JSON.stringify(serverEntry));
      return readPendingTurn(storage);
    }
    if (local.schema_version === "are.codex-client-pending-turn/v2"
      && local.request_binding_digest !== serverEntry.request_binding_digest) {
      throw new Error("Host and browser pending turn bindings conflict; new sends are blocked.");
    }
    return local;
  }
  storage.setItem(PENDING_TURN_STORAGE_KEY, JSON.stringify(serverEntry));
  const adopted = readPendingTurn(storage);
  if (adopted?.request_key !== serverEntry.request_key || adopted.text_digest !== serverEntry.text_digest) {
    throw new Error("Host pending turn could not be saved; new sends are blocked.");
  }
  return adopted;
}

export function reconcileTurnReceipt(storage, serverPending, acceptedResults) {
  const history = Array.isArray(acceptedResults) ? acceptedResults
    : acceptedResults === null || acceptedResults === undefined ? [] : [acceptedResults];
  if (history.length > 256 || history.some((entry) => !validAccepted(entry))
    || new Set(history.map((entry) => entry.request_key)).size !== history.length) {
    throw new Error("Host accepted-turn receipts are invalid; new sends are blocked.");
  }
  const accepted = history.at(-1) ?? null;
  const local = readPendingTurn(storage);
  const matching = local && history.find((entry) => entry.request_key === local.request_key);
  if (matching) {
    if (local.thread_id !== matching.thread_id || local.text_digest !== matching.text_digest
      || serverPending?.request_key === local.request_key) {
      throw new Error("Host accepted-turn receipt conflicts with the pending send; new sends are blocked.");
    }
    clearPendingTurn(storage, local);
  }
  const pending = adoptPendingTurn(storage, serverPending);
  return {pending, accepted, acknowledged: !!matching};
}

export async function textDigest(text, cryptoProvider = globalThis.crypto) {
  if (!cryptoProvider?.subtle || typeof text !== "string") throw new Error("Secure turn digest is unavailable.");
  const bytes = await cryptoProvider.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(bytes)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

export async function preparePendingTurn(storage, threadId, text, cryptoProvider = globalThis.crypto) {
  const digest = await textDigest(text, cryptoProvider);
  const existing = readPendingTurn(storage);
  if (existing) {
    if (existing.thread_id !== threadId) throw new Error("An earlier send belongs to another thread; rejoin it first.");
    if (existing.text_digest !== digest) throw new Error("Re-enter the exact previous message to recover its send.");
    return {entry: existing, recovered: true};
  }
  const entry = Object.freeze({schema_version: "are.codex-client-pending-turn/v1", thread_id: threadId,
    request_key: `turn:${cryptoProvider.randomUUID()}`, text_digest: digest, created_at: new Date().toISOString()});
  storage.setItem(PENDING_TURN_STORAGE_KEY, JSON.stringify(entry));
  if (readPendingTurn(storage)?.request_key !== entry.request_key) throw new Error("Pending turn checkpoint failed; no send was made.");
  return {entry, recovered: false};
}

export function clearPendingTurn(storage, entry) {
  const current = readPendingTurn(storage);
  if (!current || current.request_key !== entry?.request_key || current.text_digest !== entry?.text_digest) {
    throw new Error("Pending turn changed; cannot clear its checkpoint.");
  }
  storage.removeItem(PENDING_TURN_STORAGE_KEY);
  if (readPendingTurn(storage)) throw new Error("Pending turn checkpoint could not be cleared.");
}
