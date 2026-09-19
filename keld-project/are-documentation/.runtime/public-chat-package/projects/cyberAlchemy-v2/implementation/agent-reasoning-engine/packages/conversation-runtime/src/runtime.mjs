import {randomUUID} from "node:crypto";

import {compileRequestIntent} from "../../request-intent-runtime/index.mjs";
import {createCommand, createDecisionGate, createEvent, createSnapshot, fail, pass} from "./contracts.mjs";

function cleanText(value) {
  return String(value ?? "").trim();
}

function stateRecord(conversationId) {
  return {
    conversation_id: conversationId,
    state: "ready",
    active_turn_id: null,
    event_sequence: 0,
    events: [],
    messages: [],
    pending_gate: null,
    current_intent_contract_digest: null,
  };
}

export function createConversationRuntime(options = {}) {
  const conversations = new Map();
  const listeners = new Set();
  const idFactory = options.idFactory ?? (() => randomUUID());
  const now = options.now ?? (() => new Date().toISOString());
  const compileIntent = options.compileIntent ?? compileRequestIntent;
  const turnHandler = options.turnHandler ?? (async ({text}) => ({assistant_text: `Request received: ${text}`}));
  const decisionHandler = options.decisionHandler ?? (async () => ({assistant_text: "Decision recorded."}));

  function snapshot(state) {
    return createSnapshot(state);
  }

  function emit(state, eventType, visibility, payload = {}, identities = {}) {
    state.event_sequence += 1;
    const event = createEvent({
      conversation_id: state.conversation_id,
      sequence: state.event_sequence,
      event_type: eventType,
      visibility,
      occurred_at: now(),
      turn_id: identities.turn_id ?? state.active_turn_id,
      message_id: identities.message_id ?? null,
      payload,
    });
    state.events.push(event);
    for (const listener of listeners) listener(event, snapshot(state));
    return event;
  }

  function get(conversationId) {
    return conversations.get(cleanText(conversationId));
  }

  function open(input = {}) {
    createCommand("conversation.open", input);
    const conversationId = cleanText(input.conversation_id) || idFactory("conversation");
    if (conversations.has(conversationId)) return fail("conversation-open", ["conversation.already-exists"]);
    const state = stateRecord(conversationId);
    conversations.set(conversationId, state);
    emit(state, "conversation.opened", "status", {state: "ready"});
    return pass(snapshot(state));
  }

  async function submitMessage(input = {}) {
    let command;
    try { command = createCommand("message.submit", input); }
    catch (error) { return fail("message-submit", [error.message]); }
    const state = get(command.conversation_id);
    if (!state) return fail("message-submit", ["conversation.not-found"]);
    if (state.state !== "ready" || state.active_turn_id) return fail("message-submit", ["conversation.turn-active"]);
    if (state.pending_gate) return fail("message-submit", ["conversation.decision-required"]);

    const turnId = cleanText(input.turn_id) || idFactory("turn");
    const messageId = cleanText(input.message_id) || idFactory("message");
    state.state = "running";
    state.active_turn_id = turnId;
    const message = Object.freeze({message_id: messageId, turn_id: turnId, role: "human", text: command.text.trim()});
    state.messages.push(message);
    emit(state, "message.accepted", "transcript", {role: "human", text: message.text}, {turn_id: turnId, message_id: messageId});
    emit(state, "turn.phase-changed", "status", {phase: "interpreting"}, {turn_id: turnId});

    const intent = await compileIntent({
      request_ref: `conversation:${state.conversation_id}:turn:${turnId}`,
      request: message.text,
      predecessor_contract_digest: state.current_intent_contract_digest,
      source_refs: [`conversation:${state.conversation_id}`],
    });
    if (!intent?.ok) {
      state.state = "ready";
      emit(state, "turn.blocked", "status", {reason_codes: intent?.reason_codes ?? ["intent.compilation-failed"]}, {turn_id: turnId});
      state.active_turn_id = null;
      return fail("message-submit", intent?.reason_codes ?? ["intent.compilation-failed"], {snapshot: snapshot(state)});
    }
    state.current_intent_contract_digest = intent.value.contract.intent_contract_digest;
    emit(state, "turn.intent-bound", "internal", {
      intent_contract_digest: intent.value.contract.intent_contract_digest,
      disposition: intent.value.contract.disposition,
      route_candidate: intent.value.contract.route_candidate,
    }, {turn_id: turnId});
    emit(state, "turn.phase-changed", "status", {phase: "reasoning"}, {turn_id: turnId});

    let outcome;
    try {
      outcome = await turnHandler({
        conversation_id: state.conversation_id,
        turn_id: turnId,
        message_id: messageId,
        text: message.text,
        intent_contract: intent.value.contract,
        messages: Object.freeze([...state.messages]),
        authority_effect: "none",
      });
    } catch (error) {
      outcome = {blocked: true, reason_codes: [`conversation.turn-handler-failed:${error?.name ?? "Error"}`]};
    }

    if (outcome?.diagnostic) emit(state, "diagnostic.available", "diagnostic", outcome.diagnostic, {turn_id: turnId});
    if (outcome?.question) emit(state, "question.required", "transcript", {text: cleanText(outcome.question)}, {turn_id: turnId});
    if (outcome?.proposal) emit(state, "proposal.ready", "transcript", outcome.proposal, {turn_id: turnId});
    if (outcome?.decision_gate) {
      try {
        state.pending_gate = createDecisionGate(outcome.decision_gate);
        emit(state, "decision.required", "decision", state.pending_gate, {turn_id: turnId});
      } catch (error) {
        outcome = {blocked: true, reason_codes: [error.message]};
      }
    }
    if (cleanText(outcome?.assistant_text)) {
      const agentMessageId = idFactory("message");
      const agentMessage = Object.freeze({message_id: agentMessageId, turn_id: turnId, role: "agent", text: cleanText(outcome.assistant_text)});
      state.messages.push(agentMessage);
      emit(state, "message.completed", "transcript", {role: "agent", text: agentMessage.text}, {turn_id: turnId, message_id: agentMessageId});
    }

    const blocked = outcome?.blocked === true;
    emit(state, blocked ? "turn.blocked" : "turn.completed", "status", blocked
      ? {reason_codes: outcome.reason_codes ?? ["conversation.turn-blocked"]}
      : {status: state.pending_gate ? "waiting-human" : "completed"}, {turn_id: turnId});
    state.state = state.pending_gate ? "waiting-human" : "ready";
    state.active_turn_id = null;
    return blocked
      ? fail("message-submit", outcome.reason_codes ?? ["conversation.turn-blocked"], {snapshot: snapshot(state)})
      : pass(snapshot(state));
  }

  async function submitDecision(input = {}) {
    let command;
    try { command = createCommand("decision.submit", input); }
    catch (error) { return fail("decision-submit", [error.message]); }
    const state = get(command.conversation_id);
    if (!state) return fail("decision-submit", ["conversation.not-found"]);
    const gate = state.pending_gate;
    if (!gate) return fail("decision-submit", ["conversation.no-pending-decision"]);
    if (gate.gate_id !== command.gate_id) return fail("decision-submit", ["conversation.gate-mismatch"]);
    if (gate.subject_digest !== command.subject_digest) return fail("decision-submit", ["conversation.subject-digest-mismatch"]);
    if (!gate.allowed_decisions.includes(command.decision)) return fail("decision-submit", ["conversation.decision-not-allowed"]);

    const outcome = await decisionHandler({conversation_id: state.conversation_id, gate, decision: command.decision, authority_effect: "none"});
    state.pending_gate = null;
    state.state = "ready";
    emit(state, "decision.accepted", "decision", {gate_id: gate.gate_id, subject_digest: gate.subject_digest, decision: command.decision, result: outcome ?? null});
    if (cleanText(outcome?.assistant_text)) {
      const messageId = idFactory("message");
      const message = Object.freeze({message_id: messageId, turn_id: null, role: "agent", text: cleanText(outcome.assistant_text)});
      state.messages.push(message);
      emit(state, "message.completed", "transcript", {role: "agent", text: message.text}, {message_id: messageId});
    }
    return pass(snapshot(state));
  }

  function inspect(input = {}) {
    let command;
    try { command = createCommand("conversation.inspect", input); }
    catch (error) { return fail("conversation-inspect", [error.message]); }
    const state = get(command.conversation_id);
    return state ? pass(snapshot(state)) : fail("conversation-inspect", ["conversation.not-found"]);
  }

  function cancel(input = {}) {
    let command;
    try { command = createCommand("conversation.cancel", input); }
    catch (error) { return fail("conversation-cancel", [error.message]); }
    const state = get(command.conversation_id);
    if (!state) return fail("conversation-cancel", ["conversation.not-found"]);
    state.state = "cancelled";
    state.active_turn_id = null;
    state.pending_gate = null;
    emit(state, "conversation.cancelled", "status", {reason: cleanText(input.reason) || "user-request"});
    return pass(snapshot(state));
  }

  return Object.freeze({
    open,
    submitMessage,
    submitDecision,
    inspect,
    cancel,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  });
}

