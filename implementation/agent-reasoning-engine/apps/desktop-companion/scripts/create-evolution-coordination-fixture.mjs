#!/usr/bin/env node
// Creates an isolated candidate-only coordination ledger for the packaged UI probe.
// Never point this script at an existing Evolution root.
import {existsSync} from "node:fs";
import assert from "node:assert/strict";
import {dirname, resolve} from "node:path";
import {
  createDurableEvolutionKernel,
  createEvolutionCoordinator,
  loadCandidateCycleDefinitionRegistry,
  observeDurableEvolution,
} from "../../../packages/evolution-runtime/index.mjs";

const root = process.argv[2] && resolve(process.argv[2]);
if (process.argv.length !== 3 || !root || existsSync(root) || !existsSync(dirname(root))) {
  throw new Error("Usage: create-evolution-coordination-fixture.mjs <new-root-under-existing-parent>");
}
const registry = loadCandidateCycleDefinitionRegistry();
const definition = registry.definitions.find(item => item.definition_ref === "benchmark-research/v1");
if (!definition) throw new Error("The benchmark-research candidate definition is unavailable");
const kernel = createDurableEvolutionKernel({root, require_enabled: false});
const coordinator = createEvolutionCoordinator({kernel, registry, verify_plan: () => true,
  validators: {"validator:evidence": () => ({ok: true})},
  cycle_validators: {"benchmark-research": () => ({ok: true})},
  now: () => "2026-09-30T12:00:00.000Z"});
const cycleRef = "cycle:companion-coordination-fixture";
const base = {actor: {actor_id: "agent:companion-coordination-fixture", actor_kind: "agent"}, worker_ref: null,
  cycle_ref: cycleRef, cycle_definition_ref: definition.definition_ref,
  cycle_definition_digest: definition.definition_digest};
const plan = {schema_version: "are.research-work-plan/v1", plan_digest: "a".repeat(64),
  research_dag: {dag_digest: "b".repeat(64)}, tasks: [
    {task_id: "task:private-a", title: "A", owner: "agent", lane: "product-construction", stage: "P3",
      question_ref: "question:a", depends_on: [], completion_criteria: ["criterion:a"], validator_ref: "validator:evidence"},
    {task_id: "task:private-b", title: "B", owner: "agent", lane: "product-construction", stage: "P3",
      question_ref: "question:a", depends_on: ["task:private-a"], completion_criteria: ["criterion:b"], validator_ref: "validator:evidence"},
  ], topological_order: ["task:private-a", "task:private-b"], authority_effect: "none"};
const envelope = {schema_version: "are.evolution-effect-envelope/v1", envelope_ref: "envelope:companion-fixture",
  cycle_ref: cycleRef, cycle_definition_digest: definition.definition_digest,
  authorization_ref: "decision:companion-fixture", allowed_effect_classes: ["repository-read"],
  resource_limits: {maximum_attempts: 2, maximum_concurrency: 1, maximum_tokens: 100,
    maximum_cost: 10, maximum_elapsed_seconds: 1000}, expires_at: "2030-01-01T00:00:00.000Z",
  enabled: true, authority_effect: "none"};
const admitted = coordinator.admitPhase({...base, idempotency_key: "companion-coordination:admit",
  expected_event_revision: 0, phase: "construction", plan, envelope, prerequisite_receipt_refs: []});
if (admitted.disposition !== "accepted") throw new Error(`Phase admission failed: ${JSON.stringify(admitted)}`);
const leased = coordinator.leaseWork({...base, idempotency_key: "companion-coordination:lease",
  expected_event_revision: 1, phase: "construction", task_ref: "task:private-a", worker_ref: "worker:private",
  rationale: "synthetic UI fixture", effect_class: null, resource_request: {}, lease_seconds: 30});
if (leased.disposition !== "accepted") throw new Error(`Work lease failed: ${JSON.stringify(leased)}`);
const observed = observeDurableEvolution({root});
const expected = {phase_count: 1, work_state_counts: {planned: 1, ready: 0, leased: 1, completed: 0, blocked: 0}};
if (observed.evidence_status !== "verified" || observed.cycle_count !== 1 || observed.commit_count !== 2
  || JSON.stringify(observed).includes("task:private-a") || JSON.stringify(observed).includes("worker:private")) {
  throw new Error(`Fixture observation failed: ${JSON.stringify(observed)}`);
}
assert.deepEqual(observed.coordination_summary, expected);
assert.deepEqual(observed.phase_summaries, [{cycle_ref: cycleRef, phase: "construction",
  work_state_counts: expected.work_state_counts, event_count: 2}]);
assert.equal(observed.phase_summaries_truncated, false);
process.stdout.write(`${JSON.stringify({schema_version: "are.companion-evolution-coordination-fixture/v1",
  root, cycle_count: observed.cycle_count, commit_count: observed.commit_count,
  coordination_summary: observed.coordination_summary,
  phase_summaries: observed.phase_summaries, authority_effect: "none"})}\n`);
