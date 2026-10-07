import {canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {evolutionProtocolDigest} from "./protocol-v1.mjs";
import {materializeCoordinationCommand} from "./coordination-protocol-v1.mjs";

export const VPS_CAPACITY_ARBITER_VERSION = "are.vps-capacity-arbiter/v1";
const object = (value) => value !== null && typeof value === "object" && !Array.isArray(value);
const finite = (value) => typeof value === "number" && Number.isFinite(value) && value >= 0;
const freeze = (value) => deepFreeze(canonicalizeJson(value));
const zero = () => ({workers: 0, tokens: 0, cost: 0, elapsed_seconds: 0});

function fail(stage, reasons) {
  return freeze({schema_version: "are.vps-capacity-failure/v1", ok: false, stage, reason_codes: [...new Set(reasons)].sort(), authority_effect: "none"});
}

function validResources(value, workersRequired = false) {
  return object(value) && (!workersRequired || (Number.isSafeInteger(value.workers) && value.workers > 0)) && ["tokens", "cost", "elapsed_seconds"].every((key) => finite(value[key]));
}

function validLimits(value) {
  return object(value) && Number.isSafeInteger(value.maximum_workers) && value.maximum_workers > 0 && Number.isSafeInteger(value.maximum_tokens) && value.maximum_tokens > 0 && finite(value.maximum_cost) && Number.isSafeInteger(value.maximum_elapsed_seconds) && value.maximum_elapsed_seconds > 0;
}

function revision(projection, cycleRef) {
  return projection.aggregate_cycles.find((cycle) => cycle.cycle_ref === cycleRef)?.event_revision ?? 0;
}

export function createVpsCapacityArbiter({kernel, scope, registry, now = () => new Date().toISOString()} = {}) {
  if (!kernel || !object(scope) || !object(scope.limits) || !registry) throw new TypeError("Capacity arbiter requires kernel, scope, limits, and registry.");
  const definition = registry.definitions.find((item) => item.definition_ref === scope.cycle_definition_ref && item.definition_digest === scope.cycle_definition_digest);
  if (!definition || !validLimits(scope.limits)) throw new TypeError("Capacity scope binding is invalid.");

  function current() {
    const inspected = kernel.inspect();
    if (!inspected.ok) return inspected;
    return inspected.value.coordination?.vps_capacity?.find((item) => item.capacity_scope === scope.capacity_scope) ?? {capacity_scope: scope.capacity_scope, limits: scope.limits, active_reservations: [], consumed: zero(), recoveries: []};
  }

  function base(input, operation, recordRef, payload) {
    const inspected = kernel.inspect();
    if (!inspected.ok) return inspected;
    return materializeCoordinationCommand({idempotency_key: input.idempotency_key, expected_event_revision: revision(inspected.value, scope.cycle_ref), actor: input.actor, worker_ref: input.worker_ref ?? null, cycle_ref: scope.cycle_ref, cycle_definition_ref: scope.cycle_definition_ref, cycle_definition_digest: scope.cycle_definition_digest, operation, target: {record_kind: "vps-capacity", record_ref: recordRef}, payload});
  }

  function reserve(input) {
    const state = current();
    if (state.ok === false) return state;
    if (!validResources(input?.resource_request, true) || typeof input?.expires_at !== "string" || !Number.isFinite(Date.parse(input.expires_at))) return fail("capacity-reserve", ["capacity.request-invalid"]);
    if (state.active_reservations.some((item) => Date.parse(item.expires_at) <= Date.parse(now()))) return fail("capacity-reserve", ["capacity.recovery-required"]);
    const active = state.active_reservations.reduce((sum, item) => { for (const key of Object.keys(sum)) sum[key] += item.resource_request[key]; return sum; }, zero());
    const reasons = [];
    for (const key of Object.keys(active)) if (state.consumed[key] + active[key] + input.resource_request[key] > scope.limits[`maximum_${key}`]) reasons.push(`capacity.${key}-exhausted`);
    if (reasons.length) return fail("capacity-reserve", reasons);
    const material = {capacity_scope: scope.capacity_scope, campaign_cycle_ref: input.campaign_cycle_ref, phase: input.phase, task_ref: input.task_ref, worker_ref: input.worker_ref, resource_request: input.resource_request, expires_at: input.expires_at};
    const reservation = freeze({schema_version: "are.vps-capacity-reservation/v1", reservation_ref: `reservation:${evolutionProtocolDigest(material)}`, ...material, authority_effect: "none"});
    const command = base(input, "capacity.reserve", reservation.reservation_ref, {capacity_scope: scope.capacity_scope, limits: scope.limits, reservation});
    return command.ok === false ? command : kernel.processCoordination(command, {event_drafts: [{event_type: "capacity-reserved", payload: {capacity_scope: scope.capacity_scope, limits: scope.limits, reservation}}]});
  }

  function release(input) {
    const state = current();
    const reservation = state.active_reservations?.find((item) => item.reservation_ref === input?.reservation_ref);
    if (!reservation || !validResources({...input?.accounting, workers: 1}, true)) return fail("capacity-release", ["capacity.release-invalid"]);
    if (["tokens", "cost", "elapsed_seconds"].some((key) => input.accounting[key] > reservation.resource_request[key])) return fail("capacity-release", ["capacity.actual-exceeds-reservation"]);
    const payload = {capacity_scope: scope.capacity_scope, reservation_ref: reservation.reservation_ref, accounting: input.accounting, released_at: now()};
    const command = base(input, "capacity.release", reservation.reservation_ref, payload);
    return command.ok === false ? command : kernel.processCoordination(command, {event_drafts: [{event_type: "capacity-released", payload}]});
  }

  function recover(input) {
    const state = current();
    const recoveredAt = now();
    const expired = state.active_reservations?.filter((item) => Date.parse(item.expires_at) <= Date.parse(recoveredAt)).map((item) => item.reservation_ref) ?? [];
    const payload = {capacity_scope: scope.capacity_scope, recovered_at: recoveredAt, expired_reservation_refs: expired};
    const command = base(input, "capacity.recover", scope.capacity_scope, payload);
    return command.ok === false ? command : kernel.processCoordination(command, {event_drafts: [{event_type: "capacity-recovered", payload}]});
  }

  return Object.freeze({version: VPS_CAPACITY_ARBITER_VERSION, inspect: current, reserve, release, recover});
}
