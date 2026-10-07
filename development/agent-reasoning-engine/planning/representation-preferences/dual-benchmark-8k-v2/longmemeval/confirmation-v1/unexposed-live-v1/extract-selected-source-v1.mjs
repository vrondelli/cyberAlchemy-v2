#!/usr/bin/env node
// Provider-free extraction of the receipt-selected source-only generation package.
import {createHash} from "node:crypto";
import {closeSync, constants, existsSync, fsyncSync, mkdtempSync, mkdirSync, openSync, readFileSync, renameSync, rmSync, writeFileSync} from "node:fs";
import {basename, dirname, join, resolve} from "node:path";

export const BINDINGS = Object.freeze({
  bundle_file_sha256: "0827ac6814a63ab4c840c911d4ead43551c0f39c54b81ad78a840906c854aa81",
  selection_file_sha256: "7d584109d469ce03992570debc4e77ddb37425d7a66b7b4c53b1c04e3e6cd0ec",
  bundle_sha256: "17b1777ef83cb989108faf4a4308224cee7e9932b80d781002632ecc2447ac5e",
  queue_sha256: "67c50c2b05a1a2feeb95aa200285ee26bfff0f16c2c5a4adfc2cafa238727c72",
  selection_sha256: "2232f5cb5a59e16e8d74ed474e18556e6eddd3cd074f2a90c60215854a8b9c18",
  cohort_sha256: "4f97a9e1f121fd7938ec266ba995552845696df803b7cb5fd852cfe02f56ceec",
  source_revision: "98d7416c24c778c2fee6e6f3006e7a073259d48f",
  source_sha256: "d6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442",
});
const FIELDS = ["question_id", "question_type", "question", "question_date", "haystack_dates", "haystack_sessions"];
const stable = (value) => JSON.stringify(value, (_, item) => item && typeof item === "object" && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map((key) => [key, item[key]])) : item);
export const sha256 = (value) => createHash("sha256").update(Buffer.isBuffer(value) ? value : stable(value)).digest("hex");
const fail = (code) => { throw new Error(code); };
const exact = (value, keys) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("|") === [...keys].sort().join("|");

function durableJson(path, value) {
  const fd = openSync(path, constants.O_WRONLY | constants.O_CREAT | constants.O_EXCL, 0o444);
  try { writeFileSync(fd, `${JSON.stringify(value, null, 2)}\n`); fsyncSync(fd); } finally { closeSync(fd); }
  return sha256(readFileSync(path));
}
function syncDirectory(path) { const fd = openSync(path, constants.O_RDONLY | constants.O_DIRECTORY); try { fsyncSync(fd); } finally { closeSync(fd); } }
function readBound(path, expected, code) { const bytes = readFileSync(path); if (sha256(bytes) !== expected) fail(code); return JSON.parse(bytes); }

export function extractSelectedSource(bundlePath, selectionPath, outputDirectory, bindings = BINDINGS) {
  if (existsSync(outputDirectory)) fail("source-extraction.output-exists");
  const bundle = readBound(bundlePath, bindings.bundle_file_sha256, "source-extraction.bundle-file-drift");
  const selection = readBound(selectionPath, bindings.selection_file_sha256, "source-extraction.selection-file-drift");
  if (bundle.schema_version !== "are.longmemeval-qualification-source-bundle/v1" || bundle.bundle_sha256 !== bindings.bundle_sha256 || bundle.queue_sha256 !== bindings.queue_sha256 || bundle.evaluator_fields_emitted !== false || stable(bundle.fields) !== stable(FIELDS) || !Array.isArray(bundle.rows)) fail("source-extraction.bundle-invalid");
  if (selection.schema_version !== "are.longmemeval-qualified-cohort-selection/v1" || selection.selection_sha256 !== bindings.selection_sha256 || selection.cohort?.cohort_sha256 !== bindings.cohort_sha256 || selection.cohort?.cohort_size !== 4 || selection.selection_provider_calls !== 0 || selection.evaluator_fields_accessed !== false || !Array.isArray(selection.cohort.tasks) || selection.cohort.tasks.length !== 4) fail("source-extraction.selection-invalid");
  const byId = new Map(bundle.rows.map((row) => [row.question_id, row]));
  const rows = selection.cohort.tasks.map((task) => {
    const row = byId.get(task.question_id);
    if (!row || !exact(row, FIELDS) || sha256(row) !== task.source_row_sha256) fail("source-extraction.row-binding-invalid");
    if (row.haystack_sessions.some((session) => !Array.isArray(session) || session.some((message) => !exact(message, ["role", "content"])))) fail("source-extraction.message-schema-invalid");
    return row;
  });
  if (new Set(rows.map((row) => row.question_id)).size !== 4) fail("source-extraction.duplicate-id");
  const parent = dirname(outputDirectory); mkdirSync(parent, {recursive: true});
  const temporary = mkdtempSync(join(parent, `.${basename(outputDirectory)}.`));
  try {
    const rowBindings = rows.map((row, index) => {
      const path = `source-${row.question_id}.json`;
      const fileSha = durableJson(join(temporary, path), row);
      return {order: index, question_id: row.question_id, question_type: row.question_type, source_row_sha256: sha256(row), path, file_sha256: fileSha};
    });
    const acquisitionMaterial = {schema_version: "are.longmemeval-unexposed-source-acquisition/v1", status: "verified-source-only-projection", upstream: {revision: bindings.source_revision, sha256: bindings.source_sha256, records: 500}, bundle_file_sha256: bindings.bundle_file_sha256, selection_file_sha256: bindings.selection_file_sha256, selection_sha256: bindings.selection_sha256, cohort_sha256: bindings.cohort_sha256, selected: rowBindings, evaluation_references_emitted: false, provider_calls: 0, authority_effect: "none"};
    const acquisition = {...acquisitionMaterial, acquisition_sha256: sha256(acquisitionMaterial)};
    const acquisitionFileSha = durableJson(join(temporary, "acquisition.json"), acquisition);
    const manifestMaterial = {schema_version: "are.longmemeval-unexposed-source-manifest/v1", source_revision: bindings.source_revision, source_sha256: bindings.source_sha256, selection_sha256: bindings.selection_sha256, cohort_sha256: bindings.cohort_sha256, acquisition_file_sha256: acquisitionFileSha, rows: rowBindings, evaluator_files_present: false, authority_effect: "none"};
    const manifest = {...manifestMaterial, manifest_sha256: sha256(manifestMaterial)};
    const manifestFileSha = durableJson(join(temporary, "manifest.json"), manifest);
    syncDirectory(temporary); renameSync(temporary, outputDirectory); syncDirectory(parent);
    return {status: "extracted", rows: 4, manifest_sha256: manifest.manifest_sha256, manifest_file_sha256: manifestFileSha, acquisition_sha256: acquisition.acquisition_sha256, provider_calls: 0};
  } catch (error) { rmSync(temporary, {recursive: true, force: true}); throw error; }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  if (process.argv.length !== 5) fail("usage: extract-selected-source-v1.mjs BUNDLE SELECTION OUTPUT_DIRECTORY");
  process.stdout.write(`${JSON.stringify(extractSelectedSource(...process.argv.slice(2)))}\n`);
}
