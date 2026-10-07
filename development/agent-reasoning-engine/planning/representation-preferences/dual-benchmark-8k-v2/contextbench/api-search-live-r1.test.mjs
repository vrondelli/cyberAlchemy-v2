import assert from "node:assert/strict";
import test from "node:test";
import {planApiSearchFollowThrough} from "./api-search-live-r1.mjs";

const source = (path, line) => ({path, source_revision: "base", start_line: line, end_line: line, total_lines: 3000});
const objective = "Check potential overflow of compressBound() for a bogus srcSize";
const args = {query: "ZSTD_COMPRESSBOUND(srcSize)", path_prefix: "lib", revision: "base", offset: 0, limit: 20};

test("task API identifier admits bounded implementation and header reads under a one-segment prefix", () => {
  const result = {ok: true, output: {observations: [source("lib/compress/zstd_compress.c", 61), source("lib/zstd.h", 342), source("lib/zstd.h", 410)]}};
  const plans = planApiSearchFollowThrough({args, result, objective, seenRegions: new Set()});
  assert.deepEqual(plans.map(plan => plan.path), ["lib/compress/zstd_compress.c", "lib/zstd.h"]);
  assert.deepEqual(plans.map(plan => plan.args.start_line), [45, 326]);
});

test("API follow-through rejects unrelated identifiers, broad root, tests, and previously read files", () => {
  const result = {ok: true, output: {observations: [source("lib/compress/zstd_compress.c", 61), source("lib/zstd.h", 342)]}};
  assert.deepEqual(planApiSearchFollowThrough({args: {...args, query: "RETURN_ERROR_IF("}, result, objective, seenRegions: new Set()}), []);
  assert.deepEqual(planApiSearchFollowThrough({args: {...args, path_prefix: "."}, result, objective, seenRegions: new Set()}), []);
  assert.deepEqual(planApiSearchFollowThrough({args, result: {ok: true, output: {observations: [source("lib/tests/test.c", 20)]}}, objective, seenRegions: new Set()}), []);
  assert.deepEqual(planApiSearchFollowThrough({args, result, objective, seenRegions: new Set(["lib/compress/zstd_compress.c:0", "lib/zstd.h:5"])}), []);
});
