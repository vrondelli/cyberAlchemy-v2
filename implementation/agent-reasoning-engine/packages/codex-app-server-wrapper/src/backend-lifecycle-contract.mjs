import {freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";

export const GATEWAY_BACKEND_LIFECYCLE_SCHEMA = "are.gateway-backend-lifecycle/v1";
const TERMINAL_STATUSES = new Set(["completed", "failed", "interrupted"]);
const KEYS = ["authority_effect", "client_ingress", "history_source", "schema_version",
  "session_kind", "turn_acceptance", "turn_terminal"];

// A declaration describes the gateway-facing backend, not a stock desktop or
// browser client. In particular, durable adapter replay is not a native Host
// session, and an RPC start response is not terminal completion.
export function validateGatewayBackendLifecycle(value) {
  const reasons = [];
  if (!isRecord(value) || Object.keys(value).sort().join(",") !== KEYS.join(",")) {
    reasons.push("backend-lifecycle.shape-invalid");
  } else {
    if (value.schema_version !== GATEWAY_BACKEND_LIFECYCLE_SCHEMA) reasons.push("backend-lifecycle.schema-invalid");
    if (value.authority_effect !== "none") reasons.push("backend-lifecycle.authority-invalid");
    if (value.client_ingress !== "unverified") reasons.push("backend-lifecycle.client-ingress-unverified");
    if (value.turn_acceptance !== "rpc-in-progress") reasons.push("backend-lifecycle.acceptance-invalid");
    if (value.turn_terminal !== "turn/completed") reasons.push("backend-lifecycle.terminal-invalid");
    if (![["native-host-thread", "native-host-history"],
      ["adapter-replay-thread", "adapter-replay-history"]].some(([kind, source]) =>
      value.session_kind === kind && value.history_source === source)) {
      reasons.push("backend-lifecycle.history-owner-invalid");
    }
  }
  return freezeResult({ok: reasons.length === 0, reason_codes: reasons, authority_effect: "none"});
}

export function inspectGatewayBackendLifecycle(adapter) {
  const value = adapter?.lifecycle_contract;
  if (value === undefined) return freezeResult({ok: false, reason_codes: ["backend-lifecycle.undeclared"], authority_effect: "none"});
  const validation = validateGatewayBackendLifecycle(value);
  return validation.ok ? freezeResult({ok: true, value, authority_effect: "none"}) : validation;
}

// Classifies only the exact turn under test; unrelated multiplexed frames do
// not advance it. This is a conformance primitive, not a receipt proving that
// the client rendered or consumed a terminal event.
export function classifyGatewayTurnLifecycle(contract, frame, {request_id: requestId,
  thread_id: threadId, turn_id: turnId = null} = {}) {
  if (!validateGatewayBackendLifecycle(contract).ok || requestId === undefined
    || !nonEmptyString(threadId) || (turnId !== null && !nonEmptyString(turnId))) {
    return freezeResult({kind: "rejected", reason_code: "backend-lifecycle.binding-invalid", authority_effect: "none"});
  }
  if (!isRecord(frame)) return freezeResult({kind: "rejected", reason_code: "backend-lifecycle.frame-invalid", authority_effect: "none"});
  if (Object.hasOwn(frame, "id")) {
    if (frame.id !== requestId) return freezeResult({kind: "unrelated", authority_effect: "none"});
    if (isRecord(frame.error)) return freezeResult({kind: "start-rejected", authority_effect: "none"});
    const acceptedId = frame.result?.turn?.id;
    return nonEmptyString(acceptedId) && frame.result.turn.status === "inProgress"
      ? freezeResult({kind: "accepted", turn_id: acceptedId, authority_effect: "none"})
      : freezeResult({kind: "rejected", reason_code: "backend-lifecycle.acceptance-shape-invalid", authority_effect: "none"});
  }
  if (frame.method !== contract.turn_terminal) return freezeResult({kind: "unrelated", authority_effect: "none"});
  const completedId = frame.params?.turn?.id;
  if (frame.params?.threadId !== threadId || (turnId !== null && completedId !== turnId)) {
    return freezeResult({kind: "unrelated", authority_effect: "none"});
  }
  if (!nonEmptyString(completedId) || !TERMINAL_STATUSES.has(frame.params?.turn?.status)) {
    return freezeResult({kind: "rejected", reason_code: "backend-lifecycle.terminal-shape-invalid", authority_effect: "none"});
  }
  return freezeResult({kind: "terminal", turn_id: completedId, status: frame.params.turn.status,
    authority_effect: "none"});
}
