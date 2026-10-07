import assert from "node:assert/strict";
import test from "node:test";
import {distinctiveSearchQueries, inferSourcePrefix, planDistinctiveSourceReads} from "./distinctive-source-acquisition-r1.mjs";

const issue = "fix: improve parsing of `:nth-of-type(xn+b)`\n\ncloses #9969\n\nthis also fixes the following along the way: the `+` in `nth-of-type(+xn-b)` would be parsed as a combinator.";
const observation = (path, line = 50) => ({path, source_revision: "base", start_line: line, end_line: line, total_lines: 200});

test("extracts a distinctive exact identifier and bounded code-style variants", () => {
  assert.deepEqual(distinctiveSearchQueries(issue), ["nth-of-type", "Nth", "nth"]);
  assert.ok(distinctiveSearchQueries("Add fail message for non-existent hostname").includes("hostname"));
  assert.deepEqual(distinctiveSearchQueries("SVG elements in <slot> not rendered as SVG elements"), ["elements", "rendered"]);
  assert.deepEqual(distinctiveSearchQueries("SVG elements in <slot> not rendered as SVG elements", true), ["SVG", "slot", "elements"]);
  assert.equal(distinctiveSearchQueries("Handle `--bare` clone targets", true)[0], "--bare");
});

test("prioritizes root implementation source over site source on a short acronym hit", () => {
  const result = {ok: true, output: {observations: [observation("site/src/routes/example.ts"), observation("src/compiler/compile/nodes/Element.ts"), observation("src/runtime/internal/dom.ts")]}};
  assert.deepEqual(planDistinctiveSourceReads(result, new Set(), 2, true).map(plan => plan.path), ["src/compiler/compile/nodes/Element.ts", "src/runtime/internal/dom.ts"]);
});

test("derives a source root from a test-path hit and reads only implementation files", () => {
  const exact = {ok: true, output: {observations: [observation("documentation/blog/nth.md"), observation("packages/svelte/tests/parser-modern/samples/css-nth-syntax/input.svelte")]}};
  assert.equal(inferSourcePrefix(exact), "packages/svelte/src");
  const source = {ok: true, output: {observations: [observation("packages/svelte/tests/parser-modern/fixture.js"), observation("packages/svelte/src/compiler/phases/1-parse/read/style.js"), observation("packages/svelte/src/compiler/phases/2-analyze/css/Selector.js"), observation("packages/svelte/src/compiler/types/css.d.ts")]}};
  const plans = planDistinctiveSourceReads(source);
  assert.deepEqual(plans.map(plan => plan.path), ["packages/svelte/src/compiler/phases/1-parse/read/style.js", "packages/svelte/src/compiler/phases/2-analyze/css/Selector.js"]);
  assert.ok(plans.every(plan => plan.args.revision === "base" && plan.args.line_count <= 33));
});

test("distinctive acquisition admits Java and C++ headers but not test sources", () => {
  const paths = ["src/main/java/example/Foo.java", "src/include/foo.hpp", "src/include/foo.hh"];
  const result = {ok: true, output: {observations: [observation("src/test/java/example/FooTest.java"), ...paths.map(path => observation(path))]}};
  assert.deepEqual(planDistinctiveSourceReads(result, new Set(), 2, true).map(plan => plan.path), paths.slice(0, 2));
});
