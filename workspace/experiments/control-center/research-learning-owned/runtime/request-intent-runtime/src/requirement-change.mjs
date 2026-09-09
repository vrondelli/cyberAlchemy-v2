import {canonicalJson, digest, failure, isRecord, sealed, success, text, verifyDigest} from "./canonical.mjs";
const closed = (x, keys) => isRecord(x) && Object.keys(x).every(k => keys.includes(k));
const hash = x => typeof x === "string" && /^[a-f0-9]{64}$/.test(x);
function set(values) {
  if (!Array.isArray(values) || values.length > 64 || !values.every(text)) throw Error("requirements.invalid-set");
  const result = values.map(x => x.trim()).sort();
  if (new Set(result).size !== result.length) throw Error("requirements.duplicate-entry");
  return result;
}
export function materializeRequirementSnapshot(input) {
  if (!closed(input, ["consumer_ref", "scope_ref", "objective_id", "objective_state_digest", "requirements", "source_refs"])
    || ![input.consumer_ref, input.scope_ref, input.objective_id].every(text) || !hash(input.objective_state_digest)) throw Error("requirements.snapshot-binding-invalid");
  const sourceRefs = set(input.source_refs);
  if (!sourceRefs.length) throw Error("requirements.source-required");
  const record = sealed("are.objective-requirements/v1", {consumer_ref: input.consumer_ref, scope_ref: input.scope_ref,
    objective_id: input.objective_id, objective_state_digest: input.objective_state_digest,
    requirements: set(input.requirements), source_refs: sourceRefs}, "snapshot_digest");
  if (Buffer.byteLength(canonicalJson(record)) > 32768) throw Error("requirements.budget-exceeded");
  return record;
}
export function verifyRequirementSnapshot(record) {
  try {
    if (record?.schema_version !== "are.objective-requirements/v1" || record.authority_effect !== "none" || !verifyDigest(record, "snapshot_digest")) return false;
    const {schema_version, authority_effect, snapshot_digest, ...input} = record;
    return materializeRequirementSnapshot(input).snapshot_digest === snapshot_digest;
  } catch { return false; }
}
export function assessRequirementChange(input) {
  try {
    if (!isRecord(input)) throw Error("requirements.input-invalid");
    const {snapshot, delta, transition, request, request_ref} = input;
    if (!verifyRequirementSnapshot(snapshot) || !text(request) || !text(request_ref)) throw Error("requirements.input-invalid");
    if (!closed(delta, ["retained", "added", "removed"])) throw Error("requirements.delta-required");
    if (!["continue", "refine"].includes(transition)) throw Error("requirements.transition-not-supported");
    const retained = set(delta.retained), added = set(delta.added), removed = set(delta.removed);
    if (added.some(x => snapshot.requirements.includes(x)) || removed.some(x => !snapshot.requirements.includes(x))) throw Error("requirements.delta-membership-invalid");
    if (canonicalJson(retained) !== canonicalJson(snapshot.requirements.filter(x => !removed.includes(x)))) throw Error("requirements.silent-loss-or-retention-conflict");
    const changed = added.length + removed.length > 0;
    if ((transition === "continue" && changed) || (transition === "refine" && !changed)) throw Error("requirements.transition-delta-conflict");
    const value = sealed("are.objective-requirement-change/v1", {snapshot_digest: snapshot.snapshot_digest, objective_id: snapshot.objective_id,
      request_ref, request_digest: digest(request), transition, retained, added, removed, resulting_requirements: set([...retained, ...added]),
      semantic_posture: "declared-change-not-semantically-proven"}, "change_digest");
    if (Buffer.byteLength(canonicalJson(value)) > 32768) throw Error("requirements.budget-exceeded");
    return success("requirement-change", value);
  } catch (error) { return failure("requirement-change", [error.message]); }
}
