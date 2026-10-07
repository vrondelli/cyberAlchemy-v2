import {bindInvestigationEvidence} from "./bounded-archive-frontier-evidence-join-r1.mjs";
import {buildTerminalEvidence, EXPANDED} from "./terminal-evidence.mjs";
import {mapConfirmedTerminalReads} from "./intent-anchor-integration-r3.mjs";
import {convergenceReadiness} from "./intent-anchor-convergence-r3.mjs";
import {lateBindDeliveredBaseReads} from "./late-bind-delivered-base-r1.mjs";

export const sourceCandidate = read => typeof read?.path === "string" && (/(?:^|\/)go\.mod$/.test(read.path) || /\.(?:c|h|cc|hh|cpp|hpp|go|java|js|jsx|ts|tsx|rs|py)$/.test(read.path)) && !/(^|\/)(test|tests|fixtures)\//i.test(read.path) && !/(?:_test\.[^.]+|\.(?:test|spec)\.[^.]+)$/.test(read.path) && Number.isSafeInteger(read.start_line) && Number.isSafeInteger(read.end_line) && read.end_line - read.start_line >= 7;

export async function buildIntentAnchorTerminalEvidence({state, origin_bindings, branch_inputs, neighborhood_read_ids = [], source_shortlist = false, allow_distinctive_source = false, late_bind_delivered_base = false, base_commit = null, ...options}) {
  const joined = bindInvestigationEvidence(branch_inputs);
  if (!Array.isArray(neighborhood_read_ids) || neighborhood_read_ids.length > 6 || new Set(neighborhood_read_ids).size !== neighborhood_read_ids.length) throw new Error("intent-anchor-terminal.neighborhood-read-ids");
  if (typeof source_shortlist !== "boolean") throw new Error("intent-anchor-terminal.source-shortlist-option");
  if (typeof allow_distinctive_source !== "boolean" || (allow_distinctive_source && !source_shortlist)) throw new Error("intent-anchor-terminal.distinctive-option");
  if (typeof late_bind_delivered_base !== "boolean") throw new Error("intent-anchor-terminal.late-binding-option");
  const verifiedDistinctive = neighborhood_read_ids.filter(id => joined.read_observations.some(read => read.id === id && sourceCandidate(read)));
  const fallback = allow_distinctive_source && !convergenceReadiness(state).ready && verifiedDistinctive.length > 0;
  let effective = {state, origin_bindings}, late_binding = null;
  let mapped;
  if (!fallback) {
    try {
      mapped = mapConfirmedTerminalReads(state, joined.read_observations, origin_bindings,
        {maximum_reads: neighborhood_read_ids.length ? 2 : 8, omit_undelivered: true});
    } catch (error) {
      if (!late_bind_delivered_base || error.message !== "intent-anchor-integration.no-delivered-confirmed-read") throw error;
      effective = lateBindDeliveredBaseReads({state, origin_bindings,
        native_reads: joined.read_observations, repoRoot: options.repoRoot, base_commit});
      late_binding = effective.counts;
      mapped = mapConfirmedTerminalReads(effective.state, joined.read_observations,
        effective.origin_bindings, {maximum_reads: neighborhood_read_ids.length ? 2 : 8,
          omit_undelivered: true});
    }
  }
  const convergence = fallback
    ? {status: "distinctive-source-ready", selected_native_read_ids: verifiedDistinctive, mappings: [], authority_effect: "none"}
    : mapped;
  const selected = new Set(convergence.selected_native_read_ids);
  const confirmed = new Map(joined.read_observations.map(read => [read.id, read]));
  if (source_shortlist) {
    const sourceReads = joined.read_observations.filter(sourceCandidate);
    const shortlist = sourceReads.length ? sourceReads : joined.read_observations.filter(read => selected.has(read.id));
    const packet = await buildTerminalEvidence({...options, version: EXPANDED, reads: shortlist, preferred_read_ids: [], max_handles: Math.min(8, shortlist.length)});
    const offered = packet.private?.bindings ?? [];
    if (packet.status !== "ready" || offered.length < 1 || offered.some(binding => !shortlist.some(read => read.id === binding.read_id))) throw new Error("intent-anchor-terminal.source-shortlist-not-bound");
    return {joined, packet, convergence, effective_state: effective.state, effective_origin_bindings: effective.origin_bindings, late_binding, neighborhood: {requested_read_ids: [], delivered_read_ids: [], omitted_unconfirmed_read_ids: []}, source_shortlist: {eligible_read_ids: sourceReads.map(read => read.id), offered_read_ids: offered.map(binding => binding.read_id), policy: "delivered source ranges >=8 lines; exclude test/fixture paths; native task-overlap and path-diversity rank"}};
  }
  const ranges = new Set([...selected].map(id => { const read = confirmed.get(id); return JSON.stringify([read.path, read.start_line, read.end_line, read.source_sha256]); }));
  const delivered_neighborhood_read_ids = [];
  for (const id of neighborhood_read_ids) {
    const read = confirmed.get(id);
    if (!read) continue;
    const range = JSON.stringify([read.path, read.start_line, read.end_line, read.source_sha256]);
    if (ranges.has(range) || selected.size >= 8) continue;
    ranges.add(range); selected.add(id); delivered_neighborhood_read_ids.push(id);
  }
  const packet = await buildTerminalEvidence({...options, version: EXPANDED, reads: joined.read_observations, preferred_read_ids: [...selected], max_handles: selected.size});
  const exposed = packet.private?.bindings?.map((binding) => binding.read_id) ?? [];
  if (packet.status !== "ready" || exposed.length !== selected.size || exposed.some((id) => !selected.has(id))) throw new Error("intent-anchor-terminal.selected-evidence-not-exact");
  return {joined, packet, convergence, effective_state: effective.state, effective_origin_bindings: effective.origin_bindings, late_binding, neighborhood: {requested_read_ids: neighborhood_read_ids, delivered_read_ids: delivered_neighborhood_read_ids, omitted_unconfirmed_read_ids: neighborhood_read_ids.filter(id => !confirmed.has(id))}};
}
