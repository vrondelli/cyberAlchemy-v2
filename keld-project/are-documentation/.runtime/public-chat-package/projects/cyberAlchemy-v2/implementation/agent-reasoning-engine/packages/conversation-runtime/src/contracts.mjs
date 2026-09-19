import {digest, freeze, sealed, text} from "./canonical.mjs";

export const CONVERSATION_COMMAND_SCHEMA = "are.conversation-command/v1";
export const CONVERSATION_EVENT_SCHEMA = "are.conversation-event/v1";
export const CONVERSATION_SNAPSHOT_SCHEMA = "are.conversation-snapshot/v1";
export const CONVERSATION_GATE_SCHEMA = "are.conversation-decision-gate/v1";

export const COMMAND_TYPES = Object.freeze([
  "conversation.open",
  "message.submit",
  "decision.submit",
  "conversation.cancel",
  "conversation.inspect",
]);

export const EVENT_TYPES = Object.freeze([
  "conversation.opened",
  "message.accepted",
  "turn.phase-changed",
  "turn.intent-bound",
  "message.completed",
  "question.required",
  "diagnostic.available",
  "proposal.ready",
  "decision.required",
  "decision.accepted",
  "turn.blocked",
  "turn.completed",
  "conversation.cancelled",
]);

const commandTypes = new Set(COMMAND_TYPES);
const eventTypes = new Set(EVENT_TYPES);
const visibilityTypes = new Set(["transcript", "status", "decision", "diagnostic", "internal"]);

export function createCommand(type, input = {}) {
  if (!commandTypes.has(type)) throw new TypeError(`Unsupported conversation command: ${type}`);
  const material = {command_type: type, ...input};
  if (type !== "conversation.open" && !text(material.conversation_id)) throw new TypeError("Conversation command requires conversation_id");
  if (type === "message.submit" && !text(material.text)) throw new TypeError("message.submit requires text");
  if (type === "decision.submit" && (!text(material.gate_id) || !text(material.subject_digest) || !text(material.decision))) {
    throw new TypeError("decision.submit requires gate_id, subject_digest, and decision");
  }
  return sealed(CONVERSATION_COMMAND_SCHEMA, material, "command_digest");
}

export function createEvent(input) {
  if (!input || typeof input !== "object" || !eventTypes.has(input.event_type)) throw new TypeError("Conversation event type is invalid");
  if (!text(input.conversation_id) || !Number.isSafeInteger(input.sequence) || input.sequence < 1) throw new TypeError("Conversation event identity is invalid");
  if (!visibilityTypes.has(input.visibility)) throw new TypeError("Conversation event visibility is invalid");
  return sealed(CONVERSATION_EVENT_SCHEMA, input, "event_digest");
}

export function createDecisionGate(input) {
  const allowed = Array.isArray(input?.allowed_decisions) ? [...new Set(input.allowed_decisions.filter(text))].sort() : [];
  if (!text(input?.gate_id) || !text(input?.kind) || !/^[a-f0-9]{64}$/u.test(input?.subject_digest ?? "") || allowed.length === 0) {
    throw new TypeError("Decision gate identity, subject digest, and allowed decisions are required");
  }
  return sealed(CONVERSATION_GATE_SCHEMA, {...input, allowed_decisions: allowed, state: input.state ?? "pending"}, "gate_digest");
}

export function createSnapshot(input) {
  const material = {
    conversation_id: input.conversation_id,
    state: input.state,
    active_turn_id: input.active_turn_id ?? null,
    event_sequence: input.event_sequence,
    events: input.events,
    messages: input.messages,
    pending_gate: input.pending_gate ?? null,
    current_intent_contract_digest: input.current_intent_contract_digest ?? null,
  };
  return sealed(CONVERSATION_SNAPSHOT_SCHEMA, material, "snapshot_digest");
}

export function verifyRecordDigest(record, digestKey) {
  if (!record || typeof record !== "object" || !text(record[digestKey])) return false;
  const material = {...record};
  delete material[digestKey];
  return digest(material) === record[digestKey];
}

export function fail(stage, reasonCodes, details = {}) {
  return freeze({ok: false, stage, reason_codes: [...new Set(reasonCodes)].sort(), ...details, authority_effect: "none"});
}

export function pass(value, details = {}) {
  return freeze({ok: true, value, ...details, authority_effect: "none"});
}

