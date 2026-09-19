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
import {
  parseWorkflowGovernanceRecord,
  type WorkflowGovernanceRecord,
} from "./workflow-runtime-observer.ts";

export interface WorkflowVersionObservation {
  observation_id: string;
  stored_progress_version: string;
  current_workflow_version: string;
  compatibility: "compatible" | "incompatible" | "unresolved";
  interface_ref: string;
  source_selector: string;
  evidence_ref: string;
}

export interface WorkflowVersionObserverInput {
  repo_root: string;
  source: LockedRepositoryRef;
  subject_id: string;
  mode_input: WorkflowModeDiscriminatorInput;
  observation: WorkflowVersionObservation | null;
  external_records: readonly unknown[];
  replay_or_migration_claims: readonly string[];
  provider_taxonomy: readonly string[];
  authority_effect: "none";
}

export type WorkflowVersionDiagnostic =
  | "AOP_WF_VERSION_PASS"
  | "AOP_WF_VERSION_NOT_APPLICABLE"
  | "AOP_WF_VERSION_MODE_OWNER_BLOCKED"
  | "AOP_WF_VERSION_INPUT_INVALID"
  | "AOP_WF_VERSION_SOURCE_LOCK"
  | "AOP_WF_VERSION_OBSERVATION_MISSING"
  | "AOP_WF_VERSION_COMPATIBILITY_OWNER_BLOCKED"
  | "AOP_WF_VERSION_EXTERNAL_RECORD_REQUIRED"
  | "AOP_WF_VERSION_EXTERNAL_RECORD_NOT_ADMITTED"
  | "AOP_WF_VERSION_EXTERNAL_RECORD_STALE"
  | "AOP_WF_VERSION_SELF_ADMISSION"
  | "AOP_WF_VERSION_PROVIDER_TAXONOMY"
  | "AOP_WF_VERSION_READINESS_OVERCLAIM"
  | "AOP_WF_VERSION_AUTHORITY_GROWTH";

export interface WorkflowVersionResult {
  schema_version: "ape.workflow-version-observation-result/v1";
  result: "pass" | "not-applicable" | "owner-blocked" | "fail" | "missing" | "block";
  diagnostic: WorkflowVersionDiagnostic;
  selector: string;
  subject_id: string;
  mode: WorkflowModeResult["mode"];
  observation: WorkflowVersionObservation | null;
  join: {
    record_id: string;
    record_sha256: string;
    status: "candidate" | "admitted";
    evidence_lane: "candidate-local-prototype" | "canonical-governance";
    ceiling: string;
    assertion_owner: string;
  } | null;
  owner_route: "system-integration:workflow-version-owner";
  replay_readiness_claimed: false;
  migration_readiness_claimed: false;
  authority_effect: "none";
  result_sha256: string;
}

function emit(
  input: WorkflowVersionObserverInput,
  mode: WorkflowModeResult["mode"],
  result: WorkflowVersionResult["result"],
  diagnostic: WorkflowVersionDiagnostic,
  selector: string,
  observation: WorkflowVersionObservation | null = null,
  record: WorkflowGovernanceRecord | null = null,
): WorkflowVersionResult {
  const body = {
    schema_version: "ape.workflow-version-observation-result/v1" as const,
    result,
    diagnostic,
    selector,
    subject_id: input.subject_id ?? "",
    mode,
    observation,
    join: record === null ? null : {
      record_id: record.record_id,
      record_sha256: record.record_sha256,
      status: record.status,
      evidence_lane: record.evidence_lane,
      ceiling: record.ceiling,
      assertion_owner: record.assertion_owner,
    },
    owner_route: "system-integration:workflow-version-owner" as const,
    replay_readiness_claimed: false as const,
    migration_readiness_claimed: false as const,
    authority_effect: "none" as const,
  };
  return { ...body, result_sha256: sha256Canonical(body) };
}

export function observeWorkflowVersion(
  input: WorkflowVersionObserverInput,
): WorkflowVersionResult {
  if (
    input === null ||
    typeof input !== "object" ||
    typeof input.repo_root !== "string" ||
    typeof input.subject_id !== "string" ||
    input.subject_id.length === 0 ||
    !Array.isArray(input.external_records) ||
    !Array.isArray(input.replay_or_migration_claims) ||
    !Array.isArray(input.provider_taxonomy)
  ) {
    return emit(input, null, "block", "AOP_WF_VERSION_INPUT_INVALID", "$" );
  }
  if (input.authority_effect !== "none") {
    return emit(input, null, "block", "AOP_WF_VERSION_AUTHORITY_GROWTH", "$.authority_effect");
  }
  const mode = discriminateWorkflowMode(input.mode_input);
  if (mode.result !== "pass" || mode.subject_id !== input.subject_id) {
    return emit(
      input,
      mode.mode,
      "owner-blocked",
      "AOP_WF_VERSION_MODE_OWNER_BLOCKED",
      "$.mode_input",
    );
  }
  if (input.provider_taxonomy.length > 0) {
    return emit(input, mode.mode, "fail", "AOP_WF_VERSION_PROVIDER_TAXONOMY", "$.provider_taxonomy");
  }
  if (input.replay_or_migration_claims.length > 0) {
    return emit(
      input,
      mode.mode,
      "fail",
      "AOP_WF_VERSION_READINESS_OVERCLAIM",
      "$.replay_or_migration_claims",
    );
  }
  if (mode.mode === "synchronous") {
    if (input.observation !== null || input.external_records.length !== 0) {
      return emit(
        input,
        mode.mode,
        "fail",
        "AOP_WF_VERSION_READINESS_OVERCLAIM",
        "$.observation",
      );
    }
    return emit(
      input,
      mode.mode,
      "not-applicable",
      "AOP_WF_VERSION_NOT_APPLICABLE",
      "$.mode_input",
    );
  }
  if (input.observation === null) {
    return emit(
      input,
      mode.mode,
      "missing",
      "AOP_WF_VERSION_OBSERVATION_MISSING",
      "$.observation",
    );
  }
  let sourceText: string;
  try {
    sourceText = readLockedRepositoryFile(input.repo_root, input.source, "$.source").toString(
      "utf8",
    );
  } catch {
    return emit(input, mode.mode, "block", "AOP_WF_VERSION_SOURCE_LOCK", "$.source");
  }
  const observation = input.observation;
  if (
    !observation.observation_id ||
    !observation.stored_progress_version ||
    !observation.current_workflow_version ||
    !observation.interface_ref ||
    !observation.evidence_ref ||
    !observation.source_selector ||
    !sourceText.includes(observation.source_selector) ||
    !["compatible", "incompatible", "unresolved"].includes(observation.compatibility)
  ) {
    return emit(
      input,
      mode.mode,
      "missing",
      "AOP_WF_VERSION_OBSERVATION_MISSING",
      "$.observation",
    );
  }
  if (observation.compatibility === "unresolved") {
    return emit(
      input,
      mode.mode,
      "owner-blocked",
      "AOP_WF_VERSION_COMPATIBILITY_OWNER_BLOCKED",
      "$.observation.compatibility",
      { ...observation },
    );
  }
  if (input.external_records.length !== 1) {
    return emit(
      input,
      mode.mode,
      "owner-blocked",
      "AOP_WF_VERSION_EXTERNAL_RECORD_REQUIRED",
      "$.external_records",
      { ...observation },
    );
  }
  const record = parseWorkflowGovernanceRecord(input.external_records[0]);
  if (
    record === null ||
    record.concern_kind !== "version" ||
    record.subject_id !== input.subject_id ||
    record.interface_ref !== observation.interface_ref
  ) {
    return emit(
      input,
      mode.mode,
      "block",
      "AOP_WF_VERSION_EXTERNAL_RECORD_STALE",
      "$.external_records[0]",
      { ...observation },
    );
  }
  if (record.assertion_owner === input.subject_id) {
    return emit(
      input,
      mode.mode,
      "fail",
      "AOP_WF_VERSION_SELF_ADMISSION",
      "$.external_records[0].assertion_owner",
      { ...observation },
      record,
    );
  }
  if (record.status !== "admitted" || record.evidence_lane !== "canonical-governance") {
    return emit(
      input,
      mode.mode,
      "owner-blocked",
      "AOP_WF_VERSION_EXTERNAL_RECORD_NOT_ADMITTED",
      "$.external_records[0]",
      { ...observation },
      record,
    );
  }
  return emit(
    input,
    mode.mode,
    "pass",
    "AOP_WF_VERSION_PASS",
    "$",
    { ...observation },
    record,
  );
}
