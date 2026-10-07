#!/usr/bin/env node
// Disposable UI check for one ARE-owned gateway and Companion. Installation
// status belongs to the caller: this harness accepts source or package paths.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {existsSync, mkdtempSync, mkdirSync, readFileSync, readlinkSync, realpathSync, rmSync, statSync, writeFileSync} from "node:fs";
import {createServer} from "node:net";
import {tmpdir} from "node:os";
import {dirname, isAbsolute, join, resolve} from "node:path";
import {createInterface} from "node:readline";
import {fileURLToPath, pathToFileURL} from "node:url";

const appRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const providedArgs = process.argv.slice(2);
const guardedPlanInput = providedArgs.includes("--guarded-plan-input");
const evolutionSignalFixture = providedArgs.includes("--evolution-signal-fixture");
const evolutionRootOption = providedArgs.indexOf("--evolution-root");
const evolutionRootArgument = evolutionRootOption >= 0 ? providedArgs[evolutionRootOption + 1] : null;
const args = providedArgs.filter((value, index) => value !== "--guarded-plan-input"
  && value !== "--evolution-signal-fixture"
  && (evolutionRootOption < 0 || (index !== evolutionRootOption && index !== evolutionRootOption + 1)));
const packageMode = args.length === 4 && args[2] === "--package-root";
const packageRoot = packageMode ? resolve(args[3]) : null;
const productRoot = packageRoot
  ? resolve(packageRoot, "implementation/agent-reasoning-engine") : resolve(appRoot, "../..");
const checkoutRoot = resolve(productRoot, "../..");
const repositoryRoot = resolve(checkoutRoot, "..");
const binary = resolve(args[0] ?? "");
const companion = resolve(args[1] ?? "");
const nativeOrb = resolve(dirname(companion), "native-orb/are-native-orb");
const nativeOrbBundled = existsSync(nativeOrb);
const scratch = mkdtempSync(join(tmpdir(), "are-managed-linux-ui-"));
const state = join(scratch, "state");
const codexHome = join(state, "codex-home");
const runtime = join(scratch, "runtime");
let managed;
let diagnostics = "";
let managedStoppedComponent = null;
let hostedOrigin = null;
const managedEventSchemas = [];
let expectedEvolutionCounts = null;

function childPids(pid) {
  try {
    return readFileSync(`/proc/${pid}/task/${pid}/children`, "utf8").trim()
      .split(/\s+/).filter(Boolean).map(Number);
  } catch { return []; }
}

function childProcessRoles(pid) {
  return childPids(pid).map(child => {
      try {
        const args = readFileSync(`/proc/${child}/cmdline`, "utf8").split("\0");
        return args.some(arg => arg.endsWith("/bin/are-managed-session.mjs")) ? "manager"
          : args.some(arg => arg.endsWith("/bin/are-codex-gateway.mjs")) ? "gateway"
          : args.some(arg => arg.endsWith("/bin/are-codex-windows-client.mjs")) ? "hosted-client"
          : "other";
      } catch { return "unavailable"; }
    });
}

async function freePort() {
  const server = createServer();
  await new Promise((done, fail) => server.once("error", fail).listen(0, "127.0.0.1", done));
  const port = server.address().port;
  await new Promise(done => server.close(done));
  return port;
}

async function readyLine(child) {
  return await new Promise((done, fail) => {
    const lines = createInterface({input: child.stdout, crlfDelay: Infinity});
    const timer = setTimeout(() => fail(new Error("managed-session-ready-timeout")), 30000);
    const clear = () => { clearTimeout(timer); lines.close(); child.off("exit", exited); child.off("error", failed); };
    const exited = () => { clear(); fail(new Error("managed-session-exited-before-ready")); };
    const failed = () => { clear(); fail(new Error("managed-session-spawn-failed")); };
    lines.on("line", line => {
      let value;
      try { value = JSON.parse(line); } catch { return; }
      if (value.schema_version !== "are.managed-session-ready/v1") return;
      clear(); done(value);
    });
    child.once("exit", exited);
    child.once("error", failed);
  });
}

async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = new Promise(done => child.once("exit", done));
  child.kill("SIGTERM");
  await Promise.race([exited, new Promise(done => setTimeout(done, 5000))]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await exited;
  }
}

try {
  assert.ok((args.length === 2 || packageMode)
    && providedArgs.filter(value => value === "--guarded-plan-input").length <= 1
    && providedArgs.filter(value => value === "--evolution-signal-fixture").length <= 1
    && providedArgs.filter(value => value === "--evolution-root").length <= 1
    && (evolutionRootOption < 0 || (typeof evolutionRootArgument === "string"
      && isAbsolute(evolutionRootArgument))),
    "usage: test-managed-session-linux.mjs /absolute/path/to/codex /absolute/path/to/are-companion [--package-root /adjacent/are/cyberAlchemy-v2] [--guarded-plan-input] [--evolution-root /existing/root] [--evolution-signal-fixture]");
  assert.equal(process.platform, "linux");
  assert.ok(process.env.DISPLAY, "an isolated or test-authorized X11 display is required");
  for (const path of [binary, companion]) assert.ok(path.startsWith("/") && existsSync(path), "absolute executable required");
  const companionDependencies = spawnSync("ldd", [companion], {encoding: "utf8", timeout: 10000});
  if (companionDependencies.status !== 0) throw new Error("companion-dependency-inspection-failed");
  const missingDependencies = [...companionDependencies.stdout.matchAll(/^\s*(\S+)\s+=>\s+not found\s*$/gm)]
    .map(match => match[1]);
  if (missingDependencies.length > 0) {
    throw new Error(`companion-system-libraries-missing:${missingDependencies.join(",")}`);
  }
  if (packageMode) {
    assert.equal(packageRoot, resolve(dirname(companion), "../are/cyberAlchemy-v2"),
      "Package root must be the exact resource tree adjacent to the extracted Companion executable");
    assert.equal(process.execPath, resolve(dirname(companion), "../node/bin/node"),
      "Package mode must run the Node executable adjacent to the extracted Companion");
    assert.ok(existsSync(join(productRoot, "bin/are.mjs")), "Packaged ARE entry is missing");
  }
  const evolutionRoot = evolutionRootArgument ? realpathSync(evolutionRootArgument) : null;
  if (evolutionRoot) {
    assert.ok(statSync(evolutionRoot).isDirectory(), "Evolution root must be an existing directory");
    const observed = spawnSync(process.execPath,
      [join(productRoot, "packages/evolution-runtime/bin/observe.mjs"), "--json", "--root", evolutionRoot],
      {encoding: "utf8", timeout: 10000, maxBuffer: 1024 * 1024});
    assert.equal(observed.status, 0, `Evolution preflight failed: ${(observed.stderr ?? "").slice(-300)}`);
    const value = JSON.parse(observed.stdout.trim());
    assert.equal(value.source, "durable-ledger-and-candidate-registry");
    assert.equal(value.evidence_status, "verified");
    expectedEvolutionCounts = {cycles: value.cycle_count, commits: value.commit_count};
  }
  mkdirSync(state, {mode: 0o700});
  mkdirSync(codexHome, {mode: 0o700});
  mkdirSync(runtime, {mode: 0o700});
  const profileSource = join(productRoot, "packages/codex-app-server-wrapper/profiles/interaction-learning-canary-v1.json");
  let managedProfile = profileSource;
  let evolutionSignalLog = null;
  if (evolutionSignalFixture) {
    const {createGatewayEvolutionSignalIntake} = await import(pathToFileURL(join(productRoot,
      "packages/evolution-runtime/src/gateway-signal-intake.mjs")));
    const {emitCompletionImprovementSignals} = await import(pathToFileURL(join(productRoot,
      "packages/codex-app-server-wrapper/src/evolution-signals.mjs")));
    evolutionSignalLog = join(state, "signals.jsonl");
    const intake = createGatewayEvolutionSignalIntake({log_path: evolutionSignalLog});
    try {
      const seeded = await emitCompletionImprovementSignals({
        configuration: {enabled: true, trigger: "turn/completed"},
        completion_message: {params: {turn: {status: "completed", items: []}}},
        completion_digest: "a".repeat(64),
        semantic_completion: {ok: false, disposition: "block", summary_digest: "b".repeat(64)},
        ...intake,
      });
      assert.equal(seeded.disposition, "emitted");
    } finally { assert.equal(intake.close().ok, true); }
    const profile = JSON.parse(readFileSync(profileSource, "utf8"));
    profile.evolution_signals = {enabled: true, trigger: "turn/completed"};
    managedProfile = join(scratch, "evolution-profile.json");
    writeFileSync(managedProfile, `${JSON.stringify(profile)}\n`, {mode: 0o600});
  }
  writeFileSync(join(codexHome, "config.toml"), `model_provider = "are_fixture"\nmodel = "are-fixture"\nweb_search = "disabled"\n[features]\nshell_tool = false\nunified_exec = false\napps = false\nmulti_agent = false\ngoals = false\nremote_plugin = false\nplugins = false\n[model_providers.are_fixture]\nname = "ARE no-model UI fixture"\nbase_url = "http://127.0.0.1:1/v1"\nwire_api = "responses"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n[projects.${JSON.stringify(checkoutRoot)}]\ntrust_level = "trusted"\n`, {mode: 0o600});
  const inspectorPort = await freePort();
  const inspectorServer = `127.0.0.1:${inspectorPort}`;
  managed = spawn(process.execPath, [join(productRoot, "bin/are.mjs"), "managed-session",
    "--config", managedProfile,
    "--repository-root", repositoryRoot, "--codex-command", binary,
    "--state-dir", state, "--cwd", checkoutRoot, "--companion-command", companion,
    ...(evolutionSignalLog ? ["--evolution-signal-log", evolutionSignalLog] : []),
    ...(evolutionRoot ? ["--companion-evolution-root", evolutionRoot] : []),
    ...(guardedPlanInput ? ["--require-restricted-host-profile", "--codex-home", codexHome,
      "--model-wire-upstream", "http://127.0.0.1:1/v1/responses",
      "--model-wire-provider-id", "are_fixture", "--guarded-text-turns",
      "--guarded-user-input", "--guarded-plan-model", "are-fixture"] : [])], {
    env: {...process.env, HOME: scratch, CODEX_HOME: codexHome, ARE_COMPANION_NODE: process.execPath,
      ARE_COMPANION_EVOLUTION_ROOT: join(scratch, "ambient-wrong-root"),
      ARE_COMPANION_EVOLUTION_SIGNAL_LOG: join(scratch, "ambient-wrong-signal-log.jsonl"),
      XDG_RUNTIME_DIR: runtime,
      ARE_COMPANION_ENTRY: join(productRoot, "bin/are.mjs"),
      ARE_COMPANION_PREFERENCES_PATH: join(scratch, "companion.json"),
      WEBKIT_INSPECTOR_HTTP_SERVER: inspectorServer, GDK_BACKEND: "x11",
      WEBKIT_DISABLE_COMPOSITING_MODE: "1"},
    stdio: ["ignore", "pipe", "pipe"], windowsHide: true,
  });
  managed.stderr.on("data", chunk => { diagnostics = (diagnostics + chunk).slice(-2000); });
  const managedEvents = createInterface({input: managed.stdout, crlfDelay: Infinity});
  managedEvents.on("line", line => {
    try {
      const value = JSON.parse(line);
      if (typeof value.schema_version === "string" && managedEventSchemas.length < 12) {
        managedEventSchemas.push(value.schema_version);
      }
      if (value.schema_version === "are.managed-session-stopped/v1") managedStoppedComponent = value.component;
    } catch { /* Only typed status is retained; the launch URL is not logged. */ }
  });
  const ready = await readyLine(managed);
  assert.equal(ready.ok, true);
  assert.equal(ready.companion_process_started, true);
  assert.equal(ready.companion_mode, nativeOrbBundled ? "native-orb" : "direct");
  assert.equal(ready.companion_evolution_root_configured, Boolean(evolutionRoot));
  assert.equal(ready.companion_evolution_signal_log_configured, evolutionSignalFixture);
  assert.equal(ready.evolution_signal_intake_status, evolutionSignalFixture ? "ready" : "disabled");
  assert.equal(ready.current_desktop_task_control, false);
  assert.equal(ready.guarded_user_input_status,
    guardedPlanInput ? "plan-mode-candidate-enabled" : "disabled");
  assert.equal(ready.model_entry_boundary,
    guardedPlanInput ? "guarded-text-only-candidate" : "not-verified");
  const launchUrl = new URL(ready.launch_url);
  const token = launchUrl.hash.slice("#token=".length);
  assert.match(token, /^[A-Za-z0-9_-]{32,128}$/);
  launchUrl.hash = "";
  hostedOrigin = launchUrl.origin;
  const response = await fetch(new URL("api/state", launchUrl), {headers: {authorization: `Bearer ${token}`}});
  assert.equal(response.status, 200);
  const hostedState = await response.json();
  assert.equal(hostedState.ok, true);
  assert.equal(hostedState.value.ready, true);
  assert.equal(hostedState.value.collaboration_mode,
    guardedPlanInput ? "plan-with-guarded-user-input" : "default");
  if (nativeOrbBundled) {
    await new Promise(done => setTimeout(done, 500));
    const activation = spawnSync(companion, [], {env: {...process.env, HOME: scratch,
      XDG_RUNTIME_DIR: runtime, GDK_BACKEND: "x11"}, encoding: "utf8", timeout: 15000,
      maxBuffer: 4096});
    assert.equal(activation.status, 0, `Native orb activation failed: ${(activation.stderr ?? "").slice(-300)}`);
  }
  const inspector = spawnSync(process.execPath, [join(appRoot, "scripts/inspect-linux-ui.mjs"),
    nativeOrbBundled ? "--verify-managed-dashboard-only" : "--verify-managed-session"], {
    env: {...process.env, ARE_LINUX_UI_INSPECTOR_SERVER: inspectorServer,
      ...(expectedEvolutionCounts ? {ARE_LINUX_UI_EXPECT_EVOLUTION_COUNTS: JSON.stringify(expectedEvolutionCounts)} : {}),
      ...(evolutionSignalFixture ? {ARE_LINUX_UI_EXPECT_EVOLUTION_SIGNALS: "1"} : {})},
    encoding: "utf8", timeout: 45000,
    maxBuffer: 1024 * 1024,
  });
  if (inspector.status !== 0) throw new Error(`inspector-failed:${(inspector.stderr ?? "").slice(-700)}`);
  const ui = JSON.parse(inspector.stdout.trim());
  assert.equal(ui.panel_count, 7);
  assert.equal(ui.native_orb_process, nativeOrbBundled);
  assert.equal(ui.evolution_cycle_source, evolutionRoot
    ? "durable-ledger-and-candidate-registry" : "candidate-registry-only");
  assert.equal(ui.evolution_candidate_inbox,
    evolutionSignalFixture ? "one-verified-candidate" : "not-configured");
  if (expectedEvolutionCounts) {
    assert.equal(ui.evolution_cycle_count, expectedEvolutionCounts.cycles);
    assert.equal(ui.evolution_commit_count, expectedEvolutionCounts.commits);
  }
  assert.equal(ui.managed_path?.gateway, "running");
  assert.equal(ui.managed_path?.backend, "ready");
  assert.equal(ui.managed_path?.client, "connected");
  assert.equal(ui.managed_path?.host, "unverified");
  assert.match(ui.managed_rejoin ?? "", /^Hosted client · 0 of 0 backend threads on this page are owned here/);
  assert.equal(ui.managed_path?.guardedPlanInput,
    guardedPlanInput ? "configured at launch (candidate)" : "not declared");
  assert.equal(ui.managed_path?.guard,
    guardedPlanInput ? "parent-heartbeat-observed" : "not-declared");
  assert.match(ui.managed_path?.guardedPlanDetail ?? "",
    guardedPlanInput ? /No question is claimed pending/ : /did not declare guarded Plan questions/);
  const launcherPids = readFileSync(`/proc/${managed.pid}/task/${managed.pid}/children`, "utf8")
    .trim().split(/\s+/).filter(Boolean).map(Number);
  const managerPids = launcherPids.filter(pid => {
    try { return readFileSync(`/proc/${pid}/cmdline`, "utf8").split("\0")[1]
      ?.endsWith("/bin/are-managed-session.mjs") === true; }
    catch { return false; }
  });
  assert.equal(managerPids.length, 1, "the product CLI must own one managed-session process");
  const childPids = readFileSync(`/proc/${managerPids[0]}/task/${managerPids[0]}/children`, "utf8")
    .trim().split(/\s+/).filter(Boolean).map(Number);
  const childExecutables = childPids.map(pid => {
    try { return {pid, path: readlinkSync(`/proc/${pid}/exe`),
      argv: readFileSync(`/proc/${pid}/cmdline`, "utf8").split("\0").slice(0, 2)}; }
    catch { return {pid, path: "unavailable"}; }
  });
  const companionPids = childExecutables.filter(item => item.path === (nativeOrbBundled ? nativeOrb : companion))
    .map(item => item.pid);
  assert.equal(companionPids.length, 1,
    `the supervised Companion surface must have one exact child process: ${JSON.stringify(childExecutables.map(item => item.path))}`);
  const stopped = new Promise((done, fail) => {
    const lines = createInterface({input: managed.stdout, crlfDelay: Infinity});
    const timer = setTimeout(() => fail(new Error("companion-exit-not-supervised")), 8000);
    lines.on("line", line => {
      let value;
      try { value = JSON.parse(line); } catch { return; }
      if (value.schema_version !== "are.managed-session-stopped/v1") return;
      clearTimeout(timer); lines.close(); done(value);
    });
  });
  process.kill(companionPids[0], "SIGTERM");
  const stopRecord = await stopped;
  assert.equal(stopRecord.component, "companion");
  const exitCode = managed.exitCode ?? await new Promise(done => managed.once("exit", done));
  assert.equal(exitCode, 1, "an unexpected Companion exit must stop the managed session");
  process.stdout.write(`${JSON.stringify({schema_version: "are.managed-session-linux-ui-smoke/v1", ok: true,
    orb_rendered: ui.orb_document || ui.native_orb_process, dashboard_rendered: ui.dashboard_document,
    panels: ui.panel_count, product_diagnostic: ui.bundled_product_diagnostic,
    gateway: ui.managed_path.gateway, backend: ui.managed_path.backend,
    client_link: ui.managed_path.client, current_desktop_task_control: false,
    guarded_plan_input_candidate: guardedPlanInput,
    guarded_plan_input_ui: ui.managed_path.guardedPlanInput,
    evolution_cycle_source: ui.evolution_cycle_source,
    evolution_cycle_count: ui.evolution_cycle_count,
    evolution_commit_count: ui.evolution_commit_count,
    companion_exit_supervised: true,
    private_model_calls: 0, external_model_calls: 0,
    installation_posture: "not-assessed-by-ui-harness",
    resource_origin: packageMode ? "adjacent-package-resources" : "repository-source",
    authority_effect: "none"})}\n`);
} catch (error) {
  if (error.cause?.code === "ECONNREFUSED") await new Promise(done => setTimeout(done, 4000));
  const managedReason = diagnostics.split("\n").flatMap(line => {
    try { const value = JSON.parse(line); return typeof value.reason === "string" ? [value.reason] : []; }
    catch { return []; }
  }).at(-1) ?? null;
  const topRoles = managed?.pid ? childProcessRoles(managed.pid) : [];
  const managerPid = managed?.pid ? childPids(managed.pid).find(pid => childProcessRoles(pid)
      .some(role => role === "gateway" || role === "hosted-client")) : null;
  const orbPid = managerPid && nativeOrbBundled ? childPids(managerPid).find(pid => {
    try { return readlinkSync(`/proc/${pid}/exe`) === nativeOrb; } catch { return false; }
  }) : null;
  const orbChildren = orbPid ? childPids(orbPid).map(pid => {
    try { return readlinkSync(`/proc/${pid}/exe`).endsWith("/are-companion") ? "dashboard" : "other"; }
    catch { return "unavailable"; }
  }) : [];
  process.stderr.write(`${JSON.stringify({schema_version: "are.managed-session-linux-ui-smoke-failure/v1",
    ok: false, reason: error.message, managed_diagnostics_present: diagnostics.length > 0,
    managed_reason: managedReason, failure_code: error.cause?.code ?? null,
    managed_exit_code: managed?.exitCode ?? null, managed_signal_code: managed?.signalCode ?? null,
    managed_stopped_component: managedStoppedComponent,
    managed_event_schemas: managedEventSchemas,
    hosted_origin: hostedOrigin,
    launcher_child_roles: topRoles, manager_child_roles: managerPid ? childProcessRoles(managerPid) : [],
    native_orb_alive: Boolean(orbPid), native_orb_child_roles: orbChildren,
    authority_effect: "none"})}\n`);
  process.exitCode = 1;
} finally {
  await stop(managed);
  rmSync(scratch, {recursive: true, force: true});
}
