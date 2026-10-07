import assert from "node:assert/strict";
import test from "node:test";
import {NEIGHBORHOOD_POLICY, planSourceNeighborhood} from "./source-neighborhood-live-r1.mjs";

const source = (overrides = {}) => ({path: "lib/compress/zstd_compress.c", source_revision: "base", start_line: 1295, end_line: 1295, total_lines: 3000, ...overrides});

test("plans a bounded base-source neighborhood without labels", () => {
  const seen = new Set(), plan = planSourceNeighborhood(source(), seen);
  assert.deepEqual(plan.args, {path: "lib/compress/zstd_compress.c", revision: "base", start_line: 1279, line_count: 33});
  seen.add(plan.region);
  assert.equal(planSourceNeighborhood(source({start_line: 1300, end_line: 1300}), seen), null);
  assert.equal(planSourceNeighborhood(source({start_line: 1, end_line: 1}), new Set()).args.start_line, 1);
  assert.equal(planSourceNeighborhood(source({start_line: 3000, end_line: 3000}), new Set()).args.line_count, 17);
});

test("excludes tests, non-base reads, malformed ranges, and exhausted caps", () => {
  assert.equal(planSourceNeighborhood(source({path: "tests/zstd_compress.c"}), new Set()), null);
  assert.equal(planSourceNeighborhood(source({source_revision: "current"}), new Set()), null);
  assert.equal(planSourceNeighborhood(source({end_line: 3001}), new Set()), null);
  assert.equal(planSourceNeighborhood(source(), new Set(Array.from({length: NEIGHBORHOOD_POLICY.maximum_reads}, (_, index) => String(index)))), null);
  assert.equal(planSourceNeighborhood(source({start_line: 1279, end_line: 1311}), new Set()), null);
});

test("admits bounded Java and C++ header source neighborhoods", () => {
  for (const path of ["src/main/java/example/Foo.java", "src/include/foo.hpp", "src/include/foo.hh"]) {
    const plan = planSourceNeighborhood(source({path, start_line: 40, end_line: 42, total_lines: 200}), new Set());
    assert.equal(plan?.path, path);
    assert.equal(plan.args.revision, "base");
    assert.ok(plan.args.line_count <= 33);
  }
});
