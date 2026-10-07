// Deterministic source-only expansion from the frozen 32-row qualification window.
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {join, resolve} from "node:path";
import {sha256} from "./extract-selected-source-v1.mjs";

const [bundlePath, queuePath, outputPath] = process.argv.slice(2);
assert.ok(bundlePath && queuePath && outputPath, "usage: fast-cohort-extract-v1.mjs BUNDLE QUEUE NEW_OUTPUT_DIR");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const bundleBytes = readFileSync(resolve(bundlePath)), queueBytes = readFileSync(resolve(queuePath));
assert.equal(hash(bundleBytes), "0827ac6814a63ab4c840c911d4ead43551c0f39c54b81ad78a840906c854aa81");
assert.equal(hash(queueBytes), "145236349ea9ac4cccec0d4fe36dc5f744c7ccda43ae650428012f0038b9ffb1");
const bundle = JSON.parse(bundleBytes), queue = JSON.parse(queueBytes);
assert.equal(bundle.schema_version, "are.longmemeval-qualification-source-bundle/v1");
assert.equal(queue.schema_version, "are.longmemeval-unexposed-candidate-queue/v2");
assert.equal(bundle.queue_sha256, queue.queue_sha256);
assert.equal(bundle.evaluator_fields_emitted, false);
assert.equal(queue.selection_uses_evaluator_data, false);
assert.deepEqual(bundle.fields, ["question_id", "question_type", "question", "question_date", "haystack_dates", "haystack_sessions"]);
assert.equal(bundle.rows.length, 32); assert.equal(queue.qualification_window.length, 32);
const excluded = new Set(["0e4e4c46", "gpt4_5438fa52", "ef66a6e5", "0862e8bf_abs", ...queue.exposed_ids]);
const selected = queue.qualification_window.filter(entry => !excluded.has(entry.question_id)).slice(0, 16);
assert.equal(selected.length, 16); assert.equal(new Set(selected.map(entry => entry.question_id)).size, 16);
const byId = new Map(bundle.rows.map(row => [row.question_id, row]));
const rows = selected.map(entry => {
  const row = byId.get(entry.question_id);
  assert.ok(row, `${entry.question_id}:missing-source-row`);
  assert.deepEqual(Object.keys(row).sort(), [...bundle.fields].sort());
  assert.equal(sha256(row), entry.source_row_sha256);
  assert.equal(row.question_type, entry.question_type);
  return row;
});
const output = resolve(outputPath);
mkdirSync(output, {recursive: false, mode: 0o700});
const write = (name, value) => {
  const bytes = Buffer.from(`${JSON.stringify(value)}\n`);
  writeFileSync(join(output, name), bytes, {flag: "wx", mode: 0o400});
  return {file_sha256: hash(bytes), bytes: bytes.length};
};
const bindings = rows.map((row, index) => {
  const path = `source-${row.question_id}.json`, file = write(path, row);
  return {index, question_id: row.question_id, question_type: row.question_type, source_row_sha256: sha256(row), path, ...file};
});
const manifest = {schema_version: "are.longmemeval-fast-cohort-source/v1", source_revision: "98d7416c24c778c2fee6e6f3006e7a073259d48f",
  source_sha256: "d6f21ea9d60a0d56f34a05b609c79c88a451d2ae03597821ea3d5a9678c3a442",
  bundle_file_sha256: hash(bundleBytes), queue_file_sha256: hash(queueBytes), queue_sha256: queue.queue_sha256,
  selection_rule: "first 16 frozen qualification-window entries excluding queue.exposed_ids and prior four-question G03 cohort",
  question_ids: selected.map(entry => entry.question_id), rows: bindings, evaluator_fields_emitted: false, provider_calls: 0,
  authority_effect: "none"};
const manifestFile = write("manifest.json", manifest);
console.log(JSON.stringify({status: "extracted", rows: rows.length, question_ids: manifest.question_ids, manifest_file_sha256: manifestFile.file_sha256}));
