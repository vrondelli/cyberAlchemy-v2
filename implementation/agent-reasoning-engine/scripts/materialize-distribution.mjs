#!/usr/bin/env node
import {materializeStandaloneDistribution} from "../src/distribution.mjs";

const [output, ...extra] = process.argv.slice(2);
if (!output || extra.length > 0) {
  process.stderr.write("Usage: node scripts/materialize-distribution.mjs <empty-output-directory>\n");
  process.exitCode = 2;
} else {
  process.stdout.write(`${JSON.stringify(materializeStandaloneDistribution(output), null, 2)}\n`);
}
