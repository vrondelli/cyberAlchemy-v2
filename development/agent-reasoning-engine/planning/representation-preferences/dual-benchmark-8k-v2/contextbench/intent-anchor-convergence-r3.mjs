// Provider-free HEN-11 candidate state. It does not call a model, read gold data,
// execute repository tools, or grant live-dispatch authority.
import {createHash} from "node:crypto";

export const INTENT_ANCHOR_SCHEMA = "are.contextbench-intent-anchor-convergence/v1";
const HASH = /^[a-f0-9]{64}$/;
const STOP = new Set(["about", "after", "again", "also", "been", "before", "being", "between", "could", "does", "from", "have", "into", "only", "should", "that", "their", "there", "these", "they", "this", "those", "through", "when", "where", "which", "while", "with", "would"]);
const stable = (value) => JSON.stringify(value, (_, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item);
const sha256 = (value) => createHash("sha256").update(typeof value === "string" ? value : stable(value)).digest("hex");
const copy = (value) => JSON.parse(stable(value));
const fail = (code) => { const error = new Error(code); error.code = code; throw error; };
const text = (value) => typeof value === "string" && value.trim().length > 0;
const uint = (value) => Number.isSafeInteger(value) && value >= 0;
const normalize = (value) => value.toLowerCase().normalize("NFKC").replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");

function terms(value) {
  return normalize(value).split(" ").filter((term) => term.length > 2 && !STOP.has(term));
}

export function stripIssueTemplateNoise(problem_statement) {
  if (!text(problem_statement)) fail("intent-anchor.input-invalid");
  return problem_statement
    .replace(/<!--[\s\S]*?-->/g, "\n")
    .replace(/<img\b[^>]*>/gi, "\n")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "\n")
    .replace(/^\s*(?:fixes|closes|resolves)\s+#\d+\s*$/gim, "\n")
    .replace(/^\s*(?:#{1,6}\s*)?(?:description|expected behavior|actual behavior|steps to reproduce|reproduction steps|environment)\s*:?\s*$/gim, "\n")
    .replace(/^\s*###\s+(?:before submitting|checklist|pull request checklist)\b[\s\S]*$/im, "\n")
    .trim();
}

export function deriveIssueAnchors(problem_statement, {maximum_anchors = 4, issue_template_aware = false} = {}) {
  if (!text(problem_statement) || !Number.isSafeInteger(maximum_anchors) || maximum_anchors < 2 || maximum_anchors > 8) fail("intent-anchor.input-invalid");
  if (typeof issue_template_aware !== "boolean") fail("intent-anchor.input-invalid");
  const objective = issue_template_aware ? stripIssueTemplateNoise(problem_statement) : problem_statement;
  const fragments = objective.split(/(?:\r?\n+|(?<=[.!?;])\s+)/).map((item) => item.trim()).filter(Boolean);
  const candidates = fragments.map((fragment, source_index) => {
    const ordered = [...new Set(terms(fragment))].slice(0, 8);
    return ordered.length ? {source_index, terms: ordered, signature: ordered.join(" ")} : null;
  }).filter(Boolean);
  const distinct = [];
  const seen = new Set();
  for (const candidate of candidates) {
    if (seen.has(candidate.signature)) continue;
    seen.add(candidate.signature);
    distinct.push(candidate);
  }
  if (distinct.length < 2) {
    const all = [...new Set(terms(objective))];
    if (all.length < 2) fail("intent-anchor.insufficient-objective-signal");
    const midpoint = Math.ceil(all.length / 2);
    distinct.splice(0, distinct.length, {source_index: 0, terms: all.slice(0, midpoint), signature: all.slice(0, midpoint).join(" ")}, {source_index: 0, terms: all.slice(midpoint), signature: all.slice(midpoint).join(" ")});
  }
  return Object.freeze(distinct.slice(0, maximum_anchors).map((candidate, index) => Object.freeze({anchor_id: `anchor:${index + 1}:${sha256(candidate.signature).slice(0, 12)}`, ordinal: index + 1, source_index: candidate.source_index, terms: Object.freeze(candidate.terms), signature_sha256: sha256(candidate.signature)})));
}

function material(state) {
  const {state_digest: _digest, ...rest} = state;
  return rest;
}

function seal(state) {
  const value = copy(state);
  value.state_digest = sha256(material(value));
  return Object.freeze(value);
}

function assertState(state) {
  if (state?.schema_version !== INTENT_ANCHOR_SCHEMA || state?.authority_effect !== "none" || state?.state_digest !== sha256(material(state)) || !Array.isArray(state.anchors) || state.anchors.length < 2 || !Array.isArray(state.queries) || !Array.isArray(state.support) || !Array.isArray(state.confirmed_base_reads)) fail("intent-anchor.state-invalid");
}

export function createIntentAnchorState(problem_statement, options) {
  const anchors = deriveIssueAnchors(problem_statement, options);
  return seal({schema_version: INTENT_ANCHOR_SCHEMA, objective_sha256: sha256(problem_statement), anchors, queries: [], support: [], confirmed_base_reads: [], authority_effect: "none"});
}

export function selectAnchorForQuery(state, query) {
  assertState(state);
  if (!text(query)) fail("intent-anchor.query-invalid");
  const queryTerms = new Set(terms(query));
  const explored = new Set(state.queries.map((item) => item.anchor_id));
  return [...state.anchors].sort((left, right) => {
    const leftUnexplored = explored.has(left.anchor_id) ? 0 : 1;
    const rightUnexplored = explored.has(right.anchor_id) ? 0 : 1;
    if (leftUnexplored !== rightUnexplored) return rightUnexplored - leftUnexplored;
    const leftScore = left.terms.filter((term) => queryTerms.has(term)).length;
    const rightScore = right.terms.filter((term) => queryTerms.has(term)).length;
    return rightScore - leftScore || left.ordinal - right.ordinal;
  })[0].anchor_id;
}

export function admitRankQuery(state, {anchor_id, query} = {}) {
  assertState(state);
  const normalized_query = text(query) ? normalize(query) : "";
  if (!state.anchors.some((anchor) => anchor.anchor_id === anchor_id) || !normalized_query) return {accepted: false, reason: "query-or-anchor-invalid", state};
  const query_sha256 = sha256(normalized_query);
  if (state.queries.some((item) => item.query_sha256 === query_sha256)) return {accepted: false, reason: "duplicate-query", state};
  const explored = new Set(state.queries.map((item) => item.anchor_id));
  if (explored.has(anchor_id) && state.anchors.some((anchor) => !explored.has(anchor.anchor_id))) return {accepted: false, reason: "unexplored-anchor-required", state};
  const next = seal({...material(state), queries: [...state.queries, {anchor_id, query_sha256, normalized_query}]});
  return {accepted: true, reason: "accepted", query_sha256, state: next};
}

export function recordHintSupport(state, {anchor_id, query_sha256, path, start_line, end_line, content_sha256} = {}) {
  assertState(state);
  const query = state.queries.find((item) => item.anchor_id === anchor_id && item.query_sha256 === query_sha256);
  if (!query || !text(path) || path.startsWith("/") || path.split("/").includes("..") || !uint(start_line) || !uint(end_line) || end_line < start_line || !HASH.test(content_sha256 ?? "")) fail("intent-anchor.support-invalid");
  const observation = {anchor_id, query_sha256, path, start_line, end_line, content_sha256};
  const key = sha256(observation);
  const support = state.support.some((item) => item.support_sha256 === key) ? state.support : [...state.support, {...observation, support_sha256: key}];
  // A base range may have been confirmed before a later query supplies an
  // additional anchor for the same bytes. Preserve that verified read and
  // attach the new support instead of requiring a duplicate source read.
  const confirmed_base_reads = state.confirmed_base_reads.map(read =>
    read.path === path && read.content_sha256 === content_sha256 &&
    start_line <= read.start_line && end_line >= read.end_line
      ? {...read, support_sha256: [...new Set([...read.support_sha256, key])].sort()}
      : read);
  return seal({...material(state), support, confirmed_base_reads});
}

export function confirmBaseRead(state, {path, start_line, end_line, content_sha256, base_revision_confirmed} = {}) {
  assertState(state);
  const supporting = state.support.filter((item) => item.path === path && item.content_sha256 === content_sha256 && item.start_line <= start_line && item.end_line >= end_line);
  if (base_revision_confirmed !== true || !supporting.length || !uint(start_line) || !uint(end_line) || end_line < start_line) fail("intent-anchor.base-read-unsupported");
  const read = {read_id: sha256({path, start_line, end_line, content_sha256}), path, start_line, end_line, content_sha256, support_sha256: supporting.map((item) => item.support_sha256).sort()};
  const reads = state.confirmed_base_reads.some((item) => item.read_id === read.read_id) ? state.confirmed_base_reads : [...state.confirmed_base_reads, read];
  return seal({...material(state), confirmed_base_reads: reads});
}

export function convergenceReadiness(state, {substantive_read_gate = false} = {}) {
  assertState(state);
  if (typeof substantive_read_gate !== "boolean") fail("intent-anchor.readiness-option-invalid");
  const distinct_anchors = new Set(state.queries.map((item) => item.anchor_id)).size;
  const substantiveAnchor = substantive_read_gate ? state.anchors.find(anchor => anchor.source_index > 0) : null;
  const substantiveSupport = new Set(state.support.filter(item => item.anchor_id === substantiveAnchor?.anchor_id).map(item => item.support_sha256));
  const substantiveReads = substantiveAnchor ? state.confirmed_base_reads.filter(read => read.support_sha256.some(id => substantiveSupport.has(id))).length : 0;
  const ready = state.queries.length >= 2 && distinct_anchors >= 2 && state.confirmed_base_reads.length >= 1 && (!substantiveAnchor || substantiveReads >= 1);
  return Object.freeze({ready, distinct_queries: state.queries.length, distinct_anchors, supported_base_reads: state.confirmed_base_reads.length,
    ...(substantive_read_gate ? {required_substantive_anchor_id: substantiveAnchor?.anchor_id ?? null, substantive_base_reads: substantiveReads} : {}),
    reason: ready ? "ready" : substantiveAnchor && substantiveReads < 1 && state.confirmed_base_reads.length >= 1 ? "substantive-base-read-required" : "anchor-convergence-incomplete"});
}

export function selectTerminalReads(state, {maximum_reads = 8} = {}) {
  const readiness = convergenceReadiness(state);
  if (!readiness.ready) fail("intent-anchor.premature-finish");
  if (!Number.isSafeInteger(maximum_reads) || maximum_reads < 1 || maximum_reads > 32) fail("intent-anchor.maximum-reads-invalid");
  return Object.freeze([...state.confirmed_base_reads].sort((a, b) => a.path.localeCompare(b.path) || a.start_line - b.start_line || a.read_id.localeCompare(b.read_id)).slice(0, maximum_reads).map(Object.freeze));
}

export function verifyIntentAnchorState(state) {
  try { assertState(state); return Object.freeze({ok: true, reason_codes: [], authority_effect: "none"}); }
  catch (error) { return Object.freeze({ok: false, reason_codes: [error.code ?? "intent-anchor.state-invalid"], authority_effect: "none"}); }
}
