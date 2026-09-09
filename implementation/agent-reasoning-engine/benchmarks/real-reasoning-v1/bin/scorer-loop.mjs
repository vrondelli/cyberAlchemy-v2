#!/usr/bin/env node
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";

import {loadLoopHoldout, runScorerLoop} from "../src/scorer-loop.mjs";
import {createResearchHypothesis} from "../../../packages/evolution-runtime/index.mjs";
import {SCORER_STRATEGIES} from "../src/scorer-strategies.mjs";

const args = process.argv.slice(2);
function flag(name, fallback) {
  const position = args.indexOf(name);
  return position >= 0 && args[position + 1] && !args[position + 1].startsWith("--") ? args[position + 1] : fallback;
}
if (args.includes("--help")) {
  process.stdout.write("Usage: scorer-loop.mjs [--holdout FILE] [--fixture FILE] [--treatment REF] [--experiment-id ID] [--repetitions N] [--max-attempts N] [--gain] [--max-no-gain-attempts N] [--output FILE]\n");
  process.exit(0);
}
const holdoutPath = flag("--holdout", "corpus/literal-versus-intent-counterbalanced-v1.jsonl");
const fixturePath = flag("--fixture", "../../packages/evolution-runtime/fixtures/luna-lexical-scoring-hypothesis.json");
const repetitions = Number(flag("--repetitions", 3));
const maxAttempts = Number(flag("--max-attempts", 15));
const requestedTreatmentRef = flag("--treatment", null);
const treatmentRef = requestedTreatmentRef ?? SCORER_STRATEGIES[0].treatment_ref;
const experimentId = flag("--experiment-id", "research-experiment:declared-concept-equivalence-v3-candidate");
const outputPath = flag("--output", null);
const gainTrigger = args.includes("--gain") ? {
  metric: "deltas.p95_latency_regression_ratio",
  direction: "lower",
  minimum_delta: 0,
  max_no_gain_attempts: Number(flag("--max-no-gain-attempts", 1)),
} : null;
const fixture = JSON.parse(readFileSync(resolve(fixturePath), "utf8"));
const result = runScorerLoop({holdout: loadLoopHoldout(resolve(holdoutPath)), hypothesis: createResearchHypothesis(fixture.hypothesis), strategy_catalog: requestedTreatmentRef === null ? SCORER_STRATEGIES : null, repetitions, maxAttempts, treatment_ref: treatmentRef, experiment_id: experimentId, success_criteria: fixture.hypothesis.experiment_template.success_criteria, gain_trigger: gainTrigger});
if (outputPath) {
  const absoluteOutput = resolve(outputPath);
  mkdirSync(dirname(absoluteOutput), {recursive: true});
  writeFileSync(absoluteOutput, `${JSON.stringify(result, null, 2)}\n`, "utf8");
}
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = result.final_status === "FAIL" ? 1 : 0;
