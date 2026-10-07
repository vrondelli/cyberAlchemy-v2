import {canonicalJson, canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {materializeCoordinationCommand} from "./coordination-protocol-v1.mjs";
import {verifyWorkerAssignment, verifyWorkerResult} from "./vps-benchmark-protocol-v1.mjs";

export const VPS_WORK_INBOX_VERSION = "are.vps-work-inbox/v1";
const freeze = (value) => deepFreeze(canonicalizeJson(value));

function fail(stage, reasons) {
  return freeze({schema_version: "are.vps-inbox-failure/v1", ok: false, stage, reason_codes: [...new Set(reasons)].sort(), authority_effect: "none"});
}

function revision(projection, cycleRef) {
  return projection.aggregate_cycles.find((cycle) => cycle.cycle_ref === cycleRef)?.event_revision ?? 0;
}

export function createVpsWorkInbox({kernel, registry} = {}) {
  if (!kernel || !registry) throw new TypeError("VPS inbox requires a kernel and registry.");

  function projection() {
    const inspected = kernel.inspect();
    return inspected.ok ? inspected.value : inspected;
  }

  function record(input, document, kind) {
    const checked = kind === "assignment" ? verifyWorkerAssignment(document) : verifyWorkerResult(document);
    if (!checked.ok) return fail(`${kind}-record`, checked.reason_codes);
    const existingRows = projection().coordination?.vps_inbox?.[kind === "assignment" ? "assignments" : "worker_results"] ?? [];
    const logicalRef = kind === "assignment" ? document.assignment_ref : document.result_ref;
    const digest = kind === "assignment" ? document.assignment_digest : document.result_digest;
    const existing = existingRows.find((item) => item[`${kind}_ref`] === logicalRef);
    if (existing) return existing[`${kind}_digest`] === digest ? freeze({ok: true, disposition: "replayed", value: existing, authority_effect: "none"}) : fail(`${kind}-record`, ["replay.conflict"]);
    const artifact = kernel.putArtifact({bytes: canonicalJson(document), media_type: "application/json", semantic_binding: {cycle_ref: document.cycle_ref, cycle_definition_digest: input.cycle_definition_digest, role: `vps-${kind}`, provenance_refs: [kind === "assignment" ? document.bundle_ref : document.assignment_ref], claim_ceiling: "provider-free coordination evidence"}});
    if (!artifact.ok) return artifact;
    const state = projection();
    const payload = kind === "assignment"
      ? {assignment_ref: document.assignment_ref, assignment_digest: document.assignment_digest, bundle_digest: document.bundle_digest, cycle_ref: document.cycle_ref, phase: document.phase, task_ref: document.task_ref, lease_ref: document.lease_ref, fencing_token: document.fencing_token, artifact_identity: artifact.value}
      : {result_ref: document.result_ref, result_digest: document.result_digest, assignment_ref: document.assignment_ref, assignment_digest: document.assignment_digest, cycle_ref: document.cycle_ref, phase: document.phase, task_ref: document.task_ref, lease_ref: document.lease_ref, fencing_token: document.fencing_token, completed_at: document.completed_at, disposition: document.disposition, artifact_identity: artifact.value};
    const command = materializeCoordinationCommand({idempotency_key: input.idempotency_key, expected_event_revision: revision(state, document.cycle_ref), actor: input.actor, worker_ref: document.worker_ref, cycle_ref: document.cycle_ref, cycle_definition_ref: input.cycle_definition_ref, cycle_definition_digest: input.cycle_definition_digest, operation: kind === "assignment" ? "assignment.record" : "worker-result.record", target: {record_kind: `vps-${kind}`, record_ref: logicalRef}, payload});
    return kernel.processCoordination(command, {event_drafts: [{event_type: kind === "assignment" ? "assignment-recorded" : "worker-result-recorded", payload}]});
  }

  function read(kind, logicalRef) {
    const rows = projection().coordination?.vps_inbox?.[kind === "assignment" ? "assignments" : "worker_results"] ?? [];
    const row = rows.find((item) => item[`${kind}_ref`] === logicalRef);
    if (!row) return fail(`${kind}-read`, ["inbox.record-not-found"]);
    const loaded = kernel.readObject(row.artifact_identity);
    if (!loaded.ok) return loaded;
    try {
      const document = JSON.parse(Buffer.from(loaded.value.bytes_base64, "base64").toString("utf8"));
      const checked = kind === "assignment" ? verifyWorkerAssignment(document) : verifyWorkerResult(document);
      if (!checked.ok || document[`${kind}_digest`] !== row[`${kind}_digest`]) return fail(`${kind}-read`, ["inbox.artifact-invalid"]);
      return freeze({ok: true, disposition: "loaded", value: document, artifact_identity: row.artifact_identity, authority_effect: "none"});
    } catch { return fail(`${kind}-read`, ["inbox.artifact-invalid"]); }
  }

  return Object.freeze({
    version: VPS_WORK_INBOX_VERSION,
    putAssignment: (input) => record(input, input?.assignment, "assignment"),
    putResult: (input) => record(input, input?.result, "result"),
    readAssignment: (assignmentRef) => read("assignment", assignmentRef),
    readResult: (resultRef) => read("result", resultRef),
    inspect: () => freeze({ok: true, value: projection().coordination?.vps_inbox ?? {assignments: [], worker_results: []}, authority_effect: "none"}),
  });
}
