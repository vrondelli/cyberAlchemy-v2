#!/usr/bin/env tsx
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const here = dirname(fileURLToPath(import.meta.url));
const domainspec = resolve(here, "../../../..");
const impl = join(domainspec, "impl");
const tsx = join(impl, "node_modules/.bin/tsx");
const source = JSON.parse(readFileSync(join(here, "candidates.json"), "utf8")) as {
  candidates: Array<{ label: string; slug: string }>;
};

let checks = 0;
for (const candidate of source.candidates) {
  for (const [role, expected] of [["positive", 0], ["malformed", 1], ["neighbor", 1]] as const) {
    const fixture = join(here, candidate.slug, "fixtures", `${role}.md`);
    const result = spawnSync(tsx, [
      "tools/validate-content.ts",
      "--schema-dir", here,
      "--relationships", "../definitions/relationships/relationships.yml",
      "--file", fixture,
      "--mode", "strict",
    ], { cwd: impl, encoding: "utf8" });
    if (result.status !== expected) {
      process.stderr.write(result.stdout);
      process.stderr.write(result.stderr);
      throw new Error(`${candidate.label} ${role}: expected exit ${expected}, got ${result.status}`);
    }
    checks += 1;
  }
}
console.log(`PASS: ${checks} black-box candidate fixture checks (${source.candidates.length} candidates)`);
