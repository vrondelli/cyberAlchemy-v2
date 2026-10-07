import assert from "node:assert/strict";
import test from "node:test";
import {planApiSearchFollowThroughR2} from "./api-search-live-r2.mjs";
import {planSourceNeighborhood} from "./source-neighborhood-live-r1.mjs";

const source = (path, line) => ({path, source_revision: "base", start_line: line, end_line: line, total_lines: 3000});
const args = {query: "PublicKey", path_prefix: "pkg/cmd/secret", revision: "base", offset: 0, limit: 20};
const objective = "This uses the correct public key when setting environment secrets.";

test("compound API spelling grounds in objective and admits two distinct pkg source files", () => {
  const result = {ok: true, output: {observations: [source("pkg/cmd/secret/set/http.go", 49), source("pkg/cmd/secret/set/set.go", 170), source("pkg/cmd/secret/set/set.go", 190)]}};
  const plans = planApiSearchFollowThroughR2({args, result, objective, seenRegions: new Set()});
  assert.deepEqual(plans.map(plan => plan.path), ["pkg/cmd/secret/set/http.go", "pkg/cmd/secret/set/set.go"]);
  assert.equal(planSourceNeighborhood(source("pkg/cmd/secret/set/http.go", 49), new Set()), null);
});

test("rejects unrelated symbols, broad root, fixtures and exhausted read cap", () => {
  const result = {ok: true, output: {observations: [source("pkg/cmd/secret/set/http.go", 49)]}};
  const run = (changes = {}, otherResult = result, seenRegions = new Set()) => planApiSearchFollowThroughR2({args: {...args, ...changes}, result: otherResult, objective, seenRegions});
  assert.deepEqual(run({query: "GetPublicKey"}), []);
  assert.deepEqual(run({path_prefix: "."}), []);
  assert.deepEqual(run({}, {ok: true, output: {observations: [source("pkg/cmd/secret/tests/http.go", 49)]}}), []);
  assert.deepEqual(run({}, result, new Set(["pkg/cmd/secret/set/http.go:0"])), []);
});
