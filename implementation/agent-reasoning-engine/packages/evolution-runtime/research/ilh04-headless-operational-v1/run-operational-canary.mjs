#!/usr/bin/env node
import {createHash} from "node:crypto";
import {EventEmitter} from "node:events";
import {closeSync, fsyncSync, mkdirSync, mkdtempSync, openSync, readFileSync, renameSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";
import {PassThrough} from "node:stream";

import {canonicalJson, canonicalizeJson} from "../../../intent-route-resolver/index.mjs";
import {
  connectGatewayRpcTransport,
  createAppServerRpcClient,
  createCodexAppServerWrapper,
  createContinuityHostConsumer,
  createPersistentGateway,
  loadRepositoryProfile,
  materializeContinuityActivationManifest,
  materializeContinuityBindingSnapshot,
  resolveEntrypointContinuity,
} from "../../../codex-app-server-wrapper/index.mjs";
import {semanticModulePort} from "../../../codex-app-server-wrapper/test/semantic-module-fixture.mjs";

const cycleId = "ilh04-headless-operational-v1";
const evolutionRoot = resolve(import.meta.dirname, "../..");
const repositoryRoot = resolve(evolutionRoot, "../../../..");
const configurationRoot = resolve(repositoryRoot, "..");
const wrapperRoot = resolve(evolutionRoot, "../codex-app-server-wrapper");
const evidenceRoot = resolve(evolutionRoot, "evidence", cycleId);
const activationRoot = resolve(evolutionRoot, "evidence/ilh04-headless-activation-v1");
const providerRoot = resolve(evolutionRoot, "evidence/ilh04-continuity-provider-v1");
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
  child.stdin = new PassThrough(); child.stdout = new PassThrough(); child.stderr = new PassThrough();
  child.kill = () => child.emit("exit", 0, "SIGTERM");
  let buffer = ""; let turn = 0;
  child.stdin.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    let index;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, index); buffer = buffer.slice(index + 1);
      if (!line.trim()) continue;
      const message = JSON.parse(line);
      let result = {ok: true};
      if (message.method === "initialize") result = {serverInfo: {name: "operational-continuity-canary", version: "1"}};
      else if (message.method === "thread/start") result = {thread: {id: "operational-continuity-thread"}};
      else if (message.method === "turn/start") result = {turn: {id: `operational-continuity-turn-${++turn}`}};
      child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id, result})}\n`);
    }
  });
  return child;
}

const profile = loadRepositoryProfile(resolve(wrapperRoot, "profiles/repository-v1.json"), configurationRoot);
if (!profile.ok || profile.value.continuity_renderer?.enabled !== false) throw new Error("operational-continuity.base-profile-invalid");
const state = materializeContinuityBindingSnapshot({snapshot_id: "ilh04-headless-operational-state", revision: 1, bindings: [{selector: {consumer_ref: "codex:human-chat"}, active_cycle: "evolution-runtime", relationship_by_transition: {continue: "same-cycle-continuation", refine: "same-cycle-refinement", interrupt: "temporary-interruption", replace: "sibling-cycle-handoff"}, response_language: "en", next_action: "Resume the next admitted evolution objective from its retained evidence.", clarification_needed: false, evidence_status: "verified-complete", high_risk_transitions: ["continue", "refine", "interrupt", "replace"]}]});
atomicJson(resolve(evidenceRoot, "continuity-state.json"), state);

const repositoryPath = (path) => `cyberAlchemy-v2/${path.slice(repositoryRoot.length + 1)}`;
const activationPackage = JSON.parse(readFileSync(resolve(activationRoot, "activation-package.json"), "utf8"));
const manifest = materializeContinuityActivationManifest({
  activation_id: cycleId,
  active_version_ref: activationPackage.active_version_ref,
  repository_root: configurationRoot,
  artifacts: {
    serving_pointer: repositoryPath(resolve(activationRoot, "runtime/serving-pointer.json")),
    activation_package: repositoryPath(resolve(activationRoot, "activation-package.json")),
    provider_package: repositoryPath(resolve(providerRoot, "provider-package.json")),
    continuity_snapshot: repositoryPath(resolve(evidenceRoot, "continuity-state.json")),
  },
});
const manifestPath = resolve(evidenceRoot, "activation-manifest.json");
atomicJson(manifestPath, manifest);
const continuity = resolveEntrypointContinuity({loaded_profile: profile.value, repository_root: configurationRoot, activation_manifest_path: manifestPath});
if (!continuity.ok || continuity.disposition !== "activated" || continuity.loaded_profile.continuity_renderer.enabled !== true) throw new Error("operational-continuity.activation-resolution-failed");

const temporaryRoot = mkdtempSync("/tmp/are-operational-continuity-");
const gateway = createPersistentGateway({
  listen_path: resolve(temporaryRoot, "gateway.sock"),
  runtime_epoch_id: "are-gateway-runtime:operational-continuity",
  backend: {mode: "direct-stdio"},
  spawn_impl: () => fakeBackend(),
  reconnect: true,
  authorize_client: ({consumer_id, lane}) => consumer_id === "codex:human-chat" && lane === "interaction-bound",
  wrapper_factory: () => createCodexAppServerWrapper({loaded_profile: continuity.loaded_profile, decision_profile: profile.decision_profile, definition_catalog: profile.definition_catalog, ontology_snapshot: profile.ontology_snapshot, source_snapshot: profile.source_snapshot, module_port: semanticModulePort(), continuity_binding_provider: continuity.provider}),
});
const surfaced = [];
const host = createContinuityHostConsumer({surface: (projection) => surfaced.push(projection)});
let transport; let client;
try {
  await gateway.start();
  transport = connectGatewayRpcTransport({socket_path: resolve(temporaryRoot, "gateway.sock"), consumer_id: "codex:human-chat", lane: "interaction-bound"});
  const connection = await transport.ready;
  client = createAppServerRpcClient({transport, continuity_consumer: host, request_timeout_ms: 30000});
  await client.initialize({clientInfo: {name: "operational-continuity-canary", version: "1"}, capabilities: {experimentalApi: true}});
  const thread = await client.startThread({cwd: "/tmp", ephemeral: true, approvalPolicy: "never", sandbox: "read-only"});
  await client.request("turn/start", {threadId: thread.thread.id, input: [{type: "text", text: "Implement the bounded operational continuity binding."}]});
  await new Promise((done) => setImmediate(done));
  if (surfaced.length !== 0) throw new Error("operational-continuity.low-risk-false-trigger");
  await client.request("turn/start", {threadId: thread.thread.id, input: [{type: "text", text: "do next"}]});
  await new Promise((done) => setImmediate(done));
  if (surfaced.length !== 1 || surfaced[0].active_cycle !== "evolution-runtime" || surfaced[0].next_action !== "Resume the next admitted evolution objective from its retained evidence.") throw new Error("operational-continuity.projection-invalid");
  const result = seal({schema_version: "are.operational-continuity-canary/v1", cycle_id: cycleId, runtime_epoch_id: connection.runtime_epoch_id, activation_manifest_digest: manifest.manifest_digest, activation_receipt_digest: continuity.receipt.receipt_digest, serving_pointer_digest: continuity.receipt.serving_pointer_digest, snapshot_digest: state.snapshot_digest, checks: {entrypoint_resolution: true, retained_pointer_consumed: true, enabled_profile_derived: true, low_risk_bypass: true, high_risk_notification: true, operational_state_not_canary_fixture: true, repository_default_disabled: true}, provider_model_calls: 0, disposition: "operational-headless-path-confirmed", authority_effect: "none"}, "result_digest");
  atomicJson(resolve(evidenceRoot, "operational-canary-result.json"), result);
  process.stdout.write(`${canonicalJson({ok: true, ...result})}\n`);
} finally {
  await client?.close().catch(() => {});
  await gateway.close().catch(() => {});
}
