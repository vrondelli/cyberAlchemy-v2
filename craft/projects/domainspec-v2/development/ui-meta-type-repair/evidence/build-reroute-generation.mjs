import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildEnvelope, sha256Canonical } from "../contracts/canonical-json-v1.mjs";
import { createRerouteReceipt } from "./reroute-receipt.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repairRoot = resolve(here, "..");
const vectorsPath = join(repairRoot, "fixtures/contracts/reroute-vectors.json");
const outDir = resolve(getArg("--out-dir") || join(here, "results/reroute/generation-001"));
const predecessor = getArg("--predecessor") || null;
const vectors = JSON.parse(readFileSync(vectorsPath, "utf8"));
const specimenDigest = sha256Canonical({ specimen: "same-normalized-input" });

const receipts = vectors.vectors.map((vector) => createRerouteReceipt({
  specimen_digest: specimenDigest,
  source_contract: "contract:source/ui-candidate/v1",
  destination_contract: "contract:destination/example/v1",
  source_outcome: vector.source_outcome,
  destination_outcome: vector.destination_outcome,
  destination_handle: vector.destination_handle,
  owner_handle: vector.owner_handle,
  observed_at: "2026-07-11T00:00:00Z",
}));

for (const [index, receipt] of receipts.entries()) {
  if (receipt.semantic.disposition !== vectors.vectors[index].expected) {
    throw new Error(`vector ${vectors.vectors[index].id} produced ${receipt.semantic.disposition}`);
  }
}

const semanticReceipts = receipts.map((receipt, index) => ({
  vector_id: vectors.vectors[index].id,
  receipt: receipt.semantic,
  receipt_record_id: receipt.record_id,
  receipt_generation_id: receipt.generation_id,
}));
const envelope = buildEnvelope({
  contractId: "ui-repair.reroute-set",
  contractVersion: "1.0.0",
  semanticFields: ["receipts"],
  record: { receipts: semanticReceipts },
  status: receipts.some((receipt) => receipt.status === "pending-owner") ? "pending-owner" : "complete",
  predecessorGenerationId: predecessor,
  inputHandles: [`specimen:${specimenDigest}`, `vectors:${sha256Canonical(vectors)}`].sort(),
  createdAt: "2026-07-11T00:00:00Z",
});
const result = {
  ...envelope,
  schema_version: "ui-repair.reroute-set.v1",
  receipt_count: receipts.length,
  receipts: semanticReceipts,
};

publish(result);

function publish(record) {
  const target = join(outDir, "receipts.json");
  if (existsSync(target)) {
    const existing = JSON.parse(readFileSync(target, "utf8"));
    if (existing.content_digest === record.content_digest && existing.generation_id === record.generation_id) {
      console.log(`NO-OP: immutable reroute generation already exists at ${relativeToRepair(target)}`);
      return;
    }
    throw new Error(`refusing to overwrite non-identical reroute generation at ${relativeToRepair(target)}`);
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.log(`PASS: published ${record.receipt_count} reroute receipts at ${relativeToRepair(target)}`);
}

function relativeToRepair(path) {
  return path.replace(`${repairRoot}/`, "");
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}
