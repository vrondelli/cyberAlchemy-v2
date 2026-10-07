#!/usr/bin/env node
// Isolated installed-host canary: kill the gateway process, then reconcile exact history.
import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {existsSync, readFileSync, realpathSync, rmSync} from "node:fs";
import {tmpdir} from "node:os";
import {basename, dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {inspectBackendProcess} from "./native-backend-process-identity.mjs";

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const phaseOneScript = resolve(packageRoot, "scripts/native-user-input-canary.mjs");
const phaseTwoScript = resolve(packageRoot, "scripts/native-gateway-hard-crash-phase-two.mjs");
const report = {schema_version: "are.native-gateway-hard-crash-canary/v1", status: "FAIL",
  authority_effect: "none", external_model_calls: 0, current_desktop_task_touched: false};
let phaseOne;
let phaseTwo;
let scratch;
let statePath;
let phaseOneStderr = "";
let retainedBackendPid;
let retainedBinary;
let retainedBackendBirth;
const verifiedBackendRunning = (pid, binary, privateScratch, birth) =>
  inspectBackendProcess(pid, binary, privateScratch, birth).exact;

function childCompletion(child, label, timeoutMs = 90000) {
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => { stdout = `${stdout}${chunk}`.slice(-1024 * 1024); });
  child.stderr.on("data", (chunk) => { stderr = `${stderr}${chunk}`.slice(-16384); });
  return new Promise((resolveDone, rejectDone) => {
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      rejectDone(new Error(`${label}.timeout:${stderr}`));
    }, timeoutMs);
    child.once("error", (error) => { clearTimeout(timer); rejectDone(error); });
    child.once("close", (code, signal) => {
      clearTimeout(timer);
      resolveDone({code, signal, stdout, stderr});
    });
  });
}

try {
  assert.ok(process.argv[2] && process.argv[3],
    "Usage: native-gateway-hard-crash-recovery.mjs <installed-codex-binary> <exact-version> [--active-turn] [--surviving-backend]");
  const binary = realpathSync(process.argv[2]);
  const expectedVersion = process.argv[3];
  const activeTurnMode = process.argv.includes("--active-turn");
  const survivingBackendMode = process.argv.includes("--surviving-backend");
  let backendExitedBeforeReconciliation = false;
  assert.ok(!survivingBackendMode || activeTurnMode, "hard-crash.surviving-backend-requires-active-turn");
  phaseOne = spawn(process.execPath, [phaseOneScript, binary, expectedVersion,
    ...(activeTurnMode ? ["--interrupted-turn-recovery", "--gateway-hard-crash-active-turn"]
      : ["--gateway-auto-compaction-lost-response-probe", "--gateway-hard-crash-before-recovery"])],
  {stdio: ["ignore", "pipe", "pipe"]});
  const phaseOneDone = childCompletion(phaseOne, "hard-crash.phase-one", 90000);
  const crashReady = new Promise((resolveReady, rejectReady) => {
    let pending = "";
    const timer = setTimeout(() => rejectReady(new Error(`hard-crash.ready-timeout:${phaseOneStderr}`)), 60000);
    phaseOne.stderr.on("data", (chunk) => {
      pending += chunk.toString("utf8");
      let end;
      while ((end = pending.indexOf("\n")) >= 0) {
        const line = pending.slice(0, end).trim();
        pending = pending.slice(end + 1);
        if (!line.startsWith("ARE_NATIVE_GATEWAY_CRASH_READY ")) {
          phaseOneStderr = `${phaseOneStderr}${line}\n`.slice(-8192);
          continue;
        }
        try {
          const marker = JSON.parse(line.slice("ARE_NATIVE_GATEWAY_CRASH_READY ".length));
          clearTimeout(timer);
          resolveReady(marker);
        } catch (error) {
          clearTimeout(timer);
          rejectReady(error);
        }
      }
    });
    phaseOne.once("close", (code, signal) => {
      clearTimeout(timer);
      rejectReady(new Error(`hard-crash.phase-one-ended-before-ready:${signal ?? code}:${phaseOneStderr}`));
    });
  });
  const marker = await crashReady;
  statePath = realpathSync(marker.state_path);
  const state = JSON.parse(readFileSync(statePath, "utf8"));
  assert.equal(state.schema_version, "are.native-gateway-hard-crash-state/v1");
  assert.equal(state.mode, activeTurnMode ? "active-turn" : "completed-lost-response",
    "hard-crash.unexpected-probe-mode");
  scratch = realpathSync(state.scratch);
  assert.equal(dirname(statePath), scratch, "hard-crash.state-outside-scratch");
  assert.equal(dirname(scratch), resolve(tmpdir()), "hard-crash.scratch-outside-system-temp");
  assert.ok(basename(scratch).startsWith("are-native-user-input-"), "hard-crash.unexpected-scratch-root");
  assert.equal(state.binary, binary, "hard-crash.backend-binary-mismatch");
  assert.equal(marker.backend_pid, state.backend_pid, "hard-crash.backend-pid-mismatch");
  retainedBackendPid = state.backend_pid;
  retainedBinary = binary;
  const originalBackend = inspectBackendProcess(state.backend_pid, binary, scratch);
  assert.equal(originalBackend.exact, true, "hard-crash.backend-not-exact-before-gateway-kill");
  retainedBackendBirth = originalBackend.birth;
  if (process.platform === "win32") assert.ok(retainedBackendBirth,
    "hard-crash.windows-backend-birth-unavailable");
  assert.equal(phaseOne.kill("SIGKILL"), true, "hard-crash.gateway-process-kill-failed");
  const terminated = await phaseOneDone;
  if (process.platform !== "win32") {
    assert.equal(terminated.signal, "SIGKILL", "hard-crash.gateway-exited-without-sigkill");
  } else assert.notEqual(terminated.code, 0, "hard-crash.gateway-exited-cleanly-after-kill");
  report.gateway_process_killed = true;

  const oldBackendWasRunning = verifiedBackendRunning(state.backend_pid, binary, scratch, retainedBackendBirth);
  report.old_backend_was_running_after_gateway_kill = oldBackendWasRunning;
  if (survivingBackendMode && !oldBackendWasRunning) {
    report.surviving_backend_guard_not_exercised = true;
    report.surviving_backend = {disposition: "exited-before-survivor-observation"};
  }
  if (survivingBackendMode && oldBackendWasRunning) {
    phaseTwo = spawn(process.execPath, [phaseTwoScript, statePath, binary, expectedVersion,
      "--survivor-observe-only", ...(retainedBackendBirth
        ? ["--expected-backend-birth", retainedBackendBirth] : [])], {stdio: ["ignore", "pipe", "pipe"]});
    const observed = await childCompletion(phaseTwo, "hard-crash.survivor-observation", 90000);
    assert.ok(observed.stdout.trim(), `hard-crash.survivor-no-report:${observed.stderr}`);
    const observedReport = JSON.parse(observed.stdout.trim());
    report.surviving_backend = {host_status: observedReport.surviving_host_status,
      recovery_phase: observedReport.recovery_phase,
      exact_host_history_receipts: observedReport.exact_host_history_receipts,
      disposition: observedReport.status,
      process_running_before_history: observedReport.backend_running_before_history,
      process_running_after_history: observedReport.backend_running_after_history,
      process_still_running_after_observation: verifiedBackendRunning(state.backend_pid, binary, scratch,
        retainedBackendBirth)};
    if (observedReport.status === "BACKEND_EXITED_BEFORE_RECONCILIATION") {
      report.surviving_backend.disposition = "exited-before-reconciliation";
      report.surviving_backend_guard_not_exercised = true;
      backendExitedBeforeReconciliation = true;
    } else {
      assert.equal(observed.code, 0,
        `hard-crash.survivor-failed:${observedReport.error ?? observed.stderr}:${JSON.stringify(observedReport.error_details ?? null)}`);
      assert.equal(observedReport.status, "BACKEND_LIVE_GUARD_BLOCKED");
      assert.equal(observedReport.guard_reason, "gateway.prior-backend-process-live");
      assert.equal(observedReport.replacement_backend_spawned, false);
      assert.equal(verifiedBackendRunning(state.backend_pid, binary, scratch, retainedBackendBirth), true,
        "hard-crash.backend-not-surviving-after-guard");
      report.surviving_backend_guard_exercised = true;
      report.surviving_backend = {...report.surviving_backend,
        guard_reason: observedReport.guard_reason,
        replacement_backend_spawned: observedReport.replacement_backend_spawned,
        prior_backend_exactly_running: observedReport.prior_backend_exactly_running};
    }
  }
  if (backendExitedBeforeReconciliation) {
    report.status = "PASS";
    report.host = {version: expectedVersion};
    report.recovery = {host_history_terminal: report.surviving_backend.host_status,
      recovery_phase: report.surviving_backend.recovery_phase,
      exact_host_history_receipts: report.surviving_backend.exact_host_history_receipts,
      backend_exited_before_reconciliation: true,
      new_user_turn_completed: false};
  } else {
  if (verifiedBackendRunning(state.backend_pid, binary, scratch, retainedBackendBirth)) {
    process.kill(state.backend_pid, "SIGKILL");
  }
  phaseTwo = spawn(process.execPath, [phaseTwoScript, statePath, binary, expectedVersion,
    ...(retainedBackendBirth ? ["--expected-backend-birth", retainedBackendBirth] : [])],
    {stdio: ["ignore", "pipe", "pipe"]});
  const recovered = await childCompletion(phaseTwo, "hard-crash.phase-two", 90000);
  assert.ok(recovered.stdout.trim(), `hard-crash.phase-two-no-report:${recovered.stderr}`);
  const phaseTwoReport = JSON.parse(recovered.stdout.trim());
  assert.equal(recovered.code, 0,
    `hard-crash.phase-two-failed:${phaseTwoReport.error ?? recovered.stderr}:${JSON.stringify(phaseTwoReport.error_details)}`);
  assert.equal(phaseTwoReport.status, "PASS");
  assert.equal(phaseTwoReport.current_desktop_task_touched, false);
  assert.equal(phaseTwoReport.external_model_calls, 0);
  report.status = "PASS";
  report.host = phaseTwoReport.host;
  report.recovery = {host_marker_match_count: phaseTwoReport.host_marker_match_count,
    compaction_item_count_before_crash: phaseTwoReport.compaction_item_count_before_crash,
    provider_requests_before_crash: phaseTwoReport.provider_requests_before_crash,
    provider_service_started_after_crash: phaseTwoReport.provider_service_started_after_crash,
    same_key_retry_rejected: phaseTwoReport.same_key_retry_rejected,
    new_key_turn_rejected_while_unknown: phaseTwoReport.new_key_turn_rejected_while_unknown,
    semantic_recovery_confirmed: phaseTwoReport.semantic_recovery_confirmed,
    recovered_dispatch_count: phaseTwoReport.recovered_dispatch_count,
    process_local_decision_count: phaseTwoReport.process_local_decision_count,
    host_task_control: phaseTwoReport.host_task_control,
    backend_process_restarted: phaseTwoReport.backend_process_restarted,
    ...(activeTurnMode ? {host_history_terminal: phaseTwoReport.host_history_terminal,
      recovery_phase: phaseTwoReport.recovery_phase,
      prior_frontier_preserved: phaseTwoReport.prior_frontier_preserved,
      exact_host_history_receipts: phaseTwoReport.exact_host_history_receipts,
      post_recovery_provider_requests: phaseTwoReport.post_recovery_provider_requests,
      new_user_turn_completed: phaseTwoReport.new_user_turn_completed} : {})};
  }
} catch (error) {
  report.error = error.message;
  report.phase_one_stderr_tail = phaseOneStderr;
  process.exitCode = 1;
} finally {
  for (const child of [phaseOne, phaseTwo]) {
    if (child && child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  }
  if (retainedBackendPid && retainedBinary && scratch) {
    try {
      if (verifiedBackendRunning(retainedBackendPid, retainedBinary, scratch, retainedBackendBirth)) {
        process.kill(retainedBackendPid, "SIGKILL");
      }
    } catch (error) {
      report.status = "FAIL";
      report.error ??= `hard-crash.orphan-backend-cleanup-error:${error.code ?? error.message}`;
      process.exitCode = 1;
    }
  }
  if (scratch && statePath && existsSync(statePath)) {
    try { rmSync(scratch, {recursive: true, force: true, maxRetries: 8, retryDelay: 250}); }
    catch (error) {
      report.status = "FAIL";
      report.error ??= `hard-crash.temporary-state-cleanup-error:${error.code ?? error.message}`;
      process.exitCode = 1;
    }
  }
  report.teardown = {temporary_state_removed: scratch ? !existsSync(scratch) : null};
  if (report.teardown.temporary_state_removed === false) {
    report.status = "FAIL";
    report.error ??= "hard-crash.temporary-state-cleanup-failed";
    process.exitCode = 1;
  }
  process.stdout.write(`${JSON.stringify(report)}\n`);
}
