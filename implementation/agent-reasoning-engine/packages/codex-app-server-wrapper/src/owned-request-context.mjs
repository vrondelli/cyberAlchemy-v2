import {digestValue, fail, freezeResult, isRecord, nonEmptyString, uniqueStrings}
  from "./canonical.mjs";
import {digestIntentMaterial, verifyObjectiveState} from "../../request-intent-runtime/index.mjs";

// Host-normalized requests only. This verifier checks integrity/binding, not
// Host authentication; the owning gateway must perform the journal join first.
export function buildOwnedRequestContext(request, binding, resolution = null) {
  if (!isRecord(request)
    || Object.keys(request).sort().join(",") !== "consumer_ref,request,request_ref,scope_ref,thread_ref"
    || !["consumer_ref", "request_ref", "scope_ref", "thread_ref"].every(key => nonEmptyString(request[key]))
    || !nonEmptyString(request.request) || Buffer.byteLength(request.request) > 256 * 1024
    || !isRecord(binding) || binding.consumer_ref !== request.consumer_ref) {
    return fail("request-context", ["request.owned-input-invalid"]);
  }
  if (resolution) {
    const {resolution_digest, ...material} = resolution;
    if (resolution.disposition !== "resolved" || resolution.authority_effect !== "none"
      || !verifyObjectiveState(resolution.next_state)
      || resolution.next_state.consumer_ref !== request.consumer_ref
      || resolution.next_state.scope_ref !== request.scope_ref
      || resolution.request_ref !== request.request_ref
      || resolution.request_digest !== digestIntentMaterial(request.request)
      || digestIntentMaterial(material) !== resolution_digest) {
      return fail("request-context", ["objective.resolution-request-binding-invalid"]);
    }
  }
  const effective = resolution?.next_state?.active_objective?.description ?? request.request;
  const rawInput = [{type: "text", text: request.request}];
  const objectiveKind = nonEmptyString(binding.objective_kind) ? binding.objective_kind.trim() : null;
  const fields = Object.fromEntries(["requested_effects", "target_refs", "constraints", "evidence_refs"]
    .map(key => [key, uniqueStrings(binding[key] ?? [])]));
  const postures = isRecord(binding.field_postures) ? binding.field_postures : {};
  const posture = (field, present) => present
    ? (postures[field] === "explicit" ? "explicit" : "inferred") : "absent";
  return freezeResult({ok: true,
    value: {
      schema_version: "are.request-context/v1", request_id: request.request_ref,
      raw_request: effective, objective_kind: objectiveKind,
      ...fields,
      evidence_refs: uniqueStrings([...fields.evidence_refs,
        `owned-input:${digestValue(rawInput)}`, ...(resolution
          ? [`objective-resolution:${resolution.resolution_digest}`,
            `original-request:${digestValue(request.request)}`] : [])]),
      field_postures: {
        request_id: "inferred", raw_request: effective === request.request ? "explicit" : "inferred",
        objective_kind: posture("objective_kind", objectiveKind !== null),
        requested_effects: posture("requested_effects", fields.requested_effects.length > 0),
        target_refs: posture("target_refs", fields.target_refs.length > 0),
        constraints: posture("constraints", fields.constraints.length > 0), evidence_refs: "inferred",
      },
    },
    raw_input: rawInput, raw_input_digest: digestValue(rawInput),
    authority_effect: "none",
  });
}
