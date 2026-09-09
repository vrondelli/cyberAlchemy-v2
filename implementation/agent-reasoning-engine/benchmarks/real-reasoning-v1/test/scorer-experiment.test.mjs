import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import test from "node:test";

import {formatScorerExperimentSummary, loadCounterbalancedHoldout, runScorerExperiment} from "../src/scorer-experiment.mjs";
import {runScorerLoop} from "../src/scorer-loop.mjs";
import {formatPortfolioSummary, partitionPortfolioHoldout, runScorerPortfolio} from "../src/scorer-portfolio.mjs";
import {SCORER_OPTIMIZATION_STRATEGIES, SCORER_STRATEGIES} from "../src/scorer-strategies.mjs";
import {compileConceptResponseAutomaton, compileConceptResponseBundledRegex, compileConceptResponseDecisionProjection, compileConceptResponseRegex, compileConceptResponseSingleScan} from "../src/concept-scorer.mjs";
import {createResearchHypothesis} from "../../../packages/evolution-runtime/index.mjs";

const holdout = loadCounterbalancedHoldout(new URL("../corpus/literal-versus-intent-counterbalanced-v1.jsonl", import.meta.url));
const fixture = JSON.parse(readFileSync(new URL("../../../packages/evolution-runtime/fixtures/luna-lexical-scoring-hypothesis.json", import.meta.url), "utf8"));

test("registered counterbalanced holdout is stable and exactly identified", () => {
  assert.equal(holdout.dataset_id, "holdout:literal-versus-intent-counterbalanced-v1");
  assert.equal(holdout.dataset_revision, "v1");
  assert.equal(holdout.rows.length, 12);
  assert.equal(new Set(holdout.rows.map((row) => row.case_id)).size, 12);
});

test("concept-equivalence treatment reduces declared false negatives and records latency", () => {
  const result = runScorerExperiment({holdout, repetitions: 3, success_criteria: fixture.hypothesis.experiment_template.success_criteria});
  assert.equal(result.experiment_id, "research-experiment:33434e267b28ac0342193911ca145d9a3bbd6eba3b3b68c3468933bbf5306435");
  assert.equal(result.baseline_ref, "scorer:exact-required-term/v1");
  assert.equal(result.treatment_ref, "scorer:declared-concept-equivalence/candidate-v1");
  assert.equal(result.status, Object.values(result.checks).every(Boolean) ? "PASS" : "FAIL", JSON.stringify(result));
  assert.equal(result.checks.safety, true);
  assert.equal(result.checks.treatment_agreement, true);
  assert.ok(result.deltas.false_negative_reduction >= 0.25);
  assert.ok(result.deltas.false_positive_regression <= 0.01);
  assert.ok(Number.isFinite(result.deltas.p95_latency_regression_ratio));
  assert.equal(result.timing_method, "paired-alternating-warmup-then-p95");
  assert.equal(result.timing_order, "alternating");
  assert.deepEqual(result.timing_order_trace, ["baseline-first", "treatment-first", "baseline-first"]);
  assert.equal(result.timing_samples_per_repetition, 1000);
  assert.equal(result.baseline.timing_samples_ms.length, 3);
  assert.equal(result.treatment.timing_samples_ms.length, 3);
  assert.equal(result.deltas.latency_regression_ratio_ci.resamples, 2000);
  assert.ok(Number.isFinite(result.deltas.latency_regression_ratio_ci.lower));
  assert.ok(Number.isFinite(result.deltas.latency_regression_ratio_ci.upper));
  assert.ok(Number.isFinite(result.baseline.phase_timings_ms.prediction_ms));
  assert.ok(Number.isFinite(result.treatment.phase_timings_ms.prediction_ms));
  assert.match(formatScorerExperimentSummary(result), /status=(PASS|FAIL)/);
  assert.match(formatScorerExperimentSummary(result), /ci=\[/);
});

test("treatment output is deterministic across independent runs", () => {
  const left = runScorerExperiment({holdout, repetitions: 3, success_criteria: fixture.hypothesis.experiment_template.success_criteria});
  const right = runScorerExperiment({holdout, repetitions: 3, success_criteria: fixture.hypothesis.experiment_template.success_criteria});
  const stable = (result) => {
    const strip = (side) => ({...side, p95_latency_ms: 0, timing_samples_ms: [], phase_timings_ms: {compile_ms: 0, prediction_ms: 0, warmup_ms: 0, timed_ms: 0}});
    return {
      ...result,
      baseline: strip(result.baseline),
      treatment: strip(result.treatment),
      timing_order: [],
      timing_order_trace: [],
      deltas: {...result.deltas, p95_latency_regression_ratio: 0, latency_regression_ratio_samples: [], latency_regression_ratio_ci: {lower: 0, upper: 0, resamples: 0, seed: 0}},
    };
  };
  assert.deepEqual(stable(left), stable(right));
});

test("optimized treatment is a separate preserved hypothesis with v1 prediction parity", () => {
  const criteria = fixture.hypothesis.experiment_template.success_criteria;
  const baselineCandidate = runScorerExperiment({holdout, repetitions: 3, success_criteria: criteria});
  const optimizedCandidate = runScorerExperiment({
    holdout,
    repetitions: 3,
    success_criteria: criteria,
    treatment_ref: "scorer:declared-concept-equivalence/candidate-v2",
    experiment_id: "research-experiment:declared-concept-equivalence-v2-candidate",
  });
  assert.equal(optimizedCandidate.experiment_id, "research-experiment:declared-concept-equivalence-v2-candidate");
  assert.equal(optimizedCandidate.treatment_ref, "scorer:declared-concept-equivalence/candidate-v2");
  assert.equal(optimizedCandidate.treatment.agreement, baselineCandidate.treatment.agreement);
  assert.equal(optimizedCandidate.treatment.false_negative_rate, baselineCandidate.treatment.false_negative_rate);
  assert.equal(optimizedCandidate.treatment.false_positive_rate, baselineCandidate.treatment.false_positive_rate);
  assert.equal(optimizedCandidate.checks.safety, true);
});

test("fused v3 treatment preserves the same prediction contract under a new attempt identity", () => {
  const criteria = fixture.hypothesis.experiment_template.success_criteria;
  const v2 = runScorerExperiment({
    holdout,
    repetitions: 3,
    success_criteria: criteria,
    treatment_ref: "scorer:declared-concept-equivalence/candidate-v2",
    experiment_id: "research-experiment:declared-concept-equivalence-v2-candidate",
  });
  const v3 = runScorerExperiment({
    holdout,
    repetitions: 3,
    success_criteria: criteria,
    treatment_ref: "scorer:declared-concept-equivalence/candidate-v3",
    experiment_id: "research-experiment:declared-concept-equivalence-v3-candidate",
  });
  assert.equal(v3.experiment_id, "research-experiment:declared-concept-equivalence-v3-candidate");
  assert.equal(v3.treatment_ref, "scorer:declared-concept-equivalence/candidate-v3");
  assert.equal(v3.treatment.agreement, v2.treatment.agreement);
  assert.equal(v3.treatment.false_negative_rate, v2.treatment.false_negative_rate);
  assert.equal(v3.treatment.false_positive_rate, v2.treatment.false_positive_rate);
  assert.equal(v3.checks.safety, true);
});

test("v4 through v14 treatments preserve the v3 prediction contract", () => {
  const criteria = fixture.hypothesis.experiment_template.success_criteria;
  const v3 = runScorerExperiment({holdout, repetitions: 2, warmup_samples: 25, success_criteria: criteria, treatment_ref: "scorer:declared-concept-equivalence/candidate-v3", experiment_id: "research-experiment:declared-concept-equivalence-v3-contract"});
  for (const [index, treatment_ref] of ["scorer:declared-concept-equivalence/candidate-v4", "scorer:declared-concept-equivalence/candidate-v5", "scorer:declared-concept-equivalence/candidate-v6", "scorer:declared-concept-equivalence/candidate-v7", "scorer:declared-concept-equivalence/candidate-v8", "scorer:declared-concept-equivalence/candidate-v9", "scorer:declared-concept-equivalence/candidate-v10", "scorer:declared-concept-equivalence/candidate-v11", "scorer:declared-concept-equivalence/candidate-v12", "scorer:declared-concept-equivalence/candidate-v13", "scorer:declared-concept-equivalence/candidate-v14"].entries()) {
    const candidate = runScorerExperiment({holdout, repetitions: 2, warmup_samples: 25, success_criteria: criteria, treatment_ref, experiment_id: `research-experiment:declared-concept-equivalence-v${index + 4}-contract`});
    assert.equal(candidate.treatment.agreement, v3.treatment.agreement);
    assert.equal(candidate.treatment.false_negative_rate, v3.treatment.false_negative_rate);
    assert.equal(candidate.treatment.false_positive_rate, v3.treatment.false_positive_rate);
    assert.equal(candidate.checks.safety, true);
    assert.equal(candidate.warmup_samples, 25);
  }
});

test("regex treatment preserves v7 structured predictions for every registered row", () => {
  for (const row of holdout.rows) {
    const scenario = {...row.scenario, concept_markers: row.concept_markers ?? {}};
    assert.deepEqual(compileConceptResponseRegex(scenario)(row.response), compileConceptResponseSingleScan(scenario)(row.response), row.case_id);
  }
});

test("bundled-regex treatment preserves v7 structured predictions for every registered row", () => {
  for (const row of holdout.rows) {
    const scenario = {...row.scenario, concept_markers: row.concept_markers ?? {}};
    assert.deepEqual(compileConceptResponseBundledRegex(scenario)(row.response), compileConceptResponseSingleScan(scenario)(row.response), row.case_id);
  }
});

test("token-automaton treatment preserves v7 structured predictions for every registered row", () => {
  for (const row of holdout.rows) {
    const scenario = {...row.scenario, concept_markers: row.concept_markers ?? {}};
    assert.deepEqual(compileConceptResponseAutomaton(scenario)(row.response), compileConceptResponseSingleScan(scenario)(row.response), row.case_id);
  }
});

test("token automaton preserves overlapping and suffix marker evidence in declared order", () => {
  const scenario = {
    required_terms: ["intent", "context"],
    concept_markers: {
      intent: ["request context", "context"],
      context: ["context window", "request context window"],
    },
    prohibited_patterns: [],
  };
  const response = {answer: "The request context window remains stable.", next_question: null, authority_claims: []};
  assert.deepEqual(compileConceptResponseAutomaton(scenario)(response), compileConceptResponseSingleScan(scenario)(response));
});

test("optimization catalog records v13 as the next zig-zag hypothesis", () => {
  const strategy = SCORER_OPTIMIZATION_STRATEGIES.find(({strategy_id}) => strategy_id === "strategy:declared-equivalence-token-automaton-v13");
  assert.equal(strategy.strategy_id, "strategy:declared-equivalence-token-automaton-v13");
  assert.equal(strategy.treatment_ref, "scorer:declared-concept-equivalence/candidate-v13");
  assert.equal(strategy.implementation_pattern, "compiled-token-automaton");
});

test("decision-projection treatment preserves both verdict and full evidence", () => {
  for (const row of holdout.rows) {
    const scenario = {...row.scenario, concept_markers: row.concept_markers ?? {}};
    const compiled = compileConceptResponseDecisionProjection(scenario);
    const expected = compileConceptResponseSingleScan(scenario)(row.response);
    assert.equal(compiled.decide(row.response), expected.passed, `${row.case_id}: decision`);
    assert.deepEqual(compiled.projectEvidence(row.response), expected, `${row.case_id}: evidence`);
    assert.deepEqual(compiled(row.response), expected, `${row.case_id}: default contract`);
  }
});

test("v14 experiment labels and measures decision and evidence paths separately", () => {
  const result = runScorerExperiment({
    holdout,
    repetitions: 2,
    warmup_samples: 25,
    success_criteria: fixture.hypothesis.experiment_template.success_criteria,
    treatment_ref: "scorer:declared-concept-equivalence/candidate-v14",
    experiment_id: "research-experiment:declared-concept-equivalence-v14-contract",
  });
  assert.equal(result.baseline.latency_scope, "current-full-evidence");
  assert.equal(result.treatment.latency_scope, "decision-only");
  assert.equal(result.timing_method, "paired-alternating-decision-path-plus-full-evidence-p95");
  assert.equal(result.checks.full_evidence_projection_measured, true);
  assert.ok(Number.isFinite(result.treatment.full_evidence_p95_latency_ms));
  assert.ok(Number.isFinite(result.deltas.full_evidence_p95_latency_regression_ratio));
  assert.match(formatScorerExperimentSummary(result), /scope=decision-only/);
  assert.match(formatScorerExperimentSummary(result), /full_evidence_p95=/);
});

test("optimization catalog records v14 as the next zig-zag hypothesis", () => {
  const strategy = SCORER_OPTIMIZATION_STRATEGIES.at(-1);
  assert.equal(strategy.strategy_id, "strategy:declared-equivalence-decision-projection-v14");
  assert.equal(strategy.treatment_ref, "scorer:declared-concept-equivalence/candidate-v14");
  assert.equal(strategy.implementation_pattern, "fast-decision-lazy-evidence-projection");
});

test("bounded scorer loop stops at PASS and never exceeds fifteen attempts", () => {
  const seen = [];
  const result = runScorerLoop({
    holdout,
    maxAttempts: 15,
    runExperiment: ({experiment_id}) => {
      seen.push(experiment_id);
      return {status: seen.length === 3 ? "PASS" : "FAIL"};
    },
  });
  assert.equal(result.final_status, "PASS");
  assert.equal(result.stop_reason, "PASS");
  assert.equal(result.attempts_run, 3);
  assert.deepEqual(seen, [
    "research-experiment:declared-concept-equivalence-v3-candidate-attempt-01",
    "research-experiment:declared-concept-equivalence-v3-candidate-attempt-02",
    "research-experiment:declared-concept-equivalence-v3-candidate-attempt-03",
  ]);
  assert.throws(() => runScorerLoop({holdout, maxAttempts: 16, runExperiment: () => ({status: "FAIL"})}), /maxAttempts/);
});

test("failed loop attempts create an immutable successor hypothesis chain", () => {
  const root = createResearchHypothesis(fixture.hypothesis);
  const result = runScorerLoop({
    holdout,
    hypothesis: root,
    maxAttempts: 3,
    runExperiment: ({experiment_id}) => ({status: "FAIL", experiment_id}),
  });
  assert.equal(result.final_status, "FAIL");
  assert.equal(result.hypothesis_chain.length, 4);
  assert.equal(result.attempts.every((attempt) => typeof attempt.hypothesis_ref === "string"), true);
  assert.equal(result.attempts[0].hypothesis_ref, result.hypothesis_chain[1].record_id);
  assert.equal(result.attempts[1].hypothesis_ref, result.hypothesis_chain[2].record_id);
  assert.equal(result.attempts[2].hypothesis_ref, result.hypothesis_chain[3].record_id);
  assert.equal(result.hypothesis_chain[1].parent_hypothesis_ref, result.hypothesis_chain[0].record_id);
  assert.equal(result.hypothesis_chain[2].parent_hypothesis_ref, result.hypothesis_chain[1].record_id);
  assert.equal(result.hypothesis_chain[3].parent_hypothesis_ref, result.hypothesis_chain[2].record_id);
  assert.match(result.hypothesis_chain[1].hypothesis_key, /-STRATEGY-/);
  assert.equal(result.hypothesis_chain[2].supersedes_experiment_ref, result.attempts[0].experiment_id);
  assert.equal(result.hypothesis_chain[3].supersedes_experiment_ref, result.attempts[1].experiment_id);
});

test("strategy loop rotates through concrete implementation patterns", () => {
  const root = createResearchHypothesis(fixture.hypothesis);
  const treatmentRefs = [];
  const result = runScorerLoop({
    holdout,
    hypothesis: root,
    strategy_catalog: SCORER_STRATEGIES,
    maxAttempts: 3,
    runExperiment: ({experiment_id, treatment_ref}) => {
      treatmentRefs.push(treatment_ref);
      return {status: "FAIL", experiment_id};
    },
  });
  assert.deepEqual(treatmentRefs, SCORER_STRATEGIES.map((strategy) => strategy.treatment_ref));
  assert.deepEqual(result.attempts.map((attempt) => attempt.implementation_pattern), SCORER_STRATEGIES.map((strategy) => strategy.implementation_pattern));
  assert.deepEqual(result.hypothesis_chain.slice(1).map((hypothesis) => hypothesis.implementation_ref), SCORER_STRATEGIES.map((strategy) => strategy.implementation_ref));
});

test("gain trigger stops the loop at the first non-improving attempt", () => {
  const values = [5, 4, 4.5, 3];
  const result = runScorerLoop({
    holdout,
    maxAttempts: 15,
    gain_trigger: {metric: "deltas.p95_latency_regression_ratio", direction: "lower", minimum_delta: 0, max_no_gain_attempts: 1},
    runExperiment: ({experiment_id}) => {
      const value = values.shift();
      return {
        status: "FAIL",
        experiment_id,
        deltas: {p95_latency_regression_ratio: value},
        checks: {treatment_agreement: true, false_negative_reduction: true, false_positive_regression: true, safety: true},
      };
    },
  });
  assert.equal(result.attempts_run, 3);
  assert.equal(result.stop_reason, "no-gain");
  assert.equal(result.final_status, "FAIL");
  assert.deepEqual(result.attempts.map((attempt) => attempt.gain.status), ["baseline", "gain", "no-gain"]);
  assert.equal(result.gain_attempts, 1);
  assert.equal(result.no_gain_attempts, 1);
  assert.equal(result.best_attempt, 2);
  assert.equal(result.best_value, 4);
  assert.equal(values.length, 1, "the loop must not execute a trial after the gain gate stops it");
});

test("gain trigger fails closed when a protected quality check is lost", () => {
  const result = runScorerLoop({
    holdout,
    maxAttempts: 15,
    gain_trigger: {metric: "deltas.p95_latency_regression_ratio", direction: "lower", max_no_gain_attempts: 2},
    runExperiment: ({experiment_id}) => ({
      status: "FAIL",
      experiment_id,
      deltas: {p95_latency_regression_ratio: 5},
      checks: {treatment_agreement: false, false_negative_reduction: true, false_positive_regression: true, safety: true},
    }),
  });
  assert.equal(result.attempts_run, 1);
  assert.equal(result.attempts[0].gain.status, "blocked");
  assert.equal(result.stop_reason, "protected-check-failed");
});

test("portfolio loop screens every hypothesis and fully evaluates only the best survivors", () => {
  const root = createResearchHypothesis(fixture.hypothesis);
  const calls = [];
  const screeningValues = {
    "scorer:declared-concept-equivalence/candidate-v3": 3,
    "scorer:declared-concept-equivalence/candidate-v2": 2,
    "scorer:declared-concept-equivalence/candidate-v1": 8,
  };
  const fullValues = {
    "scorer:declared-concept-equivalence/candidate-v3": 1.5,
    "scorer:declared-concept-equivalence/candidate-v2": 1.25,
  };
  const result = runScorerPortfolio({
    holdout,
    hypothesis: root,
    strategy_catalog: SCORER_STRATEGIES,
    screening_repetitions: 1,
    full_repetitions: 3,
    max_survivors: 2,
    runExperiment: ({experiment_id, repetitions, warmup_samples, timing_order, treatment_ref}) => {
      calls.push({experiment_id, repetitions, warmup_samples, timing_order, treatment_ref});
      return {
        status: "FAIL",
        experiment_id,
        deltas: {p95_latency_regression_ratio: repetitions === 1 ? screeningValues[treatment_ref] : fullValues[treatment_ref]},
        checks: {treatment_agreement: true, false_negative_reduction: true, false_positive_regression: true, safety: true},
      };
    },
  });
  assert.equal(result.screening_count, 3);
  assert.equal(result.full_evaluation_count, 2);
  assert.equal(result.survivor_count, 2);
  assert.equal(result.hypothesis_chain.length, 4);
  assert.equal(result.stop_reason, "winner-selected");
  assert.equal(result.final_status, "PROVISIONAL");
  assert.equal(result.winner.strategy_id, "strategy:declared-equivalence-compiled-v2");
  assert.deepEqual(calls.map((call) => call.repetitions), [1, 1, 1, 3, 3, 3, 3, 3, 3]);
  assert.equal(result.warmup_samples, 250);
  assert.equal(result.timing_order, "alternating");
  assert.equal(calls.every((call) => call.warmup_samples === 250 && call.timing_order === "alternating"), true);
  assert.equal(result.branches.find((branch) => branch.treatment_ref.endsWith("candidate-v1")).full, null);
  assert.equal(result.hypothesis_chain.slice(1).every((branch) => branch.parent_hypothesis_ref === root.record_id), true);
});

test("portfolio loop retains unsafe hypotheses as evidence without promoting them", () => {
  const calls = [];
  const result = runScorerPortfolio({
    holdout,
    strategy_catalog: SCORER_STRATEGIES,
    max_survivors: 2,
    runExperiment: ({experiment_id, treatment_ref}) => {
      calls.push(experiment_id);
      return {
        status: "FAIL",
        experiment_id,
        deltas: {p95_latency_regression_ratio: experiment_id.includes("-screen-") ? treatment_ref.endsWith("candidate-v3") ? 1 : 2 : 1},
        checks: {treatment_agreement: !treatment_ref.endsWith("candidate-v3"), false_negative_reduction: true, false_positive_regression: true, safety: true},
      };
    },
  });
  assert.equal(result.full_evaluation_count, 2);
  assert.equal(result.branches.find((branch) => branch.treatment_ref.endsWith("candidate-v3")).status, "rejected");
  assert.equal(result.branches.find((branch) => branch.treatment_ref.endsWith("candidate-v3")).full, null);
  assert.equal(result.winner.strategy_id, "strategy:declared-equivalence-compiled-v2");
  assert.equal(result.stop_reason, "winner-selected");
  assert.equal(calls.filter((id) => id.includes("-full-")).length, 6);
});

test("portfolio loop can confirm the provisional winner on a separate holdout", () => {
  const calls = [];
  const result = runScorerPortfolio({
    holdout,
    confirmation_holdout: holdout,
    strategy_catalog: SCORER_STRATEGIES,
    max_survivors: 1,
    runExperiment: ({experiment_id}) => {
      calls.push(experiment_id);
      return {
        status: "FAIL",
        experiment_id,
        deltas: {p95_latency_regression_ratio: experiment_id.includes("screen") ? 2 : experiment_id.includes("confirm") ? 0.5 : 1},
        checks: {treatment_agreement: true, false_negative_reduction: true, false_positive_regression: true, safety: true},
      };
    },
  });
  assert.equal(result.winner.status, "confirmed-relative-best");
  assert.equal(result.winner.stage, "confirmation");
  assert.equal(result.confirmation_dataset_ref, holdout.dataset_id);
  assert.equal(calls.some((id) => id.includes("-confirm-")), true);
});

test("portfolio holdout partitions are deterministic and disjoint", () => {
  const even = partitionPortfolioHoldout(holdout, (row) => Number.parseInt(row.case_id.slice(-3), 10) % 2 === 0, "confirmation-even-v1");
  const odd = partitionPortfolioHoldout(holdout, (row) => Number.parseInt(row.case_id.slice(-3), 10) % 2 !== 0, "screening-odd-v1");
  assert.equal(even.rows.length + odd.rows.length, holdout.rows.length);
  assert.equal(new Set([...even.rows, ...odd.rows].map((row) => row.case_id)).size, holdout.rows.length);
  assert.notEqual(even.source_digest, odd.source_digest);
  assert.equal(even.dataset_revision, "v1:confirmation-even-v1");
});

test("portfolio summary exposes every branch result without replacing the full report", () => {
  const summary = formatPortfolioSummary({
    candidate_experiment_id: "research-experiment:test-summary",
    final_status: "FAIL",
    stop_reason: "no-full-survivor",
    screening_count: 2,
    full_evaluation_count: 1,
    winner: null,
    branches: [
      {strategy_id: "strategy:test-a", screening: {value: 1.25}, full: {value: 1.5}, status: "full-rejected", status_reason: "full-not-improved-over-screening"},
      {strategy_id: "strategy:test-b", screening: {value: null}, full: null, status: "rejected", status_reason: "screening-target-metric-missing"},
    ],
  });
  assert.match(summary, /status=FAIL stop=no-full-survivor/);
  assert.match(summary, /strategy:test-a: screen=1\.2500 full=1\.5000 status=full-rejected/);
  assert.match(summary, /strategy:test-b: screen=- full=- status=rejected/);
});
