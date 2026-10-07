import assert from "node:assert/strict";
import test from "node:test";
import {planObjectiveSearchFollowThrough} from "./objective-search-live-r1.mjs";

const observation = (path, line) => ({path, source_revision: "base", start_line: line, end_line: line, total_lines: 3000});
const args = {query: "first", path_prefix: "lib/compress", revision: "base", offset: 0, limit: 20};
const result = {ok: true, output: {observations: [
  observation("lib/compress/huf_compress.c", 565),
  observation("lib/compress/zstd_compress.c", 1342),
  observation("lib/compress/zstd_compress.c", 1399)
]}};

test("objective-term search follows distinct implementation files before duplicate regions", () => {
  const plans = planObjectiveSearchFollowThrough({args, result, objective: "Ensure that first input position is valid for a match", seenRegions: new Set()});
  assert.deepEqual(plans.map(plan => plan.path), ["lib/compress/huf_compress.c", "lib/compress/zstd_compress.c"]);
  assert.deepEqual(plans.map(plan => plan.args.start_line), [549, 1326]);
});

test("objective-term search rejects unrelated terms, broad paths, headers, tests, and used files", () => {
  const objective = "Ensure that first input position is valid for a match";
  assert.deepEqual(planObjectiveSearchFollowThrough({args: {...args, query: "prefixStart"}, result, objective, seenRegions: new Set()}), []);
  assert.deepEqual(planObjectiveSearchFollowThrough({args: {...args, path_prefix: "lib"}, result, objective, seenRegions: new Set()}), []);
  const filtered = {ok: true, output: {observations: [observation("lib/compress/tests/test.c", 10), observation("lib/compress/zstd_internal.h", 12)]}};
  assert.deepEqual(planObjectiveSearchFollowThrough({args, result: filtered, objective, seenRegions: new Set()}), []);
  assert.deepEqual(planObjectiveSearchFollowThrough({args, result, objective, seenRegions: new Set(["lib/compress/huf_compress.c:8", "lib/compress/zstd_compress.c:20"])}), []);
});
