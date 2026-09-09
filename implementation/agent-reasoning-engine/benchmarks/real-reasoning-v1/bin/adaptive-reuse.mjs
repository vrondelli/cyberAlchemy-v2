#!/usr/bin/env node
import {resolve} from "node:path";

import {loadBenchmark} from "../src/corpus.mjs";
import {packageRoot} from "../src/common.mjs";
import {runAdaptiveReuseBenchmark} from "../src/adaptive-reuse.mjs";
import {writeReport} from "../src/report.mjs";

function options(argv) {
  const selected = {output: null, write: true, timing_iterations: null, warm_iterations: null, holdout: false};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--output") selected.output = resolve(argv[++index]);
    else if (argument === "--timing-iterations") selected.timing_iterations = Number(argv[++index]);
    else if (argument === "--warm-iterations") selected.warm_iterations = Number(argv[++index]);
    else if (argument === "--holdout") selected.holdout = true;
    else if (argument === "--stdout-only") selected.write = false;
    else if (argument === "--help") selected.help = true;
    else throw new Error(`Unknown option: ${argument}`);
  }
  for (const field of ["timing_iterations", "warm_iterations"]) {
    if (selected[field] !== null && (!Number.isSafeInteger(selected[field]) || selected[field] < 0)) throw new Error(`--${field.replaceAll("_", "-")} must be a non-negative integer`);
  }
  return selected;
}

const selected = options(process.argv.slice(2));
if (selected.help) {
  process.stdout.write("Usage: adaptive-reuse.mjs [--holdout] [--output FILE] [--timing-iterations N] [--warm-iterations N] [--stdout-only]\n");
  process.exit(0);
}

const result = await runAdaptiveReuseBenchmark(loadBenchmark(packageRoot), selected);
const reportPath = selected.write ? writeReport(result, selected.output) : null;
process.stdout.write(`${JSON.stringify({...result, report_path: reportPath}, null, 2)}\n`);
process.exitCode = result.status === "FAIL" ? 1 : 0;
