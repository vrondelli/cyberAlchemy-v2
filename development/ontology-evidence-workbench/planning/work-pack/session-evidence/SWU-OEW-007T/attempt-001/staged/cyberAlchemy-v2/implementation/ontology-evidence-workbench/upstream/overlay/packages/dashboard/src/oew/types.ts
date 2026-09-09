/** @typedef {Record<string, unknown>} OewRecord */
/**
 * @typedef {{
 *   kind: "node" | "edge",
 *   presentationId: string,
 *   sourceRef: string,
 *   row: OewRecord
 * }} OewSourceEntry
 */
/**
 * @typedef {{
 *   graph: OewRecord,
 *   sidecar: OewRecord,
 *   receipt: OewRecord,
 *   hashes: {graph: string, sidecar: string, receipt: string},
 *   sourceRefIndex: Record<string, OewSourceEntry>,
 *   sourceRefs: string[]
 * }} OewBundle
 */

export const OEW_UI_STORE_HANDLE = "oew-ui-store/v1";
export const OEW_SIDECAR_SCHEMA = "oew.evidence-sidecar.v1";
export const OEW_RECEIPT_SCHEMA = "oew.adapter-receipt.v1";
export const OEW_GRAPH_VERSION = "1.0.0";
export const OEW_UPSTREAM_COMMIT =
  "2cda14e89535049e49120198886bc0b82e9e630f";

export class OewBundleError extends Error {
  /**
   * @param {string} issue
   * @param {string} [detail]
   */
  constructor(issue, detail = "") {
    super(detail ? `${issue}: ${detail}` : issue);
    this.name = "OewBundleError";
    Object.assign(this, {issue});
  }
}

/**
 * @param {unknown} value
 * @returns {value is OewRecord}
 */
export const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

/**
 * @param {unknown} value
 * @returns {OewRecord[]}
 */
const recordArray = (value) => {
  /** @type {unknown[]} */
  const candidates = Array.isArray(value) ? value : [];
  return candidates.filter(isRecord);
};

const digest = /^[a-f0-9]{64}$/;

/**
 * @param {unknown} actual
 * @param {unknown} expected
 * @param {string} issue
 */
const requireEqual = (actual, expected, issue) => {
  if (actual !== expected) {
    throw new OewBundleError(
      issue,
      `${JSON.stringify(actual)} != ${JSON.stringify(expected)}`,
    );
  }
};

/**
 * @param {OewRecord} value
 * @returns {string[]}
 */
const exactKeys = (value) => Object.keys(value).sort();

/**
 * @param {{
 *   graph: unknown,
 *   sidecar: unknown,
 *   receipt: unknown,
 *   hashes: {graph: string, sidecar: string, receipt: string},
 *   expectedReceiptSha256: unknown
 * }} input
 * @returns {OewBundle}
 */
export function validateOewBundle({
  graph,
  sidecar,
  receipt,
  hashes,
  expectedReceiptSha256,
}) {
  if (!isRecord(graph) || !isRecord(sidecar) || !isRecord(receipt)) {
    throw new OewBundleError("BUNDLE_DOCUMENT_INVALID");
  }
  requireEqual(graph.version, OEW_GRAPH_VERSION, "GRAPH_VERSION");
  requireEqual(graph.kind, "knowledge", "GRAPH_KIND");
  requireEqual(sidecar.schema_version, OEW_SIDECAR_SCHEMA, "SIDECAR_SCHEMA");
  requireEqual(sidecar.authority_effect, "none", "SIDECAR_AUTHORITY");
  requireEqual(receipt.schema_version, OEW_RECEIPT_SCHEMA, "RECEIPT_SCHEMA");
  requireEqual(receipt.result, "pass", "RECEIPT_RESULT");
  requireEqual(receipt.state, "receipt-complete", "RECEIPT_STATE");
  requireEqual(receipt.authority_effect, "none", "RECEIPT_AUTHORITY");
  const upstreamContract = isRecord(receipt.upstream_contract)
    ? receipt.upstream_contract
    : {};
  requireEqual(
    upstreamContract.commit,
    OEW_UPSTREAM_COMMIT,
    "UPSTREAM_COMMIT",
  );
  if (
    typeof expectedReceiptSha256 !== "string" ||
    !digest.test(expectedReceiptSha256)
  ) {
    throw new OewBundleError("EXPECTED_RECEIPT_DIGEST_REQUIRED");
  }
  requireEqual(hashes.receipt, expectedReceiptSha256, "RECEIPT_DIGEST");

  /** @type {Record<string, OewRecord>} */
  const artifactByRole = Object.fromEntries(
    recordArray(receipt.artifacts)
      .filter((row) => typeof row.role === "string")
      .map((row) => [String(row.role), row]),
  );
  requireEqual(
    artifactByRole["presentation-graph"]?.sha256,
    hashes.graph,
    "GRAPH_DIGEST",
  );
  requireEqual(
    artifactByRole["evidence-sidecar"]?.sha256,
    hashes.sidecar,
    "SIDECAR_DIGEST",
  );

  const graphNodes = recordArray(graph.nodes);
  const graphEdges = recordArray(graph.edges);
  const sidecarNodes = isRecord(sidecar.nodes) ? sidecar.nodes : {};
  const sidecarEdges = isRecord(sidecar.edges) ? sidecar.edges : {};
  const graphNodeIds = graphNodes.map((node) => node.id);
  if (new Set(graphNodeIds).size !== graphNodeIds.length) {
    throw new OewBundleError("GRAPH_NODE_DUPLICATE");
  }
  requireEqual(
    JSON.stringify([...graphNodeIds].sort()),
    JSON.stringify(exactKeys(sidecarNodes)),
    "NODE_MAPPING_NOT_TOTAL",
  );
  requireEqual(graphEdges.length, exactKeys(sidecarEdges).length, "EDGE_COUNT");

  /** @type {Record<string, OewSourceEntry>} */
  const sourceRefIndex = {};
  for (const [presentationId, value] of Object.entries(sidecarNodes)) {
    if (
      !isRecord(value) ||
      typeof value.source_ref !== "string" ||
      !value.source_ref
    ) {
      throw new OewBundleError("NODE_SOURCE_REF_INVALID", presentationId);
    }
    const sourceRef = value.source_ref;
    if (sourceRefIndex[sourceRef]) {
      throw new OewBundleError("SOURCE_REF_DUPLICATE", sourceRef);
    }
    requireEqual(value.authority_effect, "none", "NODE_AUTHORITY");
    sourceRefIndex[sourceRef] = {
      kind: "node",
      presentationId,
      sourceRef,
      row: value,
    };
  }
  for (const [presentationId, value] of Object.entries(sidecarEdges)) {
    if (
      !isRecord(value) ||
      typeof value.source_ref !== "string" ||
      !value.source_ref
    ) {
      throw new OewBundleError("EDGE_SOURCE_REF_INVALID", presentationId);
    }
    const sourceRef = value.source_ref;
    if (sourceRefIndex[sourceRef]) {
      throw new OewBundleError("SOURCE_REF_DUPLICATE", sourceRef);
    }
    requireEqual(value.authority_effect, "none", "EDGE_AUTHORITY");
    const matches = graphEdges.filter(
      (edge) =>
        edge.source === `presentation:${String(value.source)}` &&
        edge.target === `presentation:${String(value.target)}` &&
        edge.type === value.presentation_relation,
    );
    requireEqual(matches.length, 1, "EDGE_MAPPING_NOT_TOTAL");
    sourceRefIndex[sourceRef] = {
      kind: "edge",
      presentationId,
      sourceRef,
      row: value,
    };
  }
  const mappingCounts = isRecord(receipt.mapping_counts)
    ? receipt.mapping_counts
    : {};
  const sidecarCounts = isRecord(sidecar.counts) ? sidecar.counts : {};
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
    hashes,
    sourceRefIndex,
    sourceRefs: exactKeys(sourceRefIndex),
  };
}
