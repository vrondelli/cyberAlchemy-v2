export const OEW_UI_STORE_HANDLE = "oew-ui-store/v1";
export const OEW_SIDECAR_SCHEMA = "oew.evidence-sidecar.v1";
export const OEW_RECEIPT_SCHEMA = "oew.adapter-receipt.v1";
export const OEW_GRAPH_VERSION = "1.0.0";
export const OEW_UPSTREAM_COMMIT =
  "2cda14e89535049e49120198886bc0b82e9e630f";

/**
 * A draft-time exact relation identity without a scene revision.
 * @typedef {Readonly<{source_relation_id: string}>} RelationLocator
 */
/**
 * A finalized exact relation identity bound to one v1.3 scene revision.
 * @typedef {Readonly<{source_relation_id: string, scene_digest: string}>} RelationRef
 */
/** @typedef {string} SceneRevisionDigest */
/**
 * @typedef {Readonly<{
 *   path: string,
 *   ref: RelationLocator | RelationRef
 * }>} RelationReferenceSlotV13
 */
/**
 * Builder-owned v1.3 draft. Revision copies are forbidden until finalization.
 * @typedef {Readonly<Record<string, unknown> & {
 *   schema_version: "oew.knowledge-scene.v1.3",
 *   scene_digest?: never
 * }>} KnowledgeSceneDraftV13
 */
/**
 * Immutable admitted v1.3 scene with one revision bound to every declared slot.
 * @typedef {Readonly<Record<string, unknown> & {
 *   schema_version: "oew.knowledge-scene.v1.3",
 *   scene_digest: SceneRevisionDigest
 * }>} KnowledgeSceneV13
 */
/** @typedef {Readonly<Record<string, unknown>>} RelationFacet */
/** @typedef {ReadonlyMap<string, RelationFacet>} RelationFacetIndex */
/**
 * @typedef {Readonly<{
 *   scene_digest: string,
 *   source_graph_digest: string,
 *   relation_ids: readonly string[],
 *   relation_count: number,
 *   facet_set_digest: string,
 *   digest_profile: "oew.relation-digest.v1",
 *   canonicalization_version: "rfc8785",
 *   hash_algorithm: "sha256"
 * }>} RelationIndexReceipt
 */
/**
 * @typedef {
 *   | Readonly<{status: "resolved", ref: RelationRef, facet: RelationFacet}>
 *   | Readonly<{status: "missing", ref: RelationRef}>
 *   | Readonly<{
 *       status: "stale-scene",
 *       ref: RelationRef,
 *       actual_scene_digest: string
 *     }>
 * } RelationResolution
 */

/** @typedef {Record<string, unknown>} OewRecord */
/**
 * @typedef {object} OewHashes
 * @property {string} graph
 * @property {string} sidecar
 * @property {string} receipt
 */
/**
 * @typedef {object} OewSourceIndexEntry
 * @property {"node" | "edge"} kind
 * @property {string} presentationId
 * @property {string} sourceRef
 * @property {OewRecord} row
 */
/**
 * @typedef {object} VerifiedOewBundle
 * @property {OewRecord} graph
 * @property {OewRecord} sidecar
 * @property {OewRecord} receipt
 * @property {OewHashes} hashes
 * @property {Record<string, OewSourceIndexEntry>} sourceRefIndex
 * @property {string[]} sourceRefs
 */
/**
 * @typedef {object} OewBundleInput
 * @property {unknown} graph
 * @property {unknown} sidecar
 * @property {unknown} receipt
 * @property {unknown} hashes
 * @property {string} expectedReceiptSha256
 */

export class OewBundleError extends Error {
  /** @type {string} */
  issue;

  /**
   * @param {string} issue
   * @param {string} [detail]
   */
  constructor(issue = "", detail = "") {
    super(detail ? `${issue}: ${detail}` : issue);
    this.name = "OewBundleError";
    this.issue = issue;
  }
}
/**
 * @param {unknown} value
 * @returns {value is OewRecord}
 */
export const isRecord = (value = JSON.parse("null")) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const digest = /^[a-f0-9]{64}$/;

/**
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} issue
 */
const requireEqual = (
  actual = JSON.parse("null"),
  expected = JSON.parse("null"),
  issue = "",
) => {
  if (actual !== expected) {
    throw new OewBundleError(
      issue,
      `${JSON.stringify(actual)} != ${JSON.stringify(expected)}`,
    );
  }
};

/** @param {OewRecord} value */
const exactKeys = (value = {}) => Object.keys(value).sort();

/** @param {unknown} value @returns {OewRecord} */
const optionalRecord = (value = JSON.parse("null")) =>
  isRecord(value) ? value : {};

const checkedRecord = (value = JSON.parse("null")) =>
  Object.assign(JSON.parse("{}"), { value }).value;

/**
 * @param {OewBundleInput} input
 * @returns {VerifiedOewBundle}
 */
export function validateOewBundle({
  graph = JSON.parse("null"),
  sidecar = JSON.parse("null"),
  receipt = JSON.parse("null"),
  hashes = JSON.parse("null"),
  expectedReceiptSha256 = "",
} = {}) {
  if (
    !isRecord(graph) ||
    !isRecord(sidecar) ||
    !isRecord(receipt) ||
    !isRecord(hashes)
  ) {
    throw new OewBundleError("BUNDLE_DOCUMENT_INVALID");
  }
  const graphHash = hashes.graph;
  const sidecarHash = hashes.sidecar;
  const receiptHash = hashes.receipt;
  if (
    typeof graphHash !== "string" ||
    typeof sidecarHash !== "string" ||
    typeof receiptHash !== "string"
  ) {
    throw new OewBundleError("BUNDLE_HASH_INVALID");
  }

  requireEqual(graph.version, OEW_GRAPH_VERSION, "GRAPH_VERSION");
  requireEqual(graph.kind, "knowledge", "GRAPH_KIND");
  requireEqual(sidecar.schema_version, OEW_SIDECAR_SCHEMA, "SIDECAR_SCHEMA");
  requireEqual(sidecar.authority_effect, "none", "SIDECAR_AUTHORITY");
  requireEqual(receipt.schema_version, OEW_RECEIPT_SCHEMA, "RECEIPT_SCHEMA");
  requireEqual(receipt.result, "pass", "RECEIPT_RESULT");
  requireEqual(receipt.state, "receipt-complete", "RECEIPT_STATE");
  requireEqual(receipt.authority_effect, "none", "RECEIPT_AUTHORITY");
  requireEqual(
    optionalRecord(receipt.upstream_contract).commit,
    OEW_UPSTREAM_COMMIT,
    "UPSTREAM_COMMIT",
  );
  if (!digest.test(expectedReceiptSha256)) {
    throw new OewBundleError("EXPECTED_RECEIPT_DIGEST_REQUIRED");
  }
  requireEqual(receiptHash, expectedReceiptSha256, "RECEIPT_DIGEST");

  /** @type {Record<string, OewRecord>} */
  const artifactByRole = Object.create(null);
  const artifacts = Array.isArray(receipt.artifacts) ? receipt.artifacts : [];
  for (const artifact of artifacts) {
    if (isRecord(artifact) && typeof artifact.role === "string") {
      artifactByRole[artifact.role] = artifact;
    }
  }
  requireEqual(
    artifactByRole["presentation-graph"]?.sha256,
    graphHash,
    "GRAPH_DIGEST",
  );
  requireEqual(
    artifactByRole["evidence-sidecar"]?.sha256,
    sidecarHash,
    "SIDECAR_DIGEST",
  );

  const graphNodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const graphEdges = Array.isArray(graph.edges) ? graph.edges : [];
  const sidecarNodes = optionalRecord(sidecar.nodes);
  const sidecarEdges = optionalRecord(sidecar.edges);
  /** @type {string[]} */
  const graphNodeIds = [];
  for (const node of graphNodes) {
    if (!isRecord(node) || typeof node.id !== "string") {
      throw new OewBundleError("GRAPH_NODE_INVALID");
    }
    graphNodeIds.push(node.id);
  }
  if (new Set(graphNodeIds).size !== graphNodeIds.length) {
    throw new OewBundleError("GRAPH_NODE_DUPLICATE");
  }
  requireEqual(
    JSON.stringify([...graphNodeIds].sort()),
    JSON.stringify(exactKeys(sidecarNodes)),
    "NODE_MAPPING_NOT_TOTAL",
  );
  requireEqual(graphEdges.length, exactKeys(sidecarEdges).length, "EDGE_COUNT");

  /** @type {Record<string, OewSourceIndexEntry>} */
  const sourceRefIndex = Object.create(null);
  for (const [presentationId, value] of Object.entries(sidecarNodes)) {
    if (!isRecord(value)) {
      throw new OewBundleError("NODE_SOURCE_REF_INVALID", presentationId);
    }
    const row = checkedRecord(value);
    if (typeof row.source_ref !== "string" || !row.source_ref) {
      throw new OewBundleError("NODE_SOURCE_REF_INVALID", presentationId);
    }
    const sourceRef = row.source_ref;
    if (sourceRefIndex[sourceRef]) {
      throw new OewBundleError("SOURCE_REF_DUPLICATE", sourceRef);
    }
    requireEqual(row.authority_effect, "none", "NODE_AUTHORITY");
    sourceRefIndex[sourceRef] = {
      kind: "node",
      presentationId,
      sourceRef,
      row,
    };
  }
  for (const [presentationId, value] of Object.entries(sidecarEdges)) {
    if (!isRecord(value)) {
      throw new OewBundleError("EDGE_SOURCE_REF_INVALID", presentationId);
    }
    const row = checkedRecord(value);
    if (
      typeof row.source_ref !== "string" ||
      !row.source_ref ||
      typeof row.source !== "string" ||
      typeof row.target !== "string" ||
      typeof row.presentation_relation !== "string"
    ) {
      throw new OewBundleError("EDGE_SOURCE_REF_INVALID", presentationId);
    }
    const sourceRef = row.source_ref;
    if (sourceRefIndex[sourceRef]) {
      throw new OewBundleError("SOURCE_REF_DUPLICATE", sourceRef);
    }
    requireEqual(row.authority_effect, "none", "EDGE_AUTHORITY");
    let matchCount = 0;
    for (const edge of graphEdges) {
      if (!isRecord(edge)) continue;
      const graphEdge = checkedRecord(edge);
      if (
        graphEdge.source === `presentation:${row.source}` &&
        graphEdge.target === `presentation:${row.target}` &&
        graphEdge.type === row.presentation_relation
      ) {
        matchCount += 1;
      }
    }
    requireEqual(matchCount, 1, "EDGE_MAPPING_NOT_TOTAL");
    sourceRefIndex[sourceRef] = {
      kind: "edge",
      presentationId,
      sourceRef,
      row,
    };
  }

  const mappingCounts = optionalRecord(receipt.mapping_counts);
  const sidecarCounts = optionalRecord(sidecar.counts);
  requireEqual(
    mappingCounts.presentation_nodes,
    graphNodes.length,
    "RECEIPT_NODE_COUNT",
  );
  requireEqual(
    mappingCounts.presentation_edges,
    graphEdges.length,
    "RECEIPT_EDGE_COUNT",
  );
  requireEqual(
    sidecarCounts.source_nodes,
    exactKeys(sidecarNodes).length,
    "SIDECAR_NODE_COUNT",
  );
  requireEqual(
    sidecarCounts.source_relations,
    exactKeys(sidecarEdges).length,
    "SIDECAR_EDGE_COUNT",
  );

  return {
    graph,
    sidecar,
    receipt,
    hashes: {
      graph: graphHash,
      sidecar: sidecarHash,
      receipt: receiptHash,
    },
    sourceRefIndex,
    sourceRefs: exactKeys(sourceRefIndex),
  };
}
