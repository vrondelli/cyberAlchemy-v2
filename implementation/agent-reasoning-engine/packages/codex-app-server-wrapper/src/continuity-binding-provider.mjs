import {readFileSync} from "node:fs";
import {resolve} from "node:path";

import {canonicalizeJson} from "../../intent-route-resolver/index.mjs";
import {digestValue, fail, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";

export const CONTINUITY_BINDING_SNAPSHOT_SCHEMA = "are.continuity-binding-snapshot/v1";
export const CONTINUITY_BINDING_RECEIPT_SCHEMA = "are.continuity-binding-receipt/v1";

const TRANSITIONS = new Set(["continue", "refine", "interrupt", "replace", "new"]);
const RELATIONSHIPS = new Set(["engine-coordinates-cycle", "benchmark-artifact-within-cycle", "sibling-cycle-handoff", "same-cycle-continuation", "same-cycle-refinement", "temporary-interruption", "clarification-required"]);
const SNAPSHOT_KEYS = new Set(["schema_version", "snapshot_id", "revision", "bindings", "authority_effect", "snapshot_digest"]);
const BINDING_KEYS = new Set(["selector", "active_cycle", "relationship_by_transition", "response_language", "next_action", "clarification_needed", "evidence_status", "high_risk_transitions"]);
const SELECTOR_KEYS = new Set(["consumer_ref", "thread_id"]);
const DIGEST = /^[a-f0-9]{64}$/u;

function closed(value, keys) {
  return isRecord(value) && Object.keys(value).every((key) => keys.has(key));
}

function selectorKey(selector) {
  return `${selector.consumer_ref}\u0000${selector.thread_id ?? "*"}`;
}

function validBinding(binding) {
  if (!closed(binding, BINDING_KEYS) || !closed(binding.selector, SELECTOR_KEYS)
    || !nonEmptyString(binding.selector.consumer_ref)
    || (binding.selector.thread_id !== undefined && !nonEmptyString(binding.selector.thread_id))
    || !nonEmptyString(binding.active_cycle)
    || !isRecord(binding.relationship_by_transition)
    || !["en", "pt"].includes(binding.response_language)
    || !nonEmptyString(binding.next_action)
    || typeof binding.clarification_needed !== "boolean"
    || !["pending", "verified-complete"].includes(binding.evidence_status)
    || !Array.isArray(binding.high_risk_transitions)
    || binding.high_risk_transitions.length === 0
    || new Set(binding.high_risk_transitions).size !== binding.high_risk_transitions.length
    || binding.high_risk_transitions.some((transition) => !TRANSITIONS.has(transition))) return false;
  if (Object.keys(binding.relationship_by_transition).some((transition) => !binding.high_risk_transitions.includes(transition))
    || binding.high_risk_transitions.some((transition) => !RELATIONSHIPS.has(binding.relationship_by_transition[transition]))) return false;
  const questions = (binding.next_action.match(/\?/gu) ?? []).length;
  return binding.clarification_needed ? questions === 1 : questions === 0;
}

export function materializeContinuityBindingSnapshot(input) {
  const material = canonicalizeJson({
    schema_version: CONTINUITY_BINDING_SNAPSHOT_SCHEMA,
    snapshot_id: input?.snapshot_id,
    revision: input?.revision,
    bindings: input?.bindings,
    authority_effect: "none",
  });
  const candidate = {...material, snapshot_digest: digestValue(material)};
  const checked = validateContinuityBindingSnapshot(candidate);
  if (!checked.ok) throw new TypeError(`Invalid continuity binding snapshot: ${checked.reason_codes.join(",")}`);
  return checked.value;
}

export function validateContinuityBindingSnapshot(snapshot) {
  const reasons = [];
  if (!closed(snapshot, SNAPSHOT_KEYS) || snapshot.schema_version !== CONTINUITY_BINDING_SNAPSHOT_SCHEMA
    || !nonEmptyString(snapshot.snapshot_id) || !Number.isSafeInteger(snapshot.revision) || snapshot.revision < 1
    || !Array.isArray(snapshot.bindings) || snapshot.bindings.length === 0
    || snapshot.authority_effect !== "none" || !DIGEST.test(snapshot.snapshot_digest ?? "")) reasons.push("continuity-provider.snapshot-invalid");
  if (Array.isArray(snapshot?.bindings)) {
    if (snapshot.bindings.some((binding) => !validBinding(binding))) reasons.push("continuity-provider.binding-invalid");
    const selectors = snapshot.bindings.filter(validBinding).map((binding) => selectorKey(binding.selector));
    if (new Set(selectors).size !== selectors.length) reasons.push("continuity-provider.selector-duplicate");
  }
  if (isRecord(snapshot)) {
    const material = Object.fromEntries(Object.entries(snapshot).filter(([key]) => key !== "snapshot_digest"));
    if (digestValue(material) !== snapshot.snapshot_digest) reasons.push("continuity-provider.snapshot-digest-mismatch");
  }
  if (reasons.length > 0) return fail("continuity-binding-provider", reasons);
  return freezeResult({ok: true, value: snapshot, authority_effect: "none"});
}

export function loadContinuityBindingSnapshot(path) {
  try {
    const value = JSON.parse(readFileSync(resolve(path), "utf8"));
    return validateContinuityBindingSnapshot(value);
  } catch {
    return fail("continuity-binding-provider", ["continuity-provider.snapshot-unreadable"]);
  }
}

export function createContinuityBindingProvider(snapshot) {
  const checked = validateContinuityBindingSnapshot(snapshot);
  if (!checked.ok) throw new TypeError(`Invalid continuity binding snapshot: ${checked.reason_codes.join(",")}`);
  const bindings = checked.value.bindings;
  const receipts = [];
  const provider = async ({message, turn_binding, objective_resolution}) => {
    const consumerRef = turn_binding?.consumer_ref;
    const threadId = message?.params?.threadId;
    const transition = objective_resolution?.transition;
    if (!nonEmptyString(consumerRef) || !nonEmptyString(threadId) || !TRANSITIONS.has(transition)) throw new Error("continuity-provider.input-invalid");
    const selected = bindings.find((binding) => binding.selector.consumer_ref === consumerRef && binding.selector.thread_id === threadId)
      ?? bindings.find((binding) => binding.selector.consumer_ref === consumerRef && binding.selector.thread_id === undefined);
    if (!selected) throw new Error("continuity-provider.selector-unresolved");
    const highRisk = selected.high_risk_transitions.includes(transition);
    const binding = highRisk ? {
      high_risk: true,
      active_cycle: selected.active_cycle,
      relationship_code: selected.relationship_by_transition[transition],
      response_language: selected.response_language,
      next_action: selected.next_action,
      clarification_needed: selected.clarification_needed,
      evidence_status: selected.evidence_status,
    } : {high_risk: false};
    const material = {
      schema_version: CONTINUITY_BINDING_RECEIPT_SCHEMA,
      snapshot_digest: checked.value.snapshot_digest,
      consumer_ref: consumerRef,
      thread_id: threadId,
      objective_resolution_digest: objective_resolution.resolution_digest,
      transition,
      disposition: highRisk ? "high-risk-binding" : "low-risk-bypass",
      binding_digest: digestValue(binding),
      authority_effect: "none",
    };
    receipts.push(freezeResult({...material, receipt_digest: digestValue(material)}));
    return freezeResult(binding);
  };
  provider.inspect = () => freezeResult({schema_version: "are.continuity-binding-provider-state/v1", snapshot_id: checked.value.snapshot_id, snapshot_digest: checked.value.snapshot_digest, receipt_count: receipts.length, receipts: [...receipts], authority_effect: "none"});
  return Object.freeze(provider);
}

export function resolveContinuityBindingProvider({loaded_profile, state_path}) {
  if (loaded_profile?.continuity_renderer?.enabled !== true) return freezeResult({ok: true, disposition: "disabled", provider: null, snapshot_digest: null, authority_effect: "none"});
  if (!nonEmptyString(state_path)) return fail("continuity-binding-provider", ["continuity-provider.state-path-required"]);
  const loaded = loadContinuityBindingSnapshot(state_path);
  if (!loaded.ok) return loaded;
  const provider = createContinuityBindingProvider(loaded.value);
  return Object.freeze({ok: true, disposition: "ready", provider, snapshot_digest: loaded.value.snapshot_digest, authority_effect: "none"});
}
