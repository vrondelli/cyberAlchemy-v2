import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {spawnSync} from "node:child_process";
import {appendFileSync, mkdtempSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {fileURLToPath} from "node:url";
import test from "node:test";

import {appendReasoningPlanContext, recoverReasoningStateLedger, verifyReasoningStateLog} from "../packages/reasoning-state-runtime/index.mjs";
import {compactContextHook} from "../src/compact-context-hook.mjs";
import {checkoutRoot} from "../src/prompt-hook.mjs";

const cli = fileURLToPath(new URL("../bin/are.mjs", import.meta.url));
const digest = createHash("sha256").update("parent plan fixture").digest("hex");
const binding = path => ({schema_version: "are.compact-context-binding/v1", session_id: "host-session-1",
  thread_ref: "backend-thread-1", cwd: checkoutRoot, ledger_path: path, ledger_id: "reasoning:compact-fixture"});
const event = () => ({hook_event_name: "SessionStart", source: "compact", session_id: "host-session-1", cwd: checkoutRoot,
  transcript_path: "/not-read", model: "fixture"});
const plan = {
  thread_ref: "backend-thread-1", parent_plan_ref: "plan:fixture", parent_plan_digest: digest,
  previous_plan_context_digest: null, active_slice_id: "C2",
  feature_obligations: [{obligation_id: "C2", summary: "Restore plan context after compaction", status: "active"}],
  unresolved_decisions: [{decision_id: "handover", question: "Can the host grant one writer?"}],
  source_refs: [{source_ref: "plan:fixture", source_digest: digest}],
};

function fixture(path, {checkpoint = true, includePlan = true} = {}) {
  const recovered = recoverReasoningStateLedger({path, ledger_id: "reasoning:compact-fixture"});
  assert.equal(recovered.ok, true);
  const ledger = recovered.ledger;
  const appended = includePlan
    ? appendReasoningPlanContext(ledger, plan, {expected_thread_ref: plan.thread_ref, source_digests: {"plan:fixture": digest}})
    : ledger.append({event_kind: "fixture", content: {state: "other"}});
  assert.equal(appended.ok, true);
  if (checkpoint) {
    const epoch = ledger.seal({event_digests: [appended.event.event_digest], consumer_ref: plan.thread_ref,
      request_ref: "request:1", frontier: {kind: "fixture"}});
    assert.equal(epoch.ok, true);
    assert.equal(ledger.checkpoint({checkpoint_kind: "before-model-request", epoch: epoch.value}).ok, true);
  }
  ledger.close();
}

test("compact hook restores only the latest verified and checkpointed exact-thread C1 data", () => {
  const directory = mkdtempSync(join(tmpdir(), "are-compact-hook-"));
  const path = join(directory, "ledger.jsonl");
  try {
    fixture(path);
    const result = compactContextHook(event(), binding(path));
    assert.equal(result.exit_code, 0);
    const output = result.stdout.hookSpecificOutput;
    assert.equal(output.hookEventName, "SessionStart");
    const projection = JSON.parse(output.additionalContext.split("\n").at(-1));
    assert.equal(projection.plan_context.thread_ref, plan.thread_ref);
    assert.equal(projection.plan_context.active_slice_id, "C2");
    assert.equal(projection.plan_context.feature_obligations[0].summary, plan.feature_obligations[0].summary);
    assert.match(projection.checkpoint_digest, /^[a-f0-9]{64}$/);
    assert.equal(output.additionalContext.includes("/not-read"), false);
    assert.deepEqual(compactContextHook({...event(), session_id: "other-session"}, binding(path)).stdout, {});
    const resumed = compactContextHook({...event(), source: "resume"}, binding(path));
    assert.equal(resumed.exit_code, 0);
    assert.deepEqual(resumed.stdout, {});
  } finally { rmSync(directory, {recursive: true, force: true}); }
});

test("bound session stops on missing, uncheckpointed, or tampered C1 state", () => {
  const directory = mkdtempSync(join(tmpdir(), "are-compact-hook-negative-"));
  try {
    const missing = compactContextHook(event(), binding(join(directory, "missing.jsonl")));
    assert.equal(missing.exit_code, 0);
    assert.equal(missing.stdout.continue, false);
    const noPlan = join(directory, "no-plan.jsonl");
    fixture(noPlan, {includePlan: false});
    assert.equal(compactContextHook(event(), binding(noPlan)).stdout.continue, false);
    const unfinished = join(directory, "unfinished.jsonl");
    fixture(unfinished, {checkpoint: false});
    assert.equal(compactContextHook(event(), binding(unfinished)).stdout.continue, false);
    const damaged = join(directory, "damaged.jsonl");
    fixture(damaged);
    appendFileSync(damaged, "{\n");
    assert.equal(compactContextHook(event(), binding(damaged)).stdout.continue, false);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});

test("post-steer successor is restored after a later checkpoint; another backend thread is not", () => {
  const directory = mkdtempSync(join(tmpdir(), "are-compact-hook-successor-"));
  const path = join(directory, "ledger.jsonl");
  try {
    fixture(path);
    const verified = verifyReasoningStateLog(path, {expected_ledger_id: binding(path).ledger_id});
    const previous = verified.value.records.find(item => item.record_kind === "reasoning-state-event"
      && item.value.event_kind === "plan-context-recorded").value.content.plan_context_digest;
    const recovered = recoverReasoningStateLedger({path, ledger_id: binding(path).ledger_id});
    assert.equal(recovered.ok, true);
    const next = appendReasoningPlanContext(recovered.ledger, {...plan, previous_plan_context_digest: previous,
      active_slice_id: "F1", feature_obligations: [
        {obligation_id: "C2", summary: "Restore plan context after compaction", status: "completed"},
        {obligation_id: "F1", summary: "Attribute feedback", status: "active"},
      ]}, {expected_thread_ref: plan.thread_ref, source_digests: {"plan:fixture": digest}});
    assert.equal(next.ok, true);
    const epoch = recovered.ledger.seal({event_digests: [next.event.event_digest], consumer_ref: plan.thread_ref,
      request_ref: "request:2", frontier: {kind: "fixture-successor"}});
    assert.equal(epoch.ok, true);
    assert.equal(recovered.ledger.checkpoint({checkpoint_kind: "before-model-request", epoch: epoch.value}).ok, true);
    recovered.ledger.close();
    const output = compactContextHook(event(), binding(path));
    assert.equal(JSON.parse(output.stdout.hookSpecificOutput.additionalContext.split("\n").at(-1)).plan_context.active_slice_id, "F1");
    const wrongThread = compactContextHook(event(), {...binding(path), thread_ref: "backend-thread-other"});
    assert.equal(wrongThread.stdout.continue, false);
  } finally { rmSync(directory, {recursive: true, force: true}); }
});

test("candidate config runs from another cwd without activation or event interpolation", () => {
  const directory = mkdtempSync(join(tmpdir(), "are-compact-hook-cli-"));
  const path = join(directory, "ledger.jsonl");
  const bindingPath = join(directory, "binding.json");
  try {
    fixture(path);
    writeFileSync(bindingPath, JSON.stringify(binding(path)));
    const config = spawnSync(process.execPath, [cli, "hook", "compact-config", bindingPath], {encoding: "utf8"});
    assert.equal(config.status, 0, config.stderr);
    const candidate = JSON.parse(config.stdout);
    assert.deepEqual(Object.keys(candidate.hooks), ["SessionStart"]);
    assert.equal(candidate.hooks.SessionStart[0].matcher, "^compact$");
    const run = spawnSync("/bin/sh", ["-c", candidate.hooks.SessionStart[0].hooks[0].command],
      {cwd: directory, input: JSON.stringify(event()), encoding: "utf8"});
    assert.equal(run.status, 0, run.stderr);
    assert.equal(JSON.parse(run.stdout).hookSpecificOutput.hookEventName, "SessionStart");
  } finally { rmSync(directory, {recursive: true, force: true}); }
});
