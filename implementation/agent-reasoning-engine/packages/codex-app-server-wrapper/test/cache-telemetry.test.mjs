import assert from "node:assert/strict";
import test from "node:test";

import {compareProviderCacheObservations, extractProviderCacheUsage} from "../index.mjs";

const projection = {projection_digest: "projection", exact_prefix_digest: "prefix", stable_request_prefix: {provider_ref: "openai", model_ref: "codex"}};
const profile = {enabled: true, usage_paths: ["result.usage"], fields: {input_tokens: "input", cached_input_tokens: "cached", latency_ms: "latency"}};

test("cache telemetry extraction uses only configured provider fields", () => {
  const absent = extractProviderCacheUsage({result: {tokens: {input: 10, cached: 9}}}, projection, profile);
  assert.equal(absent.disposition, "not-observed");
  const observed = extractProviderCacheUsage({result: {usage: {input: 100, cached: 80, latency: 25}}}, projection, profile);
  assert.equal(observed.disposition, "observed");
  assert.equal(observed.provider_usage.cached_input_tokens, 80);
  assert.equal(observed.provider_usage.projection_digest, "projection");
});

test("cold/warm comparisons require exact prefix identity", () => {
  const cold = {cache_hit_posture: "observed-miss", projection_digest: "p", exact_prefix_digest: "x", observed_cached_input_tokens: 0, observed_latency_ms: 100};
  const warm = {cache_hit_posture: "observed-hit", projection_digest: "p", exact_prefix_digest: "x", observed_cached_input_tokens: 750, observed_latency_ms: 60};
  assert.deepEqual(compareProviderCacheObservations(cold, warm), {ok: true, disposition: "compared", projection_digest: "p", exact_prefix_digest: "x", cached_input_token_delta: 750, latency_delta_ms: 40, claim_ceiling: "Observed provider telemetry comparison only; no freshness, correctness, provenance, or authority claim.", authority_effect: "none"});
  assert.equal(compareProviderCacheObservations(cold, {...warm, exact_prefix_digest: "other"}).ok, false);
});
