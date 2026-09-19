import {failure, isRecord, sealed, success, text} from "./canonical.mjs";
import {INSPECTION_PROJECTION_SCHEMA, INTENT_CONTROL_RECEIPT_SCHEMA, materializeIntentContract, verifyIntentContract, verifyUserControlProfile} from "./contracts.mjs";

const MODES = new Set(["quiet", "explain", "inspect", "control"]);

export function projectIntentInspection(input = {}) {
  const contract = input.contract;
  const profile = input.control_profile;
  if (!verifyIntentContract(contract).ok || !verifyUserControlProfile(profile).ok) return failure("intent-inspection-projection", ["intent.inspection-input-invalid"]);
  const mode = input.mode ?? profile.visibility;
  if (!MODES.has(mode)) return failure("intent-inspection-projection", ["intent.inspection-mode-invalid"]);
  const base = {mode, intent_contract_digest: contract.intent_contract_digest, objective: contract.objective, target: contract.target, disposition: contract.disposition, unresolved_questions: contract.unresolved_questions};
  if (mode !== "quiet") Object.assign(base, {route_candidate: contract.route_candidate, assumptions: contract.assumptions, risk_projections: contract.risk_projections, construction_directives: contract.construction_directives, surface_requirements: contract.surface_requirements, surface_prohibitions: contract.surface_prohibitions});
  if (mode === "inspect" || mode === "control") Object.assign(base, {request_ref: contract.request_ref, request_digest: contract.request_digest, context_envelope_digest: contract.context_envelope_digest, reasoning_epoch_digest: contract.reasoning_epoch_digest, referent_bindings: contract.referent_bindings, source_refs: contract.source_refs, predecessor_contract_digest: contract.predecessor_contract_digest, reflection: input.reflection ?? null});
  if (mode === "control") base.available_operations = ["correct-objective", "rebind-reference", "reject-assumption", "set-disposition"];
  return success("intent-inspection-projection", sealed(INSPECTION_PROJECTION_SCHEMA, base, "projection_digest"));
}

export function applyIntentControl(contract, operation = {}) {
  if (!verifyIntentContract(contract).ok || !isRecord(operation) || !text(operation.kind)) return failure("intent-control", ["intent.control-input-invalid"]);
  const {schema_version: _schema, intent_contract_digest: _digest, authority_effect: _authority, ...fields} = contract;
  const next = {...fields, predecessor_contract_digest: contract.intent_contract_digest};
  if (operation.kind === "correct-objective" && text(operation.value)) next.objective = operation.value.trim();
  else if (operation.kind === "rebind-reference" && text(operation.reference) && text(operation.value)) next.referent_bindings = {...contract.referent_bindings, [operation.reference.trim()]: operation.value.trim()};
  else if (operation.kind === "reject-assumption" && text(operation.value)) next.assumptions = contract.assumptions.filter((value) => value !== operation.value.trim());
  else if (operation.kind === "set-disposition" && ["act", "ask", "block", "correct-premise"].includes(operation.value)) next.disposition = operation.value;
  else return failure("intent-control", ["intent.control-operation-invalid"]);
  let successor;
  try { successor = materializeIntentContract(next); } catch { return failure("intent-control", ["intent.control-successor-invalid"]); }
  const receipt = sealed(INTENT_CONTROL_RECEIPT_SCHEMA, {operation: operation.kind, predecessor_contract_digest: contract.intent_contract_digest, successor_contract_digest: successor.intent_contract_digest, user_selected: operation.user_selected === true}, "control_receipt_digest");
  return success("intent-control", {successor, receipt});
}

export function appendIntentLifecycleEvents(ledger, records = []) {
  if (!ledger || typeof ledger.append !== "function" || !Array.isArray(records)) return failure("intent-lifecycle-append", ["intent.ledger-and-records-required"]);
  const appended = [];
  for (const entry of records) {
    if (!isRecord(entry) || !text(entry.event_kind) || !isRecord(entry.content)) return failure("intent-lifecycle-append", ["intent.lifecycle-event-invalid"]);
    const result = ledger.append({event_kind: entry.event_kind, idempotency_key: text(entry.idempotency_key) ? entry.idempotency_key : `${entry.event_kind}:${entry.content.intent_contract_digest ?? entry.content.reflection_digest ?? entry.content.disposition_digest ?? entry.content.projection_digest}`, content: entry.content, provenance_refs: entry.provenance_refs ?? []});
    if (!result?.ok) return failure("intent-lifecycle-append", result?.reason_codes ?? ["intent.lifecycle-append-failed"]);
    appended.push(result.event);
  }
  return success("intent-lifecycle-append", appended, {event_count: appended.length});
}
