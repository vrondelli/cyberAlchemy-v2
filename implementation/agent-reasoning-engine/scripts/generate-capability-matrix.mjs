#!/usr/bin/env node
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {materializeCapabilityMatrix, renderCapabilityMatrixMarkdown} from "../src/capability-matrix.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const outputRoot = resolve(root, "docs/generated");
const jsonPath = resolve(outputRoot, "capability-matrix.json");
const markdownPath = resolve(outputRoot, "CAPABILITY-MATRIX.md");
const matrix = materializeCapabilityMatrix();
const outputs = new Map([
  [jsonPath, `${JSON.stringify(matrix, null, 2)}\n`],
  [markdownPath, renderCapabilityMatrixMarkdown(matrix)],
]);
const check = process.argv.includes("--check");
if (check) {
  const stale = [...outputs].filter(([path, expected]) => {
    try { return readFileSync(path, "utf8") !== expected; } catch { return true; }
  }).map(([path]) => path);
  if (stale.length) {
    process.stderr.write(`capability-matrix-stale:${stale.join(",")}\n`);
    process.exitCode = 1;
  } else process.stdout.write("capability-matrix-current\n");
} else {
  mkdirSync(outputRoot, {recursive: true});
  for (const [path, bytes] of outputs) writeFileSync(path, bytes);
  process.stdout.write(`${JSON.stringify({status: "WROTE", matrix_digest: matrix.matrix_digest, authority_effect: "none"})}\n`);
}
