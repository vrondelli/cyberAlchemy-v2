#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const runDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = process.cwd();
const outputPath = resolve(runDir, "metric-audit.json");
const FIELDS = ["source", "purpose", "scope", "constraints", "target_pressure", "current_output_hypothesis", "revision_route"];
const POSTURES = ["declared", "inferred", "unresolved"];
const STRATA = ["dispatch", "craft", "invoke-work-pack"];
const KINDS = ["field_ambiguity", "field_overlap", "replacement_risk", "source_granularity", "envelope_redundancy", "missing_semantics", "other"];

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function loadJson(name) {
  return JSON.parse(readFileSync(resolve(runDir, name), "utf8"));
}

function ratio(numerator, denominator) {
  return denominator === 0 ? null : Number((numerator / denominator).toFixed(6));
}

function counts(subset, field) {
  const result = { declared: 0, inferred: 0, unresolved: 0 };
  for (const row of subset) result[row.intent_record.intent[field].posture] += 1;
  return {
    ...result,
    total: subset.length,
    rates: Object.fromEntries(POSTURES.map((posture) => [posture, ratio(result[posture], subset.length)]))
  };
}

function matrix(subset) {
  return Object.fromEntries(FIELDS.map((field) => [field, counts(subset, field)]));
}

const checks = [];
function check(id, condition, evidence) {
  checks.push({ id, status: condition ? "pass" : "fail", evidence });
}

if (existsSync(outputPath)) throw new Error(`refusing to overwrite audit: ${outputPath}`);
const manifest = loadJson("corpus-manifest.json");
const recordsBytes = readFileSync(resolve(runDir, "records.jsonl"));
const rows = recordsBytes.toString("utf8").trim().split(/\r?\n/).map((line) => JSON.parse(line));
const validation = loadJson("validation-report.json");
const metrics = loadJson("metrics.json");
const cards = loadJson("field-evidence-cards.json");
const adjudication = loadJson("adjudication-packet.json");
const resultText = readFileSync(resolve(runDir, "RESULT.md"), "utf8");

check("AUD-IDENTITY", manifest.run_id === "2026-07-22-intent-schema-02" && rows.every((row) => row.run_id === manifest.run_id), { run_id: manifest.run_id });
check("AUD-CARDINALITY", manifest.samples.length === 15 && rows.length === 15 && new Set(rows.map((row) => row.sample_id)).size === 15, { manifest: manifest.samples.length, rows: rows.length });
check("AUD-ASSIGNMENT", rows.filter((row) => row.assignment === "population").length === 12 && rows.filter((row) => row.assignment === "holdout").length === 3, { population: 12, holdout: 3 });
check("AUD-HOLDOUT-STRATA", new Set(rows.filter((row) => row.assignment === "holdout").map((row) => row.stratum)).size === 3, { strata: [...new Set(rows.filter((row) => row.assignment === "holdout").map((row) => row.stratum))].sort() });

let sourceLocks = 0;
for (const sample of manifest.samples) {
  const bytes = readFileSync(resolve(repoRoot, sample.source_path));
  const row = rows.find((candidate) => candidate.sample_id === sample.sample_id);
  if (
    row && row.assignment === sample.assignment && row.stratum === sample.stratum &&
    row.source_lock.source_path === sample.source_path && row.source_lock.selector === sample.selector &&
    row.source_lock.source_sha256 === sample.source_sha256 && row.source_lock.selected_text_sha256 === sample.selected_text_sha256 &&
    sha256(bytes) === sample.source_sha256 && sha256(sample.selected_text) === sample.selected_text_sha256 && bytes.toString("utf8").includes(sample.selected_text)
  ) sourceLocks += 1;
}
check("AUD-SOURCE-LOCKS", sourceLocks === 15, { matching: sourceLocks, expected: 15 });
check("AUD-VALIDATOR", validation.status === "pass" && validation.rows_parsed === 15 && validation.errors.length === 0, { status: validation.status, rows_parsed: validation.rows_parsed, errors: validation.errors.length });

const population = rows.filter((row) => row.assignment === "population");
const holdout = rows.filter((row) => row.assignment === "holdout");
const recomputed = {
  population: matrix(population),
  holdout: matrix(holdout),
  all: matrix(rows),
  by_stratum: Object.fromEntries(STRATA.map((stratum) => [stratum, matrix(rows.filter((row) => row.stratum === stratum))]))
};
check("AUD-POSTURES", JSON.stringify(recomputed) === JSON.stringify(metrics.field_postures), { fields: FIELDS.length, rows: rows.length });

const pressure = Object.fromEntries(KINDS.map((kind) => {
  const sampleIds = rows.filter((row) => row.observations.some((item) => item.kind === kind)).map((row) => row.sample_id);
  return [kind, { row_count: sampleIds.length, incidence: ratio(sampleIds.length, rows.length), sample_ids: sampleIds }];
}));
check("AUD-PRESSURE", JSON.stringify(pressure) === JSON.stringify(metrics.pressure.observations), { kinds: KINDS.length });

const supported = rows.flatMap((row) => FIELDS.map((field) => row.intent_record.intent[field])).filter((value) => value.posture !== "unresolved");
const inferred = supported.filter((value) => value.posture === "inferred");
const unresolved = rows.flatMap((row) => FIELDS.map((field) => row.intent_record.intent[field])).filter((value) => value.posture === "unresolved");
check("AUD-INVARIANTS", supported.every((value) => value.evidence_refs.length >= 1) && inferred.every((value) => typeof value.inference_note === "string" && value.inference_note.trim()) && unresolved.every((value) => value.value === null && value.evidence_refs.length === 0 && value.inference_note === null), { supported: supported.length, inferred: inferred.length, unresolved: unresolved.length });
check("AUD-CARDS", cards.cards.length === 10 && cards.cards.every((card) => card.owner_decision === "pending"), { card_count: cards.cards.length });
check("AUD-ADJUDICATION", adjudication.gate === "g6-schema-selection" && adjudication.status === "eligible-with-flags" && adjudication.owner_decision === "pending", { gate: adjudication.gate, status: adjudication.status });
check("AUD-CLAIM-WORDING", resultText.includes("In the bounded 15-record local corpus") && !resultText.includes("The correct universal intent schema is"), { required_phrase: true, forbidden_phrase_absent: !resultText.includes("The correct universal intent schema is") });

const failed = checks.filter((item) => item.status === "fail");
const report = {
  auditor: "intent-schema-run-independent-reducer-audit@1",
  run_id: manifest.run_id,
  status: failed.length ? "fail" : "pass",
  evidence_boundary: "mechanical cross-check only; not independent semantic annotation or schema selection",
  input_hashes: {
    manifest_sha256: sha256(readFileSync(resolve(runDir, "corpus-manifest.json"))),
    records_sha256: sha256(recordsBytes),
    validation_report_sha256: sha256(readFileSync(resolve(runDir, "validation-report.json"))),
    metrics_sha256: sha256(readFileSync(resolve(runDir, "metrics.json"))),
    field_evidence_cards_sha256: sha256(readFileSync(resolve(runDir, "field-evidence-cards.json"))),
    adjudication_packet_sha256: sha256(readFileSync(resolve(runDir, "adjudication-packet.json"))),
    result_sha256: sha256(readFileSync(resolve(runDir, "RESULT.md")))
  },
  checks,
  errors: failed.map((item) => item.id)
};

writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, { flag: "wx" });
process.stdout.write(`${report.status}\n${sha256(readFileSync(outputPath))}\n${outputPath}\n`);
process.exit(failed.length ? 1 : 0);
