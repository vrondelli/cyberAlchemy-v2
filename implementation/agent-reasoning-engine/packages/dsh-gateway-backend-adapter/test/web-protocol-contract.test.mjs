import assert from "node:assert/strict";
import {createRequire} from "node:module";
import test from "node:test";
import {pathToFileURL} from "node:url";

import {createDshWebPromptTracker, dshWebSessionMethodPosture,
  inspectDshWebSessionDescriptor} from "../src/web-protocol-contract.mjs";

const require = createRequire(import.meta.url);
const dshRequire = createRequire(require.resolve("@deepseek-ai/dsh/package.json"));
const {TYPERT} = await import(pathToFileURL(dshRequire.resolve("@deepseek-ai/dsh-api-session-controller/typert")).href);

function event(seq, type, data, extras = {}) {
  return {type: "event", event: {seq, type, time: 1_000 + seq, data, ...extras}};
}
function tracker() {
  return createDshWebPromptTracker({session_id: "session-a", request_id: "request-a",
    starting_cursor: 0});
}

test("pinned DSH Web SessionController descriptor exactly matches the closed method catalog", () => {
  assert.deepEqual(inspectDshWebSessionDescriptor(TYPERT), {
    ok: true, schema_version: "are.dsh-web-protocol/v1", method_count: 16,
    authority_effect: "none",
  });
  assert.equal(dshWebSessionMethodPosture("session/prompt"), "mutation");
  assert.equal(dshWebSessionMethodPosture("session/openWorkspacePath"), "host-effect");
  assert.equal(dshWebSessionMethodPosture("session/follow"), "read");
  assert.equal(dshWebSessionMethodPosture("session/unknown"), "unsupported");
  const extra = {invocations: [...TYPERT.invocations, {service: "sessionController",
    namespace: "session", method: "bypass", parameters: []}]};
  assert.equal(inspectDshWebSessionDescriptor(extra).reason_code, "dsh-web.method-catalog-drift");
  const changed = {invocations: TYPERT.invocations.map((item) => item.service === "sessionController"
    && item.method === "prompt" ? {...item, parameters: [{wire: "payload"}]} : item)};
  assert.equal(inspectDshWebSessionDescriptor(changed).reason_code, "dsh-web.method-signature-drift");
});

test("prompt ACK, queue and assistant stream are not terminal; matched journal turn/end is", () => {
  const lifecycle = tracker();
  assert.equal(lifecycle.acknowledge({accepted: true}).kind, "accepted-not-completed");
  assert.equal(lifecycle.status().phase, "accepted");
  assert.equal(lifecycle.observeControl({type: "queue", sessionId: "session-a",
    items: [{rpcId: "request-a"}]}).kind, "queued-not-completed");
  assert.equal(lifecycle.observe({type: "assistant-stream", frame: {type: "end",
    outcome: {kind: "committed", eventType: "assistant/message", seq: 4}}}).kind, "presentation-only");
  assert.equal(lifecycle.observe({type: "snapshot", header: {id: "session-a"}, cursor: 0}).kind, "baseline");
  assert.equal(lifecycle.observe(event(1, "turn/start", {turn: 1})).kind, "nonterminal");
  assert.equal(lifecycle.observe(event(2, "user/message", {source: {kind: "user",
    rpcId: "request-a"}})).kind, "prompt-journal-observed");
  assert.equal(lifecycle.observe(event(3, "assistant/message", {turn: 1})).kind, "nonterminal");
  assert.equal(lifecycle.observe(event(4, "turn/end", {turn: 1,
    reason: {kind: "completed"}})).kind, "terminal-event-observed");
  assert.equal(lifecycle.status().phase, "terminal-event-observed");
  assert.equal(lifecycle.status().cursor, 4);
});

test("a different turn and an unacknowledged terminal cannot complete this request", () => {
  const lifecycle = tracker();
  lifecycle.observe({type: "snapshot", header: {id: "session-a"}, cursor: 0});
  lifecycle.observe(event(1, "turn/start", {turn: 1}));
  lifecycle.observe(event(2, "user/message", {source: {kind: "user", rpcId: "other"}}));
  assert.equal(lifecycle.observe(event(3, "turn/end", {turn: 1,
    reason: {kind: "completed"}})).kind, "nonterminal");
  lifecycle.observe(event(4, "turn/start", {turn: 2}));
  lifecycle.observe(event(5, "user/message", {source: {kind: "user", rpcId: "request-a"}}));
  assert.equal(lifecycle.observe(event(6, "turn/end", {turn: 2,
    reason: {kind: "aborted", reason: {kind: "user"}}})).kind,
  "terminal-observed-unacknowledged");
  assert.equal(lifecycle.status().phase, "terminal-unacknowledged");
  assert.deepEqual(lifecycle.acknowledge({accepted: true}), {kind: "terminal-event-observed",
    turn: 2, reason_kind: "aborted", authority_effect: "none"});
});

test("baseline mismatch, gap, unknown event and duplicate prompt fail closed", () => {
  const absent = tracker();
  assert.equal(absent.observe(event(1, "turn/start", {turn: 1})).reason_code,
    "dsh-web.follow-baseline-required");
  const wrong = tracker();
  assert.equal(wrong.observe({type: "snapshot", header: {id: "other"}, cursor: 0}).reason_code,
    "dsh-web.snapshot-gap-or-identity-mismatch");
  const gap = tracker();
  gap.observe({type: "snapshot", header: {id: "session-a"}, cursor: 0});
  assert.equal(gap.observe(event(2, "turn/start", {turn: 1})).reason_code,
    "dsh-web.journal-gap-or-shape-invalid");
  const unknown = tracker();
  unknown.observe({type: "snapshot", header: {id: "session-a"}, cursor: 0});
  assert.equal(unknown.observe(event(1, "plugin/unsafe", {})).reason_code,
    "dsh-web.journal-event-unknown");
  const extensible = tracker();
  extensible.observe({type: "snapshot", header: {id: "session-a"}, cursor: 0});
  assert.equal(extensible.observe(event(1, "plugin/ignorable", null, {ignorable: true})).reason_code,
    "dsh-web.journal-event-unknown");
  const redacted = tracker();
  redacted.observe({type: "snapshot", header: {id: "session-a"}, cursor: 0});
  assert.equal(redacted.observe(event(1, "are/redacted", {turn: null}, {ignorable: true})).kind,
    "nonterminal");
  assert.equal(redacted.observe(event(2, "are/redacted", {turn: 1}, {ignorable: true})).reason_code,
    "dsh-web.journal-event-unknown");
  const malformedMarker = tracker();
  malformedMarker.observe({type: "snapshot", header: {id: "session-a"}, cursor: 0});
  assert.equal(malformedMarker.observe(event(1, "are/redacted", {turn: null},
    {ignorable: true, private: "not-a-projection"})).reason_code, "dsh-web.journal-event-unknown");
  const missingTime = tracker();
  missingTime.observe({type: "snapshot", header: {id: "session-a"}, cursor: 0});
  assert.equal(missingTime.observe({type: "event", event: {seq: 1, type: "turn/start",
    data: {turn: 1}}}).reason_code, "dsh-web.journal-gap-or-shape-invalid");
  const duplicate = tracker();
  duplicate.observe({type: "snapshot", header: {id: "session-a"}, cursor: 0});
  duplicate.observe(event(1, "turn/start", {turn: 1}));
  duplicate.observe(event(2, "user/message", {source: {kind: "user", rpcId: "request-a"}}));
  assert.equal(duplicate.observe(event(3, "user/message", {source: {kind: "user",
    rpcId: "request-a"}})).reason_code, "dsh-web.prompt-event-ambiguous");
  assert.equal(duplicate.status().phase, "quarantined");
});
