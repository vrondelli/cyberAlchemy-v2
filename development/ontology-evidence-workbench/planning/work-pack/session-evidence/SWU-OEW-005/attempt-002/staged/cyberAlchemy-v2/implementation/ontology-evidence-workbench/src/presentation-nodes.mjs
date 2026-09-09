const SOURCE_KIND_TO_PRESENTATION_TYPE = Object.freeze({
  Definition: "claim",
  Finding: "claim",
  Observation: "source",
  "Research artifact": "source",
});

const DIGEST_PATTERN = /^[a-f0-9]{64}$/;
const REQUIRED_TEXT_FIELDS = Object.freeze([
  "source_id",
  "source_kind",
  "source_kind_original",
  "label",
  "source_artifact",
  "source_path",
  "source_digest",
]);

export class NodeProjectionError extends Error {
  constructor(issues) {
    const stableIssues = [...new Set(issues)].sort();
    super(`node projection rejected: ${stableIssues.join(",")}`);
    this.name = "NodeProjectionError";
    this.code = "OEW_NODE_PROJECTION_REJECTED";
    this.issues = stableIssues;
  }
}

function validateSourceRun(sourceRun, issues) {
  if (sourceRun === null || typeof sourceRun !== "object" || Array.isArray(sourceRun)) {
    issues.push("SOURCE_RUN_INVALID");
    return;
  }
  if (typeof sourceRun.run_id !== "string" || sourceRun.run_id.length === 0) {
    issues.push("SOURCE_RUN_ID_INVALID");
  }
  if (!DIGEST_PATTERN.test(sourceRun.terminal_receipt_sha256 ?? "")) {
    issues.push("SOURCE_RUN_RECEIPT_DIGEST_INVALID");
  }
  if (sourceRun.authority_effect !== "none") {
    issues.push("AUTHORITY_EFFECT_FORBIDDEN:source_run");
  }
}

function validateNode(node, index, seen, issues) {
  if (node === null || typeof node !== "object" || Array.isArray(node)) {
    issues.push(`NODE_INVALID:${index}`);
    return;
  }
  for (const field of REQUIRED_TEXT_FIELDS) {
    if (typeof node[field] !== "string" || node[field].length === 0) {
      issues.push(`NODE_FIELD_INVALID:${index}:${field}`);
    }
  }
  if (typeof node.source_id === "string" && node.source_id.length > 0) {
    if (seen.has(node.source_id)) issues.push(`DUPLICATE_SOURCE_ID:${node.source_id}`);
    seen.add(node.source_id);
  }
  if (!Object.hasOwn(SOURCE_KIND_TO_PRESENTATION_TYPE, node.source_kind)) {
    issues.push(`UNKNOWN_SOURCE_KIND:${node.source_kind ?? "<missing>"}`);
  }
  if (!DIGEST_PATTERN.test(node.source_digest ?? "")) {
    issues.push(`SOURCE_DIGEST_INVALID:${node.source_id ?? index}`);
  }
  if (node.authority_effect !== "none") {
    issues.push(`AUTHORITY_EFFECT_FORBIDDEN:${node.source_id ?? index}`);
  }
}

function projectNode(node) {
  const presentationId = `presentation:${node.source_id}`;
  const presentationType = SOURCE_KIND_TO_PRESENTATION_TYPE[node.source_kind];
  return {
    presentation: {
      id: presentationId,
      type: presentationType,
      name: node.label,
      filePath: node.source_path,
      summary: node.label,
      tags: [
        "authority:none",
        `source-kind:${node.source_kind}`,
      ],
      complexity: "simple",
      knowledgeMeta: {
        category: node.source_kind,
        content: node.label,
      },
    },
    sidecar: {
      source_ref: node.source_id,
      source_kind: node.source_kind,
      source_kind_original: node.source_kind_original,
      source_artifact: node.source_artifact,
      source_path: node.source_path,
      source_digest: node.source_digest,
      presentation_type: presentationType,
      mapping_loss: "generalized",
      authority_effect: "none",
    },
  };
}

export function projectPresentationNodes(sourceSubset) {
  const issues = [];
  if (sourceSubset === null || typeof sourceSubset !== "object" || Array.isArray(sourceSubset)) {
    throw new NodeProjectionError(["SOURCE_SUBSET_INVALID"]);
  }
  if (sourceSubset.schema_version !== "oew-source-node-subset/v1") {
    issues.push(`SOURCE_SUBSET_VERSION_UNSUPPORTED:${sourceSubset.schema_version ?? "<missing>"}`);
  }
  if (sourceSubset.authority_effect !== "none") {
    issues.push("AUTHORITY_EFFECT_FORBIDDEN:source_subset");
  }
  validateSourceRun(sourceSubset.source_run, issues);

  if (!Array.isArray(sourceSubset.nodes)) {
    issues.push("SOURCE_NODES_INVALID");
  } else {
    const seen = new Set();
    sourceSubset.nodes.forEach((node, index) => validateNode(node, index, seen, issues));
  }
  if (issues.length > 0) throw new NodeProjectionError(issues);

  const projected = [...sourceSubset.nodes]
    .sort((left, right) => left.source_id.localeCompare(right.source_id))
    .map(projectNode);
  const sidecarNodes = Object.fromEntries(
    projected.map(({ presentation, sidecar }) => [presentation.id, sidecar]),
  );
  const byType = Object.fromEntries(
    ["claim", "source"].map((type) => [
      type,
      projected.filter(({ presentation }) => presentation.type === type).length,
    ]),
  );

  return {
    schema_version: "oew-node-projection/v1",
    source_run: {
      run_id: sourceSubset.source_run.run_id,
      terminal_receipt_sha256: sourceSubset.source_run.terminal_receipt_sha256,
      authority_effect: "none",
    },
    presentation_nodes: projected.map(({ presentation }) => presentation),
    sidecar_nodes: sidecarNodes,
    counts: {
      source_nodes: projected.length,
      presentation_nodes: projected.length,
      sidecar_nodes: Object.keys(sidecarNodes).length,
      by_type: byType,
    },
    authority_effect: "none",
  };
}

export const supportedSourceNodeKinds = Object.freeze(
  Object.keys(SOURCE_KIND_TO_PRESENTATION_TYPE).sort(),
);
