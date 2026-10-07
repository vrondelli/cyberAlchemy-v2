export const GATEWAY_SESSION_FAULT_SCHEMA = "are.gateway-session-fault/v1";

// The durable store, reconnect transport, and hosted client must agree on
// every authenticated stop reason. Keep this closed list in one owner.
export const GATEWAY_SESSION_FAULT_REASON_CODES = Object.freeze([
  "gateway.turn-marker-history-conflict",
  "gateway.turn-history-status-conflict",
  "gateway.turn-completion-status-conflict",
  "gateway.compaction-history-conflict",
  "gateway.compaction-item-history-conflict",
]);
const SESSION_FAULT_REASONS = new Set(GATEWAY_SESSION_FAULT_REASON_CODES);

export function isGatewaySessionFaultReason(value) {
  return SESSION_FAULT_REASONS.has(value);
}
