// Generic source-only facade for the 80-question product replication cohort.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {readFileSync, lstatSync} from "node:fs";
import {basename, join, resolve} from "node:path";
import * as legacy from "../adapter-note-v5.mjs";

const rawHash = bytes => createHash("sha256").update(bytes).digest("hex");
const ALIAS_ID = legacy.IDS[0];
const FIELDS = ["question_id", "question_type", "question", "question_date", "haystack_dates", "haystack_sessions"];
export const sha = legacy.sha;
export const admission = legacy.admitActualWire;
export const ingestionMessages = legacy.ingestionMessages;
export const wire = legacy.wire;

export function loadCohort(directory) {
  const root = resolve(directory), manifestBytes = readFileSync(join(root, "manifest.json")), manifest = JSON.parse(manifestBytes);
  assert.equal(manifest.schema_version, "are.longmemeval-product-replication-source/v1");
  assert.equal(manifest.evaluator_fields_emitted, false);
  assert.equal(manifest.source_sha256, "d6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442");
  assert.equal(manifest.rows.length, 80); assert.deepEqual(manifest.question_ids, manifest.rows.map(row => row.question_id));
  assert.equal(new Set(manifest.question_ids).size, 80);
  const rows = manifest.rows.map(binding => {
    assert.equal(basename(binding.path), binding.path); assert.equal(binding.path, `source-${binding.question_id}.json`);
    const path = join(root, binding.path), stat = lstatSync(path);
    assert.ok(stat.isFile() && !stat.isSymbolicLink() && stat.size < 8 * 1024 * 1024);
    const bytes = readFileSync(path); assert.equal(bytes.length, binding.bytes); assert.equal(rawHash(bytes), binding.file_sha256);
    const row = JSON.parse(bytes); assert.deepEqual(Object.keys(row).sort(), [...FIELDS].sort());
    assert.equal(row.question_id, binding.question_id); assert.equal(row.question_type, binding.question_type);
    legacy.validateSourceRow({...row, question_id: ALIAS_ID});
    return row;
  });
  return {rows, manifest, manifest_file_sha256: rawHash(manifestBytes)};
}

const alias = row => ({...row, question_id: ALIAS_ID});
export const flattenHistory = row => legacy.flattenHistory(alias(row));
export const project = (row, limit = 5000) => legacy.project(alias(row), limit);
export const answerMessages = (row, options) => legacy.answerMessages(alias(row), options);
export const planIngestion = (row, meter, options) => legacy.planIngestion(alias(row), meter, options);
