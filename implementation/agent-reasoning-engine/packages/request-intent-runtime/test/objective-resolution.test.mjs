import test from "node:test";
import assert from "node:assert/strict";
import {classifyDefineIntake, materializeObjectiveState, verifyObjectiveState, resolveObjectiveTransition, digestIntentMaterial} from "../index.mjs";
import {createModulePort} from "../../module-port/index.mjs";
import {createSemanticTextFacade, semanticTextOutputValidators} from "../../module-port/semantic-text.mjs";
import {createNativeSemanticAdapter} from "../../module-port/native-semantic-adapter.mjs";

const identity = {consumer_ref: "test-user", scope_ref: "are-project"};
const semanticText = createSemanticTextFacade(createModulePort({adapters: [createNativeSemanticAdapter()], output_validators: semanticTextOutputValidators}), {consumer_id: "request-intent-runtime"});
const resolve = (request, state = null, extra = {}, provider = null) => resolveObjectiveTransition({
  ...identity, request, request_ref: `request:${request}`,
  ...(state ? {state, expected_state_digest: state.state_digest} : {}), ...extra,
}, provider, semanticText);
const seed = async () => (await resolve("Implement the reconnect handler.")).next_state;

test("state is closed, scoped, canonical and deeply immutable", () => {
  const state = materializeObjectiveState(identity);
  assert.equal(verifyObjectiveState(state), true);
  assert.equal(state.authority_effect, "none");
  assert.equal(Object.isFrozen(state.suspended_objectives), true);
  assert.throws(() => materializeObjectiveState({...identity, grant: true}));
  assert.equal(verifyObjectiveState({...state, scope_ref: "another"}), false);
  assert.equal(verifyObjectiveState({...state, authority_effect: "approved"}), false);
});

test("new explicit work records objective but leaves completion unknown", async () => {
  const r = await resolve("Implement the reconnect handler.");
  assert.equal(r.disposition, "resolved");
  assert.equal(r.transition, "new");
  assert.equal(r.completion_criteria_posture, "unknown");
  assert.deepEqual(r.next_state.active_objective.completion_criteria, []);
  assert.equal(r.provider_calls, 0);
  assert.equal(r.define_intake.disposition, "evaluated");
  assert.equal(r.define_intake.required, false);
});

test("greenfield objective requires Define intake and candidate language capture", async () => {
  for (const request of ["Build a new research exchange.", "Start something new for local communities.", "Launch our new workflow.", "Build—a—new evidence system."]) {
    const r = await resolve(request);
    assert.equal(r.disposition, "resolved");
    assert.equal(r.transition, "new");
    assert.equal(r.define_intake.required, true);
    assert.equal(r.define_intake.route_id, "CA2-ROUTE-DEFINE");
    assert.equal(r.define_intake.purpose, "elicit-and-confirm-user-domain-language");
    assert.ok(r.define_intake.required_outputs.includes("candidate-domain-language"));
    assert.ok(r.define_intake.language_dimensions.includes("distinctions"));
    assert.equal(r.define_intake.authority_effect, "none");
  }
  assert.equal(classifyDefineIntake("Use the predefined workflow.", "new", semanticText).required, false);
});

test("missing semantic module withholds lexical inference instead of answering false", async () => {
  const input = {...identity, request: "Build a new evidence system.", request_ref: "request:missing-module"};
  const missing = await resolveObjectiveTransition(input);
  assert.equal(missing.disposition, "unavailable");
  assert.equal(missing.reason_codes[0], "module.capability-unavailable");
  assert.equal(missing.next_state.active_objective, null);
  assert.equal(missing.module_dependency.disposition, "unavailable");
  assert.match(missing.module_dependency.receipt.receipt_digest, /^[a-f0-9]{64}$/u);
});

test("caller-supplied objective remains usable while Define intake is explicitly unavailable", async () => {
  const request = "A bounded exact objective";
  const result = await resolveObjectiveTransition({...identity, request, request_ref: "request:structured",
    candidate: {transition: "new", objective: {description: request}, evidence_span: {start: 0, end: request.length}}});
  assert.equal(result.disposition, "resolved");
  assert.equal(result.define_intake.disposition, "unavailable");
  assert.equal(result.define_intake.required, null);
  assert.equal(result.define_intake.reason_codes[0], "module.capability-unavailable");
});

test("continue reuses the actual objective rather than its pronoun", async () => {
  const state = await seed();
  const r = await resolve("Continue implementing it.", state);
  assert.equal(r.transition, "continue");
  assert.equal(r.next_state.active_objective.objective_id, state.active_objective.objective_id);
  assert.equal(r.next_state.active_objective.description, "Implement the reconnect handler.");
  assert.equal(r.next_state.predecessor_state_digest, state.state_digest);
  assert.equal(verifyObjectiveState(r.next_state), true);
});

test("refine keeps identity, creates revision and preserves previous state", async () => {
  const state = await seed(); const bytes = JSON.stringify(state);
  const r = await resolve("Also handle duplicate completions.", state);
  assert.equal(r.transition, "refine");
  assert.equal(r.next_state.active_objective.revision, 2);
  assert.equal(r.next_state.active_objective.objective_id, state.active_objective.objective_id);
  assert.match(r.next_state.active_objective.description, /reconnect handler.*duplicate completions/);
  assert.equal(JSON.stringify(state), bytes);
});

test("interrupt suspends work and explicit resume restores it without claiming completion", async () => {
  const state = await seed();
  const interruption = await resolve("Before that, explain the completion frontier.", state);
  assert.equal(interruption.transition, "interrupt");
  assert.equal(interruption.next_state.suspended_objectives[0].objective_id, state.active_objective.objective_id);
  const resumed = await resolve("Resume the previous task.", interruption.next_state);
  assert.equal(resumed.next_state.active_objective.objective_id, state.active_objective.objective_id);
  assert.equal(resumed.next_state.suspended_objectives[0].objective_id, interruption.next_state.active_objective.objective_id);
  assert.equal(resumed.authority_effect, "none");
});

test("replacement preserves the retired objective in the resolution evidence", async () => {
  const state = await seed();
  const r = await resolve("Instead, explain the recovery design.", state);
  assert.equal(r.transition, "replace");
  assert.notEqual(r.next_state.active_objective.objective_id, state.active_objective.objective_id);
  assert.deepEqual(r.previous_objective, state.active_objective);
  assert.deepEqual(r.next_state.suspended_objectives, []);
});

test("new work parks unfinished active work", async () => {
  const state = await seed();
  const r = await resolve("New task: review the routing tests.", state);
  assert.equal(r.transition, "new");
  assert.deepEqual(r.next_state.suspended_objectives, [state.active_objective]);
});

test("ambiguous resume and unresolved references never update state", async () => {
  const state = await seed();
  const interrupted = await resolve("Before that, explain the completion frontier.", state);
  const newWork = await resolve("New task: review the routing tests.", interrupted.next_state);
  for (const [request, current] of [["Resume.", newWork.next_state], ["Before that, explain what this means.", state], ["Make the checks stricter.", state]]) {
    const r = await resolve(request, current);
    assert.equal(r.disposition, "ask");
    assert.equal(r.next_state.state_digest, current.state_digest);
  }
  assert.equal((await resolve("Continue implementing it.")).disposition, "ask");
});

test("wrong consumer, scope and expected state digest block before provider", async () => {
  const state = await seed(); let calls = 0;
  for (const extra of [{consumer_ref: "other"}, {scope_ref: "other"}, {expected_state_digest: "0".repeat(64)}]) {
    const r = await resolve("A subtle request", state, extra, () => { calls++; });
    assert.equal(r.disposition, "block");
  }
  assert.equal(calls, 0);
});

test("latest request replay calls no provider and same ID with different text blocks", async () => {
  const first = await resolve("Implement the reconnect handler.", null, {request_ref: "stable-id"});
  const replay = await resolve("Implement the reconnect handler.", first.next_state, {request_ref: "stable-id"}, () => { throw Error("must not call"); });
  assert.equal(replay.disposition, "replayed");
  assert.equal(replay.next_state.state_digest, first.next_state.state_digest);
  assert.equal((await resolve("Explain the route.", first.next_state, {request_ref: "stable-id"})).disposition, "block");
});

test("provider receives selected meanings and frozen objective state exactly once", async () => {
  const state = await seed(); let calls = 0;
  const request = "Could we focus on recovery semantics?";
  const r = await resolve(request, state, {selected_context: [{source_ref: "definition:recovery", content: "Recovery reconstructs verified state."}]}, async input => {
    calls++;
    assert.equal(input.selected_context[0].content, "Recovery reconstructs verified state.");
    assert.equal(input.state.active_objective.objective_id, state.active_objective.objective_id);
    assert.equal(Object.isFrozen(input.state.active_objective), true);
    return {transition: "interrupt", objective: {description: "Explain recovery semantics", completion_criteria: ["Explain recovery limits"]}, evidence_span: {start: 0, end: request.length}};
  });
  assert.equal(calls, 1); assert.equal(r.provider_calls, 1);
  assert.equal(r.classification_basis, "provider-proposal");
  assert.equal(r.disposition, "resolved");
  assert.equal(r.completion_criteria_posture, "declared-not-evaluated");
});

test("malformed, authority-bearing and unbound provider candidates block", async () => {
  const state = await seed();
  const valid = {transition: "interrupt", objective: {description: "Explain recovery"}, evidence_span: {start: 0, end: 4}};
  for (const candidate of [null, {}, {...valid, authority_effect: "approved"}, {...valid, evidence_span: {start: 0, end: 900}}, {...valid, transition: "deploy"}]) {
    const r = await resolve("Tell me more", state, {}, async () => candidate);
    assert.equal(r.disposition, "block");
    assert.equal(r.next_state.state_digest, state.state_digest);
    assert.equal(r.provider_calls, 1);
  }
});

test("explicit candidate can resolve one of multiple suspended objectives", async () => {
  const initial = await seed();
  const mid = await resolve("Before that, explain recovery.", initial);
  const current = (await resolve("New task: review tests.", mid.next_state)).next_state;
  const r = await resolve("Return to reconnect work", current, {candidate: {transition: "continue", referent_objective_id: initial.active_objective.objective_id, evidence_span: {start: 0, end: 9}}});
  assert.equal(r.disposition, "resolved");
  assert.equal(r.next_state.active_objective.objective_id, initial.active_objective.objective_id);
});

test("timeouts abort the provider signal and do not modify state", async () => {
  let signal;
  const state = await seed();
  const r = await resolve("Tell me more", state, {provider_timeout_ms: 5}, (_input, options) => { signal = options.signal; return new Promise(() => {}); });
  assert.equal(r.disposition, "block");
  assert.equal(r.reason_codes[0], "objective.provider-timeout");
  assert.equal(signal.aborted, true);
  assert.equal(r.next_state.state_digest, state.state_digest);
});

test("request/context overflow and conflicting selected sources block without truncation", async () => {
  const state = await seed();
  const contexts = [[{source_ref: "x", content: "z".repeat(32769)}], [{source_ref: "x", content: "a"}, {source_ref: "x", content: "b"}]];
  for (const selected_context of contexts) assert.equal((await resolve("Tell me more", state, {selected_context})).disposition, "block");
  assert.equal((await resolve("a".repeat(32769))).disposition, "block");
});

test("state capacity blocks the new transition without discarding suspended work", async () => {
  let state = await seed();
  for (let i = 0; i < 16; i++) {
    const r = await resolve(`New task: review item ${i}.`, state);
    assert.equal(r.disposition, "resolved"); state = r.next_state;
  }
  const r = await resolve("New task: exceed the cap.", state);
  assert.equal(r.disposition, "block");
  assert.equal(r.next_state.state_digest, state.state_digest);
  assert.equal(state.suspended_objectives.length, 16);
});

test("source permutation and state object key order preserve resolution identity", async () => {
  const state = await seed(); const request = "Tell me more";
  const candidate = {transition: "interrupt", objective: {description: "Explain recovery"}, evidence_span: {start: 0, end: request.length}};
  const selected_context = [{source_ref: "b", content: "B"}, {source_ref: "a", content: "A"}];
  const left = await resolve(request, state, {candidate, selected_context});
  const right = await resolve(request, JSON.parse(JSON.stringify(state)), {candidate, selected_context: selected_context.toReversed()});
  assert.equal(left.resolution_digest, right.resolution_digest);
  const {resolution_digest, ...fields} = left;
  assert.equal(digestIntentMaterial(fields), resolution_digest);
});

test("mutating caller state during provider work cannot alter the frozen selection", async () => {
  const state = JSON.parse(JSON.stringify(await seed()));
  const original = state.active_objective.description;
  const r = await resolve("Tell me more", state, {}, async input => {
    state.active_objective.description = "changed externally";
    return {transition: "continue", referent_objective_id: input.state.active_objective.objective_id, evidence_span: {start: 0, end: 4}};
  });
  assert.equal(r.next_state.active_objective.description, original);
});
