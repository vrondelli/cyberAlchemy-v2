import assert from "node:assert/strict";
import test from "node:test";
import {materializeRequirementSnapshot, verifyRequirementSnapshot, assessRequirementChange, resolveObjectiveTransition} from "../index.mjs";
import {createModulePort} from "../../module-port/index.mjs";
import {createSemanticTextFacade, semanticTextOutputValidators} from "../../module-port/semantic-text.mjs";
import {createNativeSemanticAdapter} from "../../module-port/native-semantic-adapter.mjs";
const identity = {consumer_ref: "c", scope_ref: "s"};
const semanticText = createSemanticTextFacade(createModulePort({adapters: [createNativeSemanticAdapter()], output_validators: semanticTextOutputValidators}), {consumer_id: "request-intent-runtime"});
const resolveObjective = (input, provider = null) => resolveObjectiveTransition(input, provider, semanticText);
const seed = await resolveObjective({...identity, request_ref: "seed", request: "Research context reuse"});
const snapshot = materializeRequirementSnapshot({...identity, objective_id: seed.next_state.active_objective.objective_id,
  objective_state_digest: seed.next_state.state_digest, requirements: ["citations"], source_refs: ["fixture:declared"]});
const assess = (delta, transition = "refine") => assessRequirementChange({snapshot, delta, transition, request: "Add a table", request_ref: "r"});
const candidate = {transition: "refine", objective: {description: "Research context reuse with citations and a table"}, evidence_span: {start: 0, end: 11}, requirement_delta: {retained: ["citations"], added: ["table"], removed: []}};
const input = {...identity, request_ref: "r", request: "Add a table", state: seed.next_state, expected_state_digest: seed.next_state.state_digest, requirement_snapshot: snapshot};
test("requirement snapshots are sealed and immutable", () => {
  assert.equal(verifyRequirementSnapshot(snapshot), true);
  assert.ok(Object.isFrozen(snapshot.requirements));
  assert.equal(verifyRequirementSnapshot({...snapshot, requirements: []}), false);
  assert.throws(() => materializeRequirementSnapshot({...identity, objective_id: "x", objective_state_digest: "a".repeat(64), requirements: ["same", "same"], source_refs: ["s"]}));
});
test("explicit additions/removals retain complete set accounting", () => {
  assert.deepEqual(assess(candidate.requirement_delta).value.resulting_requirements, ["citations", "table"]);
  assert.deepEqual(assess({retained: [], added: [], removed: ["citations"]}).value.resulting_requirements, []);
});
test("continue with changes and refine without changes both block", () => {
  assert.equal(assess(candidate.requirement_delta, "continue").ok, false);
  assert.equal(assess({retained: ["citations"], added: [], removed: []}).ok, false);
});
test("silent losses, invented removals, duplicate additions and authority fields block", () => {
  for (const d of [{retained: [], added: ["table"], removed: []}, {retained: ["citations"], added: [], removed: ["unknown"]},
    {retained: ["citations"], added: ["citations"], removed: []}, {...candidate.requirement_delta, authority_effect: "grant"}]) assert.equal(assess(d).ok, false);
});
test("resolver emits a successor bound to the new state without mutating history", async () => {
  const result = await resolveObjective({...input, candidate});
  assert.equal(result.disposition, "resolved");
  assert.deepEqual(result.requirement_snapshot.requirements, ["citations", "table"]);
  assert.equal(result.requirement_snapshot.objective_state_digest, result.next_state.state_digest);
  assert.deepEqual(snapshot.requirements, ["citations"]);
  assert.equal(result.requirement_change.snapshot_digest, snapshot.snapshot_digest);
});
test("stale snapshot blocks before a provider call", async () => {
  let calls = 0;
  const result = await resolveObjective({...input, requirement_snapshot: {...snapshot, scope_ref: "other"}}, () => { calls++; });
  assert.equal(result.disposition, "block"); assert.equal(calls, 0);
});
test("strict mode asks provider for deltas even on known lexical cues", async () => {
  let calls = 0;
  const result = await resolveObjective({...input, request: "do next"}, providerInput => {
    calls++; assert.equal(providerInput.requirement_snapshot.snapshot_digest, snapshot.snapshot_digest);
    assert.ok(Object.isFrozen(providerInput.requirement_snapshot));
    return {transition: "continue", referent_objective_id: snapshot.objective_id, evidence_span: {start: 0, end: 7}, requirement_delta: {retained: ["citations"], added: [], removed: []}};
  });
  assert.equal(result.disposition, "resolved"); assert.equal(calls, 1);
});
test("unbound deltas and missing deltas cannot silently use legacy mode", async () => {
  assert.equal((await resolveObjective({...input, requirement_snapshot: undefined, candidate})).disposition, "block");
  const {requirement_delta, ...legacy} = candidate;
  assert.equal((await resolveObjective({...input, candidate: legacy})).disposition, "block");
});
test("requirement budgets block without truncation", () => {
  assert.equal(assess({retained: ["citations"], added: ["x".repeat(32768)], removed: []}).ok, false);
});
test("malformed public assessment inputs fail closed", () => {
  for (const value of [undefined, null, false, [], "invalid"]) assert.equal(assessRequirementChange(value).ok, false);
});
test("latest request replay preserves its current requirement snapshot without provider calls", async () => {
  const first = await resolveObjective({...input, candidate});
  let calls = 0;
  const replay = await resolveObjective({...input, state: first.next_state,
    expected_state_digest: first.next_state.state_digest, requirement_snapshot: first.requirement_snapshot}, () => { calls++; });
  assert.equal(replay.disposition, "replayed");
  assert.deepEqual(replay.requirement_snapshot, first.requirement_snapshot);
  assert.equal(calls, 0);
});
