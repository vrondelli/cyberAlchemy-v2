import {
  loadLockedTextSource,
  type LockedSourceInput,
  type OperationEvidenceState,
  type OperationObserverDiagnostic,
  type PacketObservationProjection,
} from "./operation-dependency-observer.ts";

export const COST_METRICS = ["external-call-count", "traversal-pass-count"] as const;
export type CostMetric = (typeof COST_METRICS)[number];

export const BUDGET_COMPARATORS = ["less-than", "less-than-or-equal", "equal"] as const;
export type BudgetComparator = (typeof BUDGET_COMPARATORS)[number];

export interface CostDimension {
  dimensionId: string;
  sourceSelector: string;
  unit: string;
}

export interface ExpensiveOperationObservation {
  operationId: string;
  kind: "repository-call" | "client-call" | "provider-call" | "sort" | "lookup" | "allocation";
  sourceSelector: string;
  callsExpression: string;
  observedCalls?: number;
}

export interface TraversalPassObservation {
  passId: string;
  dimensionId: string;
  sourceSelector: string;
  form: "explicit-loop" | "reduce" | "map" | "filter" | "sort" | "lookup" | "single-call";
  awaited: boolean;
  preservesOrder: boolean;
  hasEffects: boolean;
  cleanup: "none" | "explicit" | "implicit";
  allocation: "none" | "bounded" | "cardinality-dependent" | "unknown";
  earlyExit: boolean;
  rationale: string;
}

export interface TraversalEquivalenceDimensions {
  result: boolean;
  order: boolean;
  errors: boolean;
  effects: boolean;
  consumption: boolean;
  termination: boolean;
  cleanup: boolean;
  allocation: boolean;
  earlyExit: boolean;
  declaredCost: boolean;
}

export interface TraversalComparison {
  comparisonId: string;
  beforeForm: string;
  afterForm: string;
  dimensions: TraversalEquivalenceDimensions;
}

export interface OwnerCostBudget {
  ownerRoute?: string;
  applicability?: string;
  metric?: CostMetric;
  comparator?: BudgetComparator;
  threshold?: number;
  positiveFixtureIds?: readonly string[];
  hostileFixtureIds?: readonly string[];
  suppressionPolicy?: string;
  escalationPolicy?: string;
}

export interface OperationCostObserverInput {
  source: LockedSourceInput;
  implementationBindingId: string;
  subjectId: string;
  dimensions: readonly CostDimension[];
  expensiveOperations: readonly ExpensiveOperationObservation[];
  traversalPasses: readonly TraversalPassObservation[];
  comparisons: readonly TraversalComparison[];
  ownerBudget?: OwnerCostBudget;
  dynamicResolutionPatterns?: readonly string[];
}

export type OperationCostDiagnostic =
  | OperationObserverDiagnostic
  | "AOP_COST_PASS"
  | "AOP_COST_ADVISORY_NO_BUDGET"
  | "AOP_COST_OWNER_BUDGET_INCOMPLETE"
  | "AOP_COST_BUDGET_EXCEEDED"
  | "AOP_COST_EQUIVALENCE_CHANGED"
  | "AOP_COST_SYNTAX_SHORTCUT"
  | "AOP_COST_REPOSITORY_NON_INFERENCE"
  | "AOP_COST_MISSING_EVIDENCE"
  | "AOP_COST_DYNAMIC_UNSUPPORTED";

export interface OperationCostResult {
  result: OperationEvidenceState | "flag";
  diagnostic: OperationCostDiagnostic;
  selector: string;
  subjectId: string;
  measuredValue: number | null;
  budgetThreshold: number | null;
  observations: readonly PacketObservationProjection[];
  severity: "none" | "advisory" | "owner-blocked" | "profile-fail";
  runtimeGuaranteeClaimed: false;
}

const SYNTAX_SHORTCUT_KEYS = new Set([
  "requiredLoopForm",
  "mandatoryReduce",
  "singlePassRequired",
]);
const REPOSITORY_INFERENCE_KEYS = new Set([
  "repositoryGuaranteesQueryBudget",
  "repositoryProvesNPlusOneSafe",
  "bigOAsObservedBudget",
]);

function findKey(value: unknown, keys: ReadonlySet<string>, selector = "$" ): string | null {
  if (Array.isArray(value)) {
    for (let index = 0; index < value.length; index += 1) {
      const found = findKey(value[index], keys, `${selector}[${index}]`);
      if (found !== null) return found;
    }
    return null;
  }
  if (value === null || typeof value !== "object") return null;
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const childSelector = `${selector}.${key}`;
    if (keys.has(key)) return childSelector;
    const found = findKey(child, keys, childSelector);
    if (found !== null) return found;
  }
  return null;
}

function compilePatterns(patterns: readonly string[]): RegExp[] | null {
  try {
    return patterns.map((pattern) => new RegExp(pattern, "u"));
  } catch {
    return null;
  }
}

function result(
  input: OperationCostObserverInput,
  outcome: OperationCostResult["result"],
  diagnostic: OperationCostDiagnostic,
  selector: string,
  severity: OperationCostResult["severity"],
  measuredValue: number | null = null,
  budgetThreshold: number | null = null,
  observations: readonly PacketObservationProjection[] = [],
): OperationCostResult {
  return {
    result: outcome,
    diagnostic,
    selector,
    subjectId: input.subjectId,
    measuredValue,
    budgetThreshold,
    observations,
    severity,
    runtimeGuaranteeClaimed: false,
  };
}

function completeBudget(budget: OwnerCostBudget): budget is Required<OwnerCostBudget> {
  return (
    typeof budget.ownerRoute === "string" && budget.ownerRoute.length > 0 &&
    typeof budget.applicability === "string" && budget.applicability.length > 0 &&
    budget.metric !== undefined && COST_METRICS.includes(budget.metric) &&
    budget.comparator !== undefined && BUDGET_COMPARATORS.includes(budget.comparator) &&
    typeof budget.threshold === "number" && Number.isFinite(budget.threshold) && budget.threshold >= 0 &&
    Array.isArray(budget.positiveFixtureIds) && budget.positiveFixtureIds.length > 0 &&
    Array.isArray(budget.hostileFixtureIds) && budget.hostileFixtureIds.length > 0 &&
    typeof budget.suppressionPolicy === "string" && budget.suppressionPolicy.length > 0 &&
    typeof budget.escalationPolicy === "string" && budget.escalationPolicy.length > 0
  );
}

function budgetPasses(value: number, comparator: BudgetComparator, threshold: number): boolean {
  if (comparator === "less-than") return value < threshold;
  if (comparator === "less-than-or-equal") return value <= threshold;
  return value === threshold;
}

function stable(value: string): string {
  return value.replace(/[^A-Za-z0-9_.-]/gu, "-");
}

export function observeOperationCost(
  input: OperationCostObserverInput,
): OperationCostResult {
  const source = loadLockedTextSource(input.source);
  if (source.result !== "pass") {
    return result(input, source.result, source.diagnostic, source.selector, "none");
  }

  const syntaxShortcut = findKey(input, SYNTAX_SHORTCUT_KEYS);
  if (syntaxShortcut !== null) {
    return result(input, "fail", "AOP_COST_SYNTAX_SHORTCUT", syntaxShortcut, "profile-fail");
  }
  const repositoryInference = findKey(input, REPOSITORY_INFERENCE_KEYS);
  if (repositoryInference !== null) {
    return result(
      input,
      "fail",
      "AOP_COST_REPOSITORY_NON_INFERENCE",
      repositoryInference,
      "profile-fail",
    );
  }

  if (
    !input.subjectId ||
    !input.implementationBindingId ||
    !Array.isArray(input.dimensions) ||
    !Array.isArray(input.expensiveOperations) ||
    !Array.isArray(input.traversalPasses) ||
    !Array.isArray(input.comparisons)
  ) {
    return result(input, "block", "AOP_OBSERVER_INPUT_INVALID", "$", "none");
  }
  const dynamicPatterns = compilePatterns(
    input.dynamicResolutionPatterns ?? [
      "\\bReflect\\.get\\s*\\(",
      "\\bimport\\s*\\(",
      "\\brequire\\s*\\(\\s*[^'\"]",
    ],
  );
  if (dynamicPatterns === null) {
    return result(input, "block", "AOP_OBSERVER_INPUT_INVALID", "$.dynamicResolutionPatterns", "none");
  }
  if (dynamicPatterns.some((pattern) => pattern.test(source.source.text))) {
    return result(input, "unsupported", "AOP_COST_DYNAMIC_UNSUPPORTED", "$.source", "none");
  }

  const dimensionIds = input.dimensions.map((dimension) => dimension.dimensionId);
  const expensiveIds = input.expensiveOperations.map((operation) => operation.operationId);
  const passIds = input.traversalPasses.map((pass) => pass.passId);
  const comparisonIds = input.comparisons.map((comparison) => comparison.comparisonId);
  if (
    input.dimensions.length === 0 ||
    new Set(dimensionIds).size !== dimensionIds.length ||
    new Set(expensiveIds).size !== expensiveIds.length ||
    new Set(passIds).size !== passIds.length ||
    new Set(comparisonIds).size !== comparisonIds.length
  ) {
    return result(input, "block", "AOP_OBSERVER_INPUT_INVALID", "$.evidence", "none");
  }

  for (let index = 0; index < input.dimensions.length; index += 1) {
    const dimension = input.dimensions[index];
    if (!dimension.dimensionId || !dimension.unit || !source.source.text.includes(dimension.sourceSelector)) {
      return result(
        input,
        "missing",
        "AOP_COST_MISSING_EVIDENCE",
        `$.dimensions[${index}].sourceSelector`,
        "none",
      );
    }
  }
  for (let index = 0; index < input.expensiveOperations.length; index += 1) {
    const operation = input.expensiveOperations[index];
    if (
      !operation.operationId ||
      !operation.callsExpression ||
      !source.source.text.includes(operation.sourceSelector) ||
      (operation.observedCalls !== undefined &&
        (!Number.isInteger(operation.observedCalls) || operation.observedCalls < 0))
    ) {
      return result(
        input,
        "missing",
        "AOP_COST_MISSING_EVIDENCE",
        `$.expensiveOperations[${index}]`,
        "none",
      );
    }
  }
  for (let index = 0; index < input.traversalPasses.length; index += 1) {
    const pass = input.traversalPasses[index];
    if (
      !pass.passId ||
      !dimensionIds.includes(pass.dimensionId) ||
      !pass.rationale ||
      !source.source.text.includes(pass.sourceSelector)
    ) {
      return result(
        input,
        "missing",
        "AOP_COST_MISSING_EVIDENCE",
        `$.traversalPasses[${index}]`,
        "none",
      );
    }
  }

  for (let index = 0; index < input.comparisons.length; index += 1) {
    const comparison = input.comparisons[index];
    const values = Object.values(comparison.dimensions);
    if (!comparison.comparisonId || !comparison.beforeForm || !comparison.afterForm || values.length !== 10) {
      return result(input, "block", "AOP_OBSERVER_INPUT_INVALID", `$.comparisons[${index}]`, "none");
    }
    if (values.some((value) => value !== true)) {
      return result(
        input,
        "fail",
        "AOP_COST_EQUIVALENCE_CHANGED",
        `$.comparisons[${index}].dimensions`,
        "profile-fail",
      );
    }
  }

  const base = {
    projection_kind: "observed" as const,
    implementation_binding_id: input.implementationBindingId,
    source_ref: input.source.sourceRef,
    source_digest: input.source.sourceDigest,
    provenance_ref: `${input.source.sourceRef}#cost-and-traversal`,
  };
  const observations: PacketObservationProjection[] = [
    {
      ...base,
      observation_id: `APE.ObservationProjection.operation.cost.${stable(input.subjectId)}`,
      property_id: "APE.ImplementationProperty.operation.cost-observation",
      observed_value: {
        dimensions: input.dimensions.map((dimension) => ({ ...dimension })),
        expensive_operations: input.expensiveOperations.map((operation) => ({ ...operation })),
        threshold_invented: false,
        repository_guarantee_inferred: false,
      },
    },
    {
      ...base,
      observation_id: `APE.ObservationProjection.operation.traversal.${stable(input.subjectId)}`,
      property_id: "APE.ImplementationProperty.operation.traversal-equivalence",
      observed_value: {
        passes: input.traversalPasses.map((pass) => ({ ...pass })),
        comparisons: input.comparisons.map((comparison) => ({
          ...comparison,
          dimensions: { ...comparison.dimensions },
        })),
        syntax_preference: "none",
      },
    },
  ];

  if (input.ownerBudget === undefined) {
    return result(
      input,
      "flag",
      "AOP_COST_ADVISORY_NO_BUDGET",
      "$.ownerBudget",
      "advisory",
      null,
      null,
      observations,
    );
  }
  if (!completeBudget(input.ownerBudget)) {
    return result(
      input,
      "owner-blocked",
      "AOP_COST_OWNER_BUDGET_INCOMPLETE",
      "$.ownerBudget",
      "owner-blocked",
      null,
      null,
      observations,
    );
  }

  const measuredValue =
    input.ownerBudget.metric === "external-call-count"
      ? input.expensiveOperations.reduce(
          (total, operation) => total + (operation.observedCalls ?? 0),
          0,
        )
      : input.traversalPasses.length;
  const passes = budgetPasses(
    measuredValue,
    input.ownerBudget.comparator,
    input.ownerBudget.threshold,
  );
  return result(
    input,
    passes ? "pass" : "fail",
    passes ? "AOP_COST_PASS" : "AOP_COST_BUDGET_EXCEEDED",
    "$.ownerBudget",
    passes ? "none" : "profile-fail",
    measuredValue,
    input.ownerBudget.threshold,
    observations,
  );
}
