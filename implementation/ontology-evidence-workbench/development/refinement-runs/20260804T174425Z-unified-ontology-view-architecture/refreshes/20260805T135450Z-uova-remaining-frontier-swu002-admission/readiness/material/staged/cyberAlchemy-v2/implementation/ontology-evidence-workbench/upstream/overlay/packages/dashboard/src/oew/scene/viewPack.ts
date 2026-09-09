export const OEW_VIEW_PACK_SCHEMA = "oew.view-pack.v1";
export const OEW_COMPILED_VIEW_PACK_SCHEMA = "oew.compiled-view-pack.v1";
export const OEW_VIEW_PACK_RECEIPT_SCHEMA = "oew.view-pack-receipt.v1";

const SOURCE_GRAPH_SCHEMA = "oew.compiled-source-graph.v1";
const DIGEST = /^[a-f0-9]{64}$/;
const ROLES = new Set([
  "meaning",
  "business",
  "system",
  "bridge",
  "evidence",
  "task",
  "coverage",
  "gaps",
  "learning",
]);
const PACK_KEYS = [
  "allowed_readings",
  "authority_effect",
  "clusters",
  "default_cluster_id",
  "forbidden_readings",
  "graph_digest",
  "label",
  "membership_policy",
  "purpose",
  "role",
  "schema_version",
  "sequences",
  "source_refs",
  "unassigned_policy",
  "view_pack_digest",
  "view_pack_id",
];
const REQUIRED_PACK_KEYS = PACK_KEYS.filter((key) => key !== "sequences");
const CLUSTER_KEYS = [
  "icon_token",
  "id",
  "label",
  "member_node_ids",
  "purpose",
  "source_refs",
];
const SEQUENCE_KEYS = ["id", "node_ids"];

/** @typedef {Record<string, unknown>} JsonRecord */

export class ViewPackError extends Error {
  /** @type {string} */
  code;
  /** @type {string[]} */
  issues;

  /** @param {string[]} issues */
  constructor(issues = []) {
    const stableIssues = [...new Set(issues)].sort();
    super(`OEW View Pack rejected: ${stableIssues.join(", ")}`);
    this.name = "ViewPackError";
    this.code = "OEW_VIEW_PACK_REJECTED";
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
const isNonemptyStringList = (value) =>
  Array.isArray(value) && value.length > 0 && value.every(isNonemptyString);

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
      if (
        child === undefined ||
        typeof child === "function" ||
        typeof child === "symbol"
      ) {
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
export const canonicalViewPackJson = (value) =>
  JSON.stringify(canonicalValue(value));

/** @param {string} text */
const sha256Hex = async (text) => {
  if (!globalThis.crypto?.subtle) {
    throw new ViewPackError(["SHA256_UNAVAILABLE"]);
  }
  const bytes = new TextEncoder().encode(text);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

/** @param {unknown} input */
export async function computeViewPackDigest(input) {
  if (!isRecord(input)) throw new ViewPackError(["DIGEST_INPUT_INVALID"]);
  const digestInput = {};
  for (const [key, value] of Object.entries(input)) {
    if (key !== "view_pack_digest") digestInput[key] = value;
  }
  return sha256Hex(canonicalViewPackJson(digestInput));
}

/** @param {unknown} value */
const deepFreeze = (value) => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

/** @param {JsonRecord} cluster */
const copyCluster = (cluster) => ({
  id: cluster.id,
  label: cluster.label,
  purpose: cluster.purpose,
  icon_token: cluster.icon_token,
  member_node_ids: [...cluster.member_node_ids].sort((left, right) =>
    left.localeCompare(right),
  ),
  source_refs: [...cluster.source_refs],
});

/** @param {JsonRecord} sequence */
const copySequence = (sequence) => ({
  id: sequence.id,
  node_ids: [...sequence.node_ids],
});

/**
 * Compile the only stable cluster-membership authority used by the scene core.
 * Coordinates and graph topology are intentionally absent from this boundary.
 *
 * @param {unknown} sourceGraph
 * @param {unknown} input
 */
export async function compileViewPack(sourceGraph, input) {
  /** @type {string[]} */
  const issues = [];
  if (!isRecord(sourceGraph)) throw new ViewPackError(["SOURCE_GRAPH_INVALID"]);
  if (!isRecord(input)) throw new ViewPackError(["VIEW_PACK_INVALID"]);

  if (
    sourceGraph.schema_version !== SOURCE_GRAPH_SCHEMA ||
    typeof sourceGraph.graph_digest !== "string" ||
    !DIGEST.test(sourceGraph.graph_digest) ||
    !Array.isArray(sourceGraph.nodes) ||
    !isRecord(sourceGraph.node_by_id)
  ) {
    issues.push("SOURCE_GRAPH_INVALID");
  }
  if (!hasDeclaredShape(input, REQUIRED_PACK_KEYS, PACK_KEYS)) {
    issues.push("VIEW_PACK_SHAPE_INVALID");
  }
  if (input.schema_version !== OEW_VIEW_PACK_SCHEMA) {
    issues.push("VIEW_PACK_SCHEMA_UNSUPPORTED");
  }
  if (!isNonemptyString(input.view_pack_id)) issues.push("VIEW_PACK_ID_INVALID");
  if (!isNonemptyString(input.label)) issues.push("VIEW_PACK_LABEL_INVALID");
  if (!isNonemptyString(input.purpose)) issues.push("VIEW_PACK_PURPOSE_INVALID");
  if (!ROLES.has(input.role)) issues.push("VIEW_PACK_ROLE_INVALID");
  if (!isNonemptyStringList(input.allowed_readings)) {
    issues.push("VIEW_PACK_ALLOWED_READINGS_INVALID");
  }
  if (!isNonemptyStringList(input.forbidden_readings)) {
    issues.push("VIEW_PACK_FORBIDDEN_READINGS_INVALID");
  }
  if (!isNonemptyStringList(input.source_refs)) {
    issues.push("VIEW_PACK_SOURCE_REFS_INVALID");
  }
  if (input.membership_policy !== "exactly-one-cluster-per-admitted-node") {
    issues.push("VIEW_PACK_MEMBERSHIP_POLICY_INVALID");
  }
  if (input.unassigned_policy !== "reject") {
    issues.push("VIEW_PACK_UNASSIGNED_POLICY_INVALID");
  }
  if (input.authority_effect !== "none") {
    issues.push("VIEW_PACK_AUTHORITY_INVALID");
  }
  if (typeof input.graph_digest !== "string" || !DIGEST.test(input.graph_digest)) {
    issues.push("VIEW_PACK_GRAPH_DIGEST_INVALID");
  } else if (input.graph_digest !== sourceGraph.graph_digest) {
    issues.push("VIEW_PACK_GRAPH_DIGEST_MISMATCH");
  }
  if (
    typeof input.view_pack_digest !== "string" ||
    !DIGEST.test(input.view_pack_digest)
  ) {
    issues.push("VIEW_PACK_DIGEST_INVALID");
  }
  if (!Array.isArray(input.clusters) || input.clusters.length === 0) {
    issues.push("VIEW_PACK_CLUSTERS_INVALID");
  }
  if (Object.hasOwn(input, "sequences") && !Array.isArray(input.sequences)) {
    issues.push("VIEW_PACK_SEQUENCES_INVALID");
  }
  if (issues.length) throw new ViewPackError(issues);

  const actualDigest = await computeViewPackDigest(input);
  if (actualDigest !== input.view_pack_digest) {
    issues.push("VIEW_PACK_DIGEST_MISMATCH");
  }

  const sourceNodeIds = sourceGraph.nodes
    .map((node, index) => {
      if (!isRecord(node) || !isNonemptyString(node.source_node_id)) {
        issues.push(`SOURCE_NODE_INVALID:${index}`);
        return null;
      }
      if (!Object.hasOwn(sourceGraph.node_by_id, node.source_node_id)) {
        issues.push(`SOURCE_NODE_INDEX_MISSING:${node.source_node_id}`);
      }
      return node.source_node_id;
    })
    .filter((nodeId) => nodeId !== null);
  const sourceNodeIdSet = new Set(sourceNodeIds);
  if (sourceNodeIdSet.size !== sourceNodeIds.length) {
    issues.push("SOURCE_NODE_IDS_DUPLICATE");
  }

  /** @type {Record<string, JsonRecord>} */
  const clusterById = Object.create(null);
  /** @type {Record<string, string>} */
  const clusterIdByNodeId = Object.create(null);
  /** @type {JsonRecord[]} */
  const clusters = [];

  input.clusters.forEach((candidate, clusterIndex) => {
    if (!isRecord(candidate)) {
      issues.push(`CLUSTER_INVALID:${clusterIndex}`);
      return;
    }
    if (!hasDeclaredShape(candidate, CLUSTER_KEYS, CLUSTER_KEYS)) {
      issues.push(`CLUSTER_SHAPE_INVALID:${clusterIndex}`);
    }
    const clusterId = candidate.id;
    if (!isNonemptyString(clusterId)) {
      issues.push(`CLUSTER_ID_INVALID:${clusterIndex}`);
      return;
    }
    if (clusterById[clusterId]) {
      issues.push(`CLUSTER_ID_DUPLICATE:${clusterId}`);
      return;
    }
    for (const field of ["label", "purpose", "icon_token"]) {
      if (!isNonemptyString(candidate[field])) {
        issues.push(`CLUSTER_FIELD_INVALID:${clusterId}:${field}`);
      }
    }
    if (!isNonemptyStringList(candidate.member_node_ids)) {
      issues.push(`CLUSTER_MEMBERS_INVALID:${clusterId}`);
    }
    if (!isNonemptyStringList(candidate.source_refs)) {
      issues.push(`CLUSTER_SOURCE_REFS_INVALID:${clusterId}`);
    }

    const copied = copyCluster(candidate);
    clusterById[clusterId] = copied;
    clusters.push(copied);
    /** @type {Set<string>} */
    const localMembers = new Set();
    if (Array.isArray(candidate.member_node_ids)) {
      for (const nodeId of candidate.member_node_ids) {
        if (!isNonemptyString(nodeId)) {
          issues.push(`CLUSTER_MEMBER_INVALID:${clusterId}`);
          continue;
        }
        if (localMembers.has(nodeId)) {
          issues.push(`CLUSTER_MEMBER_REPEATED:${clusterId}:${nodeId}`);
          continue;
        }
        localMembers.add(nodeId);
        if (!sourceNodeIdSet.has(nodeId)) {
          issues.push(`CLUSTER_MEMBER_UNKNOWN:${clusterId}:${nodeId}`);
          continue;
        }
        if (clusterIdByNodeId[nodeId]) {
          issues.push(
            `CLUSTER_MEMBERSHIP_OVERLAP:${nodeId}:${clusterIdByNodeId[nodeId]}:${clusterId}`,
          );
          continue;
        }
        clusterIdByNodeId[nodeId] = clusterId;
      }
    }
  });

  if (!isNonemptyString(input.default_cluster_id)) {
    issues.push("DEFAULT_CLUSTER_ID_INVALID");
  } else if (!clusterById[input.default_cluster_id]) {
    issues.push(`DEFAULT_CLUSTER_UNKNOWN:${input.default_cluster_id}`);
  }

  for (const nodeId of [...sourceNodeIdSet].sort((left, right) =>
    left.localeCompare(right),
  )) {
    if (!clusterIdByNodeId[nodeId]) {
      issues.push(`CLUSTER_MEMBERSHIP_UNASSIGNED:${nodeId}`);
    }
  }

  /** @type {Record<string, JsonRecord>} */
  const sequenceById = Object.create(null);
  /** @type {JsonRecord[]} */
  const sequences = [];
  for (const [sequenceIndex, candidate] of (input.sequences ?? []).entries()) {
    if (!isRecord(candidate)) {
      issues.push(`SEQUENCE_INVALID:${sequenceIndex}`);
      continue;
    }
    if (!hasDeclaredShape(candidate, SEQUENCE_KEYS, SEQUENCE_KEYS)) {
      issues.push(`SEQUENCE_SHAPE_INVALID:${sequenceIndex}`);
    }
    const sequenceId = candidate.id;
    if (!isNonemptyString(sequenceId)) {
      issues.push(`SEQUENCE_ID_INVALID:${sequenceIndex}`);
      continue;
    }
    if (sequenceById[sequenceId]) {
      issues.push(`SEQUENCE_ID_DUPLICATE:${sequenceId}`);
      continue;
    }
    if (!isNonemptyStringList(candidate.node_ids)) {
      issues.push(`SEQUENCE_NODES_INVALID:${sequenceId}`);
    }
    const copied = copySequence(candidate);
    sequenceById[sequenceId] = copied;
    sequences.push(copied);
    const seen = new Set();
    if (Array.isArray(candidate.node_ids)) {
      for (const nodeId of candidate.node_ids) {
        if (!isNonemptyString(nodeId)) {
          issues.push(`SEQUENCE_NODE_INVALID:${sequenceId}`);
        } else if (seen.has(nodeId)) {
          issues.push(`SEQUENCE_NODE_REPEATED:${sequenceId}:${nodeId}`);
        } else if (!sourceNodeIdSet.has(nodeId)) {
          issues.push(`SEQUENCE_NODE_UNKNOWN:${sequenceId}:${nodeId}`);
        }
        seen.add(nodeId);
      }
    }
  }
  if (issues.length) throw new ViewPackError(issues);

  clusters.sort((left, right) => left.id.localeCompare(right.id));
  sequences.sort((left, right) => left.id.localeCompare(right.id));
  const sortedClusterById = Object.create(null);
  const sortedClusterIdByNodeId = Object.create(null);
  const sortedSequenceById = Object.create(null);
  for (const cluster of clusters) sortedClusterById[cluster.id] = cluster;
  for (const nodeId of [...sourceNodeIdSet].sort((left, right) =>
    left.localeCompare(right),
  )) {
    sortedClusterIdByNodeId[nodeId] = clusterIdByNodeId[nodeId];
  }
  for (const sequence of sequences) sortedSequenceById[sequence.id] = sequence;

  return deepFreeze({
    schema_version: OEW_COMPILED_VIEW_PACK_SCHEMA,
    source_schema_version: OEW_VIEW_PACK_SCHEMA,
    view_pack_id: input.view_pack_id,
    view_pack_digest: actualDigest,
    graph_digest: input.graph_digest,
    role: input.role,
    label: input.label,
    purpose: input.purpose,
    allowed_readings: [...input.allowed_readings],
    forbidden_readings: [...input.forbidden_readings],
    membership_policy: input.membership_policy,
    unassigned_policy: input.unassigned_policy,
    clusters,
    cluster_by_id: sortedClusterById,
    cluster_id_by_node_id: sortedClusterIdByNodeId,
    default_cluster_id: input.default_cluster_id,
    sequences,
    sequence_by_id: sortedSequenceById,
    source_refs: [...input.source_refs],
    authority_effect: "none",
    receipt: {
      schema_version: OEW_VIEW_PACK_RECEIPT_SCHEMA,
      result: "pass",
      view_pack_id: input.view_pack_id,
      view_pack_digest: actualDigest,
      graph_digest: input.graph_digest,
      membership_policy: input.membership_policy,
      admitted_node_count: sourceNodeIdSet.size,
      assigned_node_count: Object.keys(sortedClusterIdByNodeId).length,
      cluster_count: clusters.length,
      sequence_count: sequences.length,
      default_cluster_id: input.default_cluster_id,
      authority_effect: "none",
    },
  });
}
