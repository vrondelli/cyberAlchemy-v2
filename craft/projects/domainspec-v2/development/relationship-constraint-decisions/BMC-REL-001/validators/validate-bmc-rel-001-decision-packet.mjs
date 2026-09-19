#!/usr/bin/env node

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../../..');

const PACKET_PATH = 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json';
const SCHEMA_PATH = 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json';
const SOURCE_PATH = 'projects/domainspec-v2/definitions/relationships/relationships.yml';
const SOURCE_SHA256 = '82c55ea1ad031d3135c5b8a85162e44b4e85f296b54057fda0dc38131ab376a1';
const SOURCE_SIZE = 26867;
const MATRIX_PATH = 'projects/domainspec-v2/development/backend-meta-type-conformance/evidence/WP-BMC-001/BMC-EVD-001.MATURITY-MATRIX.json';
const MATRIX_SHA256 = 'fa7d2903c245f2cbce156a86ef662a88b3ec2a3ec91d659f14ec882bb425f5d5';
const MATRIX_SIZE = 117636;
const RECEIPT_PATH = 'projects/domainspec-v2/development/backend-meta-type-conformance/evidence/WP-BMC-001/BMC-EVD-001.RECEIPT.json';
const RECEIPT_SHA256 = 'eced9020facae6a8b3375f6cf65c94dcc4918f2baab4a8462facb664328649ff';
const RECEIPT_SIZE = 16983;
const CLAIM_CEILING = 'Candidate-only owner decision surface for relationship constraints. It does not change canonical definitions, implementation, registration, ontology, relation materialization, authority, promotion, publication, release, deployment, or production state.';

const BACKEND_IDS = [
  'performs', 'produces', 'produces-for', 'creates', 'triggers-cross', 'enforces',
  'calculates', 'transitions', 'exposes', 'orchestrates', 'applies', 'maps',
  'contains', 'reads', 'emits', 'owns', 'belongs-to'
];
const UI_IDS = ['renders', 'wraps', 'composes', 'consumes', 'submits', 'shapes', 'protects', 'displays'];
const UI_BACKEND_IDS = ['fetches', 'mutates', 'reflects', 'derives', 'contracts', 'mirrors'];
const EXPECTED_IDS = [...BACKEND_IDS, ...UI_IDS, ...UI_BACKEND_IDS];

const ROOT_KEYS = ['schema_version', 'packet_id', 'status', 'authority_effect', 'canonical_source', 'evidence_baseline', 'scope', 'claim_ceiling', 'rows', 'owner_disposition'];
const ROW_KEYS = ['signature_id', 'lane', 'current_authority', 'numeric_bounds_evidence', 'owner_question', 'proposed_decision', 'decision_tests', 'decision_evidence_refs'];
const OWNS_ROW_KEYS = [...ROW_KEYS, 'ownership_topology'];
const BELONGS_TO_ROW_KEYS = [...ROW_KEYS, 'membership_topology'];
const DECISION_KEYS = ['status', 'value', 'rationale', 'evidence_refs'];
const PROPOSED_KEYS = ['status', 'numeric_bounds', 'closure', 'multi_endpoint_semantics', 'partial_view', 'duplicates', 'self_relations', 'ordering', 'occurrence_semantics', 'inverse_semantics', 'representation', 'runtime_cardinality', 'compatibility_token'];
const FACET_KEYS = PROPOSED_KEYS.slice(1);
const D04_OCCURRENCE_TOKEN = 'separate-concept-degree-and-declared-step-count';
const D04_EVIDENCE_REFS = [
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md#bmc-rel-d04--workflow-concept-degree-versus-declared-step-count',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decision-gate/BMC-REL-D04-OPTION-ADMISSIBILITY-REQUEST.json#/candidates/2',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decision-gate/BMC-REL-D04-OPTION-ADMISSIBILITY-RECEIPT.json'
];
const D05_OCCURRENCE_TOKEN = 'separate-concept-degree-and-declared-role-count';
const D05_EVIDENCE_REFS = [
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md#bmc-rel-d05--mapping-concept-degree-versus-declared-role-count',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decision-gate/BMC-REL-D05-OPTION-ADMISSIBILITY-REQUEST.json#/candidates/2',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decision-gate/BMC-REL-D05-OPTION-ADMISSIBILITY-RECEIPT.json'
];
const D06_POLICY_TOKEN = 'one-owner-per-admitted-dimension';
const D06_REGISTRY_PATH = 'projects/domainspec-v2/definitions/ownership-dimensions/ownership-dimensions.json';
const D06_REGISTRY_SHA256 = '91898f538b49f29a1be659560f6b442644a34b3ecb3f0a8916b7a0e53680bad4';
const D06_RATIONALE = 'Owner selected an owns-scoped typed extension for the D06 policy. It records one-owner-per-admitted-dimension against the exact canonical ownership-dimension registry without declaring dimension instances, requiring ownership, or resolving numeric or other topology facets; owned-by remains generated.';
const D06_EVIDENCE_REFS = [
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md#bmc-rel-d06--ownership-uniqueness-per-admitted-dimension',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D06-PROJECTION/receipts/BMC-REL-D06-P01-SELECTION-RECEIPT.json',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D06-PROJECTION/candidates/BMC-REL-D06-P02-PACKET-REPRESENTATION-CANDIDATE.md#bmc-rel-d06-p02-b-owns-scoped-typed-extension',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D06-PROJECTION/decision-gate/BMC-REL-D06-P02-OPTION-ADMISSIBILITY-REQUEST.json#/candidates/1',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D06-PROJECTION/decision-gate/BMC-REL-D06-P02-OPTION-ADMISSIBILITY-RECEIPT.json',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D06-PROJECTION/receipts/BMC-REL-D06-P02-SELECTION-RECEIPT.json',
  'projects/domainspec-v2/definitions/DEFINITIONS.md#domainspec-v2-d29'
];
const D07_POLICY_TOKEN = 'one-parent-per-admitted-membership-kind';
const D07_REGISTRY_PATH = 'projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json';
const D07_REGISTRY_SHA256 = '854ff80f309e38f48f3f278d13d661983652b6809bf3f2bf0e06688b9bf37d5c';
const D07_RATIONALE = 'Owner selected a belongs-to-scoped typed extension for the D07 policy. It records one-parent-per-admitted-membership-kind against the exact canonical membership-kind registry without declaring kind instances or storage, requiring membership, inferring numeric minima or maxima, resolving any ordinary topology facet, or collapsing belongs-to into owns.';
const D07_EVIDENCE_REFS = [
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md#bmc-rel-d07--membership-topology-for-belongs-to',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D07-PROJECTION/candidates/BMC-REL-D07-P02-PACKET-REPRESENTATION-CANDIDATE.md#bmc-rel-d07-p02-b-belongs-to-scoped-typed-extension',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D07-PROJECTION/decision-gate/BMC-REL-D07-P02-OPTION-ADMISSIBILITY-REQUEST.json#/candidates/1',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D07-PROJECTION/decision-gate/BMC-REL-D07-P02-OPTION-ADMISSIBILITY-RECEIPT.json',
  'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-D07-PROJECTION/receipts/BMC-REL-D07-P02-SELECTION-RECEIPT.json',
  'projects/domainspec-v2/definitions/DEFINITIONS.md#domainspec-v2-d30'
];

const FACET_VALUES = {
  closure: ['same-feature', 'cross-feature', 'declared-feature-scopes'],
  multi_endpoint_semantics: ['pooled', 'per-type', 'not-applicable'],
  partial_view: ['skip', 'unsupported', 'owner-blocked'],
  duplicates: ['reject', 'coalesce', 'allow', 'not-applicable'],
  self_relations: ['reject', 'allow', 'not-applicable-by-endpoint-types'],
  ordering: ['ordered', 'unordered', 'not-applicable'],
  occurrence_semantics: ['concept-level', 'runtime-occurrence', 'both-with-separate-bounds', D04_OCCURRENCE_TOKEN, D05_OCCURRENCE_TOKEN],
  inverse_semantics: ['none', 'generated-view', 'authored-canonical', 'bidirectional-pair'],
  representation: ['authored-edge', 'generated-projection', 'canonical-edge-plus-generated-projection', 'attribute-only'],
  runtime_cardinality: ['separate-from-concept-cardinality', 'same-as-concept-cardinality', 'not-applicable'],
  compatibility_token: ['retain', 'replace', 'deprecate']
};

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function assertObject(value, label) {
  assert(isObject(value), `${label} must be an object`);
}

function assertExactKeys(value, expected, label) {
  assertObject(value, label);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  assert(JSON.stringify(actual) === JSON.stringify(wanted), `${label} keys must be exactly ${wanted.join(', ')}`);
}

function assertExactArray(actual, expected, label) {
  assert(Array.isArray(actual), `${label} must be an array`);
  assert(JSON.stringify(actual) === JSON.stringify(expected), `${label} must match the canonical ordered values`);
}

function assertStringList(value, label, { allowEmpty = false } = {}) {
  assert(Array.isArray(value), `${label} must be an array`);
  assert(allowEmpty || value.length > 0, `${label} must not be empty`);
  value.forEach((item, index) => assert(typeof item === 'string' && item.length > 0, `${label}[${index}] must be a non-empty string`));
}

function sha256(bytes) {
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

function readBoundJson(relativePath, expectedHash, expectedSize, label) {
  const absolutePath = path.join(ROOT, relativePath);
  const bytes = fs.readFileSync(absolutePath);
  assert(bytes.length === expectedSize, `${label} size drift: expected ${expectedSize}, got ${bytes.length}`);
  assert(sha256(bytes) === expectedHash, `${label} SHA-256 drift`);
  let value;
  try {
    value = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    fail(`${label} is not valid JSON: ${error.message}`);
  }
  return { absolutePath, bytes, value };
}

function assertRecursivelyClosedSchema(schema) {
  let objectSchemas = 0;
  function visit(value, pointer) {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${pointer}/${index}`));
      return;
    }
    if (!isObject(value)) return;
    const declaresObject = value.type === 'object' || (Array.isArray(value.type) && value.type.includes('object'));
    if (declaresObject) {
      objectSchemas += 1;
      assert(value.additionalProperties === false, `schema object ${pointer} must set additionalProperties=false`);
    }
    for (const [key, child] of Object.entries(value)) visit(child, `${pointer}/${key}`);
  }
  visit(schema, '#');
  assert(objectSchemas >= 20, `schema closure audit expected at least 20 object schemas, found ${objectSchemas}`);
}

function loadContext() {
  const source = readBoundJson(SOURCE_PATH, SOURCE_SHA256, SOURCE_SIZE, 'canonical relationship source');
  const matrix = readBoundJson(MATRIX_PATH, MATRIX_SHA256, MATRIX_SIZE, 'BMC maturity matrix');
  const receipt = readBoundJson(RECEIPT_PATH, RECEIPT_SHA256, RECEIPT_SIZE, 'BMC receipt');
  const schemaAbsolute = path.join(ROOT, SCHEMA_PATH);
  const schemaBytes = fs.readFileSync(schemaAbsolute);
  let schema;
  try {
    schema = JSON.parse(schemaBytes.toString('utf8'));
  } catch (error) {
    fail(`decision packet schema is not valid JSON: ${error.message}`);
  }
  assert(schema.$id === 'urn:domainspec-v2:bmc-rel-001:relationship-constraint-decision-packet:v1', 'unexpected decision packet schema id');
  assertRecursivelyClosedSchema(schema);

  const authority = source.value;
  assert(authority.signature_count === 31, 'canonical relationship source must declare 31 signatures');
  assert(Array.isArray(authority.signatures) && authority.signatures.length === 31, 'canonical relationship source must contain 31 signatures');
  assertExactArray(authority.signatures.map((signature) => signature.id), EXPECTED_IDS, 'canonical signature IDs');
  assert(authority.signatures.every((signature) => signature.status === 'active'), 'all 31 canonical denominator signatures must be active');
  assert(authority.signatures.every((signature) => signature.direction === 'canonical'), 'all 31 canonical denominator signatures must have canonical direction');

  const m = matrix.value;
  assert(m.schema_version === 'domainspec.backend-maturity-matrix/v1', 'unexpected BMC matrix schema version');
  assert(m.work_pack_id === 'WP-BMC-001' && m.swu_id === 'BMC-EVD-001', 'unexpected BMC matrix identity');
  assert(m.status === 'flag', 'BMC matrix must preserve its honest flag result');
  assert(m.relationship_scope?.authority_audit_rows === 31, 'BMC matrix must bind 31 relationship audit rows');
  assert(m.relationship_scope?.backend_implementation_rows === 17, 'BMC matrix must bind 17 backend implementation rows');
  assert(m.relationship_scope?.adjacent_audit_only_rows === 14, 'BMC matrix must bind 14 audit-only rows');
  assert(m.validation_summary?.source_manifest_preflight === 'pass', 'BMC source-manifest preflight must pass');
  assert(m.validation_summary?.validation_commands_declared === 18, 'BMC matrix must declare 18 validation commands');
  assert(m.validation_summary?.validation_commands_passed === 18, 'BMC matrix must record 18 passing validation commands');
  assert(m.authority_effect === 'none', 'BMC matrix must have no authority effect');

  const r = receipt.value;
  assert(r.schema_version === 'domainspec.bmc-evd-001-receipt/v1', 'unexpected BMC receipt schema version');
  assert(r.work_pack_id === 'WP-BMC-001' && r.swu_id === 'BMC-EVD-001', 'unexpected BMC receipt identity');
  assert(r.result === 'flag', 'BMC receipt must preserve its honest flag result');
  assert(r.authority_effect === 'none', 'BMC receipt must have no authority effect');
  assert(r.matrix?.path === MATRIX_PATH && r.matrix?.sha256 === MATRIX_SHA256 && r.matrix?.size_bytes === MATRIX_SIZE, 'BMC receipt matrix binding must be fresh');
  assert(Array.isArray(r.validation_commands) && r.validation_commands.length === 18, 'BMC receipt must contain 18 validation command records');
  assert(r.validation_commands.every((command) => command.exit_code === 0 && command.expected_exit_code === 0), 'all BMC receipt commands must preserve exit code 0');

  return { authority, matrix: m, receipt: r, schema };
}

function expectedLane(index) {
  if (index < 17) return 'backend-implementation';
  if (index < 25) return 'ui-audit-only';
  return 'ui-backend-audit-only';
}

function normalizedSourceTypes(signature) {
  return signature.source_types ?? [signature.source_type];
}

function normalizedTargetTypes(signature) {
  return signature.target_types ?? [signature.target_type];
}

function normalizedInverse(signature) {
  return { kind: signature.inverse.kind, id: signature.inverse.id ?? null };
}

function validateMax(value, label, { allowNull = true } = {}) {
  if (value === null) {
    assert(allowNull, `${label} must be resolved`);
    return;
  }
  assert(value === 'unbounded' || (Number.isInteger(value) && value >= 0), `${label} must be a non-negative integer or "unbounded"`);
}

function validateMin(value, label, { allowNull = true } = {}) {
  if (value === null) {
    assert(allowNull, `${label} must be resolved`);
    return;
  }
  assert(Number.isInteger(value) && value >= 0, `${label} must be a non-negative integer`);
}

function validateBounds(value, label, { allowNulls = false } = {}) {
  assertExactKeys(value, ['source_min', 'source_max', 'target_min', 'target_max'], label);
  validateMin(value.source_min, `${label}.source_min`, { allowNull: allowNulls });
  validateMax(value.source_max, `${label}.source_max`, { allowNull: allowNulls });
  validateMin(value.target_min, `${label}.target_min`, { allowNull: allowNulls });
  validateMax(value.target_max, `${label}.target_max`, { allowNull: allowNulls });
  if (value.source_min !== null && Number.isInteger(value.source_max)) {
    assert(value.source_min <= value.source_max, `${label} source_min must not exceed source_max`);
  }
  if (value.target_min !== null && Number.isInteger(value.target_max)) {
    assert(value.target_min <= value.target_max, `${label} target_min must not exceed target_max`);
  }
}

function validateDecision(decision, facet, row) {
  const label = `row ${row.signature_id} proposed_decision.${facet}`;
  assertExactKeys(decision, DECISION_KEYS, label);
  assert(['unresolved', 'owner-selected', 'retain-canonical'].includes(decision.status), `${label}.status is invalid`);
  assertStringList(decision.evidence_refs, `${label}.evidence_refs`, { allowEmpty: true });

  if (decision.status === 'unresolved') {
    assert(decision.value === null, `${label}.value must be null while unresolved`);
    assert(decision.rationale === null, `${label}.rationale must be null while unresolved`);
    assert(decision.evidence_refs.length === 0, `${label}.evidence_refs must be empty while unresolved`);
    return;
  }

  assert(typeof decision.rationale === 'string' && decision.rationale.length > 0, `${label}.rationale must explain a resolved decision`);
  assert(decision.evidence_refs.length > 0, `${label}.evidence_refs must bind a resolved decision`);

  if (facet === 'numeric_bounds') {
    assertObject(decision.value, `${label}.value`);
    validateBounds(decision.value, `${label}.value`);
    if (row.signature_id !== 'creates') {
      assert(decision.status === 'owner-selected', `${label} cannot retain numeric bounds absent canonical numeric evidence`);
      assert(decision.evidence_refs.some((ref) => !ref.startsWith(SOURCE_PATH) && !ref.endsWith('#ds-d8')), `${label} requires evidence beyond the compatibility token source`);
      assert(!/derived from (the )?multiplicity token|multiplicity token implies/i.test(decision.rationale), `${label} must not derive numeric bounds from the multiplicity token`);
    }
    return;
  }

  assert(FACET_VALUES[facet].includes(decision.value), `${label}.value is outside the closed vocabulary`);
}

function validateNumericEvidence(row) {
  const evidence = row.numeric_bounds_evidence;
  const label = `row ${row.signature_id} numeric_bounds_evidence`;
  assertExactKeys(evidence, ['status', 'source_min', 'source_max', 'target_min', 'target_max', 'closure_scope', 'evidence_refs'], label);
  assertStringList(evidence.evidence_refs, `${label}.evidence_refs`);
  if (row.signature_id === 'creates') {
    assert(evidence.status === 'complete', 'creates must be the sole complete numeric-bounds evidence row');
    assert(evidence.source_min === 0 && evidence.source_max === 1 && evidence.target_min === 0 && evidence.target_max === 1, 'creates must preserve canonical 0..1 source and target bounds');
    assert(evidence.closure_scope === 'same-feature', 'creates must preserve canonical same-feature closure');
    return;
  }
  assert(evidence.status === 'unresolved', `${row.signature_id} numeric evidence must remain unresolved pending owner selection`);
  assert(evidence.source_min === null && evidence.source_max === null && evidence.target_min === null && evidence.target_max === null, `${row.signature_id} must not infer numeric bounds from ${row.current_authority.multiplicity_token}`);
  assert(evidence.closure_scope === null, `${row.signature_id} numeric closure must remain unresolved`);
}

function validateRow(row, signature, index) {
  const expectedRowKeys = row.signature_id === 'owns'
    ? OWNS_ROW_KEYS
    : row.signature_id === 'belongs-to'
      ? BELONGS_TO_ROW_KEYS
      : ROW_KEYS;
  assertExactKeys(row, expectedRowKeys, `rows[${index}]`);
  assert(row.signature_id === signature.id, `rows[${index}] must be ${signature.id}; rows may not be missing, extra, duplicated, or reordered`);
  assert(row.lane === expectedLane(index), `row ${row.signature_id} has wrong lane`);

  assertExactKeys(row.current_authority, ['direction', 'source_types', 'target_types', 'multiplicity_token', 'feature_scope', 'inverse'], `row ${row.signature_id} current_authority`);
  assert(row.current_authority.direction === signature.direction, `row ${row.signature_id} direction drift`);
  assertExactArray(row.current_authority.source_types, normalizedSourceTypes(signature), `row ${row.signature_id} source types`);
  assertExactArray(row.current_authority.target_types, normalizedTargetTypes(signature), `row ${row.signature_id} target types`);
  assert(row.current_authority.multiplicity_token === signature.multiplicity, `row ${row.signature_id} multiplicity token drift`);
  assertExactArray(row.current_authority.feature_scope, signature.feature_scope, `row ${row.signature_id} feature scope`);
  assertExactKeys(row.current_authority.inverse, ['kind', 'id'], `row ${row.signature_id} inverse`);
  assert(JSON.stringify(row.current_authority.inverse) === JSON.stringify(normalizedInverse(signature)), `row ${row.signature_id} inverse drift`);

  validateNumericEvidence(row);
  assert(typeof row.owner_question === 'string' && row.owner_question.length > 0, `row ${row.signature_id} must expose an owner question`);

  assertExactKeys(row.proposed_decision, PROPOSED_KEYS, `row ${row.signature_id} proposed_decision`);
  assert(['unresolved', 'owner-selected', 'retain-canonical'].includes(row.proposed_decision.status), `row ${row.signature_id} proposed decision status invalid`);
  FACET_KEYS.forEach((facet) => validateDecision(row.proposed_decision[facet], facet, row));
  const unresolvedFacets = FACET_KEYS.filter((facet) => row.proposed_decision[facet].status === 'unresolved');
  if (unresolvedFacets.length > 0) {
    assert(row.proposed_decision.status === 'unresolved', `row ${row.signature_id} must remain unresolved while ${unresolvedFacets.join(', ')} are unresolved`);
  } else {
    assert(row.proposed_decision.status !== 'unresolved', `row ${row.signature_id} must disposition its row status after every facet is resolved`);
  }

  if (row.signature_id === 'creates') {
    const numeric = row.proposed_decision.numeric_bounds;
    assert(numeric.status === 'retain-canonical', 'creates numeric decision must retain canonical authority');
    assert(JSON.stringify(numeric.value) === JSON.stringify({ source_min: 0, source_max: 1, target_min: 0, target_max: 1 }), 'creates proposed numeric decision must preserve 0..1/0..1');
    assert(row.proposed_decision.closure.status === 'retain-canonical' && row.proposed_decision.closure.value === 'same-feature', 'creates proposed closure must retain same-feature authority');
  }

  const endpointCount = row.current_authority.source_types.length + row.current_authority.target_types.length;
  const multi = row.proposed_decision.multi_endpoint_semantics;
  if (endpointCount > 2 && multi.status !== 'unresolved') {
    assert(['pooled', 'per-type'].includes(multi.value), `row ${row.signature_id} must select pooled or per-type semantics for multi-endpoint bounds`);
  }

  const occurrence = row.proposed_decision.occurrence_semantics;
  if (row.signature_id === 'orchestrates') {
    assert(occurrence.status === 'owner-selected', 'orchestrates occurrence semantics must preserve the D04 owner selection');
    assert(occurrence.value === D04_OCCURRENCE_TOKEN, `orchestrates occurrence semantics must be ${D04_OCCURRENCE_TOKEN}`);
    assertExactArray(occurrence.evidence_refs, D04_EVIDENCE_REFS, 'orchestrates D04 evidence refs');
    assert(/Operation-bound declared step/i.test(occurrence.rationale), 'orchestrates D04 rationale must scope declared step count to Operation-bound steps');
    for (const facet of FACET_KEYS.filter((name) => name !== 'occurrence_semantics')) {
      assert(row.proposed_decision[facet].status === 'unresolved', `D04 must not resolve orchestrates.${facet}`);
    }
  } else {
    assert(occurrence.value !== D04_OCCURRENCE_TOKEN, `${D04_OCCURRENCE_TOKEN} is restricted to orchestrates`);
  }

  if (row.signature_id === 'maps') {
    assert(multi.status === 'owner-selected' && multi.value === 'per-type', 'maps must preserve the D03 per-endpoint-type selection');
    assert(occurrence.status === 'owner-selected', 'maps occurrence semantics must preserve the D05 owner selection');
    assert(occurrence.value === D05_OCCURRENCE_TOKEN, `maps occurrence semantics must be ${D05_OCCURRENCE_TOKEN}`);
    assertExactArray(occurrence.evidence_refs, D05_EVIDENCE_REFS, 'maps D05 evidence refs');
    assert(/distinct endpoint concept degree/i.test(occurrence.rationale), 'maps D05 rationale must preserve distinct endpoint concept degree');
    assert(/declared role count/i.test(occurrence.rationale), 'maps D05 rationale must preserve declared role count');
    assert(/no role is inferred from endpoint meta-type/i.test(occurrence.rationale), 'maps D05 rationale must keep endpoint meta-type independent from Mapping role');
    assert(!/(?:Entity|Interface)\s+(?:means|is)\s+(?:an?\s+)?(?:input|output)/i.test(occurrence.rationale), 'maps D05 rationale must not reinterpret endpoint type as Mapping role');
    for (const facet of FACET_KEYS.filter((name) => !['multi_endpoint_semantics', 'occurrence_semantics'].includes(name))) {
      assert(row.proposed_decision[facet].status === 'unresolved', `D05 must not resolve maps.${facet}`);
    }
  } else {
    assert(occurrence.value !== D05_OCCURRENCE_TOKEN, `${D05_OCCURRENCE_TOKEN} is restricted to maps`);
  }

  if (row.signature_id === 'owns') {
    const topology = row.ownership_topology;
    assertExactKeys(topology, ['status', 'policy', 'registry_path', 'registry_sha256', 'rationale', 'evidence_refs'], 'owns ownership_topology');
    assert(topology.status === 'owner-selected', 'owns ownership_topology.status must preserve the P02 owner selection');
    assert(topology.policy === D06_POLICY_TOKEN, `owns ownership_topology.policy must be ${D06_POLICY_TOKEN}`);
    assert(topology.registry_path === D06_REGISTRY_PATH, 'owns ownership_topology registry path drift');
    assert(topology.registry_sha256 === D06_REGISTRY_SHA256, 'owns ownership_topology registry digest drift');
    assert(topology.rationale === D06_RATIONALE, 'owns ownership_topology rationale drift or overreach');
    assertExactArray(topology.evidence_refs, D06_EVIDENCE_REFS, 'owns D06 P02 evidence refs');
    assert(row.proposed_decision.status === 'unresolved', 'D06 P02 must keep the owns row proposed decision unresolved');
    for (const facet of FACET_KEYS) {
      assert(row.proposed_decision[facet].status === 'unresolved', `D06 P02 must not resolve owns.${facet}`);
    }
    assert(row.current_authority.inverse.kind === 'generated_view' && row.current_authority.inverse.id === 'owned-by', 'D06 P02 must preserve generated owned-by navigation');
  } else {
    assert(!Object.hasOwn(row, 'ownership_topology'), `ownership_topology is restricted to owns, not ${row.signature_id}`);
    assert(!row.decision_evidence_refs.some((ref) => D06_EVIDENCE_REFS.includes(ref)), `D06 P02 evidence is restricted to owns, not ${row.signature_id}`);
  }

  if (row.signature_id === 'belongs-to') {
    const topology = row.membership_topology;
    assertExactKeys(topology, ['status', 'policy', 'registry_path', 'registry_sha256', 'rationale', 'evidence_refs'], 'belongs-to membership_topology');
    assert(topology.status === 'owner-selected', 'belongs-to membership_topology.status must preserve the P02 owner selection');
    assert(topology.policy === D07_POLICY_TOKEN, `belongs-to membership_topology.policy must be ${D07_POLICY_TOKEN}`);
    assert(topology.registry_path === D07_REGISTRY_PATH, 'belongs-to membership_topology registry path drift');
    assert(topology.registry_sha256 === D07_REGISTRY_SHA256, 'belongs-to membership_topology registry digest drift');
    assert(topology.rationale === D07_RATIONALE, 'belongs-to membership_topology rationale drift or overreach');
    assertExactArray(topology.evidence_refs, D07_EVIDENCE_REFS, 'belongs-to D07 P02 evidence refs');
    assert(row.proposed_decision.status === 'unresolved', 'D07 P02 must keep the belongs-to row proposed decision unresolved');
    for (const facet of FACET_KEYS) {
      assert(row.proposed_decision[facet].status === 'unresolved', `D07 P02 must not resolve belongs-to.${facet}`);
    }
    assert(row.current_authority.inverse.kind === 'none' && row.current_authority.inverse.id === null, 'D07 P02 must not invent a belongs-to inverse');
  } else {
    assert(!Object.hasOwn(row, 'membership_topology'), `membership_topology is restricted to belongs-to, not ${row.signature_id}`);
    assert(!row.decision_evidence_refs.some((ref) => D07_EVIDENCE_REFS.includes(ref)), `D07 P02 evidence is restricted to belongs-to, not ${row.signature_id}`);
  }

  assertExactKeys(row.decision_tests, ['positive', 'hostile'], `row ${row.signature_id} decision_tests`);
  assertStringList(row.decision_tests.positive, `row ${row.signature_id} positive tests`);
  assertStringList(row.decision_tests.hostile, `row ${row.signature_id} hostile tests`);
  assertStringList(row.decision_evidence_refs, `row ${row.signature_id} decision evidence refs`);
}

function validateBinding(binding, expected, label) {
  assertExactKeys(binding, ['path', 'sha256', 'size_bytes', 'observed_result'], label);
  assert(binding.path === expected.path, `${label}.path drift`);
  assert(binding.sha256 === expected.sha256, `${label}.sha256 drift`);
  assert(binding.size_bytes === expected.size, `${label}.size_bytes drift`);
  assert(binding.observed_result === 'flag', `${label}.observed_result must preserve flag`);
}

function assertNullableString(value, label) {
  assert(value === null || typeof value === 'string', `${label} must be a string or null`);
}

function resolveRepositoryFileWithoutSymlinks(relativePath, label, fileSystem = fs) {
  assert(typeof relativePath === 'string' && relativePath.length > 0, `${label} must be a non-empty string`);
  assert(!path.isAbsolute(relativePath), `${label} must be repository-relative`);

  const lexicalPath = path.resolve(ROOT, relativePath);
  const relativeFromRoot = path.relative(ROOT, lexicalPath);
  assert(relativeFromRoot.length > 0 && relativeFromRoot !== '..' && !relativeFromRoot.startsWith(`..${path.sep}`) && !path.isAbsolute(relativeFromRoot), `${label} must remain inside the repository`);

  const realRoot = fileSystem.realpathSync(ROOT);
  const expectedRealPath = path.join(realRoot, relativeFromRoot);
  const realPath = fileSystem.realpathSync(lexicalPath);
  assert(realPath === expectedRealPath, `${label} must not traverse a symbolic link`);

  const stat = fileSystem.lstatSync(lexicalPath);
  assert(stat.isFile() && !stat.isSymbolicLink(), `${label} must resolve directly to a regular file`);
  return realPath;
}

function validateOwnerDisposition(packet, packetBytes) {
  const disposition = packet.owner_disposition;
  assertExactKeys(disposition, ['status', 'acceptance_receipt_path', 'decided_by', 'decided_at', 'notes'], 'owner_disposition');
  assert(['pending', 'accepted', 'rejected', 'returned'].includes(disposition.status), 'owner_disposition.status invalid');
  assertNullableString(disposition.acceptance_receipt_path, 'owner_disposition.acceptance_receipt_path');
  assertNullableString(disposition.decided_by, 'owner_disposition.decided_by');
  assertNullableString(disposition.decided_at, 'owner_disposition.decided_at');
  assertNullableString(disposition.notes, 'owner_disposition.notes');

  if (disposition.status === 'pending') {
    assert(packet.status === 'candidate-pending-owner-decision', 'pending owner disposition requires candidate-pending-owner-decision status');
    assert(disposition.acceptance_receipt_path === null && disposition.decided_by === null && disposition.decided_at === null, 'pending owner disposition must not claim an acceptance binding or decision actor/time');
    return;
  }

  if (disposition.status === 'rejected' || disposition.status === 'returned') {
    assert(packet.status === `owner-${disposition.status}`, `${disposition.status} owner disposition requires matching packet status`);
    assert(disposition.acceptance_receipt_path === null, `${disposition.status} disposition must not carry an acceptance receipt`);
    assert(typeof disposition.decided_by === 'string' && disposition.decided_by.length > 0, `${disposition.status} disposition requires decided_by`);
    assert(typeof disposition.decided_at === 'string' && disposition.decided_at.length > 0, `${disposition.status} disposition requires decided_at`);
    return;
  }

  assert(packet.status === 'owner-accepted', 'accepted owner disposition requires owner-accepted packet status');
  for (const row of packet.rows) {
    assert(row.proposed_decision.status !== 'unresolved', `owner acceptance forbidden while row ${row.signature_id} is unresolved`);
    FACET_KEYS.forEach((facet) => assert(row.proposed_decision[facet].status !== 'unresolved', `owner acceptance forbidden while ${row.signature_id}.${facet} is unresolved`));
  }
  assert(typeof disposition.acceptance_receipt_path === 'string' && disposition.acceptance_receipt_path.length > 0, 'owner acceptance requires an external exact-byte acceptance receipt path');
  assert(typeof disposition.decided_by === 'string' && disposition.decided_by.length > 0, 'owner acceptance requires decided_by');
  assert(typeof disposition.decided_at === 'string' && disposition.decided_at.length > 0, 'owner acceptance requires decided_at');

  const receiptAbsolute = resolveRepositoryFileWithoutSymlinks(disposition.acceptance_receipt_path, 'owner acceptance receipt path');
  const acceptanceBytes = fs.readFileSync(receiptAbsolute);
  const acceptance = JSON.parse(acceptanceBytes.toString('utf8'));
  assertExactKeys(acceptance, ['schema_version', 'packet_id', 'decision', 'packet_sha256', 'accepted_by', 'accepted_at'], 'owner acceptance receipt');
  assert(acceptance.schema_version === 'domainspec.bmc-rel-001-acceptance/v1', 'owner acceptance receipt schema version invalid');
  assert(acceptance.packet_id === 'BMC-REL-001' && acceptance.decision === 'accepted', 'owner acceptance receipt identity/decision invalid');
  assert(acceptance.packet_sha256 === sha256(packetBytes), 'owner acceptance receipt must bind the exact packet bytes');
  assert(acceptance.accepted_by === disposition.decided_by && acceptance.accepted_at === disposition.decided_at, 'owner acceptance actor/time must match the receipt');
}

function validatePacket(packet, context, packetBytes) {
  assertExactKeys(packet, ROOT_KEYS, 'packet');
  assert(packet.schema_version === 'domainspec.bmc-rel-001-decision-packet/v1', 'unexpected packet schema_version');
  assert(packet.packet_id === 'BMC-REL-001', 'unexpected packet_id');
  assert(['candidate-pending-owner-decision', 'owner-returned', 'owner-rejected', 'owner-accepted'].includes(packet.status), 'invalid packet status');
  assert(packet.authority_effect === 'none', 'candidate packet may not grow authority');
  assert(packet.claim_ceiling === CLAIM_CEILING, 'candidate packet claim ceiling drift or authority growth');

  assertExactKeys(packet.canonical_source, ['path', 'sha256', 'size_bytes', 'signature_count'], 'canonical_source');
  assert(packet.canonical_source.path === SOURCE_PATH, 'canonical source path drift');
  assert(packet.canonical_source.sha256 === SOURCE_SHA256, 'canonical source SHA-256 drift');
  assert(packet.canonical_source.size_bytes === SOURCE_SIZE, 'canonical source size drift');
  assert(packet.canonical_source.signature_count === 31, 'canonical source signature_count must be 31');

  assertExactKeys(packet.evidence_baseline, ['bmc_matrix', 'bmc_receipt'], 'evidence_baseline');
  validateBinding(packet.evidence_baseline.bmc_matrix, { path: MATRIX_PATH, sha256: MATRIX_SHA256, size: MATRIX_SIZE }, 'evidence_baseline.bmc_matrix');
  validateBinding(packet.evidence_baseline.bmc_receipt, { path: RECEIPT_PATH, sha256: RECEIPT_SHA256, size: RECEIPT_SIZE }, 'evidence_baseline.bmc_receipt');

  assertExactKeys(packet.scope, ['backend_implementation_ids', 'ui_audit_only_ids', 'ui_backend_audit_only_ids'], 'scope');
  assertExactArray(packet.scope.backend_implementation_ids, BACKEND_IDS, 'scope.backend_implementation_ids');
  assertExactArray(packet.scope.ui_audit_only_ids, UI_IDS, 'scope.ui_audit_only_ids');
  assertExactArray(packet.scope.ui_backend_audit_only_ids, UI_BACKEND_IDS, 'scope.ui_backend_audit_only_ids');

  assert(Array.isArray(packet.rows) && packet.rows.length === 31, 'packet must contain exactly 31 rows');
  assert(new Set(packet.rows.map((row) => row.signature_id)).size === 31, 'packet row IDs must be unique');
  assertExactArray(packet.rows.map((row) => row.signature_id), EXPECTED_IDS, 'packet row IDs/order');
  packet.rows.forEach((row, index) => validateRow(row, context.authority.signatures[index], index));
  assert(packet.rows.filter((row) => row.numeric_bounds_evidence.status === 'complete').length === 1, 'exactly one numeric-bounds evidence row must be complete');
  assert(packet.rows.filter((row) => row.numeric_bounds_evidence.status === 'unresolved').length === 30, 'exactly 30 numeric-bounds evidence rows must remain unresolved');

  validateOwnerDisposition(packet, packetBytes);

  return {
    packet_id: packet.packet_id,
    result: 'pass',
    signature_rows: packet.rows.length,
    lanes: {
      backend_implementation: packet.rows.filter((row) => row.lane === 'backend-implementation').length,
      ui_audit_only: packet.rows.filter((row) => row.lane === 'ui-audit-only').length,
      ui_backend_audit_only: packet.rows.filter((row) => row.lane === 'ui-backend-audit-only').length
    },
    numeric_bounds_complete: 1,
    numeric_bounds_unresolved: 30,
    row_decisions_unresolved: packet.rows.filter((row) => row.proposed_decision.status === 'unresolved').length,
    facet_decisions_unresolved: packet.rows.reduce((count, row) => count + FACET_KEYS.filter((facet) => row.proposed_decision[facet].status === 'unresolved').length, 0),
    owner_disposition: packet.owner_disposition.status,
    source_sha256: SOURCE_SHA256,
    bmc_matrix_sha256: MATRIX_SHA256,
    bmc_receipt_sha256: RECEIPT_SHA256,
    authority_effect: 'none'
  };
}

function loadPacket(packetPath) {
  const absolutePath = path.isAbsolute(packetPath) ? packetPath : path.resolve(ROOT, packetPath);
  const bytes = fs.readFileSync(absolutePath);
  let packet;
  try {
    packet = JSON.parse(bytes.toString('utf8'));
  } catch (error) {
    fail(`decision packet is not valid JSON: ${error.message}`);
  }
  return { absolutePath, bytes, packet };
}

function runSelfTest(packet, context, packetBytes) {
  const probes = [];
  function expectFailure(name, mutate) {
    const candidate = structuredClone(packet);
    mutate(candidate);
    try {
      validatePacket(candidate, context, Buffer.from(JSON.stringify(candidate, null, 2) + '\n'));
      fail(`negative probe ${name} unexpectedly passed`);
    } catch (error) {
      if (error.message === `negative probe ${name} unexpectedly passed`) throw error;
      probes.push({ name, result: 'rejected' });
    }
  }

  function expectDirectFailure(name, action) {
    try {
      action();
      fail(`negative probe ${name} unexpectedly passed`);
    } catch (error) {
      if (error.message === `negative probe ${name} unexpectedly passed`) throw error;
      probes.push({ name, result: 'rejected' });
    }
  }

  validatePacket(packet, context, packetBytes);
  expectFailure('missing-row', (candidate) => candidate.rows.pop());
  expectFailure('extra-row', (candidate) => candidate.rows.push(structuredClone(candidate.rows[0])));
  expectFailure('reordered-rows', (candidate) => [candidate.rows[0], candidate.rows[1]] = [candidate.rows[1], candidate.rows[0]]);
  expectFailure('duplicate-row-id', (candidate) => candidate.rows[1] = structuredClone(candidate.rows[0]));
  expectFailure('unexpected-property', (candidate) => candidate.authority_claim = 'expanded');
  expectFailure('canonical-projection-drift', (candidate) => candidate.rows[0].current_authority.target_types = ['Entity']);
  expectFailure('d04-concept-only-collapse', (candidate) => candidate.rows.find((row) => row.signature_id === 'orchestrates').proposed_decision.occurrence_semantics.value = 'concept-level');
  expectFailure('d04-runtime-occurrence-collapse', (candidate) => candidate.rows.find((row) => row.signature_id === 'orchestrates').proposed_decision.occurrence_semantics.value = 'runtime-occurrence');
  expectFailure('d04-token-on-non-orchestrates', (candidate) => {
    const occurrence = candidate.rows.find((row) => row.signature_id === 'performs').proposed_decision.occurrence_semantics;
    occurrence.status = 'owner-selected';
    occurrence.value = D04_OCCURRENCE_TOKEN;
    occurrence.rationale = 'Improperly copied Workflow-only declared step semantics.';
    occurrence.evidence_refs = [...D04_EVIDENCE_REFS];
  });
  expectFailure('d04-ordering-overreach', (candidate) => {
    const ordering = candidate.rows.find((row) => row.signature_id === 'orchestrates').proposed_decision.ordering;
    ordering.status = 'owner-selected';
    ordering.value = 'ordered';
    ordering.rationale = 'Improperly resolved ordering through the D04 count decision.';
    ordering.evidence_refs = [...D04_EVIDENCE_REFS];
  });
  expectFailure('d05-concept-only-collapse', (candidate) => candidate.rows.find((row) => row.signature_id === 'maps').proposed_decision.occurrence_semantics.value = 'concept-level');
  expectFailure('d05-role-count-only-collapse', (candidate) => candidate.rows.find((row) => row.signature_id === 'maps').proposed_decision.occurrence_semantics.value = 'declared-role-count');
  expectFailure('d05-runtime-occurrence-collapse', (candidate) => candidate.rows.find((row) => row.signature_id === 'maps').proposed_decision.occurrence_semantics.value = 'runtime-occurrence');
  expectFailure('d05-token-on-non-maps', (candidate) => {
    const occurrence = candidate.rows.find((row) => row.signature_id === 'performs').proposed_decision.occurrence_semantics;
    occurrence.status = 'owner-selected';
    occurrence.value = D05_OCCURRENCE_TOKEN;
    occurrence.rationale = 'Improperly copied Mapping-only count semantics.';
    occurrence.evidence_refs = [...D05_EVIDENCE_REFS];
  });
  expectFailure('d05-evidence-drift', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'maps').proposed_decision.occurrence_semantics.evidence_refs[1] = `${D05_EVIDENCE_REFS[1]}-drift`;
  });
  expectFailure('d05-endpoint-type-as-role', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'maps').proposed_decision.occurrence_semantics.rationale = 'Preserve distinct endpoint concept degree and declared role count, but Entity is input and Interface is output.';
  });
  expectFailure('d05-numeric-overreach', (candidate) => {
    const numeric = candidate.rows.find((row) => row.signature_id === 'maps').proposed_decision.numeric_bounds;
    numeric.status = 'owner-selected';
    numeric.value = { source_min: 0, source_max: 'unbounded', target_min: 0, target_max: 'unbounded' };
    numeric.rationale = 'Improperly resolved numeric bounds through D05.';
    numeric.evidence_refs = [...D05_EVIDENCE_REFS];
  });
  expectFailure('d05-representation-overreach', (candidate) => {
    const representation = candidate.rows.find((row) => row.signature_id === 'maps').proposed_decision.representation;
    representation.status = 'owner-selected';
    representation.value = 'authored-edge';
    representation.rationale = 'Improperly resolved representation through D05.';
    representation.evidence_refs = [...D05_EVIDENCE_REFS];
  });
  expectFailure('d05-role-schema-overreach', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'maps').proposed_decision.role_coverage = 'all-endpoints';
  });
  expectFailure('d06-missing-owns-object', (candidate) => {
    delete candidate.rows.find((row) => row.signature_id === 'owns').ownership_topology;
  });
  expectFailure('d06-object-on-non-owns', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'performs').ownership_topology = structuredClone(candidate.rows.find((row) => row.signature_id === 'owns').ownership_topology);
  });
  expectFailure('d06-policy-drift', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'owns').ownership_topology.policy = 'shared-owner-per-dimension';
  });
  expectFailure('d06-registry-path-drift', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'owns').ownership_topology.registry_path = 'projects/domainspec-v2/definitions/ownership-dimensions/free-text.json';
  });
  expectFailure('d06-registry-digest-drift', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'owns').ownership_topology.registry_sha256 = '0'.repeat(64);
  });
  expectFailure('d06-extra-free-text-dimension', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'owns').ownership_topology.dimension_id = 'whatever-the-author-wants';
  });
  expectFailure('d06-mandatory-ownership-inference', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'owns').ownership_topology.rationale = `${D06_RATIONALE} Every Entity must have an owner.`;
  });
  expectFailure('d06-numeric-overreach', (candidate) => {
    const numeric = candidate.rows.find((row) => row.signature_id === 'owns').proposed_decision.numeric_bounds;
    numeric.status = 'owner-selected';
    numeric.value = { source_min: 0, source_max: 'unbounded', target_min: 1, target_max: 1 };
    numeric.rationale = 'Improperly inferred mandatory owner bounds through D06.';
    numeric.evidence_refs = [...D06_EVIDENCE_REFS];
  });
  expectFailure('d06-other-topology-overreach', (candidate) => {
    const selfRelations = candidate.rows.find((row) => row.signature_id === 'owns').proposed_decision.self_relations;
    selfRelations.status = 'owner-selected';
    selfRelations.value = 'reject';
    selfRelations.rationale = 'Improperly resolved self-edge policy through D06.';
    selfRelations.evidence_refs = [...D06_EVIDENCE_REFS];
  });
  expectFailure('d06-authored-owned-by', (candidate) => {
    const inverse = candidate.rows.find((row) => row.signature_id === 'owns').proposed_decision.inverse_semantics;
    inverse.status = 'owner-selected';
    inverse.value = 'authored-canonical';
    inverse.rationale = 'Improperly authored owned-by through D06.';
    inverse.evidence_refs = [...D06_EVIDENCE_REFS];
  });
  expectFailure('d06-evidence-on-unrelated-relationship', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'performs').decision_evidence_refs.push(D06_EVIDENCE_REFS[2]);
  });
  expectFailure('d07-missing-belongs-to-object', (candidate) => {
    delete candidate.rows.find((row) => row.signature_id === 'belongs-to').membership_topology;
  });
  expectFailure('d07-object-on-wrong-row', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'performs').membership_topology = structuredClone(candidate.rows.find((row) => row.signature_id === 'belongs-to').membership_topology);
  });
  expectFailure('d07-policy-drift', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'belongs-to').membership_topology.policy = 'one-parent-overall';
  });
  expectFailure('d07-registry-path-drift', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'belongs-to').membership_topology.registry_path = 'projects/domainspec-v2/definitions/membership-kinds/free-text.json';
  });
  expectFailure('d07-registry-digest-drift', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'belongs-to').membership_topology.registry_sha256 = '0'.repeat(64);
  });
  expectFailure('d07-extra-kind-instance-key', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'belongs-to').membership_topology.kind_id = 'classification';
  });
  expectFailure('d07-evidence-drift', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'belongs-to').membership_topology.evidence_refs[1] = `${D07_EVIDENCE_REFS[1]}-drift`;
  });
  expectFailure('d07-rationale-overreach', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'belongs-to').membership_topology.rationale = `${D07_RATIONALE} Every Entity must belong somewhere.`;
  });
  expectFailure('d07-numeric-overreach', (candidate) => {
    const numeric = candidate.rows.find((row) => row.signature_id === 'belongs-to').proposed_decision.numeric_bounds;
    numeric.status = 'owner-selected';
    numeric.value = { source_min: 1, source_max: 1, target_min: 1, target_max: 1 };
    numeric.rationale = 'Improperly inferred mandatory membership bounds through D07.';
    numeric.evidence_refs = [...D07_EVIDENCE_REFS];
  });
  expectFailure('d07-other-topology-overreach', (candidate) => {
    const duplicates = candidate.rows.find((row) => row.signature_id === 'belongs-to').proposed_decision.duplicates;
    duplicates.status = 'owner-selected';
    duplicates.value = 'reject';
    duplicates.rationale = 'Improperly resolved duplicate policy through D07.';
    duplicates.evidence_refs = [...D07_EVIDENCE_REFS];
  });
  expectFailure('d07-representation-overreach', (candidate) => {
    const representation = candidate.rows.find((row) => row.signature_id === 'belongs-to').proposed_decision.representation;
    representation.status = 'owner-selected';
    representation.value = 'authored-edge';
    representation.rationale = 'Improperly resolved per-fact representation through D07.';
    representation.evidence_refs = [...D07_EVIDENCE_REFS];
  });
  expectFailure('d07-closed-key-overreach', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'belongs-to').membership_topology.storage = 'edge-field';
  });
  expectFailure('d07-evidence-on-unrelated-relationship', (candidate) => {
    candidate.rows.find((row) => row.signature_id === 'performs').decision_evidence_refs.push(D07_EVIDENCE_REFS[2]);
  });
  expectFailure('token-derived-bounds', (candidate) => {
    const decision = candidate.rows[0].proposed_decision.numeric_bounds;
    decision.status = 'owner-selected';
    decision.value = { source_min: 0, source_max: 1, target_min: 0, target_max: 'unbounded' };
    decision.rationale = 'Derived from the multiplicity token.';
    decision.evidence_refs = [`${SOURCE_PATH}#/signatures/0`];
  });
  expectFailure('creates-bounds-drift', (candidate) => candidate.rows[3].numeric_bounds_evidence.source_max = 'unbounded');
  expectFailure('authority-growth', (candidate) => candidate.authority_effect = 'canonical-update');
  expectFailure('owner-status-type', (candidate) => candidate.owner_disposition.status = { unexpected: 'object' });
  expectFailure('owner-acceptance-path-type', (candidate) => candidate.owner_disposition.acceptance_receipt_path = { unexpected: 'object' });
  expectFailure('owner-decided-by-type', (candidate) => candidate.owner_disposition.decided_by = ['owner']);
  expectFailure('owner-decided-at-type', (candidate) => candidate.owner_disposition.decided_at = 20260822);
  expectFailure('owner-notes-object', (candidate) => candidate.owner_disposition.notes = { unexpected: 'object' });
  expectFailure('premature-owner-acceptance', (candidate) => {
    candidate.status = 'owner-accepted';
    candidate.owner_disposition.status = 'accepted';
    candidate.owner_disposition.acceptance_receipt_path = 'missing-acceptance.json';
    candidate.owner_disposition.decided_by = 'owner';
    candidate.owner_disposition.decided_at = '2026-08-22T00:00:00Z';
  });
  expectFailure('stale-source-binding', (candidate) => candidate.canonical_source.sha256 = '0'.repeat(64));
  expectFailure('stale-bmc-result', (candidate) => candidate.evidence_baseline.bmc_receipt.observed_result = 'pass');
  expectDirectFailure('acceptance-receipt-repository-escape', () => {
    resolveRepositoryFileWithoutSymlinks('../../../../../../etc/passwd', 'test acceptance receipt path');
  });
  expectDirectFailure('acceptance-receipt-symlink-traversal', () => {
    const testPath = 'projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/fake-acceptance.json';
    const lexicalPath = path.resolve(ROOT, testPath);
    const fakeFileSystem = {
      realpathSync(candidatePath) {
        if (candidatePath === ROOT) return ROOT;
        if (candidatePath === lexicalPath) return '/outside-repository/fake-acceptance.json';
        return candidatePath;
      },
      lstatSync() {
        return { isFile: () => true, isSymbolicLink: () => true };
      }
    };
    resolveRepositoryFileWithoutSymlinks(testPath, 'test acceptance receipt path', fakeFileSystem);
  });
  return probes;
}

function parseArgs(argv) {
  let packetPath = PACKET_PATH;
  let packetPathSeen = false;
  let selfTest = false;
  for (const arg of argv) {
    if (arg === '--self-test') {
      selfTest = true;
    } else if (arg.startsWith('-')) {
      fail(`unknown option: ${arg}`);
    } else if (packetPathSeen) {
      fail('at most one explicit packet path is allowed');
    } else {
      packetPath = arg;
      packetPathSeen = true;
    }
  }
  return { packetPath, selfTest };
}

try {
  const { packetPath, selfTest } = parseArgs(process.argv.slice(2));
  const context = loadContext();
  const loaded = loadPacket(packetPath);
  const result = validatePacket(loaded.packet, context, loaded.bytes);
  result.packet_path = path.relative(ROOT, loaded.absolutePath);
  result.packet_sha256 = sha256(loaded.bytes);
  if (selfTest) result.negative_probes = runSelfTest(loaded.packet, context, loaded.bytes);
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`BMC-REL-001 validation failed: ${error.message}\n`);
  process.exitCode = 1;
}
