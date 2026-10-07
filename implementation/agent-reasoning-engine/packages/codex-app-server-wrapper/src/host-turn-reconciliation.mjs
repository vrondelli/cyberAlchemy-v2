import {digestValue, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";

const TERMINAL = new Set(["completed", "failed", "interrupted"]);
const ACTIVE = new Set(["inProgress", "in_progress"]);
const GATEWAY_CLIENT_MESSAGE_ID = /^are-gateway-client:[0-9a-f]{32}$/;

export function observeMarkedTurnInHostHistory({request, response} = {}) {
  const unknown = (reason) => freezeResult({ok: false, disposition: "unverified", reason_codes: [reason], authority_effect: "none"});
  if (!isRecord(request) || request.method !== "turn/start" || request.status !== "outcome-unknown"
    || !nonEmptyString(request.request_key) || !nonEmptyString(request.binding_digest)
    || !/^backend-thread:[0-9a-f]{64}$/.test(request.thread_ref ?? "")
    || !GATEWAY_CLIENT_MESSAGE_ID.test(request.client_message_id ?? "")) return unknown("history.marker-request-unbound");
  if (!isRecord(response) || !isRecord(response.result?.thread)
    || !nonEmptyString(response.result.thread.id)
    || `backend-thread:${digestValue(response.result.thread.id)}` !== request.thread_ref) return unknown("history.thread-mismatch");
  const turns = response.result.thread.turns;
  if (!Array.isArray(turns)) return unknown("history.turns-not-included");
  const matches = [];
  for (const turn of turns) {
    if (!isRecord(turn) || !Array.isArray(turn.items)) continue;
    for (const item of turn.items) {
      if (isRecord(item) && item.type === "userMessage" && item.clientId === request.client_message_id) {
        matches.push(turn);
      }
    }
  }
  if (matches.length !== 1) return unknown(matches.length === 0 ? "history.marker-not-found" : "history.marker-ambiguous");
  const turn = matches[0];
  if (!nonEmptyString(turn.id)) return unknown("history.marker-turn-id-missing");
  if (nonEmptyString(turn.threadId) && `backend-thread:${digestValue(turn.threadId)}` !== request.thread_ref) {
    return unknown("history.turn-thread-mismatch");
  }
  const turnStatus = TERMINAL.has(turn.status) ? turn.status : ACTIVE.has(turn.status) ? "inProgress" : null;
  if (!turnStatus) return unknown("history.turn-status-unknown");
  const material = {
    kind: "turn-marker-observed", thread_ref: request.thread_ref, turn_ref: digestValue(turn.id),
    request_key_digest: digestValue(request.request_key), request_digest: request.binding_digest,
    client_message_id_digest: digestValue(request.client_message_id),
    history_response_digest: digestValue(response), turn_status: turnStatus,
  };
  return freezeResult({ok: true, disposition: "observed-one-in-returned-history",
    observation: {...material, observation_digest: digestValue(material)}, authority_effect: "none"});
}

export function verifyAcceptedTurnInHostHistory({request, acceptance, response} = {}) {
  const unknown = (reason) => freezeResult({ok: false, disposition: "unverified", reason_codes: [reason], authority_effect: "none"});
  if (!isRecord(request) || request.method !== "turn/start" || !["complete", "outcome-unknown"].includes(request.status)
    || !nonEmptyString(request.request_key) || !nonEmptyString(request.binding_digest)
    || !/^backend-thread:[0-9a-f]{64}$/.test(request.thread_ref ?? "")) return unknown("history.request-unbound");
  if (!isRecord(acceptance) || acceptance.kind !== "turn-start-accepted"
    || acceptance.thread_ref !== request.thread_ref
    || acceptance.request_key_digest !== digestValue(request.request_key)
    || acceptance.request_digest !== request.binding_digest
    || !/^[0-9a-f]{64}$/.test(acceptance.turn_ref ?? "")) return unknown("history.acceptance-unbound");
  if (!isRecord(response) || !isRecord(response.result?.thread)
    || !nonEmptyString(response.result.thread.id)
    || `backend-thread:${digestValue(response.result.thread.id)}` !== request.thread_ref) return unknown("history.thread-mismatch");
  const turns = response.result.thread.turns;
  if (!Array.isArray(turns)) return unknown("history.turns-not-included");
  const matches = turns.filter((turn) => isRecord(turn) && nonEmptyString(turn.id)
    && digestValue(turn.id) === acceptance.turn_ref);
  if (matches.length !== 1) return unknown(matches.length === 0 ? "history.accepted-turn-not-found" : "history.accepted-turn-ambiguous");
  const turn = matches[0];
  if (nonEmptyString(turn.threadId) && `backend-thread:${digestValue(turn.threadId)}` !== request.thread_ref) {
    return unknown("history.turn-thread-mismatch");
  }
  const turnStatus = TERMINAL.has(turn.status) ? turn.status : ACTIVE.has(turn.status) ? "inProgress" : null;
  if (!turnStatus) return unknown("history.turn-status-unknown");
  const material = {
    kind: "turn-history-verified", thread_ref: request.thread_ref, turn_ref: acceptance.turn_ref,
    request_key_digest: acceptance.request_key_digest, request_digest: request.binding_digest,
    history_response_digest: digestValue(response), turn_status: turnStatus,
  };
  return freezeResult({ok: true, disposition: TERMINAL.has(turnStatus) ? "host-terminal" : "host-active",
    observation: {...material, observation_digest: digestValue(material)}, authority_effect: "none"});
}

// A compact acknowledgement binds the turn, but does not prove it finished.
// Reconcile only a full, exact host snapshot; never infer completion from an
// absent notification, a partial item view, or an unrelated turn.
export function verifyAcceptedCompactionInHostHistory({request, acceptance, response} = {}) {
  const unknown = (reason) => freezeResult({ok: false, disposition: "unverified", reason_codes: [reason], authority_effect: "none"});
  if (!isRecord(request) || request.method !== "thread/compact/start" || request.status !== "complete"
    || !nonEmptyString(request.request_key) || !nonEmptyString(request.binding_digest)
    || !/^backend-thread:[0-9a-f]{64}$/.test(request.thread_ref ?? "")
    || !isRecord(request.response?.result) || request.response?.error) return unknown("history.compaction-request-unbound");
  if (!isRecord(acceptance) || acceptance.kind !== "compaction-turn-accepted"
    || acceptance.thread_ref !== request.thread_ref
    || acceptance.request_key_digest !== digestValue(request.request_key)
    || acceptance.request_digest !== request.binding_digest
    || acceptance.response_digest !== request.response_digest
    || !/^[0-9a-f]{64}$/.test(acceptance.turn_ref ?? "")) return unknown("history.compaction-acceptance-unbound");
  const thread = response?.result?.thread;
  if (!isRecord(thread) || !nonEmptyString(thread.id)
    || `backend-thread:${digestValue(thread.id)}` !== request.thread_ref) return unknown("history.thread-mismatch");
  if (!Array.isArray(thread.turns)) return unknown("history.turns-not-included");
  const matches = thread.turns.filter((turn) => isRecord(turn) && nonEmptyString(turn.id)
    && digestValue(turn.id) === acceptance.turn_ref);
  if (matches.length !== 1) return unknown(matches.length === 0 ? "history.compaction-turn-not-found" : "history.compaction-turn-ambiguous");
  const turn = matches[0];
  if (turn.itemsView !== "full") return unknown("history.compaction-items-not-full");
  if (nonEmptyString(turn.threadId) && `backend-thread:${digestValue(turn.threadId)}` !== request.thread_ref) {
    return unknown("history.turn-thread-mismatch");
  }
  if (turn.status !== "completed") return unknown("history.compaction-not-completed");
  if (!Array.isArray(turn.items) || turn.items.length !== 1 || turn.items[0]?.type !== "contextCompaction"
    || !nonEmptyString(turn.items[0].id)
    || (turn.items[0].status !== undefined && turn.items[0].status !== "completed")) {
    return unknown("history.compaction-item-not-proven");
  }
  const material = {kind: "compaction-history-verified", thread_ref: request.thread_ref,
    turn_ref: acceptance.turn_ref, request_key_digest: acceptance.request_key_digest,
    request_digest: request.binding_digest, history_response_digest: digestValue(response),
    item_ref: digestValue(turn.items[0].id), turn_status: "completed"};
  return freezeResult({ok: true, disposition: "host-compaction-completed",
    observation: {...material, observation_digest: digestValue(material)}, authority_effect: "none"});
}
