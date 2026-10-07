import assert from "node:assert/strict";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {resolve} from "node:path";
import {spawnSync} from "node:child_process";
import test from "node:test";

import {emitCompletionImprovementSignals} from "../../codex-app-server-wrapper/src/evolution-signals.mjs";
import {createGatewayEvolutionSignalIntake} from "../src/gateway-signal-intake.mjs";
import {observeGatewayEvolutionSignals} from "../src/gateway-signal-observer.mjs";

test("gateway candidate observer reads a checkpointed inbox without exposing turn content or opening a writer", async () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-signal-observer-"));
  const logPath = resolve(directory, "signals.jsonl");
  try {
    const intake = createGatewayEvolutionSignalIntake({log_path: logPath});
    const result = await emitCompletionImprovementSignals({configuration: {enabled: true, trigger: "turn/completed"},
      completion_message: {params: {turn: {status: "completed", items: [{text: "private answer"}]}}},
      completion_digest: "a".repeat(64), semantic_completion: {ok: false, disposition: "block", summary_digest: "b".repeat(64)},
      ...intake});
    assert.equal(result.disposition, "emitted");
    const before = readFileSync(logPath, "utf8");
    const observed = observeGatewayEvolutionSignals({log_path: logPath});
    assert.equal(observed.evidence_status, "verified");
    assert.equal(observed.candidate_count, 1);
    assert.equal(observed.candidates[0].kind, "semantic-evaluation-blocked");
    assert.match(observed.candidates[0].record_digest, /^[a-f0-9]{64}$/);
    assert.doesNotMatch(JSON.stringify(observed), /private answer|signals\.jsonl|source_result_ref|provenance_refs/);
    assert.equal(readFileSync(logPath, "utf8"), before);
    assert.equal(intake.close().ok, true);

    const cli = spawnSync(process.execPath, [new URL("../bin/observe-gateway-signals.mjs", import.meta.url).pathname,
      "--json", "--log", logPath], {encoding: "utf8"});
    assert.equal(cli.status, 0);
    assert.equal(JSON.parse(cli.stdout).candidate_count, 1);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});

test("gateway candidate observer fails closed for missing and torn evidence", () => {
  const directory = mkdtempSync(resolve(tmpdir(), "are-signal-observer-invalid-"));
  const logPath = resolve(directory, "signals.jsonl");
  try {
    assert.equal(observeGatewayEvolutionSignals({log_path: logPath}).evidence_status, "unavailable");
    writeFileSync(logPath, "{\"partial\":true}");
    assert.equal(observeGatewayEvolutionSignals({log_path: logPath}).evidence_status, "unavailable");
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
