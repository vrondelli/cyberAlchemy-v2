import assert from "node:assert/strict";
import {spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";

const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const put = (path, value) => { writeFileSync(path, JSON.stringify(value) + "\n"); return readFileSync(path); };

test("r4 analysis counts provider refusal as two incorrect answers and limits efficiency to answered pairs", () => {
  const dir = mkdtempSync(join(tmpdir(), "g03-r4-analysis-"));
  const generationDir = join(dir, "generation"), scoreDir = join(dir, "score");
  mkdirSync(generationDir); mkdirSync(scoreDir);
  const ids = Array.from({length: 80}, (_, index) => `q${String(index).padStart(2, "0")}`);
  const types = ["knowledge-update", "multi-session", "single-session-assistant", "single-session-preference", "single-session-user", "temporal-reasoning"];
  const sourcePath = join(dir, "source.json");
  const sourceBytes = put(sourcePath, {question_ids: ids, rows: ids.map((id, index) => ({question_id: id, question_type: types[index % 6]}))});
  const generationRunPath = join(generationDir, "RUN.json");
  put(generationRunPath, {schema_version: "are.longmemeval-product-replication-paired-run/v2", source_manifest_file_sha256: hash(sourceBytes)});
  const results = ids.map((id, index) => index === 0
    ? {question_id: id, status: "provider-refused", unknown_usage: false, refusal: {provider_error_code: "1301"}}
    : {question_id: id, status: "completed", unknown_usage: false, arm_elapsed_ms: {control: 10, treatment: 5},
      calls: [{arm: "control", status: "completed", usage: {total_tokens: 10}}, {arm: "treatment", status: "completed", usage: {total_tokens: 5}}]});
  const generationPath = join(generationDir, "RESULT.json");
  const generationBytes = put(generationPath, {status: "completed", terminal_count: 80, completed: 79, provider_refused: 1,
    unknown_usage: false, question_ids: ids, results});
  const scoreRunPath = join(scoreDir, "RUN.json");
  put(scoreRunPath, {schema_version: "are.longmemeval-product-replication-score-run/v2",
    generation_result_sha256: hash(generationBytes), cohort_manifest_sha256: hash(sourceBytes), planned_judgments: 158});
  const judgments = ids.slice(1).flatMap(id => [
    {question_id: id, arm: "control", correct: false, valid: true, usage: {total_tokens: 2}, elapsed_ms: 2},
    {question_id: id, arm: "treatment", correct: true, valid: true, usage: {total_tokens: 1}, elapsed_ms: 1},
  ]);
  const scorePath = join(scoreDir, "RESULT.json");
  put(scorePath, {schema_version: "are.longmemeval-product-replication-score-result/v2", status: "completed",
    question_ids: ids, judgments, provider_refused: 1, fixed_incorrect_question_ids: [ids[0]], valid_judgments: 158});
  const outputPath = join(dir, "analysis.json");
  const run = spawnSync(process.execPath, [new URL("./analyze-product-longmemeval-r4.mjs", import.meta.url).pathname,
    sourcePath, generationPath, scorePath, outputPath], {encoding: "utf8"});
  assert.equal(run.status, 0, run.stderr);
  const analysis = JSON.parse(readFileSync(outputPath));
  assert.equal(analysis.provider_refused, 1);
  assert.equal(analysis.answered_pairs, 79);
  assert.equal(analysis.point.treatment_accuracy, 79 / 80);
  assert.equal(analysis.point.control_accuracy, 0);
  assert.equal(analysis.point.token_ratio, 6 / 12);
  assert.equal(analysis.point.time_ratio, 6 / 12);
  assert.equal(analysis.directional_product_headline_admissible, false);
});
