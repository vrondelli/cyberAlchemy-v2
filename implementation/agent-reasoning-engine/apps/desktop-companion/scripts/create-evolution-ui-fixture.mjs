#!/usr/bin/env node
// Creates one or two isolated, candidate-only durable cycles for a packaged UI probe.
// Never point this script at an existing Evolution root.
import {existsSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {
  createDurableEvolutionKernel,
  loadCandidateCycleDefinitionRegistry,
  materializeEvolutionCommand,
  observeDurableEvolution,
} from "../../../packages/evolution-runtime/index.mjs";

const root = process.argv[2] && resolve(process.argv[2]);
const twoDefinitions = process.argv[3] === "--two-definitions";
if ((process.argv.length !== 3 && !(process.argv.length === 4 && twoDefinitions))
  || !root || existsSync(root) || !existsSync(dirname(root))) {
  throw new Error("Usage: create-evolution-ui-fixture.mjs <new-root-under-existing-parent> [--two-definitions]");
}
const definition = loadCandidateCycleDefinitionRegistry().definitions.find(item => item.definition_ref === "benchmark-research/v1");
if (!definition) throw new Error("The benchmark-research candidate definition is unavailable");
const kernel = createDurableEvolutionKernel({root, require_enabled: false});
const command = materializeEvolutionCommand({
  idempotency_key: "companion-ui-fixture:diagnose:001",
  expected_event_revision: 0,
  actor: {actor_id: "agent:companion-ui-fixture", actor_kind: "agent"},
  worker_ref: null,
  cycle_ref: "cycle:companion-ui-fixture",
  cycle_definition_ref: definition.definition_ref,
  cycle_definition_digest: definition.definition_digest,
  operation: "cycle.diagnose",
  target: {record_kind: "experiment", record_ref: "experiment:companion-ui-fixture"},
  payload: {objective_ref: "objective:companion-ui-fixture"},
});
const result = kernel.process(command, {event_drafts: [{event_type: "diagnosis-recorded", payload: {diagnosis_ref: "diagnosis:companion-ui-fixture", disposition: "active"}}]});
if (!result.ok || result.disposition !== "accepted") throw new Error(`Fixture construction failed: ${JSON.stringify(result)}`);
if (twoDefinitions) {
  const secondDefinition = loadCandidateCycleDefinitionRegistry().definitions.find(item => item.definition_ref === "engine-improvement/v1");
  if (!secondDefinition) throw new Error("The engine-improvement candidate definition is unavailable");
  const second = materializeEvolutionCommand({
    idempotency_key: "companion-ui-fixture:technique:001",
    expected_event_revision: 0,
    actor: {actor_id: "agent:companion-ui-fixture", actor_kind: "agent"},
    worker_ref: null,
    cycle_ref: "cycle:companion-engine-fixture",
    cycle_definition_ref: secondDefinition.definition_ref,
    cycle_definition_digest: secondDefinition.definition_digest,
    operation: "technique.register",
    target: {record_kind: "technique", record_ref: "technique:companion-engine-fixture"},
    payload: {objective_ref: "objective:companion-engine-fixture"},
  });
  const secondResult = kernel.process(second, {event_drafts: [{event_type: "technique-registered",
    payload: {technique_ref: "technique:companion-engine-fixture", disposition: "continue-comparison"}}]});
  if (!secondResult.ok || secondResult.disposition !== "accepted") throw new Error(`Second fixture construction failed: ${JSON.stringify(secondResult)}`);
}
const observed = observeDurableEvolution({root});
const expectedCount = twoDefinitions ? 2 : 1;
if (observed.evidence_status !== "verified" || observed.cycle_count !== expectedCount || observed.commit_count !== expectedCount) {
  throw new Error(`Fixture observation failed: ${JSON.stringify(observed)}`);
}
process.stdout.write(`${JSON.stringify({schema_version: "are.companion-evolution-ui-fixture/v1", root, cycle_count: expectedCount, commit_count: expectedCount, authority_effect: "none"})}\n`);
