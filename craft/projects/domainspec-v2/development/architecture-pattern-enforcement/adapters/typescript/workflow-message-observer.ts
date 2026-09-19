import {
  readLockedRepositoryFile,
  sha256Canonical,
  type LockedRepositoryRef,
} from "../../validators/rmt-workflow-predecessor.ts";
import {
  parseWorkflowGovernanceRecord,
  type WorkflowGovernanceRecord,
} from "./workflow-runtime-observer.ts";

export const WORKFLOW_MESSAGE_STAGES = [
  "intent-observed",
  "send-attempt-observed",
  "provider-accepted",
  "delivered-or-redelivered",
  "application-committed",
] as const;
export type WorkflowMessageStage = (typeof WORKFLOW_MESSAGE_STAGES)[number];

export interface WorkflowMessagePlacementBody {
  schema_version: "ape.workflow-message-placement-declaration/v1";
  declaration_id: string;
  subject_id: string;
  placement: "none" | "direct-transporter" | "child-operation";
  step_id: string | null;
  interface_ref: string | null;
  source_selector: string;
  basis_ref: string;
  owner: "workflow-profile:message-placement-owner";
  authority_effect: "none";
}

export interface WorkflowMessagePlacement extends WorkflowMessagePlacementBody {
  declaration_sha256: string;
}

export interface WorkflowMessageStageEvidence {
  stage: WorkflowMessageStage;
  evidence_ref: string;
}

export interface WorkflowMessageObserverInput {
  repo_root: string;
  source: LockedRepositoryRef;
  subject_id: string;
  placement: unknown | null;
  stage_evidence: readonly WorkflowMessageStageEvidence[];
  external_records: readonly unknown[];
  collapsed_status_claimed: boolean;
  guarantee_claims: readonly string[];
  provider_taxonomy: readonly string[];
  authority_effect: "none";
}

export type WorkflowMessageDiagnostic =
  | "AOP_WF_MESSAGE_PASS"
  | "AOP_WF_MESSAGE_NOT_APPLICABLE"
  | "AOP_WF_MESSAGE_PLACEMENT_OWNER_BLOCKED"
  | "AOP_WF_MESSAGE_INPUT_INVALID"
  | "AOP_WF_MESSAGE_SOURCE_LOCK"
  | "AOP_WF_MESSAGE_PLACEMENT_STALE"
  | "AOP_WF_MESSAGE_PLACEMENT_MISSING"
  | "AOP_WF_MESSAGE_STAGE_COLLAPSE"
  | "AOP_WF_MESSAGE_EXTERNAL_RECORD_REQUIRED"
  | "AOP_WF_MESSAGE_EXTERNAL_RECORD_NOT_ADMITTED"
  | "AOP_WF_MESSAGE_EXTERNAL_RECORD_STALE"
  | "AOP_WF_MESSAGE_SELF_ADMISSION"
  | "AOP_WF_MESSAGE_PROVIDER_TAXONOMY"
  | "AOP_WF_MESSAGE_GUARANTEE_OVERCLAIM"
  | "AOP_WF_MESSAGE_AUTHORITY_GROWTH";

export interface WorkflowMessageStageResult {
  stage: WorkflowMessageStage;
  result: "pass" | "owner-blocked";
  diagnostic: "AOP_WF_MESSAGE_STAGE_PASS" | "AOP_WF_MESSAGE_EXTERNAL_RECORD_REQUIRED" | "AOP_WF_MESSAGE_EXTERNAL_RECORD_NOT_ADMITTED";
  evidence_ref: string;
  record_id: string | null;
  record_sha256: string | null;
}

export interface WorkflowMessageResult {
  schema_version: "ape.workflow-message-observation-result/v1";
  result: "pass" | "not-applicable" | "owner-blocked" | "fail" | "missing" | "block";
  diagnostic: WorkflowMessageDiagnostic;
  selector: string;
  subject_id: string;
  placement: WorkflowMessagePlacement | null;
  stage_results: readonly WorkflowMessageStageResult[];
  joins: readonly {
    stage: WorkflowMessageStage;
    concern_kind: string;
    record_id: string;
    record_sha256: string;
    external_status: string;
    evidence_lane: string;
    ceiling: string;
    assertion_owner: string;
  }[];
  owner_route: "system-integration:transport-delivery-owner";
  delivery_guarantee_claimed: false;
  exactly_once_claimed: false;
  authority_effect: "none";
  result_sha256: string;
}

const PLACEMENT_KEYS = [
  "schema_version",
  "declaration_id",
  "subject_id",
  "placement",
  "step_id",
  "interface_ref",
  "source_selector",
  "basis_ref",
  "owner",
  "authority_effect",
  "declaration_sha256",
] as const;

export function sealWorkflowMessagePlacement(
  body: WorkflowMessagePlacementBody,
): WorkflowMessagePlacement {
  return { ...body, declaration_sha256: sha256Canonical(body) };
}

function parsePlacement(value: unknown): WorkflowMessagePlacement | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
  const placement = value as Record<string, unknown>;
  const keys = Object.keys(placement).sort();
  const expected = [...PLACEMENT_KEYS].sort();
  if (
    keys.length !== expected.length ||
    keys.some((key, index) => key !== expected[index]) ||
    placement.schema_version !== "ape.workflow-message-placement-declaration/v1" ||
    typeof placement.declaration_id !== "string" ||
    placement.declaration_id.length === 0 ||
    typeof placement.subject_id !== "string" ||
    placement.subject_id.length === 0 ||
    !["none", "direct-transporter", "child-operation"].includes(placement.placement as string) ||
    typeof placement.source_selector !== "string" ||
    placement.source_selector.length === 0 ||
    typeof placement.basis_ref !== "string" ||
    placement.basis_ref.length === 0 ||
    placement.owner !== "workflow-profile:message-placement-owner" ||
    placement.authority_effect !== "none" ||
    typeof placement.declaration_sha256 !== "string"
  ) {
    return null;
  }
  const parsed = placement as unknown as WorkflowMessagePlacement;
  if (
    (parsed.placement === "none" &&
      (parsed.step_id !== null || parsed.interface_ref !== null)) ||
    (parsed.placement !== "none" &&
      (typeof parsed.step_id !== "string" ||
        parsed.step_id.length === 0 ||
        typeof parsed.interface_ref !== "string" ||
        parsed.interface_ref.length === 0))
  ) {
    return null;
  }
  const { declaration_sha256: digest, ...body } = parsed;
  return digest === sha256Canonical(body) ? parsed : null;
}

function requiredConcern(stage: WorkflowMessageStage): string | null {
  if (stage === "send-attempt-observed" || stage === "provider-accepted") return "transport";
  if (stage === "delivered-or-redelivered") return "delivery";
  if (stage === "application-committed") return "application-commit";
  return null;
}

function emit(
  input: WorkflowMessageObserverInput,
  result: WorkflowMessageResult["result"],
  diagnostic: WorkflowMessageDiagnostic,
  selector: string,
  placement: WorkflowMessagePlacement | null = null,
  stageResults: readonly WorkflowMessageStageResult[] = [],
  joins: WorkflowMessageResult["joins"] = [],
): WorkflowMessageResult {
  const body = {
    schema_version: "ape.workflow-message-observation-result/v1" as const,
    result,
    diagnostic,
    selector,
    subject_id: input.subject_id ?? "",
    placement,
    stage_results: stageResults,
    joins,
    owner_route: "system-integration:transport-delivery-owner" as const,
    delivery_guarantee_claimed: false as const,
    exactly_once_claimed: false as const,
    authority_effect: "none" as const,
  };
  return { ...body, result_sha256: sha256Canonical(body) };
}

export function observeWorkflowMessageBoundary(
  input: WorkflowMessageObserverInput,
): WorkflowMessageResult {
  if (
    input === null ||
    typeof input !== "object" ||
    typeof input.repo_root !== "string" ||
    typeof input.subject_id !== "string" ||
    input.subject_id.length === 0 ||
    !Array.isArray(input.stage_evidence) ||
    !Array.isArray(input.external_records) ||
    typeof input.collapsed_status_claimed !== "boolean" ||
    !Array.isArray(input.guarantee_claims) ||
    !Array.isArray(input.provider_taxonomy)
  ) {
    return emit(input, "block", "AOP_WF_MESSAGE_INPUT_INVALID", "$" );
  }
  if (input.authority_effect !== "none") {
    return emit(input, "block", "AOP_WF_MESSAGE_AUTHORITY_GROWTH", "$.authority_effect");
  }
  let sourceText: string;
  try {
    sourceText = readLockedRepositoryFile(input.repo_root, input.source, "$.source").toString(
      "utf8",
    );
  } catch {
    return emit(input, "block", "AOP_WF_MESSAGE_SOURCE_LOCK", "$.source");
  }
  if (input.placement === null) {
    return emit(
      input,
      "owner-blocked",
      "AOP_WF_MESSAGE_PLACEMENT_OWNER_BLOCKED",
      "$.placement",
    );
  }
  const placement = parsePlacement(input.placement);
  if (placement === null) {
    return emit(input, "block", "AOP_WF_MESSAGE_PLACEMENT_STALE", "$.placement");
  }
  if (
    placement.subject_id !== input.subject_id ||
    !sourceText.includes(placement.source_selector)
  ) {
    return emit(
      input,
      "missing",
      "AOP_WF_MESSAGE_PLACEMENT_MISSING",
      "$.placement.source_selector",
      placement,
    );
  }
  if (input.provider_taxonomy.length > 0) {
    return emit(input, "fail", "AOP_WF_MESSAGE_PROVIDER_TAXONOMY", "$.provider_taxonomy", placement);
  }
  if (input.guarantee_claims.length > 0) {
    return emit(input, "fail", "AOP_WF_MESSAGE_GUARANTEE_OVERCLAIM", "$.guarantee_claims", placement);
  }
  if (input.collapsed_status_claimed) {
    return emit(input, "fail", "AOP_WF_MESSAGE_STAGE_COLLAPSE", "$.collapsed_status_claimed", placement);
  }
  if (placement.placement === "none") {
    if (input.stage_evidence.length !== 0 || input.external_records.length !== 0) {
      return emit(input, "fail", "AOP_WF_MESSAGE_STAGE_COLLAPSE", "$.stage_evidence", placement);
    }
    return emit(input, "not-applicable", "AOP_WF_MESSAGE_NOT_APPLICABLE", "$.placement", placement);
  }
  const stages = input.stage_evidence.map((entry) => entry.stage);
  if (
    stages.length !== WORKFLOW_MESSAGE_STAGES.length ||
    new Set(stages).size !== stages.length ||
    WORKFLOW_MESSAGE_STAGES.some((stage) => !stages.includes(stage)) ||
    input.stage_evidence.some((entry) => !entry.evidence_ref) ||
    new Set(input.stage_evidence.map((entry) => entry.evidence_ref)).size !==
      input.stage_evidence.length
  ) {
    return emit(input, "fail", "AOP_WF_MESSAGE_STAGE_COLLAPSE", "$.stage_evidence", placement);
  }
  const records = input.external_records.map(parseWorkflowGovernanceRecord);
  if (records.some((record) => record === null)) {
    return emit(input, "block", "AOP_WF_MESSAGE_EXTERNAL_RECORD_STALE", "$.external_records", placement);
  }
  const parsed = records as WorkflowGovernanceRecord[];
  if (
    parsed.some(
      (record) =>
        record.subject_id !== input.subject_id ||
        record.interface_ref !== placement.interface_ref,
    )
  ) {
    return emit(input, "block", "AOP_WF_MESSAGE_EXTERNAL_RECORD_STALE", "$.external_records", placement);
  }
  if (parsed.some((record) => record.assertion_owner === input.subject_id)) {
    return emit(input, "fail", "AOP_WF_MESSAGE_SELF_ADMISSION", "$.external_records", placement);
  }
  const stageResults: WorkflowMessageStageResult[] = [];
  const joins: Array<WorkflowMessageResult["joins"][number]> = [];
  const used = new Set<string>();
  for (const evidence of input.stage_evidence) {
    const concern = requiredConcern(evidence.stage);
    if (concern === null) {
      stageResults.push({
        stage: evidence.stage,
        result: "pass",
        diagnostic: "AOP_WF_MESSAGE_STAGE_PASS",
        evidence_ref: evidence.evidence_ref,
        record_id: null,
        record_sha256: null,
      });
      continue;
    }
    const record = parsed.find(
      (candidate) => candidate.concern_kind === concern && !used.has(candidate.record_id),
    );
    if (record === undefined) {
      stageResults.push({
        stage: evidence.stage,
        result: "owner-blocked",
        diagnostic: "AOP_WF_MESSAGE_EXTERNAL_RECORD_REQUIRED",
        evidence_ref: evidence.evidence_ref,
        record_id: null,
        record_sha256: null,
      });
      continue;
    }
    used.add(record.record_id);
    const admitted =
      record.status === "admitted" && record.evidence_lane === "canonical-governance";
    stageResults.push({
      stage: evidence.stage,
      result: admitted ? "pass" : "owner-blocked",
      diagnostic: admitted
        ? "AOP_WF_MESSAGE_STAGE_PASS"
        : "AOP_WF_MESSAGE_EXTERNAL_RECORD_NOT_ADMITTED",
      evidence_ref: evidence.evidence_ref,
      record_id: record.record_id,
      record_sha256: record.record_sha256,
    });
    joins.push({
      stage: evidence.stage,
      concern_kind: record.concern_kind,
      record_id: record.record_id,
      record_sha256: record.record_sha256,
      external_status: record.status,
      evidence_lane: record.evidence_lane,
      ceiling: record.ceiling,
      assertion_owner: record.assertion_owner,
    });
  }
  if (parsed.some((record) => !used.has(record.record_id))) {
    return emit(input, "block", "AOP_WF_MESSAGE_EXTERNAL_RECORD_STALE", "$.external_records", placement);
  }
  if (stageResults.some((entry) => entry.result === "owner-blocked")) {
    return emit(
      input,
      "owner-blocked",
      parsed.length === 0
        ? "AOP_WF_MESSAGE_EXTERNAL_RECORD_REQUIRED"
        : "AOP_WF_MESSAGE_EXTERNAL_RECORD_NOT_ADMITTED",
      "$.external_records",
      placement,
      stageResults,
      joins,
    );
  }
  return emit(input, "pass", "AOP_WF_MESSAGE_PASS", "$", placement, stageResults, joins);
}
