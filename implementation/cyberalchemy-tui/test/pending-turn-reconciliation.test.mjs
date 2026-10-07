import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";

import {inspectOwnedThreadRuntime, inspectPendingTurnHistory, observePendingGatewayTurn} from "../src/pending-turn-reconciliation.mjs";

const digest = (value) => createHash("sha256").update(value).digest("hex");
const intent = {thread_id: "owned-thread", text_digest: digest("private model prompt")};
const turn = (id, status, text = "private model prompt") => ({id, threadId: "owned-thread", status,
  items: [{type: "userMessage", content: [{type: "text", text}]}]});

test("pending model intent matches exactly one owned host turn without exposing text", () => {
  const result = inspectPendingTurnHistory(intent, {thread: {id: "owned-thread",
    turns: [turn("earlier", "completed", "different prompt"), turn("matching", "completed")]}});
  assert.equal(result.disposition, "host-terminal");
  assert.equal(result.turn_status, "completed");
  assert.equal(result.turn_id_digest, digest("matching"));
  assert.equal(JSON.stringify(result).includes("private model prompt"), false);
  assert.equal(JSON.stringify(result).includes("matching"), false);
});

test("pending model intent remains unverified on missing, duplicate or contradictory history", () => {
  assert.deepEqual(inspectPendingTurnHistory(intent, {thread: {id: "foreign-thread", turns: [turn("one", "completed")]}}).reason_codes,
    ["history.thread-unbound"]);
  assert.deepEqual(inspectPendingTurnHistory(intent, {thread: {id: "owned-thread", turns: [turn("one", "completed", "other")]}}).reason_codes,
    ["history.prompt-not-found"]);
  assert.deepEqual(inspectPendingTurnHistory(intent, {thread: {id: "owned-thread", turns: [turn("one", "completed"), turn("two", "completed")]}}).reason_codes,
    ["history.prompt-ambiguous"]);
  assert.deepEqual(inspectPendingTurnHistory(intent, {thread: {id: "owned-thread", turns: [turn("one", "unknown")]}}).reason_codes,
    ["history.turn-status-unknown"]);
});

test("ephemeral host summary reports runtime only, never a matched pending turn", () => {
  const active = inspectOwnedThreadRuntime(intent, {thread: {id: "owned-thread", status: {type: "active"}}});
  assert.equal(active.disposition, "host-active-unbound");
  assert.equal(active.turn_id_digest, null);
  assert.deepEqual(active.reason_codes, ["history.full-turns-unavailable"]);
  assert.equal(inspectOwnedThreadRuntime(intent, {thread: {id: "owned-thread", status: {type: "notLoaded"}}}).disposition,
    "unverified");
});

test("recovery observation only reads the owned host thread after gateway rebind", async () => {
  const calls = [];
  const recovery = {
    has_unresolved_turn_intent: () => true, resume_token: () => "private-token",
    bind_gateway: (receipt) => { calls.push(["bind", receipt.resumed]); },
    pending_turn_intent: () => intent, thread_ids: () => ["owned-thread"],
  };
  const client = {
    ready: async () => ({resumed: true}),
    initialize: async () => { calls.push(["initialize"]); },
    notify: async () => { throw new Error("resumed initialization must not notify again"); },
    request: async (method, params) => {
      calls.push([method, params]);
      return {thread: {id: "owned-thread", turns: [turn("matching", "inProgress")]}};
    },
    close: async () => { calls.push(["close"]); },
  };
  const observed = await observePendingGatewayTurn({recoveryState: recovery, gatewaySocket: "/fixture/gateway.sock"}, {
    connectGateway: (options) => { assert.equal(options.resume_token, "private-token"); return {}; },
    createClient: () => client,
  });
  assert.equal(observed.disposition, "host-active");
  assert.deepEqual(calls.map((entry) => entry[0]), ["bind", "initialize", "thread/read", "close"]);
  assert.deepEqual(calls[2][1], {threadId: "owned-thread", includeTurns: true});
  assert.equal(JSON.stringify(observed).includes("private-token"), false);
});

test("ephemeral history rejection falls back to read-only runtime status without unblocking", async () => {
  const calls = [];
  const recovery = {has_unresolved_turn_intent: () => true, resume_token: () => "private-token",
    bind_gateway: () => {}, pending_turn_intent: () => intent, thread_ids: () => ["owned-thread"]};
  const client = {ready: async () => ({resumed: true}), initialize: async () => {}, notify: async () => {},
    request: async (_method, params) => {
      calls.push(params.includeTurns);
      if (params.includeTurns) throw new Error("ephemeral threads do not support includeTurns");
      return {thread: {id: "owned-thread", status: {type: "idle"}}};
    }, close: async () => {}};
  const result = await observePendingGatewayTurn({recoveryState: recovery, gatewaySocket: "/fixture/gateway.sock"}, {
    connectGateway: () => ({}), createClient: () => client});
  assert.deepEqual(calls, [true, false]);
  assert.equal(result.disposition, "host-idle-unbound");
  assert.equal(result.turn_status, null);
});
