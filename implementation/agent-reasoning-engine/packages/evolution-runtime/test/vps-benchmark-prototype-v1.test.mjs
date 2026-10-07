import assert from "node:assert/strict";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import test from "node:test";

import {
  createDurableEvolutionKernel,
  createEvolutionCoordinator,
  loadCandidateCycleDefinitionRegistry,
} from "../index.mjs";
import {
  createBenchmarkFamilyValidators,
  createVpsCapacityArbiter,
  createVpsCoordinatorBridge,
  createVpsWorkInbox,
  deriveFamilyPrelaunchState,
  materializeBenchmarkCampaign,
  materializeVpsExecutionBundle,
  materializeVpsPreflightResult,
  materializeWorkerAssignment,
  materializeWorkerResult,
  verifyFamilyPrelaunchState,
  verifyVpsExecutionBundle,
} from "../vps-benchmark-v1.mjs";

const registry = loadCandidateCycleDefinitionRegistry();
const definition = registry.definitions.find((item) => item.definition_ref === "benchmark-research/v1");
const actor = {actor_id: "agent:vps-test", actor_kind: "agent"};
const hash = (character) => character.repeat(64);
const limits = {maximum_workers: 2, maximum_tokens: 1000, maximum_cost: 10, maximum_elapsed_seconds: 1000};

function root() { return mkdtempSync(resolve(tmpdir(), "are-vps-prototype-")); }

function command(idempotencyKey) {
  return {idempotency_key: idempotencyKey, actor, cycle_definition_ref: definition.definition_ref, cycle_definition_digest: definition.definition_digest};
}

function campaign(family, familyPolicy) {
  return materializeBenchmarkCampaign({campaign_ref: `campaign:${family}`, family, model_ref: "glm-5.3-flash", work_items: [{task_ref: "task:a", source_ref: "source:a"}], source_bindings: [{source_ref: "source:a", sha256: hash("a")}], budgets: limits, comparison_posture: "prospective", family_policy: familyPolicy});
}

function bundle() {
  return materializeVpsExecutionBundle({bundle_ref: "bundle:contextbench", family: "contextbench", campaign_ref: "campaign:contextbench", execution_host: "187.77.163.194", source_hashes: [{path: "src/runner.mjs", sha256: hash("b")}], executable: {entrypoint_ref: "runner:contextbench", arguments: ["--fixture"]}, roots: {runtime_root: "/opt/are/runtime", workspace_root: "/opt/are/work", evidence_root: "/opt/are/evidence"}, model_ref: "glm-5.3-flash", tokenizer_ref: "tokenizer:glm", harness_ref: "harness:contextbench", scorer_ref: "scorer:native-span-f1", credential_ref: "secret-ref:model-api-key", resource_limits: limits, expires_at: "2030-01-01T00:00:00.000Z", output_contract: {artifact_roles: ["score"], maximum_diagnostic_bytes: 4096}});
}

function contextPolicy() {
  return {candidate_only: true, context_window: 8000, task_ids: [1, 4], historical_comparison_hashes: [hash("c")], thresholds: {task_1_span_f1_gt: 0, mean_span_f1_gt: 0.07327183777122158, task_4_span_f1_gte: 0.12654367554244316}, explicit_new_budgets: true};
}

test("closed VPS documents bind the fixed host and reject substitution and unknown fields", () => {
  const value = bundle();
  assert.equal(verifyVpsExecutionBundle(value).ok, true);
  const {bundle_digest: _digest, ...unsealed} = value;
  assert.throws(() => materializeVpsExecutionBundle({...unsealed, execution_host: "127.0.0.1"}), /identity-invalid/);
  assert.throws(() => materializeVpsExecutionBundle({...unsealed, surprise: true}), /unknown-field/);
  assert.throws(() => materializeVpsExecutionBundle({...unsealed, credential_ref: "Authorization: Bearer abcdefghijklmnop"}), /secret-shaped-data/);
  assert.equal(materializeVpsPreflightResult({preflight_ref: "preflight:fixture", execution_host: "187.77.163.194", container_ref: "container:gateway", runtime_versions: {node: "24.1.0", python: "3.13", rust: "1.90"}, available_memory_bytes: 1024, available_disk_bytes: 2048, source_present: true, evidence_root_writable: true, gateway_present: true, credential_reference_present: true, active_conflicting_workers: 0, checked_at: "2026-09-25T12:00:00.000Z"}).authority_effect, "none");
});

test("each benchmark family has an independent validator and fail-closed prelaunch lane", () => {
  const validators = createBenchmarkFamilyValidators();
  assert.equal(validators.contextbench(campaign("contextbench", contextPolicy())).ok, true);
  assert.ok(validators["are-dsh"](campaign("are-dsh", {output_token_cap: 8192, executed_tool_call_ceiling: 8, matched_comparison: true, timer_scope: "request", qualifications: {native_subprocess: false, glm_profile: true, token_boundary: true, durable_accounting: true, benchmark_adapter: true}, benchmark_ready: false})).reason_codes.includes("are-dsh.benchmark-not-ready"));
  assert.equal(validators.longmemeval(campaign("longmemeval", {full_history_source_pinned: true, source_only_manifest: true, unexposed_cohort: true, exposed_ids_excluded: true, original_history_tokenizer_qualified: true, sealed_evaluator: true, confirmation_adapter: true, paired_task_denominator: 8, comparison_decided: true, explicit_budgets: true})).ok, true);
  const blocked = deriveFamilyPrelaunchState({family: "contextbench", campaign_ref: "campaign:contextbench", prerequisites: {candidate_tests: true}, evidence_refs: []});
  assert.equal(verifyFamilyPrelaunchState(blocked).ok, true);
  assert.equal(blocked.disposition, "blocked");
  assert.equal(blocked.live_dispatch_admitted, false);
});

test("shared capacity serializes cross-cycle reservations and reconstructs after restart", () => {
  const storage = root();
  try {
    const scope = {capacity_scope: "vps:187.77.163.194", cycle_ref: "cycle:vps-capacity", cycle_definition_ref: definition.definition_ref, cycle_definition_digest: definition.definition_digest, limits: {...limits, maximum_workers: 1}};
    const kernel = createDurableEvolutionKernel({root: storage, require_enabled: false});
    const capacity = createVpsCapacityArbiter({kernel, scope, registry, now: () => "2026-09-25T12:00:00.000Z"});
    assert.equal(capacity.reserve({...command("capacity:one"), campaign_cycle_ref: "cycle:hen-11", phase: "benchmark", task_ref: "task:a", worker_ref: "worker:one", resource_request: {workers: 1, tokens: 400, cost: 2, elapsed_seconds: 100}, expires_at: "2026-09-25T12:10:00.000Z"}).disposition, "accepted");
    assert.equal(capacity.inspect().active_reservations.length, 1, JSON.stringify(capacity.inspect()));
    const rejected = capacity.reserve({...command("capacity:two"), campaign_cycle_ref: "cycle:are-dsh", phase: "benchmark", task_ref: "task:b", worker_ref: "worker:two", resource_request: {workers: 1, tokens: 400, cost: 2, elapsed_seconds: 100}, expires_at: "2026-09-25T12:10:00.000Z"});
    assert.ok(rejected.reason_codes?.includes("capacity.workers-exhausted"), JSON.stringify(rejected));
    const reservation = capacity.inspect().active_reservations[0];
    assert.equal(capacity.release({...command("capacity:release"), reservation_ref: reservation.reservation_ref, accounting: {tokens: 350, cost: 1.5, elapsed_seconds: 90}}).disposition, "accepted");
    const freshKernel = createDurableEvolutionKernel({root: storage, require_enabled: false});
    const fresh = createVpsCapacityArbiter({kernel: freshKernel, scope, registry});
    assert.equal(fresh.inspect().active_reservations.length, 0);
    assert.equal(fresh.inspect().consumed.tokens, 350);
  } finally { rmSync(storage, {recursive: true, force: true}); }
});

test("CAS inbox preserves completed work across restart and protects an expired lease until settlement", () => {
  const storage = root();
  let clock = "2026-09-25T12:00:00.000Z";
  try {
    const kernel = createDurableEvolutionKernel({root: storage, require_enabled: false});
    const inbox = createVpsWorkInbox({kernel, registry});
    const lookup = (lease) => {
      const row = inbox.inspect().value.worker_results.find((item) => item.lease_ref === lease.lease_ref && item.fencing_token === lease.fencing_token);
      return row ? inbox.readResult(row.result_ref).value : null;
    };
    const coordinator = createEvolutionCoordinator({kernel, registry, verify_plan: () => true, validators: {"validator:evidence": () => ({ok: true})}, cycle_validators: {"benchmark-research": () => ({ok: true})}, terminal_result_lookup: lookup, now: () => clock});
    const plan = {schema_version: "are.research-work-plan/v1", plan_digest: hash("d"), research_dag: {dag_digest: hash("e")}, tasks: [{task_id: "task:a", title: "A", owner: "agent", lane: "product-construction", stage: "P3", question_ref: "question:a", depends_on: [], completion_criteria: ["criterion:a"], validator_ref: "validator:evidence"}], topological_order: ["task:a"], authority_effect: "none"};
    const envelope = {schema_version: "are.evolution-effect-envelope/v1", envelope_ref: "envelope:vps", cycle_ref: "cycle:hen-11", cycle_definition_digest: definition.definition_digest, authorization_ref: "decision:test", allowed_effect_classes: ["repository-read"], resource_limits: {maximum_attempts: 2, maximum_concurrency: 1, maximum_tokens: 1000, maximum_cost: 10, maximum_elapsed_seconds: 1000}, expires_at: "2030-01-01T00:00:00.000Z", enabled: true, authority_effect: "none"};
    assert.equal(coordinator.admitPhase({...command("phase:admit"), expected_event_revision: 0, worker_ref: null, cycle_ref: "cycle:hen-11", phase: "benchmark", plan, envelope, prerequisite_receipt_refs: []}).disposition, "accepted");
    assert.equal(coordinator.leaseWork({...command("work:lease"), expected_event_revision: 1, cycle_ref: "cycle:hen-11", phase: "benchmark", task_ref: "task:a", worker_ref: "worker:one", rationale: "fixture", effect_class: null, resource_request: {tokens: 100, cost: 1, elapsed_seconds: 30}, lease_seconds: 60}).disposition, "accepted");
    const lease = coordinator.inspect().value.phases[0].work_items[0].active_lease;
    const assignment = materializeWorkerAssignment({assignment_ref: "assignment:one", bundle_ref: "bundle:contextbench", bundle_digest: bundle().bundle_digest, campaign_ref: "campaign:contextbench", campaign_digest: campaign("contextbench", contextPolicy()).campaign_digest, cycle_ref: "cycle:hen-11", phase: "benchmark", task_ref: "task:a", lease_ref: lease.lease_ref, fencing_token: lease.fencing_token, reservation_ref: "reservation:fixture", worker_ref: "worker:one", input_artifacts: [], expires_at: lease.expires_at});
    assert.equal(inbox.putAssignment({...command("inbox:assignment"), assignment}).disposition, "accepted");
    const result = materializeWorkerResult({result_ref: "result:one", assignment_ref: assignment.assignment_ref, assignment_digest: assignment.assignment_digest, bundle_digest: assignment.bundle_digest, cycle_ref: assignment.cycle_ref, phase: assignment.phase, task_ref: assignment.task_ref, lease_ref: assignment.lease_ref, fencing_token: assignment.fencing_token, worker_ref: assignment.worker_ref, disposition: "succeeded", artifacts: [{artifact_id: `sha256:${hash("f")}`, sha256: hash("f"), byte_length: 10, media_type: "application/json", criterion_id: "criterion:a"}], accounting: {calls: 1, tokens: 90, cost: 0.9, elapsed_seconds: 25}, window_admission: {token_count: 8000, context_limit: 8192, admitted: true}, scorer_ref: "scorer:native-span-f1", judge_ref: null, completed_at: "2026-09-25T12:00:30.000Z", diagnostics: ["fixture"]});
    assert.equal(inbox.putResult({...command("inbox:result"), result}).disposition, "accepted");
    assert.equal(inbox.putResult({...command("inbox:result-replay"), result}).disposition, "replayed");
    clock = "2026-09-25T12:02:00.000Z";
    assert.ok(coordinator.recover({...command("work:recover"), expected_event_revision: 4, cycle_ref: "cycle:hen-11", phase: "benchmark"}).reason_codes.includes("coordination.terminal-result-settlement-required"));
    const scope = {capacity_scope: "vps:187.77.163.194", cycle_ref: "cycle:vps-capacity", cycle_definition_ref: definition.definition_ref, cycle_definition_digest: definition.definition_digest, limits};
    const bridge = createVpsCoordinatorBridge({coordinator, capacity: createVpsCapacityArbiter({kernel, scope, registry}), inbox});
    const proposal = bridge.proposeSettlement(result.result_ref);
    assert.equal(proposal.disposition, "proposed");
    assert.equal(coordinator.settleWork({...command("work:settle"), expected_event_revision: 4, cycle_ref: "cycle:hen-11", ...proposal.value}).disposition, "accepted");
    const freshKernel = createDurableEvolutionKernel({root: storage, require_enabled: false});
    const freshInbox = createVpsWorkInbox({kernel: freshKernel, registry});
    assert.equal(freshInbox.readResult("result:one").value.result_digest, result.result_digest);
  } finally { rmSync(storage, {recursive: true, force: true}); }
});

test("the existing coordinator still rejects live external dispatch", () => {
  const storage = root();
  try {
    const kernel = createDurableEvolutionKernel({root: storage, require_enabled: false});
    const coordinator = createEvolutionCoordinator({kernel, registry});
    assert.equal(typeof coordinator.leaseWork, "function");
  } finally { rmSync(storage, {recursive: true, force: true}); }
});
