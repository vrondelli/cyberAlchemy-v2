import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync} from "node:fs";
import {resolve} from "node:path";
import test from "node:test";

import {emitCompletionImprovementSignals} from "../../codex-app-server-wrapper/src/evolution-signals.mjs";
import {verifyReasoningStateLog} from "../../reasoning-state-runtime/index.mjs";
import {createGatewayEvolutionSignalIntake, gatewayCompletionSignalCandidates} from "../src/gateway-signal-intake.mjs";

const completionDigest = "a".repeat(64);
const semanticSummaryDigest = "b".repeat(64);
const completion = {method: "turn/completed", params: {turn: {status: "completed", items: [{text: "private model answer"}]}}};
const semantic = {ok: false, disposition: "block", summary_digest: semanticSummaryDigest, reason_codes: ["semantic.profile-required"]};

test("gateway signal provider emits only a bounded blocked-semantic observation", () => {
  assert.deepEqual(gatewayCompletionSignalCandidates({completion_message: completion, semantic_completion: {ok: true, disposition: "evaluated"}}), []);
  assert.deepEqual(gatewayCompletionSignalCandidates({completion_message: {params: {turn: {status: "failed"}}}, semantic_completion: semantic}), []);
  const candidates = gatewayCompletionSignalCandidates({completion_message: completion, semantic_completion: semantic});
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].observed_value, 1);
  assert.doesNotMatch(JSON.stringify(candidates), /private model answer|profile-required/);
});

test("opt-in gateway signal inbox checkpoints, recovers, and deduplicates one candidate without a cycle", async () => {
  const directory = mkdtempSync("/tmp/are-gateway-evolution-signals-");
  const logPath = resolve(directory, "signals.jsonl");
  try {
    const first = createGatewayEvolutionSignalIntake({log_path: logPath});
    assert.throws(() => createGatewayEvolutionSignalIntake({log_path: logPath}), /writer lock failed/);
    const input = {configuration: {enabled: true, trigger: "turn/completed"}, completion_message: completion,
      completion_digest: completionDigest, turn_state: {context_envelope_digest: "c".repeat(64)},
      semantic_completion: semantic, ...first};
    const emitted = await emitCompletionImprovementSignals(input);
    assert.equal(emitted.disposition, "emitted");
    assert.equal(emitted.signal_count, 1);
    assert.equal(first.inspect().record_count, 1);
    assert.equal(first.close().ok, true);

    const verified = verifyReasoningStateLog(logPath, {expected_ledger_id: "are-evolution-gateway-signal-inbox/v1"});
    assert.equal(verified.ok, true);
    assert.equal(verified.value.index.checkpoint_count, 1);
    const bytes = readFileSync(logPath, "utf8");
    assert.match(bytes, /evolution.improvement-signal-candidate/);
    assert.doesNotMatch(bytes, /private model answer|profile-required|evolution-cycle/);

    const second = createGatewayEvolutionSignalIntake({log_path: logPath});
    assert.equal(second.inspect().record_count, 1);
    const replay = await emitCompletionImprovementSignals({...input, ...second});
    assert.equal(replay.disposition, "emitted");
    assert.equal(second.inspect().record_count, 1);
    assert.equal(readFileSync(logPath, "utf8"), bytes);
    assert.equal(second.close().ok, true);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("disabled and failed-sink paths never claim a recorded signal", async () => {
  const directory = mkdtempSync("/tmp/are-gateway-evolution-disabled-");
  const logPath = resolve(directory, "signals.jsonl");
  try {
    const intake = createGatewayEvolutionSignalIntake({log_path: logPath, maximum_log_bytes: 16 * 1024});
    const disabled = await emitCompletionImprovementSignals({configuration: {enabled: false, trigger: "turn/completed"},
      completion_message: completion, completion_digest: completionDigest, semantic_completion: semantic, ...intake});
    assert.equal(disabled.disposition, "disabled");
    assert.equal(intake.inspect().record_count, 0);
    assert.equal(intake.close().ok, true);
    const failed = await emitCompletionImprovementSignals({configuration: {enabled: true, trigger: "turn/completed"},
      completion_message: completion, completion_digest: completionDigest, semantic_completion: semantic, ...intake});
    assert.equal(failed.disposition, "sink-failed");
    assert.equal(failed.sink_calls, 1);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("candidate emission requires an explicit sink checkpoint acknowledgement", async () => {
  const directory = mkdtempSync("/tmp/are-gateway-evolution-ack-");
  const logPath = resolve(directory, "signals.jsonl");
  try {
    const intake = createGatewayEvolutionSignalIntake({log_path: logPath});
    const input = {configuration: {enabled: true, trigger: "turn/completed"}, completion_message: completion,
      completion_digest: completionDigest, semantic_completion: semantic, ...intake};
    for (const sinkResult of [undefined, {}, {ok: false}]) {
      const result = await emitCompletionImprovementSignals({...input, signal_sink: () => sinkResult});
      assert.equal(result.disposition, "sink-failed");
      assert.equal(result.sink_calls, 1);
      assert.equal(intake.inspect().record_count, 0);
    }
    const emitted = await emitCompletionImprovementSignals(input);
    assert.equal(emitted.disposition, "emitted");
    assert.equal(intake.inspect().record_count, 1);
    assert.equal(intake.close().ok, true);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("gateway signal inbox stops at its configured bound without truncating a checkpoint", async () => {
  const directory = mkdtempSync("/tmp/are-gateway-evolution-limit-");
  const logPath = resolve(directory, "signals.jsonl");
  try {
    const intake = createGatewayEvolutionSignalIntake({log_path: logPath, maximum_log_bytes: 16 * 1024});
    const input = {configuration: {enabled: true, trigger: "turn/completed"}, completion_message: completion,
      completion_digest: completionDigest, semantic_completion: semantic, ...intake};
    assert.equal((await emitCompletionImprovementSignals(input)).disposition, "emitted");
    const before = readFileSync(logPath, "utf8");
    const second = await emitCompletionImprovementSignals({...input, completion_digest: "d".repeat(64)});
    assert.equal(second.disposition, "sink-failed");
    assert.equal(intake.inspect().record_count, 1);
    assert.equal(readFileSync(logPath, "utf8"), before);
    assert.ok(intake.inspect().log_bytes <= 16 * 1024);
    assert.equal(intake.close().ok, true);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
