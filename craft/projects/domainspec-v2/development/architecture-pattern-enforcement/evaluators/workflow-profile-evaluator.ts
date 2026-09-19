import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import {
  observeWorkflowChildren,
  type WorkflowChildObserverInput,
  type WorkflowChildResult,
} from "../adapters/typescript/workflow-child-observer.ts";
import {
  observeWorkflowCompensation,
  type WorkflowCompensationObserverInput,
  type WorkflowCompensationResult,
} from "../adapters/typescript/workflow-compensation-observer.ts";
import {
  observeWorkflowContinuation,
  type WorkflowContinuationObserverInput,
  type WorkflowContinuationResult,
} from "../adapters/typescript/workflow-continuation-observer.ts";
import {
  observeWorkflowMessageBoundary,
  type WorkflowMessageObserverInput,
  type WorkflowMessageResult,
} from "../adapters/typescript/workflow-message-observer.ts";
import {
  discriminateWorkflowMode,
  type WorkflowModeDiscriminatorInput,
  type WorkflowModeResult,
} from "../adapters/typescript/workflow-mode-discriminator.ts";
import {
  observeWorkflowRuntime,
  type WorkflowRuntimeObserverInput,
  type WorkflowRuntimeResult,
} from "../adapters/typescript/workflow-runtime-observer.ts";
import {
  observeWorkflowVersion,
  type WorkflowVersionObserverInput,
  type WorkflowVersionResult,
} from "../adapters/typescript/workflow-version-observer.ts";
import {
  readLockedRepositoryFile,
  sha256Canonical,
  validateWorkflowPredecessor,
  type LockedRepositoryRef,
  type WorkflowPredecessorInput,
} from "../validators/rmt-workflow-predecessor.ts";

export const WORKFLOW_PROFILE_ID =
  "APE.ArchitectureProfile.TypeScriptWorkflowApplication/candidate-v1" as const;
export const WORKFLOW_DENOMINATOR_SHA256 =
  "dcafa4b33d08181f0dd7ecf92aef5a27c2b0e059ece49f60c876b6578f586279" as const;
export const WORKFLOW_PROPERTY_IDS = [
  "APE.WF.P01-NAMED-ORCHESTRATION",
  "APE.WF.P02-CHILD-AUTHORITY",
  "APE.WF.P03-HOF-STEPS",
  "APE.WF.P04-MODE-APPLICABILITY",
  "APE.WF.P05-STEP-LOCAL-TRANSACTION",
  "APE.WF.P06-CONTINUATION",
  "APE.WF.P07-DURABLE-CAPABILITIES",
  "APE.WF.P08-TRANSPORT-BOUNDARIES",
  "APE.WF.P09-TRAVERSAL-EQUIVALENCE",
] as const;
export type WorkflowPropertyId = (typeof WORKFLOW_PROPERTY_IDS)[number];

export const REQUIRED_WORKFLOW_MATERIAL_PATHS = {
  "workflow-candidate":
    "projects/domainspec-v2/development/remaining-meta-types/candidates/workflow.json",
  "workflow-source":
    "projects/domainspec-v2/impl/architecture-conformance/targets/typescript/workflow-v1.composition.ts",
  "rmt-wf-006":
    "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-WF-006.json",
  "rmt-wf-007":
    "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-WF-007.json",
  "rmt-wf-008":
    "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-WF-008.json",
  "rmt-wf-009":
    "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-WF-009.json",
  "rmt-wf-010":
    "projects/domainspec-v2/development/remaining-meta-types/receipts/RMT-WF-010.json",
  "packet-schema":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/contracts/rmt-profile-binding-packet.schema.json",
  "packet-validator":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/validators/rmt-profile-binding-packet.ts",
  "packet-closeout":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/evidence/WP-APE-OP-PROFILE-001/SWU-AOP-001-closeout.json",
  "workflow-predecessor":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/validators/rmt-workflow-predecessor.ts",
  "profile-schema":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/profiles/typescript-workflow-application-profile.schema.json",
  profile:
    "projects/domainspec-v2/development/architecture-pattern-enforcement/profiles/typescript-workflow-application-profile.json",
  applicability:
    "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/workflow-profile/applicability.json",
  "child-observer":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/workflow-child-observer.ts",
  "continuation-observer":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/workflow-continuation-observer.ts",
  "compensation-observer":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/workflow-compensation-observer.ts",
  "mode-discriminator":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/workflow-mode-discriminator.ts",
  "runtime-observer":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/workflow-runtime-observer.ts",
  "version-observer":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/workflow-version-observer.ts",
  "message-observer":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/adapters/typescript/workflow-message-observer.ts",
  fixture:
    "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/workflow-profile/workflow.fixture.json",
  hostiles:
    "projects/domainspec-v2/development/architecture-pattern-enforcement/fixtures/workflow-profile/hostiles.json",
  evaluator:
    "projects/domainspec-v2/development/architecture-pattern-enforcement/evaluators/workflow-profile-evaluator.ts",
  "receipt-schema":
    "projects/domainspec-v2/development/architecture-pattern-enforcement/contracts/workflow-type-completion-receipt.schema.json",
} as const;

type JsonRecord = Record<string, any>;
export type WorkflowApplicability = "applicable" | "not-applicable" | "owner-blocked";
export type WorkflowPropertyResult =
  | "pass"
  | "fail"
  | "missing"
  | "unsupported"
  | "owner-blocked"
  | "not-applicable";

export interface WorkflowMaterialItemV1 {
  role: keyof typeof REQUIRED_WORKFLOW_MATERIAL_PATHS;
  path: string;
  sha256: string;
  size_bytes: number;
}

export interface WorkflowPropertyClaimV1 {
  property_id: WorkflowPropertyId;
  result: WorkflowPropertyResult;
  diagnostic: string;
  producer: string;
  producer_output_sha256: string;
  joins_sha256: string;
}

interface ComputedWorkflowProperty extends WorkflowPropertyClaimV1 {
  observed_value: unknown;
  raw_evidence: readonly { path: string; sha256: string; size_bytes: number }[];
  joins: readonly unknown[];
}

export interface WorkflowProfileEvaluationInputV1 {
  repo_root: string;
  evidence_lane: "candidate-local-prototype";
  profile: JsonRecord;
  applicability_scaffold: JsonRecord;
  fixture: JsonRecord;
  hostile_catalogue: JsonRecord;
  claimed_results: readonly WorkflowPropertyClaimV1[];
  material_inventory: readonly WorkflowMaterialItemV1[];
  synchronized_task_session_closeout: false;
  authority_effect: "none";
}

export interface WorkflowConstraintFindingV1 {
  finding_id: string;
  property_id: WorkflowPropertyId;
  applicability: "applicable" | "owner-blocked";
  result: Exclude<WorkflowPropertyResult, "not-applicable">;
  diagnostic: string;
  producer: string;
  producer_output_sha256: string;
  expected_value: { basis: string; evidence_ref: string };
  observed_value: unknown;
  raw_evidence: readonly { path: string; sha256: string; size_bytes: number }[];
  joins: readonly unknown[];
  owner_route: string;
  origin_profile: {
    profile_id: typeof WORKFLOW_PROFILE_ID;
    version: string;
    profile_sha256: string;
  };
  authority_effect: "none";
}

export interface WorkflowTypeCompletionReceiptV1 {
  schema_version: "ape.workflow-type-completion-receipt/v1";
  receipt_id: string;
  evidence_lane: "candidate-local-prototype";
  result: "pass" | "fail" | "incomplete";
  subject: {
    meta_type_id: "Workflow";
    subject_id: string;
    candidate_sha256: string;
    source_sha256: string;
  };
  predecessor: {
    projection_swu_id: "RMT-WF-010";
    candidate_sha256: string;
    receipt_sha256: string;
    synchronized_task_session_closeout: false;
    operation_type_completion_receipt_used: false;
    authority_effect: "none";
  };
  profile: {
    profile_id: typeof WORKFLOW_PROFILE_ID;
    version: string;
    profile_sha256: string;
    denominator_sha256: typeof WORKFLOW_DENOMINATOR_SHA256;
  };
  fixture: {
    fixture_id: string;
    fixture_sha256: string;
    applicability_sha256: string;
    hostile_catalogue_sha256: string;
  };
  findings: readonly WorkflowConstraintFindingV1[];
  accounting: {
    denominator_count: 9;
    applicable_count: number;
    not_applicable_count: number;
    owner_blocked_applicability_count: number;
    pass_count: number;
    fail_count: number;
    missing_count: number;
    unsupported_count: number;
    owner_blocked_count: number;
    unaccounted_property_ids: readonly string[];
    extra_property_ids: readonly string[];
  };
  material_inventory: readonly WorkflowMaterialItemV1[];
  claim_ceiling: {
    statement: "candidate-local TypeScript Workflow architecture evidence only";
    missing_named_compensation_callable_retained: true;
    profile_admitted: false;
    semantic_admission: false;
    runtime_or_delivery_guarantee: false;
    operation_completion_dependency: false;
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

function fail(diagnostic: string, selector: string): never {
  throw new Error(`${diagnostic} at ${selector}`);
}

function object(value: unknown, selector: string): JsonRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    fail("AOP_WF_EVALUATOR_SCHEMA", selector);
  }
  return value as JsonRecord;
}

function exactKeys(value: JsonRecord, expected: readonly string[], selector: string): void {
  const actual = Object.keys(value).sort();
  const required = [...expected].sort();
  if (
    actual.length !== required.length ||
    actual.some((key, index) => key !== required[index])
  ) {
    fail("AOP_WF_EVALUATOR_SCHEMA", selector);
  }
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

function sha256(bytes: Buffer): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function parseMaterialJson(
  repoRoot: string,
  item: WorkflowMaterialItemV1,
  selector: string,
): JsonRecord {
  try {
    return object(
      JSON.parse(
        readLockedRepositoryFile(repoRoot, item, selector).toString("utf8"),
      ),
      selector,
    );
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AOP_WF_EVALUATOR")) {
      throw error;
    }
    fail("AOP_WF_EVALUATOR_STALE_MATERIAL", selector);
  }
}

function validateMaterials(
  repoRoot: string,
  inventory: readonly WorkflowMaterialItemV1[],
): Map<keyof typeof REQUIRED_WORKFLOW_MATERIAL_PATHS, WorkflowMaterialItemV1> {
  if (!Array.isArray(inventory)) fail("AOP_WF_EVALUATOR_SCHEMA", "$.material_inventory");
  const roles = inventory.map((item) => item.role);
  const requiredRoles = Object.keys(REQUIRED_WORKFLOW_MATERIAL_PATHS) as Array<
    keyof typeof REQUIRED_WORKFLOW_MATERIAL_PATHS
  >;
  if (new Set(roles).size !== roles.length) {
    fail("AOP_WF_EVALUATOR_MATERIAL_DUPLICATE", "$.material_inventory");
  }
  const extra = roles.find((role) => !(role in REQUIRED_WORKFLOW_MATERIAL_PATHS));
  if (extra !== undefined || inventory.length > requiredRoles.length) {
    fail("AOP_WF_EVALUATOR_MATERIAL_EXTRA", "$.material_inventory");
  }
  if (inventory.length !== requiredRoles.length || requiredRoles.some((role) => !roles.includes(role))) {
    fail("AOP_WF_EVALUATOR_MATERIAL_MISSING", "$.material_inventory");
  }
  const byRole = new Map<keyof typeof REQUIRED_WORKFLOW_MATERIAL_PATHS, WorkflowMaterialItemV1>();
  for (let index = 0; index < inventory.length; index += 1) {
    const item = inventory[index];
    exactKeys(
      object(item, `$.material_inventory[${index}]`),
      ["role", "path", "sha256", "size_bytes"],
      `$.material_inventory[${index}]`,
    );
    const role = item.role as keyof typeof REQUIRED_WORKFLOW_MATERIAL_PATHS;
    if (item.path !== REQUIRED_WORKFLOW_MATERIAL_PATHS[role]) {
      fail("AOP_WF_EVALUATOR_MATERIAL_PATH", `$.material_inventory[${index}].path`);
    }
    try {
      readLockedRepositoryFile(repoRoot, item, `$.material_inventory[${index}]`);
    } catch {
      fail("AOP_WF_EVALUATOR_STALE_MATERIAL", `$.material_inventory[${index}]`);
    }
    byRole.set(role, item);
  }
  return byRole;
}

function validateProfile(value: JsonRecord): void {
  const denominator = object(value.property_denominator, "$.profile.property_denominator");
  const ids = Array.isArray(denominator.ordered_property_ids)
    ? (denominator.ordered_property_ids as string[])
    : [];
  const properties = Array.isArray(value.properties) ? value.properties : [];
  const propertyIds = properties.map(
    (property, index) => object(property, `$.profile.properties[${index}]`).property_id as string,
  );
  const recomputed = createHash("sha256")
    .update(`${ids.join("\n")}\n`, "utf8")
    .digest("hex");
  const policy = object(value.rmt_semantic_policy, "$.profile.rmt_semantic_policy");
  if (
    value.schema_version !== "ape.architecture-profile/v1" ||
    value.profile_id !== WORKFLOW_PROFILE_ID ||
    value.version !== "0.1.0-candidate" ||
    value.language !== "typescript" ||
    value.subject_meta_type_id !== "Workflow" ||
    value.evidence_lane !== "candidate-local-prototype" ||
    value.portable_semantics !== false ||
    value.authority_effect !== "none" ||
    policy.mode !== "reference-only" ||
    policy.semantic_hostiles_owned_by_rmt !== true ||
    policy.profile_may_reinterpret_semantics !== false ||
    properties.length !== 9 ||
    !sameOrdered(propertyIds, WORKFLOW_PROPERTY_IDS) ||
    !sameOrdered(ids, WORKFLOW_PROPERTY_IDS) ||
    denominator.count !== 9 ||
    denominator.sha256 !== WORKFLOW_DENOMINATOR_SHA256 ||
    recomputed !== WORKFLOW_DENOMINATOR_SHA256 ||
    properties.some((property) => {
      const row = property as JsonRecord;
      return (
        !Array.isArray(row.valid_subjects) ||
        row.valid_subjects.length !== 1 ||
        row.valid_subjects[0] !== "Workflow" ||
        row.portable_semantics !== false ||
        typeof row.owner_route !== "string" ||
        !Array.isArray(row.forbidden_inferences) ||
        row.forbidden_inferences.length < 2
      );
    })
  ) {
    fail("AOP_WF_EVALUATOR_PROFILE_BOUNDARY", "$.profile");
  }
}

function validateApplicabilityRows(
  selected: JsonRecord,
): Map<WorkflowPropertyId, JsonRecord> {
  const rows = Array.isArray(selected.applicability_results)
    ? selected.applicability_results.map((row, index) =>
        object(row, `$.fixture.selected_applicability.applicability_results[${index}]`),
      )
    : [];
  const ids = rows.map((row) => row.property_id as string);
  if (
    rows.length !== 9 ||
    new Set(ids).size !== ids.length ||
    !sameSet(ids, WORKFLOW_PROPERTY_IDS) ||
    rows.some(
      (row) =>
        !["applicable", "not-applicable", "owner-blocked"].includes(
          row.applicability as string,
        ) ||
        typeof row.basis !== "string" ||
        row.basis.length === 0 ||
        typeof row.evidence_ref !== "string" ||
        row.evidence_ref.length === 0,
    )
  ) {
    fail("AOP_WF_EVALUATOR_APPLICABILITY", "$.fixture.selected_applicability");
  }
  const applicable = rows
    .filter((row) => row.applicability === "applicable")
    .map((row) => row.property_id as string);
  const nonApplicable = rows
    .filter((row) => row.applicability === "not-applicable")
    .map((row) => row.property_id as string);
  const ownerBlocked = rows
    .filter((row) => row.applicability === "owner-blocked")
    .map((row) => row.property_id as string);
  if (
    !sameOrdered(applicable, selected.applicable_property_ids as string[]) ||
    !sameOrdered(nonApplicable, selected.non_applicable_property_ids as string[]) ||
    !sameOrdered(ownerBlocked, selected.owner_blocked_applicability_ids as string[]) ||
    !Array.isArray(selected.unaccounted_property_ids) ||
    selected.unaccounted_property_ids.length !== 0
  ) {
    fail("AOP_WF_EVALUATOR_APPLICABILITY", "$.fixture.selected_applicability");
  }
  return new Map(
    rows.map((row) => [row.property_id as WorkflowPropertyId, row]),
  );
}

function resultValue(value: string, selector: string): WorkflowPropertyResult {
  if (value === "block") fail("AOP_WF_EVALUATOR_OBSERVER_BLOCK", selector);
  if (
    !["pass", "fail", "missing", "unsupported", "owner-blocked", "not-applicable"].includes(
      value,
    )
  ) {
    fail("AOP_WF_EVALUATOR_SCHEMA", selector);
  }
  return value as WorkflowPropertyResult;
}

function combineDurableResults(
  runtime: WorkflowRuntimeResult,
  version: WorkflowVersionResult,
): { result: WorkflowPropertyResult; diagnostic: string } {
  const runtimeResult = resultValue(runtime.result, "$.observer_inputs.runtime");
  const versionResult = resultValue(version.result, "$.observer_inputs.version");
  if (runtimeResult === "not-applicable" && versionResult === "not-applicable") {
    return { result: "not-applicable", diagnostic: runtime.diagnostic };
  }
  const priority: WorkflowPropertyResult[] = [
    "fail",
    "unsupported",
    "missing",
    "owner-blocked",
    "pass",
    "not-applicable",
  ];
  const selected = priority.find(
    (candidate) => runtimeResult === candidate || versionResult === candidate,
  )!;
  return {
    result: selected,
    diagnostic: runtimeResult === selected ? runtime.diagnostic : version.diagnostic,
  };
}

function normalizeObserverInputs(fixture: JsonRecord, repoRoot: string): JsonRecord {
  const values = structuredClone(object(fixture.observer_inputs, "$.fixture.observer_inputs"));
  for (const key of ["child", "continuation", "compensation", "runtime", "version", "message"]) {
    object(values[key], `$.fixture.observer_inputs.${key}`).repo_root = repoRoot;
  }
  object(values.runtime, "$.fixture.observer_inputs.runtime").mode_input = structuredClone(
    values.mode,
  );
  delete object(values.runtime, "$.fixture.observer_inputs.runtime").mode_input_ref;
  object(values.version, "$.fixture.observer_inputs.version").mode_input = structuredClone(
    values.mode,
  );
  delete object(values.version, "$.fixture.observer_inputs.version").mode_input_ref;
  return values;
}

function evidence(lock: LockedRepositoryRef) {
  return { path: lock.path, sha256: lock.sha256, size_bytes: lock.size_bytes };
}

function property(
  propertyId: WorkflowPropertyId,
  result: WorkflowPropertyResult,
  diagnostic: string,
  producer: string,
  producerOutput: unknown,
  observedValue: unknown,
  rawEvidence: readonly LockedRepositoryRef[],
  joins: readonly unknown[] = [],
): ComputedWorkflowProperty {
  return {
    property_id: propertyId,
    result,
    diagnostic,
    producer,
    producer_output_sha256: sha256Canonical(producerOutput),
    joins_sha256: sha256Canonical(joins),
    observed_value: observedValue,
    raw_evidence: rawEvidence.map(evidence),
    joins,
  };
}

export function recomputeWorkflowPropertyClaims(
  fixtureValue: JsonRecord,
  repoRoot: string,
): WorkflowPropertyClaimV1[] {
  return recomputeWorkflowProperties(fixtureValue, repoRoot).map(
    ({ observed_value: _observed, raw_evidence: _evidence, joins: _joins, ...claim }) =>
      claim,
  );
}

function recomputeWorkflowProperties(
  fixtureValue: JsonRecord,
  repoRoot: string,
): ComputedWorkflowProperty[] {
  const subject = object(fixtureValue.subject, "$.fixture.subject");
  const source = object(subject.source, "$.fixture.subject.source") as unknown as LockedRepositoryRef;
  const candidate = object(subject.candidate, "$.fixture.subject.candidate") as unknown as LockedRepositoryRef;
  const inputs = normalizeObserverInputs(fixtureValue, repoRoot);
  const child = observeWorkflowChildren(inputs.child as WorkflowChildObserverInput);
  const continuation = observeWorkflowContinuation(
    inputs.continuation as WorkflowContinuationObserverInput,
  );
  const compensation = observeWorkflowCompensation(
    inputs.compensation as WorkflowCompensationObserverInput,
  );
  const mode = discriminateWorkflowMode(inputs.mode as WorkflowModeDiscriminatorInput);
  const runtime = observeWorkflowRuntime(inputs.runtime as WorkflowRuntimeObserverInput);
  const version = observeWorkflowVersion(inputs.version as WorkflowVersionObserverInput);
  const message = observeWorkflowMessageBoundary(inputs.message as WorkflowMessageObserverInput);
  const durable = combineDurableResults(runtime, version);
  const childResult = resultValue(child.result, "$.observer_inputs.child");
  const continuationResult = resultValue(
    continuation.result,
    "$.observer_inputs.continuation",
  );
  const compensationResult = resultValue(
    compensation.result,
    "$.observer_inputs.compensation",
  );
  const modeResult = resultValue(mode.result, "$.observer_inputs.mode");
  const messageResult = resultValue(message.result, "$.observer_inputs.message");
  const childObserved = (propertyId: WorkflowPropertyId) =>
    child.observations.find((row) => row.property_id === propertyId)?.observed_value ?? {
      result: child.result,
      selector: child.selector,
    };
  return [
    property("APE.WF.P01-NAMED-ORCHESTRATION", childResult, child.diagnostic, "workflow-child-observer", child, childObserved("APE.WF.P01-NAMED-ORCHESTRATION"), [source]),
    property("APE.WF.P02-CHILD-AUTHORITY", childResult, child.diagnostic, "workflow-child-observer", child, childObserved("APE.WF.P02-CHILD-AUTHORITY"), [source]),
    property("APE.WF.P03-HOF-STEPS", childResult, child.diagnostic, "workflow-child-observer", child, childObserved("APE.WF.P03-HOF-STEPS"), [source]),
    property("APE.WF.P04-MODE-APPLICABILITY", modeResult, mode.diagnostic, "workflow-mode-discriminator", mode, { mode: mode.mode, declaration_sha256: mode.declaration_sha256 }, [candidate]),
    property("APE.WF.P05-STEP-LOCAL-TRANSACTION", childResult, child.diagnostic, "workflow-child-observer", child, childObserved("APE.WF.P05-STEP-LOCAL-TRANSACTION"), [source]),
    property("APE.WF.P06-CONTINUATION", continuationResult, continuation.diagnostic, "workflow-continuation-observer", continuation, { route_results: continuation.route_results, oracle: continuation.oracle }, [source, candidate]),
    property("APE.WF.P07-DURABLE-CAPABILITIES", durable.result, durable.diagnostic, "workflow-runtime-and-version-observers", { runtime, version }, { runtime: { result: runtime.result, diagnostic: runtime.diagnostic }, version: { result: version.result, diagnostic: version.diagnostic } }, [source], [...runtime.joins, ...(version.join === null ? [] : [version.join])]),
    property("APE.WF.P08-TRANSPORT-BOUNDARIES", messageResult, message.diagnostic, "workflow-message-observer", message, { placement: message.placement, stage_results: message.stage_results }, [source], message.joins),
    property("APE.WF.P09-TRAVERSAL-EQUIVALENCE", compensationResult, compensation.diagnostic, "workflow-compensation-observer", compensation, { forward_action: compensation.forward_action, compensation: compensation.compensation, evidence_stages: compensation.evidence_stages, traversal: compensation.traversal }, [source, candidate]),
  ];
}

function validateExpectedResults(
  fixtureValue: JsonRecord,
  computed: readonly ComputedWorkflowProperty[],
): void {
  const expected = Array.isArray(fixtureValue.expected_property_results)
    ? fixtureValue.expected_property_results.map((row, index) =>
        object(row, `$.fixture.expected_property_results[${index}]`),
      )
    : [];
  if (
    expected.length !== computed.length ||
    expected.some((row, index) =>
      ["property_id", "result", "diagnostic", "producer"].some(
        (key) => row[key] !== computed[index][key as keyof ComputedWorkflowProperty],
      ),
    )
  ) {
    fail("AOP_WF_EVALUATOR_STALE_RESULT", "$.fixture.expected_property_results");
  }
}

function validateClaims(
  claims: readonly WorkflowPropertyClaimV1[],
  computed: readonly ComputedWorkflowProperty[],
): void {
  if (!Array.isArray(claims) || claims.length !== computed.length) {
    fail("AOP_WF_EVALUATOR_UNACCOUNTED", "$.claimed_results");
  }
  const ids = claims.map((claim) => claim.property_id);
  if (new Set(ids).size !== ids.length) {
    fail("AOP_WF_EVALUATOR_DUPLICATE_RESULT", "$.claimed_results");
  }
  const extra = ids.find((id) => !WORKFLOW_PROPERTY_IDS.includes(id));
  if (extra !== undefined) fail("AOP_WF_EVALUATOR_EXTRA_PROPERTY", "$.claimed_results");
  if (!sameOrdered(ids, WORKFLOW_PROPERTY_IDS)) {
    fail("AOP_WF_EVALUATOR_UNACCOUNTED", "$.claimed_results");
  }
  for (let index = 0; index < claims.length; index += 1) {
    const claim = claims[index];
    exactKeys(
      object(claim, `$.claimed_results[${index}]`),
      [
        "property_id",
        "result",
        "diagnostic",
        "producer",
        "producer_output_sha256",
        "joins_sha256",
      ],
      `$.claimed_results[${index}]`,
    );
    const actual = computed[index];
    if (claim.joins_sha256 !== actual.joins_sha256) {
      fail("AOP_WF_EVALUATOR_STALE_JOIN", `$.claimed_results[${index}].joins_sha256`);
    }
    if (
      claim.property_id !== actual.property_id ||
      claim.result !== actual.result ||
      claim.diagnostic !== actual.diagnostic ||
      claim.producer !== actual.producer ||
      claim.producer_output_sha256 !== actual.producer_output_sha256
    ) {
      fail("AOP_WF_EVALUATOR_STALE_RESULT", `$.claimed_results[${index}]`);
    }
  }
}

export function evaluateWorkflowProfile(
  inputValue: WorkflowProfileEvaluationInputV1,
): WorkflowTypeCompletionReceiptV1 {
  const inputRecord = object(inputValue, "$" );
  exactKeys(
    inputRecord,
    [
      "repo_root",
      "evidence_lane",
      "profile",
      "applicability_scaffold",
      "fixture",
      "hostile_catalogue",
      "claimed_results",
      "material_inventory",
      "synchronized_task_session_closeout",
      "authority_effect",
    ],
    "$",
  );
  const input = inputRecord as unknown as WorkflowProfileEvaluationInputV1;
  if (
    input.evidence_lane !== "candidate-local-prototype" ||
    input.synchronized_task_session_closeout !== false ||
    input.authority_effect !== "none"
  ) {
    fail("AOP_WF_EVALUATOR_AUTHORITY_GROWTH", "$" );
  }
  const materials = validateMaterials(input.repo_root, input.material_inventory);
  const liveProfile = parseMaterialJson(input.repo_root, materials.get("profile")!, "$.profile");
  const liveApplicability = parseMaterialJson(
    input.repo_root,
    materials.get("applicability")!,
    "$.applicability_scaffold",
  );
  const liveFixture = parseMaterialJson(input.repo_root, materials.get("fixture")!, "$.fixture");
  const liveHostiles = parseMaterialJson(
    input.repo_root,
    materials.get("hostiles")!,
    "$.hostile_catalogue",
  );
  if (sha256Canonical(input.profile) !== sha256Canonical(liveProfile)) {
    fail("AOP_WF_EVALUATOR_STALE_PROFILE", "$.profile");
  }
  if (sha256Canonical(input.applicability_scaffold) !== sha256Canonical(liveApplicability)) {
    fail("AOP_WF_EVALUATOR_STALE_APPLICABILITY", "$.applicability_scaffold");
  }
  if (sha256Canonical(input.fixture) !== sha256Canonical(liveFixture)) {
    fail("AOP_WF_EVALUATOR_STALE_FIXTURE", "$.fixture");
  }
  if (sha256Canonical(input.hostile_catalogue) !== sha256Canonical(liveHostiles)) {
    fail("AOP_WF_EVALUATOR_STALE_HOSTILES", "$.hostile_catalogue");
  }
  validateProfile(input.profile);
  const unresolved = object(
    input.applicability_scaffold.unresolved_case,
    "$.applicability_scaffold.unresolved_case",
  );
  const unresolvedRows = Array.isArray(unresolved.applicability_results)
    ? unresolved.applicability_results
    : [];
  if (
    unresolvedRows.length !== 9 ||
    unresolved.owner_blocked_applicability_ids?.length !== 3 ||
    unresolved.unaccounted_property_ids?.length !== 0 ||
    input.applicability_scaffold.authority_effect !== "none"
  ) {
    fail("AOP_WF_EVALUATOR_APPLICABILITY", "$.applicability_scaffold");
  }
  if (
    input.hostile_catalogue.schema_version !==
      "ape.workflow-profile-hostile-catalogue/v1" ||
    !Array.isArray(input.hostile_catalogue.cases) ||
    input.hostile_catalogue.cases.length !== 12 ||
    input.hostile_catalogue.one_primary_cause_per_hostile !== true ||
    input.hostile_catalogue.rmt_semantic_hostiles_copied !== false ||
    input.hostile_catalogue.authority_effect !== "none"
  ) {
    fail("AOP_WF_EVALUATOR_HOSTILES", "$.hostile_catalogue");
  }
  const predecessor = validateWorkflowPredecessor(
    input.fixture.predecessor_input as WorkflowPredecessorInput,
    { repoRoot: input.repo_root },
  );
  if (predecessor.result !== "pass") {
    fail("AOP_WF_EVALUATOR_PREDECESSOR", `$.fixture.predecessor_input.${predecessor.selector}`);
  }
  const subject = object(input.fixture.subject, "$.fixture.subject");
  const candidateLock = object(subject.candidate, "$.fixture.subject.candidate") as unknown as LockedRepositoryRef;
  const sourceLock = object(subject.source, "$.fixture.subject.source") as unknown as LockedRepositoryRef;
  readLockedRepositoryFile(input.repo_root, candidateLock, "$.fixture.subject.candidate");
  readLockedRepositoryFile(input.repo_root, sourceLock, "$.fixture.subject.source");
  if (
    subject.meta_type_id !== "Workflow" ||
    subject.subject_id !== predecessor.subject_id ||
    candidateLock.sha256 !== predecessor.candidate.sha256 ||
    sourceLock.sha256 !== predecessor.source.sha256 ||
    input.fixture.authority_effect !== "none"
  ) {
    fail("AOP_WF_EVALUATOR_SUBJECT_COLLAPSE", "$.fixture.subject");
  }
  const applicability = validateApplicabilityRows(
    object(input.fixture.selected_applicability, "$.fixture.selected_applicability"),
  );
  const computed = recomputeWorkflowProperties(input.fixture, input.repo_root);
  validateExpectedResults(input.fixture, computed);
  validateClaims(input.claimed_results, computed);
  for (const row of computed) {
    const app = applicability.get(row.property_id)!;
    if (
      (app.applicability === "not-applicable") !== (row.result === "not-applicable") ||
      (app.applicability === "owner-blocked") !== (row.result === "owner-blocked")
    ) {
      fail("AOP_WF_EVALUATOR_RESULT_ACCOUNTING", `$.claimed_results.${row.property_id}`);
    }
  }
  const propertyById = new Map(
    (input.profile.properties as JsonRecord[]).map((row) => [row.property_id as string, row]),
  );
  const profileMaterial = materials.get("profile")!;
  const findings: WorkflowConstraintFindingV1[] = computed
    .filter((row) => row.result !== "not-applicable")
    .map((row) => {
      const app = applicability.get(row.property_id)!;
      const profileProperty = propertyById.get(row.property_id)!;
      return {
        finding_id: `APE.ConstraintFinding.workflow.${row.property_id.split("-").at(-1)!.toLowerCase()}`,
        property_id: row.property_id,
        applicability: app.applicability as "applicable" | "owner-blocked",
        result: row.result as Exclude<WorkflowPropertyResult, "not-applicable">,
        diagnostic: row.diagnostic,
        producer: row.producer,
        producer_output_sha256: row.producer_output_sha256,
        expected_value: { basis: app.basis as string, evidence_ref: app.evidence_ref as string },
        observed_value: row.observed_value,
        raw_evidence: row.raw_evidence,
        joins: row.joins,
        owner_route: profileProperty.owner_route as string,
        origin_profile: {
          profile_id: WORKFLOW_PROFILE_ID,
          version: input.profile.version as string,
          profile_sha256: profileMaterial.sha256,
        },
        authority_effect: "none",
      };
    });
  const count = (value: WorkflowPropertyResult) =>
    computed.filter((row) => row.result === value).length;
  const result: WorkflowTypeCompletionReceiptV1["result"] =
    count("fail") > 0
      ? "fail"
      : count("missing") + count("unsupported") + count("owner-blocked") > 0
        ? "incomplete"
        : "pass";
  const body: Omit<WorkflowTypeCompletionReceiptV1, "receipt_sha256"> = {
    schema_version: "ape.workflow-type-completion-receipt/v1",
    receipt_id: `WP-APE-WF-PROFILE-001:${input.fixture.fixture_id as string}:candidate-local`,
    evidence_lane: "candidate-local-prototype",
    result,
    subject: {
      meta_type_id: "Workflow",
      subject_id: subject.subject_id as string,
      candidate_sha256: candidateLock.sha256,
      source_sha256: sourceLock.sha256,
    },
    predecessor: {
      projection_swu_id: "RMT-WF-010",
      candidate_sha256: predecessor.candidate.sha256,
      receipt_sha256: (input.fixture.predecessor_input.workflow_projection_receipt as LockedRepositoryRef).sha256,
      synchronized_task_session_closeout: false,
      operation_type_completion_receipt_used: false,
      authority_effect: "none",
    },
    profile: {
      profile_id: WORKFLOW_PROFILE_ID,
      version: input.profile.version as string,
      profile_sha256: profileMaterial.sha256,
      denominator_sha256: WORKFLOW_DENOMINATOR_SHA256,
    },
    fixture: {
      fixture_id: input.fixture.fixture_id as string,
      fixture_sha256: materials.get("fixture")!.sha256,
      applicability_sha256: materials.get("applicability")!.sha256,
      hostile_catalogue_sha256: materials.get("hostiles")!.sha256,
    },
    findings,
    accounting: {
      denominator_count: 9,
      applicable_count: [...applicability.values()].filter((row) => row.applicability === "applicable").length,
      not_applicable_count: [...applicability.values()].filter((row) => row.applicability === "not-applicable").length,
      owner_blocked_applicability_count: [...applicability.values()].filter((row) => row.applicability === "owner-blocked").length,
      pass_count: count("pass"),
      fail_count: count("fail"),
      missing_count: count("missing"),
      unsupported_count: count("unsupported"),
      owner_blocked_count: count("owner-blocked"),
      unaccounted_property_ids: [],
      extra_property_ids: [],
    },
    material_inventory: input.material_inventory.map((item) => ({ ...item })),
    claim_ceiling: {
      statement: "candidate-local TypeScript Workflow architecture evidence only",
      missing_named_compensation_callable_retained: true,
      profile_admitted: false,
      semantic_admission: false,
      runtime_or_delivery_guarantee: false,
      operation_completion_dependency: false,
      promotion: false,
      publication: false,
      release: false,
      deployment: false,
      production_readiness: false,
    },
    synchronized_task_session_closeout: false,
    authority_effect: "none",
  };
  return { ...body, receipt_sha256: sha256Canonical(body) };
}
