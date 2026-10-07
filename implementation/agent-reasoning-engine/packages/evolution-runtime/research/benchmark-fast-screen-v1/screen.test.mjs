import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";
import {screenDiscoveryResult, screenPairedRows} from "./screen.mjs";

const source = resolve(import.meta.dirname, "../../../../../../development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/discovery-v1/LIVE-RESULTS.json");

test("historical paired run retains the full denominator and exposes both failed gates", () => {
  const input = JSON.parse(readFileSync(source, "utf8"));
  const result = screenDiscoveryResult(input, {objective: "ContextBench quality and cost", hypothesis: "discovery retention", thresholds: {minimum_primary_gain: 0.05, minimum_token_reduction: 0.15}});
  assert.equal(result.decision, "reject");
  assert.equal(result.totals.control.total_tokens, 323196);
  assert.equal(result.totals.treatment.total_tokens, 282354);
  assert.equal(result.gates.primary_gain, true);
  assert.equal(result.gates.secondary_nonregression, false);
  assert.equal(result.gates.token_reduction, false);
  assert.equal(result.gates.elapsed, null);
});

test("missing and duplicate assigned arms cannot yield a passing screen", () => {
  const row = (task_id, arm) => ({task_id, arm, valid: true, metrics: {accuracy: 1}, total_tokens: 10, unknown_usage: false, elapsed_ms: 5});
  const args = {objective: "memory", hypothesis: "projection", task_ids: ["a", "b"], primary_metric: "accuracy", rows: [row("a", "control"), row("a", "treatment"), row("b", "control"), row("b", "treatment")]};
  assert.equal(screenPairedRows({...args, source_sha256: "a".repeat(64)}).decision, "candidate-for-confirmation");
  assert.equal(screenPairedRows(args).decision, "needs-source-binding");
  assert.throws(() => screenPairedRows({...args, rows: [args.rows[0], args.rows[0], ...args.rows.slice(2)]}), /duplicate-row/);
  assert.throws(() => screenPairedRows({...args, rows: args.rows.slice(0, 3)}), /row-denominator/);
  assert.throws(() => screenPairedRows({...args, thresholds: {minimum_token_reduction: -1}}), /thresholds/);
  assert.equal(screenPairedRows({...args, rows: args.rows.map((item, index) => index === 1 ? {...item, unknown_usage: true} : item)}).decision, "reject");
});
