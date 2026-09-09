import assert from "node:assert/strict";
import test from "node:test";

import {compareProviderCacheObservations} from "../../../packages/codex-app-server-wrapper/index.mjs";

test("cache benchmark reports measured warm deltas only for the same exact prefix", () => {
  const cold = {cache_hit_posture: "observed-miss", projection_digest: "projection:1", exact_prefix_digest: "prefix:1", observed_cached_input_tokens: 0, observed_latency_ms: 130};
  const warm = {cache_hit_posture: "observed-hit", projection_digest: "projection:1", exact_prefix_digest: "prefix:1", observed_cached_input_tokens: 1024, observed_latency_ms: 80};
  const result = compareProviderCacheObservations(cold, warm);
  assert.equal(result.ok, true);
  assert.equal(result.cached_input_token_delta, 1024);
  assert.equal(result.latency_delta_ms, 50);
  assert.equal(compareProviderCacheObservations(cold, {...warm, exact_prefix_digest: "prefix:changed"}).disposition, "not-comparable");
});
