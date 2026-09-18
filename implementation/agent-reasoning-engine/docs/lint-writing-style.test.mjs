import assert from "node:assert/strict";
import {mkdtempSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {lintWritingStyle} from "./lint-writing-style.mjs";

const policy = {
  scope: {mode: "test"},
  limits: {description_sentence_words: 25, instruction_sentence_words: 20, paragraph_sentences: 6},
  compliance_claim: "test claim"
};

function lint(text) {
  const directory = mkdtempSync(join(tmpdir(), "are-writing-style-"));
  const path = join(directory, "fixture.md");
  writeFileSync(path, text);
  return lintWritingStyle({files: [path], policy});
}

test("accepts short controlled prose and preserves modality", () => {
  const report = lint("# Test\n\nThe request may have failed. Check the receipt.\n");
  assert.equal(report.status, "PASS");
  assert.equal(report.hard_finding_count, 0);
});

test("ignores code, tables, and link targets", () => {
  const report = lint("# Test\n\n`left; right` and [label](https://example.com/a;b).\n\n| A; B |\n| --- |\n\n```js\nconst x = 1;\n```\n");
  assert.equal(report.status, "PASS");
});

test("rejects hard structural and vocabulary findings", () => {
  const report = lint("# Test\n\nSpin up the robust service; it could possibly work.\n");
  assert.equal(report.status, "FAIL");
  assert.deepEqual(new Set(report.hard_findings.map(item => item.rule)), new Set([
    "no-semicolon",
    "no-marketing-adjective",
    "no-soft-phrasal-verb",
    "no-hedge-stack"
  ]));
});

test("applies the shorter limit to imperative instructions", () => {
  const report = lint("# Test\n\nCheck one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty.\n");
  assert.equal(report.status, "FAIL");
  assert.equal(report.hard_findings[0].rule, "instruction-sentence-length");
});

test("reports passive voice for review without failing", () => {
  const report = lint("# Test\n\nThe result is recorded.\n");
  assert.equal(report.status, "PASS");
  assert.equal(report.review_findings[0].rule, "prefer-active-voice");
});
