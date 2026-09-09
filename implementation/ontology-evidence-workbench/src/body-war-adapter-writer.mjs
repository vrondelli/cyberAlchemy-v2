import { mkdir, lstat, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  relative,
  resolve,
  sep,
} from "node:path";

import { sha256Canonical as bodyWarCanonicalSha256 } from "../../../../projects/body-war/ontology/business/scripts/validate.mjs";
import {
  canonicalBytes,
  sha256Bytes,
} from "./canonical-json.mjs";
import { UPSTREAM_CONTRACT } from "./adapter-run-writer.mjs";

const CREATED_AT = "2026-07-29T00:00:00.000Z";
const DEFAULT_REPOSITORY_ROOT = resolve(import.meta.dirname, "../../../..");
const DEFAULT_PACKAGE_ROOT = resolve(
  DEFAULT_REPOSITORY_ROOT,
  "projects/body-war/ontology/business",
);
const PACKAGE_LOGICAL_ROOT = "projects/body-war/ontology/business";

const BUILD_ON_PREDICATES = new Set([
  "consumes",
  "depends_on",
  "maps_to",
  "provides",
  "reads",
  "supports",
]);

const TOUR_STEPS = Object.freeze([
  {
    order: 1,
    title: "Business capability map",
    description:
      "Start with the business contexts and capabilities that organize Body War responsibilities.",
    sourceIds: [
      "body-war.business.context.identity-consent",
      "body-war.business.context.route-expansion",
      "body-war.business.context.geometry-evidence",
      "body-war.business.context.score-preview",
    ],
  },
  {
    order: 2,
    title: "Connect and choose",
    description:
      "Follow the runner from authentication through SuggestedTrack selection and consent.",
    sourceIds: [
      "body-war.business.actor.connected-runner",
      "body-war.business.entity.suggested-track",
      "body-war.business.entity.runner-confirmation",
      "body-war.business.policy.consent-contract",
    ],
  },
  {
    order: 3,
    title: "Attach candidate evidence",
    description:
      "Inspect the activity evidence candidate before any source-backed promotion.",
    sourceIds: [
      "body-war.business.entity.run-activity",
      "body-war.business.entity.activity-evidence-candidate",
      "body-war.business.operation.attach-activity-evidence-candidate",
      "body-war.business.operation.confirm-track-with-activity",
    ],
  },
  {
    order: 4,
    title: "Derive and preview",
    description:
      "Trace candidate geometry into a canonical score input and explained ScorePreview.",
    sourceIds: [
      "body-war.business.entity.geometry-candidate",
      "body-war.business.value.score-input-snapshot",
      "body-war.business.policy.score-policy",
      "body-war.business.outcome.score-preview",
    ],
  },
  {
    order: 5,
    title: "Keep the authority ceiling visible",
    description:
      "Review privacy, promotion, and controller boundaries that remain blocked or non-promoting.",
    sourceIds: [
      "body-war.business.policy.geometry-privacy",
      "body-war.business.outcome.source-backed-track",
      "body-war.business.metric.zone-score",
      "body-war.business.policy.controller-selection",
    ],
  },
]);

export class BodyWarAdapterError extends Error {
  constructor(issue, detail = "") {
    super(detail ? `${issue}: ${detail}` : issue);
    this.name = "BodyWarAdapterError";
    this.code = "OEW_BODY_WAR_ADAPTER_REJECTED";
    this.issue = issue;
  }
}

function contained(root, candidate) {
  const path = relative(root, candidate);
  return (
    path !== "" &&
    path !== ".." &&
    !path.startsWith(`..${sep}`) &&
    !isAbsolute(path)
  );
}

async function regularArtifact(path, logicalPath) {
  const info = await lstat(path);
  if (!info.isFile() || info.isSymbolicLink()) {
    throw new BodyWarAdapterError("SOURCE_NOT_REGULAR", logicalPath);
  }
  const bytes = await readFile(path);
  return {
    logicalPath,
    bytes,
    sha256: sha256Bytes(bytes),
    sizeBytes: bytes.length,
  };
}

async function readJsonArtifact(path, logicalPath) {
  const artifact = await regularArtifact(path, logicalPath);
  try {
    return {
      artifact,
      value: JSON.parse(artifact.bytes.toString("utf8")),
    };
  } catch (error) {
    throw new BodyWarAdapterError("SOURCE_JSON_INVALID", `${logicalPath}:${error.message}`);
  }
}

function requireEqual(actual, expected, issue) {
  if (actual !== expected) {
    throw new BodyWarAdapterError(issue, `${actual} != ${expected}`);
  }
}

function titleCase(value) {
  return String(value)
    .split("_")
    .map((part) => `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

async function loadNodes(packageRoot, manifest) {
  const nodeRoot = join(packageRoot, "nodes");
  const files = (await readdir(nodeRoot))
    .filter((name) => name.endsWith(".json") && name !== "manifest.json")
    .sort();
  const records = [];
  for (const name of files) {
    const logicalPath = `${PACKAGE_LOGICAL_ROOT}/nodes/${name}`;
    const loaded = await readJsonArtifact(join(nodeRoot, name), logicalPath);
    records.push({
      node: loaded.value,
      artifact: loaded.artifact,
    });
  }
  requireEqual(records.length, manifest.node_count, "NODE_COUNT_DRIFT");
  const observed = records.map(({ node }) => node.concept_id).sort();
  const declared = [...manifest.concept_ids].sort();
  requireEqual(
    JSON.stringify(observed),
    JSON.stringify(declared),
    "NODE_MANIFEST_DRIFT",
  );
  return records;
}

async function loadLifecyclePolicies(packageRoot) {
  const policyRoot = join(packageRoot, "lifecycle-policies");
  const values = [];
  for (const name of (await readdir(policyRoot)).filter((item) => item.endsWith(".json")).sort()) {
    const loaded = await readJsonArtifact(
      join(policyRoot, name),
      `${PACKAGE_LOGICAL_ROOT}/lifecycle-policies/${name}`,
    );
    values.push(loaded.value);
  }
  return values;
}

export async function loadBodyWarOntology({
  packageRoot = DEFAULT_PACKAGE_ROOT,
} = {}) {
  const canonicalRoot = await realpath(resolve(packageRoot));
  if (!contained(DEFAULT_REPOSITORY_ROOT, canonicalRoot)) {
    throw new BodyWarAdapterError("PACKAGE_ROOT_ESCAPE", canonicalRoot);
  }
  const documents = {};
  for (const [name, logicalPath] of Object.entries({
    profile: "profile.json",
    manifest: "nodes/manifest.json",
    relations: "relations/relations.json",
    branch: "views/business.json",
    residue: "residue.json",
    receipt: "receipts/validation-receipt.json",
  })) {
    documents[name] = await readJsonArtifact(
      join(canonicalRoot, logicalPath),
      `${PACKAGE_LOGICAL_ROOT}/${logicalPath}`,
    );
  }
  const nodeRecords = await loadNodes(canonicalRoot, documents.manifest.value);
  const lifecyclePolicies = await loadLifecyclePolicies(canonicalRoot);
  const nodes = nodeRecords.map(({ node }) => node);
  const relations = documents.relations.value.relations;
  const receipt = documents.receipt.value;
  const profile = documents.profile.value;

  if (
    profile.status !== "candidate-local" ||
    profile.authority_effect !== "none" ||
    profile.release_admission !== "not-granted" ||
    receipt.status !== "pass" ||
    receipt.ontology_status !== "candidate-local" ||
    receipt.authority_effect !== "none" ||
    receipt.release_admission !== "not-granted"
  ) {
    throw new BodyWarAdapterError("PACKAGE_AUTHORITY_BOUNDARY_INVALID");
  }
  requireEqual(nodes.length, receipt.counts.nodes, "RECEIPT_NODE_COUNT_DRIFT");
  requireEqual(
    relations.length,
    receipt.counts.relations,
    "RECEIPT_RELATION_COUNT_DRIFT",
  );
  requireEqual(
    lifecyclePolicies.length,
    receipt.counts.lifecycle_policies,
    "RECEIPT_LIFECYCLE_COUNT_DRIFT",
  );
  requireEqual(
    bodyWarCanonicalSha256(profile),
    receipt.digests.profile,
    "PROFILE_DIGEST_DRIFT",
  );
  requireEqual(
    bodyWarCanonicalSha256(nodes),
    receipt.digests.node_set,
    "NODE_SET_DIGEST_DRIFT",
  );
  requireEqual(
    bodyWarCanonicalSha256(relations),
    receipt.digests.relation_set,
    "RELATION_SET_DIGEST_DRIFT",
  );
  requireEqual(
    bodyWarCanonicalSha256(lifecyclePolicies),
    receipt.digests.lifecycle_set,
    "LIFECYCLE_SET_DIGEST_DRIFT",
  );
  requireEqual(
    bodyWarCanonicalSha256(documents.branch.value),
    receipt.digests.branch_view,
    "BRANCH_VIEW_DIGEST_DRIFT",
  );
  requireEqual(
    bodyWarCanonicalSha256(documents.residue.value),
    receipt.digests.residue,
    "RESIDUE_DIGEST_DRIFT",
  );

  const conceptIds = new Set(nodes.map(({ concept_id: id }) => id));
  for (const relation of relations) {
    if (
      !conceptIds.has(relation.source_concept) ||
      !conceptIds.has(relation.target_concept)
    ) {
      throw new BodyWarAdapterError(
        "RELATION_ENDPOINT_MISSING",
        relation.relation_id,
      );
    }
  }

  return {
    packageRoot: canonicalRoot,
    profile,
    branch: documents.branch.value,
    residue: documents.residue.value,
    receipt,
    receiptArtifact: documents.receipt.artifact,
    nodeRecords,
    nodes,
    relations,
    lifecyclePolicies,
  };
}

function nodePresentationType(node) {
  if (
    node.concept_role === "evidence object" ||
    node.business_kind === "external_system"
  ) {
    return "source";
  }
  return "claim";
}

function nodeSourceKind(node) {
  if (node.business_kind === "premise") return "Finding";
  if (node.concept_role === "evidence object") return "Observation";
  if (node.business_kind === "external_system") return "Research artifact";
  return "Definition";
}

function nodeComplexity(degree) {
  if (degree >= 5) return "complex";
  if (degree >= 3) return "moderate";
  return "simple";
}

function relationProjection(relation) {
  if (relation.predicate === "contradicts") {
    return { type: "contradicts", loss: "exact" };
  }
  if (BUILD_ON_PREDICATES.has(relation.predicate)) {
    return { type: "builds_on", loss: "generalized" };
  }
  return { type: "related", loss: "lossy" };
}

function relationPolicyState(relation) {
  if (relation.predicate === "does_not_promote") {
    return {
      disposition: "policy-pass",
      diagnostics: ["EXPLICIT_NON_PROMOTION_BOUNDARY"],
      grounding: "excluded",
    };
  }
  if (["blocked", "owner-decision"].includes(relation.authority_effect)) {
    return {
      disposition: "policy-indeterminate",
      diagnostics: ["OWNER_DECISION_REQUIRED"],
      grounding: "excluded",
    };
  }
  return {
    disposition: "not-applicable",
    diagnostics: [],
    grounding: "not-applicable",
  };
}

function buildArtifacts(ontology) {
  const degree = new Map(ontology.nodes.map(({ concept_id: id }) => [id, 0]));
  for (const relation of ontology.relations) {
    degree.set(relation.source_concept, degree.get(relation.source_concept) + 1);
    degree.set(relation.target_concept, degree.get(relation.target_concept) + 1);
  }

  const nodeById = new Map(
    ontology.nodeRecords.map((record) => [record.node.concept_id, record]),
  );
  const presentationNodes = [];
  const sidecarNodes = {};
  for (const id of [...nodeById.keys()].sort()) {
    const { node, artifact } = nodeById.get(id);
    const presentationId = `presentation:${id}`;
    const presentationType = nodePresentationType(node);
    const sourceKind = nodeSourceKind(node);
    presentationNodes.push({
      id: presentationId,
      type: presentationType,
      name: node.label,
      filePath: artifact.logicalPath,
      summary: node.definition,
      tags: [
        "authority:none",
        "branch:business",
        `business-kind:${node.business_kind}`,
        `candidate-status:${node.candidate_status}`,
        `concept-role:${node.concept_role.replaceAll(" ", "-")}`,
      ],
      complexity: nodeComplexity(degree.get(id)),
      knowledgeMeta: {
        category: titleCase(node.business_kind),
        content: node.definition,
      },
    });
    sidecarNodes[presentationId] = {
      source_ref: id,
      source_kind: sourceKind,
      source_kind_original: node.business_kind,
      source_artifact: artifact.logicalPath,
      source_path: artifact.logicalPath,
      source_digest: artifact.sha256,
      presentation_type: presentationType,
      mapping_loss: "generalized",
      authority_effect: "none",
    };
  }

  const presentationEdges = [];
  const sidecarEdges = {};
  const mappingLossCounts = { exact: 0, generalized: 0, lossy: 0 };
  for (const relation of [...ontology.relations].sort((left, right) =>
    left.relation_id.localeCompare(right.relation_id))) {
    const projection = relationProjection(relation);
    const policy = relationPolicyState(relation);
    const presentationId = `presentation-edge:${relation.relation_id}`;
    mappingLossCounts[projection.loss] += 1;
    presentationEdges.push({
      source: `presentation:${relation.source_concept}`,
      target: `presentation:${relation.target_concept}`,
      type: projection.type,
      direction:
        relation.direction === "symmetric" ? "bidirectional" : "forward",
      description: relation.predicate,
      weight: 1,
    });
    sidecarEdges[presentationId] = {
      source_ref: relation.relation_id,
      source: relation.source_concept,
      target: relation.target_concept,
      source_relation: relation.predicate,
      presentation_relation: projection.type,
      mapping_loss: projection.loss,
      policy_disposition: policy.disposition,
      diagnostics: policy.diagnostics,
      grounding_inclusion: policy.grounding,
      evidence_refs: [
        ...new Set(relation.evidence_refs.map(({ path }) => path)),
      ].sort(),
      authority_effect: "none",
    };
  }

  const idsByKind = new Map();
  for (const node of ontology.nodes) {
    const values = idsByKind.get(node.business_kind) ?? [];
    values.push(`presentation:${node.concept_id}`);
    idsByKind.set(node.business_kind, values);
  }
  const layers = [...idsByKind.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([kind, nodeIds]) => ({
      id: `body-war-business-${kind.replaceAll("_", "-")}`,
      name: titleCase(kind),
      description:
        `Body War ${titleCase(kind).toLowerCase()} concepts in the candidate-local business meaning branch.`,
      nodeIds: nodeIds.sort(),
    }));

  const tour = TOUR_STEPS.map(({ sourceIds, ...step }) => ({
    ...step,
    nodeIds: sourceIds.map((id) => `presentation:${id}`),
  }));
  const sourceReceiptSha256 = ontology.receiptArtifact.sha256;
  const graph = {
    version: "1.0.0",
    kind: "knowledge",
    project: {
      name: "Body War Business Ontology",
      languages: ["JSON", "Markdown"],
      frameworks: [],
      description:
        "Complete candidate-local Body War business meaning graph. Read-only projection; authority effect is none and release admission is not granted.",
      analyzedAt: CREATED_AT,
      gitCommitHash: sourceReceiptSha256,
    },
    nodes: presentationNodes,
    edges: presentationEdges,
    layers,
    tour,
  };
  const visibleExcluded = ontology.nodes
    .filter(({ candidate_status: status }) =>
      ["blocked", "deferred"].includes(status))
    .map(({ concept_id: id }) => id)
    .sort();
  const sidecar = {
    schema_version: "oew.evidence-sidecar.v1",
    source_run: {
      run_id: "body-war.business-ontology",
      terminal_receipt_sha256: sourceReceiptSha256,
      authority_effect: "none",
    },
    upstream_contract: UPSTREAM_CONTRACT,
    nodes: sidecarNodes,
    edges: sidecarEdges,
    grounding: {
      included_path: TOUR_STEPS[3].sourceIds,
      visible_excluded: visibleExcluded,
      indeterminate_candidates: Object.values(sidecarEdges)
        .filter(({ policy_disposition: disposition }) =>
          disposition === "policy-indeterminate")
        .map(({ source_ref: sourceRef }) => sourceRef)
        .sort(),
    },
    counts: {
      source_nodes: presentationNodes.length,
      presentation_nodes: presentationNodes.length,
      sidecar_nodes: Object.keys(sidecarNodes).length,
      by_type: {
        claim: presentationNodes.filter(({ type }) => type === "claim").length,
        source: presentationNodes.filter(({ type }) => type === "source").length,
      },
      source_relations: presentationEdges.length,
      presentation_edges: presentationEdges.length,
      sidecar_edges: Object.keys(sidecarEdges).length,
      by_mapping_loss: mappingLossCounts,
    },
    input_digests: {
      node_subset_sha256: ontology.receipt.digests.node_set,
      relation_subset_sha256: ontology.receipt.digests.relation_set,
    },
    authority_effect: "none",
  };
  return { graph, sidecar };
}

export async function buildBodyWarAdapterArtifacts(options = {}) {
  const ontology = await loadBodyWarOntology(options);
  const first = buildArtifacts(ontology);
  const second = buildArtifacts(ontology);
  const graphBytes = canonicalBytes(first.graph);
  const sidecarBytes = canonicalBytes(first.sidecar);
  const secondGraphBytes = canonicalBytes(second.graph);
  const secondSidecarBytes = canonicalBytes(second.sidecar);
  if (
    !graphBytes.equals(secondGraphBytes) ||
    !sidecarBytes.equals(secondSidecarBytes)
  ) {
    throw new BodyWarAdapterError("DETERMINISM_COMPARISON_FAILED");
  }
  return {
    ontology,
    graph: first.graph,
    sidecar: first.sidecar,
    graphBytes,
    sidecarBytes,
    graphSha256: sha256Bytes(graphBytes),
    sidecarSha256: sha256Bytes(sidecarBytes),
  };
}

function buildReceipt(runId, artifacts) {
  const counts = artifacts.sidecar.counts;
  return {
    schema_version: "oew.adapter-receipt.v1",
    state: "receipt-complete",
    result: "pass",
    run_id: runId,
    created_at: CREATED_AT,
    source_run: artifacts.sidecar.source_run,
    adapter: {
      name: "@cyberalchemy/ontology-evidence-workbench",
      version: "0.1.0-body-war-prototype",
      canonicalization: "canonical-json-key-order-v1",
    },
    upstream_contract: UPSTREAM_CONTRACT,
    artifacts: [
      {
        role: "presentation-graph",
        path: "presentation-graph.json",
        sha256: artifacts.graphSha256,
        size_bytes: artifacts.graphBytes.length,
      },
      {
        role: "evidence-sidecar",
        path: "evidence-sidecar.json",
        sha256: artifacts.sidecarSha256,
        size_bytes: artifacts.sidecarBytes.length,
      },
    ],
    determinism: {
      builds_compared: 2,
      byte_identical: true,
      graph_sha256: artifacts.graphSha256,
      sidecar_sha256: artifacts.sidecarSha256,
    },
    mapping_counts: {
      source_nodes: counts.source_nodes,
      presentation_nodes: counts.presentation_nodes,
      sidecar_nodes: counts.sidecar_nodes,
      source_relations: counts.source_relations,
      presentation_edges: counts.presentation_edges,
      sidecar_edges: counts.sidecar_edges,
    },
    protected_source_check: {
      ...artifacts.sidecar.input_digests,
      read_only: true,
      authority_effect: "none",
    },
    evidence_ceiling:
      "Deterministic read-only projection of the candidate-local Body War business ontology; no system implementation, DomainSpec execution, ontology promotion, source-backed geometry, score authority, release, or production claim.",
    authority_effect: "none",
  };
}

export async function writeBodyWarAdapterRun(outputDirectory, options = {}) {
  if (typeof outputDirectory !== "string" || outputDirectory.length === 0) {
    throw new BodyWarAdapterError("OUTPUT_DIRECTORY_REQUIRED");
  }
  const output = resolve(outputDirectory);
  const artifacts = await buildBodyWarAdapterArtifacts(options);
  const receipt = buildReceipt(basename(output), artifacts);
  const receiptBytes = canonicalBytes(receipt);

  await mkdir(dirname(output), { recursive: true });
  try {
    await mkdir(output, { recursive: false, mode: 0o700 });
  } catch (error) {
    throw new BodyWarAdapterError(
      error.code === "EEXIST"
        ? "OUTPUT_ALREADY_EXISTS"
        : `OUTPUT_CREATE_FAILED:${error.code ?? "UNKNOWN"}`,
    );
  }
  await writeFile(join(output, "presentation-graph.json"), artifacts.graphBytes, {
    flag: "wx",
    mode: 0o600,
  });
  await writeFile(join(output, "evidence-sidecar.json"), artifacts.sidecarBytes, {
    flag: "wx",
    mode: 0o600,
  });
  await writeFile(join(output, "adapter-receipt.json"), receiptBytes, {
    flag: "wx",
    mode: 0o600,
  });
  return {
    output,
    graph: artifacts.graph,
    sidecar: artifacts.sidecar,
    receipt,
    receiptPath: join(output, "adapter-receipt.json"),
    receiptSha256: sha256Bytes(receiptBytes),
  };
}
