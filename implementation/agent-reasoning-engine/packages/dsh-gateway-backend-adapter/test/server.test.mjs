import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {EventEmitter, once} from "node:events";
import {mkdtemp, rm, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {createDshGatewayBackendAdapter} from "../index.mjs";
import {createDshRunner} from "../src/dsh-runner.mjs";
import {connectGatewayRpcTransport, createAppServerRpcClient, createPersistentGateway, readAdapterObservation, spawnGatewayBackend} from "../../codex-app-server-wrapper/index.mjs";

const FIXTURE = fileURLToPath(new URL("./fixture-runner.mjs", import.meta.url));
const REPOSITORY_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../../..");
const GATEWAY_ENTRY = fileURLToPath(new URL("../../codex-app-server-wrapper/bin/are-codex-gateway.mjs", import.meta.url));
const GATEWAY_PROFILE = fileURLToPath(new URL("../../codex-app-server-wrapper/profiles/repository-v1.json", import.meta.url));

async function withClient(run, extraEnv = {}) {
  const home = await mkdtemp(join(tmpdir(), "are-dsh-test-"));
  const adapter = createDshGatewayBackendAdapter();
  const child = spawnGatewayBackend(adapter, {dsh_entry: FIXTURE, dsh_home: home, workspace_root: home, max_threads: 2, env: extraEnv});
  const failure = new EventEmitter();
  let closing = false;
  child.once("error", (error) => { if (!closing) failure.emit("failure", error); });
  child.once("close", (code, signal) => {
    if (!closing && code !== 0) failure.emit("failure", new Error(`adapter child exited: ${signal ?? code}`));
  });
  const transport = {
    input: child.stdin,
    output: child.stdout,
    failure,
    ready: Promise.resolve({kind: "dsh-adapter-test"}),
    close: async () => {
      closing = true;
      child.stdin.end();
      if (child.exitCode === null) child.kill("SIGTERM");
    },
  };
  const client = createAppServerRpcClient({transport, request_timeout_ms: 5000, completion_timeout_ms: 5000});
  try { return await run(client, home); }
  finally { await client.close(); await rm(home, {recursive: true, force: true}); }
}

test("adapter exposes the existing gateway backend contract", () => {
  const adapter = createDshGatewayBackendAdapter({dsh_entry: FIXTURE});
  assert.equal(adapter.schema_version, "are.gateway-backend-adapter/v1");
  assert.equal(adapter.adapter_id, "deepseek-harness-headless/v1");
  assert.equal(adapter.thread_ownership, "gateway-created");
  assert.equal(adapter.authority_effect, "none");
  assert.equal(adapter.preflight({workspace_root: process.cwd()}).ok, true);
  assert.equal(adapter.preflight({workspace_root: process.cwd()}).capability_attestation.disposition, "launcher-constrained-runtime-unverified");
  assert.equal(adapter.preflight({dsh_entry: "/definitely/missing/dsh-entry"}).ok, false);
  assert.deepEqual(adapter.preflight({persistence_mode: "durable"}).reason_codes, ["dsh.durable-store-root-missing"]);
  assert.equal(adapter.preflight({persistence_mode: "durable", dsh_home: process.cwd()}).ok, true);
  assert.equal(adapter.capabilities({persistence_mode: "ephemeral"}).history_persistence, "ephemeral");
  assert.equal(adapter.capabilities({persistence_mode: "durable"}).history_persistence, "durable");
});

test("DSH passthrough rejects gateway-only credentials", () => {
  const adapter = createDshGatewayBackendAdapter({dsh_entry: FIXTURE});
  for (const key of ["ARE_GATEWAY_CONNECTION_TOKEN", "ARE_ADAPTER_OBSERVATION_TOKEN",
    "ARE_HOSTED_INPUT_ATTESTATION_KEY"]) {
    assert.throws(() => adapter.spawn({env: {[key]: "private"}}),
      /Gateway private credentials cannot be passed/);
  }
  assert.throws(() => createDshGatewayBackendAdapter({dsh_entry: FIXTURE,
    env: {ARE_GATEWAY_CONNECTION_TOKEN: "private"}}).spawn(),
  /Gateway private credentials cannot be passed/);
});

test("persistent ARE gateway runs an end-to-end DSH session", async () => {
  const home = await mkdtemp(join(tmpdir(), "are-dsh-gateway-test-"));
  const listenPath = join(home, "gateway.sock");
  const observationPath = join(home, "observation.sock");
  const observationToken = "test-only-observation-token-32-bytes-minimum";
  const gateway = createPersistentGateway({
    listen_path: listenPath,
    observation_listen_path: observationPath,
    observation_token: observationToken,
    backend_adapter: createDshGatewayBackendAdapter(),
    backend: {dsh_entry: FIXTURE, dsh_home: home, workspace_root: home, persistence_mode: "durable"},
    authorize_client: ({consumer_id, lane}) => consumer_id === "dsh:test" && lane === "interaction-bound",
    wrapper_factory: () => ({
      processClientMessage: async (message) => ({to_server: [message], to_client: []}),
      processServerMessage: async (message) => ({to_server: [], to_client: [message]}),
      prepareForEviction: () => ({ok: true, checkpoint_digest: "test", epoch_digest: "test", preparation_digest: "test"}),
    }),
  });
  await gateway.start();
  const transport = connectGatewayRpcTransport({socket_path: listenPath, consumer_id: "dsh:test", lane: "interaction-bound", continuity: false});
  const client = createAppServerRpcClient({transport, request_timeout_ms: 5000, completion_timeout_ms: 5000});
  try {
    const connection = await transport.ready;
    assert.equal(connection.backend_capabilities.history_persistence, "durable");
    assert.equal(connection.backend_capabilities.operations.turn_steer, "unsupported");
    assert.equal(connection.backend_capabilities.operations.turn_start, "supported");
    await assert.rejects(client.request("turn/steer", {threadId: "missing", input: []}), /Backend operation is unsupported/);
    await client.initialize({});
    const observed = await readAdapterObservation({socket_path: observationPath, token: observationToken});
    assert.equal(observed.backend.status, "ready");
    assert.equal(observed.backend_capabilities.turn_steer, "unsupported");
    assert.equal(observed.backend_capabilities.history_persistence, "durable");
    assert.equal(gateway.inspect().sessions.length, 1);
    await client.notify("initialized", {});
    const thread = await client.startThread({cwd: home});
    const turn = await client.runTurn({threadId: thread.thread.id, input: [{type: "text", text: "through gateway"}], additionalContext: {"cyberalchemy.are.context-basis": {kind: "application", value: "bound-context"}}});
    assert.equal(turn.completed.turn.status, "completed");
    assert.match(turn.text, /bound-context/);
    assert.equal(gateway.inspect().backend_adapter_id, "deepseek-harness-headless/v1");
  } finally {
    await client.close();
    await gateway.close();
    await rm(home, {recursive: true, force: true});
  }
});

test("bridge translates app-server lifecycle into one DSH headless run", async () => {
  await withClient(async (client, cwd) => {
    const initialized = await client.initialize({clientInfo: {name: "adapter-test", version: "1"}});
    assert.equal(initialized.capabilities.effects, false);
    await client.notify("initialized", {});
    const started = await client.startThread({cwd});
    const result = await client.runTurn({threadId: started.thread.id, input: [{type: "text", text: "hello DSH"}]});
    assert.equal(result.started.turn.status, "inProgress");
    assert.equal(result.completed.turn.status, "completed");
    assert.equal(result.text, "fixture:hello DSH");
  });
});

test("bridge delivers ARE context and bounded conversation history to later DSH turns", async () => {
  await withClient(async (client, cwd) => {
    await client.initialize({});
    const started = await client.startThread({cwd});
    const first = await client.runTurn({threadId: started.thread.id, input: [{type: "text", text: "first"}], additionalContext: {"cyberalchemy.are.context-basis": {kind: "application", value: "route=CA2-ROUTE-UNDERSTAND"}}});
    assert.match(first.text, /ARE additional context/);
    assert.match(first.text, /CA2-ROUTE-UNDERSTAND/);
    const second = await client.runTurn({threadId: started.thread.id, input: [{type: "text", text: "second"}]});
    assert.match(second.text, /Conversation history/);
    assert.match(second.text, /User: first/);
    assert.match(second.text, /Assistant: fixture:/);
  });
});

test("bridge rejects unsupported modalities, cwd escapes, and excess threads", async () => {
  await withClient(async (client, cwd) => {
    await client.initialize({});
    const first = await client.startThread({cwd});
    await assert.rejects(client.runTurn({threadId: first.thread.id, input: [{type: "image", image_url: "test"}]}), /text input only/);
    await assert.rejects(client.startThread({cwd: tmpdir()}), /outside the configured/);
    await client.startThread({cwd});
    await assert.rejects(client.startThread({cwd}), /thread limit/);
  });
});

test("bridge rejects steering and settles interruption", async () => {
  await withClient(async (client, cwd) => {
    await client.initialize({});
    const started = await client.startThread({cwd});
    const beginning = client.request("turn/start", {threadId: started.thread.id, input: [{type: "text", text: "wait"}]});
    const turn = await beginning;
    await assert.rejects(client.request("turn/steer", {threadId: started.thread.id, turnId: turn.turn.id, input: []}), /not supported/);
    const interrupted = await client.request("turn/interrupt", {threadId: started.thread.id, turnId: turn.turn.id});
    assert.equal(interrupted.turn.status, "interrupted");
    const completion = await client.waitForNotification((message) => message.method === "turn/completed" && message.params?.turn?.id === turn.turn.id);
    assert.equal(completion.params.turn.status, "interrupted");
  }, {ARE_DSH_FIXTURE_DELAY_MS: "10000"});
});

test("ephemeral threads close explicitly and reclaim their identifier", async () => {
  await withClient(async (client, cwd) => {
    const initialized = await client.initialize({});
    assert.equal(initialized.persistence.mode, "ephemeral");
    const started = await client.startThread({cwd});
    const closed = await client.request("thread/close", {threadId: started.thread.id});
    assert.equal(closed.reclaimed, true);
    await assert.rejects(client.request("thread/resume", {threadId: started.thread.id}), /Unknown durable threadId/);
  });
});

test("history byte overflow fails hard instead of silently truncating prior turns", async () => {
  await withClient(async (client, cwd) => {
    await client.initialize({});
    const started = await client.startThread({cwd});
    const result = await client.runTurn({threadId: started.thread.id, input: [{type: "text", text: "history overflow"}]});
    assert.equal(result.completed.turn.status, "failed");
    assert.equal(result.text, "");
  }, {ARE_DSH_MAX_HISTORY_BYTES: "32"});
});

test("bounded output kills and settles the DSH child before reporting failure", async () => {
  const previous = process.env.ARE_DSH_FIXTURE_OUTPUT_BYTES;
  process.env.ARE_DSH_FIXTURE_OUTPUT_BYTES = "4096";
  try {
    const runner = createDshRunner({dsh_entry: FIXTURE, max_output_bytes: 64, kill_grace_ms: 100, env: {ARE_DSH_FIXTURE_OUTPUT_BYTES: "4096"}});
    const execution = runner.run({prompt: "overflow", cwd: process.cwd(), signal: new AbortController().signal});
    const result = await execution.completion;
    assert.equal(result.status, "failed");
    assert.match(result.diagnostic, /stdout exceeded 64 bytes/);
    assert.equal(execution.child.exitCode !== null || execution.child.signalCode !== null, true);
  } finally {
    if (previous === undefined) delete process.env.ARE_DSH_FIXTURE_OUTPUT_BYTES;
    else process.env.ARE_DSH_FIXTURE_OUTPUT_BYTES = previous;
  }
});

test("DSH stderr diagnostics stay private on a failed turn", async () => {
  await withClient(async (client, cwd) => {
    await client.initialize({});
    const started = await client.startThread({cwd});
    const result = await client.runTurn({threadId: started.thread.id, input: [{type: "text", text: "fail"}]});
    assert.equal(result.completed.turn.status, "failed");
    assert.doesNotMatch(result.completed.turn.error.message, /private reasoning/);
  }, {ARE_DSH_FIXTURE_FAIL: "1"});
});

test("runner streams bounded stdout without leaking the terminal newline", async () => {
  const deltas = [];
  const runner = createDshRunner({dsh_entry: FIXTURE});
  const execution = runner.run({prompt: "stream", cwd: process.cwd(), signal: new AbortController().signal, on_delta: (delta) => deltas.push(delta)});
  const result = await execution.completion;
  assert.equal(result.status, "completed");
  assert.equal(deltas.join(""), result.text);
  assert.equal(deltas.join(""), "fixture:stream");
});

test("provider overlays cannot introduce plugins across the closed adapter boundary", async () => {
  const directory = await mkdtemp(join(tmpdir(), "are-dsh-patch-test-"));
  const patch = join(directory, "unsafe.patch.yml");
  try {
    await writeFile(patch, "- id: custom-effect-tool\n  name: example/tool\n");
    assert.throws(() => createDshRunner({dsh_entry: FIXTURE, patch_path: patch}), /closed adapter boundary/);
  } finally {
    await rm(directory, {recursive: true, force: true});
  }
});

test("durable DSH thread history resumes after adapter restart", async () => {
  const home = await mkdtemp(join(tmpdir(), "are-dsh-resume-test-"));
  async function connect() {
    const adapter = createDshGatewayBackendAdapter();
    const child = spawnGatewayBackend(adapter, {dsh_entry: FIXTURE, dsh_home: home, workspace_root: home, persistence_mode: "durable"});
    const failure = new EventEmitter();
    let closing = false;
    child.once("error", (error) => { if (!closing) failure.emit("failure", error); });
    const transport = {input: child.stdin, output: child.stdout, failure, ready: Promise.resolve({kind: "dsh-resume-test"}), close: async () => { closing = true; child.stdin.end(); if (child.exitCode === null) child.kill("SIGTERM"); }};
    return createAppServerRpcClient({transport, request_timeout_ms: 5000, completion_timeout_ms: 5000});
  }
  let threadId;
  const first = await connect();
  try {
    await first.initialize({});
    const started = await first.startThread({cwd: home});
    threadId = started.thread.id;
    await first.runTurn({threadId, input: [{type: "text", text: "before restart"}]});
  } finally { await first.close(); }
  const second = await connect();
  try {
    await second.initialize({});
    const resumed = await second.request("thread/resume", {threadId});
    assert.equal(resumed.resumed, true);
    const result = await second.runTurn({threadId, input: [{type: "text", text: "after restart"}]});
    assert.match(result.text, /before restart/);
  } finally {
    await second.close();
    await rm(home, {recursive: true, force: true});
  }
});

test("gateway delivery recovery and DSH history recovery reconcile through one consumer binding", async () => {
  const home = await mkdtemp(join(tmpdir(), "are-dsh-gateway-recovery-"));
  const socketPath = join(home, "gateway.sock");
  const storePath = join(home, "gateway-sessions.jsonl");
  const backend = {dsh_entry: FIXTURE, dsh_home: home, workspace_root: home, persistence_mode: "durable"};
  const wrapperFactory = () => ({
    processClientMessage: async (message) => ({to_server: [message], to_client: []}),
    processServerMessage: async (message) => ({to_server: [], to_client: [message]}),
    prepareForEviction: () => ({ok: true, checkpoint_digest: "test", epoch_digest: "test", preparation_digest: "test"}),
  });
  const makeGateway = () => createPersistentGateway({
    listen_path: socketPath,
    session_store_path: storePath,
    backend_adapter: createDshGatewayBackendAdapter(),
    backend,
    authorize_client: ({consumer_id, lane}) => consumer_id === "dsh:recovery" && lane === "interaction-bound",
    wrapper_factory: wrapperFactory,
  });
  let firstGateway;
  let secondGateway;
  let firstClient;
  let secondClient;
  try {
    firstGateway = makeGateway();
    await firstGateway.start();
    const firstTransport = connectGatewayRpcTransport({socket_path: socketPath, consumer_id: "dsh:recovery", lane: "interaction-bound"});
    firstClient = createAppServerRpcClient({transport: firstTransport, request_timeout_ms: 5000, completion_timeout_ms: 5000});
    await firstTransport.ready;
    await firstClient.initialize({});
    const started = await firstClient.startThread({cwd: home}, {idempotency_key: "dsh-recovery:thread-start"});
    const threadId = started.thread.id;
    await firstClient.runTurn({threadId, input: [{type: "text", text: "before gateway restart"}]}, {idempotency_key: "dsh-recovery:turn-before-restart"});
    const {resume_token: token, last_acked_sequence: ack} = firstTransport.inspect();
    assert.equal(typeof token, "string");
    await firstClient.close();
    firstClient = null;
    await firstGateway.close();
    firstGateway = null;

    secondGateway = makeGateway();
    await secondGateway.start();
    const secondTransport = connectGatewayRpcTransport({socket_path: socketPath, consumer_id: "dsh:recovery", lane: "interaction-bound", resume_token: token, last_acked_sequence: ack});
    secondClient = createAppServerRpcClient({transport: secondTransport, request_timeout_ms: 5000, completion_timeout_ms: 5000});
    const receipt = await secondTransport.ready;
    assert.equal(receipt.resumed, true);
    assert.equal(receipt.session_recovery.gateway_delivery, "recovered-after-restart");
    assert.equal(receipt.session_recovery.backend_history, "not-verified-by-connect");
    assert.equal(receipt.backend_capabilities.history_persistence, "durable");
    await secondClient.initialize({});
    const resumed = await secondClient.request("thread/resume", {threadId}, {idempotency_key: "dsh-recovery:thread-resume"});
    assert.equal(resumed.resumed, true);
    const after = await secondClient.runTurn({threadId, input: [{type: "text", text: "after gateway restart"}]}, {idempotency_key: "dsh-recovery:turn-after-restart"});
    assert.match(after.text, /before gateway restart/);
  } finally {
    await secondClient?.close();
    await firstClient?.close();
    await secondGateway?.close();
    await firstGateway?.close();
    await rm(home, {recursive: true, force: true});
  }
});

test("a fresh gateway store cannot adopt a durable DSH thread owned by another consumer", async () => {
  const home = await mkdtemp(join(tmpdir(), "are-dsh-unbound-thread-"));
  const socketPath = join(home, "gateway.sock");
  const backend = {dsh_entry: FIXTURE, dsh_home: home, workspace_root: home, persistence_mode: "durable"};
  const wrapperFactory = () => ({
    processClientMessage: async (message) => ({to_server: [message], to_client: []}),
    processServerMessage: async (message) => ({to_server: [], to_client: [message]}),
    prepareForEviction: () => ({ok: true, checkpoint_digest: "test", epoch_digest: "test", preparation_digest: "test"}),
  });
  const makeGateway = (storePath) => createPersistentGateway({
    listen_path: socketPath, session_store_path: storePath,
    backend_adapter: createDshGatewayBackendAdapter(), backend,
    authorize_client: ({consumer_id, lane}) => ["dsh:owner", "dsh:other"].includes(consumer_id) && lane === "interaction-bound",
    wrapper_factory: wrapperFactory,
  });
  let firstGateway;
  let secondGateway;
  let firstClient;
  let secondClient;
  try {
    firstGateway = makeGateway(join(home, "first-gateway.jsonl"));
    await firstGateway.start();
    const firstTransport = connectGatewayRpcTransport({socket_path: socketPath, consumer_id: "dsh:owner", lane: "interaction-bound"});
    firstClient = createAppServerRpcClient({transport: firstTransport, request_timeout_ms: 5000, completion_timeout_ms: 5000});
    await firstTransport.ready;
    await firstClient.initialize({});
    const threadId = (await firstClient.startThread({cwd: home}, {idempotency_key: "dsh-unbound:thread-start"})).thread.id;
    await firstClient.close();
    firstClient = null;
    await firstGateway.close();
    firstGateway = null;

    secondGateway = makeGateway(join(home, "second-gateway.jsonl"));
    await secondGateway.start();
    const secondTransport = connectGatewayRpcTransport({socket_path: socketPath, consumer_id: "dsh:other", lane: "interaction-bound"});
    secondClient = createAppServerRpcClient({transport: secondTransport, request_timeout_ms: 5000, completion_timeout_ms: 5000});
    await secondTransport.ready;
    await secondClient.initialize({});
    await assert.rejects(secondClient.request("thread/resume", {threadId}, {idempotency_key: "dsh-unbound:thread-resume"}), /Gateway backend-thread ownership rejected/);
    await assert.rejects(secondClient.request("turn/start", {threadId, input: [{type: "text", text: "unowned"}]}, {idempotency_key: "dsh-unbound:turn-start"}), /Gateway backend-thread ownership rejected/);
    assert.equal(secondGateway.inspect().durable_session_index.sessions.find((session) => session.consumer_id === "dsh:other")?.thread_refs.length, 0);
  } finally {
    await secondClient?.close();
    await firstClient?.close();
    await secondGateway?.close();
    await firstGateway?.close();
    await rm(home, {recursive: true, force: true});
  }
});

test("the real ARE gateway CLI composes its wrapper with the DSH backend", async () => {
  const home = await mkdtemp(join(tmpdir(), "are-dsh-cli-wrapper-"));
  const socketPath = join(home, "gateway.sock");
  const child = spawn(process.execPath, [GATEWAY_ENTRY, "--listen", socketPath,
    "--development-live", "--config", GATEWAY_PROFILE, "--repository-root", REPOSITORY_ROOT,
    "--backend-agent", "dsh", "--dsh-entry", FIXTURE, "--dsh-home", home,
    "--dsh-workspace-root", home, "--dsh-persistence-mode", "durable",
    "--reasoning-state-dir", join(home, "reasoning-state"), "--session-store", join(home, "gateway-sessions.jsonl")],
  {stdio: ["ignore", "ignore", "pipe"]});
  const records = [];
  let stderrBuffer = "";
  child.stderr.on("data", (chunk) => {
    stderrBuffer += chunk.toString("utf8");
    let index;
    while ((index = stderrBuffer.indexOf("\n")) >= 0) {
      const line = stderrBuffer.slice(0, index);
      stderrBuffer = stderrBuffer.slice(index + 1);
      try { records.push(JSON.parse(line)); } catch { records.push({unparsed: line}); }
    }
  });
  let client;
  try {
    const deadline = Date.now() + 10_000;
    while (!records.some((record) => record.schema_version === "are.gateway-ready/v1")
      && child.exitCode === null && Date.now() < deadline) await new Promise((done) => setTimeout(done, 20));
    const ready = records.find((record) => record.schema_version === "are.gateway-ready/v1");
    assert.ok(ready, JSON.stringify(records));
    assert.equal(ready.backend_adapter_id, "deepseek-harness-headless/v1");
    assert.equal(ready.host_catalog_verification, null);
    const transport = connectGatewayRpcTransport({socket_path: socketPath, consumer_id: "codex:human-chat", lane: "interaction-bound",
      expected_backend_adapter_id: "deepseek-harness-headless/v1"});
    client = createAppServerRpcClient({transport, request_timeout_ms: 5000, completion_timeout_ms: 5000});
    assert.equal((await transport.ready).backend_adapter_id, "deepseek-harness-headless/v1");
    await client.initialize({});
    const threadId = (await client.startThread({cwd: home}, {idempotency_key: "dsh-cli:thread-start"})).thread.id;
    await assert.rejects(client.request("thread/read", {threadId}), /ARE host method is not governed/);
    await assert.rejects(client.request("thread/compact", {threadId}), /ARE host method is not governed/);
    await assert.rejects(client.request("thread/compact/start", {threadId}, {idempotency_key: "dsh-cli:unsupported-compact"}), /Backend operation is unsupported/);
    const turn = await client.runTurn({threadId, input: [{type: "text", text: "Research current context management approaches."}]},
      {idempotency_key: "dsh-cli:turn-start"});
    assert.equal(turn.completed.turn.status, "completed");
    assert.match(turn.text, /\[ARE additional context\]/);
    assert.match(turn.text, /cyberalchemy\.are\.context-basis/);
    const closed = await client.request("thread/close", {threadId}, {idempotency_key: "dsh-cli:thread-close"});
    assert.equal(closed.closed, true);
    await assert.rejects(client.request("thread/resume", {threadId}, {idempotency_key: "dsh-cli:closed-resume"}), /Unknown durable threadId/);
  } finally {
    await client?.close();
    if (child.exitCode === null) child.kill("SIGTERM");
    if (child.exitCode === null) await once(child, "exit");
    await rm(home, {recursive: true, force: true});
  }
});
