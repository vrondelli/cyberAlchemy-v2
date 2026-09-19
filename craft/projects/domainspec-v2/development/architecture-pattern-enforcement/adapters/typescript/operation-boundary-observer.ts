import {
  loadLockedTextSource,
  type LockedSourceInput,
  type OperationEvidenceState,
  type OperationObserverDiagnostic,
  type PacketObservationProjection,
} from "./operation-dependency-observer.ts";

export const OPERATION_BOUNDARY_PHASES = [
  "acquire",
  "decide",
  "guarded-mutation",
  "local-commit",
  "durable-intent",
  "in-process-notification",
  "external-send",
  "instrumentation",
] as const;

export type OperationBoundaryPhase = (typeof OPERATION_BOUNDARY_PHASES)[number];

export const OPERATION_BOUNDARY_OWNERS = [
  "operation-coordinator",
  "repository",
  "client",
  "rule",
  "calculation",
  "entity",
  "aggregate",
  "unit-of-work",
  "outbox-repository",
  "event-handler",
  "transporter",
  "adapter",
  "outer-wrapper",
  "metrics-recorder",
] as const;

export type OperationBoundaryOwner = (typeof OPERATION_BOUNDARY_OWNERS)[number];

export type OperationBoundaryDiagnostic =
  | OperationObserverDiagnostic
  | "AOP_BOUNDARY_PASS"
  | "AOP_BOUNDARY_RMT_SEMANTIC_DUPLICATION"
  | "AOP_BOUNDARY_GRAPH_INVALID"
  | "AOP_BOUNDARY_OWNER_MISMATCH"
  | "AOP_BOUNDARY_CONCRETE_PROVIDER_IMPORT"
  | "AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT"
  | "AOP_BOUNDARY_PROXY_METRIC"
  | "AOP_BOUNDARY_DYNAMIC_UNSUPPORTED"
  | "AOP_BOUNDARY_MISSING_EVIDENCE";

export interface OperationBoundaryNode {
  nodeId: string;
  phase: OperationBoundaryPhase;
  owner: OperationBoundaryOwner;
  sourceSelector: string;
  dependsOn: readonly string[];
  evidenceKind: "static" | "runtime";
}

export interface PureRuleReference {
  ruleId: string;
  sourceSelector: string;
  rmtRelationRef: string;
}

export interface OperationBoundaryObserverInput {
  source: LockedSourceInput;
  rmtContract: Omit<LockedSourceInput, "repoRoot">;
  implementationBindingId: string;
  subjectId: string;
  outcomeId: string;
  nodes: readonly OperationBoundaryNode[];
  pureRuleReferences: readonly PureRuleReference[];
  forbiddenConcreteImportPatterns: readonly string[];
  dynamicResolutionPatterns?: readonly string[];
}

export interface OperationBoundaryResult {
  result: OperationEvidenceState;
  diagnostic: OperationBoundaryDiagnostic;
  selector: string;
  subjectId: string;
  outcomeId: string;
  graph: readonly OperationBoundaryNode[];
  observations: readonly PacketObservationProjection[];
  rmtSemanticPolicy: {
    mode: "reference-only";
    semanticOutcomeEvaluated: false;
    ruleOrderingPromoted: false;
  };
  runtimeGuaranteeClaimed: false;
}

const ALLOWED_OWNERS: Readonly<Record<OperationBoundaryPhase, ReadonlySet<OperationBoundaryOwner>>> = {
  acquire: new Set(["operation-coordinator", "repository", "client"]),
  decide: new Set(["rule", "calculation"]),
  "guarded-mutation": new Set(["operation-coordinator", "entity", "aggregate"]),
  "local-commit": new Set(["unit-of-work"]),
  "durable-intent": new Set(["outbox-repository", "repository"]),
  "in-process-notification": new Set(["event-handler"]),
  "external-send": new Set(["transporter", "adapter"]),
  instrumentation: new Set(["outer-wrapper", "metrics-recorder"]),
};

const SEMANTIC_DUPLICATION_KEYS = new Set([
  "expectedSemanticOutcome",
  "semanticOutcomePass",
  "guardOrderCorrect",
  "ruleBeforeMutationIsPortable",
]);

const PROXY_METRIC_KEYS = new Set([
  "fileCount",
  "dependencyCount",
  "cyclomaticComplexity",
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

function importedModules(source: string): string[] {
  const modules: string[] = [];
  const patterns = [
    /^\s*import(?:\s+type)?\s+[\s\S]*?\s+from\s+["']([^"']+)["'];?/gm,
    /^\s*import\s+["']([^"']+)["'];?/gm,
  ];
  for (const pattern of patterns) {
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(source)) !== null) modules.push(match[1]);
  }
  return [...new Set(modules)].sort();
}

function compilePatterns(patterns: readonly string[]): RegExp[] | null {
  try {
    return patterns.map((pattern) => new RegExp(pattern, "u"));
  } catch {
    return null;
  }
}

function boundaryResult(
  input: OperationBoundaryObserverInput,
  result: OperationEvidenceState,
  diagnostic: OperationBoundaryDiagnostic,
  selector: string,
  graph: readonly OperationBoundaryNode[] = [],
  observations: readonly PacketObservationProjection[] = [],
): OperationBoundaryResult {
  return {
    result,
    diagnostic,
    selector,
    subjectId: input.subjectId,
    outcomeId: input.outcomeId,
    graph,
    observations,
    rmtSemanticPolicy: {
      mode: "reference-only",
      semanticOutcomeEvaluated: false,
      ruleOrderingPromoted: false,
    },
    runtimeGuaranteeClaimed: false,
  };
}

function stable(value: string): string {
  return value.replace(/[^A-Za-z0-9_.-]/gu, "-");
}

export function observeOperationBoundary(
  input: OperationBoundaryObserverInput,
): OperationBoundaryResult {
  const semanticDuplication = findKey(input, SEMANTIC_DUPLICATION_KEYS);
  if (semanticDuplication !== null) {
    return boundaryResult(
      input,
      "fail",
      "AOP_BOUNDARY_RMT_SEMANTIC_DUPLICATION",
      semanticDuplication,
    );
  }
  const proxyMetric = findKey(input, PROXY_METRIC_KEYS);
  if (proxyMetric !== null) {
    return boundaryResult(input, "fail", "AOP_BOUNDARY_PROXY_METRIC", proxyMetric);
  }

  const source = loadLockedTextSource(input.source);
  if (source.result !== "pass") {
    return boundaryResult(input, source.result, source.diagnostic, source.selector);
  }
  const rmtContract = loadLockedTextSource(
    {
      repoRoot: input.source.repoRoot,
      sourceRef: input.rmtContract.sourceRef,
      sourceDigest: input.rmtContract.sourceDigest,
    },
    "$.rmtContract",
  );
  if (rmtContract.result !== "pass") {
    return boundaryResult(input, rmtContract.result, rmtContract.diagnostic, rmtContract.selector);
  }

  if (
    !input.subjectId ||
    !input.outcomeId ||
    !input.implementationBindingId ||
    !Array.isArray(input.nodes) ||
    !Array.isArray(input.pureRuleReferences) ||
    !Array.isArray(input.forbiddenConcreteImportPatterns)
  ) {
    return boundaryResult(input, "block", "AOP_OBSERVER_INPUT_INVALID", "$" );
  }

  const importPatterns = compilePatterns(input.forbiddenConcreteImportPatterns);
  const dynamicPatterns = compilePatterns(
    input.dynamicResolutionPatterns ?? [
      "\\bReflect\\.get\\s*\\(",
      "\\bimport\\s*\\(",
      "\\brequire\\s*\\(\\s*[^'\"]",
    ],
  );
  if (importPatterns === null || dynamicPatterns === null) {
    return boundaryResult(input, "block", "AOP_OBSERVER_INPUT_INVALID", "$.patterns");
  }
  const imports = importedModules(source.source.text);
  const forbiddenImport = imports.find((module) =>
    importPatterns.some((pattern) => pattern.test(module)),
  );
  if (forbiddenImport !== undefined) {
    const instrumentation = /telemetry|metric|instrument|observab/iu.test(forbiddenImport);
    return boundaryResult(
      input,
      "fail",
      instrumentation
        ? "AOP_BOUNDARY_INSTRUMENTATION_PLACEMENT"
        : "AOP_BOUNDARY_CONCRETE_PROVIDER_IMPORT",
      `$.imports.${forbiddenImport}`,
    );
  }
  if (dynamicPatterns.some((pattern) => pattern.test(source.source.text))) {
    return boundaryResult(
      input,
      "unsupported",
      "AOP_BOUNDARY_DYNAMIC_UNSUPPORTED",
      "$.source",
    );
  }

  if (input.nodes.length === 0) {
    return boundaryResult(input, "missing", "AOP_BOUNDARY_MISSING_EVIDENCE", "$.nodes");
  }
  const nodeIds = input.nodes.map((node) => node.nodeId);
  if (new Set(nodeIds).size !== nodeIds.length) {
    return boundaryResult(input, "block", "AOP_BOUNDARY_GRAPH_INVALID", "$.nodes");
  }
  for (let index = 0; index < input.nodes.length; index += 1) {
    const node: OperationBoundaryNode = input.nodes[index];
    if (
      !OPERATION_BOUNDARY_PHASES.includes(node.phase) ||
      !OPERATION_BOUNDARY_OWNERS.includes(node.owner) ||
      !node.nodeId ||
      !node.sourceSelector ||
      !Array.isArray(node.dependsOn) ||
      !["static", "runtime"].includes(node.evidenceKind)
    ) {
      return boundaryResult(
        input,
        "block",
        "AOP_OBSERVER_INPUT_INVALID",
        `$.nodes[${index}]`,
      );
    }
    if (!source.source.text.includes(node.sourceSelector)) {
      return boundaryResult(
        input,
        "missing",
        "AOP_BOUNDARY_MISSING_EVIDENCE",
        `$.nodes[${index}].sourceSelector`,
      );
    }
    if (!ALLOWED_OWNERS[node.phase].has(node.owner)) {
      return boundaryResult(
        input,
        "fail",
        "AOP_BOUNDARY_OWNER_MISMATCH",
        `$.nodes[${index}].owner`,
      );
    }
    if (node.dependsOn.some((dependency: string) => !nodeIds.includes(dependency))) {
      return boundaryResult(
        input,
        "block",
        "AOP_BOUNDARY_GRAPH_INVALID",
        `$.nodes[${index}].dependsOn`,
      );
    }
  }

  for (let index = 0; index < input.pureRuleReferences.length; index += 1) {
    const rule = input.pureRuleReferences[index];
    if (!rule.ruleId || !rule.rmtRelationRef || !source.source.text.includes(rule.sourceSelector)) {
      return boundaryResult(
        input,
        "missing",
        "AOP_BOUNDARY_MISSING_EVIDENCE",
        `$.pureRuleReferences[${index}]`,
      );
    }
  }

  const graph = input.nodes.map((node) => ({ ...node, dependsOn: [...node.dependsOn] }));
  const base = {
    projection_kind: "observed" as const,
    implementation_binding_id: input.implementationBindingId,
    source_ref: input.source.sourceRef,
    source_digest: input.source.sourceDigest,
    provenance_ref: `${input.source.sourceRef}#${input.outcomeId}`,
  };
  const observations: PacketObservationProjection[] = [
    {
      ...base,
      observation_id: `APE.ObservationProjection.operation.boundary.${stable(input.outcomeId)}.cohesion`,
      property_id: "APE.ImplementationProperty.operation.outcome-cohesion",
      observed_value: {
        subject_id: input.subjectId,
        outcome_id: input.outcomeId,
        node_ids: nodeIds,
        semantic_outcome_evaluated: false,
      },
    },
    {
      ...base,
      observation_id: `APE.ObservationProjection.operation.boundary.${stable(input.outcomeId)}.placement`,
      property_id: "APE.ImplementationProperty.operation.value-effect-placement",
      observed_value: {
        phases: graph.map((node) => ({ node_id: node.nodeId, phase: node.phase, owner: node.owner })),
        guard_ordering: "rmt-reference-only",
      },
    },
    {
      ...base,
      observation_id: `APE.ObservationProjection.operation.boundary.${stable(input.outcomeId)}.rules`,
      property_id: "APE.ImplementationProperty.operation.pure-rule-placement",
      observed_value: {
        references: input.pureRuleReferences.map((rule) => ({
          rule_id: rule.ruleId,
          rmt_relation_ref: rule.rmtRelationRef,
          placement: "direct-reference",
        })),
        rule_ordering_promoted: false,
      },
    },
  ];
  const instrumentationNodes = graph.filter((node) => node.phase === "instrumentation");
  if (instrumentationNodes.length > 0) {
    observations.push({
      ...base,
      observation_id: `APE.ObservationProjection.operation.boundary.${stable(input.outcomeId)}.instrumentation`,
      property_id: "APE.ImplementationProperty.operation.instrumentation-placement",
      observed_value: {
        placements: instrumentationNodes.map((node) => ({ node_id: node.nodeId, owner: node.owner })),
        correctness_claimed: false,
      },
    });
  }

  return boundaryResult(input, "pass", "AOP_BOUNDARY_PASS", "$", graph, observations);
}
