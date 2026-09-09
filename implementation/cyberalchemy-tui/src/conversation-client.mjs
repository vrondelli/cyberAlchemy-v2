import {createConversationRuntime} from "../../agent-reasoning-engine/packages/conversation-runtime/index.mjs";

function immutable(state) {
  return Object.freeze({...state, transcript: Object.freeze([...state.transcript]), diagnostics: Object.freeze([...state.diagnostics])});
}

export function createConversationClient(options = {}) {
  const service = options.service ?? createConversationRuntime(options.runtime);
  const listeners = new Set();
  let state = immutable({conversationId: null, phase: "closed", transcript: [], diagnostics: [], pendingDecision: null, error: null});

  function publish(patch) {
    state = immutable({...state, ...patch});
    for (const listener of listeners) listener(state);
  }

  function project(event) {
    if (event.event_type === "message.accepted" || event.event_type === "message.completed") {
      publish({transcript: [...state.transcript, Object.freeze({role: event.payload.role, text: event.payload.text})]});
    } else if (event.event_type === "turn.phase-changed") publish({phase: event.payload.phase, error: null});
    else if (event.event_type === "question.required") publish({phase: "waiting", transcript: [...state.transcript, Object.freeze({role: "agent", text: event.payload.text})]});
    else if (event.event_type === "diagnostic.available") publish({diagnostics: [...state.diagnostics, event.payload]});
    else if (event.event_type === "decision.required") publish({phase: "waiting-human", pendingDecision: event.payload});
    else if (event.event_type === "decision.accepted") publish({phase: "ready", pendingDecision: null});
    else if (event.event_type === "turn.blocked") publish({phase: "blocked", error: (event.payload.reason_codes ?? []).join(", ")});
    else if (event.event_type === "turn.completed") publish({phase: event.payload.status === "waiting-human" ? "waiting-human" : "ready"});
    else if (event.event_type === "conversation.cancelled") publish({phase: "cancelled", pendingDecision: null});
  }

  const unsubscribe = service.subscribe(project);

  function open(conversationId) {
    const result = service.open({conversation_id: conversationId});
    if (!result.ok) { publish({phase: "error", error: result.reason_codes.join(", ")}); return result; }
    publish({conversationId: result.value.conversation_id, phase: "ready", error: null});
    return result;
  }

  async function submit(text) {
    if (!state.conversationId) return Object.freeze({ok: false, reason_codes: ["conversation.not-open"], authority_effect: "none"});
    return service.submitMessage({conversation_id: state.conversationId, text});
  }

  async function decide(decision) {
    const gate = state.pendingDecision;
    if (!state.conversationId || !gate) return Object.freeze({ok: false, reason_codes: ["conversation.no-pending-decision"], authority_effect: "none"});
    return service.submitDecision({conversation_id: state.conversationId, gate_id: gate.gate_id, subject_digest: gate.subject_digest, decision});
  }

  return Object.freeze({
    open,
    submit,
    decide,
    cancel(reason) { return state.conversationId ? service.cancel({conversation_id: state.conversationId, reason}) : null; },
    close() { unsubscribe(); },
    snapshot: () => state,
    subscribe(listener) { listeners.add(listener); listener(state); return () => listeners.delete(listener); },
  });
}

