import assert from "node:assert/strict";
import test from "node:test";
import {admitRankQuery, confirmBaseRead, convergenceReadiness, createIntentAnchorState, deriveIssueAnchors, recordHintSupport, selectAnchorForQuery, selectTerminalReads, stripIssueTemplateNoise, verifyIntentAnchorState} from "./intent-anchor-convergence-r3.mjs";

const objective = "Parser errors lose the original source location. Preserve the location through normalization. Add regression coverage for nested declarations.";
const content = "a".repeat(64);

test("anchors are deterministic, bounded, distinct and objective-only", () => {
  const first = deriveIssueAnchors(objective, {maximum_anchors: 3});
  assert.deepEqual(first, deriveIssueAnchors(objective, {maximum_anchors: 3}));
  assert.equal(first.length, 3);
  assert.equal(new Set(first.map((item) => item.signature_sha256)).size, first.length);
  assert.equal(JSON.stringify(first).includes("gold"), false);
});

test("opt-in issue anchors exclude template noise and retain substantive description", () => {
  const issue = "Add cs rebuild command\n\n<!-- Thank you for contributing! Fixes #NUMBER -->\n\nFixes #6380\n\nAdds a new codespace rebuild command that rebuilds a codespace.\n\n<img alt=\"demo\" src=\"demo.png\">";
  const clean = stripIssueTemplateNoise(issue);
  assert.equal(clean.includes("Thank you"), false);
  assert.equal(clean.includes("Fixes #6380"), false);
  const original = deriveIssueAnchors(issue);
  const revised = deriveIssueAnchors(issue, {issue_template_aware: true});
  assert.equal(original[1].terms.includes("thank"), true);
  assert.equal(revised[1].terms.includes("codespace"), true);
  assert.equal(revised[1].source_index > 0, true);
});

test("opt-in issue anchors skip standalone description headings", () => {
  const issue = "flush() on self.stdout/stderr management commands doesn't work.\nDescription\n\t\nflush() is notably called during migrate command; it doesn't work.\nExpected behavior:\nMigration progress appears promptly.";
  const clean = stripIssueTemplateNoise(issue);
  assert.equal(clean.split("\n").some(line => /^description$/i.test(line.trim())), false);
  const anchors = deriveIssueAnchors(issue, {issue_template_aware: true});
  assert.equal(anchors[1].terms.includes("description"), false);
  assert.equal(anchors[1].terms.includes("flush"), true);
  assert.equal(anchors[1].terms.includes("migrate"), true);
});

test("opt-in finish needs a confirmed read supported by substantive issue text", () => {
  const issue = "Add cs rebuild command\n\n<!-- issue template -->\n\nAdds a new codespace rebuild command that rebuilds a codespace.";
  let state = createIntentAnchorState(issue, {issue_template_aware: true});
  const [title, body] = state.anchors;
  const q1 = admitRankQuery(state, {anchor_id: title.anchor_id, query: "add rebuild command"}); state = q1.state;
  const q2 = admitRankQuery(state, {anchor_id: body.anchor_id, query: "codespace rebuild"}); state = q2.state;
  state = recordHintSupport(state, {anchor_id: title.anchor_id, query_sha256: q1.query_sha256, path: "pkg/cmd/gpg-key/add.go", start_line: 1, end_line: 20, content_sha256: content});
  state = confirmBaseRead(state, {path: "pkg/cmd/gpg-key/add.go", start_line: 1, end_line: 20, content_sha256: content, base_revision_confirmed: true});
  assert.equal(convergenceReadiness(state).ready, true, "legacy behavior stays unchanged");
  assert.equal(convergenceReadiness(state, {substantive_read_gate: true}).ready, false);
  state = recordHintSupport(state, {anchor_id: body.anchor_id, query_sha256: q2.query_sha256, path: "pkg/cmd/codespace/rebuild.go", start_line: 1, end_line: 20, content_sha256: content});
  state = confirmBaseRead(state, {path: "pkg/cmd/codespace/rebuild.go", start_line: 1, end_line: 20, content_sha256: content, base_revision_confirmed: true});
  assert.equal(convergenceReadiness(state, {substantive_read_gate: true}).ready, true);
});

test("a later substantive hint can support an already confirmed identical base read", () => {
  const issue = "Add floating matcher behavior\n\nFix floating-point matcher tolerance for edge cases.";
  let state = createIntentAnchorState(issue, {issue_template_aware: true});
  const [title, body] = state.anchors;
  const first = admitRankQuery(state, {anchor_id: title.anchor_id, query: "floating matcher"}); state = first.state;
  const second = admitRankQuery(state, {anchor_id: body.anchor_id, query: "tolerance edge cases"}); state = second.state;
  state = recordHintSupport(state, {anchor_id: title.anchor_id, query_sha256: first.query_sha256, path: "src/floating.cpp", start_line: 3, end_line: 42, content_sha256: content});
  state = confirmBaseRead(state, {path: "src/floating.cpp", start_line: 3, end_line: 42, content_sha256: content, base_revision_confirmed: true});
  assert.equal(convergenceReadiness(state, {substantive_read_gate: true}).ready, false);
  const readId = state.confirmed_base_reads[0].read_id;
  state = recordHintSupport(state, {anchor_id: body.anchor_id, query_sha256: second.query_sha256, path: "src/floating.cpp", start_line: 3, end_line: 42, content_sha256: content});
  assert.equal(state.confirmed_base_reads.length, 1);
  assert.equal(state.confirmed_base_reads[0].read_id, readId);
  assert.equal(state.confirmed_base_reads[0].support_sha256.length, 2);
  assert.equal(convergenceReadiness(state, {substantive_read_gate: true}).ready, true);
  assert.equal(verifyIntentAnchorState(state).ok, true);
});

test("query admission rejects duplicates and forces unexplored-anchor coverage", () => {
  const initial = createIntentAnchorState(objective);
  const [a, b] = initial.anchors;
  const one = admitRankQuery(initial, {anchor_id: a.anchor_id, query: "parser source location"});
  assert.equal(one.accepted, true);
  assert.equal(admitRankQuery(one.state, {anchor_id: a.anchor_id, query: " Parser, SOURCE location! "}).reason, "duplicate-query");
  assert.equal(admitRankQuery(one.state, {anchor_id: a.anchor_id, query: "normalization mapping"}).reason, "unexplored-anchor-required");
  assert.equal(admitRankQuery(one.state, {anchor_id: b.anchor_id, query: "nested declaration coverage"}).accepted, true);
});

test("query mapping deterministically prefers an unexplored matching anchor", () => {
  const initial = createIntentAnchorState(objective);
  const first = selectAnchorForQuery(initial, "parser location");
  const admitted = admitRankQuery(initial, {anchor_id: first, query: "parser location"});
  const second = selectAnchorForQuery(admitted.state, "nested declaration coverage");
  assert.notEqual(second, first);
  assert.equal(second, selectAnchorForQuery(admitted.state, "nested declaration coverage"));
});

test("only anchor-supported confirmed base reads can reach a terminal packet", () => {
  let state = createIntentAnchorState(objective);
  const [a, b] = state.anchors;
  const q1 = admitRankQuery(state, {anchor_id: a.anchor_id, query: "parser location"}); state = q1.state;
  const q2 = admitRankQuery(state, {anchor_id: b.anchor_id, query: "normalization nested declaration"}); state = q2.state;
  assert.equal(convergenceReadiness(state).ready, false);
  state = recordHintSupport(state, {anchor_id: a.anchor_id, query_sha256: q1.query_sha256, path: "src/parser.js", start_line: 10, end_line: 30, content_sha256: content});
  assert.throws(() => confirmBaseRead(state, {path: "src/other.js", start_line: 1, end_line: 2, content_sha256: content, base_revision_confirmed: true}), /base-read-unsupported/);
  state = confirmBaseRead(state, {path: "src/parser.js", start_line: 12, end_line: 20, content_sha256: content, base_revision_confirmed: true});
  assert.equal(convergenceReadiness(state).ready, true);
  assert.deepEqual(selectTerminalReads(state).map((item) => item.path), ["src/parser.js"]);
  assert.equal(verifyIntentAnchorState(state).ok, true);
  assert.equal(verifyIntentAnchorState({...state, objective_sha256: content}).ok, false);
});

test("premature finish fails closed", () => {
  assert.throws(() => selectTerminalReads(createIntentAnchorState(objective)), /premature-finish/);
});
