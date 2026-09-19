import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createFormationDossier } from "./formation-dossier.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repairRoot = resolve(here, "..");
const fixturePath = join(repairRoot, "fixtures/contracts/formation-dossier.json");
const outDir = resolve(getArg("--out-dir") || join(here, "results/dossier/generation-001"));
const input = JSON.parse(readFileSync(fixturePath, "utf8"));

verifyProducer("mutation", "mutation/results/generation-001/ledger.json");
verifyProducer("reroute", "evidence/results/reroute/generation-001/receipts.json");
verifyProducer("corpus", "evidence/results/corpus/generation-001/receipts.json");
verifyProducer("relationship_packet", "evidence/results/relationship-packet/generation-001/packet.json");

const dossier = createFormationDossier({ ...input, created_at: "2026-07-11T00:00:00Z" });
publish(dossier);

function verifyProducer(key, path) {
  const record = JSON.parse(readFileSync(join(repairRoot, path), "utf8"));
  if (record.generation_id !== input.producer_handles[key]) throw new Error(`${key} producer handle mismatch`);
}

function publish(record) {
  const target = join(outDir, "dossier.json");
  if (existsSync(target)) {
    const existing = JSON.parse(readFileSync(target, "utf8"));
    if (existing.content_digest === record.content_digest && existing.generation_id === record.generation_id) {
      console.log(`NO-OP: immutable dossier generation already exists at ${relativeToRepair(target)}`);
      return;
    }
    throw new Error(`refusing to overwrite non-identical dossier generation at ${relativeToRepair(target)}`);
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.log(`PASS: published ${record.semantic.outcome} dossier with ${record.semantic.conjuncts.length} hard conjuncts at ${relativeToRepair(target)}`);
}

function relativeToRepair(path) {
  return path.replace(`${repairRoot}/`, "");
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}
