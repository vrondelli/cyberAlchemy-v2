import {canonicalJson, digestValue, fail, freezeResult, isRecord, nonEmptyString} from "./canonical.mjs";

export function validMeaningSelection(policy) {
  return isRecord(policy) && Object.keys(policy).every(k => ["definition_ids", "node_ids", "edge_ids", "max_bytes"].includes(k))
    && ["definition_ids", "node_ids", "edge_ids"].every(k => policy[k] === undefined || (Array.isArray(policy[k])
      && policy[k].length <= 64 && policy[k].every(nonEmptyString) && new Set(policy[k]).size === policy[k].length))
    && Number.isSafeInteger(policy.max_bytes ?? 32768) && (policy.max_bytes ?? 32768) > 0 && (policy.max_bytes ?? 32768) <= 32768;
}

// Exact selectors over the current loader result. Text is context, never a fact admission.
export function selectObjectiveMeanings(current, policy) {
  if (!validMeaningSelection(policy)) return fail("objective-meanings", ["objective.meaning-selection-invalid"]);
  if (current?.ok !== true) return fail("objective-meanings", current?.reason_codes ?? ["objective.meaning-sources-unavailable"]);
  const items = [], dependencies = [], nodeIds = new Set(policy.node_ids ?? []);
  function select(records, idKey, id, kind) {
    const matches = Array.isArray(records) ? records.filter(r => r?.[idKey] === id) : [];
    if (matches.length !== 1) throw Error("objective.selected-meaning-missing-or-ambiguous");
    const r = matches[0], sourceDigest = r.digest ?? r.source_digest;
    if (!nonEmptyString(r.source_ref) || !/^[a-f0-9]{64}$/.test(sourceDigest ?? "")) throw Error("objective.selected-meaning-provenance-invalid");
    const meaning = kind === "definition" ? r.definition_text : r.content;
    if (kind === "definition" ? !nonEmptyString(meaning) : !isRecord(meaning) || !Object.values(meaning).some(nonEmptyString)) throw Error("objective.selected-meaning-content-missing");
    const content = {kind, selector: id, meaning, authority_posture: r.authority_posture ?? "candidate-context-only", authority_effect: "none"};
    const item = {source_ref: `${r.source_ref}@${sourceDigest}`, content: canonicalJson(content)};
    items.push(item);
    dependencies.push({kind, selector: id, source_ref: r.source_ref, source_digest: sourceDigest, projection_digest: digestValue(content)});
    return r;
  }
  try {
    for (const id of [...(policy.edge_ids ?? [])].sort()) {
      const edge = select(current.ontology_snapshot?.edges, "edge_id", id, "edge");
      if (!nonEmptyString(edge.from_node_id) || !nonEmptyString(edge.to_node_id)) throw Error("objective.selected-edge-endpoints-invalid");
      nodeIds.add(edge.from_node_id); nodeIds.add(edge.to_node_id);
    }
    for (const id of [...nodeIds].sort()) select(current.ontology_snapshot?.nodes, "node_id", id, "node");
    for (const id of [...(policy.definition_ids ?? [])].sort()) select(current.definition_catalog?.definitions, "definition_id", id, "definition");
    items.sort((a, b) => a.source_ref.localeCompare(b.source_ref));
    dependencies.sort((a, b) => canonicalJson(a).localeCompare(canonicalJson(b)));
    const bytes = Buffer.byteLength(canonicalJson(items));
    if (bytes > (policy.max_bytes ?? 32768)) return fail("objective-meanings", ["objective.meaning-budget-exceeded"]);
    const receipt = {schema_version: "are.objective-meaning-selection/v1", selected_dependencies: dependencies,
      selected_context_digest: digestValue(items), inline_bytes: bytes, selection_policy_digest: digestValue(policy), authority_effect: "none"};
    return freezeResult({ok: true, selected_context: items, receipt: {...receipt, selection_digest: digestValue(receipt)}, authority_effect: "none"});
  } catch (error) { return fail("objective-meanings", [error.message]); }
}
