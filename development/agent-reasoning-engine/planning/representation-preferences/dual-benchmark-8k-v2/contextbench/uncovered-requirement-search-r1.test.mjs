import {test} from "node:test";
import assert from "node:assert/strict";
import {uncoveredRequirementQueries, planUncoveredRequirementReads} from "./uncovered-requirement-search-r1.mjs";

const result = (path, term, total) => ({ok: true, output: {total, observations: [{path, start_line: 75, end_line: 75, total_lines: 300, source_revision: "base", utf8: term}]}});

test("searches an uncovered distinctive term despite existing wide source reads", () => {
  const queries = uncoveredRequirementQueries("Allow custom precision in error reports for floating-point numbers", [
    {path: "include/internal/catch_matchers_floating.cpp", body: "floating-point matcher implementation"}
  ]);
  assert.deepEqual(queries, ["custom", "precision"]);
});

test("prefers a rare source hit and ignores test-only matches", () => {
  const plans = planUncoveredRequirementReads([
    {query: "floating-point", result: result("tests/floating.cpp", "floating-point", 2)},
    {query: "custom", result: result("include/internal/other.cpp", "custom", 59)},
    {query: "precision", result: result("include/internal/catch_tostring.cpp", "precision", 5)}
  ]);
  assert.equal(plans[0].query, "precision");
  assert.equal(plans[0].args.path, "include/internal/catch_tostring.cpp");
  assert.equal(plans.length, 2);
});

test("does not repeat a previously planned region", () => {
  const first = planUncoveredRequirementReads([{query: "precision", result: result("src/format.cpp", "precision", 3)}], new Set(), 1);
  assert.equal(first.length, 1);
  assert.deepEqual(planUncoveredRequirementReads([{query: "precision", result: result("src/format.cpp", "precision", 3)}], new Set([first[0].region]), 1), []);
});

test("does not plan bundled test frameworks or generated mocks", () => {
  const plans = planUncoveredRequirementReads([
    {query: "partial", result: {ok: true, output: {total: 3, observations: [
      {path: "lib/gtest/gtest/gtest-printers.h", start_line: 75, end_line: 75, total_lines: 300, source_revision: "base", utf8: "partial"},
      {path: "internal/codespaces/connection/tunnels_api_server_mock.go", start_line: 75, end_line: 75, total_lines: 300, source_revision: "base", utf8: "partial"},
      {path: "src/product/partial.go", start_line: 75, end_line: 75, total_lines: 300, source_revision: "base", utf8: "partial"}
    ]}}}
  ]);
  assert.deepEqual(plans.map(plan => plan.args.path), ["src/product/partial.go"]);
});
