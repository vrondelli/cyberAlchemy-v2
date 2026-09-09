import {CONCEPT_TREATMENT_INDEXED_ID, CONCEPT_TREATMENT_SHORT_CIRCUIT_ID, CONCEPT_TREATMENT_MARKER_INDEX_ID, CONCEPT_TREATMENT_SINGLE_SCAN_ID, CONCEPT_TREATMENT_SELECTIVE_SCAN_ID, CONCEPT_TREATMENT_LAZY_SCAN_ID, CONCEPT_TREATMENT_BOUNDED_FAST_ID, CONCEPT_TREATMENT_REGEX_ID, CONCEPT_TREATMENT_BUNDLED_REGEX_ID, CONCEPT_TREATMENT_AUTOMATON_ID, CONCEPT_TREATMENT_DECISION_PROJECTION_ID} from "./concept-scorer.mjs";

export const SCORER_STRATEGIES = Object.freeze([
  Object.freeze({
    strategy_id: "strategy:declared-equivalence-fused-v3",
    treatment_ref: "scorer:declared-concept-equivalence/candidate-v3",
    implementation_pattern: "fused-single-pass",
    implementation_ref: "benchmarks/real-reasoning-v1/src/concept-scorer.mjs#compileConceptResponseFused",
    statement: "A fused deterministic scorer pass can preserve declared concept-equivalence quality and safety while reducing scorer latency toward the registered ceiling.",
    mechanism: "Precompile declared markers and combine required-term, equivalence, prohibition, and authority checks into one response pass.",
  }),
  Object.freeze({
    strategy_id: "strategy:declared-equivalence-compiled-v2",
    treatment_ref: "scorer:declared-concept-equivalence/candidate-v2",
    implementation_pattern: "compiled-response-predicate",
    implementation_ref: "benchmarks/real-reasoning-v1/src/concept-scorer.mjs#compileConceptResponseFast",
    statement: "A compiled response predicate can preserve declared concept-equivalence quality and safety while reducing repeated scorer setup overhead.",
    mechanism: "Compile required-term metadata and marker phrases once per scenario, then reuse the predicate for every response.",
  }),
  Object.freeze({
    strategy_id: "strategy:declared-equivalence-overlay-v1",
    treatment_ref: "scorer:declared-concept-equivalence/candidate-v1",
    implementation_pattern: "baseline-overlay",
    implementation_ref: "benchmarks/real-reasoning-v1/src/concept-scorer.mjs#scoreConceptResponse",
    statement: "A declared marker overlay can preserve the baseline scorer contract while recovering concept-equivalent evidence.",
    mechanism: "Run the exact-term scorer and add only fixture-declared concept markers to missing required terms.",
  }),
]);

export const SCORER_OPTIMIZATION_STRATEGIES = Object.freeze([
  ...SCORER_STRATEGIES,
  Object.freeze({
    strategy_id: "strategy:declared-equivalence-indexed-v4",
    treatment_ref: CONCEPT_TREATMENT_INDEXED_ID,
    implementation_pattern: "indexed-stem-set",
    implementation_ref: "benchmarks/real-reasoning-v1/src/concept-scorer.mjs#compileConceptResponseIndexed",
    statement: "An indexed stem set can preserve declared concept-equivalence quality and safety while removing repeated per-term stem scans.",
    mechanism: "Tokenize each response once, build a stem index, and reuse it for all required-term checks.",
  }),
  Object.freeze({
    strategy_id: "strategy:declared-equivalence-short-circuit-v5",
    treatment_ref: CONCEPT_TREATMENT_SHORT_CIRCUIT_ID,
    implementation_pattern: "lexical-short-circuit",
    implementation_ref: "benchmarks/real-reasoning-v1/src/concept-scorer.mjs#compileConceptResponseShortCircuit",
    statement: "A lexical-hit short circuit can preserve the scorer contract while avoiding unnecessary marker scans.",
    mechanism: "Inspect declared marker phrases only when lexical token and stem checks do not already satisfy a required term.",
  }),
  Object.freeze({
    strategy_id: "strategy:declared-equivalence-marker-index-v6",
    treatment_ref: CONCEPT_TREATMENT_MARKER_INDEX_ID,
    implementation_pattern: "global-marker-index",
    implementation_ref: "benchmarks/real-reasoning-v1/src/concept-scorer.mjs#compileConceptResponseMarkerIndexed",
    statement: "A global marker index can preserve declared concept-equivalence quality and safety while avoiding repeated phrase searches for unrelated terms.",
    mechanism: "Index marker phrases by their first token and inspect only candidate positions in the normalized response.",
  }),
  Object.freeze({
    strategy_id: "strategy:declared-equivalence-single-scan-v7",
    treatment_ref: CONCEPT_TREATMENT_SINGLE_SCAN_ID,
    implementation_pattern: "single-response-scan",
    implementation_ref: "benchmarks/real-reasoning-v1/src/concept-scorer.mjs#compileConceptResponseSingleScan",
    statement: "A single response scan can preserve the scorer contract while consolidating lexical and marker detection.",
    mechanism: "Build lexical hit sets once, scan indexed marker candidates once, and reconstruct stable required-term evidence.",
  }),
  Object.freeze({
    strategy_id: "strategy:declared-equivalence-selective-scan-v8",
    treatment_ref: CONCEPT_TREATMENT_SELECTIVE_SCAN_ID,
    implementation_pattern: "lexical-gated-marker-scan",
    implementation_ref: "benchmarks/real-reasoning-v1/src/concept-scorer.mjs#compileConceptResponseSelectiveScan",
    statement: "A lexical-gated marker scan can preserve declared concept-equivalence quality and safety while avoiding marker work for already-satisfied responses.",
    mechanism: "Build lexical hits first, scan indexed markers only for unmet terms, and deduplicate marker evidence without per-term sets.",
  }),
  Object.freeze({
    strategy_id: "strategy:declared-equivalence-lazy-scan-v9",
    treatment_ref: CONCEPT_TREATMENT_LAZY_SCAN_ID,
    implementation_pattern: "lazy-lexical-gated-scan",
    implementation_ref: "benchmarks/real-reasoning-v1/src/concept-scorer.mjs#compileConceptResponseLazyScan",
    statement: "A lazy lexical-gated scan can preserve declared concept-equivalence quality and safety while avoiding stem and marker allocations for exact matches.",
    mechanism: "Check exact lexical tokens first, build stem evidence only for misses, then inspect indexed markers only for unresolved terms.",
  }),
  Object.freeze({
    strategy_id: "strategy:declared-equivalence-bounded-fast-v10",
    treatment_ref: CONCEPT_TREATMENT_BOUNDED_FAST_ID,
    implementation_pattern: "bounded-string-fast-path",
    implementation_ref: "benchmarks/real-reasoning-v1/src/concept-scorer.mjs#compileConceptResponseBoundedFast",
    statement: "A bounded lexical fast path can preserve declared concept-equivalence quality and safety while avoiding tokenization for exact matches.",
    mechanism: "Use boundary-aware string checks for exact terms, then defer tokenization, stems, and indexed markers until a miss requires them.",
  }),
  Object.freeze({
    strategy_id: "strategy:declared-equivalence-regex-v11",
    treatment_ref: CONCEPT_TREATMENT_REGEX_ID,
    implementation_pattern: "precompiled-boundary-regex",
    implementation_ref: "benchmarks/real-reasoning-v1/src/concept-scorer.mjs#compileConceptResponseRegex",
    statement: "Precompiled boundary-aware expressions can preserve declared concept-equivalence quality and safety while removing response tokenization overhead.",
    mechanism: "Compile exact, inflection, and marker phrase expressions once per scenario and evaluate them without response tokenization.",
  }),
  Object.freeze({
    strategy_id: "strategy:declared-equivalence-bundled-regex-v12",
    treatment_ref: CONCEPT_TREATMENT_BUNDLED_REGEX_ID,
    implementation_pattern: "bundled-marker-regex",
    implementation_ref: "benchmarks/real-reasoning-v1/src/concept-scorer.mjs#compileConceptResponseBundledRegex",
    statement: "A bundled marker expression can preserve declared concept-equivalence quality and safety while scanning each response once per required term.",
    mechanism: "Bundle normalized marker phrases into one global boundary-aware expression and retain response-order evidence.",
  }),
  Object.freeze({
    strategy_id: "strategy:declared-equivalence-token-automaton-v13",
    treatment_ref: CONCEPT_TREATMENT_AUTOMATON_ID,
    implementation_pattern: "compiled-token-automaton",
    implementation_ref: "benchmarks/real-reasoning-v1/src/concept-scorer.mjs#compileConceptResponseAutomaton",
    statement: "A compiled multi-pattern token automaton can preserve complete scorer evidence while reducing repeated marker matching work.",
    mechanism: "Compile marker phrases into a failure-linked token automaton, scan each normalized response once, and reconstruct evidence in declared order.",
  }),
  Object.freeze({
    strategy_id: "strategy:declared-equivalence-decision-projection-v14",
    treatment_ref: CONCEPT_TREATMENT_DECISION_PROJECTION_ID,
    implementation_pattern: "fast-decision-lazy-evidence-projection",
    implementation_ref: "benchmarks/real-reasoning-v1/src/concept-scorer.mjs#compileConceptResponseDecisionProjection",
    statement: "A dedicated decision path can answer the common pass/fail question quickly while preserving complete structured evidence as an explicit on-demand projection.",
    mechanism: "Precompile exact, stem, and marker indexes for early-exit decisions; retain the stable single-scan scorer for full evidence projection and measure both paths separately.",
  }),
]);

export function selectScorerStrategy(catalog, attemptIndex) {
  if (!Array.isArray(catalog) || catalog.length === 0) throw new TypeError("A non-empty scorer strategy catalog is required.");
  const strategy = catalog[(attemptIndex - 1) % catalog.length];
  if (!strategy || typeof strategy.strategy_id !== "string" || typeof strategy.treatment_ref !== "string" || typeof strategy.implementation_ref !== "string") throw new TypeError("Invalid scorer strategy declaration.");
  return strategy;
}
