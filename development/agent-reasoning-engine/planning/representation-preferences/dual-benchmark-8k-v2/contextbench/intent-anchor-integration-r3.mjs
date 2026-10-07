// HEN-11 integration guards between R3 convergence state and native receipts.
import {admitRankQuery, selectAnchorForQuery, selectTerminalReads, verifyIntentAnchorState} from "./intent-anchor-convergence-r3.mjs";

const HASH = /^[a-f0-9]{64}$/;
const fail = (code) => { const error = new Error(code); error.code = code; throw error; };
const normalize = (value) => String(value ?? "").toLowerCase().normalize("NFKC").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");

export function admitMappedRankQuery(state, query) {
  if (!verifyIntentAnchorState(state).ok || !normalize(query)) fail("intent-anchor-integration.query-invalid");
  const anchor_id = selectAnchorForQuery(state, query);
  const anchor = state.anchors.find((item) => item.anchor_id === anchor_id);
  const queryTerms = new Set(normalize(query).split(" ").filter(Boolean));
  if (!anchor.terms.some((term) => queryTerms.has(term))) return {accepted: false, reason: "anchor-term-overlap-required", anchor_id, state};
  return {...admitRankQuery(state, {anchor_id, query}), anchor_id};
}

export function bindConfirmedBaseRead(state, {convergence_read_id, native_read_id, source_revision, path, start_line, end_line, source_sha256} = {}) {
  if (!verifyIntentAnchorState(state).ok || !HASH.test(native_read_id ?? "") || source_revision !== "base") fail("intent-anchor-integration.base-origin-invalid");
  const confirmed = state.confirmed_base_reads.find((item) => item.read_id === convergence_read_id);
  if (!confirmed || confirmed.path !== path || confirmed.start_line !== start_line || confirmed.end_line !== end_line || confirmed.content_sha256 !== source_sha256) fail("intent-anchor-integration.base-origin-binding-invalid");
  return Object.freeze({convergence_read_id, native_read_id, source_revision, path, start_line, end_line, source_sha256});
}

export function mapConfirmedTerminalReads(state, nativeReads, bindings, {maximum_reads = 8, omit_undelivered = false} = {}) {
  if (!Array.isArray(nativeReads) || !Array.isArray(bindings)) fail("intent-anchor-integration.native-reads-invalid");
  if (typeof omit_undelivered !== "boolean" || !Number.isSafeInteger(maximum_reads) || maximum_reads < 1 || maximum_reads > 32) fail("intent-anchor-integration.options-invalid");
  const selected = selectTerminalReads(state, {maximum_reads: omit_undelivered ? 32 : maximum_reads});
  const ids = new Set(), mapped = [];
  for (const confirmed of selected) {
    const origins = bindings.filter((binding) => binding?.convergence_read_id === confirmed.read_id);
    if (origins.length !== 1) fail("intent-anchor-integration.native-read-binding-invalid");
    const origin = bindConfirmedBaseRead(state, origins[0]);
    const matches = nativeReads.filter((native) => native?.id === origin.native_read_id && native.path === origin.path && native.start_line === origin.start_line && native.end_line === origin.end_line && native.source_sha256 === origin.source_sha256);
    if (omit_undelivered && matches.length === 0) continue;
    if (matches.length !== 1 || ids.has(origin.native_read_id)) fail("intent-anchor-integration.native-read-binding-invalid");
    ids.add(origin.native_read_id);
    mapped.push(Object.freeze({native_read_id: origin.native_read_id, path: confirmed.path, start_line: confirmed.start_line, end_line: confirmed.end_line, source_sha256: confirmed.content_sha256, convergence_read_id: confirmed.read_id}));
    if (mapped.length >= maximum_reads) break;
  }
  if (omit_undelivered && mapped.length === 0) fail("intent-anchor-integration.no-delivered-confirmed-read");
  return Object.freeze({status: "ready", selected_native_read_ids: Object.freeze(mapped.map((item) => item.native_read_id)), mappings: Object.freeze(mapped), authority_effect: "none"});
}
