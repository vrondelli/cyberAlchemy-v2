import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";

import {
  canonicalBytes,
  canonicalSha256,
  sha256Bytes,
} from "./canonical-json.mjs";
import { projectPresentationEdges } from "./presentation-edges.mjs";
import { projectPresentationNodes } from "./presentation-nodes.mjs";

export const UPSTREAM_CONTRACT = Object.freeze({
  repository: "https://github.com/Egonex-AI/Understand-Anything",
  commit: "2cda14e89535049e49120198886bc0b82e9e630f",
  types_sha256: "34ed1953e3fb688301457b2f240cddd7572e4e822c67230517e8d6c2b7290733",
  schema_sha256: "e043d70c2d4485fe717ccee9eb54ad4e36256fdafc0713999e7b9b345bbc7c97",
});

export const POKER_RELATION_SUBSET = Object.freeze({
  schema_version: "oew-source-relation-subset/v1",
  source_node_ids: ["D1", "D2", "F1", "R1"],
  relations: [
    {
      relation_id: "E3",
      source: "R1",
      exact_relation: "derives-from",
      target: "D1",
      policy_disposition: "policy-pass",
      diagnostics: [],
      grounding_inclusion: "included",
      evidence_refs: [
        "validation/poker-team/docs/features/financial-settlement/OBSERVABILITY-REPORT.md",
      ],
      authority_effect: "none",
    },
    {
      relation_id: "E4",
      source: "F1",
      exact_relation: "derives-from",
      target: "R1",
      policy_disposition: "policy-pass",
      diagnostics: [],
      grounding_inclusion: "included",
      evidence_refs: [
        "validation/poker-team/docs/features/financial-settlement/PIPELINE-REPORT.md",
      ],
      authority_effect: "none",
    },
    {
      relation_id: "E5",
      source: "D2",
      exact_relation: "contradicts",
      target: "D1",
      policy_disposition: "not-applicable",
      diagnostics: [],
      grounding_inclusion: "excluded",
      evidence_refs: [
        "validation/poker-team/backend/src/infrastructure/telemetry/instruments.ts",
        "validation/poker-team/docs/features/financial-settlement/observability.md",
      ],
      authority_effect: "none",
    },
    {
      relation_id: "C-SPECIALIZES-D2-D1",
      source: "D2",
      exact_relation: "specializes",
      target: "D1",
      policy_disposition: "policy-indeterminate",
      diagnostics: ["POLICY_OWNER_UNBOUND"],
      grounding_inclusion: "excluded",
      evidence_refs: [
        "validation/poker-team/backend/src/infrastructure/telemetry/instruments.ts",
        "validation/poker-team/docs/features/financial-settlement/observability.md",
      ],
      authority_effect: "none",
    },
  ],
  authority_effect: "none",
});

const DEFAULT_NODE_FIXTURE = new URL("../fixtures/poker-source-subset.json", import.meta.url);
const CREATED_AT = "2026-07-26T00:00:00.000Z";

export class AdapterRunWriteError extends Error {
  constructor(issue, cause) {
    super(`adapter run write rejected: ${issue}`, { cause });
    this.name = "AdapterRunWriteError";
    this.code = "OEW_ADAPTER_RUN_WRITE_REJECTED";
    this.issue = issue;
  }
}

async function loadDefaultNodeSubset() {
  return JSON.parse(await readFile(DEFAULT_NODE_FIXTURE, "utf8"));
}

function validateTotalProjection(nodeProjection, edgeProjection) {
  const issues = [];
  const nodeIds = new Set(nodeProjection.presentation_nodes.map(({ id }) => id));
  const sidecarNodeIds = Object.keys(nodeProjection.sidecar_nodes);
  if (nodeIds.size !== nodeProjection.presentation_nodes.length) {
    issues.push("DUPLICATE_PRESENTATION_NODE");
  }
  if (sidecarNodeIds.length !== nodeIds.size ||
      sidecarNodeIds.some((id) => !nodeIds.has(id))) {
    issues.push("NODE_MAPPING_NOT_TOTAL");
  }
  if (edgeProjection.presentation_edges.length !==
      Object.keys(edgeProjection.sidecar_edges).length) {
    issues.push("EDGE_MAPPING_NOT_TOTAL");
  }
  for (const edge of edgeProjection.presentation_edges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
      issues.push(`EDGE_ENDPOINT_MISSING:${edge.source}:${edge.target}`);
    }
  }
  if (issues.length > 0) {
    throw new AdapterRunWriteError([...new Set(issues)].sort().join(","));
  }
}

function buildGraph(nodeProjection, edgeProjection, sourceRun) {
  const nodeIds = nodeProjection.presentation_nodes.map(({ id }) => id);
  return {
    version: "1.0.0",
    kind: "knowledge",
    project: {
      name: "Poker Team O13 Evidence",
      languages: ["Markdown", "TypeScript"],
      frameworks: [],
      description: "Read-only candidate evidence for the Poker Team O13 mismatch.",
      analyzedAt: CREATED_AT,
      gitCommitHash: sourceRun.terminal_receipt_sha256,
    },
    nodes: nodeProjection.presentation_nodes,
    edges: edgeProjection.presentation_edges,
    layers: [
      {
        id: "o13-evidence",
        name: "O13 candidate evidence",
        description: "Candidate evidence only; authority effect is none.",
        nodeIds,
      },
    ],
    tour: [
      {
        order: 1,
        title: "Finding",
        description: "The pipeline reports two O13 instrument type mismatches.",
        nodeIds: ["presentation:F1"],
      },
      {
        order: 2,
        title: "Research trace",
        description: "The static audit compares declarations with implementation.",
        nodeIds: ["presentation:R1"],
      },
      {
        order: 3,
        title: "Grounded declaration",
        description: "The declared Gauge contract grounds the finding; D2 stays visible but excluded.",
        nodeIds: ["presentation:D1"],
      },
    ],
  };
}

function buildSidecar(nodeProjection, edgeProjection, nodeSubset, relationSubset) {
  return {
    schema_version: "oew.evidence-sidecar.v1",
    source_run: {
      run_id: nodeSubset.source_run.run_id,
      terminal_receipt_sha256: nodeSubset.source_run.terminal_receipt_sha256,
      authority_effect: "none",
    },
    upstream_contract: UPSTREAM_CONTRACT,
    nodes: nodeProjection.sidecar_nodes,
    edges: edgeProjection.sidecar_edges,
    grounding: {
      included_path: ["F1", "R1", "D1"],
      visible_excluded: ["D2"],
      indeterminate_candidates: ["C-SPECIALIZES-D2-D1"],
    },
    counts: {
      ...nodeProjection.counts,
      ...edgeProjection.counts,
    },
    input_digests: {
      node_subset_sha256: canonicalSha256(nodeSubset),
      relation_subset_sha256: canonicalSha256(relationSubset),
    },
    authority_effect: "none",
  };
}

export async function buildAdapterArtifacts({
  nodeSubset,
  relationSubset = POKER_RELATION_SUBSET,
} = {}) {
  const nodes = nodeSubset ?? await loadDefaultNodeSubset();
  const nodeProjection = projectPresentationNodes(nodes);
  const edgeProjection = projectPresentationEdges(relationSubset);
  validateTotalProjection(nodeProjection, edgeProjection);

  const graph = buildGraph(nodeProjection, edgeProjection, nodes.source_run);
  const sidecar = buildSidecar(nodeProjection, edgeProjection, nodes, relationSubset);
  const graphBytes = canonicalBytes(graph);
  const sidecarBytes = canonicalBytes(sidecar);

  return {
    graph,
    sidecar,
    graphBytes,
    sidecarBytes,
    graphSha256: sha256Bytes(graphBytes),
    sidecarSha256: sha256Bytes(sidecarBytes),
  };
}

function buildReceipt(runId, first, second) {
  if (!first.graphBytes.equals(second.graphBytes) ||
      !first.sidecarBytes.equals(second.sidecarBytes)) {
    throw new AdapterRunWriteError("DETERMINISM_COMPARISON_FAILED");
  }
  const sidecar = first.sidecar;
  return {
    schema_version: "oew.adapter-receipt.v1",
    state: "receipt-complete",
    result: "pass",
    run_id: runId,
    created_at: CREATED_AT,
    source_run: sidecar.source_run,
    adapter: {
      name: "@cyberalchemy/ontology-evidence-workbench",
      version: "0.0.0-prototype",
      canonicalization: "canonical-json-key-order-v1",
    },
    upstream_contract: UPSTREAM_CONTRACT,
    artifacts: [
      {
        role: "presentation-graph",
        path: "presentation-graph.json",
        sha256: first.graphSha256,
        size_bytes: first.graphBytes.length,
      },
      {
        role: "evidence-sidecar",
        path: "evidence-sidecar.json",
        sha256: first.sidecarSha256,
        size_bytes: first.sidecarBytes.length,
      },
    ],
    determinism: {
      builds_compared: 2,
      byte_identical: true,
      graph_sha256: first.graphSha256,
      sidecar_sha256: first.sidecarSha256,
    },
    mapping_counts: {
      source_nodes: sidecar.counts.source_nodes,
      presentation_nodes: sidecar.counts.presentation_nodes,
      sidecar_nodes: sidecar.counts.sidecar_nodes,
      source_relations: sidecar.counts.source_relations,
      presentation_edges: sidecar.counts.presentation_edges,
      sidecar_edges: sidecar.counts.sidecar_edges,
    },
    protected_source_check: {
      ...sidecar.input_digests,
      read_only: true,
      authority_effect: "none",
    },
    evidence_ceiling: "Deterministic projection of one verified candidate run; no admission, promotion, publication, product acceptance, or production claim.",
    authority_effect: "none",
  };
}

async function emit(onPhase, phase, detail = {}) {
  if (onPhase) await onPhase({ phase, ...detail });
}

export async function writeAdapterRun(outputDirectory, options = {}) {
  if (typeof outputDirectory !== "string" || outputDirectory.length === 0) {
    throw new AdapterRunWriteError("OUTPUT_DIRECTORY_REQUIRED");
  }
  const output = resolve(outputDirectory);
  const first = await buildAdapterArtifacts(options);
  const second = await buildAdapterArtifacts(options);
  const receipt = buildReceipt(basename(output), first, second);

  await mkdir(dirname(output), { recursive: true });
  try {
    await mkdir(output, { recursive: false, mode: 0o700 });
  } catch (error) {
    throw new AdapterRunWriteError(
      error.code === "EEXIST" ? "OUTPUT_ALREADY_EXISTS" : `OUTPUT_CREATE_FAILED:${error.code ?? "UNKNOWN"}`,
      error,
    );
  }

  await emit(options.onPhase, "directory-created", { output });
  try {
    await writeFile(
      resolve(output, "presentation-graph.json"),
      first.graphBytes,
      { flag: "wx", mode: 0o600 },
    );
    await emit(options.onPhase, "presentation-written", { output });
    await writeFile(
      resolve(output, "evidence-sidecar.json"),
      first.sidecarBytes,
      { flag: "wx", mode: 0o600 },
    );
    await emit(options.onPhase, "sidecar-written", { output });
    await emit(options.onPhase, "receipt-ready", { output });
    const receiptBytes = canonicalBytes(receipt);
    await writeFile(
      resolve(output, "adapter-receipt.json"),
      receiptBytes,
      { flag: "wx", mode: 0o600 },
    );
    await emit(options.onPhase, "receipt-written", { output });
    return {
      output,
      receipt,
      receiptPath: resolve(output, "adapter-receipt.json"),
      receiptSha256: sha256Bytes(receiptBytes),
    };
  } catch (error) {
    if (error instanceof AdapterRunWriteError) throw error;
    throw new AdapterRunWriteError(`OUTPUT_WRITE_FAILED:${error.code ?? "UNKNOWN"}`, error);
  }
}
