import assert from "node:assert/strict";
import test from "node:test";
import {eligibleApiSearchR3, nextApiSearchPageR3, planApiSearchFollowThroughR3} from "./api-search-live-r3.mjs";

const objective = "Validate git protocol config before setting it; reject invalid git_protocol values.";
const args = {query: "git_protocol", path_prefix: "internal/config", revision: "base", offset: 0, limit: 5};
const source = (path, line) => ({path, source_revision: "base", start_line: line, end_line: line, total_lines: 600});
const page = (observations, next_offset) => ({ok: true, output: {observations, next_offset}});

test("pages past duplicate test-file hits and selects a bounded implementation source", () => {
  const first = page(Array.from({length: 5}, (_, index) => source("internal/config/config_file_test.go", 75 + index)), 5);
  const second = page([source("internal/config/config_type.go", 159), source("internal/config/config_type.go", 499)], null);
  assert.equal(eligibleApiSearchR3({args, result: first, objective}), true);
  assert.deepEqual(nextApiSearchPageR3({args, result: first, visitedOffsets: new Set([0]), pageCount: 0}), {...args, offset: 5});
  const plans = planApiSearchFollowThroughR3({args, results: [first, second], objective, seenRegions: new Set()});
  assert.deepEqual(plans.map(plan => plan.path), ["internal/config/config_type.go"]);
  assert.deepEqual([plans[0].args.start_line, plans[0].args.line_count], [143, 33]);
});

test("does not page unrelated or current searches, replay offsets, or beyond the two-page cap", () => {
  const first = page([source("internal/config/config_type_test.go", 18)], 5);
  assert.equal(eligibleApiSearchR3({args: {...args, query: "unrelated"}, result: first, objective}), false);
  assert.equal(eligibleApiSearchR3({args: {...args, revision: "current"}, result: first, objective}), false);
  assert.deepEqual(planApiSearchFollowThroughR3({args, results: [first], objective, seenRegions: new Set()}), []);
  assert.equal(nextApiSearchPageR3({args, result: first, visitedOffsets: new Set([0, 5]), pageCount: 0}), null);
  assert.equal(nextApiSearchPageR3({args, result: first, visitedOffsets: new Set([0]), pageCount: 2}), null);
});
