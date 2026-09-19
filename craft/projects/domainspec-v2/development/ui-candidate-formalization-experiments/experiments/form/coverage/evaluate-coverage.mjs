import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

import { buildEnvelope, canonicalize } from "../../../../ui-meta-type-repair/contracts/canonical-json-v1.mjs";

export const COVERAGE_DIMENSIONS = Object.freeze([
  "valid_instance_preservation",
  "invalid_instance_rejection",
  "substitutability",
  "composition_parity",
  "consequence_parity",
  "no_loss_audit",
]);

const PROHIBITED_INFERENCES = Object.freeze([
  "alternative-results-cannot-be-pooled",
  "non-coverage-is-not-distinct-support",
  "generated-fixtures-are-not-independent-corpus",
  "missing-evidence-is-not-coverage-or-collapse",
  "coverage-stage-result-does-not-mutate-DS-D1-or-DS-D8",
]);

export function evaluateCoverage({ manifest, requirements, alternatives }) {
  assertObject(manifest, "manifest");
  assertObject(requirements, "requirements");
  if (manifest.schema_version !== "ucfe.form-coverage-manifest.v1") throw new TypeError("unsupported coverage manifest");
  if (requirements.schema_version !== "ucfe.form-coverage-requirements.v1") throw new TypeError("unsupported coverage requirements");
  if (requirements.candidate_id !== manifest.candidate_id) throw new TypeError("requirements candidate mismatch");
  if (!Array.isArray(alternatives) || alternatives.length !== manifest.alternative_fixtures.length) throw new TypeError("coverage alternatives must match the manifest");
  validateRequirementDimensions(requirements.dimensions);

  const sourceIds = new Set(manifest.source_pins.map((pin) => `source:${pin.id}`));
  const expectedIds = manifest.alternative_fixtures.map((entry) => entry.id);
  const seenIds = new Set();
  const evaluations = alternatives.map((alternative, index) => {
    assertObject(alternative, `alternatives[${index}]`);
    if (alternative.schema_version !== "ucfe.form-coverage-alternative.v1") throw new TypeError("unsupported alternative fixture");
    if (alternative.candidate_id !== manifest.candidate_id) throw new TypeError("cross-candidate coverage is prohibited");
    if (alternative.alternative_id !== expectedIds[index]) throw new TypeError("alternative order or identity drift");
    if (seenIds.has(alternative.alternative_id)) throw new TypeError("duplicate coverage alternative");
    seenIds.add(alternative.alternative_id);
    rejectForbiddenWitnesses(alternative);
    return evaluateAlternative(requirements, alternative, sourceIds);
  });

  const complete = evaluations.every((entry) => Object.values(entry.dimensions).every((dimension) => dimension.state !== "missing"));
  const passing = evaluations.filter((entry) => entry.outcome === "pass");
  let branchResult;
  let coveredAlternativeId = null;
  const branchIssues = [];
  if (!complete) {
    branchResult = "defer-missing";
    branchIssues.push("incomplete-coverage-dimension");
  } else if (passing.length === 1) {
    branchResult = "covered-existing";
    coveredAlternativeId = passing[0].alternative_id;
  } else if (passing.length > 1) {
    branchResult = "defer-missing";
    branchIssues.push("multiple-complete-coverage-alternatives-require-owner-resolution");
  } else {
    branchResult = "distinct-route-open";
  }

  const semantic = {
    schema_version: "ucfe.form-coverage-result.v1",
    candidate_id: manifest.candidate_id,
    preregistration_generation_id: manifest.preregistration_generation_id,
    evaluations,
    branch_result: branchResult,
    covered_alternative_id: coveredAlternativeId,
    branch_issues: branchIssues,
    distinct_support: false,
    generated_fixture_role: "structural-coverage-audit-only",
    prohibited_inferences: [...PROHIBITED_INFERENCES],
  };
  const envelope = buildEnvelope({
    contractId: "ucfe.form-coverage-result",
    contractVersion: "1.0.0",
    semanticFields: Object.keys(semantic),
    record: semantic,
    status: branchResult === "defer-missing" ? "defer" : "complete",
    inputHandles: [...manifest.input_handles],
  });
  return { ...envelope, semantic };
}

export function publishCoverageResult(result, outputPath) {
  assertObject(result, "result");
  if (typeof outputPath !== "string" || outputPath.length === 0) throw new TypeError("outputPath is required");
  if (existsSync(outputPath)) {
    const existing = JSON.parse(readFileSync(outputPath, "utf8"));
    if (existing.generation_id === result.generation_id && canonicalize(existing.semantic) === canonicalize(result.semantic)) {
      return { status: "no-op", generation_id: result.generation_id };
    }
    throw new TypeError("refusing to overwrite non-identical coverage generation");
  }
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  return { status: "published", generation_id: result.generation_id };
}

function evaluateAlternative(requirements, alternative, sourceIds) {
  const dimensions = {};
  for (const dimension of COVERAGE_DIMENSIONS) {
    const required = requirements.dimensions[dimension];
    const supplied = alternative.dimensions?.[dimension];
    assertObject(supplied, `${alternative.alternative_id}.${dimension}`);
    if (!Array.isArray(supplied.provided_items)) throw new TypeError(`${alternative.alternative_id}.${dimension} provided_items must be an array`);
    if (!Array.isArray(supplied.evidence_handles) || supplied.evidence_handles.length === 0) throw new TypeError(`${alternative.alternative_id}.${dimension} requires evidence handles`);
    for (const handle of supplied.evidence_handles) {
      if (!sourceIds.has(handle)) throw new TypeError(`unknown source handle: ${handle}`);
    }
    const provided = new Set(supplied.provided_items);
    const missingItems = required.required_items.filter((item) => !provided.has(item));
    const state = supplied.audit_complete !== true ? "missing" : missingItems.length === 0 ? "pass" : "fail";
    dimensions[dimension] = {
      state,
      evidence_handles: [...new Set([...required.evidence_handles, ...supplied.evidence_handles])].sort(),
      required_items: [...required.required_items],
      provided_items: [...provided].sort(),
      missing_items: missingItems,
    };
  }
  const states = Object.values(dimensions).map((entry) => entry.state);
  const outcome = states.every((state) => state === "pass") ? "pass" : states.some((state) => state === "missing") ? "incomplete" : "fail";
  return {
    schema_version: "ucfe.form-coverage-alternative-result.v1",
    candidate_id: alternative.candidate_id,
    alternative_id: alternative.alternative_id,
    dimensions,
    outcome,
    evidence_handles: [...new Set(Object.values(dimensions).flatMap((entry) => entry.evidence_handles))].sort(),
  };
}

function validateRequirementDimensions(dimensions) {
  assertObject(dimensions, "requirements.dimensions");
  if (Object.keys(dimensions).sort().join("|") !== [...COVERAGE_DIMENSIONS].sort().join("|")) throw new TypeError("coverage requirements must define exactly six dimensions");
  for (const dimension of COVERAGE_DIMENSIONS) {
    const value = dimensions[dimension];
    assertObject(value, `requirements.${dimension}`);
    if (!Array.isArray(value.required_items) || value.required_items.length === 0 || new Set(value.required_items).size !== value.required_items.length) throw new TypeError(`${dimension} requires unique required items`);
    if (!Array.isArray(value.evidence_handles) || value.evidence_handles.length === 0) throw new TypeError(`${dimension} requires evidence handles`);
  }
}

function rejectForbiddenWitnesses(value, path = "$") {
  if (value === "*") throw new TypeError(`wildcard edge is prohibited at ${path}`);
  if (typeof value === "string" && /^(label|criterion):/.test(value)) throw new TypeError(`label-derived witness is prohibited at ${path}`);
  if (value === null || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((entry, index) => rejectForbiddenWitnesses(entry, `${path}[${index}]`));
    return;
  }
  for (const [key, child] of Object.entries(value)) rejectForbiddenWitnesses(child, `${path}.${key}`);
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be an object`);
}
