import {
  readLockedRepositoryFile,
  sha256Canonical,
  type LockedRepositoryRef,
} from "../../validators/rmt-workflow-predecessor.ts";
import {
  discriminateWorkflowMode,
  type WorkflowModeDiscriminatorInput,
  type WorkflowModeResult,
} from "./workflow-mode-discriminator.ts";

export const WORKFLOW_RUNTIME_ROLES = [
  "workflow-store",
  "checkpoint",
  "history",
  "scheduler",
] as const;
export type WorkflowRuntimeRole = (typeof WORKFLOW_RUNTIME_ROLES)[number];

export const WORKFLOW_EXTERNAL_CONCERNS = [
  "workflow-runtime",
  "persistence",
  "failure",
  "version",
  "transport",
  "delivery",
  "application-commit",
] as const;
export type WorkflowExternalConcern = (typeof WORKFLOW_EXTERNAL_CONCERNS)[number];

export interface WorkflowGovernanceRecordBody {
  schema_version: "ape.workflow-external-governance-record/v1";
  record_id: string;
  concern_kind: WorkflowExternalConcern;
  subject_id: string;
  interface_ref: string;
  assertion_owner: string;
  status: "candidate" | "admitted";
  evidence_lane: "candidate-local-prototype" | "canonical-governance";
  ceiling: string;
  authority_effect: "none";
}

export interface WorkflowGovernanceRecord extends WorkflowGovernanceRecordBody {
  record_sha256: string;
}

export interface WorkflowRuntimeCapability {
  role: WorkflowRuntimeRole;
  interface_ref: string;
  source_selector: string;
  supplied_at_composition_root: boolean;
}

export interface WorkflowRuntimeObserverInput {
  repo_root: string;
  source: LockedRepositoryRef;
  subject_id: string;
  mode_input: WorkflowModeDiscriminatorInput;
  capabilities: readonly WorkflowRuntimeCapability[];
  external_records: readonly unknown[];
  runtime_guarantee_claims: readonly string[];
  provider_taxonomy: readonly string[];
  authority_effect: "none";
}

export type WorkflowRuntimeDiagnostic =
  | "AOP_WF_RUNTIME_PASS"
  | "AOP_WF_RUNTIME_NOT_APPLICABLE"
  | "AOP_WF_RUNTIME_MODE_OWNER_BLOCKED"
  | "AOP_WF_RUNTIME_INPUT_INVALID"
  | "AOP_WF_RUNTIME_SOURCE_LOCK"
  | "AOP_WF_RUNTIME_CAPABILITY_MISSING"
  | "AOP_WF_RUNTIME_COMPOSITION_BINDING_MISSING"
  | "AOP_WF_RUNTIME_EXTERNAL_RECORD_REQUIRED"
  | "AOP_WF_RUNTIME_EXTERNAL_RECORD_NOT_ADMITTED"
  | "AOP_WF_RUNTIME_EXTERNAL_RECORD_STALE"
  | "AOP_WF_RUNTIME_SELF_ADMISSION"
  | "AOP_WF_RUNTIME_PROVIDER_TAXONOMY"
  | "AOP_WF_RUNTIME_GUARANTEE_OVERCLAIM"
  | "AOP_WF_RUNTIME_AUTHORITY_GROWTH";

export interface WorkflowRuntimeJoin {
  role: WorkflowRuntimeRole;
  interface_ref: string;
  record_id: string;
  record_sha256: string;
  external_status: "candidate" | "admitted";
  evidence_lane: "candidate-local-prototype" | "canonical-governance";
  external_ceiling: string;
  assertion_owner: string;
}

export interface WorkflowRuntimeResult {
  schema_version: "ape.workflow-runtime-observation-result/v1";
  result: "pass" | "not-applicable" | "owner-blocked" | "fail" | "missing" | "block";
  diagnostic: WorkflowRuntimeDiagnostic;
  selector: string;
  subject_id: string;
  mode: WorkflowModeResult["mode"];
  capabilities: readonly WorkflowRuntimeCapability[];
  joins: readonly WorkflowRuntimeJoin[];
  owner_route: "system-integration:workflow-runtime-owner";
  replay_safety_claimed: false;
  migration_safety_claimed: false;
  runtime_guarantee_claimed: false;
  authority_effect: "none";
  result_sha256: string;
}

const RECORD_KEYS = [
  "schema_version",
  "record_id",
  "concern_kind",
  "subject_id",
  "interface_ref",
  "assertion_owner",
  "status",
  "evidence_lane",
  "ceiling",
  "authority_effect",
  "record_sha256",
] as const;

export function sealWorkflowGovernanceRecord(
  body: WorkflowGovernanceRecordBody,
): WorkflowGovernanceRecord {
  return { ...body, record_sha256: sha256Canonical(body) };
}

export function parseWorkflowGovernanceRecord(
  value: unknown,
): WorkflowGovernanceRecord | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record).sort();
  const expected = [...RECORD_KEYS].sort();
  if (
    keys.length !== expected.length ||
    keys.some((key, index) => key !== expected[index]) ||
    record.schema_version !== "ape.workflow-external-governance-record/v1" ||
    typeof record.record_id !== "string" ||
    record.record_id.length === 0 ||
    !WORKFLOW_EXTERNAL_CONCERNS.includes(record.concern_kind as WorkflowExternalConcern) ||
    typeof record.subject_id !== "string" ||
    record.subject_id.length === 0 ||
    typeof record.interface_ref !== "string" ||
    record.interface_ref.length === 0 ||
    typeof record.assertion_owner !== "string" ||
    record.assertion_owner.length === 0 ||
    !["candidate", "admitted"].includes(record.status as string) ||
    !["candidate-local-prototype", "canonical-governance"].includes(
      record.evidence_lane as string,
    ) ||
    typeof record.ceiling !== "string" ||
    record.ceiling.length === 0 ||
    record.authority_effect !== "none" ||
    typeof record.record_sha256 !== "string"
  ) {
    return null;
  }
  const parsed = record as unknown as WorkflowGovernanceRecord;
  const { record_sha256: declared, ...body } = parsed;
  return declared === sha256Canonical(body) ? parsed : null;
}

function emit(
  input: WorkflowRuntimeObserverInput,
  mode: WorkflowModeResult["mode"],
  result: WorkflowRuntimeResult["result"],
  diagnostic: WorkflowRuntimeDiagnostic,
  selector: string,
  capabilities: readonly WorkflowRuntimeCapability[] = [],
  joins: readonly WorkflowRuntimeJoin[] = [],
): WorkflowRuntimeResult {
  const body = {
    schema_version: "ape.workflow-runtime-observation-result/v1" as const,
    result,
    diagnostic,
    selector,
    subject_id: input.subject_id ?? "",
    mode,
    capabilities,
    joins,
    owner_route: "system-integration:workflow-runtime-owner" as const,
    replay_safety_claimed: false as const,
    migration_safety_claimed: false as const,
    runtime_guarantee_claimed: false as const,
    authority_effect: "none" as const,
  };
  return { ...body, result_sha256: sha256Canonical(body) };
}

export function observeWorkflowRuntime(
  input: WorkflowRuntimeObserverInput,
): WorkflowRuntimeResult {
  if (
    input === null ||
    typeof input !== "object" ||
    typeof input.repo_root !== "string" ||
    typeof input.subject_id !== "string" ||
    input.subject_id.length === 0 ||
    !Array.isArray(input.capabilities) ||
    !Array.isArray(input.external_records) ||
    !Array.isArray(input.runtime_guarantee_claims) ||
    !Array.isArray(input.provider_taxonomy)
  ) {
    return emit(input, null, "block", "AOP_WF_RUNTIME_INPUT_INVALID", "$" );
  }
  if (input.authority_effect !== "none") {
    return emit(input, null, "block", "AOP_WF_RUNTIME_AUTHORITY_GROWTH", "$.authority_effect");
  }
  const mode = discriminateWorkflowMode(input.mode_input);
  if (mode.result !== "pass") {
    return emit(
      input,
      mode.mode,
      "owner-blocked",
      "AOP_WF_RUNTIME_MODE_OWNER_BLOCKED",
      "$.mode_input",
    );
  }
  if (mode.subject_id !== input.subject_id) {
    return emit(input, mode.mode, "block", "AOP_WF_RUNTIME_INPUT_INVALID", "$.subject_id");
  }
  if (input.provider_taxonomy.length > 0) {
    return emit(
      input,
      mode.mode,
      "fail",
      "AOP_WF_RUNTIME_PROVIDER_TAXONOMY",
      "$.provider_taxonomy",
    );
  }
  if (input.runtime_guarantee_claims.length > 0) {
    return emit(
      input,
      mode.mode,
      "fail",
      "AOP_WF_RUNTIME_GUARANTEE_OVERCLAIM",
      "$.runtime_guarantee_claims",
    );
  }
  if (mode.mode === "synchronous") {
    if (input.capabilities.length !== 0 || input.external_records.length !== 0) {
      return emit(
        input,
        mode.mode,
        "fail",
        "AOP_WF_RUNTIME_GUARANTEE_OVERCLAIM",
        "$.capabilities",
      );
    }
    return emit(
      input,
      mode.mode,
      "not-applicable",
      "AOP_WF_RUNTIME_NOT_APPLICABLE",
      "$.mode_input",
    );
  }

  let sourceText: string;
  try {
    sourceText = readLockedRepositoryFile(input.repo_root, input.source, "$.source").toString(
      "utf8",
    );
  } catch {
    return emit(input, mode.mode, "block", "AOP_WF_RUNTIME_SOURCE_LOCK", "$.source");
  }
  const roles = input.capabilities.map((capability) => capability.role);
  if (
    roles.length !== WORKFLOW_RUNTIME_ROLES.length ||
    new Set(roles).size !== roles.length ||
    WORKFLOW_RUNTIME_ROLES.some((role) => !roles.includes(role)) ||
    input.capabilities.some(
      (capability) =>
        !capability.interface_ref ||
        !capability.source_selector ||
        !sourceText.includes(capability.source_selector),
    )
  ) {
    return emit(
      input,
      mode.mode,
      "missing",
      "AOP_WF_RUNTIME_CAPABILITY_MISSING",
      "$.capabilities",
    );
  }
  if (input.capabilities.some((capability) => !capability.supplied_at_composition_root)) {
    return emit(
      input,
      mode.mode,
      "missing",
      "AOP_WF_RUNTIME_COMPOSITION_BINDING_MISSING",
      "$.capabilities",
    );
  }
  if (input.external_records.length === 0) {
    return emit(
      input,
      mode.mode,
      "owner-blocked",
      "AOP_WF_RUNTIME_EXTERNAL_RECORD_REQUIRED",
      "$.external_records",
      input.capabilities.map((entry) => ({ ...entry })),
    );
  }
  const records = input.external_records.map(parseWorkflowGovernanceRecord);
  if (records.some((record) => record === null)) {
    return emit(
      input,
      mode.mode,
      "block",
      "AOP_WF_RUNTIME_EXTERNAL_RECORD_STALE",
      "$.external_records",
    );
  }
  const parsed = records as WorkflowGovernanceRecord[];
  if (parsed.some((record) => record.subject_id !== input.subject_id)) {
    return emit(
      input,
      mode.mode,
      "block",
      "AOP_WF_RUNTIME_EXTERNAL_RECORD_STALE",
      "$.external_records.subject_id",
    );
  }
  if (parsed.some((record) => record.assertion_owner === input.subject_id)) {
    return emit(
      input,
      mode.mode,
      "fail",
      "AOP_WF_RUNTIME_SELF_ADMISSION",
      "$.external_records.assertion_owner",
    );
  }
  const joins: WorkflowRuntimeJoin[] = [];
  for (const capability of input.capabilities) {
    const record = parsed.find(
      (candidate) =>
        candidate.concern_kind === "workflow-runtime" &&
        candidate.interface_ref === capability.interface_ref,
    );
    if (record === undefined) {
      return emit(
        input,
        mode.mode,
        "owner-blocked",
        "AOP_WF_RUNTIME_EXTERNAL_RECORD_REQUIRED",
        `$.external_records[${capability.role}]`,
        input.capabilities.map((entry) => ({ ...entry })),
        joins,
      );
    }
    joins.push({
      role: capability.role,
      interface_ref: capability.interface_ref,
      record_id: record.record_id,
      record_sha256: record.record_sha256,
      external_status: record.status,
      evidence_lane: record.evidence_lane,
      external_ceiling: record.ceiling,
      assertion_owner: record.assertion_owner,
    });
  }
  if (
    parsed.length !== input.capabilities.length ||
    parsed.some(
      (record) =>
        record.status !== "admitted" || record.evidence_lane !== "canonical-governance",
    )
  ) {
    return emit(
      input,
      mode.mode,
      "owner-blocked",
      "AOP_WF_RUNTIME_EXTERNAL_RECORD_NOT_ADMITTED",
      "$.external_records",
      input.capabilities.map((entry) => ({ ...entry })),
      joins,
    );
  }
  return emit(
    input,
    mode.mode,
    "pass",
    "AOP_WF_RUNTIME_PASS",
    "$",
    input.capabilities.map((entry) => ({ ...entry })),
    joins,
  );
}
