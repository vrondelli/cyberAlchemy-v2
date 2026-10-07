import {canonicalJson, canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {
  evolutionProtocolDigest,
  verifyEvolutionCommand,
} from "./protocol-v1.mjs";

export const COORDINATION_PROTOCOL_VERSION = "are.evolution-coordination-protocol/v1";
export const COORDINATION_COMMAND_SCHEMA = "are.evolution-coordination-command/v1";
export const COORDINATION_EVENT_SCHEMA = "are.evolution-coordination-event/v1";
export const COORDINATION_RECEIPT_SCHEMA = "are.evolution-coordination-receipt/v1";
export const COORDINATION_RESULT_SCHEMA = "are.evolution-coordination-result/v1";
export const COORDINATION_PROJECTION_SCHEMA = "are.evolution-coordination-projection/v1";

const HASH = /^[a-f0-9]{64}$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const OPERATIONS = new Set(["phase.admit", "work.lease", "work.settle", "coordination.recover", "handoff.offer", "handoff.accept", "capacity.reserve", "capacity.release", "capacity.recover", "assignment.record", "worker-result.record"]);
const EVENT_TYPES = new Set(["phase-admitted", "work-leased", "work-settled", "leases-recovered", "handoff-offered", "handoff-accepted", "handoff-rejected", "capacity-reserved", "capacity-released", "capacity-recovered", "assignment-recorded", "worker-result-recorded"]);
const COMMAND_KEYS = new Set(["schema_version", "command_id", "idempotency_key", "expected_event_revision", "actor", "worker_ref", "cycle_ref", "cycle_definition_ref", "cycle_definition_digest", "operation", "target", "payload", "payload_digest", "authority_effect"]);

const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const text = (value) => typeof value === "string" && value.length > 0;
const identifier = (value) => text(value) && IDENTIFIER.test(value);
const freeze = (value) => deepFreeze(canonicalizeJson(value));
const unique = (values) => [...new Set(values)].sort();

function unknownKeys(value, allowed, prefix) {
  if (!object(value)) return [`${prefix}.object-required`];
  return Object.keys(value).filter((key) => !allowed.has(key)).map((key) => `${prefix}.unknown-field:${key}`);
}

function result(ok, stage, reasonCodes = [], value = null) {
  return freeze({schema_version: "are.evolution-coordination-validation/v1", ok, stage, reason_codes: unique(reasonCodes), ...(value === null ? {} : {value}), authority_effect: "none"});
}

function commandMaterial(command) {
  const {command_id: _id, ...material} = command;
  return material;
}

function receiptMaterial(receipt) {
  const {receipt_id: _id, receipt_digest: _digest, ...material} = receipt;
  return material;
}

export function materializeCoordinationCommand(input) {
  if (!object(input) || Object.hasOwn(input, "state") || Object.hasOwn(input, "projection_state")) throw new TypeError("Coordination command input is invalid.");
  const payload = canonicalizeJson(object(input.payload) ? input.payload : {});
  const material = canonicalizeJson({
    schema_version: COORDINATION_COMMAND_SCHEMA,
    idempotency_key: input.idempotency_key,
    expected_event_revision: input.expected_event_revision,
    actor: input.actor,
    ...(input.worker_ref === undefined ? {} : {worker_ref: input.worker_ref}),
    cycle_ref: input.cycle_ref,
    cycle_definition_ref: input.cycle_definition_ref,
    cycle_definition_digest: input.cycle_definition_digest,
    operation: input.operation,
    target: input.target,
    payload,
    payload_digest: evolutionProtocolDigest(payload),
    authority_effect: "none",
  });
  const command = freeze({...material, command_id: `evolution-coordination-command:${evolutionProtocolDigest(material)}`});
  const checked = verifyCoordinationCommand(command);
  if (!checked.ok) throw new TypeError(`Coordination command is invalid: ${checked.reason_codes.join(",")}`);
  return command;
}

export function verifyCoordinationCommand(command, {registry = null, current_event_revision: currentRevision = null, require_enabled: requireEnabled = false} = {}) {
  const reasons = unknownKeys(command, COMMAND_KEYS, "coordination-command");
  if (command?.schema_version !== COORDINATION_COMMAND_SCHEMA) reasons.push("coordination.command-schema-invalid");
  if (!identifier(command?.idempotency_key) || !Number.isSafeInteger(command?.expected_event_revision) || command.expected_event_revision < 0) reasons.push("coordination.command-identity-invalid");
  if (currentRevision !== null && command?.expected_event_revision !== currentRevision) reasons.push("command.stale-revision");
  reasons.push(...unknownKeys(command?.actor, new Set(["actor_id", "actor_kind"]), "coordination-command.actor"));
  if (!identifier(command?.actor?.actor_id) || !["user", "agent", "worker", "adapter", "runtime"].includes(command?.actor?.actor_kind)) reasons.push("coordination.command-actor-invalid");
  if (command?.worker_ref !== undefined && command.worker_ref !== null && !identifier(command.worker_ref)) reasons.push("coordination.command-worker-invalid");
  if (!identifier(command?.cycle_ref) || !identifier(command?.cycle_definition_ref) || !HASH.test(command?.cycle_definition_digest ?? "")) reasons.push("coordination.command-cycle-binding-invalid");
  if (!OPERATIONS.has(command?.operation)) reasons.push("coordination.command-operation-invalid");
  reasons.push(...unknownKeys(command?.target, new Set(["record_kind", "record_ref"]), "coordination-command.target"));
  if (!identifier(command?.target?.record_kind) || !identifier(command?.target?.record_ref)) reasons.push("coordination.command-target-invalid");
  if (!object(command?.payload) || command?.payload_digest !== evolutionProtocolDigest(command?.payload ?? {})) reasons.push("coordination.command-payload-invalid");
  if (command?.authority_effect !== "none") reasons.push("coordination.command-authority-invalid");
  const expected = object(command) ? evolutionProtocolDigest(commandMaterial(command)) : "";
  if (command?.command_id !== `evolution-coordination-command:${expected}`) reasons.push("coordination.command-id-invalid");
  if (registry !== null) {
    const definition = registry?.definitions?.find((entry) => entry.definition_ref === command?.cycle_definition_ref);
    if (!definition) reasons.push("command.definition-unregistered");
    else {
      if (definition.definition_digest !== command?.cycle_definition_digest) reasons.push("command.definition-substitution");
      if (requireEnabled && (!definition.admission.admitted || !definition.admission.enabled)) reasons.push("command.definition-not-enabled");
    }
  }
  return reasons.length ? result(false, "coordination-command", reasons) : result(true, "coordination-command", [], command);
}

export function materializeCoordinationEvent({command, revision, event_type: eventType, payload = {}}) {
  const checked = verifyCoordinationCommand(command);
  if (!checked.ok || !Number.isSafeInteger(revision) || revision < 1 || !EVENT_TYPES.has(eventType) || !object(payload)) throw new TypeError("Coordination event input is invalid.");
  const material = canonicalizeJson({schema_version: COORDINATION_EVENT_SCHEMA, cycle_ref: command.cycle_ref, revision, command_id: command.command_id, event_type: eventType, target: command.target, payload_digest: evolutionProtocolDigest(payload), authority_effect: "none"});
  const eventDigest = evolutionProtocolDigest(material);
  return freeze({...material, event_id: `evolution-coordination-event:${eventDigest}`});
}

export function verifyCoordinationEvent(event) {
  const allowed = new Set(["schema_version", "event_id", "cycle_ref", "revision", "command_id", "event_type", "target", "payload_digest", "authority_effect"]);
  const reasons = unknownKeys(event, allowed, "coordination-event");
  if (event?.schema_version !== COORDINATION_EVENT_SCHEMA || !identifier(event?.cycle_ref) || !Number.isSafeInteger(event?.revision) || event.revision < 1) reasons.push("coordination.event-identity-invalid");
  if (!/^evolution-coordination-command:[a-f0-9]{64}$/.test(event?.command_id ?? "") || !EVENT_TYPES.has(event?.event_type)) reasons.push("coordination.event-command-or-type-invalid");
  reasons.push(...unknownKeys(event?.target, new Set(["record_kind", "record_ref"]), "coordination-event.target"));
  if (!identifier(event?.target?.record_kind) || !identifier(event?.target?.record_ref) || !HASH.test(event?.payload_digest ?? "")) reasons.push("coordination.event-target-or-payload-invalid");
  if (event?.authority_effect !== "none") reasons.push("coordination.event-authority-invalid");
  if (object(event)) {
    const {event_id: _id, ...material} = event;
    if (event.event_id !== `evolution-coordination-event:${evolutionProtocolDigest(material)}`) reasons.push("coordination.event-id-invalid");
  }
  return reasons.length ? result(false, "coordination-event", reasons) : result(true, "coordination-event", [], event);
}

export function materializeCoordinationReceipt({command, disposition, previous_event_revision: previousRevision, events = [], reason_codes: reasonCodes = []}) {
  if (!verifyCoordinationCommand(command).ok || !["accepted", "rejected"].includes(disposition) || !Number.isSafeInteger(previousRevision) || previousRevision < 0) throw new TypeError("Coordination receipt input is invalid.");
  if (disposition === "accepted" && events.length === 0) throw new TypeError("Accepted coordination receipt requires events.");
  if (disposition === "rejected" && events.length !== 0) throw new TypeError("Rejected coordination receipt cannot cite events.");
  for (const [index, event] of events.entries()) if (!verifyCoordinationEvent(event).ok || event.command_id !== command.command_id || event.revision !== previousRevision + index + 1) throw new TypeError("Coordination receipt event chain is invalid.");
  const material = canonicalizeJson({
    schema_version: COORDINATION_RECEIPT_SCHEMA,
    command_id: command.command_id,
    command_digest: command.command_id.slice("evolution-coordination-command:".length),
    idempotency_key: command.idempotency_key,
    cycle_ref: command.cycle_ref,
    cycle_definition_digest: command.cycle_definition_digest,
    disposition,
    previous_event_revision: previousRevision,
    next_event_revision: disposition === "accepted" ? previousRevision + events.length : previousRevision,
    event_refs: events.map((event) => event.event_id),
    reason_codes: unique(reasonCodes),
    authority_effect: "none",
  });
  const receiptDigest = evolutionProtocolDigest(material);
  return freeze({...material, receipt_id: `evolution-coordination-receipt:${receiptDigest}`, receipt_digest: receiptDigest});
}

export function verifyCoordinationReceipt(receipt, {command = null} = {}) {
  const allowed = new Set(["schema_version", "receipt_id", "receipt_digest", "command_id", "command_digest", "idempotency_key", "cycle_ref", "cycle_definition_digest", "disposition", "previous_event_revision", "next_event_revision", "event_refs", "reason_codes", "authority_effect"]);
  const reasons = unknownKeys(receipt, allowed, "coordination-receipt");
  if (receipt?.schema_version !== COORDINATION_RECEIPT_SCHEMA) reasons.push("coordination.receipt-schema-invalid");
  const expected = object(receipt) ? evolutionProtocolDigest(receiptMaterial(receipt)) : "";
  if (receipt?.receipt_digest !== expected || receipt?.receipt_id !== `evolution-coordination-receipt:${expected}`) reasons.push("coordination.receipt-digest-invalid");
  if (!["accepted", "rejected"].includes(receipt?.disposition) || !Number.isSafeInteger(receipt?.previous_event_revision) || !Number.isSafeInteger(receipt?.next_event_revision)) reasons.push("coordination.receipt-shape-invalid");
  if (receipt?.disposition === "accepted" && (receipt.next_event_revision <= receipt.previous_event_revision || !receipt.event_refs?.length)) reasons.push("coordination.receipt-acceptance-invalid");
  if (receipt?.disposition === "rejected" && (receipt.next_event_revision !== receipt.previous_event_revision || receipt.event_refs?.length !== 0 || !receipt.reason_codes?.length)) reasons.push("coordination.receipt-rejection-invalid");
  if (receipt?.authority_effect !== "none") reasons.push("coordination.receipt-authority-invalid");
  if (command !== null && (!verifyCoordinationCommand(command).ok || receipt?.command_id !== command.command_id || receipt?.command_digest !== command.command_id.slice("evolution-coordination-command:".length) || receipt?.idempotency_key !== command.idempotency_key || receipt?.cycle_definition_digest !== command.cycle_definition_digest)) reasons.push("coordination.receipt-command-binding-invalid");
  return reasons.length ? result(false, "coordination-receipt", reasons) : result(true, "coordination-receipt", [], receipt);
}

export function materializeCoordinationResult(receipt) {
  if (!verifyCoordinationReceipt(receipt).ok) throw new TypeError("Cannot create a result for an invalid coordination receipt.");
  return freeze({schema_version: COORDINATION_RESULT_SCHEMA, command_id: receipt.command_id, disposition: receipt.disposition, receipt, authority_effect: "none"});
}

export function isCoordinationCommand(value) {
  return value?.schema_version === COORDINATION_COMMAND_SCHEMA;
}

export function isCoordinationEvent(value) {
  return value?.schema_version === COORDINATION_EVENT_SCHEMA;
}

export function isCoordinationReceipt(value) {
  return value?.schema_version === COORDINATION_RECEIPT_SCHEMA;
}

function phaseKey(cycleRef, phase) {
  return `${cycleRef}::${phase}`;
}

function deriveWork(phase) {
  const rows = new Map();
  for (const taskId of phase.plan.topological_order) {
    const task = phase.plan.tasks.find((candidate) => candidate.task_id === taskId);
    const current = phase.work[taskId] ?? {attempts: [], active_lease: null, settlements: []};
    const waiting = task.depends_on.filter((dependency) => rows.get(dependency)?.state !== "completed");
    const blocked = task.depends_on.filter((dependency) => ["blocked", "cancelled"].includes(rows.get(dependency)?.state));
    let state = blocked.length ? "blocked" : waiting.length ? "planned" : "ready";
    const last = current.settlements.at(-1);
    if (current.active_lease) state = "leased";
    else if (last?.outcome === "succeeded") state = "completed";
    else if (["failed", "cancelled"].includes(last?.outcome)) state = "blocked";
    else if (last?.outcome === "retryable-failure" && current.attempts.length >= phase.envelope.resource_limits.maximum_attempts) state = "blocked";
    rows.set(taskId, {...task, state, waiting_for: waiting, blocked_by: blocked, attempts: current.attempts, active_lease: current.active_lease, settlements: current.settlements});
  }
  return [...rows.values()];
}

export function deriveCoordinationProjection({commits, commands, events, receipts, payloads}) {
  const phases = new Map();
  const offers = new Map();
  const acceptances = [];
  const capacityScopes = new Map();
  const assignments = new Map();
  const workerResults = new Map();
  const receiptByCommand = new Map(receipts.map((receipt) => [receipt?.command_id, receipt]));
  for (const event of events.filter(isCoordinationEvent)) {
    const payload = payloads.get(event.event_id);
    const receipt = receiptByCommand.get(event.command_id);
    if (event.event_type === "phase-admitted") {
      phases.set(phaseKey(event.cycle_ref, payload.admission.phase), {cycle_ref: event.cycle_ref, phase: payload.admission.phase, admission: payload.admission, plan: payload.plan, envelope: payload.envelope, event_refs: [event.event_id], receipt_refs: [receipt.receipt_id], work: {}, recoveries: []});
      continue;
    }
    if (event.event_type === "handoff-offered") {
      const offer = freeze({schema_version: "are.evolution-handoff-offer/v1", ...payload.offer, source_cycle_ref: event.cycle_ref, offer_receipt_ref: receipt.receipt_id, authority_effect: "none"});
      offers.set(offer.handoff_ref, {...offer, offer_digest: evolutionProtocolDigest(offer), event_ref: event.event_id});
      continue;
    }
    if (["handoff-accepted", "handoff-rejected"].includes(event.event_type)) {
      acceptances.push(freeze({schema_version: "are.evolution-handoff-acceptance/v1", ...payload.acceptance, receiving_cycle_ref: event.cycle_ref, disposition: event.event_type === "handoff-accepted" ? "accepted" : "rejected", acceptance_receipt_ref: receipt.receipt_id, authority_effect: "none"}));
      continue;
    }
    if (event.event_type === "capacity-reserved") {
      const scope = capacityScopes.get(payload.capacity_scope) ?? {capacity_scope: payload.capacity_scope, limits: payload.limits, active_reservations: new Map(), consumed: {workers: 0, tokens: 0, cost: 0, elapsed_seconds: 0}, recoveries: []};
      scope.active_reservations.set(payload.reservation.reservation_ref, {...payload.reservation, event_ref: event.event_id, receipt_ref: receipt.receipt_id});
      capacityScopes.set(payload.capacity_scope, scope);
      continue;
    }
    if (event.event_type === "capacity-released") {
      const scope = capacityScopes.get(payload.capacity_scope);
      const reservation = scope?.active_reservations.get(payload.reservation_ref);
      if (scope && reservation) {
        scope.active_reservations.delete(payload.reservation_ref);
        for (const key of ["tokens", "cost", "elapsed_seconds"]) scope.consumed[key] += payload.accounting[key] ?? 0;
      }
      continue;
    }
    if (event.event_type === "capacity-recovered") {
      const scope = capacityScopes.get(payload.capacity_scope);
      if (scope) {
        for (const ref of payload.expired_reservation_refs) scope.active_reservations.delete(ref);
        scope.recoveries.push({recovered_at: payload.recovered_at, expired_reservation_refs: payload.expired_reservation_refs, event_ref: event.event_id, receipt_ref: receipt.receipt_id});
      }
      continue;
    }
    if (event.event_type === "assignment-recorded") {
      assignments.set(payload.assignment_ref, {...payload, event_ref: event.event_id, receipt_ref: receipt.receipt_id});
      continue;
    }
    if (event.event_type === "worker-result-recorded") {
      workerResults.set(payload.result_ref, {...payload, event_ref: event.event_id, receipt_ref: receipt.receipt_id});
      continue;
    }
    const phase = phases.get(phaseKey(event.cycle_ref, payload.phase));
    if (!phase) continue;
    phase.event_refs.push(event.event_id);
    phase.receipt_refs.push(receipt.receipt_id);
    if (event.event_type === "work-leased") {
      const current = phase.work[payload.lease.task_ref] ?? {attempts: [], active_lease: null, settlements: []};
      current.attempts.push(payload.lease.lease_ref);
      current.active_lease = payload.lease;
      phase.work[payload.lease.task_ref] = current;
    } else if (event.event_type === "work-settled") {
      const current = phase.work[payload.settlement.task_ref] ?? {attempts: [], active_lease: null, settlements: []};
      current.settlements.push({...payload.settlement, receipt_ref: receipt.receipt_id});
      current.active_lease = null;
      phase.work[payload.settlement.task_ref] = current;
    } else if (event.event_type === "leases-recovered") {
      for (const expired of payload.expired_leases) {
        const current = phase.work[expired.task_ref];
        if (current?.active_lease?.lease_ref === expired.lease_ref) {
          current.settlements.push({...expired, outcome: "expired", receipt_ref: receipt.receipt_id});
          current.active_lease = null;
        }
      }
      phase.recoveries.push({event_ref: event.event_id, receipt_ref: receipt.receipt_id, recovered_at: payload.recovered_at, expired_lease_refs: payload.expired_leases.map((lease) => lease.lease_ref)});
    }
  }
  const phaseRows = [...phases.values()].map((phase) => {
    const workItems = deriveWork(phase);
    const accounting = workItems.flatMap((item) => item.settlements).reduce((sum, settlement) => ({attempts: sum.attempts + (settlement.outcome === "expired" ? 0 : 1), tokens: sum.tokens + (settlement.accounting?.tokens ?? 0), cost: sum.cost + (settlement.accounting?.cost ?? 0), elapsed_seconds: sum.elapsed_seconds + (settlement.accounting?.elapsed_seconds ?? 0)}), {attempts: 0, tokens: 0, cost: 0, elapsed_seconds: 0});
    return {...phase, work_items: workItems, frontier: workItems.filter((item) => item.state === "ready").map((item) => item.task_id), accounting};
  }).sort((left, right) => phaseKey(left.cycle_ref, left.phase).localeCompare(phaseKey(right.cycle_ref, right.phase)));
  const capacity = [...capacityScopes.values()].map((scope) => ({...scope, active_reservations: [...scope.active_reservations.values()].sort((a, b) => a.reservation_ref.localeCompare(b.reservation_ref))})).sort((a, b) => a.capacity_scope.localeCompare(b.capacity_scope));
  const inbox = {assignments: [...assignments.values()].sort((a, b) => a.assignment_ref.localeCompare(b.assignment_ref)), worker_results: [...workerResults.values()].sort((a, b) => a.result_ref.localeCompare(b.result_ref))};
  const material = canonicalizeJson({schema_version: COORDINATION_PROJECTION_SCHEMA, commit_count: commits.length, phases: phaseRows, handoff_offers: [...offers.values()].sort((a, b) => a.handoff_ref.localeCompare(b.handoff_ref)), handoff_acceptances: acceptances, vps_capacity: capacity, vps_inbox: inbox, authority_effect: "none"});
  return freeze({...material, projection_digest: evolutionProtocolDigest(material)});
}

export function verifyCoordinationDocument(value, options = {}) {
  if (value?.schema_version === COORDINATION_COMMAND_SCHEMA) return verifyCoordinationCommand(value, options);
  if (value?.schema_version === COORDINATION_EVENT_SCHEMA) return verifyCoordinationEvent(value);
  if (value?.schema_version === COORDINATION_RECEIPT_SCHEMA) return verifyCoordinationReceipt(value, options);
  return result(false, "coordination-document", ["coordination.schema-version-unsupported"]);
}

// Guard against accidentally treating an evolution command as a coordination command.
export function verifyProtocolSeparation(value) {
  return result(!(verifyEvolutionCommand(value).ok && verifyCoordinationCommand(value).ok), "coordination-protocol-separation", []);
}
