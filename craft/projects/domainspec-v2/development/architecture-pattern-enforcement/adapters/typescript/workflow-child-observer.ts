import {
  readLockedRepositoryFile,
  sha256Canonical,
  type LockedRepositoryRef,
} from "../../validators/rmt-workflow-predecessor.ts";

export const WORKFLOW_CHILD_PROPERTY_IDS = [
  "APE.WF.P01-NAMED-ORCHESTRATION",
  "APE.WF.P02-CHILD-AUTHORITY",
  "APE.WF.P03-HOF-STEPS",
  "APE.WF.P05-STEP-LOCAL-TRANSACTION",
] as const;

export interface WorkflowChildBinding {
  step_id: string;
  child_id: string;
  child_kind: "Operation" | "Workflow" | "generic-callback";
  source_selector: string;
  supplied_at_composition_root: boolean;
}

export interface WorkflowChildObserverInput {
  repo_root: string;
  source: LockedRepositoryRef;
  subject_id: string;
  orchestration_id: string;
  composition_root_ref: string;
  children: readonly WorkflowChildBinding[];
  child_repository_ownership_selectors: readonly string[];
  duplicated_child_rule_selectors: readonly string[];
  direct_entity_mutation_selectors: readonly string[];
  provider_construction_selectors: readonly string[];
  workflow_wide_transaction_claimed: boolean;
  semantic_claims: readonly string[];
  authority_effect: "none";
}

export type WorkflowChildDiagnostic =
  | "AOP_WF_CHILD_PASS"
  | "AOP_WF_CHILD_INPUT_INVALID"
  | "AOP_WF_CHILD_SOURCE_LOCK"
  | "AOP_WF_CHILD_IDENTITY_MISSING"
  | "AOP_WF_CHILD_GENERIC_UNSUPPORTED"
  | "AOP_WF_CHILD_DYNAMIC_UNSUPPORTED"
  | "AOP_WF_CHILD_COMPOSITION_BINDING_MISSING"
  | "AOP_WF_CHILD_REPOSITORY_ABSORPTION"
  | "AOP_WF_CHILD_RULE_ABSORPTION"
  | "AOP_WF_CHILD_ENTITY_MUTATION"
  | "AOP_WF_CHILD_PROVIDER_CONSTRUCTION"
  | "AOP_WF_CHILD_TRANSACTION_COLLAPSE"
  | "AOP_WF_CHILD_SEMANTIC_ABSORPTION"
  | "AOP_WF_CHILD_AUTHORITY_GROWTH";

export interface WorkflowChildObservation {
  observation_id: string;
  property_id: (typeof WORKFLOW_CHILD_PROPERTY_IDS)[number];
  observed_value: unknown;
  source_ref: string;
  source_sha256: string;
  authority_effect: "none";
}

export interface WorkflowChildResult {
  schema_version: "ape.workflow-child-observation-result/v1";
  result: "pass" | "fail" | "missing" | "unsupported" | "block";
  diagnostic: WorkflowChildDiagnostic;
  selector: string;
  subject_id: string;
  observations: readonly WorkflowChildObservation[];
  owner_route: "ape:typescript-workflow-profile";
  semantic_result_claimed: false;
  runtime_guarantee_claimed: false;
  authority_effect: "none";
  result_sha256: string;
}

const DYNAMIC_PATTERNS = [
  /\bReflect\.get\s*\(/u,
  /\bimport\s*\(\s*[^'"`]/u,
  /\brequire\s*\(\s*[^'"`]/u,
  /\bsteps\s*\[[^\]"']+\]/u,
];
const PROVIDER_PATTERNS = [
  /\bnew\s+[A-Za-z0-9_]*(?:Client|Provider|Repository|Transporter)\s*\(/u,
  /\bcreate(?:Client|Provider|Transporter)\s*\(/u,
  /\bserviceLocator\b/u,
];
const REPOSITORY_ABSORPTION_PATTERNS = [
  /\bchildRepository\b/u,
  /\b[A-Za-z0-9_]+Repository\s*\.\s*(?:save|update|delete|insert)\s*\(/u,
];
const ENTITY_MUTATION_PATTERNS = [
  /\bchildEntity\s*\.[A-Za-z0-9_]+\s*=/u,
  /\bmutateChildEntity\s*\(/u,
];

function output(
  input: WorkflowChildObserverInput,
  result: WorkflowChildResult["result"],
  diagnostic: WorkflowChildDiagnostic,
  selector: string,
  observations: readonly WorkflowChildObservation[] = [],
): WorkflowChildResult {
  const body = {
    schema_version: "ape.workflow-child-observation-result/v1" as const,
    result,
    diagnostic,
    selector,
    subject_id: input.subject_id ?? "",
    observations,
    owner_route: "ape:typescript-workflow-profile" as const,
    semantic_result_claimed: false as const,
    runtime_guarantee_claimed: false as const,
    authority_effect: "none" as const,
  };
  return { ...body, result_sha256: sha256Canonical(body) };
}

function firstPresentSelector(text: string, selectors: readonly string[]): number {
  return selectors.findIndex((selector) => selector.length > 0 && text.includes(selector));
}

export function observeWorkflowChildren(
  input: WorkflowChildObserverInput,
): WorkflowChildResult {
  if (
    input === null ||
    typeof input !== "object" ||
    typeof input.repo_root !== "string" ||
    typeof input.subject_id !== "string" ||
    input.subject_id.length === 0 ||
    typeof input.orchestration_id !== "string" ||
    input.orchestration_id.length === 0 ||
    typeof input.composition_root_ref !== "string" ||
    input.composition_root_ref.length === 0 ||
    !Array.isArray(input.children) ||
    input.children.length === 0 ||
    !Array.isArray(input.child_repository_ownership_selectors) ||
    !Array.isArray(input.duplicated_child_rule_selectors) ||
    !Array.isArray(input.direct_entity_mutation_selectors) ||
    !Array.isArray(input.provider_construction_selectors) ||
    !Array.isArray(input.semantic_claims)
  ) {
    return output(input, "block", "AOP_WF_CHILD_INPUT_INVALID", "$" );
  }
  if (input.authority_effect !== "none") {
    return output(input, "block", "AOP_WF_CHILD_AUTHORITY_GROWTH", "$.authority_effect");
  }

  let text: string;
  try {
    text = readLockedRepositoryFile(input.repo_root, input.source, "$.source").toString(
      "utf8",
    );
  } catch {
    return output(input, "block", "AOP_WF_CHILD_SOURCE_LOCK", "$.source");
  }

  if (DYNAMIC_PATTERNS.some((pattern) => pattern.test(text))) {
    return output(input, "unsupported", "AOP_WF_CHILD_DYNAMIC_UNSUPPORTED", "$.source");
  }
  const genericIndex = input.children.findIndex(
    (child) => child.child_kind === "generic-callback",
  );
  if (genericIndex >= 0) {
    return output(
      input,
      "unsupported",
      "AOP_WF_CHILD_GENERIC_UNSUPPORTED",
      `$.children[${genericIndex}].child_kind`,
    );
  }
  const childIds = input.children.map((child) => child.child_id);
  const stepIds = input.children.map((child) => child.step_id);
  if (
    new Set(childIds).size !== childIds.length ||
    new Set(stepIds).size !== stepIds.length ||
    input.children.some(
      (child) =>
        !child.child_id ||
        !child.step_id ||
        !["Operation", "Workflow"].includes(child.child_kind) ||
        !child.source_selector ||
        !text.includes(child.source_selector),
    )
  ) {
    return output(input, "missing", "AOP_WF_CHILD_IDENTITY_MISSING", "$.children");
  }
  const unsupplied = input.children.findIndex(
    (child) => child.supplied_at_composition_root !== true,
  );
  if (unsupplied >= 0) {
    return output(
      input,
      "missing",
      "AOP_WF_CHILD_COMPOSITION_BINDING_MISSING",
      `$.children[${unsupplied}].supplied_at_composition_root`,
    );
  }
  if (
    input.child_repository_ownership_selectors.length > 0 ||
    REPOSITORY_ABSORPTION_PATTERNS.some((pattern) => pattern.test(text))
  ) {
    return output(
      input,
      "fail",
      "AOP_WF_CHILD_REPOSITORY_ABSORPTION",
      "$.child_repository_ownership_selectors",
    );
  }
  if (input.duplicated_child_rule_selectors.length > 0) {
    return output(
      input,
      "fail",
      "AOP_WF_CHILD_RULE_ABSORPTION",
      "$.duplicated_child_rule_selectors",
    );
  }
  if (
    input.direct_entity_mutation_selectors.length > 0 ||
    ENTITY_MUTATION_PATTERNS.some((pattern) => pattern.test(text))
  ) {
    return output(
      input,
      "fail",
      "AOP_WF_CHILD_ENTITY_MUTATION",
      "$.direct_entity_mutation_selectors",
    );
  }
  if (
    input.provider_construction_selectors.length > 0 ||
    PROVIDER_PATTERNS.some((pattern) => pattern.test(text))
  ) {
    return output(
      input,
      "fail",
      "AOP_WF_CHILD_PROVIDER_CONSTRUCTION",
      "$.provider_construction_selectors",
    );
  }
  if (input.workflow_wide_transaction_claimed) {
    return output(
      input,
      "fail",
      "AOP_WF_CHILD_TRANSACTION_COLLAPSE",
      "$.workflow_wide_transaction_claimed",
    );
  }
  if (input.semantic_claims.length > 0) {
    return output(
      input,
      "fail",
      "AOP_WF_CHILD_SEMANTIC_ABSORPTION",
      "$.semantic_claims",
    );
  }

  const base = {
    source_ref: input.source.path,
    source_sha256: input.source.sha256,
    authority_effect: "none" as const,
  };
  const observations: WorkflowChildObservation[] = [
    {
      ...base,
      observation_id: `${input.subject_id}:named-orchestration`,
      property_id: "APE.WF.P01-NAMED-ORCHESTRATION",
      observed_value: {
        orchestration_id: input.orchestration_id,
        composition_root_ref: input.composition_root_ref,
      },
    },
    {
      ...base,
      observation_id: `${input.subject_id}:child-authority`,
      property_id: "APE.WF.P02-CHILD-AUTHORITY",
      observed_value: {
        retained: true,
        child_repository_owned: false,
        child_rule_duplicated: false,
        child_entity_mutated: false,
      },
    },
    {
      ...base,
      observation_id: `${input.subject_id}:named-children`,
      property_id: "APE.WF.P03-HOF-STEPS",
      observed_value: input.children.map((child) => ({
        step_id: child.step_id,
        child_id: child.child_id,
        child_kind: child.child_kind,
        supplied_at_composition_root: child.supplied_at_composition_root,
      })),
    },
    {
      ...base,
      observation_id: `${input.subject_id}:step-local-transaction`,
      property_id: "APE.WF.P05-STEP-LOCAL-TRANSACTION",
      observed_value: {
        child_local: true,
        workflow_wide_transaction_claimed: false,
      },
    },
  ];
  return output(input, "pass", "AOP_WF_CHILD_PASS", "$", observations);
}
