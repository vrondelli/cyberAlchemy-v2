import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  createDurableEvolutionKernel,
  createEvolutionCoordinator,
  loadCandidateCycleDefinitionRegistry,
  materializeCoordinationCommand,
} from "../index.mjs";

const registry = loadCandidateCycleDefinitionRegistry();
const definition = registry.definitions.find((item) => item.definition_ref === "benchmark-research/v1");
const actor = {actor_id: "agent:p3-test", actor_kind: "agent"};
const plan = {
  schema_version: "are.research-work-plan/v1",
  plan_digest: "a".repeat(64),
  research_dag: {dag_digest: "b".repeat(64)},
  tasks: [
    {task_id: "task:a", title: "A", owner: "agent", lane: "product-construction", stage: "P3", question_ref: "question:a", depends_on: [], completion_criteria: ["criterion:a"], validator_ref: "validator:evidence"},
    {task_id: "task:b", title: "B", owner: "agent", lane: "product-construction", stage: "P3", question_ref: "question:a", depends_on: ["task:a"], completion_criteria: ["criterion:b"], validator_ref: "validator:evidence"},
  ],
  topological_order: ["task:a", "task:b"],
  authority_effect: "none",
};

function temporaryRoot() {
  return mkdtempSync(resolve(tmpdir(), "are-evolution-coordination-"));
}

function envelope(cycleRef) {
  return {
    schema_version: "are.evolution-effect-envelope/v1",
    envelope_ref: `envelope:${cycleRef}`,
    cycle_ref: cycleRef,
    cycle_definition_digest: definition.definition_digest,
    authorization_ref: "decision:pl-06-a",
    allowed_effect_classes: ["repository-read"],
    resource_limits: {maximum_attempts: 2, maximum_concurrency: 1, maximum_tokens: 100, maximum_cost: 10, maximum_elapsed_seconds: 1000},
    expires_at: "2030-01-01T00:00:00.000Z",
    enabled: true,
    authority_effect: "none",
  };
}

function harness({clock = "2026-09-22T12:00:00.000Z", validators = null} = {}) {
  const root = temporaryRoot();
  let current = clock;
  const kernel = createDurableEvolutionKernel({root, require_enabled: false});
  const coordinator = createEvolutionCoordinator({
    kernel,
    registry,
    verify_plan: () => true,
    validators: validators ?? {"validator:evidence": () => ({ok: true})},
    cycle_validators: {"benchmark-research": () => ({ok: true})},
    now: () => current,
  });
  return {root, kernel, coordinator, setClock(value) { current = value; }};
}

function base(cycleRef, revision, id) {
  return {idempotency_key: id, expected_event_revision: revision, actor, worker_ref: null, cycle_ref: cycleRef, cycle_definition_ref: definition.definition_ref, cycle_definition_digest: definition.definition_digest};
}

function admit(h, cycleRef = "cycle:p3") {
  return h.coordinator.admitPhase({...base(cycleRef, 0, `${cycleRef}:admit`), phase: "construction", plan, envelope: envelope(cycleRef), prerequisite_receipt_refs: []});
}

function evidence(criterion) {
  return [{criterion_id: criterion, artifact_ref: `sha256:${"c".repeat(64)}`, artifact_digest: "c".repeat(64)}];
}

test("P3 derives ready work, leases one caller, settles evidence, and reconstructs after restart", () => {
  const h = harness();
  try {
    assert.equal(admit(h).disposition, "accepted");
    assert.deepEqual(h.coordinator.inspect().value.phases[0].frontier, ["task:a"]);
    const leaseA = h.coordinator.leaseWork({...base("cycle:p3", 1, "cycle:p3:lease-a"), phase: "construction", task_ref: "task:a", worker_ref: "worker:one", rationale: "first dependency", effect_class: null, resource_request: {tokens: 5, cost: 1, elapsed_seconds: 10}, lease_seconds: 30});
    assert.equal(leaseA.disposition, "accepted");
    const activeA = h.coordinator.inspect().value.phases[0].work_items[0].active_lease;
    const stale = h.coordinator.leaseWork({...base("cycle:p3", 1, "cycle:p3:lease-a-race"), phase: "construction", task_ref: "task:a", worker_ref: "worker:two", rationale: "race", effect_class: null, resource_request: {}, lease_seconds: 30});
    assert.ok(stale.reason_codes.includes("command.stale-revision"));
    assert.equal(h.coordinator.settleWork({...base("cycle:p3", 2, "cycle:p3:settle-a"), phase: "construction", task_ref: "task:a", lease_ref: activeA.lease_ref, fencing_token: activeA.fencing_token, outcome: "succeeded", evidence: evidence("criterion:a"), accounting: {tokens: 4, cost: 0.5, elapsed_seconds: 8}}).disposition, "accepted");
    assert.deepEqual(h.coordinator.inspect().value.phases[0].frontier, ["task:b"]);
    const leaseB1 = h.coordinator.leaseWork({...base("cycle:p3", 3, "cycle:p3:lease-b-1"), phase: "construction", task_ref: "task:b", worker_ref: "worker:one", rationale: "dependent", effect_class: "repository-read", resource_request: {}, lease_seconds: 30});
    const activeB1 = h.coordinator.inspect().value.phases[0].work_items[1].active_lease;
    assert.equal(leaseB1.disposition, "accepted");
    assert.equal(h.coordinator.settleWork({...base("cycle:p3", 4, "cycle:p3:settle-b-1"), phase: "construction", task_ref: "task:b", lease_ref: activeB1.lease_ref, fencing_token: activeB1.fencing_token, outcome: "retryable-failure", evidence: [], accounting: {tokens: 1, cost: 0, elapsed_seconds: 1}}).disposition, "accepted");
    assert.deepEqual(h.coordinator.inspect().value.phases[0].frontier, ["task:b"]);
    const leaseB2 = h.coordinator.leaseWork({...base("cycle:p3", 5, "cycle:p3:lease-b-2"), phase: "construction", task_ref: "task:b", worker_ref: "worker:two", rationale: "bounded retry", effect_class: null, resource_request: {}, lease_seconds: 30});
    assert.equal(leaseB2.disposition, "accepted");
    const activeB2 = h.coordinator.inspect().value.phases[0].work_items[1].active_lease;
    assert.equal(h.coordinator.settleWork({...base("cycle:p3", 6, "cycle:p3:settle-b-2"), phase: "construction", task_ref: "task:b", lease_ref: activeB2.lease_ref, fencing_token: activeB2.fencing_token, outcome: "succeeded", evidence: evidence("criterion:b"), accounting: {tokens: 2, cost: 0.2, elapsed_seconds: 2}}).disposition, "accepted");
    assert.ok(h.coordinator.settleWork({...base("cycle:p3", 7, "cycle:p3:settle-b-duplicate"), phase: "construction", task_ref: "task:b", lease_ref: activeB2.lease_ref, fencing_token: activeB2.fencing_token, outcome: "succeeded", evidence: evidence("criterion:b"), accounting: {}}).reason_codes.includes("coordination.active-lease-required"));
    const before = h.coordinator.inspect().value;
    const freshKernel = createDurableEvolutionKernel({root: h.root, require_enabled: false});
    const fresh = createEvolutionCoordinator({kernel: freshKernel, registry, verify_plan: () => true, validators: {"validator:evidence": () => ({ok: true})}, cycle_validators: {"benchmark-research": () => ({ok: true})}});
    assert.deepEqual(fresh.inspect().value, before);
    assert.deepEqual(before.phases[0].work_items.map((item) => item.state), ["completed", "completed"]);
    assert.equal(before.phases[0].accounting.attempts, 3);
  } finally { rmSync(h.root, {recursive: true, force: true}); }
});

test("expired leases require explicit recovery before redispatch", () => {
  const h = harness();
  try {
    admit(h);
    h.coordinator.leaseWork({...base("cycle:p3", 1, "lease:expiring"), phase: "construction", task_ref: "task:a", worker_ref: "worker:one", rationale: "bounded", effect_class: null, resource_request: {}, lease_seconds: 1});
    h.setClock("2026-09-22T12:00:02.000Z");
    const blocked = h.coordinator.leaseWork({...base("cycle:p3", 2, "lease:premature-redispatch"), phase: "construction", task_ref: "task:a", worker_ref: "worker:two", rationale: "too early", effect_class: null, resource_request: {}, lease_seconds: 1});
    assert.ok(blocked.reason_codes.includes("coordination.recovery-required"));
    assert.equal(h.coordinator.recover({...base("cycle:p3", 2, "recover:expired"), phase: "construction"}).disposition, "accepted");
    assert.equal(h.coordinator.leaseWork({...base("cycle:p3", 3, "lease:after-recovery"), phase: "construction", task_ref: "task:a", worker_ref: "worker:two", rationale: "after recovery", effect_class: null, resource_request: {}, lease_seconds: 10}).disposition, "accepted");
  } finally { rmSync(h.root, {recursive: true, force: true}); }
});

test("missing validators, out-of-envelope effects, over-budget work, and bad evidence fail closed", () => {
  const missing = harness({validators: {}});
  try {
    assert.ok(admit(missing).reason_codes.includes("coordination.validator-missing:validator:evidence"));
    assert.equal(missing.kernel.inspect().value.commit_count, 0);
  } finally { rmSync(missing.root, {recursive: true, force: true}); }

  const h = harness({validators: {"validator:evidence": () => ({ok: false, reason_codes: ["evidence.rejected"]})}});
  try {
    admit(h);
    assert.ok(h.coordinator.leaseWork({...base("cycle:p3", 1, "lease:external"), phase: "construction", task_ref: "task:a", worker_ref: "worker:one", rationale: "forbidden", effect_class: "external-dispatch", resource_request: {}, lease_seconds: 10}).reason_codes.includes("coordination.external-dispatch-disabled"));
    assert.ok(h.coordinator.leaseWork({...base("cycle:p3", 1, "lease:over-budget"), phase: "construction", task_ref: "task:a", worker_ref: "worker:one", rationale: "too large", effect_class: null, resource_request: {tokens: 101}, lease_seconds: 10}).reason_codes.includes("coordination.resource-budget-exceeded"));
    h.coordinator.leaseWork({...base("cycle:p3", 1, "lease:valid"), phase: "construction", task_ref: "task:a", worker_ref: "worker:one", rationale: "valid", effect_class: null, resource_request: {}, lease_seconds: 10});
    const lease = h.coordinator.inspect().value.phases[0].work_items[0].active_lease;
    assert.ok(h.coordinator.settleWork({...base("cycle:p3", 2, "settle:bad-evidence"), phase: "construction", task_ref: "task:a", lease_ref: lease.lease_ref, fencing_token: lease.fencing_token, outcome: "succeeded", evidence: evidence("criterion:a"), accounting: {}}).reason_codes.includes("evidence.rejected"));
  } finally { rmSync(h.root, {recursive: true, force: true}); }
});

test("typed handoffs bind exact offers and reject substitution", () => {
  const h = harness();
  try {
    assert.equal(h.coordinator.offerHandoff({...base("cycle:source", 0, "handoff:offer"), handoff_ref: "handoff:finding-1", handoff_type: "research-finding", target_cycle_kind: "benchmark-research", artifact_refs: [`sha256:${"d".repeat(64)}`], claim_refs: ["claim:one"]}).disposition, "accepted");
    const offer = h.coordinator.inspect().value.handoff_offers[0];
    const substituted = h.coordinator.acceptHandoff({...base("cycle:receiver", 0, "handoff:bad-accept"), handoff_ref: offer.handoff_ref, offer_digest: "e".repeat(64), accepted_artifact_refs: offer.artifact_refs, accepted_claim_refs: offer.claim_refs});
    assert.deepEqual(substituted.reason_codes, ["coordination.handoff-substitution"]);
    assert.equal(h.coordinator.acceptHandoff({...base("cycle:receiver", 0, "handoff:accept"), handoff_ref: offer.handoff_ref, offer_digest: offer.offer_digest, accepted_artifact_refs: offer.artifact_refs, accepted_claim_refs: offer.claim_refs}).disposition, "accepted");
    assert.equal(h.coordinator.inspect().value.handoff_acceptances[0].acceptance_receipt_ref.startsWith("evolution-coordination-receipt:"), true);
  } finally { rmSync(h.root, {recursive: true, force: true}); }
});

test("production defaults durably reject coordination for disabled definitions", () => {
  const root = temporaryRoot();
  try {
    const kernel = createDurableEvolutionKernel({root});
    const command = materializeCoordinationCommand({...base("cycle:disabled", 0, "coordination:disabled"), operation: "coordination.recover", target: {record_kind: "phase", record_ref: "phase:disabled"}, payload: {phase: "construction"}});
    const result = kernel.processCoordination(command, {event_drafts: [{event_type: "leases-recovered", payload: {phase: "construction", recovered_at: "2026-09-22T12:00:00.000Z", expired_leases: []}}]});
    assert.equal(result.disposition, "rejected");
    assert.deepEqual(result.value.receipt.reason_codes, ["command.definition-not-enabled"]);
    assert.equal(kernel.inspect().value.coordination, undefined);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("the coordination schema is closed and the JSON CLI rejects agent-supplied state", () => {
  const schema = JSON.parse(readFileSync(new URL("../schemas/coordination-protocol-v1.schema.json", import.meta.url)));
  for (const name of ["command", "event", "receipt", "result"]) assert.equal(schema.$defs[name].additionalProperties, false);
  const root = temporaryRoot();
  try {
    const cli = fileURLToPath(new URL("../bin/coordinate.mjs", import.meta.url));
    const inspect = spawnSync(process.execPath, [cli, "--root", root], {input: JSON.stringify({schema_version: "are.evolution-coordination-cli-request/v1", operation: "inspect", input: {}}), encoding: "utf8"});
    assert.equal(inspect.status, 0, inspect.stderr);
    assert.deepEqual(JSON.parse(inspect.stdout).value.phases, []);
    const injection = spawnSync(process.execPath, [cli, "--root", root], {input: JSON.stringify({schema_version: "are.evolution-coordination-cli-request/v1", operation: "inspect", input: {state: "completed"}}), encoding: "utf8"});
    assert.equal(injection.status, 2);
    assert.deepEqual(JSON.parse(injection.stdout).reason_codes, ["coordination.request-invalid"]);
  } finally { rmSync(root, {recursive: true, force: true}); }
});
