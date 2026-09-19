import {
  readLockedRepositoryFile,
  sha256Canonical,
  type LockedRepositoryRef,
} from "../../validators/rmt-workflow-predecessor.ts";

export const WORKFLOW_CONTINUATION_ROUTES = [
  "stop",
  "continue",
  "retry",
  "compensate",
  "terminal",
] as const;
export type WorkflowContinuationRoute =
  (typeof WORKFLOW_CONTINUATION_ROUTES)[number];

export interface WorkflowContinuationPlacement {
  route: WorkflowContinuationRoute;
  applicability: "applicable" | "not-applicable" | "owner-blocked";
  placement:
    | "composition-root"
    | "child-result"
    | "workflow-handler"
    | "not-applicable"
    | "owner-blocked";
  evidence_selector: string;
}

export interface WorkflowContinuationObserverInput {
  repo_root: string;
  source: LockedRepositoryRef;
  rmt_oracle: LockedRepositoryRef;
  subject_id: string;
  placements: readonly WorkflowContinuationPlacement[];
  provider_or_service_locator_selectors: readonly string[];
  semantic_claims: readonly string[];
  authority_effect: "none";
}

export type WorkflowContinuationDiagnostic =
  | "AOP_WF_CONTINUATION_PASS"
  | "AOP_WF_CONTINUATION_INPUT_INVALID"
  | "AOP_WF_CONTINUATION_SOURCE_LOCK"
  | "AOP_WF_CONTINUATION_ORACLE_LOCK"
  | "AOP_WF_CONTINUATION_ORACLE_INVALID"
  | "AOP_WF_CONTINUATION_PLACEMENT_MISSING"
  | "AOP_WF_CONTINUATION_OWNER_BLOCKED"
  | "AOP_WF_CONTINUATION_DYNAMIC_UNSUPPORTED"
  | "AOP_WF_CONTINUATION_PROVIDER_RESOLUTION"
  | "AOP_WF_CONTINUATION_SEMANTIC_ABSORPTION"
  | "AOP_WF_CONTINUATION_AUTHORITY_GROWTH";

export interface WorkflowContinuationResult {
  schema_version: "ape.workflow-continuation-observation-result/v1";
  result: "pass" | "fail" | "missing" | "unsupported" | "owner-blocked" | "block";
  diagnostic: WorkflowContinuationDiagnostic;
  selector: string;
  subject_id: string;
  oracle: LockedRepositoryRef | null;
  route_results: readonly WorkflowContinuationPlacement[];
  owner_route: "ape:typescript-workflow-profile";
  semantic_result_claimed: false;
  runtime_guarantee_claimed: false;
  authority_effect: "none";
  result_sha256: string;
}

function emit(
  input: WorkflowContinuationObserverInput,
  result: WorkflowContinuationResult["result"],
  diagnostic: WorkflowContinuationDiagnostic,
  selector: string,
  routes: readonly WorkflowContinuationPlacement[] = [],
  oracle: LockedRepositoryRef | null = null,
): WorkflowContinuationResult {
  const body = {
    schema_version: "ape.workflow-continuation-observation-result/v1" as const,
    result,
    diagnostic,
    selector,
    subject_id: input.subject_id ?? "",
    oracle,
    route_results: routes,
    owner_route: "ape:typescript-workflow-profile" as const,
    semantic_result_claimed: false as const,
    runtime_guarantee_claimed: false as const,
    authority_effect: "none" as const,
  };
  return { ...body, result_sha256: sha256Canonical(body) };
}

function validOracle(value: unknown): boolean {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Record<string, unknown>;
  if (candidate.authority_effect !== undefined && candidate.authority_effect !== "none") {
    return false;
  }
  if (candidate.candidate_id !== undefined) {
    const meta = candidate.meta_type as Record<string, unknown> | undefined;
    return (
      candidate.candidate_id ===
        "candidate.settlement.ordered-workflow.workflow-implementation/v1" &&
      meta?.id === "DS-D1.9" &&
      meta?.label === "Workflow"
    );
  }
  return (
    candidate.task_id === "TASK-RMT-WF" &&
    candidate.result === "pass" &&
    candidate.authority_effect === "none"
  );
}

export function observeWorkflowContinuation(
  input: WorkflowContinuationObserverInput,
): WorkflowContinuationResult {
  if (
    input === null ||
    typeof input !== "object" ||
    typeof input.repo_root !== "string" ||
    typeof input.subject_id !== "string" ||
    input.subject_id.length === 0 ||
    !Array.isArray(input.placements) ||
    !Array.isArray(input.provider_or_service_locator_selectors) ||
    !Array.isArray(input.semantic_claims)
  ) {
    return emit(input, "block", "AOP_WF_CONTINUATION_INPUT_INVALID", "$" );
  }
  if (input.authority_effect !== "none") {
    return emit(
      input,
      "block",
      "AOP_WF_CONTINUATION_AUTHORITY_GROWTH",
      "$.authority_effect",
    );
  }
  let sourceText: string;
  let oracleText: string;
  try {
    sourceText = readLockedRepositoryFile(input.repo_root, input.source, "$.source").toString(
      "utf8",
    );
  } catch {
    return emit(input, "block", "AOP_WF_CONTINUATION_SOURCE_LOCK", "$.source");
  }
  try {
    oracleText = readLockedRepositoryFile(
      input.repo_root,
      input.rmt_oracle,
      "$.rmt_oracle",
    ).toString("utf8");
  } catch {
    return emit(input, "block", "AOP_WF_CONTINUATION_ORACLE_LOCK", "$.rmt_oracle");
  }
  let oracle: unknown;
  try {
    oracle = JSON.parse(oracleText);
  } catch {
    return emit(input, "block", "AOP_WF_CONTINUATION_ORACLE_INVALID", "$.rmt_oracle");
  }
  if (!validOracle(oracle)) {
    return emit(input, "block", "AOP_WF_CONTINUATION_ORACLE_INVALID", "$.rmt_oracle");
  }

  if (
    /\bReflect\.get\s*\(|\bserviceLocator\b|\bcontainer\.resolve\s*\(/u.test(
      sourceText,
    )
  ) {
    return emit(
      input,
      "unsupported",
      "AOP_WF_CONTINUATION_DYNAMIC_UNSUPPORTED",
      "$.source",
      [],
      input.rmt_oracle,
    );
  }
  if (input.provider_or_service_locator_selectors.length > 0) {
    return emit(
      input,
      "fail",
      "AOP_WF_CONTINUATION_PROVIDER_RESOLUTION",
      "$.provider_or_service_locator_selectors",
      [],
      input.rmt_oracle,
    );
  }
  if (input.semantic_claims.length > 0) {
    return emit(
      input,
      "fail",
      "AOP_WF_CONTINUATION_SEMANTIC_ABSORPTION",
      "$.semantic_claims",
      [],
      input.rmt_oracle,
    );
  }
  const routeIds = input.placements.map((entry) => entry.route);
  if (
    routeIds.length !== WORKFLOW_CONTINUATION_ROUTES.length ||
    new Set(routeIds).size !== routeIds.length ||
    WORKFLOW_CONTINUATION_ROUTES.some((route) => !routeIds.includes(route))
  ) {
    return emit(
      input,
      "block",
      "AOP_WF_CONTINUATION_INPUT_INVALID",
      "$.placements",
      [],
      input.rmt_oracle,
    );
  }
  for (let index = 0; index < input.placements.length; index += 1) {
    const row = input.placements[index];
    if (
      !row.evidence_selector ||
      (!sourceText.includes(row.evidence_selector) &&
        !oracleText.includes(row.evidence_selector)) ||
      (row.applicability === "applicable" &&
        !["composition-root", "child-result", "workflow-handler"].includes(
          row.placement,
        )) ||
      (row.applicability === "not-applicable" && row.placement !== "not-applicable") ||
      (row.applicability === "owner-blocked" && row.placement !== "owner-blocked")
    ) {
      return emit(
        input,
        "missing",
        "AOP_WF_CONTINUATION_PLACEMENT_MISSING",
        `$.placements[${index}]`,
        [],
        input.rmt_oracle,
      );
    }
  }
  if (input.placements.some((entry) => entry.applicability === "owner-blocked")) {
    return emit(
      input,
      "owner-blocked",
      "AOP_WF_CONTINUATION_OWNER_BLOCKED",
      "$.placements",
      input.placements.map((entry) => ({ ...entry })),
      input.rmt_oracle,
    );
  }
  return emit(
    input,
    "pass",
    "AOP_WF_CONTINUATION_PASS",
    "$",
    input.placements.map((entry) => ({ ...entry })),
    input.rmt_oracle,
  );
}
