import assert from "node:assert/strict";
import {existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";
import {spawnSync} from "node:child_process";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {calculateInteractionBaseline, scanCodexInteractionSources, verifyInteractionIngestion} from "../src/interaction-learning-ingestion.mjs";

function temporaryRoot(prefix) {
  return mkdtempSync(resolve(tmpdir(), prefix));
}

function record(type, payload, ordinal, timestamp) {
  return {type, payload, ordinal, timestamp};
}

function fixture(path, {cwd = "/work/cyberAlchemy-v2", secret = true} = {}) {
  const rows = [
    record("turn_context", {cwd, turn_id: "turn-1"}, 1, "2026-09-01T00:00:00Z"),
    record("response_item", {type: "message", role: "user", content: [{type: "input_text", text: "Continue the ARE benchmark."}]}, 2, "2026-09-01T00:00:01Z"),
    record("response_item", {type: "reasoning", encrypted_content: "ciphertext-not-for-learning", summary: []}, 3, "2026-09-01T00:00:02Z"),
    record("response_item", {type: "custom_tool_call", name: "exec_command", input: secret ? "api_key=sk-example-secret-123456789" : "safe"}, 4, "2026-09-01T00:00:03Z"),
    record("response_item", {type: "custom_tool_call_output", call_id: "call-1", output: secret ? "Bearer abcdefghijklmnop" : "ok"}, 5, "2026-09-01T00:00:04Z"),
    record("response_item", {type: "message", role: "assistant", content: [{type: "output_text", text: "Starting the benchmark."}]}, 6, "2026-09-01T00:00:05Z"),
    record("response_item", {type: "message", role: "user", content: [{type: "input_text", text: "No, I mean one decision at a time."}]}, 7, "2026-09-01T00:00:06Z"),
    record("response_item", {type: "message", role: "assistant", content: [{type: "output_text", text: "Understood."}]}, 8, "2026-09-01T00:00:07Z"),
  ];
  writeFileSync(path, `${rows.map((row) => JSON.stringify(row)).join("\n")}\n`, {mode: 0o600});
}

test("streaming scan selects the cohort and persists no message, tool, environment, reasoning, or credential content", async () => {
  const root = temporaryRoot("are-interaction-source-");
  try {
    fixture(join(root, "relevant.jsonl"));
    fixture(join(root, "other.jsonl"), {cwd: "/work/unrelated"});
    const result = await scanCodexInteractionSources({sources: [{source_id: "fixture", root}], cwd_markers: ["cyberAlchemy-v2", "agent-reasoning-engine"]});
    assert.equal(result.selected_session_count, 1);
    assert.equal(result.evaluation_task_count, 2);
    assert.equal(result.sessions[0].reasoning_record_count, 1);
    assert.equal(result.sessions[0].encrypted_reasoning_count, 1);
    assert.deepEqual(result.sessions[0].tool_call_counts, {exec_command: 1});
    assert.equal(result.sessions[0].tool_output_count, 1);
    assert.deepEqual(result.sessions[0].turns[1].correction_signals, ["explicit_correction", "ordering_repair"]);
    const durable = JSON.stringify(result);
    for (const forbidden of ["ciphertext-not-for-learning", "sk-example-secret", "Bearer abcdef", "Starting the benchmark", "one decision at a time", "/work/cyberAlchemy-v2"]) assert.equal(durable.includes(forbidden), false, forbidden);
    assert.deepEqual(result.excluded_content, ["message_text", "tool_arguments", "tool_outputs", "environment_values", "encrypted_reasoning", "credentials"]);
    assert.equal(verifyInteractionIngestion(result).ok, true);
    assert.equal(verifyInteractionIngestion({...result, selected_session_count: 99}).ok, false);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("scan freezes an exact cohort by source-relative exclusions", async () => {
  const root = temporaryRoot("are-interaction-exclusion-");
  try {
    fixture(join(root, "included.jsonl"), {secret: false});
    fixture(join(root, "new-session.jsonl"), {secret: false});
    const result = await scanCodexInteractionSources({sources: [{source_id: "fixture", root, exclude_locators: ["new-session.jsonl"]}], cwd_markers: ["cyberAlchemy-v2"]});
    assert.equal(result.selected_session_count, 1);
    assert.equal(result.source_inventory[0].explicitly_excluded_file_count, 1);
    assert.equal(result.sessions[0].source_locator, "included.jsonl");
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("baseline requires evaluator labels, enforces causal failure attribution, and keeps objectives in one chronological partition", async () => {
  const root = temporaryRoot("are-interaction-baseline-");
  try {
    fixture(join(root, "session.jsonl"), {secret: false});
    const ingestion = await scanCodexInteractionSources({sources: [{source_id: "fixture", root}], cwd_markers: ["cyberAlchemy-v2"]});
    const [first, second] = ingestion.sessions[0].turns;
    const labels = [
      {episode_id: "episode-objective-a", objective_key: "objective-a", turn_refs: [first.turn_ref], outcome: "success", attribution: "none", primary_category: "none", contributing_categories: [], evaluator_id: "independent-agent:test", evidence_note: "Objective completed without repair."},
      {episode_id: "episode-objective-b", objective_key: "objective-b", turn_refs: [second.turn_ref], outcome: "failure", attribution: "assistant_caused", primary_category: "ordering_coordination", contributing_categories: ["language_clarity"], evaluator_id: "independent-agent:test", evidence_note: "User repaired gate ordering."},
    ];
    const baseline = calculateInteractionBaseline({ingestion, labels, partition_policy: {discovery: 0.5, validation: 0.25, holdout: 0.25}});
    assert.equal(baseline.status, "BASELINE_MEASURED");
    assert.equal(baseline.overall.episode_success_rate, 0.5);
    assert.equal(baseline.overall.indeterminate_count, 0);
    assert.equal(baseline.diagnostic_counts.ordering_coordination, 1);
    assert.equal(baseline.diagnostic_counts.language_clarity, 1);
    assert.equal(baseline.empirical_parameters.numeric_completion_target, null);
    assert.throws(() => calculateInteractionBaseline({ingestion, labels: [{...labels[1], attribution: "external_failure"}], partition_policy: {discovery: 0.5, validation: 0.25, holdout: 0.25}}), /failure-attribution-invalid/);
  } finally { rmSync(root, {recursive: true, force: true}); }
});

test("JSON stdin CLI materializes scan and baseline artifacts under one cycle root", () => {
  const sources = temporaryRoot("are-interaction-cli-source-");
  const runtime = temporaryRoot("are-interaction-cli-runtime-");
  try {
    fixture(join(sources, "session.jsonl"), {secret: false});
    const cli = fileURLToPath(new URL("../bin/interaction-learning.mjs", import.meta.url));
    const scanRequest = {schema_version: "are.interaction-learning-cli-request/v1", operation: "scan", cycle_id: "interaction-learning-001", input: {sources: [{source_id: "fixture", root: sources}], cwd_markers: ["cyberAlchemy-v2"]}};
    const scan = spawnSync(process.execPath, [cli, "--root", runtime], {input: JSON.stringify(scanRequest), encoding: "utf8"});
    assert.equal(scan.status, 0, scan.stderr);
    const scanOutput = JSON.parse(scan.stdout);
    assert.equal(scanOutput.ok, true);
    assert.equal(existsSync(scanOutput.persisted_path), true);
    assert.equal(existsSync(scanOutput.receipt_path), true);
    rmSync(scanOutput.receipt_path);
    const sealRequest = {schema_version: "are.interaction-learning-cli-request/v1", operation: "seal-scan", cycle_id: "interaction-learning-001", input: {ingestion_path: scanOutput.persisted_path}};
    const seal = spawnSync(process.execPath, [cli, "--root", runtime], {input: JSON.stringify(sealRequest), encoding: "utf8"});
    assert.equal(seal.status, 0, seal.stderr);
    assert.equal(existsSync(JSON.parse(seal.stdout).receipt_path), true);
    const ingestion = JSON.parse(readFileSync(scanOutput.persisted_path, "utf8"));
    const labels = ingestion.sessions[0].turns.map((turn, index) => ({episode_id: `episode-${index + 1}`, objective_key: `objective-${index + 1}`, turn_refs: [turn.turn_ref], outcome: index === 0 ? "success" : "indeterminate", attribution: index === 0 ? "none" : "ambiguous", primary_category: "none", contributing_categories: [], evaluator_id: "independent-agent:test", evidence_note: "Fixture label."}));
    const baselineRequest = {schema_version: "are.interaction-learning-cli-request/v1", operation: "baseline", cycle_id: "interaction-learning-001", input: {ingestion_path: scanOutput.persisted_path, labels, partition_policy: {discovery: 0.5, validation: 0.25, holdout: 0.25}}};
    const baseline = spawnSync(process.execPath, [cli, "--root", runtime], {input: JSON.stringify(baselineRequest), encoding: "utf8"});
    assert.equal(baseline.status, 0, baseline.stderr);
    const baselineOutput = JSON.parse(baseline.stdout);
    assert.equal(baselineOutput.value.overall.episode_success_rate, 1);
    assert.equal(existsSync(join(runtime, "cycles", "interaction-learning-001", "baseline.json")), true);
    assert.equal(existsSync(baselineOutput.receipt_path), true);
  } finally {
    rmSync(sources, {recursive: true, force: true});
    rmSync(runtime, {recursive: true, force: true});
  }
});
