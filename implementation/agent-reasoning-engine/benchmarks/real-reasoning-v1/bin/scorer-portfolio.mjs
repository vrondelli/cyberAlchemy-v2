#!/usr/bin/env node
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";

import {formatPortfolioSummary, loadPortfolioHoldout, partitionPortfolioHoldout, runScorerPortfolio} from "../src/scorer-portfolio.mjs";
import {createResearchHypothesis} from "../../../packages/evolution-runtime/index.mjs";
import {SCORER_OPTIMIZATION_STRATEGIES} from "../src/scorer-strategies.mjs";

const args = process.argv.slice(2);
function flag(name, fallback) {
  const position = args.indexOf(name);
  return position >= 0 && args[position + 1] && !args[position + 1].startsWith("--") ? args[position + 1] : fallback;
}
if (args.includes("--help")) {
  process.stdout.write("Usage: scorer-portfolio.mjs [--holdout FILE] [--confirmation-holdout FILE] [--confirmation-split even|odd] [--fixture FILE] [--experiment-id ID] [--screening-repetitions N] [--full-repetitions N] [--full-replications N] [--confirmation-repetitions N] [--confirmation-replications N] [--max-survivors N] [--warmup-samples N] [--timing-order alternating|baseline-first|treatment-first] [--output FILE]\n");
  process.exit(0);
}
const holdoutPath = flag("--holdout", "corpus/literal-versus-intent-counterbalanced-v1.jsonl");
const confirmationPath = flag("--confirmation-holdout", null);
const confirmationSplit = flag("--confirmation-split", null);
const fixturePath = flag("--fixture", "../../packages/evolution-runtime/fixtures/luna-lexical-scoring-hypothesis.json");
const experimentId = flag("--experiment-id", "research-experiment:declared-concept-equivalence-portfolio");
const screeningRepetitions = Number(flag("--screening-repetitions", 1));
const fullRepetitions = Number(flag("--full-repetitions", 3));
const fullReplications = Number(flag("--full-replications", 3));
const confirmationRepetitions = Number(flag("--confirmation-repetitions", fullRepetitions));
const confirmationReplications = Number(flag("--confirmation-replications", fullReplications));
const maxSurvivors = Number(flag("--max-survivors", 2));
const warmupSamples = Number(flag("--warmup-samples", 250));
const timingOrder = flag("--timing-order", "alternating");
const outputPath = flag("--output", null);
const fixture = JSON.parse(readFileSync(resolve(fixturePath), "utf8"));
const loadedHoldout = loadPortfolioHoldout(resolve(holdoutPath));
if (confirmationPath && confirmationSplit) throw new TypeError("Use either --confirmation-holdout or --confirmation-split, not both.");
let screeningHoldout = loadedHoldout;
let confirmationHoldout = confirmationPath ? loadPortfolioHoldout(resolve(confirmationPath)) : null;
if (confirmationSplit) {
  if (confirmationSplit !== "even" && confirmationSplit !== "odd") throw new TypeError("--confirmation-split must be even or odd.");
  const isEven = (row) => Number.parseInt(row.case_id.match(/(\d+)$/)?.[1] ?? "0", 10) % 2 === 0;
  confirmationHoldout = partitionPortfolioHoldout(loadedHoldout, confirmationSplit === "even" ? isEven : (row) => !isEven(row), `confirmation-${confirmationSplit}-v1`);
  screeningHoldout = partitionPortfolioHoldout(loadedHoldout, confirmationSplit === "even" ? (row) => !isEven(row) : isEven, `screening-${confirmationSplit === "even" ? "odd" : "even"}-v1`);
}
const result = runScorerPortfolio({
  holdout: screeningHoldout,
  confirmation_holdout: confirmationHoldout,
  hypothesis: createResearchHypothesis(fixture.hypothesis),
  strategy_catalog: SCORER_OPTIMIZATION_STRATEGIES,
  screening_repetitions: screeningRepetitions,
  full_repetitions: fullRepetitions,
  full_replications: fullReplications,
  confirmation_repetitions: confirmationRepetitions,
  confirmation_replications: confirmationReplications,
  max_survivors: maxSurvivors,
  warmup_samples: warmupSamples,
  timing_order: timingOrder,
  experiment_id: experimentId,
  success_criteria: fixture.hypothesis.experiment_template.success_criteria,
});
if (outputPath) {
  const absoluteOutput = resolve(outputPath);
  mkdirSync(dirname(absoluteOutput), {recursive: true});
  writeFileSync(absoluteOutput, `${JSON.stringify(result, null, 2)}\n`, "utf8");
}
process.stderr.write(`${formatPortfolioSummary(result)}\n`);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
process.exitCode = result.final_status === "FAIL" ? 1 : 0;
