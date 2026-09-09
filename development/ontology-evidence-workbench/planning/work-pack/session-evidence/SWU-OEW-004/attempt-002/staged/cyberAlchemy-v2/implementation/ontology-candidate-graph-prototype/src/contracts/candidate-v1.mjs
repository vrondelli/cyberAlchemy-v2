const SHA256 = /^[a-f0-9]{64}$/;
const NODE_KINDS = new Set(["session", "discovery", "research", "findings"]);
const CHALLENGE_MODES = new Set(["evidence", "contradiction", "owner_review"]);

const TOP_LEVEL_FIELDS = [
  "schema_version",
  "fixture_id",
  "authority_effect",
  "nodes",
  "edges",
  "relation_candidates",
];

const NODE_FIELDS = [
  "node_id",
  "kind",
  "label",
  "source_selector",
  "source_digest",
  "owner_route",
  "candidate_status",
  "confidence",
  "challenge_contract",
  "use_guidance",
  "residue_or_invalidation_route",
  "authority_effect",
];

const CONFIDENCE_FIELDS = ["evidence_confidence", "commitment_confidence"];
const CHALLENGE_FIELDS = [
  "challenge_response",
  "valid_challenge_modes",
  "contradiction_edges",
  "validation_edges",
  "owner_route",
  "resolution_gate",
  "blocking_questions",
  "challenge_residue_route",
];
const EDGE_FIELDS = [
  "edge_id",
  "source",
  "predicate",
  "target",
  "evidence_refs",
  "authority_effect",
];
const RELATION_CANDIDATE_FIELDS = [
  "candidate_id",
  "source",
  "predicate",
  "target",
  "evidence_refs",
  "expected_disposition",
  "expected_reason",
  "authority_effect",
];

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function repositoryRelativeSelector(value) {
  return (
    nonEmptyString(value) &&
    !value.startsWith("/") &&
    !value.includes("\\") &&
    !value.split("/").includes("..")
  );
}

function addIssue(issues, path, code, message) {
  issues.push({ path, code, message });
}

function exactFields(record, fields, path, issues) {
  const allowed = new Set(fields);
  for (const key of Object.keys(record)) {
    if (!allowed.has(key)) {
      addIssue(issues, `${path}.${key}`, "UNKNOWN_FIELD", `Unknown field ${key}`);
    }
  }
  for (const key of fields) {
    if (!(key in record)) {
      addIssue(issues, `${path}.${key}`, "MISSING_FIELD", `Missing field ${key}`);
    }
  }
}

function stringArray(value, path, issues, { nonEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    addIssue(issues, path, "INVALID_FIELD", "Expected an array");
    return;
  }
  if (nonEmpty && value.length === 0) {
    addIssue(issues, path, "INVALID_FIELD", "Expected a non-empty array");
  }
  value.forEach((item, index) => {
    if (!nonEmptyString(item)) {
      addIssue(issues, `${path}[${index}]`, "INVALID_FIELD", "Expected a non-empty string");
    }
  });
}

function validateAuthorityEffect(value, path, issues) {
  if (value !== "none") {
    addIssue(
      issues,
      path,
      "AUTHORITY_EFFECT_FORBIDDEN",
      "Candidate records must use authority_effect none",
    );
  }
}

function validateNode(node, index, issues) {
  const path = `nodes[${index}]`;
  if (!isRecord(node)) {
    addIssue(issues, path, "INVALID_FIELD", "Expected an object");
    return;
  }
  exactFields(node, NODE_FIELDS, path, issues);

  for (const key of [
    "node_id",
    "label",
    "owner_route",
    "use_guidance",
    "residue_or_invalidation_route",
  ]) {
    if (!nonEmptyString(node[key])) {
      addIssue(issues, `${path}.${key}`, "INVALID_FIELD", "Expected a non-empty string");
    }
  }
  if (!NODE_KINDS.has(node.kind)) {
    addIssue(issues, `${path}.kind`, "UNKNOWN_NODE_KIND", `Unknown node kind ${String(node.kind)}`);
  }
  if (!repositoryRelativeSelector(node.source_selector)) {
    addIssue(
      issues,
      `${path}.source_selector`,
      "INVALID_FIELD",
      "Expected a repository-relative selector",
    );
  }
  if (typeof node.source_digest !== "string" || !SHA256.test(node.source_digest)) {
    addIssue(issues, `${path}.source_digest`, "INVALID_FIELD", "Expected a SHA-256 digest");
  }
  if (node.candidate_status !== "candidate") {
    addIssue(issues, `${path}.candidate_status`, "INVALID_FIELD", "Expected candidate status");
  }
  validateAuthorityEffect(node.authority_effect, `${path}.authority_effect`, issues);

  if (!isRecord(node.confidence)) {
    addIssue(issues, `${path}.confidence`, "INVALID_FIELD", "Expected an object");
  } else {
    exactFields(node.confidence, CONFIDENCE_FIELDS, `${path}.confidence`, issues);
    if (!["low", "medium", "high"].includes(node.confidence.evidence_confidence)) {
      addIssue(
        issues,
        `${path}.confidence.evidence_confidence`,
        "INVALID_FIELD",
        "Expected low, medium, or high",
      );
    }
    if (node.confidence.commitment_confidence !== "low") {
      addIssue(
        issues,
        `${path}.confidence.commitment_confidence`,
        "INVALID_FIELD",
        "Candidate commitment confidence must be low",
      );
    }
  }

  if (!isRecord(node.challenge_contract)) {
    addIssue(issues, `${path}.challenge_contract`, "INVALID_FIELD", "Expected an object");
  } else {
    const challenge = node.challenge_contract;
    const challengePath = `${path}.challenge_contract`;
    exactFields(challenge, CHALLENGE_FIELDS, challengePath, issues);
    for (const key of [
      "challenge_response",
      "owner_route",
      "resolution_gate",
      "challenge_residue_route",
    ]) {
      if (!nonEmptyString(challenge[key])) {
        addIssue(issues, `${challengePath}.${key}`, "INVALID_FIELD", "Expected a non-empty string");
      }
    }
    stringArray(challenge.valid_challenge_modes, `${challengePath}.valid_challenge_modes`, issues, {
      nonEmpty: true,
    });
    if (Array.isArray(challenge.valid_challenge_modes)) {
      challenge.valid_challenge_modes.forEach((mode, modeIndex) => {
        if (!CHALLENGE_MODES.has(mode)) {
          addIssue(
            issues,
            `${challengePath}.valid_challenge_modes[${modeIndex}]`,
            "INVALID_FIELD",
            `Unknown challenge mode ${String(mode)}`,
          );
        }
      });
    }
    stringArray(challenge.contradiction_edges, `${challengePath}.contradiction_edges`, issues);
    stringArray(challenge.validation_edges, `${challengePath}.validation_edges`, issues);
    stringArray(challenge.blocking_questions, `${challengePath}.blocking_questions`, issues);
  }
}

function validateEdge(edge, index, issues, nodeIds) {
  const path = `edges[${index}]`;
  if (!isRecord(edge)) {
    addIssue(issues, path, "INVALID_FIELD", "Expected an object");
    return;
  }
  exactFields(edge, EDGE_FIELDS, path, issues);
  for (const key of ["edge_id", "source", "predicate", "target"]) {
    if (!nonEmptyString(edge[key])) {
      addIssue(issues, `${path}.${key}`, "INVALID_FIELD", "Expected a non-empty string");
    }
  }
  stringArray(edge.evidence_refs, `${path}.evidence_refs`, issues, { nonEmpty: true });
  validateAuthorityEffect(edge.authority_effect, `${path}.authority_effect`, issues);
  if (nonEmptyString(edge.source) && !nodeIds.has(edge.source)) {
    addIssue(issues, `${path}.source`, "UNRESOLVED_ENDPOINT", `Unknown node ${edge.source}`);
  }
  if (nonEmptyString(edge.target) && !nodeIds.has(edge.target)) {
    addIssue(issues, `${path}.target`, "UNRESOLVED_ENDPOINT", `Unknown node ${edge.target}`);
  }
}

function validateRelationCandidate(candidate, index, issues, nodeIds) {
  const path = `relation_candidates[${index}]`;
  if (!isRecord(candidate)) {
    addIssue(issues, path, "INVALID_FIELD", "Expected an object");
    return;
  }
  exactFields(candidate, RELATION_CANDIDATE_FIELDS, path, issues);
  for (const key of [
    "candidate_id",
    "source",
    "predicate",
    "target",
    "expected_disposition",
    "expected_reason",
  ]) {
    if (!nonEmptyString(candidate[key])) {
      addIssue(issues, `${path}.${key}`, "INVALID_FIELD", "Expected a non-empty string");
    }
  }
  stringArray(candidate.evidence_refs, `${path}.evidence_refs`, issues, { nonEmpty: true });
  validateAuthorityEffect(candidate.authority_effect, `${path}.authority_effect`, issues);
  if (nonEmptyString(candidate.source) && !nodeIds.has(candidate.source)) {
    addIssue(issues, `${path}.source`, "UNRESOLVED_ENDPOINT", `Unknown node ${candidate.source}`);
  }
  if (nonEmptyString(candidate.target) && !nodeIds.has(candidate.target)) {
    addIssue(issues, `${path}.target`, "UNRESOLVED_ENDPOINT", `Unknown node ${candidate.target}`);
  }
}

function duplicateIssues(records, idField, path, code, issues) {
  const firstIndexById = new Map();
  records.forEach((record, index) => {
    if (!isRecord(record) || !nonEmptyString(record[idField])) return;
    const id = record[idField];
    if (firstIndexById.has(id)) {
      addIssue(
        issues,
        `${path}[${index}].${idField}`,
        code,
        `Duplicate identifier ${id}; first seen at ${path}[${firstIndexById.get(id)}]`,
      );
    } else {
      firstIndexById.set(id, index);
    }
  });
}

export function validateCandidateCarrier(candidate) {
  const issues = [];
  if (!isRecord(candidate)) {
    return {
      contract_version: "candidate-v1",
      accepted: false,
      node_count: 0,
      edge_count: 0,
      issues: [{ path: "$", code: "INVALID_DOCUMENT", message: "Expected an object" }],
    };
  }

  exactFields(candidate, TOP_LEVEL_FIELDS, "$", issues);
  if (candidate.schema_version !== "candidate-v1") {
    addIssue(
      issues,
      "$.schema_version",
      "UNKNOWN_SCHEMA_VERSION",
      "Expected schema_version candidate-v1",
    );
  }
  if (!nonEmptyString(candidate.fixture_id)) {
    addIssue(issues, "$.fixture_id", "INVALID_FIELD", "Expected a non-empty fixture id");
  }
  validateAuthorityEffect(candidate.authority_effect, "$.authority_effect", issues);

  const nodes = Array.isArray(candidate.nodes) ? candidate.nodes : [];
  const edges = Array.isArray(candidate.edges) ? candidate.edges : [];
  const relationCandidates = Array.isArray(candidate.relation_candidates)
    ? candidate.relation_candidates
    : [];
  if (!Array.isArray(candidate.nodes)) addIssue(issues, "$.nodes", "INVALID_FIELD", "Expected an array");
  if (!Array.isArray(candidate.edges)) addIssue(issues, "$.edges", "INVALID_FIELD", "Expected an array");
  if (!Array.isArray(candidate.relation_candidates)) {
    addIssue(issues, "$.relation_candidates", "INVALID_FIELD", "Expected an array");
  }

  nodes.forEach((node, index) => validateNode(node, index, issues));
  duplicateIssues(nodes, "node_id", "nodes", "DUPLICATE_NODE_ID", issues);
  const nodeIds = new Set(
    nodes.filter(isRecord).map((node) => node.node_id).filter(nonEmptyString),
  );

  edges.forEach((edge, index) => validateEdge(edge, index, issues, nodeIds));
  duplicateIssues(edges, "edge_id", "edges", "DUPLICATE_EDGE_ID", issues);
  relationCandidates.forEach((candidateRecord, index) =>
    validateRelationCandidate(candidateRecord, index, issues, nodeIds),
  );
  duplicateIssues(
    relationCandidates,
    "candidate_id",
    "relation_candidates",
    "DUPLICATE_CANDIDATE_ID",
    issues,
  );

  issues.sort(
    (left, right) =>
      left.path.localeCompare(right.path) ||
      left.code.localeCompare(right.code) ||
      left.message.localeCompare(right.message),
  );

  return {
    contract_version: "candidate-v1",
    accepted: issues.length === 0,
    node_count: nodes.length,
    edge_count: edges.length,
    issues,
  };
}
