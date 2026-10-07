import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {applyLiveSpanRefinement} from "./orchestrate-intent-anchor-r3.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const task = "feat #4248 Add support for line range browse\n\nAllow using a range of lines when browsing files.";
const original = path => ({selection: {kind: "fixture"}, prediction: {instance_id: "fixture", traj_data: {
  pred_files: [path], pred_spans: {[path]: [{start: 1, end: 184}]}, pred_steps: []}}});

test("live finalization records a source-only receipt and retains original export", () => {
  const root = mkdtempSync(join(tmpdir(), "g01-live-refinement-"));
  try {
    mkdirSync(join(root, "pkg"));
    const lines = Array.from({length: 184}, () => "unrelated implementation");
    lines[24] = "func runBrowse() error {";
    lines[160] = "return Browser.Browse(url)";
    lines[166] = "func parseFileArg(fileArg string) (string,error) {";
    lines[172] = "if !isLineNumber(arr[1]) {";
    const bytes = Buffer.from(`${lines.join("\n")}\n`);
    writeFileSync(join(root, "pkg", "browse.go"), bytes);
    const input = original("pkg/browse.go"), result = applyLiveSpanRefinement({original: input, problem_statement: task,
      task_sha256: "a".repeat(64), source_base: root});
    assert.equal(result.receipt.changes.length, 1);
    assert.equal(result.receipt.source_sha256_by_path["pkg/browse.go"], sha(bytes));
    assert.equal(result.receipt.source_only, true);
    assert.equal(result.exported.span_refinement, result.receipt);
    assert.deepEqual(input.prediction.traj_data.pred_spans["pkg/browse.go"], [{start: 1, end: 184}]);
    const span = result.exported.prediction.traj_data.pred_spans["pkg/browse.go"][0];
    assert.ok(span.start <= 167 && span.end >= 174);
    assert.equal(span.end - span.start + 1, 32);
    assert.deepEqual(result.exported.prediction.traj_data.pred_files, input.prediction.traj_data.pred_files);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("live finalization rejects symlinks escaping the pinned base checkout", () => {
  const root = mkdtempSync(join(tmpdir(), "g01-live-refinement-"));
  const outside = mkdtempSync(join(tmpdir(), "g01-live-refinement-outside-"));
  try {
    writeFileSync(join(outside, "browse.go"), "unrelated\n".repeat(184));
    symlinkSync(join(outside, "browse.go"), join(root, "browse.go"));
    assert.throws(() => applyLiveSpanRefinement({original: original("browse.go"), problem_statement: task,
      task_sha256: "a".repeat(64), source_base: root}), /refinement-source-escape/);
  } finally { rmSync(root, {recursive: true, force: true}); rmSync(outside, {recursive: true, force: true}); }
});
