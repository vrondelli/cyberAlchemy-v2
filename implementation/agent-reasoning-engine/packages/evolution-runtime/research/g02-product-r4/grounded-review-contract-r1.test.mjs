import test from "node:test";
import assert from "node:assert/strict";
import {prompt, validateGroundedReview} from "./grounded-review-contract-r1.mjs";

const packet = {
  issue: "When login expires, refresh the session token before serving protected pages.",
  current_selected_files: ["src/old.js", "src/router.js"],
  delivered_reads: [
    {index: 0, path: "src/old.js", snippet: "function legacyLogin() { return staleToken; }"},
    {index: 1, path: "src/router.js", snippet: "function serveProtectedPage() { return route(); }"},
    {index: 2, path: "src/refresh.js", snippet: "function refreshSessionToken() { return renewedToken; }"},
  ],
};
const add = {read_index: 2, requirement_quote: "refresh the session token",
  evidence_quote: "function refreshSessionToken()", causal_role: "Refreshes the session token before protected pages."};
const drop = {file: "src/old.js", own_read_index: 0,
  own_evidence_quote: "function legacyLogin()", replacement_read_index: 2,
  replacement_evidence_quote: "function refreshSessionToken()",
  requirement_quote: "refresh the session token",
  causal_role: "The refresh handler owns renewal; the legacy login path does not."};

test("prompt fixes abstention, exact citations, and bounded edits", () => {
  assert.match(prompt, /Empty arrays mean abstain/);
  assert.match(prompt, /lexical overlap alone is insufficient/);
  assert.match(prompt, /at most five adds and three drops/);
});

test("empty answer abstains without changing the original selection", () => {
  assert.deepEqual(validateGroundedReview({add: [], drop: []}, packet),
    {add_read_indexes: [], drop_files: [], citations: {add: [], drop: []}, abstained: true});
});

test("accepts a cited addition and a drop only when its replacement is retained", () => {
  const result = validateGroundedReview({add: [add], drop: [drop]}, packet);
  assert.deepEqual(result.add_read_indexes, [2]);
  assert.deepEqual(result.drop_files, ["src/old.js"]);
  assert.equal(result.abstained, false);
});

test("rejects fabricated issue or source citations", () => {
  assert.throws(() => validateGroundedReview({add: [{...add, requirement_quote: "invented requirement"}], drop: []}, packet), /add-citation/);
  assert.throws(() => validateGroundedReview({add: [{...add, evidence_quote: "invented function"}], drop: []}, packet), /add-citation/);
});

test("rejects a dropped file without a retained cited replacement", () => {
  assert.throws(() => validateGroundedReview({add: [], drop: [drop]}, packet), /replacement-not-retained/);
  assert.throws(() => validateGroundedReview({add: [add], drop: [{...drop, own_read_index: 1}]}, packet), /drop-handles/);
});

test("rejects invented, repeated, and already-selected add handles", () => {
  for (const value of [
    [{...add, read_index: 99}],
    [{...add, read_index: 0}],
    [add, add],
  ]) assert.throws(() => validateGroundedReview({add: value, drop: []}, packet), /add-handle/);
});

test("rejects extra keys and duplicate delivered indexes", () => {
  assert.throws(() => validateGroundedReview({add: [], drop: [], score: 1}, packet), /response-shape/);
  const duplicate = {...packet, delivered_reads: [...packet.delivered_reads, packet.delivered_reads[0]]};
  assert.throws(() => validateGroundedReview({add: [], drop: []}, duplicate), /handle-shape/);
});
