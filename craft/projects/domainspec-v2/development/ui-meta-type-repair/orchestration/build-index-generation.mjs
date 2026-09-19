import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createOrchestrationIndexEntry } from "./index-entry.mjs";
import { replayMechanicalGeneration } from "./replay.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repairRoot = resolve(here, "..");
const fixturePath = join(repairRoot, "fixtures/contracts/orchestration-index-entry.json");
const outDir = resolve(getArg("--out-dir") || join(here, "results/generation-001"));
const input = JSON.parse(readFileSync(fixturePath, "utf8"));
const replay = replayMechanicalGeneration(repairRoot, input.records);
const entry = createOrchestrationIndexEntry({ ...input, replay, created_at: "2026-07-11T00:00:00Z" });

publish(entry);

function publish(record) {
  const target = join(outDir, "entry.json");
  if (existsSync(target)) {
    const existing = JSON.parse(readFileSync(target, "utf8"));
    if (existing.content_digest === record.content_digest && existing.generation_id === record.generation_id) {
      console.log(`NO-OP: immutable orchestration index generation already exists at ${relativeToRepair(target)}`);
      return;
    }
    throw new Error(`refusing to update orchestration index generation in place at ${relativeToRepair(target)}`);
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.log(`PASS: appended ${record.semantic.replay.status} orchestration index generation at ${relativeToRepair(target)}`);
}

function relativeToRepair(path) {
  return path.replace(`${repairRoot}/`, "");
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}
