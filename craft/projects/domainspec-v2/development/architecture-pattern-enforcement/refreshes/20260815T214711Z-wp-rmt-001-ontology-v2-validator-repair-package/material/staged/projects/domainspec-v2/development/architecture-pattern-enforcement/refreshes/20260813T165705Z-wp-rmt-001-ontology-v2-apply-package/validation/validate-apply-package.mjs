import { createHash } from "node:crypto";
import { execFileSync, spawnSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  readdirSync,
  rmSync,
  statSync
} from "node:fs";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const validationDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(process.argv[2] ?? process.cwd());
const applyRoot = resolve(validationDir, "..");
const acceptedProposalRoot = resolve(repoRoot, "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T143151Z-wp-rmt-001-ontology-v2-proposal");
const proposalRoot = acceptedProposalRoot;
const repoRealRoot = realpathSync(repoRoot);
const v2Only = process.argv.includes("--v2-only");
const targetMode = process.argv.includes("live") ? "live" : "staged";
const targetExperimentRoot = targetMode === "live"
  ? resolve(repoRoot, "projects/domainspec-v2/development/implementation-conformance/ontology-experiment")
  : resolve(applyRoot, "material/staged/projects/domainspec-v2/development/implementation-conformance/ontology-experiment");
const preimageExperimentRoot = resolve(applyRoot, "material/preimages/projects/domainspec-v2/development/implementation-conformance/ontology-experiment");
const ontologySchemaPath = resolve(targetExperimentRoot, "schema/architecture-property-ontology-v2.schema.json");
const promotionSchemaPath = resolve(targetExperimentRoot, "schema/promotion-record-v1.schema.json");
const historicalOntologySchemaPath = resolve(acceptedProposalRoot, "schema/architecture-property-ontology-v2.schema.json");
const historicalPromotionSchemaPath = resolve(acceptedProposalRoot, "schema/promotion-record-v1.schema.json");
const targetOntologyPath = resolve(targetExperimentRoot, "ontology.json");
const targetProjectionPath = resolve(targetExperimentRoot, "domain-meta-types.projection.json");
const targetValidatorPath = resolve(targetExperimentRoot, "validate-ontology.mjs");
const fixturesPath = resolve(applyRoot, "validation/hostile-fixtures.json");
const decisionRequestPath = resolve(applyRoot, "decisions/option-admissibility-request.json");
const decisionReceiptPath = resolve(applyRoot, "decisions/option-admissibility-receipt.json");
const relationOwnershipDecisionPath = resolve(applyRoot, "decisions/relation-ownership-decision.json");
const decisionGateRoot = resolve(repoRoot, ".agents/skills/decision-gate");
const decisionPrefilterPath = resolve(decisionGateRoot, "scripts/prefilter-options.py");
const decisionRequestSchemaPath = resolve(decisionGateRoot, "schemas/option-admissibility-request.schema.json");
const decisionReceiptSchemaPath = resolve(decisionGateRoot, "schemas/option-admissibility-receipt.schema.json");

const acceptedProposalReceiptSha256 = "e553ce0cd91a8a8d2b5c92323ff41c64752d64875419b6afd51dbd4e3d29bb82";
const frozenBlockedPackageSha256 = "67c77847ce5ef9823dbb1ba5c3f5cdf7e1f627b82a4c27a605ea894cff135b3e";
const relationDecisionId = "WP-RMT-001-ONTOLOGY-V2-RELATION-OWNERSHIP";
const relationOwnerRoute = "DomainSpec architecture-property ontology owner";
const expectedDecisionEvidencePaths = [
  "decisions/option-admissibility-request.json",
  "decisions/option-admissibility-receipt.json",
  "decisions/relation-ownership-decision.json"
];
const expectedBoundedSchemaAmendments = [
  "REL-A-cross-candidate-relation-evidence-bindings",
  "exact-endpoint-and-relation-assertion-provenance",
  "cycle-permitted-relation-policy",
  "concept-subtype-closure-and-supporting-type-resolution",
  "canonical-lifecycle-axis-and-evidence-closure",
  "count-aware-variable-population-claims",
  "subject-specific-promotion-record-scope",
  "strengthened-relation-definition-contract",
  "exact-projection-root-contract",
  "strengthened-standalone-definition-contract",
  "immutable-immediate-predecessor-claim-recomputation",
  "blueprint-governed-deferred-relation-contract",
  "exact-candidate-and-assertion-authority-closure",
  "cross-schema-json-object-reference-parity"
];
const expectedOwnerGate = {
  historical_proposal_acceptance: "accepted",
  amended_package_acceptance: "absent",
  schema_installation_authorization: "absent",
  apply_authorization: "absent",
  candidate_migration_authorization: "absent",
  implementation_or_relation_admission_authorization: "absent",
  promotion_record_creation_authorization: "absent",
  candidate_promotion_authorization: "absent"
};

const expectedCandidates = new Map([
  [
    "candidate.logistics.shipment-priority.enum-implementation/v1",
    {
      implementationId: "candidate.logistics.shipment-priority",
      historicalImplementationId: "implementation.logistics.shipment-priority.enum/v1",
      metaType: "DS-D1.3",
      architectureType: "architecture.EnumImplementation",
      assertionRef: {
        path: "projects/domainspec-v2/development/remaining-meta-types/candidates/enum.json",
        sha256: "8641a721ac3d02bbfd0e2c667b0f951ddb5532f387b01dadeb768c898fce7e29",
        size_bytes: 7616,
        json_pointer: "/architecture_implementation",
        assertion_spec: "candidate-architecture-implementation/v1",
        identity_field: "concept_id",
        architecture_type_field: "type_id"
      },
      languages: ["typescript", "python", "rust"]
    }
  ],
  [
    "candidate.settlement.net-amount.calculation-implementation/v1",
    {
      implementationId: "value-computation.net-settlement/v1",
      historicalImplementationId: "implementation.settlement.net-amount.calculation/v1",
      metaType: "DS-D1.6",
      architectureType: "architecture.CalculationImplementation",
      assertionRef: {
        path: "projects/domainspec-v2/development/remaining-meta-types/candidates/calculation.json",
        sha256: "e70693f38d4d9d7d5ff2a8a23a5352f0ccee8a6fdaaf97a0a11aad44d424a129",
        size_bytes: 11234,
        json_pointer: "/architecture_implementation",
        assertion_spec: "candidate-architecture-implementation/v1",
        identity_field: "definition_id",
        architecture_type_field: "type_id"
      },
      languages: ["typescript", "python", "rust"]
    }
  ],
  [
    "candidate.settlement.routing.policy-implementation/v1",
    {
      implementationId: "strategy-selector.settlement-routing/v1",
      historicalImplementationId: "implementation.settlement.routing.policy/v1",
      metaType: "DS-D1.8",
      architectureType: "architecture.PolicyImplementation",
      assertionRef: {
        path: "projects/domainspec-v2/development/remaining-meta-types/candidates/policy.json",
        sha256: "acbb354d61e7c3c5394db331ee20bd40304a135a1bde37d2c4a0565663dd3410",
        size_bytes: 13502,
        json_pointer: "/architecture_implementation",
        assertion_spec: "candidate-architecture-implementation/v1",
        identity_field: "definition_id",
        architecture_type_field: "type_id"
      },
      languages: ["typescript", "python", "rust"]
    }
  ],
  [
    "candidate.settlement.complete-settlement.query-implementation/v1",
    {
      implementationId: "read-model-query.complete-settlement/v1",
      historicalImplementationId: "implementation.settlement.complete-settlement.query/v1",
      metaType: "DS-D1.5",
      architectureType: "architecture.QueryImplementation",
      assertionRef: {
        path: "projects/domainspec-v2/development/remaining-meta-types/candidates/query.json",
        sha256: "eec263c266549df778472f529512c5b38842cedc2d375e3e4552228d745eeaa5",
        size_bytes: 12780,
        json_pointer: "/architecture_implementation",
        assertion_spec: "candidate-architecture-implementation/v1",
        identity_field: "definition_id",
        architecture_type_field: "type_id"
      },
      languages: ["typescript", "python", "rust"]
    }
  ],
  [
    "candidate.settlement.settlement-value.value-object-implementation/v1",
    {
      implementationId: "settlement.SettlementValue",
      historicalImplementationId: "implementation.settlement.settlement-value.value-object/v1",
      metaType: "DS-D1.2",
      architectureType: "architecture.ValueObjectImplementation",
      assertionRef: {
        path: "projects/domainspec-v2/development/remaining-meta-types/candidates/value-object.json",
        sha256: "c171dab764a6a31e961d38c13986b7b56142e532d46758217e0ebd8a782c073f",
        size_bytes: 16716,
        json_pointer: "/architecture_implementation",
        assertion_spec: "candidate-architecture-implementation/v1",
        identity_field: "concept_id",
        architecture_type_field: "type_id"
      },
      languages: ["typescript", "python", "rust"]
    }
  ],
  [
    "candidate.settlement.settlement.entity-implementation/v1",
    {
      implementationId: "settlement.Settlement",
      historicalImplementationId: "implementation.settlement.settlement.entity/v1",
      metaType: "DS-D1.1",
      architectureType: "architecture.EntityImplementation",
      assertionRef: {
        path: "projects/domainspec-v2/development/remaining-meta-types/candidates/entity.json",
        sha256: "4ddedf5a60df2917a51f91f0559bbfc028fc1c1d1b717b75c40b0dffcde69da1",
        size_bytes: 20258,
        json_pointer: "/architecture_implementation",
        assertion_spec: "candidate-architecture-implementation/v1",
        identity_field: "concept_id",
        architecture_type_field: "type_id"
      },
      languages: ["typescript", "python", "rust"]
    }
  ]
]);

const expectedPackageFiles = [
  "REFRESH-PATCH-PROPOSAL.md",
  "REFRESH-REPORT.md",
  "migration/MIGRATION-PLAN.md",
  "migration/migration-map.json",
  "preview/ontology-v2.preview.json",
  "preview/ontology-v2.synthetic-live.json",
  "refresh-report.json",
  "schema/architecture-property-ontology-v2.schema.json",
  "schema/promotion-record-v1.schema.json",
  "validation/hostile-fixtures.json",
  "validation/validate-proposal.mjs"
].sort(byteCompare);

const expectedApplyFiles = [
  "ACCEPTANCE-EVIDENCE.json",
  "APPLY-PACKAGE.md",
  "REFRESH-REPORT.md",
  "VALIDATION-RESULT.json",
  "apply-manifest.json",
  "decisions/option-admissibility-receipt.json",
  "decisions/option-admissibility-request.json",
  "decisions/relation-ownership-decision.json",
  "material/MATERIAL-PACKAGE.json",
  "material/MATERIAL-RECEIPT.json",
  "material/preimages/projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json",
  "material/preimages/projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json",
  "material/preimages/projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs",
  "material/staged/projects/domainspec-v2/development/implementation-conformance/ontology-experiment/domain-meta-types.projection.json",
  "material/staged/projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json",
  "material/staged/projects/domainspec-v2/development/implementation-conformance/ontology-experiment/schema/architecture-property-ontology-v2.schema.json",
  "material/staged/projects/domainspec-v2/development/implementation-conformance/ontology-experiment/schema/promotion-record-v1.schema.json",
  "material/staged/projects/domainspec-v2/development/implementation-conformance/ontology-experiment/validate-ontology.mjs",
  "refresh-report.json",
  "validation/hostile-fixtures.json",
  "validation/validate-apply-package.mjs"
].sort(byteCompare);

const expectedRelationBlueprints = [
  {
    blueprint_id: "relation-blueprint.policy.selects-strategy/v1",
    candidate_id: "candidate.settlement.routing.policy-implementation/v1",
    relation_type_ref: "architecture.selects_strategy",
    status: "deferred",
    reason: "The candidate proves membership and counts but does not expose canonical PolicyStrategyContract instance IDs for all five rows.",
    authority_effect: "none"
  },
  {
    blueprint_id: "relation-blueprint.value-object.factory-and-validation/v1",
    candidate_id: "candidate.settlement.settlement-value.value-object-implementation/v1",
    relation_type_refs: [
      "architecture.constructed_by",
      "architecture.validated_by",
      "architecture.extends_factory"
    ],
    status: "deferred",
    reason: "The candidate proves 3/9/3 typed rows but summarizes factory and Rule endpoints by type rather than stable ontology instance IDs.",
    authority_effect: "none"
  },
  {
    blueprint_id: "relation-blueprint.entity.factory-and-validation/v1",
    candidate_id: "candidate.settlement.settlement.entity-implementation/v1",
    relation_type_refs: [
      "architecture.constructed_by",
      "architecture.validated_by",
      "architecture.extends_factory"
    ],
    status: "deferred",
    reason: "The candidate proves 3/9/3 typed rows but summarizes factory and Rule endpoints by type rather than stable ontology instance IDs.",
    authority_effect: "none"
  },
  {
    blueprint_id: "relation-blueprint.enum.composed-from/v1",
    candidate_id: "candidate.logistics.shipment-priority.enum-implementation/v1",
    relation_type_ref: "architecture.composed_from",
    status: "deferred",
    reason: "The candidate /composition row lacks an exact source identity, exact source and target architecture types, endpoint candidate assertion refs, and a stable per-edge assertion identity, so its three named language nodes are not graph-eligible relation endpoints.",
    authority_effect: "none"
  }
];

function byteCompare(left, right) {
  return Buffer.from(left).compare(Buffer.from(right));
}

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function canonicalJson(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort(byteCompare)
    .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
    .join(",")}}`;
}

function decodePointerToken(token) {
  return token.replaceAll("~1", "/").replaceAll("~0", "~");
}

function resolveJsonPointer(document, pointer) {
  requireCondition(typeof pointer === "string" && pointer.startsWith("/"), "V2_PROMOTION_DECISION_REF_STALE", "json-pointer");
  let current = document;
  for (const raw of pointer.slice(1).split("/")) {
    const token = decodePointerToken(raw);
    requireCondition(current !== null && typeof current === "object" && Object.hasOwn(current, token), "V2_PROMOTION_DECISION_REF_STALE", pointer);
    current = current[token];
  }
  return current;
}

function failure(code, detail) {
  const error = new Error(`${code}${detail ? `:${detail}` : ""}`);
  error.code = code;
  throw error;
}

function requireCondition(condition, code, detail) {
  if (!condition) {
    failure(code, detail);
  }
}

function requireExactKeys(value, expectedKeys, code, detail) {
  requireCondition(value !== null && typeof value === "object" && !Array.isArray(value), code, `${detail}:object`);
  const actual = Object.keys(value).sort(byteCompare);
  const expected = [...expectedKeys].sort(byteCompare);
  requireCondition(canonicalJson(actual) === canonicalJson(expected), code, `${detail}:keys`);
}

function acceptanceGateProblems(value) {
  const problems = [];
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return ["owner-gate-not-object"];
  }
  const actualKeys = Object.keys(value).sort(byteCompare);
  const expectedKeys = Object.keys(expectedOwnerGate).sort(byteCompare);
  if (canonicalJson(actualKeys) !== canonicalJson(expectedKeys)) problems.push("owner-gate-keys");
  for (const [key, expected] of Object.entries(expectedOwnerGate)) {
    if (value[key] !== expected) problems.push(`${key}-must-be-${expected}`);
  }
  for (const [key, claim] of Object.entries(value)) {
    if (claim === "accepted" && key !== "historical_proposal_acceptance" && /(package|schema)/i.test(key)) {
      problems.push(`${key}-current-acceptance-forbidden`);
    }
  }
  return problems;
}

function validateAcceptanceClaimContract() {
  requireCondition(acceptanceGateProblems(expectedOwnerGate).length === 0, "APPLY_ACCEPTANCE_CLAIM_INVALID", "positive-contract");
  const hostiles = [
    { ...expectedOwnerGate, amended_package_acceptance: "accepted" },
    { ...expectedOwnerGate, current_package_acceptance: "accepted" },
    { ...expectedOwnerGate, schema_package_acceptance: "accepted" }
  ];
  for (const [index, hostile] of hostiles.entries()) {
    requireCondition(acceptanceGateProblems(hostile).length > 0, "APPLY_ACCEPTANCE_CLAIM_REGRESSION", `hostile-${index + 1}`);
  }
  return "4/4 one-positive-and-three-current-acceptance-hostiles";
}

function parseJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function syntheticLiveFileRef() {
  const path = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T143151Z-wp-rmt-001-ontology-v2-proposal/preview/ontology-v2.synthetic-live.json";
  const bytes = readFileSync(resolve(repoRoot, path));
  return { path, sha256: sha256(bytes), size_bytes: bytes.length };
}

function assertRegularFile(path, code = "V2_FILE_INVALID") {
  const info = lstatSync(path);
  requireCondition(info.isFile() && !info.isSymbolicLink(), code, path);
}

function verifyFileRef(ref, code = "V2_SOURCE_DIGEST_STALE") {
  const path = resolve(repoRoot, ref.path);
  const repoRelative = relative(repoRoot, path);
  requireCondition(repoRelative !== "" && !repoRelative.startsWith("..") && !isAbsolute(repoRelative), "V2_SOURCE_PATH_ESCAPE", ref.path);
  assertRegularFile(path, code);
  const realRelative = relative(repoRealRoot, realpathSync(path));
  requireCondition(realRelative !== "" && !realRelative.startsWith("..") && !isAbsolute(realRelative), "V2_SOURCE_PATH_ESCAPE", ref.path);
  const bytes = readFileSync(path);
  requireCondition(bytes.length === ref.size_bytes, code, `${ref.path}:size`);
  requireCondition(sha256(bytes) === ref.sha256, code, `${ref.path}:sha256`);
  return bytes;
}

function collectFiles(root, prefix = "") {
  const files = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    const path = resolve(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(path, rel));
    } else {
      requireCondition(entry.isFile() && !entry.isSymbolicLink(), "V2_PACKAGE_FILE_INVALID", rel);
      files.push(rel);
    }
  }
  return files.sort(byteCompare);
}

function validatePackageFileSet() {
  const actual = collectFiles(proposalRoot);
  const allowed = [
    ...expectedPackageFiles,
    "VALIDATION-RESULT.json"
  ].sort(byteCompare);
  for (const path of actual) {
    requireCondition(allowed.includes(path), "V2_PACKAGE_SCOPE_INVALID", path);
  }
  if (!coreOnly) {
    for (const path of expectedPackageFiles) {
      requireCondition(actual.includes(path), "V2_PACKAGE_FILE_MISSING", path);
    }
  }
  requireCondition(!actual.includes("PROPOSAL-RECEIPT.json"), "V2_RECEIPT_NOT_TERMINAL", "present-before-parent-audit");
}

function validateSourceInventory(map) {
  requireCondition(map.source_inventory.entry_count === 15, "V2_SOURCE_INVENTORY_INVALID", "count");
  const entries = [...map.source_inventory.entries].sort((a, b) => byteCompare(a.path, b.path));
  requireCondition(entries.length === 15, "V2_SOURCE_INVENTORY_INVALID", "entries");
  const rows = entries.map((entry) => {
    const bytes = verifyFileRef(entry);
    return `${entry.sha256}\t${bytes.length}\t${entry.path}\n`;
  }).join("");
  const total = entries.reduce((sum, entry) => sum + entry.size_bytes, 0);
  requireCondition(total === 304885, "V2_SOURCE_INVENTORY_INVALID", "total-size");
  requireCondition(map.source_inventory.total_size_bytes === total, "V2_SOURCE_INVENTORY_INVALID", "declared-total");
  requireCondition(sha256(Buffer.from(rows, "utf8")) === "d4ca7e9205e795daf0d90467b62b2866823fa5ea551b85eeeed6b147e3d2059f", "V2_SOURCE_INVENTORY_INVALID", "digest");
  requireCondition(map.source_inventory.sha256 === "d4ca7e9205e795daf0d90467b62b2866823fa5ea551b85eeeed6b147e3d2059f", "V2_SOURCE_INVENTORY_INVALID", "declared-digest");
}

function validateLivePreimages(map) {
  requireCondition(map.proposed_live_target_inventory.length === 5, "V2_TARGET_INVENTORY_INVALID", "count");
  for (const target of map.proposed_live_target_inventory) {
    const path = resolve(repoRoot, target.path);
    if (target.operation === "add") {
      try {
        statSync(path);
        failure("V2_TARGET_PREIMAGE_DRIFT", `${target.path}:expected-absent`);
      } catch (error) {
        if (error.code !== "ENOENT") {
          throw error;
        }
      }
      continue;
    }
    const bytes = readFileSync(path);
    requireCondition(sha256(bytes) === target.preimage_sha256, "V2_TARGET_PREIMAGE_DRIFT", `${target.path}:sha256`);
    requireCondition(bytes.length === target.preimage_size_bytes, "V2_TARGET_PREIMAGE_DRIFT", `${target.path}:size`);
  }
}

function validateV1Continuity(map) {
  const byRole = new Map(map.source_inventory.entries.map((entry) => [entry.role, entry]));
  const ontology = JSON.parse(verifyFileRef(byRole.get("v1_ontology")).toString("utf8"));
  const projection = JSON.parse(verifyFileRef(byRole.get("v1_projection")).toString("utf8"));
  const terminal = JSON.parse(verifyFileRef(byRole.get("terminal_receipt")).toString("utf8"));
  requireCondition(ontology.schema_version === "domainspec-architecture-property-ontology/v1", "V2_V1_CONTINUITY_INVALID", "ontology-schema");
  requireCondition(!("implementation_instances" in ontology) && !("relation_instances" in ontology) && !("promotion_records" in ontology), "V2_V1_CONTINUITY_INVALID", "v1-instance-contamination");
  requireCondition(projection.schema_version === "domainspec-meta-type-projection/v1", "V2_V1_CONTINUITY_INVALID", "projection-schema");
  requireCondition(terminal.receipt_id === "WP-RMT-001-TERMINAL" && terminal.result === "pass" && terminal.authority_effect === "none", "V2_TERMINAL_RECEIPT_INVALID", "identity");
  requireCondition(terminal.candidate_projections.length === 6, "V2_TERMINAL_RECEIPT_INVALID", "candidate-count");
  const terminalByCandidate = new Map(terminal.candidate_projections.map((row) => [row.candidate_id, row]));
  for (const [candidateId, expected] of expectedCandidates) {
    const row = terminalByCandidate.get(candidateId);
    requireCondition(Boolean(row), "V2_TERMINAL_RECEIPT_INVALID", candidateId);
    requireCondition(row.meta_type_id === expected.metaType, "V2_TERMINAL_RECEIPT_INVALID", `${candidateId}:meta-type`);
    requireCondition(row.projection_receipt.result === "pass" && row.projection_receipt.authority_effect === "none", "V2_TERMINAL_RECEIPT_INVALID", `${candidateId}:receipt`);
  }
  const selected = projection.meta_types.filter((row) => [...expectedCandidates.values()].some((entry) => entry.metaType === row.meta_type_id));
  requireCondition(selected.length === 6, "V2_V1_CONTINUITY_INVALID", "projection-count");
  requireCondition(selected.every((row) => row.maturity === "active" && row.mapping_status === "candidate-mapped"), "V2_V1_CONTINUITY_INVALID", "projection-lifecycle");
  const catalogueRows = map.definition_catalogue_continuity?.catalogues ?? [];
  requireCondition(catalogueRows.length === 6, "V2_CATALOGUE_CONTINUITY_INVALID", "count");
  for (const row of catalogueRows) {
    requireCondition(Array.isArray(ontology[row.field]), "V2_CATALOGUE_CONTINUITY_INVALID", row.field);
    requireCondition(ontology[row.field].length === row.item_count, "V2_CATALOGUE_CONTINUITY_INVALID", `${row.field}:count`);
    requireCondition(sha256(Buffer.from(canonicalJson(ontology[row.field]), "utf8")) === row.sha256, "V2_CATALOGUE_CONTINUITY_INVALID", `${row.field}:sha256`);
  }
  requireCondition(map.future_apply_material_contract?.preimage_capture_required === true, "V2_APPLY_MATERIAL_CONTRACT_INVALID", "preimages");
  requireCondition(map.future_apply_material_contract?.hash_only_preimages_forbidden === true && map.future_apply_material_contract?.apply_authorized === false, "V2_APPLY_MATERIAL_CONTRACT_INVALID", "authority");
  requireCondition(map.rollback?.precondition === "promotion_records.length == 0 and no derived implementation, supporting, or relation projection row is admitted", "V2_ROLLBACK_CONTRACT_INVALID", "precondition");
  requireCondition(map.rollback?.reversal_lifecycle_supported === false && map.rollback?.active_promotion_record_policy.includes("separately accepted reversal/export schema"), "V2_ROLLBACK_CONTRACT_INVALID", "reversal-boundary");
}

function validateSchemas(ontologySchema, promotionSchema) {
  requireCondition(ontologySchema.$id === "domainspec://schemas/architecture-property-ontology-v2", "V2_SCHEMA_INVALID", "ontology-id");
  for (const field of ["definition_source_refs", "migration_evidence_refs", "historical_preimage_refs", "implementation_instances", "supporting_instances", "relation_instances", "promotion_records", "lifecycle_policy", "projection_policy", "derived_projection", "derived_supporting_projection", "derived_relation_projection"]) {
    requireCondition(ontologySchema.required.includes(field), "V2_SCHEMA_INVALID", `missing-${field}`);
  }
  requireCondition(
    canonicalJson(ontologySchema.$defs.implementationLifecycleAxes.properties.admission_status.enum) === canonicalJson(["not-admitted", "proposed", "admitted"]) &&
      canonicalJson(ontologySchema.$defs.relationLifecycleAxes.properties.admission_status.enum) === canonicalJson(["not-admitted", "proposed", "admitted"]),
    "V2_SCHEMA_INVALID",
    "admission-lifecycle"
  );
  requireCondition(ontologySchema.$defs.supportingInstance.properties.lifecycle_axes.allOf[1].properties.admission_status.const === "not-admitted", "V2_SCHEMA_INVALID", "supporting-admission");
  requireCondition(ontologySchema.$defs.supportingInstance.properties.lifecycle_axes.allOf[1].properties.authority_effect.const === "none", "V2_SCHEMA_INVALID", "supporting-authority");
  requireCondition(ontologySchema.$defs.lifecyclePolicy.properties.admission_transition_owner.const === "accepted-owner-gated-PromotionRecord", "V2_SCHEMA_INVALID", "owner-gate");
  requireCondition(ontologySchema.$defs.lifecyclePolicy.properties.candidate_self_promotion.const === "forbidden", "V2_SCHEMA_INVALID", "self-promotion");
  requireCondition(ontologySchema.$defs.projectionPolicy.properties.may_author_lifecycle.const === false, "V2_SCHEMA_INVALID", "projection-lifecycle");
  requireCondition(ontologySchema.$defs.projectionPolicy.properties.may_grant_authority.const === false, "V2_SCHEMA_INVALID", "projection-authority");
  requireCondition(promotionSchema.$id === "domainspec://schemas/promotion-record-v1", "V2_SCHEMA_INVALID", "promotion-id");
  requireCondition(ontologySchema.properties.promotion_records.items.$ref === promotionSchema.$id, "V2_SCHEMA_INVALID", "promotion-external-ref");
  requireCondition(promotionSchema.required.includes("owner_acceptance"), "V2_SCHEMA_INVALID", "promotion-owner");
  requireCondition(promotionSchema.properties.status.const === "accepted", "V2_SCHEMA_INVALID", "promotion-status");
  requireCondition(canonicalJson(promotionSchema.properties.subject.properties.subject_kind.enum) === canonicalJson(["implementation-instance", "relation-instance"]), "V2_SCHEMA_INVALID", "promotion-subject-kinds");
  requireCondition(promotionSchema.properties.transition.properties.axis.const === "admission_status", "V2_SCHEMA_INVALID", "promotion-axis");
  requireCondition(canonicalJson(promotionSchema.properties.transition.properties.from.enum) === canonicalJson(["not-admitted", "proposed"]), "V2_SCHEMA_INVALID", "promotion-source");
  requireCondition(promotionSchema.properties.transition.properties.to.const === "admitted", "V2_SCHEMA_INVALID", "promotion-target");
  requireCondition(promotionSchema.properties.rollback.properties.automatic_reversal.const === false, "V2_SCHEMA_INVALID", "promotion-automatic-reversal");
  requireCondition(promotionSchema.properties.authority_effect.const === "canonical-admission", "V2_SCHEMA_INVALID", "promotion-authority");
  requireCondition(
    canonicalJson(ontologySchema.$defs.jsonObjectRef) === canonicalJson(promotionSchema.$defs.jsonObjectRef),
    "V2_SCHEMA_BINDING_ASSUMPTION_INVALID",
    "jsonObjectRef-cross-schema-parity"
  );
  for (const definitionName of ["conceptTypeDefinition", "propertyDefinition", "constraintOperator", "languageProjection"]) {
    const definition = ontologySchema.$defs[definitionName];
    requireCondition(
      definition?.type === "object" && definition.additionalProperties === false && Array.isArray(definition.required) && definition.required.length > 0,
      "V2_SCHEMA_INVALID",
      `${definitionName}:closed-standalone-definition`
    );
  }
  requireCondition(promotionSchemaBindingViolations(promotionSchema).length === 0, "V2_SCHEMA_BINDING_ASSUMPTION_INVALID", promotionSchemaBindingViolations(promotionSchema).join(","));
}

function promotionSchemaBindingViolations(schema) {
  const violations = [];
  if (schema.$id !== "domainspec://schemas/promotion-record-v1" || schema.$id.includes("#")) violations.push("root-absolute-id");
  const lookup = (pointer) => pointer.split("/").slice(1).reduce((value, token) => value?.[decodePointerToken(token)], schema);
  const visit = (value, path = []) => {
    if (Array.isArray(value)) return value.forEach((item, index) => visit(item, [...path, String(index)]));
    if (value === null || typeof value !== "object") return;
    if (path.length > 0 && Object.hasOwn(value, "$id")) violations.push(`nested-$id:${path.join("/")}`);
    for (const keyword of ["$anchor", "$dynamicAnchor", "$dynamicRef", "$recursiveAnchor", "$recursiveRef"]) {
      if (Object.hasOwn(value, keyword)) violations.push(`unsupported-${keyword}:${path.join("/")}`);
    }
    if (Object.hasOwn(value, "$ref")) {
      if (typeof value.$ref !== "string" || !value.$ref.startsWith("#/")) violations.push(`nonlocal-$ref:${path.join("/")}`);
      else if (lookup(value.$ref.slice(1)) === undefined) violations.push(`unresolved-$ref:${value.$ref}`);
    }
    for (const [key, nested] of Object.entries(value)) visit(nested, [...path, key]);
  };
  visit(schema);
  return violations;
}

function validateExecutableJsonSchema() {
  const python = [
    "import json,sys",
    "from importlib.metadata import version",
    "from pathlib import Path",
    "from jsonschema import Draft202012Validator, RefResolver",
    "load=lambda index: json.loads(Path(sys.argv[index]).resolve().read_text(encoding='utf-8'))",
    "current_ontology,current_promotion,current_document=load(1),load(2),load(3)",
    "historical_ontology,historical_promotion=load(4),load(5)",
    "historical_preview,historical_live,fixtures=load(6),load(7),load(8)",
    "Draft202012Validator.check_schema(current_ontology)",
    "Draft202012Validator.check_schema(current_promotion)",
    "Draft202012Validator.check_schema(historical_ontology)",
    "Draft202012Validator.check_schema(historical_promotion)",
    "absolute=lambda value,promotion: {key:(promotion['$id']+item if key=='$ref' and isinstance(item,str) and item.startswith('#/') else absolute(item,promotion)) for key,item in value.items()} if isinstance(value,dict) else [absolute(item,promotion) for item in value] if isinstance(value,list) else value",
    "current_bound=absolute(current_promotion,current_promotion)",
    "historical_bound=absolute(historical_promotion,historical_promotion)",
    "current_resolver=RefResolver.from_schema(current_ontology,handlers={'domainspec':lambda uri: current_bound if uri == current_promotion['$id'] else (_ for _ in ()).throw(ValueError('unbound schema URI: '+uri))})",
    "historical_resolver=RefResolver.from_schema(historical_ontology,handlers={'domainspec':lambda uri: historical_bound if uri == historical_promotion['$id'] else (_ for _ in ()).throw(ValueError('unbound schema URI: '+uri))})",
    "Draft202012Validator(current_ontology,resolver=current_resolver).validate(current_document)",
    "Draft202012Validator(historical_ontology,resolver=historical_resolver).validate(historical_preview)",
    "Draft202012Validator(historical_ontology,resolver=historical_resolver).validate(historical_live)",
    "Draft202012Validator(historical_promotion).validate(fixtures['positive_promotion_record_fixture']['record'])",
    "[Draft202012Validator(historical_promotion).validate(row['record']) for row in fixtures['positive_admission_fixtures']]",
    "print(version('jsonschema'))"
  ].join(";");
  let jsonSchemaVersion;
  try {
    jsonSchemaVersion = execFileSync("python3", [
      "-c",
      python,
      ontologySchemaPath,
      promotionSchemaPath,
      targetOntologyPath,
      historicalOntologySchemaPath,
      historicalPromotionSchemaPath,
      resolve(proposalRoot, "preview/ontology-v2.preview.json"),
      resolve(proposalRoot, "preview/ontology-v2.synthetic-live.json"),
      fixturesPath
    ], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    }).trim();
  } catch (error) {
    failure("V2_JSON_SCHEMA_EXECUTION_FAILED", error.stderr?.toString().trim() ?? error.message);
  }
  requireCondition(/^4\./.test(jsonSchemaVersion), "V2_JSON_SCHEMA_TOOLCHAIN_INVALID", jsonSchemaVersion);
  return jsonSchemaVersion;
}

function namespacePromotionRefs(value) {
  if (Array.isArray(value)) return value.map(namespacePromotionRefs);
  if (value === null || typeof value !== "object") return value;
  const result = {};
  for (const [key, nested] of Object.entries(value)) {
    if (key === "$ref" && typeof nested === "string" && nested.startsWith("#/$defs/")) {
      result[key] = `#/$defs/promotionRecord_${nested.slice("#/$defs/".length)}`;
    } else {
      result[key] = namespacePromotionRefs(nested);
    }
  }
  return result;
}

function executableSchema(schemaPath, boundPromotionSchemaPath = promotionSchemaPath) {
  const schema = parseJson(schemaPath);
  if (schema.$id !== "domainspec://schemas/architecture-property-ontology-v2") return schema;
  const promotion = namespacePromotionRefs(parseJson(boundPromotionSchemaPath));
  const promotionDefinitions = Object.fromEntries(
    Object.entries(promotion.$defs).map(([key, value]) => [`promotionRecord_${key}`, value])
  );
  delete promotion.$schema;
  delete promotion.$id;
  delete promotion.$defs;
  const bundled = clone(schema);
  Object.assign(bundled.$defs, promotionDefinitions);
  bundled.properties.promotion_records.items = promotion;
  return bundled;
}

function jsonSchemaAccepts(schemaPath, instance, boundPromotionSchemaPath = promotionSchemaPath) {
  const python = [
    "import json,sys",
    "from jsonschema import Draft202012Validator",
    "payload=json.load(sys.stdin)",
    "Draft202012Validator.check_schema(payload['schema'])",
    "Draft202012Validator(payload['schema']).validate(payload['instance'])"
  ].join(";");
  try {
    execFileSync("python3", ["-c", python], {
      input: `${JSON.stringify({ schema: executableSchema(schemaPath, boundPromotionSchemaPath), instance })}\n`,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"]
    });
    return true;
  } catch {
    return false;
  }
}

function crossSchemaAccepts(instance, ontologyPath = ontologySchemaPath, promotionPath = promotionSchemaPath) {
  const python = [
    "import json,sys",
    "from jsonschema import Draft202012Validator, RefResolver",
    "payload=json.load(sys.stdin)",
    "ontology=payload['ontology_schema']",
    "promotion=payload['promotion_schema']",
    "absolute=lambda value: {key:(promotion['$id']+item if key=='$ref' and isinstance(item,str) and item.startswith('#/') else absolute(item)) for key,item in value.items()} if isinstance(value,dict) else [absolute(item) for item in value] if isinstance(value,list) else value",
    "bound_promotion=absolute(promotion)",
    "retrieve=lambda uri: bound_promotion if uri == promotion['$id'] else (_ for _ in ()).throw(ValueError('unbound schema URI: '+uri))",
    "resolver=RefResolver.from_schema(ontology,handlers={'domainspec':retrieve})",
    "Draft202012Validator(ontology,resolver=resolver).validate(payload['instance'])",
    "[Draft202012Validator(promotion).validate(record) for record in payload['instance']['promotion_records']]"
  ].join(";");
  try {
    execFileSync("python3", ["-c", python], {
      input: `${JSON.stringify({ ontology_schema: parseJson(ontologyPath), promotion_schema: parseJson(promotionPath), instance })}\n`,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"]
    });
    return true;
  } catch {
    return false;
  }
}

function validateRelationOwnershipDecision() {
  const request = parseJson(decisionRequestPath);
  const receipt = parseJson(decisionReceiptPath);
  const decision = parseJson(relationOwnershipDecisionPath);
  requireCondition(jsonSchemaAccepts(decisionRequestSchemaPath, request), "APPLY_DECISION_REQUEST_SCHEMA_INVALID", "REL-A/B/D");
  requireCondition(jsonSchemaAccepts(decisionReceiptSchemaPath, receipt), "APPLY_DECISION_RECEIPT_SCHEMA_INVALID", "REL-A/B/D");

  const replay = spawnSync("python3", [
    decisionPrefilterPath,
    decisionRequestPath,
    "--request-schema",
    decisionRequestSchemaPath,
    "--receipt-schema",
    decisionReceiptSchemaPath
  ], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 1024 * 1024
  });
  requireCondition(replay.status === 0, "APPLY_DECISION_PREFILTER_REPLAY_FAILED", (replay.stderr || replay.stdout).trim());
  requireCondition(replay.stdout === readFileSync(decisionReceiptPath, "utf8"), "APPLY_DECISION_PREFILTER_REPLAY_DRIFT", "receipt-bytes");

  const sharedEvidence = [
    "independent audit: cross-candidate architecture edges impossible under same-candidate validator",
    "preserved generic relations: architecture.depends_on, architecture.consumes, interface and event edges",
    `frozen blocked package aggregate ${frozenBlockedPackageSha256}`
  ];
  const expectedCandidates = [
    {
      optionId: "REL-A",
      label: "Cross-candidate relations (Recommended)",
      optionKind: "action",
      structuralStatus: "admissible",
      reversibility: "reversible",
      hazardClass: "other",
      ownerGate: relationOwnerRoute,
      evidence: sharedEvidence,
      rejectionReasons: []
    },
    {
      optionId: "REL-B",
      label: "Candidate-local only",
      optionKind: "action",
      structuralStatus: "admissible",
      reversibility: "reversible",
      hazardClass: "other",
      ownerGate: relationOwnerRoute,
      evidence: sharedEvidence,
      rejectionReasons: []
    },
    {
      optionId: "REL-D",
      label: "Defer",
      optionKind: "defer",
      structuralStatus: "admissible",
      reversibility: "reversible",
      hazardClass: "other",
      ownerGate: null,
      evidence: sharedEvidence,
      rejectionReasons: []
    }
  ];
  requireCondition(request.decisionId === relationDecisionId && canonicalJson(request.candidates) === canonicalJson(expectedCandidates), "APPLY_DECISION_OPTIONS_INVALID", "exact-REL-A-B-D");
  const requestDigest = sha256(Buffer.from(canonicalJson(request), "utf8"));
  requireCondition(requestDigest === "04f8d412dccf9a67bd1cbb0a3d2a0779d0290a3c92dfac328f7e3dda5408fee8", "APPLY_DECISION_REQUEST_DIGEST_INVALID", requestDigest);
  requireCondition(
    receipt.decisionId === relationDecisionId &&
      receipt.requestDigest === requestDigest &&
      receipt.routeOutcome === "gate" &&
      receipt.decisionGateRequired === true &&
      canonicalJson(receipt.admissibleOptionIds) === canonicalJson(["REL-A", "REL-B", "REL-D"]) &&
      canonicalJson(receipt.presentedOptionIds) === canonicalJson(["REL-A", "REL-B", "REL-D"]) &&
      receipt.directOptionId === null &&
      receipt.ownerGate === null &&
      receipt.rejectedOptions.length === 0 &&
      receipt.reasons.length === 0,
    "APPLY_DECISION_RECEIPT_INVALID",
    "exact-gate"
  );

  const requestBytes = verifyApplyRef(decision.admissibility_request_ref, "APPLY_DECISION_REF_STALE");
  const receiptBytes = verifyApplyRef(decision.admissibility_receipt_ref, "APPLY_DECISION_REF_STALE");
  requireCondition(Buffer.compare(requestBytes, readFileSync(decisionRequestPath)) === 0 && Buffer.compare(receiptBytes, readFileSync(decisionReceiptPath)) === 0, "APPLY_DECISION_REF_STALE", "wrong-target");
  requireCondition(
    decision.schema_version === "domainspec-ontology-v2-relation-ownership-decision/v1" &&
      decision.decision_id === relationDecisionId &&
      decision.decision_source === "direct-user-response" &&
      decision.exact_user_response === "REL-A" &&
      decision.selected_option?.option_id === "REL-A" &&
      decision.selected_option?.label === "Cross-candidate relations (Recommended)" &&
      decision.selected_option?.description === "relations may connect independently evidenced candidate endpoints. Each edge binds its own owner plus exact source/target evidence. This supports real depends_on, interface, event, and consumption relationships." &&
      decision.admissibility_request_canonical_digest === requestDigest &&
      decision.admissibility_route_outcome === "gate" &&
      canonicalJson(decision.presented_option_ids) === canonicalJson(["REL-A", "REL-B", "REL-D"]) &&
      decision.owner_gate === relationOwnerRoute,
    "APPLY_RELATION_DECISION_INVALID",
    "selection"
  );
  requireCondition(
    decision.scope?.package_root === relative(repoRoot, applyRoot) &&
      decision.scope?.mutation_boundary === "isolated staged apply package only" &&
      decision.scope?.proposal_status.includes(`${acceptedProposalReceiptSha256} is a historical base`) &&
      decision.scope?.selected_relation_semantics === "relation candidate_id identifies the relation-owner candidate; source and target endpoints bind their own candidate ids and exact evidence bundles; no source-target-owner candidate equality is required",
    "APPLY_RELATION_DECISION_INVALID",
    "scope"
  );
  requireCondition(
    decision.apply_authorization === "absent" &&
      decision.candidate_migration_authorization === "absent" &&
      decision.implementation_or_relation_admission_authorization === "absent" &&
      decision.promotion_record_creation_authorization === "absent" &&
      decision.authority_effect === "none",
    "APPLY_AUTHORITY_INFLATION",
    "relation-decision"
  );

  const manifest = parseJson(resolve(applyRoot, "apply-manifest.json"));
  requireCondition(Array.isArray(manifest.decision_evidence) && manifest.decision_evidence.length === 3, "APPLY_DECISION_INVENTORY_INVALID", "manifest-count");
  requireCondition(canonicalJson(manifest.decision_evidence.map((ref) => ref.path)) === canonicalJson(expectedDecisionEvidencePaths), "APPLY_DECISION_INVENTORY_INVALID", "manifest-paths");
  for (const ref of manifest.decision_evidence) verifyApplyRef(ref, "APPLY_DECISION_INVENTORY_STALE");
  return { requestDigest };
}

function buildSyntheticLiveDocument(preview, migrationMap) {
  const ontologyRef = migrationMap.source_inventory.entries.find((row) => row.role === "v1_ontology");
  const v1 = JSON.parse(verifyFileRef(ontologyRef).toString("utf8"));
  const live = clone(preview);
  live.ontology_id = "implementation-conformance.architecture-properties.v2";
  live.document_mode = "live";
  for (const field of ["preview_id", "mode", "base_ontology_ref", "base_projection_ref", "terminal_receipt_ref", "definition_catalogue_mode", "migration_readiness"]) {
    delete live[field];
  }
  for (const field of ["concept_types", "property_definitions", "relation_definitions", "constraint_operators", "language_projections"]) {
    live[field] = clone(v1[field]);
  }
  return { live, v1 };
}

function collectDefinitionSourceIds(value, found = []) {
  if (Array.isArray(value)) {
    for (const row of value) collectDefinitionSourceIds(row, found);
    return found;
  }
  if (value === null || typeof value !== "object") return found;
  for (const [key, nested] of Object.entries(value)) {
    if (key === "source_refs" && Array.isArray(nested) && nested.every((row) => typeof row === "string")) {
      found.push(...nested);
    } else {
      collectDefinitionSourceIds(nested, found);
    }
  }
  return found;
}

function validateDefinitionSourceClosure(live) {
  const sourceIds = live.definition_source_refs.map((row) => row.source_id);
  requireCondition(new Set(sourceIds).size === sourceIds.length, "V2_DEFINITION_SOURCE_INVALID", "duplicate-source-id");
  const known = new Set(sourceIds);
  const used = collectDefinitionSourceIds([
    live.concept_types,
    live.property_definitions,
    live.relation_definitions,
    live.constraint_operators,
    live.language_projections
  ]);
  const dangling = [...new Set(used)].filter((sourceId) => !known.has(sourceId));
  requireCondition(dangling.length === 0, "V2_DEFINITION_SOURCE_DANGLING", dangling.join(","));
  for (const source of live.definition_source_refs) {
    const path = resolve(repoRoot, source.path);
    const repoRelative = relative(repoRoot, path);
    requireCondition(repoRelative !== "" && !repoRelative.startsWith("..") && !isAbsolute(repoRelative), "V2_SOURCE_PATH_ESCAPE", source.path);
    assertRegularFile(path, "V2_DEFINITION_SOURCE_STALE");
    const realRelative = relative(repoRealRoot, realpathSync(path));
    requireCondition(realRelative !== "" && !realRelative.startsWith("..") && !isAbsolute(realRelative), "V2_SOURCE_PATH_ESCAPE", source.path);
    requireCondition(sha256(readFileSync(path)) === source.sha256, "V2_DEFINITION_SOURCE_STALE", source.source_id);
  }
  return used;
}

function validateLiveSourceSeparation(live) {
  const livePath = "projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json";
  requireCondition(live.migration_evidence_refs.every((row) => row.path !== livePath), "V2_LIVE_SOURCE_SELF_REFERENCE", livePath);
  requireCondition(live.historical_preimage_refs.some((row) => row.path === livePath), "V2_HISTORICAL_PREIMAGE_MISSING", livePath);
  for (const ref of live.migration_evidence_refs) verifyFileRef(ref, "V2_MIGRATION_EVIDENCE_STALE");
}

function validateSyntheticLiveDocument(preview, migrationMap) {
  const { live: expectedLive, v1 } = buildSyntheticLiveDocument(preview, migrationMap);
  const live = parseJson(resolve(proposalRoot, "preview/ontology-v2.synthetic-live.json"));
  requireCondition(canonicalJson(live) === canonicalJson(expectedLive), "V2_SYNTHETIC_LIVE_DOCUMENT_DRIFT", "expected-source");
  requireCondition(
    jsonSchemaAccepts(ontologySchemaPath, live),
    "V2_SYNTHETIC_LIVE_SCHEMA_INVALID",
    "document"
  );
  for (const row of migrationMap.definition_catalogue_continuity.catalogues) {
    const targetField = row.target_field ?? row.field;
    requireCondition(canonicalJson(live[targetField]) === canonicalJson(v1[row.field]), "V2_SYNTHETIC_LIVE_CATALOGUE_DRIFT", targetField);
    requireCondition(live[targetField].length === row.item_count && sha256(Buffer.from(canonicalJson(live[targetField]), "utf8")) === row.sha256, "V2_SYNTHETIC_LIVE_CATALOGUE_DRIFT", `${targetField}:binding`);
  }
  const refShape = (row) => ({ path: row.path, sha256: row.sha256, size_bytes: row.size_bytes });
  const terminalRef = migrationMap.source_inventory.entries.find((row) => row.role === "terminal_receipt");
  const v1OntologyRef = migrationMap.source_inventory.entries.find((row) => row.role === "v1_ontology");
  const v1ProjectionRef = migrationMap.source_inventory.entries.find((row) => row.role === "v1_projection");
  requireCondition(canonicalJson(live.migration_evidence_refs) === canonicalJson([refShape(terminalRef)]), "V2_MIGRATION_EVIDENCE_INVALID", "exact-terminal");
  requireCondition(canonicalJson(live.historical_preimage_refs) === canonicalJson([refShape(v1OntologyRef), refShape(v1ProjectionRef)]), "V2_HISTORICAL_PREIMAGE_INVALID", "exact-v1-preimages");
  const sourceClassPaths = [...live.migration_evidence_refs, ...live.historical_preimage_refs].map((row) => row.path);
  requireCondition(new Set(sourceClassPaths).size === sourceClassPaths.length, "V2_SOURCE_CLASS_OVERLAP", "migration-and-historical");
  validateDefinitionSourceClosure(live);
  validateLiveSourceSeparation(live);
}

function isSubtypeInDocument(document, actual, expected) {
  const concepts = new Map(document.concept_types.map((row) => [row.concept_id, row]));
  const visited = new Set();
  let current = actual;
  while (current) {
    if (current === expected) return true;
    if (visited.has(current)) failure("V2_CONCEPT_HIERARCHY_CYCLE", current);
    visited.add(current);
    const concept = concepts.get(current);
    if (!concept) return false;
    current = concept.extends ?? null;
  }
  return false;
}

function allowedRelationPair(relation, document) {
  const definition = document.relation_definitions.find((row) => row.relation_id === relation.relation_type_ref);
  if (!definition && document.definition_catalogue_mode === "referenced-not-copied") {
    const historicalPairs = {
      "architecture.composed_from": new Set([
        "architecture.EnumImplementation->architecture.EnumRepresentationUnit",
        "architecture.EnumRepresentationUnit->architecture.EnumRepresentationUnit"
      ]),
      "architecture.selects_strategy": new Set(["architecture.PolicyImplementation->architecture.PolicyStrategyContract"]),
      "architecture.constructed_by": new Set([
        "architecture.ValueObjectImplementation->architecture.ValueObjectFactoryProvider",
        "architecture.EntityImplementation->architecture.EntityFactoryProvider"
      ]),
      "architecture.validated_by": new Set([
        "architecture.ValueObjectFactoryProvider->architecture.RuleImplementation",
        "architecture.EntityFactoryProvider->architecture.RuleImplementation"
      ]),
      "architecture.extends_factory": new Set([
        "architecture.ValueObjectFactoryProvider->architecture.ValueObjectFactoryProvider",
        "architecture.EntityFactoryProvider->architecture.EntityFactoryProvider"
      ])
    };
    return historicalPairs[relation.relation_type_ref]?.has(`${relation.source_type_ref}->${relation.target_type_ref}`) ?? false;
  }
  if (!definition) return false;
  const pairs = Array.isArray(definition.allowed_type_pairs) && definition.allowed_type_pairs.length > 0
    ? definition.allowed_type_pairs.map((pair) => [pair.source_type, pair.target_type])
    : definition.source_types.flatMap((sourceType) => definition.target_types.map((targetType) => [sourceType, targetType]));
  return pairs.some(([sourceType, targetType]) =>
    isSubtypeInDocument(document, relation.source_type_ref, sourceType) &&
    isSubtypeInDocument(document, relation.target_type_ref, targetType));
}

function projectedTarget(target) {
  const projected = {
    language: target.language,
    node_id: target.node_id,
    provider_id: target.provider_id,
    protocol_id: target.protocol_id
  };
  if (target.target_id !== undefined) projected.target_id = target.target_id;
  if (target.form_id !== undefined) projected.form_id = target.form_id;
  return projected;
}

function receiptCandidateArtifact(receipt) {
  return receipt.candidate_artifact ?? receipt.candidate_projection ?? null;
}

function assertExactFileRef(actual, expected, code, detail) {
  requireCondition(
    actual?.path === expected.path &&
      actual?.sha256 === expected.sha256 &&
      actual?.size_bytes === expected.size_bytes,
    code,
    detail
  );
}

function validateInstanceSourceBinding(instance) {
  const candidate = JSON.parse(verifyFileRef(instance.candidate_ref).toString("utf8"));
  requireCondition(candidate.candidate_id === instance.candidate_id, "V2_IMPLEMENTATION_SOURCE_BINDING_INVALID", `${instance.candidate_id}:candidate-id`);
  requireCondition(candidate.meta_type?.id === instance.canonical_meta_type_ref, "V2_IMPLEMENTATION_SOURCE_BINDING_INVALID", `${instance.candidate_id}:meta-type`);
  requireCondition(candidate.architecture_implementation?.type_id === instance.architecture_type_ref, "V2_IMPLEMENTATION_SOURCE_BINDING_INVALID", `${instance.candidate_id}:architecture-type`);
  const definition = candidate.architecture_implementation?.concept_id ?? candidate.architecture_implementation?.definition_id;
  requireCondition(definition === instance.concept_or_definition_ref, "V2_IMPLEMENTATION_SOURCE_BINDING_INVALID", `${instance.candidate_id}:definition`);
  const candidateTargets = candidate.targets.map(projectedTarget).sort((a, b) => byteCompare(a.language, b.language));
  const instanceTargets = instance.language_realizations.map(projectedTarget).sort((a, b) => byteCompare(a.language, b.language));
  requireCondition(canonicalJson(candidateTargets) === canonicalJson(instanceTargets), "V2_IMPLEMENTATION_TARGET_BINDING_INVALID", instance.candidate_id);
  const receipt = JSON.parse(verifyFileRef(instance.projection_receipt_ref).toString("utf8"));
  requireCondition(receipt.result === "pass" && receipt.authority_effect === "none", "V2_EVIDENCE_RECEIPT_INVALID", instance.candidate_id);
  const artifact = receiptCandidateArtifact(receipt);
  requireCondition(Boolean(artifact), "V2_EVIDENCE_RECEIPT_INVALID", `${instance.candidate_id}:candidate-artifact`);
  assertExactFileRef(artifact, instance.candidate_ref, "V2_EVIDENCE_RECEIPT_INVALID", `${instance.candidate_id}:candidate-ref`);
  requireCondition(artifact.candidate_id === instance.candidate_id, "V2_EVIDENCE_RECEIPT_INVALID", `${instance.candidate_id}:candidate-id`);
  const terminal = JSON.parse(verifyFileRef(instance.terminal_receipt_ref).toString("utf8"));
  const terminalRow = terminal.candidate_projections?.find((row) => row.candidate_id === instance.candidate_id);
  requireCondition(Boolean(terminalRow), "V2_TERMINAL_RECEIPT_INVALID", instance.candidate_id);
  assertExactFileRef(terminalRow.candidate, instance.candidate_ref, "V2_TERMINAL_RECEIPT_INVALID", `${instance.candidate_id}:candidate-ref`);
  assertExactFileRef(terminalRow.projection_receipt, instance.projection_receipt_ref, "V2_TERMINAL_RECEIPT_INVALID", `${instance.candidate_id}:receipt-ref`);
  return candidate;
}

function validateCurrentAssertionBindings(ontology) {
  for (const instance of ontology.implementation_instances) {
    const assertionRef = instance.endpoint_assertion_ref;
    requireCondition(Boolean(assertionRef), "APPLY_ENDPOINT_ASSERTION_INVALID", `${instance.candidate_id}:missing`);
    assertExactFileRef(assertionRef, instance.candidate_ref, "APPLY_ENDPOINT_ASSERTION_INVALID", `${instance.candidate_id}:candidate-ref`);
    requireCondition(
      ["concept_id", "definition_id", "instance_id", "node_id"].includes(assertionRef.identity_field) &&
        ["type_id", "architecture_type_ref"].includes(assertionRef.architecture_type_field),
      "APPLY_ENDPOINT_ASSERTION_INVALID",
      `${instance.candidate_id}:field-contract`
    );
    const candidate = JSON.parse(verifyFileRef(assertionRef, "APPLY_ENDPOINT_ASSERTION_STALE").toString("utf8"));
    const assertion = resolveJsonPointer(candidate, assertionRef.json_pointer);
    requireCondition(
      assertion?.[assertionRef.identity_field] === instance.implementation_instance_id &&
        assertion?.[assertionRef.architecture_type_field] === instance.architecture_type_ref,
      "APPLY_ENDPOINT_ASSERTION_INVALID",
      `${instance.candidate_id}:identity-and-type`
    );
  }
  for (const relation of ontology.relation_instances) {
    const owner = ontology.implementation_instances.find((instance) => instance.candidate_id === relation.candidate_id);
    requireCondition(Boolean(owner), "APPLY_RELATION_ASSERTION_INVALID", `${relation.relation_instance_id}:owner`);
    assertExactFileRef(relation.relation_assertion_ref, owner.candidate_ref, "APPLY_RELATION_ASSERTION_INVALID", `${relation.relation_instance_id}:owner-ref`);
    const ownerCandidate = JSON.parse(verifyFileRef(relation.relation_assertion_ref, "APPLY_RELATION_ASSERTION_STALE").toString("utf8"));
    const assertion = resolveJsonPointer(ownerCandidate, relation.relation_assertion_ref.json_pointer);
    requireCondition(
      assertion?.relation_instance_id === relation.relation_instance_id &&
        assertion?.relation_type_ref === relation.relation_type_ref &&
        assertion?.source_instance_ref === relation.source_instance_ref &&
        assertion?.target_instance_ref === relation.target_instance_ref,
      "APPLY_RELATION_ASSERTION_INVALID",
      relation.relation_instance_id
    );
    for (const [side, endpointId] of [["source", relation.source_instance_ref], ["target", relation.target_instance_ref]]) {
      const binding = relation[`${side}_endpoint_binding`];
      requireCondition(Boolean(binding?.endpoint_assertion_ref), "APPLY_RELATION_ENDPOINT_ASSERTION_INVALID", `${relation.relation_instance_id}:${side}`);
      const endpointCandidate = JSON.parse(verifyFileRef(binding.endpoint_assertion_ref, "APPLY_RELATION_ENDPOINT_ASSERTION_STALE").toString("utf8"));
      const endpointAssertion = resolveJsonPointer(endpointCandidate, binding.endpoint_assertion_ref.json_pointer);
      requireCondition(endpointAssertion?.[binding.endpoint_assertion_ref.identity_field] === endpointId, "APPLY_RELATION_ENDPOINT_ASSERTION_INVALID", `${relation.relation_instance_id}:${side}:identity`);
    }
  }
}

function detectCycle(relations) {
  const graphs = new Map();
  for (const relation of relations.filter((row) => row.cycle_policy === "acyclic")) {
    if (!graphs.has(relation.relation_type_ref)) graphs.set(relation.relation_type_ref, new Map());
    const graph = graphs.get(relation.relation_type_ref);
    if (!graph.has(relation.source_instance_ref)) graph.set(relation.source_instance_ref, []);
    graph.get(relation.source_instance_ref).push(relation.target_instance_ref);
  }
  const graphHasCycle = (graph) => {
  const visiting = new Set();
  const visited = new Set();
  const visit = (node) => {
    if (visiting.has(node)) return true;
    if (visited.has(node)) return false;
    visiting.add(node);
    for (const next of graph.get(node) ?? []) {
      if (visit(next)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };
    return [...graph.keys()].some(visit);
  };
  return [...graphs.values()].some(graphHasCycle);
}

function promotionScopePayload(record) {
  return {
    schema_version: record.schema_version,
    promotion_id: record.promotion_id,
    status: record.status,
    subject: record.subject,
    transition: record.transition,
    accepted_scope_algorithm: record.accepted_scope_algorithm,
    candidate_ref: record.candidate_ref,
    evidence_refs: record.evidence_refs,
    owner_acceptance: {
      owner_route: record.owner_acceptance.owner_route,
      decision_id: record.owner_acceptance.decision_id,
      decision_status: record.owner_acceptance.decision_status
    },
    rollback: record.rollback,
    authority_effect: record.authority_effect
  };
}

function promotionScopeSha256(record) {
  return sha256(Buffer.from(canonicalJson(promotionScopePayload(record)), "utf8"));
}

function validatePromotionRecord(record, { checkLive = true } = {}) {
  requireCondition(record?.schema_version === "domainspec-promotion-record/v1", "V2_PROMOTION_SCHEMA_INVALID", "schema");
  requireCondition(record.status === "accepted", "V2_PROMOTION_SCHEMA_INVALID", "status");
  requireCondition(record.subject?.subject_kind === "implementation-instance" || record.subject?.subject_kind === "relation-instance", "V2_PROMOTION_SCHEMA_INVALID", "subject-kind");
  requireCondition(record.transition?.axis === "admission_status", "V2_PROMOTION_TRANSITION_INVALID", "axis");
  requireCondition(["not-admitted", "proposed"].includes(record.transition?.from) && record.transition?.to === "admitted", "V2_PROMOTION_TRANSITION_INVALID", "edge");
  requireCondition(record.accepted_scope_algorithm === "sha256-canonical-json-sorted-keys-v1", "V2_PROMOTION_SCOPE_MISMATCH", "algorithm");
  requireCondition(record.owner_acceptance?.decision_status === "accepted" && record.owner_acceptance?.decision_ref, "V2_PROMOTION_OWNER_DECISION_REQUIRED", "decision");
  requireCondition(record.authority_effect === "canonical-admission", "V2_AUTHORITY_EFFECT_INVALID", "promotion");
  const evidenceIdentities = (record.evidence_refs ?? []).map((ref) => `${ref.path}|${ref.sha256}|${ref.size_bytes}`);
  requireCondition(evidenceIdentities.length >= 2 && new Set(evidenceIdentities).size === evidenceIdentities.length, "V2_PROMOTION_EVIDENCE_INVALID", "evidence-set");
  if (checkLive) {
    const candidate = JSON.parse(verifyFileRef(record.candidate_ref, "V2_PROMOTION_CANDIDATE_REF_STALE").toString("utf8"));
    requireCondition(candidate.candidate_id === record.candidate_ref.candidate_id, "V2_PROMOTION_CANDIDATE_REF_STALE", "candidate-id");
    for (const evidenceRef of record.evidence_refs) {
      verifyFileRef(evidenceRef, "V2_PROMOTION_EVIDENCE_REF_STALE");
    }
    verifyFileRef(record.rollback.preimage_ref, "V2_PROMOTION_ROLLBACK_REF_STALE");
  }
  const acceptedScope = promotionScopeSha256(record);
  requireCondition(record.owner_acceptance.accepted_scope_sha256 === acceptedScope, "V2_PROMOTION_SCOPE_MISMATCH", "record");
  if (checkLive) {
    const decisionDocument = JSON.parse(verifyFileRef(record.owner_acceptance.decision_ref, "V2_PROMOTION_DECISION_REF_STALE").toString("utf8"));
    const decision = resolveJsonPointer(decisionDocument, record.owner_acceptance.decision_ref.json_pointer);
    requireCondition(
      decision?.decision_id === record.owner_acceptance.decision_id &&
        decision?.status === "accepted" &&
        decision?.owner_route === record.owner_acceptance.owner_route &&
        decision?.accepted_scope_sha256 === acceptedScope,
      "V2_PROMOTION_OWNER_DECISION_REQUIRED",
      record.promotion_id
    );
  }
  return acceptedScope;
}

function promotionRecordById(preview, promotionId) {
  const matches = preview.promotion_records.filter((row) => row.promotion_id === promotionId);
  requireCondition(matches.length === 1, "V2_PROMOTION_OWNER_DECISION_REQUIRED", `${promotionId}:identity`);
  return matches[0];
}

function validatePromotionSubjectEvidence(promotion, candidateId, candidateRef, evidenceRefs, detail, checkLive, admissionPreimageRef) {
  if (checkLive) {
    for (const evidenceRef of promotion.evidence_refs) {
      verifyFileRef(evidenceRef, "V2_PROMOTION_EVIDENCE_REF_STALE");
    }
    verifyFileRef(promotion.rollback.preimage_ref, "V2_PROMOTION_ROLLBACK_REF_STALE");
  }
  requireCondition(
    promotion.candidate_ref.candidate_id === candidateId &&
      promotion.candidate_ref.path === candidateRef.path &&
      promotion.candidate_ref.sha256 === candidateRef.sha256 &&
      promotion.candidate_ref.size_bytes === candidateRef.size_bytes,
    "V2_PROMOTION_SUBJECT_MISMATCH",
    `${detail}:candidate`
  );
  requireCondition(
    canonicalJson(promotion.evidence_refs) === canonicalJson(evidenceRefs),
    "V2_PROMOTION_SUBJECT_EVIDENCE_MISMATCH",
    `${detail}:evidence`
  );
  requireCondition(
    admissionPreimageRef && canonicalJson(promotion.rollback.preimage_ref) === canonicalJson(admissionPreimageRef),
    "V2_PROMOTION_SUBJECT_ROLLBACK_MISMATCH",
    `${detail}:rollback`
  );
  const ownerRoute = "DomainSpec architecture-property ontology admission owner";
  requireCondition(
    promotion.owner_acceptance.owner_route === ownerRoute && promotion.rollback.reversal_owner_route === ownerRoute,
    "V2_PROMOTION_SUBJECT_OWNER_MISMATCH",
    detail
  );
}

function validateAdmissionConflicts(instances) {
  const keys = instances
    .filter((row) => row.lifecycle_axes.admission_status === "admitted")
    .map((row) => `${row.candidate_id}|${row.architecture_type_ref}|${row.canonical_meta_type_ref}`);
  requireCondition(new Set(keys).size === keys.length, "V2_ADMISSION_SCOPE_CONFLICT", "duplicate-scope");
}

function deriveProjectionRow(instance) {
  const row = {
    implementation_instance_id: instance.implementation_instance_id,
    candidate_id: instance.candidate_id,
    canonical_meta_type_ref: instance.canonical_meta_type_ref,
    architecture_type_ref: instance.architecture_type_ref,
    meta_type_maturity: instance.lifecycle_axes.meta_type_maturity,
    definition_status: instance.lifecycle_axes.definition_status,
    evidence_status: instance.lifecycle_axes.evidence_status,
    admission_status: instance.lifecycle_axes.admission_status,
    authority_effect: instance.lifecycle_axes.authority_effect,
    promotion_record_ref: instance.promotion_record_ref ?? null
  };
  if (instance.endpoint_assertion_ref) row.endpoint_assertion_ref = clone(instance.endpoint_assertion_ref);
  return row;
}

function expectedDerivedProjection(preview) {
  return preview.implementation_instances
    .map(deriveProjectionRow)
    .sort((a, b) => byteCompare(a.implementation_instance_id, b.implementation_instance_id));
}

function deriveSupportingProjectionRow(supporting) {
  const row = {
    supporting_instance_id: supporting.supporting_instance_id,
    candidate_id: supporting.candidate_id,
    canonical_meta_type_ref: supporting.canonical_meta_type_ref,
    architecture_type_ref: supporting.architecture_type_ref,
    definition_status: supporting.lifecycle_axes.definition_status,
    evidence_status: supporting.lifecycle_axes.evidence_status,
    admission_status: supporting.lifecycle_axes.admission_status,
    authority_effect: supporting.lifecycle_axes.authority_effect
  };
  if (supporting.source_identity_pointer !== undefined) row.source_identity_pointer = supporting.source_identity_pointer;
  if (supporting.endpoint_assertion_ref) row.endpoint_assertion_ref = clone(supporting.endpoint_assertion_ref);
  return row;
}

function expectedDerivedSupportingProjection(preview) {
  return preview.supporting_instances
    .map(deriveSupportingProjectionRow)
    .sort((a, b) => byteCompare(a.supporting_instance_id, b.supporting_instance_id));
}

function deriveRelationProjectionRow(relation) {
  const row = {
    relation_instance_id: relation.relation_instance_id,
    candidate_id: relation.candidate_id,
    canonical_meta_type_ref: relation.canonical_meta_type_ref,
    relation_type_ref: relation.relation_type_ref,
    source_instance_ref: relation.source_instance_ref,
    target_instance_ref: relation.target_instance_ref,
    definition_status: relation.lifecycle_axes.definition_status,
    evidence_status: relation.lifecycle_axes.evidence_status,
    admission_status: relation.lifecycle_axes.admission_status,
    authority_effect: relation.lifecycle_axes.authority_effect,
    promotion_record_ref: relation.promotion_record_ref ?? null
  };
  if (relation.relation_assertion_ref) {
    row.source_type_ref = relation.source_type_ref;
    row.target_type_ref = relation.target_type_ref;
    row.relation_assertion_ref = clone(relation.relation_assertion_ref);
  }
  if (relation.source_endpoint_binding) {
    row.source_candidate_id = relation.source_endpoint_binding.candidate_id;
    row.source_endpoint_assertion_ref = clone(relation.source_endpoint_binding.endpoint_assertion_ref);
  }
  if (relation.target_endpoint_binding) {
    row.target_candidate_id = relation.target_endpoint_binding.candidate_id;
    row.target_endpoint_assertion_ref = clone(relation.target_endpoint_binding.endpoint_assertion_ref);
  }
  return row;
}

function expectedDerivedRelationProjection(preview) {
  return preview.relation_instances
    .map(deriveRelationProjectionRow)
    .sort((a, b) => byteCompare(a.relation_instance_id, b.relation_instance_id));
}

function validatePreview(preview, { checkLive = true, exactPositive = true, admissionPreimageRef = null, expectedCurrentState = false } = {}) {
  requireCondition(preview.authority_effect === "none", "V2_AUTHORITY_EFFECT_INVALID", "preview");
  requireCondition(preview.projection_policy?.kind === "derived-read-model", "V2_PROJECTION_AUTHORITY_FORBIDDEN", "kind");
  requireCondition(preview.projection_policy?.may_author_lifecycle === false && preview.projection_policy?.may_grant_authority === false, "V2_PROJECTION_AUTHORITY_FORBIDDEN", "capability");
  requireCondition(preview.lifecycle_policy?.candidate_self_promotion === "forbidden", "V2_LIFECYCLE_POLICY_INVALID", "self-promotion");
  requireCondition(preview.lifecycle_policy?.admission_transition_owner === "accepted-owner-gated-PromotionRecord", "V2_LIFECYCLE_POLICY_INVALID", "owner-gate");
  if (exactPositive) {
    requireCondition(preview.implementation_instances.length === 6, "V2_IMPLEMENTATION_INSTANCE_INVALID", "count");
  }
  const implementationIds = new Set();
  const candidateIds = new Set();
  const knownEndpoints = new Set();
  const endpointRegistry = new Map();
  const instanceByCandidate = new Map();
  const promotionReferenceCounts = new Map();
  const markPromotionReference = (promotionId) => {
    const count = (promotionReferenceCounts.get(promotionId) ?? 0) + 1;
    requireCondition(count === 1, "V2_PROMOTION_SUBJECT_MISMATCH", `${promotionId}:multiple-subjects`);
    promotionReferenceCounts.set(promotionId, count);
  };
  for (const instance of preview.implementation_instances) {
    requireCondition(!implementationIds.has(instance.implementation_instance_id), "V2_IMPLEMENTATION_INSTANCE_INVALID", "duplicate-id");
    requireCondition(!candidateIds.has(instance.candidate_id), "V2_IMPLEMENTATION_INSTANCE_INVALID", "duplicate-candidate");
    implementationIds.add(instance.implementation_instance_id);
    candidateIds.add(instance.candidate_id);
    instanceByCandidate.set(instance.candidate_id, instance);
    knownEndpoints.add(instance.implementation_instance_id);
    endpointRegistry.set(instance.implementation_instance_id, {
      type: instance.architecture_type_ref,
      candidateId: instance.candidate_id,
      evidenceRefs: [instance.candidate_ref, instance.projection_receipt_ref, instance.terminal_receipt_ref],
      endpointAssertionRef: instance.endpoint_assertion_ref ?? null
    });
    const expected = expectedCandidates.get(instance.candidate_id);
    requireCondition(Boolean(expected), "V2_IMPLEMENTATION_INSTANCE_INVALID", instance.candidate_id);
    const expectedImplementationId = expectedCurrentState ? expected.implementationId : expected.historicalImplementationId;
    requireCondition(instance.implementation_instance_id === expectedImplementationId, "V2_IMPLEMENTATION_INSTANCE_INVALID", `${instance.candidate_id}:id`);
    requireCondition(instance.canonical_meta_type_ref === expected.metaType, "V2_IMPLEMENTATION_INSTANCE_INVALID", `${instance.candidate_id}:meta-type`);
    requireCondition(instance.architecture_type_ref === expected.architectureType, "V2_IMPLEMENTATION_INSTANCE_INVALID", `${instance.candidate_id}:architecture-type`);
    if (expectedCurrentState) {
      requireCondition(
        canonicalJson(instance.endpoint_assertion_ref) === canonicalJson(expected.assertionRef),
        "V2_IMPLEMENTATION_INSTANCE_INVALID",
        `${instance.candidate_id}:exact-endpoint-assertion-ref`
      );
    }
    const axes = instance.lifecycle_axes;
    if (axes.admission_status === axes.evidence_status) {
      failure("V2_LIFECYCLE_AXIS_COLLAPSE", instance.candidate_id);
    }
    requireCondition(["none", "canonical-admission"].includes(axes.authority_effect), "V2_AUTHORITY_EFFECT_INVALID", instance.candidate_id);
    requireCondition(["not-admitted", "proposed", "admitted"].includes(axes.admission_status), "V2_ADMISSION_STATUS_INVALID", instance.candidate_id);
    if (exactPositive) {
      requireCondition(axes.meta_type_maturity === "active", "V2_LIFECYCLE_AXIS_INVALID", `${instance.candidate_id}:maturity`);
      requireCondition(axes.definition_status === "candidate", "V2_LIFECYCLE_AXIS_INVALID", `${instance.candidate_id}:definition`);
      requireCondition(axes.evidence_status === "validated-candidate", "V2_LIFECYCLE_AXIS_INVALID", `${instance.candidate_id}:evidence`);
      requireCondition(axes.admission_status === "not-admitted", "V2_LIFECYCLE_AXIS_INVALID", `${instance.candidate_id}:admission`);
    }
    if (axes.admission_status === "admitted") {
      requireCondition(typeof instance.promotion_record_ref === "string" && axes.authority_effect === "canonical-admission", "V2_PROMOTION_OWNER_DECISION_REQUIRED", instance.candidate_id);
      markPromotionReference(instance.promotion_record_ref);
      const promotion = promotionRecordById(preview, instance.promotion_record_ref);
      validatePromotionSubjectEvidence(
        promotion,
        instance.candidate_id,
        instance.candidate_ref,
        [instance.projection_receipt_ref, instance.terminal_receipt_ref],
        instance.candidate_id,
        checkLive,
        admissionPreimageRef
      );
      validatePromotionRecord(promotion, { checkLive });
      requireCondition(
        promotion.subject.subject_kind === "implementation-instance" &&
          promotion.subject.instance_id === instance.implementation_instance_id &&
          promotion.subject.canonical_meta_type_ref === instance.canonical_meta_type_ref &&
          promotion.subject.architecture_type_ref === instance.architecture_type_ref,
        "V2_PROMOTION_SUBJECT_MISMATCH",
        instance.candidate_id
      );
    } else {
      requireCondition(!instance.promotion_record_ref, "V2_PROMOTION_REFERENCE_FORBIDDEN", instance.candidate_id);
      requireCondition(axes.authority_effect === "none", "V2_AUTHORITY_EFFECT_INVALID", instance.candidate_id);
    }
    const languages = instance.language_realizations.map((row) => row.language);
    requireCondition(new Set(languages).size === languages.length, "V2_IMPLEMENTATION_INSTANCE_INVALID", `${instance.candidate_id}:language-duplicate`);
    requireCondition(expected.languages.every((language) => languages.includes(language)), "V2_IMPLEMENTATION_INSTANCE_INVALID", `${instance.candidate_id}:languages`);
    for (const realization of instance.language_realizations) {
      if (expectedCurrentState && !realization.endpoint_assertion_ref) continue;
      knownEndpoints.add(realization.node_id);
      endpointRegistry.set(realization.node_id, {
        type: instance.architecture_type_ref === "architecture.EnumImplementation" ? "architecture.EnumRepresentationUnit" : "architecture.LanguageRealization",
        candidateId: instance.candidate_id,
        evidenceRefs: [instance.candidate_ref, instance.projection_receipt_ref, instance.terminal_receipt_ref],
        endpointAssertionRef: realization.endpoint_assertion_ref ?? null
      });
    }
    if (checkLive) {
      validateInstanceSourceBinding(instance);
    }
  }
  const supportingIds = new Set();
  for (const supporting of preview.supporting_instances) {
    requireCondition(!supportingIds.has(supporting.supporting_instance_id) && !knownEndpoints.has(supporting.supporting_instance_id), "V2_SUPPORTING_INSTANCE_INVALID", `${supporting.supporting_instance_id}:duplicate`);
    supportingIds.add(supporting.supporting_instance_id);
    const ownerInstance = instanceByCandidate.get(supporting.candidate_id);
    requireCondition(Boolean(ownerInstance) && ownerInstance.canonical_meta_type_ref === supporting.canonical_meta_type_ref, "V2_SUPPORTING_INSTANCE_INVALID", `${supporting.supporting_instance_id}:owner`);
    requireCondition(supporting.lifecycle_axes.admission_status === "not-admitted" && supporting.lifecycle_axes.authority_effect === "none", "V2_SUPPORTING_INSTANCE_INVALID", `${supporting.supporting_instance_id}:lifecycle`);
    knownEndpoints.add(supporting.supporting_instance_id);
    endpointRegistry.set(supporting.supporting_instance_id, {
      type: supporting.architecture_type_ref,
      candidateId: supporting.candidate_id,
      evidenceRefs: clone(supporting.evidence_refs),
      endpointAssertionRef: supporting.endpoint_assertion_ref ?? null
    });
    if (checkLive) {
      const ownerCandidate = JSON.parse(verifyFileRef(ownerInstance.candidate_ref, "V2_SUPPORTING_INSTANCE_EVIDENCE_INVALID").toString("utf8"));
      requireCondition(resolveJsonPointer(ownerCandidate, supporting.source_identity_pointer) === supporting.supporting_instance_id, "V2_SUPPORTING_INSTANCE_IDENTITY_INVALID", supporting.supporting_instance_id);
      requireCondition(supporting.evidence_refs.length === 3, "V2_SUPPORTING_INSTANCE_EVIDENCE_INVALID", supporting.supporting_instance_id);
      assertExactFileRef(supporting.evidence_refs[0], ownerInstance.candidate_ref, "V2_SUPPORTING_INSTANCE_EVIDENCE_INVALID", `${supporting.supporting_instance_id}:candidate`);
      assertExactFileRef(supporting.evidence_refs[1], ownerInstance.projection_receipt_ref, "V2_SUPPORTING_INSTANCE_EVIDENCE_INVALID", `${supporting.supporting_instance_id}:receipt`);
      assertExactFileRef(supporting.evidence_refs[2], ownerInstance.terminal_receipt_ref, "V2_SUPPORTING_INSTANCE_EVIDENCE_INVALID", `${supporting.supporting_instance_id}:terminal`);
      for (const ref of supporting.evidence_refs) verifyFileRef(ref, "V2_SUPPORTING_INSTANCE_EVIDENCE_INVALID");
    }
  }
  validateAdmissionConflicts(preview.implementation_instances);
  const relationIds = new Set();
  const semanticEdges = new Set();
  for (const relation of preview.relation_instances) {
    requireCondition(!relationIds.has(relation.relation_instance_id), "V2_RELATION_INSTANCE_INVALID", "duplicate-id");
    relationIds.add(relation.relation_instance_id);
    const edgeKey = `${relation.relation_type_ref}|${relation.source_instance_ref}|${relation.target_instance_ref}`;
    requireCondition(!semanticEdges.has(edgeKey), "V2_RELATION_SEMANTIC_DUPLICATE", edgeKey);
    semanticEdges.add(edgeKey);
    requireCondition(expectedCandidates.get(relation.candidate_id)?.metaType === relation.canonical_meta_type_ref, "V2_RELATION_INSTANCE_INVALID", `${relation.relation_instance_id}:candidate`);
    requireCondition(/^architecture\.[a-z][a-z0-9_]*$/.test(relation.relation_type_ref), "V2_RELATION_ID_NOT_CANONICAL", relation.relation_type_ref);
    requireCondition(allowedRelationPair(relation, preview), "V2_RELATION_TYPE_PAIR_INVALID", relation.relation_instance_id);
    requireCondition(knownEndpoints.has(relation.source_instance_ref) && knownEndpoints.has(relation.target_instance_ref), "V2_RELATION_ENDPOINT_UNKNOWN", relation.relation_instance_id);
    const sourceEndpoint = endpointRegistry.get(relation.source_instance_ref);
    const targetEndpoint = endpointRegistry.get(relation.target_instance_ref);
    requireCondition(sourceEndpoint?.type === relation.source_type_ref && targetEndpoint?.type === relation.target_type_ref, "V2_RELATION_ENDPOINT_TYPE_MISMATCH", relation.relation_instance_id);
    const strictRelationEvidence = expectedCurrentState || Boolean(relation.relation_assertion_ref || relation.source_endpoint_binding || relation.target_endpoint_binding);
    if (strictRelationEvidence) {
      requireCondition(Boolean(relation.relation_assertion_ref), "V2_RELATION_EVIDENCE_BINDING_INVALID", `${relation.relation_instance_id}:assertion`);
      requireCondition(
        relation.source_endpoint_binding?.candidate_id === sourceEndpoint?.candidateId &&
          canonicalJson(relation.source_endpoint_binding?.evidence_refs) === canonicalJson(sourceEndpoint?.evidenceRefs) &&
          canonicalJson(relation.source_endpoint_binding?.endpoint_assertion_ref) === canonicalJson(sourceEndpoint?.endpointAssertionRef),
        "V2_RELATION_ENDPOINT_OWNER_MISMATCH",
        `${relation.relation_instance_id}:source`
      );
      requireCondition(
        relation.target_endpoint_binding?.candidate_id === targetEndpoint?.candidateId &&
          canonicalJson(relation.target_endpoint_binding?.evidence_refs) === canonicalJson(targetEndpoint?.evidenceRefs) &&
          canonicalJson(relation.target_endpoint_binding?.endpoint_assertion_ref) === canonicalJson(targetEndpoint?.endpointAssertionRef),
        "V2_RELATION_ENDPOINT_OWNER_MISMATCH",
        `${relation.relation_instance_id}:target`
      );
    } else {
      requireCondition(sourceEndpoint?.candidateId === relation.candidate_id && targetEndpoint?.candidateId === relation.candidate_id, "V2_RELATION_ENDPOINT_OWNER_MISMATCH", relation.relation_instance_id);
    }
    requireCondition(relation.lifecycle_axes.admission_status !== relation.lifecycle_axes.evidence_status, "V2_LIFECYCLE_AXIS_COLLAPSE", relation.relation_instance_id);
    requireCondition(["not-admitted", "proposed", "admitted"].includes(relation.lifecycle_axes.admission_status), "V2_ADMISSION_STATUS_INVALID", relation.relation_instance_id);
    if (relation.lifecycle_axes.admission_status === "admitted") {
      requireCondition(!supportingIds.has(relation.source_instance_ref) && !supportingIds.has(relation.target_instance_ref), "V2_SUPPORTING_RELATION_ADMISSION_FORBIDDEN", relation.relation_instance_id);
      requireCondition(typeof relation.promotion_record_ref === "string" && relation.lifecycle_axes.authority_effect === "canonical-admission", "V2_PROMOTION_OWNER_DECISION_REQUIRED", relation.relation_instance_id);
      markPromotionReference(relation.promotion_record_ref);
      const promotion = promotionRecordById(preview, relation.promotion_record_ref);
      validatePromotionSubjectEvidence(
        promotion,
        relation.candidate_id,
        relation.evidence_refs[0],
        relation.evidence_refs.slice(1),
        relation.relation_instance_id,
        checkLive,
        admissionPreimageRef
      );
      validatePromotionRecord(promotion, { checkLive });
      requireCondition(
        promotion.subject.subject_kind === "relation-instance" &&
          promotion.subject.instance_id === relation.relation_instance_id &&
          promotion.subject.canonical_meta_type_ref === relation.canonical_meta_type_ref &&
          promotion.subject.relation_type_ref === relation.relation_type_ref &&
          promotion.subject.source_instance_ref === relation.source_instance_ref &&
          promotion.subject.target_instance_ref === relation.target_instance_ref,
        "V2_PROMOTION_SUBJECT_MISMATCH",
        relation.relation_instance_id
      );
    } else {
      requireCondition(!relation.promotion_record_ref, "V2_PROMOTION_REFERENCE_FORBIDDEN", relation.relation_instance_id);
      requireCondition(relation.lifecycle_axes.authority_effect === "none", "V2_AUTHORITY_EFFECT_INVALID", relation.relation_instance_id);
    }
    if (checkLive) {
      requireCondition(relation.evidence_refs.length === 3, "V2_RELATION_EVIDENCE_BINDING_INVALID", relation.relation_instance_id);
      const ownerInstance = instanceByCandidate.get(relation.candidate_id);
      requireCondition(Boolean(ownerInstance), "V2_RELATION_EVIDENCE_BINDING_INVALID", `${relation.relation_instance_id}:owner`);
      assertExactFileRef(relation.evidence_refs[0], ownerInstance.candidate_ref, "V2_RELATION_EVIDENCE_BINDING_INVALID", `${relation.relation_instance_id}:candidate`);
      assertExactFileRef(relation.evidence_refs[1], ownerInstance.projection_receipt_ref, "V2_RELATION_EVIDENCE_BINDING_INVALID", `${relation.relation_instance_id}:receipt`);
      assertExactFileRef(relation.evidence_refs[2], ownerInstance.terminal_receipt_ref, "V2_RELATION_EVIDENCE_BINDING_INVALID", `${relation.relation_instance_id}:terminal`);
      for (const ref of relation.evidence_refs) verifyFileRef(ref, "V2_RELATION_EVIDENCE_BINDING_INVALID");
      if (relation.relation_type_ref === "architecture.composed_from") {
        const candidate = JSON.parse(verifyFileRef(ownerInstance.candidate_ref).toString("utf8"));
        requireCondition(
          candidate.composition?.result === "pass" &&
            candidate.composition?.relation === "composed_from" &&
            candidate.composition?.endpoint_node_ids?.includes(relation.target_instance_ref),
          "V2_RELATION_EVIDENCE_BINDING_INVALID",
          `${relation.relation_instance_id}:composition`
        );
      }
    }
  }
  requireCondition(!detectCycle(preview.relation_instances), "V2_RELATION_CYCLE", "acyclic-relation-set");
  const promotionIds = preview.promotion_records.map((record) => record.promotion_id);
  requireCondition(new Set(promotionIds).size === promotionIds.length, "V2_PROMOTION_SCHEMA_INVALID", "duplicate-promotion-id");
  for (const record of preview.promotion_records) {
    requireCondition(promotionReferenceCounts.get(record.promotion_id) === 1, "V2_PROMOTION_SUBJECT_MISMATCH", `${record.promotion_id}:unreferenced`);
  }
  const actualProjection = [...preview.derived_projection].sort((a, b) => byteCompare(a.implementation_instance_id, b.implementation_instance_id));
  requireCondition(canonicalJson(actualProjection) === canonicalJson(expectedDerivedProjection(preview)), "V2_DERIVED_PROJECTION_DRIFT", "implementation-rows");
  const actualSupportingProjection = [...preview.derived_supporting_projection].sort((a, b) => byteCompare(a.supporting_instance_id, b.supporting_instance_id));
  requireCondition(canonicalJson(actualSupportingProjection) === canonicalJson(expectedDerivedSupportingProjection(preview)), "V2_DERIVED_SUPPORTING_PROJECTION_DRIFT", "supporting-rows");
  const actualRelationProjection = [...preview.derived_relation_projection].sort((a, b) => byteCompare(a.relation_instance_id, b.relation_instance_id));
  requireCondition(canonicalJson(actualRelationProjection) === canonicalJson(expectedDerivedRelationProjection(preview)), "V2_DERIVED_RELATION_PROJECTION_DRIFT", "relation-rows");
  if (exactPositive) {
    const expectedRelationCount = expectedCurrentState ? 0 : 3;
    const expectedBlueprintCount = expectedCurrentState ? 4 : 3;
    requireCondition(preview.relation_instances.length === expectedRelationCount, "V2_RELATION_INSTANCE_INVALID", "positive-count");
    if (!expectedCurrentState) requireCondition(preview.relation_instances.every((row) => row.relation_type_ref === "architecture.composed_from"), "V2_RELATION_INSTANCE_INVALID", "positive-types");
    requireCondition(preview.relation_instances.every((row) => row.lifecycle_axes.definition_status === "candidate" && row.lifecycle_axes.evidence_status === "validated-candidate" && row.lifecycle_axes.admission_status === "not-admitted" && row.lifecycle_axes.authority_effect === "none"), "V2_RELATION_LIFECYCLE_INVALID", "positive-axes");
    requireCondition(preview.supporting_instances.length === 0 && preview.derived_supporting_projection.length === 0, "V2_SUPPORTING_INSTANCE_INVALID", "positive-residue-only");
    requireCondition(preview.promotion_records.length === 0, "V2_PROMOTION_UNAUTHORIZED", "positive-records");
    requireCondition(preview.relation_instance_blueprints.length === expectedBlueprintCount, "V2_RELATION_BLUEPRINT_INVALID", "count");
    requireCondition(canonicalJson(preview.relation_instance_blueprints) === canonicalJson(expectedCurrentState ? expectedRelationBlueprints : expectedRelationBlueprints.slice(0, 3)), "V2_RELATION_BLUEPRINT_INVALID", "exact-content");
    if (preview.document_mode === "preview") {
      requireCondition(Object.values(preview.migration_readiness).every((value) => value === false), "V2_MIGRATION_STATE_INVALID", "preview-ready");
    } else {
      requireCondition(preview.document_mode === "live" && !("migration_readiness" in preview), "V2_MIGRATION_STATE_INVALID", "live-document");
    }
  }
}

function admittedPreviewFromFixture(preview, fixture) {
  const admitted = clone(preview);
  const record = clone(fixture.record);
  admitted.promotion_records.push(record);
  if (fixture.subject_kind === "implementation-instance") {
    const subject = admitted.implementation_instances.find((row) => row.implementation_instance_id === record.subject.instance_id);
    requireCondition(Boolean(subject), "V2_PROMOTION_SUBJECT_MISMATCH", fixture.fixture_id);
    subject.lifecycle_axes.admission_status = "admitted";
    subject.lifecycle_axes.authority_effect = "canonical-admission";
    subject.promotion_record_ref = record.promotion_id;
    const projection = admitted.derived_projection.find((row) => row.implementation_instance_id === subject.implementation_instance_id);
    requireCondition(Boolean(projection), "V2_DERIVED_PROJECTION_DRIFT", fixture.fixture_id);
    Object.assign(projection, deriveProjectionRow(subject));
  } else {
    const subject = admitted.relation_instances.find((row) => row.relation_instance_id === record.subject.instance_id);
    requireCondition(Boolean(subject), "V2_PROMOTION_SUBJECT_MISMATCH", fixture.fixture_id);
    subject.lifecycle_axes.admission_status = "admitted";
    subject.lifecycle_axes.authority_effect = "canonical-admission";
    subject.promotion_record_ref = record.promotion_id;
    const projection = admitted.derived_relation_projection.find((row) => row.relation_instance_id === subject.relation_instance_id);
    requireCondition(Boolean(projection), "V2_DERIVED_RELATION_PROJECTION_DRIFT", fixture.fixture_id);
    Object.assign(projection, deriveRelationProjectionRow(subject));
  }
  return admitted;
}

function validatePositiveAdmissions(fixtures, preview) {
  requireCondition(fixtures.positive_admission_fixtures.length === 2, "V2_POSITIVE_PROMOTION_FIXTURE_INVALID", "count");
  const kinds = fixtures.positive_admission_fixtures.map((row) => row.subject_kind);
  requireCondition(new Set(kinds).size === 2 && kinds.includes("implementation-instance") && kinds.includes("relation-instance"), "V2_POSITIVE_PROMOTION_FIXTURE_INVALID", "kinds");
  const live = parseJson(resolve(proposalRoot, "preview/ontology-v2.synthetic-live.json"));
  const preimageRef = syntheticLiveFileRef();
  for (const fixture of fixtures.positive_admission_fixtures) {
    const admitted = admittedPreviewFromFixture(live, fixture);
    requireCondition(
      jsonSchemaAccepts(historicalOntologySchemaPath, admitted, historicalPromotionSchemaPath),
      "V2_POSITIVE_PROMOTION_SCHEMA_INVALID",
      fixture.fixture_id
    );
    requireCondition(
      crossSchemaAccepts(admitted, historicalOntologySchemaPath, historicalPromotionSchemaPath),
      "V2_POSITIVE_PROMOTION_INTEGRATION_INVALID",
      fixture.fixture_id
    );
    validatePreview(admitted, { checkLive: true, exactPositive: false, admissionPreimageRef: preimageRef });
  }
  return fixtures.positive_admission_fixtures.length;
}

function validateSupportingEndpointCapability(fixtures) {
  const live = parseJson(resolve(proposalRoot, "preview/ontology-v2.synthetic-live.json"));
  const fixture = fixtures.positive_supporting_endpoint_fixture;
  requireCondition(fixture?.fixture_kind === "schema-and-semantic-validation-only-no-migration-authority", "V2_SUPPORTING_FIXTURE_INVALID", "kind");
  live.supporting_instances.push(clone(fixture.supporting_instance));
  live.derived_supporting_projection.push(deriveSupportingProjectionRow(fixture.supporting_instance));
  live.relation_instances.push(clone(fixture.relation_instance));
  live.derived_relation_projection.push(deriveRelationProjectionRow(fixture.relation_instance));
  validatePreview(live, { checkLive: true, exactPositive: false });
  requireCondition(
    jsonSchemaAccepts(historicalOntologySchemaPath, live, historicalPromotionSchemaPath),
    "V2_SUPPORTING_FIXTURE_INVALID",
    "historical-schema"
  );
}

function executeHostile(hostileId, preview, fixtures) {
  const mutated = clone(preview);
  const syntheticLive = parseJson(resolve(proposalRoot, "preview/ontology-v2.synthetic-live.json"));
  const admissionPreimageRef = syntheticLiveFileRef();
  switch (hostileId) {
    case "candidate-self-promotion":
      mutated.implementation_instances[0].lifecycle_axes.admission_status = "admitted";
      mutated.implementation_instances[0].lifecycle_axes.authority_effect = "canonical-admission";
      mutated.implementation_instances[0].promotion_record_ref = "promotion.candidate-authored/v1";
      return validatePreview(mutated, { checkLive: false, exactPositive: false });
    case "stale-candidate-digest":
      mutated.implementation_instances[0].candidate_ref.sha256 = "0".repeat(64);
      return validatePreview(mutated, { checkLive: true, exactPositive: false });
    case "illegal-admission-transition": {
      const record = clone(fixtures.positive_admission_fixtures[0].record);
      record.transition.from = "retired";
      return validatePromotionRecord(record, { checkLive: false });
    }
    case "missing-owner-decision":
      mutated.implementation_instances[0].lifecycle_axes.admission_status = "admitted";
      return validatePreview(mutated, { checkLive: false, exactPositive: false });
    case "cross-family-factory-edge":
      mutated.relation_instances.push({
        relation_instance_id: "hostile.cross-family/v1",
        candidate_id: "candidate.settlement.settlement.entity-implementation/v1",
        canonical_meta_type_ref: "DS-D1.1",
        relation_type_ref: "architecture.constructed_by",
        source_instance_ref: "implementation.settlement.settlement.entity/v1",
        target_instance_ref: "enum.typescript.shipment-priority",
        source_type_ref: "architecture.EntityImplementation",
        target_type_ref: "architecture.ValueObjectFactoryProvider",
        evidence_refs: [
          clone(mutated.implementation_instances[5].candidate_ref),
          clone(mutated.implementation_instances[5].projection_receipt_ref),
          clone(mutated.implementation_instances[5].terminal_receipt_ref)
        ],
        cycle_policy: "not-applicable",
        lifecycle_axes: { definition_status: "candidate", evidence_status: "candidate", admission_status: "not-admitted", authority_effect: "none" }
      });
      return validatePreview(mutated, { checkLive: false, exactPositive: false });
    case "extension-cycle":
      mutated.relation_instances.push(
        {
          relation_instance_id: "hostile.cycle-a/v1",
          candidate_id: "candidate.logistics.shipment-priority.enum-implementation/v1",
          canonical_meta_type_ref: "DS-D1.3",
          relation_type_ref: "architecture.composed_from",
          source_instance_ref: "enum.typescript.shipment-priority",
          target_instance_ref: "enum.python.shipment-priority",
          source_type_ref: "architecture.EnumRepresentationUnit",
          target_type_ref: "architecture.EnumRepresentationUnit",
          evidence_refs: [
            clone(mutated.implementation_instances[0].candidate_ref),
            clone(mutated.implementation_instances[0].projection_receipt_ref),
            clone(mutated.implementation_instances[0].terminal_receipt_ref)
          ],
          cycle_policy: "acyclic",
          lifecycle_axes: { definition_status: "candidate", evidence_status: "candidate", admission_status: "not-admitted", authority_effect: "none" }
        },
        {
          relation_instance_id: "hostile.cycle-b/v1",
          candidate_id: "candidate.logistics.shipment-priority.enum-implementation/v1",
          canonical_meta_type_ref: "DS-D1.3",
          relation_type_ref: "architecture.composed_from",
          source_instance_ref: "enum.python.shipment-priority",
          target_instance_ref: "enum.typescript.shipment-priority",
          source_type_ref: "architecture.EnumRepresentationUnit",
          target_type_ref: "architecture.EnumRepresentationUnit",
          evidence_refs: [
            clone(mutated.implementation_instances[0].candidate_ref),
            clone(mutated.implementation_instances[0].projection_receipt_ref),
            clone(mutated.implementation_instances[0].terminal_receipt_ref)
          ],
          cycle_policy: "acyclic",
          lifecycle_axes: { definition_status: "candidate", evidence_status: "candidate", admission_status: "not-admitted", authority_effect: "none" }
        }
      );
      return validatePreview(mutated, { checkLive: false, exactPositive: false });
    case "duplicate-admitted-scope": {
      const first = clone(mutated.implementation_instances[0]);
      const second = clone(first);
      first.lifecycle_axes.admission_status = "admitted";
      second.lifecycle_axes.admission_status = "admitted";
      second.implementation_instance_id = `${first.implementation_instance_id}.duplicate`;
      return validateAdmissionConflicts([first, second]);
    }
    case "projection-authors-admission":
      mutated.projection_policy.may_author_lifecycle = true;
      return validatePreview(mutated, { checkLive: false, exactPositive: false });
    case "authority-inflation":
      mutated.implementation_instances[0].lifecycle_axes.authority_effect = "canonical-admission";
      return validatePreview(mutated, { checkLive: false, exactPositive: false });
    case "missing-relation-endpoint":
      mutated.relation_instances[0].target_instance_ref = "enum.unknown.shipment-priority";
      return validatePreview(mutated, { checkLive: false, exactPositive: false });
    case "unnormalized-enum-relation":
      mutated.relation_instances[0].relation_type_ref = "composed_from";
      return validatePreview(mutated, { checkLive: false, exactPositive: false });
    case "evidence-status-collapsed-into-admission":
      mutated.implementation_instances[0].lifecycle_axes.admission_status = mutated.implementation_instances[0].lifecycle_axes.evidence_status;
      return validatePreview(mutated, { checkLive: false, exactPositive: false });
    case "admitted-relation-missing-promotion":
      mutated.relation_instances[0].lifecycle_axes.admission_status = "admitted";
      mutated.relation_instances[0].lifecycle_axes.authority_effect = "canonical-admission";
      return validatePreview(mutated, { checkLive: false, exactPositive: false });
    case "stale-promotion-decision-ref": {
      const admitted = admittedPreviewFromFixture(syntheticLive, fixtures.positive_admission_fixtures[0]);
      admitted.promotion_records[0].owner_acceptance.decision_ref.sha256 = "0".repeat(64);
      return validatePreview(admitted, { checkLive: true, exactPositive: false, admissionPreimageRef });
    }
    case "stale-promotion-evidence-ref": {
      const admitted = admittedPreviewFromFixture(syntheticLive, fixtures.positive_admission_fixtures[0]);
      admitted.promotion_records[0].evidence_refs[0].sha256 = "0".repeat(64);
      return validatePreview(admitted, { checkLive: true, exactPositive: false, admissionPreimageRef });
    }
    case "stale-promotion-rollback-ref": {
      const admitted = admittedPreviewFromFixture(syntheticLive, fixtures.positive_admission_fixtures[0]);
      admitted.promotion_records[0].rollback.preimage_ref.sha256 = "0".repeat(64);
      return validatePreview(admitted, { checkLive: true, exactPositive: false, admissionPreimageRef });
    }
    case "promotion-subject-mismatch": {
      const record = clone(fixtures.positive_admission_fixtures[0].record);
      syntheticLive.promotion_records.push(record);
      syntheticLive.relation_instances[0].lifecycle_axes.admission_status = "admitted";
      syntheticLive.relation_instances[0].lifecycle_axes.authority_effect = "canonical-admission";
      syntheticLive.relation_instances[0].promotion_record_ref = record.promotion_id;
      Object.assign(syntheticLive.derived_relation_projection[0], deriveRelationProjectionRow(syntheticLive.relation_instances[0]));
      return validatePreview(syntheticLive, { checkLive: true, exactPositive: false, admissionPreimageRef });
    }
    case "promotion-scope-mismatch": {
      const admitted = admittedPreviewFromFixture(syntheticLive, fixtures.positive_admission_fixtures[0]);
      admitted.promotion_records[0].owner_acceptance.accepted_scope_sha256 = "0".repeat(64);
      return validatePreview(admitted, { checkLive: true, exactPositive: false, admissionPreimageRef });
    }
    case "promotion-live-wrong-evidence-bundle": {
      const admitted = admittedPreviewFromFixture(syntheticLive, fixtures.positive_admission_fixtures[0]);
      admitted.promotion_records[0].evidence_refs[0] = clone(admitted.implementation_instances[5].projection_receipt_ref);
      return validatePreview(admitted, { checkLive: true, exactPositive: false, admissionPreimageRef });
    }
    case "promotion-wrong-generation-preimage": {
      const admitted = admittedPreviewFromFixture(syntheticLive, fixtures.positive_admission_fixtures[0]);
      const targetOntology = parseJson(targetOntologyPath);
      const historicalOntologyPreimage = targetOntology.historical_preimage_refs.find((ref) => ref.path.endsWith("/ontology.json"));
      requireCondition(Boolean(historicalOntologyPreimage), "V2_PROMOTION_FIXTURE_INVALID", "wrong-generation-preimage-ref");
      admitted.promotion_records[0].rollback.preimage_ref = clone(historicalOntologyPreimage);
      return validatePreview(admitted, { checkLive: true, exactPositive: false, admissionPreimageRef });
    }
    case "promotion-wrong-owner-route": {
      const admitted = admittedPreviewFromFixture(syntheticLive, fixtures.positive_admission_fixtures[0]);
      admitted.promotion_records[0].owner_acceptance.owner_route = "candidate-self-owner";
      admitted.promotion_records[0].rollback.reversal_owner_route = "candidate-self-owner";
      return validatePreview(admitted, { checkLive: true, exactPositive: false, admissionPreimageRef });
    }
    case "relation-endpoint-type-lie":
      mutated.relation_instances[0].source_type_ref = "architecture.EnumRepresentationUnit";
      return validatePreview(mutated, { checkLive: false, exactPositive: false });
    case "relation-receipt-mismatch":
      mutated.relation_instances[0].evidence_refs[1] = clone(mutated.implementation_instances[5].projection_receipt_ref);
      return validatePreview(mutated, { checkLive: true, exactPositive: false });
    case "implementation-target-binding-mismatch":
      mutated.implementation_instances[0].language_realizations[0].provider_id = "forged-provider-v1";
      return validatePreview(mutated, { checkLive: true, exactPositive: false });
    case "derived-projection-drift":
      mutated.derived_projection[0].admission_status = "admitted";
      return validatePreview(mutated, { checkLive: false, exactPositive: false });
    case "derived-relation-projection-drift":
      mutated.derived_relation_projection[0].admission_status = "admitted";
      return validatePreview(mutated, { checkLive: false, exactPositive: false });
    case "relation-blueprint-drift":
      mutated.relation_instance_blueprints[0].reason = "invented resolved endpoints";
      return validatePreview(mutated, { checkLive: false, exactPositive: true });
    case "dangling-definition-source": {
      const usedSource = collectDefinitionSourceIds(syntheticLive)[0];
      syntheticLive.definition_source_refs = syntheticLive.definition_source_refs.filter((row) => row.source_id !== usedSource);
      return validateDefinitionSourceClosure(syntheticLive);
    }
    case "self-stale-live-source":
      syntheticLive.migration_evidence_refs.push(clone(syntheticLive.historical_preimage_refs[0]));
      return validateLiveSourceSeparation(syntheticLive);
    case "escaping-file-ref":
      mutated.implementation_instances[0].candidate_ref.path = "../../outside-repository-candidate.json";
      return validatePreview(mutated, { checkLive: true, exactPositive: false });
    case "duplicate-semantic-edge": {
      const duplicate = clone(mutated.relation_instances[0]);
      duplicate.relation_instance_id = `${duplicate.relation_instance_id}.duplicate`;
      mutated.relation_instances.push(duplicate);
      mutated.derived_relation_projection.push(deriveRelationProjectionRow(duplicate));
      return validatePreview(mutated, { checkLive: false, exactPositive: false });
    }
    case "relation-axis-inflation":
      mutated.relation_instances[0].lifecycle_axes.definition_status = "stable";
      Object.assign(mutated.derived_relation_projection[0], deriveRelationProjectionRow(mutated.relation_instances[0]));
      return validatePreview(mutated, { checkLive: false, exactPositive: true });
    case "supporting-identity-mismatch": {
      const live = clone(syntheticLive);
      const supporting = clone(fixtures.positive_supporting_endpoint_fixture.supporting_instance);
      const relation = clone(fixtures.positive_supporting_endpoint_fixture.relation_instance);
      supporting.supporting_instance_id = "forged.policy-strategy-contract/v1";
      relation.target_instance_ref = supporting.supporting_instance_id;
      live.supporting_instances.push(supporting);
      live.derived_supporting_projection.push(deriveSupportingProjectionRow(supporting));
      live.relation_instances.push(relation);
      live.derived_relation_projection.push(deriveRelationProjectionRow(relation));
      return validatePreview(live, { checkLive: true, exactPositive: false });
    }
    case "supporting-relation-admission": {
      const live = clone(syntheticLive);
      const supporting = clone(fixtures.positive_supporting_endpoint_fixture.supporting_instance);
      const relation = clone(fixtures.positive_supporting_endpoint_fixture.relation_instance);
      relation.lifecycle_axes.admission_status = "admitted";
      relation.lifecycle_axes.authority_effect = "canonical-admission";
      live.supporting_instances.push(supporting);
      live.derived_supporting_projection.push(deriveSupportingProjectionRow(supporting));
      live.relation_instances.push(relation);
      live.derived_relation_projection.push(deriveRelationProjectionRow(relation));
      return validatePreview(live, { checkLive: true, exactPositive: false });
    }
    case "unsupported-reversal-lifecycle":
      mutated.implementation_instances[0].lifecycle_axes.admission_status = "suspended";
      if (jsonSchemaAccepts(historicalOntologySchemaPath, mutated, historicalPromotionSchemaPath)) {
        failure("V2_JSON_SCHEMA_HOSTILE_ACCEPTED", hostileId);
      }
      failure("V2_JSON_SCHEMA_REJECTED", hostileId);
      break;
    case "schema-nonstring-meta-type":
      mutated.implementation_instances[0].canonical_meta_type_ref = 3;
      if (jsonSchemaAccepts(historicalOntologySchemaPath, mutated, historicalPromotionSchemaPath)) {
        failure("V2_JSON_SCHEMA_HOSTILE_ACCEPTED", hostileId);
      }
      failure("V2_JSON_SCHEMA_REJECTED", hostileId);
      break;
    case "schema-malformed-promotion-id": {
      const record = clone(fixtures.positive_admission_fixtures[0].record);
      record.promotion_id = "bad promotion id";
      if (jsonSchemaAccepts(historicalPromotionSchemaPath, record, historicalPromotionSchemaPath)) {
        failure("V2_PROMOTION_SCHEMA_HOSTILE_ACCEPTED", hostileId);
      }
      failure("V2_PROMOTION_SCHEMA_REJECTED", hostileId);
      break;
    }
    default:
      failure("V2_HOSTILE_UNKNOWN", hostileId);
  }
}

function validateHostiles(fixtures, preview) {
  requireCondition(fixtures.expected_kill_count === 37 && fixtures.fixtures.length === 37, "V2_HOSTILE_CATALOGUE_INVALID", "count");
  const ids = fixtures.fixtures.map((row) => row.hostile_id);
  requireCondition(new Set(ids).size === ids.length, "V2_HOSTILE_CATALOGUE_INVALID", "duplicate-id");
  const results = [];
  for (const fixture of fixtures.fixtures) {
    let observed = null;
    try {
      executeHostile(fixture.hostile_id, preview, fixtures);
    } catch (error) {
      observed = error.code ?? String(error.message).split(":")[0];
    }
    requireCondition(observed === fixture.expected_code, "V2_HOSTILE_SURVIVED", `${fixture.hostile_id}:${observed ?? "pass"}`);
    results.push({ hostile_id: fixture.hostile_id, status: "killed", finding_code: observed });
  }
  return results;
}

function validateReports(migrationMap) {
  const report = parseJson(resolve(proposalRoot, "refresh-report.json"));
  requireCondition(report.schema_version === "ape.invoke-refresh-report.v1", "V2_REFRESH_REPORT_INVALID", "schema");
  requireCondition(report.mode === "refresh", "V2_REFRESH_REPORT_INVALID", "mode");
  requireCondition(report.activation_source === "direct-user" && report.mutation_mode === "proposal-only" && report.mutation_mode_source === "explicit", "V2_REFRESH_REPORT_INVALID", "activation");
  requireCondition(report.phase_status === "pass" && report.phase_status_basis?.artifact_complete === true && report.phase_status_basis?.refresh_authoring_blocker_count === 0, "V2_REFRESH_REPORT_INVALID", "phase");
  requireCondition(report.handoff_status === "gated" && report.result === "pass" && report.mutation_ready === false, "V2_REFRESH_REPORT_INVALID", "lifecycle");
  requireCondition(report.authority_effect === "none", "V2_REFRESH_REPORT_INVALID", "authority");
  for (const legacyKey of ["activation", "refresh_signals", "technique_trace", "next_action", "target_count", "applied_target_count"]) {
    requireCondition(!Object.hasOwn(report, legacyKey), "V2_REFRESH_REPORT_INVALID", `legacy-${legacyKey}`);
  }
  requireCondition(Array.isArray(report.execution_path) && report.execution_path.length === 5, "V2_REFRESH_REPORT_INVALID", "execution-path");
  requireCondition(report.execution_path[0].stage_id === "bind-source-preimages" && report.execution_path.at(-1).stage_id === "request-fresh-owner-acceptance", "V2_REFRESH_REPORT_INVALID", "execution-order");
  const sourceEvidence = [...report.source_evidence].sort((a, b) => byteCompare(a.path, b.path));
  const sourceInventory = [...migrationMap.source_inventory.entries].sort((a, b) => byteCompare(a.path, b.path));
  requireCondition(canonicalJson(sourceEvidence) === canonicalJson(sourceInventory), "V2_REFRESH_REPORT_INVALID", "source-evidence");
  requireCondition(report.source_inventory.count === 15 && report.source_inventory.size_bytes === 304885 && report.source_inventory.sha256 === migrationMap.source_inventory.sha256, "V2_REFRESH_REPORT_INVALID", "source-inventory");
  const expectedTargets = migrationMap.proposed_live_target_inventory.map((target) => ({
    path: target.path,
    operation: target.operation === "add" ? "create" : "modify",
    preimage: target.operation === "add"
      ? { state: "absent" }
      : { state: "present", sha256: target.preimage_sha256, size_bytes: target.preimage_size_bytes },
    owner: "DomainSpec architecture-property ontology owner"
  }));
  requireCondition(canonicalJson(report.target_inventory) === canonicalJson(expectedTargets), "V2_REFRESH_REPORT_INVALID", "target-inventory");
  const targetPaths = expectedTargets.map((row) => row.path);
  requireCondition(canonicalJson(report.target_artifacts) === canonicalJson(targetPaths), "V2_REFRESH_REPORT_INVALID", "target-artifacts");
  const allowedSignalTypes = new Set(["evidence_added", "blocker_opened", "blocker_resolved", "status_changed", "route_changed", "artifact_drift", "no_op"]);
  requireCondition(Array.isArray(report.source_signals) && report.source_signals.length === 8, "V2_REFRESH_REPORT_INVALID", "signals-count");
  const signalIds = new Set();
  const signalTargetPaths = new Set();
  for (const signal of report.source_signals) {
    requireExactKeys(signal, ["id", "source_path", "signal_type", "target_artifacts", "claim", "evidence", "confidence", "mutation_safety"], "V2_REFRESH_REPORT_INVALID", `signal-${signal.id}`);
    requireCondition(!signalIds.has(signal.id) && /^RS-00[1-8]$/.test(signal.id), "V2_REFRESH_REPORT_INVALID", `signal-id-${signal.id}`);
    signalIds.add(signal.id);
    requireCondition(allowedSignalTypes.has(signal.signal_type) && ["high", "medium", "low"].includes(signal.confidence) && ["safe", "needs_review", "blocked"].includes(signal.mutation_safety), "V2_REFRESH_REPORT_INVALID", `signal-enum-${signal.id}`);
    requireCondition(sourceInventory.some((row) => row.path === signal.source_path), "V2_REFRESH_REPORT_INVALID", `signal-source-${signal.id}`);
    for (const targetPath of signal.target_artifacts) {
      requireCondition(targetPaths.includes(targetPath), "V2_REFRESH_REPORT_INVALID", `signal-target-${signal.id}`);
      signalTargetPaths.add(targetPath);
    }
  }
  requireCondition(canonicalJson([...signalTargetPaths].sort(byteCompare)) === canonicalJson([...targetPaths].sort(byteCompare)), "V2_REFRESH_REPORT_INVALID", "signal-target-coverage");
  requireCondition(Array.isArray(report.delta_summary) && report.delta_summary.length === 3, "V2_REFRESH_REPORT_INVALID", "delta-summary");
  requireCondition(Array.isArray(report.proposed_changes) && report.proposed_changes.length === 5 && report.applied_changes.length === 0 && report.skipped_changes.length === 3, "V2_REFRESH_REPORT_INVALID", "changes");
  for (const change of report.proposed_changes) {
    requireCondition(change.signal_ids.length > 0 && change.signal_ids.every((id) => signalIds.has(id)), "V2_REFRESH_REPORT_INVALID", `${change.change_id}:signals`);
    requireCondition(change.target_artifacts.length > 0 && change.target_artifacts.every((path) => targetPaths.includes(path)), "V2_REFRESH_REPORT_INVALID", `${change.change_id}:targets`);
  }
  const expectedTechniques = ["sequence", "owner_boundary_check", "artifact_contract_bridge", "validation_loop", "concrete_path_evidence", "residue_ledger", "approval_semantics_map"];
  requireCondition(report.dispatch_trace?.full_dispatch_required === false && report.dispatch_trace?.full_dispatch_validation.startsWith("not-required"), "V2_REFRESH_REPORT_INVALID", "dispatch");
  const techniques = report.dispatch_trace.selected_techniques;
  requireCondition(canonicalJson(techniques.map((row) => row.technique_id)) === canonicalJson(expectedTechniques), "V2_REFRESH_REPORT_INVALID", "techniques");
  for (const technique of techniques) {
    requireExactKeys(technique, ["technique_id", "activation_trigger", "affected_phase_or_artifact", "validation_expectation"], "V2_REFRESH_REPORT_INVALID", `technique-${technique.technique_id}`);
    requireCondition([technique.activation_trigger, technique.affected_phase_or_artifact, technique.validation_expectation].every((value) => typeof value === "string" && value.length > 0), "V2_REFRESH_REPORT_INVALID", `technique-detail-${technique.technique_id}`);
  }
  requireCondition(report.dispatch_trace.skipped_techniques.length === 3 && report.dispatch_trace.skipped_techniques.every((row) => row.technique_id && row.reason), "V2_REFRESH_REPORT_INVALID", "skipped-techniques");
  const material = report.material_package;
  requireCondition(material.required === false && material.receipt_present === false && material.schema_valid === false && material.patch_verdict === "not-applicable", "V2_REFRESH_REPORT_INVALID", "material-package");
  requireCondition(material.mutation_handoff === "gated" && material.dependency_result === "not-applicable" && material.owner_boundary_result === "pass" && material.publication_boundary_result === "pass", "V2_REFRESH_REPORT_INVALID", "material-boundaries");
  requireCondition(material.lifecycle_owner === "DomainSpec architecture-property ontology owner" && material.authority_class === "private" && material.publication_class === "internal", "V2_REFRESH_REPORT_INVALID", "material-owner");
  requireCondition(Array.isArray(report.blockers) && report.blockers.length === 3, "V2_REFRESH_REPORT_INVALID", "blockers");
  const blockerScopes = new Map(report.blockers.map((row) => [row.scope, row]));
  requireCondition(blockerScopes.get("apply-authorization")?.status === "open" && blockerScopes.get("target-lifecycle")?.status === "deferred" && blockerScopes.get("audit")?.status === "open", "V2_REFRESH_REPORT_INVALID", "blocker-status");
  requireCondition(report.blocker_scopes["refresh-authoring"] === 0 && report.blocker_scopes["apply-authorization"] === 1 && report.blocker_scopes["target-lifecycle"] === 1 && report.blocker_scopes.audit === 1, "V2_REFRESH_REPORT_INVALID", "blocker-scopes");
  requireCondition(Array.isArray(report.validation) && report.validation.length === 3 && report.validation[0].result === "pass" && report.validation[1].result === "pass" && report.validation[2].result === "pending", "V2_REFRESH_REPORT_INVALID", "validation");
  requireCondition(report.proposal_output_inventory?.status === "terminal-binding-pending" && report.proposal_output_inventory?.binding_artifact === "PROPOSAL-RECEIPT.json", "V2_REFRESH_REPORT_INVALID", "output-inventory");
  requireCondition(report.owner_acceptance.required === true && report.owner_acceptance.status === "pending", "V2_REFRESH_REPORT_INVALID", "owner-gate");
  requireCondition(report.next_route === "deferred", "V2_REFRESH_REPORT_INVALID", "next-route");
  const markdown = readFileSync(resolve(proposalRoot, "REFRESH-REPORT.md"), "utf8");
  const proposal = readFileSync(resolve(proposalRoot, "REFRESH-PATCH-PROPOSAL.md"), "utf8");
  const migrationPlan = readFileSync(resolve(proposalRoot, "migration/MIGRATION-PLAN.md"), "utf8");
  for (const phrase of ["proposal-only", "not-admitted", "PromotionRecord", "owner acceptance", "does not migrate", "37/37", "supporting_instances"]) {
    requireCondition(markdown.includes(phrase) || proposal.includes(phrase), "V2_REFRESH_REPORT_INVALID", phrase);
  }
  for (const phrase of ["raw bytes", "Any PromotionRecord", "reversal/export schema"]) {
    requireCondition(markdown.includes(phrase) || proposal.includes(phrase) || migrationPlan.includes(phrase), "V2_REFRESH_REPORT_INVALID", phrase);
  }
}

function verifyApplyRef(ref, code = "APPLY_REF_STALE") {
  const path = resolve(applyRoot, ref.path);
  const relativePath = relative(applyRoot, path);
  requireCondition(relativePath !== "" && !relativePath.startsWith("..") && !isAbsolute(relativePath), "APPLY_PATH_ESCAPE", ref.path);
  assertRegularFile(path, code);
  const realRelative = relative(realpathSync(applyRoot), realpathSync(path));
  requireCondition(realRelative !== "" && !realRelative.startsWith("..") && !isAbsolute(realRelative), "APPLY_PATH_ESCAPE", ref.path);
  const bytes = readFileSync(path);
  requireCondition(bytes.length === ref.size_bytes && sha256(bytes) === ref.sha256, code, ref.path);
  return bytes;
}

function validateApplyFileSet() {
  const actual = collectFiles(applyRoot);
  const allowed = expectedApplyFiles;
  requireCondition(!actual.includes("APPLY-PACKAGE-RECEIPT.json"), "APPLY_RECEIPT_NOT_TERMINAL", "present-before-fresh-exact-byte-owner-acceptance");
  for (const path of actual) requireCondition(allowed.includes(path), "APPLY_PACKAGE_SCOPE_INVALID", path);
  for (const path of expectedApplyFiles.filter((path) => path !== "VALIDATION-RESULT.json")) {
    requireCondition(actual.includes(path), "APPLY_PACKAGE_FILE_MISSING", path);
  }
  requireCondition(actual.length === 21, "APPLY_PACKAGE_SCOPE_INVALID", `expected-21-files:${actual.length}`);
  for (const relativePath of actual) {
    const bytes = readFileSync(resolve(applyRoot, relativePath));
    let text;
    try {
      text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    } catch {
      failure("APPLY_PACKAGE_UTF8_INVALID", relativePath);
    }
    requireCondition(text.endsWith("\n"), "APPLY_PACKAGE_FINAL_NEWLINE_INVALID", relativePath);
    requireCondition(!text.includes("\r"), "APPLY_PACKAGE_CR_INVALID", relativePath);
    requireCondition(!text.split("\n").some((line) => /[ \t]+$/.test(line)), "APPLY_PACKAGE_TRAILING_WHITESPACE", relativePath);
  }
}

function validateAcceptedBinding() {
  const receiptPath = resolve(acceptedProposalRoot, "PROPOSAL-RECEIPT.json");
  const receiptBytes = readFileSync(receiptPath);
  requireCondition(receiptBytes.length === 13957 && sha256(receiptBytes) === acceptedProposalReceiptSha256, "APPLY_ACCEPTED_RECEIPT_STALE", "proposal-receipt");
  const receipt = JSON.parse(receiptBytes.toString("utf8"));
  requireCondition(receipt.result === "pass" && receipt.proposal_material_inventory.count === 12 && receipt.proposal_material_inventory.size_bytes === 401295 && receipt.proposal_material_inventory.sha256 === "f8ac5b875b90a016dcc25f236f6eac3e957728e3c13a4e56ad5b311395d55d0b", "APPLY_ACCEPTED_RECEIPT_INVALID", "inventory");
  const rows = receipt.proposal_material_inventory.materials
    .map((entry) => {
      const bytes = readFileSync(resolve(acceptedProposalRoot, entry.path));
      requireCondition(bytes.length === entry.size_bytes && sha256(bytes) === entry.sha256, "APPLY_ACCEPTED_PROPOSAL_STALE", entry.path);
      return `${entry.sha256}\t${entry.size_bytes}\t${entry.path}\n`;
    })
    .sort((a, b) => byteCompare(a.split("\t").at(-1), b.split("\t").at(-1)))
    .join("");
  requireCondition(sha256(Buffer.from(rows, "utf8")) === receipt.proposal_material_inventory.sha256, "APPLY_ACCEPTED_PROPOSAL_STALE", "aggregate");
  const acceptance = parseJson(resolve(applyRoot, "ACCEPTANCE-EVIDENCE.json"));
  requireCondition(acceptance.decision === "authorized-package-authoring-from-historical-proposal-base" && acceptance.accepted_proposal_receipt.sha256 === sha256(receiptBytes) && acceptance.proposal_binding?.status === "historical-base-only" && acceptance.proposal_binding?.fresh_exact_byte_owner_acceptance === "required-and-absent" && acceptance.historical_proposal_acceptance === "accepted" && acceptance.amended_package_acceptance === "absent", "APPLY_ACCEPTANCE_INVALID", "decision");
  requireCondition(acceptance.schema_installation_authorization === "absent" && acceptance.apply_authorization === "absent" && acceptance.candidate_migration_authorization === "absent" && acceptance.promotion_authorization === "absent" && acceptance.authority_effect === "none", "APPLY_AUTHORITY_INFLATION", "acceptance");
}

function archivedMigrationMap(migrationMap) {
  const map = clone(migrationMap);
  const base = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T165705Z-wp-rmt-001-ontology-v2-apply-package/material/preimages/projects/domainspec-v2/development/implementation-conformance/ontology-experiment";
  for (const entry of map.source_inventory.entries) {
    if (entry.role === "v1_ontology") entry.path = `${base}/ontology.json`;
    if (entry.role === "v1_projection") entry.path = `${base}/domain-meta-types.projection.json`;
  }
  return map;
}

function validateBoundSources(migrationMap) {
  const archiveMap = archivedMigrationMap(migrationMap);
  for (const entry of archiveMap.source_inventory.entries) verifyFileRef(entry);
  const originalRows = [...migrationMap.source_inventory.entries]
    .sort((a, b) => byteCompare(a.path, b.path))
    .map((entry) => `${entry.sha256}\t${entry.size_bytes}\t${entry.path}\n`)
    .join("");
  requireCondition(migrationMap.source_inventory.entry_count === 15 && migrationMap.source_inventory.total_size_bytes === 304885, "APPLY_SOURCE_INVENTORY_INVALID", "shape");
  requireCondition(sha256(Buffer.from(originalRows, "utf8")) === "d4ca7e9205e795daf0d90467b62b2866823fa5ea551b85eeeed6b147e3d2059f", "APPLY_SOURCE_INVENTORY_INVALID", "digest");
  validateV1Continuity(archiveMap);
}

function validateRawPreimages(migrationMap) {
  const material = parseJson(resolve(applyRoot, "material/MATERIAL-PACKAGE.json"));
  const modified = migrationMap.proposed_live_target_inventory.filter((row) => row.operation === "modify");
  requireCondition(modified.length === 3 && material.changes.filter((row) => row.operation === "modify").length === 3, "APPLY_PREIMAGE_INVENTORY_INVALID", "count");
  for (const target of modified) {
    const change = material.changes.find((row) => row.target_path === target.path);
    requireCondition(change?.preimage?.raw_ref, "APPLY_PREIMAGE_INVENTORY_INVALID", target.path);
    const bytes = verifyApplyRef({ path: change.preimage.raw_ref, sha256: target.preimage_sha256, size_bytes: target.preimage_size_bytes }, "APPLY_RAW_PREIMAGE_STALE");
    if (targetMode === "staged") {
      const liveBytes = readFileSync(resolve(repoRoot, target.path));
      requireCondition(Buffer.compare(bytes, liveBytes) === 0, "APPLY_LIVE_BASELINE_DRIFT", target.path);
    }
  }
  if (targetMode === "staged") validateLivePreimages(migrationMap);
}

function validateStagedMaterial(migrationMap) {
  const material = parseJson(resolve(applyRoot, "material/MATERIAL-PACKAGE.json"));
  const manifest = parseJson(resolve(applyRoot, "apply-manifest.json"));
  requireCondition(material.package_id === "WP-RMT-001-ONTOLOGY-V2-FIVE-TARGET-APPLY-20260813T165705Z" && material.changes.length === 5, "APPLY_MATERIAL_INVALID", "identity");
  requireCondition(material.apply_authorized === false && material.candidate_bytes_changed === false && material.authority_effect === "none", "APPLY_AUTHORITY_INFLATION", "material");
  const targetPaths = migrationMap.proposed_live_target_inventory.map((row) => row.path);
  requireCondition(canonicalJson(material.changes.map((row) => row.target_path)) === canonicalJson(targetPaths), "APPLY_TARGET_INVENTORY_INVALID", "order-and-paths");
  for (const change of material.changes) verifyApplyRef(change.output_ref, "APPLY_POSTIMAGE_STALE");
  requireExactKeys(
    manifest.proposal_binding,
    ["historical_base_receipt_sha256", "schema_authority", "bounded_amendments", "fresh_exact_byte_owner_acceptance"],
    "APPLY_PROPOSAL_BINDING_INVALID",
    "manifest"
  );
  requireCondition(
    manifest.proposal_binding.historical_base_receipt_sha256 === acceptedProposalReceiptSha256 &&
      manifest.proposal_binding.schema_authority === "historical-base-only" &&
      canonicalJson(manifest.proposal_binding.bounded_amendments) === canonicalJson(expectedBoundedSchemaAmendments) &&
      manifest.proposal_binding.fresh_exact_byte_owner_acceptance === "required-and-absent",
    "APPLY_PROPOSAL_BINDING_INVALID",
    "historical-base-and-amendments"
  );
  const historicalSchemaPairs = [
    ["schema/architecture-property-ontology-v2.schema.json", "schema/architecture-property-ontology-v2.schema.json"],
    ["schema/promotion-record-v1.schema.json", "schema/promotion-record-v1.schema.json"]
  ];
  for (const [proposalRelative, targetRelative] of historicalSchemaPairs) {
    const historicalBase = readFileSync(resolve(acceptedProposalRoot, proposalRelative));
    const staged = readFileSync(resolve(targetExperimentRoot, targetRelative));
    requireCondition(Buffer.compare(historicalBase, staged) !== 0, "APPLY_SCHEMA_AMENDMENT_MISSING", targetRelative);
  }
}

function validateTargetOntologyAndProjection(migrationMap) {
  const ontology = parseJson(targetOntologyPath);
  const projection = parseJson(targetProjectionPath);
  const ontologySchema = parseJson(ontologySchemaPath);
  const promotionSchema = parseJson(promotionSchemaPath);
  validateSchemas(ontologySchema, promotionSchema);
  requireCondition(jsonSchemaAccepts(ontologySchemaPath, ontology), "APPLY_ONTOLOGY_SCHEMA_INVALID", "target");
  validatePreview(ontology, { expectedCurrentState: true });
  validateCurrentAssertionBindings(ontology);
  requireCondition(ontology.document_mode === "live", "APPLY_ONTOLOGY_LIVE_MODE_INVALID", "document-mode");
  const liveClaim = (ontology.claim_ceiling ?? "").toLowerCase();
  requireCondition(liveClaim.includes("ontology document is materialized as v2") && liveClaim.includes("candidate bytes remain unchanged") && liveClaim.includes("does not admit or promote") && liveClaim.includes("creates no promotionrecord"), "APPLY_ONTOLOGY_LIVE_CLAIM_INVALID", "migrated-document-versus-candidate-bytes");
  validateDefinitionSourceClosure(ontology);
  const archivedOntology = parseJson(resolve(preimageExperimentRoot, "ontology.json"));
  for (const field of ["source_refs", "concept_types", "property_definitions", "relation_definitions", "constraint_operators", "language_projections"]) {
    const targetField = field === "source_refs" ? "definition_source_refs" : field;
    requireCondition(canonicalJson(ontology[targetField]) === canonicalJson(archivedOntology[field]), "APPLY_V1_CATALOGUE_DRIFT", targetField);
  }
  const historicalBase = "projects/domainspec-v2/development/architecture-pattern-enforcement/refreshes/20260813T165705Z-wp-rmt-001-ontology-v2-apply-package/material/preimages/projects/domainspec-v2/development/implementation-conformance/ontology-experiment";
  const expectedHistorical = [
    { path: `${historicalBase}/ontology.json`, sha256: "2b36051d46aae3c730bd8af1b12c26f9718756e347dc068e7d4ff5a6e5c36003", size_bytes: 125549 },
    { path: `${historicalBase}/domain-meta-types.projection.json`, sha256: "1999767ae7c552639278ee71985a98ac2ae3b80c08435ed7ada681f0cc096cc5", size_bytes: 26798 }
  ];
  requireCondition(canonicalJson(ontology.historical_preimage_refs) === canonicalJson(expectedHistorical), "APPLY_HISTORICAL_PREIMAGE_INVALID", "ontology");
  for (const ref of ontology.historical_preimage_refs) verifyFileRef(ref, "APPLY_HISTORICAL_PREIMAGE_STALE");
  requireCondition(ontology.implementation_instances.length === 6 && ontology.supporting_instances.length === 0 && ontology.relation_instances.length === 0 && ontology.relation_instance_blueprints.length === 4 && ontology.promotion_records.length === 0, "APPLY_INSTANCE_CARDINALITY_INVALID", "ontology");
  requireCondition(ontology.implementation_instances.every((row) => row.lifecycle_axes.admission_status === "not-admitted" && row.lifecycle_axes.authority_effect === "none"), "APPLY_ADMISSION_INFLATION", "implementation");
  requireCondition(ontology.relation_instances.every((row) => row.lifecycle_axes.admission_status === "not-admitted" && row.lifecycle_axes.authority_effect === "none"), "APPLY_ADMISSION_INFLATION", "relation");

  const archivedProjection = parseJson(resolve(preimageExperimentRoot, "domain-meta-types.projection.json"));
  const preservedProjection = clone(projection);
  for (const key of ["source_ontology_ref", "historical_projection_ref", "lifecycle_axes", "projection_policy", "derived_projection", "derived_supporting_projection", "derived_relation_projection", "claim_ceiling"]) delete preservedProjection[key];
  preservedProjection.schema_version = "domainspec-meta-type-projection/v1";
  requireCondition(canonicalJson(preservedProjection) === canonicalJson(archivedProjection), "APPLY_V1_PROJECTION_DRIFT", "legacy-rows");
  requireExactKeys(
    projection,
    [
      "authority_effect", "claim_ceiling", "counts", "derived_projection", "derived_relation_projection",
      "derived_supporting_projection", "historical_projection_ref", "lifecycle_axes", "mapping_status_values",
      "meta_types", "projection_id", "projection_policy", "purpose", "schema_version", "source_ontology_ref",
      "source_refs", "status"
    ],
    "APPLY_PROJECTION_INVALID",
    "exact-root-contract"
  );
  requireCondition(
    projection.schema_version === "domainspec-meta-type-projection/v2" &&
      projection.projection_id === "implementation-conformance.domainspec-meta-types" &&
      projection.status === "candidate-read-model" &&
      projection.authority_effect === "none" &&
      projection.purpose === "Expose the canonical DS-D1 meta-type inventory and explicit implementation-conformance coverage without changing DomainSpec formation or maturity authority." &&
      canonicalJson(projection.source_refs) === canonicalJson(archivedProjection.source_refs) &&
      projection.meta_types.length === 25,
    "APPLY_PROJECTION_INVALID",
    "identity-and-purpose"
  );
  requireCondition(canonicalJson(projection.lifecycle_axes) === canonicalJson(["meta_type_maturity", "definition_status", "evidence_status", "admission_status", "authority_effect"]), "APPLY_PROJECTION_INVALID", "axes");
  requireCondition(
    canonicalJson(projection.projection_policy) === canonicalJson({
      kind: "derived-read-model",
      sources: ["implementation_instances", "supporting_instances", "relation_instances", "promotion_records"],
      may_author_lifecycle: false,
      may_grant_authority: false
    }),
    "APPLY_PROJECTION_AUTHORITY_FORBIDDEN",
    "exact-policy"
  );
  requireCondition(
    projection.claim_ceiling === "This derived read model reports ontology-v2 evidence and lifecycle axes. It cannot author admission, create a PromotionRecord, grant authority, migrate candidate bytes, publish, release, deploy, or establish production readiness.",
    "APPLY_PROJECTION_INVALID",
    "claim-ceiling"
  );
  const ontologyBytes = readFileSync(targetOntologyPath);
  requireCondition(projection.source_ontology_ref.sha256 === sha256(ontologyBytes) && projection.source_ontology_ref.size_bytes === ontologyBytes.length, "APPLY_PROJECTION_SOURCE_STALE", "ontology");
  requireCondition(canonicalJson(projection.derived_projection) === canonicalJson(ontology.derived_projection), "APPLY_PROJECTION_DRIFT", "implementation");
  requireCondition(canonicalJson(projection.derived_supporting_projection) === canonicalJson(ontology.derived_supporting_projection), "APPLY_PROJECTION_DRIFT", "supporting");
  requireCondition(canonicalJson(projection.derived_relation_projection) === canonicalJson(ontology.derived_relation_projection), "APPLY_PROJECTION_DRIFT", "relation");
  return { ontology, projection, ontologySchema, promotionSchema };
}

function validateLegacyRunner() {
  const syntax = spawnSync(process.execPath, ["--check", targetValidatorPath], { cwd: repoRoot, encoding: "utf8" });
  requireCondition(syntax.status === 0, "APPLY_VALIDATOR_SYNTAX_INVALID", syntax.stderr.trim());
  const cleanEnvironment = { ...process.env };
  delete cleanEnvironment.DOMAINSPEC_REPOSITORY_ROOT;
  delete cleanEnvironment.DOMAINSPEC_V1_ARCHIVE_ROOT;
  delete cleanEnvironment.DOMAINSPEC_SKIP_APPLY_PACKAGE_REENTRY;
  const run = spawnSync(process.execPath, [targetValidatorPath], {
    cwd: repoRoot,
    env: cleanEnvironment,
    encoding: "utf8",
    maxBuffer: 4 * 1024 * 1024
  });
  requireCondition(run.status === 0, "APPLY_ORDINARY_VALIDATOR_FAILED", (run.stderr || run.stdout).trim());
  const result = JSON.parse(run.stdout);
  requireCondition(result.verdict === "pass" && result.validation_mode === "preserved-v1-continuity" && result.repository_root_source === "discovered-upward" && result.legacy_preimage_source === "ontology-and-projection-bound-immutable-refs" && result.v2_validation?.result === "pass" && result.v2_validation?.cross_schema_binding_assumptions === "pass" && result.v2_validation?.implementation_instances === 6 && result.v2_validation?.supporting_instances === 0 && result.v2_validation?.relation_instances === 0 && result.v2_validation?.relation_instance_blueprints === 4 && result.v2_validation?.promotion_records_present === 0 && result.v2_validation?.positive_admission_simulations === "2/2" && result.v2_validation?.cross_schema_admitted_ontology_integration === "2/2" && result.v2_validation?.owner_gate_hostile_controls === "9/9" && result.v2_validation?.structural_regression_controls === "5/5" && result.v2_validation?.semantic_positive_controls === "3/3" && result.v2_validation?.count_aware_claim_positive_controls === "19/19" && result.v2_validation?.semantic_hostile_controls === "29/29" && result.v2_validation?.projection_root_hostile_controls === "9/9" && result.v2_validation?.standalone_schema_negative_controls === "10/10" && result.v2_validation?.derived_projections === "6/0/0" && result.checks.length === 24 && result.errors.length === 0, "APPLY_ORDINARY_VALIDATOR_FAILED", "result");
  const validatorText = readFileSync(targetValidatorPath, "utf8");
  requireCondition(validatorText.includes('relation.cycle_policy !== "not-applicable" && relation.cycle_policy !== "acyclic"'), "APPLY_LEGACY_REPAIR_INVALID", "applicability-guard");
  requireCondition(!validatorText.includes("validate-apply-package.mjs") && !validatorText.includes("20260813T165705Z") && !validatorText.includes("APPLY_PACKAGE"), "APPLY_LIVE_VALIDATOR_PACKAGE_DEPENDENCY", "timestamped-or-package-validator-reference");
  for (const forbiddenHardlock of [
    "v2 must contain exactly six implementation instances",
    "v2 migration must contain zero PromotionRecords",
    "v2 implementation instances must remain not-admitted",
    "v2 relation instances must remain not-admitted"
  ]) {
    requireCondition(!validatorText.includes(forbiddenHardlock), "APPLY_LIVE_VALIDATOR_ADMISSION_HARDLOCK", forbiddenHardlock);
  }
  for (const relationContractFragment of ["allowed_type_pairs", "V2_RELATION_TYPE_PAIR_INVALID", "assertNoAcyclicRelationCycles", "V2_RELATION_CYCLE"]) {
    requireCondition(validatorText.includes(relationContractFragment), "APPLY_LIVE_VALIDATOR_RELATION_CONTRACT_MISSING", relationContractFragment);
  }
  const wouldReject = (valueEffect, cyclePolicy) => valueEffect === "value-constraining" && cyclePolicy !== "not-applicable" && cyclePolicy !== "acyclic";
  requireCondition(!wouldReject("value-constraining", "not-applicable") && !wouldReject("value-constraining", "acyclic") && wouldReject("value-constraining", "allow"), "APPLY_LEGACY_REPAIR_INVALID", "negative-control");

  const simulationRoot = mkdtempSync(resolve(applyRoot, ".installed-path-simulation-"));
  let simulationRun;
  try {
    const simulatedExperimentRoot = resolve(simulationRoot, "projects/domainspec-v2/development/implementation-conformance/ontology-experiment");
    mkdirSync(resolve(simulatedExperimentRoot, "schema"), { recursive: true });
    for (const relativePath of [
      "ontology.json",
      "domain-meta-types.projection.json",
      "validate-ontology.mjs",
      "schema/architecture-property-ontology-v2.schema.json",
      "schema/promotion-record-v1.schema.json"
    ]) {
      copyFileSync(resolve(targetExperimentRoot, relativePath), resolve(simulatedExperimentRoot, relativePath));
    }
    simulationRun = spawnSync(process.execPath, [resolve(simulatedExperimentRoot, "validate-ontology.mjs")], {
      cwd: repoRoot,
      env: cleanEnvironment,
      encoding: "utf8",
      maxBuffer: 4 * 1024 * 1024
    });
  } finally {
    rmSync(simulationRoot, { recursive: true, force: false });
  }
  requireCondition(!existsSync(simulationRoot), "APPLY_INSTALLED_SIMULATION_RESIDUE", simulationRoot);
  requireCondition(simulationRun?.status === 0, "APPLY_INSTALLED_SIMULATION_FAILED", (simulationRun?.stderr || simulationRun?.stdout || "no-result").trim());
  const simulationResult = JSON.parse(simulationRun.stdout);
  requireCondition(simulationResult.verdict === "pass" && simulationResult.repository_root_source === "discovered-upward" && simulationResult.legacy_preimage_source === "ontology-and-projection-bound-immutable-refs" && simulationResult.v2_validation?.result === "pass" && simulationResult.v2_validation?.cross_schema_binding_assumptions === "pass" && simulationResult.v2_validation?.implementation_instances === 6 && simulationResult.v2_validation?.supporting_instances === 0 && simulationResult.v2_validation?.relation_instances === 0 && simulationResult.v2_validation?.relation_instance_blueprints === 4 && simulationResult.v2_validation?.promotion_records_present === 0 && simulationResult.v2_validation?.positive_admission_simulations === "2/2" && simulationResult.v2_validation?.cross_schema_admitted_ontology_integration === "2/2" && simulationResult.v2_validation?.owner_gate_hostile_controls === "9/9" && simulationResult.v2_validation?.structural_regression_controls === "5/5" && simulationResult.v2_validation?.semantic_positive_controls === "3/3" && simulationResult.v2_validation?.count_aware_claim_positive_controls === "19/19" && simulationResult.v2_validation?.semantic_hostile_controls === "29/29" && simulationResult.v2_validation?.projection_root_hostile_controls === "9/9" && simulationResult.v2_validation?.standalone_schema_negative_controls === "10/10" && simulationResult.v2_validation?.derived_projections === "6/0/0" && simulationResult.errors.length === 0, "APPLY_INSTALLED_SIMULATION_FAILED", "result");
  return result;
}

function validatePackageDocuments() {
  const acceptanceBytes = readFileSync(resolve(applyRoot, "ACCEPTANCE-EVIDENCE.json"));
  const materialBytes = readFileSync(resolve(applyRoot, "material/MATERIAL-PACKAGE.json"));
  const receiptBytes = readFileSync(resolve(applyRoot, "material/MATERIAL-RECEIPT.json"));
  const manifest = parseJson(resolve(applyRoot, "apply-manifest.json"));
  const receipt = parseJson(resolve(applyRoot, "material/MATERIAL-RECEIPT.json"));
  const report = parseJson(resolve(applyRoot, "refresh-report.json"));
  requireCondition(manifest.acceptance_evidence_ref.sha256 === sha256(acceptanceBytes) && manifest.acceptance_evidence_ref.size_bytes === acceptanceBytes.length, "APPLY_MANIFEST_STALE", "acceptance");
  requireCondition(manifest.material_package_ref.sha256 === sha256(materialBytes) && manifest.material_package_ref.size_bytes === materialBytes.length, "APPLY_MANIFEST_STALE", "material");
  requireCondition(manifest.material_receipt_ref.sha256 === sha256(receiptBytes) && manifest.material_receipt_ref.size_bytes === receiptBytes.length, "APPLY_MANIFEST_STALE", "receipt");
  requireCondition(receipt.material_package_ref.sha256 === sha256(materialBytes) && receipt.result === "pass", "APPLY_MATERIAL_RECEIPT_INVALID", "binding");
  for (const [documentName, document] of [["manifest", manifest], ["material", JSON.parse(materialBytes.toString("utf8"))], ["material-receipt", receipt], ["report", report]]) {
    requireCondition(document.historical_proposal_acceptance === "accepted" && document.amended_package_acceptance === "absent" && document.schema_installation_authorization === "absent", "APPLY_ACCEPTANCE_CLAIM_INVALID", documentName);
  }
  requireCondition(manifest.live_apply_authorized === false && manifest.candidate_migration_authorized === false && manifest.promotion_record_creation_authorized === false && manifest.authority_effect === "none", "APPLY_AUTHORITY_INFLATION", "manifest");
  requireCondition(manifest.validation_contract.acceptance_claim_regressions === 4 && JSON.parse(materialBytes.toString("utf8")).acceptance_claim_regressions === 4 && receipt.acceptance_claim_regressions === "4/4 one positive and three current-acceptance hostiles" && report.validation.acceptance_claim_regressions === "4/4 one positive and three current-acceptance hostiles", "APPLY_ACCEPTANCE_CLAIM_INVALID", "regression-bindings");
  requireCondition(report.phase_status === "pass" && report.independent_audit === "pending" && report.terminal_receipt === "absent-until-independent-pass", "APPLY_REPORT_INVALID", "status");
  requireCondition(report.apply_authorization === "absent" && report.candidate_migration_authorization === "absent" && report.promotion_record_creation_authorization === "absent" && report.live_targets_mutated === false && report.candidate_bytes_changed === false && report.authority_effect === "none", "APPLY_AUTHORITY_INFLATION", "report");
  const markdown = readFileSync(resolve(applyRoot, "REFRESH-REPORT.md"), "utf8");
  const packageMarkdown = readFileSync(resolve(applyRoot, "APPLY-PACKAGE.md"), "utf8");
  for (const phrase of ["not-admitted", "zero PromotionRecords", "authority `none`", "independent exact-byte audit", "Apply authorization: absent", "reversal/export schema"]) {
    requireCondition(markdown.includes(phrase) || packageMarkdown.includes(phrase), "APPLY_REPORT_INVALID", phrase);
  }
  for (const [documentName, text] of [["refresh-markdown", markdown], ["package-markdown", packageMarkdown]]) {
    requireCondition(text.includes("Historical proposal acceptance: accepted") && text.includes("Amended package acceptance: absent") && text.includes("Schema installation authorization: absent"), "APPLY_ACCEPTANCE_CLAIM_INVALID", documentName);
    requireCondition(!/\b(?:current|amended)?\s*(?:schema\s+)?package acceptance:\s*accepted\b/i.test(text) && !/\bschema acceptance:\s*accepted\b/i.test(text), "APPLY_ACCEPTANCE_CLAIM_INVALID", `${documentName}:unqualified-current-acceptance`);
  }
}

function validateRollbackBoundary(ontology) {
  requireCondition(ontology.promotion_records.length === 0, "APPLY_ROLLBACK_BLOCKED", "promotion-records-present");
  requireCondition(ontology.derived_projection.every((row) => row.admission_status !== "admitted") && ontology.derived_supporting_projection.every((row) => row.admission_status !== "admitted") && ontology.derived_relation_projection.every((row) => row.admission_status !== "admitted"), "APPLY_ROLLBACK_BLOCKED", "admitted-projection");
  const manifest = parseJson(resolve(applyRoot, "apply-manifest.json"));
  requireCondition(manifest.rollback.restore_modified_targets_from_raw_preimages === true && manifest.rollback.remove_added_schema_targets === true && manifest.rollback.automatic === false && manifest.rollback.blocked_after_any_promotion_record === true && manifest.rollback.future_reversal_export_schema_required === true, "APPLY_ROLLBACK_CONTRACT_INVALID", "manifest");
}

function main() {
  if (!v2Only) validateApplyFileSet();
  const migrationMap = parseJson(resolve(proposalRoot, "migration/migration-map.json"));
  const fixtures = parseJson(fixturesPath);
  validateAcceptedBinding();
  validateRelationOwnershipDecision();
  validateBoundSources(migrationMap);
  validateRawPreimages(migrationMap);
  validateStagedMaterial(migrationMap);
  const { ontology } = validateTargetOntologyAndProjection(migrationMap);
  const jsonSchemaVersion = validateExecutableJsonSchema();
  const integratedAdmissionCount = validatePositiveAdmissions(fixtures, ontology);
  validateSupportingEndpointCapability(fixtures);
  const historicalSyntheticLive = parseJson(resolve(proposalRoot, "preview/ontology-v2.synthetic-live.json"));
  const hostileResults = validateHostiles(fixtures, historicalSyntheticLive);
  const legacyResult = validateLegacyRunner();
  const acceptanceClaimRegressions = validateAcceptanceClaimContract();
  validateRollbackBoundary(ontology);
  if (!v2Only) validatePackageDocuments();
  const output = {
    schema_version: "domainspec-architecture-property-ontology-v2-apply-package-validation/v1",
    package_id: "WP-RMT-001-ONTOLOGY-V2-FIVE-TARGET-APPLY-20260813T165705Z",
    result: "pass",
    target_mode: targetMode,
    validations: {
      accepted_proposal_receipt: "exact",
      accepted_proposal_materials: "12/12",
      relation_ownership_decision: "REL-A selected from canonical REL-A/B/D gate",
      decision_evidence: "3/3 exact refs and canonical prefilter replay",
      proposal_schema_authority: "historical-base-only; bounded amendments require fresh exact-byte owner acceptance",
      acceptance_claim_regressions: acceptanceClaimRegressions,
      bound_source_inventory: "15/15",
      live_target_preimages: targetMode === "staged" ? "5/5" : "post-apply-mode-not-a-baseline-check",
      raw_modified_target_preimages: "3/3 exact bytes",
      staged_or_live_postimages: "5/5 exact material bindings",
      v1_continuity: `pass, ${legacyResult.checks.filter((check) => !check.startsWith("self-contained ontology v2")).length} legacy check groups`,
      ordinary_no_environment_validator: `pass, ${legacyResult.checks.length} combined check groups`,
      installed_path_no_environment_simulation: "pass",
      live_validator_v2_checks: "self-contained-no-timestamped-apply-package-dependency",
      live_validator_positive_admission_simulations: "2/2 implementation-and-relation",
      live_validator_owner_gate_hostiles: "9/9",
      live_validator_structural_regressions: "5/5",
      live_validator_semantic_positives: "3/3",
      live_validator_count_aware_claim_positives: "19/19",
      live_validator_semantic_hostiles: "29/29",
      live_validator_projection_root_hostiles: "9/9",
      live_validator_standalone_schema_negatives: "10/10",
      v1_catalogue_continuity: "6/6 definition-source-and-definition-catalogues",
      schema_contracts: "2/2",
      cross_schema_binding_assumptions: "pass",
      full_admitted_ontology_cross_schema_integration: `${integratedAdmissionCount}/2 implementation-and-relation`,
      executable_json_schema_target: "1/1",
      executable_promotion_record_fixtures: "3/3 one-standalone-plus-two-integrated-admissions",
      implementation_instances: "6/6",
      supporting_instances_present: "0",
      exact_relation_instances: "0/0 materialized",
      relation_blueprints: "4/4 governed deferred",
      promotion_records_present: "0",
      synthetic_owner_gated_admission_paths: "2/2 implementation-and-relation",
      synthetic_supporting_endpoint_capability: "1/1 non-admissible-in-v2",
      lifecycle_axes_separated: "5/5",
      hostile_controls: "37/37",
      derived_projections: "6/0/0 exact",
      rollback_boundary: "pass",
      package_scope_and_hygiene: v2Only ? "not-run-v2-only" : "20/20 non-result materials plus reserved validation-result slot",
      package_documents: v2Only ? "not-run-v2-only" : "5/5"
    },
    hostile_results: hostileResults,
    toolchain: {
      python: "python3",
      jsonschema: jsonSchemaVersion,
      draft: "2020-12"
    },
    owner_gate: { ...expectedOwnerGate },
    authority_effect: "none",
    errors: [],
    claim_ceiling: "Validation supports only the exact staged five-target apply package. It does not authorize or perform live apply, candidate migration, implementation or relation admission, PromotionRecord creation, candidate promotion, publication, release, deployment, or production readiness."
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  const output = {
    schema_version: "domainspec-architecture-property-ontology-v2-apply-package-validation/v1",
    package_id: "WP-RMT-001-ONTOLOGY-V2-FIVE-TARGET-APPLY-20260813T165705Z",
    result: "fail",
    errors: [String(error.message)],
    authority_effect: "none"
  };
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  process.exitCode = 1;
}
