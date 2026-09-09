import {canonicalizeJson, deepFreeze, digestValue, fail, isRecord, nonEmptyString} from "./canonical.mjs";
import {selectedDependenciesFromComposition} from "./context-envelope.mjs";

const SCHEMA_VERSION = "are.context-refresh-assessment/v1";

function index(items, idField, digestField) {
  const result = new Map();
  for (const item of Array.isArray(items) ? items : []) {
    if (isRecord(item) && nonEmptyString(item[idField]) && nonEmptyString(item[digestField])) result.set(item[idField], item[digestField]);
  }
  return result;
}

function changes(previous, current, kind) {
  const ids = [...new Set([...previous.keys(), ...current.keys()])].sort();
  return ids.flatMap((id) => {
    const before = previous.get(id) ?? null;
    const after = current.get(id) ?? null;
    if (before === after) return [];
    return [{kind, identity: id, previous_digest: before, current_digest: after, change: before === null ? "added" : after === null ? "removed" : "changed"}];
  });
}

export function assessContextRefresh(previousEnvelope, currentComposition, currentSources = []) {
  if (!isRecord(currentComposition) || currentComposition.ok !== true) return fail("context-refresh", ["refresh.current-composition-required"]);
  const currentDependencies = selectedDependenciesFromComposition(currentComposition);
  if (!isRecord(previousEnvelope)) {
    const value = canonicalizeJson({
      schema_version: SCHEMA_VERSION,
      disposition: "successor-required",
      reason_codes: ["refresh.initial-context-epoch"],
      changed_selected_dependencies: currentDependencies.map((dependency) => ({kind: "selected-dependency", identity: dependency.dependency_id, previous_digest: null, current_digest: dependency.digest, change: "added"})),
      unrelated_source_drift: [],
      current_selected_dependencies: currentDependencies,
      current_source_snapshot: currentSources,
      reuse_allowed: false,
      authority_effect: "none",
    });
    return deepFreeze({ok: true, value, digest: digestValue(value), authority_effect: "none"});
  }
  if (!Array.isArray(previousEnvelope.selected_dependencies)) return fail("context-refresh", ["refresh.previous-dependencies-missing"]);
  const previousDependencies = index(previousEnvelope.selected_dependencies, "dependency_id", "digest");
  const nextDependencies = index(currentDependencies, "dependency_id", "digest");
  const changedSelected = changes(previousDependencies, nextDependencies, "selected-dependency");
  const previousSources = index(previousEnvelope.source_snapshot, "source_identity", "source_digest");
  const nextSources = index(currentSources, "source_identity", "source_digest");
  const sourceChanges = changes(previousSources, nextSources, "source");
  const unrelated = changedSelected.length === 0 ? sourceChanges : [];
  const disposition = changedSelected.length === 0 ? "reuse-current" : "successor-required";
  const value = canonicalizeJson({
    schema_version: SCHEMA_VERSION,
    disposition,
    reason_codes: disposition === "reuse-current" ? ["refresh.selected-dependencies-current"] : ["refresh.selected-dependency-drift"],
    previous_context_epoch_id: previousEnvelope.context_epoch_id ?? null,
    changed_selected_dependencies: changedSelected,
    unrelated_source_drift: unrelated,
    current_selected_dependencies: currentDependencies,
    current_source_snapshot: currentSources,
    reuse_allowed: disposition === "reuse-current",
    authority_effect: "none",
  });
  return deepFreeze({ok: true, value, digest: digestValue(value), authority_effect: "none"});
}
