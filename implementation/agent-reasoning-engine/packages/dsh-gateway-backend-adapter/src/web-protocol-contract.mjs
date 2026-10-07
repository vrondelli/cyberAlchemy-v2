export const DSH_WEB_PROTOCOL_SCHEMA = "are.dsh-web-protocol/v1";

const MUTATIONS = new Set(["session/create", "session/selectModel", "session/rename",
  "session/fork", "session/prompt", "session/updateQueue", "session/cancel"]);
const HOST_EFFECTS = new Set(["session/openWorkspacePath"]);
const READS = new Set(["session/attachment", "session/canOpenWorkspacePath", "session/control",
  "session/follow", "session/list", "session/modelCatalog", "session/page", "session/search"]);
const KNOWN_JOURNAL_EVENTS = new Set(["turn/start", "turn/end", "step/start", "step/end",
  "user/message", "system/message", "assistant/message", "assistant/attempt", "tool/call",
  "tool/result", "request/header", "request/context", "session/end-seed",
  "agent/inbox/spliced", "approval/asked", "approval/decided", "approval/policy",
  "tool/ptc-dispatch-start", "tool/ptc-dispatch", "agent-preset/selected",
  "command/run", "command/done", "session/title", "todo/write", "model/selection",
  "subagent/descriptor", "sandbox/mode", "subagent/catalog", "feedback/record",
  "team/member", "team/task", "team/message/queued", "team/message/delivered",
  "goal/change", "feedback/message-put", "feedback/message-delete",
  "compaction/start", "compaction/summary", "compaction/end", "compaction/prune"]);
const TURN_END_REASONS = new Set(["completed", "aborted", "blocked", "error",
  "max-tokens", "interrupted"]);
const REDACTED_EVENT_TYPE = "are/redacted";

function record(value) { return value !== null && typeof value === "object" && !Array.isArray(value); }
function nonEmpty(value) { return typeof value === "string" && value.length > 0 && value.trim() === value; }
function cursor(value) { return Number.isSafeInteger(value) && value >= 0; }

export function dshWebSessionMethodPosture(method) {
  if (MUTATIONS.has(method)) return "mutation";
  if (HOST_EFFECTS.has(method)) return "host-effect";
  if (READS.has(method)) return "read";
  return "unsupported";
}

/** Reject new/removed generated RPC methods until the pinned adapter is reviewed. */
export function inspectDshWebSessionDescriptor(typert) {
  const invocations = typert?.invocations;
  if (!Array.isArray(invocations)) return {ok: false, reason_code: "dsh-web.descriptor-unavailable"};
  const session = invocations.filter((entry) => entry?.service === "sessionController");
  const observed = session.map((entry) => `${entry.namespace}/${entry.method}`).sort();
  const expected = [...MUTATIONS, ...HOST_EFFECTS, ...READS].sort();
  if (observed.join("\n") !== expected.join("\n")) {
    return {ok: false, reason_code: "dsh-web.method-catalog-drift", observed};
  }
  if (session.some((entry) => {
    const name = `${entry.namespace}/${entry.method}`;
    const wires = entry.parameters?.map((parameter) => parameter.wire);
    return !Array.isArray(wires) || (name === "session/list" ? wires.join(",") !== "_request"
      : ["session/control", "session/modelCatalog", "session/canOpenWorkspacePath"].includes(name)
        ? wires.length !== 0 : wires.join(",") !== "request");
  })) return {ok: false, reason_code: "dsh-web.method-signature-drift"};
  return {ok: true, schema_version: DSH_WEB_PROTOCOL_SCHEMA,
    method_count: expected.length, authority_effect: "none"};
}

/**
 * Only a contiguous native journal turn/end can identify a terminal event for
 * this prompt. Prompt ACK, queue/control state and assistant presentation
 * frames never do. A live follow event is not a storage-flush receipt. The
 * tracker has no gap recovery; a caller must reconcile through native page.
 */
export function createDshWebPromptTracker({session_id, request_id, starting_cursor}) {
  if (!nonEmpty(session_id) || !nonEmpty(request_id) || !cursor(starting_cursor)) {
    throw new TypeError("dsh-web.prompt-binding-invalid");
  }
  let lastSeq = starting_cursor;
  let acknowledged = false;
  let baselineSeen = false;
  let activeTurn = null;
  let matchedTurn = null;
  let terminal = null;
  let fault = null;

  function fail(reason_code) {
    fault = reason_code;
    return {kind: "rejected", reason_code, authority_effect: "none"};
  }

  function status() {
    return {schema_version: DSH_WEB_PROTOCOL_SCHEMA, session_id, request_id,
      cursor: lastSeq, acknowledged, baseline_seen: baselineSeen, matched_turn: matchedTurn,
      phase: fault ? "quarantined" : terminal && acknowledged ? "terminal-event-observed"
        : terminal ? "terminal-unacknowledged" : matchedTurn !== null ? "prompt-journal-observed"
          : acknowledged ? "accepted" : "submitted",
      terminal_reason_kind: terminal?.reason_kind ?? null, reason_code: fault,
      authority_effect: "none"};
  }

  return Object.freeze({
    acknowledge(value) {
      if (fault) return fail(fault);
      if (!record(value) || Object.keys(value).length !== 1 || value.accepted !== true) {
        return fail("dsh-web.prompt-ack-invalid");
      }
      acknowledged = true;
      return terminal ? {kind: "terminal-event-observed", reason_kind: terminal.reason_kind,
        turn: terminal.turn, authority_effect: "none"}
        : {kind: "accepted-not-completed", authority_effect: "none"};
    },
    observe(frame) {
      if (fault) return fail(fault);
      if (!record(frame)) return fail("dsh-web.follow-frame-invalid");
      if (frame.type === "assistant-stream") return {kind: "presentation-only", authority_effect: "none"};
      if (frame.type === "snapshot") {
        if (frame.header?.id !== session_id || frame.cursor !== lastSeq) {
          return fail("dsh-web.snapshot-gap-or-identity-mismatch");
        }
        baselineSeen = true;
        return {kind: "baseline", cursor: lastSeq, authority_effect: "none"};
      }
      if (frame.type !== "event" || !record(frame.event)) return fail("dsh-web.follow-frame-invalid");
      if (!baselineSeen) return fail("dsh-web.follow-baseline-required");
      const event = frame.event;
      if (!cursor(event.seq) || event.seq !== lastSeq + 1 || !cursor(event.time)
        || !nonEmpty(event.type)
        || !Object.hasOwn(event, "data")) return fail("dsh-web.journal-gap-or-shape-invalid");
      const redacted = event.type === REDACTED_EVENT_TYPE && event.ignorable === true
        && Object.keys(event).sort().join(",") === "data,ignorable,seq,time,type"
        && record(event.data) && Object.keys(event.data).join(",") === "turn"
        && event.data.turn === null;
      if (!KNOWN_JOURNAL_EVENTS.has(event.type) && !redacted) {
        return fail("dsh-web.journal-event-unknown");
      }
      lastSeq = event.seq;
      if (event.type === "turn/start") {
        if (!record(event.data) || !cursor(event.data.turn) || activeTurn !== null) return fail("dsh-web.turn-start-invalid");
        activeTurn = event.data.turn;
      } else if (event.type === "user/message" && record(event.data)
        && event.data.source?.kind === "user" && event.data.source.rpcId === request_id) {
        if (activeTurn === null || matchedTurn !== null) return fail("dsh-web.prompt-event-ambiguous");
        matchedTurn = activeTurn;
        return {kind: "prompt-journal-observed", turn: matchedTurn,
          cursor: lastSeq, authority_effect: "none"};
      } else if (event.type === "turn/end") {
        if (!record(event.data) || !cursor(event.data.turn) || event.data.turn !== activeTurn
          || !TURN_END_REASONS.has(event.data.reason?.kind)) return fail("dsh-web.turn-end-invalid");
        if (matchedTurn === activeTurn) {
          terminal = {turn: activeTurn, reason_kind: event.data.reason.kind};
          activeTurn = null;
          return acknowledged ? {kind: "terminal-event-observed", ...terminal, authority_effect: "none"}
            : {kind: "terminal-observed-unacknowledged", ...terminal, authority_effect: "none"};
        }
        activeTurn = null;
      }
      return {kind: "nonterminal", cursor: lastSeq, authority_effect: "none"};
    },
    observeControl(frame) {
      if (fault) return fail(fault);
      if (!record(frame)) return fail("dsh-web.control-frame-invalid");
      if (frame.type === "queue" && frame.sessionId === session_id
        && Array.isArray(frame.items)) {
        return {kind: frame.items.some((item) => item?.rpcId === request_id)
          ? "queued-not-completed" : "control-only", authority_effect: "none"};
      }
      if (["baseline", "jobs", "projection"].includes(frame.type)) {
        return {kind: "control-only", authority_effect: "none"};
      }
      return fail("dsh-web.control-frame-invalid");
    },
    status,
  });
}
