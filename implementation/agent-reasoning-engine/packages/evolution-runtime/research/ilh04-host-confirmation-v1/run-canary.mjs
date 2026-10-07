#!/usr/bin/env node
import {createHash} from "node:crypto";
import {EventEmitter} from "node:events";
import {closeSync, fsyncSync, mkdirSync, openSync, renameSync, writeFileSync} from "node:fs";
import {PassThrough} from "node:stream";
import {resolve} from "node:path";

import {canonicalJson, canonicalizeJson} from "../../../intent-route-resolver/index.mjs";
import {
  CONTINUITY_CANDIDATE_REF,
  CONTINUITY_LEARNING_PACKAGE_DIGEST,
  CONTINUITY_NOTIFICATION,
  CONTINUITY_OWNER_DECISION_DIGEST,
  createAppServerRpcClient,
  createCodexAppServerWrapper,
  createContinuityHostConsumer,
  loadRepositoryProfile,
} from "../../../codex-app-server-wrapper/index.mjs";
import {semanticModulePort} from "../../../codex-app-server-wrapper/test/semantic-module-fixture.mjs";
import {LIVE_SCENARIOS_V4} from "../interaction-learning-objective-cycle-v1/live-scenarios-v4.mjs";

const cycleId = "ilh04-host-confirmation-v1";
const evolutionRoot = resolve(import.meta.dirname, "../..");
const repositoryRoot = resolve(evolutionRoot, "../../../..");
const configurationRoot = resolve(repositoryRoot, "..");
const wrapperRoot = resolve(evolutionRoot, "../codex-app-server-wrapper");
const evidenceRoot = resolve(evolutionRoot, "evidence", cycleId);
const digest = (value) => createHash("sha256").update(canonicalJson(canonicalizeJson(value))).digest("hex");

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

function seal(material, key) {
  return {...canonicalizeJson(material), [key]: digest(material)};
}

function percentile(values, fraction) {
  const ordered = [...values].sort((left, right) => left - right);
  return ordered[Math.max(0, Math.ceil(ordered.length * fraction) - 1)];
}

function wrapperTransport(wrapper) {
  const input = new PassThrough();
  const output = new PassThrough();
  const failure = new EventEmitter();
  let buffer = "";
  let chain = Promise.resolve();
  let turnSequence = 0;
  const emit = (message) => output.write(`${JSON.stringify(message)}\n`);
  input.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    let index;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const line = buffer.slice(0, index);
      buffer = buffer.slice(index + 1);
      chain = chain.then(async () => {
        const message = JSON.parse(line);
        const clientActions = await wrapper.processClientMessage(message);
        for (const candidate of clientActions.to_client) emit(candidate);
        for (const forwarded of clientActions.to_server) {
          if (forwarded.method === "turn/start" && Object.hasOwn(forwarded, "id")) {
            const response = {jsonrpc: "2.0", id: forwarded.id, result: {turn: {id: `canary-turn-${++turnSequence}`}}};
            const serverActions = await wrapper.processServerMessage(response);
            for (const candidate of serverActions.to_client) emit(candidate);
          } else if (Object.hasOwn(forwarded, "id")) {
            emit({jsonrpc: "2.0", id: forwarded.id, result: {ok: true}});
          }
        }
      }).catch((error) => failure.emit("failure", error));
    }
  });
  return {input, output, failure, ready: Promise.resolve({kind: "bounded-wrapper-host-canary", authority_effect: "none"}), close: async () => { input.end(); output.end(); }, inspect: () => ({kind: "bounded-wrapper-host-canary", authority_effect: "none"})};
}

const loaded = loadRepositoryProfile(resolve(wrapperRoot, "profiles/repository-v1.json"), configurationRoot);
if (!loaded.ok) throw new Error(`host-confirmation.profile-invalid:${loaded.reason_codes.join(",")}`);
if (loaded.value.continuity_renderer?.enabled !== false) throw new Error("host-confirmation.repository-profile-enabled");
const enabledProfile = structuredClone(loaded.value);
enabledProfile.objective_resolution = {enabled: true};
enabledProfile.continuity_renderer = {
  enabled: true,
  mode: "context-and-notification",
  candidate_ref: CONTINUITY_CANDIDATE_REF,
  learning_package_digest: CONTINUITY_LEARNING_PACKAGE_DIGEST,
  owner_decision_digest: CONTINUITY_OWNER_DECISION_DIGEST,
};

function makeWrapper(profile, binding, providerCounter) {
  return createCodexAppServerWrapper({
    loaded_profile: profile,
    decision_profile: loaded.decision_profile,
    definition_catalog: loaded.definition_catalog,
    ontology_snapshot: loaded.ontology_snapshot,
    source_snapshot: loaded.source_snapshot,
    module_port: semanticModulePort(),
    continuity_binding_provider: binding === null ? undefined : () => {
      providerCounter.count += 1;
      return binding;
    },
  });
}

async function executeCase({scenario, binding, profile = enabledProfile}) {
  const providerCounter = {count: 0};
  const surfaced = [];
  const latencies = [];
  let startedAt = 0;
  const consumer = createContinuityHostConsumer({surface: (projection) => {
    latencies.push(performance.now() - startedAt);
    surfaced.push(projection);
  }});
  const client = createAppServerRpcClient({transport: wrapperTransport(makeWrapper(profile, binding, providerCounter)), continuity_consumer: consumer, request_timeout_ms: 30000});
  startedAt = performance.now();
  const response = await client.request("turn/start", {threadId: `host-canary-${scenario.scenario_id}`, input: [{type: "text", text: `Implement the bounded continuity host adapter for ${scenario.scenario_id}.`}]});
  await new Promise((resolveWait) => setImmediate(resolveWait));
  await client.close();
  return {response, provider_calls: providerCounter.count, surfaced, latencies, state: consumer.inspect()};
}

const highRiskCases = [];
const lowRiskCases = [];
const allLatencies = [];
for (const scenario of LIVE_SCENARIOS_V4.slice(0, 6)) {
  const high = await executeCase({scenario, binding: {
    high_risk: true,
    active_cycle: scenario.active_cycle,
    relationship_code: scenario.relationship_code,
    response_language: scenario.response_language,
    next_action: scenario.next_pending_action,
    clarification_needed: scenario.clarification_expected,
    evidence_status: scenario.evidence_status,
  }});
  if (high.surfaced.length !== 1 || high.state.surfaced_count !== 1 || high.provider_calls !== 1) throw new Error(`host-confirmation.high-risk-failed:${scenario.scenario_id}`);
  allLatencies.push(...high.latencies);
  highRiskCases.push({scenario_id: scenario.scenario_id, projection_digest: high.surfaced[0].projection_digest, receipt_digest: high.state.receipts[0].receipt_digest, surface_latency_ms: high.latencies[0]});

  const low = await executeCase({scenario, binding: {high_risk: false}});
  if (low.surfaced.length !== 0 || low.state.received_count !== 0 || low.provider_calls !== 1) throw new Error(`host-confirmation.low-risk-failed:${scenario.scenario_id}`);
  lowRiskCases.push({scenario_id: scenario.scenario_id, continuity_notifications: low.state.received_count});
}

const disabledCounter = {count: 0};
const disabledScenario = LIVE_SCENARIOS_V4[6];
const disabled = await executeCase({scenario: disabledScenario, binding: {
  high_risk: true,
  active_cycle: disabledScenario.active_cycle,
  relationship_code: disabledScenario.relationship_code,
  response_language: disabledScenario.response_language,
  next_action: disabledScenario.next_pending_action,
  clarification_needed: disabledScenario.clarification_expected,
  evidence_status: disabledScenario.evidence_status,
}, profile: loaded.value});
disabledCounter.count = disabled.provider_calls;
if (disabled.surfaced.length !== 0 || disabled.state.received_count !== 0 || disabledCounter.count !== 0) throw new Error("host-confirmation.disabled-failed");

const replayMessage = {jsonrpc: "2.0", method: CONTINUITY_NOTIFICATION, params: highRiskCases.length ? (await (async () => {
  const scenario = LIVE_SCENARIOS_V4[0];
  const run = await executeCase({scenario, binding: {high_risk: true, active_cycle: scenario.active_cycle, relationship_code: scenario.relationship_code, response_language: scenario.response_language, next_action: scenario.next_pending_action, clarification_needed: scenario.clarification_expected, evidence_status: scenario.evidence_status}});
  return run.surfaced[0];
})()) : null};
let recoveredSurfaceCalls = 0;
const recoveredConsumer = createContinuityHostConsumer({
  retained_projection_digests: [replayMessage.params.projection_digest],
  surface: () => { recoveredSurfaceCalls += 1; },
});
const replayResult = await recoveredConsumer.consume(replayMessage);
if (!replayResult.ok || replayResult.disposition !== "duplicate-suppressed" || recoveredSurfaceCalls !== 0) throw new Error("host-confirmation.recovery-failed");

const tampered = structuredClone(replayMessage);
tampered.params.response = `${tampered.params.response} tampered`;
let tamperedSurfaceCalls = 0;
const tamperConsumer = createContinuityHostConsumer({surface: () => { tamperedSurfaceCalls += 1; }});
const tamperResult = await tamperConsumer.consume(tampered);
if (tamperResult.ok || tamperedSurfaceCalls !== 0) throw new Error("host-confirmation.tamper-failed");

const falseTriggers = lowRiskCases.reduce((sum, item) => sum + item.continuity_notifications, 0) + disabled.state.received_count;
const result = seal({
  schema_version: "are.continuity-host-canary-result/v1",
  cycle_id: cycleId,
  host_surface: "shared-rpc-client/headless",
  scenario_counts: {high_risk: highRiskCases.length, low_risk: lowRiskCases.length, disabled: 1},
  metrics: {
    host_surface_success_rate: highRiskCases.length / 6,
    false_trigger_count: falseTriggers,
    false_trigger_rate: falseTriggers / (lowRiskCases.length + 1),
    surface_latency_p50_ms: percentile(allLatencies, 0.5),
    surface_latency_p95_ms: percentile(allLatencies, 0.95),
  },
  high_risk_cases: highRiskCases,
  low_risk_cases: lowRiskCases,
  disabled_case: {scenario_id: disabledScenario.scenario_id, continuity_notifications: disabled.state.received_count, provider_calls: disabledCounter.count},
  integrity: {tampered_notification_rejected: true, reason_codes: tamperResult.reason_codes},
  recovery: {replayed_projection_suppressed: true, receipt_digest: replayResult.receipt.receipt_digest},
  repository_default_disabled: true,
  provider_model_calls: 0,
  disposition: "headless-host-confirmed",
  activation: "none",
  claim_limit: "Confirms the shared headless RPC host surface only; Codex Desktop/Windows UI display and real-user effectiveness remain unverified.",
  authority_effect: "none",
}, "result_digest");
atomicJson(resolve(evidenceRoot, "host-canary-result.json"), result);
process.stdout.write(`${canonicalJson({ok: true, evidence_path: resolve(evidenceRoot, "host-canary-result.json"), ...result})}\n`);
