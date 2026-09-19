import { buildEnvelope } from "../contracts/canonical-json-v1.mjs";

const DIGEST = /^sha256:[a-f0-9]{64}$/;
const OUTCOME_STATUSES = new Set(["match", "no-match", "selector-moved", "error"]);
const RUN_STATUSES = new Set(["ok", "error", "not-run"]);
const PROHIBITED = [
  "bounded-observed-absence-is-not-universal-absence",
  "observed-absent-is-not-candidate-identity",
  "not-observed-does-not-mean-absent",
  "bounded-search-receipt-is-not-portability-or-replication",
];

export function createBoundedSearchReceipt(input) {
  assertPlainObject(input, "input");
  requireString(input.search_id, "search_id");
  if (typeof input.universe_complete !== "boolean") throw new TypeError("universe_complete must be boolean");

  const extractor = normalizeExtractor(input.extractor);
  const sources = normalizeUnique(input.sources, "sources", "source_id", normalizeSource);
  const selectors = normalizeUnique(input.selectors, "selectors", "selector_id", normalizeSelector);
  const outcomes = normalizeUnique(input.outcomes, "outcomes", "selector_id", normalizeOutcome);
  if (sources.length === 0) throw new TypeError("sources must declare a non-empty finite universe");
  if (selectors.length === 0) throw new TypeError("selectors must declare a non-empty finite universe");

  const failures = [];
  const sourceById = new Map(sources.map((source) => [source.source_id, source]));
  const selectorById = new Map(selectors.map((selector) => [selector.selector_id, selector]));
  const outcomeById = new Map(outcomes.map((outcome) => [outcome.selector_id, outcome]));

  if (!input.universe_complete) addFailure(failures, "universe-incomplete", "the declared source universe is not marked complete");
  if (extractor.observed_digest !== extractor.expected_digest) {
    addFailure(failures, "extractor-digest-mismatch", `expected ${extractor.expected_digest}; observed ${extractor.observed_digest ?? "not-run"}`);
  }

  for (const source of sources) {
    if (!source.visited) addFailure(failures, "source-unvisited", "declared source was not visited", source.source_id);
    if (source.observed_revision !== source.expected_revision) {
      addFailure(failures, "revision-mismatch", `expected ${source.expected_revision}; observed ${source.observed_revision ?? "not-run"}`, source.source_id);
    }
    if (source.observed_file_digest !== source.expected_file_digest) {
      addFailure(failures, "source-digest-mismatch", `expected ${source.expected_file_digest}; observed ${source.observed_file_digest ?? "not-run"}`, source.source_id);
    }
    if (source.parse_status !== "ok") addFailure(failures, "parse-error", `parse status is ${source.parse_status}`, source.source_id);
    if (source.extraction_status !== "ok") addFailure(failures, "extraction-error", `extraction status is ${source.extraction_status}`, source.source_id);
  }

  for (const selector of selectors) {
    if (!sourceById.has(selector.source_id)) {
      addFailure(failures, "selector-source-mismatch", "declared selector references an undeclared source", selector.source_id, selector.selector_id);
    }
    const outcome = outcomeById.get(selector.selector_id);
    if (!outcome) {
      addFailure(failures, "selector-result-missing", "declared selector has no outcome", selector.source_id, selector.selector_id);
      continue;
    }
    if (outcome.source_id !== selector.source_id) {
      addFailure(failures, "selector-source-mismatch", `expected ${selector.source_id}; observed ${outcome.source_id}`, selector.source_id, selector.selector_id);
    }
    if (outcome.status === "selector-moved") addFailure(failures, "selector-moved", "selector moved from its pinned locator", selector.source_id, selector.selector_id);
    if (outcome.status === "error") addFailure(failures, "selector-error", "selector evaluation returned an error", selector.source_id, selector.selector_id);
  }

  for (const outcome of outcomes) {
    if (!selectorById.has(outcome.selector_id)) {
      addFailure(failures, "unexpected-selector", "outcome does not correspond to a declared selector", outcome.source_id, outcome.selector_id);
    }
  }

  failures.sort(compareFailures);
  const evaluatedSelectorCount = selectors.filter((selector) => {
    const outcome = outcomeById.get(selector.selector_id);
    return outcome && outcome.source_id === selector.source_id && (outcome.status === "match" || outcome.status === "no-match");
  }).length;
  const complete = failures.length === 0
    && input.universe_complete
    && sources.every((source) => source.visited)
    && outcomes.length === selectors.length
    && evaluatedSelectorCount === selectors.length;
  const matchCount = complete ? outcomes.reduce((sum, outcome) => sum + outcome.match_count, 0) : null;
  const observationStatus = complete ? (matchCount === 0 ? "observed-absent" : "observed") : "not-observed";

  const semantic = {
    schema_version: "ui-repair.bounded-search-receipt.v1",
    search_id: input.search_id,
    universe_complete: input.universe_complete,
    extractor,
    sources,
    selectors,
    outcomes,
    completeness: {
      complete,
      declared_source_count: sources.length,
      visited_source_count: sources.filter((source) => source.visited).length,
      declared_selector_count: selectors.length,
      evaluated_selector_count: evaluatedSelectorCount,
      error_count: failures.length,
      match_count: matchCount,
    },
    observation_status: observationStatus,
    failures,
    prohibited_inferences: PROHIBITED,
  };
  const inputHandles = [
    ...(extractor.observed_digest ? [`extractor:${extractor.observed_digest}`] : []),
    ...sources.flatMap((source) => [
      ...(source.observed_file_digest ? [`source:${source.source_id}:${source.observed_file_digest}`] : []),
      ...(source.observed_revision ? [`revision:${source.source_id}:${source.observed_revision}`] : []),
    ]),
  ].sort();
  const envelope = buildEnvelope({
    contractId: "ui-repair.bounded-search-receipt",
    contractVersion: "1.0.0",
    semanticFields: Object.keys(semantic),
    record: semantic,
    status: complete ? "complete" : "defer",
    inputHandles,
    createdAt: input.observed_at,
  });
  return { ...envelope, semantic };
}

function normalizeExtractor(value) {
  assertPlainObject(value, "extractor");
  requireString(value.id, "extractor.id");
  requireString(value.version, "extractor.version");
  requireDigest(value.expected_digest, "extractor.expected_digest");
  requireNullableDigest(value.observed_digest, "extractor.observed_digest");
  return {
    id: value.id,
    version: value.version,
    expected_digest: value.expected_digest,
    observed_digest: value.observed_digest,
  };
}

function normalizeSource(value, index) {
  assertPlainObject(value, `sources[${index}]`);
  for (const field of ["source_id", "repository", "path", "expected_revision"]) requireString(value[field], `sources[${index}].${field}`);
  requireNullableString(value.observed_revision, `sources[${index}].observed_revision`);
  requireDigest(value.expected_file_digest, `sources[${index}].expected_file_digest`);
  requireNullableDigest(value.observed_file_digest, `sources[${index}].observed_file_digest`);
  if (typeof value.visited !== "boolean") throw new TypeError(`sources[${index}].visited must be boolean`);
  if (!RUN_STATUSES.has(value.parse_status)) throw new TypeError(`sources[${index}].parse_status is invalid`);
  if (!RUN_STATUSES.has(value.extraction_status)) throw new TypeError(`sources[${index}].extraction_status is invalid`);
  return {
    source_id: value.source_id,
    repository: value.repository,
    path: value.path,
    expected_revision: value.expected_revision,
    observed_revision: value.observed_revision,
    expected_file_digest: value.expected_file_digest,
    observed_file_digest: value.observed_file_digest,
    visited: value.visited,
    parse_status: value.parse_status,
    extraction_status: value.extraction_status,
  };
}

function normalizeSelector(value, index) {
  assertPlainObject(value, `selectors[${index}]`);
  for (const field of ["selector_id", "source_id", "locator"]) requireString(value[field], `selectors[${index}].${field}`);
  return { selector_id: value.selector_id, source_id: value.source_id, locator: value.locator };
}

function normalizeOutcome(value, index) {
  assertPlainObject(value, `outcomes[${index}]`);
  requireString(value.selector_id, `outcomes[${index}].selector_id`);
  requireString(value.source_id, `outcomes[${index}].source_id`);
  if (!OUTCOME_STATUSES.has(value.status)) throw new TypeError(`outcomes[${index}].status is invalid`);
  if (!Number.isSafeInteger(value.match_count) || value.match_count < 0) throw new TypeError(`outcomes[${index}].match_count is invalid`);
  if (value.status === "match" && value.match_count === 0) throw new TypeError(`outcomes[${index}].match_count must be positive for match`);
  if (value.status !== "match" && value.match_count !== 0) throw new TypeError(`outcomes[${index}].match_count must be zero unless status is match`);
  return { selector_id: value.selector_id, source_id: value.source_id, status: value.status, match_count: value.match_count };
}

function normalizeUnique(values, label, key, normalize) {
  if (!Array.isArray(values)) throw new TypeError(`${label} must be an array`);
  const normalized = values.map(normalize);
  const seen = new Set();
  for (const value of normalized) {
    if (seen.has(value[key])) throw new TypeError(`${label} contains duplicate ${key}: ${value[key]}`);
    seen.add(value[key]);
  }
  return normalized.sort((left, right) => left[key].localeCompare(right[key]));
}

function addFailure(failures, code, detail, sourceId = null, selectorId = null) {
  failures.push({ code, detail, source_id: sourceId, selector_id: selectorId });
}

function compareFailures(left, right) {
  return [left.code, left.source_id ?? "", left.selector_id ?? "", left.detail]
    .join("\0")
    .localeCompare([right.code, right.source_id ?? "", right.selector_id ?? "", right.detail].join("\0"));
}

function assertPlainObject(value, label) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${label} must be a plain object`);
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${label} must be a plain object`);
}

function requireString(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new TypeError(`${label} must be a non-empty string`);
}

function requireNullableString(value, label) {
  if (value !== null) requireString(value, label);
}

function requireDigest(value, label) {
  requireString(value, label);
  if (!DIGEST.test(value)) throw new TypeError(`${label} has invalid digest format`);
}

function requireNullableDigest(value, label) {
  if (value !== null) requireDigest(value, label);
}
