import {createHash} from "node:crypto";

import {canonicalJson, canonicalizeJson, deepFreeze} from "../../intent-route-resolver/index.mjs";
import {compressHenHints, verifyCompressedHenHints} from "./hen-hint-compression-v1.mjs";

export const HEN_CANDIDATE_VIEW_VERSION = "are.hen-candidate-view-runtime/v1";
export const HEN_CANDIDATE_VIEW_SCHEMA = "are.hen-candidate-view/v1";

const HASH = /^[a-f0-9]{64}$/;
const COMMIT = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$/;
const freeze = (value) => deepFreeze(canonicalizeJson(value));
const digest = (value) => createHash("sha256").update(canonicalJson(value)).digest("hex");
const exactKeys = (value, keys) => value !== null && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === keys.length && Object.keys(value).every((key) => keys.includes(key));

function failure(reasonCodes) {
  return freeze({schema_version: "are.hen-candidate-view-result/v1", ok: false, reason_codes: [...new Set(reasonCodes)].sort(), authority_effect: "none"});
}

export function materializeHenCandidateView(input) {
  const reasons = [];
  if (!exactKeys(input, ["task_ref", "query_results"]) || !IDENTIFIER.test(input?.task_ref ?? "") || !Array.isArray(input?.query_results) || input.query_results.length < 1 || input.query_results.length > 128) return failure(["hen-view.input-invalid"]);
  const facets = new Set();
  const baseCommits = new Set();
  const indexDigests = new Set();
  const queryDigests = new Set();
  const records = [];
  let sourceOmittedHints = 0;
  for (const [queryIndex, query] of input.query_results.entries()) {
    if (!exactKeys(query, ["facet", "query_digest", "hints", "omitted_hints", "index_digest"])) { reasons.push(`hen-view.query-fields-invalid:${queryIndex}`); continue; }
    if (typeof query.facet !== "string" || !query.facet || query.facet !== query.facet.normalize("NFC") || Buffer.byteLength(query.facet, "utf8") > 128 || facets.has(query.facet)) reasons.push(`hen-view.facet-invalid:${queryIndex}`);
    facets.add(query.facet);
    if (!HASH.test(query.query_digest ?? "")) reasons.push(`hen-view.query-digest-invalid:${queryIndex}`); else queryDigests.add(query.query_digest);
    if (!HASH.test(query.index_digest ?? "")) reasons.push(`hen-view.index-digest-invalid:${queryIndex}`); else indexDigests.add(query.index_digest);
    if (!Number.isSafeInteger(query.omitted_hints) || query.omitted_hints < 0) reasons.push(`hen-view.omitted-hints-invalid:${queryIndex}`); else sourceOmittedHints += query.omitted_hints;
    if (!Array.isArray(query.hints) || query.hints.length > 10000) { reasons.push(`hen-view.hints-invalid:${queryIndex}`); continue; }
    for (const [hintIndex, hint] of query.hints.entries()) {
      if (!exactKeys(hint, ["base_commit", "content_sha256", "end_line", "path", "score_units", "start_line"])) { reasons.push(`hen-view.hint-fields-invalid:${queryIndex}:${hintIndex}`); continue; }
      if (!COMMIT.test(hint.base_commit ?? "")) reasons.push(`hen-view.base-commit-invalid:${queryIndex}:${hintIndex}`); else baseCommits.add(hint.base_commit);
      records.push({
        repository_relative_path: hint.path,
        start_line_inclusive: hint.start_line,
        end_line_inclusive: hint.end_line,
        content_sha256: hint.content_sha256,
        score_units: hint.score_units,
        facet: query.facet,
      });
    }
  }
  if (baseCommits.size !== 1) reasons.push("hen-view.base-commit-set-invalid");
  if (indexDigests.size !== 1) reasons.push("hen-view.index-digest-set-invalid");
  if (queryDigests.size !== input.query_results.length) reasons.push("hen-view.query-digest-set-invalid");
  if (reasons.length) return failure(reasons);
  const compressed = compressHenHints(records);
  if (!compressed.ok) return failure(compressed.reason_codes);
  const material = freeze({
    schema_version: HEN_CANDIDATE_VIEW_SCHEMA,
    candidate_ref: "candidate:H-EN-R2-compressed-v1",
    task_ref: input.task_ref,
    source: {
      base_commit: [...baseCommits][0],
      index_digest: [...indexDigests][0],
      query_digests: [...queryDigests].sort(),
      query_result_digest: digest(input.query_results),
    },
    accounting: {
      query_count: input.query_results.length,
      returned_hint_count: records.length,
      source_omitted_hint_count: sourceOmittedHints,
      compressed_hint_count: compressed.value.records.length,
      compressed_payload_bytes: compressed.payload_bytes,
      compression_payload_digest: compressed.payload_digest,
      provider_calls: 0,
      model_calls: 0,
    },
    hint_payload: compressed.value,
    claim_ceiling: "Provider-free candidate view and accounting only; no token qualification, delivered-evidence claim, native score, benchmark result, or scientific acceptance.",
    authority_effect: "none",
  });
  return freeze({schema_version: "are.hen-candidate-view-result/v1", ok: true, operation: "materialize-hen-candidate-view", value: {...material, view_digest: digest(material)}, authority_effect: "none"});
}

export function verifyHenCandidateView(value) {
  const reasons = [];
  if (!exactKeys(value, ["schema_version", "candidate_ref", "task_ref", "source", "accounting", "hint_payload", "claim_ceiling", "authority_effect", "view_digest"])) reasons.push("hen-view.fields-invalid");
  if (value?.schema_version !== HEN_CANDIDATE_VIEW_SCHEMA || value?.candidate_ref !== "candidate:H-EN-R2-compressed-v1" || !IDENTIFIER.test(value?.task_ref ?? "")) reasons.push("hen-view.identity-invalid");
  if (!exactKeys(value?.source, ["base_commit", "index_digest", "query_digests", "query_result_digest"]) || !COMMIT.test(value?.source?.base_commit ?? "") || !HASH.test(value?.source?.index_digest ?? "") || !HASH.test(value?.source?.query_result_digest ?? "") || !Array.isArray(value?.source?.query_digests) || value.source.query_digests.some((entry) => !HASH.test(entry)) || new Set(value?.source?.query_digests ?? []).size !== value?.source?.query_digests?.length || canonicalJson(value?.source?.query_digests ?? []) !== canonicalJson([...(value?.source?.query_digests ?? [])].sort())) reasons.push("hen-view.source-invalid");
  const checkedPayload = verifyCompressedHenHints(value?.hint_payload);
  if (!checkedPayload.ok) reasons.push(...checkedPayload.reason_codes);
  const accountingKeys = ["query_count", "returned_hint_count", "source_omitted_hint_count", "compressed_hint_count", "compressed_payload_bytes", "compression_payload_digest", "provider_calls", "model_calls"];
  if (!exactKeys(value?.accounting, accountingKeys) || !Number.isSafeInteger(value?.accounting?.query_count) || value.accounting.query_count < 1 || !Number.isSafeInteger(value?.accounting?.returned_hint_count) || value.accounting.returned_hint_count < 0 || !Number.isSafeInteger(value?.accounting?.source_omitted_hint_count) || value.accounting.source_omitted_hint_count < 0 || value?.accounting?.compressed_hint_count !== value?.hint_payload?.records?.length || value?.accounting?.compressed_payload_bytes !== checkedPayload.payload_bytes || value?.accounting?.compression_payload_digest !== checkedPayload.payload_digest || value?.accounting?.provider_calls !== 0 || value?.accounting?.model_calls !== 0 || value?.accounting?.query_count !== value?.source?.query_digests?.length) reasons.push("hen-view.accounting-invalid");
  if (value?.authority_effect !== "none") reasons.push("hen-view.authority-invalid");
  if (value && typeof value === "object") {
    const {view_digest: _viewDigest, ...material} = value;
    if (value.view_digest !== digest(material)) reasons.push("hen-view.digest-invalid");
  }
  return reasons.length ? failure(reasons) : freeze({schema_version: "are.hen-candidate-view-result/v1", ok: true, operation: "verify-hen-candidate-view", value, authority_effect: "none"});
}
