import test from "node:test";
import assert from "node:assert/strict";
import {startHookCallbackBridge} from "../src/hook-callback-bridge.mjs";

async function fixture(t, observeHook = event => ({ok: true, stdout: {hookSpecificOutput: {additionalContext: event.prompt}}, private_receipt: "host-only"})) {
  const seen = [];
  const bridge = await startHookCallbackBridge({client: {observeHook: event => {seen.push(event);return observeHook(event);}}});
  t.after(() => bridge.close());
  const send = (body, options = {}) => fetch(bridge.connection.url, {method: "POST", headers: {"Content-Type": "application/json", "Authorization": `Bearer ${bridge.connection.token}`}, body: JSON.stringify(body), ...options});
  return {bridge, send, seen};
}

test("authenticated callbacks preserve the payload and expose only hook projection", async t => {
  const {send, seen} = await fixture(t);
  const event = {hook_event_name: "UserPromptSubmit", session_id: "a", turn_id: "b", prompt: "exact prompt"};
  const response = await send(event);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {ok: true, stdout: {hookSpecificOutput: {additionalContext: "exact prompt"}}, reason_codes: []});
  assert.deepEqual(seen, [event]);
});

test("wrong credentials cannot reach the adapter", async t => {
  const {send, seen} = await fixture(t);
  for (const authorization of ["", "Bearer wrong", `Bearer ${"f".repeat(64)}`]) {
    const response = await send({}, {headers: {Authorization: authorization}});
    assert.equal(response.status, 401);
    assert.deepEqual((await response.json()).stdout, {});
  }
  assert.equal(seen.length, 0);
});

test("invalid JSON, terminal injection and oversize payloads are rejected", async t => {
  const {send, seen} = await fixture(t);
  assert.equal((await send({}, {body: "{"})).status, 400);
  assert.equal((await send({method: "turn/completed", hook_event_name: "Stop"})).status, 400);
  assert.equal((await send({hook_event_name: "invented"})).status, 400);
  assert.equal((await send({hook_event_name: "UserPromptSubmit", prompt: "a".repeat(1024 * 1024)})).status, 413);
  assert.equal(seen.length, 0);
});

test("adapter failures return bounded diagnostics without leaking exception content", async t => {
  const {send} = await fixture(t, () => {throw new Error("private credential text");});
  const response = await send({hook_event_name: "Stop"});
  assert.equal(response.status, 500);
  assert.deepEqual(await response.json(), {ok: false, stdout: {}, reason_codes: ["callback.adapter-failed"]});
});

test("an engine block stays a block and separate bridges use independent credentials", async t => {
  const a = await fixture(t, () => ({ok: false, stdout: {}, reason_codes: ["events.binding-missing"]}));
  const b = await fixture(t);
  assert.notEqual(a.bridge.connection.token, b.bridge.connection.token);
  assert.deepEqual(await (await a.send({hook_event_name: "PreToolUse"})).json(), {ok: false, stdout: {}, reason_codes: ["events.binding-missing"]});
  assert.equal((await fetch(b.bridge.connection.url, {method: "POST", headers: {Authorization: `Bearer ${a.bridge.connection.token}`}})).status, 401);
  await a.bridge.close(); await a.bridge.close();
  await assert.rejects(a.send({}));
});
