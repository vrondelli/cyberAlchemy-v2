import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
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
import {observeMarkedTurnInHostHistory} from "../src/host-turn-reconciliation.mjs";
import {bindApprovalResponse} from "../src/effect-boundary.mjs";

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

test("wrapper rejects alternate host execution and model-entry methods before backend dispatch", async () => {
  const instance = wrapper();
  for (const method of [
    "thread/shellCommand", "thread/rollback", "review/start", "command/exec", "process/spawn",
    "thread/compact", "thread/compact/start", "thread/queue/start", "thread/realtime/start", "turn/unknownStart",
  ]) {
    const message = {jsonrpc: "2.0", id: method, method, params: {threadId: "thread-alternate-ingress"}};
    const result = await instance.processClientMessage(message);
    assert.deepEqual(result.to_server, [], method);
    assert.equal(result.to_client[0]?.error?.code, -32081, method);
    assert.deepEqual(result.to_client[0]?.error?.data?.reason_codes, ["host.method-ungoverned"], method);
  }
  const notification = await instance.processClientMessage({jsonrpc: "2.0", method: "thread/shellCommand", params: {threadId: "thread-alternate-ingress"}});
  assert.deepEqual(notification, {to_server: [], to_client: []});
  for (const method of ["thread/read", "thread/resume", "turn/interrupt"]) {
    const message = {jsonrpc: "2.0", id: method, method, params: {threadId: "thread-alternate-ingress"}};
    assert.deepEqual((await instance.processClientMessage(message)).to_server, [message], method);
  }
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
  assert.equal(loaded.ontology_snapshot.nodes.length, 98);
  assert.equal(loaded.ontology_snapshot.nodes.some((node) => node.node_id === "agent-reasoning-engine.EvolutionCycle"), true);
  assert.equal(loaded.ontology_snapshot.nodes.some((node) => node.node_id === "agent-reasoning-engine.CacheAffinityProjection"), true);
  assert.equal(loaded.ontology_snapshot.edges.length, 123);
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
      {consumer_id: "codex:define-cli", lane: "interaction-bound", window_ref: null, request_id: null},
      {consumer_id: "codex:desktop-wsl", lane: "interaction-bound", window_ref: null, request_id: null},
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

test("repository context bindings cannot read outside the declared repository root", () => {
  const directory = mkdtempSync(resolve(packageRoot, ".tmp-path-confinement-"));
  temporaryPaths.push(directory);
  const profile = JSON.parse(readFileSync(resolve(packageRoot, "profiles/repository-v1.json"), "utf8"));
  profile.sources.canonical_definition_sources[0].path = "/etc/passwd";
  const path = resolve(directory, "profile.json");
  writeFileSync(path, JSON.stringify(profile));
  const result = loadRepositoryProfile(path, repositoryRoot);
  assert.equal(result.ok, false);
  assert.deepEqual(result.reason_codes, ["config.source-path-escape"]);
});

test("protocol binding accepts the observed binary and blocks version drift", () => {
  assert.equal(protocolBindingCheck(loaded.value.protocol_binding, "codex-cli 0.155.0-alpha.16.4").ok, true);
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
    field_postures: {objective_kind: "explicit"},
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
  const rawRequest = "Define the ontology already present in CyberAlchemy v2.";
  const hint = {schema_version: "are.request-context-hint/v1", raw_request: rawRequest, objective_kind: "define", field_postures: {objective_kind: "explicit"}};
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
  assert.equal(state.event_count, 5);
  assert.equal(state.epoch_count, 3);
  assert.equal(state.checkpoint_count, 3);
  assert.equal(state.durability, "process-memory");
  assert.equal(state.sink.record_count, 11);
  assert.equal(state.sink.flush_count, 3);
});

test("trusted plan context keeps the full obligation set in checkpointed model dispatch", async () => {
  const sourceRef = "plans:companion-whole-ui-fixture";
  const sourceDigest = createHash("sha256").update("full seven-feature plan").digest("hex");
  const ledger = createReasoningStateLedger({ledger_id: "reasoning:plan-context-wrapper"});
  let version = 1;
  const provider = ({thread_ref, previous_plan_context_digest}) => ({
    input: {
      thread_ref,
      parent_plan_ref: sourceRef,
      parent_plan_digest: sourceDigest,
      feature_obligations: [
        {obligation_id: "overview", summary: "Show independent product health", status: version === 1 ? "open" : "completed"},
        {obligation_id: "adapters", summary: "Show selected adapter path", status: "open"},
        {obligation_id: "threads", summary: "Show explicit Reasoning State", status: "open"},
        {obligation_id: "decisions", summary: "Show scoped gateway decisions", status: "open"},
        {obligation_id: "evolution", summary: "Show verified cycle evidence", status: "open"},
        {obligation_id: "evidence", summary: "Separate source postures", status: "open"},
        {obligation_id: "appearance", summary: "Persist local skin and placement", status: "open"},
      ],
      active_slice_id: version === 1 ? "overview" : "evolution",
      unresolved_decisions: [{decision_id: "host-handover", question: "Can this desktop task be exclusively handed to ARE?"}],
      source_refs: [{source_ref: sourceRef, source_digest: sourceDigest}],
      previous_plan_context_digest: version === 1 ? null : previous_plan_context_digest,
    },
    source_digests: {[sourceRef]: sourceDigest},
  });
  const instance = wrapper({reasoning_ledger: ledger, plan_context_provider: provider});
  const first = await instance.processClientMessage(turnStart(1003, "Continue the whole UI plan.", "thread-plan-context"));
  assert.equal(first.to_server.length, 1);
  const initial = ledger.snapshot().filter(event => event.event_kind === "plan-context-recorded");
  assert.equal(initial.length, 1);
  assert.equal(initial[0].content.feature_obligations.length, 7);
  assert.equal(first.to_server[0].params.additionalContext[CACHE_AFFINITY_KEY].value.includes("host-handover"), true);
  assert.equal(instance.ledger.snapshot().find(event => event.event_kind === "reasoning-dispatch-verified").plan_context_digest, initial[0].content.plan_context_digest);
  assert.equal(instance.inspectState().reasoning_state.checkpoint_count, 3);
  const firstObservation = instance.observeReasoningThreads();
  assert.equal(firstObservation.length, 1);
  assert.equal(firstObservation[0].plan_obligation_count, 7);
  assert.equal(firstObservation[0].plan_completed_count, 0);
  assert.equal(firstObservation[0].plan_open_decision_count, 1);
  assert.doesNotMatch(JSON.stringify(firstObservation), /host-handover|Show independent/);

  const repeated = await instance.processClientMessage(turnStart(1004, "Continue the same plan.", "thread-plan-context"));
  assert.equal(repeated.to_server.length, 1);
  assert.equal(ledger.snapshot().filter(event => event.event_kind === "plan-context-recorded").length, 1);
  version = 2;
  const successor = await instance.processClientMessage(turnStart(1005, "Research current context management approaches.", "thread-plan-context"));
  assert.equal(successor.to_server.length, 1);
  const contexts = ledger.snapshot().filter(event => event.event_kind === "plan-context-recorded");
  assert.equal(contexts.length, 2);
  assert.equal(contexts[1].content.previous_plan_context_digest, contexts[0].content.plan_context_digest);
  assert.equal(contexts[1].content.active_slice_id, "evolution");
  const successorObservation = instance.observeReasoningThreads();
  assert.equal(successorObservation[0].plan_context_digest, contexts[1].content.plan_context_digest);
  assert.equal(successorObservation[0].plan_completed_count, 1);
});

test("wrapper rejects forged, unverified, or stale plan context before forwarding", async () => {
  const sourceRef = "plans:fixture";
  const sourceDigest = createHash("sha256").update("plan").digest("hex");
  const input = {
    thread_ref: "wrong-thread", parent_plan_ref: sourceRef, parent_plan_digest: sourceDigest,
    feature_obligations: [{obligation_id: "scope", summary: "Preserve scope", status: "active"}], active_slice_id: "scope",
    unresolved_decisions: [], source_refs: [{source_ref: sourceRef, source_digest: sourceDigest}], previous_plan_context_digest: null,
  };
  for (const [name, supplied, code] of [
    ["forged", {input, source_digests: {[sourceRef]: sourceDigest}}, "reasoning.plan-context-thread-mismatch"],
    ["unverified", {input: {...input, thread_ref: "thread-plan-negative"}, source_digests: {[sourceRef]: "0".repeat(64)}}, "reasoning.plan-context-source-unverified"],
  ]) {
    const result = await wrapper({plan_context_provider: () => supplied}).processClientMessage(turnStart(1006, "Research current context management approaches.", "thread-plan-negative"));
    assert.equal(result.to_server.length, 0);
    assert.equal(result.to_client[0].error.data.reason_codes.includes(code), true);
  }
  const ledger = createReasoningStateLedger({ledger_id: "reasoning:plan-context-stale"});
  let changed = false;
  const instance = wrapper({reasoning_ledger: ledger, plan_context_provider: ({thread_ref}) => ({
    input: {...input, thread_ref, feature_obligations: [{obligation_id: "scope", summary: changed ? "Changed scope" : "Preserve scope", status: "active"}]},
    source_digests: {[sourceRef]: sourceDigest},
  })});
  assert.equal((await instance.processClientMessage(turnStart(1007, "Research current context management approaches.", "thread-plan-stale"))).to_server.length, 1);
  changed = true;
  const stale = await instance.processClientMessage(turnStart(1008, "Research current context management approaches.", "thread-plan-stale"));
  assert.equal(stale.to_server.length, 0);
  assert.equal(stale.to_client[0].error.data.reason_codes.includes("reasoning.plan-context-stale-predecessor"), true);
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
  assert.equal(state.reasoning_state.checkpoint_count, 5);
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
  const decision = records.find((record) => record.value.event_kind === "decision-observation-recorded");
  const dispatch = records.find((record) => record.value.event_kind === "dispatch-materialized");
  const dispatchCheckpoint = records.find((record) => record.value.checkpoint_kind === "before-model-request"
    && record.value.subject_digest === dispatch?.value.content.dispatch.dispatch_digest);
  const semanticState = records.find((record) => record.value.event_kind === "semantic-turn-state-prepared");
  const semanticCheckpoint = records.find((record) => record.value.checkpoint_kind === "before-model-request"
    && record.value.subject_digest === semanticState?.value.content.state_digest);
  assert.ok(decision && dispatch && dispatchCheckpoint && semanticState && semanticCheckpoint);
  assert.ok(dispatch.value.content.verification_digest);
  assert.ok(records.indexOf(decision) < records.indexOf(dispatch));
  assert.ok(records.indexOf(dispatch) < records.indexOf(dispatchCheckpoint));
  assert.ok(records.indexOf(semanticState) < records.indexOf(semanticCheckpoint));
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
  assert.equal(instance.inspectState().reasoning_state.event_count, 6);
  instance.close();
  const verified = verifyReasoningStateLog(logPath, {expected_ledger_id: loaded.value.reasoning_state.ledger_id});
  assert.equal(verified.ok, true);
  assert.equal(verified.value.index.checkpoint_count, 4);
});

test("file-backed wrapper restores a bound semantic turn across restart", async () => {
  const directory = mkdtempSync("/tmp/are-wrapper-semantic-turn-recovery-");
  temporaryPaths.push(directory);
  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync", log_path: resolve(directory, "reasoning-state.jsonl")};
  profile.semantic_evaluation = {enabled: true, trigger: "turn/completed"};
  const create = () => wrapper({loaded_profile: profile, semantic_profile: semanticProfile.value,
    semantic_input_provider: () => semanticInput()});
  const first = create();
  await startAndBind(first, {id: 10044, text: "Research whether this refund is eligible.", threadId: "thread-semantic-restart", turnId: "turn-semantic-restart"});
  assert.deepEqual(first.inspectState().active_semantic_turn_ids, ["turn-semantic-restart"]);
  assert.equal(first.close().ok, true);

  const second = create();
  assert.deepEqual(second.inspectState().active_semantic_turn_ids, ["turn-semantic-restart"]);
  assert.equal(second.observeReasoningThreads()[0].phase, "recovery-unverified",
    "A recovered binding is not a current host-active observation.");
  assert.deepEqual(second.inspectState().pending_semantic_rpc_ids, []);
  const recoveredBinding = second.ledger.snapshot().find((event) => event.event_kind === "turn-state-bound");
  assert.equal(recoveredBinding.direction, "reasoning-state-recovery");
  assert.match(recoveredBinding.binding_digest, /^[a-f0-9]{64}$/);
  assert.doesNotMatch(JSON.stringify(second.ledger.snapshot()), /Research whether this refund is eligible/);
  const conflicting = await second.processClientMessage(turnStart(10046, "Follow up on the refund.", "thread-semantic-restart"));
  assert.equal(conflicting.to_server.length, 0, "An unresolved prior turn must not admit another host turn.");
  assert.deepEqual(conflicting.to_client[0].error.data.reason_codes, ["reasoning.prior-turn-unsettled"]);
  const staleSteer = await second.processClientMessage({jsonrpc: "2.0", id: 10047, method: "turn/steer",
    params: {threadId: "thread-semantic-restart", expectedTurnId: "turn-semantic-restart",
      input: [{type: "text", text: "Continue the old turn."}]}});
  assert.equal(staleSteer.to_server.length, 0, "A recovered turn cannot be steered before host reconciliation.");
  assert.deepEqual(staleSteer.to_client[0].error.data.reason_codes, ["reasoning.recovery-unverified"]);
  const completedTurn = await second.processServerMessage(completed("thread-semantic-restart", "turn-semantic-restart"));
  const semantic = completedTurn.to_client.find((message) => message.method === SEMANTIC_NOTIFICATION);
  assert.equal(semantic.params.disposition, "evaluated", JSON.stringify(semantic.params));
  assert.equal(semantic.params.semantic_outcome, "RecommendedUnderSnapshot");
  assert.deepEqual(second.inspectState().active_semantic_turn_ids, []);
  assert.equal(second.observeReasoningThreads()[0].phase, "turn-completed");
  const followUp = await second.processClientMessage(turnStart(10048, "Research whether this refund is eligible.", "thread-semantic-restart"));
  assert.equal(followUp.to_server.length, 1,
    `A real completion notification releases the thread for the next turn: ${JSON.stringify(followUp.to_client)}`);
  assert.equal(second.close().ok, true);
});

for (const hostStatus of ["interrupted", "completed"]) test(`verified ${hostStatus} host history checkpoints a recovered terminal turn without semantic completion`, async () => {
  const directory = mkdtempSync("/tmp/are-wrapper-terminal-recovery-");
  temporaryPaths.push(directory);
  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync", log_path: resolve(directory, "reasoning-state.jsonl")};
  profile.semantic_evaluation = {enabled: true, trigger: "turn/completed"};
  const create = () => wrapper({loaded_profile: profile, semantic_profile: semanticProfile.value,
    semantic_input_provider: () => semanticInput()});
  const threadId = "thread-terminal-recovery", turnId = "turn-terminal-recovery", requestKey = "request-terminal-recovery";
  const first = create();
  await startAndBind(first, {id: 10049, text: "Research the bounded case.", threadId, turnId});
  first.close();
  const second = create();
  const bindingDigest = digestValue("exact forwarded request");
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  const request = {method: "turn/start", status: "complete", request_key: requestKey,
    binding_digest: bindingDigest, thread_ref: threadRef};
  const acceptance = {kind: "turn-start-accepted", thread_ref: threadRef, turn_ref: digestValue(turnId),
    request_key_digest: digestValue(requestKey), request_digest: bindingDigest};
  const response = {result: {thread: {id: threadId, turns: [{id: turnId, status: hostStatus}]}}};
  assert.equal(second.reconcileRecoveredTerminalTurn({request, acceptance, response: {result: {thread: {id: threadId,
    turns: [{id: turnId, status: "inProgress"}]}}}, thread_id: threadId, turn_id: turnId}).ok, false);
  assert.equal(second.observeReasoningThreads()[0].phase, "recovery-unverified");
  const settled = second.reconcileRecoveredTerminalTurn({request, acceptance, response, thread_id: threadId, turn_id: turnId});
  assert.equal(settled.ok, true, JSON.stringify(settled));
  assert.equal(settled.disposition, "reconciled-terminal");
  assert.equal(second.observeReasoningThreads()[0].phase, "recovery-terminal");
  assert.equal(second.observeReasoningThreads()[0].latest_frontier_digest, null);
  assert.deepEqual(second.inspectState().semantic_completion_turn_ids, []);
  assert.deepEqual(second.inspectState().evolution_signal_turn_ids, []);
  assert.deepEqual(second.inspectState().active_semantic_turn_ids, []);
  assert.equal(second.reconcileRecoveredTerminalTurn({request, acceptance, response, thread_id: threadId, turn_id: turnId}).disposition,
    "already-reconciled");
  assert.equal(second.ledger.snapshot().filter((event) => event.event_kind === "recovered-turn-terminal-reconciled").length, 1);
  const late = await second.processServerMessage(completed(threadId, turnId));
  assert.equal(late.to_client.some((message) => message.method === SEMANTIC_NOTIFICATION), false);
  assert.equal(second.observeReasoningThreads()[0].latest_frontier_digest, null);
  second.close();
  const third = create();
  assert.equal(third.observeReasoningThreads()[0].phase, "recovery-terminal");
  assert.deepEqual(third.inspectState().completion_frontier_turn_ids, []);
  const next = await third.processClientMessage(turnStart(10050, "Research whether this refund is eligible.", threadId));
  assert.equal(next.to_server.length, 1, JSON.stringify(next.to_client));
  third.close();
});

for (const previouslyBound of [false, true]) test(`marked unknown dispatch reconciles exact ${previouslyBound ? "bound" : "pending"} semantic state without completion`, async () => {
  const directory = mkdtempSync("/tmp/are-wrapper-marker-recovery-");
  temporaryPaths.push(directory);
  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync",
    log_path: resolve(directory, "reasoning-state.jsonl")};
  profile.semantic_evaluation = {enabled: true, trigger: "turn/completed"};
  const create = () => wrapper({loaded_profile: profile, semantic_profile: semanticProfile.value,
    semantic_input_provider: () => semanticInput()});
  const threadId = "thread-marker-recovery", turnId = "turn-marker-recovery";
  const marker = `are-gateway-client:${"a".repeat(32)}`;
  const input = turnStart(10051, "Research the bounded case.", threadId);
  const first = create();
  assert.equal((await first.processClientMessage(input)).to_server.length, 1);
  if (previouslyBound) await first.processServerMessage(turnResponse(input.id, turnId));
  first.close();
  const second = create();
  const bindingDigest = digestValue({method: input.method, params: input.params});
  const request = {method: "turn/start", status: "outcome-unknown", request_key: "request-marker-recovery",
    binding_digest: bindingDigest, thread_ref: `backend-thread:${digestValue(threadId)}`,
    client_message_id: marker};
  const response = {result: {thread: {id: threadId, turns: [{id: turnId, status: "completed",
    items: [{type: "userMessage", clientId: marker}]}]}}};
  const markerObservation = observeMarkedTurnInHostHistory({request, response}).observation;
  assert.equal(second.reconcileRecoveredTerminalTurn({request, marker_observation: {...markerObservation,
    observation_digest: "0".repeat(64)}, response, thread_id: threadId, turn_id: turnId}).ok, false);
  const wrongRequest = {...request, binding_digest: "f".repeat(64)};
  assert.deepEqual(second.reconcileRecoveredTerminalTurn({request: wrongRequest,
    marker_observation: observeMarkedTurnInHostHistory({request: wrongRequest, response}).observation,
    response, thread_id: threadId, turn_id: turnId}).reason_codes,
  [previouslyBound ? "reasoning.recovery-marker-state-mismatch" : "reasoning.recovery-marker-state-unbound"]);
  const settled = second.reconcileRecoveredTerminalTurn({request, marker_observation: markerObservation,
    response, thread_id: threadId, turn_id: turnId});
  assert.equal(settled.ok, true, JSON.stringify(settled));
  assert.equal(settled.disposition, "reconciled-terminal");
  assert.equal(second.observeReasoningThreads()[0].phase, "recovery-terminal");
  assert.deepEqual(second.inspectState().pending_semantic_rpc_ids, []);
  assert.deepEqual(second.inspectState().semantic_completion_turn_ids, []);
  assert.deepEqual(second.inspectState().evolution_signal_turn_ids, []);
  assert.equal(second.reconcileRecoveredTerminalTurn({request, marker_observation: markerObservation,
    response, thread_id: threadId, turn_id: turnId}).disposition, "already-reconciled");
  second.close();
  const third = create();
  assert.equal(third.observeReasoningThreads()[0].phase, "recovery-terminal");
  assert.deepEqual(third.inspectState().completion_frontier_turn_ids, []);
  third.close();
});

test("marked unknown dispatch accepts an exactly bound completion already checkpointed before restart", async () => {
  const directory = mkdtempSync("/tmp/are-wrapper-marker-completed-");
  temporaryPaths.push(directory);
  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync",
    log_path: resolve(directory, "reasoning-state.jsonl")};
  const create = () => wrapper({loaded_profile: profile});
  const threadId = "thread-marker-completed", turnId = "turn-marker-completed";
  const marker = `are-gateway-client:${"b".repeat(32)}`;
  const input = turnStart(10052, "Research the bounded case.", threadId);
  const first = create();
  assert.equal((await first.processClientMessage(input)).to_server.length, 1);
  await first.processServerMessage(turnResponse(input.id, turnId));
  await first.processServerMessage(completed(threadId, turnId));
  assert.equal(first.observeReasoningThreads()[0].phase, "turn-completed");
  first.close();
  const second = create();
  const request = {method: "turn/start", status: "outcome-unknown", request_key: "request-marker-completed",
    binding_digest: digestValue({method: input.method, params: input.params}),
    thread_ref: `backend-thread:${digestValue(threadId)}`, client_message_id: marker};
  const response = {result: {thread: {id: threadId, turns: [{id: turnId, status: "completed",
    items: [{type: "userMessage", clientId: marker}]}]}}};
  const observation = observeMarkedTurnInHostHistory({request, response}).observation;
  assert.equal(second.reconcileRecoveredTerminalTurn({request, marker_observation: observation,
    response, thread_id: threadId, turn_id: turnId}).disposition, "already-completed");
  const conflictingResponse = {result: {thread: {id: threadId,
    turns: [{id: turnId, status: "failed", items: [{type: "userMessage", clientId: marker}]}]}}};
  const conflictingObservation = observeMarkedTurnInHostHistory({request, response: conflictingResponse}).observation;
  assert.equal(second.reconcileRecoveredTerminalTurn({request, marker_observation: conflictingObservation,
    response: conflictingResponse, thread_id: threadId, turn_id: turnId}).ok, false);
  const wrongRequest = {...request, binding_digest: "f".repeat(64)};
  assert.deepEqual(second.reconcileRecoveredTerminalTurn({request: wrongRequest,
    marker_observation: observeMarkedTurnInHostHistory({request: wrongRequest, response}).observation,
    response, thread_id: threadId, turn_id: turnId}).reason_codes,
  ["reasoning.recovery-marker-state-unbound"]);
  assert.equal(second.observeReasoningThreads()[0].phase, "turn-completed");
  second.close();
});

test("gateway marker checkpoint binds the original request through a completed restart", async () => {
  const directory = mkdtempSync("/tmp/are-wrapper-gateway-marker-binding-");
  temporaryPaths.push(directory);
  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync",
    log_path: resolve(directory, "reasoning-state.jsonl")};
  const create = () => wrapper({loaded_profile: profile});
  const threadId = "thread-gateway-marker-binding", turnId = "turn-gateway-marker-binding";
  const marker = `are-gateway-client:${"c".repeat(32)}`;
  const input = turnStart(10053, "Research the bounded case.", threadId);
  const marked = {...input, params: {...input.params, clientUserMessageId: marker}};
  const bindingDigest = digestValue({method: input.method, params: input.params});
  const first = create();
  const rejected = await first.processClientMessage(marked,
    {gateway_request_binding_digest: "f".repeat(64)});
  assert.deepEqual(rejected.to_server, []);
  assert.deepEqual(rejected.to_client[0].error.data.reason_codes,
    ["semantic.gateway-request-binding-mismatch"]);
  assert.deepEqual(first.inspectState().pending_semantic_rpc_ids, []);
  const accepted = await first.processClientMessage(marked,
    {gateway_request_binding_digest: bindingDigest});
  assert.equal(accepted.to_server.length, 1);
  await first.processServerMessage(turnResponse(input.id, turnId));
  await first.processServerMessage(completed(threadId, turnId));
  first.close();

  const second = create();
  const request = {method: "turn/start", status: "outcome-unknown", request_key: "request-gateway-marker-binding",
    binding_digest: bindingDigest, thread_ref: `backend-thread:${digestValue(threadId)}`,
    client_message_id: marker};
  const response = {result: {thread: {id: threadId, turns: [{id: turnId, status: "completed",
    items: [{type: "userMessage", clientId: marker}]}]}}};
  const observation = observeMarkedTurnInHostHistory({request, response}).observation;
  const reconciled = second.reconcileRecoveredTerminalTurn({request, marker_observation: observation,
    response, thread_id: threadId, turn_id: turnId});
  assert.equal(reconciled.ok, true, JSON.stringify(reconciled));
  assert.equal(reconciled.disposition, "already-completed");
  second.close();
});

test("file-backed wrapper checkpoints a rejected turn start and does not recover it as pending", async () => {
  const directory = mkdtempSync("/tmp/are-wrapper-semantic-turn-rejected-");
  temporaryPaths.push(directory);
  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync", log_path: resolve(directory, "reasoning-state.jsonl")};
  const create = () => wrapper({loaded_profile: profile});
  const first = create();
  const started = await first.processClientMessage(turnStart(10045, "Research refund eligibility.", "thread-semantic-rejected"));
  assert.equal(started.to_server.length, 1);
  assert.deepEqual(first.inspectState().pending_semantic_rpc_ids, ["10045"]);
  const rejection = {jsonrpc: "2.0", id: 10045, error: {code: -32602, message: "Rejected by host"}};
  assert.deepEqual((await first.processServerMessage(rejection)).to_client, [rejection]);
  assert.deepEqual(first.inspectState().pending_semantic_rpc_ids, []);
  assert.equal(first.close().ok, true);
  const second = create();
  assert.deepEqual(second.inspectState().pending_semantic_rpc_ids, []);
  assert.deepEqual(second.inspectState().active_semantic_turn_ids, []);
  assert.equal(second.close().ok, true);
});

test("file-backed plan context survives wrapper restart and rejects a concurrent writer", async () => {
  const directory = mkdtempSync("/tmp/are-wrapper-plan-recovery-");
  temporaryPaths.push(directory);
  const logPath = resolve(directory, "reasoning-state.jsonl");
  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync", log_path: logPath, single_writer: true};
  const sourceRef = "plans:restart-fixture";
  const sourceDigest = createHash("sha256").update("restart-bound plan").digest("hex");
  let version = 1;
  const provider = ({thread_ref, previous_plan_context_digest}) => ({
    input: {
      thread_ref,
      parent_plan_ref: sourceRef,
      parent_plan_digest: sourceDigest,
      feature_obligations: [
        {obligation_id: "one", summary: "Preserve first obligation", status: version === 1 ? "active" : "completed"},
        {obligation_id: "two", summary: "Preserve next obligation", status: version === 1 ? "open" : "active"},
      ],
      active_slice_id: version === 1 ? "one" : "two",
      unresolved_decisions: [],
      source_refs: [{source_ref: sourceRef, source_digest: sourceDigest}],
      previous_plan_context_digest,
    },
    source_digests: {[sourceRef]: sourceDigest},
  });
  const first = wrapper({loaded_profile: profile, plan_context_provider: provider});
  assert.equal((await first.processClientMessage(turnStart(10045, "Research the first obligation.", "thread-plan-restart"))).to_server.length, 1);
  const firstPlanDigest = first.observeReasoningThreads()[0].plan_context_digest;
  assert.equal(first.observeReasoningThreads()[0].plan_completed_count, 0);
  assert.throws(() => wrapper({loaded_profile: profile, plan_context_provider: provider}), /reasoning\.writer-lock-held/);
  first.close();

  version = 2;
  const second = wrapper({loaded_profile: profile, plan_context_provider: provider});
  assert.equal(second.inspectState().reasoning_state.recovery.disposition, "recovered");
  assert.equal((await second.processClientMessage(turnStart(10046, "Research the second obligation.", "thread-plan-restart"))).to_server.length, 1);
  const secondObservation = second.observeReasoningThreads()[0];
  assert.equal(secondObservation.plan_obligation_count, 2);
  assert.equal(secondObservation.plan_completed_count, 1);
  assert.notEqual(secondObservation.plan_context_digest, firstPlanDigest);
  assert.doesNotMatch(JSON.stringify(secondObservation), /Preserve first|Preserve next|restart-fixture/);
  second.close();
  assert.equal(verifyReasoningStateLog(logPath, {expected_ledger_id: profile.reasoning_state.ledger_id}).ok, true);
});

test("file-backed wrapper opens after a terminated Reasoning State lock owner", async () => {
  const directory = mkdtempSync("/tmp/are-wrapper-crash-lock-");
  temporaryPaths.push(directory);
  const logPath = resolve(directory, "reasoning-state.jsonl");
  const moduleUrl = new URL("../../reasoning-state-runtime/index.mjs", import.meta.url).href;
  const script = `const {acquireReasoningStateWriterLock} = await import(${JSON.stringify(moduleUrl)}); const result = acquireReasoningStateWriterLock({path: ${JSON.stringify(logPath)}}); if (!result.ok) throw new Error(JSON.stringify(result.reason_codes));`;
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", script], {encoding: "utf8"});
  assert.equal(child.status, 0, child.stderr);
  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync", log_path: logPath, single_writer: true};
  const instance = wrapper({loaded_profile: profile});
  const result = await instance.processClientMessage(turnStart(10047, "Research state recovery after the terminated writer.", "thread-crash-lock"));
  assert.equal(result.to_server.length, 1, JSON.stringify(result.to_client));
  instance.close();
  assert.equal(verifyReasoningStateLog(logPath, {expected_ledger_id: profile.reasoning_state.ledger_id}).ok, true);
});

test("steer admission commits a successor plan only after host acceptance and preserves it across compaction and restart", async () => {
  const directory = mkdtempSync("/tmp/are-wrapper-steer-plan-");
  temporaryPaths.push(directory);
  const logPath = resolve(directory, "reasoning-state.jsonl");
  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync", log_path: logPath, single_writer: true};
  const sourceRef = "plans:steer-fixture";
  const sourceDigest = createHash("sha256").update("steering plan source").digest("hex");
  let version = 1;
  const seenPredecessors = [];
  const provider = ({thread_ref, previous_plan_context_digest}) => {
    seenPredecessors.push(previous_plan_context_digest);
    return {input: {thread_ref, parent_plan_ref: sourceRef, parent_plan_digest: sourceDigest,
      feature_obligations: [{obligation_id: "first", summary: "Keep the first obligation", status: version === 1 ? "active" : "completed"},
        {obligation_id: "second", summary: "Keep the second obligation", status: version === 1 ? "open" : "active"}],
      active_slice_id: version === 1 ? "first" : "second", unresolved_decisions: [],
      source_refs: [{source_ref: sourceRef, source_digest: sourceDigest}], previous_plan_context_digest},
    source_digests: {[sourceRef]: sourceDigest}};
  };
  const first = wrapper({loaded_profile: profile, plan_context_provider: provider});
  assert.equal((await first.processClientMessage(turnStart(10048, "Research the first obligation.", "thread-steer-plan"))).to_server.length, 1);
  assert.equal((await first.processServerMessage({jsonrpc: "2.0", id: 10048, result: {turn: {id: "turn-steer-plan"}}})).to_client.length, 1);
  const originalDigest = first.observeReasoningThreads()[0].plan_context_digest;
  const dispatchedContext = first.inspectState().current_context_epochs;
  version = 2;
  const steer = {jsonrpc: "2.0", id: 10049, method: "turn/steer", params: {threadId: "thread-steer-plan", expectedTurnId: "turn-steer-plan", input: [{type: "text", text: "Research the second obligation now."}]}};
  const admitted = await first.processClientMessage(steer);
  assert.deepEqual(admitted.to_server, [steer]);
  assert.equal(first.observeReasoningThreads()[0].plan_context_digest, originalDigest);
  assert.deepEqual(first.inspectState().pending_steer_rpc_ids, ["10049"]);
  const accepted = await first.processServerMessage({jsonrpc: "2.0", id: 10049, result: {turnId: "turn-steer-plan"}});
  assert.equal(accepted.to_client[0].result.turnId, "turn-steer-plan");
  const successor = first.observeReasoningThreads()[0];
  assert.equal(successor.plan_completed_count, 1);
  assert.notEqual(successor.plan_context_digest, originalDigest);
  assert.deepEqual(first.inspectState().current_context_epochs, dispatchedContext,
    "Steer admission context was assessed but was not injected into the host turn.");
  assert.deepEqual(first.inspectState().pending_steer_rpc_ids, []);
  const compaction = {jsonrpc: "2.0", method: "item/completed", params: {threadId: "thread-steer-plan", turnId: "turn-steer-plan",
    item: {type: "contextCompaction", id: "compact-steer-plan", status: "completed"}}};
  assert.deepEqual((await first.processServerMessage(compaction)).to_client, [compaction]);
  assert.equal(first.observeReasoningThreads()[0].plan_context_digest, successor.plan_context_digest);
  await first.processServerMessage(completed("thread-steer-plan", "turn-steer-plan"));
  first.close();
  assert.equal(verifyReasoningStateLog(logPath, {expected_ledger_id: profile.reasoning_state.ledger_id}).ok, true);

  version = 3;
  const resumed = wrapper({loaded_profile: profile, plan_context_provider: provider});
  assert.equal(resumed.inspectState().reasoning_state.recovery.disposition, "recovered");
  const nextTurn = await resumed.processClientMessage(turnStart(10050, "Research the remaining obligation.", "thread-steer-plan"));
  assert.equal(nextTurn.to_server.length, 1);
  assert.equal(seenPredecessors.at(-1), successor.plan_context_digest);
  assert.match(nextTurn.to_server[0].params.additionalContext[CACHE_AFFINITY_KEY].value, /Keep the second obligation/);
  assert.equal(resumed.ledger.snapshot().find((event) => event.event_kind === "reasoning-dispatch-verified")?.plan_context_digest,
    resumed.observeReasoningThreads()[0].plan_context_digest);
  resumed.close();
});

test("rejected or unbound steering never commits a successor plan", async () => {
  let version = 1;
  const sourceRef = "plans:rejected-steer";
  const sourceDigest = createHash("sha256").update("rejected steer source").digest("hex");
  const provider = ({thread_ref, previous_plan_context_digest}) => ({input: {thread_ref, parent_plan_ref: sourceRef,
    parent_plan_digest: sourceDigest, feature_obligations: [
      {obligation_id: "one", summary: "Retain one obligation", status: version === 1 ? "active" : "completed"},
      {obligation_id: "two", summary: "Continue the next obligation", status: version === 1 ? "open" : "active"},
    ], active_slice_id: version === 1 ? "one" : "two", unresolved_decisions: [], source_refs: [{source_ref: sourceRef, source_digest: sourceDigest}], previous_plan_context_digest},
    source_digests: {[sourceRef]: sourceDigest}});
  const instance = wrapper({plan_context_provider: provider});
  assert.equal((await instance.processClientMessage(turnStart(10051, "Research the first obligation.", "thread-rejected-steer"))).to_server.length, 1);
  await instance.processServerMessage({jsonrpc: "2.0", id: 10051, result: {turn: {id: "turn-rejected-steer"}}});
  const originalDigest = instance.observeReasoningThreads()[0].plan_context_digest;
  version = 2;
  const unbound = await instance.processClientMessage({jsonrpc: "2.0", id: 10052, method: "turn/steer", params: {threadId: "thread-rejected-steer", expectedTurnId: "wrong-turn", input: [{type: "text", text: "Research the next obligation."}]}});
  assert.equal(unbound.to_server.length, 0);
  const steer = {jsonrpc: "2.0", id: 10053, method: "turn/steer", params: {threadId: "thread-rejected-steer", expectedTurnId: "turn-rejected-steer", input: [{type: "text", text: "Research the next obligation."}]}};
  const admitted = await instance.processClientMessage(steer);
  assert.equal(admitted.to_server.length, 1, JSON.stringify(admitted.to_client));
  const rejected = await instance.processServerMessage({jsonrpc: "2.0", id: 10053, error: {code: -32602, message: "No active turn"}});
  assert.equal(rejected.to_client[0].error.message, "No active turn");
  assert.equal(instance.observeReasoningThreads()[0].plan_context_digest, originalDigest);
  assert.deepEqual(instance.inspectState().pending_steer_rpc_ids, []);
  instance.close();
});

test("hosted steering requires verified input before any host dispatch", async () => {
  const instance = wrapper({require_hosted_input_attestation: true});
  const steer = {jsonrpc: "2.0", id: 10064, method: "turn/steer", params: {
    threadId: "thread-hosted-steer", expectedTurnId: "turn-hosted-steer",
    input: [{type: "text", text: "Correct the objective."}]}};
  const denied = await instance.processClientMessage(steer);
  assert.equal(denied.to_server.length, 0);
  assert.deepEqual(denied.to_client[0].error.data.reason_codes, ["steer.hosted-input-unverified"]);
  instance.close();
});

test("steering serializes a turn and a mismatched host acceptance blocks further dispatch", async () => {
  const directory = mkdtempSync("/tmp/are-wrapper-steer-mismatch-");
  temporaryPaths.push(directory);
  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync",
    log_path: resolve(directory, "reasoning-state.jsonl"), single_writer: true};
  const instance = wrapper({loaded_profile: profile});
  const threadId = "thread-steer-mismatch";
  const turnId = "turn-steer-mismatch";
  assert.equal((await instance.processClientMessage(turnStart(10054, "Research the first obligation.", threadId))).to_server.length, 1);
  await instance.processServerMessage({jsonrpc: "2.0", id: 10054, result: {turn: {id: turnId}}});
  const steer = {jsonrpc: "2.0", id: 10055, method: "turn/steer", params: {threadId, expectedTurnId: turnId,
    input: [{type: "text", text: "Research the next obligation."}]}};
  assert.deepEqual((await instance.processClientMessage(steer)).to_server, [steer]);
  const duplicate = await instance.processClientMessage({...steer, id: 10056});
  assert.equal(duplicate.to_server.length, 0);
  assert.deepEqual(duplicate.to_client[0].error.data.reason_codes, ["steer.pending-for-turn"]);
  const prematureTurn = await instance.processClientMessage(turnStart(10057, "Research another obligation.", threadId));
  assert.equal(prematureTurn.to_server.length, 0);
  assert.deepEqual(prematureTurn.to_client[0].error.data.reason_codes, ["steer.outcome-pending"]);
  const mismatch = await instance.processServerMessage({jsonrpc: "2.0", id: 10055, result: {turnId: "unexpected-turn"}});
  assert.equal(mismatch.to_client[0].error.code, -32080);
  assert.deepEqual(instance.inspectState().degraded_steer_threads, [threadId]);
  const nextTurn = await instance.processClientMessage(turnStart(10057, "Research another obligation.", threadId));
  assert.equal(nextTurn.to_server.length, 0);
  assert.deepEqual(nextTurn.to_client[0].error.data.reason_codes, ["steer.continuity-degraded"]);
  instance.close();
  const resumed = wrapper({loaded_profile: profile});
  assert.deepEqual(resumed.inspectState().degraded_steer_threads, [threadId]);
  resumed.close();
});

test("restart keeps an unresolved steer degraded while a durably rejected steer remains retryable", async () => {
  const directory = mkdtempSync("/tmp/are-wrapper-steer-recovery-");
  temporaryPaths.push(directory);
  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync",
    log_path: resolve(directory, "reasoning-state.jsonl"), single_writer: true};
  const threadId = "thread-steer-recovery";
  const turnId = "turn-steer-recovery";
  const first = wrapper({loaded_profile: profile});
  assert.equal((await first.processClientMessage(turnStart(10058, "Research the first obligation.", threadId))).to_server.length, 1);
  await first.processServerMessage({jsonrpc: "2.0", id: 10058, result: {turn: {id: turnId}}});
  const steer = {jsonrpc: "2.0", id: 10059, method: "turn/steer", params: {threadId, expectedTurnId: turnId,
    input: [{type: "text", text: "Research the next obligation."}]}};
  assert.deepEqual((await first.processClientMessage(steer)).to_server, [steer]);
  first.close();

  const resumed = wrapper({loaded_profile: profile});
  assert.deepEqual(resumed.inspectState().degraded_steer_threads, [threadId]);
  const denied = await resumed.processClientMessage(turnStart(10060, "Research after an unknown steer outcome.", threadId));
  assert.equal(denied.to_server.length, 0);
  assert.deepEqual(denied.to_client[0].error.data.reason_codes, ["steer.continuity-degraded"]);
  resumed.close();

  const rejectedProfile = structuredClone(profile);
  rejectedProfile.reasoning_state.log_path = resolve(directory, "rejected-state.jsonl");
  const rejected = wrapper({loaded_profile: rejectedProfile});
  assert.equal((await rejected.processClientMessage(turnStart(10061, "Research the first obligation.", threadId))).to_server.length, 1);
  await rejected.processServerMessage({jsonrpc: "2.0", id: 10061, result: {turn: {id: turnId}}});
  assert.deepEqual((await rejected.processClientMessage({...steer, id: 10062})).to_server[0].method, "turn/steer");
  assert.equal((await rejected.processServerMessage({jsonrpc: "2.0", id: 10062,
    error: {code: -32602, message: "No active turn"}})).to_client[0].error.message, "No active turn");
  await rejected.processServerMessage(completed(threadId, turnId));
  rejected.close();
  const afterRejection = wrapper({loaded_profile: rejectedProfile});
  assert.deepEqual(afterRejection.inspectState().degraded_steer_threads, []);
  assert.equal((await afterRejection.processClientMessage(turnStart(10063, "Research after a rejected steer.", threadId))).to_server.length, 1);
  afterRejection.close();
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

test("file-backed decision recovery exposes only the latest 128 content-free evaluations", () => {
  const directory = mkdtempSync("/tmp/are-wrapper-decision-recovery-");
  temporaryPaths.push(directory);
  const logPath = resolve(directory, "reasoning-state.jsonl");
  const sink = createAppendOnlyFileReasoningStateSink({path: logPath});
  const seed = createReasoningStateLedger({ledger_id: loaded.value.reasoning_state.ledger_id, sink});
  const threadRef = `backend-thread:${digestValue("private-recovery-thread")}`;
  for (let sequence = 1; sequence <= 140; sequence += 1) {
    const appended = seed.append({event_kind: "decision-observation-recorded", content: {
      decision_type: "turn-preflight", outcome: "direct", thread_ref: threadRef,
      decision_digest: digestValue({sequence, kind: "decision"}),
      evidence_event_digest: digestValue({sequence, kind: "evidence"}),
      event_sequence: sequence, observed_at_unix_ms: 1_700_000_000_000 + sequence,
      reason_codes: ["selection.unique-capability"],
    }});
    assert.equal(appended.ok, true);
  }
  const epoch = seed.seal({consumer_ref: "codex:decision-recovery", request_ref: "decision-recovery-seed"});
  assert.equal(epoch.ok, true);
  assert.equal(seed.checkpoint({checkpoint_kind: "manual", epoch: epoch.value}).ok, true);
  seed.close();

  const profile = structuredClone(loaded.value);
  profile.reasoning_state = {...profile.reasoning_state, storage_mode: "append-only-file-fsync", log_path: logPath};
  const recovered = wrapper({loaded_profile: profile});
  const decisions = recovered.observeDecisions();
  assert.equal(decisions.length, 128);
  assert.equal(decisions[0].event_sequence, 13);
  assert.equal(decisions.at(-1).event_sequence, 140);
  assert.doesNotMatch(JSON.stringify(decisions), /private-recovery-thread/);
  assert.equal(recovered.inspectState().decision_observation_persistence_failure, null);
  recovered.close();
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
  assert.equal(first.completedTurnProof("thread-frontier", digestValue("turn-frontier")), null);
  assert.equal(first.observeDecisions().some((decision) => decision.decision_type === "turn-preflight"), true);
  const initial = await first.processServerMessage(completed("thread-frontier", "turn-frontier"));
  assert.equal(initial.to_server.length, 1);
  assert.equal(first.inspectState().reasoning_state.frontier_count, 1);
  const completedProof = first.completedTurnProof("thread-frontier", digestValue("turn-frontier"));
  assert.equal(completedProof.turn_status, "completed");
  assert.match(completedProof.frontier_digest, /^[0-9a-f]{64}$/);
  assert.equal(first.completedTurnProof("other-thread", digestValue("turn-frontier")), null);
  assert.equal(first.observeReasoningThreads().find((thread) => thread.phase === "turn-completed")?.latest_frontier_digest?.length, 64);
  assert.equal(first.observeDecisions().some((decision) => decision.decision_type === "turn-continuation"), true);
  assert.doesNotMatch(JSON.stringify(first.observeDecisions()), /thread-frontier|refund/);
  const firstDecisions = first.observeDecisions();
  const storedDecisionEvents = first.inspectState().reasoning_state.event_count;
  assert.deepEqual({semanticInputCalls, semanticLifecycleCalls, continuationCalls}, {semanticInputCalls: 0, semanticLifecycleCalls: 0, continuationCalls: 1});
  first.close();

  const second = wrapper({
    loaded_profile: profile,
    semantic_input_provider: semanticInputProvider,
    semantic_lifecycle: semanticLifecycle,
    continuation_provider: continuationProvider,
  });
  assert.deepEqual(second.inspectState().completion_frontier_turn_ids, ["thread-frontier:turn-frontier"]);
  assert.deepEqual(second.completedTurnProof("thread-frontier", digestValue("turn-frontier")), completedProof);
  assert.equal(second.observeReasoningThreads()[0].phase, "dispatch-pending", "the already-dispatched automatic successor remains pending after restart");
  assert.deepEqual(second.observeDecisions(), firstDecisions, "Content-free decision observations replay from the consumer ledger.");
  assert.equal(second.inspectState().reasoning_state.event_count, storedDecisionEvents);
  assert.equal(second.inspectState().decision_observation_persistence_failure, null);
  const decisionEvents = readFileSync(logPath, "utf8").trim().split("\n")
    .map((line) => JSON.parse(line))
    .filter((record) => record.record_kind === "reasoning-state-event" && record.value.event_kind === "decision-observation-recorded")
    .map((record) => record.value);
  assert.equal(decisionEvents.length, 2);
  assert.deepEqual(Object.keys(decisionEvents[0].content).sort(), ["decision_digest", "decision_type", "event_sequence", "evidence_event_digest", "observed_at_unix_ms", "outcome", "reason_codes", "thread_ref"]);
  assert.doesNotMatch(JSON.stringify(decisionEvents), /thread-frontier|refund/);
  assert.doesNotMatch(JSON.stringify(second.observeReasoningThreads()), /thread-frontier|refund/);
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

test("a failed semantic binding checkpoint withholds the host-accepted turn", async () => {
  const reasoningLedger = createReasoningStateLedger({ledger_id: "reasoning:failed-binding"});
  const instance = wrapper({reasoning_ledger: reasoningLedger});
  const started = await instance.processClientMessage(turnStart(10046, "Research refund eligibility.", "thread-binding-fail"));
  assert.equal(started.to_server.length, 1);
  assert.deepEqual(instance.inspectState().pending_semantic_rpc_ids, ["10046"]);
  reasoningLedger.close();
  await assert.rejects(instance.processServerMessage(turnResponse(10046, "turn-binding-fail")), /semantic.turn-binding-not-durable/);
  assert.deepEqual(instance.inspectState().active_semantic_turn_ids, []);
  assert.deepEqual(instance.inspectState().pending_semantic_rpc_ids, ["10046"]);
});

test("a successful turn response without a turn identity is withheld", async () => {
  const instance = wrapper();
  const started = await instance.processClientMessage(turnStart(10047, "Research refund eligibility.", "thread-unbound-response"));
  assert.equal(started.to_server.length, 1);
  await assert.rejects(instance.processServerMessage({jsonrpc: "2.0", id: 10047, result: {}}), /semantic.turn-response-unbound/);
  assert.deepEqual(instance.inspectState().pending_semantic_rpc_ids, ["10047"]);
  assert.deepEqual(instance.inspectState().active_semantic_turn_ids, []);
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

test("hosted effect decisions use the accepted turn route and reject missing route bindings", async () => {
  const instance = wrapper({require_bound_effect_route: true,
    effect_metadata_provider: () => ({route_id: "CA2-ROUTE-IMPLEMENT",
      effect_classes: ["persistent-mutation"], reversible: false})});
  const missing = await instance.processServerMessage({jsonrpc: "2.0", id: 801,
    method: "item/fileChange/requestApproval", params: {threadId: "thread-route", turnId: "turn-unbound",
      itemId: "item-unbound", startedAtMs: 1, reason: "edit"}});
  assert.equal(missing.to_server[0].result.decision, "decline");
  assert.equal(missing.to_client.some(message => message.method === "item/fileChange/requestApproval"), false);
  await startAndBind(instance, {id: 802, text: "Research current context management approaches.",
    threadId: "thread-route", turnId: "turn-research"});
  const bound = await instance.processServerMessage({jsonrpc: "2.0", id: 803,
    method: "item/fileChange/requestApproval", params: {threadId: "thread-route", turnId: "turn-research",
      itemId: "item-research", startedAtMs: 2, reason: "edit"}});
  assert.equal(bound.to_server[0].result.decision, "decline");
  assert.equal(bound.to_client.some(message => message.method === "item/fileChange/requestApproval"), false);
  assert.equal(instance.ledger.snapshot().filter(event => event.event_kind === "effect-decision").length, 2);
});

test("hosted effect assessment is default-off and bound to an active accepted turn", async () => {
  const params = {threadId: "thread-hosted", turnId: "turn-hosted",
    effectId: `hosted-effect:${"a".repeat(64)}`, kind: "command",
    proposal: {command: ["pwd"]}};
  const request = {jsonrpc: "2.0", id: 810, method: "cyberalchemy/hostedEffect/assess", params};
  const disabled = await wrapper().processClientMessage(request);
  assert.equal(disabled.to_client[0].error.data.reason_codes[0], "hosted-effect.disabled");

  const instance = wrapper({allow_hosted_effect_tool: true, require_bound_effect_route: true,
    effect_metadata_provider: () => ({route_id: "CA2-ROUTE-IMPLEMENT",
      effect_classes: ["persistent-mutation"], reversible: false,
      owner_gate_ref: "Owner of exact hosted command"})});
  const before = await instance.processClientMessage(request);
  assert.equal(before.to_client[0].error.data.reason_codes[0], "hosted-effect.turn-not-active");
  await startAndBind(instance, {id: 811, text: "Implement the bounded change.",
    threadId: params.threadId, turnId: params.turnId});
  const accepted = await instance.processClientMessage(request);
  assert.deepEqual(accepted.to_server, []);
  assert.equal(accepted.to_client[0].result.ok, true);
  assert.equal(accepted.to_client[0].result.value.thread_id, params.threadId);
  assert.equal(accepted.to_client[0].result.value.turn_id, params.turnId);
  assert.equal(accepted.to_client[0].result.value.item_id, params.effectId);
  assert.equal(accepted.to_client[0].result.value.authority_effect, "none");
  assert.equal(instance.ledger.snapshot().some(event => event.event_kind === "effect-decision"
    && event.rpc_id === params.effectId), true);
  const invalid = await instance.processClientMessage({...request, id: 812,
    params: {...params, routeId: "CA2-ROUTE-IMPLEMENT"}});
  assert.equal(invalid.to_client[0].error.data.reason_codes[0], "hosted-effect.assessment-request-invalid");
  await instance.processServerMessage(completed(params.threadId, params.turnId));
  const after = await instance.processClientMessage({...request, id: 813});
  assert.equal(after.to_client[0].error.data.reason_codes[0], "hosted-effect.turn-not-active");

  await startAndBind(instance, {id: 814, text: "Research current context management approaches.",
    threadId: params.threadId, turnId: "turn-research-hosted"});
  const researched = await instance.processClientMessage({...request, id: 815,
    params: {...params, turnId: "turn-research-hosted", kind: "file-change"}});
  assert.equal(researched.to_client[0].result.value.directive_kind, "block");
});

test("hosted command dispatch requires its bound assessment and one-use intent", async () => {
  const effectId = `hosted-effect:${"b".repeat(64)}`;
  const params = {threadId: "thread-execute", turnId: "turn-execute", effectId,
    kind: "command", proposal: {command: ["node", "--version"], cwd: repositoryRoot}};
  const instance = wrapper({allow_hosted_effect_tool: true,
    hosted_effect_repository_root: repositoryRoot, require_bound_effect_route: true,
    effect_metadata_provider: () => ({route_id: "CA2-ROUTE-IMPLEMENT",
      effect_classes: ["persistent-mutation"], reversible: false,
      owner_gate_ref: "Owner of exact hosted command"})});
  await startAndBind(instance, {id: 9001, text: "Implement the bounded change.",
    threadId: params.threadId, turnId: params.turnId});
  const assessed = await instance.processClientMessage({jsonrpc: "2.0", id: 9002,
    method: "cyberalchemy/hostedEffect/assess", params});
  const directive = assessed.to_client[0].result.value;
  assert.equal(["direct", "gate"].includes(directive.directive_kind), true);
  const request = {thread_id: params.threadId, turn_id: params.turnId,
    effect_id: effectId, kind: "command", proposal: params.proposal};
  const binding = bindApprovalResponse({pending: directive,
    response: {jsonrpc: "2.0", id: effectId, result: {decision: "accept"}}}).binding;
  const intent = {schema_version: "are.hosted-effect-intent/v1", effect_id: effectId,
    proposal_digest: digestValue(request), engine_decision_digest: directive.decision_digest,
    approval_binding_digest: binding.binding_digest, request, status: "intent",
    authority_effect: "none"};
  const execute = {jsonrpc: "2.0", id: 9003, method: "cyberalchemy/hostedEffect/execute",
    params: {request, intent, approval_binding: binding}};
  const changed = await instance.processClientMessage({...execute, id: 9004,
    params: {...execute.params, intent: {...intent, proposal_digest: "wrong"}}});
  assert.equal(changed.to_server.length, 0);
  const forwarded = await instance.processClientMessage(execute);
  if (process.platform === "win32") {
    assert.equal(forwarded.to_server.length, 0);
    assert.deepEqual(forwarded.to_client[0].error.data.reason_codes,
      ["hosted-effect.windows-sandbox-unverified"]);
    return;
  }
  assert.equal(forwarded.to_server[0].method, "command/exec");
  assert.equal(forwarded.to_server[0].params.sandboxPolicy.networkAccess, false);
  assert.equal((await instance.processClientMessage({...execute, id: 9005})).to_server.length, 0);
  const settled = await instance.processServerMessage({jsonrpc: "2.0", id: 9003,
    result: {exitCode: 0, stdout: "ok", stderr: ""}});
  assert.equal(settled.to_client[0].result.ok, true);
  assert.equal(settled.to_client[0].result.stdout, "ok");
});

test("hosted broker opt-in denies the duplicate native approval path", async () => {
  const instance = wrapper({allow_hosted_effect_tool: true,
    hosted_effect_repository_root: repositoryRoot});
  const native = {jsonrpc: "2.0", id: 9010,
    method: "item/commandExecution/requestApproval",
    params: {threadId: "thread-native", turnId: "turn-native",
      itemId: "native-command", command: "echo bypass"}};
  const rejected = await instance.processServerMessage(native);
  assert.equal(rejected.to_client.length, 0);
  assert.equal(rejected.to_server[0].result.decision, "decline");
  assert.equal(instance.ledger.snapshot().some(event =>
    event.event_kind === "native-effect-path-denied"), true);
});

test("shared wrapper declines session-wide and policy-amending approval responses", async () => {
  const instance = wrapper();
  const decisions = ["acceptForSession", {acceptWithExecpolicyAmendment: {command: "echo"}},
    {applyNetworkPolicyAmendment: {enabled: true}}];
  for (const [index, decision] of decisions.entries()) {
    const id = 180 + index;
    const effect = {jsonrpc: "2.0", id, method: "item/commandExecution/requestApproval",
      params: {threadId: "thread-1", turnId: "turn-1", itemId: `item-${id}`, command: "echo test"}};
    const requested = await instance.processServerMessage(effect);
    assert.equal(requested.to_client[0], effect);
    const rejected = await instance.processClientMessage({jsonrpc: "2.0", id, result: {decision}});
    assert.deepEqual(rejected.to_server, [{jsonrpc: "2.0", id, result: {decision: "decline"}}]);
    assert.deepEqual(rejected.to_client[0].error.data.reason_codes, ["effect.session-or-policy-grant-unsupported"]);
    assert.equal(instance.inspectState().pending_approval_ids.includes(String(id)), false);
  }
  const evidence = instance.ledger.snapshot();
  assert.equal(evidence.filter((event) => event.event_kind === "approval-response-rejected").length, decisions.length);
  assert.equal(evidence.some((event) => event.event_kind === "effect-approval-bound"), false);
});

test("shared wrapper denies unassessed host tool calls before client delivery", async () => {
  const instance = wrapper();
  for (const [index, method] of ["item/tool/call", "account/chatgptAuthTokens/refresh",
    "attestation/generate", "applyPatchApproval", "execCommandApproval", "future/effect"].entries()) {
    const request = {jsonrpc: "2.0", id: `unsupported-${index}`, method,
      params: {threadId: "thread-1", turnId: "turn-1", tool: "unassessed"}};
    const result = await instance.processServerMessage(request);
    assert.deepEqual(result.to_client, [], method);
    assert.deepEqual(result.to_server[0].error.data.reason_codes,
      [method === "future/effect" ? "host.server-request-unknown" : "host.server-request-unsupported"], method);
  }
  assert.equal(instance.ledger.snapshot().filter((event) => event.event_kind === "unsupported-host-request-rejected").length, 6);
  for (const method of ["item/tool/requestUserInput", "mcpServer/elicitation/request", "currentTime/read"]) {
    const request = {jsonrpc: "2.0", id: method, method, params: {threadId: "thread-1"}};
    const result = await instance.processServerMessage(request);
    assert.deepEqual(result.to_client, [request], method);
    assert.deepEqual(result.to_server, [], method);
  }
});

test("shared wrapper forwards only the opted-in hosted effect tool to its broker client", async () => {
  const instance = wrapper({allow_hosted_effect_tool: true});
  const request = {jsonrpc: "2.0", id: "hosted-effect-1", method: "item/tool/call", params: {
    threadId: "thread-1", turnId: "turn-1", callId: "call-1", namespace: null,
    tool: "are_effect_request", arguments: {kind: "command", proposal: {command: ["pwd"]}}}};
  const accepted = await instance.processServerMessage(request);
  assert.deepEqual(accepted.to_client, [request]);
  assert.deepEqual(accepted.to_server, []);
  const unrelated = await instance.processServerMessage({...request, id: "other-tool",
    params: {...request.params, tool: "unrelated"}});
  assert.deepEqual(unrelated.to_client, []);
  assert.deepEqual(unrelated.to_server[0].error.data.reason_codes, ["host.server-request-unsupported"]);
});

test("shared wrapper declines permission expansion beyond the current turn", async () => {
  const instance = wrapper();
  const effect = {jsonrpc: "2.0", id: 184, method: "item/permissions/requestApproval",
    params: {threadId: "thread-1", turnId: "turn-1", itemId: "item-permission", permissions: {network: true}}};
  const requested = await instance.processServerMessage(effect);
  assert.equal(requested.to_client[0], effect);
  const rejected = await instance.processClientMessage({jsonrpc: "2.0", id: 184,
    result: {permissions: {network: {enabled: true}}, scope: "session"}});
  assert.deepEqual(rejected.to_server, [{jsonrpc: "2.0", id: 184, result: {permissions: {}, scope: "turn", strictAutoReview: true}}]);
  assert.deepEqual(rejected.to_client[0].error.data.reason_codes, ["effect.permission-scope-unsupported"]);
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
    evolution_signal_factory: (candidate) => Object.freeze({schema_version: "are.improvement-signal/v1", ...candidate,
      record_id: `signal:${createHash("sha256").update(JSON.stringify(candidate)).digest("hex")}`, authority_effect: "none"}),
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

test("opt-in evolution does not label an unacknowledged signal as emitted", async () => {
  const profile = structuredClone(loaded.value);
  profile.evolution_signals = {enabled: true, trigger: "turn/completed"};
  let sinkCalls = 0;
  const instance = wrapper({
    loaded_profile: profile,
    evolution_signal_provider: () => [{kind: "context-precision-failure", scope: "context-precision",
      observed_value: 0.71, expected_value: 0.8, metric: "context_precision"}],
    evolution_signal_sink: () => { sinkCalls += 1; },
    evolution_signal_factory: (candidate) => Object.freeze({schema_version: "are.improvement-signal/v1", ...candidate,
      record_id: `signal:${createHash("sha256").update(JSON.stringify(candidate)).digest("hex")}`, authority_effect: "none"}),
  });
  await startAndBind(instance, {id: 2103, text: "Explain the current context.",
    threadId: "thread-evolution-unacknowledged", turnId: "turn-evolution-unacknowledged"});
  await instance.processServerMessage(completed("thread-evolution-unacknowledged", "turn-evolution-unacknowledged"));
  const event = instance.ledger.snapshot().find((entry) => entry.event_kind === "evolution-signals-assessed");
  assert.equal(sinkCalls, 1);
  assert.equal(event.signal_disposition, "sink-failed");
  assert.equal(event.signal_count, 1);
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

  const consequential = semanticWrapper({continuation_provider: () => ({plan_bound: [planProposal("semantic-consequential", {required: true}, {
    action_ref: "implement",
    route_id: "CA2-ROUTE-IMPLEMENT",
    objective_kind: "implement",
    effect_classes: ["persistent-mutation"],
    next_turn: {params: {threadId: "successor:semantic-consequential", input: [{type: "text", text: "Implement the bounded change."}]}},
  })]})});
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
