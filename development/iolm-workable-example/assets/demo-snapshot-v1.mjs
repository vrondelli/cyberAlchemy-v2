import { INELIGIBLE_FOR } from "./binding-guard.mjs";

export const DEMO_SNAPSHOT_SCHEMA_URI = "https://domainspec.local/iolm/demo-snapshot.v1.schema.json";
export const DEMO_SNAPSHOT_VERSION = "iolm-demo-snapshot/v1";
export const DEMO_SNAPSHOT_HANDLE = "iolm-demo-snapshot/v1";
export const PLAYER_QUESTION_ID = "player-action-support";
export const PLAYER_QUESTION = "What does the Player do, and what supports that connection?";

const OWNER_ROUTE = "private-learning-map-product-owner";
const PINNED_SNAPSHOT_ID = "key-and-door.fixture-demo.v1";
const PINNED_NODE_IDS = Object.freeze([
  "key-and-door.DoorUnlocked",
  "key-and-door.HasKeyRule",
  "key-and-door.Player",
  "key-and-door.UnlockDoor",
]);
const PINNED_RELATION_IDS = Object.freeze([
  "key-and-door.edge.has-key-rule-enforces-unlock-door",
  "key-and-door.edge.player-performs-unlock-door",
  "key-and-door.edge.unlock-door-produces-door-unlocked",
]);
const PLAYER_NODE_IDS = Object.freeze([
  "key-and-door.Player",
  "key-and-door.UnlockDoor",
]);
const PLAYER_RELATION_IDS = Object.freeze([
  "key-and-door.edge.player-performs-unlock-door",
]);
const PINNED_SOURCE_BINDING = Object.freeze({
  input_class: "pinned-fixture",
  test_only: false,
  binding_id: "key-and-door-pinned-fixture",
  binding_schema_version: "iolm-source-binding/v1",
  boundary_handle: "iolm-fixture-boundary/v1",
  source_set_digest: "6316759c5fc26835c1dcdd951d4fdc9e9def708bdbf38941cfe62512b4987b95",
  profile_ref: "feature-with-independent-node-files@1",
  profile_digest: "0cbc0b58f35b39bd45698d4f19ce4d853e4ae26c6242633df8952e20f81423e5",
  generator_version: "fixture-generator/v1",
  kinds_digest: "4394968327b785d50cd323ad58a799feb71b9debf7e06b650b4fd1e4008f9ede",
  relationships_digest: "567fda214dbf3d2cdfe8f360020d2497cccc611bbcfd05f2fd885e8ad308ab41",
  fixture_hashes: Object.freeze({
    graph: "66a63b80141274d7c803820c668f521d1676961e7362d8e9af1b03061c4b4a65",
    source_manifest: "3d5db5ae885b93b4c490057597624c96ff53d3061d33af7ba289878d1eded831",
    build_receipt: "1a5be10941d8342451d71e80dacc3bdd9ecfbe39412b22ffde617cd04370e20d",
  }),
});
const PINNED_NODE_ROWS = Object.freeze([
  Object.freeze(["key-and-door.DoorUnlocked", "key-and-door", "Event", "specs/key-and-door/nodes/door-unlocked.json", "a0c34fb26325113783da075d883a57236dc16bc1e9407fbdfbdb0411cddbe08e"]),
  Object.freeze(["key-and-door.HasKeyRule", "key-and-door", "Rule", "specs/key-and-door/nodes/has-key-rule.json", "f847fa32398a0cfbeae65f4055cde070b3621be9efc03b1aafb90ac8ce79e2f4"]),
  Object.freeze(["key-and-door.Player", "key-and-door", "Entity", "specs/key-and-door/nodes/player.json", "644b9730e59c663f2b9848470b7664cecbe0483e4f7d8968f7cf53da07b0ddb6"]),
  Object.freeze(["key-and-door.UnlockDoor", "key-and-door", "Operation", "specs/key-and-door/nodes/unlock-door.json", "b2e4c83af3438251bd0d1757220ce6b6149f67961a2739c716e9fc1d005b5686"]),
]);
const PINNED_RELATION_ROWS = Object.freeze([
  Object.freeze(["key-and-door.edge.has-key-rule-enforces-unlock-door", "enforces", "key-and-door", "key-and-door.HasKeyRule", "key-and-door", "key-and-door.UnlockDoor", "specs/key-and-door/nodes/has-key-rule.json", "f847fa32398a0cfbeae65f4055cde070b3621be9efc03b1aafb90ac8ce79e2f4"]),
  Object.freeze(["key-and-door.edge.player-performs-unlock-door", "performs", "key-and-door", "key-and-door.Player", "key-and-door", "key-and-door.UnlockDoor", "specs/key-and-door/nodes/player.json", "644b9730e59c663f2b9848470b7664cecbe0483e4f7d8968f7cf53da07b0ddb6"]),
  Object.freeze(["key-and-door.edge.unlock-door-produces-door-unlocked", "produces", "key-and-door", "key-and-door.UnlockDoor", "key-and-door", "key-and-door.DoorUnlocked", "specs/key-and-door/nodes/unlock-door.json", "b2e4c83af3438251bd0d1757220ce6b6149f67961a2739c716e9fc1d005b5686"]),
]);

const ROOT_KEYS = Object.freeze([
  "$schema",
  "schema_version",
  "snapshot_id",
  "artifact_role",
  "posture",
  "authority_effect",
  "owner_route",
  "source_binding",
  "features",
  "nodes",
  "relations",
  "counts",
  "slices",
  "validation",
  "ineligible_for",
]);
const SOURCE_BINDING_KEYS = Object.freeze([
  "input_class",
  "test_only",
  "binding_id",
  "binding_schema_version",
  "boundary_handle",
  "source_set_digest",
  "profile_ref",
  "profile_digest",
  "generator_version",
  "kinds_digest",
  "relationships_digest",
  "fixture_hashes",
]);
const PROVENANCE_KEYS = Object.freeze([
  "artifact_role",
  "posture",
  "authority_effect",
  "owner_route",
  "source_reference",
  "source_digest",
  "contract_binding",
  "validation_state",
]);
const NODE_KEYS = Object.freeze([
  "id",
  "record_type",
  "feature_id",
  "kind",
  "label",
  "intent",
  ...PROVENANCE_KEYS,
]);
const RELATION_KEYS = Object.freeze([
  "id",
  "record_type",
  "relation_class",
  "label",
  "source",
  "target",
  ...PROVENANCE_KEYS,
]);
const SLICE_KEYS = Object.freeze(["slice_id", "question", "node_ids", "relation_ids", "counts"]);

export class DemoSnapshotError extends Error {
  constructor(code, field, message, { expected, actual } = {}) {
    super(`${code}: ${message}`);
    this.name = "DemoSnapshotError";
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
      owner_route: OWNER_ROUTE,
      recovery: "Restore the DemoSnapshotV1 contract or route the defect to SWU-IOLM-00C-UI-A2.",
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
  throw new DemoSnapshotError(code, field, message, { expected, actual });
}

function equal(actual, expected, code, field, message) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(code, field, message, expected, actual);
  }
}

function exactKeys(value, keys, field) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail("SNAPSHOT_SCHEMA_INVALID", field, "Expected an object.", keys, value);
  }
  equal(
    Object.keys(value).sort(),
    [...keys].sort(),
    "SNAPSHOT_SCHEMA_INVALID",
    `${field}.keys`,
    "Object fields must match the DemoSnapshotV1 contract exactly.",
  );
}

function requireString(value, field) {
  if (typeof value !== "string" || value.length === 0) {
    fail("SNAPSHOT_SCHEMA_INVALID", field, "Expected a non-empty string.", "non-empty string", value);
  }
}

function requireDigest(value, field) {
  if (typeof value !== "string" || !/^[0-9a-f]{64}$/.test(value)) {
    fail("SNAPSHOT_SCHEMA_INVALID", field, "Expected a lowercase SHA-256 digest.", "64 lowercase hex characters", value);
  }
}

function requireArray(value, field) {
  if (!Array.isArray(value)) {
    fail("SNAPSHOT_SCHEMA_INVALID", field, "Expected an array.", "array", value);
  }
}

function uniqueValues(values, code, field) {
  if (new Set(values).size !== values.length) {
    fail(code, field, "Values must be unique.", [...new Set(values)], values);
  }
}

function titleFromId(id) {
  const local = id.split(".").at(-1);
  return local
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function deepFreeze(value) {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

function validateSourceBinding(sourceBinding) {
  exactKeys(sourceBinding, SOURCE_BINDING_KEYS, "source_binding");
  if (!["pinned-fixture", "synthetic-conformance"].includes(sourceBinding.input_class)) {
    fail("SNAPSHOT_INPUT_CLASS_FORBIDDEN", "source_binding.input_class", "Input class is not admitted by v1.", ["pinned-fixture", "synthetic-conformance"], sourceBinding.input_class);
  }
  const synthetic = sourceBinding.input_class === "synthetic-conformance";
  equal(sourceBinding.test_only, synthetic, "SNAPSHOT_TEST_SCOPE_MISMATCH", "source_binding.test_only", "Input class and test-only posture must agree.");
  equal(
    sourceBinding.boundary_handle,
    synthetic ? "synthetic-conformance-only/v1" : "iolm-fixture-boundary/v1",
    "SNAPSHOT_BOUNDARY_HANDLE_MISMATCH",
    "source_binding.boundary_handle",
    "Snapshot source must name its exact boundary handle.",
  );
  for (const field of ["binding_id", "binding_schema_version", "profile_ref", "generator_version"]) {
    requireString(sourceBinding[field], `source_binding.${field}`);
  }
  for (const field of ["source_set_digest", "profile_digest", "kinds_digest", "relationships_digest"]) {
    requireDigest(sourceBinding[field], `source_binding.${field}`);
  }
  exactKeys(sourceBinding.fixture_hashes, ["graph", "source_manifest", "build_receipt"], "source_binding.fixture_hashes");
  for (const [role, digest] of Object.entries(sourceBinding.fixture_hashes)) {
    requireDigest(digest, `source_binding.fixture_hashes.${role}`);
  }
}

function validateContractBinding(value, sourceBinding, field) {
  exactKeys(value, ["binding_id", "schema_version", "source_set_digest"], field);
  equal(value.binding_id, sourceBinding.binding_id, "SNAPSHOT_CONTRACT_BINDING_MISMATCH", `${field}.binding_id`, "Record binding ID differs from snapshot binding.");
  equal(value.schema_version, sourceBinding.binding_schema_version, "SNAPSHOT_CONTRACT_BINDING_MISMATCH", `${field}.schema_version`, "Record binding schema differs from snapshot binding.");
  equal(value.source_set_digest, sourceBinding.source_set_digest, "SNAPSHOT_CONTRACT_BINDING_MISMATCH", `${field}.source_set_digest`, "Record source-set digest differs from snapshot binding.");
}

function validateProvenance(value, sourceBinding, field) {
  equal(value.artifact_role, "generated-read-model", "SNAPSHOT_ARTIFACT_ROLE_FORBIDDEN", `${field}.artifact_role`, "Snapshot records must remain generated read-model records.");
  equal(value.posture, "candidate", "SNAPSHOT_POSTURE_FORBIDDEN", `${field}.posture`, "Snapshot records cannot claim another posture.");
  equal(value.authority_effect, "none", "SNAPSHOT_AUTHORITY_EFFECT_FORBIDDEN", `${field}.authority_effect`, "Snapshot records cannot create authority effects.");
  equal(value.owner_route, OWNER_ROUTE, "SNAPSHOT_OWNER_ROUTE_MISMATCH", `${field}.owner_route`, "Snapshot record owner route differs.");
  requireString(value.source_reference, `${field}.source_reference`);
  requireDigest(value.source_digest, `${field}.source_digest`);
  validateContractBinding(value.contract_binding, sourceBinding, `${field}.contract_binding`);
  equal(value.validation_state, "pass", "SNAPSHOT_VALIDATION_STATE_MISMATCH", `${field}.validation_state`, "Every admitted record must carry passing validation state.");
}

function validateSlice(slice, nodeMap, relationMap, field, { questionRequired }) {
  exactKeys(slice, SLICE_KEYS, field);
  requireString(slice.slice_id, `${field}.slice_id`);
  if (questionRequired) requireString(slice.question, `${field}.question`);
  else if (slice.question !== null) fail("SNAPSHOT_SCHEMA_INVALID", `${field}.question`, "Default slice question must be null.", null, slice.question);
  requireArray(slice.node_ids, `${field}.node_ids`);
  requireArray(slice.relation_ids, `${field}.relation_ids`);
  uniqueValues(slice.node_ids, "QUESTION_SLICE_PARITY_MISMATCH", `${field}.node_ids`);
  uniqueValues(slice.relation_ids, "QUESTION_SLICE_PARITY_MISMATCH", `${field}.relation_ids`);
  if (slice.node_ids.length === 0) {
    fail("QUESTION_SLICE_PARITY_MISMATCH", `${field}.node_ids`, "A slice must contain at least one node.");
  }
  for (const id of slice.node_ids) {
    if (!nodeMap.has(id)) fail("QUESTION_SLICE_PARITY_MISMATCH", `${field}.node_ids`, "Slice contains an unresolved node ID.", [...nodeMap.keys()], slice.node_ids);
  }
  const selectedNodes = new Set(slice.node_ids);
  for (const id of slice.relation_ids) {
    const relation = relationMap.get(id);
    if (!relation) fail("QUESTION_SLICE_PARITY_MISMATCH", `${field}.relation_ids`, "Slice contains an unresolved relation ID.", [...relationMap.keys()], slice.relation_ids);
    if (!selectedNodes.has(relation.source.node_id) || !selectedNodes.has(relation.target.node_id)) {
      fail("QUESTION_SLICE_PARITY_MISMATCH", `${field}.relation_ids`, "Every selected relation must be induced by selected endpoints.", slice.node_ids, [relation.source.node_id, relation.target.node_id]);
    }
  }
  exactKeys(slice.counts, ["nodes", "relations"], `${field}.counts`);
  equal(slice.counts, { nodes: slice.node_ids.length, relations: slice.relation_ids.length }, "QUESTION_SLICE_PARITY_MISMATCH", `${field}.counts`, "Slice counts must equal its stable-ID sets.");
}

function validatePinnedSnapshot(snapshot) {
  equal(snapshot.snapshot_id, PINNED_SNAPSHOT_ID, "SNAPSHOT_ID_MISMATCH", "snapshot_id", "Pinned fixture snapshot ID differs.");
  equal(snapshot.features, [{ feature_id: "key-and-door", label: "Key And Door" }], "SNAPSHOT_FEATURE_NAMESPACE_MISMATCH", "features", "Pinned fixture feature namespace differs.");
  equal(snapshot.nodes.map(({ id }) => id), PINNED_NODE_IDS, "SNAPSHOT_NODE_SET_MISMATCH", "nodes[].id", "Pinned fixture node IDs or order differ.");
  equal(snapshot.relations.map(({ id }) => id), PINNED_RELATION_IDS, "SNAPSHOT_RELATION_SET_MISMATCH", "relations[].id", "Pinned fixture relation IDs or order differ.");
  equal(snapshot.source_binding, PINNED_SOURCE_BINDING, "SNAPSHOT_CONTRACT_BINDING_MISMATCH", "source_binding", "Pinned fixture source binding differs.");
  equal(
    snapshot.nodes.map((node) => [node.id, node.feature_id, node.kind, node.source_reference, node.source_digest]),
    PINNED_NODE_ROWS,
    "SNAPSHOT_PROVENANCE_MISMATCH",
    "nodes",
    "Pinned node meaning or provenance differs.",
  );
  equal(
    snapshot.relations.map((relation) => [
      relation.id,
      relation.relation_class,
      relation.source.feature_id,
      relation.source.node_id,
      relation.target.feature_id,
      relation.target.node_id,
      relation.source_reference,
      relation.source_digest,
    ]),
    PINNED_RELATION_ROWS,
    "SNAPSHOT_PROVENANCE_MISMATCH",
    "relations",
    "Pinned relation meaning, endpoints or provenance differs.",
  );
  equal(snapshot.slices.questions.length, 1, "QUESTION_SLICE_PARITY_MISMATCH", "slices.questions", "Pinned fixture requires exactly one question slice.");
  const player = snapshot.slices.questions[0];
  equal(player.slice_id, PLAYER_QUESTION_ID, "QUESTION_SLICE_PARITY_MISMATCH", "slices.questions[0].slice_id", "Player question slice ID differs.");
  equal(player.question, PLAYER_QUESTION, "QUESTION_SLICE_PARITY_MISMATCH", "slices.questions[0].question", "Player question text differs.");
  equal(player.node_ids, PLAYER_NODE_IDS, "QUESTION_SLICE_PARITY_MISMATCH", "slices.questions[0].node_ids", "Player question node set differs.");
  equal(player.relation_ids, PLAYER_RELATION_IDS, "QUESTION_SLICE_PARITY_MISMATCH", "slices.questions[0].relation_ids", "Player question relation set differs.");
}

export function validateDemoSnapshotV1(snapshot) {
  exactKeys(snapshot, ROOT_KEYS, "snapshot");
  equal(snapshot.$schema, DEMO_SNAPSHOT_SCHEMA_URI, "SNAPSHOT_SCHEMA_INVALID", "$schema", "Snapshot schema URI differs.");
  equal(snapshot.schema_version, DEMO_SNAPSHOT_VERSION, "SNAPSHOT_SCHEMA_INVALID", "schema_version", "Snapshot version differs.");
  requireString(snapshot.snapshot_id, "snapshot_id");
  equal(snapshot.artifact_role, "generated-read-model", "SNAPSHOT_ARTIFACT_ROLE_FORBIDDEN", "artifact_role", "Snapshot must remain a generated read model.");
  equal(snapshot.posture, "candidate", "SNAPSHOT_POSTURE_FORBIDDEN", "posture", "DemoSnapshotV1 is candidate-only.");
  equal(snapshot.authority_effect, "none", "SNAPSHOT_AUTHORITY_EFFECT_FORBIDDEN", "authority_effect", "DemoSnapshotV1 cannot produce authority effects.");
  equal(snapshot.owner_route, OWNER_ROUTE, "SNAPSHOT_OWNER_ROUTE_MISMATCH", "owner_route", "Snapshot owner route differs.");
  validateSourceBinding(snapshot.source_binding);

  requireArray(snapshot.features, "features");
  requireArray(snapshot.nodes, "nodes");
  requireArray(snapshot.relations, "relations");
  if (snapshot.features.length === 0 || snapshot.nodes.length === 0) {
    fail("SNAPSHOT_SCHEMA_INVALID", "features|nodes", "A snapshot requires at least one feature and node.");
  }

  const featureMap = new Map();
  for (const [index, feature] of snapshot.features.entries()) {
    exactKeys(feature, ["feature_id", "label"], `features[${index}]`);
    requireString(feature.feature_id, `features[${index}].feature_id`);
    requireString(feature.label, `features[${index}].label`);
    if (featureMap.has(feature.feature_id)) fail("SNAPSHOT_FEATURE_NAMESPACE_DUPLICATE", `features[${index}].feature_id`, "Feature namespaces must be unique.");
    featureMap.set(feature.feature_id, feature);
  }

  const nodeMap = new Map();
  for (const [index, node] of snapshot.nodes.entries()) {
    const field = `nodes[${index}]`;
    exactKeys(node, NODE_KEYS, field);
    requireString(node.id, `${field}.id`);
    equal(node.record_type, "node", "SNAPSHOT_SCHEMA_INVALID", `${field}.record_type`, "Node record type differs.");
    if (!featureMap.has(node.feature_id)) fail("SNAPSHOT_FEATURE_NAMESPACE_MISSING", `${field}.feature_id`, "Node feature namespace is not declared.", [...featureMap.keys()], node.feature_id);
    requireString(node.kind, `${field}.kind`);
    requireString(node.label, `${field}.label`);
    requireString(node.intent, `${field}.intent`);
    if (nodeMap.has(node.id)) fail("SNAPSHOT_NODE_ID_DUPLICATE", `${field}.id`, "Node stable IDs must be unique.");
    validateProvenance(node, snapshot.source_binding, field);
    nodeMap.set(node.id, node);
  }

  const relationMap = new Map();
  for (const [index, relation] of snapshot.relations.entries()) {
    const field = `relations[${index}]`;
    exactKeys(relation, RELATION_KEYS, field);
    requireString(relation.id, `${field}.id`);
    equal(relation.record_type, "relation", "SNAPSHOT_SCHEMA_INVALID", `${field}.record_type`, "Relation record type differs.");
    requireString(relation.relation_class, `${field}.relation_class`);
    requireString(relation.label, `${field}.label`);
    if (relationMap.has(relation.id)) fail("SNAPSHOT_RELATION_ID_DUPLICATE", `${field}.id`, "Relation stable IDs must be unique.");
    for (const endpointName of ["source", "target"]) {
      const endpoint = relation[endpointName];
      exactKeys(endpoint, ["feature_id", "node_id"], `${field}.${endpointName}`);
      if (!endpoint.feature_id) fail("SNAPSHOT_FEATURE_NAMESPACE_MISSING", `${field}.${endpointName}.feature_id`, "Relation endpoint feature namespace is required.");
      const node = nodeMap.get(endpoint.node_id);
      if (!node) fail("EDGE_ENDPOINT_UNRESOLVED", `${field}.${endpointName}.node_id`, "Relation endpoint does not resolve.", [...nodeMap.keys()], endpoint.node_id);
      equal(endpoint.feature_id, node.feature_id, "SNAPSHOT_FEATURE_NAMESPACE_MISMATCH", `${field}.${endpointName}.feature_id`, "Endpoint namespace differs from its node namespace.");
    }
    validateProvenance(relation, snapshot.source_binding, field);
    relationMap.set(relation.id, relation);
  }

  exactKeys(snapshot.counts, ["nodes", "relations"], "counts");
  equal(snapshot.counts, { nodes: snapshot.nodes.length, relations: snapshot.relations.length }, "SNAPSHOT_COUNT_MISMATCH", "counts", "Snapshot counts must equal record arrays.");
  exactKeys(snapshot.slices, ["default", "questions"], "slices");
  requireArray(snapshot.slices.questions, "slices.questions");
  validateSlice(snapshot.slices.default, nodeMap, relationMap, "slices.default", { questionRequired: false });
  equal(snapshot.slices.default.node_ids, [...nodeMap.keys()], "SNAPSHOT_DEFAULT_SLICE_MISMATCH", "slices.default.node_ids", "Default slice must contain every node in snapshot order.");
  equal(snapshot.slices.default.relation_ids, [...relationMap.keys()], "SNAPSHOT_DEFAULT_SLICE_MISMATCH", "slices.default.relation_ids", "Default slice must contain every relation in snapshot order.");
  const questionIds = [];
  for (const [index, slice] of snapshot.slices.questions.entries()) {
    validateSlice(slice, nodeMap, relationMap, `slices.questions[${index}]`, { questionRequired: true });
    questionIds.push(slice.slice_id);
  }
  uniqueValues(questionIds, "QUESTION_SLICE_ID_DUPLICATE", "slices.questions[].slice_id");

  exactKeys(snapshot.validation, ["state", "guard", "boundary_handle"], "validation");
  equal(snapshot.validation.state, "pass", "SNAPSHOT_VALIDATION_STATE_MISMATCH", "validation.state", "Snapshot validation state must pass.");
  equal(snapshot.validation.guard, "DemoSnapshotV1Guard", "SNAPSHOT_VALIDATION_STATE_MISMATCH", "validation.guard", "Snapshot guard identity differs.");
  equal(snapshot.validation.boundary_handle, snapshot.source_binding.boundary_handle, "SNAPSHOT_BOUNDARY_HANDLE_MISMATCH", "validation.boundary_handle", "Validation and source boundary handles must agree.");
  equal(snapshot.ineligible_for, INELIGIBLE_FOR, "SNAPSHOT_ELIGIBILITY_FENCE_MISMATCH", "ineligible_for", "The complete eligibility fence is mandatory and ordered.");

  if (snapshot.source_binding.input_class === "pinned-fixture") validatePinnedSnapshot(snapshot);
  return deepFreeze(snapshot);
}

function recordProvenance(record, binding) {
  return {
    artifact_role: "generated-read-model",
    posture: "candidate",
    authority_effect: "none",
    owner_route: OWNER_ROUTE,
    source_reference: record.source_path,
    source_digest: record.source_digest,
    contract_binding: {
      binding_id: binding.binding_id,
      schema_version: binding.schema_version,
      source_set_digest: binding.expected.source_set_digest,
    },
    validation_state: "pass",
  };
}

export function createDemoSnapshotV1(boundary) {
  if (!boundary || boundary.handle !== "iolm-fixture-boundary/v1" || boundary.status !== "pass") {
    fail("SNAPSHOT_BOUNDARY_HANDLE_MISMATCH", "boundary.handle", "A2 requires the passing A1 guarded bundle.", "iolm-fixture-boundary/v1", boundary?.handle);
  }
  equal(boundary.posture, "candidate", "SNAPSHOT_POSTURE_FORBIDDEN", "boundary.posture", "A1 boundary posture differs.");
  equal(boundary.authority_effect, "none", "SNAPSHOT_AUTHORITY_EFFECT_FORBIDDEN", "boundary.authority_effect", "A1 boundary authority effect differs.");
  equal(boundary.ineligible_for, INELIGIBLE_FOR, "SNAPSHOT_ELIGIBILITY_FENCE_MISMATCH", "boundary.ineligible_for", "A1 boundary eligibility fence differs.");

  const { binding, graph, source_manifest: sourceManifest } = boundary;
  if (!binding || !graph || !sourceManifest) {
    fail("SNAPSHOT_BOUNDARY_PAYLOAD_MISSING", "boundary", "A1 guarded bundle must include binding, graph and source manifest.");
  }
  const manifestById = new Map(sourceManifest.records.map((record) => [record.graph_id, record]));
  const nodeSourceById = new Map(graph.nodes.map((node) => [node.node_id, node]));
  const features = [...new Set(graph.nodes.map((node) => node.feature_id))]
    .sort()
    .map((featureId) => ({ feature_id: featureId, label: titleFromId(featureId) }));

  const nodes = graph.nodes.map((node) => {
    const provenance = manifestById.get(node.node_id);
    if (!provenance) fail("SNAPSHOT_PROVENANCE_MISSING", `nodes[${node.node_id}]`, "Node provenance is missing.");
    return {
      id: node.node_id,
      record_type: "node",
      feature_id: node.feature_id,
      kind: node.kind,
      label: titleFromId(node.node_id),
      intent: node.intent,
      ...recordProvenance(provenance, binding),
    };
  });

  const relations = graph.edges.map((edge) => {
    const provenance = manifestById.get(edge.edge_id);
    if (!provenance) fail("SNAPSHOT_PROVENANCE_MISSING", `relations[${edge.edge_id}]`, "Relation provenance is missing.");
    const source = nodeSourceById.get(edge.from);
    const target = nodeSourceById.get(edge.to);
    if (!source || !target) fail("EDGE_ENDPOINT_UNRESOLVED", `relations[${edge.edge_id}]`, "Relation endpoints do not resolve in the guarded graph.");
    return {
      id: edge.edge_id,
      record_type: "relation",
      relation_class: edge.type,
      label: edge.type,
      source: { feature_id: source.feature_id, node_id: source.node_id },
      target: { feature_id: target.feature_id, node_id: target.node_id },
      ...recordProvenance(provenance, binding),
    };
  });

  const snapshot = {
    $schema: DEMO_SNAPSHOT_SCHEMA_URI,
    schema_version: DEMO_SNAPSHOT_VERSION,
    snapshot_id: PINNED_SNAPSHOT_ID,
    artifact_role: "generated-read-model",
    posture: "candidate",
    authority_effect: "none",
    owner_route: OWNER_ROUTE,
    source_binding: {
      input_class: "pinned-fixture",
      test_only: false,
      binding_id: binding.binding_id,
      binding_schema_version: binding.schema_version,
      boundary_handle: boundary.handle,
      source_set_digest: binding.expected.source_set_digest,
      profile_ref: binding.expected.profile_ref,
      profile_digest: binding.expected.profile_digest,
      generator_version: binding.expected.generator_version,
      kinds_digest: binding.expected.kinds_digest,
      relationships_digest: binding.expected.relationships_digest,
      fixture_hashes: {
        graph: binding.inputs.graph.sha256,
        source_manifest: binding.inputs.source_manifest.sha256,
        build_receipt: binding.inputs.build_receipt.sha256,
      },
    },
    features,
    nodes,
    relations,
    counts: { nodes: nodes.length, relations: relations.length },
    slices: {
      default: {
        slice_id: "default",
        question: null,
        node_ids: nodes.map(({ id }) => id),
        relation_ids: relations.map(({ id }) => id),
        counts: { nodes: nodes.length, relations: relations.length },
      },
      questions: [
        {
          slice_id: PLAYER_QUESTION_ID,
          question: PLAYER_QUESTION,
          node_ids: [...PLAYER_NODE_IDS],
          relation_ids: [...PLAYER_RELATION_IDS],
          counts: { nodes: 2, relations: 1 },
        },
      ],
    },
    validation: {
      state: "pass",
      guard: "DemoSnapshotV1Guard",
      boundary_handle: boundary.handle,
    },
    ineligible_for: [...INELIGIBLE_FOR],
  };
  return validateDemoSnapshotV1(snapshot);
}

export function serializeDemoSnapshotV1(snapshot) {
  return `${JSON.stringify(validateDemoSnapshotV1(snapshot), null, 2)}\n`;
}

export async function digestDemoSnapshotV1(snapshot) {
  const bytes = new TextEncoder().encode(serializeDemoSnapshotV1(snapshot));
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
