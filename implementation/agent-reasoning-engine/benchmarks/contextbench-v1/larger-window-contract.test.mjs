import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";

import {validateLargerWindowMatrix} from "./larger-window-contract.mjs";

const projectRoot = resolve(import.meta.dirname, "../../../..");
const research = resolve(projectRoot, "agent-reasoning-engine/research/contextbench-v1");
const matrix = JSON.parse(readFileSync(resolve(research, "larger-window-v1/round56-matrix.json")));
const confirmation = JSON.parse(readFileSync(resolve(research, "larger-window-v1/round57-matrix.json")));
const repairedConfirmation = JSON.parse(readFileSync(resolve(research, "larger-window-v1/round58-matrix.json")));
const conditionalDevelopment = JSON.parse(readFileSync(resolve(research, "larger-window-v1/round59-matrix.json")));
const selection = JSON.parse(readFileSync(resolve(research, "larger-window-v1/round56-task-selection.json")));
const round55 = JSON.parse(readFileSync(resolve(research, "round55-confirmation-matrix.json")));

test("Round 56 is an exact unchanged-H72 10K transfer matrix", () => {
  assert.deepEqual(validateLargerWindowMatrix(matrix), {ok: true, issues: [], authority_effect: "none"});
  const prior = new Set();
  for (const reference of selection.prior_matrix_refs) {
    const source = JSON.parse(readFileSync(resolve(projectRoot, reference.path)));
    for (const task of source.tasks) prior.add(task.instance_id);
  }
  assert.equal(selection.tasks.some((task) => prior.has(task.instance_id)), false);
  assert.equal(selection.tasks.every((task) => task.prior_exposure === "none-in-recorded-contextbench-matrices" && task.sealed_scoreable === true), true);
});

test("Round 57 is an exact fresh unchanged-H72 10K confirmation matrix", () => {
  assert.deepEqual(validateLargerWindowMatrix(confirmation, 10000, "10k-confirmation"), {ok: true, issues: [], authority_effect: "none"});
  const developmentIds = new Set(matrix.tasks.map((task) => task.instance_id));
  assert.equal(confirmation.tasks.some((task) => developmentIds.has(task.instance_id)), false);
});

test("Round 58 repair uses fresh identities and its own cell namespace", () => {
  assert.deepEqual(validateLargerWindowMatrix(repairedConfirmation, 10000, "10k-confirmation"), {ok: true, issues: [], authority_effect: "none"});
  const priorIds = new Set([...matrix.tasks, ...confirmation.tasks].map((task) => task.instance_id));
  assert.equal(repairedConfirmation.tasks.some((task) => priorIds.has(task.instance_id)), false);
  assert.equal(repairedConfirmation.cells.every((cell) => cell.cell_id.startsWith("r58-")), true);
  assert.equal(repairedConfirmation.predecessor_ref, "round57-interruption-audit.json");
});

test("Round 59 preregisters fresh prefix-only three-handle conditional activation", () => {
  assert.deepEqual(validateLargerWindowMatrix(conditionalDevelopment, 10000, "10k-conditional-development", "LW-H3a"), {ok: true, issues: [], authority_effect: "none"});
  const priorIds = new Set([...matrix.tasks, ...confirmation.tasks, ...repairedConfirmation.tasks].map((task) => task.instance_id));
  assert.equal(conditionalDevelopment.tasks.some((task) => priorIds.has(task.instance_id)), false);
  assert.equal(conditionalDevelopment.cells.every((cell) => cell.cell_id.startsWith("r59-")), true);
  assert.equal(conditionalDevelopment.predecessor_ref, "round58-reviewed-decision.json");
  assert.equal(conditionalDevelopment.branches.filter((row) => row.state_arm === "state").every((row) => row.limits.decision_state_handle_activation_minimum === 3), true);
});

test("Round 59 conditional activation mutations are rejected together", () => {
  const corrupted = structuredClone(conditionalDevelopment);
  corrupted.branches.find((row) => row.state_arm === "state").limits.decision_state_handle_activation_minimum = 2;
  corrupted.success_criteria.inactive_prompt_equivalent_to_control = false;
  corrupted.success_criteria.activation_receipt_required = false;
  const result = validateLargerWindowMatrix(corrupted, 10000, "10k-conditional-development", "LW-H3a");
  assert.equal(result.ok, false);
  assert.equal(result.issues.some((issue) => issue.endsWith(".decision-state-handle-activation")), true);
  assert.ok(result.issues.includes("matrix.inactive-control-parity"));
  assert.ok(result.issues.includes("matrix.activation-receipt"));
});

test("the only policy change from Round 55 is the registered window and cell identity", () => {
  const normalize = (cell) => ({
    arm: cell.arm,
    provider_profile: cell.provider_profile,
    repetition: cell.repetition,
    limits: cell.limits,
    cell_kind: cell.cell_kind,
    state_arm: cell.state_arm,
    order_in_pair: cell.order_in_pair ?? null,
  });
  assert.deepEqual(normalize(matrix.prefixes[0]), normalize(round55.prefixes[0]));
  assert.deepEqual(normalize(matrix.branches.find((row) => row.state_arm === "control")), normalize(round55.branches.find((row) => row.state_arm === "control")));
  assert.deepEqual(normalize(matrix.branches.find((row) => row.state_arm === "state")), normalize(round55.branches.find((row) => row.state_arm === "state")));
});

test("the larger-window validator reports every independently corrupted contract field", () => {
  const corrupted = structuredClone(matrix);
  corrupted.cells[0].context_limit = 9999;
  corrupted.cells[1].recycle_at = 8999;
  corrupted.cells[2].limits.output_cap = 4096;
  corrupted.cells.find((row) => row.state_arm === "state").limits.decision_state_handles = false;
  corrupted.physical_call_ceiling.total_model_calls = 785;
  corrupted.success_criteria.minimum_complete_pairs = 5;
  const result = validateLargerWindowMatrix(corrupted);
  assert.equal(result.ok, false);
  assert.equal(result.issues.some((issue) => issue.endsWith(".context-limit")), true);
  assert.equal(result.issues.some((issue) => issue.endsWith(".recycle-at")), true);
  assert.equal(result.issues.some((issue) => issue.endsWith(".token-policy")), true);
  assert.equal(result.issues.some((issue) => issue.endsWith(".decision-state-handles")), true);
  assert.ok(result.issues.includes("matrix.physical-call-ceiling"));
  assert.ok(result.issues.includes("matrix.minimum-pairs"));
});
