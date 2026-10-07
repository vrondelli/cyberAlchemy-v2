import assert from "node:assert/strict";
import test from "node:test";
import {planSearchFollowThrough} from "./search-followthrough-live-r1.mjs";

const source = line => ({path: "lib/compress/zstd_compress.c", source_revision: "base", start_line: line, end_line: line, total_lines: 3000});
const args = {query: "dictLimit", path_prefix: "lib/compress", revision: "base", offset: 0, limit: 20};

test("follows distinct implementation-source regions in a bounded search page", () => {
  const result = {ok: true, output: {observations: [source(982), source(983), source(1295), source(1300), source(2308)]}};
  const plans = planSearchFollowThrough({args, result, seenRegions: new Set()});
  assert.deepEqual(plans.map(plan => [plan.args.path, plan.args.start_line, plan.args.line_count]), [
    ["lib/compress/zstd_compress.c", 966, 33], ["lib/compress/zstd_compress.c", 1279, 33]
  ]);
});

test("rejects generic queries, broad searches, headers, tests, and duplicate regions", () => {
  const result = {ok: true, output: {observations: [source(1295), {...source(1400), path: "lib/compress/tests/test.c"}, {...source(1500), path: "lib/compress/zstd_compress_internal.h"}]}};
  assert.deepEqual(planSearchFollowThrough({args: {...args, query: "start"}, result, seenRegions: new Set()}), []);
  assert.deepEqual(planSearchFollowThrough({args: {...args, path_prefix: "lib"}, result, seenRegions: new Set()}), []);
  assert.deepEqual(planSearchFollowThrough({args, result, seenRegions: new Set(["lib/compress/zstd_compress.c:20"])}), []);
});
