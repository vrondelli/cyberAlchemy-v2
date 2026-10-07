import {createHash} from "node:crypto";
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {join, resolve} from "node:path";

import {canonicalJson, canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {createEvolutionCoordinator} from "./coordination-v1.mjs";
import {createDurableEvolutionKernel} from "./durable-kernel-v1.mjs";
import {loadCandidateCycleDefinitionRegistry} from "./protocol-v1.mjs";
import {runLinkedCycleFirstResult, verifyLinkedCycleFirstResult} from "./linked-cycle-benchmark-v1.mjs";

export const LINKED_CYCLE_FIRST_MILESTONE_VERSION = "are.linked-cycle-first-milestone/v1";

const freeze = (value) => deepFreeze(canonicalizeJson(value));
const digest = (value) => createHash("sha256").update(canonicalJson(canonicalizeJson(value))).digest("hex");
const seal = (material, key) => freeze({...material, [key]: digest(material)});
const load = (path) => JSON.parse(readFileSync(path, "utf8"));

function writeJson(path, value) {
  writeFileSync(path, `${canonicalJson(value)}\n`, {encoding: "utf8", flag: "wx"});
  return {path, sha256: createHash("sha256").update(readFileSync(path)).digest("hex")};
}

function definitionFor(registry, kind) {
  const definition = registry.definitions.find((candidate) => candidate.cycle_kind === kind);
  if (!definition) throw new Error(`linked-cycle.definition-missing:${kind}`);
  return definition;
}

function envelopeFor(definition, cycleRef) {
  return {
    schema_version: "are.evolution-effect-envelope/v1",
    envelope_ref: `envelope:${cycleRef.slice("cycle:".length)}:fixed-replay-v1`,
    cycle_ref: cycleRef,
    cycle_definition_digest: definition.definition_digest,
    authorization_ref: "decision:user-linked-cycle-first-milestone",
    allowed_effect_classes: ["repository-read"],
    resource_limits: {maximum_attempts: 32, maximum_concurrency: 2, maximum_tokens: null, maximum_cost: null, maximum_elapsed_seconds: 3600},
    expires_at: "2030-01-01T00:00:00.000Z",
    enabled: true,
    authority_effect: "none",
  };
}

function commandBase(definition, cycleRef, revision, idempotencyKey) {
  return {idempotency_key: idempotencyKey, expected_event_revision: revision, actor: {actor_id: "agent:linked-cycle-first-milestone", actor_kind: "agent"}, worker_ref: null, cycle_ref: cycleRef, cycle_definition_ref: definition.definition_ref, cycle_definition_digest: definition.definition_digest};
}

function createValidators(plans, artifactByTask) {
  const validators = {};
  for (const plan of plans) for (const task of plan.tasks) {
    validators[task.validator_ref] = ({task: actualTask, evidence}) => {
      const artifact = artifactByTask.get(actualTask.task_id);
      const criteria = new Set(evidence.map((item) => item.criterion_id));
      return {ok: artifact !== undefined && actualTask.task_id === task.task_id
        && actualTask.completion_criteria.every((criterion) => criteria.has(criterion))
        && evidence.every((item) => item.artifact_digest === artifact.sha256)};
    };
  }
  return validators;
}

function settleTask({coordinator, definition, cycleRef, task, artifact, revisions}) {
  let revision = revisions.get(cycleRef);
  const leased = coordinator.leaseWork({
    ...commandBase(definition, cycleRef, revision, `${cycleRef}:${task.task_id}:lease`),
    phase: "fixed-replay",
    task_ref: task.task_id,
    worker_ref: "worker:linked-cycle-fixed-replay",
    rationale: "bounded provider-free fixed replay",
    effect_class: "repository-read",
    resource_request: {tokens: 0, cost: 0, elapsed_seconds: 1},
    lease_seconds: 300,
  });
  if (leased.disposition !== "accepted") throw new Error(`linked-cycle.lease-rejected:${task.task_id}:${leased.reason_codes?.join(",")}`);
  revisions.set(cycleRef, ++revision);
  const phase = coordinator.inspect().value.phases.find((candidate) => candidate.cycle_ref === cycleRef && candidate.phase === "fixed-replay");
  const work = phase.work_items.find((candidate) => candidate.task_id === task.task_id);
  const settled = coordinator.settleWork({
    ...commandBase(definition, cycleRef, revision, `${cycleRef}:${task.task_id}:settle`),
    phase: "fixed-replay",
    task_ref: task.task_id,
    lease_ref: work.active_lease.lease_ref,
    fencing_token: work.active_lease.fencing_token,
    outcome: "succeeded",
    evidence: task.completion_criteria.map((criterion) => ({criterion_id: criterion, artifact_ref: artifact.relative_path, artifact_digest: artifact.sha256})),
    accounting: {tokens: 0, cost: 0, elapsed_seconds: 1},
  });
  if (settled.disposition !== "accepted") throw new Error(`linked-cycle.settlement-rejected:${task.task_id}:${settled.reason_codes?.join(",")}`);
  revisions.set(cycleRef, revision + 1);
}

export function runLinkedCycleFirstMilestone({output_root: outputRoot, program_root: programRoot}) {
  const output = resolve(outputRoot);
  const program = resolve(programRoot);
  if (existsSync(output)) throw new Error("linked-cycle.output-root-exists");
  mkdirSync(output, {recursive: true});
  const runtimeRoot = join(output, "runtime");
  mkdirSync(runtimeRoot, {recursive: true});

  const plans = {
    longitudinal: load(join(program, "interaction-learning", "work-plan.json")),
    automation: load(join(program, "authorized-automation", "work-plan.json")),
  };
  const result = runLinkedCycleFirstResult();
  if (!verifyLinkedCycleFirstResult(result)) throw new Error("linked-cycle.result-invalid");

  const freezeRecord = seal({
    schema_version: "are.linked-cycle-fixture-freeze/v1",
    program_ref: result.program_ref,
    longitudinal_fixture_digest: result.longitudinal.fixture_digest,
    automation_fixture_digest: result.automation.fixture_digest,
    scenario_counts: {longitudinal: result.longitudinal.scenario_count, automation: result.automation.scenario_count},
    predecessor_refs: ["interaction-learning-objective-cycle-v1:IL-H04-deterministic-continuity-renderer-v4"],
    excluded_content: ["raw-reasoning", "raw-conversation-text", "tool-payloads", "credentials", "environment-dumps"],
    authority_effect: "none",
  }, "freeze_digest");
  const writes = [];
  writes.push({...writeJson(join(output, "FIXTURE-FREEZE.json"), freezeRecord), relative_path: "FIXTURE-FREEZE.json"});
  writes.push({...writeJson(join(output, "LONGITUDINAL-RESULT.json"), result.longitudinal), relative_path: "LONGITUDINAL-RESULT.json"});
  writes.push({...writeJson(join(output, "AUTOMATION-RESULT.json"), result.automation), relative_path: "AUTOMATION-RESULT.json"});
  writes.push({...writeJson(join(output, "FIRST-RESULT.json"), result), relative_path: "FIRST-RESULT.json"});

  const artifactByTask = new Map();
  const milestoneTasks = [
    ...plans.longitudinal.tasks.slice(0, 7).map((task) => ({task, result_digest: result.longitudinal.result_digest, result_ref: "LONGITUDINAL-RESULT.json"})),
    ...plans.automation.tasks.filter((task) => ["aa.freeze", "aa.baseline", "aa.controller"].includes(task.task_id)).map((task) => ({task, result_digest: result.automation.result_digest, result_ref: "AUTOMATION-RESULT.json"})),
  ];
  const taskRoot = join(output, "task-evidence");
  mkdirSync(taskRoot, {recursive: true});
  for (const entry of milestoneTasks) {
    const record = seal({schema_version: "are.linked-cycle-task-evidence/v1", task_ref: entry.task.task_id, criterion_ids: entry.task.completion_criteria, result_ref: entry.result_ref, result_digest: entry.result_digest, evidence_posture: "synthetic-fixed-fixture", authority_effect: "none"}, "evidence_digest");
    const relativePath = `task-evidence/${entry.task.task_id}.json`;
    const written = {...writeJson(join(output, relativePath), record), relative_path: relativePath};
    writes.push(written);
    artifactByTask.set(entry.task.task_id, written);
  }

  const registry = loadCandidateCycleDefinitionRegistry();
  const definitions = {longitudinal: definitionFor(registry, "interaction-learning"), automation: definitionFor(registry, "engine-improvement")};
  const kernel = createDurableEvolutionKernel({root: runtimeRoot, require_enabled: false});
  const validators = createValidators([plans.longitudinal, plans.automation], artifactByTask);
  const coordinator = createEvolutionCoordinator({
    kernel,
    registry,
    validators,
    verify_plan: (plan) => [plans.longitudinal.plan_digest, plans.automation.plan_digest].includes(plan.plan_digest),
    cycle_validators: {
      "interaction-learning": ({phase, plan, envelope}) => ({ok: phase === "fixed-replay" && plan.plan_digest === plans.longitudinal.plan_digest && envelope.allowed_effect_classes.join(",") === "repository-read"}),
      "engine-improvement": ({phase, plan, envelope}) => ({ok: phase === "fixed-replay" && plan.plan_digest === plans.automation.plan_digest && envelope.allowed_effect_classes.join(",") === "repository-read"}),
    },
    now: () => "2026-09-25T20:00:00.000Z",
  });
  const revisions = new Map();

  for (const [key, cycleRef] of [["longitudinal", "cycle:il-lpc-01"], ["automation", "cycle:ei-aa-01"]]) {
    const admitted = coordinator.admitPhase({...commandBase(definitions[key], cycleRef, 0, `${cycleRef}:fixed-replay:admit`), phase: "fixed-replay", plan: plans[key], envelope: envelopeFor(definitions[key], cycleRef), prerequisite_receipt_refs: []});
    if (admitted.disposition !== "accepted") throw new Error(`linked-cycle.admission-rejected:${key}:${admitted.reason_codes?.join(",")}`);
    revisions.set(cycleRef, 1);
  }

  for (const task of plans.longitudinal.tasks.slice(0, 7)) settleTask({coordinator, definition: definitions.longitudinal, cycleRef: "cycle:il-lpc-01", task, artifact: artifactByTask.get(task.task_id), revisions});
  for (const taskId of ["aa.freeze", "aa.baseline", "aa.controller"]) {
    const task = plans.automation.tasks.find((candidate) => candidate.task_id === taskId);
    settleTask({coordinator, definition: definitions.automation, cycleRef: "cycle:ei-aa-01", task, artifact: artifactByTask.get(task.task_id), revisions});
  }

  const completed = coordinator.inspect().value;
  const restarted = createEvolutionCoordinator({kernel: createDurableEvolutionKernel({root: runtimeRoot, require_enabled: false}), registry}).inspect().value;
  const restartParity = canonicalJson(completed) === canonicalJson(restarted);
  const indexPath = join(runtimeRoot, "index", "evolution.sqlite");
  rmSync(indexPath, {force: true});
  const recovering = createDurableEvolutionKernel({root: runtimeRoot, require_enabled: false});
  const diagnosis = recovering.diagnose();
  const recovered = recovering.recover();
  const recoveryParity = canonicalJson(completed) === canonicalJson(recovered.value.coordination);
  if (!restartParity || diagnosis.value.disposition !== "rebuild-required" || !recoveryParity) throw new Error("linked-cycle.coordinator-recovery-parity-failed");

  const receipt = seal({
    schema_version: "are.linked-cycle-first-milestone-receipt/v1",
    program_ref: result.program_ref,
    result_ref: "FIRST-RESULT.json",
    result_digest: result.result_digest,
    fixture_freeze_digest: freezeRecord.freeze_digest,
    phase_state: {
      longitudinal_completed_tasks: plans.longitudinal.tasks.slice(0, 7).map((task) => task.task_id),
      longitudinal_next_frontier: ["lpc.shadow"],
      automation_completed_tasks: ["aa.freeze", "aa.baseline", "aa.controller"],
      automation_next_frontier: ["aa.accept-handoff"],
      automation_waiting_for: "typed-supported-cycle-1-handoff",
    },
    coordinator: {restart_parity: restartParity, sqlite_loss_diagnosis: diagnosis.value.disposition, recovery_parity: recoveryParity, projection_digest: digest(completed)},
    artifacts: writes.map(({relative_path, sha256}) => ({relative_path, sha256})).sort((left, right) => left.relative_path.localeCompare(right.relative_path)),
    activation: "none",
    authority_effect: "none",
  }, "receipt_digest");
  writeJson(join(output, "RUN-RECEIPT.json"), receipt);
  return receipt;
}
