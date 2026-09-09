import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  BindingGuardError,
  INELIGIBLE_FOR,
  validateBindingContract,
  validateBundleStructure,
  validatePinnedBundle,
} from "../assets/binding-guard.mjs";
import {
  BINDING_ROUTE,
  loadPinnedMintedFixture,
} from "../assets/gateway.mjs";

const TEST_ROOT = dirname(fileURLToPath(import.meta.url));
const DEMO_ROOT = resolve(TEST_ROOT, "..");
const REPO_ROOT = resolve(TEST_ROOT, "../../../..");

const FIXTURE_PATHS = {
  graph: "projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/graph.json",
  source_manifest: "projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/source-manifest.json",
  build_receipt: "projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/build-receipt.json",
};

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

async function loadInputs() {
  const binding = await readJson(resolve(DEMO_ROOT, "contracts/source-binding.v1.json"));
  const artifacts = {};
  for (const [role, path] of Object.entries(FIXTURE_PATHS)) {
    const bytes = new Uint8Array(await readFile(resolve(REPO_ROOT, path)));
    artifacts[role] = { bytes, json: JSON.parse(new TextDecoder().decode(bytes)) };
  }
  return { binding, artifacts };
}

function clone(value) {
  return structuredClone(value);
}

function hasCode(code) {
  return (error) => error instanceof BindingGuardError && error.code === code;
}

test("binding and Draft 2020-12 schema are strict and complete", async () => {
  const { binding } = await loadInputs();
  const schema = await readJson(resolve(DEMO_ROOT, "contracts/source-binding.v1.schema.json"));
  assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
  assert.equal(schema.additionalProperties, false);
  assert.equal(schema.properties.inputs.additionalProperties, false);
  assert.equal(schema.properties.expected.additionalProperties, false);
  assert.deepEqual(validateBindingContract(binding), binding);
  assert.deepEqual(binding.ineligible_for, INELIGIBLE_FOR);
});

test("the exact pinned bundle emits the A1 handle", async () => {
  const { binding, artifacts } = await loadInputs();
  const result = await validatePinnedBundle(binding, artifacts);
  assert.equal(result.status, "pass");
  assert.equal(result.handle, "iolm-fixture-boundary/v1");
  assert.deepEqual(result.counts, { nodes: 4, edges: 3 });
  assert.equal(result.posture, "candidate");
  assert.equal(result.authority_effect, "none");
  assert.deepEqual(result.ineligible_for, INELIGIBLE_FOR);
});

for (const [role, code] of [
  ["graph", "BIND_GRAPH_HASH_MISMATCH"],
  ["source_manifest", "BIND_MANIFEST_HASH_MISMATCH"],
  ["build_receipt", "BIND_RECEIPT_HASH_MISMATCH"],
]) {
  test(`${role} byte drift fails with ${code}`, async () => {
    const { binding, artifacts } = await loadInputs();
    const changed = new Uint8Array(artifacts[role].bytes);
    changed[changed.length - 2] ^= 1;
    artifacts[role] = { ...artifacts[role], bytes: changed };
    await assert.rejects(() => validatePinnedBundle(binding, artifacts), hasCode(code));
  });
}

for (const [field, value, code] of [
  ["source_set_digest", "0".repeat(64), "BIND_SOURCE_SET_MISMATCH"],
  ["profile_ref", "other-profile@1", "BIND_PROFILE_MISMATCH"],
  ["profile_digest", "0".repeat(64), "BIND_PROFILE_MISMATCH"],
  ["generator_version", "other-generator/v1", "BIND_GENERATOR_MISMATCH"],
  ["kinds_digest", "0".repeat(64), "BIND_REGISTRY_MISMATCH"],
  ["relationships_digest", "0".repeat(64), "BIND_REGISTRY_MISMATCH"],
]) {
  test(`binding field ${field} is pinned`, async () => {
    const { binding } = await loadInputs();
    binding.expected[field] = value;
    assert.throws(() => validateBindingContract(binding), hasCode(code));
  });
}

test("alternate path and eligibility-fence drift are rejected", async () => {
  const { binding } = await loadInputs();
  const alternate = clone(binding);
  alternate.inputs.graph.path = `./${alternate.inputs.graph.path}`;
  assert.throws(() => validateBindingContract(alternate), hasCode("BIND_PATH_NOT_CANONICAL_ALLOWLIST"));
  const fence = clone(binding);
  fence.ineligible_for.pop();
  assert.throws(() => validateBindingContract(fence), hasCode("BIND_ELIGIBILITY_FENCE_MISMATCH"));
});

test("manifest missing and ambiguous joins fail closed", async () => {
  const { binding, artifacts } = await loadInputs();
  const parsed = Object.fromEntries(Object.entries(artifacts).map(([role, artifact]) => [role, clone(artifact.json)]));
  parsed.source_manifest.records.pop();
  assert.throws(() => validateBundleStructure(binding, parsed), hasCode("MANIFEST_JOIN_MISSING"));

  const ambiguous = Object.fromEntries(Object.entries(artifacts).map(([role, artifact]) => [role, clone(artifact.json)]));
  ambiguous.source_manifest.records.push(clone(ambiguous.source_manifest.records[0]));
  assert.throws(() => validateBundleStructure(binding, ambiguous), hasCode("MANIFEST_JOIN_AMBIGUOUS"));
});

test("unresolved endpoints and provenance digest drift fail closed", async () => {
  const { binding, artifacts } = await loadInputs();
  const endpoint = Object.fromEntries(Object.entries(artifacts).map(([role, artifact]) => [role, clone(artifact.json)]));
  endpoint.graph.edges[0].to = "key-and-door.Missing";
  assert.throws(() => validateBundleStructure(binding, endpoint), hasCode("EDGE_ENDPOINT_UNRESOLVED"));

  const provenance = Object.fromEntries(Object.entries(artifacts).map(([role, artifact]) => [role, clone(artifact.json)]));
  provenance.source_manifest.records[0].source_digest = "0".repeat(64);
  assert.throws(() => validateBundleStructure(binding, provenance), hasCode("MANIFEST_SOURCE_DIGEST_MISMATCH"));
});

test("gateway performs only four exact GET requests and returns the guarded bundle", async () => {
  const { binding, artifacts } = await loadInputs();
  const payloadByRoute = new Map([[BINDING_ROUTE, new TextEncoder().encode(JSON.stringify(binding))]]);
  for (const [role, entry] of Object.entries(binding.inputs)) {
    payloadByRoute.set(entry.route, artifacts[role].bytes);
  }
  const requests = [];
  const fetchImpl = async (route, options) => {
    requests.push({ route, options });
    const payload = payloadByRoute.get(route);
    return payload
      ? new Response(payload, { status: 200, headers: { "Content-Type": "application/json" } })
      : new Response("", { status: 404 });
  };
  const result = await loadPinnedMintedFixture({ fetchImpl });
  assert.equal(result.handle, "iolm-fixture-boundary/v1");
  assert.deepEqual(requests.map(({ route }) => route), [
    BINDING_ROUTE,
    "/fixtures/graph.json",
    "/fixtures/source-manifest.json",
    "/fixtures/build-receipt.json",
  ]);
  assert.ok(requests.every(({ options }) => options.method === "GET" && options.cache === "no-store"));
});

test("gateway does not fall back after a missing fixture route", async () => {
  const { binding, artifacts } = await loadInputs();
  const payloadByRoute = new Map([
    [BINDING_ROUTE, new TextEncoder().encode(JSON.stringify(binding))],
    [binding.inputs.graph.route, artifacts.graph.bytes],
    [binding.inputs.build_receipt.route, artifacts.build_receipt.bytes],
  ]);
  const requests = [];
  const fetchImpl = async (route) => {
    requests.push(route);
    const payload = payloadByRoute.get(route);
    return payload ? new Response(payload, { status: 200 }) : new Response("", { status: 404 });
  };
  await assert.rejects(() => loadPinnedMintedFixture({ fetchImpl }), /FIXTURE_FETCH_FAILED/);
  assert.deepEqual(requests, [BINDING_ROUTE, binding.inputs.graph.route, binding.inputs.source_manifest.route]);
});
