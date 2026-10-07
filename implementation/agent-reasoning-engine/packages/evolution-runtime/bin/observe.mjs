#!/usr/bin/env node
import {observeCandidateEvolutionRegistry, observeDurableEvolution} from "../src/durable-kernel-v1.mjs";

const args = process.argv.slice(2);
const rootIndex = args.indexOf("--root");
const registryOnly = args.length === 2 && args.includes("--json") && args.includes("--registry-only");
const durable = args.length === 3 && args.includes("--json") && rootIndex >= 0 && !!args[rootIndex + 1];
if (!registryOnly && !durable) {
  process.stderr.write("Usage: observe.mjs --json (--root <explicit-path> | --registry-only)\n");
  process.exitCode = 2;
} else {
  try {
    process.stdout.write(`${JSON.stringify(registryOnly ? observeCandidateEvolutionRegistry()
      : observeDurableEvolution({root: args[rootIndex + 1]}))}\n`);
  } catch {
    process.stderr.write("evolution.observation-failed\n");
    process.exitCode = 1;
  }
}
