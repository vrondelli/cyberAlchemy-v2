import assert from "node:assert/strict";
import test from "node:test";
import {mkdtempSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import {createCodexAppServerWrapper, createReasoningStateLedger, loadRepositoryProfile, INTENT_CONTEXT_KEY} from "../index.mjs";
import {buildRequestContext} from "../src/request-context.mjs";
import {createCodexObjectiveLifecycle, OBJECTIVE_CONTEXT_KEY} from "../src/objective-lifecycle.mjs";
import {semanticModulePort} from "./semantic-module-fixture.mjs";

const root = resolve(import.meta.dirname, "..");
const loaded = loadRepositoryProfile(resolve(root, "profiles/repository-v1.json"), resolve(root, "../../../../.."));
assert.equal(loaded.ok, true, loaded.reason_codes?.join(","));
const start = (id, text, threadId = "objective-thread") => ({jsonrpc: "2.0", id, method: "turn/start", params: {threadId, input: [{type: "text", text}]}});
const research = "Research context management approaches.";
function wrapper(overrides = {}, profile = {}) {
  return createCodexAppServerWrapper({loaded_profile: {...loaded.value, objective_resolution: {enabled: true}, ...profile},
    decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog, ontology_snapshot: loaded.ontology_snapshot,
    source_snapshot: loaded.source_snapshot, module_port: semanticModulePort(), ...overrides});
}
const fragment = action => JSON.parse(action.to_server[0].params.additionalContext[OBJECTIVE_CONTEXT_KEY].value);

test("disabled objective resolution leaves forwarding and provider calls unchanged", async () => {
  let calls = 0;
  const w = wrapper({objective_provider: () => { calls++; }}, {objective_resolution: {enabled: false}});
  const action = await w.processClientMessage(start(1, research));
  assert.equal(action.to_server.length, 1);
  assert.equal(action.to_server[0].params.additionalContext[OBJECTIVE_CONTEXT_KEY], undefined);
  assert.equal(calls, 0);
  assert.deepEqual(w.inspectState().objective_states, []);
});

test("empty module port localizes semantic unavailability to objective interpretation", async () => {
  const w = wrapper({module_port: undefined});
  const action = await w.processClientMessage(start(1, "Build a new evidence system."));
  assert.equal(action.to_server.length, 0);
  assert.equal(action.to_client[0].error.data.disposition, "unavailable");
  assert.equal(action.to_client[0].error.data.reason_codes[0], "module.capability-unavailable");
  assert.deepEqual(w.inspectState().objective_states, []);
  w.close();
});

test("continuation resolves before routing and reaches the intent contract without changing user input", async () => {
  const ledger = createReasoningStateLedger();
  const w = wrapper({reasoning_ledger: ledger}, {intent_compilation: {enabled: true}});
  const first = await w.processClientMessage(start(1, research));
  assert.equal(first.to_server.length, 1, JSON.stringify(first.to_client));
  const second = await w.processClientMessage(start(2, "do next"));
  assert.equal(second.to_server.length, 1, JSON.stringify(second.to_client));
  assert.equal(fragment(second).active_objective.objective_id, fragment(first).active_objective.objective_id);
  assert.equal(fragment(second).transition, "continue");
  assert.equal(second.to_server[0].params.input[0].text, "do next");
  assert.equal(JSON.parse(second.to_server[0].params.additionalContext[INTENT_CONTEXT_KEY].value).intent_contract.objective, research);
  const events = ledger.snapshot();
  const interpretation = events.findIndex(e => e.event_kind === "objective-transition-resolved");
  const route = events.findIndex(e => e.event_kind === "request-interpreted");
  assert.ok(interpretation >= 0 && interpretation < route);
  assert.equal(events.filter(e => e.event_kind === "objective-transition-resolved").length, 2);
  assert.equal(w.ledger.snapshot().filter(e => e.event_kind === "objective-transition-resolved")[1].objective_state_digest, fragment(second).state_digest);
  assert.ok(!JSON.stringify(w.inspectState().objective_states).includes(research));
});

test("missing referents stop before context reload and never dispatch", async () => {
  let reads = 0;
  const w = wrapper({context_source_provider: () => { reads++; throw Error("must not run"); }});
  const action = await w.processClientMessage(start(1, "do next"));
  assert.equal(action.to_server.length, 0);
  assert.equal(action.to_client[0].error.data.disposition, "ask");
  assert.equal(reads, 0);
});

test("thread isolation prevents a shared consumer from resolving another task's pronoun", async () => {
  const w = wrapper();
  await w.processClientMessage(start(1, research, "a"));
  const other = await w.processClientMessage(start(2, "do next", "b"));
  assert.equal(other.to_server.length, 0);
  assert.equal(other.to_client[0].error.data.reason_codes[0], "objective.active-reference-missing");
});

test("file-backed restart recovers objective history and refuses duplicate dispatch", async () => {
  const dir = mkdtempSync(resolve(tmpdir(), "are-objective-recovery-"));
  const profile = {reasoning_state: {...loaded.value.reasoning_state, ledger_id: "objective-recovery", storage_mode: "append-only-file-fsync", log_path: resolve(dir, "events.jsonl"), single_writer: true}};
  let first, second;
  try {
    first = wrapper({}, profile);
    const a = await first.processClientMessage(start(1, research));
    assert.equal(a.to_server.length, 1);
    first.close(); first = null;
    second = wrapper({}, profile);
    assert.ok(second.ledger.snapshot().some(e => e.event_kind === "cache-affinity-recovery-miss" && e.reason_code === "cache.recovered-summary-is-not-full-projection"));
    const duplicate = await second.processClientMessage(start(1, research));
    assert.equal(duplicate.to_server.length, 0);
    assert.equal(duplicate.to_client[0].error.data.reason_codes[0], "objective.request-already-recorded-dispatch-not-retried");
    const conflict = await second.processClientMessage(start(1, "Research another topic"));
    assert.equal(conflict.to_client[0].error.data.reason_codes[0], "objective.request-identity-conflict");
    const continued = await second.processClientMessage(start(2, "do next"));
    assert.equal(continued.to_server.length, 1, JSON.stringify(continued.to_client));
    assert.equal(fragment(continued).active_objective.objective_id, fragment(a).active_objective.objective_id);
  } finally { first?.close(); second?.close(); rmSync(dir, {recursive: true, force: true}); }
});

test("malformed inputs and deadline failures produce explicit blocks", async () => {
  const w = wrapper({objective_provider: () => new Promise(() => {})}, {objective_resolution: {enabled: true, provider_timeout_ms: 5}});
  const invalid = start(1, research); invalid.params.input = [null];
  assert.equal((await w.processClientMessage(invalid)).to_server.length, 0);
  const timed = await w.processClientMessage(start(2, "Find a useful research direction"));
  assert.equal(timed.to_client[0].error.data.reason_codes[0], "objective.provider-timeout");
});

test("a resolved objective cannot be rebound to different request bytes", async () => {
  const ledger = createReasoningStateLedger();
  const lifecycle = createCodexObjectiveLifecycle({ledger, profile_id: "test", configuration: {enabled: true}, module_port: semanticModulePort()});
  const binding = {consumer_ref: "consumer"};
  const resolved = await lifecycle.prepare(start(1, research), binding);
  const mismatch = buildRequestContext(start(2, "Publish the repository"), binding, resolved.resolution);
  assert.equal(mismatch.ok, false);
  assert.deepEqual(mismatch.reason_codes, ["objective.resolution-request-binding-invalid"]);
});

test("recovery rejects altered objective records instead of inventing an empty state", async () => {
  const ledger = createReasoningStateLedger();
  const lifecycle = createCodexObjectiveLifecycle({ledger, profile_id: "test", configuration: {enabled: true}, module_port: semanticModulePort()});
  await lifecycle.prepare(start(1, research), {consumer_ref: "consumer"});
  const events = JSON.parse(JSON.stringify(ledger.snapshot()));
  events[0].content.resolution.next_state.active_objective.description = "Injected objective";
  assert.throws(() => createCodexObjectiveLifecycle({ledger: {...ledger, snapshot: () => events}, profile_id: "test"}), /Invalid recovered objective/);
});

test("overlapping same-thread turns cannot race the objective predecessor", async () => {
  let enter, release;
  const entered = new Promise(resolve => { enter = resolve; });
  const w = wrapper({objective_provider: async input => { enter(); await new Promise(resolve => { release = resolve; }); return {
    transition: "new", objective: {description: research}, evidence_span: {start: 0, end: input.request.length}}; }});
  const pending = w.processClientMessage(start(1, "Please investigate context management"));
  await entered;
  const overlapping = await w.processClientMessage(start(2, "do next"));
  assert.equal(overlapping.to_server.length, 0);
  assert.equal(overlapping.to_client[0].error.data.reason_codes[0], "objective.concurrent-turn-in-progress");
  release();
  assert.equal((await pending).to_server.length, 1);
});

test("checkpoint failure prevents forwarding and latches interpretation writes", async () => {
  const ledger = createReasoningStateLedger();
  const w = wrapper({reasoning_ledger: {...ledger, checkpoint: () => ({ok: false, reason_codes: ["fixture.checkpoint-failure"]})}});
  const result = await w.processClientMessage(start(1, research));
  assert.equal(result.to_server.length, 0);
  assert.deepEqual(w.inspectState().objective_states, []);
  const next = await w.processClientMessage(start(2, research));
  assert.equal(next.to_client[0].error.data.reason_codes[0], "objective.ledger-write-failed-restart-required");
});

test("interrupt/refine/resume transitions replay from the same existing ledger", async () => {
  const ledger = createReasoningStateLedger();
  const create = () => createCodexObjectiveLifecycle({ledger, profile_id: "test", configuration: {enabled: true}, module_port: semanticModulePort()});
  let lifecycle = create();
  const prepare = (id, request) => lifecycle.prepare(start(id, request), {consumer_ref: "consumer"});
  const initial = await prepare(1, research);
  await prepare(2, "Also compare latency");
  await prepare(3, "Before that, explain routing");
  lifecycle = create();
  const resumed = await prepare(4, "Resume previous task");
  assert.equal(resumed.ok, true);
  assert.equal(resumed.resolution.next_state.active_objective.objective_id, initial.resolution.next_state.active_objective.objective_id);
  assert.equal(resumed.resolution.next_state.active_objective.revision, 2);
  assert.equal(resumed.resolution.next_state.suspended_objectives.length, 1);
});
