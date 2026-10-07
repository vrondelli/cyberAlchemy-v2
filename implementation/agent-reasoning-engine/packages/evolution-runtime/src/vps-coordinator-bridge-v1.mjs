import {canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {verifyWorkerAssignment, verifyWorkerResult} from "./vps-benchmark-protocol-v1.mjs";

export const VPS_COORDINATOR_BRIDGE_VERSION = "are.vps-coordinator-bridge/v1";
const freeze = (value) => deepFreeze(canonicalizeJson(value));

function fail(stage, reasons) {
  return freeze({schema_version: "are.vps-bridge-failure/v1", ok: false, stage, reason_codes: [...new Set(reasons)].sort(), authority_effect: "none"});
}

export function createVpsCoordinatorBridge({coordinator, capacity, inbox} = {}) {
  if (!coordinator || !capacity || !inbox) throw new TypeError("VPS bridge requires coordinator, capacity arbiter, and inbox.");

  function prepareAssignment(input) {
    const checked = verifyWorkerAssignment(input?.assignment);
    if (!checked.ok) return fail("prepare-assignment", checked.reason_codes);
    const phase = coordinator.inspect().value?.phases?.find((item) => item.cycle_ref === input.assignment.cycle_ref && item.phase === input.assignment.phase);
    const lease = phase?.work_items?.find((item) => item.task_id === input.assignment.task_ref)?.active_lease;
    if (!lease || lease.lease_ref !== input.assignment.lease_ref || lease.fencing_token !== input.assignment.fencing_token) return fail("prepare-assignment", ["bridge.lease-binding-invalid"]);
    const reservation = capacity.inspect().active_reservations?.find((item) => item.reservation_ref === input.assignment.reservation_ref);
    if (!reservation) return fail("prepare-assignment", ["bridge.capacity-reservation-missing"]);
    return inbox.putAssignment({...input.command, assignment: input.assignment});
  }

  function proposeSettlement(resultRef) {
    const loaded = inbox.readResult(resultRef);
    if (!loaded.ok) return loaded;
    const checked = verifyWorkerResult(loaded.value);
    if (!checked.ok) return fail("propose-settlement", checked.reason_codes);
    const result = loaded.value;
    const assignment = inbox.readAssignment(result.assignment_ref);
    if (!assignment.ok || assignment.value.assignment_digest !== result.assignment_digest || assignment.value.lease_ref !== result.lease_ref || assignment.value.fencing_token !== result.fencing_token) return fail("propose-settlement", ["bridge.assignment-result-binding-invalid"]);
    return freeze({ok: true, disposition: "proposed", value: {cycle_ref: result.cycle_ref, phase: result.phase, task_ref: result.task_ref, lease_ref: result.lease_ref, fencing_token: result.fencing_token, outcome: result.disposition, evidence: result.artifacts.map((artifact) => ({criterion_id: artifact.criterion_id, artifact_ref: artifact.artifact_id, artifact_digest: artifact.sha256})), accounting: {tokens: result.accounting.tokens, cost: result.accounting.cost, elapsed_seconds: result.accounting.elapsed_seconds}, terminal_result_ref: result.result_ref}, authority_effect: "none"});
  }

  function recoverPendingResults() {
    const phaseRows = coordinator.inspect().value?.phases ?? [];
    const pending = [];
    for (const row of inbox.inspect().value.worker_results) {
      const phase = phaseRows.find((item) => item.cycle_ref === row.cycle_ref && item.phase === row.phase);
      const active = phase?.work_items?.some((item) => item.active_lease?.lease_ref === row.lease_ref);
      if (active) pending.push(row.result_ref);
    }
    return freeze({ok: true, disposition: pending.length ? "settlement-required" : "clear", pending_result_refs: pending.sort(), authority_effect: "none"});
  }

  return Object.freeze({version: VPS_COORDINATOR_BRIDGE_VERSION, prepareAssignment, proposeSettlement, recoverPendingResults});
}
