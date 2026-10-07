import assert from "node:assert/strict";
import test from "node:test";

import {digestValue} from "../src/canonical.mjs";
import {observeMarkedTurnInHostHistory, verifyAcceptedCompactionInHostHistory} from "../src/host-turn-reconciliation.mjs";

const threadId = "private-marked-thread";
const marker = `are-gateway-client:${"a".repeat(32)}`;
const request = {request_key: "turn:marked", method: "turn/start", status: "outcome-unknown",
  binding_digest: "b".repeat(64), thread_ref: `backend-thread:${digestValue(threadId)}`,
  client_message_id: marker};
const turn = {id: "host-turn:marked", status: "completed", threadId,
  items: [{type: "userMessage", clientId: marker, text: "private prompt"}]};
const response = {jsonrpc: "2.0", id: 1, result: {thread: {id: threadId, turns: [turn]}}};

test("one returned host user item produces a content-free marker observation", () => {
  const observed = observeMarkedTurnInHostHistory({request, response});
  assert.equal(observed.ok, true);
  assert.equal(observed.disposition, "observed-one-in-returned-history");
  assert.equal(observed.observation.kind, "turn-marker-observed");
  assert.equal(observed.observation.turn_ref, digestValue(turn.id));
  assert.equal(observed.observation.client_message_id_digest, digestValue(marker));
  assert.equal(observed.observation.turn_status, "completed");
  assert.doesNotMatch(JSON.stringify(observed), /private prompt|private-marked-thread|host-turn:marked|turn:marked|are-gateway-client:/);
});

test("marker observation refuses missing, duplicate, foreign, or incomplete evidence", () => {
  const failures = [
    [{...request, status: "complete"}, response, "history.marker-request-unbound"],
    [{...request, client_message_id: "caller-owned"}, response, "history.marker-request-unbound"],
    [request, {result: {thread: {id: "foreign-thread", turns: [turn]}}}, "history.thread-mismatch"],
    [request, {result: {thread: {id: threadId}}}, "history.turns-not-included"],
    [request, {result: {thread: {id: threadId, turns: []}}}, "history.marker-not-found"],
    [request, {result: {thread: {id: threadId, turns: [turn, {...turn, id: "another"}]}}}, "history.marker-ambiguous"],
    [request, {result: {thread: {id: threadId, turns: [{...turn, items: [...turn.items, ...turn.items]}]}}}, "history.marker-ambiguous"],
    [request, {result: {thread: {id: threadId, turns: [{...turn, threadId: "foreign-thread"}]}}}, "history.turn-thread-mismatch"],
    [request, {result: {thread: {id: threadId, turns: [{...turn, status: "unknown"}]}}}, "history.turn-status-unknown"],
  ];
  for (const [inputRequest, inputResponse, reason] of failures) {
    const observed = observeMarkedTurnInHostHistory({request: inputRequest, response: inputResponse});
    assert.equal(observed.ok, false, reason);
    assert.deepEqual(observed.reason_codes, [reason]);
  }
});

test("accepted compaction requires one complete item in full exact host history", () => {
  const compactThreadId = "private-compact-thread";
  const compactTurnId = "private-compact-turn";
  const requestKey = "compact:one";
  const compactResponse = {jsonrpc: "2.0", id: 9, result: {}};
  const compactRequest = {method: "thread/compact/start", status: "complete", request_key: requestKey,
    binding_digest: digestValue({method: "thread/compact/start", params: {threadId: compactThreadId}}),
    thread_ref: `backend-thread:${digestValue(compactThreadId)}`, response: compactResponse,
    response_digest: digestValue(compactResponse)};
  const acceptance = {kind: "compaction-turn-accepted", thread_ref: compactRequest.thread_ref,
    turn_ref: digestValue(compactTurnId), request_key_digest: digestValue(requestKey),
    request_digest: compactRequest.binding_digest, response_digest: compactRequest.response_digest};
  const compactTurn = {id: compactTurnId, threadId: compactThreadId, status: "completed", itemsView: "full",
    items: [{id: "private-compact-item", type: "contextCompaction"}]};
  const history = {jsonrpc: "2.0", id: 10,
    result: {thread: {id: compactThreadId, turns: [compactTurn]}}};
  const verified = verifyAcceptedCompactionInHostHistory({request: compactRequest, acceptance,
    response: history});
  assert.equal(verified.ok, true);
  assert.equal(verified.observation.kind, "compaction-history-verified");
  assert.equal(verified.observation.item_ref, digestValue("private-compact-item"));
  assert.doesNotMatch(JSON.stringify(verified), /private-compact/);
  for (const [candidate, reason] of [
    [{...history, result: {thread: {...history.result.thread, id: "other"}}}, "history.thread-mismatch"],
    [{...history, result: {thread: {...history.result.thread, turns: []}}}, "history.compaction-turn-not-found"],
    [{...history, result: {thread: {...history.result.thread, turns: [compactTurn, compactTurn]}}}, "history.compaction-turn-ambiguous"],
    [{...history, result: {thread: {...history.result.thread, turns: [{...compactTurn, status: "inProgress"}]}}}, "history.compaction-not-completed"],
    [{...history, result: {thread: {...history.result.thread, turns: [{...compactTurn, itemsView: "partial"}]}}}, "history.compaction-items-not-full"],
    [{...history, result: {thread: {...history.result.thread, turns: [{...compactTurn, items: []}]}}}, "history.compaction-item-not-proven"],
    [{...history, result: {thread: {...history.result.thread, turns: [{...compactTurn,
      items: [{...compactTurn.items[0], status: "failed"}]}]}}}, "history.compaction-item-not-proven"],
    [{...history, result: {thread: {...history.result.thread, turns: [{...compactTurn, items: [compactTurn.items[0], compactTurn.items[0]]}]}}}, "history.compaction-item-not-proven"],
  ]) {
    assert.deepEqual(verifyAcceptedCompactionInHostHistory({request: compactRequest, acceptance,
      response: candidate}).reason_codes, [reason]);
  }
  assert.deepEqual(verifyAcceptedCompactionInHostHistory({request: compactRequest,
    acceptance: {...acceptance, response_digest: digestValue("other")}, response: history}).reason_codes,
  ["history.compaction-acceptance-unbound"]);
});
