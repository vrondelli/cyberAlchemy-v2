import { createHash } from "node:crypto";
import { readFileSync, realpathSync, statSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

export const PACKET_SCHEMA_VERSION = "ape.rmt-profile-binding-packet/v1" as const;

export const PROHIBITED_CLAIMS = [
  "semantic admission",
  "infrastructure guarantee beyond a joined record",
  "profile admission",
  "promotion",
  "publication",
  "release",
  "production readiness",
] as const;

const EVIDENCE_LANES = [
  "candidate-local-prototype",
  "canonical-governance",
] as const;
const META_TYPES = ["Operation", "Workflow"] as const;
const PROJECTION_KINDS = [
  "observed",
  "derived",
  "owner-resolved",
  "unsupported",
] as const;
const DEPENDENCY_ROLES = [
  "repository",
  "unit-of-work",
  "event-handler",
  "outbox-repository",
  "transporter",
  "client",
  "clock",
  "generator",
  "hasher",
  "codec",
  "metrics-recorder",
  "workflow-store",
  "scheduler",
  "typed-config",
] as const;
const CONCERN_KINDS = [
  "persistence",
  "transaction",
  "failure",
  "transport",
  "delivery",
  "workflow-runtime",
] as const;
const APPLICABILITY_VALUES = [
  "applicable",
  "not-applicable",
  "owner-blocked",
] as const;
const PROPERTY_RESULTS = [
  "pass",
  "fail",
  "missing",
  "unsupported",
  "owner-blocked",
] as const;

const ROOT_KEYS = [
  "schema_version",
  "packet_id",
  "rmt_subject",
  "predecessor_evidence",
  "profile",
  "observations",
  "bindings",
  "infrastructure_joins",
  "accounting",
  "stale_input",
  "claim_ceiling",
] as const;

const BOUNDARY_GROWTH_KEYS = new Set([
  "selected_swu",
  "selected_unit",
  "execution_status",
  "lifecycle_controller_status",
  "reconciliation_state",
  "provider_instance",
  "mutable_registry_state",
  "registry_state",
  "authority_decision",
]);
const CROSS_INFERENCE_KEYS = new Set([
  "derived_claims",
  "cross_concern_claim",
  "asserted_concern_kinds",
]);

export type PacketDiagnostic =
  | "AOP_PACKET_PASS"
  | "AOP_PACKET_SCHEMA"
  | "AOP_PACKET_PATH_ESCAPE"
  | "AOP_PACKET_STALE_INPUT"
  | "AOP_PACKET_SUBJECT_COLLAPSE"
  | "AOP_PACKET_EVIDENCE_LANE"
  | "AOP_PACKET_RECEIPT"
  | "AOP_PACKET_BOUNDARY_GROWTH"
  | "AOP_PACKET_DENOMINATOR"
  | "AOP_PACKET_APPLICABILITY"
  | "AOP_PACKET_RESULT_ACCOUNTING"
  | "AOP_PACKET_REFERENCE"
  | "AOP_PACKET_JOIN_DUPLICATE"
  | "AOP_PACKET_CROSS_INFERENCE"
  | "AOP_PACKET_RESULT_COLLAPSE"
  | "AOP_PACKET_AUTHORITY_GROWTH";

export type PacketValidationResult =
  | {
      result: "pass";
      diagnostic: "AOP_PACKET_PASS";
      selector: "$";
      evidence_lane: (typeof EVIDENCE_LANES)[number];
      synchronized_task_session_closeout: boolean;
    }
  | {
      result: "block";
      diagnostic: Exclude<PacketDiagnostic, "AOP_PACKET_PASS">;
      selector: string;
      expected_digest?: string;
      actual_digest?: string;
    };

export interface PacketValidationOptions {
  repoRoot: string;
}

class PacketViolation extends Error {
  constructor(
    readonly diagnostic: Exclude<PacketDiagnostic, "AOP_PACKET_PASS">,
    readonly selector: string,
    readonly details: { expected_digest?: string; actual_digest?: string } = {},
  ) {
    super(`${diagnostic} at ${selector}`);
  }
}

type JsonRecord = Record<string, unknown>;

function fail(
  diagnostic: Exclude<PacketDiagnostic, "AOP_PACKET_PASS">,
  selector: string,
  details: { expected_digest?: string; actual_digest?: string } = {},
): never {
  throw new PacketViolation(diagnostic, selector, details);
}

function record(value: unknown, selector: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail("AOP_PACKET_SCHEMA", selector);
  }
  return value as JsonRecord;
}

function array(value: unknown, selector: string): unknown[] {
  if (!Array.isArray(value)) {
    fail("AOP_PACKET_SCHEMA", selector);
  }
  return value;
}

function nonEmptyString(value: unknown, selector: string): string {
  if (typeof value !== "string" || value.length === 0) {
    fail("AOP_PACKET_SCHEMA", selector);
  }
  return value;
}

function sha256String(value: unknown, selector: string): string {
  const digest = nonEmptyString(value, selector);
  if (!/^[a-f0-9]{64}$/.test(digest)) {
    fail("AOP_PACKET_SCHEMA", selector);
  }
  return digest;
}

function booleanValue(value: unknown, selector: string): boolean {
  if (typeof value !== "boolean") {
    fail("AOP_PACKET_SCHEMA", selector);
  }
  return value;
}

function nonNegativeInteger(value: unknown, selector: string): number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    fail("AOP_PACKET_SCHEMA", selector);
  }
  return value as number;
}

function enumValue<const T extends readonly string[]>(
  value: unknown,
  allowed: T,
  selector: string,
): T[number] {
  if (typeof value !== "string" || !allowed.includes(value)) {
    fail("AOP_PACKET_SCHEMA", selector);
  }
  return value as T[number];
}

function exactKeys(
  value: JsonRecord,
  expected: readonly string[],
  selector: string,
): void {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length ||
    actual.some((key, index) => key !== required[index])
  ) {
    fail("AOP_PACKET_SCHEMA", selector);
  }
}

function findKey(
  value: unknown,
  keys: ReadonlySet<string>,
  selector = "$",
): string | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findKey(value[index], keys, `${selector}[${index}]`);
      if (found !== null) return found;
    }
    return null;
  }
  if (value === null || typeof value !== "object") return null;
  for (const [key, child] of Object.entries(value as JsonRecord)) {
    const childSelector = `${selector}.${key}`;
    if (keys.has(key)) return childSelector;
    const found = findKey(child, keys, childSelector);
    if (found !== null) return found;
  }
  return null;
}

function findElevatedAuthorityEffect(
  value: unknown,
  selector = "$.predecessor_evidence.receipt",
): string | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findElevatedAuthorityEffect(
        value[index],
        `${selector}[${index}]`,
      );
      if (found !== null) return found;
    }
    return null;
  }
  if (value === null || typeof value !== "object") return null;
  for (const [key, child] of Object.entries(value as JsonRecord)) {
    const childSelector = `${selector}.${key}`;
    if (key === "authority_effect" && child !== "none") return childSelector;
    const found = findElevatedAuthorityEffect(child, childSelector);
    if (found !== null) return found;
  }
  return null;
}

function hashBytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function implementationPropertyDenominatorDigest(
  propertyIds: readonly string[],
): string {
  return hashBytes(Buffer.from(`${propertyIds.join("\n")}\n`, "utf8"));
}

function referencePath(ref: string): string {
  const hashIndex = ref.indexOf("#");
  return hashIndex === -1 ? ref : ref.slice(0, hashIndex);
}

function resolveRepositoryReference(
  repoRoot: string,
  ref: string,
  selector: string,
): string {
  const pathPart = referencePath(ref);
  if (
    pathPart.length === 0 ||
    pathPart.includes("\\") ||
    pathPart.includes("\0") ||
    isAbsolute(pathPart)
  ) {
    fail("AOP_PACKET_PATH_ESCAPE", selector);
  }
  const normalizedRoot = resolve(repoRoot);
  const absolutePath = resolve(normalizedRoot, pathPart);
  const relativePath = relative(normalizedRoot, absolutePath);
  if (
    relativePath === "" ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  ) {
    fail("AOP_PACKET_PATH_ESCAPE", selector);
  }
  return absolutePath;
}

function verifyLock(
  repoRoot: string,
  ref: unknown,
  expectedDigest: unknown,
  selector: string,
): { path: string; bytes: Buffer; digest: string } {
  const parsedRef = nonEmptyString(ref, `${selector}.ref`);
  const parsedExpected = sha256String(
    expectedDigest,
    `${selector}.expected_digest`,
  );
  const path = resolveRepositoryReference(
    repoRoot,
    parsedRef,
    `${selector}.ref`,
  );
  let bytes: Buffer;
  try {
    if (!statSync(path).isFile()) {
      fail("AOP_PACKET_STALE_INPUT", selector, {
        expected_digest: parsedExpected,
        actual_digest: "missing",
      });
    }
    const realRoot = realpathSync(resolve(repoRoot));
    const realTarget = realpathSync(path);
    const realRelative = relative(realRoot, realTarget);
    if (
      realRelative === "" ||
      realRelative === ".." ||
      realRelative.startsWith(`..${sep}`) ||
      isAbsolute(realRelative)
    ) {
      fail("AOP_PACKET_PATH_ESCAPE", `${selector}.ref`);
    }
    bytes = readFileSync(path);
  } catch (error) {
    if (error instanceof PacketViolation) throw error;
    fail("AOP_PACKET_STALE_INPUT", selector, {
      expected_digest: parsedExpected,
      actual_digest: "missing",
    });
  }
  const digest = hashBytes(bytes!);
  if (digest !== parsedExpected) {
    fail("AOP_PACKET_STALE_INPUT", selector, {
      expected_digest: parsedExpected,
      actual_digest: digest,
    });
  }
  return { path, bytes: bytes!, digest };
}

function parseJson(bytes: Buffer, selector: string): JsonRecord {
  try {
    return record(JSON.parse(bytes.toString("utf8")), selector);
  } catch (error) {
    if (error instanceof PacketViolation) throw error;
    fail("AOP_PACKET_RECEIPT", selector);
  }
}

function receiptSynchronizedFact(receipt: JsonRecord): boolean {
  if ("synchronized_task_session_closeout" in receipt) {
    return booleanValue(
      receipt.synchronized_task_session_closeout,
      "$.predecessor_evidence.receipt.synchronized_task_session_closeout",
    );
  }
  if (receipt.lifecycle !== undefined) {
    const lifecycle = record(
      receipt.lifecycle,
      "$.predecessor_evidence.receipt.lifecycle",
    );
    if ("synchronized_task_session_closeout" in lifecycle) {
      return booleanValue(
        lifecycle.synchronized_task_session_closeout,
        "$.predecessor_evidence.receipt.lifecycle.synchronized_task_session_closeout",
      );
    }
  }
  return false;
}

function receiptLane(
  receipt: JsonRecord,
  receiptRef: string,
): (typeof EVIDENCE_LANES)[number] {
  if (receipt.evidence_lane !== undefined) {
    return enumValue(
      receipt.evidence_lane,
      EVIDENCE_LANES,
      "$.predecessor_evidence.receipt.evidence_lane",
    );
  }
  if (
    receipt.schema_version ===
      "domainspec.meta-type-candidate-projection-receipt/v1" &&
    referencePath(receiptRef).includes(
      "/development/remaining-meta-types/receipts/",
    )
  ) {
    return "canonical-governance";
  }
  fail("AOP_PACKET_EVIDENCE_LANE", "$.predecessor_evidence.receipt_ref");
}

function assertStringArray(
  value: unknown,
  selector: string,
): string[] {
  return array(value, selector).map((entry, index) =>
    nonEmptyString(entry, `${selector}[${index}]`),
  );
}

function sameOrderedValues(left: readonly string[], right: readonly string[]): boolean {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

function assertUnique(values: readonly string[], selector: string): void {
  if (new Set(values).size !== values.length) {
    fail("AOP_PACKET_DENOMINATOR", selector);
  }
}

export function validateRmtProfileBindingPacket(
  input: unknown,
  options: PacketValidationOptions,
): PacketValidationResult {
  try {
    const boundaryGrowth = findKey(input, BOUNDARY_GROWTH_KEYS);
    if (boundaryGrowth !== null) {
      fail("AOP_PACKET_BOUNDARY_GROWTH", boundaryGrowth);
    }
    const crossInference = findKey(input, CROSS_INFERENCE_KEYS);
    if (crossInference !== null) {
      fail("AOP_PACKET_CROSS_INFERENCE", crossInference);
    }

    const packet = record(input, "$");
    exactKeys(packet, ROOT_KEYS, "$");
    if (packet.schema_version !== PACKET_SCHEMA_VERSION) {
      fail("AOP_PACKET_SCHEMA", "$.schema_version");
    }
    nonEmptyString(packet.packet_id, "$.packet_id");

    const subject = record(packet.rmt_subject, "$.rmt_subject");
    exactKeys(
      subject,
      ["work_pack_id", "meta_type_id", "subject_id", "realization_contract"],
      "$.rmt_subject",
    );
    if (
      Array.isArray(subject.meta_type_id) ||
      subject.meta_type_id === "Operation|Workflow" ||
      subject.meta_type_id === "Operation/Workflow"
    ) {
      fail("AOP_PACKET_SUBJECT_COLLAPSE", "$.rmt_subject.meta_type_id");
    }
    if (subject.work_pack_id !== "WP-RMT-002") {
      fail("AOP_PACKET_SCHEMA", "$.rmt_subject.work_pack_id");
    }
    const metaType = enumValue(
      subject.meta_type_id,
      META_TYPES,
      "$.rmt_subject.meta_type_id",
    );
    const subjectId = nonEmptyString(
      subject.subject_id,
      "$.rmt_subject.subject_id",
    );
    const realization = record(
      subject.realization_contract,
      "$.rmt_subject.realization_contract",
    );
    exactKeys(realization, ["ref", "digest"], "$.rmt_subject.realization_contract");

    const predecessor = record(
      packet.predecessor_evidence,
      "$.predecessor_evidence",
    );
    exactKeys(
      predecessor,
      [
        "required_evidence_lane",
        "receipt_ref",
        "receipt_digest",
        "result",
        "claim_ceiling",
        "synchronized_task_session_closeout",
      ],
      "$.predecessor_evidence",
    );
    const requiredLane = enumValue(
      predecessor.required_evidence_lane,
      EVIDENCE_LANES,
      "$.predecessor_evidence.required_evidence_lane",
    );
    if (predecessor.result !== "pass") {
      fail("AOP_PACKET_RECEIPT", "$.predecessor_evidence.result");
    }
    const predecessorClaimCeiling = nonEmptyString(
      predecessor.claim_ceiling,
      "$.predecessor_evidence.claim_ceiling",
    );
    const predecessorSynchronized = booleanValue(
      predecessor.synchronized_task_session_closeout,
      "$.predecessor_evidence.synchronized_task_session_closeout",
    );

    const staleInput = record(packet.stale_input, "$.stale_input");
    exactKeys(staleInput, ["result", "mismatches"], "$.stale_input");
    const declaredMismatches = array(
      staleInput.mismatches,
      "$.stale_input.mismatches",
    );
    if (staleInput.result !== "pass" || declaredMismatches.length !== 0) {
      fail("AOP_PACKET_STALE_INPUT", "$.stale_input");
    }

    const realizationLock = verifyLock(
      options.repoRoot,
      realization.ref,
      realization.digest,
      "$.rmt_subject.realization_contract",
    );
    const receiptRef = nonEmptyString(
      predecessor.receipt_ref,
      "$.predecessor_evidence.receipt_ref",
    );
    const receiptLock = verifyLock(
      options.repoRoot,
      receiptRef,
      predecessor.receipt_digest,
      "$.predecessor_evidence.receipt",
    );
    const receipt = parseJson(
      receiptLock.bytes,
      "$.predecessor_evidence.receipt",
    );
    if (receipt.result !== "pass") {
      fail("AOP_PACKET_RECEIPT", "$.predecessor_evidence.receipt.result");
    }
    if (receipt.work_pack_id !== undefined && receipt.work_pack_id !== "WP-RMT-002") {
      fail("AOP_PACKET_RECEIPT", "$.predecessor_evidence.receipt.work_pack_id");
    }
    const elevatedReceiptAuthority = findElevatedAuthorityEffect(receipt);
    if (elevatedReceiptAuthority !== null) {
      fail("AOP_PACKET_AUTHORITY_GROWTH", elevatedReceiptAuthority);
    }
    const actualReceiptCeiling = nonEmptyString(
      receipt.claim_ceiling,
      "$.predecessor_evidence.receipt.claim_ceiling",
    );
    if (actualReceiptCeiling !== predecessorClaimCeiling) {
      fail("AOP_PACKET_RECEIPT", "$.predecessor_evidence.claim_ceiling");
    }
    const actualLane = receiptLane(receipt, receiptRef);
    const actualSynchronized = receiptSynchronizedFact(receipt);
    if (
      actualLane !== requiredLane ||
      actualSynchronized !== predecessorSynchronized ||
      (actualLane === "candidate-local-prototype" && predecessorSynchronized)
    ) {
      fail("AOP_PACKET_EVIDENCE_LANE", "$.predecessor_evidence");
    }

    if (receipt.candidate_projection !== undefined) {
      const projection = record(
        receipt.candidate_projection,
        "$.predecessor_evidence.receipt.candidate_projection",
      );
      if (
        projection.path !== referencePath(nonEmptyString(realization.ref, "$.rmt_subject.realization_contract.ref")) ||
        projection.sha256 !== realizationLock.digest ||
        (projection.candidate_id !== undefined && projection.candidate_id !== subjectId)
      ) {
        fail("AOP_PACKET_RECEIPT", "$.predecessor_evidence.receipt.candidate_projection");
      }
    }
    const expectedTaskId = metaType === "Operation" ? "TASK-RMT-OP" : "TASK-RMT-WF";
    if (receipt.task_id !== undefined && receipt.task_id !== expectedTaskId) {
      fail("AOP_PACKET_RECEIPT", "$.predecessor_evidence.receipt.task_id");
    }

    const profile = record(packet.profile, "$.profile");
    exactKeys(
      profile,
      [
        "architecture_profile_id",
        "architecture_profile_version",
        "implementation_property_denominator_digest",
      ],
      "$.profile",
    );
    nonEmptyString(profile.architecture_profile_id, "$.profile.architecture_profile_id");
    nonEmptyString(
      profile.architecture_profile_version,
      "$.profile.architecture_profile_version",
    );
    const declaredDenominatorDigest = sha256String(
      profile.implementation_property_denominator_digest,
      "$.profile.implementation_property_denominator_digest",
    );

    const accounting = record(packet.accounting, "$.accounting");
    exactKeys(
      accounting,
      [
        "denominator_property_ids",
        "applicability_results",
        "applicable_property_ids",
        "non_applicable_property_ids",
        "owner_blocked_applicability_ids",
        "property_results",
        "result_counts",
        "unaccounted_property_ids",
      ],
      "$.accounting",
    );
    const denominator = assertStringArray(
      accounting.denominator_property_ids,
      "$.accounting.denominator_property_ids",
    );
    if (denominator.length === 0) {
      fail("AOP_PACKET_DENOMINATOR", "$.accounting.denominator_property_ids");
    }
    assertUnique(denominator, "$.accounting.denominator_property_ids");
    if (implementationPropertyDenominatorDigest(denominator) !== declaredDenominatorDigest) {
      fail("AOP_PACKET_DENOMINATOR", "$.profile.implementation_property_denominator_digest");
    }

    const applicabilityRows = array(
      accounting.applicability_results,
      "$.accounting.applicability_results",
    ).map((entry, index) => {
      const row = record(entry, `$.accounting.applicability_results[${index}]`);
      exactKeys(
        row,
        ["property_id", "applicability", "basis", "evidence_ref"],
        `$.accounting.applicability_results[${index}]`,
      );
      return {
        propertyId: nonEmptyString(
          row.property_id,
          `$.accounting.applicability_results[${index}].property_id`,
        ),
        applicability: enumValue(
          row.applicability,
          APPLICABILITY_VALUES,
          `$.accounting.applicability_results[${index}].applicability`,
        ),
        basis: nonEmptyString(
          row.basis,
          `$.accounting.applicability_results[${index}].basis`,
        ),
        evidenceRef: nonEmptyString(
          row.evidence_ref,
          `$.accounting.applicability_results[${index}].evidence_ref`,
        ),
      };
    });
    const applicabilityIds = applicabilityRows.map((row) => row.propertyId);
    if (
      applicabilityRows.length !== denominator.length ||
      new Set(applicabilityIds).size !== applicabilityIds.length ||
      denominator.some((propertyId) => !applicabilityIds.includes(propertyId)) ||
      applicabilityIds.some((propertyId) => !denominator.includes(propertyId))
    ) {
      fail("AOP_PACKET_APPLICABILITY", "$.accounting.applicability_results");
    }
    const applicabilityById = new Map(
      applicabilityRows.map((row) => [row.propertyId, row.applicability]),
    );
    const applicable = denominator.filter(
      (propertyId) => applicabilityById.get(propertyId) === "applicable",
    );
    const nonApplicable = denominator.filter(
      (propertyId) => applicabilityById.get(propertyId) === "not-applicable",
    );
    const ownerBlocked = denominator.filter(
      (propertyId) => applicabilityById.get(propertyId) === "owner-blocked",
    );
    const declaredApplicable = assertStringArray(
      accounting.applicable_property_ids,
      "$.accounting.applicable_property_ids",
    );
    const declaredNonApplicable = assertStringArray(
      accounting.non_applicable_property_ids,
      "$.accounting.non_applicable_property_ids",
    );
    const declaredOwnerBlocked = assertStringArray(
      accounting.owner_blocked_applicability_ids,
      "$.accounting.owner_blocked_applicability_ids",
    );
    if (
      !sameOrderedValues(applicable, declaredApplicable) ||
      !sameOrderedValues(nonApplicable, declaredNonApplicable) ||
      !sameOrderedValues(ownerBlocked, declaredOwnerBlocked)
    ) {
      fail("AOP_PACKET_APPLICABILITY", "$.accounting");
    }

    const propertyRows = array(
      accounting.property_results,
      "$.accounting.property_results",
    ).map((entry, index) => {
      const row = record(entry, `$.accounting.property_results[${index}]`);
      exactKeys(
        row,
        ["property_id", "result", "finding_ref"],
        `$.accounting.property_results[${index}]`,
      );
      return {
        propertyId: nonEmptyString(
          row.property_id,
          `$.accounting.property_results[${index}].property_id`,
        ),
        result: enumValue(
          row.result,
          PROPERTY_RESULTS,
          `$.accounting.property_results[${index}].result`,
        ),
        findingRef: nonEmptyString(
          row.finding_ref,
          `$.accounting.property_results[${index}].finding_ref`,
        ),
      };
    });
    const resultIds = propertyRows.map((row) => row.propertyId);
    const expectedResultIds = denominator.filter(
      (propertyId) => applicabilityById.get(propertyId) !== "not-applicable",
    );
    if (
      new Set(resultIds).size !== resultIds.length ||
      !sameOrderedValues(resultIds, expectedResultIds) ||
      propertyRows.some(
        (row) =>
          (applicabilityById.get(row.propertyId) === "owner-blocked") !==
          (row.result === "owner-blocked"),
      )
    ) {
      fail("AOP_PACKET_RESULT_ACCOUNTING", "$.accounting.property_results");
    }

    const counts = record(accounting.result_counts, "$.accounting.result_counts");
    exactKeys(
      counts,
      ["pass", "fail", "missing", "unsupported", "owner_blocked", "not_applicable"],
      "$.accounting.result_counts",
    );
    const recomposed = {
      pass: propertyRows.filter((row) => row.result === "pass").length,
      fail: propertyRows.filter((row) => row.result === "fail").length,
      missing: propertyRows.filter((row) => row.result === "missing").length,
      unsupported: propertyRows.filter((row) => row.result === "unsupported").length,
      owner_blocked: propertyRows.filter((row) => row.result === "owner-blocked").length,
      not_applicable: nonApplicable.length,
    };
    for (const [key, expected] of Object.entries(recomposed)) {
      const actual = nonNegativeInteger(counts[key], `$.accounting.result_counts.${key}`);
      if (actual !== expected) {
        fail("AOP_PACKET_RESULT_ACCOUNTING", `$.accounting.result_counts.${key}`);
      }
    }
    if (array(accounting.unaccounted_property_ids, "$.accounting.unaccounted_property_ids").length !== 0) {
      fail("AOP_PACKET_RESULT_ACCOUNTING", "$.accounting.unaccounted_property_ids");
    }

    const bindings = array(packet.bindings, "$.bindings").map((entry, index) => {
      const binding = record(entry, `$.bindings[${index}]`);
      exactKeys(
        binding,
        [
          "implementation_binding_id",
          "dependency_role",
          "consumer_contract_ref",
          "adapter_ref",
          "adapter_digest",
        ],
        `$.bindings[${index}]`,
      );
      const id = nonEmptyString(
        binding.implementation_binding_id,
        `$.bindings[${index}].implementation_binding_id`,
      );
      enumValue(binding.dependency_role, DEPENDENCY_ROLES, `$.bindings[${index}].dependency_role`);
      nonEmptyString(binding.consumer_contract_ref, `$.bindings[${index}].consumer_contract_ref`);
      const adapterRef = nonEmptyString(binding.adapter_ref, `$.bindings[${index}].adapter_ref`);
      if (binding.adapter_digest === null) {
        if (adapterRef !== "unsupported") {
          fail("AOP_PACKET_REFERENCE", `$.bindings[${index}].adapter_ref`);
        }
      } else {
        verifyLock(
          options.repoRoot,
          adapterRef,
          binding.adapter_digest,
          `$.bindings[${index}].adapter`,
        );
      }
      return { id, adapterUnsupported: binding.adapter_digest === null };
    });
    const bindingIds = bindings.map((binding) => binding.id);
    if (new Set(bindingIds).size !== bindingIds.length) {
      fail("AOP_PACKET_REFERENCE", "$.bindings");
    }
    const bindingById = new Map(bindings.map((binding) => [binding.id, binding]));

    const observations = array(packet.observations, "$.observations").map((entry, index) => {
      const observation = record(entry, `$.observations[${index}]`);
      exactKeys(
        observation,
        [
          "observation_id",
          "projection_kind",
          "property_id",
          "implementation_binding_id",
          "source_ref",
          "source_digest",
          "observed_value",
          "provenance_ref",
        ],
        `$.observations[${index}]`,
      );
      const id = nonEmptyString(observation.observation_id, `$.observations[${index}].observation_id`);
      const projectionKind = enumValue(
        observation.projection_kind,
        PROJECTION_KINDS,
        `$.observations[${index}].projection_kind`,
      );
      const propertyId = nonEmptyString(observation.property_id, `$.observations[${index}].property_id`);
      const bindingId = nonEmptyString(
        observation.implementation_binding_id,
        `$.observations[${index}].implementation_binding_id`,
      );
      nonEmptyString(observation.provenance_ref, `$.observations[${index}].provenance_ref`);
      verifyLock(
        options.repoRoot,
        observation.source_ref,
        observation.source_digest,
        `$.observations[${index}].source`,
      );
      if (!denominator.includes(propertyId) || !bindingById.has(bindingId)) {
        fail("AOP_PACKET_REFERENCE", `$.observations[${index}]`);
      }
      return { id, projectionKind, propertyId, bindingId };
    });
    const observationIds = observations.map((observation) => observation.id);
    if (new Set(observationIds).size !== observationIds.length) {
      fail("AOP_PACKET_REFERENCE", "$.observations");
    }
    const observationById = new Map(
      observations.map((observation) => [observation.id, observation]),
    );

    const joins = array(packet.infrastructure_joins, "$.infrastructure_joins");
    const joinIds = new Set<string>();
    const joinConcernKeys = new Set<string>();
    const parsedJoins: Array<{ observationId: string; status: string }> = [];
    joins.forEach((entry, index) => {
      const join = record(entry, `$.infrastructure_joins[${index}]`);
      exactKeys(
        join,
        [
          "join_id",
          "dependency_observation_id",
          "concern_kind",
          "external_record_ref",
          "external_record_digest",
          "external_record_status",
          "observation_ceiling",
        ],
        `$.infrastructure_joins[${index}]`,
      );
      const joinId = nonEmptyString(join.join_id, `$.infrastructure_joins[${index}].join_id`);
      const observationId = nonEmptyString(
        join.dependency_observation_id,
        `$.infrastructure_joins[${index}].dependency_observation_id`,
      );
      const concernKind = enumValue(
        join.concern_kind,
        CONCERN_KINDS,
        `$.infrastructure_joins[${index}].concern_kind`,
      );
      const status = enumValue(
        join.external_record_status,
        PROPERTY_RESULTS,
        `$.infrastructure_joins[${index}].external_record_status`,
      );
      const observationCeiling = nonEmptyString(
        join.observation_ceiling,
        `$.infrastructure_joins[${index}].observation_ceiling`,
      );
      if (!observationById.has(observationId)) {
        fail("AOP_PACKET_REFERENCE", `$.infrastructure_joins[${index}].dependency_observation_id`);
      }
      const concernKey = `${observationId}\u0000${concernKind}`;
      if (joinIds.has(joinId) || joinConcernKeys.has(concernKey)) {
        fail("AOP_PACKET_JOIN_DUPLICATE", `$.infrastructure_joins[${index}]`);
      }
      joinIds.add(joinId);
      joinConcernKeys.add(concernKey);
      const externalLock = verifyLock(
        options.repoRoot,
        join.external_record_ref,
        join.external_record_digest,
        `$.infrastructure_joins[${index}].external_record`,
      );
      const externalRecord = parseJson(
        externalLock.bytes,
        `$.infrastructure_joins[${index}].external_record`,
      );
      const externalStatus = externalRecord.result ?? externalRecord.status;
      if (externalRecord.concern_kind !== concernKind) {
        fail(
          "AOP_PACKET_CROSS_INFERENCE",
          `$.infrastructure_joins[${index}].concern_kind`,
        );
      }
      if (
        externalStatus !== status ||
        externalRecord.claim_ceiling !== observationCeiling
      ) {
        fail("AOP_PACKET_REFERENCE", `$.infrastructure_joins[${index}].external_record`);
      }
      parsedJoins.push({ observationId, status });
    });

    for (const row of propertyRows) {
      if (row.result !== "pass") continue;
      const propertyObservations = observations.filter(
        (observation) => observation.propertyId === row.propertyId,
      );
      if (
        propertyObservations.some(
          (observation) =>
            observation.projectionKind === "unsupported" ||
            bindingById.get(observation.bindingId)?.adapterUnsupported === true ||
            parsedJoins.some(
              (join) =>
                join.observationId === observation.id &&
                ["missing", "unsupported", "owner-blocked"].includes(join.status),
            ),
        )
      ) {
        fail("AOP_PACKET_RESULT_COLLAPSE", `$.accounting.property_results.${row.propertyId}`);
      }
    }

    const ceiling = record(packet.claim_ceiling, "$.claim_ceiling");
    exactKeys(
      ceiling,
      [
        "evidence_only",
        "authority_effect",
        "synchronized_closeout_claim",
        "prohibited_claims",
      ],
      "$.claim_ceiling",
    );
    const synchronizedClaim = booleanValue(
      ceiling.synchronized_closeout_claim,
      "$.claim_ceiling.synchronized_closeout_claim",
    );
    const prohibitedClaims = assertStringArray(
      ceiling.prohibited_claims,
      "$.claim_ceiling.prohibited_claims",
    );
    if (
      ceiling.evidence_only !== true ||
      ceiling.authority_effect !== "none" ||
      synchronizedClaim !== predecessorSynchronized ||
      !sameOrderedValues(prohibitedClaims, PROHIBITED_CLAIMS)
    ) {
      fail("AOP_PACKET_AUTHORITY_GROWTH", "$.claim_ceiling");
    }

    return {
      result: "pass",
      diagnostic: "AOP_PACKET_PASS",
      selector: "$",
      evidence_lane: actualLane,
      synchronized_task_session_closeout: actualSynchronized,
    };
  } catch (error) {
    if (error instanceof PacketViolation) {
      return {
        result: "block",
        diagnostic: error.diagnostic,
        selector: error.selector,
        ...error.details,
      };
    }
    return {
      result: "block",
      diagnostic: "AOP_PACKET_SCHEMA",
      selector: "$",
    };
  }
}
