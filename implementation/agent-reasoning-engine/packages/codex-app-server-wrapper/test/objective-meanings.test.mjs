import assert from "node:assert/strict";
import test from "node:test";
import {resolve} from "node:path";
import {selectObjectiveMeanings, validMeaningSelection} from "../src/objective-meanings.mjs";
import {createCodexObjectiveLifecycle} from "../src/objective-lifecycle.mjs";
import {createReasoningStateLedger, loadRepositoryProfile, createCodexAppServerWrapper} from "../index.mjs";
import {semanticModulePort} from "./semantic-module-fixture.mjs";
const hash = "a".repeat(64);
const sources = () => ({ok: true, definition_catalog: {definitions: [{definition_id: "D", source_ref: "source#D", digest: hash, definition_text: "Research compares evidence.", authority_posture: "candidate"}]},
  ontology_snapshot: {nodes: [{node_id: "N", source_ref: "source#N", source_digest: hash, content: {intent: "Compare evidence"}}],
    edges: [{edge_id: "E", source_ref: "source#E", source_digest: hash, from_node_id: "N", to_node_id: "N", content: {type: "supports"}}]}});
const policy = {definition_ids: ["D"], edge_ids: ["E"]};
const message = text => ({id: 1, params: {threadId: "t", input: [{type: "text", text}]}});

test("exact selection includes edge endpoints, usable meaning and provenance", () => {
  const selected = selectObjectiveMeanings(sources(), policy);
  assert.equal(selected.ok, true);
  assert.equal(selected.selected_context.length, 3);
  assert.ok(selected.selected_context.some(i => i.content.includes("Research compares evidence.")));
  assert.ok(Object.isFrozen(selected.selected_context[0]));
});
test("selected drift changes identity, unrelated drift and permutation do not", () => {
  const original = selectObjectiveMeanings(sources(), policy);
  const changed = sources(); changed.definition_catalog.definitions.push({...changed.definition_catalog.definitions[0], definition_id: "OTHER"});
  changed.definition_catalog.definitions.reverse();
  assert.equal(selectObjectiveMeanings(changed, policy).receipt.selection_digest, original.receipt.selection_digest);
  changed.definition_catalog.definitions.find(d => d.definition_id === "D").definition_text = "Changed meaning";
  assert.notEqual(selectObjectiveMeanings(changed, policy).receipt.selection_digest, original.receipt.selection_digest);
});
test("missing, ambiguous, malformed and overflowing selected meanings block", () => {
  assert.equal(selectObjectiveMeanings(sources(), {definition_ids: ["missing"]}).ok, false);
  const duplicate = sources(); duplicate.definition_catalog.definitions.push(duplicate.definition_catalog.definitions[0]);
  assert.equal(selectObjectiveMeanings(duplicate, policy).ok, false);
  const missing = sources(); missing.ontology_snapshot.nodes = [];
  assert.equal(selectObjectiveMeanings(missing, policy).ok, false);
  assert.equal(selectObjectiveMeanings(sources(), {...policy, max_bytes: 1}).reason_codes[0], "objective.meaning-budget-exceeded");
  assert.equal(selectObjectiveMeanings({ok: false}, policy).ok, false);
});
test("provider receives fresh selected text and ledger retains its exact selection receipt", async () => {
  const ledger = createReasoningStateLedger(); let calls = 0, loads = 0;
  const lifecycle = createCodexObjectiveLifecycle({ledger, profile_id: "p", configuration: {enabled: true, meaning_selection: policy}, module_port: semanticModulePort(), provider: input => {
    calls++; assert.equal(input.selected_context.length, 3); assert.ok(Object.isFrozen(input.selected_context));
    return {transition: "new", objective: {description: "Research evidence"}, evidence_span: {start: 0, end: input.request.length}};
  }});
  const result = await lifecycle.prepare(message("Could you investigate the evidence?"), {consumer_ref: "c"}, async () => { loads++; return sources(); });
  assert.equal(result.ok, true); assert.equal(calls, 1); assert.equal(loads, 1);
  const receipt = ledger.snapshot()[0].content.meaning_selection;
  assert.equal(receipt.selected_context_digest, result.resolution.selected_context_digest);
  assert.doesNotThrow(() => createCodexObjectiveLifecycle({ledger, profile_id: "p"}));
});

test("selection policy rejects unknown fields, duplicate selectors and invalid budgets", () => {
  for (const invalid of [{node_ids: "N"}, {definition_ids: ["D", "D"]}, {max_bytes: 32769}, {max_bytes: 0}, {discover: true}]) assert.equal(validMeaningSelection(invalid), false);
  assert.equal(validMeaningSelection(policy), true);
});

test("selected node, edge and authority changes invalidate the projection", () => {
  const original = selectObjectiveMeanings(sources(), policy).receipt.selected_context_digest;
  for (const mutate of [s => { s.ontology_snapshot.nodes[0].content.intent = "Different meaning"; },
    s => { s.ontology_snapshot.edges[0].content.type = "contradicts"; },
    s => { s.definition_catalog.definitions[0].authority_posture = "withdrawn"; }]) {
    const changed = sources(); mutate(changed);
    assert.notEqual(selectObjectiveMeanings(changed, policy).receipt.selected_context_digest, original);
  }
});
test("deterministic cues skip meaning loads; missing selected source makes zero provider calls", async () => {
  let calls = 0, loads = 0;
  const create = () => createCodexObjectiveLifecycle({ledger: createReasoningStateLedger(), profile_id: "p", configuration: {enabled: true, meaning_selection: policy}, module_port: semanticModulePort(), provider: () => { calls++; }});
  const load = async () => { loads++; return {ok: false}; };
  assert.equal((await create().prepare(message("Research evidence"), {consumer_ref: "c"}, load)).ok, true);
  assert.equal(loads, 0);
  assert.equal((await create().prepare(message("Could you investigate?"), {consumer_ref: "c"}, load)).ok, false);
  assert.equal(loads, 1); assert.equal(calls, 0);
});
test("wrapper shares one refreshed source snapshot between interpretation and preflight", async () => {
  const root = resolve(import.meta.dirname, "..");
  const loaded = loadRepositoryProfile(resolve(root, "profiles/repository-v1.json"), resolve(root, "../../../../.."));
  assert.equal(loaded.ok, true);
  const definition = loaded.definition_catalog.definitions.find(d => typeof d.definition_text === "string");
  let loads = 0;
  const wrapper = createCodexAppServerWrapper({loaded_profile: {...loaded.value, objective_resolution: {enabled: true, meaning_selection: {definition_ids: [definition.definition_id]}}},
    definition_catalog: loaded.definition_catalog, ontology_snapshot: loaded.ontology_snapshot, decision_profile: loaded.decision_profile,
    module_port: semanticModulePort(),
    context_source_provider: async () => { loads++; return loaded.context_source_provider(); }, objective_provider: input => {
      assert.ok(input.selected_context[0].content.includes(definition.definition_text));
      return {transition: "new", objective: {description: "Research context management"}, evidence_span: {start: 0, end: input.request.length}};
    }});
  const action = await wrapper.processClientMessage({jsonrpc: "2.0", method: "turn/start", ...message("Could you investigate context management?")});
  assert.equal(action.to_server.length, 1, JSON.stringify(action.to_client)); assert.equal(loads, 1); wrapper.close();
});
