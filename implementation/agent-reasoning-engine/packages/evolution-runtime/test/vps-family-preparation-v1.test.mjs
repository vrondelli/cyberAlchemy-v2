import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import test from "node:test";

import {
  createBenchmarkFamilyValidators,
  materializeBenchmarkCampaign,
} from "../vps-benchmark-v1.mjs";
import {
  materializeVpsFamilyPreparation,
  verifyVpsFamilyPreparation,
  verifyVpsFamilyPreparationEvidence,
} from "../vps-family-preparation-v1.mjs";

const hash = (value) => createHash("sha256").update(value).digest("hex");
const limits = (tokens = 1000) => ({maximum_workers: 1, maximum_tokens: tokens, maximum_cost: 100, maximum_elapsed_seconds: 1800});

function campaign(family, familyPolicy, taskRefs = ["task:a"]) {
  return materializeBenchmarkCampaign({campaign_ref: `campaign:${family}:preparation`, family, model_ref: "glm-5.3-flash", work_items: taskRefs.map((task_ref, index) => ({task_ref, source_ref: `source:${family}:${index}`})), source_bindings: taskRefs.map((_, index) => ({source_ref: `source:${family}:${index}`, sha256: hash(`${family}:${index}`)})), budgets: limits(), comparison_posture: "prospective", family_policy: familyPolicy});
}

const contextPolicy = {candidate_only: true, context_window: 8000, task_ids: [1, 4], historical_comparison_hashes: [hash("history")], thresholds: {task_1_span_f1_gt: 0, mean_span_f1_gt: 0.07327183777122158, task_4_span_f1_gte: 0.12654367554244316}, explicit_new_budgets: true};
const dshAreOnlyPolicy = {campaign_mode: "are-only-qualification", output_token_cap: 8192, executed_tool_call_ceiling: 8, matched_comparison: false, timer_scope: "request", response_recovery_candidate: true, qualifications: {native_subprocess: false, glm_profile: false, token_boundary: false, durable_accounting: false, benchmark_adapter: false}, benchmark_ready: false};
const longMemPolicy = {full_history_source_pinned: true, source_only_manifest: true, unexposed_cohort: true, exposed_ids_excluded: true, original_history_tokenizer_qualified: false, sealed_evaluator: true, confirmation_adapter: false, paired_task_denominator: 4, comparison_decided: false, explicit_budgets: false};

function input() {
  return {
    preparation_ref: "preparation:g01-g03",
    preflight_digest: hash("preflight"),
    evidence_bindings: [
      {family: "contextbench", role: "hypothesis-selection", path: "evidence/hen-11.json", sha256: hash("hen")},
      {family: "are-dsh", role: "round-78", path: "evidence/dsh-78.json", sha256: hash("dsh")},
      {family: "longmemeval", role: "source-s", path: "evidence/source-s.json", sha256: hash("long")},
    ],
    lanes: [
      {gate_ref: "G01", family: "contextbench", campaign_ref: "campaign:contextbench:preparation", planned_work_items: ["task:contextbench-1", "task:contextbench-4"], campaign: campaign("contextbench", contextPolicy, ["task:contextbench-1", "task:contextbench-4"]), prerequisites: {candidate_tests: false, explicit_new_budgets: true, historical_bindings: true, independent_review: false}, evidence_refs: ["evidence/hen-11.json"], runner: {entrypoint_ref: "runner:contextbench", status: "missing", source_hashes: []}, proposed_limits: {maximum_calls: 192, maximum_workers: 2, maximum_tokens: 192000, maximum_cost: 100, maximum_elapsed_seconds: 14400}},
      {gate_ref: "G02", family: "are-dsh", campaign_ref: "campaign:are-dsh:preparation", planned_work_items: ["task:contextbench-2"], campaign: campaign("are-dsh", dshAreOnlyPolicy, ["task:contextbench-2"]), prerequisites: {response_recovery_candidate: false, native_subprocess: false, glm_profile: false, token_boundary: false, durable_accounting: false, benchmark_adapter: false}, evidence_refs: ["evidence/dsh-78.json"], runner: {entrypoint_ref: "runner:are-dsh", status: "missing", source_hashes: []}, proposed_limits: {maximum_calls: 96, maximum_workers: 1, maximum_tokens: 4000000, maximum_cost: 100, maximum_elapsed_seconds: 1800}},
      {gate_ref: "G03", family: "longmemeval", campaign_ref: "campaign:longmemeval:preparation", planned_work_items: ["task:unexposed-cohort-pending"], campaign: null, prerequisites: {full_history_source: true, unexposed_cohort: false, tokenizer_qualification: false, confirmation_adapter: false, comparison_decision: false, cohort_and_budget_freeze: false}, evidence_refs: ["evidence/source-s.json"], runner: {entrypoint_ref: "runner:longmemeval", status: "missing", source_hashes: []}, proposed_limits: null},
    ],
  };
}

test("DSH validator separates ARE-only qualification from matched confirmation", () => {
  const validators = createBenchmarkFamilyValidators();
  assert.equal(validators["are-dsh"](campaign("are-dsh", dshAreOnlyPolicy)).ok, true);
  const matched = {...dshAreOnlyPolicy, campaign_mode: "matched-confirmation", matched_comparison: true, benchmark_ready: true, qualifications: {native_subprocess: true, glm_profile: true, token_boundary: true, durable_accounting: true, benchmark_adapter: true}};
  assert.equal(validators["are-dsh"](campaign("are-dsh", matched)).ok, true);
  assert.ok(validators["are-dsh"](campaign("are-dsh", {...matched, matched_comparison: false})).reason_codes.includes("are-dsh.matched-comparison-required"));
});

test("three-family preparation is deterministic, closed and non-runnable", () => {
  const value = materializeVpsFamilyPreparation(input());
  assert.equal(verifyVpsFamilyPreparation(value).ok, true);
  assert.equal(value.live_dispatch_admitted, false);
  assert.deepEqual(value.lanes.map((lane) => lane.gate_ref), ["G01", "G02", "G03"]);
  assert.equal(value.lanes.every((lane) => lane.bundle_preparable === false), true);
  assert.deepEqual(value.lanes.find((lane) => lane.family === "contextbench").prelaunch_state.missing_prerequisites, ["candidate_tests", "independent_review"]);
  assert.deepEqual(value.lanes.find((lane) => lane.family === "longmemeval").planned_work_items, ["task:unexposed-cohort-pending"]);
  assert.ok(value.lanes.find((lane) => lane.family === "longmemeval").prelaunch_state.missing_prerequisites.includes("unexposed_cohort"));
  assert.deepEqual(value.lanes.find((lane) => lane.family === "longmemeval").family_validation.reason_codes, ["benchmark-campaign.not-materialized"]);
  assert.equal(materializeVpsFamilyPreparation(input()).preparation_digest, value.preparation_digest);
  assert.equal(verifyVpsFamilyPreparation({...value, live_dispatch_admitted: true}).ok, false);
});

test("preparation evidence verification fails closed on changed or unreadable bytes", () => {
  const value = materializeVpsFamilyPreparation(input());
  const bytes = new Map([["hen", Buffer.from("hen")], ["dsh", Buffer.from("dsh")], ["long", Buffer.from("long")]]);
  const key = (path) => path.includes("hen-11") ? "hen" : path.includes("dsh-78") ? "dsh" : "long";
  assert.equal(verifyVpsFamilyPreparationEvidence(value, {readFile: (path) => bytes.get(key(String(path)))}).ok, true);
  bytes.set("dsh", Buffer.from("changed"));
  const changed = verifyVpsFamilyPreparationEvidence(value, {readFile: (path) => bytes.get(key(String(path)))});
  assert.equal(changed.ok, false);
  assert.equal(changed.mismatches[0].reason, "sha256-mismatch");
  assert.equal(verifyVpsFamilyPreparationEvidence(value, {readFile: () => { throw new Error("missing"); }}).mismatches.length, 3);
});
