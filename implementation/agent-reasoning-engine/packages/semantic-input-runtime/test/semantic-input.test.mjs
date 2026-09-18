import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {dirname, relative, resolve} from "node:path";
import test, {after} from "node:test";
import {fileURLToPath} from "node:url";

import {composeContextLifecycle} from "../../context-basis-runtime/index.mjs";
import {createNativeSemanticModulePort} from "../../module-port/native-semantic-adapter.mjs";
import {loadVerifiedDecisionProfile} from "../../request-decision-router/index.mjs";
import {assembleReasoningReceipt, digestValue, evaluateSemanticJudgment, OUTCOMES} from "../../semantic-judgment-evaluator/index.mjs";
import {buildRequest} from "../../semantic-judgment-evaluator/test/fixture-builder.mjs";
import {
  composeSemanticLifecycle,
  loadSemanticInputProfile,
  materializeSemanticRequest,
  OBSERVATION_CANDIDATE_SCHEMA,
  selectSemanticDomain,
  SEMANTIC_DOMAIN_BINDING_SCHEMA,
  SEMANTIC_INPUT_PROFILE_SCHEMA,
  SEMANTIC_LIFECYCLE_SCHEMA,
  SEMANTIC_MATERIALIZATION_SCHEMA,
} from "../index.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const contextRoot = resolve(packageRoot, "../context-basis-runtime");
const decisionProfile = loadVerifiedDecisionProfile(resolve(packageRoot, "../request-decision-router/profiles/cyberalchemy-v1.json"), repositoryRoot);
assert.equal(decisionProfile.ok, true);
const definitions = JSON.parse(readFileSync(resolve(contextRoot, "test/fixtures/definition-catalog.json"), "utf8"));
const ontology = JSON.parse(readFileSync(resolve(contextRoot, "test/fixtures/ontology-snapshot.json"), "utf8"));
const refund = JSON.parse(readFileSync(resolve(packageRoot, "../../fixtures/evaluator-v1/refund-eligibility.json"), "utf8"));
const modulePort = createNativeSemanticModulePort();
const temporaryRoots = [];
after(() => {
  for (const root of temporaryRoots) rmSync(root, {recursive: true, force: true});
});

function sha(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function writeJson(root, name, value) {
  const bytes = Buffer.from(JSON.stringify(value), "utf8");
  const path = resolve(root, name);
  writeFileSync(path, bytes);
  return {path: relative(repositoryRoot, path), sha256: sha(bytes)};
}

function requestContext(overrides = {}) {
  return {
    schema_version: "are.request-context/v1",
    request_id: "SEMANTIC-INPUT-TEST-1",
    raw_request: "Research whether this refund is eligible.",
    objective_kind: "research",
    owner_ref: refund.author_owner_ref,
    requested_effects: [],
    target_refs: [],
    constraints: ["no-effect"],
    evidence_refs: [refund.source_ref],
    ...overrides,
  };
}

function routeDecision(route_id = "CA2-ROUTE-RESEARCH") {
  return {kind: "selected", selected: {route_id}};
}

function envelope(overrides = {}) {
  const result = composeContextLifecycle({
    request_context: requestContext(),
    decision_profile: decisionProfile.value,
    definition: {catalog: definitions, seed_definition_ids: ["RequestContext"], universal_relation_classes: ["requires"], route_relation_classes_by_route: {"CA2-ROUTE-RESEARCH": ["route-context"]}},
    ontology: {snapshot: ontology, initial_node_ids: ["Request"], required_edge_ids: [], omission_candidate_ids: ["Unrelated"]},
    authority_posture: "candidate-context-only",
    effect_posture: "non-effectful",
    view: {lane: "plan-bound", consumer_ref: "semantic:test", window_ref: "semantic:window", purpose: "semantic-evaluation", source_epoch: "epoch:semantic:1", turn_id: "turn:semantic:1"},
    current_sources: [
      {source_identity: definitions.source_identity, source_digest: definitions.source_digest},
      {source_identity: ontology.source_identity, source_digest: ontology.snapshot_digest},
    ],
    contradictions: [{ref: "context-contradiction:test"}],
    exclusions: [{ref: "context-exclusion:test", reason: "not-required"}],
    gaps: [{ref: "context-gap:test"}],
    residue: [{ref: "context-residue:test"}],
    ...overrides,
  }, {module_port: modulePort});
  assert.equal(result.ok, true, result.reason_codes?.join(","));
  return result.value.context_envelope;
}

function providerValues(overrides = {}) {
  return {
    authority: {
      schema_version: "are.authority-provider/v1",
      snapshot_id: "authority:refund-production-shape",
      status: "active",
      owners: [refund.author_owner_ref],
      authority_edges: [{from: "root-owner@local", to: refund.author_owner_ref}],
      ...overrides.authority,
    },
    catalog: {
      schema_version: "are.rule-catalog-provider/v1",
      catalog_id: "catalog:refund-production-shape",
      evaluator_id: "semantic-judgment-evaluator@1",
      issuer_ref: refund.author_owner_ref,
      status: "active",
      expires_at: refund.expires_at,
      revoked_at: null,
      conclusion_domain: [refund.conclusion_domain],
      rules: structuredClone(refund.rules),
      precedence_edges: [],
      ...overrides.catalog,
    },
    validators: {
      schema_version: "are.observation-validator-provider/v1",
      validators: [{validator_id: "test-provider-validator@1", fields: Object.keys(refund.facts), source_refs: [refund.source_ref]}],
      ...overrides.validators,
    },
  };
}

function makeEnvironment({providerOverrides = {}, bindings = null} = {}) {
  const root = mkdtempSync(resolve(repositoryRoot, ".tmp-semantic-input-"));
  temporaryRoots.push(root);
  const providers = providerValues(providerOverrides);
  const authority = writeJson(root, "authority.json", providers.authority);
  const catalog = writeJson(root, "catalog.json", providers.catalog);
  const validators = writeJson(root, "validators.json", providers.validators);
  const binding = {
    schema_version: SEMANTIC_DOMAIN_BINDING_SCHEMA,
    binding_id: "semantic-domain:refund-research@1",
    route_ids: ["CA2-ROUTE-RESEARCH"],
    objective_kinds: ["research"],
    conclusion_domain: refund.conclusion_domain,
    evaluator_id: "semantic-judgment-evaluator@1",
    owner_ref: refund.author_owner_ref,
    question: "Is this refund eligible under the exact selected snapshot?",
    providers: {
      authority: {provider_id: "authority:refund", ...authority},
      catalog: {provider_id: "catalog:refund", ...catalog},
      validators: {provider_id: "validators:refund", ...validators},
    },
    temporal_policy: {require_current_envelope: true},
    required_observation_fields: Object.keys(refund.facts).sort(),
    effort_profile: {
      tier: "T0",
      required_roles: [],
      required_techniques: ["rule-applicability-check@1"],
      budgets: {reducer_steps: 100},
      stop_conditions: ["terminal-outcome"],
      escalation_conditions: ["owner-required"],
      policy_refs: [refund.source_ref],
    },
    technique_plan: {selected_techniques: ["rule-applicability-check@1"]},
    challenge_policy: {required_lanes: [{lane_id: "owner-policy-challenge", deadline_at: refund.expires_at, attempt_limit: 1}]},
    claim_ceiling: "A context-bound recommendation only; no authority or effect.",
    authority_effect: "none",
  };
  const profileMaterial = {
    schema_version: SEMANTIC_INPUT_PROFILE_SCHEMA,
    profile_id: "semantic-input:test@1",
    bindings: bindings ? bindings(binding) : [binding],
    authority_effect: "none",
  };
  const profilePath = resolve(root, "profile.json");
  writeFileSync(profilePath, JSON.stringify({...profileMaterial, profile_digest: digestValue(profileMaterial)}));
  const loaded = loadSemanticInputProfile(profilePath, repositoryRoot);
  return {root, providers, binding, profilePath, loaded};
}

function observationInputs(overrides = {}) {
  const sourceValue = structuredClone(refund.facts);
  const sourceDigest = digestValue(sourceValue);
  return {
    observation_sources: [{source_ref: refund.source_ref, value: sourceValue, digest: sourceDigest}],
    observation_candidates: Object.entries(refund.facts).map(([field, value], index) => ({
      schema_version: OBSERVATION_CANDIDATE_SCHEMA,
      candidate_id: `refund:candidate:${String(index + 1).padStart(2, "0")}`,
      field,
      value,
      issuer_ref: refund.author_owner_ref,
      source_ref: refund.source_ref,
      source_digest: sourceDigest,
      validator_ref: "test-provider-validator@1",
      temporal_scope: {observed_at: refund.as_of},
      proposed_posture: "admitted",
    })),
    ...overrides,
  };
}

function lifecycleInput(environment, overrides = {}) {
  return {
    context_envelope: envelope(),
    request_context: requestContext(),
    route_decision: routeDecision(),
    profile: environment.loaded.value,
    as_of: refund.as_of,
    created_at: refund.created_at,
    challenge_state: {required_lanes: [{lane_id: "owner-policy-challenge", status: "closed", attempt_count: 1}]},
    runtime_journal: {journal_id: "journal:semantic-input-test", events: []},
    ...observationInputs(),
    ...overrides,
  };
}

test("a real Context Envelope plus exact providers yields deterministic request and receipt bytes", () => {
  const environment = makeEnvironment();
  assert.equal(environment.loaded.ok, true, environment.loaded.reason_codes?.join(","));
  const first = composeSemanticLifecycle(lifecycleInput(environment));
  const second = composeSemanticLifecycle(lifecycleInput(environment));
  assert.equal(first.ok, true);
  assert.equal(first.disposition, "evaluated");
  assert.equal(first.semantic_outcome.outcome, OUTCOMES.RECOMMENDED);
  assert.equal(first.evaluator_calls, 1);
  assert.equal(first.reasoning_receipt_exact_bytes_digest, second.reasoning_receipt_exact_bytes_digest);
  assert.equal(first.semantic_input_materialization.canonical_digest, second.semantic_input_materialization.canonical_digest);
  assert.equal(first.semantic_input_materialization.schema_version, SEMANTIC_MATERIALIZATION_SCHEMA);
});

test("no matching binding is not-applicable and performs zero evaluator calls", () => {
  const environment = makeEnvironment();
  const telemetry = {};
  const result = composeSemanticLifecycle(lifecycleInput(environment, {route_decision: routeDecision("CA2-ROUTE-VALIDATE"), telemetry}));
  assert.equal(result.ok, true);
  assert.equal(result.disposition, "not-applicable");
  assert.equal(result.evaluator_calls, 0);
  assert.equal(telemetry.evaluator_calls ?? 0, 0);
});

test("multiple matching bindings block before provider or evaluator calls", () => {
  const environment = makeEnvironment({bindings: (binding) => [binding, {...binding, binding_id: "semantic-domain:refund-research@2"}]});
  assert.equal(environment.loaded.ok, true);
  const telemetry = {};
  const result = composeSemanticLifecycle(lifecycleInput(environment, {telemetry}));
  assert.equal(result.ok, false);
  assert.deepEqual(result.reason_codes, ["semantic.domain-binding-ambiguous"]);
  assert.equal(telemetry.evaluator_calls ?? 0, 0);
});

test("unverified profiles cannot select a domain", () => {
  const result = selectSemanticDomain(requestContext(), routeDecision(), {bindings: []});
  assert.equal(result.ok, false);
  assert.deepEqual(result.reason_codes, ["semantic.profile-not-verified"]);
});

test("owner mismatch and exact provider digest drift block before evaluation", () => {
  const environment = makeEnvironment();
  const ownerTelemetry = {};
  const owner = composeSemanticLifecycle(lifecycleInput(environment, {request_context: requestContext({owner_ref: "other-owner"}), telemetry: ownerTelemetry}));
  assert.equal(owner.ok, false);
  assert.deepEqual(owner.reason_codes, ["semantic.request-owner-missing-or-mismatch"]);
  writeFileSync(resolve(environment.root, "catalog.json"), JSON.stringify({...environment.providers.catalog, status: "changed"}));
  const driftTelemetry = {};
  const drift = composeSemanticLifecycle(lifecycleInput(environment, {telemetry: driftTelemetry}));
  assert.equal(drift.ok, false);
  assert.deepEqual(drift.reason_codes, ["semantic.provider-digest-drift:catalog"]);
  assert.equal(ownerTelemetry.evaluator_calls ?? 0, 0);
  assert.equal(driftTelemetry.evaluator_calls ?? 0, 0);
});

for (const [name, overrides, expected] of [
  ["expired catalog", {catalog: {expires_at: "2020-01-01T00:00:00.000Z"}}, "semantic.catalog-expired"],
  ["revoked catalog", {catalog: {revoked_at: "2026-01-01T00:00:00.000Z"}}, "semantic.catalog-revoked"],
  ["authority cycle", {authority: {authority_edges: [{from: "a", to: "b"}, {from: "b", to: "a"}]}}, "semantic.authority-cycle"],
  ["catalog precedence cycle", {catalog: {precedence_edges: [{from: "a", to: "b"}, {from: "b", to: "a"}]}}, "semantic.catalog-precedence-cycle"],
  ["malformed validator provider", {validators: {validators: "invalid"}}, "semantic.validator-provider-malformed"],
]) {
  test(`${name} blocks before evaluator execution`, () => {
    const environment = makeEnvironment({providerOverrides: overrides});
    const telemetry = {};
    const result = composeSemanticLifecycle(lifecycleInput(environment, {telemetry}));
    assert.equal(result.ok, false);
    assert.equal(result.reason_codes.includes(expected), true);
    assert.equal(telemetry.evaluator_calls ?? 0, 0);
  });
}

test("a stale Context Envelope blocks before selection and evaluation", () => {
  const environment = makeEnvironment();
  const stale = structuredClone(envelope());
  stale.value.freshness_state = "stale";
  delete stale.value.context_epoch_id;
  stale.value.context_epoch_id = `context-epoch:${digestValue(stale.value)}`;
  stale.digest = digestValue(stale.value);
  const telemetry = {};
  const result = composeSemanticLifecycle(lifecycleInput(environment, {context_envelope: stale, telemetry}));
  assert.equal(result.ok, false);
  assert.deepEqual(result.reason_codes, ["context.envelope-not-current"]);
  assert.equal(telemetry.evaluator_calls ?? 0, 0);
});

test("missing required observations remain unresolved and yield Deferred.Insufficient", () => {
  const environment = makeEnvironment();
  const candidates = observationInputs().observation_candidates.filter((item) => item.field !== "purchase_age_days");
  const result = composeSemanticLifecycle(lifecycleInput(environment, {observation_candidates: candidates}));
  assert.equal(result.ok, true);
  assert.equal(result.semantic_outcome.outcome, OUTCOMES.INSUFFICIENT);
  assert.equal(result.semantic_input_materialization.gaps.some((gap) => gap.field === "purchase_age_days"), true);
  assert.equal(result.reasoning_receipt.unresolved_observation_ids.length > 0, true);
});

test("rejected or invalidly bound observations never enter the admitted fact map", () => {
  const environment = makeEnvironment();
  const candidates = observationInputs().observation_candidates.map((item) => item.field === "purchase_age_days" ? {...item, proposed_posture: "rejected", rejection_reason: "source rejected"} : item);
  const materialized = materializeSemanticRequest({...lifecycleInput(environment, {observation_candidates: candidates}), binding: environment.loaded.value.bindings[0], repository_root: repositoryRoot});
  assert.equal(materialized.ok, true);
  const rejected = materialized.semantic_request.observations.find((item) => item.field === "purchase_age_days");
  assert.equal(rejected.posture, "rejected");
  const evaluated = composeSemanticLifecycle(lifecycleInput(environment, {observation_candidates: candidates}));
  assert.equal(evaluated.semantic_outcome.outcome, OUTCOMES.INSUFFICIENT);
});

test("malformed and duplicate admitted observation candidates block structurally", () => {
  const environment = makeEnvironment();
  const telemetry = {};
  const malformed = composeSemanticLifecycle(lifecycleInput(environment, {
    observation_candidates: [{schema_version: "wrong", candidate_id: "bad"}],
    telemetry,
  }));
  assert.equal(malformed.ok, false);
  assert.equal(malformed.stage, "observations");
  assert.equal(telemetry.evaluator_calls ?? 0, 0);

  const candidates = observationInputs().observation_candidates;
  const duplicate = composeSemanticLifecycle(lifecycleInput(environment, {
    observation_candidates: [...candidates, {...candidates[0], candidate_id: "duplicate-field"}],
  }));
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.reason_codes.some((reason) => reason.startsWith("semantic.observation-admitted-field-duplicate:")), true);
});

test("an intentionally updated exact provider binding creates a successor; unrelated drift is diagnostic", () => {
  const firstEnvironment = makeEnvironment();
  const first = composeSemanticLifecycle(lifecycleInput(firstEnvironment));
  assert.equal(first.ok, true);

  const changedRules = structuredClone(refund.rules);
  changedRules[0] = {...changedRules[0], description: "Semantically equivalent fixture revision"};
  const secondEnvironment = makeEnvironment({providerOverrides: {catalog: {rules: changedRules}}});
  const second = composeSemanticLifecycle(lifecycleInput(secondEnvironment, {
    previous_materialization: first.semantic_input_materialization,
    current_sources: [{provider_id: "ambient:unselected", sha256: "diagnostic-drift"}],
  }));
  assert.equal(second.ok, true);
  assert.equal(second.semantic_input_materialization.freshness.freshness_state, "successor-required");
  assert.equal(second.semantic_input_materialization.freshness.changed_selected_providers.some((item) => item.provider_id === "catalog:refund"), true);
  assert.equal(second.semantic_input_materialization.freshness.unrelated_source_drift.length, 1);
  assert.notEqual(first.semantic_input_materialization.materialization_id, second.semantic_input_materialization.materialization_id);
});

test("Context Envelope contradictions, gaps, exclusions, and residue are bound but not facts", () => {
  const environment = makeEnvironment();
  const result = composeSemanticLifecycle(lifecycleInput(environment));
  assert.equal(result.ok, true);
  assert.equal(Object.hasOwn(result.reasoning_receipt, "context_envelope_digest"), true);
  assert.equal(Object.hasOwn(result.semantic_input_materialization, "context_envelope_digest"), true);
  assert.equal(Object.hasOwn(result.reasoning_receipt, "facts"), false);
  assert.equal(result.semantic_input_materialization.observation_candidates.every((item) => item.schema_version === OBSERVATION_CANDIDATE_SCHEMA), true);
});

test("profile and lifecycle records expose version and non-authority posture", () => {
  const environment = makeEnvironment();
  assert.equal(environment.loaded.value.schema_version, SEMANTIC_INPUT_PROFILE_SCHEMA);
  const result = composeSemanticLifecycle(lifecycleInput(environment));
  assert.equal(result.schema_version, SEMANTIC_LIFECYCLE_SCHEMA);
  assert.equal(result.authority_effect, "none");
  assert.equal(Object.isFrozen(result), true);
});

test("historical unbound evaluator receipt bytes remain compatible", () => {
  const request = buildRequest(refund);
  const assembled = assembleReasoningReceipt(request, evaluateSemanticJudgment(request, {}));
  assert.equal(assembled.exact_bytes_digest, "5bba557a6947bf7cbdfe1e85f1f1e48adb41f4f3d99b9e0a4029e3609ebdddb2");
});

test("warm end-to-end semantic materialization and evaluation p95 is at most 250 ms", (context) => {
  const environment = makeEnvironment();
  const input = lifecycleInput(environment);
  for (let index = 0; index < 20; index += 1) assert.equal(composeSemanticLifecycle(input).ok, true);
  const samples = [];
  for (let index = 0; index < 250; index += 1) {
    const start = performance.now();
    const result = composeSemanticLifecycle(input);
    samples.push(performance.now() - start);
    assert.equal(result.ok, true);
  }
  samples.sort((left, right) => left - right);
  const p95 = samples[Math.ceil(samples.length * 0.95) - 1];
  context.diagnostic(`warm_iterations=250 p95_ms=${p95.toFixed(3)}`);
  assert.equal(p95 <= 250, true, `p95 ${p95.toFixed(3)} ms exceeds 250 ms`);
});
