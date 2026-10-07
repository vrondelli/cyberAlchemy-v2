#!/usr/bin/env node
import {createHash} from "node:crypto";
import {EventEmitter} from "node:events";
import {closeSync, fsyncSync, mkdirSync, mkdtempSync, openSync, renameSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {PassThrough} from "node:stream";

import {canonicalJson, canonicalizeJson} from "../../../intent-route-resolver/index.mjs";
import {
  CONTINUITY_CANDIDATE_REF,
  CONTINUITY_LEARNING_PACKAGE_DIGEST,
  CONTINUITY_OWNER_DECISION_DIGEST,
  connectGatewayRpcTransport,
  createAppServerRpcClient,
  createCodexAppServerWrapper,
  createContinuityHostConsumer,
  createPersistentGateway,
  loadRepositoryProfile,
  materializeContinuityBindingSnapshot,
  resolveContinuityBindingProvider,
} from "../../../codex-app-server-wrapper/index.mjs";
import {semanticModulePort} from "../../../codex-app-server-wrapper/test/semantic-module-fixture.mjs";

const cycleId = "ilh04-continuity-provider-v1";
const evolutionRoot = resolve(import.meta.dirname, "../..");
const repositoryRoot = resolve(evolutionRoot, "../../../..");
const configurationRoot = resolve(repositoryRoot, "..");
const wrapperRoot = resolve(evolutionRoot, "../codex-app-server-wrapper");
const evidenceRoot = resolve(evolutionRoot, "evidence", cycleId);
const digest = (value) => createHash("sha256").update(canonicalJson(canonicalizeJson(value))).digest("hex");
const seal = (material, key) => ({...canonicalizeJson(material), [key]: digest(material)});

function atomicJson(path, value) {
  mkdirSync(resolve(path, ".."), {recursive: true, mode: 0o700});
  const temporary = `${path}.tmp-${process.pid}`;
  const descriptor = openSync(temporary, "wx", 0o600);
  try { writeFileSync(descriptor, `${canonicalJson(canonicalizeJson(value))}\n`); fsyncSync(descriptor); }
  finally { closeSync(descriptor); }
  renameSync(temporary, path);
  const directory = openSync(resolve(path, ".."), "r");
  try { fsyncSync(directory); } finally { closeSync(directory); }
}

function fakeBackend() {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  child.kill = () => child.emit("exit", 0, "SIGTERM");
  let buffer = "";
  let turn = 0;
  child.stdin.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    let index;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      if (!line.trim()) continue;
      const message = JSON.parse(line);
      let result = {ok: true};
      if (message.method === "initialize") result = {serverInfo: {name: "bounded-canary", version: "1"}};
      else if (message.method === "thread/start") result = {thread: {id: "continuity-provider-thread"}};
      else if (message.method === "turn/start") result = {turn: {id: `continuity-provider-turn-${++turn}`}};
      child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id, result})}\n`);
    }
  });
  return child;
}

const loaded = loadRepositoryProfile(resolve(wrapperRoot, "profiles/repository-v1.json"), configurationRoot);
if (!loaded.ok) throw new Error(`continuity-provider-canary.profile-invalid:${loaded.reason_codes.join(",")}`);
if (loaded.value.continuity_renderer?.enabled !== false) throw new Error("continuity-provider-canary.repository-profile-enabled");
const profile = structuredClone(loaded.value);
profile.objective_resolution = {enabled: true};
profile.continuity_renderer = {enabled: true, mode: "context-and-notification", candidate_ref: CONTINUITY_CANDIDATE_REF, learning_package_digest: CONTINUITY_LEARNING_PACKAGE_DIGEST, owner_decision_digest: CONTINUITY_OWNER_DECISION_DIGEST};

const snapshot = materializeContinuityBindingSnapshot({
  snapshot_id: "ilh04-continuity-provider-canary",
  revision: 1,
  bindings: [{
    selector: {consumer_ref: "codex:human-chat"},
    active_cycle: "engine-improvement",
    relationship_by_transition: {continue: "same-cycle-continuation", refine: "same-cycle-refinement", interrupt: "temporary-interruption", replace: "sibling-cycle-handoff"},
    response_language: "en",
    next_action: "Validate the provider through the bounded gateway canary.",
    clarification_needed: false,
    evidence_status: "pending",
    high_risk_transitions: ["continue", "refine", "interrupt", "replace"],
  }],
});
atomicJson(resolve(evidenceRoot, "continuity-binding-snapshot.json"), snapshot);
const resolvedProvider = resolveContinuityBindingProvider({loaded_profile: profile, state_path: resolve(evidenceRoot, "continuity-binding-snapshot.json")});
if (!resolvedProvider.ok) throw new Error(`continuity-provider-canary.provider-invalid:${resolvedProvider.reason_codes.join(",")}`);

const temporaryRoot = mkdtempSync("/tmp/are-continuity-provider-canary-");
const socketPath = resolve(temporaryRoot, "gateway.sock");
const gateway = createPersistentGateway({
  listen_path: socketPath,
  runtime_epoch_id: "are-gateway-runtime:continuity-provider-canary",
  backend: {mode: "direct-stdio"},
  spawn_impl: () => fakeBackend(),
  reconnect: true,
  authorize_client: ({consumer_id, lane}) => consumer_id === "codex:human-chat" && lane === "interaction-bound",
  wrapper_factory: () => createCodexAppServerWrapper({
    loaded_profile: profile,
    decision_profile: loaded.decision_profile,
    definition_catalog: loaded.definition_catalog,
    ontology_snapshot: loaded.ontology_snapshot,
    source_snapshot: loaded.source_snapshot,
    module_port: semanticModulePort(),
    continuity_binding_provider: resolvedProvider.provider,
  }),
});

const surfaced = [];
const hostConsumer = createContinuityHostConsumer({surface: (projection) => surfaced.push(projection)});
let transport;
let client;
try {
  await gateway.start();
  transport = connectGatewayRpcTransport({socket_path: socketPath, consumer_id: "codex:human-chat", lane: "interaction-bound"});
  const connection = await transport.ready;
  client = createAppServerRpcClient({transport, continuity_consumer: hostConsumer, request_timeout_ms: 30000});
  await client.initialize({clientInfo: {name: "continuity-provider-canary", version: "1"}, capabilities: {experimentalApi: true}});
  const thread = await client.startThread({cwd: "/tmp", ephemeral: true, approvalPolicy: "never", sandbox: "read-only"});
  await client.request("turn/start", {threadId: thread.thread.id, input: [{type: "text", text: "Implement the bounded continuity provider."}]});
  await new Promise((resolveWait) => setImmediate(resolveWait));
  if (surfaced.length !== 0) throw new Error("continuity-provider-canary.new-transition-false-trigger");
  await client.request("turn/start", {threadId: thread.thread.id, input: [{type: "text", text: "do next"}]});
  await new Promise((resolveWait) => setImmediate(resolveWait));
  if (surfaced.length !== 1 || surfaced[0].transition !== "continue") throw new Error("continuity-provider-canary.continue-not-surfaced");
  const providerState = resolvedProvider.provider.inspect();
  const hostState = hostConsumer.inspect();
  if (providerState.receipt_count !== 2 || providerState.receipts[0].disposition !== "low-risk-bypass" || providerState.receipts[1].disposition !== "high-risk-binding" || hostState.surfaced_count !== 1) throw new Error("continuity-provider-canary.receipts-invalid");
  const result = seal({
    schema_version: "are.continuity-provider-gateway-canary/v1",
    cycle_id: cycleId,
    gateway_runtime_epoch_id: connection.runtime_epoch_id,
    snapshot_digest: snapshot.snapshot_digest,
    checks: {new_transition_low_risk: true, continue_transition_high_risk: true, notification_surfaced: true, provider_receipts: 2, host_receipts: 1, repository_default_disabled: true},
    provider_receipt_digests: providerState.receipts.map((receipt) => receipt.receipt_digest),
    host_receipt_digests: hostState.receipts.map((receipt) => receipt.receipt_digest),
    projection_digest: surfaced[0].projection_digest,
    provider_model_calls: 0,
    disposition: "gateway-provider-confirmed",
    activation: "none",
    claim_limit: "Local deterministic Unix-socket gateway with a model-neutral backend; no provider/model call, serving activation, or real-user effectiveness claim.",
    authority_effect: "none",
  }, "result_digest");
  atomicJson(resolve(evidenceRoot, "gateway-canary-result.json"), result);
  process.stdout.write(`${canonicalJson({ok: true, evidence_path: resolve(evidenceRoot, "gateway-canary-result.json"), ...result})}\n`);
} finally {
  await client?.close().catch(() => {});
  await gateway.close().catch(() => {});
}
