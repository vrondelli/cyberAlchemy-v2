import {
  canonicalizeJson,
  deepFreeze,
  digestValue,
  fail,
  isRecord,
  nonEmptyString,
} from "./canonical.mjs";

const SCHEMA_VERSION = "are.context-window-view/v1";

function commonReasons(input) {
  const reasons = [];
  if (!isRecord(input.basis) || !nonEmptyString(input.basis_digest)) reasons.push("view.basis-required");
  if (!nonEmptyString(input.consumer_ref)) reasons.push("view.consumer-required");
  if (!nonEmptyString(input.purpose)) reasons.push("view.purpose-required");
  if (!nonEmptyString(input.source_epoch)) reasons.push("view.source-epoch-required");
  if (!nonEmptyString(input.turn_id)) reasons.push("view.turn-id-required");
  return reasons;
}

function identityMaterial(input, lane, predecessorId = null) {
  return canonicalizeJson({
    lane,
    basis_digest: input.basis_digest,
    consumer_ref: input.consumer_ref.trim(),
    purpose: input.purpose.trim(),
    source_epoch: input.source_epoch.trim(),
    window_ref: input.window_ref?.trim() ?? null,
    interaction_id: input.interaction_id?.trim() ?? null,
    turn_id: input.turn_id.trim(),
    predecessor_view_id: predecessorId,
  });
}

export function bindContextWindowView(input) {
  if (!isRecord(input)) return fail("context-window-view", ["view.input-required"]);
  if (input.lane !== "plan-bound" && input.lane !== "interaction-bound") {
    return fail("context-window-view", ["view.exactly-one-lane-required"]);
  }
  const reasons = commonReasons(input);
  if (input.lane === "plan-bound" && !nonEmptyString(input.window_ref)) reasons.push("view.window-ref-required");
  if (input.lane === "interaction-bound" && !nonEmptyString(input.interaction_id)) reasons.push("view.interaction-id-required");
  if (reasons.length > 0) return fail("context-window-view", reasons);

  const predecessor = isRecord(input.predecessor_view) ? input.predecessor_view : null;
  const predecessorId = predecessor?.view_id ?? null;
  const reuse = isRecord(input.reuse_predicate) ? input.reuse_predicate : null;
  const reusable = input.lane === "plan-bound"
    && predecessor !== null
    && reuse?.equal === true
    && reuse?.current === true
    && predecessor.lane === "plan-bound"
    && predecessor.basis_digest === input.basis_digest
    && predecessor.consumer_ref === input.consumer_ref.trim()
    && predecessor.purpose === input.purpose.trim()
    && predecessor.source_epoch === input.source_epoch.trim()
    && predecessor.window_ref === input.window_ref.trim();

  if (reusable) {
    const reuseMaterial = canonicalizeJson({
      schema_version: "are.context-window-reuse-receipt/v1",
      view_id: predecessor.view_id,
      turn_id: input.turn_id.trim(),
      basis_digest: input.basis_digest,
      predicate_digest: nonEmptyString(reuse.digest) ? reuse.digest.trim() : digestValue({equal: true, current: true}),
      identity_retained: true,
      authority_effect: "none",
    });
    const value = canonicalizeJson({...predecessor, reuse_receipt: {...reuseMaterial, receipt_digest: digestValue(reuseMaterial)}});
    return deepFreeze({schema_version: SCHEMA_VERSION, ok: true, value, digest: digestValue(value), reused: true, authority_effect: "none"});
  }

  const material = identityMaterial(input, input.lane, predecessorId);
  const viewId = `view:${digestValue(material)}`;
  const value = canonicalizeJson({
    schema_version: SCHEMA_VERSION,
    view_id: viewId,
    lane: input.lane,
    basis_digest: input.basis_digest,
    consumer_ref: input.consumer_ref.trim(),
    purpose: input.purpose.trim(),
    source_epoch: input.source_epoch.trim(),
    window_ref: input.lane === "plan-bound" ? input.window_ref.trim() : null,
    interaction_id: input.lane === "interaction-bound" ? input.interaction_id.trim() : null,
    turn_id: input.turn_id.trim(),
    predecessor_view_id: predecessorId,
    reuse_receipt: null,
    authority_effect: "none",
  });
  return deepFreeze({schema_version: SCHEMA_VERSION, ok: true, value, digest: digestValue(value), reused: false, authority_effect: "none"});
}
