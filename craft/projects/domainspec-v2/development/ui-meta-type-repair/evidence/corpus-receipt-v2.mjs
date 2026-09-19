import { buildEnvelope, validateEnvelope } from "../contracts/canonical-json-v1.mjs";
import { createCorpusFactReceipt } from "./corpus-receipt.mjs";

const RECORD_ID = /^record:sha256:[a-f0-9]{64}$/;
const PROHIBITED = [
  "not-observed-does-not-mean-absent",
  "bounded-observed-absence-is-not-universal-absence",
  "literal-source-fact-is-not-candidate-identity",
  "corpus-receipt-is-not-independent-replication",
];

export const LITERAL_TOKEN_EXTRACTOR_SPEC = "literal-token-extractor:v1:utf8-exact-non-overlapping-substring-count";
export const LITERAL_TOKEN_EXTRACTOR_DIGEST = "sha256:c432f69fb50bdb5076892c3a8c023ae7d4d3b007dc9558e5648b63a4fa16f599";

export function createCorpusFactReceiptV2(spec, { sourceText, actualRevision, boundedSearchReceipt = null }) {
  const baseline = createCorpusFactReceipt(spec, { sourceText, actualRevision });
  const eligibleForBoundedAbsence = baseline.semantic.observation_status === "not-observed"
    && baseline.semantic.omissions.length === 1
    && baseline.semantic.omissions[0].code === "excerpt-missing";

  let observationStatus = baseline.semantic.observation_status;
  let boundedSearchReceiptId = null;
  let omissions = baseline.semantic.omissions;
  let literalObservations = baseline.semantic.literal_observations;

  if (eligibleForBoundedAbsence && boundedSearchReceipt !== null) {
    validateBoundedSearchForSpec(boundedSearchReceipt, spec);
    observationStatus = "observed-absent";
    boundedSearchReceiptId = boundedSearchReceipt.record_id;
    omissions = [];
    literalObservations = spec.literal_facts.map((fact) => ({
      fact_id: fact.fact_id,
      predicate: "token-present",
      token: fact.token,
      value: sourceText.includes(fact.token),
    }));
  }

  const semantic = {
    schema_version: "ui-repair.corpus-receipt.v2",
    corpus_id: baseline.semantic.corpus_id,
    implementation_style: baseline.semantic.implementation_style,
    source: baseline.semantic.source,
    observed_source: baseline.semantic.observed_source,
    selector: baseline.semantic.selector,
    observation_status: observationStatus,
    bounded_search_receipt_id: boundedSearchReceiptId,
    literal_observations: literalObservations,
    omissions,
    extractor: { id: "line-range-token-extractor", version: "2.0.0" },
    prohibited_inferences: PROHIBITED,
  };
  const inputHandles = [baseline.record_id, ...(boundedSearchReceiptId ? [boundedSearchReceiptId] : [])].sort();
  const envelope = buildEnvelope({
    contractId: "ui-repair.corpus-receipt",
    contractVersion: "2.0.0",
    semanticFields: Object.keys(semantic),
    record: semantic,
    status: observationStatus === "not-observed" ? "defer" : "complete",
    predecessorGenerationId: baseline.generation_id,
    inputHandles,
    createdAt: spec.observed_at,
  });
  return { ...envelope, semantic };
}

export function validateBoundedSearchForSpec(receipt, spec) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) throw new TypeError("bounded search receipt is required");
  if (receipt.contract_id !== "ui-repair.bounded-search-receipt" || receipt.contract_version !== "1.0.0") {
    throw new TypeError("invalid bounded search contract");
  }
  if (!RECORD_ID.test(receipt.record_id ?? "")) throw new TypeError("invalid bounded search record handle");
  validateEnvelope(receipt, Object.keys(receipt.semantic ?? {}));
  const semantic = receipt.semantic;
  if (semantic.observation_status !== "observed-absent" || !semantic.completeness?.complete || semantic.completeness.match_count !== 0 || semantic.failures?.length !== 0) {
    throw new TypeError("bounded search does not prove complete zero-match absence");
  }
  const source = semantic.sources.find((candidate) => candidate.repository === spec.source.repository && candidate.path === spec.source.path);
  if (!source
    || source.expected_revision !== spec.source.revision
    || source.observed_revision !== spec.source.revision
    || source.expected_file_digest !== spec.source.file_digest
    || source.observed_file_digest !== spec.source.file_digest) {
    throw new TypeError("bounded search source does not align with the pinned corpus source");
  }
  const selector = semantic.selectors.find((candidate) => candidate.source_id === source.source_id && candidate.locator === `literal-token:${spec.selector.anchor}`);
  const outcome = selector && semantic.outcomes.find((candidate) => candidate.selector_id === selector.selector_id && candidate.source_id === source.source_id);
  if (!selector || !outcome || outcome.status !== "no-match" || outcome.match_count !== 0) {
    throw new TypeError("bounded search selector does not align with the pinned corpus selector");
  }
  return true;
}
