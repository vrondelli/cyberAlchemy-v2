#!/usr/bin/env node
// Disposable installed-Codex gateway -> staged Companion WebView2 proof.
// The canary owns the pipe and token; this runner never prints either value.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {existsSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

if (process.platform !== "win32" || ![6, 7].includes(process.argv.length)
  || (process.argv.length === 7 && !["--gateway-recovery", "--same-window-gateway-recovery", "--same-window-interrupted-turn-recovery", "--connected-resource-sample", "--interrupted-turn-recovery", "--completed-notification-loss", "--hosted-pending-recovery", "--auto-compaction-lost-response-recovery", "--inflight-turn-observation"].includes(process.argv[6]))) {
  throw new Error("Usage on native Windows: node test-windows-live-gateway.mjs <staged-companion.exe> <node.exe> <installed-codex-copy.exe> <exact-version> [--gateway-recovery|--same-window-gateway-recovery|--same-window-interrupted-turn-recovery|--connected-resource-sample|--interrupted-turn-recovery|--completed-notification-loss|--hosted-pending-recovery|--auto-compaction-lost-response-recovery|--inflight-turn-observation]");
}
const [exe, node, binary, version] = process.argv.slice(2).map((value, index) => index < 3 ? resolve(value) : value);
const sameWindowInterruptedMode = process.argv.includes("--same-window-interrupted-turn-recovery");
const interruptedMode = process.argv.includes("--interrupted-turn-recovery") || sameWindowInterruptedMode;
const completedLossMode = process.argv.includes("--completed-notification-loss");
const hostedPendingMode = process.argv.includes("--hosted-pending-recovery");
const autoCompactionLostResponseMode = process.argv.includes("--auto-compaction-lost-response-recovery");
const sameWindowMode = process.argv.includes("--same-window-gateway-recovery") || sameWindowInterruptedMode;
const connectedResourceMode = process.argv.includes("--connected-resource-sample");
const inflightMode = process.argv.includes("--inflight-turn-observation");
const recoveryMode = process.argv.includes("--gateway-recovery") || sameWindowMode || interruptedMode || completedLossMode || hostedPendingMode || autoCompactionLostResponseMode;
for (const path of [exe, node, binary]) assert.ok(existsSync(path), `Missing live-gateway test input: ${path}`);
const canary = resolve(dirname(fileURLToPath(import.meta.url)), "../../../packages/codex-app-server-wrapper/scripts/native-user-input-canary.mjs");
const uiTest = resolve(dirname(fileURLToPath(import.meta.url)), "test-windows-ui.mjs");
const maxMs = connectedResourceMode ? 240_000 : 180_000;
const children = new Set();

function withTimeout(promise, label) {
  let timer;
  return Promise.race([promise, new Promise((_, rejectTimeout) => {
    timer = setTimeout(() => rejectTimeout(new Error(`${label} timed out`)), maxMs);
  })]).finally(() => clearTimeout(timer));
}

function launch(command, args, env = process.env) {
  const child = spawn(command, args, {env, stdio: ["pipe", "pipe", "pipe"], windowsHide: false});
  children.add(child);
  child.once("close", () => children.delete(child));
  return child;
}

function completion(child, label) {
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", chunk => { stdout = (stdout + chunk).slice(-1024 * 1024); });
  child.stderr.on("data", chunk => { stderr = (stderr + chunk).slice(-16 * 1024); });
  const done = new Promise((resolveDone, rejectDone) => {
    child.once("error", rejectDone);
    child.once("close", (code, signal) => resolveDone({code, signal, stdout, stderr}));
  });
  return withTimeout(done, label);
}

function processTreeSnapshot(rootPid) {
  // Exact canary-child tree only. This excludes the user's running Codex app.
  const script = `$ErrorActionPreference = 'Stop'
$rootPid = ${rootPid}
$all = @(Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name)
$ids = @($rootPid)
for ($i = 0; $i -lt $ids.Count; $i++) {
  $parentId = $ids[$i]
  foreach ($child in $all) {
    if ($child.ParentProcessId -eq $parentId -and $ids -notcontains $child.ProcessId) { $ids += $child.ProcessId }
  }
}
$rows = @()
foreach ($id in $ids) {
  $meta = $all | Where-Object ProcessId -EQ $id | Select-Object -First 1
  if ($null -eq $meta) { continue }
  try {
    $p = Get-Process -Id $id -ErrorAction Stop
    $rows += [pscustomobject]@{ pid = $id; parent_pid = $meta.ParentProcessId; name = $meta.Name; start_time = $p.StartTime.ToUniversalTime().ToString('o'); private_bytes = $p.PrivateMemorySize64; working_set_bytes = $p.WorkingSet64; cpu_seconds = $p.CPU }
  } catch { }
}
@($rows) | ConvertTo-Json -Compress -Depth 3`;
  const result = spawnSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-EncodedCommand", Buffer.from(script, "utf16le").toString("base64")],
    {encoding: "utf8", timeout: 15_000, maxBuffer: 1024 * 1024});
  if (result.error || result.status !== 0) throw new Error(`Gateway process-tree counters failed: ${result.error?.message ?? result.stderr.trim()}`);
  const rows = JSON.parse(result.stdout.trim());
  assert.ok(Array.isArray(rows) && rows.some(row => row.pid === rootPid), "Gateway canary root disappeared during measurement.");
  return rows;
}

async function measureProcessTree(rootPid, intervalMs = 10_000) {
  const before = processTreeSnapshot(rootPid);
  await new Promise(resolveWait => setTimeout(resolveWait, intervalMs));
  const after = processTreeSnapshot(rootPid);
  const prior = new Map(before.map(row => [`${row.pid}:${row.start_time}`, row]));
  return {interval_ms: intervalMs, process_count: after.length, process_names: after.map(row => row.name),
    private_bytes: after.reduce((sum, row) => sum + row.private_bytes, 0),
    working_set_bytes: after.reduce((sum, row) => sum + row.working_set_bytes, 0),
    cpu_seconds: Number(after.reduce((sum, row) => sum + Math.max(0, row.cpu_seconds
      - (prior.get(`${row.pid}:${row.start_time}`)?.cpu_seconds ?? 0)), 0).toFixed(6)), processes: after};
}

let gateway;
try {
  gateway = launch(node, [canary, binary, version, "--hold-observation", ...(inflightMode ? ["--hold-active-observation"] : []), ...(interruptedMode
    ? ["--interrupted-turn-recovery"] : completedLossMode ? ["--completed-notification-loss"]
      : hostedPendingMode ? ["--hosted-pending-marker-probe"]
      : autoCompactionLostResponseMode ? ["--gateway-auto-compaction-lost-response-probe"]
      : recoveryMode ? ["--gateway-recovery"] : [])]);
  let canaryOutput = "";
  let canaryError = "";
  const observationQueue = [];
  const observationWaiters = [];
  gateway.stdout.on("data", chunk => { canaryOutput = (canaryOutput + chunk).slice(-1024 * 1024); });
  let pending = "";
  gateway.stderr.on("data", chunk => {
    pending += chunk;
    let end;
    while ((end = pending.indexOf("\n")) !== -1) {
      const line = pending.slice(0, end).trim();
      pending = pending.slice(end + 1);
      if (!line.startsWith("ARE_CANARY_OBSERVATION_READY ")) {
        canaryError = (canaryError + line).slice(-8192);
        continue;
      }
      try {
        const value = JSON.parse(line.slice("ARE_CANARY_OBSERVATION_READY ".length));
        const waiter = observationWaiters.shift();
        if (waiter) waiter.resolve(value);
        else observationQueue.push(value);
      } catch (error) {
        const waiter = observationWaiters.shift();
        if (waiter) waiter.reject(error);
      }
    }
  });
  const observationFailure = code => new Error(`Native canary exited before observation: ${code}; ${canaryOutput.slice(-1000)} ${canaryError}`);
  gateway.once("error", error => { for (const waiter of observationWaiters.splice(0)) waiter.reject(error); });
  gateway.once("close", code => { for (const waiter of observationWaiters.splice(0)) waiter.reject(observationFailure(code)); });
  const nextObservation = label => withTimeout(observationQueue.length ? Promise.resolve(observationQueue.shift())
    : gateway.exitCode !== null ? Promise.reject(observationFailure(gateway.exitCode))
      : new Promise((resolveReady, rejectReady) => observationWaiters.push({resolve: resolveReady, reject: rejectReady})), label);
  const runUi = async (observation, phase) => {
    assert.match(observation.socket_path, /^\\\\\.\\pipe\\are-native-observation-/);
    assert.ok(observation.token.length >= 32);
    const ui = launch(node, [uiTest, exe, "--adapter-external-socket", observation.socket_path,
      phase === "active-turn" ? "--adapter-external-inflight" : phase === "after-restart" ? interruptedMode ? "--adapter-external-interrupted"
        : completedLossMode ? "--adapter-external-completed-loss"
          : hostedPendingMode || autoCompactionLostResponseMode ? "--adapter-external-confirmed-recovery" : "--adapter-external-restored" : "--adapter-external-active",
      "--timeout-ms", "45000"], {...process.env, ARE_ADAPTER_OBSERVATION_TOKEN: observation.token});
    ui.stdin.end();
    const result = await completion(ui, `Companion WebView2 ${phase} test`);
    assert.ok(result.stdout.trim(), `Companion UI emitted no result: code=${result.code} stderr=${result.stderr}`);
    const report = JSON.parse(result.stdout);
    assert.equal(result.code, 0, `Companion UI ${phase} failed: ${report.error ?? result.stderr}`);
    assert.equal(report.ok, true);
    return report;
  };
  const runSameWindowUi = async observation => {
    assert.match(observation.socket_path, /^\\\\\.\\pipe\\are-native-observation-/);
    assert.ok(observation.token.length >= 32);
    const ui = launch(node, [uiTest, exe, "--adapter-external-socket", observation.socket_path,
      "--adapter-external-active", "--adapter-external-same-window-recovery",
      ...(sameWindowInterruptedMode ? ["--adapter-external-same-window-interrupted"] : []),
      "--timeout-ms", "45000"],
    {...process.env, ARE_ADAPTER_OBSERVATION_TOKEN: observation.token});
    const uiDone = completion(ui, "Companion same-window recovery test");
    let pendingUiStderr = "";
    const phaseReady = withTimeout(new Promise((resolveReady, rejectReady) => {
      ui.stderr.on("data", chunk => {
        pendingUiStderr += chunk;
        let end;
        while ((end = pendingUiStderr.indexOf("\n")) !== -1) {
          const line = pendingUiStderr.slice(0, end).trim();
          pendingUiStderr = pendingUiStderr.slice(end + 1);
          if (line === "ARE_COMPANION_UI_PHASE_READY") resolveReady();
        }
      });
      ui.once("error", rejectReady);
      ui.once("close", code => rejectReady(new Error(`Companion UI exited before same-window gateway restart: ${code}`)));
    }), "Companion same-window pre-restart readiness");
    await phaseReady;
    gateway.stdin.write("continue\n");
    const restored = await nextObservation("Native canary post-restart observation readiness");
    assert.equal(restored.phase, "after-restart");
    assert.equal(restored.socket_path, observation.socket_path, "Gateway restart changed the selected observation pipe.");
    assert.equal(restored.token, observation.token, "Gateway restart changed the observation token.");
    ui.stdin.write("continue\n");
    ui.stdin.end();
    const result = await uiDone;
    assert.ok(result.stdout.trim(), `Companion UI emitted no result: code=${result.code} stderr=${result.stderr}`);
    const report = JSON.parse(result.stdout);
    assert.equal(result.code, 0, `Companion UI same-window recovery failed: ${report.error ?? result.stderr}`);
    assert.equal(report.ok, true);
    return report;
  };
  const runConnectedResourceUi = async observation => {
    assert.match(observation.socket_path, /^\\\\\.\\pipe\\are-native-observation-/);
    assert.ok(observation.token.length >= 32);
    const ui = launch(node, [uiTest, exe, "--adapter-external-socket", observation.socket_path,
      "--adapter-external-active", "--resource-with-external-adapter", "--resource-cycles", "2", "--timeout-ms", "45000"],
    {...process.env, ARE_ADAPTER_OBSERVATION_TOKEN: observation.token});
    ui.stdin.end();
    const uiDone = completion(ui, "Companion connected resource test");
    const samples = [];
    let pendingResourceStderr = "";
    let markerError = null;
    ui.stderr.on("data", chunk => {
      pendingResourceStderr += chunk;
      let end;
      while ((end = pendingResourceStderr.indexOf("\n")) !== -1) {
        const line = pendingResourceStderr.slice(0, end).trim();
        pendingResourceStderr = pendingResourceStderr.slice(end + 1);
        if (!line.startsWith("ARE_COMPANION_UI_RESOURCE_PHASE ")) continue;
        try {
          const marker = JSON.parse(line.slice("ARE_COMPANION_UI_RESOURCE_PHASE ".length));
          assert.ok(Number.isInteger(marker.cycle) && marker.cycle >= 0 && marker.cycle <= 2);
          assert.ok(["orb", "dashboard", "dashboard_closed"].includes(marker.phase));
          samples.push({cycle: marker.cycle, phase: marker.phase,
            measurement: measureProcessTree(gateway.pid).catch(error => ({error}))});
        } catch (error) { markerError = error; }
      }
    });
    const result = await uiDone;
    if (markerError) throw markerError;
    assert.ok(result.stdout.trim(), `Companion resource UI emitted no result: code=${result.code} stderr=${result.stderr}`);
    const report = JSON.parse(result.stdout);
    assert.equal(result.code, 0, `Companion connected resource UI failed: ${report.error ?? result.stderr}`);
    assert.equal(report.ok, true);
    assert.equal(report.observation_mode, "installed-codex-observation");
    assert.equal(report.cycles.length, 2);
    assert.ok(report.checks.includes("installed-codex-adapter-thread-decisions-refreshed-before-resource-sample"));
    assert.deepEqual(samples.map(({cycle, phase}) => [cycle, phase]), [[0, "orb"], [1, "dashboard"], [1, "dashboard_closed"], [2, "dashboard"], [2, "dashboard_closed"]]);
    const gatewaySamples = await Promise.all(samples.map(async ({cycle, phase, measurement}) => ({cycle, phase,
      ...(await measurement)})));
    for (const sample of gatewaySamples) if (sample.error) throw sample.error;
    assert.ok(gatewaySamples.filter(sample => sample.phase === "dashboard")
      .every(sample => sample.process_names.some(name => name.toLowerCase() === "codex.exe")),
    "Installed Codex was absent from the exact gateway process tree during dashboard samples.");
    return {ui: report, gateway: gatewaySamples};
  };
  let observation = await nextObservation("Native canary observation readiness");
  let inflightUiReport = null;
  if (inflightMode) {
    assert.equal(observation.phase, "active-turn");
    inflightUiReport = await runUi(observation, "active-turn");
    gateway.stdin.write("continue\n");
    observation = await nextObservation("Native canary completed-turn observation readiness");
  }
  assert.equal(observation.phase, autoCompactionLostResponseMode ? "after-restart" : "before-restart");
  const resourceReport = connectedResourceMode ? await runConnectedResourceUi(observation) : null;
  const uiReport = autoCompactionLostResponseMode ? null : resourceReport?.ui ?? (sameWindowMode
    ? await runSameWindowUi(observation) : connectedResourceMode ? null : await runUi(observation, "before-restart"));
  let restoredUiReport = autoCompactionLostResponseMode ? await runUi(observation, "after-restart") : null;
  if (sameWindowMode) restoredUiReport = uiReport;
  else if (recoveryMode && !autoCompactionLostResponseMode) {
    gateway.stdin.write("continue\n");
    const restored = await nextObservation("Native canary post-restart observation readiness");
    assert.equal(restored.phase, "after-restart");
    restoredUiReport = await runUi(restored, "after-restart");
  }
  const canaryDone = new Promise((resolveDone, rejectDone) => {
    gateway.once("error", rejectDone);
    gateway.once("close", (code, signal) => resolveDone({code, signal, stdout: canaryOutput, stderr: canaryError}));
  });
  gateway.stdin.write("continue\n");
  gateway.stdin.end();
  const canaryResult = await withTimeout(canaryDone, "Native canary completion");
  assert.ok(canaryResult.stdout.trim(), `Native canary emitted no result: code=${canaryResult.code} signal=${canaryResult.signal} stderr=${canaryResult.stderr}`);
  const gatewayReport = JSON.parse(canaryResult.stdout);
  assert.equal(canaryResult.code, 0, `Native canary failed: ${gatewayReport.error ?? canaryResult.stderr}`);
  assert.equal(gatewayReport.status, "PASS");
  assert.equal(gatewayReport.current_desktop_task_touched, false);
  assert.equal(gatewayReport.external_model_calls, 0);
  if (inflightMode) {
    assert.equal(gatewayReport.observation_during_active_turn.phase, "turn-active");
    assert.equal(gatewayReport.observation_during_active_turn.completed_frontier_present, false);
    for (const check of ["installed-codex-inflight-thread-observed-without-frontier",
      "installed-codex-thread-decision-link-observed", "installed-codex-decisions-observed"]) {
      assert.ok(inflightUiReport.checks.includes(check), `Missing in-flight Companion check: ${check}`);
    }
  }
  if (!autoCompactionLostResponseMode) {
    assert.equal(gatewayReport.observation_before_restart.thread_count, 1);
    assert.ok(gatewayReport.observation_before_restart.decision_count > 0);
  }
  for (const check of ["adapter-live-windows-pipe-observed", "installed-codex-thread-frontier-observed",
    "installed-codex-thread-decision-link-observed", "installed-codex-decisions-observed"]) {
    if (!connectedResourceMode && !autoCompactionLostResponseMode) assert.ok(uiReport.checks.includes(check), `Missing live Companion check: ${check}`);
  }
  if (recoveryMode) {
    if (autoCompactionLostResponseMode) {
      assert.equal(gatewayReport.gateway_auto_compaction_lost_response_probe.semantic_recovery_confirmed, true);
      assert.equal(gatewayReport.gateway_auto_compaction_lost_response_probe.provider_redispatch_after_recovery, false);
      assert.equal(gatewayReport.observation_after_restart.recovered_dispatch_count, 1);
    } else if (hostedPendingMode) {
      assert.equal(gatewayReport.unknown_acceptance_probe.hosted_pending_intent_recovered, true);
      assert.equal(gatewayReport.unknown_acceptance_probe.gateway_recovery_confirmed, true);
      assert.equal(gatewayReport.unknown_acceptance_probe.companion_recovery_projection_verified, true);
      assert.equal(gatewayReport.observation_after_restart.recovered_dispatch_count, 1);
    } else assert.equal(gatewayReport.recovery.gateway_process_restarted, true);
    assert.equal(gatewayReport.observation_after_restart.thread_count, 1);
    assert.ok(gatewayReport.observation_after_restart.decision_count > 0,
      "File-backed consumer decision observations were not recovered after gateway restart.");
    if (interruptedMode || completedLossMode) assert.equal(
      gatewayReport.observation_after_restart.prior_decision_observations_recovered_without_reconciliation_additions, true);
    if (hostedPendingMode || autoCompactionLostResponseMode) assert.equal(
      gatewayReport.observation_after_restart.prior_decision_observations_preserved, true);
    if (!autoCompactionLostResponseMode) assert.notEqual(gatewayReport.observation_before_restart.runtime_epoch_id,
      gatewayReport.observation_after_restart.runtime_epoch_id);
    const restoredChecks = sameWindowMode
      ? ["installed-codex-same-window-restart-invalidates-old-epochs",
        "installed-codex-same-window-restart-recovers-decision-observations",
        ...(sameWindowInterruptedMode ? ["installed-codex-same-window-interrupted-turn-reconciled"] : [])]
      : [interruptedMode ? "installed-codex-interrupted-turn-reconciled"
        : completedLossMode ? "installed-codex-completed-host-unassessed"
          : hostedPendingMode || autoCompactionLostResponseMode ? "installed-codex-confirmed-recovery-observed" : "installed-codex-thread-frontier-observed",
        "restored-thread-decision-observations-recovered", "installed-codex-decision-observations-recovered"];
    for (const check of restoredChecks) {
      assert.ok(restoredUiReport.checks.includes(check), `Missing same-window Companion check: ${check}`);
    }
  }
  process.stdout.write(`${JSON.stringify({schema_version: "are.companion-native-live-gateway-test/v1",
    status: "PASS", codex_version: version, codex_sha256: gatewayReport.host.sha256,
    gateway_thread_count: gatewayReport.observation_before_restart?.thread_count ?? gatewayReport.observation_after_restart?.thread_count,
    gateway_decision_count: gatewayReport.observation_before_restart?.decision_count ?? gatewayReport.observation_after_restart?.decision_count,
    gateway_restarted: recoveryMode, restored_thread_count: gatewayReport.observation_after_restart?.thread_count ?? null,
    restored_decision_count: gatewayReport.observation_after_restart?.decision_count ?? null,
    hosted_pending_recovery_observed: hostedPendingMode ? true : null,
    auto_compaction_lost_response_recovery_observed: autoCompactionLostResponseMode ? true : null,
    same_window_recovery_observed: sameWindowMode,
    connected_resource_sample: resourceReport ? {companion: {orb: resourceReport.ui.orb,
      cycles: resourceReport.ui.cycles}, gateway: resourceReport.gateway} : null,
    ui_checks: uiReport?.checks ?? null, inflight_ui_checks: inflightUiReport?.checks ?? null,
    restored_ui_checks: restoredUiReport?.checks ?? null,
    current_desktop_task_touched: false,
    external_model_calls: 0, authority_effect: "none"})}\n`);
} finally {
  for (const child of children) if (child.exitCode === null && child.signalCode === null) child.kill();
}
