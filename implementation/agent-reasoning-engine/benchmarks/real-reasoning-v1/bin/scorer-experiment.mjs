#!/usr/bin/env node
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";

import {formatScorerExperimentSummary, loadCounterbalancedHoldout, runScorerExperiment} from "../src/scorer-experiment.mjs";

const args = process.argv.slice(2);
function flag(name, fallback) {
  const position = args.indexOf(name);
  return position >= 0 && args[position + 1] && !args[position + 1].startsWith("--") ? args[position + 1] : fallback;
}
const holdout = flag("--holdout", "corpus/literal-versus-intent-counterbalanced-v1.jsonl");
const repetitions = Number(flag("--repetitions", 3));
const warmupSamples = Number(flag("--warmup-samples", 250));
const timingOrder = flag("--timing-order", "alternating");
const fixturePath = flag("--fixture", "../../packages/evolution-runtime/fixtures/luna-lexical-scoring-hypothesis.json");
const outputPath = flag("--output", null);
const treatmentRef = flag("--treatment", "scorer:declared-concept-equivalence/candidate-v1");
const experimentId = flag("--experiment-id", "research-experiment:33434e267b28ac0342193911ca145d9a3bbd6eba3b3b68c3468933bbf5306435");
if (args.includes("--help")) {
  process.stdout.write("Usage: scorer-experiment.mjs [--holdout FILE] [--fixture FILE] [--treatment REF] [--experiment-id ID] [--repetitions N] [--warmup-samples N] [--timing-order alternating|baseline-first|treatment-first] [--output FILE]\n");
  process.exit(0);
}
const fixture = JSON.parse(readFileSync(resolve(fixturePath), "utf8"));
const result = runScorerExperiment({holdout: loadCounterbalancedHoldout(resolve(holdout)), repetitions, warmup_samples: warmupSamples, timing_order: timingOrder, treatment_ref: treatmentRef, experiment_id: experimentId, success_criteria: fixture.hypothesis.experiment_template.success_criteria});
if (outputPath) {
  const absoluteOutput = resolve(outputPath);
  mkdirSync(dirname(absoluteOutput), {recursive: true});
  writeFileSync(absoluteOutput, `${JSON.stringify(result, null, 2)}\n`, "utf8");
}
process.stderr.write(`${formatScorerExperimentSummary(result)}\n`);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = result.status === "FAIL" ? 1 : 0;
