const CANONICAL_FIXTURES = Object.freeze({
  graph: Object.freeze({
    path: "projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/graph.json",
    route: "/fixtures/graph.json",
    sha256: "1f0691fac9ed9612605d62d8b390e9b39eca24b6f11a6b0868c7591c6179e7ae",
    hashCode: "BIND_GRAPH_HASH_MISMATCH",
  }),
  source_manifest: Object.freeze({
    path: "projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/source-manifest.json",
    route: "/fixtures/source-manifest.json",
    sha256: "ed4a1fdf4684b26fb5dbf086cf98f80050734ffea1d2c845503f0bf429e9cd6e",
    hashCode: "BIND_MANIFEST_HASH_MISMATCH",
  }),
  build_receipt: Object.freeze({
    path: "projects/domainspec-v2/impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/expected/build-receipt.json",
    route: "/fixtures/build-receipt.json",
    sha256: "14ac660824e8a697ef6ae3e20b18132bf99aa45f9adbe46e46e686db36260fbe",
    hashCode: "BIND_RECEIPT_HASH_MISMATCH",
  }),
});

const EXPECTED = Object.freeze({
  project_id: "key-and-door",
  source_set_digest: "33b2b650bcd5e4f4ab8c4f03c892bca8fcc660d167c9b6220a775e0b5bccdb1c",
  profile_ref: "feature-with-independent-node-files@1",
  profile_digest: "0868785499944ce2b21b915962cba48f8b21d627b840c24d81c77194e8864478",
  generator_version: "minted-project-tools/v1",
  kinds_digest: "4394968327b785d50cd323ad58a799feb71b9debf7e06b650b4fd1e4008f9ede",
  relationships_digest: "ffc97f2c358e4bebeebd8ceeb25aef59628be9c970cf6a7e510f7a37c9876d9f",
  node_count: 4,
  edge_count: 3,
  node_ids: Object.freeze([
    "key-and-door.DoorUnlocked",
    "key-and-door.HasKeyRule",
    "key-and-door.Player",
    "key-and-door.UnlockDoor",
  ]),
  edge_ids: Object.freeze([
    "key-and-door.edge.has-key-rule-enforces-unlock-door",
    "key-and-door.edge.player-performs-unlock-door",
    "key-and-door.edge.unlock-door-produces-door-unlocked",
  ]),
});

const EXPECTED_NODE_MEANING = Object.freeze({
  "key-and-door.DoorUnlocked": "Event",
  "key-and-door.HasKeyRule": "Rule",
  "key-and-door.Player": "Entity",
  "key-and-door.UnlockDoor": "Operation",
});

const EXPECTED_EDGE_MEANING = Object.freeze({
  "key-and-door.edge.has-key-rule-enforces-unlock-door": Object.freeze([
    "enforces",
    "key-and-door.HasKeyRule",
    "key-and-door.UnlockDoor",
  ]),
  "key-and-door.edge.player-performs-unlock-door": Object.freeze([
    "performs",
    "key-and-door.Player",
    "key-and-door.UnlockDoor",
  ]),
  "key-and-door.edge.unlock-door-produces-door-unlocked": Object.freeze([
    "produces",
    "key-and-door.UnlockDoor",
    "key-and-door.DoorUnlocked",
  ]),
});

export const INELIGIBLE_FOR = Object.freeze([
  "SWU-IOLM-00C-B",
  "SWU-IOLM-00C-C",
  "G-DSV2-SG",
  "CROSS_FEATURE_UNSUPPORTED",
  "promotion",
  "publication",
]);

export class BindingGuardError extends Error {
  constructor(code, field, message, { expected, actual } = {}) {
    super(`${code}: ${message}`);
    this.name = "BindingGuardError";
    this.code = code;
    this.field = field;
    this.expected = expected;
    this.actual = actual;
  }

  toJSON() {
    const result = {
      status: "block",
      code: this.code,
      field: this.field,
      message: this.message,
      owner_route: "private-learning-map-product-owner",
      recovery: "Restore the pinned contract or route the defect to SWU-IOLM-00C-UI-A1.",
      posture: "candidate",
      authority_effect: "none",
      ineligible_for: [...INELIGIBLE_FOR],
    };
    if (this.expected !== undefined) result.expected = this.expected;
    if (this.actual !== undefined) result.actual = this.actual;
    return result;
  }
}

function fail(code, field, message, expected, actual) {
  throw new BindingGuardError(code, field, message, { expected, actual });
}

function equal(actual, expected, code, field, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(code, field, message, expected, actual);
  }
}

function exactKeys(value, keys, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail("BIND_SCHEMA_INVALID", field, "Expected an object.", keys, value);
  }
  equal(Object.keys(value).sort(), [...keys].sort(), "BIND_SCHEMA_INVALID", `${field}.keys`, "Object fields must match the v1 contract exactly.");
}

export function validateBindingContract(binding) {
  exactKeys(binding, [
    "$schema",
    "schema_version",
    "binding_id",
    "artifact_role",
    "posture",
    "authority_effect",
    "owner_route",
    "inputs",
    "expected",
    "ineligible_for",
  ], "binding");

  const fixed = {
    $schema: "source-binding.v1.schema.json",
    schema_version: "iolm-source-binding/v1",
    binding_id: "key-and-door-pinned-fixture",
    artifact_role: "fixture-binding",
    posture: "candidate",
    authority_effect: "none",
    owner_route: "private-learning-map-product-owner",
  };
  for (const [field, expected] of Object.entries(fixed)) {
    equal(binding[field], expected, "BIND_SCHEMA_INVALID", field, "Binding identity or posture field is invalid.");
  }

  exactKeys(binding.inputs, Object.keys(CANONICAL_FIXTURES), "inputs");
  for (const [role, canonical] of Object.entries(CANONICAL_FIXTURES)) {
    const entry = binding.inputs[role];
    exactKeys(entry, ["path", "route", "sha256"], `inputs.${role}`);
    equal(entry.path, canonical.path, "BIND_PATH_NOT_CANONICAL_ALLOWLIST", `inputs.${role}.path`, "Fixture path is not the literal canonical path.");
    equal(entry.route, canonical.route, "BIND_ROUTE_MISMATCH", `inputs.${role}.route`, "Fixture route is not canonical.");
    equal(entry.sha256, canonical.sha256, canonical.hashCode, `inputs.${role}.sha256`, "Pinned hash is not canonical.");
  }

  exactKeys(binding.expected, Object.keys(EXPECTED), "expected");
  const fieldCodes = {
    source_set_digest: "BIND_SOURCE_SET_MISMATCH",
    profile_ref: "BIND_PROFILE_MISMATCH",
    profile_digest: "BIND_PROFILE_MISMATCH",
    generator_version: "BIND_GENERATOR_MISMATCH",
    kinds_digest: "BIND_REGISTRY_MISMATCH",
    relationships_digest: "BIND_REGISTRY_MISMATCH",
  };
  for (const [field, expected] of Object.entries(EXPECTED)) {
    equal(binding.expected[field], expected, fieldCodes[field] ?? "BIND_EXPECTATION_MISMATCH", `expected.${field}`, "Pinned expectation is not canonical.");
  }
  equal(binding.ineligible_for, INELIGIBLE_FOR, "BIND_ELIGIBILITY_FENCE_MISMATCH", "ineligible_for", "The complete eligibility fence is mandatory and ordered.");
  return binding;
}

function asBytes(value, field) {
  if (value instanceof Uint8Array) return value;
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  fail("BIND_ARTIFACT_BYTES_MISSING", field, "Artifact bytes must be a Uint8Array or ArrayBuffer.");
}

export async function sha256Hex(value) {
  const bytes = asBytes(value, "artifact.bytes");
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validateGraph(graph, expected) {
  equal(graph.schema_version, "minted-graph/v1", "BIND_GRAPH_SCHEMA_MISMATCH", "graph.schema_version", "Unexpected graph schema.");
  equal(graph.authority, "generated-semantic-read-model", "BIND_GRAPH_AUTHORITY_MISMATCH", "graph.authority", "Unexpected graph authority label.");
  equal(graph.project_id, expected.project_id, "BIND_PROJECT_MISMATCH", "graph.project_id", "Graph project differs.");
  equal(graph.source_set_digest, expected.source_set_digest, "BIND_SOURCE_SET_MISMATCH", "graph.source_set_digest", "Graph source-set digest differs.");
  equal(graph.language?.profile_digest, expected.profile_digest, "BIND_PROFILE_MISMATCH", "graph.language.profile_digest", "Graph profile digest differs.");
  equal(graph.language?.kinds_digest, expected.kinds_digest, "BIND_REGISTRY_MISMATCH", "graph.language.kinds_digest", "Graph kinds digest differs.");
  equal(graph.language?.relationships_digest, expected.relationships_digest, "BIND_REGISTRY_MISMATCH", "graph.language.relationships_digest", "Graph relationships digest differs.");
  if (!Array.isArray(graph.nodes) || !Array.isArray(graph.edges)) {
    fail("BIND_GRAPH_SHAPE_INVALID", "graph", "Graph nodes and edges must be arrays.");
  }
  const nodeIds = graph.nodes.map((node) => node?.node_id);
  const edgeIds = graph.edges.map((edge) => edge?.edge_id);
  equal(nodeIds, expected.node_ids, "BIND_NODE_SET_MISMATCH", "graph.nodes[].node_id", "Node IDs or order differ from the pinned set.");
  equal(edgeIds, expected.edge_ids, "BIND_EDGE_SET_MISMATCH", "graph.edges[].edge_id", "Edge IDs or order differ from the pinned set.");
  equal(new Set(nodeIds).size, expected.node_count, "BIND_NODE_SET_MISMATCH", "graph.nodes[].node_id", "Node IDs must be unique.");
  equal(new Set(edgeIds).size, expected.edge_count, "BIND_EDGE_SET_MISMATCH", "graph.edges[].edge_id", "Edge IDs must be unique.");
  for (const node of graph.nodes) {
    equal(node.feature_id, expected.project_id, "BIND_FEATURE_NAMESPACE_MISMATCH", `graph.nodes[${node.node_id}].feature_id`, "Node feature namespace differs.");
    equal(node.kind, EXPECTED_NODE_MEANING[node.node_id], "BIND_NODE_MEANING_MISMATCH", `graph.nodes[${node.node_id}].kind`, "Pinned node kind differs.");
  }
  const nodeSet = new Set(nodeIds);
  for (const edge of graph.edges) {
    const meaning = EXPECTED_EDGE_MEANING[edge.edge_id];
    if (!nodeSet.has(edge.from) || !nodeSet.has(edge.to)) {
      fail("EDGE_ENDPOINT_UNRESOLVED", `graph.edges[${edge.edge_id}]`, "Edge endpoints must resolve to pinned nodes.");
    }
    equal([edge.type, edge.from, edge.to], meaning, "BIND_EDGE_MEANING_MISMATCH", `graph.edges[${edge.edge_id}]`, "Pinned relation meaning or direction differs.");
  }
}

function validateManifest(manifest, graph, expected) {
  equal(manifest.schema_version, "minted-source-manifest/v1", "BIND_MANIFEST_SCHEMA_MISMATCH", "source_manifest.schema_version", "Unexpected source-manifest schema.");
  equal(manifest.authority, "generated-provenance-read-model", "BIND_MANIFEST_AUTHORITY_MISMATCH", "source_manifest.authority", "Unexpected manifest authority label.");
  equal(manifest.project_id, expected.project_id, "BIND_PROJECT_MISMATCH", "source_manifest.project_id", "Manifest project differs.");
  equal(manifest.source_set_digest, expected.source_set_digest, "BIND_SOURCE_SET_MISMATCH", "source_manifest.source_set_digest", "Manifest source-set digest differs.");
  if (!Array.isArray(manifest.inputs) || !Array.isArray(manifest.records)) {
    fail("BIND_MANIFEST_SHAPE_INVALID", "source_manifest", "Manifest inputs and records must be arrays.");
  }
  const sourceDigests = new Map();
  for (const input of manifest.inputs) {
    if (sourceDigests.has(input?.path)) {
      fail("MANIFEST_SOURCE_AMBIGUOUS", input?.path, "Manifest source paths must be unique.");
    }
    sourceDigests.set(input?.path, input?.digest);
  }
  const records = new Map();
  for (const record of manifest.records) {
    if (records.has(record?.graph_id)) {
      fail("MANIFEST_JOIN_AMBIGUOUS", record?.graph_id, "Each graph ID must join to exactly one provenance record.");
    }
    records.set(record?.graph_id, record);
  }
  const expectedIds = [...expected.node_ids, ...expected.edge_ids];
  const missing = expectedIds.filter((id) => !records.has(id));
  if (missing.length) {
    fail("MANIFEST_JOIN_MISSING", "source_manifest.records", "Every graph ID requires one provenance record.", expectedIds, [...records.keys()]);
  }
  const extra = [...records.keys()].filter((id) => !expectedIds.includes(id));
  if (extra.length) {
    fail("MANIFEST_JOIN_UNKNOWN", "source_manifest.records", "Manifest contains unpinned graph IDs.", expectedIds, [...records.keys()]);
  }
  const nodeIds = new Set(expected.node_ids);
  for (const [graphId, record] of records) {
    equal(record.record_type, nodeIds.has(graphId) ? "node" : "edge", "MANIFEST_RECORD_TYPE_MISMATCH", `source_manifest.records[${graphId}].record_type`, "Provenance type differs from graph type.");
    if (!sourceDigests.has(record.source_path)) {
      fail("MANIFEST_SOURCE_MISSING", `source_manifest.records[${graphId}].source_path`, "Provenance source must exist in inputs.", undefined, record.source_path);
    }
    equal(record.source_digest, sourceDigests.get(record.source_path), "MANIFEST_SOURCE_DIGEST_MISMATCH", `source_manifest.records[${graphId}].source_digest`, "Provenance digest must match its input digest.");
  }
  const graphIds = [
    ...graph.nodes.map((node) => node.node_id),
    ...graph.edges.map((edge) => edge.edge_id),
  ];
  equal([...records.keys()].sort(), graphIds.sort(), "MANIFEST_JOIN_MISSING", "source_manifest.records", "Manifest and graph stable-ID sets must match.");
}

function validateReceipt(receipt, expected, binding) {
  equal(receipt.schema_version, "minted-build-receipt/v1", "BIND_RECEIPT_SCHEMA_MISMATCH", "build_receipt.schema_version", "Unexpected build-receipt schema.");
  equal(receipt.authority, "generated-verification-evidence", "BIND_RECEIPT_AUTHORITY_MISMATCH", "build_receipt.authority", "Unexpected receipt authority label.");
  equal(receipt.status, "pass", "BIND_RECEIPT_STATUS_MISMATCH", "build_receipt.status", "Pinned build receipt must pass.");
  equal(receipt.project_id, expected.project_id, "BIND_PROJECT_MISMATCH", "build_receipt.project_id", "Receipt project differs.");
  equal(receipt.source_set_digest, expected.source_set_digest, "BIND_SOURCE_SET_MISMATCH", "build_receipt.source_set_digest", "Receipt source-set digest differs.");
  const [profileId, profileVersion] = expected.profile_ref.split("@");
  equal(receipt.language?.profile_id, profileId, "BIND_PROFILE_MISMATCH", "build_receipt.language.profile_id", "Receipt profile ID differs.");
  equal(receipt.language?.profile_version, profileVersion, "BIND_PROFILE_MISMATCH", "build_receipt.language.profile_version", "Receipt profile version differs.");
  equal(receipt.language?.profile_digest, expected.profile_digest, "BIND_PROFILE_MISMATCH", "build_receipt.language.profile_digest", "Receipt profile digest differs.");
  equal(receipt.language?.kinds_digest, expected.kinds_digest, "BIND_REGISTRY_MISMATCH", "build_receipt.language.kinds_digest", "Receipt kinds digest differs.");
  equal(receipt.language?.relationships_digest, expected.relationships_digest, "BIND_REGISTRY_MISMATCH", "build_receipt.language.relationships_digest", "Receipt relationships digest differs.");
  equal(receipt.generator_version, expected.generator_version, "BIND_GENERATOR_MISMATCH", "build_receipt.generator_version", "Receipt generator differs.");
  equal(receipt.artifacts?.graph_digest, binding.inputs.graph.sha256, "BIND_GRAPH_HASH_MISMATCH", "build_receipt.artifacts.graph_digest", "Receipt graph digest differs from binding.");
  equal(receipt.artifacts?.source_manifest_digest, binding.inputs.source_manifest.sha256, "BIND_MANIFEST_HASH_MISMATCH", "build_receipt.artifacts.source_manifest_digest", "Receipt manifest digest differs from binding.");
}

export function validateBundleStructure(binding, artifacts) {
  validateBindingContract(binding);
  const { graph, source_manifest: sourceManifest, build_receipt: buildReceipt } = artifacts;
  validateGraph(graph, binding.expected);
  validateManifest(sourceManifest, graph, binding.expected);
  validateReceipt(buildReceipt, binding.expected, binding);
  return Object.freeze({
    status: "pass",
    handle: "iolm-fixture-boundary/v1",
    counts: Object.freeze({ nodes: binding.expected.node_count, edges: binding.expected.edge_count }),
    posture: "candidate",
    authority_effect: "none",
    ineligible_for: INELIGIBLE_FOR,
  });
}

export async function validatePinnedBundle(binding, artifacts) {
  validateBindingContract(binding);
  for (const [role, canonical] of Object.entries(CANONICAL_FIXTURES)) {
    const artifact = artifacts[role];
    if (!artifact || typeof artifact !== "object") {
      fail("BIND_ARTIFACT_MISSING", role, "Every pinned artifact is required.");
    }
    const actualHash = await sha256Hex(artifact.bytes);
    equal(actualHash, binding.inputs[role].sha256, canonical.hashCode, `inputs.${role}.sha256`, "Artifact bytes differ from the pinned hash.");
  }
  const parsed = Object.fromEntries(Object.entries(artifacts).map(([role, artifact]) => [role, artifact.json]));
  const report = validateBundleStructure(binding, parsed);
  return Object.freeze({
    ...report,
    binding,
    graph: parsed.graph,
    source_manifest: parsed.source_manifest,
    build_receipt: parsed.build_receipt,
  });
}

export const PINNED_FIXTURE_CONTRACT = Object.freeze({
  fixtures: CANONICAL_FIXTURES,
  expected: EXPECTED,
  ineligible_for: INELIGIBLE_FOR,
});
