import {
  readLockedRepositoryFile,
  sha256Canonical,
  type LockedRepositoryRef,
} from "../../validators/rmt-workflow-predecessor.ts";

export interface WorkflowCallablePlacement {
  callable_id: string;
  callable_kind: "Operation" | "Workflow";
  source_selector: string;
  supplied_at_composition_root: boolean;
}

export interface WorkflowCompensationEvidenceStages {
  forward_action_ref: string;
  compensation_invocation_ref: string;
  compensation_failure_ref: string;
  final_residue_ref: string;
}

export interface WorkflowCompensationTraversal {
  form: "explicit-loop" | "reduce" | "other";
  direction: "forward" | "reverse";
  awaited: boolean;
  source_selector: string;
  comparison: "not-compared" | "equivalent";
  semantic_order_claimed: false;
}

export interface WorkflowCompensationObserverInput {
  repo_root: string;
  source: LockedRepositoryRef;
  rmt_oracle: LockedRepositoryRef;
  subject_id: string;
  forward_action: WorkflowCallablePlacement;
  compensation: WorkflowCallablePlacement;
  evidence_stages: WorkflowCompensationEvidenceStages;
  traversal: WorkflowCompensationTraversal;
  provider_construction_selectors: readonly string[];
  overclaim_labels: readonly string[];
  semantic_claims: readonly string[];
  authority_effect: "none";
}

export type WorkflowCompensationDiagnostic =
  | "AOP_WF_COMPENSATION_PASS"
  | "AOP_WF_COMPENSATION_INPUT_INVALID"
  | "AOP_WF_COMPENSATION_SOURCE_LOCK"
  | "AOP_WF_COMPENSATION_ORACLE_LOCK"
  | "AOP_WF_COMPENSATION_ORACLE_INVALID"
  | "AOP_WF_COMPENSATION_CALLABLE_MISSING"
  | "AOP_WF_COMPENSATION_COMPOSITION_BINDING_MISSING"
  | "AOP_WF_COMPENSATION_STAGE_COLLAPSE"
  | "AOP_WF_COMPENSATION_PROVIDER_CONSTRUCTION"
  | "AOP_WF_COMPENSATION_ROLLBACK_OVERCLAIM"
  | "AOP_WF_COMPENSATION_SEMANTIC_ABSORPTION"
  | "AOP_WF_COMPENSATION_DYNAMIC_UNSUPPORTED"
  | "AOP_WF_COMPENSATION_AUTHORITY_GROWTH";

export interface WorkflowCompensationResult {
  schema_version: "ape.workflow-compensation-observation-result/v1";
  result: "pass" | "fail" | "missing" | "unsupported" | "block";
  diagnostic: WorkflowCompensationDiagnostic;
  selector: string;
  subject_id: string;
  forward_action: WorkflowCallablePlacement | null;
  compensation: WorkflowCallablePlacement | null;
  evidence_stages: WorkflowCompensationEvidenceStages | null;
  traversal: WorkflowCompensationTraversal | null;
  owner_route: "ape:typescript-workflow-profile";
  rollback_claimed: false;
  restoration_claimed: false;
  distributed_transaction_claimed: false;
  semantic_result_claimed: false;
  authority_effect: "none";
  result_sha256: string;
}

function emit(
  input: WorkflowCompensationObserverInput,
  result: WorkflowCompensationResult["result"],
  diagnostic: WorkflowCompensationDiagnostic,
  selector: string,
  details: {
    forward?: WorkflowCallablePlacement;
    compensation?: WorkflowCallablePlacement;
    stages?: WorkflowCompensationEvidenceStages;
    traversal?: WorkflowCompensationTraversal;
  } = {},
): WorkflowCompensationResult {
  const body = {
    schema_version: "ape.workflow-compensation-observation-result/v1" as const,
    result,
    diagnostic,
    selector,
    subject_id: input.subject_id ?? "",
    forward_action: details.forward ?? null,
    compensation: details.compensation ?? null,
    evidence_stages: details.stages ?? null,
    traversal: details.traversal ?? null,
    owner_route: "ape:typescript-workflow-profile" as const,
    rollback_claimed: false as const,
    restoration_claimed: false as const,
    distributed_transaction_claimed: false as const,
    semantic_result_claimed: false as const,
    authority_effect: "none" as const,
  };
  return { ...body, result_sha256: sha256Canonical(body) };
}

function validOracle(value: unknown): boolean {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const record = value as Record<string, unknown>;
  if (record.candidate_id !== undefined) {
    const meta = record.meta_type as Record<string, unknown> | undefined;
    const lifecycle = record.lifecycle as Record<string, unknown> | undefined;
    return (
      record.candidate_id ===
        "candidate.settlement.ordered-workflow.workflow-implementation/v1" &&
      meta?.label === "Workflow" &&
      lifecycle?.authority_effect === "none"
    );
  }
  return (
    record.task_id === "TASK-RMT-WF" &&
    record.result === "pass" &&
    record.authority_effect === "none"
  );
}

export function observeWorkflowCompensation(
  input: WorkflowCompensationObserverInput,
): WorkflowCompensationResult {
  if (
    input === null ||
    typeof input !== "object" ||
    typeof input.repo_root !== "string" ||
    typeof input.subject_id !== "string" ||
    input.subject_id.length === 0 ||
    !input.forward_action ||
    !input.compensation ||
    !input.evidence_stages ||
    !input.traversal ||
    !Array.isArray(input.provider_construction_selectors) ||
    !Array.isArray(input.overclaim_labels) ||
    !Array.isArray(input.semantic_claims)
  ) {
    return emit(input, "block", "AOP_WF_COMPENSATION_INPUT_INVALID", "$" );
  }
  if (input.authority_effect !== "none") {
    return emit(
      input,
      "block",
      "AOP_WF_COMPENSATION_AUTHORITY_GROWTH",
      "$.authority_effect",
    );
  }
  let sourceText: string;
  let oracleValue: unknown;
  try {
    sourceText = readLockedRepositoryFile(input.repo_root, input.source, "$.source").toString(
      "utf8",
    );
  } catch {
    return emit(input, "block", "AOP_WF_COMPENSATION_SOURCE_LOCK", "$.source");
  }
  try {
    oracleValue = JSON.parse(
      readLockedRepositoryFile(
        input.repo_root,
        input.rmt_oracle,
        "$.rmt_oracle",
      ).toString("utf8"),
    );
  } catch {
    return emit(input, "block", "AOP_WF_COMPENSATION_ORACLE_LOCK", "$.rmt_oracle");
  }
  if (!validOracle(oracleValue)) {
    return emit(input, "block", "AOP_WF_COMPENSATION_ORACLE_INVALID", "$.rmt_oracle");
  }
  if (/\bReflect\.get\s*\(|\bcompensations\s*\[[^\]"']+\]/u.test(sourceText)) {
    return emit(
      input,
      "unsupported",
      "AOP_WF_COMPENSATION_DYNAMIC_UNSUPPORTED",
      "$.source",
    );
  }
  for (const [key, callable] of [
    ["forward_action", input.forward_action],
    ["compensation", input.compensation],
  ] as const) {
    if (
      !callable.callable_id ||
      !["Operation", "Workflow"].includes(callable.callable_kind) ||
      !callable.source_selector ||
      !sourceText.includes(callable.source_selector)
    ) {
      return emit(
        input,
        "missing",
        "AOP_WF_COMPENSATION_CALLABLE_MISSING",
        `$.${key}`,
      );
    }
    if (!callable.supplied_at_composition_root) {
      return emit(
        input,
        "missing",
        "AOP_WF_COMPENSATION_COMPOSITION_BINDING_MISSING",
        `$.${key}.supplied_at_composition_root`,
      );
    }
  }
  const stageValues = Object.values(input.evidence_stages);
  if (
    stageValues.some((value) => typeof value !== "string" || value.length === 0) ||
    new Set(stageValues).size !== stageValues.length
  ) {
    return emit(
      input,
      "fail",
      "AOP_WF_COMPENSATION_STAGE_COLLAPSE",
      "$.evidence_stages",
    );
  }
  if (input.provider_construction_selectors.length > 0) {
    return emit(
      input,
      "fail",
      "AOP_WF_COMPENSATION_PROVIDER_CONSTRUCTION",
      "$.provider_construction_selectors",
    );
  }
  if (
    input.overclaim_labels.some((label) =>
      /rollback|restor(?:e|ation)|distributed[- ]?transaction|guaranteed[- ]?success/iu.test(
        label,
      ),
    )
  ) {
    return emit(
      input,
      "fail",
      "AOP_WF_COMPENSATION_ROLLBACK_OVERCLAIM",
      "$.overclaim_labels",
    );
  }
  if (input.semantic_claims.length > 0 || input.traversal.semantic_order_claimed !== false) {
    return emit(
      input,
      "fail",
      "AOP_WF_COMPENSATION_SEMANTIC_ABSORPTION",
      "$.semantic_claims",
    );
  }
  if (
    !input.traversal.source_selector ||
    !sourceText.includes(input.traversal.source_selector) ||
    !["explicit-loop", "reduce", "other"].includes(input.traversal.form) ||
    !["forward", "reverse"].includes(input.traversal.direction)
  ) {
    return emit(
      input,
      "missing",
      "AOP_WF_COMPENSATION_CALLABLE_MISSING",
      "$.traversal",
    );
  }
  return emit(input, "pass", "AOP_WF_COMPENSATION_PASS", "$", {
    forward: { ...input.forward_action },
    compensation: { ...input.compensation },
    stages: { ...input.evidence_stages },
    traversal: { ...input.traversal },
  });
}
