export const OEW_UI_STORE_HANDLE = "oew-ui-store/v1";
export const OEW_SIDECAR_SCHEMA = "oew.evidence-sidecar.v1";
export const OEW_RECEIPT_SCHEMA = "oew.adapter-receipt.v1";
export const OEW_GRAPH_VERSION = "1.0.0";
export const OEW_UPSTREAM_COMMIT =
  "2cda14e89535049e49120198886bc0b82e9e630f";

export class OewBundleError extends Error {
  constructor(issue, detail = "") {
    super(detail ? `${issue}: ${detail}` : issue);
    this.name = "OewBundleError";
    this.issue = issue;
  }
}

export const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const digest = /^[a-f0-9]{64}$/;

const requireEqual = (actual, expected, issue) => {
  if (actual !== expected) {
    throw new OewBundleError(
      issue,
      `${JSON.stringify(actual)} != ${JSON.stringify(expected)}`,
    );
  }
};

const exactKeys = (value) => Object.keys(value).sort();

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
  requireEqual(
    receipt.upstream_contract?.commit,
    OEW_UPSTREAM_COMMIT,
    "UPSTREAM_COMMIT",
  );
  if (!digest.test(expectedReceiptSha256 ?? "")) {
    throw new OewBundleError("EXPECTED_RECEIPT_DIGEST_REQUIRED");
  }
  requireEqual(hashes.receipt, expectedReceiptSha256, "RECEIPT_DIGEST");

  const artifactByRole = Object.fromEntries(
    (receipt.artifacts ?? []).map((row) => [row.role, row]),
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

  const graphNodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const graphEdges = Array.isArray(graph.edges) ? graph.edges : [];
  const sidecarNodes = isRecord(sidecar.nodes) ? sidecar.nodes : {};
  const sidecarEdges = isRecord(sidecar.edges) ? sidecar.edges : {};
  const graphNodeIds = graphNodes.map((node) => node?.id);
  if (new Set(graphNodeIds).size !== graphNodeIds.length) {
    throw new OewBundleError("GRAPH_NODE_DUPLICATE");
  }
  requireEqual(
    JSON.stringify([...graphNodeIds].sort()),
    JSON.stringify(exactKeys(sidecarNodes)),
    "NODE_MAPPING_NOT_TOTAL",
  );
  requireEqual(graphEdges.length, exactKeys(sidecarEdges).length, "EDGE_COUNT");

  const sourceRefIndex = {};
  for (const [presentationId, row] of Object.entries(sidecarNodes)) {
    if (!isRecord(row) || typeof row.source_ref !== "string" || !row.source_ref) {
      throw new OewBundleError("NODE_SOURCE_REF_INVALID", presentationId);
    }
    if (sourceRefIndex[row.source_ref]) {
      throw new OewBundleError("SOURCE_REF_DUPLICATE", row.source_ref);
    }
    requireEqual(row.authority_effect, "none", "NODE_AUTHORITY");
    sourceRefIndex[row.source_ref] = {
      kind: "node",
      presentationId,
      sourceRef: row.source_ref,
      row,
    };
  }
  for (const [presentationId, row] of Object.entries(sidecarEdges)) {
    if (!isRecord(row) || typeof row.source_ref !== "string" || !row.source_ref) {
      throw new OewBundleError("EDGE_SOURCE_REF_INVALID", presentationId);
    }
    if (sourceRefIndex[row.source_ref]) {
      throw new OewBundleError("SOURCE_REF_DUPLICATE", row.source_ref);
    }
    requireEqual(row.authority_effect, "none", "EDGE_AUTHORITY");
    const matches = graphEdges.filter(
      (edge) =>
        edge.source === `presentation:${row.source}` &&
        edge.target === `presentation:${row.target}` &&
        edge.type === row.presentation_relation,
    );
    requireEqual(matches.length, 1, "EDGE_MAPPING_NOT_TOTAL");
    sourceRefIndex[row.source_ref] = {
      kind: "edge",
      presentationId,
      sourceRef: row.source_ref,
      row,
    };
  }
  requireEqual(
    receipt.mapping_counts?.presentation_nodes,
    graphNodes.length,
    "RECEIPT_NODE_COUNT",
  );
  requireEqual(
    receipt.mapping_counts?.presentation_edges,
    graphEdges.length,
    "RECEIPT_EDGE_COUNT",
  );
  requireEqual(
    sidecar.counts?.source_nodes,
    exactKeys(sidecarNodes).length,
    "SIDECAR_NODE_COUNT",
  );
  requireEqual(
    sidecar.counts?.source_relations,
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
