#!/usr/bin/env node
// Development-only Windows parent: one WSL managed stack, one read-only Companion.
import {spawn, spawnSync} from "node:child_process";
import {randomBytes} from "node:crypto";
import {existsSync} from "node:fs";
import {dirname, isAbsolute as windowsAbsolute, resolve} from "node:path";
import {createInterface} from "node:readline";
import {assertReadOnlyEvolutionReady, assertReadOnlyObserverReady, assertReadOnlyWslReady,
  readOnlyCompanionEnvironment, selectCompanionLaunch, waitForOwnedChildExit,
  wslEvolutionRootToWindowsUnc} from "./cross-os-boundary.mjs";

const names = ["--distro", "--wsl-node", "--wsl-supervisor", "--wsl-repository-root",
  "--wsl-cwd", "--wsl-codex", "--wsl-state-dir", "--wsl-config", "--observer-port",
  "--companion-exe", "--companion-node", "--companion-entry"];
const wslPaths = [
  ["supervisor", "--wsl-supervisor", "file"],
  ["repository-root", "--wsl-repository-root", "directory"],
  ["cwd", "--wsl-cwd", "directory"],
  ["codex", "--wsl-codex", "file"],
  ["state-dir", "--wsl-state-dir", "directory"],
  ["config", "--wsl-config", "file"],
];
const wslPathProbe = `const fs = require("node:fs");
const paths = JSON.parse(process.argv[1]);
for (let index = 0; index < paths.length; index++) {
  const [name, path, kind] = paths[index];
  let stat;
  try { stat = fs.statSync(path); } catch { stat = null; }
  if (!stat || !(kind === "file" ? stat.isFile() : stat.isDirectory())) {
    process.stdout.write(JSON.stringify({ok: false, missing: name}));
    process.exit(2);
  }
}
process.stdout.write(JSON.stringify({ok: true}));`;

function parse(argv) {
  if (process.platform !== "win32" || argv.length < names.length * 2 || argv.length > names.length * 2 + 4) {
    throw new Error("cross-os-windows.arguments-invalid");
  }
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    const name = argv[index];
    if (!(names.includes(name) || ["--stop-after-ms", "--wsl-evolution-root"].includes(name))
      || values.has(name) || !argv[index + 1]) {
      throw new Error("cross-os-windows.arguments-invalid");
    }
    values.set(name, argv[index + 1]);
  }
  if (names.some(name => !values.has(name)) || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(values.get("--distro"))) {
    throw new Error("cross-os-windows.arguments-invalid");
  }
  for (const name of names.filter(name => name.startsWith("--wsl-") && name !== "--wsl-supervisor")) {
    if (!values.get(name).startsWith("/")) throw new Error("cross-os-windows.wsl-path-invalid");
  }
  if (!values.get("--wsl-supervisor").startsWith("/")) throw new Error("cross-os-windows.wsl-path-invalid");
  if (values.has("--wsl-evolution-root")) {
    wslEvolutionRootToWindowsUnc(values.get("--distro"), values.get("--wsl-evolution-root"));
  }
  for (const name of ["--companion-exe", "--companion-node", "--companion-entry"]) {
    const path = values.get(name);
    if (!windowsAbsolute(path) || !existsSync(path)) throw new Error("cross-os-windows.companion-path-invalid");
  }
  const portText = values.get("--observer-port");
  if (!/^[1-9][0-9]{0,4}$/.test(portText) || Number(portText) > 65535) {
    throw new Error("cross-os-windows.port-invalid");
  }
  if (values.has("--stop-after-ms") && (process.env.ARE_INTEGRATION_TEST_MODE !== "1"
    || !/^[1-9][0-9]{0,5}$/.test(values.get("--stop-after-ms"))
    || Number(values.get("--stop-after-ms")) > 120_000)) {
    throw new Error("cross-os-windows.test-stop-invalid");
  }
  return values;
}

function waitForLine(child, schema, timeoutMs, diagnostics) {
  const lines = createInterface({input: child.stdout, crlfDelay: Infinity});
  const result = new Promise((resolveReady, rejectReady) => {
    const timer = setTimeout(() => rejectReady(new Error(`${schema}:timeout`)), timeoutMs);
    lines.on("line", line => {
      let record;
      try { record = JSON.parse(line); } catch { return; }
      if (record.schema_version !== schema) return;
      clearTimeout(timer);
      resolveReady(record);
    });
    child.once("exit", () => { clearTimeout(timer); rejectReady(new Error(diagnostics() ?? `${schema}:exited`)); });
    child.once("error", error => { clearTimeout(timer); rejectReady(error); });
  });
  return {result, lines};
}

async function awaitNativeOrbReady(child) {
  if (!child.stdout) throw new Error("cross-os-windows.native-orb-output-unavailable");
  if (child.exitCode !== null || child.signalCode !== null) {
    throw new Error("cross-os-windows.native-orb-exited-before-ready");
  }
  const lines = createInterface({input: child.stdout, crlfDelay: Infinity});
  try {
    await new Promise((resolveReady, rejectReady) => {
      const timer = setTimeout(() => rejectReady(new Error("cross-os-windows.native-orb-ready-timeout")), 30_000);
      lines.on("line", line => {
        if (line !== "ARE_NATIVE_ORB_READY") return;
        clearTimeout(timer);
        resolveReady();
      });
      child.once("exit", () => { clearTimeout(timer); rejectReady(new Error("cross-os-windows.native-orb-exited-before-ready")); });
      child.once("error", error => { clearTimeout(timer); rejectReady(error); });
    });
  } finally {
    lines.close();
    child.stdout.resume();
  }
}

function preflightWslPaths(values) {
  const probeEnv = {...process.env};
  delete probeEnv.ARE_ADAPTER_OBSERVATION_TOKEN;
  delete probeEnv.ARE_CROSS_OS_TEST_TOKEN;
  const selectedPaths = values.has("--wsl-evolution-root")
    ? [...wslPaths, ["evolution-root", "--wsl-evolution-root", "directory"]] : wslPaths;
  const paths = selectedPaths.map(([name, option, kind]) => [name, values.get(option), kind]);
  const result = spawnSync("wsl.exe", ["-d", values.get("--distro"), "--exec",
    values.get("--wsl-node"), "-e", wslPathProbe, JSON.stringify(paths)], {
    env: probeEnv, encoding: "utf8", timeout: 45_000, maxBuffer: 4096, windowsHide: true,
  });
  let record;
  try { record = JSON.parse(result.stdout?.trim() ?? ""); } catch { /* Do not forward WSL output. */ }
  if (record?.ok === false && selectedPaths.some(([name]) => name === record.missing)) {
    throw new Error(`cross-os-windows.wsl-${record.missing}-missing`);
  }
  if (result.error || result.status !== 0 || record?.ok !== true) {
    throw new Error("cross-os-windows.wsl-preflight-unavailable");
  }
}

function awaitWindowsEvolutionReady(values, windowsRoot) {
  const observer = resolve(dirname(values.get("--companion-entry")), "../packages/evolution-runtime/bin/observe.mjs");
  if (!existsSync(observer)) throw new Error("cross-os-windows.evolution-observer-missing");
  const probe = spawnSync(values.get("--companion-node"), [observer, "--json", "--root", windowsRoot], {
    encoding: "utf8", timeout: 20_000, maxBuffer: 1024 * 1024, windowsHide: true,
  });
  if (probe.error || probe.status !== 0) throw new Error("cross-os-windows.evolution-observer-unavailable");
  let observation;
  try { observation = JSON.parse(probe.stdout); }
  catch { throw new Error("cross-os-windows.evolution-observer-invalid"); }
  assertReadOnlyEvolutionReady(observation);
}

async function awaitWindowsObserverReady(values, endpoint, environment, backendAdapterId, wsl) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (wsl.exitCode !== null || wsl.signalCode !== null) {
      throw new Error("cross-os-windows.wsl-exited-before-observer-ready");
    }
    const probe = spawnSync(values.get("--companion-node"), [values.get("--companion-entry"),
      "adapter-status", "--json", "--socket", endpoint], {
      env: environment, encoding: "utf8", timeout: 5_000, maxBuffer: 64 * 1024, windowsHide: true,
    });
    if (probe.status === 0) {
      let observation;
      try { observation = JSON.parse(probe.stdout); }
      catch { throw new Error("cross-os-windows.observer-binding-mismatch"); }
      assertReadOnlyObserverReady(observation, backendAdapterId);
      return;
    }
    await new Promise(resolveWait => setTimeout(resolveWait, 300));
  }
  throw new Error("cross-os-windows.observer-unavailable");
}

async function run() {
  const values = parse(process.argv.slice(2));
  preflightWslPaths(values);
  const token = process.env.ARE_INTEGRATION_TEST_MODE === "1" && process.env.ARE_CROSS_OS_TEST_TOKEN
    ? process.env.ARE_CROSS_OS_TEST_TOKEN : randomBytes(32).toString("hex");
  if (Buffer.byteLength(token) < 32) throw new Error("cross-os-windows.observation-token-invalid");
  const endpoint = `tcp://127.0.0.1:${values.get("--observer-port")}`;
  const wslArgs = ["-d", values.get("--distro"), "--exec", values.get("--wsl-node"),
    values.get("--wsl-supervisor"),
    "--repository-root", values.get("--wsl-repository-root"), "--cwd", values.get("--wsl-cwd"),
    "--codex-command", values.get("--wsl-codex"), "--state-dir", values.get("--wsl-state-dir"),
    "--config", values.get("--wsl-config"), "--observation-port", values.get("--observer-port")];
  const wsl = spawn("wsl.exe", wslArgs, {stdio: ["pipe", "pipe", "pipe"], windowsHide: true,
    env: {...process.env, ARE_ADAPTER_OBSERVATION_TOKEN: token,
      TMPDIR: values.get("--wsl-state-dir"),
      WSLENV: "ARE_ADAPTER_OBSERVATION_TOKEN/u:TMPDIR/u"}});
  let lastReason = null;
  const diagnosticLines = createInterface({input: wsl.stderr, crlfDelay: Infinity});
  diagnosticLines.on("line", line => {
    try {
      const record = JSON.parse(line);
      if (typeof record.reason === "string" && /^[a-z0-9._-]{1,128}$/.test(record.reason)) lastReason = record.reason;
    } catch { /* Never forward child stderr or an observer token. */ }
  });
  let companion = null;
  let readyLines;
  let stopLines;
  let companionStopUnverified = false;
  let testStopTimer;
  try {
    const waiting = waitForLine(wsl, "are.cross-os-wsl-ready/v1", 60_000, () => lastReason);
    readyLines = waiting.lines;
    const ready = await waiting.result;
    assertReadOnlyWslReady(ready, endpoint);
    const windowsEvolutionRoot = values.has("--wsl-evolution-root")
      ? wslEvolutionRootToWindowsUnc(values.get("--distro"), values.get("--wsl-evolution-root")) : null;
    const companionEnv = readOnlyCompanionEnvironment(process.env, {
      node: values.get("--companion-node"), entry: values.get("--companion-entry"), endpoint, token,
      evolutionRoot: windowsEvolutionRoot});
    await awaitWindowsObserverReady(values, endpoint, companionEnv, ready.backend_adapter_id, wsl);
    if (windowsEvolutionRoot !== null) awaitWindowsEvolutionReady(values, windowsEvolutionRoot);
    const companionLaunch = selectCompanionLaunch(values.get("--companion-exe"));
    companion = spawn(companionLaunch.command, companionLaunch.args, {env: companionEnv,
      stdio: companionLaunch.mode === "native-orb" ? ["ignore", "pipe", "ignore"] : "ignore",
      windowsHide: false});
    await new Promise((resolveSpawn, rejectSpawn) => {
      companion.once("spawn", resolveSpawn);
      companion.once("error", rejectSpawn);
    });
    if (companionLaunch.mode === "native-orb") await awaitNativeOrbReady(companion);
    if (wsl.exitCode !== null || wsl.signalCode !== null) {
      throw new Error("cross-os-windows.wsl-exited-before-parent-ready");
    }
    if (companion.exitCode !== null || companion.signalCode !== null) {
      throw new Error("cross-os-windows.companion-exited-before-parent-ready");
    }
    process.stdout.write(`${JSON.stringify({schema_version: "are.cross-os-windows-ready/v1", ok: true,
      observation_endpoint: endpoint, backend_adapter_id: ready.backend_adapter_id,
      model_entry_boundary: ready.model_entry_boundary,
      hosted_effects_status: ready.hosted_effects_status,
      model_wire_guard_status: ready.model_wire_guard_status,
      guarded_user_input_status: ready.guarded_user_input_status,
      companion_process_started: true, companion_mode: companionLaunch.mode,
      evolution_root_observation: windowsEvolutionRoot === null ? "not-configured" : "verified-before-companion-launch",
      current_desktop_task_control: false,
      authority_effect: "none"})}\n`);
    const input = createInterface({input: process.stdin, crlfDelay: Infinity});
    const stopRequest = new Promise(resolveStop => {
      input.on("line", line => { if (line.trim() === "stop") resolveStop("stop"); });
      input.once("close", () => { if (!values.has("--stop-after-ms")) resolveStop("stdin-closed"); });
      process.once("SIGINT", () => resolveStop("signal"));
      process.once("SIGTERM", () => resolveStop("signal"));
      if (values.has("--stop-after-ms")) testStopTimer = setTimeout(() => resolveStop("test-timer"),
        Number(values.get("--stop-after-ms")));
    });
    const observedReason = await Promise.race([stopRequest,
      waitForOwnedChildExit(companion, "companion-exited"),
      waitForOwnedChildExit(wsl, "wsl-exited")]);
    const reason = companion.exitCode !== null || companion.signalCode !== null ? "companion-exited"
      : wsl.exitCode !== null || wsl.signalCode !== null ? "wsl-exited" : observedReason;
    input.close();
    process.stdout.write(`${JSON.stringify({schema_version: "are.cross-os-windows-stopping/v1",
      reason, authority_effect: "none"})}\n`);
    return reason === "companion-exited" || reason === "wsl-exited" ? 1 : 0;
  } finally {
    clearTimeout(testStopTimer);
    if (companion && companion.exitCode === null && companion.signalCode === null) {
      const exited = new Promise(resolveExit => companion.once("exit", resolveExit));
      companion.kill();
      await Promise.race([exited, new Promise(resolveWait => setTimeout(resolveWait, 5_000))]);
      companionStopUnverified = companion.exitCode === null && companion.signalCode === null;
    }
    readyLines?.close();
    diagnosticLines.close();
    if (wsl.exitCode === null && wsl.signalCode === null) {
      const stopped = waitForLine(wsl, "are.cross-os-wsl-stopping/v1", 25_000, () => lastReason);
      stopLines = stopped.lines;
      wsl.stdin.write("stop\n");
      wsl.stdin.end();
      const record = await stopped.result;
      if (!["stop", "stdin-closed"].includes(record.reason)) throw new Error("cross-os-windows.wsl-stop-unverified");
      await Promise.race([new Promise(resolveExit => wsl.once("exit", resolveExit)),
        new Promise((_, rejectWait) => setTimeout(() => rejectWait(new Error("cross-os-windows.wsl-exit-timeout")), 25_000))]);
      if (wsl.exitCode !== 0) throw new Error("cross-os-windows.wsl-exit-nonzero");
    }
    stopLines?.close();
    if (companionStopUnverified) throw new Error("cross-os-windows.companion-stop-unverified");
  }
}

try { process.exitCode = await run(); }
catch (error) {
  process.stderr.write(`${JSON.stringify({schema_version: "are.cross-os-windows-failure/v1", ok: false,
    reason: error?.message ?? "cross-os-windows.failed", authority_effect: "none"})}\n`);
  process.exitCode = 1;
}
