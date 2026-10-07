import assert from "node:assert/strict";
import test from "node:test";
import {createIntentAnchorState, recordHintSupport, confirmBaseRead} from "./intent-anchor-convergence-r3.mjs";
import {admitMappedRankQuery, bindConfirmedBaseRead, mapConfirmedTerminalReads} from "./intent-anchor-integration-r3.mjs";

const hash = (letter) => letter.repeat(64);
function ready() {
  let state = createIntentAnchorState("Parser rejects trailing commas. Documentation must describe valid configuration.");
  const first = admitMappedRankQuery(state, "parser trailing commas"); assert.equal(first.accepted, true); state = first.state;
  const second = admitMappedRankQuery(state, "documentation valid configuration"); assert.equal(second.accepted, true); state = second.state;
  state = recordHintSupport(state, {anchor_id: first.anchor_id, query_sha256: first.query_sha256, path: "src/parser.ts", start_line: 10, end_line: 20, content_sha256: hash("a")});
  return confirmBaseRead(state, {path: "src/parser.ts", start_line: 10, end_line: 20, content_sha256: hash("a"), base_revision_confirmed: true});
}

test("rejects a novel query that does not overlap its selected objective anchor", () => {
  const state = createIntentAnchorState("Parser rejects trailing commas. Documentation must describe valid configuration.");
  const result = admitMappedRankQuery(state, "unrelated scheduler mutex");
  assert.equal(result.accepted, false); assert.equal(result.reason, "anchor-term-overlap-required"); assert.equal(result.state, state);
});

test("maps only an exact confirmed tuple to the receipt-bound native read id", () => {
  const state = ready(), confirmed = state.confirmed_base_reads[0], nativeId = hash("c");
  const binding = bindConfirmedBaseRead(state, {convergence_read_id: confirmed.read_id, native_read_id: nativeId, source_revision: "base", path: "src/parser.ts", start_line: 10, end_line: 20, source_sha256: hash("a")});
  const result = mapConfirmedTerminalReads(state, [{id: nativeId, path: "src/parser.ts", start_line: 10, end_line: 20, source_sha256: hash("a")}, {id: hash("d"), path: "src/parser.ts", start_line: 10, end_line: 20, source_sha256: hash("a")}], [binding]);
  assert.deepEqual(result.selected_native_read_ids, [nativeId]);
  assert.notEqual(result.mappings[0].convergence_read_id, result.mappings[0].native_read_id);
});

test("rejects broader ranges, current hashes, ambiguity and premature finish", () => {
  const state = ready();
  const confirmed = state.confirmed_base_reads[0], binding = bindConfirmedBaseRead(state, {convergence_read_id: confirmed.read_id, native_read_id: hash("c"), source_revision: "base", path: "src/parser.ts", start_line: 10, end_line: 20, source_sha256: hash("a")});
  assert.throws(() => mapConfirmedTerminalReads(state, [{id: hash("c"), path: "src/parser.ts", start_line: 1, end_line: 30, source_sha256: hash("a")}], [binding]), /native-read-binding-invalid/);
  assert.throws(() => mapConfirmedTerminalReads(state, [{id: hash("c"), path: "src/parser.ts", start_line: 10, end_line: 20, source_sha256: hash("b")}], [binding]), /native-read-binding-invalid/);
  assert.throws(() => bindConfirmedBaseRead(state, {...binding, source_revision: "current"}), /base-origin-invalid/);
  assert.throws(() => bindConfirmedBaseRead(state, {...binding, native_read_id: "not-a-native-id"}), /base-origin-invalid/);
  assert.throws(() => mapConfirmedTerminalReads(state, [{id: hash("c"), path: "src/parser.ts", start_line: 10, end_line: 20, source_sha256: hash("a")}], [binding, binding]), /native-read-binding-invalid/);
  assert.throws(() => mapConfirmedTerminalReads(createIntentAnchorState("Parser rejects trailing commas. Documentation must describe valid configuration."), [], []), /premature-finish/);
});

test("terminal mode skips a tool-confirmed read absent from every model-facing receipt", () => {
  let state = ready();
  const query = state.queries[0];
  state = recordHintSupport(state, {anchor_id: query.anchor_id, query_sha256: query.query_sha256, path: "src/late.ts", start_line: 1, end_line: 3, content_sha256: hash("b")});
  state = confirmBaseRead(state, {path: "src/late.ts", start_line: 1, end_line: 3, content_sha256: hash("b"), base_revision_confirmed: true});
  const bindings = state.confirmed_base_reads.map((confirmed, index) => bindConfirmedBaseRead(state, {convergence_read_id: confirmed.read_id, native_read_id: hash(index ? "d" : "c"), source_revision: "base", path: confirmed.path, start_line: confirmed.start_line, end_line: confirmed.end_line, source_sha256: confirmed.content_sha256}));
  const delivered = bindings.find(binding => binding.path === "src/parser.ts");
  const nativeReads = [{id: delivered.native_read_id, path: delivered.path, start_line: delivered.start_line, end_line: delivered.end_line, source_sha256: delivered.source_sha256}];
  assert.throws(() => mapConfirmedTerminalReads(state, nativeReads, bindings), /native-read-binding-invalid/);
  const result = mapConfirmedTerminalReads(state, nativeReads, bindings, {omit_undelivered: true});
  assert.deepEqual(result.selected_native_read_ids, [delivered.native_read_id]);
  assert.throws(() => mapConfirmedTerminalReads(state, [], bindings, {omit_undelivered: true}), /no-delivered-confirmed-read/);
});
