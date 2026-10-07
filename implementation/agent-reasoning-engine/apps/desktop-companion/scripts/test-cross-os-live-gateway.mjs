#!/usr/bin/env node
// Disposable WSL Codex turn -> authenticated loopback observer -> native Windows WebView2.
// This never connects to or takes control of the current desktop task.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {existsSync, statSync} from "node:fs";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {assertReadOnlyObserverReady} from "./cross-os-boundary.mjs";

const [companionArg, windowsNodeArg, codexArg, optionalFlag, evolutionRootArg] = process.argv.slice(2);
if (process.platform !== "linux" || !process.env.WSL_DISTRO_NAME
  || ![5, 7].includes(process.argv.length)
  || (process.argv.length === 7 && optionalFlag !== "--evolution-live-root")) {
  throw new Error("Usage inside WSL: node test-cross-os-live-gateway.mjs <extracted-companion.exe> <windows-node.exe> <wsl-codex-binary> [--evolution-live-root <existing-wsl-root>]");
}
const companion = resolve(companionArg);
const windowsNode = resolve(windowsNodeArg);
const codex = resolve(codexArg);
for (const path of [companion, windowsNode, codex]) assert.ok(existsSync(path), `Missing test input: ${path}`);
const evolutionRoot = evolutionRootArg ? resolve(evolutionRootArg) : null;
if (evolutionRoot) assert.ok(existsSync(evolutionRoot) && statSync(evolutionRoot).isDirectory(),
  "The selected live Evolution root must be an existing directory.");
const here = dirname(fileURLToPath(import.meta.url));
const canary = resolve(here, "../../../packages/codex-app-server-wrapper/scripts/native-user-input-canary.mjs");
const uiTest = resolve(here, "test-windows-ui.mjs");
const bundledEntry = resolve(dirname(companion), "are/cyberAlchemy-v2/implementation/agent-reasoning-engine/bin/are.mjs");
assert.ok(existsSync(bundledEntry), "Bundled ARE entry is unavailable.");

function windowsPath(path) {
  const result = spawnSync("wslpath", ["-w", path], {encoding: "utf8", timeout: 5000});
  assert.equal(result.status, 0, "WSL path conversion failed");
  return result.stdout.trim();
}

function waitForExit(child, label, timeoutMs) {
  return new Promise((resolveExit, rejectExit) => {
    const timer = setTimeout(() => rejectExit(new Error(`${label} timed out`)), timeoutMs);
    child.once("error", error => { clearTimeout(timer); rejectExit(error); });
    child.once("close", (code, signal) => { clearTimeout(timer); resolveExit({code, signal}); });
  });
}

async function waitForWindowsObserver(ready) {
  const wslenv = [process.env.WSLENV ?? "", "ARE_ADAPTER_OBSERVATION_TOKEN/w"].filter(Boolean).join(":");
  const deadline = Date.now() + 20_000;
  let lastReason = "not-reachable";
  while (Date.now() < deadline) {
    const probe = spawnSync(windowsNode, [windowsPath(bundledEntry), "adapter-status", "--json",
      "--socket", ready.socket_path], {encoding: "utf8", timeout: 5_000, maxBuffer: 64 * 1024,
      env: {...process.env, WSLENV: wslenv, ARE_ADAPTER_OBSERVATION_TOKEN: ready.token}});
    if (probe.status === 0) {
      let observation;
      try { observation = JSON.parse(probe.stdout); }
      catch { throw new Error("Joined Windows observer returned invalid JSON."); }
      assertReadOnlyObserverReady(observation, "codex-app-server/v1");
      return;
    }
    lastReason = probe.error?.code ?? `exit-${probe.status ?? "unknown"}`;
    await new Promise(resolveWait => setTimeout(resolveWait, 300));
  }
  throw new Error(`Joined Windows observer was not ready within 20 seconds (${lastReason}).`);
}

const version = spawnSync(codex, ["--version"], {encoding: "utf8", timeout: 5000});
assert.equal(version.status, 0, "WSL Codex version check failed");
const exactVersion = version.stdout.trim();
assert.match(exactVersion, /^codex-cli /);

let gateway;
let gatewayExit;
let gatewayOutput = "";
let gatewayError = "";
let pendingLine = "";
const observations = [];
const waiters = [];
try {
  gateway = spawn(process.execPath, [canary, codex, exactVersion, "--hold-observation-tcp", "--hold-active-observation"],
    {stdio: ["pipe", "pipe", "pipe"], env: process.env});
  gatewayExit = waitForExit(gateway, "WSL Codex canary", 180_000);
  gateway.stdout.on("data", chunk => { gatewayOutput = (gatewayOutput + chunk).slice(-1024 * 1024); });
  gateway.stderr.on("data", chunk => {
    pendingLine += chunk;
    let end;
    while ((end = pendingLine.indexOf("\n")) >= 0) {
      const line = pendingLine.slice(0, end).trim();
      pendingLine = pendingLine.slice(end + 1);
      if (!line.startsWith("ARE_CANARY_OBSERVATION_READY ")) {
        gatewayError = (gatewayError + line + "\n").slice(-8192);
        continue;
      }
      try {
        const ready = JSON.parse(line.slice("ARE_CANARY_OBSERVATION_READY ".length));
        const waiter = waiters.shift();
        if (waiter) waiter.resolve(ready);
        else observations.push(ready);
      } catch (error) {
        const waiter = waiters.shift();
        if (waiter) waiter.reject(error);
      }
    }
  });
  gateway.once("close", () => {
    for (const waiter of waiters.splice(0)) waiter.reject(new Error("WSL canary exited before observation was ready"));
  });

  function nextObservation(phase) {
    if (observations.length) return Promise.resolve(observations.shift());
    if (gateway.exitCode !== null || gateway.signalCode !== null) {
      return Promise.reject(new Error(`WSL canary exited before ${phase} observation`));
    }
    return new Promise((resolveReady, rejectReady) => {
      const waiter = {
        resolve(value) { clearTimeout(timer); resolveReady(value); },
        reject(error) { clearTimeout(timer); rejectReady(error); },
      };
      const timer = setTimeout(() => {
        waiters.splice(waiters.indexOf(waiter), 1);
        rejectReady(new Error(`${phase} observation timed out`));
      }, 90_000);
      waiters.push(waiter);
    });
  }

  async function runUi(ready, phase) {
    assert.equal(ready.phase, phase);
    assert.match(ready.socket_path, /^tcp:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/);
    assert.ok(typeof ready.token === "string" && ready.token.length >= 32);
    const wslenv = [process.env.WSLENV ?? "", "ARE_ADAPTER_OBSERVATION_TOKEN/w"].filter(Boolean).join(":");
    const args = [windowsPath(uiTest), windowsPath(companion), "--adapter-external-socket", ready.socket_path,
      phase === "active-turn" ? "--adapter-external-inflight" : "--adapter-external-active", "--timeout-ms", "45000"];
    const ui = spawn(windowsNode, args, {stdio: ["ignore", "pipe", "pipe"],
      env: {...process.env, WSLENV: wslenv, ARE_ADAPTER_OBSERVATION_TOKEN: ready.token}});
    let output = "";
    let error = "";
    ui.stdout.on("data", chunk => { output = (output + chunk).slice(-1024 * 1024); });
    ui.stderr.on("data", chunk => { error = (error + chunk).slice(-8192); });
    try {
      const result = await waitForExit(ui, `Windows Companion ${phase}`, 120_000);
      let report;
      try { report = JSON.parse(output.trim()); }
      catch { throw new Error(`Windows Companion ${phase} returned no JSON (exit ${result.code}): ${error.replaceAll(ready.token, "[redacted]")}`); }
      const failure = {reason: report.error ?? error, checks: report.checks ?? [],
        connection: report.dashboard?.connectionTitle ?? null,
        adapter: report.dashboard?.adapterSummary ?? null,
        adapterDetail: report.dashboard?.adapterSummaryDetail ?? null,
        transport: report.dashboard?.observationTransport ?? null,
        pagePaths: (report.pages ?? []).slice(0, 8).map(page => {
          try { return new URL(page.url).pathname; } catch { return "unknown"; }
        }),
        newPageReadyState: report.newPageState?.readyState ?? null,
        orbErrorCount: Array.isArray(report.orbErrors) ? report.orbErrors.length : 0,
        gatewayExitCode: gateway?.exitCode ?? null,
        gatewaySignalCode: gateway?.signalCode ?? null};
      assert.equal(result.code, 0, `Windows Companion ${phase} failed: ${JSON.stringify(failure).replaceAll(ready.token, "[redacted]")}`);
      assert.equal(report.ok, true);
      for (const check of ["adapter-live-loopback-observed", "installed-codex-thread-decision-link-observed", "installed-codex-decisions-observed",
        phase === "active-turn" ? "installed-codex-inflight-thread-observed-without-frontier" : "installed-codex-thread-frontier-observed"]) {
        assert.ok(report.checks.includes(check), `Missing ${phase} check: ${check}`);
      }
      return report;
    } finally {
      if (ui.exitCode === null && ui.signalCode === null) ui.kill();
    }
  }

  async function runJoinedEvolutionUi(ready) {
    assert.equal(ready.phase, "active-turn");
    assert.match(ready.socket_path, /^tcp:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/);
    assert.ok(typeof ready.token === "string" && ready.token.length >= 32);
    const wslenv = [process.env.WSLENV ?? "", "ARE_ADAPTER_OBSERVATION_TOKEN/w"].filter(Boolean).join(":");
    const args = [windowsPath(uiTest), windowsPath(companion),
      "--evolution-live-root", windowsPath(evolutionRoot),
      "--adapter-external-socket", ready.socket_path, "--timeout-ms", "45000"];
    const ui = spawn(windowsNode, args, {stdio: ["ignore", "pipe", "pipe"],
      env: {...process.env, WSLENV: wslenv, ARE_ADAPTER_OBSERVATION_TOKEN: ready.token}});
    let output = "";
    let error = "";
    ui.stdout.on("data", chunk => { output = (output + chunk).slice(-1024 * 1024); });
    ui.stderr.on("data", chunk => { error = (error + chunk).slice(-8192); });
    try {
      const result = await waitForExit(ui, "Joined Windows adapter and Evolution UI", 120_000);
      let report;
      try { report = JSON.parse(output.trim()); }
      catch { throw new Error(`Joined Windows UI returned no JSON (exit ${result.code}): ${error.replaceAll(ready.token, "[redacted]")}`); }
      assert.equal(result.code, 0, `Joined Windows UI failed: ${String(report.error ?? error).replaceAll(ready.token, "[redacted]")}`);
      assert.equal(report.ok, true);
      for (const check of ["authenticated-adapter-path-observed-without-task-control",
        "live-ledger-counts-rendered", "recorded-cycle-visible", "coordination-summary-rendered",
        "existing-ledger-projection-unchanged"]) {
        assert.ok(report.checks.includes(check), `Missing joined UI check: ${check}`);
      }
      assert.equal(report.adapter_path_observed, true);
      return report;
    } finally {
      if (ui.exitCode === null && ui.signalCode === null) ui.kill();
    }
  }

  const active = await nextObservation("active-turn");
  await waitForWindowsObserver(active);
  const activeUi = await runUi(active, "active-turn");
  const joinedEvolutionUi = evolutionRoot ? await runJoinedEvolutionUi(active) : null;
  gateway.stdin.write("continue\n");
  const completed = await nextObservation("before-restart");
  assert.equal(completed.socket_path, active.socket_path, "Observer endpoint changed during one turn");
  assert.equal(completed.token, active.token, "Observer token changed during one turn");
  await waitForWindowsObserver(completed);
  const completedUi = await runUi(completed, "before-restart");
  gateway.stdin.write("continue\n");
  gateway.stdin.end();
  const exited = await gatewayExit;
  assert.ok(gatewayOutput.trim(), `WSL canary produced no result: ${gatewayError.replaceAll(active.token, "[redacted]")}`);
  const report = JSON.parse(gatewayOutput.trim());
  assert.equal(exited.code, 0, `WSL canary failed: ${String(report.error ?? gatewayError).replaceAll(active.token, "[redacted]")}`);
  assert.equal(report.status, "PASS");
  assert.equal(report.external_model_calls, 0);
  assert.equal(report.current_desktop_task_touched, false);
  assert.equal(report.observation_during_active_turn.phase, "turn-active");
  assert.equal(report.observation_during_active_turn.completed_frontier_present, false);
  assert.equal(report.observation_before_restart.thread_count, 1);
  assert.ok(report.observation_before_restart.decision_count > 0);
  process.stdout.write(`${JSON.stringify({schema_version: "are.companion-cross-os-live-gateway-test/v1", status: "PASS",
    codex_version: exactVersion, codex_sha256: report.host.sha256, active_ui_checks: activeUi.checks.length,
    completed_ui_checks: completedUi.checks.length, thread_count: report.observation_before_restart.thread_count,
    decision_count: report.observation_before_restart.decision_count, external_model_calls: 0,
    windows_observer_preflight: "verified-before-each-ui-phase",
    joined_evolution_ui_checks: joinedEvolutionUi?.checks.length ?? null,
    joined_evolution_cycles: joinedEvolutionUi?.observed_cycles ?? null,
    joined_evolution_commits: joinedEvolutionUi?.observed_commits ?? null,
    joined_evolution_phases: joinedEvolutionUi?.observed_phases ?? null,
    current_desktop_task_touched: false, authority_effect: "none"})}\n`);
} finally {
  if (gateway && gateway.exitCode === null) {
    gateway.stdin.end();
    gateway.kill("SIGTERM");
    await gatewayExit?.catch(() => {});
  }
}
