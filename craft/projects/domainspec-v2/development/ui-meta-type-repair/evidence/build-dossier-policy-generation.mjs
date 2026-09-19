import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createDossierPolicyEvaluation } from "./dossier-policy-evaluation.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const repairRoot = resolve(here, "..");
const inputPath = resolve(getArg("--input") || join(repairRoot, "fixtures/contracts/dossier-policy-current.json"));
const corpusPath = resolve(getArg("--corpus") || join(here, "results/corpus/generation-002/receipts.json"));
const dossierPath = resolve(getArg("--dossier") || join(here, "results/dossier/generation-001/dossier.json"));
const outDir = resolve(getArg("--out-dir") || join(here, "results/dossier-policy/generation-001"));
const input = JSON.parse(readFileSync(inputPath, "utf8"));
const corpus = JSON.parse(readFileSync(corpusPath, "utf8"));
const dossier = JSON.parse(readFileSync(dossierPath, "utf8"));

if (corpus.generation_id !== input.source_handles.corpus_generation) throw new Error("corpus generation handle mismatch");
if (dossier.generation_id !== input.source_handles.dossier_generation) throw new Error("dossier generation handle mismatch");
const corpusHandles = new Set([
  ...corpus.facts.map((entry) => entry.receipt.record_id),
  ...corpus.reviewer_projections.map((entry) => entry.record_id),
]);
for (const candidate of input.candidates) {
  for (const handle of candidate.evidence.flatMap((entry) => entry.receipt_handles)) {
    if (!corpusHandles.has(handle)) throw new Error(`unknown corpus evidence handle: ${handle}`);
  }
  for (const reviewer of candidate.reviewers) {
    if (reviewer.evidence_handle.startsWith("record:") && !corpusHandles.has(reviewer.evidence_handle)) throw new Error(`unknown reviewer evidence handle: ${reviewer.evidence_handle}`);
  }
}

const evaluation = createDossierPolicyEvaluation({ ...input, created_at: "2026-07-12T00:00:00Z" });
publish(evaluation);

function publish(record) {
  const target = join(outDir, "evaluation.json");
  if (existsSync(target)) {
    const existing = JSON.parse(readFileSync(target, "utf8"));
    if (existing.content_digest === record.content_digest && existing.generation_id === record.generation_id) {
      console.log(`NO-OP: immutable dossier-policy generation already exists at ${relativeToRepair(target)}`);
      return;
    }
    throw new Error(`refusing to overwrite non-identical dossier-policy generation at ${relativeToRepair(target)}`);
  }
  mkdirSync(outDir, { recursive: true });
  writeFileSync(target, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  const missing = record.semantic.candidate_evaluations.filter((entry) => entry.portability_state === "missing").length;
  console.log(`PASS: published dossier-policy generation with ${missing}/${record.semantic.candidate_evaluations.length} portability states missing at ${relativeToRepair(target)}`);
}

function relativeToRepair(path) { return path.replace(`${repairRoot}/`, ""); }
function getArg(name) { const index = process.argv.indexOf(name); return index < 0 ? undefined : process.argv[index + 1]; }
