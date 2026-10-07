// Identity-bound facade over the frozen Note-v5 algorithms for the new cohort.
import {readFileSync, lstatSync} from "node:fs";
import {basename, join, resolve} from "node:path";
import * as legacy from "../adapter-note-v5.mjs";

export const IDS = Object.freeze(["0e4e4c46", "gpt4_5438fa52", "ef66a6e5", "0862e8bf_abs"]);
export const SELECTION_SHA256 = "2232f5cb5a59e16e8d74ed474e18556e6eddd3cd074f2a90c60215854a8b9c18";
export const COHORT_SHA256 = "4f97a9e1f121fd7938ec266ba995552845696df803b7cb5fd852cfe02f56ceec";
export const SOURCE_MANIFEST_SHA256 = "ba59f28a061728002e607e2ecb4cfd3fbdaff03494d62039268fb02422a6d437";
export const ACQUISITION_SHA256 = "8abcdc82b681439542ee575d0575f7166d9429344bd6b1afa6e6bb8725c9217a";
export const ACQUISITION_FILE_SHA256 = "47c6a2ef0e38e223d6431133b1e886f6cbb84be01c144a9202123387012fa7b1";
export const EXTRACTOR_SHA256 = "10acbc0e91b280069e9febc3e3366458828e732d878c28b828ad1bc5a637e8b7";
export const SOURCE_REVISION = "98d7416c24c778c2fee6e6f3006e7a073259d48f";
export const SOURCE_SHA256 = "d6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442";
const LEGACY_IDS = legacy.IDS;
const HASH = /^[a-f0-9]{64}$/;
const FIELDS = ["question_id", "question_type", "question", "question_date", "haystack_dates", "haystack_sessions"];
const fail = (code) => { throw new Error(code); };
const exact = (value, keys) => value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).sort().join("|") === [...keys].sort().join("|");
const alias = (row) => {
  const index = IDS.indexOf(row?.question_id);
  if (index < 0 || !exact(row, FIELDS)) fail("unexposed-adapter.source-row-invalid");
  return {...structuredClone(row), question_id: LEGACY_IDS[index]};
};
const restoreTask = (task, index) => ({...task, question_id: IDS[index]});
export const sha = legacy.sha;
export const COMMON_ANSWER_SYSTEM = legacy.COMMON_ANSWER_SYSTEM;
export const TOKENIZER_LIMITS = legacy.TOKENIZER_LIMITS;
export const createTokenizerSession = legacy.createTokenizerSession;
export const wire = legacy.wire;
export const ingestionMessages = legacy.ingestionMessages;
export const admitActualWire = legacy.admitActualWire;

export function validateSourceRow(row) { legacy.validateSourceRow(alias(row)); return row; }
export function flattenHistory(row) { return legacy.flattenHistory(alias(row)); }
export function project(row, limit) { return legacy.project(alias(row), limit); }
export function answerMessages(row, options) { return legacy.answerMessages(alias(row), options); }
export function fitProjection(row, meter, options) { return legacy.fitProjection(alias(row), meter, options); }
export function planIngestion(row, meter, options) { return legacy.planIngestion(alias(row), meter, options); }

export function loadSourceManifest(manifest, packageDirectory) {
  if (manifest?.schema_version !== "are.longmemeval-unexposed-source-manifest/v1" || manifest.selection_sha256 !== SELECTION_SHA256 || manifest.cohort_sha256 !== COHORT_SHA256 || manifest.manifest_sha256 !== SOURCE_MANIFEST_SHA256 || manifest.source_revision !== SOURCE_REVISION || manifest.source_sha256 !== SOURCE_SHA256 || manifest.acquisition_file_sha256 !== ACQUISITION_FILE_SHA256 || manifest.evaluator_files_present !== false || !Array.isArray(manifest.rows) || manifest.rows.length !== 4 || typeof packageDirectory !== "string") fail("unexposed-adapter.manifest-invalid");
  const material = {...manifest}; delete material.manifest_sha256;
  if (sha(material) !== manifest.manifest_sha256) fail("unexposed-adapter.manifest-digest-invalid");
  const root = resolve(packageDirectory);
  const acquisitionBytes = readFileSync(join(root, "acquisition.json"));
  if (sha(acquisitionBytes) !== ACQUISITION_FILE_SHA256) fail("unexposed-adapter.acquisition-file-drift");
  const acquisition = JSON.parse(acquisitionBytes), acquisitionMaterial = {...acquisition}; delete acquisitionMaterial.acquisition_sha256;
  if (acquisition.acquisition_sha256 !== ACQUISITION_SHA256 || sha(acquisitionMaterial) !== ACQUISITION_SHA256 || acquisition.status !== "verified-source-only-projection" || acquisition.upstream?.revision !== SOURCE_REVISION || acquisition.upstream?.sha256 !== SOURCE_SHA256 || acquisition.provider_calls !== 0 || acquisition.evaluation_references_emitted !== false || acquisition.selection_sha256 !== SELECTION_SHA256 || !Array.isArray(acquisition.selected) || acquisition.selected.length !== 4) fail("unexposed-adapter.acquisition-invalid");
  const rows = manifest.rows.map((binding, index) => {
    const acquired = acquisition.selected[index];
    if (binding.question_id !== IDS[index] || basename(binding.path) !== binding.path || !HASH.test(binding.file_sha256 ?? "") || !HASH.test(binding.source_row_sha256 ?? "") || acquired?.question_id !== binding.question_id || acquired.path !== binding.path || acquired.file_sha256 !== binding.file_sha256 || acquired.source_row_sha256 !== binding.source_row_sha256) fail("unexposed-adapter.row-binding-invalid");
    const path = join(root, binding.path), stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > 8 * 1024 * 1024) fail("unexposed-adapter.source-file-invalid");
    const bytes = readFileSync(path); if (sha(bytes) !== binding.file_sha256) fail("unexposed-adapter.source-file-drift");
    const row = JSON.parse(bytes); validateSourceRow(row); if (sha(row) !== binding.source_row_sha256) fail("unexposed-adapter.source-row-drift");
    return row;
  });
  return {rows, bindings: {selection_sha256: SELECTION_SHA256, cohort_sha256: COHORT_SHA256, manifest_sha256: manifest.manifest_sha256, acquisition_sha256: ACQUISITION_SHA256, extractor_sha256: EXTRACTOR_SHA256, source_revision: SOURCE_REVISION, source_sha256: SOURCE_SHA256, histories: rows.map((row) => ({question_id: row.question_id, archive_sha256: sha(flattenHistory(row))}))}, status: "source-bound-not-tokenizer-planned"};
}

export async function planConfirmation(rows, meter, options) {
  if (!Array.isArray(rows) || rows.length !== 4 || rows.some((row, index) => row.question_id !== IDS[index])) fail("unexposed-adapter.fixed-cohort-required");
  rows.forEach(validateSourceRow);
  const planned = await legacy.planConfirmation(rows.map(alias), meter, options);
  return {...planned, tasks: planned.tasks.map(restoreTask), selection_sha256: SELECTION_SHA256, cohort_sha256: COHORT_SHA256, source_manifest_sha256: SOURCE_MANIFEST_SHA256};
}
