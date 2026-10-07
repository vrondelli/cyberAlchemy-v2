import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";
import {
  assessCommandReplay,
  assessCycleDefinitionCompatibility,
  loadCandidateCycleDefinitionRegistry,
  materializeCommandReceipt,
  materializeEvolutionCommand,
  materializeEvolutionEvent,
  materializeEvolutionResult,
  sealCycleDefinition,
  verifyCommandReceipt,
  verifyArtifactIdentity,
  verifyCycleDefinitionRegistry,
  verifyEffectEnvelope,
  verifyEvolutionCommand,
  verifyEvolutionEvent,
  verifyEvolutionResult,
  verifyHandoffAcceptance,
  verifyHandoffOffer,
  verifyPhaseAdmission,
} from "../index.mjs";

const registry = loadCandidateCycleDefinitionRegistry();
const benchmarkDefinition = registry.definitions.find((definition) => definition.definition_ref === "benchmark-research/v1");

function command(overrides = {}) {
  return materializeEvolutionCommand({
    idempotency_key: "contextbench-hen:diagnose:001",
    expected_event_revision: 0,
    actor: {actor_id: "agent:researcher-001", actor_kind: "agent"},
    worker_ref: null,
    cycle_ref: "cycle:contextbench-hen-v1",
    cycle_definition_ref: benchmarkDefinition.definition_ref,
    cycle_definition_digest: benchmarkDefinition.definition_digest,
    operation: "cycle.diagnose",
    target: {record_kind: "cycle", record_ref: "cycle:contextbench-hen-v1"},
    payload: {objective_ref: "objective:glm-8k-contextbench-hen", observed_gap_ref: "evidence:historical-span-f1-gap"},
    ...overrides,
  });
}

test("the candidate registry closes exactly five disabled cycle definitions", () => {
  const checked = verifyCycleDefinitionRegistry(registry);
  assert.equal(checked.ok, true);
  assert.deepEqual(registry.definitions.map((definition) => definition.cycle_kind).sort(), ["benchmark-research", "controlled-upgrade", "engine-improvement", "interaction-learning", "research-learning"]);
  for (const definition of registry.definitions) {
    assert.deepEqual(definition.admission, {status: "candidate", admitted: false, enabled: false, user_decision_ref: null});
    assert.equal(definition.authority_effect, "none");
  }
});

test("commands bind identity, revision, actor, target, payload, and exact definition bytes", () => {
  const value = command();
  assert.equal(verifyEvolutionCommand(value, {registry, current_event_revision: 0}).ok, true);
  assert.equal(verifyEvolutionCommand(value, {registry, require_enabled: true}).reason_codes.includes("command.definition-not-enabled"), true);
  assert.equal(Object.hasOwn(value, "state"), false);
  assert.equal(Object.isFrozen(value), true);
});

test("unknown fields and direct projection-state assignment fail closed", () => {
  const value = command();
  const withUnknown = {...value, surprise: true};
  assert.ok(verifyEvolutionCommand(withUnknown).reason_codes.includes("command.unknown-field:surprise"));
  assert.throws(() => materializeEvolutionCommand({...value, state: "completed"}), /cannot assign projection state/);
});

test("malformed hashes, stale revisions, and definition substitution are distinct failures", () => {
  const value = command();
  assert.ok(verifyEvolutionCommand({...value, payload_digest: "0".repeat(64)}).reason_codes.includes("command.payload-digest-invalid"));
  assert.ok(verifyEvolutionCommand(value, {current_event_revision: 1}).reason_codes.includes("command.stale-revision"));
  const substituted = {...value, cycle_definition_digest: "a".repeat(64)};
  assert.ok(verifyEvolutionCommand(substituted, {registry}).reason_codes.includes("command.definition-substitution"));
});

test("accepted and rejected receipts are deterministic and never carry authority", () => {
  const value = command();
  const event = materializeEvolutionEvent({command: value, revision: 1, event_type: "diagnosis-recorded", payload: {diagnosis_ref: "diagnosis:001"}});
  const acceptedA = materializeCommandReceipt({command: value, disposition: "accepted", previous_event_revision: 0, events: [event]});
  const acceptedB = materializeCommandReceipt({command: value, disposition: "accepted", previous_event_revision: 0, events: [event]});
  const rejectedA = materializeCommandReceipt({command: value, disposition: "rejected", previous_event_revision: 0, reason_codes: ["definition-not-enabled"]});
  const rejectedB = materializeCommandReceipt({command: value, disposition: "rejected", previous_event_revision: 0, reason_codes: ["definition-not-enabled"]});
  assert.deepEqual(acceptedA, acceptedB);
  assert.deepEqual(rejectedA, rejectedB);
  assert.equal(verifyCommandReceipt(acceptedA, {command: value}).ok, true);
  assert.equal(verifyCommandReceipt(rejectedA, {command: value}).ok, true);
  assert.equal(materializeEvolutionResult(acceptedA).authority_effect, "none");
});

test("idempotent replay returns the original receipt while changed bytes conflict", () => {
  const first = command();
  const event = materializeEvolutionEvent({command: first, revision: 1, event_type: "diagnosis-recorded", payload: {diagnosis_ref: "diagnosis:001"}});
  const receipt = materializeCommandReceipt({command: first, disposition: "accepted", previous_event_revision: 0, events: [event]});
  assert.equal(assessCommandReplay({prior_receipt: receipt, command: first}).value.disposition, "replayed");
  const changed = command({payload: {objective_ref: "objective:changed", observed_gap_ref: "evidence:historical-span-f1-gap"}});
  assert.ok(assessCommandReplay({prior_receipt: receipt, command: changed}).reason_codes.includes("replay.conflict"));
});

test("additive successors preserve predecessor vocabulary and bind exact lineage", () => {
  const successor = sealCycleDefinition({
    ...benchmarkDefinition,
    version: 2,
    definition_ref: "benchmark-research/v2",
    predecessor: {definition_ref: benchmarkDefinition.definition_ref, definition_digest: benchmarkDefinition.definition_digest},
    compatibility: {mode: "additive-successor", minimum_runtime_protocol: "are.evolution-protocol/v1"},
    command_types: [...benchmarkDefinition.command_types, "review.request"],
    event_types: [...benchmarkDefinition.event_types, "review-requested"],
  });
  assert.equal(assessCycleDefinitionCompatibility(benchmarkDefinition, successor).ok, true);
  const removal = sealCycleDefinition({...successor, command_types: successor.command_types.filter((item) => item !== "cycle.diagnose")});
  assert.ok(assessCycleDefinitionCompatibility(benchmarkDefinition, removal).reason_codes.some((code) => code.startsWith("compatibility.additive-removal")));
});

test("published protocol schemas are closed and versioned", () => {
  const protocol = JSON.parse(readFileSync(new URL("../schemas/protocol-v1.schema.json", import.meta.url)));
  const definition = JSON.parse(readFileSync(new URL("../schemas/cycle-definition-v1.schema.json", import.meta.url)));
  const policies = JSON.parse(readFileSync(new URL("../schemas/cycle-policies-v1.schema.json", import.meta.url)));
  for (const name of ["command", "result", "event", "commandReceipt", "artifactIdentity", "effectEnvelope", "phaseAdmission", "handoffOffer", "handoffAcceptance"]) assert.equal(protocol.$defs[name].additionalProperties, false);
  assert.equal(definition.additionalProperties, false);
  assert.equal(policies.oneOf.length, 5);
});

test("every P1 protocol surface has a closed structural validator", () => {
  const hash = "a".repeat(64);
  const artifact = {schema_version: "are.evolution-artifact-identity/v1", artifact_id: `sha256:${hash}`, sha256: hash, byte_length: 4, media_type: "application/json", semantic_binding: {cycle_ref: "cycle:one", cycle_definition_digest: benchmarkDefinition.definition_digest, role: "evidence", provenance_refs: ["source:one"], claim_ceiling: "candidate evidence only"}, authority_effect: "none"};
  const envelope = {schema_version: "are.evolution-effect-envelope/v1", envelope_ref: "envelope:one", cycle_ref: "cycle:one", cycle_definition_digest: benchmarkDefinition.definition_digest, authorization_ref: "decision:user-001", allowed_effect_classes: [], resource_limits: {maximum_attempts: 1}, expires_at: "2026-10-01T00:00:00Z", enabled: false, authority_effect: "none"};
  const admission = {schema_version: "are.evolution-phase-admission/v1", admission_ref: "admission:one", cycle_ref: "cycle:one", phase: "experiment-freeze", expected_event_revision: 0, envelope_ref: "envelope:one", envelope_digest: hash, prerequisite_receipt_refs: [], disposition: "rejected", reason_codes: ["definition-not-enabled"], authority_effect: "none"};
  const offer = {schema_version: "are.evolution-handoff-offer/v1", handoff_ref: "handoff:one", handoff_type: "research-finding", source_cycle_ref: "cycle:one", target_cycle_kind: "engine-improvement", artifact_refs: [`sha256:${hash}`], claim_refs: [], offer_receipt_ref: "receipt:offer-one", authority_effect: "none"};
  const acceptance = {schema_version: "are.evolution-handoff-acceptance/v1", handoff_ref: "handoff:one", offer_digest: hash, receiving_cycle_ref: "cycle:two", accepted_artifact_refs: [`sha256:${hash}`], accepted_claim_refs: [], disposition: "accepted", reason_codes: [], acceptance_receipt_ref: "receipt:accept-one", authority_effect: "none"};
  const value = command();
  const event = materializeEvolutionEvent({command: value, revision: 1, event_type: "diagnosis-recorded", payload: {diagnosis_ref: "diagnosis:001"}});
  const result = materializeEvolutionResult(materializeCommandReceipt({command: value, disposition: "accepted", previous_event_revision: 0, events: [event]}));
  for (const checked of [verifyEvolutionEvent(event), verifyEvolutionResult(result), verifyArtifactIdentity(artifact), verifyEffectEnvelope(envelope), verifyPhaseAdmission(admission), verifyHandoffOffer(offer), verifyHandoffAcceptance(acceptance)]) assert.equal(checked.ok, true, checked.reason_codes.join(","));
  assert.equal(verifyHandoffOffer({...offer, authority_effect: "grant"}).ok, false);
  assert.equal(verifyArtifactIdentity({...artifact, state: "hot"}).ok, false);
});

test("accepted and rejected fixture bytes reproduce from the same command", () => {
  const fixture = JSON.parse(readFileSync(new URL("../fixtures/protocol-v1/deterministic-command-receipts.json", import.meta.url)));
  const value = command();
  const event = materializeEvolutionEvent({command: value, revision: 1, event_type: "diagnosis-recorded", payload: {diagnosis_ref: "diagnosis:001"}});
  const accepted = materializeEvolutionResult(materializeCommandReceipt({command: value, disposition: "accepted", previous_event_revision: 0, events: [event]}));
  const rejected = materializeEvolutionResult(materializeCommandReceipt({command: value, disposition: "rejected", previous_event_revision: 0, reason_codes: ["definition-not-enabled"]}));
  assert.deepEqual(value, fixture.command);
  assert.deepEqual(event, fixture.accepted_event);
  assert.deepEqual(accepted, fixture.accepted_result);
  assert.deepEqual(rejected, fixture.rejected_result);
});
