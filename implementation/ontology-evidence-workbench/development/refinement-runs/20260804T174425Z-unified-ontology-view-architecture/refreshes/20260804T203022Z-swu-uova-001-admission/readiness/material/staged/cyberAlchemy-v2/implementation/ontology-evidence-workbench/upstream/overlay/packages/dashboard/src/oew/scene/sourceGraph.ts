export const OEW_SOURCE_GRAPH_SCHEMA = "oew.source-graph-envelope.v1";
export const OEW_COMPILED_SOURCE_GRAPH_SCHEMA = "oew.compiled-source-graph.v1";
export const OEW_SOURCE_GRAPH_RECEIPT_SCHEMA = "oew.source-graph-receipt.v1";

const DIGEST = /^[a-f0-9]{64}$/;
const NODE_KEYS = [
  "authority_effect",
  "evidence_refs",
  "icon_token",
  "label",
  "node_kind",
  "role",
  "source_digest",
  "source_node_id",
  "source_refs",
  "summary",
];
const REQUIRED_NODE_KEYS = NODE_KEYS.filter((key) => key !== "summary");
const RELATION_KEYS = [
  "authority_effect",
  "color_token",
  "direction_label",
  "evidence_refs",
  "exact_predicate",
  "mapping_loss",
  "pattern_token",
  "presentation_family",
  "source_digest",
  "source_direction",
  "source_node_id",
  "source_refs",
  "source_relation_id",
  "target_node_id",
  "visible_label",
];

/** @typedef {Record<string, unknown>} JsonRecord */

export class SourceGraphError extends Error {
  /** @type {string} */
  code;
  /** @type {string[]} */
  issues;

  /** @param {string[]} issues */
  constructor(issues = []) {
    const stableIssues = [...new Set(issues)].sort();
    super(`OEW source graph rejected: ${stableIssues.join(", ")}`);
    this.name = "SourceGraphError";
    this.code = "OEW_SOURCE_GRAPH_REJECTED";
    this.issues = stableIssues;
  }
}

/** @param {unknown} value @returns {value is JsonRecord} */
const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/** @param {unknown} value */
const isNonemptyString = (value) =>
  typeof value === "string" && value.trim().length > 0;

/** @param {unknown} value */
const isEvidenceList = (value) =>
  Array.isArray(value) &&
  value.length > 0 &&
  value.every(isNonemptyString) &&
  new Set(value).size === value.length;

/**
 * @param {JsonRecord} value
 * @param {string[]} required
 * @param {string[]} allowed
 */
const hasDeclaredShape = (value, required, allowed) => {
  const keys = Object.keys(value);
  return (
    required.every((key) => Object.hasOwn(value, key)) &&
    keys.every((key) => allowed.includes(key))
  );
};

/** @param {unknown} value @param {Set<object>} [ancestors] */
const canonicalValue = (value, ancestors = new Set()) => {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    if (ancestors.has(value)) throw new TypeError("CIRCULAR_JSON_VALUE");
    ancestors.add(value);
    const result = value.map((item) => canonicalValue(item, ancestors));
    ancestors.delete(value);
    return result;
  }
  if (isRecord(value)) {
    if (ancestors.has(value)) throw new TypeError("CIRCULAR_JSON_VALUE");
    ancestors.add(value);
    const result = {};
    for (const key of Object.keys(value).sort()) {
      const child = value[key];
      if (child === undefined || typeof child === "function" || typeof child === "symbol") {
        throw new TypeError(`UNSUPPORTED_JSON_VALUE:${key}`);
      }
      result[key] = canonicalValue(child, ancestors);
    }
    ancestors.delete(value);
    return result;
  }
  throw new TypeError(`UNSUPPORTED_JSON_VALUE:${typeof value}`);
};

/** @param {unknown} value */
export const canonicalJson = (value) => JSON.stringify(canonicalValue(value));

/** @param {string} text */
const sha256Hex = async (text) => {
  if (!globalThis.crypto?.subtle) {
    throw new SourceGraphError(["SHA256_UNAVAILABLE"]);
  }
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

/** @param {unknown[]} records @param {string} idKey */
const canonicalRecordOrder = (records, idKey) =>
  [...records].sort((left, right) => {
    const leftId = isRecord(left) && typeof left[idKey] === "string" ? left[idKey] : "";
    const rightId = isRecord(right) && typeof right[idKey] === "string" ? right[idKey] : "";
    return leftId.localeCompare(rightId) || canonicalJson(left).localeCompare(canonicalJson(right));
  });

/**
 * The graph digest binds the adapter schema and every source record while
 * treating node/relation array order as presentation-neutral.
 *
 * @param {unknown} input
 */
export async function computeSourceGraphDigest(input) {
  if (
    !isRecord(input) ||
    !isNonemptyString(input.schema_version) ||
    !isRecord(input.source_digests) ||
    !Array.isArray(input.nodes) ||
    !Array.isArray(input.relations)
  ) {
    throw new SourceGraphError(["DIGEST_INPUT_INVALID"]);
  }
  return sha256Hex(
    canonicalJson({
      schema_version: input.schema_version,
      source_digests: input.source_digests,
      nodes: canonicalRecordOrder(input.nodes, "source_node_id"),
      relations: canonicalRecordOrder(input.relations, "source_relation_id"),
    }),
  );
}

/** @param {unknown} value */
const deepFreeze = (value) => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

/** @param {JsonRecord} node */
const copyNode = (node) => {
  const result = {
    source_node_id: node.source_node_id,
    label: node.label,
    node_kind: node.node_kind,
    role: node.role,
    icon_token: node.icon_token,
    evidence_refs: [...node.evidence_refs],
    source_refs: [...node.source_refs],
    authority_effect: node.authority_effect,
    source_digest: node.source_digest,
  };
  if (Object.hasOwn(node, "summary")) result.summary = node.summary;
  return result;
};

/** @param {JsonRecord} relation */
const copyRelation = (relation) => ({
  source_relation_id: relation.source_relation_id,
  source_node_id: relation.source_node_id,
  target_node_id: relation.target_node_id,
  exact_predicate: relation.exact_predicate,
  source_direction: relation.source_direction,
  presentation_family: relation.presentation_family,
  color_token: relation.color_token,
  pattern_token: relation.pattern_token,
  visible_label: relation.visible_label,
  direction_label: relation.direction_label,
  evidence_refs: [...relation.evidence_refs],
  source_refs: [...relation.source_refs],
  mapping_loss: relation.mapping_loss,
  authority_effect: relation.authority_effect,
  source_digest: relation.source_digest,
});

/** @param {unknown} input */
export async function compileSourceGraph(input) {
  /** @type {string[]} */
  const issues = [];
  if (!isRecord(input)) throw new SourceGraphError(["ENVELOPE_INVALID"]);

  if (
    !hasDeclaredShape(
      input,
      ["schema_version", "graph_digest", "source_digests", "nodes", "relations"],
      ["schema_version", "graph_digest", "source_digests", "nodes", "relations"],
    )
  ) {
    issues.push("ENVELOPE_SHAPE_INVALID");
  }
  if (input.schema_version !== OEW_SOURCE_GRAPH_SCHEMA) {
    issues.push("ENVELOPE_SCHEMA_UNSUPPORTED");
  }
  if (typeof input.graph_digest !== "string" || !DIGEST.test(input.graph_digest)) {
    issues.push("GRAPH_DIGEST_INVALID");
  }
  if (!isRecord(input.source_digests) || Object.keys(input.source_digests).length === 0) {
    issues.push("SOURCE_DIGESTS_INVALID");
  } else {
    for (const [sourceRef, sourceDigest] of Object.entries(input.source_digests)) {
      if (!isNonemptyString(sourceRef) || typeof sourceDigest !== "string" || !DIGEST.test(sourceDigest)) {
        issues.push(`SOURCE_DIGEST_INVALID:${sourceRef}`);
      }
    }
  }
  if (!Array.isArray(input.nodes)) issues.push("NODES_INVALID");
  if (!Array.isArray(input.relations)) issues.push("RELATIONS_INVALID");
  if (issues.length) throw new SourceGraphError(issues);

  const actualDigest = await computeSourceGraphDigest(input);
  if (actualDigest !== input.graph_digest) issues.push("GRAPH_DIGEST_MISMATCH");

  /** @type {Record<string, JsonRecord>} */
  const nodeById = Object.create(null);
  /** @type {JsonRecord[]} */
  const nodes = [];
  input.nodes.forEach((candidate, index) => {
    if (!isRecord(candidate)) {
      issues.push(`NODE_INVALID:${index}`);
      return;
    }
    if (!hasDeclaredShape(candidate, REQUIRED_NODE_KEYS, NODE_KEYS)) {
      issues.push(`NODE_SHAPE_INVALID:${index}`);
    }
    const id = candidate.source_node_id;
    if (!isNonemptyString(id)) {
      issues.push(`NODE_ID_INVALID:${index}`);
      return;
    }
    if (nodeById[id]) {
      issues.push(`NODE_ID_DUPLICATE:${id}`);
      return;
    }
    for (const field of ["label", "node_kind", "role", "icon_token"]) {
      if (!isNonemptyString(candidate[field])) issues.push(`NODE_FIELD_INVALID:${id}:${field}`);
    }
    if (Object.hasOwn(candidate, "summary") && typeof candidate.summary !== "string") {
      issues.push(`NODE_FIELD_INVALID:${id}:summary`);
    }
    if (!isEvidenceList(candidate.evidence_refs)) issues.push(`NODE_EVIDENCE_INVALID:${id}`);
    if (!isEvidenceList(candidate.source_refs)) issues.push(`NODE_SOURCE_REFS_INVALID:${id}`);
    if (candidate.authority_effect !== "none") issues.push(`NODE_AUTHORITY_INVALID:${id}`);
    if (typeof candidate.source_digest !== "string" || !DIGEST.test(candidate.source_digest)) {
      issues.push(`NODE_SOURCE_DIGEST_INVALID:${id}`);
    }
    const copied = copyNode(candidate);
    nodeById[id] = copied;
    nodes.push(copied);
  });

  /** @type {Record<string, JsonRecord>} */
  const relationById = Object.create(null);
  /** @type {JsonRecord[]} */
  const relations = [];
  input.relations.forEach((candidate, index) => {
    if (!isRecord(candidate)) {
      issues.push(`RELATION_INVALID:${index}`);
      return;
    }
    if (!hasDeclaredShape(candidate, RELATION_KEYS, RELATION_KEYS)) {
      issues.push(`RELATION_SHAPE_INVALID:${index}`);
    }
    const id = candidate.source_relation_id;
    if (!isNonemptyString(id)) {
      issues.push(`RELATION_ID_INVALID:${index}`);
      return;
    }
    if (relationById[id]) {
      issues.push(`RELATION_ID_DUPLICATE:${id}`);
      return;
    }
    for (const field of [
      "source_node_id",
      "target_node_id",
      "exact_predicate",
      "presentation_family",
      "color_token",
      "pattern_token",
      "visible_label",
      "direction_label",
    ]) {
      if (!isNonemptyString(candidate[field])) {
        issues.push(`RELATION_FIELD_INVALID:${id}:${field}`);
      }
    }
    if (!["forward", "reverse", "bidirectional"].includes(candidate.source_direction)) {
      issues.push(`RELATION_DIRECTION_INVALID:${id}`);
    }
    if (!["exact", "generalized", "lossy"].includes(candidate.mapping_loss)) {
      issues.push(`RELATION_MAPPING_LOSS_INVALID:${id}`);
    }
    if (!isEvidenceList(candidate.evidence_refs)) issues.push(`RELATION_EVIDENCE_INVALID:${id}`);
    if (!isEvidenceList(candidate.source_refs)) issues.push(`RELATION_SOURCE_REFS_INVALID:${id}`);
    if (candidate.authority_effect !== "none") issues.push(`RELATION_AUTHORITY_INVALID:${id}`);
    if (typeof candidate.source_digest !== "string" || !DIGEST.test(candidate.source_digest)) {
      issues.push(`RELATION_SOURCE_DIGEST_INVALID:${id}`);
    }
    const copied = copyRelation(candidate);
    relationById[id] = copied;
    relations.push(copied);
  });

  for (const relation of relations) {
    if (!nodeById[relation.source_node_id]) {
      issues.push(`RELATION_SOURCE_DANGLING:${relation.source_relation_id}:${relation.source_node_id}`);
    }
    if (!nodeById[relation.target_node_id]) {
      issues.push(`RELATION_TARGET_DANGLING:${relation.source_relation_id}:${relation.target_node_id}`);
    }
  }
  if (issues.length) throw new SourceGraphError(issues);

  nodes.sort((left, right) => left.source_node_id.localeCompare(right.source_node_id));
  relations.sort((left, right) =>
    left.source_relation_id.localeCompare(right.source_relation_id),
  );
  const sortedNodeById = Object.create(null);
  const sortedRelationById = Object.create(null);
  const sortedSourceDigests = {};
  for (const key of Object.keys(input.source_digests).sort()) {
    sortedSourceDigests[key] = input.source_digests[key];
  }
  for (const node of nodes) sortedNodeById[node.source_node_id] = node;
  for (const relation of relations) sortedRelationById[relation.source_relation_id] = relation;

  return deepFreeze({
    schema_version: OEW_COMPILED_SOURCE_GRAPH_SCHEMA,
    graph_digest: actualDigest,
    source_digests: sortedSourceDigests,
    nodes,
    relations,
    node_by_id: sortedNodeById,
    relation_by_id: sortedRelationById,
    receipt: {
      schema_version: OEW_SOURCE_GRAPH_RECEIPT_SCHEMA,
      result: "pass",
      source_schema_version: OEW_SOURCE_GRAPH_SCHEMA,
      graph_digest: actualDigest,
      source_digests: sortedSourceDigests,
      canonicalization: "id-sorted-records@1.0.0",
      node_count: nodes.length,
      relation_count: relations.length,
      node_ids: nodes.map((node) => node.source_node_id),
      relation_ids: relations.map((relation) => relation.source_relation_id),
      authority_effect: "none",
    },
  });
}
