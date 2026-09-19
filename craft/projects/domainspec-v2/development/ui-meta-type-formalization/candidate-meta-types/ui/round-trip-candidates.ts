#!/usr/bin/env tsx
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

type Candidate = {
  id: string;
  label: string;
  slug: string;
  criteria: Array<{ key: string }>;
  positive: Record<string, string>;
};

const here = dirname(fileURLToPath(import.meta.url));
const domainspec = resolve(here, "../../../..");
const impl = join(domainspec, "impl");
const tsx = join(impl, "node_modules/.bin/tsx");
const generatedDir = join(here, "__generated__/instances");
const mutationsDir = join(here, "__generated__/mutations");
const source = JSON.parse(readFileSync(join(here, "candidates.json"), "utf8")) as { candidates: Candidate[] };

function run(args: string[], expected: number): void {
  const result = spawnSync(tsx, args, { cwd: impl, encoding: "utf8" });
  if (result.status !== expected) {
    process.stderr.write(result.stdout);
    process.stderr.write(result.stderr);
    throw new Error(`expected exit ${expected}, got ${result.status}: ${args.join(" ")}`);
  }
}

mkdirSync(generatedDir, { recursive: true });
mkdirSync(mutationsDir, { recursive: true });
run(["tools/instances.ts", "generate", "--schema-dir", here, "--out-dir", generatedDir], 0);
run(["tools/instances.ts", "validate", "--schema-dir", here, "--dir", generatedDir, "--mode", "strict"], 0);

const results: Array<Record<string, unknown>> = [];
for (const candidate of source.candidates) {
  const removed = candidate.criteria[0]?.key;
  if (!removed) throw new Error(`${candidate.label} has no mutation key`);
  const attributes = Object.entries(candidate.positive).filter(([key]) => key !== removed);
  const lines = [
    `meta_type: ${candidate.label}`,
    `concept: Mutated${candidate.slug.replace(/(^|-)([a-z])/g, (_, __, c) => c.toUpperCase())}`,
    `attributes:`,
    ...attributes.map(([key, value]) => `  ${key}: ${value}`),
    "",
  ];
  const mutationPath = join(mutationsDir, `${candidate.slug}.mutated.instance.yml`);
  writeFileSync(mutationPath, lines.join("\n"), "utf8");
  run(["tools/instances.ts", "validate", "--schema-dir", here, "--file", mutationPath, "--mode", "strict"], 1);
  results.push({
    candidate_id: candidate.id,
    candidate: candidate.label,
    generated: `${candidate.slug}.example.instance.yml`,
    generated_observed: "accept",
    mutation: `${candidate.slug}.mutated.instance.yml`,
    removed_attribute: removed,
    mutation_observed: "reject",
  });
}

writeFileSync(join(here, "validation/round-trip-results.json"), JSON.stringify({
  schema_version: "ui-candidate-round-trip.v0.1",
  status: "pass",
  candidate_count: source.candidates.length,
  generated_accept_count: source.candidates.length,
  mutation_reject_count: source.candidates.length,
  results,
}, null, 2) + "\n", "utf8");

console.log(`PASS: ${source.candidates.length} generated accepts and ${source.candidates.length} targeted mutation rejects`);
