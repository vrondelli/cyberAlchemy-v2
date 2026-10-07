import assert from "node:assert/strict";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import test from "node:test";

import {
  createDurableEvolutionKernel,
  createEvolutionCoordinator,
  loadCandidateCycleDefinitionRegistry,
} from "../index.mjs";

const registry = loadCandidateCycleDefinitionRegistry();
const cycleKinds = [
  "research-learning",
  "engine-improvement",
  "interaction-learning",
  "controlled-upgrade",
];
const actor = {actor_id: "agent:cycle-kind-e2e", actor_kind: "agent"};

const temporaryRoot = (kind) => mkdtempSync(resolve(tmpdir(), `are-${kind}-e2e-`));
const definitionFor = (kind) => registry.definitions.find((definition) => definition.cycle_kind === kind);

function planFor(kind) {
  const validator = `validator:${kind}`;
  const first = `task:${kind}:observe`;
  const second = `task:${kind}:decide`;
  return {
    schema_version: "are.research-work-plan/v1",
    plan_digest: definitionFor(kind).definition_digest,
    research_dag: {dag_digest: "a".repeat(64)},
    tasks: [
      {task_id: first, title: "Observe bounded evidence", owner: "agent", lane: kind, stage: "observe", question_ref: `question:${kind}`, depends_on: [], completion_criteria: [`criterion:${kind}:observed`], validator_ref: validator},
      {task_id: second, title: "Make bounded decision", owner: "agent", lane: kind, stage: "decide", question_ref: `question:${kind}`, depends_on: [first], completion_criteria: [`criterion:${kind}:decided`], validator_ref: validator},
    ],
    topological_order: [first, second],
    authority_effect: "none",
  };
}

function envelopeFor(kind, cycleRef) {
  return {
    schema_version: "are.evolution-effect-envelope/v1",
    envelope_ref: `envelope:${kind}:e2e`,
    cycle_ref: cycleRef,
    cycle_definition_digest: definitionFor(kind).definition_digest,
    authorization_ref: "decision:user-cycle-kind-e2e",
    allowed_effect_classes: ["repository-read"],
    resource_limits: {maximum_attempts: 2, maximum_concurrency: 1, maximum_tokens: 20, maximum_cost: 2, maximum_elapsed_seconds: 120},
    expires_at: "2030-01-01T00:00:00.000Z",
    enabled: true,
    authority_effect: "none",
  };
}

function base(kind, cycleRef, revision, idempotencyKey) {
  const definition = definitionFor(kind);
  return {
    idempotency_key: idempotencyKey,
    expected_event_revision: revision,
    actor,
    worker_ref: null,
    cycle_ref: cycleRef,
    cycle_definition_ref: definition.definition_ref,
    cycle_definition_digest: definition.definition_digest,
  };
}

function coordinatorFor(kernel, kind) {
  const validatorRef = `validator:${kind}`;
  return createEvolutionCoordinator({
    kernel,
    registry,
    verify_plan: (plan) => plan.tasks.every((task) => task.lane === kind),
    validators: {
      [validatorRef]: ({task, evidence}) => ({
        ok: evidence.length === 1
          && evidence[0].criterion_id === task.completion_criteria[0]
          && evidence[0].artifact_digest === "c".repeat(64),
      }),
    },
    cycle_validators: {
      [kind]: ({definition, plan, envelope}) => ({
        ok: definition.cycle_kind === kind
          && plan.tasks.every((task) => task.lane === kind)
          && envelope.allowed_effect_classes.length === 1
          && envelope.allowed_effect_classes[0] === "repository-read",
      }),
    },
    now: () => "2026-09-23T18:00:00.000Z",
  });
}

function settleReadyTask({coordinator, kind, cycleRef, taskRef, revision}) {
  const leased = coordinator.leaseWork({
    ...base(kind, cycleRef, revision, `${cycleRef}:lease:${revision}`),
    phase: "validation",
    task_ref: taskRef,
    worker_ref: `worker:${kind}`,
    rationale: "bounded construction validation",
    effect_class: "repository-read",
    resource_request: {tokens: 2, cost: 0.1, elapsed_seconds: 3},
    lease_seconds: 30,
  });
  assert.equal(leased.disposition, "accepted");
  const phase = coordinator.inspect().value.phases[0];
  const lease = phase.work_items.find((item) => item.task_id === taskRef).active_lease;
  const criterion = phase.work_items.find((item) => item.task_id === taskRef).completion_criteria[0];
  const settled = coordinator.settleWork({
    ...base(kind, cycleRef, revision + 1, `${cycleRef}:settle:${revision}`),
    phase: "validation",
    task_ref: taskRef,
    lease_ref: lease.lease_ref,
    fencing_token: lease.fencing_token,
    outcome: "succeeded",
    evidence: [{criterion_id: criterion, artifact_ref: `sha256:${"c".repeat(64)}`, artifact_digest: "c".repeat(64)}],
    accounting: {tokens: 1, cost: 0.05, elapsed_seconds: 2},
  });
  assert.equal(settled.disposition, "accepted");
}

for (const kind of cycleKinds) {
  test(`${kind} completes a durable coordinated lifecycle and recovers byte-identical state`, () => {
    const root = temporaryRoot(kind);
    const cycleRef = `cycle:${kind}:e2e`;
    try {
      const kernel = createDurableEvolutionKernel({root, require_enabled: false});
      const coordinator = coordinatorFor(kernel, kind);
      const plan = planFor(kind);
      const admitted = coordinator.admitPhase({
        ...base(kind, cycleRef, 0, `${cycleRef}:admit`),
        phase: "validation",
        plan,
        envelope: envelopeFor(kind, cycleRef),
        prerequisite_receipt_refs: [],
      });
      assert.equal(admitted.disposition, "accepted");
      assert.deepEqual(coordinator.inspect().value.phases[0].frontier, [plan.topological_order[0]]);

      settleReadyTask({coordinator, kind, cycleRef, taskRef: plan.topological_order[0], revision: 1});
      assert.deepEqual(coordinator.inspect().value.phases[0].frontier, [plan.topological_order[1]]);
      settleReadyTask({coordinator, kind, cycleRef, taskRef: plan.topological_order[1], revision: 3});

      const completed = coordinator.inspect().value;
      const phase = completed.phases[0];
      assert.deepEqual(phase.work_items.map((item) => item.state), ["completed", "completed"]);
      assert.deepEqual(phase.frontier, []);
      assert.deepEqual(phase.accounting, {attempts: 2, tokens: 2, cost: 0.1, elapsed_seconds: 4});
      assert.deepEqual(coordinatorFor(createDurableEvolutionKernel({root, require_enabled: false}), kind).inspect().value, completed);

      rmSync(join(root, "index", "evolution.sqlite"), {force: true});
      const recovering = createDurableEvolutionKernel({root, require_enabled: false});
      assert.equal(recovering.diagnose().value.disposition, "rebuild-required");
      assert.deepEqual(recovering.recover().value.coordination, completed);
    } finally {
      rmSync(root, {recursive: true, force: true});
    }
  });

  test(`${kind} remains non-runnable through the production-default engine`, () => {
    const root = temporaryRoot(`${kind}-disabled`);
    const cycleRef = `cycle:${kind}:disabled`;
    try {
      const coordinator = coordinatorFor(createDurableEvolutionKernel({root}), kind);
      const rejected = coordinator.admitPhase({
        ...base(kind, cycleRef, 0, `${cycleRef}:admit`),
        phase: "validation",
        plan: planFor(kind),
        envelope: envelopeFor(kind, cycleRef),
        prerequisite_receipt_refs: [],
      });
      assert.equal(rejected.disposition, "rejected");
      assert.deepEqual(rejected.value.receipt.reason_codes, ["command.definition-not-enabled"]);
      assert.deepEqual(coordinator.inspect().value.phases, []);
    } finally {
      rmSync(root, {recursive: true, force: true});
    }
  });
}

test("each non-benchmark cycle requires its own validator binding", () => {
  const kind = "interaction-learning";
  const root = temporaryRoot("missing-cycle-validator");
  const cycleRef = "cycle:interaction-learning:missing-validator";
  try {
    const kernel = createDurableEvolutionKernel({root, require_enabled: false});
    const coordinator = createEvolutionCoordinator({
      kernel,
      registry,
      verify_plan: () => true,
      validators: {"validator:interaction-learning": () => ({ok: true})},
      cycle_validators: {},
      now: () => "2026-09-23T18:00:00.000Z",
    });
    const rejected = coordinator.admitPhase({
      ...base(kind, cycleRef, 0, `${cycleRef}:admit`),
      phase: "validation",
      plan: planFor(kind),
      envelope: envelopeFor(kind, cycleRef),
      prerequisite_receipt_refs: [],
    });
    assert.deepEqual(rejected.reason_codes, ["coordination.cycle-validator-missing:interaction-learning"]);
    assert.equal(kernel.inspect().value.commit_count, 0);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
