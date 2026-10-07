import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {extractSelectedSource, sha256} from "./extract-selected-source-v1.mjs";

const row = (id, type) => ({question_id: id, question_type: type, question: "q", question_date: "2024/01/01 (Mon) 00:00", haystack_dates: ["2023/01/01 (Sun) 00:00"], haystack_sessions: [[{role: "user", content: "source"}]]});
function fixture() {
  const rows = [row("00000100", "a"), row("00000101", "b"), row("00000102", "c"), row("00000103", "d")];
  const bundle = {schema_version: "are.longmemeval-qualification-source-bundle/v1", queue_sha256: "a".repeat(64), fields: ["question_id", "question_type", "question", "question_date", "haystack_dates", "haystack_sessions"], rows, evaluator_fields_emitted: false, authority_effect: "none", bundle_sha256: "b".repeat(64)};
  const tasks = rows.map((item) => ({question_id: item.question_id, question_type: item.question_type, source_row_sha256: sha256(item)}));
  const selection = {schema_version: "are.longmemeval-qualified-cohort-selection/v1", cohort: {cohort_size: 4, cohort_sha256: "c".repeat(64), tasks}, selection_provider_calls: 0, evaluator_fields_accessed: false, selection_sha256: "d".repeat(64)};
  const bundleBytes = Buffer.from(`${JSON.stringify(bundle)}\n`), selectionBytes = Buffer.from(`${JSON.stringify(selection)}\n`);
  return {bundleBytes, selectionBytes, bindings: {bundle_file_sha256: sha256(bundleBytes), selection_file_sha256: sha256(selectionBytes), bundle_sha256: bundle.bundle_sha256, queue_sha256: bundle.queue_sha256, selection_sha256: selection.selection_sha256, cohort_sha256: selection.cohort.cohort_sha256, source_revision: "e".repeat(40), source_sha256: "f".repeat(64)}};
}

test("extracts exactly four source-only rows and publishes a bound manifest", () => {
  const root = mkdtempSync(join(tmpdir(), "are-source-extract-")), {bundleBytes, selectionBytes, bindings} = fixture();
  const bundle = join(root, "bundle.json"), selection = join(root, "selection.json"), output = join(root, "source");
  writeFileSync(bundle, bundleBytes); writeFileSync(selection, selectionBytes);
  const result = extractSelectedSource(bundle, selection, output, bindings);
  assert.equal(result.rows, 4); assert.equal(result.provider_calls, 0);
  const manifest = JSON.parse(readFileSync(join(output, "manifest.json")));
  assert.equal(manifest.rows.length, 4); assert.equal(manifest.evaluator_files_present, false);
  assert.deepEqual(manifest.rows.map((item) => item.question_id), ["00000100", "00000101", "00000102", "00000103"]);
  assert.throws(() => extractSelectedSource(bundle, selection, output, bindings), /output-exists/);
});

test("fails closed on file drift and evaluator-field smuggling", () => {
  const root = mkdtempSync(join(tmpdir(), "are-source-extract-")), {bundleBytes, selectionBytes, bindings} = fixture();
  const bundle = join(root, "bundle.json"), selection = join(root, "selection.json");
  writeFileSync(bundle, Buffer.concat([bundleBytes, Buffer.from(" ")])); writeFileSync(selection, selectionBytes);
  assert.throws(() => extractSelectedSource(bundle, selection, join(root, "drift"), bindings), /bundle-file-drift/);
  const parsed = JSON.parse(bundleBytes); parsed.rows[0].answer = "gold"; const poisoned = Buffer.from(`${JSON.stringify(parsed)}\n`);
  writeFileSync(bundle, poisoned);
  assert.throws(() => extractSelectedSource(bundle, selection, join(root, "poisoned"), {...bindings, bundle_file_sha256: sha256(poisoned)}), /row-binding-invalid/);
});
