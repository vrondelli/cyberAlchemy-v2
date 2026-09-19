import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const fixtureDirectory = dirname(fileURLToPath(import.meta.url));
const casesPath = resolve(fixtureDirectory, "cases.json");
const expectedPath = resolve(fixtureDirectory, "evaluations.expected.json");
const loadJson = async (path) => JSON.parse(await readFile(path, "utf8"));
const casesDocument = await loadJson(casesPath);
const schemaPath = resolve(fixtureDirectory, casesDocument.schema_path);
const schema = await loadJson(schemaPath);

const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const has = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const canonical = (value) => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (isRecord(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
};
const uniqueSorted = (values) => [...new Set(values)].sort();
const nonEmptyString = (value) => typeof value === "string" && value.length > 0;
const isSha256 = (value) => typeof value === "string" && /^[a-f0-9]{64}$/.test(value);

const requireShape = (value, path, required, allowed, errors) => {
  if (!isRecord(value)) {
    errors.push(`${path}:type:object-required`);
    return false;
  }
  for (const field of required) {
    if (!has(value, field)) errors.push(`${path}:missing:${field}`);
  }
  for (const field of Object.keys(value)) {
    if (!allowed.includes(field)) errors.push(`${path}:unexpected:${field}`);
  }
  return true;
};

const validateString = (value, path, errors) => {
  if (!nonEmptyString(value)) errors.push(`${path}:type:non-empty-string-required`);
};

const validateDigest = (value, path, errors) => {
  if (!isSha256(value)) errors.push(`${path}:type:sha256-required`);
};

const validateProvider = (provider, path, errors) => {
  if (!requireShape(provider, path, ["provider_id", "version", "config_digest"], ["provider_id", "version", "config_digest"], errors)) return;
  validateString(provider.provider_id, `${path}.provider_id`, errors);
  validateString(provider.version, `${path}.version`, errors);
  validateDigest(provider.config_digest, `${path}.config_digest`, errors);
};

const validateRawEvidence = (references, errors) => {
  if (!Array.isArray(references) || references.length === 0) {
    errors.push("projection.raw_evidence_refs:type:non-empty-array-required");
    return new Set();
  }
  const ids = [];
  const supportedKinds = new Set(["source", "tool-diagnostic", "owner-decision", "derivation-input"]);
  for (const [index, reference] of references.entries()) {
    const path = `projection.raw_evidence_refs[${index}]`;
    if (!requireShape(reference, path, ["ref_id", "kind", "uri", "sha256"], ["ref_id", "kind", "uri", "sha256", "selector"], errors)) continue;
    validateString(reference.ref_id, `${path}.ref_id`, errors);
    validateString(reference.uri, `${path}.uri`, errors);
    validateDigest(reference.sha256, `${path}.sha256`, errors);
    if (!supportedKinds.has(reference.kind)) errors.push(`${path}.kind:unsupported:${reference.kind}`);
    if (has(reference, "selector")) validateString(reference.selector, `${path}.selector`, errors);
    ids.push(reference.ref_id);
  }
  for (const id of uniqueSorted(ids.filter((candidate) => ids.filter((value) => value === candidate).length > 1))) {
    errors.push(`projection.raw_evidence_refs:duplicate:${id}`);
  }
  return new Set(ids);
};

const validateRawRefs = (rawRefs, path, evidenceIds, errors) => {
  if (!Array.isArray(rawRefs) || rawRefs.length === 0) {
    errors.push(`${path}:empty`);
    return;
  }
  for (const ref of rawRefs) {
    if (!nonEmptyString(ref)) errors.push(`${path}:type:reference-id-required`);
    else if (!evidenceIds.has(ref)) errors.push(`${path}:unresolved:${ref}`);
  }
  for (const ref of uniqueSorted(rawRefs.filter((candidate) => rawRefs.filter((value) => value === candidate).length > 1))) {
    errors.push(`${path}:duplicate:${ref}`);
  }
};

const validateDerivationRef = (reference, path, errors) => {
  const fields = ["derivation_id", "algorithm", "input_fact_ids", "source_digest"];
  if (!requireShape(reference, path, fields, fields, errors)) return;
  validateString(reference.derivation_id, `${path}.derivation_id`, errors);
  validateString(reference.algorithm, `${path}.algorithm`, errors);
  validateDigest(reference.source_digest, `${path}.source_digest`, errors);
  if (!Array.isArray(reference.input_fact_ids) || reference.input_fact_ids.length === 0) {
    errors.push(`${path}.input_fact_ids:type:non-empty-array-required`);
  } else {
    for (const factId of reference.input_fact_ids) validateString(factId, `${path}.input_fact_ids[]`, errors);
    if (new Set(reference.input_fact_ids).size !== reference.input_fact_ids.length) errors.push(`${path}.input_fact_ids:duplicate`);
  }
};

const validateDecisionRef = (reference, path, errors) => {
  const fields = ["decision_id", "decision_digest", "decided_by", "outcome"];
  if (!requireShape(reference, path, fields, fields, errors)) return;
  validateString(reference.decision_id, `${path}.decision_id`, errors);
  validateDigest(reference.decision_digest, `${path}.decision_digest`, errors);
  validateString(reference.decided_by, `${path}.decided_by`, errors);
  validateString(reference.outcome, `${path}.outcome`, errors);
};

const validateUnsupportedRef = (reference, path, errors) => {
  const fields = ["code", "reason", "scope"];
  if (!requireShape(reference, path, fields, fields, errors)) return;
  for (const field of fields) validateString(reference[field], `${path}.${field}`, errors);
};

const carrierFields = {
  observed: ["kind", "owner_route", "raw_refs"],
  derived: ["kind", "owner_route", "raw_refs", "derivation_ref"],
  "owner-resolved": ["kind", "owner_route", "raw_refs", "decision_ref"],
  unsupported: ["kind", "owner_route", "raw_refs", "unsupported_ref"],
};

const validateProvenance = (provenance, path, evidenceIds, errors) => {
  if (!isRecord(provenance)) {
    errors.push(`${path}:type:object-required`);
    return null;
  }
  const kind = provenance.kind;
  if (!has(carrierFields, kind)) {
    errors.push(`${path}.kind:unsupported:${kind}`);
    return null;
  }
  const fields = carrierFields[kind];
  requireShape(provenance, path, fields, fields, errors);
  validateString(provenance.owner_route, `${path}.owner_route`, errors);
  validateRawRefs(provenance.raw_refs, `${path}.raw_refs`, evidenceIds, errors);
  if (kind === "derived") validateDerivationRef(provenance.derivation_ref, `${path}.derivation_ref`, errors);
  if (kind === "owner-resolved") validateDecisionRef(provenance.decision_ref, `${path}.decision_ref`, errors);
  if (kind === "unsupported") validateUnsupportedRef(provenance.unsupported_ref, `${path}.unsupported_ref`, errors);
  return kind;
};

const validateProjection = (projection) => {
  const errors = [];
  const rootFields = [
    "schema_version",
    "projection_id",
    "language",
    "artifact_digest",
    "tool",
    "adapter",
    "profile_digest",
    "raw_evidence_refs",
    "facts",
    "diagnostics",
    "redaction_posture",
    "authority_effect",
  ];
  if (!requireShape(projection, "projection", rootFields, rootFields, errors)) return uniqueSorted(errors);
  if (projection.schema_version !== "domainspec-observation-projection/v1") errors.push("projection.schema_version:unsupported");
  validateString(projection.projection_id, "projection.projection_id", errors);
  validateString(projection.language, "projection.language", errors);
  validateDigest(projection.artifact_digest, "projection.artifact_digest", errors);
  validateProvider(projection.tool, "projection.tool", errors);
  validateProvider(projection.adapter, "projection.adapter", errors);
  validateDigest(projection.profile_digest, "projection.profile_digest", errors);
  if (projection.authority_effect !== "none") errors.push("projection.authority_effect:must-be-none");

  const evidenceIds = validateRawEvidence(projection.raw_evidence_refs, errors);
  if (!Array.isArray(projection.diagnostics)) errors.push("projection.diagnostics:type:array-required");
  if (!requireShape(projection.redaction_posture, "projection.redaction_posture", ["mode", "owner_route"], ["mode", "owner_route"], errors)) {
    // The shape error is sufficient.
  } else {
    if (!["none", "opaque-references", "owner-redacted"].includes(projection.redaction_posture.mode)) errors.push("projection.redaction_posture.mode:unsupported");
    validateString(projection.redaction_posture.owner_route, "projection.redaction_posture.owner_route", errors);
  }

  if (!Array.isArray(projection.facts) || projection.facts.length === 0) {
    errors.push("projection.facts:type:non-empty-array-required");
    return uniqueSorted(errors);
  }

  const factIds = [];
  const conflictGroups = new Map();
  const factFields = ["fact_id", "fact_scope", "subject_ref", "predicate_ref", "scope_ref", "value", "provenance"];
  for (const [index, fact] of projection.facts.entries()) {
    const path = `fact[${index}]`;
    if (!requireShape(fact, path, factFields, factFields, errors)) continue;
    validateString(fact.fact_id, `${path}.fact_id`, errors);
    if (!["observation", "effective-constraint"].includes(fact.fact_scope)) errors.push(`${path}.fact_scope:unsupported:${fact.fact_scope}`);
    validateString(fact.subject_ref, `${path}.subject_ref`, errors);
    validateString(fact.predicate_ref, `${path}.predicate_ref`, errors);
    validateString(fact.scope_ref, `${path}.scope_ref`, errors);
    const kind = validateProvenance(fact.provenance, `${path}.provenance`, evidenceIds, errors);
    if (kind === "unsupported" && fact.value !== null) errors.push(`${path}.value:unsupported-must-be-null`);
    factIds.push(fact.fact_id);
    if ([fact.fact_scope, fact.subject_ref, fact.predicate_ref, fact.scope_ref].every(nonEmptyString)) {
      const key = canonical([fact.fact_scope, fact.subject_ref, fact.predicate_ref, fact.scope_ref]);
      const group = conflictGroups.get(key) ?? [];
      group.push(fact);
      conflictGroups.set(key, group);
    }
  }

  for (const factId of uniqueSorted(factIds.filter((candidate) => factIds.filter((value) => value === candidate).length > 1))) {
    errors.push(`projection.facts:duplicate-fact-id:${factId}`);
  }
  for (const [key, facts] of [...conflictGroups.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    if (facts.length < 2) continue;
    const factIdsForKey = facts.map(({ fact_id }) => fact_id).sort().join(",");
    const payloads = new Set(facts.map(({ value, provenance }) => canonical({ value, provenance })));
    const code = payloads.size === 1 ? "duplicate" : "conflict";
    errors.push(`${code}:${key}:${factIdsForKey}`);
  }
  return uniqueSorted(errors);
};

const validateSchemaContract = () => {
  const failures = [];
  if (schema.$schema !== "https://json-schema.org/draft/2020-12/schema") failures.push("schema draft must be 2020-12");
  if (schema.$id !== "https://domainspec.local/schemas/observation-projection/v1") failures.push("schema id mismatch");
  const carrierRefs = (schema.$defs?.provenance?.oneOf ?? []).map((entry) => entry.$ref).sort();
  const expectedRefs = [
    "#/$defs/derivedProvenance",
    "#/$defs/observedProvenance",
    "#/$defs/ownerResolvedProvenance",
    "#/$defs/unsupportedProvenance",
  ];
  if (canonical(carrierRefs) !== canonical(expectedRefs)) failures.push("schema must declare exactly four provenance carriers");
  for (const definition of ["observedProvenance", "derivedProvenance", "ownerResolvedProvenance", "unsupportedProvenance"]) {
    const required = schema.$defs?.[definition]?.required ?? [];
    for (const field of ["kind", "owner_route", "raw_refs"]) {
      if (!required.includes(field)) failures.push(`${definition} must require ${field}`);
    }
    if (schema.$defs?.[definition]?.additionalProperties !== false) failures.push(`${definition} must reject mixed carrier fields`);
  }
  if (failures.length > 0) throw new Error(failures.sort().join("; "));
};

validateSchemaContract();
if (process.versions.node !== casesDocument.runner_contract.runtime_version) {
  throw new Error(`runtime drift: expected ${casesDocument.runner_contract.runtime_version}, got ${process.versions.node}`);
}

const results = {
  schema_version: "domainspec-observation-projection-fixture-results/v1",
  schema_id: schema.$id,
  runtime: `node-${process.versions.node}`,
  carrier_kinds: Object.keys(carrierFields).sort(),
  cases: casesDocument.cases.map((testCase) => {
    const projection = { ...casesDocument.base_projection, facts: testCase.facts };
    const errors = validateProjection(projection);
    return {
      case_id: testCase.case_id,
      verdict: errors.length === 0 ? "pass" : "fail",
      errors,
    };
  }),
  deterministic_conflict_pair_equal: false,
  authority_effect: "none",
};
const forward = results.cases.find(({ case_id }) => case_id === "negative-conflict-forward");
const reversed = results.cases.find(({ case_id }) => case_id === "negative-conflict-reversed");
results.deterministic_conflict_pair_equal = canonical(forward?.errors) === canonical(reversed?.errors);
if (!results.deterministic_conflict_pair_equal) throw new Error("conflict normalization depends on fact order");

const positiveKinds = new Set(
  casesDocument.cases
    .filter(({ case_id }) => case_id.startsWith("positive-"))
    .map(({ facts }) => facts[0]?.provenance?.kind),
);
if (canonical([...positiveKinds].sort()) !== canonical(Object.keys(carrierFields).sort())) {
  throw new Error("positive fixture coverage must include all four provenance carriers");
}

if (!process.argv.includes("--actual-only")) {
  const expected = await loadJson(expectedPath);
  if (canonical(results) !== canonical(expected)) {
    throw new Error("observation projection fixture results differ from expected projection");
  }
}

console.log(JSON.stringify(results, null, 2));
