import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import test, {after} from "node:test";
import {fileURLToPath} from "node:url";

import {
  approvalAccepted,
  CACHE_AFFINITY_KEY,
  CONTEXT_KEY,
  createAppendOnlyFileReasoningStateSink,
  createCodexAppServerWrapper,
  createMemoryReasoningStateSink,
  createReasoningStateLedger,
  deriveReasoningReceiptConstraints,
  evaluateDualLaneContinuation,
  loadRepositoryProfile,
  SEMANTIC_NOTIFICATION,
  INTENT_CONTEXT_KEY,
  protocolBindingCheck,
  REQUEST_CONTEXT_KEY,
  verifyReasoningStateLog,
} from "../index.mjs";
import {digestValue} from "../../semantic-judgment-evaluator/index.mjs";
import {composeSemanticLifecycle, loadSemanticInputProfile} from "../../semantic-input-runtime/index.mjs";
import {sha256HexText} from "../../intent-route-resolver/index.mjs";
import {createNativeSemanticAdapter} from "../../module-port/native-semantic-adapter.mjs";
import {createStaticContextSourcesAdapter, contextSourceOutputValidators} from "../../module-port/context-sources.mjs";
import {composeStaticModulePort, sealStaticModuleConfiguration} from "../../module-port/static-composition.mjs";
import {semanticTextOutputValidators} from "../../module-port/semantic-text.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const loaded = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), repositoryRoot);
assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));
const semanticProfilePath = resolve(packageRoot, "test/fixtures/semantic/profile.json");
const semanticProfile = loadSemanticInputProfile(semanticProfilePath, repositoryRoot);
assert.equal(semanticProfile.ok, true, semanticProfile.reason_codes?.join(","));
const temporaryPaths = [];
after(() => temporaryPaths.forEach((path) => rmSync(path, {recursive: true, force: true})));

function wrapper(overrides = {}) {
  return createCodexAppServerWrapper({
    loaded_profile: loaded.value,
    decision_profile: loaded.decision_profile,
    definition_catalog: loaded.definition_catalog,
    ontology_snapshot: loaded.ontology_snapshot,
    source_snapshot: loaded.source_snapshot,
    context_source_provider: loaded.context_source_provider,
    ...overrides,
  });
}

test("wrapper starts and exposes non-context operations with no definition or ontology sources", async () => {
  const instance = wrapper({
    definition_catalog: undefined,
    ontology_snapshot: undefined,
    context_source_provider: undefined,
  });
  assert.deepEqual(instance.inspectState().context_dependencies, {
    definition_catalog: "unavailable",
    ontology_snapshot: "unavailable",
  });
  const inspection = {jsonrpc: "2.0", id: 901, method: "cyberalchemy/health", params: {}};
  const passthrough = await instance.processClientMessage(inspection);
  assert.deepEqual(passthrough.to_server, [inspection]);
  assert.deepEqual(passthrough.to_client, []);

  const blocked = await instance.processClientMessage(turnStart(902, "Implement the bounded change."));
  assert.equal(blocked.to_server.length, 0);
  assert.equal(blocked.to_client[0].error.code, -32072);
  assert.equal(blocked.to_client[0].error.data.reason_codes.includes("module.capability-unavailable"), true);
  assert.equal(blocked.to_client[0].error.data.residue.every((item) => item.kind === "context-dependency"), true);
});

test("one statically composed module port supplies semantic and context capabilities", async () => {
  const semantic = createNativeSemanticAdapter();
  const context = createStaticContextSourcesAdapter({
    definition_catalog: loaded.definition_catalog,
    ontology_snapshot: loaded.ontology_snapshot,
  });
  const configuration = sealStaticModuleConfiguration({
    configuration_id: "wrapper-reviewed-modules",
    modules: [semantic, context].map(({manifest}, index) => ({
      factory_id: index === 0 ? "semantic" : "context",
      module_id: manifest.module_id,
      version: manifest.version,
      manifest_digest: manifest.manifest_digest,
    })),
  });
  const composition = composeStaticModulePort({
    configuration,
    adapter_factories: {semantic: () => semantic, context: () => context},
    output_validators: {...semanticTextOutputValidators, ...contextSourceOutputValidators},
  });
  assert.equal(composition.ok, true);
  const instance = wrapper({
    definition_catalog: undefined,
    ontology_snapshot: undefined,
    context_source_provider: undefined,
    module_port: composition.port,
  });
  assert.deepEqual(instance.inspectState().context_dependencies, {
    definition_catalog: "available-module",
    ontology_snapshot: "available-module",
  });
  const forwarded = await instance.processClientMessage(turnStart(903, "Implement the bounded change.", "thread-static-modules"));
  assert.equal(forwarded.to_server.length, 1);
  assert.equal(forwarded.to_client.length, 0);
});

function turnStart(id, text, threadId = "thread-1", extras = {}) {
  return {jsonrpc: "2.0", id, method: "turn/start", params: {threadId, input: [{type: "text", text}], ...extras}};
}

function forwardedContext(result) {
  const context = result.to_server[0].params.additionalContext;
  const manifest = JSON.parse(context[CONTEXT_KEY].value);
  if (Array.isArray(manifest.included_items)) return manifest;
  const includedItems = Object.values(context)
    .map((entry) => {
      try { return JSON.parse(entry.value); } catch { return null; }
    })
    .filter((value) => value?.schema_version === "are.context-item/v1");
  return {...manifest, included_items: includedItems};
}

function completed(threadId = "thread-1", turnId = "turn-1") {
  return {jsonrpc: "2.0", method: "turn/completed", params: {threadId, turn: {id: turnId, items: [], status: "completed"}}};
}

test("wrapper records bounded Codex context-window telemetry without retaining context contents", async () => {
  const instance = wrapper();
  const message = {
    jsonrpc: "2.0",
    method: "thread/tokenUsage/updated",
    params: {
      threadId: "thread-telemetry",
      turnId: "turn-telemetry",
      tokenUsage: {
        last: {inputTokens: 900, cachedInputTokens: 600, cacheWriteInputTokens: 0, outputTokens: 80, reasoningOutputTokens: 20, totalTokens: 1000},
        total: {inputTokens: 1900, cachedInputTokens: 1100, cacheWriteInputTokens: 0, outputTokens: 180, reasoningOutputTokens: 40, totalTokens: 2120},
        modelContextWindow: 4000,
      },
    },
  };
  const action = await instance.processServerMessage(message);
  assert.deepEqual(action.to_client, [message]);
  const telemetry = instance.inspectState().context_window_telemetry;
  assert.equal(telemetry.threads[0].thread_id, "thread-telemetry");
  assert.equal(telemetry.threads[0].token_usage_update_count, 1);
  const event = instance.ledger.snapshot().find((candidate) => candidate.event_kind === "token-usage-updated");
  assert.equal(event.thread_id, "thread-telemetry");
  assert.equal(Object.hasOwn(event, "context"), false);
});

function turnResponse(id, turnId) {
  return {jsonrpc: "2.0", id, result: {turn: {id: turnId}}};
}

function semanticInput() {
  const value = {purchase_age_days: 12, purchase_amount: 75, receipt_present: true, fraud_hold: false, final_sale: false};
  const sourceDigest = digestValue(value);
  return {
    owner_ref: "commerce-policy-owner@local",
    created_at: "2026-07-23T12:00:00.000Z",
    as_of: "2026-07-23T12:05:00.000Z",
    observation_sources: [{source_ref: "fixture://wrapper/refund-case", value, digest: sourceDigest}],
    observation_candidates: Object.entries(value).map(([field, fieldValue], index) => ({
      schema_version: "are.observation-candidate/v1",
      candidate_id: `wrapper:candidate:${String(index + 1).padStart(2, "0")}`,
      field,
      value: fieldValue,
      issuer_ref: "commerce-policy-owner@local",
      source_ref: "fixture://wrapper/refund-case",
      source_digest: sourceDigest,
      validator_ref: "wrapper-fixture-validator@1",
      temporal_scope: {observed_at: "2026-07-23T12:05:00.000Z"},
      proposed_posture: "admitted",
    })),
    challenge_state: {required_lanes: [{lane_id: "owner-policy-challenge", status: "closed", attempt_count: 1}]},
  };
}

function semanticWrapper(overrides = {}) {
  const profile = structuredClone(loaded.value);
  profile.semantic_evaluation = {enabled: true, trigger: "turn/completed"};
  return wrapper({
    loaded_profile: profile,
    semantic_profile: semanticProfile.value,
    semantic_input_provider: () => semanticInput(),
    ...overrides,
  });
}

function planProposal(proposalId, semanticDependency = undefined, overrides = {}) {
  return {
    proposal_id: proposalId,
    declared_plan_digest: `plan:${proposalId}`,
    action_ref: "validate",
    route_id: "CA2-ROUTE-VALIDATE",
    objective_kind: "validate",
    effect_classes: ["non-effectful-validate"],
    reversible: true,
    evidence_refs: [`plan:${proposalId}`],
    next_turn: {params: {threadId: `successor:${proposalId}`, input: [{type: "text", text: "Validate the bounded result."}]}},
    ...(semanticDependency === undefined ? {} : {semantic_dependency: semanticDependency}),
    ...overrides,
  };
}

async function startAndBind(instance, {id, text, threadId, turnId, extras = {}}) {
  const started = await instance.processClientMessage(turnStart(id, text, threadId, extras));
  assert.equal(started.to_server.length, 1);
  await instance.processServerMessage(turnResponse(id, turnId));
}

test("repository profile verifies exact sources and materializes production inputs", () => {
  assert.equal(loaded.decision_profile.profile_id, "cyberalchemy-fast-routing");
  assert.ok(loaded.definition_catalog.definitions.length > 20);
  assert.equal(loaded.ontology_snapshot.nodes.length, 77);
  assert.equal(loaded.ontology_snapshot.nodes.some((node) => node.node_id === "agent-reasoning-engine.EvolutionCycle"), true);
  assert.equal(loaded.ontology_snapshot.nodes.some((node) => node.node_id === "agent-reasoning-engine.CacheAffinityProjection"), true);
  assert.equal(loaded.ontology_snapshot.edges.length, 101);
  assert.deepEqual(loaded.value.semantic_evaluation, {enabled: false, trigger: "turn/completed"});
  assert.deepEqual(loaded.value.evolution_signals, {enabled: false, trigger: "turn/completed"});
  assert.equal(loaded.semantic_profile.profile_id, "semantic-input:definition-readiness@1");
  assert.deepEqual(loaded.value.context_source_refresh, {hash_implementation: "node-crypto-sha256", verification: "read-and-hash-every-selected-source"});
  assert.deepEqual(loaded.value.runtime_journal, {journal_id: "are-codex-runtime:domainspec-core", max_events: 4096, max_closed_turns: 256});
  assert.deepEqual(loaded.value.gateway, {
    backend_mode: "daemon-proxy",
    max_clients: 8,
    max_buffered_messages_per_client: 256,
    reconnect: true,
    detach_timeout_ms: 300000,
    idle_timeout_ms: 1800000,
    max_retained_bytes_per_session: 4194304,
    max_reasoning_log_bytes_per_session: 67108864,
    expiration_tombstone_ttl_ms: 3600000,
    eviction_retry_ms: 1000,
    reasoning_state: {
      mode: "file-per-consumer",
      directory: resolve(packageRoot, ".runtime/reasoning-state"),
      single_writer: true,
    },
    session_store: {
      mode: "append-only-file-fsync",
      path: resolve(packageRoot, ".runtime/gateway-sessions.jsonl"),
      single_writer: true,
    },
    allowed_clients: [
      {consumer_id: "codex:benchmark", lane: "interaction-bound", window_ref: null, request_id: null},
      {consumer_id: "codex:human-chat", lane: "interaction-bound", window_ref: null, request_id: null},
      {consumer_id: "codex:plan", lane: "plan-bound", window_ref: "plan:persistent-codex", request_id: "request:persistent-codex-plan"},
    ],
  });
  assert.equal(loaded.semantic_profile.profile_id, "semantic-input:definition-readiness@1");
});

test("native live-source hashing is byte-identical to the portable implementation", async () => {
  const portable = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), repositoryRoot, {source_hash_implementation: "portable-js-sha256"});
  assert.equal(portable.ok, true, portable.reason_codes?.join(","));
  assert.deepEqual(portable.source_snapshot, loaded.source_snapshot);
  assert.equal(portable.value.context_source_refresh.hash_implementation, "portable-js-sha256");
  const refreshed = await loaded.context_source_provider();
  assert.equal(refreshed.ok, true);
  for (const source of refreshed.source_snapshot) {
    const text = readFileSync(resolve(repositoryRoot, source.source_identity), "utf8");
    assert.equal(source.source_digest, sha256HexText(text), source.source_identity);
  }
  const invalid = loadRepositoryProfile(resolve(packageRoot, "profiles/repository-v1.json"), repositoryRoot, {source_hash_implementation: "not-sha256"});
  assert.deepEqual(invalid.reason_codes, ["config.context-source-hash-implementation-invalid"]);
});

test("an explicitly enabled repository profile exact-loads its semantic profile", () => {
  const directory = mkdtempSync(resolve(packageRoot, ".tmp-semantic-config-"));
  temporaryPaths.push(directory);
  const profile = JSON.parse(readFileSync(resolve(packageRoot, "profiles/repository-v1.json"), "utf8"));
  const semanticBytes = readFileSync(semanticProfilePath);
  profile.semantic_evaluation = {enabled: true, trigger: "turn/completed"};
  profile.sources.semantic_input_profile = {
    path: "cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/test/fixtures/semantic/profile.json",
    sha256: createHash("sha256").update(semanticBytes).digest("hex"),
  };
  const path = resolve(directory, "profile.json");
  writeFileSync(path, JSON.stringify(profile));
  const result = loadRepositoryProfile(path, repositoryRoot);
  assert.equal(result.ok, true, result.reason_codes?.join(","));
  assert.equal(result.value.semantic_evaluation.enabled, true);
  assert.equal(result.semantic_profile.profile_id, "semantic-input:wrapper-test@1");
  profile.sources.semantic_input_profile.sha256 = "0".repeat(64);
  writeFileSync(path, JSON.stringify(profile));
  const drift = loadRepositoryProfile(path, repositoryRoot);
  assert.equal(drift.ok, false);
  assert.deepEqual(drift.reason_codes, ["config.source-digest-drift"]);
});

test("protocol binding accepts the observed binary and blocks version drift", () => {
  assert.equal(protocolBindingCheck(loaded.value.protocol_binding, "codex-cli 0.153.0-alpha.5").ok, true);
  const drift = protocolBindingCheck(loaded.value.protocol_binding, "codex-cli 0.152.1");
  assert.equal(drift.ok, false);
  assert.deepEqual(drift.reason_codes, ["protocol.codex-version-drift"]);
});

test("repository profile rejects semantic drift between its protocol binding and exact evidence", () => {
  const directory = mkdtempSync(resolve(packageRoot, ".tmp-protocol-config-"));
  temporaryPaths.push(directory);
  const profile = JSON.parse(readFileSync(resolve(packageRoot, "profiles/repository-v1.json"), "utf8"));
  profile.protocol_binding.observed_codex_version = "codex-cli 0.152.1";
  const path = resolve(directory, "profile.json");
  writeFileSync(path, JSON.stringify(profile));
  const result = loadRepositoryProfile(path, repositoryRoot);
  assert.equal(result.ok, false);
  assert.ok(result.reason_codes.includes("config.protocol-observed-version-drift"));
});

test("repository profile rejects a non-boolean interaction projection reuse switch", () => {
  const directory = mkdtempSync(resolve(packageRoot, ".tmp-projection-config-"));
  temporaryPaths.push(directory);
  const profile = JSON.parse(readFileSync(resolve(packageRoot, "profiles/repository-v1.json"), "utf8"));
  profile.context_projection.reuse_compatible_interaction_projection = "yes";
  const path = resolve(directory, "profile.json");
  writeFileSync(path, JSON.stringify(profile));
  const result = loadRepositoryProfile(path, repositoryRoot);
  assert.equal(result.ok, false);
  assert.deepEqual(result.reason_codes, ["config.context-projection-interaction-reuse-invalid"]);
});

test("obvious Research preflight forwards a bounded inline Context Envelope", async () => {
  const result = await wrapper().processClientMessage(turnStart(1, "Research current context management approaches."));
  assert.equal(result.to_server.length, 1);
  assert.equal(result.to_client.length, 0);
  const entry = result.to_server[0].params.additionalContext[CONTEXT_KEY];
  assert.equal(entry.kind, "application");
  const fragment = forwardedContext(result);
  assert.equal(fragment.route_id, "CA2-ROUTE-RESEARCH");
  assert.equal(fragment.schema_version, "are.codex-context-fragment/v2");
  assert.equal(fragment.view_lane, "interaction-bound");
  assert.equal(fragment.inline_bytes <= 32768, true);
  assert.equal(fragment.included_items.length > 0, true);
  assert.equal(fragment.included_items.some((item) => item.item_kind === "definition" && typeof item.content.text === "string"), true);
  assert.equal(fragment.included_items.some((item) => item.item_kind === "ontology-node" && typeof item.content.intent === "string"), true);
  assert.equal(fragment.authority_effect, "none");
});

test("typed request hint retrieves canonical ontology meaning, related nodes, and repository instructions", async () => {
  const hint = {
    schema_version: "are.request-context-hint/v1",
    raw_request: "How does ontology work in CyberAlchemy?",
    objective_kind: "define",
    requested_effects: [],
    target_refs: ["CA2-CAP-DEFINE-SHARED-MEANING"],
    constraints: ["candidate-meaning-only"],
    evidence_refs: ["test:human-input"],
  };
  const result = await wrapper().processClientMessage(turnStart(1901, "Define the supplied conversational context.", "thread-ontology", {
    additionalContext: {[REQUEST_CONTEXT_KEY]: {kind: "application", value: JSON.stringify(hint)}},
  }));
  assert.equal(result.to_server.length, 1);
  const fragment = forwardedContext(result);
  assert.equal(fragment.route_id, "CA2-ROUTE-DEFINE");
  assert.equal(fragment.inline_bytes <= fragment.max_inline_bytes, true);
  assert.equal(fragment.included_items.some((item) => item.item_kind === "request" && item.content.raw_request === hint.raw_request), true);
  assert.equal(fragment.included_items.some((item) => item.context_item_id === "definition:CAV2-D19" && item.relevance_basis === "request-term-match"), true);
  assert.equal(fragment.included_items.some((item) => item.item_kind === "ontology-node" && item.context_item_id.includes("OntologySelector")), true);
  assert.equal(fragment.included_items.some((item) => item.item_kind === "ontology-catalog" && item.content.ontologies.some((ontology) => ontology.ontology_id === "cav2.ontology-product")), true);
  assert.equal(fragment.included_items.some((item) => item.item_kind === "repository-instruction" && item.content.instruction_id === "repository-root-agents"), true);
  assert.equal(fragment.exclusions.some((entry) => entry.reason === "not-selected"), true);
  assert.equal(fragment.context_use_contract.schema_version, "are.codex-context-use-contract/v1");
  assert.equal(fragment.context_use_contract.direct_answer_sources.some((entry) => entry.context_item_id === "definition:CAV2-D19"), true);
});

test("a request naming CyberAlchemy v2 and ontology projects both exact definitions", async () => {
  const rawRequest = "I want to understand and use the ontology already present in CyberAlchemy v2.";
  const hint = {schema_version: "are.request-context-hint/v1", raw_request: rawRequest, objective_kind: "define"};
  const result = await wrapper().processClientMessage(turnStart(1903, rawRequest, "thread-disjoint-exact", {
    additionalContext: {[REQUEST_CONTEXT_KEY]: {kind: "application", value: JSON.stringify(hint)}},
  }));
  assert.equal(result.to_server.length, 1);
  const fragment = forwardedContext(result);
  assert.equal(fragment.included_items.some((item) => item.context_item_id === "definition:CAV2-D9"), true);
  assert.equal(fragment.included_items.some((item) => item.context_item_id === "definition:CAV2-D19"), true);
  assert.equal(fragment.included_items.some((item) => item.context_item_id === "ontology-catalog:repository"), true);
});

test("malformed request context hint blocks before forwarding", async () => {
  const result = await wrapper().processClientMessage(turnStart(1902, "Define the supplied conversational context.", "thread-bad-hint", {
    additionalContext: {[REQUEST_CONTEXT_KEY]: {kind: "application", value: "{}"}},
  }));
  assert.equal(result.to_server.length, 0);
  assert.equal(result.to_client[0].error.data.reason_codes.includes("request.context-hint-invalid"), true);
});

test("turn/start seals, reconstructs, verifies, and checkpoints reasoning state before forwarding", async () => {
  const instance = wrapper();
  const result = await instance.processClientMessage(turnStart(1001, "Research current context management approaches.", "thread-reasoning"));
  assert.equal(result.to_server.length, 1);
  const events = instance.ledger.snapshot();
  const verified = events.find((event) => event.event_kind === "reasoning-dispatch-verified");
  const forwarded = events.find((event) => event.event_kind === "turn-start-forwarded");
  assert.ok(verified.reasoning_epoch_id.startsWith("reasoning-state:"));
  assert.ok(verified.dispatch_digest);
  assert.ok(verified.dispatch_verification_digest);
  assert.ok(verified.request_header_digest);
  assert.equal(verified.checkpoint_kind, "before-model-request");
  assert.equal(verified.sequence < forwarded.sequence, true);
  const state = instance.inspectState().reasoning_state;
  assert.equal(state.ledger_id, "are-reasoning-state:domainspec-core-codex");
  assert.equal(state.event_count, 3);
  assert.equal(state.epoch_count, 1);
  assert.equal(state.checkpoint_count, 1);
  assert.equal(state.durability, "process-memory");
  assert.equal(state.sink.record_count, 5);
  assert.equal(state.sink.flush_count, 1);
});

test("turn/start places the reusable reasoning projection before volatile context and measures exact reuse", async () => {
  const planProfile = structuredClone(loaded.value);
  planProfile.turn_bindings.default = {...planProfile.turn_bindings.default, lane: "plan-bound", consumer_ref: "codex:cache-plan", window_ref: "plan:cache", request_id: "request:cache-plan"};
  const instance = wrapper({loaded_profile: planProfile});
  const first = await instance.processClientMessage(turnStart(1011, "Research reusable reasoning state.", "thread-cache"));
  const second = await instance.processClientMessage(turnStart(1012, "Research reusable reasoning state.", "thread-cache"));
  assert.equal(first.to_server.length, 1);
  assert.equal(second.to_server.length, 1);
  const firstContext = first.to_server[0].params.additionalContext;
  const secondContext = second.to_server[0].params.additionalContext;
  assert.equal(Object.keys(firstContext)[0], CACHE_AFFINITY_KEY);
  assert.equal(Object.keys(secondContext)[0], CACHE_AFFINITY_KEY);
  assert.equal(firstContext[CACHE_AFFINITY_KEY].value.includes("are.reasoning-request-series-header/v1"), true);
  assert.equal(firstContext[CACHE_AFFINITY_KEY].value.includes("reusable_reasoning_state"), false);
  const states = instance.inspectState().cache_affinity_consumers;
  assert.equal(states.length, 1);
  assert.equal(states[0].posture, "eligible-reuse");
  assert.equal(states[0].exact_prefix_reuse, true);
  assert.equal(states[0].context_bound_reuse_disposition, "reuse-current");
  assert.equal(typeof states[0].context_bound_reuse_receipt_digest, "string");
  assert.equal(typeof states[0].refresh_assessment_digest, "string");
  assert.equal(states[0].reused_prefix_bytes >= states[0].reusable_prefix_bytes, true);
  const events = instance.ledger.snapshot().filter((event) => event.event_kind === "reasoning-dispatch-verified");
  assert.equal(events[0].cache_affinity_posture, "cold");
  assert.equal(events[1].cache_affinity_posture, "eligible-reuse");
  assert.equal(events[1].context_bound_reuse_receipt_digest, states[0].context_bound_reuse_receipt_digest);
  assert.equal(events[1].cache_hit_posture, "unobserved");
  assert.equal(events[1].observed_token_savings, null);
});

test("measured provider cache usage is bound to the exact current projection", async () => {
  const instance = wrapper();
  await instance.processClientMessage(turnStart(1013, "Research reusable reasoning state.", "thread-cache-measured"));
  const projection = instance.inspectState().cache_affinity_consumers[0];
  const observed = instance.recordCacheTelemetry({
    consumer_ref: projection.consumer,
    provider_usage: {
      schema_version: "are.provider-cache-usage/v1",
      projection_digest: projection.projection_digest,
      exact_prefix_digest: projection.exact_prefix_digest,
      provider_ref: projection.provider_ref,
      model_ref: projection.model_ref,
      input_tokens: 1400,
      cached_input_tokens: 1100,
      latency_ms: 82,
      baseline_latency_ms: 127,
    },
  });
  assert.equal(observed.ok, true);
  assert.equal(observed.disposition, "observed-hit");
  assert.equal(observed.observation.observed_token_savings, 1100);
  assert.equal(observed.observation.observed_time_savings_ms, 45);
  const state = instance.inspectState().cache_affinity_consumers[0];
  assert.equal(state.cache_hit_posture, "observed-hit");
  assert.equal(state.observed_cached_input_tokens, 1100);
  const event = instance.ledger.snapshot().find((candidate) => candidate.event_kind === "cache-telemetry-observed");
  assert.equal(event.cache_telemetry_observation_digest, observed.observation.observation_digest);
});

test("provider usage on the turn response is automatically bound and checkpointed", async () => {
  const instance = wrapper();
  await instance.processClientMessage(turnStart(1014, "Research reusable reasoning state.", "thread-cache-auto"));
  await instance.processServerMessage({jsonrpc: "2.0", id: 1014, result: {turn: {id: "turn-cache-auto"}, usage: {input_tokens: 900, cached_input_tokens: 700, latency_ms: 70, baseline_latency_ms: 100}}});
  const state = instance.inspectState();
  assert.equal(state.cache_affinity_consumers[0].cache_hit_posture, "observed-hit");
  assert.equal(state.cache_affinity_consumers[0].observed_token_savings, 700);
  assert.equal(state.reasoning_state.checkpoint_count, 2);
});
test("file-backed turn/start persists the verified dispatch sequence before forwarding", async () => {
  const directory = mkdtempSync("/tmp/are-wrapper-reasoning-state-");
  temporaryPaths.push(directory);
  const logPath = resolve(directory, "reasoning-state.jsonl");
  const sink = createAppendOnlyFileReasoningStateSink({path: logPath});
  const reasoningLedger = createReasoningStateLedger({ledger_id: "reasoning:file-canary", sink});
  const instance = wrapper({reasoning_ledger: reasoningLedger});

  const result = await instance.processClientMessage(turnStart(1003, "Research reusable reasoning state.", "thread-file-canary"));
  assert.equal(result.to_server.length, 1);
  reasoningLedger.close();

  const records = readFileSync(logPath, "utf8").trim().split("\n").map((line) => JSON.parse(line));
  assert.deepEqual(records.map((record) => record.record_kind), [
    "reasoning-state-event",
    "reasoning-state-event",
    "reasoning-state-epoch",
    "reasoning-state-event",
    "reasoning-state-checkpoint",
  ]);
  assert.equal(records[3].value.event_kind, "dispatch-materialized");
  assert.equal(records[4].value.checkpoint_kind, "before-model-request");
  assert.equal(records[3].value.content.dispatch.dispatch_digest, records[4].value.subject_digest);
  assert.ok(records[3].value.content.verification_digest);
});

test("file-backed wrapper recovers the last checkpoint before accepting a new turn", async () => {
  const directory = mkdtempSync("/tmp/are-wrapper-recovery-");
  temporaryPaths.push(directory);
  const logPath = resolve(directory, "reasoning-state.jsonl");
  const sink = createAppendOnlyFileReasoningStateSink({path: logPath});
  const bootstrap = createReasoningStateLedger({ledger_id: loaded.value.reasoning_state.ledger_id, sink});
  const event = bootstrap.append({event_kind: "bootstrap", content: {request_id: "before-restart"}});
  const epoch = bootstrap.seal({event_digests: [event.event.event_digest], request_ref: "before-restart"});
  const checkpoint = bootstrap.checkpoint({checkpoint_kind: "manual", epoch: epoch.value});
  bootstrap.close();

  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync", log_path: logPath};
  const instance = wrapper({loaded_profile: profile});
  const recovered = instance.inspectState().reasoning_state.recovery;
  assert.equal(recovered.disposition, "recovered");
  assert.equal(recovered.recovered_checkpoint_digest, checkpoint.digest);
  assert.equal(instance.ledger.snapshot()[0].event_kind, "reasoning-state-recovered");

  const result = await instance.processClientMessage(turnStart(1004, "Research state recovery.", "thread-recovered"));
  assert.equal(result.to_server.length, 1);
  assert.equal(instance.inspectState().reasoning_state.event_count, 4);
  instance.close();
  const verified = verifyReasoningStateLog(logPath, {expected_ledger_id: loaded.value.reasoning_state.ledger_id});
  assert.equal(verified.ok, true);
  assert.equal(verified.value.index.checkpoint_count, 2);
});

test("file-backed wrapper recovers context-bound reuse receipts and observed provider cache telemetry", async () => {
  const directory = mkdtempSync("/tmp/are-wrapper-cache-recovery-");
  temporaryPaths.push(directory);
  const logPath = resolve(directory, "reasoning-state.jsonl");
  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync", log_path: logPath};
  profile.turn_bindings.default = {...profile.turn_bindings.default, lane: "plan-bound", consumer_ref: "codex:cache-recovery", window_ref: "plan:cache-recovery", request_id: "request:cache-recovery"};
  const first = wrapper({loaded_profile: profile});
  await first.processClientMessage(turnStart(10041, "Research cache recovery.", "thread-cache-recovery"));
  await first.processServerMessage({jsonrpc: "2.0", id: 10041, result: {turn: {id: "turn-cache-recovery"}, usage: {input_tokens: 1200, cached_input_tokens: 850, latency_ms: 70, baseline_latency_ms: 110}}});
  const before = first.inspectState().cache_affinity_consumers[0];
  assert.equal(before.cache_hit_posture, "observed-hit");
  first.close();

  const recovered = wrapper({loaded_profile: profile});
  const after = recovered.inspectState().cache_affinity_consumers[0];
  assert.equal(after.context_bound_reuse_receipt_digest, before.context_bound_reuse_receipt_digest);
  assert.equal(after.cache_telemetry_observation_digest, before.cache_telemetry_observation_digest);
  assert.equal(after.cache_hit_posture, "observed-hit");
  assert.equal(after.observed_cached_input_tokens, 850);
  recovered.close();
});

test("file-backed wrapper rejects an uncheckpointed recovery tail at startup", () => {
  const directory = mkdtempSync("/tmp/are-wrapper-recovery-block-");
  temporaryPaths.push(directory);
  const logPath = resolve(directory, "reasoning-state.jsonl");
  const sink = createAppendOnlyFileReasoningStateSink({path: logPath});
  const bootstrap = createReasoningStateLedger({ledger_id: loaded.value.reasoning_state.ledger_id, sink});
  bootstrap.append({event_kind: "uncommitted", content: {request_id: "crashed"}});
  bootstrap.close();
  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync", log_path: logPath};
  assert.throws(() => wrapper({loaded_profile: profile}), /reasoning\.log-uncheckpointed-tail/);
});

test("file-backed completion frontier replays after restart without semantic, continuation, or successor calls", async () => {
  const directory = mkdtempSync("/tmp/are-wrapper-completion-frontier-");
  temporaryPaths.push(directory);
  const logPath = resolve(directory, "reasoning-state.jsonl");
  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync", log_path: logPath};
  let semanticInputCalls = 0;
  let semanticLifecycleCalls = 0;
  let continuationCalls = 0;
  const semanticInputProvider = () => {
    semanticInputCalls += 1;
    return semanticInput();
  };
  const semanticLifecycle = (input) => {
    semanticLifecycleCalls += 1;
    return composeSemanticLifecycle(input);
  };
  const continuationProvider = () => {
    continuationCalls += 1;
    return {plan_bound: [planProposal("frontier-restart")]};
  };
  const first = wrapper({
    loaded_profile: profile,
    semantic_input_provider: semanticInputProvider,
    semantic_lifecycle: semanticLifecycle,
    continuation_provider: continuationProvider,
  });
  await startAndBind(first, {id: 1005, text: "Research whether this refund is eligible.", threadId: "thread-frontier", turnId: "turn-frontier"});
  const initial = await first.processServerMessage(completed("thread-frontier", "turn-frontier"));
  assert.equal(initial.to_server.length, 1);
  assert.equal(first.inspectState().reasoning_state.frontier_count, 1);
  assert.deepEqual({semanticInputCalls, semanticLifecycleCalls, continuationCalls}, {semanticInputCalls: 0, semanticLifecycleCalls: 0, continuationCalls: 1});
  first.close();

  const second = wrapper({
    loaded_profile: profile,
    semantic_input_provider: semanticInputProvider,
    semantic_lifecycle: semanticLifecycle,
    continuation_provider: continuationProvider,
  });
  assert.deepEqual(second.inspectState().completion_frontier_turn_ids, ["thread-frontier:turn-frontier"]);
  const replayed = await second.processServerMessage(completed("thread-frontier", "turn-frontier"));
  assert.equal(replayed.to_server.length, 0);
  assert.equal(replayed.to_client.some((message) => message.method === "cyberalchemy/successor" && message.params.kind === "replayed"), true);
  assert.deepEqual({semanticInputCalls, semanticLifecycleCalls, continuationCalls}, {semanticInputCalls: 0, semanticLifecycleCalls: 0, continuationCalls: 1});
  const changedCompletion = completed("thread-frontier", "turn-frontier");
  changedCompletion.params.turn.status = "failed";
  const mismatch = await second.processServerMessage(changedCompletion);
  assert.equal(mismatch.to_server.length, 0);
  assert.deepEqual(mismatch.to_client.at(-1).params.reason_codes, ["reasoning.frontier-subject-mismatch"]);
  assert.deepEqual({semanticInputCalls, semanticLifecycleCalls, continuationCalls}, {semanticInputCalls: 0, semanticLifecycleCalls: 0, continuationCalls: 1});
  second.close();
  const verified = verifyReasoningStateLog(logPath, {expected_ledger_id: loaded.value.reasoning_state.ledger_id});
  assert.equal(verified.ok, true);
  assert.equal(verified.value.index.frontier_count, 1);
});

test("a failed required model checkpoint blocks turn/start", async () => {
  const sink = createMemoryReasoningStateSink();
  const reasoningLedger = createReasoningStateLedger({ledger_id: "reasoning:closed", sink});
  reasoningLedger.close();
  const result = await wrapper({reasoning_ledger: reasoningLedger}).processClientMessage(turnStart(1002, "Research current context management approaches.", "thread-checkpoint-fail"));
  assert.equal(result.to_server.length, 0);
  assert.equal(result.to_client[0].error.code, -32075);
  assert.deepEqual(result.to_client[0].error.data.reason_codes, ["reasoning.sink-closed"]);
});

test("ambiguous preflight returns an exact gate and never forwards turn/start", async () => {
  const result = await wrapper().processClientMessage(turnStart(2, "Research and validate this evidence."));
  assert.equal(result.to_server.length, 0);
  assert.equal(result.to_client.length, 1);
  assert.equal(result.to_client[0].error.code, -32071);
  assert.equal(result.to_client[0].error.data.directive_kind, "gate");
});

test("compatible interaction-bound turns reuse projected content but create successor view, context, and reasoning identities", async () => {
  const interactionProfile = structuredClone(loaded.value);
  interactionProfile.turn_bindings.default = {...interactionProfile.turn_bindings.default, consumer_ref: "codex:compatible-interaction", request_id: "request:compatible-interaction"};
  const instance = wrapper({loaded_profile: interactionProfile});
  const first = await instance.processClientMessage(turnStart(3, "Explain this architecture."));
  const second = await instance.processClientMessage(turnStart(4, "Explain this architecture."));
  const firstFragment = JSON.parse(first.to_server[0].params.additionalContext[CONTEXT_KEY].value);
  const secondFragment = JSON.parse(second.to_server[0].params.additionalContext[CONTEXT_KEY].value);
  assert.notEqual(firstFragment.view_id, secondFragment.view_id);
  assert.notEqual(firstFragment.context_epoch_id, secondFragment.context_epoch_id);
  assert.equal(secondFragment.content_projection_digest, firstFragment.content_projection_digest);
  assert.equal(secondFragment.projection_reuse_receipt.previous_context_epoch_id, firstFragment.context_epoch_id);
  assert.equal(secondFragment.projection_reuse_receipt.identity_retained, false);
  const current = instance.inspectState().current_context_epochs[0];
  assert.equal(current.projection_reused, true);
  assert.equal(current.freshness_state, "successor-current-reused-projection");
  const reasoningEvents = instance.ledger.snapshot().filter((event) => event.event_kind === "reasoning-dispatch-verified");
  assert.notEqual(reasoningEvents[0].reasoning_epoch_id, reasoningEvents[1].reasoning_epoch_id);
  assert.equal(reasoningEvents[1].exact_prefix_reuse, true);
  const envelopeEvents = instance.ledger.snapshot().filter((event) => event.event_kind === "context-envelope-created");
  assert.equal(envelopeEvents[0].projection_reuse_disposition, "assembled");
  assert.equal(envelopeEvents[1].projection_reuse_disposition, "reused-exact-content");
});

test("plan-bound reuse is derived from current selected dependencies", async () => {
  const planProfile = structuredClone(loaded.value);
  planProfile.turn_bindings.default = {...planProfile.turn_bindings.default, lane: "plan-bound", consumer_ref: "codex:stable-plan", window_ref: "plan:stable", purpose: "research-plan", request_id: "request:stable"};
  const instance = wrapper({loaded_profile: planProfile});
  const first = await instance.processClientMessage(turnStart(30, "Research current context management approaches."));
  const second = await instance.processClientMessage(turnStart(31, "Research current context management approaches."));
  const firstFragment = JSON.parse(first.to_server[0].params.additionalContext[CONTEXT_KEY].value);
  const secondFragment = JSON.parse(second.to_server[0].params.additionalContext[CONTEXT_KEY].value);
  assert.equal(secondFragment.refresh_disposition, "reuse-current");
  assert.equal(secondFragment.view_id, firstFragment.view_id);
  assert.equal(instance.ledger.snapshot().some((event) => event.event_kind === "context-refresh-assessed" && event.selected_change_count === 0), true);
});

test("selected source drift creates a successor and unrelated drift remains diagnostic", async () => {
  const planProfile = structuredClone(loaded.value);
  planProfile.turn_bindings.default = {...planProfile.turn_bindings.default, lane: "plan-bound", consumer_ref: "codex:drift-plan", window_ref: "plan:drift", purpose: "research-plan", request_id: "request:drift"};
  const initial = await loaded.context_source_provider();
  const selectedDrift = structuredClone(initial);
  selectedDrift.decision_profile = initial.decision_profile;
  selectedDrift.ontology_snapshot.nodes.find((node) => node.node_id === "agent-reasoning-engine.ContextBasisConstruction").source_digest = "selected-node-drift";
  selectedDrift.source_snapshot = selectedDrift.source_snapshot.map((source) => source.source_identity.includes("system-ontology") ? {...source, source_digest: "whole-source-drift"} : source);
  let calls = 0;
  const instance = wrapper({loaded_profile: planProfile, context_source_provider: () => calls++ === 0 ? initial : selectedDrift});
  const first = await instance.processClientMessage(turnStart(32, "Research current context management approaches."));
  const second = await instance.processClientMessage(turnStart(33, "Research current context management approaches."));
  const firstFragment = JSON.parse(first.to_server[0].params.additionalContext[CONTEXT_KEY].value);
  const secondFragment = JSON.parse(second.to_server[0].params.additionalContext[CONTEXT_KEY].value);
  assert.equal(secondFragment.refresh_disposition, "successor-required");
  assert.notEqual(secondFragment.view_id, firstFragment.view_id);
  const driftCache = instance.inspectState().cache_affinity_consumers[0];
  assert.equal(driftCache.context_bound_reuse_disposition, "successor-created");
  assert.equal(driftCache.exact_prefix_reuse, false);

  const unrelated = structuredClone(initial);
  unrelated.decision_profile = initial.decision_profile;
  unrelated.source_snapshot = [...unrelated.source_snapshot, {source_identity: "ambient:unselected", source_digest: "changed"}];
  calls = 0;
  const diagnostic = wrapper({loaded_profile: planProfile, context_source_provider: () => calls++ === 0 ? initial : unrelated});
  await diagnostic.processClientMessage(turnStart(34, "Research current context management approaches."));
  const reused = await diagnostic.processClientMessage(turnStart(35, "Research current context management approaches."));
  assert.equal(JSON.parse(reused.to_server[0].params.additionalContext[CONTEXT_KEY].value).refresh_disposition, "reuse-current");
  assert.equal(diagnostic.inspectState().cache_affinity_consumers[0].context_bound_reuse_disposition, "reuse-current");
  assert.equal(diagnostic.ledger.snapshot().some((event) => event.event_kind === "context-refresh-assessed" && event.unrelated_drift_count === 1), true);
});

test("missing or malformed live context sources block before forwarding", async () => {
  const missing = wrapper({context_source_provider: () => ({ok: false, reason_codes: ["config.source-unreadable"], residue: [{path: "missing.json"}]})});
  const missingResult = await missing.processClientMessage(turnStart(36, "Research current context management approaches."));
  assert.equal(missingResult.to_server.length, 0);
  assert.equal(missingResult.to_client[0].error.code, -32070);
  assert.deepEqual(missingResult.to_client[0].error.data.reason_codes, ["config.source-unreadable"]);
  const malformed = wrapper({context_source_provider: () => ({ok: false, reason_codes: ["config.source-json-invalid"]})});
  const malformedResult = await malformed.processClientMessage(turnStart(37, "Research current context management approaches."));
  assert.equal(malformedResult.to_server.length, 0);
  assert.deepEqual(malformedResult.to_client[0].error.data.reason_codes, ["config.source-json-invalid"]);
});

test("effect gate waits for independent client approval and binds the exact response", async () => {
  const instance = wrapper();
  const effect = {jsonrpc: "2.0", id: 80, method: "item/fileChange/requestApproval", params: {threadId: "thread-1", turnId: "turn-1", itemId: "item-1", startedAtMs: 1, reason: "edit"}};
  const requestResult = await instance.processServerMessage(effect);
  assert.equal(requestResult.to_server.length, 0);
  assert.equal(requestResult.to_client[0], effect);
  assert.equal(requestResult.to_client[1].params.directive_kind, "gate");
  const responseResult = await instance.processClientMessage({jsonrpc: "2.0", id: 80, result: {decision: "accept"}});
  assert.equal(responseResult.to_server.length, 1);
  assert.equal(responseResult.to_server[0].result.decision, "accept");
  const receipt = instance.ledger.receipt({thread_id: "thread-1", turn_id: "turn-1"});
  assert.equal(receipt.ordering.effect_decision_before_approval_response, true);
  assert.ok(receipt.event_digests.length >= 2);
  const evidence = instance.ledger.snapshot();
  const checkpoint = evidence.find((event) => event.event_kind === "reasoning-state-checkpoint" && event.checkpoint_kind === "before-effect");
  const approval = evidence.find((event) => event.event_kind === "approval-response-forwarded");
  assert.ok(checkpoint.checkpoint_digest);
  assert.equal(checkpoint.sequence < approval.sequence, true);
});

test("structurally blocked effect is denied without reaching the client approval surface", async () => {
  const instance = wrapper({effect_metadata_provider: () => ({route_id: "CA2-ROUTE-IMPLEMENT", effect_classes: ["persistent-mutation"], reversible: true, structurally_admissible: false, rejection_reasons: ["fixture.block"]})});
  const effect = {jsonrpc: "2.0", id: 81, method: "item/fileChange/requestApproval", params: {threadId: "thread-1", turnId: "turn-1", itemId: "item-2", startedAtMs: 1}};
  const result = await instance.processServerMessage(effect);
  assert.equal(result.to_server[0].result.decision, "decline");
  assert.equal(result.to_client.some((message) => message === effect), false);
});

test("an empty permission response is not treated as an effect approval", () => {
  assert.equal(approvalAccepted("item/permissions/requestApproval", {permissions: {}}), false);
  assert.equal(approvalAccepted("item/permissions/requestApproval", {permissions: {network: {enabled: true}}}), true);
});

test("interaction-bound continuation always gates even beside a safe plan", () => {
  const result = evaluateDualLaneContinuation({
    completion: {completion_id: "C1", status: "completed", continuation_required: true, evidence_refs: ["turn:C1"]},
    plan_bound: [{proposal_id: "P1", declared_plan_digest: "plan:1", action_ref: "validate", route_id: "CA2-ROUTE-VALIDATE", objective_kind: "validate", effect_classes: ["non-effectful-validate"], reversible: true, evidence_refs: ["plan:1"], next_turn: {params: {threadId: "thread-1", input: [{type: "text", text: "Validate this."}]}}}],
    interaction_bound: [{proposal_id: "I1", attributed_to: "human:user", proposal_text: "Maybe publish it.", evidence_refs: ["chat:1"]}],
  }, loaded.decision_profile);
  assert.equal(result.value.directive_kind, "gate");
  assert.deepEqual(result.value.reason_codes, ["continuation.interaction-bound-human-decision-required"]);
  assert.equal(result.selected_proposal, null);
});

test("sole safe plan proposal is preflighted and starts at most one successor", async () => {
  const instance = wrapper();
  const registration = await instance.processClientMessage({jsonrpc: "2.0", id: 90, method: "cyberalchemy/continuation/registerPlan", params: {threadId: "thread-1", proposal: {proposal_id: "P1", declared_plan_digest: "plan:1", action_ref: "validate", route_id: "CA2-ROUTE-VALIDATE", objective_kind: "validate", effect_classes: ["non-effectful-validate"], reversible: true, evidence_refs: ["plan:1"], next_turn: {params: {threadId: "thread-1", input: [{type: "text", text: "Validate the bounded result."}]}}}}});
  assert.equal(registration.to_client[0].result.registered, true);
  const result = await instance.processServerMessage(completed());
  assert.equal(result.to_server.length, 1);
  assert.equal(result.to_server[0].method, "turn/start");
  assert.equal(JSON.parse(result.to_server[0].params.additionalContext[CONTEXT_KEY].value).view_lane, "plan-bound");
  assert.equal(result.to_client.filter((message) => message.method === "cyberalchemy/successor").length, 1);
  const evidence = instance.ledger.snapshot();
  const checkpoint = evidence.find((event) => event.event_kind === "reasoning-state-checkpoint" && event.checkpoint_kind === "before-continuation");
  const successor = evidence.find((event) => event.event_kind === "successor-started");
  assert.ok(checkpoint.checkpoint_digest);
  assert.equal(checkpoint.sequence < successor.sequence, true);
});

test("multiple plan proposals gate and start no successor", async () => {
  const proposals = ["P1", "P2"].map((proposal_id) => ({proposal_id, declared_plan_digest: `plan:${proposal_id}`, action_ref: "validate", route_id: "CA2-ROUTE-VALIDATE", objective_kind: "validate", effect_classes: ["non-effectful-validate"], reversible: true, evidence_refs: [`plan:${proposal_id}`], next_turn: {params: {threadId: "thread-2", input: [{type: "text", text: "Validate this."}]}}}));
  const instance = wrapper({continuation_provider: () => ({plan_bound: proposals})});
  const result = await instance.processServerMessage(completed("thread-2", "turn-2"));
  assert.equal(result.to_server.length, 0);
  const directive = result.to_client.find((message) => message.method === "cyberalchemy/decision").params;
  assert.equal(directive.directive_kind, "gate");
  assert.deepEqual(directive.reason_codes, ["continuation.multiple-admissible"]);
});

test("completion with no continuation completes without starting a turn", async () => {
  const instance = wrapper();
  const result = await instance.processServerMessage(completed("thread-3", "turn-3"));
  assert.equal(result.to_server.length, 0);
  const directive = result.to_client.find((message) => message.method === "cyberalchemy/decision").params;
  assert.equal(directive.directive_kind, "complete");
});

test("default semantic configuration is a zero-call no-op at turn/completed", async () => {
  let calls = 0;
  const instance = wrapper({semantic_lifecycle: () => { calls += 1; throw new Error("must not run"); }});
  await startAndBind(instance, {id: 210, text: "Research current context management approaches.", threadId: "thread-semantic-off", turnId: "turn-semantic-off"});
  const result = await instance.processServerMessage(completed("thread-semantic-off", "turn-semantic-off"));
  assert.equal(calls, 0);
  assert.equal(result.to_client.some((message) => message.method === SEMANTIC_NOTIFICATION), false);
  assert.equal(instance.ledger.snapshot().some((event) => event.event_kind.startsWith("semantic-evaluation-")), false);
});

test("default evolution signal configuration is a zero-call no-op at turn/completed", async () => {
  let providerCalls = 0;
  let sinkCalls = 0;
  const instance = wrapper({
    evolution_signal_provider: () => { providerCalls += 1; return []; },
    evolution_signal_sink: () => { sinkCalls += 1; },
  });
  await startAndBind(instance, {id: 2101, text: "Explain the current context.", threadId: "thread-evolution-off", turnId: "turn-evolution-off"});
  await instance.processServerMessage(completed("thread-evolution-off", "turn-evolution-off"));
  assert.equal(providerCalls, 0);
  assert.equal(sinkCalls, 0);
  assert.equal(instance.ledger.snapshot().some((event) => event.event_kind === "evolution-signals-assessed"), false);
});

test("opt-in evolution signals emit immutable compact records exactly once per completion", async () => {
  const profile = structuredClone(loaded.value);
  profile.evolution_signals = {enabled: true, trigger: "turn/completed"};
  let providerCalls = 0;
  const emitted = [];
  const instance = wrapper({
    loaded_profile: profile,
    evolution_signal_provider: () => {
      providerCalls += 1;
      return [{kind: "context-precision-failure", scope: "context-precision", observed_value: 0.71, expected_value: 0.8, metric: "context_precision"}];
    },
    evolution_signal_sink: (signal) => { emitted.push(signal); return {ok: true}; },
  });
  await startAndBind(instance, {id: 2102, text: "Explain the current context.", threadId: "thread-evolution-on", turnId: "turn-evolution-on"});
  const completion = completed("thread-evolution-on", "turn-evolution-on");
  await instance.processServerMessage(completion);
  await instance.processServerMessage(completion);
  assert.equal(providerCalls, 1);
  assert.equal(emitted.length, 1);
  assert.equal(emitted[0].schema_version, "are.improvement-signal/v1");
  assert.match(emitted[0].source_result_ref, /^codex-turn-completed:[a-f0-9]{64}$/);
  const event = instance.ledger.snapshot().find((entry) => entry.event_kind === "evolution-signals-assessed");
  assert.equal(event.signal_disposition, "emitted");
  assert.equal(event.signal_count, 1);
  assert.equal(Object.hasOwn(event, "completion_message"), false);
  assert.equal(Object.hasOwn(event, "context_contents"), false);
});

test("the configured definition-readiness domain evaluates only when explicitly enabled", async () => {
  const profile = structuredClone(loaded.value);
  profile.semantic_evaluation = {enabled: true, trigger: "turn/completed"};
  const sourceRef = "are://definition-readiness/structural-observations";
  const value = {definition_present: true, canonical_source_bound: true, term_unambiguous: true, downstream_impact_declared: true, selected_source_drift: false};
  const sourceDigest = digestValue(value);
  const instance = wrapper({
    loaded_profile: profile,
    semantic_profile: loaded.semantic_profile,
    semantic_input_provider: () => ({
      owner_ref: "cyberalchemy-definition-owner@local",
      created_at: "2026-09-03T10:00:00.000Z",
      as_of: "2026-09-03T10:00:01.000Z",
      observation_sources: [{source_ref: sourceRef, value, digest: sourceDigest}],
      observation_candidates: Object.entries(value).map(([field, fieldValue], index) => ({schema_version: "are.observation-candidate/v1", candidate_id: `definition-ready:${index}`, field, value: fieldValue, issuer_ref: "cyberalchemy-definition-owner@local", source_ref: sourceRef, source_digest: sourceDigest, validator_ref: "definition-readiness-structural-validator@1", temporal_scope: {observed_at: "2026-09-03T10:00:01.000Z"}, proposed_posture: "admitted"})),
      challenge_state: {required_lanes: []},
    }),
  });
  const hint = {schema_version: "are.request-context-hint/v1", raw_request: "Define a bounded reasoning epoch.", objective_kind: "define"};
  await startAndBind(instance, {id: 6001, text: "Define a bounded reasoning epoch.", threadId: "thread-definition-ready", turnId: "turn-definition-ready", extras: {additionalContext: {[REQUEST_CONTEXT_KEY]: {kind: "application", value: JSON.stringify(hint)}}}});
  const result = await instance.processServerMessage(completed("thread-definition-ready", "turn-definition-ready"));
  const notification = result.to_client.find((message) => message.method === SEMANTIC_NOTIFICATION);
  assert.equal(notification.params.disposition, "evaluated");
  assert.equal(notification.params.semantic_outcome, "RecommendedUnderSnapshot");
});

test("opt-in turn/completed performs one context-bound semantic evaluation", async () => {
  const instance = semanticWrapper();
  await startAndBind(instance, {id: 211, text: "Research whether this refund is eligible.", threadId: "thread-semantic-on", turnId: "turn-semantic-on"});
  const result = await instance.processServerMessage(completed("thread-semantic-on", "turn-semantic-on"));
  const notification = result.to_client.find((message) => message.method === SEMANTIC_NOTIFICATION);
  assert.equal(notification.params.disposition, "evaluated", JSON.stringify(notification.params));
  assert.equal(notification.params.semantic_outcome, "RecommendedUnderSnapshot");
  assert.equal(notification.params.evaluator_calls, 1);
  assert.equal(typeof notification.params.semantic_materialization_id, "string");
  assert.equal(typeof notification.params.reasoning_receipt_digest, "string");
  assert.equal(typeof notification.params.reasoning_receipt_binding.runtime_journal_cut_digest, "string");
  assert.equal(Object.hasOwn(notification.params, "reasoning_receipt"), false);
  const semanticEvent = instance.ledger.snapshot().find((event) => event.event_kind === "semantic-evaluation-completed");
  assert.equal(semanticEvent.semantic_outcome, "RecommendedUnderSnapshot");
  assert.equal(Object.hasOwn(semanticEvent, "context_contents"), false);
  const receipt = instance.ledger.receipt({thread_id: "thread-semantic-on", turn_id: "turn-semantic-on"});
  assert.equal(receipt.ordering.semantic_evaluation_after_turn_completed, true);
  assert.equal(receipt.ordering.semantic_evaluation_before_continuation, true);
});

test("non-matching semantic domains are not-applicable with zero provider and evaluator calls", async () => {
  let providerCalls = 0;
  let lifecycleCalls = 0;
  const instance = semanticWrapper({
    semantic_input_provider: () => { providerCalls += 1; return semanticInput(); },
    semantic_lifecycle: (input) => { lifecycleCalls += 1; return composeSemanticLifecycle(input); },
  });
  await startAndBind(instance, {id: 212, text: "Explain this architecture.", threadId: "thread-semantic-na", turnId: "turn-semantic-na"});
  const result = await instance.processServerMessage(completed("thread-semantic-na", "turn-semantic-na"));
  const notification = result.to_client.find((message) => message.method === SEMANTIC_NOTIFICATION);
  assert.equal(notification.params.disposition, "not-applicable");
  assert.equal(notification.params.evaluator_calls, 0);
  assert.equal(providerCalls, 0);
  assert.equal(lifecycleCalls, 0);
});

test("enabled semantic completion blocks visibly when exact per-turn state is absent", async () => {
  const instance = semanticWrapper();
  const result = await instance.processServerMessage(completed("thread-state-missing", "turn-state-missing"));
  const notification = result.to_client.find((message) => message.method === SEMANTIC_NOTIFICATION);
  assert.equal(notification.params.disposition, "block");
  assert.deepEqual(notification.params.reason_codes, ["semantic.turn-state-missing"]);
  assert.equal(notification.params.evaluator_calls, 0);
  assert.equal(result.to_client.some((message) => message.method === "turn/completed"), true);
  assert.equal(result.to_client.find((message) => message.method === "cyberalchemy/decision").params.directive_kind, "complete");
});

test("semantic state binds exact turn identities and duplicate completion reuses the result", async () => {
  let lifecycleCalls = 0;
  const observed = [];
  const instance = semanticWrapper({
    semantic_input_provider: ({turn_state}) => { observed.push(`${turn_state.thread_id}:${turn_state.turn_id}:${turn_state.request_context.request_id}`); return semanticInput(); },
    semantic_lifecycle: (input) => { lifecycleCalls += 1; return composeSemanticLifecycle(input); },
  });
  await startAndBind(instance, {id: 213, text: "Research refund eligibility A.", threadId: "thread-A", turnId: "turn-A"});
  await startAndBind(instance, {id: 214, text: "Research refund eligibility B.", threadId: "thread-B", turnId: "turn-B"});
  await instance.processServerMessage(completed("thread-B", "turn-B"));
  await instance.processServerMessage(completed("thread-A", "turn-A"));
  await instance.processServerMessage(completed("thread-A", "turn-A"));
  assert.equal(lifecycleCalls, 2);
  assert.equal(observed.length, 2);
  assert.equal(observed[0].startsWith("thread-B:turn-B:"), true);
  assert.equal(observed[1].startsWith("thread-A:turn-A:"), true);
});

test("blocked semantic inputs remain non-authorizing and do not suppress continuation", async () => {
  const instance = semanticWrapper({semantic_input_provider: () => ({})});
  await startAndBind(instance, {id: 215, text: "Research whether this refund is eligible.", threadId: "thread-semantic-block", turnId: "turn-semantic-block"});
  const result = await instance.processServerMessage(completed("thread-semantic-block", "turn-semantic-block"));
  const semantic = result.to_client.find((message) => message.method === SEMANTIC_NOTIFICATION).params;
  assert.equal(semantic.disposition, "block");
  assert.equal(semantic.evaluator_calls, 0);
  assert.equal(semantic.authority_effect, "none");
  assert.equal(result.to_client.find((message) => message.method === "cyberalchemy/decision").params.directive_kind, "complete");
});

test("RecommendedUnderSnapshot is advisory and preserves ordinary consequence assessment", async () => {
  const proposal = planProposal("semantic-recommended", {required: true, binding_id: "semantic-domain:wrapper-refund-test@1"});
  const instance = semanticWrapper({continuation_provider: () => ({plan_bound: [proposal]})});
  await startAndBind(instance, {id: 216, text: "Research whether this refund is eligible.", threadId: "thread-semantic-recommended", turnId: "turn-semantic-recommended"});
  const result = await instance.processServerMessage(completed("thread-semantic-recommended", "turn-semantic-recommended"));
  const directive = result.to_client.find((message) => message.method === "cyberalchemy/decision").params;
  assert.equal(directive.directive_kind, "direct");
  assert.equal(directive.reasoning_receipt_constraints.disposition, "advisory");
  assert.deepEqual(directive.reasoning_receipt_constraints.reason_codes, ["continuation.semantic-recommendation-advisory-only"]);
  assert.equal(typeof directive.reasoning_receipt_constraints.reasoning_receipt_digest, "string");
  assert.equal(directive.authority_effect, "none");
  assert.equal(result.to_server.filter((message) => message.method === "turn/start").length, 1);
  const constraintEvent = instance.ledger.snapshot().find((event) => event.event_kind === "reasoning-receipt-constraints-derived");
  assert.equal(constraintEvent.constraint_disposition, "advisory");
  assert.equal(constraintEvent.constrained_proposal_count, 1);
  const receipt = instance.ledger.receipt({thread_id: "thread-semantic-recommended", turn_id: "turn-semantic-recommended"});
  assert.equal(receipt.ordering.reasoning_receipt_constraints_after_semantic_evaluation, true);
  assert.equal(receipt.ordering.reasoning_receipt_constraints_before_continuation, true);

  const consequential = semanticWrapper({continuation_provider: () => ({plan_bound: [planProposal("semantic-consequential", {required: true}, {effect_classes: ["persistent-mutation"]})]})});
  await startAndBind(consequential, {id: 217, text: "Research whether this refund is eligible.", threadId: "thread-semantic-consequential", turnId: "turn-semantic-consequential"});
  const gated = await consequential.processServerMessage(completed("thread-semantic-consequential", "turn-semantic-consequential"));
  assert.equal(gated.to_client.find((message) => message.method === "cyberalchemy/decision").params.directive_kind, "gate");
  assert.equal(gated.to_server.length, 0);
});

test("Deferred.Insufficient removes only the explicitly dependent proposal", async () => {
  const insufficientInput = semanticInput();
  insufficientInput.observation_candidates = insufficientInput.observation_candidates.filter((candidate) => candidate.field !== "receipt_present");
  const dependent = planProposal("semantic-insufficient", {required: true});
  const independent = planProposal("semantic-independent");
  const instance = semanticWrapper({
    semantic_input_provider: () => insufficientInput,
    continuation_provider: () => ({plan_bound: [dependent, independent]}),
  });
  await startAndBind(instance, {id: 218, text: "Research whether this refund is eligible.", threadId: "thread-semantic-insufficient", turnId: "turn-semantic-insufficient"});
  const result = await instance.processServerMessage(completed("thread-semantic-insufficient", "turn-semantic-insufficient"));
  const semantic = result.to_client.find((message) => message.method === SEMANTIC_NOTIFICATION).params;
  const directive = result.to_client.find((message) => message.method === "cyberalchemy/decision").params;
  assert.equal(semantic.semantic_outcome, "Deferred.Insufficient");
  assert.equal(directive.directive_kind, "direct");
  assert.equal(directive.selected_proposal_id, "semantic-independent");
  assert.equal(directive.reasoning_receipt_constraints.disposition, "block");
  assert.equal(directive.plan_bound.find((proposal) => proposal.proposal_id === "semantic-insufficient").semantic_dependency.required, true);
});

test("EscalateOwner forces a human gate for a dependent proposal", async () => {
  const ownerInput = semanticInput();
  ownerInput.challenge_state.material_disputes = [{dispute_id: "refund-policy-owner", status: "open"}];
  const instance = semanticWrapper({
    semantic_input_provider: () => ownerInput,
    continuation_provider: () => ({plan_bound: [planProposal("semantic-owner", {required: true})]}),
  });
  await startAndBind(instance, {id: 219, text: "Research whether this refund is eligible.", threadId: "thread-semantic-owner", turnId: "turn-semantic-owner"});
  const result = await instance.processServerMessage(completed("thread-semantic-owner", "turn-semantic-owner"));
  const directive = result.to_client.find((message) => message.method === "cyberalchemy/decision").params;
  assert.equal(result.to_client.find((message) => message.method === SEMANTIC_NOTIFICATION).params.semantic_outcome, "EscalateOwner");
  assert.equal(directive.directive_kind, "gate");
  assert.deepEqual(directive.reason_codes, ["continuation.semantic-owner-gate-required"]);
  assert.deepEqual(directive.owner_gate_refs, ["commerce-policy-owner@local"]);
  assert.equal(result.to_server.length, 0);

  const invalid = semanticWrapper({
    semantic_input_provider: () => ownerInput,
    continuation_provider: () => ({plan_bound: [planProposal("semantic-owner-invalid", {required: true}, {route_id: "CA2-ROUTE-NOT-REAL"})]}),
  });
  await startAndBind(invalid, {id: 223, text: "Research whether this refund is eligible.", threadId: "thread-semantic-owner-invalid", turnId: "turn-semantic-owner-invalid"});
  const invalidResult = await invalid.processServerMessage(completed("thread-semantic-owner-invalid", "turn-semantic-owner-invalid"));
  assert.equal(invalidResult.to_client.find((message) => message.method === "cyberalchemy/decision").params.directive_kind, "block");
});

test("disabled semantic evaluation remains a no-op for dependency-marked proposals", async () => {
  const instance = wrapper({continuation_provider: () => ({plan_bound: [planProposal("semantic-disabled", {required: true})]})});
  await startAndBind(instance, {id: 220, text: "Research current context management approaches.", threadId: "thread-semantic-disabled", turnId: "turn-semantic-disabled"});
  const result = await instance.processServerMessage(completed("thread-semantic-disabled", "turn-semantic-disabled"));
  const directive = result.to_client.find((message) => message.method === "cyberalchemy/decision").params;
  assert.equal(directive.directive_kind, "direct");
  assert.equal(directive.reasoning_receipt_constraints.disposition, "no-op");
  assert.equal(result.to_client.some((message) => message.method === SEMANTIC_NOTIFICATION), false);
});

test("semantic input providers cannot inject or replace the wrapper runtime journal", async () => {
  const injected = semanticInput();
  injected.runtime_journal = {journal_id: "provider-owned", events: []};
  const instance = semanticWrapper({
    semantic_input_provider: () => injected,
    continuation_provider: () => ({plan_bound: [planProposal("semantic-journal-injection", {required: true})]}),
  });
  await startAndBind(instance, {id: 224, text: "Research whether this refund is eligible.", threadId: "thread-journal-injection", turnId: "turn-journal-injection"});
  const result = await instance.processServerMessage(completed("thread-journal-injection", "turn-journal-injection"));
  const semantic = result.to_client.find((message) => message.method === SEMANTIC_NOTIFICATION).params;
  const directive = result.to_client.find((message) => message.method === "cyberalchemy/decision").params;
  assert.equal(semantic.disposition, "block");
  assert.deepEqual(semantic.reason_codes, ["semantic.runtime-journal-provider-injection-forbidden"]);
  assert.equal(directive.directive_kind, "block");
  assert.equal(result.to_server.length, 0);
});

test("duplicate completion replays one journaled decision and never starts a second successor", async () => {
  let lifecycleCalls = 0;
  const instance = semanticWrapper({
    semantic_lifecycle: (input) => { lifecycleCalls += 1; return composeSemanticLifecycle(input); },
    continuation_provider: () => ({plan_bound: [planProposal("semantic-once", {required: true})]}),
  });
  await startAndBind(instance, {id: 225, text: "Research whether this refund is eligible.", threadId: "thread-semantic-once", turnId: "turn-semantic-once"});
  const first = await instance.processServerMessage(completed("thread-semantic-once", "turn-semantic-once"));
  const second = await instance.processServerMessage(completed("thread-semantic-once", "turn-semantic-once"));
  assert.equal(lifecycleCalls, 1);
  assert.equal(first.to_server.filter((message) => message.method === "turn/start").length, 1);
  assert.equal(second.to_server.length, 0);
  assert.equal(second.to_client.some((message) => message.method === "cyberalchemy/successor" && message.params.kind === "replayed"), true);
  const cut = instance.ledger.cut({thread_id: "thread-semantic-once", turn_id: "turn-semantic-once"});
  const replay = instance.ledger.replay(cut.value);
  assert.equal(replay.value.semantic_evaluation_count, 1);
  assert.equal(replay.value.constraint_derivation_count, 1);
  assert.equal(replay.value.continuation_decision_count, 1);
  assert.equal(replay.value.successor_started_count, 1);
  assert.equal(replay.value.turn_closed, true);
  assert.equal(replay.value.external_calls, 0);
});

test("tampered or domain-mismatched receipt metadata fails closed for dependent proposals", async () => {
  const tampered = semanticWrapper({
    semantic_lifecycle: (input) => {
      const result = composeSemanticLifecycle(input);
      const reasoningReceipt = {...result.reasoning_receipt, terminal_outcome: "Deferred.Insufficient"};
      return {...result, reasoning_receipt: reasoningReceipt, reasoning_receipt_exact_bytes_digest: digestValue(reasoningReceipt)};
    },
    continuation_provider: () => ({plan_bound: [planProposal("semantic-tampered", {required: true})]}),
  });
  await startAndBind(tampered, {id: 221, text: "Research whether this refund is eligible.", threadId: "thread-semantic-tampered", turnId: "turn-semantic-tampered"});
  const tamperedResult = await tampered.processServerMessage(completed("thread-semantic-tampered", "turn-semantic-tampered"));
  const semantic = tamperedResult.to_client.find((message) => message.method === SEMANTIC_NOTIFICATION).params;
  const directive = tamperedResult.to_client.find((message) => message.method === "cyberalchemy/decision").params;
  assert.equal(semantic.disposition, "block");
  assert.equal(semantic.reason_codes.includes("semantic.reasoning-receipt-record-digest-invalid"), true);
  assert.equal(directive.directive_kind, "block");
  assert.equal(tamperedResult.to_server.length, 0);

  const mismatched = semanticWrapper({continuation_provider: () => ({plan_bound: [planProposal("semantic-domain-mismatch", {required: true, binding_id: "semantic-domain:other@1"})]})});
  await startAndBind(mismatched, {id: 222, text: "Research whether this refund is eligible.", threadId: "thread-semantic-mismatch", turnId: "turn-semantic-mismatch"});
  const mismatchResult = await mismatched.processServerMessage(completed("thread-semantic-mismatch", "turn-semantic-mismatch"));
  const mismatchDirective = mismatchResult.to_client.find((message) => message.method === "cyberalchemy/decision").params;
  assert.equal(mismatchDirective.directive_kind, "block");
  assert.deepEqual(mismatchDirective.reasoning_receipt_constraints.reason_codes, ["continuation.semantic-domain-mismatch"]);
});

test("fabricated constraint records are rejected by the continuation boundary", () => {
  const result = evaluateDualLaneContinuation({
    completion: {completion_id: "fabricated", status: "completed", continuation_required: true, evidence_refs: []},
    plan_bound: [planProposal("fabricated", {required: true})],
    interaction_bound: [],
    semantic_constraints: {schema_version: "are.reasoning-receipt-continuation-constraints/v1", proposal_constraints: []},
  }, loaded.decision_profile);
  assert.equal(result.ok, false);
  assert.deepEqual(result.reason_codes, ["continuation.semantic-constraints-unverified"]);
  assert.equal(deriveReasoningReceiptConstraints({plan_bound: []}).disposition, "no-dependent-proposals");
});

test("preflight and continuation evidence prove observable ordering", async () => {
  const instance = wrapper();
  await instance.processClientMessage(turnStart(100, "Explain the system.", "thread-4"));
  await instance.processServerMessage(completed("thread-4", "turn-4"));
  const receipt = instance.ledger.receipt({thread_id: "thread-4"});
  assert.equal(receipt.ordering.decision_completed_before_turn_start, true);
  assert.equal(receipt.ordering.continuation_decision_after_turn_completed, true);
  assert.equal(receipt.authority_effect, "none");
});

test("opt-in request intent reaches Codex and corrections create successor contracts", async () => {
  const profile = structuredClone(loaded.value);
  profile.intent_compilation = {enabled: true, trigger: "turn/start", control_profile: {visibility: "inspect", correction_retention: "current-interaction"}};
  const instance = wrapper({loaded_profile: profile});
  const first = await instance.processClientMessage(turnStart(2301, "Explain the homepage copywriting; start with a definition, then an example, then a deeper look.", "thread-intent"));
  const firstFragment = JSON.parse(first.to_server[0].params.additionalContext[INTENT_CONTEXT_KEY].value);
  assert.equal(firstFragment.intent_contract.construction_directives[0].posture, "structural");
  await instance.processServerMessage(turnResponse(2301, "turn-intent-1"));
  const second = await instance.processClientMessage(turnStart(2302, "Explain this correction: you were too literal; remove those labels and keep the natural narrative.", "thread-intent"));
  const secondFragment = JSON.parse(second.to_server[0].params.additionalContext[INTENT_CONTEXT_KEY].value);
  assert.equal(secondFragment.reflection.correction_kind, "misinterpretation");
  assert.equal(secondFragment.intent_contract.predecessor_contract_digest, firstFragment.intent_contract.intent_contract_digest);
  assert.equal(instance.inspectState().intent_contract_threads[0].intent_contract_digest, secondFragment.intent_contract.intent_contract_digest);
  const inspected = await instance.processClientMessage({jsonrpc: "2.0", id: 2303, method: "cyberalchemy/intent/project", params: {threadId: "thread-intent", mode: "control"}});
  assert.deepEqual(inspected.to_client[0].result.available_operations, ["correct-objective", "rebind-reference", "reject-assumption", "set-disposition"]);
  const controlled = await instance.processClientMessage({jsonrpc: "2.0", id: 2304, method: "cyberalchemy/intent/control", params: {threadId: "thread-intent", operation: {kind: "correct-objective", value: "Preserve a natural homepage narrative", user_selected: true}}});
  assert.equal(controlled.to_client[0].result.successor.objective, "Preserve a natural homepage narrative");
  assert.equal(controlled.to_client[0].result.receipt.user_selected, true);
});
