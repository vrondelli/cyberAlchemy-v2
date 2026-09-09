import test from "node:test";
import assert from "node:assert/strict";
import {EventEmitter, once} from "node:events";
import {PassThrough} from "node:stream";
import {mkdtempSync, rmSync} from "node:fs";
import {createInterface} from "node:readline";
import {createPersistentGateway} from "../packages/codex-app-server-wrapper/src/gateway.mjs";
import {createGatewaySessionClient} from "../src/gateway-session-client.mjs";
import {checkoutRoot} from "../src/prompt-hook.mjs";
import {decide} from '../src/decision-cli.mjs';

async function until(predicate) {
  const end = Date.now() + 3000;
  while (!predicate()) {
    if (Date.now() > end) throw new Error("fixture timeout");
    await new Promise(resolve => setTimeout(resolve, 5));
  }
}
async function fixture(t, options = {}) {
  const dir = mkdtempSync("/tmp/are-client-continuity-");
  const children = [], received = [];
  const build = () => createPersistentGateway({listen_path: `${dir}/gateway.sock`,
    session_store_path: `${dir}/sessions.jsonl`,
    wrapper_factory: () => ({
      processClientMessage: async message => ({to_server: [message], to_client: []}),
      processServerMessage: async message => ({to_server: [], to_client: [message]}),
    }),
    spawn_impl: () => {
      const child = new EventEmitter();
      child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough();
      child.kill = () => child.emit("exit", 0, "SIGTERM");
      createInterface({input: child.stdin}).on("line", line => {
        const message = JSON.parse(line); received.push(message);
        if (message.method !== "fixture/pending" && Object.hasOwn(message, "id")) child.stdout.write(JSON.stringify({id: message.id, result: {echo: message.params}}) + "\n");
      });
      children.push(child); return child;
    },
  });
  let gateway = build();
  await gateway.start();
  const client = createGatewaySessionClient({socket_path: `${dir}/gateway.sock`, consumer_id: "workspace-a", lane: "interaction-bound", request_timeout_ms: 2000, ...options});
  t.after(async () => { await client.close(); await gateway.close(); rmSync(dir, {recursive: true, force: true}); });
  await client.connect();
  return {client, gateway, children, received, dir, restart: async () => {
    await gateway.close(); gateway = build(); await gateway.start(); return gateway;
  }};
}

test('host-bound objective reaches real hook routing and completion without changing prompt text', async t => {
  const raw = 'A short supplied sentence.', operations = [];
  const {client, children} = await fixture(t, {hook_decide: (operation, input) => {
    assert.equal(input.request.raw_request, raw); operations.push(operation);
    return decide(operation, {...input, request: {...input.request, objective_kind: 'understand',
      field_postures: {...input.request.field_postures, objective_kind: 'explicit'}}});
  }});
  const prompt = client.observeHook({hook_event_name: 'UserPromptSubmit', session_id: 'bound-thread', turn_id: 'bound-turn', cwd: checkoutRoot, prompt: raw});
  assert.equal(prompt.kind, 'direct');
  const completed = once(client.events, 'hook-observation');
  children[0].stdout.write(JSON.stringify({method: 'turn/completed', params: {threadId: 'bound-thread', turn: {id: 'bound-turn', status: 'completed'}}}) + '\n');
  const [result] = await completed;
  assert.equal(result.ok, true); assert.equal(result.kind, 'complete'); assert.ok(operations.includes('continue'));
});

test('invalid host hook decision binding is rejected', () => {
  assert.throws(() => createGatewaySessionClient({socket_path: '/tmp/unused', consumer_id: 'a', lane: 'interaction-bound', hook_decide: true}), /hook-decide-invalid/);
});

test("authenticated reconnect replays the exact stable request without redispatch", async t => {
  const {client, gateway, children, received} = await fixture(t);
  const params = {threadId: "native-thread-a", input: []};
  const first = await client.request("turn-one", "turn/start", params);
  await client.disconnect();
  await client.connect();
  assert.deepEqual(await client.request("turn-one", "turn/start", params), first);
  assert.equal(children.length, 1); assert.equal(received.length, 1);
  assert.equal(client.inspect().generation, 2);
  assert.equal(JSON.stringify(client.inspect()).includes("resume_token"), false);
  await assert.rejects(client.request("turn-one", "turn/start", {input: ["changed"]}), /binding-conflict/);
});

test("reconnect alone never retries a pending turn; explicit same-key retry gets its result", async t => {
  const {client, gateway, children, received} = await fixture(t);
  const pending = client.request("uncertain", "fixture/pending", {threadId: "a"});
  const rejected = assert.rejects(pending, /closed/);
  await until(() => received.length === 1);
  await client.disconnect(); await rejected;
  await until(() => !gateway.inspect().sessions[0].attached);
  children[0].stdout.write(JSON.stringify({id: received[0].id, result: {done: true}}) + "\n");
  await until(() => gateway.inspect().sessions[0].stable_requests[0].status === "complete");
  await client.connect();
  assert.equal(received.length, 1);
  assert.deepEqual(await client.request("uncertain", "fixture/pending", {threadId: "a"}), {done: true});
  assert.equal(received.length, 1);
});

test("prompt bindings survive disconnect and terminal notifications use the same binding", async t => {
  const {client, gateway, children} = await fixture(t);
  const common = {session_id: "native-a", turn_id: "turn-a", cwd: checkoutRoot};
  const prompt = client.observeHook({...common, hook_event_name: "UserPromptSubmit", prompt: "Explain repository routing architecture"});
  assert.equal(prompt.ok, true);
  await client.disconnect(); await until(() => !gateway.inspect().sessions[0].attached);
  const tool = client.observeHook({...common, hook_event_name: "PreToolUse", tool_name: "Bash", tool_use_id: "tool-a", tool_input: {command: "printf fixture"}});
  assert.equal(tool.binding_digest, prompt.binding_digest);
  const observation = once(client.events, "hook-observation");
  children[0].stdout.write(JSON.stringify({method: "turn/completed", params: {threadId: "native-a", turn: {id: "turn-a", status: "completed"}}}) + "\n");
  await client.connect();
  const [done] = await observation;
  assert.equal(done.binding_digest, prompt.binding_digest);
  assert.equal(done.completion_scope, "native-turn-only");
  assert.equal(client.releaseCompleted("native-a", "turn-a"), true);
});

test("separate consumers are isolated and an impostor cannot recover a detached consumer", async t => {
  const {client, gateway, dir} = await fixture(t);
  const second = createGatewaySessionClient({socket_path: `${dir}/gateway.sock`, consumer_id: "workspace-b", lane: "interaction-bound"});
  const impostor = createGatewaySessionClient({socket_path: `${dir}/gateway.sock`, consumer_id: "workspace-a", lane: "interaction-bound"});
  t.after(async () => { await second.close(); await impostor.close(); });
  await second.connect();
  await client.request("same-key", "thread/read", {threadId: "a"});
  assert.deepEqual(await second.request("same-key", "thread/read", {threadId: "b"}), {echo: {threadId: "b"}});
  await client.disconnect(); await until(() => !gateway.inspect().sessions.find(s => s.consumer_id === "workspace-a").attached);
  await assert.rejects(impostor.connect(), /authentication/);
  await client.connect(); assert.equal(client.inspect().connected, true);
});

test("bounded requests reject duplicate in-flight work and close destroys local state", async t => {
  const {client, received} = await fixture(t, {max_requests: 1});
  const pending = client.request("one", "fixture/pending", {});
  const rejected = assert.rejects(pending, /closed/);
  await until(() => received.length === 1);
  await assert.rejects(client.request("one", "fixture/pending", {}), /in-flight/);
  await assert.rejects(client.request("two", "thread/start", {}), /request-limit/);
  await client.close(); await rejected;
  assert.equal(client.inspect().retained_requests, 0);
  await assert.rejects(client.connect(), /disposed/);
  assert.throws(() => client.observeHook({}), /disposed/);
});

test("connection failure remains explicit and creates no session state", async () => {
  const client = createGatewaySessionClient({socket_path: "/tmp/are-no-such-continuity/socket", consumer_id: "missing", lane: "interaction-bound"});
  await assert.rejects(client.connect(), /connection-failed/);
  assert.equal(client.inspect().resumable, false);
  await client.close();
});


test("gateway restart replays completed requests and blocks unknown outcomes without redispatch", async t => {
  const {client, received, restart} = await fixture(t);
  const result = await client.request("completed", "thread/read", {threadId: "a"});
  const pending = client.request("unknown", "fixture/pending", {});
  const rejected = assert.rejects(pending);
  await until(() => received.length === 2);
  await restart(); await rejected;
  await until(() => !client.inspect().connected);
  await client.connect();
  assert.deepEqual(await client.request("completed", "thread/read", {threadId: "a"}), result);
  await assert.rejects(client.request("unknown", "fixture/pending", {}), error =>
    error.details?.data?.reason_codes?.includes("gateway.dispatch-outcome-unknown"));
  assert.equal(received.length, 2);
});
