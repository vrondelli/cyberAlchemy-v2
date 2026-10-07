#!/usr/bin/env node
// Test-only, isolated gateway-backed WebKitGTK Decisions journey. No model call.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {randomBytes} from "node:crypto";
import {EventEmitter} from "node:events";
import {existsSync, mkdirSync, mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {PassThrough} from "node:stream";
import {pathToFileURL} from "node:url";

const [packagePath, resizePath] = process.argv.slice(2);
assert.ok(packagePath && resizePath,
  "Usage: test-linux-decisions-detail.mjs <extracted-opt/are-companion> <x11-resize-helper>");
assert.ok(process.env.DISPLAY && process.env.WEBKIT_INSPECTOR_HTTP_SERVER
  && process.env.ARE_LINUX_UI_INSPECTOR_SERVER, "Isolated X11 and test-only WebKit inspector required");
const packageRoot = resolve(packagePath);
const resizeHelper = resolve(resizePath);
const executable = join(packageRoot, "bin/are-companion");
const node = join(packageRoot, "node/bin/node");
const productRoot = join(packageRoot, "are/cyberAlchemy-v2/implementation/agent-reasoning-engine");
const entry = join(productRoot, "bin/are.mjs");
const wrapper = join(productRoot, "packages/codex-app-server-wrapper/index.mjs");
for (const path of [executable, node, resizeHelper, entry, wrapper]) {
  assert.ok(existsSync(path), `Missing extracted package resource: ${path}`);
}
const scratch = mkdtempSync(join(tmpdir(), "are-linux-decisions-"));
const runtime = join(scratch, "runtime");
mkdirSync(runtime, {mode: 0o700});
const socket = join(scratch, "gateway.sock");
const observationSocket = join(scratch, "observation.sock");
const connectionToken = randomBytes(32).toString("base64url");
const observationToken = randomBytes(32).toString("base64url");
let gateway;
let transport;
let store;
let companion;
let stderr = "";
let passed = false;

function fakeBackendChild() {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = () => { child.emit("exit", 0, "SIGTERM"); return true; };
  return child;
}

async function inspect(mode) {
  const child = spawn(node, [join(resolve(import.meta.dirname), "inspect-linux-ui.mjs"), mode], {
    env: {...process.env}, stdio: ["ignore", "pipe", "pipe"],
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", chunk => { stdout = (stdout + chunk).slice(-1024 * 1024); });
  child.stderr.on("data", chunk => { stderr = (stderr + chunk).slice(-1024 * 1024); });
  const timer = setTimeout(() => child.kill("SIGTERM"), 45000);
  try {
    const status = await new Promise((done, fail) => {
      child.once("error", fail);
      child.once("exit", done);
    });
    return {status, stdout, stderr};
  } finally { clearTimeout(timer); }
}

try {
  const {createPersistentGateway, createMemoryGatewaySessionStore,
    connectGatewayRpcTransport} = await import(pathToFileURL(wrapper).href);
  store = createMemoryGatewaySessionStore({store_id: "are-linux-decisions-fixture"});
  gateway = createPersistentGateway({
    listen_path: socket,
    observation_listen_path: observationSocket,
    connection_token: connectionToken,
    observation_token: observationToken,
    session_store: store,
    wrapper_factory: () => ({
      processClientMessage: async message => ({to_server: [message], to_client: []}),
      processServerMessage: async message => ({to_server: [], to_client: [message]}),
      observeReasoningThreads: () => [{thread_ref: `backend-thread:${"a".repeat(64)}`,
        phase: "turn-active", reasoning_epoch_digest: "b".repeat(64),
        checkpoint_digest: "c".repeat(64), latest_frontier_digest: null,
        latest_frontier_event_sequence: null, last_completion_status: null,
        plan_context_digest: "f".repeat(64), plan_context_event_sequence: 3,
        plan_obligation_count: 7, plan_completed_count: 2,
        plan_open_decision_count: 1, plan_active_slice_ordinal: 3,
        plan_active_slice_status: "active"}],
      inspectState: () => ({degraded_steer_threads: []}),
      observeDecisions: () => [{decision_type: "effect-evaluation", outcome: "gate",
        thread_ref: `backend-thread:${"a".repeat(64)}`, decision_digest: "d".repeat(64),
        evidence_event_digest: "e".repeat(64), event_sequence: 4,
        observed_at_unix_ms: Date.now(), reason_codes: ["effect.owner-approval-required"]}],
      prepareForEviction: ({reason}) => ({ok: true, checkpoint_digest: `checkpoint:${reason}`,
        epoch_digest: `epoch:${reason}`, preparation_digest: `preparation:${reason}`}),
    }),
    spawn_impl: fakeBackendChild,
  });
  await gateway.start();
  transport = connectGatewayRpcTransport({socket_path: socket,
    consumer_id: "linux:ui-fixture", lane: "interaction-bound", connection_token: connectionToken});
  await transport.ready;
  companion = spawn(executable, ["--dashboard-only"], {env: {...process.env, HOME: scratch,
    XDG_RUNTIME_DIR: runtime, GDK_BACKEND: "x11", WEBKIT_DISABLE_COMPOSITING_MODE: "1",
    ARE_COMPANION_NODE: node, ARE_COMPANION_ENTRY: entry,
    ARE_COMPANION_OBSERVATION_SOCKET: observationSocket,
    ARE_ADAPTER_OBSERVATION_TOKEN: observationToken}, stdio: ["ignore", "ignore", "pipe"]});
  companion.stderr.on("data", chunk => { stderr = (stderr + chunk).slice(-3000); });
  let metrics;
  for (let attempt = 0; attempt < 50; attempt++) {
    const probe = await inspect("--read-dashboard-metrics");
    if (probe.status === 0) { metrics = JSON.parse(probe.stdout.trim()); break; }
    assert.equal(companion.exitCode, null, `Companion exited: ${stderr}`);
    await new Promise(done => setTimeout(done, 200));
  }
  assert.ok(metrics, `WebKitGTK dashboard did not become ready: ${stderr}`);
  const width = Math.round(340 * metrics.devicePixelRatio);
  const height = Math.round(740 * metrics.devicePixelRatio);
  const resized = spawnSync(resizeHelper, ["--resize-dashboard", String(companion.pid),
    String(width), String(height)], {encoding: "utf8", timeout: 10000});
  assert.equal(resized.status, 0, `X11 resize failed: ${resized.stderr}`);
  const result = await inspect("--verify-decisions-detail");
  assert.equal(result.status, 0, `Native Decisions journey failed: ${result.stderr}\n${stderr}`);
  const observation = JSON.parse(result.stdout.trim());
  assert.equal(observation.actual_viewport, "340x740");
  assert.equal(observation.gateway_decision_observed, true);
  assert.equal(observation.detail_collapsed_first, true);
  assert.equal(observation.detail_opened_programmatically, true);
  if (process.env.ARE_LINUX_UI_CAPTURE_PATH) {
    const capturePath = resolve(process.env.ARE_LINUX_UI_CAPTURE_PATH);
    assert.ok(!existsSync(capturePath), `Capture target already exists: ${capturePath}`);
    const capture = spawnSync(resizeHelper, ["--capture-dashboard", String(companion.pid), capturePath], {
      encoding: "utf8", timeout: 10000,
    });
    assert.equal(capture.status, 0, `X11 capture failed: ${capture.stderr}`);
  }
  const threadResult = await inspect("--verify-thread-plan-first-view");
  assert.equal(threadResult.status, 0, `Native Threads plan journey failed: ${threadResult.stderr}\n${stderr}`);
  const threadObservation = JSON.parse(threadResult.stdout.trim());
  assert.equal(threadObservation.actual_viewport, "340x740");
  assert.equal(threadObservation.named_thread_card, true);
  assert.equal(threadObservation.plan_checkpoint_visible, true);
  assert.equal(threadObservation.frontier_and_evidence_collapsed, true);
  if (process.env.ARE_LINUX_UI_THREAD_CAPTURE_PATH) {
    const capturePath = resolve(process.env.ARE_LINUX_UI_THREAD_CAPTURE_PATH);
    assert.ok(!existsSync(capturePath), `Thread capture target already exists: ${capturePath}`);
    const capture = spawnSync(resizeHelper, ["--capture-dashboard", String(companion.pid), capturePath], {
      encoding: "utf8", timeout: 10000,
    });
    assert.equal(capture.status, 0, `X11 thread capture failed: ${capture.stderr}`);
  }
  passed = true;
  process.stdout.write(JSON.stringify({schema_version: "are.companion-linux-decisions-detail/v1",
    ok: true, ...observation, thread_plan_first_view: threadObservation,
    source: "isolated-gateway-fixture",
    external_model_calls: 0, installed: false}) + "\n");
} finally {
  if (companion && companion.exitCode === null) {
    const stopped = new Promise(done => companion.once("exit", done));
    companion.kill("SIGTERM");
    await Promise.race([stopped, new Promise(done => setTimeout(done, 3000))]);
    if (companion.exitCode === null) companion.kill("SIGKILL");
  }
  await transport?.close().catch(() => {});
  await gateway?.close().catch(() => {});
  store?.close();
  if (passed) rmSync(scratch, {recursive: true, force: true});
  else process.stderr.write(`Isolated fixture directory retained after failure: ${scratch}\n`);
}
