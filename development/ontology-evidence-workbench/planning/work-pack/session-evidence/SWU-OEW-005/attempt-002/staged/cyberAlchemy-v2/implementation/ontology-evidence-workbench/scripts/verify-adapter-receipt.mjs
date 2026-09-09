#!/usr/bin/env node
import { createHash } from "node:crypto";
import {
  lstat,
  readFile,
  readdir,
  realpath,
} from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve,
  sep,
} from "node:path";
import { pathToFileURL } from "node:url";

const DIGEST = /^[a-f0-9]{64}$/;
const EXPECTED_FILES = Object.freeze([
  "adapter-receipt.json",
  "evidence-sidecar.json",
  "presentation-graph.json",
]);
const NODE_TYPES = new Set(["claim", "source"]);
const EDGE_TYPES = new Set(["builds_on", "contradicts", "related"]);
const DIRECTIONS = new Set(["forward", "backward", "bidirectional"]);

const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const isRecord = (value) =>
  value !== null && typeof value === "object" && !Array.isArray(value);

function contained(root, candidate) {
  const path = relative(root, candidate);
  return path !== "" && path !== ".." &&
    !path.startsWith(`..${sep}`) && !isAbsolute(path);
}

function canonical(value) {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value;
  if (typeof value === "number" && Number.isFinite(value)) return Object.is(value, -0) ? 0 : value;
  if (Array.isArray(value)) return value.map(canonical);
  if (!isRecord(value)) throw new Error("unsupported canonical value");
  return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
}

function canonicalBytes(value) {
  return Buffer.from(`${JSON.stringify(canonical(value))}\n`, "utf8");
}

function parseJson(bytes, name, issues) {
  try {
    return JSON.parse(bytes);
  } catch {
    issues.push(`JSON_INVALID:${name}`);
    return null;
  }
}

function validateReceipt(receipt, issues) {
  if (!isRecord(receipt)) {
    issues.push("RECEIPT_INVALID");
    return;
  }
  if (receipt.schema_version !== "oew.adapter-receipt.v1") issues.push("RECEIPT_VERSION_UNSUPPORTED");
  if (receipt.state !== "receipt-complete") issues.push("RECEIPT_STATE_INCOMPLETE");
  if (receipt.result !== "pass") issues.push("RECEIPT_RESULT_NOT_PASS");
  if (receipt.authority_effect !== "none") issues.push("AUTHORITY_EFFECT_FORBIDDEN:receipt");
  if (!isRecord(receipt.source_run) ||
      !DIGEST.test(receipt.source_run?.terminal_receipt_sha256 ?? "") ||
      receipt.source_run?.authority_effect !== "none") {
    issues.push("SOURCE_RUN_INVALID");
  }
  if (!isRecord(receipt.upstream_contract) ||
      receipt.upstream_contract?.commit !== "2cda14e89535049e49120198886bc0b82e9e630f" ||
      !DIGEST.test(receipt.upstream_contract?.types_sha256 ?? "") ||
      !DIGEST.test(receipt.upstream_contract?.schema_sha256 ?? "")) {
    issues.push("UPSTREAM_CONTRACT_INVALID");
  }
  if (!Array.isArray(receipt.artifacts) || receipt.artifacts.length !== 2) {
    issues.push("ARTIFACT_RECEIPTS_INVALID");
  } else {
    const paths = receipt.artifacts.map(({ path }) => path).sort();
    if (JSON.stringify(paths) !== JSON.stringify(["evidence-sidecar.json", "presentation-graph.json"])) {
      issues.push("ARTIFACT_RECEIPTS_INVALID");
    }
    for (const artifact of receipt.artifacts) {
      if (!isRecord(artifact) || !DIGEST.test(artifact.sha256 ?? "") ||
          !Number.isInteger(artifact.size_bytes) || artifact.size_bytes < 1) {
        issues.push(`ARTIFACT_RECEIPT_INVALID:${artifact?.path ?? "<missing>"}`);
      }
    }
  }
  if (!isRecord(receipt.determinism) ||
      receipt.determinism?.builds_compared !== 2 ||
      receipt.determinism?.byte_identical !== true ||
      !DIGEST.test(receipt.determinism?.graph_sha256 ?? "") ||
      !DIGEST.test(receipt.determinism?.sidecar_sha256 ?? "")) {
    issues.push("DETERMINISM_RECEIPT_INVALID");
  }
  if (!isRecord(receipt.protected_source_check) ||
      receipt.protected_source_check?.read_only !== true ||
      receipt.protected_source_check?.authority_effect !== "none" ||
      !DIGEST.test(receipt.protected_source_check?.node_subset_sha256 ?? "") ||
      !DIGEST.test(receipt.protected_source_check?.relation_subset_sha256 ?? "")) {
    issues.push("PROTECTED_SOURCE_CHECK_INVALID");
  }
}

function validateGraph(graph, issues) {
  if (!isRecord(graph)) {
    issues.push("GRAPH_INVALID");
    return new Set();
  }
  if (graph.version !== "1.0.0" || graph.kind !== "knowledge") issues.push("GRAPH_ROOT_INVALID");
  if (!isRecord(graph.project) ||
      typeof graph.project.name !== "string" ||
      !Array.isArray(graph.project.languages) ||
      !Array.isArray(graph.project.frameworks) ||
      typeof graph.project.description !== "string" ||
      typeof graph.project.analyzedAt !== "string" ||
      !DIGEST.test(graph.project.gitCommitHash ?? "")) {
    issues.push("GRAPH_PROJECT_INVALID");
  }
  if (!Array.isArray(graph.nodes)) {
    issues.push("GRAPH_NODES_INVALID");
    return new Set();
  }
  const nodeIds = new Set();
  for (const [index, node] of graph.nodes.entries()) {
    if (!isRecord(node) || typeof node.id !== "string" || node.id.length === 0 ||
        !NODE_TYPES.has(node.type) || typeof node.name !== "string" ||
        typeof node.summary !== "string" || !Array.isArray(node.tags) ||
        !node.tags.includes("authority:none") ||
        !["simple", "moderate", "complex"].includes(node.complexity)) {
      issues.push(`GRAPH_NODE_INVALID:${index}`);
      continue;
    }
    if (nodeIds.has(node.id)) issues.push(`GRAPH_NODE_DUPLICATE:${node.id}`);
    nodeIds.add(node.id);
  }
  if (!Array.isArray(graph.edges)) {
    issues.push("GRAPH_EDGES_INVALID");
  } else {
    for (const [index, edge] of graph.edges.entries()) {
      if (!isRecord(edge) || !nodeIds.has(edge.source) || !nodeIds.has(edge.target) ||
          !EDGE_TYPES.has(edge.type) || !DIRECTIONS.has(edge.direction) ||
          typeof edge.weight !== "number" || edge.weight < 0 || edge.weight > 1) {
        issues.push(`GRAPH_EDGE_INVALID:${index}`);
      }
    }
  }
  if (!Array.isArray(graph.layers) || !Array.isArray(graph.tour)) {
    issues.push("GRAPH_NAVIGATION_INVALID");
  }
  return nodeIds;
}

function validateSidecar(sidecar, graph, nodeIds, issues) {
  if (!isRecord(sidecar)) {
    issues.push("SIDECAR_INVALID");
    return;
  }
  if (sidecar.schema_version !== "oew.evidence-sidecar.v1") issues.push("SIDECAR_VERSION_UNSUPPORTED");
  if (sidecar.authority_effect !== "none") issues.push("AUTHORITY_EFFECT_FORBIDDEN:sidecar");
  if (!isRecord(sidecar.source_run) || sidecar.source_run.authority_effect !== "none" ||
      !DIGEST.test(sidecar.source_run.terminal_receipt_sha256 ?? "")) {
    issues.push("SIDECAR_SOURCE_RUN_INVALID");
  }
  if (!isRecord(sidecar.nodes)) {
    issues.push("SIDECAR_NODES_INVALID");
  } else {
    const keys = Object.keys(sidecar.nodes).sort();
    if (keys.length !== nodeIds.size || keys.some((id) => !nodeIds.has(id))) {
      issues.push("NODE_MAPPING_NOT_TOTAL");
    }
    const sourceRefs = new Set();
    for (const [id, row] of Object.entries(sidecar.nodes)) {
      if (!isRecord(row) || row.authority_effect !== "none" ||
          typeof row.source_ref !== "string" || !DIGEST.test(row.source_digest ?? "")) {
        issues.push(`SIDECAR_NODE_INVALID:${id}`);
      } else {
        if (sourceRefs.has(row.source_ref)) issues.push(`SIDECAR_SOURCE_REF_DUPLICATE:${row.source_ref}`);
        sourceRefs.add(row.source_ref);
      }
    }
  }
  if (!isRecord(sidecar.edges)) {
    issues.push("SIDECAR_EDGES_INVALID");
  } else if (Array.isArray(graph?.edges)) {
    const graphTuples = graph.edges.map(
      (edge) => `${edge.source}|${edge.type}|${edge.target}`,
    ).sort();
    const sidecarTuples = [];
    for (const [id, row] of Object.entries(sidecar.edges)) {
      if (!isRecord(row) || row.authority_effect !== "none" ||
          typeof row.source !== "string" || typeof row.target !== "string" ||
          typeof row.presentation_relation !== "string" ||
          typeof row.source_relation !== "string" ||
          !["exact", "generalized", "lossy"].includes(row.mapping_loss) ||
          !Array.isArray(row.diagnostics) || !Array.isArray(row.evidence_refs)) {
        issues.push(`SIDECAR_EDGE_INVALID:${id}`);
        continue;
      }
      sidecarTuples.push(
        `presentation:${row.source}|${row.presentation_relation}|presentation:${row.target}`,
      );
      if (row.source_relation === "specializes" &&
          (row.policy_disposition !== "policy-indeterminate" ||
           row.grounding_inclusion !== "excluded" ||
           !row.diagnostics.includes("POLICY_OWNER_UNBOUND"))) {
        issues.push(`SPECIALIZES_POLICY_STATE_INVALID:${id}`);
      }
    }
    if (JSON.stringify(graphTuples) !== JSON.stringify(sidecarTuples.sort())) {
      issues.push("EDGE_MAPPING_NOT_TOTAL");
    }
  }
  if (graph?.project?.gitCommitHash !== sidecar.source_run?.terminal_receipt_sha256) {
    issues.push("SOURCE_DIGEST_CROSS_BINDING_FAILED");
  }
}

function validateCounts(receipt, graph, sidecar, issues) {
  const counts = receipt?.mapping_counts;
  if (!isRecord(counts) || !isRecord(sidecar?.counts)) {
    issues.push("MAPPING_COUNTS_INVALID");
    return;
  }
  const expected = {
    source_nodes: sidecar.counts.source_nodes,
    presentation_nodes: graph.nodes?.length,
    sidecar_nodes: Object.keys(sidecar.nodes ?? {}).length,
    source_relations: sidecar.counts.source_relations,
    presentation_edges: graph.edges?.length,
    sidecar_edges: Object.keys(sidecar.edges ?? {}).length,
  };
  if (Object.entries(expected).some(([key, value]) => counts[key] !== value)) {
    issues.push("MAPPING_COUNTS_MISMATCH");
  }
}

export async function verifyAdapterReceipt(receiptPath, { repositoryRoot = process.cwd() } = {}) {
  const issues = [];
  let root;
  try {
    root = await realpath(resolve(repositoryRoot));
  } catch {
    return { verified: false, issues: ["REPOSITORY_ROOT_INVALID"], authority_effect: "none" };
  }
  const lexicalReceipt = resolve(root, receiptPath);
  if (!contained(root, lexicalReceipt) || basename(lexicalReceipt) !== "adapter-receipt.json") {
    return { verified: false, issues: ["RECEIPT_PATH_INVALID"], authority_effect: "none" };
  }

  let receiptFile;
  try {
    receiptFile = await realpath(lexicalReceipt);
  } catch {
    return { verified: false, issues: ["RECEIPT_MISSING"], authority_effect: "none" };
  }
  if (!contained(root, receiptFile)) issues.push("RECEIPT_PATH_ESCAPE");
  const runDirectory = dirname(receiptFile);

  let inventory = [];
  try {
    inventory = (await readdir(runDirectory)).sort();
  } catch {
    issues.push("RUN_DIRECTORY_UNREADABLE");
  }
  if (JSON.stringify(inventory) !== JSON.stringify(EXPECTED_FILES)) {
    issues.push(`RUN_INVENTORY_INVALID:${inventory.join(",")}`);
  }

  const bytesByName = {};
  for (const name of EXPECTED_FILES) {
    const path = resolve(runDirectory, name);
    try {
      const status = await lstat(path);
      if (!status.isFile() || status.isSymbolicLink()) {
        issues.push(`ARTIFACT_NOT_REGULAR:${name}`);
        continue;
      }
      const canonicalPath = await realpath(path);
      if (!contained(runDirectory, canonicalPath) || !contained(root, canonicalPath)) {
        issues.push(`ARTIFACT_PATH_ESCAPE:${name}`);
        continue;
      }
      bytesByName[name] = await readFile(canonicalPath);
    } catch {
      issues.push(`ARTIFACT_MISSING:${name}`);
    }
  }

  const receiptBytes = bytesByName["adapter-receipt.json"];
  const graphBytes = bytesByName["presentation-graph.json"];
  const sidecarBytes = bytesByName["evidence-sidecar.json"];
  const receipt = receiptBytes ? parseJson(receiptBytes, "adapter-receipt.json", issues) : null;
  const graph = graphBytes ? parseJson(graphBytes, "presentation-graph.json", issues) : null;
  const sidecar = sidecarBytes ? parseJson(sidecarBytes, "evidence-sidecar.json", issues) : null;

  validateReceipt(receipt, issues);
  if (receiptBytes && receipt && !receiptBytes.equals(canonicalBytes(receipt))) {
    issues.push("RECEIPT_NOT_CANONICAL");
  }
  const nodeIds = validateGraph(graph, issues);
  validateSidecar(sidecar, graph, nodeIds, issues);
  validateCounts(receipt, graph, sidecar, issues);

  if (receipt && graphBytes && sidecarBytes) {
    const artifactByPath = Object.fromEntries(receipt.artifacts?.map((item) => [item.path, item]) ?? []);
    for (const [name, bytes] of [
      ["presentation-graph.json", graphBytes],
      ["evidence-sidecar.json", sidecarBytes],
    ]) {
      const artifact = artifactByPath[name];
      if (!artifact || artifact.sha256 !== sha256(bytes) || artifact.size_bytes !== bytes.length) {
        issues.push(`ARTIFACT_DIGEST_MISMATCH:${name}`);
      }
    }
    if (receipt.determinism?.graph_sha256 !== sha256(graphBytes) ||
        receipt.determinism?.sidecar_sha256 !== sha256(sidecarBytes)) {
      issues.push("DETERMINISM_DIGEST_MISMATCH");
    }
    if (receipt.source_run?.terminal_receipt_sha256 !==
        sidecar.source_run?.terminal_receipt_sha256) {
      issues.push("SOURCE_RUN_CROSS_BINDING_FAILED");
    }
  }

  const stableIssues = [...new Set(issues)].sort();
  return {
    verified: stableIssues.length === 0,
    issues: stableIssues,
    receipt_sha256: receiptBytes ? sha256(receiptBytes) : null,
    artifact_count: graphBytes && sidecarBytes ? 2 : 0,
    mapping_counts: receipt?.mapping_counts ?? null,
    authority_effect: "none",
  };
}

async function main() {
  const receiptPath = process.argv[2];
  if (!receiptPath) {
    process.stderr.write("usage: verify-adapter-receipt.mjs <adapter-receipt.json>\n");
    process.exitCode = 2;
    return;
  }
  const result = await verifyAdapterReceipt(receiptPath);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.verified) process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}
