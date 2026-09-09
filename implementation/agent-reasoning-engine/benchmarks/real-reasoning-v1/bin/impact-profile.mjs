#!/usr/bin/env node
import {mkdirSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";

import {loadBenchmark} from "../src/corpus.mjs";
import {packageRoot} from "../src/common.mjs";
import {formatImpactProfileSummary, runImpactProfile} from "../src/impact-profiler.mjs";

const args = process.argv.slice(2);
function flag(name, fallback) {
  const position = args.indexOf(name);
  return position >= 0 && args[position + 1] && !args[position + 1].startsWith("--") ? args[position + 1] : fallback;
}

if (args.includes("--help")) {
  process.stdout.write("Usage: impact-profile.mjs [--warm-iterations N] [--iterations N] [--output FILE]\n");
  process.exit(0);
}

const warmIterations = Number(flag("--warm-iterations", 20));
const iterations = Number(flag("--iterations", 100));
const output = resolve(flag("--output", `runs/${new Date().toISOString().slice(0, 10)}-impact-profile-v1.json`));
const result = await runImpactProfile(loadBenchmark(packageRoot), {warm_iterations: warmIterations, iterations});
mkdirSync(dirname(output), {recursive: true});
writeFileSync(output, `${JSON.stringify(result, null, 2)}\n`, "utf8");
process.stderr.write(`${formatImpactProfileSummary(result)}\nreport=${output}\n`);
process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
