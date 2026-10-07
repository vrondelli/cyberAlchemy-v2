import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {
  decideAuthorizedAutomation,
  materializeLongitudinalPreferenceEvent,
  materializeAutomationFixtures,
  materializeLongitudinalFixtures,
  resolveLongitudinalPreference,
  runAuthorizedAutomationFixedReplay,
  runLinkedCycleFirstResult,
  runLongitudinalFixedReplay,
  verifyLinkedCycleFirstResult,
} from "../src/linked-cycle-benchmark-v1.mjs";
import {runLinkedCycleFirstMilestone} from "../src/linked-cycle-first-milestone-v1.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const programRoot = join(packageRoot, "plans", "longitudinal-continuity-authorized-automation-v1");

test("longitudinal replay freezes 48 cases and clears the bounded threshold with recovery parity", () => {
  const fixtures = materializeLongitudinalFixtures();
  assert.equal(fixtures.length, 48);
  assert.deepEqual([...new Set(fixtures.map((fixture) => fixture.family))], [
    "explicit-revision", "explicit-revocation", "objective-boundary", "same-scope-recall", "scoped-exception", "temporal-or-ambiguous",
  ]);
  const result = runLongitudinalFixedReplay();
  assert.deepEqual(result.baseline, {baseline_ref: "legacy-interaction-scope-model/v1", failed: 24, passed: 24, rate: 0.5});
  assert.deepEqual(result.candidate, {candidate_ref: "typed-longitudinal-projection/v1", failed: 0, passed: 48, rate: 1});
  assert.equal(result.absolute_improvement, 0.5);
  assert.equal(result.recovery.digest_parity, true);
  assert.deepEqual(Object.values(result.protected_failures), [0, 0, 0, 0]);
  assert.equal(result.disposition, "fixed-replay-qualified");
});

test("longitudinal projection fails closed on a tampered event", () => {
  const fixture = materializeLongitudinalFixtures()[0];
  const tampered = structuredClone(fixture.events);
  tampered[0].value = "tampered";
  assert.throws(() => resolveLongitudinalPreference(tampered, fixture.query), /longitudinal-decision\.event-invalid/u);
});

test("a newer global revocation dominates an older scoped exception", () => {
  const scope = {participant_ref: "participant:a", product_ref: "product:are"};
  const event = (event_type, sequence, eventScope, value = null) => materializeLongitudinalPreferenceEvent({event_id: `event:${sequence}`, event_type, preference_ref: "preference:format", sequence, scope: eventScope, posture: "explicit", value});
  const actual = resolveLongitudinalPreference([
    event("set", 1, scope, "concise"),
    event("exception", 2, {...scope, objective_ref: "objective:a"}, "verbose"),
    event("revoke", 3, scope),
  ], {scope: {...scope, objective_ref: "objective:a"}, sequence: 4});
  assert.equal(actual.disposition, "none");
});

test("automation controller exercises all four outcomes with zero protected failures", () => {
  const fixtures = materializeAutomationFixtures();
  assert.equal(fixtures.length, 48);
  assert.deepEqual([...new Set(fixtures.map((fixture) => fixture.expected))].sort(), ["abstain", "ask", "execute", "stop"]);
  for (const fixture of fixtures) assert.equal(decideAuthorizedAutomation(fixture).outcome, fixture.expected);
  const expired = fixtures.find((fixture) => fixture.grant?.expires_at_sequence === 5);
  assert.deepEqual(decideAuthorizedAutomation(expired), {authority_effect: "none", outcome: "stop", reason_code: "grant-expired"});
  const result = runAuthorizedAutomationFixedReplay();
  assert.deepEqual(result.outcome_counts, {abstain: 12, ask: 12, execute: 12, stop: 12});
  assert.equal(result.baseline.authorized_autonomous_completion_rate, 0);
  assert.equal(result.candidate.authorized_autonomous_completion_rate, 1);
  assert.deepEqual(Object.values(result.protected_failures), [0, 0, 0, 0, 0]);
  assert.equal(result.disposition, "controller-qualified-awaiting-continuity-handoff");
});

test("linked first result is deterministic and sealed", () => {
  const first = runLinkedCycleFirstResult();
  const second = runLinkedCycleFirstResult();
  assert.equal(verifyLinkedCycleFirstResult(first), true);
  assert.equal(first.result_digest, second.result_digest);
  assert.equal(first.clear_first_result, true);
  assert.equal(first.activation, "none");
});

test("first milestone settles only the reviewed frontier and reconstructs after index loss", () => {
  const temporary = mkdtempSync(resolve(tmpdir(), "are-linked-cycle-milestone-"));
  const outputRoot = join(temporary, "evidence");
  try {
    const receipt = runLinkedCycleFirstMilestone({output_root: outputRoot, program_root: programRoot});
    assert.equal(receipt.activation, "none");
    assert.equal(receipt.coordinator.restart_parity, true);
    assert.equal(receipt.coordinator.sqlite_loss_diagnosis, "rebuild-required");
    assert.equal(receipt.coordinator.recovery_parity, true);
    assert.deepEqual(receipt.phase_state.longitudinal_next_frontier, ["lpc.shadow"]);
    assert.deepEqual(receipt.phase_state.automation_next_frontier, ["aa.accept-handoff"]);
    assert.equal(receipt.phase_state.automation_waiting_for, "typed-supported-cycle-1-handoff");
    const result = JSON.parse(readFileSync(join(outputRoot, "FIRST-RESULT.json"), "utf8"));
    assert.equal(verifyLinkedCycleFirstResult(result), true);
    assert.equal(result.clear_first_result, true);
  } finally {
    rmSync(temporary, {recursive: true, force: true});
  }
});
