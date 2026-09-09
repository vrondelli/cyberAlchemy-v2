import { canonicalJson } from "../input/source-manifest.js";
import { FROZEN_META_TYPE_CATALOG } from "../meta-types/catalog.js";
import type { SupportedLanguage } from "../meta-types/types.js";
import type { GeneratorInput, GeneratorRegistration } from "./contracts.js";

const EXTENSIONS = Object.freeze({ typescript: "ts", python: "py", rust: "rs" } as const);
const LOWER_IDENTIFIER_KEYWORDS = new Set([
  "as", "async", "await", "break", "case", "catch", "class", "const", "continue", "crate", "def", "default", "del", "do", "else", "enum", "except", "export", "extends", "false", "finally", "fn", "for", "from", "function", "global", "if", "impl", "import", "in", "interface", "is", "lambda", "let", "loop", "match", "mod", "move", "mut", "new", "none", "nonlocal", "not", "null", "pass", "pub", "raise", "ref", "return", "self", "static", "struct", "super", "switch", "this", "throw", "trait", "true", "try", "type", "typeof", "unsafe", "use", "var", "while", "with", "yield",
]);

function words(value: string): string[] {
  return value.split(/[^A-Za-z0-9]+/).filter(Boolean);
}

function pascal(value: string): string {
  const raw = words(value).map((word) => `${word[0]?.toUpperCase() ?? ""}${word.slice(1)}`).join("");
  const result = raw || "DomainNode";
  return /^[A-Za-z_]/.test(result) ? result : `Domain${result}`;
}

function camel(value: string): string {
  const result = pascal(value);
  const candidate = `${result[0]?.toLowerCase() ?? "d"}${result.slice(1)}`;
  return LOWER_IDENTIFIER_KEYWORDS.has(candidate) ? `domain${result}` : candidate;
}

function snake(value: string): string {
  const raw = words(value).map((word) => word.toLowerCase()).join("_") || "domain_node";
  const candidate = /^[A-Za-z_]/.test(raw) ? raw : `domain_${raw}`;
  return LOWER_IDENTIFIER_KEYWORDS.has(candidate) ? `domain_${candidate}` : candidate;
}

function uniqueNames(values: readonly string[], transform: (value: string) => string, label: string): readonly string[] {
  const result = values.map(transform);
  if (new Set(result).size !== result.length) throw new Error(`${label} values collide after identifier normalization`);
  return result;
}

function strings(value: string | readonly string[] | undefined): readonly string[] {
  return Array.isArray(value) ? value : [];
}

function text(value: string | readonly string[] | undefined, fallback: string): string {
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

function provenance(input: GeneratorInput, comment: "//" | "#"): string {
  const metadata = canonicalJson({
    baseline_id: FROZEN_META_TYPE_CATALOG.baseline_id,
    baseline_digest: FROZEN_META_TYPE_CATALOG.baseline_digest,
    meta_type_id: input.meta_type_id,
    meta_type_label: input.kind,
    language: input.realization.language,
    source_sha256: input.realization.source.sha256,
    provider_sha256: input.realization.provider.sha256,
    binding_sha256: input.realization.binding.sha256,
  });
  const relationships = canonicalJson(input.relationships);
  const body = canonicalJson(input.body);
  return `${comment} domainspec-meta: ${metadata}\n${comment} domainspec-body: ${body}\n${comment} domainspec-relationships: ${relationships}\n`;
}

function workflowOperationIds(input: GeneratorInput): readonly string[] {
  return Object.freeze([...new Set(input.relationships
    .filter((relationship) => relationship.relationship === "orchestrates"
      && relationship.source.node_id === input.node_id
      && relationship.source.kind === "Workflow"
      && relationship.target.kind === "Operation")
    .map((relationship) => relationship.target.node_id))]);
}

function renderTypeScriptWorkflow(input: GeneratorInput, name: string, fn: string, header: string): string {
  const body = input.body;
  return `${header}// domainspec-workflow-recovery-results: ["not-required","recovery-required"]
// domainspec-recovery-intent-statuses: ["required","satisfied","unresolved"]
// domainspec-workflow-compensation-execution: false
// domainspec-compensation-contract: "forward-recovery-operation/v2"
// domainspec-compensation-order: "explicit-dependency-graph-with-reverse-completion-default"
// domainspec-compensation-executor-owner: "external-runtime"
// domainspec-compensation-operation-role: "Operation"
export const ${name}Steps = Object.freeze(${JSON.stringify(strings(body.steps))});
export const ${name}Compensations = Object.freeze(${JSON.stringify(strings(body.compensations))});
export const ${name}CompensationDependencies: readonly string[] = Object.freeze(${JSON.stringify(strings(body.compensation_dependencies))});
export const ${name}OrchestratedOperationIds: readonly string[] = Object.freeze(${JSON.stringify(workflowOperationIds(input))});
export type ${name}Digest = (material: string) => string;
export type ${name}RecoveryPlanEntry = Readonly<{ planOccurrenceId: string; stepId: string; operationId: string; dependsOn: readonly string[]; invocationIdentity: string }>;
export type ${name}RecoveryIntent = Readonly<{ schemaVersion: "domainspec.workflow-recovery-intent/v2"; intentId: string; workflowId: ${JSON.stringify(input.node_id)}; workflowExecutionId: string; failureOccurrenceId: string; failedStepId: string; completedStepJournalDigest: string; planDigest: string; semanticStatus: "required"; plan: readonly ${name}RecoveryPlanEntry[] }>;
export type ${name}RecoveryDecision = Readonly<{ schemaVersion: "domainspec.workflow-recovery-decision/v1"; workflowEvaluationResult: "not-required" | "recovery-required"; recoveryIntent: ${name}RecoveryIntent | null }>;
function ${fn}RequireIdentity(value: string, label: string): void {
  if (!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value)) throw new Error("invalid recovery identity:" + label + ":" + value);
}
function ${fn}Digest(material: string, digest: ${name}Digest): string {
  const value = digest(material);
  if (!/^[0-9a-f]{64}$/.test(value)) throw new Error("digest callback must return lowercase SHA-256 hex");
  return value;
}
function ${fn}PlanMaterial(plan: readonly Omit<${name}RecoveryPlanEntry, "invocationIdentity">[]): string {
  return ["domainspec.workflow-recovery-plan/v1", ...plan.map((entry) => [entry.planOccurrenceId, entry.stepId, entry.operationId, entry.dependsOn.join(",")].join("|"))].join("\\n");
}
function ${fn}InvocationIdentity(intentId: string, planDigest: string, operationId: string, planOccurrenceId: string, digest: ${name}Digest): string {
  return ${fn}Digest(["domainspec.compensation-invocation-identity/v1", intentId, planDigest, operationId, planOccurrenceId].join("\\n"), digest);
}
export function plan${name}Recovery(completedStepIds: readonly string[], failedStepId: string, workflowExecutionId: string, failureOccurrenceId: string, digest: ${name}Digest): ${name}RecoveryDecision {
  ${fn}RequireIdentity(workflowExecutionId, "workflowExecutionId");
  ${fn}RequireIdentity(failureOccurrenceId, "failureOccurrenceId");
  ${fn}RequireIdentity(failedStepId, "failedStepId");
  if (new Set(completedStepIds).size !== completedStepIds.length) throw new Error("completed step IDs must be unique");
  const selected: Array<{ planOccurrenceId: string; stepId: string; operationId: string; dependencyOperationIds: readonly string[] }> = [];
  completedStepIds.forEach((stepId, completionIndex) => {
    ${fn}RequireIdentity(stepId, "completedStepId");
    const index = ${name}Steps.indexOf(stepId);
    if (index < 0) throw new Error("unknown completed step:" + stepId);
    const operationId = ${name}Compensations[index] ?? "none";
    if (operationId === "none") return;
    ${fn}RequireIdentity(operationId, "recoveryOperationId");
    if (!${name}OrchestratedOperationIds.includes(operationId)) throw new Error("recovery Operation is outside Workflow relation set:" + operationId);
    const dependencyOperationIds = ${name}CompensationDependencies.filter((entry) => entry.startsWith(operationId + ":depends-on:")).map((entry) => {
      const parts = entry.split(":depends-on:");
      if (parts.length !== 2 || !parts[1]) throw new Error("invalid compensation dependency:" + entry);
      return parts[1];
    });
    selected.push(Object.freeze({ planOccurrenceId: stepId + "-" + operationId + "-" + (completionIndex + 1), stepId, operationId, dependencyOperationIds: Object.freeze(dependencyOperationIds) }));
  });
  selected.reverse();
  if (selected.length === 0) return Object.freeze({ schemaVersion: "domainspec.workflow-recovery-decision/v1", workflowEvaluationResult: "not-required", recoveryIntent: null });
  const pending = selected.map((entry) => Object.freeze({
    planOccurrenceId: entry.planOccurrenceId,
    stepId: entry.stepId,
    operationId: entry.operationId,
    dependsOn: Object.freeze(entry.dependencyOperationIds.map((dependency) => {
      const occurrences = selected.filter(({ operationId }) => operationId === dependency);
      if (dependency === entry.operationId || occurrences.length !== 1) throw new Error("invalid or ambiguous compensation dependency:" + entry.operationId + ":" + dependency);
      return occurrences[0]!.planOccurrenceId;
    })),
  }));
  const ordered: Array<(typeof pending)[number]> = [];
  const remaining = [...pending];
  const emitted = new Set<string>();
  while (remaining.length > 0) {
    const index = remaining.findIndex((entry) => entry.dependsOn.every((dependency) => emitted.has(dependency)));
    if (index < 0) throw new Error("cyclic compensation dependency");
    const [next] = remaining.splice(index, 1);
    if (!next) throw new Error("missing recovery plan entry");
    ordered.push(next);
    emitted.add(next.planOccurrenceId);
  }
  const completedStepJournalDigest = ${fn}Digest(["domainspec.workflow-completed-step-journal/v1", ...completedStepIds].join("\\n"), digest);
  const planDigest = ${fn}Digest(${fn}PlanMaterial(ordered), digest);
  const intentId = ${fn}Digest(["domainspec.workflow-recovery-intent/v2", workflowExecutionId, failureOccurrenceId, failedStepId, completedStepJournalDigest, planDigest].join("\\n"), digest);
  const plan = Object.freeze(ordered.map((entry) => Object.freeze({ ...entry, invocationIdentity: ${fn}InvocationIdentity(intentId, planDigest, entry.operationId, entry.planOccurrenceId, digest) })));
  return Object.freeze({ schemaVersion: "domainspec.workflow-recovery-decision/v1", workflowEvaluationResult: "recovery-required", recoveryIntent: Object.freeze({ schemaVersion: "domainspec.workflow-recovery-intent/v2", intentId, workflowId: ${JSON.stringify(input.node_id)}, workflowExecutionId, failureOccurrenceId, failedStepId, completedStepJournalDigest, planDigest, semanticStatus: "required", plan }) });
}
export type ${name}Outcome = Readonly<{ ok: boolean; completed: readonly string[]; failedStep: string | null; workflowEvaluationResult: "not-required" | "recovery-required"; recoveryIntent: ${name}RecoveryIntent | null; compensationExecution: false; directEffectsExecuted: readonly string[] }>;
export async function ${fn}(run: (step: string) => Promise<void>, compensate: (operationId: string) => Promise<void>, workflowExecutionId: string, failureOccurrenceId: string, digest: ${name}Digest): Promise<${name}Outcome> {
  void compensate;
  const completed: string[] = [];
  for (const step of ${name}Steps) {
    try { await run(step); completed.push(step); }
    catch {
      const decision = plan${name}Recovery(completed, step, workflowExecutionId, failureOccurrenceId, digest);
      return Object.freeze({ ok: false, completed: Object.freeze([...completed]), failedStep: step, workflowEvaluationResult: decision.workflowEvaluationResult, recoveryIntent: decision.recoveryIntent, compensationExecution: false, directEffectsExecuted: Object.freeze([] as string[]) });
    }
  }
  return Object.freeze({ ok: true, completed: Object.freeze([...completed]), failedStep: null, workflowEvaluationResult: "not-required", recoveryIntent: null, compensationExecution: false, directEffectsExecuted: Object.freeze([] as string[]) });
}
export type ${name}RecoveryBinding = Readonly<{ workflowId: ${JSON.stringify(input.node_id)}; operationId: string; failureContinuation: "retry" | "escalate" | "terminal-failure"; invoke: (invocationIdentity: string) => Promise<Readonly<{ ok: true }> | Readonly<{ ok: false; reason: string }>> }>;
export type ${name}RecoveryInvocationReport = Readonly<{ schemaVersion: "domainspec.workflow-recovery-in-process-report/v1"; outcome: "succeeded" | "failed"; executedPlanOccurrenceIds: readonly string[]; failedPlanOccurrenceId: string | null; failureContinuation: "retry" | "escalate" | "terminal-failure" | null; reason: string | null; recoveryIntentSemanticStatus: "required"; durableTerminalDisposition: null }>;
function verify${name}RecoveryIntent(intent: ${name}RecoveryIntent, digest: ${name}Digest): void {
  if (intent.semanticStatus !== "required") throw new Error("Recovery Intent is not executable");
  if (intent.workflowId !== ${JSON.stringify(input.node_id)}) throw new Error("Recovery Intent Workflow mismatch");
  const emitted = new Set<string>();
  const planForDigest: Array<Omit<${name}RecoveryPlanEntry, "invocationIdentity">> = [];
  for (const entry of intent.plan) {
    if (!${name}OrchestratedOperationIds.includes(entry.operationId)) throw new Error("recovery target is outside Workflow relation set:" + entry.operationId);
    if (emitted.has(entry.planOccurrenceId) || entry.dependsOn.some((dependency) => !emitted.has(dependency))) throw new Error("invalid recovery plan order");
    emitted.add(entry.planOccurrenceId);
    planForDigest.push(Object.freeze({ planOccurrenceId: entry.planOccurrenceId, stepId: entry.stepId, operationId: entry.operationId, dependsOn: entry.dependsOn }));
  }
  const observedPlanDigest = ${fn}Digest(${fn}PlanMaterial(planForDigest), digest);
  if (observedPlanDigest !== intent.planDigest) throw new Error("Recovery Intent plan digest mismatch");
  const observedIntentId = ${fn}Digest(["domainspec.workflow-recovery-intent/v2", intent.workflowExecutionId, intent.failureOccurrenceId, intent.failedStepId, intent.completedStepJournalDigest, intent.planDigest].join("\\n"), digest);
  if (observedIntentId !== intent.intentId) throw new Error("Recovery Intent identity mismatch");
  for (const entry of intent.plan) if (entry.invocationIdentity !== ${fn}InvocationIdentity(intent.intentId, intent.planDigest, entry.operationId, entry.planOccurrenceId, digest)) throw new Error("Recovery Intent invocation identity mismatch:" + entry.planOccurrenceId);
}
export async function execute${name}Recovery(intent: ${name}RecoveryIntent, bindings: readonly ${name}RecoveryBinding[], digest: ${name}Digest): Promise<${name}RecoveryInvocationReport> {
  verify${name}RecoveryIntent(intent, digest);
  const requiredOperationIds = new Set(intent.plan.map(({ operationId }) => operationId));
  const registry = new Map<string, ${name}RecoveryBinding>();
  for (const binding of bindings) {
    if (!${name}OrchestratedOperationIds.includes(binding.operationId)) throw new Error("binding is outside Workflow relation set:" + binding.operationId);
    if (binding.workflowId !== intent.workflowId) throw new Error("binding Workflow mismatch:" + binding.operationId);
    if (!requiredOperationIds.has(binding.operationId)) throw new Error("undeclared recovery binding:" + binding.operationId);
    if (registry.has(binding.operationId)) throw new Error("duplicate recovery binding:" + binding.operationId);
    registry.set(binding.operationId, binding);
  }
  for (const operationId of requiredOperationIds) if (!registry.has(operationId)) throw new Error("missing recovery Operation:" + operationId);
  const executed: string[] = [];
  for (const entry of intent.plan) {
    const binding = registry.get(entry.operationId)!;
    let result: Awaited<ReturnType<${name}RecoveryBinding["invoke"]>>;
    try { result = await binding.invoke(entry.invocationIdentity); }
    catch (error) { result = Object.freeze({ ok: false, reason: error instanceof Error ? error.message : "recovery-operation-threw" }); }
    if (!result.ok) return Object.freeze({ schemaVersion: "domainspec.workflow-recovery-in-process-report/v1", outcome: "failed", executedPlanOccurrenceIds: Object.freeze([...executed]), failedPlanOccurrenceId: entry.planOccurrenceId, failureContinuation: binding.failureContinuation, reason: result.reason, recoveryIntentSemanticStatus: "required", durableTerminalDisposition: null });
    executed.push(entry.planOccurrenceId);
  }
  return Object.freeze({ schemaVersion: "domainspec.workflow-recovery-in-process-report/v1", outcome: "succeeded", executedPlanOccurrenceIds: Object.freeze(executed), failedPlanOccurrenceId: null, failureContinuation: null, reason: null, recoveryIntentSemanticStatus: "required", durableTerminalDisposition: null });
}
`;
}

function renderPythonWorkflow(input: GeneratorInput, name: string, fn: string, header: string): string {
  const body = input.body;
  const constant = name.toUpperCase();
  return `${header}# domainspec-workflow-recovery-results: ["not-required","recovery-required"]
# domainspec-recovery-intent-statuses: ["required","satisfied","unresolved"]
# domainspec-workflow-compensation-execution: false
# domainspec-compensation-contract: "forward-recovery-operation/v2"
# domainspec-compensation-order: "explicit-dependency-graph-with-reverse-completion-default"
# domainspec-compensation-executor-owner: "external-runtime"
# domainspec-compensation-operation-role: "Operation"
${constant}_STEPS = tuple(${JSON.stringify(strings(body.steps))})
${constant}_COMPENSATIONS = tuple(${JSON.stringify(strings(body.compensations))})
${constant}_COMPENSATION_DEPENDENCIES = tuple(${JSON.stringify(strings(body.compensation_dependencies))})
${constant}_ORCHESTRATED_OPERATION_IDS = tuple(${JSON.stringify(workflowOperationIds(input))})

def _${fn}_require_identity(value: str, label: str) -> None:
    if not value or not value[0].islower() or any(character not in "abcdefghijklmnopqrstuvwxyz0123456789-" for character in value) or "--" in value or value.endswith("-"):
        raise ValueError("invalid recovery identity:" + label + ":" + value)

def _${fn}_digest(material: str, digest) -> str:
    value = digest(material)
    if not isinstance(value, str) or len(value) != 64 or any(character not in "0123456789abcdef" for character in value):
        raise ValueError("digest callback must return lowercase SHA-256 hex")
    return value

def _${fn}_plan_material(plan: list[dict[str, object]]) -> str:
    rows = ["domainspec.workflow-recovery-plan/v1"]
    rows.extend("|".join((str(entry["plan_occurrence_id"]), str(entry["step_id"]), str(entry["operation_id"]), ",".join(str(value) for value in entry["depends_on"]))) for entry in plan)
    return "\\n".join(rows)

def _${fn}_invocation_identity(intent_id: str, plan_digest: str, operation_id: str, plan_occurrence_id: str, digest) -> str:
    return _${fn}_digest("\\n".join(("domainspec.compensation-invocation-identity/v1", intent_id, plan_digest, operation_id, plan_occurrence_id)), digest)

def plan_${fn}_recovery(completed_step_ids: list[str], failed_step_id: str, workflow_execution_id: str, failure_occurrence_id: str, digest) -> dict[str, object]:
    _${fn}_require_identity(workflow_execution_id, "workflow_execution_id")
    _${fn}_require_identity(failure_occurrence_id, "failure_occurrence_id")
    _${fn}_require_identity(failed_step_id, "failed_step_id")
    if len(set(completed_step_ids)) != len(completed_step_ids):
        raise ValueError("completed step IDs must be unique")
    selected: list[dict[str, object]] = []
    for completion_index, step_id in enumerate(completed_step_ids):
        _${fn}_require_identity(step_id, "completed_step_id")
        if step_id not in ${constant}_STEPS:
            raise ValueError("unknown completed step:" + step_id)
        index = ${constant}_STEPS.index(step_id)
        operation_id = ${constant}_COMPENSATIONS[index] if index < len(${constant}_COMPENSATIONS) else "none"
        if operation_id == "none":
            continue
        _${fn}_require_identity(operation_id, "recovery_operation_id")
        if operation_id not in ${constant}_ORCHESTRATED_OPERATION_IDS:
            raise ValueError("recovery Operation is outside Workflow relation set:" + operation_id)
        prefix = operation_id + ":depends-on:"
        dependency_operation_ids = [entry[len(prefix):] for entry in ${constant}_COMPENSATION_DEPENDENCIES if entry.startswith(prefix)]
        selected.append({"plan_occurrence_id": step_id + "-" + operation_id + "-" + str(completion_index + 1), "step_id": step_id, "operation_id": operation_id, "dependency_operation_ids": dependency_operation_ids})
    selected.reverse()
    if not selected:
        return {"schema_version": "domainspec.workflow-recovery-decision/v1", "workflow_evaluation_result": "not-required", "recovery_intent": None}
    pending: list[dict[str, object]] = []
    for entry in selected:
        depends_on: list[str] = []
        for dependency in entry["dependency_operation_ids"]:
            occurrences = [candidate for candidate in selected if candidate["operation_id"] == dependency]
            if dependency == entry["operation_id"] or len(occurrences) != 1:
                raise ValueError("invalid or ambiguous compensation dependency:" + str(entry["operation_id"]) + ":" + str(dependency))
            depends_on.append(str(occurrences[0]["plan_occurrence_id"]))
        pending.append({"plan_occurrence_id": entry["plan_occurrence_id"], "step_id": entry["step_id"], "operation_id": entry["operation_id"], "depends_on": depends_on})
    ordered: list[dict[str, object]] = []
    emitted: set[str] = set()
    while pending:
        index = next((index for index, entry in enumerate(pending) if all(str(dependency) in emitted for dependency in entry["depends_on"])), -1)
        if index < 0:
            raise ValueError("cyclic compensation dependency")
        next_entry = pending.pop(index)
        ordered.append(next_entry)
        emitted.add(str(next_entry["plan_occurrence_id"]))
    completed_step_journal_digest = _${fn}_digest("\\n".join(("domainspec.workflow-completed-step-journal/v1", *completed_step_ids)), digest)
    plan_digest = _${fn}_digest(_${fn}_plan_material(ordered), digest)
    intent_id = _${fn}_digest("\\n".join(("domainspec.workflow-recovery-intent/v2", workflow_execution_id, failure_occurrence_id, failed_step_id, completed_step_journal_digest, plan_digest)), digest)
    plan = [{**entry, "invocation_identity": _${fn}_invocation_identity(intent_id, plan_digest, str(entry["operation_id"]), str(entry["plan_occurrence_id"]), digest)} for entry in ordered]
    return {"schema_version": "domainspec.workflow-recovery-decision/v1", "workflow_evaluation_result": "recovery-required", "recovery_intent": {"schema_version": "domainspec.workflow-recovery-intent/v2", "intent_id": intent_id, "workflow_id": ${JSON.stringify(input.node_id)}, "workflow_execution_id": workflow_execution_id, "failure_occurrence_id": failure_occurrence_id, "failed_step_id": failed_step_id, "completed_step_journal_digest": completed_step_journal_digest, "plan_digest": plan_digest, "semantic_status": "required", "plan": plan}}

def ${fn}(run, compensate, workflow_execution_id: str, failure_occurrence_id: str, digest) -> dict[str, object]:
    _ = compensate
    completed: list[str] = []
    for step in ${constant}_STEPS:
        try:
            run(step)
            completed.append(step)
        except Exception:
            decision = plan_${fn}_recovery(completed, step, workflow_execution_id, failure_occurrence_id, digest)
            return {"ok": False, "completed": completed, "failed_step": step, "workflow_evaluation_result": decision["workflow_evaluation_result"], "recovery_intent": decision["recovery_intent"], "compensation_execution": False, "direct_effects_executed": []}
    return {"ok": True, "completed": completed, "failed_step": None, "workflow_evaluation_result": "not-required", "recovery_intent": None, "compensation_execution": False, "direct_effects_executed": []}

def _verify_${fn}_recovery_intent(intent: dict[str, object], digest) -> None:
    if intent["semantic_status"] != "required" or intent["workflow_id"] != ${JSON.stringify(input.node_id)}:
        raise ValueError("Recovery Intent is not executable for this Workflow")
    plan = list(intent["plan"])
    emitted: set[str] = set()
    plan_for_digest: list[dict[str, object]] = []
    for entry in plan:
        operation_id = str(entry["operation_id"])
        occurrence_id = str(entry["plan_occurrence_id"])
        if operation_id not in ${constant}_ORCHESTRATED_OPERATION_IDS:
            raise ValueError("recovery target is outside Workflow relation set:" + operation_id)
        if occurrence_id in emitted or any(str(dependency) not in emitted for dependency in entry["depends_on"]):
            raise ValueError("invalid recovery plan order")
        emitted.add(occurrence_id)
        plan_for_digest.append({"plan_occurrence_id": occurrence_id, "step_id": entry["step_id"], "operation_id": operation_id, "depends_on": entry["depends_on"]})
    if _${fn}_digest(_${fn}_plan_material(plan_for_digest), digest) != intent["plan_digest"]:
        raise ValueError("Recovery Intent plan digest mismatch")
    observed_intent_id = _${fn}_digest("\\n".join(("domainspec.workflow-recovery-intent/v2", str(intent["workflow_execution_id"]), str(intent["failure_occurrence_id"]), str(intent["failed_step_id"]), str(intent["completed_step_journal_digest"]), str(intent["plan_digest"]))), digest)
    if observed_intent_id != intent["intent_id"]:
        raise ValueError("Recovery Intent identity mismatch")
    for entry in plan:
        expected = _${fn}_invocation_identity(str(intent["intent_id"]), str(intent["plan_digest"]), str(entry["operation_id"]), str(entry["plan_occurrence_id"]), digest)
        if entry["invocation_identity"] != expected:
            raise ValueError("Recovery Intent invocation identity mismatch")

def execute_${fn}_recovery(intent: dict[str, object], bindings: list[dict[str, object]], digest) -> dict[str, object]:
    _verify_${fn}_recovery_intent(intent, digest)
    plan = list(intent["plan"])
    required_operation_ids = {str(entry["operation_id"]) for entry in plan}
    registry: dict[str, dict[str, object]] = {}
    for binding in bindings:
        operation_id = str(binding["operation_id"])
        if operation_id not in ${constant}_ORCHESTRATED_OPERATION_IDS:
            raise ValueError("binding is outside Workflow relation set:" + operation_id)
        if binding["workflow_id"] != intent["workflow_id"]:
            raise ValueError("binding Workflow mismatch:" + operation_id)
        if operation_id not in required_operation_ids:
            raise ValueError("undeclared recovery binding:" + operation_id)
        if operation_id in registry:
            raise ValueError("duplicate recovery binding:" + operation_id)
        registry[operation_id] = binding
    for operation_id in required_operation_ids:
        if operation_id not in registry:
            raise ValueError("missing recovery Operation:" + operation_id)
    executed: list[str] = []
    for entry in plan:
        operation_id = str(entry["operation_id"])
        binding = registry[operation_id]
        try:
            result = binding["invoke"](str(entry["invocation_identity"]))
        except Exception as error:
            result = {"ok": False, "reason": str(error) or "recovery-operation-threw"}
        if not result["ok"]:
            return {"schema_version": "domainspec.workflow-recovery-in-process-report/v1", "outcome": "failed", "executed_plan_occurrence_ids": executed, "failed_plan_occurrence_id": entry["plan_occurrence_id"], "failure_continuation": binding["failure_continuation"], "reason": result.get("reason", "recovery-operation-failed"), "recovery_intent_semantic_status": "required", "durable_terminal_disposition": None}
        executed.append(str(entry["plan_occurrence_id"]))
    return {"schema_version": "domainspec.workflow-recovery-in-process-report/v1", "outcome": "succeeded", "executed_plan_occurrence_ids": executed, "failed_plan_occurrence_id": None, "failure_continuation": None, "reason": None, "recovery_intent_semantic_status": "required", "durable_terminal_disposition": None}
`;
}

function renderRustWorkflow(input: GeneratorInput, name: string, fn: string, header: string): string {
  const body = input.body;
  const constant = snake(name).toUpperCase();
  return `${header}// domainspec-workflow-recovery-results: ["not-required","recovery-required"]
// domainspec-recovery-intent-statuses: ["required","satisfied","unresolved"]
// domainspec-workflow-compensation-execution: false
// domainspec-compensation-contract: "forward-recovery-operation/v2"
// domainspec-compensation-order: "explicit-dependency-graph-with-reverse-completion-default"
// domainspec-compensation-executor-owner: "external-runtime"
// domainspec-compensation-operation-role: "Operation"
use std::collections::BTreeSet;
pub const ${constant}_STEPS: &[&str] = ${rustSlice(strings(body.steps))};
pub const ${constant}_COMPENSATIONS: &[&str] = ${rustSlice(strings(body.compensations))};
pub const ${constant}_COMPENSATION_DEPENDENCIES: &[&str] = ${rustSlice(strings(body.compensation_dependencies))};
pub const ${constant}_ORCHESTRATED_OPERATION_IDS: &[&str] = ${rustSlice(workflowOperationIds(input))};
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ${name}RecoveryPlanEntry { pub plan_occurrence_id: String, pub step_id: String, pub operation_id: String, pub depends_on: Vec<String>, pub invocation_identity: String }
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ${name}RecoveryIntent { pub schema_version: &'static str, pub intent_id: String, pub workflow_id: &'static str, pub workflow_execution_id: String, pub failure_occurrence_id: String, pub failed_step_id: String, pub completed_step_journal_digest: String, pub plan_digest: String, pub semantic_status: &'static str, pub plan: Vec<${name}RecoveryPlanEntry> }
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ${name}RecoveryDecision { pub schema_version: &'static str, pub workflow_evaluation_result: &'static str, pub recovery_intent: Option<${name}RecoveryIntent> }
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ${name}Outcome { pub ok: bool, pub completed: Vec<String>, pub failed_step: Option<String>, pub workflow_evaluation_result: &'static str, pub recovery_intent: Option<${name}RecoveryIntent>, pub compensation_execution: bool, pub direct_effects_executed: Vec<String> }
fn ${fn}_identity_valid(value: &str) -> bool {
    let bytes = value.as_bytes();
    !bytes.is_empty() && bytes[0].is_ascii_lowercase() && bytes.iter().all(|byte| byte.is_ascii_lowercase() || byte.is_ascii_digit() || *byte == b'-') && !value.contains("--") && !value.ends_with('-')
}
fn ${fn}_digest(material: &str, digest: &impl Fn(&str) -> String) -> Result<String, &'static str> {
    let value = digest(material);
    if value.len() != 64 || !value.bytes().all(|byte| byte.is_ascii_digit() || (b'a'..=b'f').contains(&byte)) { return Err("digest callback must return lowercase SHA-256 hex"); }
    Ok(value)
}
fn ${fn}_plan_material(plan: &[${name}RecoveryPlanEntry]) -> String {
    let mut rows = vec!["domainspec.workflow-recovery-plan/v1".to_owned()];
    rows.extend(plan.iter().map(|entry| [&entry.plan_occurrence_id, &entry.step_id, &entry.operation_id, &entry.depends_on.join(",")].iter().map(|value| value.as_str()).collect::<Vec<_>>().join("|")));
    rows.join("\\n")
}
fn ${fn}_invocation_identity(intent_id: &str, plan_digest: &str, operation_id: &str, plan_occurrence_id: &str, digest: &impl Fn(&str) -> String) -> Result<String, &'static str> {
    ${fn}_digest(&["domainspec.compensation-invocation-identity/v1", intent_id, plan_digest, operation_id, plan_occurrence_id].join("\\n"), digest)
}
pub fn plan_${fn}_recovery(completed_step_ids: &[String], failed_step_id: &str, workflow_execution_id: &str, failure_occurrence_id: &str, digest: &impl Fn(&str) -> String) -> Result<${name}RecoveryDecision, &'static str> {
    if !${fn}_identity_valid(workflow_execution_id) || !${fn}_identity_valid(failure_occurrence_id) || !${fn}_identity_valid(failed_step_id) { return Err("invalid recovery identity"); }
    let completed_set: BTreeSet<&str> = completed_step_ids.iter().map(String::as_str).collect();
    if completed_set.len() != completed_step_ids.len() { return Err("completed step IDs must be unique"); }
    #[derive(Clone)]
    struct Selected { plan_occurrence_id: String, step_id: String, operation_id: String, dependency_operation_ids: Vec<String> }
    let mut selected: Vec<Selected> = Vec::new();
    for (completion_index, step_id) in completed_step_ids.iter().enumerate() {
        if !${fn}_identity_valid(step_id) { return Err("invalid completed step identity"); }
        let index = ${constant}_STEPS.iter().position(|candidate| *candidate == step_id).ok_or("unknown completed step")?;
        let operation_id = ${constant}_COMPENSATIONS.get(index).copied().unwrap_or("none");
        if operation_id == "none" { continue; }
        if !${fn}_identity_valid(operation_id) || !${constant}_ORCHESTRATED_OPERATION_IDS.contains(&operation_id) { return Err("recovery Operation is outside Workflow relation set"); }
        let prefix = operation_id.to_owned() + ":depends-on:";
        let dependency_operation_ids = ${constant}_COMPENSATION_DEPENDENCIES.iter().filter_map(|entry| entry.strip_prefix(&prefix).map(str::to_owned)).collect();
        selected.push(Selected { plan_occurrence_id: step_id.to_owned() + "-" + operation_id + "-" + &(completion_index + 1).to_string(), step_id: step_id.clone(), operation_id: operation_id.to_owned(), dependency_operation_ids });
    }
    selected.reverse();
    if selected.is_empty() { return Ok(${name}RecoveryDecision { schema_version: "domainspec.workflow-recovery-decision/v1", workflow_evaluation_result: "not-required", recovery_intent: None }); }
    let mut pending: Vec<${name}RecoveryPlanEntry> = Vec::new();
    for entry in &selected {
        let mut depends_on = Vec::new();
        for dependency in &entry.dependency_operation_ids {
            let occurrences: Vec<&Selected> = selected.iter().filter(|candidate| &candidate.operation_id == dependency).collect();
            if dependency == &entry.operation_id || occurrences.len() != 1 { return Err("invalid or ambiguous compensation dependency"); }
            depends_on.push(occurrences[0].plan_occurrence_id.clone());
        }
        pending.push(${name}RecoveryPlanEntry { plan_occurrence_id: entry.plan_occurrence_id.clone(), step_id: entry.step_id.clone(), operation_id: entry.operation_id.clone(), depends_on, invocation_identity: String::new() });
    }
    let mut ordered = Vec::new();
    let mut emitted: BTreeSet<String> = BTreeSet::new();
    while !pending.is_empty() {
        let index = pending.iter().position(|entry| entry.depends_on.iter().all(|dependency| emitted.contains(dependency))).ok_or("cyclic compensation dependency")?;
        let next = pending.remove(index);
        emitted.insert(next.plan_occurrence_id.clone());
        ordered.push(next);
    }
    let completed_step_journal_digest = ${fn}_digest(&[vec!["domainspec.workflow-completed-step-journal/v1".to_owned()], completed_step_ids.to_vec()].concat().join("\\n"), digest)?;
    let plan_digest = ${fn}_digest(&${fn}_plan_material(&ordered), digest)?;
    let intent_id = ${fn}_digest(&["domainspec.workflow-recovery-intent/v2", workflow_execution_id, failure_occurrence_id, failed_step_id, &completed_step_journal_digest, &plan_digest].join("\\n"), digest)?;
    for entry in &mut ordered { entry.invocation_identity = ${fn}_invocation_identity(&intent_id, &plan_digest, &entry.operation_id, &entry.plan_occurrence_id, digest)?; }
    Ok(${name}RecoveryDecision { schema_version: "domainspec.workflow-recovery-decision/v1", workflow_evaluation_result: "recovery-required", recovery_intent: Some(${name}RecoveryIntent { schema_version: "domainspec.workflow-recovery-intent/v2", intent_id, workflow_id: ${JSON.stringify(input.node_id)}, workflow_execution_id: workflow_execution_id.to_owned(), failure_occurrence_id: failure_occurrence_id.to_owned(), failed_step_id: failed_step_id.to_owned(), completed_step_journal_digest, plan_digest, semantic_status: "required", plan: ordered }) })
}
pub fn ${fn}(mut run: impl FnMut(&str) -> Result<(), &'static str>, mut compensate: impl FnMut(&str) -> Result<(), &'static str>, workflow_execution_id: &str, failure_occurrence_id: &str, digest: &impl Fn(&str) -> String) -> ${name}Outcome {
    let _ = &mut compensate;
    let mut completed = Vec::new();
    for step in ${constant}_STEPS {
        if run(step).is_err() {
            let decision = plan_${fn}_recovery(&completed, step, workflow_execution_id, failure_occurrence_id, digest).expect("validated recovery contract");
            return ${name}Outcome { ok: false, completed, failed_step: Some((*step).to_owned()), workflow_evaluation_result: decision.workflow_evaluation_result, recovery_intent: decision.recovery_intent, compensation_execution: false, direct_effects_executed: Vec::new() };
        }
        completed.push((*step).to_owned());
    }
    ${name}Outcome { ok: true, completed, failed_step: None, workflow_evaluation_result: "not-required", recovery_intent: None, compensation_execution: false, direct_effects_executed: Vec::new() }
}
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ${name}RecoveryBinding<'a> { pub workflow_id: &'a str, pub operation_id: &'a str, pub failure_continuation: &'a str }
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct ${name}RecoveryInvocationReport { pub schema_version: &'static str, pub outcome: &'static str, pub executed_plan_occurrence_ids: Vec<String>, pub failed_plan_occurrence_id: Option<String>, pub failure_continuation: Option<String>, pub reason: Option<String>, pub recovery_intent_semantic_status: &'static str, pub durable_terminal_disposition: Option<String> }
fn verify_${fn}_recovery_intent(intent: &${name}RecoveryIntent, digest: &impl Fn(&str) -> String) -> Result<(), &'static str> {
    if intent.semantic_status != "required" || intent.workflow_id != ${JSON.stringify(input.node_id)} { return Err("Recovery Intent is not executable for this Workflow"); }
    let mut emitted: BTreeSet<String> = BTreeSet::new();
    for entry in &intent.plan {
        if !${constant}_ORCHESTRATED_OPERATION_IDS.contains(&entry.operation_id.as_str()) { return Err("recovery target is outside Workflow relation set"); }
        if emitted.contains(&entry.plan_occurrence_id) || entry.depends_on.iter().any(|dependency| !emitted.contains(dependency)) { return Err("invalid recovery plan order"); }
        emitted.insert(entry.plan_occurrence_id.clone());
    }
    if ${fn}_digest(&${fn}_plan_material(&intent.plan), digest)? != intent.plan_digest { return Err("Recovery Intent plan digest mismatch"); }
    let observed_intent_id = ${fn}_digest(&["domainspec.workflow-recovery-intent/v2", &intent.workflow_execution_id, &intent.failure_occurrence_id, &intent.failed_step_id, &intent.completed_step_journal_digest, &intent.plan_digest].join("\\n"), digest)?;
    if observed_intent_id != intent.intent_id { return Err("Recovery Intent identity mismatch"); }
    for entry in &intent.plan {
        if ${fn}_invocation_identity(&intent.intent_id, &intent.plan_digest, &entry.operation_id, &entry.plan_occurrence_id, digest)? != entry.invocation_identity { return Err("Recovery Intent invocation identity mismatch"); }
    }
    Ok(())
}
pub fn execute_${fn}_recovery(intent: &${name}RecoveryIntent, bindings: &[${name}RecoveryBinding<'_>], digest: &impl Fn(&str) -> String, mut invoke: impl FnMut(&str, &str) -> Result<(), String>) -> Result<${name}RecoveryInvocationReport, &'static str> {
    verify_${fn}_recovery_intent(intent, digest)?;
    let required_operation_ids: BTreeSet<&str> = intent.plan.iter().map(|entry| entry.operation_id.as_str()).collect();
    let mut registered = BTreeSet::new();
    for binding in bindings {
        if !${constant}_ORCHESTRATED_OPERATION_IDS.contains(&binding.operation_id) { return Err("binding is outside Workflow relation set"); }
        if binding.workflow_id != intent.workflow_id { return Err("binding Workflow mismatch"); }
        if !required_operation_ids.contains(binding.operation_id) { return Err("undeclared recovery binding"); }
        if !registered.insert(binding.operation_id) { return Err("duplicate recovery binding"); }
    }
    if required_operation_ids.iter().any(|operation_id| !registered.contains(operation_id)) { return Err("missing recovery Operation"); }
    let mut executed = Vec::new();
    for entry in &intent.plan {
        let binding = bindings.iter().find(|binding| binding.operation_id == entry.operation_id).ok_or("missing recovery Operation")?;
        if let Err(reason) = invoke(&entry.operation_id, &entry.invocation_identity) {
            return Ok(${name}RecoveryInvocationReport { schema_version: "domainspec.workflow-recovery-in-process-report/v1", outcome: "failed", executed_plan_occurrence_ids: executed, failed_plan_occurrence_id: Some(entry.plan_occurrence_id.clone()), failure_continuation: Some(binding.failure_continuation.to_owned()), reason: Some(reason), recovery_intent_semantic_status: "required", durable_terminal_disposition: None });
        }
        executed.push(entry.plan_occurrence_id.clone());
    }
    Ok(${name}RecoveryInvocationReport { schema_version: "domainspec.workflow-recovery-in-process-report/v1", outcome: "succeeded", executed_plan_occurrence_ids: executed, failed_plan_occurrence_id: None, failure_continuation: None, reason: None, recovery_intent_semantic_status: "required", durable_terminal_disposition: None })
}
`;
}

function renderTypeScript(input: GeneratorInput): string {
  const name = pascal(input.node_id);
  const fn = camel(input.node_id);
  const body = input.body;
  const header = provenance(input, "//");
  const fields = strings(body.fields);
  const fieldShape = fields.map((field) => `  readonly ${camel(field)}: unknown;`).join("\n") || "  readonly value: unknown;";
  switch (input.kind) {
    case "Entity":
      return `${header}export interface ${name}State {\n${fieldShape}\n}\n\nexport class ${name} {\n  constructor(readonly id: string, private state: Readonly<${name}State>) {}\n  snapshot(): Readonly<${name}State> { return Object.freeze({ ...this.state }); }\n}\n`;
    case "Value Object":
      return `${header}export class ${name} {\n  readonly value: Readonly<Record<string, unknown>>;\n  constructor(value: Record<string, unknown>) { this.value = Object.freeze({ ...value }); }\n}\n`;
    case "Enum": {
      const values = strings(body.values);
      const names = uniqueNames(values, pascal, "TypeScript Enum");
      return `${header}export const ${name} = Object.freeze({\n${values.map((value, index) => `  ${names[index]}: ${JSON.stringify(value)},`).join("\n")}\n} as const);\nexport type ${name} = (typeof ${name})[keyof typeof ${name}];\n`;
    }
    case "Operation": {
      const contract = canonicalJson({ reads: strings(body.reads), writes: strings(body.writes), effects: strings(body.effects) });
      return `${header}// domainspec-operation-sets: ${contract}\n// domainspec-operation-guard: ${JSON.stringify(text(body.guard, "guard"))}\n// domainspec-guard-before-mutation: true\n// domainspec-atomic-state-outbox: true\n// domainspec-failure-continuation: ${JSON.stringify(text(body.failure_continuation, "return-error"))}\n// domainspec-operation-core-instrumentation-free: true\n// domainspec-operation-instrumentation-owner: "outer-wrapper"\nexport const ${name}Contract = Object.freeze(${canonicalJson({ reads: strings(body.reads), writes: strings(body.writes), effects: strings(body.effects), relationships: input.relationships })});\nexport function ${fn}(state: Readonly<Record<string, unknown>>, changes: Readonly<Record<string, unknown>>, guard: () => boolean) {\n  if (!guard()) return { ok: false as const, continuation: ${JSON.stringify(text(body.failure_continuation, "return-error"))} };\n  const readSet = Object.freeze(Object.fromEntries(${name}Contract.reads.map((key) => [key, state[key]])));\n  const nextState = Object.freeze(${name}Contract.writes.reduce<Record<string, unknown>>((next, key) => ({ ...next, [key]: changes[key] }), { ...state }));\n  const outbox = ${name}Contract.effects.map((type) => Object.freeze({ type, operation: ${JSON.stringify(input.node_id)} }));\n  return { ok: true as const, reads: readSet, state: nextState, outbox };\n}\nexport function ${fn}Observed(state: Readonly<Record<string, unknown>>, changes: Readonly<Record<string, unknown>>, guard: () => boolean, observe: (phase: "operation.enter" | "operation.success" | "operation.failure") => void) {\n  observe("operation.enter");\n  const outcome = ${fn}(state, changes, guard);\n  observe(outcome.ok ? "operation.success" : "operation.failure");\n  return outcome;\n}\n`;
    }
    case "Query":
      return `${header}export function ${fn}(state: Readonly<Record<string, unknown>>): Readonly<Record<string, unknown>> {\n  return Object.freeze({ ...state });\n}\n`;
    case "Calculation":
      return `${header}export function ${fn}(inputs: readonly number[]): number {\n  return inputs.reduce((total, value) => total + value, 0);\n}\n`;
    case "Rule":
      return `${header}export function ${fn}(candidate: unknown): boolean {\n  return Boolean(candidate);\n}\n`;
    case "Policy":
      return `${header}export const ${name}Strategies = Object.freeze(${JSON.stringify(strings(body.strategies))});\nexport function ${fn}(index = 0): string { return ${name}Strategies[index] ?? ${name}Strategies[0] ?? ""; }\n`;
    case "Workflow":
      return renderTypeScriptWorkflow(input, name, fn, header);
    case "Interface":
      return `${header}export interface ${name} {\n  readonly version: ${JSON.stringify(text(body.version, "v1"))};\n  invoke(operation: string, input: unknown): Promise<unknown>;\n}\n`;
    case "Event":
      return `${header}export interface ${name} {\n  readonly type: ${JSON.stringify(input.node_id)};\n  readonly occurredAt: string;\n${fieldShape}\n}\n`;
    case "Mapping":
      return `${header}export function ${fn}(source: unknown): { readonly target: unknown } { return Object.freeze({ target: source }); }\n`;
    case "State Machine":
      return `${header}export const ${name}States = Object.freeze(${JSON.stringify(strings(body.states))});\nexport function ${fn}Transition(current: string, next: string): string {\n  if (!((${name}States) as readonly string[]).includes(current) || !((${name}States) as readonly string[]).includes(next)) throw new Error("invalid transition");\n  return next;\n}\n`;
    default:
      throw new Error(`unsupported TypeScript generator:${input.kind}`);
  }
}

function renderPython(input: GeneratorInput): string {
  const name = pascal(input.node_id);
  const fn = snake(input.node_id);
  const body = input.body;
  const header = provenance(input, "#");
  switch (input.kind) {
    case "Entity":
      return `${header}from dataclasses import dataclass\n\n@dataclass\nclass ${name}:\n    id: str\n    state: dict[str, object]\n\n    def snapshot(self) -> dict[str, object]:\n        return dict(self.state)\n`;
    case "Value Object":
      return `${header}from dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass ${name}:\n    value: tuple[tuple[str, object], ...]\n`;
    case "Enum":
      return `${header}from enum import Enum\n\nclass ${name}(str, Enum):\n${strings(body.values).map((value, index, values) => `    ${uniqueNames(values, (entry) => snake(entry).toUpperCase(), "Python Enum")[index]} = ${JSON.stringify(value)}`).join("\n")}\n`;
    case "Operation":
      return `${header}# domainspec-operation-sets: ${canonicalJson({ reads: strings(body.reads), writes: strings(body.writes), effects: strings(body.effects) })}\n# domainspec-operation-guard: ${JSON.stringify(text(body.guard, "guard"))}\n# domainspec-guard-before-mutation: true\n# domainspec-atomic-state-outbox: true\n# domainspec-failure-continuation: ${JSON.stringify(text(body.failure_continuation, "return-error"))}\n# domainspec-operation-core-instrumentation-free: true\n# domainspec-operation-instrumentation-owner: "outer-wrapper"\n${name.toUpperCase()}_RELATIONSHIPS = tuple(${canonicalJson(input.relationships)})\n\ndef ${fn}(state: dict[str, object], changes: dict[str, object], guard: bool) -> dict[str, object]:\n    if not guard:\n        return {"ok": False, "continuation": ${JSON.stringify(text(body.failure_continuation, "return-error"))}}\n    read_set = {key: state.get(key) for key in ${JSON.stringify(strings(body.reads))}}\n    next_state = dict(state)\n    for key in ${JSON.stringify(strings(body.writes))}:\n        next_state[key] = changes.get(key)\n    outbox = [{"type": effect, "operation": ${JSON.stringify(input.node_id)}} for effect in ${JSON.stringify(strings(body.effects))}]\n    return {"ok": True, "reads": read_set, "state": next_state, "outbox": outbox}\n\ndef ${fn}_observed(state: dict[str, object], changes: dict[str, object], guard: bool, observe):\n    observe("operation.enter")\n    outcome = ${fn}(state, changes, guard)\n    observe("operation.success" if outcome["ok"] else "operation.failure")\n    return outcome\n`;
    case "Query":
      return `${header}def ${fn}(state: dict[str, object]) -> dict[str, object]:\n    return dict(state)\n`;
    case "Calculation":
      return `${header}def ${fn}(inputs: list[float]) -> float:\n    return sum(inputs)\n`;
    case "Rule":
      return `${header}def ${fn}(candidate: object) -> bool:\n    return bool(candidate)\n`;
    case "Policy":
      return `${header}${name.toUpperCase()}_STRATEGIES = tuple(${JSON.stringify(strings(body.strategies))})\n\ndef ${fn}(index: int = 0) -> str:\n    return ${name.toUpperCase()}_STRATEGIES[index]\n`;
    case "Workflow":
      return renderPythonWorkflow(input, name, fn, header);
    case "Interface":
      return `${header}from typing import Protocol\n\nclass ${name}(Protocol):\n    version: str\n    def invoke(self, operation: str, value: object) -> object: ...\n`;
    case "Event":
      return `${header}from dataclasses import dataclass\n\n@dataclass(frozen=True)\nclass ${name}:\n    occurred_at: str\n    payload: dict[str, object]\n`;
    case "Mapping":
      return `${header}def ${fn}(source: object) -> dict[str, object]:\n    return {"target": source}\n`;
    case "State Machine":
      return `${header}${name.toUpperCase()}_STATES = tuple(${JSON.stringify(strings(body.states))})\n\ndef ${fn}_transition(current: str, next_state: str) -> str:\n    if current not in ${name.toUpperCase()}_STATES or next_state not in ${name.toUpperCase()}_STATES:\n        raise ValueError("invalid transition")\n    return next_state\n`;
    default:
      throw new Error(`unsupported Python generator:${input.kind}`);
  }
}

function rustSlice(values: readonly string[]): string {
  return `&[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
}

function rustArray(values: readonly string[]): string {
  return `[${values.map((value) => JSON.stringify(value)).join(", ")}]`;
}

function renderRust(input: GeneratorInput): string {
  const name = pascal(input.node_id);
  const fn = snake(input.node_id);
  const body = input.body;
  const header = provenance(input, "//");
  switch (input.kind) {
    case "Entity":
      return `${header}#[derive(Clone, Debug, PartialEq)]\npub struct ${name} { pub id: String, pub state: String }\n`;
    case "Value Object":
      return `${header}#[derive(Clone, Debug, PartialEq, Eq)]\npub struct ${name}(pub String);\n`;
    case "Enum":
      return `${header}#[derive(Clone, Debug, PartialEq, Eq)]\npub enum ${name} { ${uniqueNames(strings(body.values), pascal, "Rust Enum").join(", ")} }\n`;
    case "Operation":
      return `${header}// domainspec-operation-sets: ${canonicalJson({ reads: strings(body.reads), writes: strings(body.writes), effects: strings(body.effects) })}\n// domainspec-operation-guard: ${JSON.stringify(text(body.guard, "guard"))}\n// domainspec-guard-before-mutation: true\n// domainspec-atomic-state-outbox: true\n// domainspec-failure-continuation: ${JSON.stringify(text(body.failure_continuation, "return-error"))}\n// domainspec-operation-core-instrumentation-free: true\n// domainspec-operation-instrumentation-owner: "outer-wrapper"\nuse std::collections::BTreeMap;\npub const ${snake(name).toUpperCase()}_RELATIONSHIPS_JSON: &str = ${JSON.stringify(canonicalJson(input.relationships))};\n#[derive(Clone, Debug, PartialEq)]\npub struct ${name}Outcome { pub reads: BTreeMap<String, String>, pub state: BTreeMap<String, String>, pub outbox: Vec<String> }\npub fn ${fn}(state: &BTreeMap<String, String>, changes: &BTreeMap<String, String>, guard: bool) -> Result<${name}Outcome, &'static str> {\n    if !guard { return Err(${JSON.stringify(text(body.failure_continuation, "return-error"))}); }\n    let reads = ${rustArray(strings(body.reads))}.iter().filter_map(|key| state.get(*key).map(|value| ((*key).to_owned(), value.clone()))).collect();\n    let mut next_state = state.clone();\n    for key in ${rustArray(strings(body.writes))} { if let Some(value) = changes.get(key) { next_state.insert(key.to_owned(), value.clone()); } }\n    let outbox: Vec<String> = ${rustArray(strings(body.effects))}.iter().map(|value| (*value).to_owned()).collect();\n    Ok(${name}Outcome { reads, state: next_state, outbox })\n}\npub fn ${fn}_observed(state: &BTreeMap<String, String>, changes: &BTreeMap<String, String>, guard: bool, observe: &mut impl FnMut(&str)) -> Result<${name}Outcome, &'static str> {\n    observe("operation.enter");\n    let outcome = ${fn}(state, changes, guard);\n    observe(if outcome.is_ok() { "operation.success" } else { "operation.failure" });\n    outcome\n}\n`;
    case "Query":
      return `${header}pub fn ${fn}(state: &str) -> String { state.to_owned() }\n`;
    case "Calculation":
      return `${header}pub fn ${fn}(inputs: &[f64]) -> f64 { inputs.iter().sum() }\n`;
    case "Rule":
      return `${header}pub fn ${fn}(candidate: bool) -> bool { candidate }\n`;
    case "Policy":
      return `${header}pub const ${snake(name).toUpperCase()}_STRATEGIES: &[&str] = ${rustSlice(strings(body.strategies))};\npub fn ${fn}(index: usize) -> &'static str { ${snake(name).toUpperCase()}_STRATEGIES.get(index).copied().unwrap_or("") }\n`;
    case "Workflow":
      return renderRustWorkflow(input, name, fn, header);
    case "Interface":
      return `${header}pub trait ${name} { fn version(&self) -> &str; fn invoke(&self, operation: &str, input: &str) -> String; }\n`;
    case "Event":
      return `${header}#[derive(Clone, Debug, PartialEq, Eq)]\npub struct ${name} { pub occurred_at: String, pub payload: String }\n`;
    case "Mapping":
      return `${header}pub fn ${fn}(source: &str) -> String { source.to_owned() }\n`;
    case "State Machine":
      return `${header}pub const ${snake(name).toUpperCase()}_STATES: &[&str] = ${rustSlice(strings(body.states))};\npub fn ${fn}_transition(current: &str, next: &str) -> Result<String, &'static str> {\n    if !${snake(name).toUpperCase()}_STATES.contains(&current) || !${snake(name).toUpperCase()}_STATES.contains(&next) { return Err("invalid transition"); }\n    Ok(next.to_owned())\n}\n`;
    default:
      throw new Error(`unsupported Rust generator:${input.kind}`);
  }
}

export const GENERATOR_REGISTRY: readonly GeneratorRegistration[] = Object.freeze(
  FROZEN_META_TYPE_CATALOG.realization_rows.map((row) => Object.freeze({
    generator_id: generatorIdFor(row.meta_type_id, row.language),
    meta_type_id: row.meta_type_id,
    language: row.language,
    extension: EXTENSIONS[row.language],
  })),
);

export function generatorIdFor(metaTypeId: string, language: SupportedLanguage): string {
  const version = metaTypeId === "DS-D1.9" ? "v3" : metaTypeId === "DS-D1.4" ? "v2" : "v1";
  return `domainspec.generator/${metaTypeId}/${language}/${version}`;
}

export function renderImplementation(input: GeneratorInput): { readonly generator_id: string; readonly extension: "ts" | "py" | "rs"; readonly content: string } {
  const registration = GENERATOR_REGISTRY.find((row) => row.meta_type_id === input.meta_type_id && row.language === input.realization.language);
  if (!registration) throw new Error(`generator is not registered:${input.meta_type_id}/${input.realization.language}`);
  const renderers: Readonly<Record<SupportedLanguage, (value: GeneratorInput) => string>> = {
    typescript: renderTypeScript,
    python: renderPython,
    rust: renderRust,
  };
  return Object.freeze({ generator_id: registration.generator_id, extension: registration.extension, content: renderers[input.realization.language](input) });
}
