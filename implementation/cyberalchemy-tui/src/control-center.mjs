const SESSION_STATUSES = new Set(["idle", "queued", "running", "waiting-human", "blocked", "completed", "cancelled"]);
const ATTENTION_STATES = new Set(["pending", "viewed", "decided", "superseded", "cancelled"]);

function freezeList(items) {
  return Object.freeze(items.map((item) => Object.freeze({...item})));
}

function snapshot(state) {
  return Object.freeze({
    ...state,
    sessions: freezeList(state.sessions),
    attention: freezeList(state.attention),
    queue: freezeList(state.queue),
  });
}

function digest(seed) {
  return seed.repeat(64).slice(0, 64);
}

export function createControlCenterState({demo = false} = {}) {
  const sessions = [{
    sessionId: "main",
    title: "Main chat",
    status: "idle",
    kind: "primary",
    unreadCount: 0,
    attentionCount: 0,
    summary: "The active CyberAlchemy conversation.",
  }];
  const attention = [];
  const queue = [];

  if (demo) {
    sessions.push(
      {sessionId: "tests", title: "Tests agent", status: "running", kind: "bounded-agent", unreadCount: 0, attentionCount: 0, summary: "Running the bounded validation surface."},
      {sessionId: "definition", title: "Definition review", status: "waiting-human", kind: "bounded-agent", unreadCount: 1, attentionCount: 1, summary: "A term needs an owner decision."},
      {sessionId: "research", title: "TUI research", status: "completed", kind: "bounded-agent", unreadCount: 2, attentionCount: 0, summary: "Reference comparison completed."},
    );
    attention.push(
      {attentionId: "definition-choice", kind: "definition-attention", severity: "decision", originSessionId: "definition", title: "Define session boundary", summary: "Choose whether a resumed runtime is the same session or a successor.", subjectDigest: digest("a"), allowedDecisions: ["open", "defer"], state: "pending"},
      {attentionId: "patch-review", kind: "patch-approval", severity: "approval", originSessionId: "main", title: "Review exact patch", summary: "A candidate is ready for digest-bound review. Demo only; no apply action is connected.", subjectDigest: digest("b"), allowedDecisions: ["open", "reject"], state: "pending"},
      {attentionId: "blocked-agent", kind: "blocker-resolution", severity: "blocker", originSessionId: "tests", title: "Sandbox image unavailable", summary: "The validation agent stopped without running commands.", subjectDigest: digest("c"), allowedDecisions: ["open", "dismiss"], state: "pending"},
    );
    queue.push(
      {actionId: "map-repository", title: "Map repository", originSessionId: "main", status: "completed", dependencyIds: []},
      {actionId: "run-tests", title: "Run bounded tests", originSessionId: "tests", status: "running", dependencyIds: ["map-repository"]},
      {actionId: "compare-results", title: "Compare candidate evidence", originSessionId: "main", status: "queued", dependencyIds: ["run-tests"]},
      {actionId: "owner-decision", title: "Request definition decision", originSessionId: "definition", status: "waiting-human", dependencyIds: []},
    );
  }

  return snapshot({
    schemaVersion: "cav2.tui-control-center-state/v1",
    selectedSessionId: "main",
    selectedAttentionId: attention[0]?.attentionId ?? null,
    focus: "chat",
    sessions,
    attention,
    queue,
    demo,
    authorityEffect: "none",
  });
}

function replaceById(items, key, id, update) {
  return items.map((item) => item[key] === id ? {...item, ...update} : item);
}

export function reduceControlCenterEvent(state, event) {
  if (!state || !event || typeof event.type !== "string") return state;
  if (event.type === "focus.select" && ["sessions", "chat", "attention"].includes(event.focus)) {
    return snapshot({...state, focus: event.focus});
  }
  if (event.type === "session.select" && state.sessions.some((item) => item.sessionId === event.sessionId)) {
    return snapshot({...state, selectedSessionId: event.sessionId});
  }
  if (event.type === "session.move") {
    const index = state.sessions.findIndex((item) => item.sessionId === state.selectedSessionId);
    const next = Math.max(0, Math.min(state.sessions.length - 1, index + Math.sign(event.delta ?? 0)));
    return snapshot({...state, selectedSessionId: state.sessions[next]?.sessionId ?? state.selectedSessionId});
  }
  if (event.type === "attention.move" && state.attention.length > 0) {
    const index = Math.max(0, state.attention.findIndex((item) => item.attentionId === state.selectedAttentionId));
    const next = Math.max(0, Math.min(state.attention.length - 1, index + Math.sign(event.delta ?? 0)));
    return snapshot({...state, selectedAttentionId: state.attention[next].attentionId});
  }
  if (event.type === "attention.open") {
    const item = state.attention.find((candidate) => candidate.attentionId === event.attentionId);
    if (!item || !["pending", "viewed"].includes(item.state)) return state;
    return snapshot({
      ...state,
      focus: "attention",
      selectedSessionId: item.originSessionId,
      selectedAttentionId: item.attentionId,
      attention: replaceById(state.attention, "attentionId", item.attentionId, {state: "viewed"}),
    });
  }
  if (event.type === "attention.decide") {
    const item = state.attention.find((candidate) => candidate.attentionId === event.attentionId);
    if (!item || !["pending", "viewed"].includes(item.state)) return state;
    if (event.subjectDigest !== item.subjectDigest || !item.allowedDecisions.includes(event.decision)) return state;
    return snapshot({...state, attention: replaceById(state.attention, "attentionId", item.attentionId, {
      state: "decided",
      decision: event.decision,
      decisionActor: "human",
    })});
  }
  if (event.type === "conversation.sync") {
    if (!SESSION_STATUSES.has(event.status)) return state;
    const sessions = replaceById(state.sessions, "sessionId", "main", {
      status: event.status,
      attentionCount: event.attentionItem ? 1 : 0,
    });
    let attention = state.attention.filter((item) => item.attentionId !== "live-review");
    if (event.attentionItem) {
      attention = [...attention, {
        attentionId: "live-review",
        kind: "patch-approval",
        severity: "approval",
        originSessionId: "main",
        title: "Review coding proposal",
        summary: "The active session has an exact candidate waiting for your decision.",
        subjectDigest: event.attentionItem.subjectDigest,
        allowedDecisions: ["open", "reject"],
        state: "pending",
      }];
    }
    return snapshot({...state, sessions, attention, selectedAttentionId: state.selectedAttentionId ?? attention[0]?.attentionId ?? null});
  }
  return state;
}

export function conversationStatus(phase) {
  if (["working", "applying", "self-testing"].includes(phase)) return "running";
  if (["waiting", "review"].includes(phase)) return "waiting-human";
  if (phase === "completed") return "completed";
  if (["error", "stopped", "uncertain"].includes(phase)) return "blocked";
  return "idle";
}

export function controlCenterCounts(state) {
  const pendingAttention = state.attention.filter((item) => ATTENTION_STATES.has(item.state) && ["pending", "viewed"].includes(item.state)).length;
  return Object.freeze({
    running: state.sessions.filter((item) => item.status === "running").length,
    waiting: state.queue.filter((item) => item.status === "queued").length,
    blocked: state.queue.filter((item) => item.status === "blocked").length,
    pendingAttention,
  });
}
