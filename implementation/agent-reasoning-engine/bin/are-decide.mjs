#!/usr/bin/env node
import {decide, failure, MAX_INPUT_BYTES, operations, repositoryRoot} from "../src/decision-cli.mjs";
import {realizeActivatedModulePort} from "../packages/module-port-governance-cutover/index.mjs";
import {resolve} from "node:path";

let output;
try {
  const cutover = realizeActivatedModulePort({repository_root: resolve(repositoryRoot, "cyberAlchemy-v2")});
  if (!cutover.ok) throw new Error(`cli.module-port-cutover-blocked:${cutover.reason_codes.join(",")}`);
  const [operation, ...extra] = process.argv.slice(2);
  if (!operations.includes(operation) || extra.length) throw new Error("cli.usage:are decide route|context|effect|continue < request.json");
  const chunks = [];
  let length = 0;
  for await (const chunk of process.stdin) {
    length += chunk.length;
    if (length > MAX_INPUT_BYTES) throw new Error("cli.input-too-large");
    chunks.push(chunk);
  }
  let input;
  try { input = JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new Error("cli.input-invalid-json"); }
  output = decide(operation, input, {modulePort: cutover.port});
} catch (error) { output = failure([error.message]); }
process.stdout.write(`${JSON.stringify(output)}\n`);
process.exitCode = !output.ok || output.kind === "block" ? 2 : output.kind === "gate" ? 3 : 0;
