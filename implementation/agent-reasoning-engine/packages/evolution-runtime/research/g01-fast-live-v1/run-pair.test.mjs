import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import test from "node:test";
import {runPair} from "./run-pair.mjs";

const sha = bytes => createHash("sha256").update(bytes).digest("hex");
const put = (path, value) => writeFileSync(path, JSON.stringify(value) + "\n");

function fixture(abstentionPolicy = false) {
  const root = mkdtempSync(join(tmpdir(), "g01-live-pair-")), arms = {};
  for (const name of ["control", "candidate"]) {
    const freeze_path = join(root, `${name.toUpperCase()}-FREEZE.json`);
    put(freeze_path, {schema_version: "are.g01-fast-live-freeze/v1", arm: name === "control" ? "intent-anchor-convergence-r3" : "intent-anchor-terminal-shortlist-cap12-r1",
      task_sha256: "a".repeat(64), config_sha256: "b".repeat(64), task_id: "contextbench-fresh", output_root: join(root, `${name}-attempt-01`)});
    arms[name] = {freeze_path, freeze_sha256: sha(readFileSync(freeze_path))};
  }
  const planPath = join(root, "PAIR-PLAN.json");
  put(planPath, {schema_version: "are.g01-fast-live-pair-plan/v1", status: "frozen-before-dispatch", root, arms,
    control_arm: "intent-anchor-convergence-r3", candidate_arm: "intent-anchor-terminal-shortlist-cap12-r1",
    scorer: {image: "are-contextbench-scorer:g01-r1", repo: root, upstream: root, cache: root},
    ...(abstentionPolicy ? {abstention_policy: "explicit-no-final-context-zero-r1"} : {}), claim_ceiling: "fixture-only"});
  return {root, planPath, planSha256: sha(readFileSync(planPath)), clean: () => rmSync(root, {recursive: true, force: true})};
}

test("pair runner dispatches in order, seals before scoring, and computes strict gates", async () => {
  const f = fixture(), order = [];
  try {
    const result = await runPair({planPath: f.planPath, planSha256: f.planSha256, signal: new AbortController().signal,
      runArm: async ({freezePath}) => {
        const freeze = JSON.parse(readFileSync(freezePath)), name = freeze.arm.includes("cap12") ? "candidate" : "control";
        order.push(name); const out = join(freeze.output_root, "runs", "00"); mkdirSync(out, {recursive: true});
        put(join(out, "prediction.json"), {arm: name}); put(join(out, "started.json"), {status: "started"});
        put(join(out, "result.json"), {status: "final_context_selected", receipts: [{kind: "model", input_tokens: name === "control" ? 100 : 50, output_tokens: 10}]});
        put(join(out, "completed.json"), {status: "final_context_selected"}); return {status: "final_context_selected"};
      },
      scoreArm: ({out}) => {
        assert.equal(JSON.parse(readFileSync(join(f.root, "PREDICTION-SEAL.json"))).scoring_status_at_seal, "not-started");
        const candidate = out.includes("candidate");
        put(join(out, "native-score.json"), {native: {final: {span: {coverage: candidate ? 0.5 : 0.1, precision: candidate ? 0.5 : 0.1},
          file: {coverage: candidate ? 0.5 : 0.1, precision: candidate ? 0.5 : 0.1}}}});
      }});
    assert.deepEqual(order, ["control", "candidate"]);
    assert.equal(result.status, "scored"); assert.equal(result.matched_gates.span_f1_improved, true);
    assert.equal(result.matched_gates.file_f1_improved, true); assert.equal(result.matched_gates.known_model_tokens_reduced, true);
    assert.equal(JSON.parse(readFileSync(join(f.root, "PAIR-RESULT.json"))).status, "scored");
  } finally { f.clean(); }
});

test("predeclared policy scores explicit no-final-context abstention as attempt-level zero", async () => {
  const f = fixture(true), scored = [];
  try {
    const result = await runPair({planPath: f.planPath, planSha256: f.planSha256, signal: new AbortController().signal,
      runArm: async ({freezePath}) => {
        const freeze = JSON.parse(readFileSync(freezePath)), control = freeze.arm === "intent-anchor-convergence-r3";
        const out = join(freeze.output_root, "runs", "00"); mkdirSync(out, {recursive: true});
        put(join(out, "started.json"), {status: "started"});
        put(join(out, "result.json"), {status: control ? "run_error" : "final_context_selected", error: control ? "instrument.no-final-context" : null,
          receipts: [{kind: "model", input_tokens: control ? 100 : 50, output_tokens: 10}]});
        if (!control) put(join(out, "prediction.json"), {arm: "candidate"});
        put(join(out, "completed.json"), {status: "completed"});
        return {status: control ? "run_error" : "final_context_selected", error: control ? "instrument.no-final-context" : null};
      },
      scoreArm: ({out}) => {
        assert.equal(JSON.parse(readFileSync(join(f.root, "PREDICTION-SEAL.json"))).scoring_status_at_seal, "not-started");
        scored.push(out);
        put(join(out, "native-score.json"), {native: {final: {span: {coverage: 0.5, precision: 0.5}, file: {coverage: 0.5, precision: 0.5}}}});
      }});
    assert.equal(result.status, "scored");
    assert.equal(result.metric_kind, "native-or-predeclared-abstention-zero");
    assert.equal(result.control.scoring_basis, "policy-abstention-zero");
    assert.equal(result.control.span_f1, 0);
    assert.equal(result.candidate.scoring_basis, "pinned-native");
    assert.equal(scored.length, 1);
    assert.ok(scored[0].includes("candidate"));
    assert.equal(result.matched_gates.span_f1_improved, true);
  } finally { f.clean(); }
});

test("predeclared policy does not turn other run errors into zero scores", async () => {
  const f = fixture(true);
  try {
    const result = await runPair({planPath: f.planPath, planSha256: f.planSha256, signal: new AbortController().signal,
      runArm: async ({freezePath}) => {
        const freeze = JSON.parse(readFileSync(freezePath)), out = join(freeze.output_root, "runs", "00");
        mkdirSync(out, {recursive: true}); put(join(out, "result.json"), {status: "run_error", error: "provider.timeout", receipts: []});
        return {status: "run_error", error: "provider.timeout"};
      }, scoreArm: () => { throw new Error("must-not-score"); }});
    assert.equal(result.status, "unscored");
  } finally { f.clean(); }
});

test("unscored arm still dispatches its pair but never opens native scoring", async () => {
  const f = fixture(), order = [];
  try {
    const result = await runPair({planPath: f.planPath, planSha256: f.planSha256, signal: new AbortController().signal,
      runArm: async ({freezePath}) => { order.push(JSON.parse(readFileSync(freezePath)).arm); return {status: "run_error", error: "fixture"}; },
      scoreArm: () => { throw new Error("must-not-score"); }});
    assert.equal(result.status, "unscored"); assert.equal(order.length, 2);
    assert.equal(JSON.parse(readFileSync(join(f.root, "PAIR-RESULT.json"))).status, "unscored");
  } finally { f.clean(); }
});
