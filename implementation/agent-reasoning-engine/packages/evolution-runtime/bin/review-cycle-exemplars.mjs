#!/usr/bin/env node
import {createHash} from "node:crypto";
import {closeSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync} from "node:fs";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {createDurableEvolutionKernel, createEvolutionCoordinator, loadCandidateCycleDefinitionRegistry} from "../index.mjs";
import {canonicalJson, canonicalizeJson} from "../../intent-route-resolver/index.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../..");
const argument = (name) => { const index = process.argv.indexOf(name); return index >= 0 ? process.argv[index + 1] : null; };
const runtimeRoot = resolve(argument("--root") ?? "");
const reportPath = resolve(argument("--report") ?? join(packageRoot, "evidence", "FIVE-CYCLE-EXEMPLAR-REVIEW.v1.json"));
if (!argument("--root")) throw new Error("cycle-review.root-required");

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const read = (path) => JSON.parse(readFileSync(resolve(repositoryRoot, path), "utf8"));
const source = (path) => {
  const absolute = resolve(repositoryRoot, path);
  const bytes = readFileSync(absolute);
  return {path, absolute, bytes, sha256: sha256(bytes), value: JSON.parse(bytes.toString("utf8"))};
};
const allTrue = (object, keys) => keys.every((key) => object?.[key] === true);
const settlementComplete = (value) => value?.task_count > 0 && value.completed_task_count === value.task_count && value.restart_verified === true && value.sqlite_loss_recovery_verified === true;

const cycleSpecs = [
  {
    kind: "benchmark-research",
    objective: "Close HEN-10 verified live ContextBench evidence through durable coordinator settlement.",
    files: [
      "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/hen-10-contextbench-live-v7-recovery/score-r4/RESULTS.json",
      "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/hen-10-contextbench-live-v7-recovery/SCORING-SUMMARY.json",
      "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/hen-10-contextbench-live-v7-recovery/INDEPENDENT-POSTRUN-REVIEW.json",
      "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/HEN-11-HYPOTHESIS-SELECTION.v1.json",
    ],
    validate(values) {
      const [result, summary, review, selection] = values;
      return result?.rows?.length === 4 && result?.authority_effect === "none" && summary?.schema_version === "are.hen10-composite-scoring-summary/v1" && summary.status === "completed" && summary.all_assigned_valid === true && summary.all_requests_within_8k === true && review?.schema_version === "are.hen10-independent-postrun-review/v1" && review.decision === "PASS" && review.checks?.complete_accounting === "PASS" && selection?.schema_version === "are.benchmark-hypothesis-selection/v1" && typeof selection.selected_hypothesis === "object";
    },
  },
  {
    kind: "research-learning",
    objective: "Bind the requirement-replication counterevidence to its falsifiable hypothesis, experiment, observation, and revise decision.",
    files: ["implementation/agent-reasoning-engine/packages/evolution-runtime/research-records/fbc7c1a6b01810478c5800fa07dba4f1cd3bd3e9a6fa2bb68bda5072198c30f9.json"],
    validate([registration]) {
      const schemas = new Set((registration?.records ?? []).map((record) => record.schema_version));
      const decision = registration?.records?.find((record) => record.schema_version === "are.learning-decision/v1");
      return registration?.schema_version === "are.benchmark-research-registration/v1" && registration.registration_digest === "fbc7c1a6b01810478c5800fa07dba4f1cd3bd3e9a6fa2bb68bda5072198c30f9" && ["are.research-hypothesis/v1", "are.hypothesis-observation/v1", "are.research-experiment/v1", "are.learning-decision/v1"].every((schema) => schemas.has(schema)) && decision?.disposition === "revise-hypothesis";
    },
  },
  {
    kind: "engine-improvement",
    objective: "Review the isolated IL-H04 wrapper variant, protected comparison, and recommend-only outcome.",
    files: [
      "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/ilh04-engine-improvement-v1/integration-validation.json",
      "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/ilh04-engine-improvement-v1/integration-package.json",
      "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/ilh04-engine-improvement-v1/coordinator-settlement.json",
    ],
    validate([validation, candidate, settlement]) {
      return validation?.schema_version === "are.engine-improvement-validation/v1" && validation.disposition === "validated-construction-candidate" && validation.activation === "none" && allTrue(validation.checks, ["exact_input_binding", "retained_parity", "fail_closed_binding", "repository_default_disabled"]) && candidate?.schema_version === "are.engine-improvement-package/v1" && candidate.decision === "recommend-variant" && candidate.activation === "none" && settlementComplete(settlement);
    },
  },
  {
    kind: "interaction-learning",
    objective: "Review the completed workflow-continuity lesson cycle and its independent live-evaluation result.",
    files: [
      "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/interaction-learning-objective-cycle-v1/runtime/cycles/interaction-learning-objective-cycle-v1/validation-v4.json",
      "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/interaction-learning-objective-cycle-v1/runtime/cycles/interaction-learning-objective-cycle-v1/learning-package-v4.json",
      "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/interaction-learning-objective-cycle-v1/runtime/cycles/interaction-learning-objective-cycle-v1/coordinator-settlement.json",
    ],
    validate([validation, lesson, settlement]) {
      return validation?.schema_version === "are.interaction-learning-live-validation/v1" && validation.disposition === "candidate-supported" && lesson?.schema_version === "are.interaction-learning-package/v1" && lesson.decision === "eligible-for-owner-review" && lesson.activation === "none" && settlementComplete(settlement);
    },
  },
  {
    kind: "controlled-upgrade",
    objective: "Review the admitted local headless activation, failed-canary rollback, successful canary, and retained local pointer.",
    files: [
      "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/ilh04-headless-activation-v1/activation-result.json",
      "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/ilh04-headless-activation-v1/activation-validation.json",
      "implementation/agent-reasoning-engine/packages/evolution-runtime/evidence/ilh04-headless-activation-v1/coordinator-settlement.json",
    ],
    validate([result, validation, settlement]) {
      return result?.schema_version === "are.headless-continuity-activation-result/v1" && result.disposition === "activated" && allTrue(result.checks, ["cycle_instance_admitted", "real_gateway_canary_passed", "rollback_verified", "repository_default_disabled"]) && validation?.schema_version === "are.headless-continuity-activation-validation/v1" && validation.disposition === "validated-local-headless-activation" && validation.checks?.failed_canary_rollback === true && settlementComplete(settlement);
    },
  },
];

const registry = loadCandidateCycleDefinitionRegistry();
const kernel = createDurableEvolutionKernel({root: runtimeRoot, require_enabled: false});
const sourceBindings = [];
const cycleResults = [];

for (const spec of cycleSpecs) {
  const definition = registry.definitions.find((entry) => entry.cycle_kind === spec.kind);
  if (!definition) throw new Error(`cycle-review.definition-missing:${spec.kind}`);
  const artifacts = spec.files.map(source);
  if (!spec.validate(artifacts.map((artifact) => artifact.value))) throw new Error(`cycle-review.domain-validation-failed:${spec.kind}`);
  const cycleRef = `cycle:review:${spec.kind}:20260924-v1`;
  const phase = "evidence-review";
  const validatorRef = `validator:cycle-review:${spec.kind}:v1`;
  const identities = artifacts.map((artifact) => {
    const stored = kernel.putArtifact({
      bytes: artifact.bytes,
      media_type: "application/json",
      semantic_binding: {cycle_ref: cycleRef, cycle_definition_digest: definition.definition_digest, role: "evidence", provenance_refs: [`source:${artifact.path}`], claim_ceiling: `Exact source evidence for one ${spec.kind} review cycle only.`},
    });
    if (!stored.ok) throw new Error(`cycle-review.artifact-store-failed:${spec.kind}:${stored.reason_codes.join(",")}`);
    if (stored.value.sha256 !== artifact.sha256) throw new Error(`cycle-review.artifact-digest-drift:${artifact.path}`);
    sourceBindings.push({cycle_kind: spec.kind, path: artifact.path, sha256: artifact.sha256, byte_length: artifact.bytes.byteLength, artifact_ref: stored.value.artifact_id});
    return stored.value;
  });
  const tasks = artifacts.map((artifact, index) => ({
    task_id: `task:cycle-review:${spec.kind}:${index + 1}`,
    title: `Validate and bind ${artifact.path.split("/").at(-1)}`,
    owner: "agent",
    lane: spec.kind,
    stage: `artifact-${index + 1}`,
    question_ref: `question:cycle-review:${spec.kind}`,
    depends_on: index === 0 ? [] : [`task:cycle-review:${spec.kind}:${index}`],
    completion_criteria: [`criterion:cycle-review:${spec.kind}:${index + 1}`],
    validator_ref: validatorRef,
  }));
  const plan = {schema_version: "are.research-work-plan/v1", plan_digest: definition.definition_digest, research_dag: {dag_digest: sha256(Buffer.from(`${spec.kind}:review-dag:v1`))}, tasks, topological_order: tasks.map((task) => task.task_id), authority_effect: "none"};
  const envelope = {schema_version: "are.evolution-effect-envelope/v1", envelope_ref: `envelope:cycle-review:${spec.kind}:v1`, cycle_ref: cycleRef, cycle_definition_digest: definition.definition_digest, authorization_ref: "decision:user-run-one-cycle-of-each-type-20260924", allowed_effect_classes: ["repository-read"], resource_limits: {maximum_attempts: 1, maximum_concurrency: 1, maximum_tokens: tasks.length, maximum_cost: 0, maximum_elapsed_seconds: 300}, expires_at: "2030-01-01T00:00:00.000Z", enabled: true, authority_effect: "none"};
  const coordinator = createEvolutionCoordinator({
    kernel,
    registry,
    verify_plan: (candidate) => canonicalJson(candidate) === canonicalJson(plan),
    validators: {[validatorRef]: ({task, evidence}) => {
      const index = tasks.findIndex((candidate) => candidate.task_id === task.task_id);
      const identity = identities[index];
      return {ok: index >= 0 && evidence.length === 1 && evidence[0].criterion_id === task.completion_criteria[0] && evidence[0].artifact_ref === identity.artifact_id && evidence[0].artifact_digest === identity.sha256};
    }},
    cycle_validators: {[spec.kind]: ({definition: bound, plan: boundPlan, envelope: boundEnvelope}) => ({ok: bound.definition_digest === definition.definition_digest && canonicalJson(boundPlan) === canonicalJson(plan) && boundEnvelope.authorization_ref === envelope.authorization_ref && boundEnvelope.allowed_effect_classes.length === 1 && boundEnvelope.allowed_effect_classes[0] === "repository-read"})},
    now: () => "2026-09-24T18:00:00.000Z",
  });
  const actor = {actor_id: "agent:five-cycle-review", actor_kind: "agent"};
  const base = (revision, idempotency_key) => ({idempotency_key, expected_event_revision: revision, actor, worker_ref: null, cycle_ref: cycleRef, cycle_definition_ref: definition.definition_ref, cycle_definition_digest: definition.definition_digest});
  let projection = coordinator.inspect().value;
  let row = projection.phases.find((entry) => entry.cycle_ref === cycleRef && entry.phase === phase);
  if (!row) {
    const admitted = coordinator.admitPhase({...base(0, `${cycleRef}:admit`), phase, plan, envelope, prerequisite_receipt_refs: []});
    if (admitted.disposition !== "accepted") throw new Error(`cycle-review.admission-failed:${spec.kind}:${admitted.reason_codes.join(",")}`);
  }
  while (true) {
    projection = coordinator.inspect().value;
    row = projection.phases.find((entry) => entry.cycle_ref === cycleRef && entry.phase === phase);
    if (!row.frontier.length) break;
    const taskRef = row.frontier[0];
    const revision = row.event_refs.length;
    const index = tasks.findIndex((task) => task.task_id === taskRef);
    const identity = identities[index];
    const leased = coordinator.leaseWork({...base(revision, `${cycleRef}:lease:${revision}`), phase, task_ref: taskRef, worker_ref: "worker:five-cycle-evidence-review", rationale: "Validate domain-specific evidence and bind its exact content identity into the shared durable runtime.", effect_class: "repository-read", resource_request: {tokens: 1, cost: 0, elapsed_seconds: 1}, lease_seconds: 300});
    if (leased.disposition !== "accepted") throw new Error(`cycle-review.lease-failed:${spec.kind}:${leased.reason_codes.join(",")}`);
    projection = coordinator.inspect().value;
    row = projection.phases.find((entry) => entry.cycle_ref === cycleRef && entry.phase === phase);
    const item = row.work_items.find((entry) => entry.task_id === taskRef);
    const settled = coordinator.settleWork({...base(row.event_refs.length, `${cycleRef}:settle:${row.event_refs.length}`), phase, task_ref: taskRef, lease_ref: item.active_lease.lease_ref, fencing_token: item.active_lease.fencing_token, outcome: "succeeded", evidence: [{criterion_id: tasks[index].completion_criteria[0], artifact_ref: identity.artifact_id, artifact_digest: identity.sha256}], accounting: {tokens: 1, cost: 0, elapsed_seconds: 1}});
    if (settled.disposition !== "accepted") throw new Error(`cycle-review.settle-failed:${spec.kind}:${settled.reason_codes.join(",")}`);
  }
  projection = coordinator.inspect().value;
  row = projection.phases.find((entry) => entry.cycle_ref === cycleRef && entry.phase === phase);
  if (!row || row.work_items.some((entry) => entry.state !== "completed")) throw new Error(`cycle-review.incomplete:${spec.kind}`);
  cycleResults.push({cycle_kind: spec.kind, cycle_ref: cycleRef, definition_ref: definition.definition_ref, definition_digest: definition.definition_digest, objective: spec.objective, disposition: "completed", task_count: row.work_items.length, completed_task_count: row.work_items.filter((entry) => entry.state === "completed").length, accounting: row.accounting, event_refs: row.event_refs, artifact_refs: identities.map((identity) => identity.artifact_id)});
}

const before = canonicalJson(createEvolutionCoordinator({kernel: createDurableEvolutionKernel({root: runtimeRoot, require_enabled: false}), registry, verify_plan: () => true, validators: {}, cycle_validators: {}}).inspect().value);
rmSync(join(runtimeRoot, "index", "evolution.sqlite"), {force: true});
const recoveryKernel = createDurableEvolutionKernel({root: runtimeRoot, require_enabled: false});
if (recoveryKernel.diagnose().value.disposition !== "rebuild-required") throw new Error("cycle-review.recovery-diagnosis-invalid");
const recoveredResult = recoveryKernel.recover();
if (!recoveredResult.ok) throw new Error(`cycle-review.recovery-failed:${recoveredResult.reason_codes.join(",")}`);
const after = canonicalJson(createEvolutionCoordinator({kernel: recoveryKernel, registry, verify_plan: () => true, validators: {}, cycle_validators: {}}).inspect().value);
if (after !== before) throw new Error("cycle-review.recovery-drift");

const material = canonicalizeJson({
  schema_version: "are.five-cycle-exemplar-review/v1",
  review_id: "FIVE-CYCLE-EXEMPLAR-REVIEW-20260924-v1",
  executed_at: "2026-09-24T18:00:00.000Z",
  runtime_root: runtimeRoot,
  construction_override: true,
  production_definition_admission_changed: false,
  provider_calls: 0,
  model_calls: 0,
  cycle_results: cycleResults,
  source_bindings: sourceBindings,
  checks: {all_five_cycle_kinds_present: new Set(cycleResults.map((result) => result.cycle_kind)).size === 5, all_cycles_completed: cycleResults.every((result) => result.disposition === "completed" && result.completed_task_count === result.task_count), all_evidence_content_addressed: sourceBindings.every((binding) => binding.artifact_ref === `sha256:${binding.sha256}`), restart_verified: true, sqlite_loss_recovery_verified: true},
  projection_sha256: sha256(Buffer.from(after)),
  claim_ceiling: "One bounded, domain-validated, durably settled review cycle per registered cycle kind. Existing evidence is reviewed and imported; no provider/model rerun, global definition admission, engine activation, publication, release, deployment, or external effect is claimed.",
  authority_effect: "none",
  open_questions: ["When should the candidate cycle definitions receive production admission?", "Which archive tier should hold large superseded benchmark evidence after restoration tests exist?"],
});
if (!material.checks.all_five_cycle_kinds_present || !material.checks.all_cycles_completed || !material.checks.all_evidence_content_addressed) throw new Error("cycle-review.coverage-incomplete");
const report = {...material, review_digest: sha256(Buffer.from(canonicalJson(material)))};
mkdirSync(dirname(reportPath), {recursive: true, mode: 0o700});
const temporary = `${reportPath}.tmp-${process.pid}`;
const descriptor = openSync(temporary, "wx", 0o600);
try { writeFileSync(descriptor, `${canonicalJson(report)}\n`); fsyncSync(descriptor); } finally { closeSync(descriptor); }
renameSync(temporary, reportPath);
const directory = openSync(dirname(reportPath), "r"); try { fsyncSync(directory); } finally { closeSync(directory); }
const reportBytes = readFileSync(reportPath);
const reportIdentity = recoveryKernel.putArtifact({bytes: reportBytes, media_type: "application/json", semantic_binding: {cycle_ref: "cycle:review:five-cycle-coverage:20260924-v1", cycle_definition_digest: "0".repeat(64), role: "evidence", provenance_refs: [`source:${reportPath}`], claim_ceiling: report.claim_ceiling}});
if (!reportIdentity.ok) throw new Error(`cycle-review.report-store-failed:${reportIdentity.reason_codes.join(",")}`);
process.stdout.write(`${canonicalJson({ok: true, value: report, report_path: reportPath, report_artifact: reportIdentity.value, authority_effect: "none"})}\n`);
