import {execFileSync, spawn} from "node:child_process";
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {createServer} from "node:net";
import {dirname, resolve} from "node:path";

import {
  connectGatewayRpcTransport,
  createAppServerRpcClient,
  createCodexAppServerWrapper,
  createPersistentGateway,
  deriveGatewayReasoningStateProfile,
  loadRepositoryProfile,
  protocolBindingCheck,
  REQUEST_CONTEXT_KEY,
} from "../../codex-app-server-wrapper/index.mjs";
import {runModelDrivenCodingTurn} from "../controller.mjs";
import {createCodexAppServerModelTransport} from "../model-transport.mjs";
import {snapshotTree} from "../verifier.mjs";

const packageRoot = resolve(import.meta.dirname, "..");
const areRoot = resolve(packageRoot, "../..");
const repositoryRoot = resolve(areRoot, "../../..");
const wrapperRoot = resolve(areRoot, "packages/codex-app-server-wrapper");
const profilePath = resolve(wrapperRoot, "profiles/repository-v1.json");
const temporaryRoot = mkdtempSync("/tmp/are-coding-agent-live-");
const fixtureRoot = resolve(temporaryRoot, "fixture");
const gatewaySocket = resolve(temporaryRoot, "gateway.sock");
const sessionStorePath = resolve(temporaryRoot, "gateway-sessions.jsonl");
const reasoningStateDirectory = resolve(temporaryRoot, "reasoning-state");
const node = process.execPath;

function bounded(promise, label, milliseconds = 300_000) {
  return new Promise((resolveValue, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label}:timeout`)), milliseconds);
    promise.then((value) => { clearTimeout(timer); resolveValue(value); }, (error) => { clearTimeout(timer); reject(error); });
  });
}

async function waitFor(predicate, label, milliseconds = 30_000) {
  const deadline = Date.now() + milliseconds;
  while (Date.now() < deadline) {
    if (predicate()) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 25));
  }
  throw new Error(`${label}:timeout`);
}

async function availablePort() {
  const server = createServer();
  await new Promise((resolveListen, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveListen);
  });
  const port = server.address().port;
  await new Promise((resolveClose) => server.close(resolveClose));
  return port;
}

async function waitForPort(port) {
  await waitFor(() => {
    try {
      execFileSync("bash", ["-lc", `exec 3<>/dev/tcp/127.0.0.1/${port}`], {stdio: "ignore", timeout: 1000});
      return true;
    } catch {
      return false;
    }
  }, "upstream-websocket-listener", 15_000);
}

function createFixture() {
  const files = {
    "package.json": "{\"type\":\"module\"}\n",
    "src/range.mjs": "export function sumInclusive(a,b){let n=0;for(let x=a;x<b;x++)n+=x;return n}\n",
    "test/range.test.mjs": "import test from 'node:test';import assert from 'node:assert/strict';import {sumInclusive} from '../src/range.mjs';test('inclusive',()=>assert.equal(sumInclusive(2,4),9));\n",
  };
  for (const [path, utf8] of Object.entries(files)) {
    const target = resolve(fixtureRoot, path);
    mkdirSync(dirname(target), {recursive: true});
    writeFileSync(target, utf8);
  }
  return snapshotTree(fixtureRoot);
}

let observedVersion = "unavailable";
try { observedVersion = execFileSync("codex", ["--version"], {encoding: "utf8"}).trim(); } catch {}
const loaded = loadRepositoryProfile(profilePath, repositoryRoot);
if (!loaded.ok) throw new Error(`repository-profile:${loaded.reason_codes.join(",")}`);
const binding = protocolBindingCheck(loaded.value.protocol_binding, observedVersion);

let upstream = null;
let gateway = null;
let client = null;
let resumedClient = null;
let upstreamStderr = "";
let output;

try {
  if (!binding.ok) throw new Error(`protocol-binding:${binding.reason_codes.join(",")}`);
  const before = createFixture();
  const upstreamPort = await availablePort();
  const upstreamUrl = `ws://127.0.0.1:${upstreamPort}`;
  upstream = spawn("codex", ["app-server", "--listen", upstreamUrl], {stdio: ["ignore", "ignore", "pipe"]});
  upstream.stderr.on("data", (chunk) => { upstreamStderr += chunk; });
  await waitForPort(upstreamPort);

  const consumerId = "codex:benchmark";
  const lane = "interaction-bound";
  const buildGateway = () => createPersistentGateway({
    listen_path: gatewaySocket,
    session_store_path: sessionStorePath,
    backend: {mode: "websocket", url: upstreamUrl},
    max_clients: 1,
    reconnect: true,
    authorize_client: ({consumer_id, lane: requestedLane}) => consumer_id === consumerId && requestedLane === lane,
    wrapper_factory: () => {
      const profile = structuredClone(loaded.value);
      profile.turn_bindings.default = {...profile.turn_bindings.default, lane, consumer_ref: consumerId};
      profile.reasoning_state = deriveGatewayReasoningStateProfile(loaded.value, consumerId, reasoningStateDirectory);
      return createCodexAppServerWrapper({
        loaded_profile: profile,
        decision_profile: loaded.decision_profile,
        definition_catalog: loaded.definition_catalog,
        ontology_snapshot: loaded.ontology_snapshot,
        source_snapshot: loaded.source_snapshot,
        context_source_provider: loaded.context_source_provider,
        semantic_profile: loaded.semantic_profile,
      });
    },
  });

  async function openClient(continuity = {}) {
    const transport = connectGatewayRpcTransport({
      socket_path: gatewaySocket,
      consumer_id: consumerId,
      lane,
      ...(continuity.resume_token ? {resume_token: continuity.resume_token} : {}),
      last_acked_sequence: continuity.last_acked_sequence ?? 0,
    });
    const rpc = createAppServerRpcClient({transport, request_timeout_ms: 300_000, completion_timeout_ms: 300_000});
    const receipt = await bounded(rpc.ready(), "gateway-client-ready", 30_000);
    return {rpc, transport, receipt};
  }

  gateway = buildGateway();
  await gateway.start();
  client = await openClient();
  const initialization = {clientInfo: {name: "are-coding-agent-live-canary", version: "0.1.0"}, capabilities: {experimentalApi: true}};
  await bounded(client.rpc.initialize(initialization), "initialize");
  const threadParams = {cwd: fixtureRoot, ephemeral: true, model: "gpt-5.6-sol", approvalPolicy: "never", sandbox: "read-only"};
  const thread = await bounded(client.rpc.startThread(threadParams, {idempotency_key: "coding-agent-live:thread"}), "thread-start");

  let modelInvocations = 0;
  let restartCount = 0;
  let resumedReceipt = null;
  let stableThreadReplay = null;
  let upstreamRedispatches = null;
  let preRestartState = null;
  const requestContextHint = {
    schema_version: "are.request-context-hint/v1",
    raw_request: "Analyze an allowlisted temporary fixture and propose one bounded patch candidate without executing tools or applying effects.",
    objective_kind: "research",
    requested_effects: [],
    target_refs: ["ephemeral-fixture:src/range.mjs"],
    constraints: ["proposal-only", "no-tool-execution", "no-mutation-during-model-turn"],
    evidence_refs: ["coding-agent-live-canary:fixture-snapshot"],
  };
  const baseTransport = createCodexAppServerModelTransport({
    client: client.rpc,
    thread_id: thread.thread.id,
    transport_id: "codex-app-server-via-are-gateway",
    turn_options: {additionalContext: {[REQUEST_CONTEXT_KEY]: {kind: "application", value: JSON.stringify(requestContextHint)}}},
  });
  const restartBarrierTransport = Object.freeze({
    kind: baseTransport.kind,
    transport_id: baseTransport.transport_id,
    async generate(input) {
      modelInvocations += 1;
      const generated = await baseTransport.generate(input);
      preRestartState = gateway.inspect().sessions[0]?.wrapper_state ?? null;
      await waitFor(() => {
        const session = gateway.inspect().sessions[0];
        return session && session.acknowledged_through === session.delivery_sequence;
      }, "pre-restart-delivery-ack");
      const continuity = client.transport.inspect();
      await client.rpc.close();
      client = null;
      await gateway.close();
      restartCount += 1;
      gateway = buildGateway();
      await gateway.start();
      resumedClient = await openClient({resume_token: continuity.resume_token, last_acked_sequence: continuity.last_acked_sequence});
      resumedReceipt = resumedClient.receipt;
      await bounded(resumedClient.rpc.initialize(initialization), "restart-initialize");
      stableThreadReplay = await bounded(resumedClient.rpc.startThread(threadParams, {idempotency_key: "coding-agent-live:thread"}), "restart-thread-replay");
      upstreamRedispatches = gateway.inspect().sessions[0]?.upstream_request_count ?? null;
      return generated;
    },
  });

  const result = await runModelDrivenCodingTurn({
    run_id: "ARE-CODING-AGENT-LIVE-CANARY-001",
    request: "Fix sumInclusive so the upper bound is included. Change only src/range.mjs and return its complete replacement content.",
    fixture_root: fixtureRoot,
    observation_allowlist: ["package.json", "src/range.mjs", "test/range.test.mjs"],
    mutation_allowlist: ["src/range.mjs"],
    verification_command: [node, "--test"],
    model_transport: restartBarrierTransport,
    approve: true,
  });
  const after = snapshotTree(fixtureRoot);
  const changedPaths = Object.keys(after.files).filter((path) => before.files[path] !== after.files[path]).sort();
  const actionStarts = result.reasoning_events?.filter((event) => event.event_kind === "ActionStarted").length ?? 0;
  const passed = result.status === "PATCH_CANDIDATE"
    && result.verification?.status === "PASS_BOUNDED"
    && modelInvocations === 1
    && restartCount === 1
    && resumedReceipt?.resumed === true
    && stableThreadReplay?.thread?.id === thread.thread.id
    && upstreamRedispatches === 0
    && actionStarts === 1
    && result.effect_applied === true
    && JSON.stringify(changedPaths) === JSON.stringify(["src/range.mjs"])
    && readFileSync(resolve(fixtureRoot, "src/range.mjs"), "utf8").includes("<=");

  output = {
    schema_version: "are.coding-agent-live-gateway-canary/v1",
    status: passed ? "PASS" : "FAIL",
    observed_codex_version: observedVersion,
    protocol_binding: "matched",
    model_invocations: modelInvocations,
    gateway_restarts_before_effect: restartCount,
    authenticated_session_resumption: resumedReceipt?.resumed ?? false,
    stable_thread_identity_replayed: stableThreadReplay?.thread?.id === thread.thread.id,
    stable_request_upstream_redispatches: upstreamRedispatches,
    context_epoch_count: preRestartState?.current_context_epochs?.length ?? 0,
    reasoning_checkpoint_count: preRestartState?.reasoning_state?.checkpoint_count ?? 0,
    coding_result: {status: result.status, reason_codes: result.reason_codes ?? [], model_error: result.model_error ?? null, effect_applied: result.effect_applied, action_starts: actionStarts, verification_status: result.verification?.status ?? null, changed_paths: changedPaths},
    authority_effect: "none",
    claim_limit: "One controlled live-model coding turn against an ephemeral fixture; no source-repository mutation, production sandbox, publication, deployment, or general reliability claim.",
  };
} catch (error) {
  output = {schema_version: "are.coding-agent-live-gateway-canary/v1", status: "FAIL", error: error.message, observed_codex_version: observedVersion, authority_effect: "none"};
} finally {
  if (client) await client.rpc.close().catch(() => {});
  if (resumedClient) await resumedClient.rpc.close().catch(() => {});
  if (gateway) await gateway.close().catch(() => {});
  if (upstream) upstream.kill("SIGTERM");
  rmSync(temporaryRoot, {recursive: true, force: true});
}

output.stderr = upstreamStderr.split("\n").filter(Boolean).slice(-20);
process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
process.exitCode = output.status === "PASS" ? 0 : 1;
