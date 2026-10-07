import {canonicalJson, canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {
  evolutionProtocolDigest,
  loadCandidateCycleDefinitionRegistry,
  verifyEffectEnvelope,
  verifyHandoffAcceptance,
  verifyHandoffOffer,
  verifyPhaseAdmission,
} from "./protocol-v1.mjs";
import {materializeCoordinationCommand} from "./coordination-protocol-v1.mjs";

export const EVOLUTION_COORDINATOR_VERSION = "are.evolution-coordinator/v1";

const HASH = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.length > 0;
const identifier = (value) => text(value) && IDENTIFIER.test(value);
const finite = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const freeze = (value) => deepFreeze(canonicalizeJson(value));

function failure(stage, reasons, residue = []) {
  return freeze({schema_version: "are.evolution-coordination-failure/v1", ok: false, stage, reason_codes: [...new Set(reasons)].sort(), residue, authority_effect: "none"});
}

function validInstant(value) {
  return text(value) && Number.isFinite(Date.parse(value));
}

function exactSet(values) {
  return Array.isArray(values) && values.length > 0 && values.every(identifier) && new Set(values).size === values.length;
}

function validatePlan(plan, verifyPlan) {
  if (!object(plan) || plan.schema_version !== "are.research-work-plan/v1" || !HASH.test(plan.plan_digest ?? "") || !Array.isArray(plan.tasks) || plan.tasks.length === 0 || !Array.isArray(plan.topological_order)) return false;
  const ids = new Set(plan.tasks.map((task) => task?.task_id));
  if (ids.size !== plan.tasks.length || plan.topological_order.length !== plan.tasks.length || plan.topological_order.some((id) => !ids.has(id))) return false;
  if (plan.tasks.some((task) => !identifier(task?.task_id) || !identifier(task?.validator_ref) || !Array.isArray(task.depends_on) || task.depends_on.some((id) => !ids.has(id) || id === task.task_id) || !exactSet(task.completion_criteria))) return false;
  if (typeof verifyPlan === "function") {
    const checked = verifyPlan(structuredClone(plan));
    if (!(checked === true || checked?.ok === true)) return false;
  }
  return true;
}

function registryLookup(registry, definitionRef, definitionDigest) {
  return registry.definitions.find((definition) => definition.definition_ref === definitionRef && definition.definition_digest === definitionDigest) ?? null;
}

function validatorFor(validators, ref) {
  if (validators instanceof Map) return validators.get(ref);
  return object(validators) ? validators[ref] : undefined;
}

function cycleRevision(projection, cycleRef) {
  return projection.aggregate_cycles.find((cycle) => cycle.cycle_ref === cycleRef)?.event_revision ?? 0;
}

function phaseRow(projection, cycleRef, phase) {
  return projection.coordination?.phases?.find((candidate) => candidate.cycle_ref === cycleRef && candidate.phase === phase) ?? null;
}

function accountingInput(value) {
  if (!object(value)) return null;
  const result = {tokens: value.tokens ?? 0, cost: value.cost ?? 0, elapsed_seconds: value.elapsed_seconds ?? 0};
  return Object.values(result).every(finite) ? result : null;
}

function withinLimit(current, requested, limit) {
  return limit === null || limit === undefined || current + requested <= limit;
}

function accepted(result) {
  return result?.ok === true && ["accepted", "replayed"].includes(result.disposition);
}

export function createEvolutionCoordinator({kernel, registry = loadCandidateCycleDefinitionRegistry(), validators = {}, cycle_validators: cycleValidators = {}, verify_plan: verifyPlan = null, terminal_result_lookup: terminalResultLookup = () => null, now = () => new Date().toISOString()} = {}) {
  if (!kernel || typeof kernel.inspect !== "function" || typeof kernel.processCoordination !== "function") throw new TypeError("Coordinator requires a P2 durable kernel with coordination support.");
  if (typeof now !== "function") throw new TypeError("Coordinator requires an injected clock function.");
  if (typeof terminalResultLookup !== "function") throw new TypeError("terminal_result_lookup must be a function.");

  function completedTerminalResult(lease) {
    const candidate = lease ? terminalResultLookup(structuredClone(lease)) : null;
    return object(candidate) && candidate.lease_ref === lease.lease_ref && candidate.fencing_token === lease.fencing_token && validInstant(candidate.completed_at) && Date.parse(candidate.completed_at) <= Date.parse(lease.expires_at) ? candidate : null;
  }

  function projection() {
    const inspected = kernel.inspect();
    return inspected.ok ? inspected.value : inspected;
  }

  function command(input, operation, target, payload) {
    return materializeCoordinationCommand({
      idempotency_key: input.idempotency_key,
      expected_event_revision: input.expected_event_revision,
      actor: input.actor,
      worker_ref: input.worker_ref ?? null,
      cycle_ref: input.cycle_ref,
      cycle_definition_ref: input.cycle_definition_ref,
      cycle_definition_digest: input.cycle_definition_digest,
      operation,
      target,
      payload,
    });
  }

  function inspect() {
    const inspected = kernel.inspect();
    if (!inspected.ok) return inspected;
    return freeze({ok: true, operation: "inspect-coordination", value: inspected.value.coordination ?? {schema_version: "are.evolution-coordination-projection/v1", commit_count: inspected.value.commit_count, phases: [], handoff_offers: [], handoff_acceptances: [], authority_effect: "none"}, authority_effect: "none"});
  }

  function admitPhase(input) {
    const current = projection();
    if (current.ok === false) return current;
    const definition = registryLookup(registry, input?.cycle_definition_ref, input?.cycle_definition_digest);
    const reasons = [];
    if (!definition) reasons.push("coordination.definition-binding-invalid");
    if (!identifier(input?.cycle_ref) || !identifier(input?.phase) || !identifier(input?.idempotency_key) || !object(input?.actor)) reasons.push("coordination.admission-input-invalid");
    if (input?.expected_event_revision !== cycleRevision(current, input?.cycle_ref)) reasons.push("command.stale-revision");
    if (!validatePlan(input?.plan, verifyPlan)) reasons.push("coordination.plan-invalid");
    if (!verifyEffectEnvelope(input?.envelope).ok || input?.envelope?.cycle_ref !== input?.cycle_ref || input?.envelope?.cycle_definition_digest !== input?.cycle_definition_digest) reasons.push("coordination.envelope-invalid");
    if (!validInstant(input?.envelope?.expires_at)) reasons.push("coordination.envelope-expiry-invalid");
    else if (Date.parse(input.envelope.expires_at) <= Date.parse(now())) reasons.push("coordination.envelope-expired");
    if (input?.envelope?.enabled !== true) reasons.push("coordination.envelope-disabled");
    const limits = input?.envelope?.resource_limits;
    if (!object(limits) || !Number.isSafeInteger(limits.maximum_attempts) || limits.maximum_attempts < 1 || !Number.isSafeInteger(limits.maximum_concurrency) || limits.maximum_concurrency < 1 || [["maximum_tokens", true], ["maximum_cost", false], ["maximum_elapsed_seconds", true]].some(([key, integer]) => limits?.[key] !== null && limits?.[key] !== undefined && (!finite(limits[key]) || (integer && !Number.isSafeInteger(limits[key]))))) reasons.push("coordination.envelope-resource-limits-invalid");
    for (const task of input?.plan?.tasks ?? []) if (typeof validatorFor(validators, task.validator_ref) !== "function") reasons.push(`coordination.validator-missing:${task.validator_ref}`);
    const cycleValidator = definition ? validatorFor(cycleValidators, definition.cycle_kind) : null;
    if (typeof cycleValidator !== "function") reasons.push(`coordination.cycle-validator-missing:${definition?.cycle_kind ?? "unknown"}`);
    else {
      const checked = cycleValidator({phase: input.phase, plan: structuredClone(input.plan), envelope: structuredClone(input.envelope), definition: structuredClone(definition)});
      if (checked?.ok !== true) reasons.push(...(checked?.reason_codes?.length ? checked.reason_codes : ["coordination.cycle-validator-rejected"]));
    }
    if (phaseRow(current, input?.cycle_ref, input?.phase)) reasons.push("coordination.phase-already-admitted");
    if (reasons.length) return failure("phase-admission", reasons);
    const envelopeDigest = evolutionProtocolDigest(input.envelope);
    const admissionMaterial = {cycle_ref: input.cycle_ref, phase: input.phase, expected_event_revision: input.expected_event_revision, envelope_ref: input.envelope.envelope_ref, envelope_digest: envelopeDigest, prerequisite_receipt_refs: [...new Set(input.prerequisite_receipt_refs ?? [])].sort(), disposition: "admitted", reason_codes: []};
    const admission = freeze({schema_version: "are.evolution-phase-admission/v1", admission_ref: `admission:${evolutionProtocolDigest(admissionMaterial)}`, ...admissionMaterial, authority_effect: "none"});
    if (!verifyPhaseAdmission(admission).ok) return failure("phase-admission", ["coordination.admission-record-invalid"]);
    const value = command(input, "phase.admit", {record_kind: "phase", record_ref: admission.admission_ref}, {admission, plan: input.plan, envelope: input.envelope});
    return kernel.processCoordination(value, {event_drafts: [{event_type: "phase-admitted", payload: {admission, plan: input.plan, envelope: input.envelope}}]});
  }

  function leaseWork(input) {
    const current = projection();
    if (current.ok === false) return current;
    const phase = phaseRow(current, input?.cycle_ref, input?.phase);
    if (!phase) return failure("work-lease", ["coordination.phase-not-admitted"]);
    const reasons = [];
    if (input?.expected_event_revision !== cycleRevision(current, input?.cycle_ref)) reasons.push("command.stale-revision");
    if (phase.work_items.some((item) => item.active_lease && Date.parse(item.active_lease.expires_at) <= Date.parse(now()))) reasons.push("coordination.recovery-required");
    const task = phase.work_items.find((item) => item.task_id === input?.task_ref);
    if (!task || task.state !== "ready") reasons.push("coordination.work-not-ready");
    if (!identifier(input?.worker_ref) || !text(input?.rationale) || !Number.isSafeInteger(input?.lease_seconds) || input.lease_seconds < 1) reasons.push("coordination.lease-input-invalid");
    if (input?.effect_class === "external-dispatch") reasons.push("coordination.external-dispatch-disabled");
    if (input?.effect_class !== null && input?.effect_class !== undefined && !phase.envelope.allowed_effect_classes.includes(input.effect_class)) reasons.push("coordination.effect-out-of-envelope");
    const requested = accountingInput(input?.resource_request ?? {});
    if (!requested) reasons.push("coordination.resource-request-invalid");
    const limits = phase.envelope.resource_limits;
    if (task && task.attempts.length >= limits.maximum_attempts) reasons.push("coordination.attempt-budget-exhausted");
    const active = phase.work_items.filter((item) => item.active_lease).length;
    if (active >= (limits.maximum_concurrency ?? 1)) reasons.push("coordination.concurrency-exhausted");
    if (requested && (!withinLimit(phase.accounting.tokens, requested.tokens, limits.maximum_tokens) || !withinLimit(phase.accounting.cost, requested.cost, limits.maximum_cost) || !withinLimit(phase.accounting.elapsed_seconds, requested.elapsed_seconds, limits.maximum_elapsed_seconds))) reasons.push("coordination.resource-budget-exceeded");
    if (reasons.length) return failure("work-lease", reasons);
    const issuedAt = now();
    const expiresAt = new Date(Date.parse(issuedAt) + input.lease_seconds * 1000).toISOString();
    const attempt = task.attempts.length + 1;
    const fence = evolutionProtocolDigest({cycle_ref: input.cycle_ref, phase: input.phase, task_ref: input.task_ref, attempt, worker_ref: input.worker_ref, expected_event_revision: input.expected_event_revision, expires_at: expiresAt});
    const lease = freeze({schema_version: "are.evolution-work-lease/v1", lease_ref: `lease:${fence}`, cycle_ref: input.cycle_ref, phase: input.phase, plan_digest: phase.plan.plan_digest, task_ref: input.task_ref, attempt, worker_ref: input.worker_ref, rationale: input.rationale, effect_class: input.effect_class ?? null, resource_request: requested, issued_at: issuedAt, expires_at: expiresAt, fencing_token: fence, admission_ref: phase.admission.admission_ref, authority_effect: "none"});
    const value = command(input, "work.lease", {record_kind: "work", record_ref: input.task_ref}, {phase: input.phase, lease});
    return kernel.processCoordination(value, {event_drafts: [{event_type: "work-leased", payload: {phase: input.phase, lease}}]});
  }

  function settleWork(input) {
    const current = projection();
    if (current.ok === false) return current;
    const phase = phaseRow(current, input?.cycle_ref, input?.phase);
    const task = phase?.work_items.find((item) => item.task_id === input?.task_ref);
    const lease = task?.active_lease;
    const reasons = [];
    if (!phase) reasons.push("coordination.phase-not-admitted");
    if (input?.expected_event_revision !== cycleRevision(current, input?.cycle_ref)) reasons.push("command.stale-revision");
    if (!lease) reasons.push("coordination.active-lease-required");
    if (lease && (lease.lease_ref !== input?.lease_ref || lease.fencing_token !== input?.fencing_token)) reasons.push("coordination.lease-fence-mismatch");
    if (lease && Date.parse(lease.expires_at) <= Date.parse(now()) && !completedTerminalResult(lease)) reasons.push("coordination.recovery-required");
    if (!["succeeded", "retryable-failure", "failed", "cancelled"].includes(input?.outcome)) reasons.push("coordination.settlement-outcome-invalid");
    const accounting = accountingInput(input?.accounting);
    if (!accounting) reasons.push("coordination.accounting-invalid");
    const evidence = Array.isArray(input?.evidence) ? input.evidence : [];
    if (input?.outcome === "succeeded" && task) {
      const criteria = evidence.map((item) => item?.criterion_id);
      if (criteria.length !== task.completion_criteria.length || new Set(criteria).size !== criteria.length || task.completion_criteria.some((criterion) => !criteria.includes(criterion)) || evidence.some((item) => !identifier(item?.artifact_ref) || !HASH.test(item?.artifact_digest ?? ""))) reasons.push("coordination.completion-evidence-invalid");
      const validator = validatorFor(validators, task.validator_ref);
      const checked = typeof validator === "function" ? validator({task: structuredClone(task), evidence: structuredClone(evidence), lease: structuredClone(lease)}) : null;
      if (checked?.ok !== true) reasons.push(...(checked?.reason_codes?.length ? checked.reason_codes : ["coordination.completion-validator-rejected"]));
    }
    if (phase && accounting) {
      const limits = phase.envelope.resource_limits;
      if (!withinLimit(phase.accounting.tokens, accounting.tokens, limits.maximum_tokens) || !withinLimit(phase.accounting.cost, accounting.cost, limits.maximum_cost) || !withinLimit(phase.accounting.elapsed_seconds, accounting.elapsed_seconds, limits.maximum_elapsed_seconds)) reasons.push("coordination.resource-budget-exceeded");
    }
    if (reasons.length) return failure("work-settlement", reasons);
    const settlement = freeze({schema_version: "are.evolution-work-settlement/v1", settlement_ref: `settlement:${evolutionProtocolDigest({lease_ref: lease.lease_ref, outcome: input.outcome, evidence, accounting})}`, cycle_ref: input.cycle_ref, phase: input.phase, task_ref: input.task_ref, lease_ref: lease.lease_ref, fencing_token: lease.fencing_token, attempt: lease.attempt, outcome: input.outcome, evidence, accounting, settled_at: now(), retry_of: lease.attempt > 1 ? task.attempts.at(-2) ?? null : null, authority_effect: "none"});
    const value = command(input, "work.settle", {record_kind: "work", record_ref: input.task_ref}, {phase: input.phase, settlement});
    return kernel.processCoordination(value, {event_drafts: [{event_type: "work-settled", payload: {phase: input.phase, settlement}}]});
  }

  function recover(input) {
    const current = projection();
    if (current.ok === false) return current;
    const phase = phaseRow(current, input?.cycle_ref, input?.phase);
    if (!phase) return failure("coordination-recovery", ["coordination.phase-not-admitted"]);
    if (input?.expected_event_revision !== cycleRevision(current, input?.cycle_ref)) return failure("coordination-recovery", ["command.stale-revision"]);
    const recoveredAt = now();
    const expiredLeases = phase.work_items.filter((item) => item.active_lease && Date.parse(item.active_lease.expires_at) <= Date.parse(recoveredAt)).map((item) => item.active_lease);
    if (expiredLeases.some((lease) => completedTerminalResult(lease))) return failure("coordination-recovery", ["coordination.terminal-result-settlement-required"]);
    const value = command(input, "coordination.recover", {record_kind: "phase", record_ref: phase.admission.admission_ref}, {phase: input.phase, recovered_at: recoveredAt, expired_lease_refs: expiredLeases.map((lease) => lease.lease_ref)});
    return kernel.processCoordination(value, {event_drafts: [{event_type: "leases-recovered", payload: {phase: input.phase, recovered_at: recoveredAt, expired_leases: expiredLeases}}]});
  }

  function offerHandoff(input) {
    const current = projection();
    if (current.ok === false) return current;
    const reasons = [];
    if (input?.expected_event_revision !== cycleRevision(current, input?.cycle_ref)) reasons.push("command.stale-revision");
    if (!identifier(input?.handoff_ref) || !identifier(input?.handoff_type) || !identifier(input?.target_cycle_kind) || !exactSet(input?.artifact_refs) || !Array.isArray(input?.claim_refs) || !input.claim_refs.every(identifier)) reasons.push("coordination.handoff-offer-invalid");
    if (current.coordination?.handoff_offers?.some((offer) => offer.handoff_ref === input?.handoff_ref)) reasons.push("coordination.handoff-already-offered");
    if (reasons.length) return failure("handoff-offer", reasons);
    const offer = {handoff_ref: input.handoff_ref, handoff_type: input.handoff_type, target_cycle_kind: input.target_cycle_kind, artifact_refs: [...input.artifact_refs].sort(), claim_refs: [...new Set(input.claim_refs)].sort()};
    const value = command(input, "handoff.offer", {record_kind: "handoff", record_ref: input.handoff_ref}, {offer});
    return kernel.processCoordination(value, {event_drafts: [{event_type: "handoff-offered", payload: {offer}}]});
  }

  function acceptHandoff(input) {
    const current = projection();
    if (current.ok === false) return current;
    const offer = current.coordination?.handoff_offers?.find((candidate) => candidate.handoff_ref === input?.handoff_ref);
    const definition = registryLookup(registry, input?.cycle_definition_ref, input?.cycle_definition_digest);
    const reasons = [];
    if (input?.expected_event_revision !== cycleRevision(current, input?.cycle_ref)) reasons.push("command.stale-revision");
    if (!offer || input?.offer_digest !== offer?.offer_digest) reasons.push("coordination.handoff-substitution");
    if (definition && offer && definition.cycle_kind !== offer.target_cycle_kind) reasons.push("coordination.handoff-target-kind-mismatch");
    if (!Array.isArray(input?.accepted_artifact_refs) || input.accepted_artifact_refs.some((ref) => !offer?.artifact_refs.includes(ref)) || !Array.isArray(input?.accepted_claim_refs) || input.accepted_claim_refs.some((ref) => !offer?.claim_refs.includes(ref))) reasons.push("coordination.handoff-selection-invalid");
    if (!definition) reasons.push("coordination.definition-binding-invalid");
    if (reasons.length) return failure("handoff-acceptance", reasons);
    const acceptance = {handoff_ref: offer.handoff_ref, offer_digest: offer.offer_digest, accepted_artifact_refs: [...new Set(input.accepted_artifact_refs)].sort(), accepted_claim_refs: [...new Set(input.accepted_claim_refs)].sort(), reason_codes: []};
    const prospective = {schema_version: "are.evolution-handoff-acceptance/v1", ...acceptance, receiving_cycle_ref: input.cycle_ref, disposition: "accepted", acceptance_receipt_ref: "receipt:derived-after-commit", authority_effect: "none"};
    if (!verifyHandoffAcceptance(prospective).ok || !verifyHandoffOffer(({handoff_ref: offer.handoff_ref, handoff_type: offer.handoff_type, source_cycle_ref: offer.source_cycle_ref, target_cycle_kind: offer.target_cycle_kind, artifact_refs: offer.artifact_refs, claim_refs: offer.claim_refs, offer_receipt_ref: offer.offer_receipt_ref, schema_version: offer.schema_version, authority_effect: "none"})).ok) return failure("handoff-acceptance", ["coordination.handoff-record-invalid"]);
    const value = command(input, "handoff.accept", {record_kind: "handoff", record_ref: offer.handoff_ref}, {acceptance});
    return kernel.processCoordination(value, {event_drafts: [{event_type: "handoff-accepted", payload: {acceptance}}]});
  }

  return Object.freeze({version: EVOLUTION_COORDINATOR_VERSION, inspect, admitPhase, leaseWork, settleWork, recover, offerHandoff, acceptHandoff});
}
