import assert from "node:assert/strict";
import test from "node:test";
import {analyzeRows} from "./analyze-g01-r11.mjs";

const seed = "adbaaf8355c8887a18e31360858780fd395a5dfd1cd8838c6a83a5ae10a0e89f";
const rows = Array.from({length: 15}, (_, repoIndex) =>
  Array.from({length: repoIndex < 9 ? 2 : 1}, (_, member) => ({
    slug: `r${repoIndex}-${member}`, origin: `https://example.org/origin-${repoIndex}`,
    repo: repoIndex === 8 ? (member === 0 ? "mui/material" : "mui/material-ui") : `repo-${repoIndex}`,
    control: {span_f1: 0.1, file_f1: 0.2, known_model_tokens: 100, duration_seconds: 10},
    candidate: {span_f1: 0.3, file_f1: 0.4, known_model_tokens: 50, duration_seconds: 5}
  }))).flat();

test("r11 fixed-stratum paired intervals are deterministic and pass clear wins", () => {
  const first = analyzeRows(rows, seed, 200);
  assert.deepEqual(first, analyzeRows(rows, seed, 200));
  assert.equal(first.strata, 15);
  assert.equal(first.all_numeric_gates_pass, true);
  assert.ok(first.intervals.span_f1_difference[0] > 0);
  assert.ok(first.intervals.file_f1_difference[0] > 0);
  assert.ok(first.intervals.token_ratio[1] < 1);
  assert.ok(first.intervals.time_ratio[1] < 1);
});

test("r11 does not pass quality ties or an incomplete denominator", () => {
  const tied = rows.map(row => ({...row, candidate: {...row.candidate,
    span_f1: row.control.span_f1, file_f1: row.control.file_f1}}));
  const analysis = analyzeRows(tied, seed, 200);
  assert.equal(analysis.gates.span_f1_lower_above_zero, false);
  assert.equal(analysis.gates.file_f1_lower_above_zero, false);
  assert.equal(analysis.all_numeric_gates_pass, false);
  assert.throws(() => analyzeRows(rows.slice(1), seed, 200), /analysis-arguments/);
});

test("r12 uses its frozen 16-origin, 24-task stratum shape", () => {
  const r12Rows = Array.from({length: 16}, (_, repoIndex) =>
    Array.from({length: repoIndex < 8 ? 2 : 1}, (_, member) => ({
      ...rows[0], slug: `r12-${repoIndex}-${member}`,
      origin: `https://example.org/r12-origin-${repoIndex}`
    }))).flat();
  const result = analyzeRows(r12Rows, seed, 200, 16);
  assert.equal(result.strata, 16);
  assert.equal(result.all_numeric_gates_pass, true);
  assert.throws(() => analyzeRows(r12Rows, seed, 200, 15), /repository-strata/);
});
