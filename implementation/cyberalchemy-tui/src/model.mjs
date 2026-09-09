export const CAPABILITIES = Object.freeze([
  Object.freeze({id: "define", title: "Define", status: "available", description: "Clarify shared meaning from a broad opening."}),
  Object.freeze({id: "research", title: "Research", status: "planned", description: "Collect and synthesize bounded evidence."}),
  Object.freeze({id: "plan", title: "Plan", status: "planned", description: "Turn intent into a reviewable work graph."}),
  Object.freeze({id: "implement", title: "Chat", status: "available", description: "Discuss repository work and review exact approval-bound coding proposals."}),
  Object.freeze({id: "validate", title: "Validate", status: "planned", description: "Evaluate implementation evidence."}),
]);

export const COMMANDS = Object.freeze([
  Object.freeze({id: "help", invocation: "/help", key: "Ctrl+P", title: "Show commands"}),
  Object.freeze({id: "context", invocation: "/context", key: "Ctrl+O", title: "Inspect definitions and ontology"}),
  Object.freeze({id: "define", invocation: "/define", key: "", title: "Open Define"}),
  Object.freeze({id: "implement", invocation: "/implement", key: "", title: "Open the coding-agent chat"}),
  Object.freeze({id: "self-test", invocation: "/self-test", key: "", title: "Run the disposable product canary"}),
  Object.freeze({id: "diagnostics", invocation: "/diagnostics", key: "", title: "Inspect the redacted run receipt"}),
  Object.freeze({id: "approve", invocation: "/approve", key: "", title: "Apply the exact pending digest"}),
  Object.freeze({id: "reject", invocation: "/reject", key: "", title: "Reject the pending proposal"}),
  Object.freeze({id: "quit", invocation: "/quit", key: "Ctrl+C", title: "Exit"}),
]);

export function initialShellState() {
  return Object.freeze({route: "capability", capabilityId: "define", overlay: null});
}

export function isTerminalConversationPhase(phase) {
  return phase === "completed" || phase === "error" || phase === "stopped";
}

export function reduceShellEvent(state, event) {
  if (event.type === "overlay.open") return Object.freeze({...state, overlay: event.overlay});
  if (event.type === "overlay.close") return Object.freeze({...state, overlay: null});
  if (event.type === "capability.open") {
    const capability = CAPABILITIES.find((item) => item.id === event.capabilityId);
    if (!capability || capability.status !== "available") return state;
    return Object.freeze({...state, route: "capability", capabilityId: capability.id, overlay: null});
  }
  return state;
}
