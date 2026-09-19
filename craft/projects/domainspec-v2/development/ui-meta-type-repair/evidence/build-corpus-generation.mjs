import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildEnvelope, sha256Canonical } from "../contracts/canonical-json-v1.mjs";
import { createCorpusFactReceipt, createReviewerProjection } from "./corpus-receipt.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repairRoot = resolve(here, "..");
const workspaceRoot = resolve(repairRoot, "../../../..");
const manifestPath = join(repairRoot, "fixtures/contracts/corpus-manifest.json");
const outDir = resolve(getArg("--out-dir") || join(here, "results/corpus/generation-001"));
const predecessor = getArg("--predecessor") || null;
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const facts = manifest.entries.map((entry) => {
  const repository = resolve(workspaceRoot, entry.source.repository);
  const sourcePath = resolve(repository, entry.source.path);
  const actualRevision = gitHead(repository);
  return {
    entry_id: entry.id,
    receipt: createCorpusFactReceipt({ ...entry, observed_at: "2026-07-11T00:00:00Z" }, {
      sourceText: readFileSync(sourcePath, "utf8"),
      actualRevision,
    }),
  };
});
const byEntry = new Map(facts.map((entry) => [entry.entry_id, entry.receipt]));
const reviewerProjections = manifest.reviewer_projections.map((projection) => {
  const fact = byEntry.get(projection.source_entry_id);
  if (!fact) throw new Error(`projection references unknown source entry ${projection.source_entry_id}`);
  return createReviewerProjection({
    ...projection,
    corpus_receipt_id: fact.record_id,
    observed_at: "2026-07-11T00:00:00Z",
  });
});
const factHandles = facts.map((entry) => entry.receipt.record_id).sort();
const projectionHandles = reviewerProjections.map((entry) => entry.record_id).sort();
const semantic = {
  fact_handles: factHandles,
  reviewer_projection_handles: projectionHandles,
  corpus_ids: [...new Set(manifest.entries.map((entry) => entry.corpus_id))].sort(),
  implementation_styles: [...new Set(manifest.entries.map((entry) => entry.implementation_style))].sort(),
};
const envelope = buildEnvelope({
  contractId: "ui-repair.corpus-generation",
  contractVersion: "1.0.0",
  semanticFields: Object.keys(semantic),
  record: semantic,
  status: facts.some((entry) => entry.receipt.semantic.observation_status === "not-observed") ? "defer" : "complete",
  predecessorGenerationId: predecessor,
  inputHandles: [`manifest:${sha256Canonical(manifest)}`, ...factHandles, ...projectionHandles].sort(),
  createdAt: "2026-07-11T00:00:00Z",
});
const result = {
  ...envelope,
  schema_version: "ui-repair.corpus-generation.v1",
  summary: {
    fact_count: facts.length,
    observed: facts.filter((entry) => entry.receipt.semantic.observation_status === "observed").length,
    not_observed: facts.filter((entry) => entry.receipt.semantic.observation_status === "not-observed").length,
    reviewer_projection_count: reviewerProjections.length,
    corpus_count: semantic.corpus_ids.length,
    implementation_style_count: semantic.implementation_styles.length,
  },
  facts,
  reviewer_projections: reviewerProjections,
};

publish(result);

function gitHead(repository) {
  const result = spawnSync("git", ["-C", repository, "rev-parse", "HEAD"], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(`cannot resolve revision for ${repository}: ${result.stderr}`);
  return result.stdout.trim();
}

function publish(record) {
  const target = join(outDir, "receipts.json");
  if (existsSync(target)) {
    const existing = JSON.parse(readFileSync(target, "utf8"));
    if (existing.content_digest === record.content_digest && existing.generation_id === record.generation_id) {
      console.log(`NO-OP: immutable corpus generation already exists at ${relativeToRepair(target)}`);
      return;
    }
    throw new Error(`refusing to overwrite non-identical corpus generation at ${relativeToRepair(target)}`);
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  console.log(`PASS: published ${record.summary.fact_count} corpus facts and ${record.summary.reviewer_projection_count} separate reviewer projections at ${relativeToRepair(target)}`);
}

function relativeToRepair(path) {
  return path.replace(`${repairRoot}/`, "");
}

function getArg(name) {
  const index = process.argv.indexOf(name);
  return index < 0 ? undefined : process.argv[index + 1];
}
