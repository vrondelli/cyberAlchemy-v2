import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import * as legacy from "../adapter-note-v5.mjs";
import {IDS, answerMessages, flattenHistory, loadSourceManifest, planConfirmation, project, sha, validateSourceRow} from "./adapter-unexposed-v1.mjs";

const row = (question_id, question_type = "type") => ({question_id, question_type, question: "What changed?", question_date: "2024/01/01 (Mon) 10:00", haystack_dates: ["2023/01/01 (Sun) 10:00"], haystack_sessions: [[{role: "user", content: "source evidence"}, {role: "assistant", content: "reply"}]]});

test("new identities use unchanged source, projection and prompt algorithms", () => {
  for (const id of IDS) {
    const source = row(id); assert.equal(validateSourceRow(source), source);
    assert.equal(flattenHistory(source).length, 2); assert.equal(project(source).archive_sha256, sha(flattenHistory(source)));
    assert.equal(answerMessages(source, {arm: "treatment"})[2].content.includes("What changed?"), true);
  }
  assert.throws(() => validateSourceRow(row("09ba9854_abs")), /source-row-invalid/);
  assert.throws(() => validateSourceRow({...row(IDS[0]), answer: "gold"}), /source-row-invalid/);
});

test("manifest loader binds ordered immutable source files and excludes evaluator data", () => {
  const root = mkdtempSync(join(tmpdir(), "unexposed-adapter-")), rows = IDS.map((id, index) => row(id, `type-${index}`));
  const bindings = rows.map((source, order) => { const path = `source-${source.question_id}.json`; writeFileSync(join(root, path), `${JSON.stringify(source, null, 2)}\n`, {mode: 0o444}); return {order, question_id: source.question_id, question_type: source.question_type, source_row_sha256: sha(source), path, file_sha256: sha(readFileSync(join(root, path)))}; });
  const material = {schema_version: "are.longmemeval-unexposed-source-manifest/v1", source_revision: "x", source_sha256: "a".repeat(64), selection_sha256: "2232f5cb5a59e16e8d74ed474e18556e6eddd3cd074f2a90c60215854a8b9c18", cohort_sha256: "4f97a9e1f121fd7938ec266ba995552845696df803b7cb5fd852cfe02f56ceec", acquisition_file_sha256: "b".repeat(64), rows: bindings, evaluator_files_present: false, authority_effect: "none"};
  // The production manifest identity is deliberately non-overridable.
  assert.throws(() => loadSourceManifest({...material, manifest_sha256: sha(material)}, root), /manifest-invalid/);
});

test("facade planning is wire-for-wire equivalent after identity normalization", async () => {
  const rows = IDS.map((id, index) => row(id, `type-${index}`));
  const aliased = rows.map((source, index) => ({...source, question_id: legacy.IDS[index]}));
  const makeMeter = (log) => async (request) => { log.push(structuredClone(request)); return {input_tokens: 1000, wire_sha256: sha(request)}; };
  const legacyLog = [], facadeLog = [];
  const expected = await legacy.planConfirmation(aliased, makeMeter(legacyLog));
  const actual = await planConfirmation(rows, makeMeter(facadeLog));
  assert.deepEqual(facadeLog, legacyLog);
  const normalize = (value) => {
    const copy = structuredClone(value); delete copy.selection_sha256; delete copy.cohort_sha256; delete copy.source_manifest_sha256;
    const walk = (item) => { if (!item || typeof item !== "object") return; if (Array.isArray(item)) return item.forEach(walk); delete item.elapsed_ms; for (const [key, child] of Object.entries(item)) { if (key === "question_id") { const index = IDS.indexOf(child); if (index >= 0) item[key] = legacy.IDS[index]; } else walk(child); } };
    walk(copy); return copy;
  };
  assert.deepEqual(normalize(actual), normalize(expected));
  const serialized = JSON.stringify(actual);
  for (const oldId of legacy.IDS) assert.equal(serialized.includes(oldId), false);
});
