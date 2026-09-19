import { createHash } from "node:crypto";
import { lstatSync, readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

import {
  sha256Canonical,
  validateConcernRecord,
  validateRepositoryObservation,
  type ConcernJoinV1,
  type PropertyResult,
} from "../adapters/typescript/operation-persistence-observer.ts";
import { validateUnitOfWorkObservation } from "../adapters/typescript/operation-transaction-observer.ts";
import { validateEventBoundaryObservation } from "../adapters/typescript/operation-event-boundary-observer.ts";

export const OPERATION_PROFILE_ID =
  "APE.ArchitectureProfile.TypeScriptOperationApplication/candidate-v1" as const;
export const OPERATION_DENOMINATOR_SHA256 =
  "7aa69ff1927bbd26e1cd8bde453baae17cde326881b66f3d93dc48c6f344ab86" as const;
export const OPERATION_PROFILE_FILE_SHA256 =
  "d5986482ead3233897b3b1049db688b1d3428b4a1b37f0ed91a295639ddac300" as const;
export const OPERATION_PROFILE_CANONICAL_SHA256 =
  "f25b57185357d2a4914ee6b2d2c649d9d3dcfdb05d6dac7a8c726cbcddd00a83" as const;
export const OPERATION_APPLICABILITY_FILE_SHA256 =
  "ec18926d1537479e5788355c25a0c51aff5f2370ade93906adc0fa517ea65c95" as const;
export const OPERATION_FIXTURE_FILE_SHA256 =
  "29125586b2bf8cdb5823e6814bcb48162a5b04841b6dcc9b0799a7a2721b81c8" as const;
export const OPERATION_HOSTILES_FILE_SHA256 =
  "cf3c02e6d5839568fd77b8dac6ab5e2c720d227f5b8162e93d21790f16d5f090" as const;

const OPERATION_FIXTURE_REF =
  "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/operation-profile/poker-team.fixture.json" as const;
const REQUIRED_MATERIAL_PATHS = {
  subject: "validation/poker-team/backend/src/use-cases/player/create-player.ts",
  "packet-schema":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/contracts/rmt-profile-binding-packet.schema.json",
  "packet-validator":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/validators/rmt-profile-binding-packet.ts",
  "profile-schema":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/profiles/typescript-operation-application-profile.schema.json",
  profile:
    "projects/domainspec-v2/development/architecture-pattern-enforcement/profiles/typescript-operation-application-profile.json",
  applicability:
    "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/operation-profile/applicability.json",
  "dependency-observer":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/operation-dependency-observer.ts",
  "boundary-observer":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/operation-boundary-observer.ts",
  "cost-observer":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/operation-cost-observer.ts",
  "persistence-observer":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/operation-persistence-observer.ts",
  "transaction-observer":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/operation-transaction-observer.ts",
  "event-observer":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/operation-event-boundary-observer.ts",
  fixture: OPERATION_FIXTURE_REF,
  hostiles:
    "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/operation-profile/hostiles.json",
  evaluator:
    "projects/domainspec-v2/development/architecture-pattern-enforcement/evaluators/operation-profile-evaluator.ts",
  "receipt-schema":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/evidence/WP-APE-OP-PROFILE-001/operation-type-completion-receipt.schema.json",
} as const;

const APPLICABILITY_CASE_CANONICAL_SHA256: Readonly<Record<string, string>> = {
  "AOP-APP-001-poker-create-player":
    "da8402f6939e7bdf1ef1997fef267e55b42c5f5fe4a16106b7e000b7e85a97b9",
  "AOP-APP-002-pure-operation":
    "722f8aa377c3dc4dfba78635305b69c09c7f3796cf73dc85b94f86c8beef932c",
  "AOP-APP-003-unresolved-infrastructure-discriminators":
    "d38d71deac0159bc10ccb99b5d0e3419620bda18bdc41a8951aaefafee31fe82",
};

export type Applicability = "applicable" | "not-applicable" | "owner-blocked";

export interface OperationProfilePropertyV1 {
  property_id: string;
  value_domain: { kind: "enum"; values: string[] };
  valid_subjects: ["Operation"];
  observation_stage: "boundary" | "dependency" | "integration" | "cost";
  owner_route: string;
  forbidden_inferences: string[];
  applicability_predicate: {
    kind: string;
    expression: string;
    when_true: "applicable";
    when_false: "not-applicable";
    when_unresolved: "owner-blocked";
  };
  portable_semantics: false;
}

export interface OperationArchitectureProfileV1 {
  schema_version: "ape.architecture-profile/v1";
  profile_id: typeof OPERATION_PROFILE_ID;
  version: string;
  language: "typescript";
  subject_meta_type_id: "Operation";
  evidence_lane: "candidate-local-prototype";
  portable_semantics: false;
  rmt_semantic_policy: {
    mode: "reference-only";
    rule_ordering: "not-promoted";
    operation_contract_ref: string;
    operation_contract_sha256: string;
  };
  properties: OperationProfilePropertyV1[];
  property_denominator: {
    ordered_property_ids: string[];
    count: number;
    sha256: typeof OPERATION_DENOMINATOR_SHA256;
  };
  authority_effect: "none";
}

export interface ApplicabilityRowV1 {
  property_id: string;
  applicability: Applicability;
  basis: string;
  evidence_ref: string;
}

export interface ApplicabilityCaseV1 {
  case_id: string;
  subject_id: string;
  basis: string;
  applicability_results: ApplicabilityRowV1[];
  applicable_property_ids: string[];
  non_applicable_property_ids: string[];
  owner_blocked_applicability_ids: string[];
  unaccounted_property_ids: string[];
}

export interface RawEvidenceRefV1 {
  ref: string;
  sha256: string;
}

export interface PropertyEvaluationV1 {
  property_id: string;
  result: PropertyResult;
  expected_value: unknown;
  observed_value: unknown;
  result_envelope_ref: string;
  result_envelope_sha256: string;
  diagnostic: string;
  owner_route: string;
  raw_evidence: RawEvidenceRefV1[];
  joins: ConcernJoinV1[];
  authority_effect: "none";
}

interface PropertyResultEnvelopeV1 {
  schema_version: "ape.operation-property-result-envelope/v1";
  envelope_id: string;
  envelope_ref: string;
  subject_id: string;
  property_id: string;
  producer_id: string;
  result: PropertyResult;
  diagnostic: string;
  owner_route: string;
  expected_value_sha256: string;
  observed_value_sha256: string;
  raw_evidence_sha256: string;
  joins_sha256: string;
  producer_output_sha256: string;
  authority_effect: "none";
  envelope_sha256: string;
}

export interface MaterialInventoryItemV1 {
  role: string;
  path: string;
  sha256: string;
  size: number;
}

export interface OperationProfileEvaluationInputV1 {
  repo_root: string;
  evidence_lane: "candidate-local-prototype";
  subject: {
    meta_type_id: "Operation";
    subject_id: string;
    subject_sha256: string;
  };
  profile: OperationArchitectureProfileV1;
  profile_file_sha256: string;
  applicability_case: ApplicabilityCaseV1;
  fixture: {
    fixture_id: string;
    fixture_sha256: string;
    hostile_catalogue_sha256: string;
  };
  property_results: PropertyEvaluationV1[];
  material_inventory: MaterialInventoryItemV1[];
  synchronized_task_session_closeout: false;
  authority_effect: "none";
}

export interface ConstraintFindingV1 extends PropertyEvaluationV1 {
  finding_id: string;
  subject: OperationProfileEvaluationInputV1["subject"];
  applicability: "applicable" | "owner-blocked";
  origin_profile: {
    profile_id: string;
    version: string;
    profile_sha256: string;
  };
}

export interface OperationTypeCompletionReceiptV1 {
  schema_version: "ape.operation-type-completion-receipt/v1";
  receipt_id: string;
  evidence_lane: "candidate-local-prototype";
  result: "pass" | "fail" | "incomplete";
  subject: OperationProfileEvaluationInputV1["subject"];
  profile: {
    profile_id: string;
    version: string;
    profile_sha256: string;
    denominator_sha256: string;
  };
  fixture: OperationProfileEvaluationInputV1["fixture"];
  findings: ConstraintFindingV1[];
  accounting: {
    denominator_count: number;
    applicable_count: number;
    not_applicable_count: number;
    pass_count: number;
    fail_count: number;
    missing_count: number;
    unsupported_count: number;
    owner_blocked_count: number;
    unaccounted_property_ids: string[];
    extra_property_ids: string[];
  };
  material_inventory: MaterialInventoryItemV1[];
  claim_ceiling: {
    statement: "candidate-local Operation architecture evidence only";
    profile_admitted: false;
    semantic_admission: false;
    infrastructure_guarantee_beyond_join: false;
    promotion: false;
    publication: false;
    release: false;
    deployment: false;
    production_readiness: false;
  };
  synchronized_task_session_closeout: false;
  authority_effect: "none";
  receipt_sha256: string;
}

type JsonRecord = Record<string, unknown>;
const SHA256 = /^[a-f0-9]{64}$/;
const PROHIBITED_KEYS = new Set([
  "profile_admission",
  "admitted_profile",
  "semantic_admission",
  "promotion_record",
  "promoted",
  "publication_status",
  "release_status",
  "deployment_status",
  "production_ready",
  "workflow_result",
]);

function fail(diagnostic: string, selector: string): never {
  throw new Error(`${diagnostic} at ${selector}`);
}

function object(value: unknown, selector: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail("AOP_EVALUATOR_SCHEMA", selector);
  }
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, keys: readonly string[], selector: string): void {
  const actual = Object.keys(value).sort();
  const expected = [...keys].sort();
  if (
    actual.length !== expected.length ||
    actual.some((key, index) => key !== expected[index])
  ) {
    fail("AOP_EVALUATOR_SCHEMA", selector);
  }
}

function nonEmpty(value: unknown, selector: string): string {
  if (typeof value !== "string" || value.length === 0) {
    fail("AOP_EVALUATOR_SCHEMA", selector);
  }
  return value;
}

function digest(value: unknown, selector: string): string {
  const candidate = nonEmpty(value, selector);
  if (!SHA256.test(candidate)) fail("AOP_EVALUATOR_SCHEMA", selector);
  return candidate;
}

function repositoryPathPart(ref: string, selector: string): string {
  const pathPart = ref.includes("#") ? ref.slice(0, ref.indexOf("#")) : ref;
  if (
    pathPart.length === 0 ||
    pathPart.includes("\\") ||
    pathPart.includes("\0") ||
    isAbsolute(pathPart)
  ) {
    fail("AOP_EVALUATOR_PATH_ESCAPE", selector);
  }
  return pathPart;
}

function readRepositoryBytes(
  repoRoot: string,
  ref: string,
  selector: string,
): Buffer {
  const pathPart = repositoryPathPart(ref, selector);
  const root = resolve(repoRoot);
  const target = resolve(root, pathPart);
  const lexical = relative(root, target);
  if (
    lexical === "" ||
    lexical === ".." ||
    lexical.startsWith(`..${sep}`) ||
    isAbsolute(lexical)
  ) {
    fail("AOP_EVALUATOR_PATH_ESCAPE", selector);
  }
  try {
    if (lstatSync(target).isSymbolicLink()) {
      fail("AOP_EVALUATOR_PATH_ESCAPE", selector);
    }
    if (!statSync(target).isFile()) fail("AOP_EVALUATOR_MATERIAL_MISSING", selector);
    const realRoot = realpathSync(root);
    const realTarget = realpathSync(target);
    const physical = relative(realRoot, realTarget);
    if (
      physical === "" ||
      physical === ".." ||
      physical.startsWith(`..${sep}`) ||
      isAbsolute(physical)
    ) {
      fail("AOP_EVALUATOR_PATH_ESCAPE", selector);
    }
    return readFileSync(realTarget);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AOP_EVALUATOR_")) {
      throw error;
    }
    fail("AOP_EVALUATOR_MATERIAL_MISSING", selector);
  }
}

function rehashRepositoryRef(
  repoRoot: string,
  ref: string,
  selector: string,
): { sha256: string; size: number } {
  const bytes = readRepositoryBytes(repoRoot, ref, selector);
  return {
    sha256: createHash("sha256").update(bytes).digest("hex"),
    size: bytes.length,
  };
}

function readBoundJsonValue(
  repoRoot: string,
  ref: string,
  selector: string,
): unknown {
  const hashIndex = ref.indexOf("#");
  if (hashIndex < 0) fail("AOP_EVALUATOR_STALE_JOIN", selector);
  const fragment = ref.slice(hashIndex + 1);
  if (!fragment.startsWith("/") || fragment.includes("%")) {
    fail("AOP_EVALUATOR_STALE_JOIN", selector);
  }
  let value: unknown;
  try {
    value = JSON.parse(readRepositoryBytes(repoRoot, ref, selector).toString("utf8"));
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AOP_EVALUATOR_")) {
      throw error;
    }
    fail("AOP_EVALUATOR_STALE_JOIN", selector);
  }
  for (const rawToken of fragment.slice(1).split("/")) {
    if (/~(?![01])/u.test(rawToken)) fail("AOP_EVALUATOR_STALE_JOIN", selector);
    const token = rawToken.replace(/~1/gu, "/").replace(/~0/gu, "~");
    if (Array.isArray(value)) {
      if (!/^(0|[1-9][0-9]*)$/u.test(token)) {
        fail("AOP_EVALUATOR_STALE_JOIN", selector);
      }
      const index = Number(token);
      if (index >= value.length) fail("AOP_EVALUATOR_STALE_JOIN", selector);
      value = value[index];
      continue;
    }
    if (
      value === null ||
      typeof value !== "object" ||
      !Object.prototype.hasOwnProperty.call(value, token)
    ) {
      fail("AOP_EVALUATOR_STALE_JOIN", selector);
    }
    value = (value as JsonRecord)[token];
  }
  return value;
}

function findProhibitedKey(value: unknown, selector = "$"): string | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findProhibitedKey(value[index], `${selector}[${index}]`);
      if (found !== null) return found;
    }
    return null;
  }
  if (value === null || typeof value !== "object") return null;
  for (const [key, child] of Object.entries(value as JsonRecord)) {
    const childSelector = `${selector}.${key}`;
    if (PROHIBITED_KEYS.has(key)) return childSelector;
    const found = findProhibitedKey(child, childSelector);
    if (found !== null) return found;
  }
  return null;
}

function strings(value: unknown, selector: string): string[] {
  if (!Array.isArray(value)) fail("AOP_EVALUATOR_SCHEMA", selector);
  return value.map((entry, index) => nonEmpty(entry, `${selector}[${index}]`));
}

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length;
}

function sameOrdered(left: readonly string[], right: readonly string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameSet(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    [...left].sort().every((value, index) => value === [...right].sort()[index])
  );
}

function validateProfile(value: unknown, fileSha: unknown): OperationArchitectureProfileV1 {
  const profile = object(value, "$.profile");
  exactKeys(
    profile,
    [
      "schema_version",
      "profile_id",
      "version",
      "language",
      "subject_meta_type_id",
      "evidence_lane",
      "portable_semantics",
      "rmt_semantic_policy",
      "properties",
      "property_denominator",
      "authority_effect",
    ],
    "$.profile",
  );
  if (
    profile.schema_version !== "ape.architecture-profile/v1" ||
    profile.profile_id !== OPERATION_PROFILE_ID ||
    profile.language !== "typescript" ||
    profile.subject_meta_type_id !== "Operation" ||
    profile.evidence_lane !== "candidate-local-prototype" ||
    profile.portable_semantics !== false ||
    profile.authority_effect !== "none"
  ) {
    fail("AOP_EVALUATOR_PROFILE_BOUNDARY", "$.profile");
  }
  nonEmpty(profile.version, "$.profile.version");
  if (digest(fileSha, "$.profile_file_sha256") !== OPERATION_PROFILE_FILE_SHA256) {
    fail("AOP_EVALUATOR_STALE_PROFILE", "$.profile_file_sha256");
  }
  if (sha256Canonical(profile) !== OPERATION_PROFILE_CANONICAL_SHA256) {
    fail("AOP_EVALUATOR_STALE_PROFILE", "$.profile");
  }
  const policy = object(profile.rmt_semantic_policy, "$.profile.rmt_semantic_policy");
  exactKeys(
    policy,
    [
      "mode",
      "rule_ordering",
      "operation_contract_ref",
      "operation_contract_sha256",
    ],
    "$.profile.rmt_semantic_policy",
  );
  if (policy.mode !== "reference-only" || policy.rule_ordering !== "not-promoted") {
    fail("AOP_EVALUATOR_SEMANTIC_PROMOTION", "$.profile.rmt_semantic_policy");
  }
  nonEmpty(policy.operation_contract_ref, "$.profile.rmt_semantic_policy.operation_contract_ref");
  digest(
    policy.operation_contract_sha256,
    "$.profile.rmt_semantic_policy.operation_contract_sha256",
  );
  if (!Array.isArray(profile.properties) || profile.properties.length === 0) {
    fail("AOP_EVALUATOR_SCHEMA", "$.profile.properties");
  }
  const properties = profile.properties.map((entry, index) => {
    const property = object(entry, `$.profile.properties[${index}]`);
    exactKeys(
      property,
      [
        "property_id",
        "value_domain",
        "valid_subjects",
        "observation_stage",
        "owner_route",
        "forbidden_inferences",
        "applicability_predicate",
        "portable_semantics",
      ],
      `$.profile.properties[${index}]`,
    );
    const id = nonEmpty(property.property_id, `$.profile.properties[${index}].property_id`);
    if (!id.startsWith("APE.ImplementationProperty.operation.")) {
      fail("AOP_EVALUATOR_SUBJECT_COLLAPSE", `$.profile.properties[${index}].property_id`);
    }
    if (
      !Array.isArray(property.valid_subjects) ||
      property.valid_subjects.length !== 1 ||
      property.valid_subjects[0] !== "Operation" ||
      property.portable_semantics !== false
    ) {
      fail("AOP_EVALUATOR_PROFILE_BOUNDARY", `$.profile.properties[${index}]`);
    }
    nonEmpty(property.owner_route, `$.profile.properties[${index}].owner_route`);
    const forbidden = strings(
      property.forbidden_inferences,
      `$.profile.properties[${index}].forbidden_inferences`,
    );
    if (forbidden.length === 0 || !unique(forbidden)) {
      fail("AOP_EVALUATOR_PROFILE_BOUNDARY", `$.profile.properties[${index}].forbidden_inferences`);
    }
    object(property.value_domain, `$.profile.properties[${index}].value_domain`);
    object(
      property.applicability_predicate,
      `$.profile.properties[${index}].applicability_predicate`,
    );
    return property as unknown as OperationProfilePropertyV1;
  });
  const propertyIds = properties.map((entry) => entry.property_id);
  if (!unique(propertyIds)) fail("AOP_EVALUATOR_DUPLICATE_PROPERTY", "$.profile.properties");
  const denominator = object(profile.property_denominator, "$.profile.property_denominator");
  exactKeys(
    denominator,
    ["ordered_property_ids", "count", "sha256"],
    "$.profile.property_denominator",
  );
  const orderedIds = strings(
    denominator.ordered_property_ids,
    "$.profile.property_denominator.ordered_property_ids",
  );
  const recomputedDenominator = createHash("sha256")
    .update(`${orderedIds.join("\n")}\n`, "utf8")
    .digest("hex");
  if (
    denominator.count !== propertyIds.length ||
    !sameOrdered(orderedIds, propertyIds) ||
    denominator.sha256 !== OPERATION_DENOMINATOR_SHA256 ||
    denominator.sha256 !== recomputedDenominator
  ) {
    fail("AOP_EVALUATOR_DENOMINATOR", "$.profile.property_denominator");
  }
  return profile as unknown as OperationArchitectureProfileV1;
}

function validateApplicability(
  value: unknown,
  propertyIds: readonly string[],
  subjectId: string,
): ApplicabilityCaseV1 {
  const candidate = object(value, "$.applicability_case");
  exactKeys(
    candidate,
    [
      "case_id",
      "subject_id",
      "basis",
      "applicability_results",
      "applicable_property_ids",
      "non_applicable_property_ids",
      "owner_blocked_applicability_ids",
      "unaccounted_property_ids",
    ],
    "$.applicability_case",
  );
  nonEmpty(candidate.case_id, "$.applicability_case.case_id");
  const expectedCaseSha =
    APPLICABILITY_CASE_CANONICAL_SHA256[candidate.case_id as string];
  if (
    expectedCaseSha === undefined ||
    sha256Canonical(candidate) !== expectedCaseSha
  ) {
    fail("AOP_EVALUATOR_STALE_APPLICABILITY", "$.applicability_case");
  }
  if (candidate.subject_id !== subjectId) {
    fail("AOP_EVALUATOR_SUBJECT_MISMATCH", "$.applicability_case.subject_id");
  }
  nonEmpty(candidate.basis, "$.applicability_case.basis");
  if (!Array.isArray(candidate.applicability_results)) {
    fail("AOP_EVALUATOR_SCHEMA", "$.applicability_case.applicability_results");
  }
  const rows = candidate.applicability_results.map((entry, index) => {
    const row = object(entry, `$.applicability_case.applicability_results[${index}]`);
    exactKeys(
      row,
      ["property_id", "applicability", "basis", "evidence_ref"],
      `$.applicability_case.applicability_results[${index}]`,
    );
    nonEmpty(row.property_id, `$.applicability_case.applicability_results[${index}].property_id`);
    if (!["applicable", "not-applicable", "owner-blocked"].includes(row.applicability as string)) {
      fail("AOP_EVALUATOR_SCHEMA", `$.applicability_case.applicability_results[${index}].applicability`);
    }
    nonEmpty(row.basis, `$.applicability_case.applicability_results[${index}].basis`);
    nonEmpty(row.evidence_ref, `$.applicability_case.applicability_results[${index}].evidence_ref`);
    return row as unknown as ApplicabilityRowV1;
  });
  const rowIds = rows.map((row) => row.property_id);
  if (!unique(rowIds) || !sameSet(rowIds, propertyIds)) {
    fail("AOP_EVALUATOR_APPLICABILITY", "$.applicability_case.applicability_results");
  }
  const subsets = {
    applicable: strings(candidate.applicable_property_ids, "$.applicability_case.applicable_property_ids"),
    nonApplicable: strings(
      candidate.non_applicable_property_ids,
      "$.applicability_case.non_applicable_property_ids",
    ),
    ownerBlocked: strings(
      candidate.owner_blocked_applicability_ids,
      "$.applicability_case.owner_blocked_applicability_ids",
    ),
    unaccounted: strings(
      candidate.unaccounted_property_ids,
      "$.applicability_case.unaccounted_property_ids",
    ),
  };
  if (subsets.unaccounted.length !== 0) {
    fail("AOP_EVALUATOR_UNACCOUNTED", "$.applicability_case.unaccounted_property_ids");
  }
  const byKind = {
    applicable: rows.filter((row) => row.applicability === "applicable").map((row) => row.property_id),
    nonApplicable: rows.filter((row) => row.applicability === "not-applicable").map((row) => row.property_id),
    ownerBlocked: rows.filter((row) => row.applicability === "owner-blocked").map((row) => row.property_id),
  };
  if (
    !sameSet(subsets.applicable, byKind.applicable) ||
    !sameSet(subsets.nonApplicable, byKind.nonApplicable) ||
    !sameSet(subsets.ownerBlocked, byKind.ownerBlocked)
  ) {
    fail("AOP_EVALUATOR_APPLICABILITY", "$.applicability_case");
  }
  return candidate as unknown as ApplicabilityCaseV1;
}

function validateJoin(value: unknown, selector: string): ConcernJoinV1 {
  const join = object(value, selector);
  exactKeys(
    join,
    [
      "concern_kind",
      "observation_id",
      "observation_ref",
      "observation_sha256",
      "record_id",
      "record_ref",
      "record_sha256",
      "external_status",
      "external_ceiling",
      "interface_ref",
      "evidence_lane",
    ],
    selector,
  );
  if (!["persistence", "transaction", "failure", "transport", "delivery"].includes(join.concern_kind as string)) {
    fail("AOP_EVALUATOR_SCHEMA", `${selector}.concern_kind`);
  }
  nonEmpty(join.observation_id, `${selector}.observation_id`);
  nonEmpty(join.observation_ref, `${selector}.observation_ref`);
  digest(join.observation_sha256, `${selector}.observation_sha256`);
  nonEmpty(join.record_id, `${selector}.record_id`);
  nonEmpty(join.record_ref, `${selector}.record_ref`);
  digest(join.record_sha256, `${selector}.record_sha256`);
  if (!["admitted", "candidate", "absent"].includes(join.external_status as string)) {
    fail("AOP_EVALUATOR_SCHEMA", `${selector}.external_status`);
  }
  nonEmpty(join.external_ceiling, `${selector}.external_ceiling`);
  if (join.interface_ref !== null) nonEmpty(join.interface_ref, `${selector}.interface_ref`);
  if (!["candidate-local-fixture", "canonical"].includes(join.evidence_lane as string)) {
    fail("AOP_EVALUATOR_SCHEMA", `${selector}.evidence_lane`);
  }
  return join as unknown as ConcernJoinV1;
}

function validateBoundJoin(
  join: ConcernJoinV1,
  propertyId: string,
  repoRoot: string,
  rawEvidencePaths: ReadonlySet<string>,
  selector: string,
): void {
  const recordPath = repositoryPathPart(join.record_ref, `${selector}.record_ref`);
  const observationPath = repositoryPathPart(
    join.observation_ref,
    `${selector}.observation_ref`,
  );
  const isBoundEvidencePath = (path: string): boolean =>
    rawEvidencePaths.has(path) || path === OPERATION_FIXTURE_REF;
  if (!isBoundEvidencePath(recordPath) || !isBoundEvidencePath(observationPath)) {
    fail("AOP_EVALUATOR_STALE_JOIN", selector);
  }

  let boundRecord;
  try {
    boundRecord = validateConcernRecord(
      readBoundJsonValue(repoRoot, join.record_ref, `${selector}.record_ref`),
      `${selector}.bound_record`,
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes("AUTHORITY_GROWTH")) {
      fail("AOP_EVALUATOR_AUTHORITY_GROWTH", `${selector}.bound_record`);
    }
    if (error instanceof Error && error.message.startsWith("AOP_EVALUATOR_")) {
      throw error;
    }
    fail("AOP_EVALUATOR_STALE_JOIN", `${selector}.bound_record`);
  }
  if (
    boundRecord.record_ref !== join.record_ref ||
    boundRecord.record_id !== join.record_id ||
    boundRecord.record_sha256 !== join.record_sha256 ||
    boundRecord.concern_kind !== join.concern_kind ||
    boundRecord.status !== join.external_status ||
    boundRecord.ceiling !== join.external_ceiling ||
    boundRecord.interface_ref !== join.interface_ref ||
    boundRecord.evidence_lane !== join.evidence_lane
  ) {
    fail("AOP_EVALUATOR_STALE_JOIN", `${selector}.bound_record`);
  }

  const boundObservation = readBoundJsonValue(
    repoRoot,
    join.observation_ref,
    `${selector}.observation_ref`,
  );
  const observationShape = object(boundObservation, `${selector}.bound_observation`);
  const schemaVersion = observationShape.schema_version;
  let observation: {
    observation_id: string;
    observation_ref: string;
    observation_sha256: string;
  };
  let allowedConcerns: readonly string[];
  let interfaces: readonly string[];
  try {
    if (schemaVersion === "ape.operation.repository-observation/v1") {
      const decoded = validateRepositoryObservation(
        boundObservation,
        `${selector}.bound_observation`,
      );
      observation = decoded;
      allowedConcerns = ["persistence"];
      interfaces = [decoded.interface_ref];
    } else if (schemaVersion === "ape.operation.unit-of-work-observation/v1") {
      const decoded = validateUnitOfWorkObservation(boundObservation);
      observation = decoded;
      allowedConcerns = ["transaction", "failure"];
      interfaces = [decoded.interface_ref];
    } else if (schemaVersion === "ape.operation.event-boundary-observation/v1") {
      const decoded = validateEventBoundaryObservation(boundObservation);
      observation = decoded;
      allowedConcerns = ["transport", "delivery"];
      const acceptedOperations =
        join.concern_kind === "transport"
          ? new Set(["send-attempt", "provider-acceptance"])
          : new Set(["delivery-observation"]);
      interfaces = decoded.evidence
        .filter((entry) => acceptedOperations.has(entry.operation_kind))
        .map((entry) => entry.interface_ref);
    } else {
      fail("AOP_EVALUATOR_STALE_JOIN", `${selector}.bound_observation.schema_version`);
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AOP_EVALUATOR_")) {
      throw error;
    }
    fail("AOP_EVALUATOR_STALE_JOIN", `${selector}.bound_observation`);
  }
  if (
    observation.observation_id !== join.observation_id ||
    observation.observation_ref !== join.observation_ref ||
    observation.observation_sha256 !== join.observation_sha256 ||
    !allowedConcerns.includes(join.concern_kind) ||
    join.interface_ref === null ||
    !interfaces.includes(join.interface_ref)
  ) {
    fail("AOP_EVALUATOR_STALE_JOIN", `${selector}.bound_observation`);
  }

  const allowedPropertyObservationPairs: Readonly<Record<string, readonly string[]>> = {
    "APE.ImplementationProperty.operation.repository-boundary": [
      "ape.operation.repository-observation/v1",
    ],
    "APE.ImplementationProperty.operation.unit-of-work-boundary": [
      "ape.operation.unit-of-work-observation/v1",
    ],
    "APE.ImplementationProperty.operation.durable-intent-stage": [
      "ape.operation.repository-observation/v1",
      "ape.operation.unit-of-work-observation/v1",
      "ape.operation.event-boundary-observation/v1",
    ],
    "APE.ImplementationProperty.operation.external-transport-stage": [
      "ape.operation.event-boundary-observation/v1",
      "ape.operation.unit-of-work-observation/v1",
    ],
  };
  if (!(allowedPropertyObservationPairs[propertyId] ?? []).includes(schemaVersion as string)) {
    fail("AOP_EVALUATOR_STALE_JOIN", `${selector}.bound_observation.schema_version`);
  }
}

function validateResultEnvelope(
  row: JsonRecord,
  subjectId: string,
  repoRoot: string,
  selector: string,
): void {
  const envelopeRef = nonEmpty(
    row.result_envelope_ref,
    `${selector}.result_envelope_ref`,
  );
  const envelopeSha = digest(
    row.result_envelope_sha256,
    `${selector}.result_envelope_sha256`,
  );
  if (
    repositoryPathPart(envelopeRef, `${selector}.result_envelope_ref`) !==
      OPERATION_FIXTURE_REF ||
    !envelopeRef.startsWith(`${OPERATION_FIXTURE_REF}#/evaluation_evidence/`)
  ) {
    fail("AOP_EVALUATOR_STALE_RESULT", `${selector}.result_envelope_ref`);
  }

  let envelopeValue: unknown;
  try {
    envelopeValue = readBoundJsonValue(
      repoRoot,
      envelopeRef,
      `${selector}.result_envelope_ref`,
    );
  } catch (error) {
    if (
      error instanceof Error &&
      (error.message.startsWith("AOP_EVALUATOR_PATH_ESCAPE") ||
        error.message.startsWith("AOP_EVALUATOR_MATERIAL_MISSING"))
    ) {
      throw error;
    }
    fail("AOP_EVALUATOR_STALE_RESULT", `${selector}.result_envelope_ref`);
  }
  const envelope = object(envelopeValue, `${selector}.bound_result_envelope`);
  exactKeys(
    envelope,
    [
      "schema_version",
      "envelope_id",
      "envelope_ref",
      "subject_id",
      "property_id",
      "producer_id",
      "result",
      "diagnostic",
      "owner_route",
      "expected_value_sha256",
      "observed_value_sha256",
      "raw_evidence_sha256",
      "joins_sha256",
      "producer_output_sha256",
      "authority_effect",
      "envelope_sha256",
    ],
    `${selector}.bound_result_envelope`,
  );
  const { envelope_sha256: boundEnvelopeSha, ...envelopeBody } = envelope;
  if (
    envelope.schema_version !== "ape.operation-property-result-envelope/v1" ||
    nonEmpty(envelope.envelope_id, `${selector}.bound_result_envelope.envelope_id`).length === 0 ||
    envelope.envelope_ref !== envelopeRef ||
    envelope.subject_id !== subjectId ||
    envelope.property_id !== row.property_id ||
    nonEmpty(envelope.producer_id, `${selector}.bound_result_envelope.producer_id`).length === 0 ||
    envelope.result !== row.result ||
    envelope.diagnostic !== row.diagnostic ||
    envelope.owner_route !== row.owner_route ||
    envelope.authority_effect !== "none" ||
    digest(boundEnvelopeSha, `${selector}.bound_result_envelope.envelope_sha256`) !==
      envelopeSha ||
    sha256Canonical(envelopeBody) !== envelopeSha
  ) {
    fail("AOP_EVALUATOR_STALE_RESULT", `${selector}.bound_result_envelope`);
  }

  const expectedValueSha = digest(
    envelope.expected_value_sha256,
    `${selector}.bound_result_envelope.expected_value_sha256`,
  );
  const observedValueSha = digest(
    envelope.observed_value_sha256,
    `${selector}.bound_result_envelope.observed_value_sha256`,
  );
  const rawEvidenceSha = digest(
    envelope.raw_evidence_sha256,
    `${selector}.bound_result_envelope.raw_evidence_sha256`,
  );
  const joinsSha = digest(
    envelope.joins_sha256,
    `${selector}.bound_result_envelope.joins_sha256`,
  );
  const producerOutputSha = digest(
    envelope.producer_output_sha256,
    `${selector}.bound_result_envelope.producer_output_sha256`,
  );
  if (
    expectedValueSha !== sha256Canonical(row.expected_value) ||
    observedValueSha !== sha256Canonical(row.observed_value) ||
    rawEvidenceSha !== sha256Canonical(row.raw_evidence) ||
    joinsSha !== sha256Canonical(row.joins) ||
    producerOutputSha !==
      sha256Canonical({
        producer_id: envelope.producer_id,
        result: row.result,
        diagnostic: row.diagnostic,
        observed_value: row.observed_value,
      })
  ) {
    fail("AOP_EVALUATOR_STALE_RESULT", `${selector}.bound_result_envelope`);
  }
}

function validatePropertyResults(
  value: unknown,
  repoRoot: string,
  subjectId: string,
  requiredPropertyIds: readonly string[],
): PropertyEvaluationV1[] {
  if (!Array.isArray(value)) fail("AOP_EVALUATOR_SCHEMA", "$.property_results");
  const declaredIds = value.map((entry, index) =>
    nonEmpty(
      object(entry, `$.property_results[${index}]`).property_id,
      `$.property_results[${index}].property_id`,
    ),
  );
  if (!unique(declaredIds)) {
    fail("AOP_EVALUATOR_DUPLICATE_RESULT", "$.property_results");
  }
  if (requiredPropertyIds.some((id) => !declaredIds.includes(id))) {
    fail("AOP_EVALUATOR_UNACCOUNTED", "$.property_results");
  }
  if (declaredIds.some((id) => !requiredPropertyIds.includes(id))) {
    fail("AOP_EVALUATOR_EXTRA_PROPERTY", "$.property_results");
  }
  const rows = value.map((entry, index) => {
    const row = object(entry, `$.property_results[${index}]`);
    exactKeys(
      row,
      [
        "property_id",
        "result",
        "expected_value",
        "observed_value",
        "result_envelope_ref",
        "result_envelope_sha256",
        "diagnostic",
        "owner_route",
        "raw_evidence",
        "joins",
        "authority_effect",
      ],
      `$.property_results[${index}]`,
    );
    nonEmpty(row.property_id, `$.property_results[${index}].property_id`);
    if (!["pass", "fail", "missing", "unsupported", "owner-blocked"].includes(row.result as string)) {
      fail("AOP_EVALUATOR_RESULT_COLLAPSE", `$.property_results[${index}].result`);
    }
    nonEmpty(row.diagnostic, `$.property_results[${index}].diagnostic`);
    nonEmpty(row.owner_route, `$.property_results[${index}].owner_route`);
    if (row.authority_effect !== "none") {
      fail("AOP_EVALUATOR_AUTHORITY_GROWTH", `$.property_results[${index}].authority_effect`);
    }
    if (!Array.isArray(row.raw_evidence) || row.raw_evidence.length === 0) {
      fail("AOP_EVALUATOR_SCHEMA", `$.property_results[${index}].raw_evidence`);
    }
    const rawEvidencePaths = new Set<string>();
    row.raw_evidence.forEach((entry, evidenceIndex) => {
      const raw = object(entry, `$.property_results[${index}].raw_evidence[${evidenceIndex}]`);
      exactKeys(raw, ["ref", "sha256"], `$.property_results[${index}].raw_evidence[${evidenceIndex}]`);
      nonEmpty(raw.ref, `$.property_results[${index}].raw_evidence[${evidenceIndex}].ref`);
      const expected = digest(
        raw.sha256,
        `$.property_results[${index}].raw_evidence[${evidenceIndex}].sha256`,
      );
      const actual = rehashRepositoryRef(
        repoRoot,
        raw.ref as string,
        `$.property_results[${index}].raw_evidence[${evidenceIndex}].ref`,
      );
      if (actual.sha256 !== expected) {
        fail(
          "AOP_EVALUATOR_STALE_EVIDENCE",
          `$.property_results[${index}].raw_evidence[${evidenceIndex}]`,
        );
      }
      rawEvidencePaths.add(
        repositoryPathPart(
          raw.ref as string,
          `$.property_results[${index}].raw_evidence[${evidenceIndex}].ref`,
        ),
      );
    });
    if (!Array.isArray(row.joins)) {
      fail("AOP_EVALUATOR_SCHEMA", `$.property_results[${index}].joins`);
    }
    const joins = row.joins.map((join, joinIndex) =>
      validateJoin(join, `$.property_results[${index}].joins[${joinIndex}]`),
    );
    const joinKinds = joins.map((join) => join.concern_kind);
    if (!unique(joinKinds)) {
      fail("AOP_EVALUATOR_DUPLICATE_JOIN", `$.property_results[${index}].joins`);
    }
    const allowedConcerns: Readonly<Record<string, readonly string[]>> = {
      "APE.ImplementationProperty.operation.repository-boundary": ["persistence"],
      "APE.ImplementationProperty.operation.unit-of-work-boundary": [
        "transaction",
        "failure",
      ],
      "APE.ImplementationProperty.operation.durable-intent-stage": [
        "persistence",
        "transaction",
      ],
      "APE.ImplementationProperty.operation.external-transport-stage": [
        "transport",
        "failure",
        "delivery",
      ],
    };
    const allowed = allowedConcerns[row.property_id as string] ?? [];
    if (joinKinds.some((kind) => !allowed.includes(kind))) {
      fail("AOP_EVALUATOR_CROSS_INFERENCE", `$.property_results[${index}].joins`);
    }
    if (
      joins.some((join) =>
        ["transport", "delivery"].includes(join.concern_kind),
      ) &&
      row.result !== "owner-blocked"
    ) {
      fail(
        "AOP_EVALUATOR_UNADMITTED_SCHEMA_COLLAPSE",
        `$.property_results[${index}].result`,
      );
    }
    joins.forEach((join, joinIndex) =>
      validateBoundJoin(
        join,
        row.property_id as string,
        repoRoot,
        rawEvidencePaths,
        `$.property_results[${index}].joins[${joinIndex}]`,
      ),
    );
    if (
      joins.some(
        (join) =>
          join.evidence_lane !== "canonical" ||
          join.external_status !== "admitted",
      ) &&
      row.result !== "owner-blocked"
    ) {
      fail(
        "AOP_EVALUATOR_EXTERNAL_STATUS_COLLAPSE",
        `$.property_results[${index}].result`,
      );
    }
    validateResultEnvelope(
      row,
      subjectId,
      repoRoot,
      `$.property_results[${index}]`,
    );
    return row as unknown as PropertyEvaluationV1;
  });
  if (!unique(rows.map((row) => row.property_id))) {
    fail("AOP_EVALUATOR_DUPLICATE_RESULT", "$.property_results");
  }
  return rows;
}

function validateMaterials(
  value: unknown,
  repoRoot: string,
): MaterialInventoryItemV1[] {
  if (!Array.isArray(value) || value.length === 0) {
    fail("AOP_EVALUATOR_SCHEMA", "$.material_inventory");
  }
  const requiredRoles = Object.keys(REQUIRED_MATERIAL_PATHS);
  if (value.length > requiredRoles.length) {
    fail("AOP_EVALUATOR_MATERIAL_EXTRA", "$.material_inventory");
  }
  if (value.length < requiredRoles.length) {
    fail("AOP_EVALUATOR_MATERIAL_MISSING", "$.material_inventory");
  }
  const rows = value.map((entry, index) => {
    const row = object(entry, `$.material_inventory[${index}]`);
    exactKeys(row, ["role", "path", "sha256", "size"], `$.material_inventory[${index}]`);
    const role = nonEmpty(row.role, `$.material_inventory[${index}].role`);
    const path = nonEmpty(row.path, `$.material_inventory[${index}].path`);
    if (!Object.prototype.hasOwnProperty.call(REQUIRED_MATERIAL_PATHS, role)) {
      fail("AOP_EVALUATOR_MATERIAL_EXTRA", `$.material_inventory[${index}].role`);
    }
    if (
      path !==
      REQUIRED_MATERIAL_PATHS[role as keyof typeof REQUIRED_MATERIAL_PATHS]
    ) {
      fail("AOP_EVALUATOR_MATERIAL_PATH", `$.material_inventory[${index}].path`);
    }
    const expectedSha = digest(row.sha256, `$.material_inventory[${index}].sha256`);
    if (!Number.isInteger(row.size) || (row.size as number) < 0) {
      fail("AOP_EVALUATOR_SCHEMA", `$.material_inventory[${index}].size`);
    }
    const actual = rehashRepositoryRef(
      repoRoot,
      row.path as string,
      `$.material_inventory[${index}].path`,
    );
    if (actual.sha256 !== expectedSha || actual.size !== row.size) {
      fail("AOP_EVALUATOR_STALE_MATERIAL", `$.material_inventory[${index}]`);
    }
    return row as unknown as MaterialInventoryItemV1;
  });
  if (
    !unique(rows.map((row) => row.path)) ||
    !unique(rows.map((row) => row.role))
  ) {
    fail("AOP_EVALUATOR_MATERIAL_DUPLICATE", "$.material_inventory");
  }
  for (const role of requiredRoles) {
    if (rows.filter((row) => row.role === role).length !== 1) {
      fail("AOP_EVALUATOR_MATERIAL_MISSING", `$.material_inventory[role=${role}]`);
    }
  }
  return [...rows].sort((left, right) => left.path.localeCompare(right.path));
}

export function evaluateOperationProfile(
  value: unknown,
): OperationTypeCompletionReceiptV1 {
  const prohibited = findProhibitedKey(value);
  if (prohibited !== null) fail("AOP_EVALUATOR_AUTHORITY_GROWTH", prohibited);
  const input = object(value, "$");
  exactKeys(
    input,
    [
      "evidence_lane",
      "repo_root",
      "subject",
      "profile",
      "profile_file_sha256",
      "applicability_case",
      "fixture",
      "property_results",
      "material_inventory",
      "synchronized_task_session_closeout",
      "authority_effect",
    ],
    "$",
  );
  if (
    input.evidence_lane !== "candidate-local-prototype" ||
    input.synchronized_task_session_closeout !== false ||
    input.authority_effect !== "none"
  ) {
    fail("AOP_EVALUATOR_AUTHORITY_GROWTH", "$");
  }
  const repoRoot = nonEmpty(input.repo_root, "$.repo_root");
  const subject = object(input.subject, "$.subject");
  exactKeys(subject, ["meta_type_id", "subject_id", "subject_sha256"], "$.subject");
  if (subject.meta_type_id !== "Operation") {
    fail("AOP_EVALUATOR_SUBJECT_COLLAPSE", "$.subject.meta_type_id");
  }
  const subjectId = nonEmpty(subject.subject_id, "$.subject.subject_id");
  digest(subject.subject_sha256, "$.subject.subject_sha256");
  const profile = validateProfile(input.profile, input.profile_file_sha256);
  const propertyIds = profile.property_denominator.ordered_property_ids;
  const applicability = validateApplicability(
    input.applicability_case,
    propertyIds,
    subjectId,
  );
  if (
    applicability.case_id !== "AOP-APP-001-poker-create-player" ||
    applicability.subject_id !== "PokerTeam.CreatePlayer"
  ) {
    fail("AOP_EVALUATOR_FIXTURE_SCOPE", "$.applicability_case");
  }
  const requiredRows = applicability.applicability_results
    .filter((row) => row.applicability !== "not-applicable")
    .map((row) => row.property_id);
  const rows = validatePropertyResults(
    input.property_results,
    repoRoot,
    subjectId,
    requiredRows,
  );
  const resultIds = rows.map((row) => row.property_id);
  const unaccounted = requiredRows.filter((id) => !resultIds.includes(id));
  const extra = resultIds.filter((id) => !requiredRows.includes(id));
  if (unaccounted.length > 0 || extra.length > 0) {
    fail(
      unaccounted.length > 0 ? "AOP_EVALUATOR_UNACCOUNTED" : "AOP_EVALUATOR_EXTRA_PROPERTY",
      "$.property_results",
    );
  }
  const applicabilityById = new Map(
    applicability.applicability_results.map((row) => [row.property_id, row]),
  );
  for (const row of rows) {
    const app = applicabilityById.get(row.property_id);
    if (app?.applicability === "owner-blocked" && row.result !== "owner-blocked") {
      fail("AOP_EVALUATOR_OWNER_BLOCKED_COLLAPSE", `$.property_results[${row.property_id}]`);
    }
  }
  const fixture = object(input.fixture, "$.fixture");
  exactKeys(
    fixture,
    ["fixture_id", "fixture_sha256", "hostile_catalogue_sha256"],
    "$.fixture",
  );
  if (fixture.fixture_id !== "ape.operation-profile.poker-team/v1") {
    fail("AOP_EVALUATOR_FIXTURE_SCOPE", "$.fixture.fixture_id");
  }
  digest(fixture.fixture_sha256, "$.fixture.fixture_sha256");
  digest(fixture.hostile_catalogue_sha256, "$.fixture.hostile_catalogue_sha256");
  const profileSha = input.profile_file_sha256 as string;
  const materials = validateMaterials(input.material_inventory, repoRoot);
  const materialFor = (role: string): MaterialInventoryItemV1 =>
    materials.find((item) => item.role === role)!;
  if (
    materialFor("profile").sha256 !== profileSha ||
    materialFor("applicability").sha256 !== OPERATION_APPLICABILITY_FILE_SHA256 ||
    materialFor("fixture").sha256 !== OPERATION_FIXTURE_FILE_SHA256 ||
    materialFor("hostiles").sha256 !== OPERATION_HOSTILES_FILE_SHA256 ||
    materialFor("subject").sha256 !== subject.subject_sha256 ||
    fixture.fixture_sha256 !== OPERATION_FIXTURE_FILE_SHA256 ||
    fixture.hostile_catalogue_sha256 !== OPERATION_HOSTILES_FILE_SHA256
  ) {
    fail("AOP_EVALUATOR_STALE_MATERIAL", "$.material_inventory");
  }
  const sortedRows = [...rows].sort(
    (left, right) => propertyIds.indexOf(left.property_id) - propertyIds.indexOf(right.property_id),
  );
  const typedSubject = subject as unknown as OperationProfileEvaluationInputV1["subject"];
  const findings: ConstraintFindingV1[] = sortedRows.map((row) => ({
    finding_id: `APE.ConstraintFinding.operation.${row.property_id.split(".").at(-1)}`,
    subject: typedSubject,
    property_id: row.property_id,
    applicability: applicabilityById.get(row.property_id)!.applicability as
      | "applicable"
      | "owner-blocked",
    result: row.result,
    expected_value: row.expected_value,
    observed_value: row.observed_value,
    result_envelope_ref: row.result_envelope_ref,
    result_envelope_sha256: row.result_envelope_sha256,
    origin_profile: {
      profile_id: profile.profile_id,
      version: profile.version,
      profile_sha256: profileSha,
    },
    raw_evidence: row.raw_evidence.map((entry) => ({ ...entry })),
    joins: row.joins.map((entry) => ({ ...entry })),
    diagnostic: row.diagnostic,
    owner_route: row.owner_route,
    authority_effect: "none",
  }));
  const count = (result: PropertyResult) => rows.filter((row) => row.result === result).length;
  const accounting = {
    denominator_count: propertyIds.length,
    applicable_count: applicability.applicable_property_ids.length,
    not_applicable_count: applicability.non_applicable_property_ids.length,
    pass_count: count("pass"),
    fail_count: count("fail"),
    missing_count: count("missing"),
    unsupported_count: count("unsupported"),
    owner_blocked_count: count("owner-blocked"),
    unaccounted_property_ids: [] as string[],
    extra_property_ids: [] as string[],
  };
  if (
    accounting.applicable_count +
      accounting.not_applicable_count +
      applicability.owner_blocked_applicability_ids.length !==
      accounting.denominator_count ||
    accounting.pass_count +
      accounting.fail_count +
      accounting.missing_count +
      accounting.unsupported_count +
      accounting.owner_blocked_count !==
      findings.length
  ) {
    fail("AOP_EVALUATOR_ACCOUNTING", "$.accounting");
  }
  const result: OperationTypeCompletionReceiptV1["result"] =
    accounting.fail_count > 0
      ? "fail"
      : accounting.missing_count > 0 ||
          accounting.unsupported_count > 0 ||
          accounting.owner_blocked_count > 0
        ? "incomplete"
        : "pass";
  const body = {
    schema_version: "ape.operation-type-completion-receipt/v1" as const,
    receipt_id: `APE.TypeCompletionReceipt.Operation.${subjectId}`,
    evidence_lane: "candidate-local-prototype" as const,
    result,
    subject: typedSubject,
    profile: {
      profile_id: profile.profile_id,
      version: profile.version,
      profile_sha256: profileSha,
      denominator_sha256: profile.property_denominator.sha256,
    },
    fixture: fixture as unknown as OperationProfileEvaluationInputV1["fixture"],
    findings,
    accounting,
    material_inventory: materials,
    claim_ceiling: {
      statement: "candidate-local Operation architecture evidence only" as const,
      profile_admitted: false as const,
      semantic_admission: false as const,
      infrastructure_guarantee_beyond_join: false as const,
      promotion: false as const,
      publication: false as const,
      release: false as const,
      deployment: false as const,
      production_readiness: false as const,
    },
    synchronized_task_session_closeout: false as const,
    authority_effect: "none" as const,
  };
  return { ...body, receipt_sha256: sha256Canonical(body) };
}

export function sha256Bytes(bytes: string | Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}
