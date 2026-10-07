import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, chmodSync, symlinkSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {isManagedStopMessage, isManagedTestGuardFaultMessage, managedCompanionEvolutionEnvironment, managedCompanionIngressDeclaration, managedObjectiveContinuityReadiness, parseManagedSessionArgs, preflightManagedSession, selectManagedCompanionLaunch} from "../bin/are-managed-session.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const checkoutRoot = resolve(repositoryRoot, "cyberAlchemy-v2");
const managedBin = resolve(packageRoot, "bin/are-managed-session.mjs");
const profileSource = resolve(packageRoot, "profiles/repository-v1.json");
const catalogFixtureBinary = process.env.ARE_TEST_CODEX_BINARY
  ?? "/mnt/c/Users/vlad_/.codex/bin/wsl/9cc1f56409152293/codex";

async function awaitManagedRecord(child, records, predicate) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const match = records.find(predicate);
    if (match) return match;
    if (child.exitCode !== null || child.signalCode !== null) break;
    await new Promise(done => setTimeout(done, 20));
  }
  throw new Error(`Managed record not observed: ${JSON.stringify(records)}`);
}

test("managed session supervises a bundled native orb rather than its short-lived dashboard launcher", (context) => {
  const root = mkdtempSync(join(tmpdir(), "are-managed-orb-launch-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const orbDir = join(root, "native-orb");
  mkdirSync(orbDir);
  const linuxCompanion = join(root, "are-companion");
  const linuxOrb = join(orbDir, "are-native-orb");
  writeFileSync(linuxCompanion, "");
  writeFileSync(linuxOrb, "");
  assert.deepEqual(selectManagedCompanionLaunch(linuxCompanion, "linux"), {
    command: linuxOrb, args: ["--dashboard", linuxCompanion], mode: "native-orb",
  });
  const windowsCompanion = join(root, "are-companion.exe");
  const windowsOrb = join(orbDir, "are-native-orb.exe");
  writeFileSync(windowsCompanion, "");
  writeFileSync(windowsOrb, "");
  assert.deepEqual(selectManagedCompanionLaunch(windowsCompanion, "win32"), {
    command: windowsOrb, args: ["--dashboard", windowsCompanion], mode: "native-orb",
  });
  assert.deepEqual(selectManagedCompanionLaunch(join(root, "custom-client"), "linux"), {
    command: join(root, "custom-client"), args: [], mode: "direct",
  });
  assert.equal(selectManagedCompanionLaunch(null, "linux"), null);
  rmSync(linuxOrb);
  assert.equal(selectManagedCompanionLaunch(linuxCompanion, "linux").mode, "direct");
  mkdirSync(linuxOrb);
  assert.throws(() => selectManagedCompanionLaunch(linuxCompanion, "linux"),
    /managed-session.native-orb-invalid/);
});

test("managed shutdown accepts only the private parent IPC message", () => {
  assert.equal(isManagedStopMessage({schema_version: "are.managed-session-stop/v1"}), true);
  assert.equal(isManagedStopMessage({schema_version: "are.managed-session-stop/v1", force: true}), false);
  assert.equal(isManagedStopMessage({schema_version: "are.managed-session-stop/v2"}), false);
  assert.equal(isManagedStopMessage(null), false);
  assert.equal(isManagedStopMessage("are.managed-session-stop/v1"), false);
});

test("managed Companion Evolution source ignores ambient roots and signal logs", () => {
  const base = {PATH: "test-path", ARE_COMPANION_EVOLUTION_ROOT: "/wrong-root",
    Are_Companion_Evolution_Root: "/other-wrong-root",
    ARE_COMPANION_EVOLUTION_SIGNAL_LOG: "/wrong-log"};
  assert.deepEqual(managedCompanionEvolutionEnvironment(base), {PATH: "test-path"});
  assert.deepEqual(managedCompanionEvolutionEnvironment(base, "/verified-root"),
    {PATH: "test-path", ARE_COMPANION_EVOLUTION_ROOT: "/verified-root"});
  assert.deepEqual(managedCompanionEvolutionEnvironment(base, null, "/verified-private/signals.jsonl"),
    {PATH: "test-path", ARE_COMPANION_EVOLUTION_SIGNAL_LOG: "/verified-private/signals.jsonl"});
  assert.deepEqual(managedCompanionEvolutionEnvironment(base, "/verified-root", "/verified-private/signals.jsonl"),
    {PATH: "test-path", ARE_COMPANION_EVOLUTION_ROOT: "/verified-root",
      ARE_COMPANION_EVOLUTION_SIGNAL_LOG: "/verified-private/signals.jsonl"});
  assert.equal(base.ARE_COMPANION_EVOLUTION_ROOT, "/wrong-root");
});

test("managed guard fault injection has one exact test-only IPC shape", () => {
  assert.equal(isManagedTestGuardFaultMessage(
    {schema_version: "are.integration-test-stop-model-wire-guard/v1"}), true);
  assert.equal(isManagedTestGuardFaultMessage(
    {schema_version: "are.integration-test-stop-model-wire-guard/v1", force: true}), false);
  assert.equal(isManagedTestGuardFaultMessage({schema_version: "are.managed-session-stop/v1"}), false);
  assert.equal(isManagedTestGuardFaultMessage(null), false);
});

test("managed Companion distinguishes Windows hosted-turn pause from backend readiness", () => {
  assert.equal(managedCompanionIngressDeclaration("win32", false), "windows-client.hook-boundary-unverified");
  assert.equal(managedCompanionIngressDeclaration("win32", true), "unknown");
  assert.equal(managedCompanionIngressDeclaration("win32", false, true), "unknown");
  assert.equal(managedCompanionIngressDeclaration("linux", false), "unknown");
});

test("managed objective readiness preserves missing, disabled, and configured postures", () => {
  assert.deepEqual(managedObjectiveContinuityReadiness({}), {status: "not-reported", requirementTracking: null});
  assert.deepEqual(managedObjectiveContinuityReadiness({objective_continuity_status: "disabled",
    objective_requirement_tracking: false}), {status: "disabled", requirementTracking: false});
  assert.deepEqual(managedObjectiveContinuityReadiness({objective_continuity_status: "configured",
    objective_requirement_tracking: true}), {status: "configured", requirementTracking: true});
  assert.deepEqual(managedObjectiveContinuityReadiness({objective_continuity_status: "unknown",
    objective_requirement_tracking: "yes"}), {status: "not-reported", requirementTracking: null});
});

test("managed session requires explicit bounded launch inputs", () => {
  const args = ["--repository-root", "/work", "--codex-command", "/bin/codex",
    "--state-dir", "/private", "--config", "/profile.json", "--port", "0", "--hook-bridge"];
  assert.deepEqual(parseManagedSessionArgs(args), {
    repository_root: "/work", codex_command: "/bin/codex", state_dir: "/private",
    config: "/profile.json", cwd: "/work", cwd_explicit: false, port: 0, companion_command: null,
    companion_evolution_root: null, evolution_signal_log: null,
    development_observation_tcp_port: null, hook_bridge: true,
    require_mcp_hook_relay: false,
    require_restricted_host_profile: false, codex_home: null,
    windows_sandbox_mode: null,
    probe_windows_hosted_effects: false,
    model_wire_upstream: null, model_wire_provider_id: null, model_wire_upstream_key_env: null,
    allow_hosted_effects: false,
    require_objective_continuity: false,
    probe_unverified_windows_hooks: false,
    windows_guarded_text_turns: false,
    windows_guarded_user_input: false,
    guarded_text_turns: false,
    guarded_user_input: false,
    guarded_plan_model: null,
  });
  assert.throws(() => parseManagedSessionArgs(args.concat("--port", "8")), /managed-session.argument-invalid/);
  assert.throws(() => parseManagedSessionArgs(args.concat("--unknown")), /managed-session.argument-invalid/);
  assert.throws(() => parseManagedSessionArgs(args.slice(0, -1).concat("--cwd")), /managed-session.argument-value-required/);
  assert.throws(() => parseManagedSessionArgs(args.slice(0, -3).concat("--port", "65536")), /managed-session.port-invalid/);
  assert.equal(parseManagedSessionArgs(args.concat("--development-observation-tcp-port", "44111"))
    .development_observation_tcp_port, 44111);
  for (const invalid of ["0", "65536", "127.0.0.1:44000", "00123"]) {
    assert.throws(() => parseManagedSessionArgs(args.concat("--development-observation-tcp-port", invalid)),
      /managed-session.observation-tcp-port-invalid/);
  }
  const restricted = parseManagedSessionArgs(args.concat("--require-restricted-host-profile",
    "--codex-home", "/private/codex-home"));
  assert.equal(restricted.require_restricted_host_profile, true);
  assert.equal(restricted.codex_home, "/private/codex-home");
  assert.equal(parseManagedSessionArgs(args.concat("--windows-sandbox-mode", "unelevated"))
    .windows_sandbox_mode, "unelevated");
  assert.equal(parseManagedSessionArgs(args.concat("--probe-windows-hosted-effects"))
    .probe_windows_hosted_effects, true);
  assert.equal(parseManagedSessionArgs(args.concat("--allow-hosted-effects")).allow_hosted_effects, true);
  assert.equal(parseManagedSessionArgs(args.concat("--require-objective-continuity"))
    .require_objective_continuity, true);
  assert.equal(parseManagedSessionArgs(args.concat("--cwd", "/work/project")).cwd_explicit, true);
  assert.equal(parseManagedSessionArgs(args.concat("--companion-evolution-root", "/private/evolution"))
    .companion_evolution_root, "/private/evolution");
  assert.equal(parseManagedSessionArgs(args.concat("--evolution-signal-log", "/private/signals.jsonl"))
    .evolution_signal_log, "/private/signals.jsonl");
  const guarded = parseManagedSessionArgs(args.concat("--model-wire-upstream",
    "http://127.0.0.1:9911/v1/responses", "--model-wire-provider-id", "are_fixture"));
  assert.equal(guarded.model_wire_provider_id, "are_fixture");
  assert.equal(guarded.model_wire_upstream, "http://127.0.0.1:9911/v1/responses");
  assert.equal(parseManagedSessionArgs(args.concat("--windows-guarded-text-turns")).windows_guarded_text_turns, true);
  assert.equal(parseManagedSessionArgs(args.concat("--windows-guarded-user-input")).windows_guarded_user_input, true);
  assert.equal(parseManagedSessionArgs(args.concat("--guarded-text-turns")).guarded_text_turns, true);
  assert.equal(parseManagedSessionArgs(args.concat("--guarded-user-input")).guarded_user_input, true);
  assert.throws(() => parseManagedSessionArgs(args.concat("--guarded-text-turns",
    "--windows-guarded-text-turns")), /managed-session.guarded-alias-conflict/);
  assert.equal(parseManagedSessionArgs(args.concat("--guarded-plan-model", "are-fixture")).guarded_plan_model,
    "are-fixture");
  assert.equal(parseManagedSessionArgs(args.concat("--model-wire-upstream",
    "https://api.openai.com/v1/responses", "--model-wire-provider-id", "are_fixture",
    "--model-wire-upstream-key-env", "OPENAI_API_KEY")).model_wire_upstream_key_env,
  "OPENAI_API_KEY");
});

test("managed objective continuity requirement fails before client startup when disabled and reports enabled profile",
  {skip: process.platform === "win32" || !existsSync(catalogFixtureBinary)
    ? "Pinned POSIX Codex fixture unavailable" : false}, async (context) => {
    const scratch = mkdtempSync(join(tmpdir(), "are-managed-objective-"));
    context.after(() => rmSync(scratch, {recursive: true, force: true}));
    const source = JSON.parse(readFileSync(profileSource, "utf8"));
    const disabledProfile = join(scratch, "disabled.json");
    const enabledProfile = join(scratch, "enabled.json");
    const companionFixture = join(scratch, "companion-fixture.mjs");
    writeFileSync(companionFixture, `#!/usr/bin/env node
import {writeFileSync} from "node:fs";
writeFileSync(${JSON.stringify(join(scratch, "companion-environment.json"))}, JSON.stringify({
  signalLog: process.env.ARE_COMPANION_EVOLUTION_SIGNAL_LOG ?? null,
  root: process.env.ARE_COMPANION_EVOLUTION_ROOT ?? null,
}));
setInterval(() => {}, 1000);
`, {mode: 0o700});
    writeFileSync(disabledProfile, `${JSON.stringify(source)}\n`);
    writeFileSync(enabledProfile, `${JSON.stringify({...source,
      objective_resolution: {enabled: true, requirement_tracking: true},
      evolution_signals: {enabled: true, trigger: "turn/completed"}})}\n`);
    async function launch(profile, name) {
      const state = join(scratch, name);
      mkdirSync(state, {mode: 0o700});
      const child = spawn(process.execPath, [managedBin, "--repository-root", repositoryRoot,
        "--cwd", checkoutRoot, "--codex-command", catalogFixtureBinary,
        "--state-dir", state, "--config", profile, "--port", "0",
        ...(name === "enabled-state" ? ["--companion-command", companionFixture] : []),
        "--require-objective-continuity", ...(name === "enabled-state" || name === "disabled-with-log"
          ? ["--evolution-signal-log", join(state, "signals.jsonl")] : [])], {env: {...process.env,
          ARE_MANAGED_REQUIREMENT_TRACKING_POSTURE: "disabled",
          ARE_COMPANION_EVOLUTION_SIGNAL_LOG: join(scratch, "ambient-wrong-log.jsonl")},
        stdio: ["ignore", "pipe", "pipe"]});
      const records = [];
      for (const stream of [child.stdout, child.stderr]) {
        let buffered = "";
        stream.on("data", chunk => {
          buffered += chunk.toString("utf8");
          let newline;
          while ((newline = buffered.indexOf("\n")) >= 0) {
            const line = buffered.slice(0, newline);
            buffered = buffered.slice(newline + 1);
            try { records.push(JSON.parse(line)); } catch { /* Only structured readiness is assessed. */ }
          }
        });
      }
      return {child, records};
    }
    const disabled = await launch(disabledProfile, "disabled-state");
    try {
      const failure = await awaitManagedRecord(disabled.child, disabled.records,
        record => record.schema_version === "are.managed-session-start-failure/v1");
      assert.equal(failure.reason, "managed-session.objective-continuity-not-configured");
      assert.equal(disabled.records.some(record => record.schema_version === "are.managed-session-ready/v1"), false);
      if (disabled.child.exitCode === null) await once(disabled.child, "close");
      assert.equal(disabled.child.exitCode, 1);
    } finally {
      if (disabled.child.exitCode === null) disabled.child.kill("SIGTERM");
    }
    const mismatched = await launch(disabledProfile, "disabled-with-log");
    try {
      const failure = await awaitManagedRecord(mismatched.child, mismatched.records,
        record => record.schema_version === "are.managed-session-start-failure/v1");
      assert.match(failure.reason, /gateway.evolution-signals-disabled/);
      assert.equal(mismatched.records.some(record => record.schema_version === "are.managed-session-ready/v1"), false);
    } finally {
      if (mismatched.child.exitCode === null) {
        const closed = once(mismatched.child, "close");
        mismatched.child.kill("SIGTERM");
        await closed;
      }
    }
    const enabled = await launch(enabledProfile, "enabled-state");
    try {
      const ready = await awaitManagedRecord(enabled.child, enabled.records,
        record => record.schema_version === "are.managed-session-ready/v1");
      assert.equal(ready.objective_continuity_status, "configured");
      assert.equal(ready.objective_requirement_tracking, true);
      assert.equal(ready.evolution_signal_intake_status, "ready");
      assert.equal(ready.companion_evolution_signal_log_configured, true);
      assert.equal(existsSync(join(scratch, "enabled-state", "signals.jsonl.writer.lock")), true);
      const companionEnvironmentPath = join(scratch, "companion-environment.json");
      for (let attempt = 0; attempt < 100 && !existsSync(companionEnvironmentPath); attempt++) {
        await new Promise(done => setTimeout(done, 20));
      }
      assert.deepEqual(JSON.parse(readFileSync(companionEnvironmentPath, "utf8")),
        {signalLog: join(scratch, "enabled-state", "signals.jsonl"), root: null});
      assert.equal(ready.current_desktop_task_control, false);
      const launchUrl = new URL(ready.launch_url);
      const token = new URLSearchParams(launchUrl.hash.slice(1)).get("token");
      const stateResponse = await fetch(new URL("/api/state", launchUrl),
        {headers: {authorization: `Bearer ${token}`}});
      assert.equal(stateResponse.status, 200);
      assert.deepEqual((await stateResponse.json()).value.requirement_tracking,
        {status: "enabled", source: "managed-gateway-startup"});
    } finally {
      if (enabled.child.exitCode === null) {
        const closed = once(enabled.child, "close");
        enabled.child.kill("SIGTERM");
        await closed;
      }
    }
  });

test("managed session keeps durable state outside the repository in an explicit private directory", (context) => {
  const root = mkdtempSync(join(tmpdir(), "are-managed-preflight-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const repository = join(root, "repository");
  const project = join(repository, "project");
  const state = join(root, "private-state");
  mkdirSync(project, {recursive: true});
  mkdirSync(state, {mode: 0o700});
  const config = join(root, "profile.json");
  writeFileSync(config, "{}\n");
  const input = {repository_root: repository, codex_command: process.execPath,
    state_dir: state, config, cwd: project, port: 0, companion_command: null, hook_bridge: false};
  const selected = preflightManagedSession(input);
  assert.equal(selected.repositoryRoot, repository);
  assert.equal(selected.stateDir, state);
  assert.equal(selected.cwd, project);
  assert.equal(selected.observationTcpPort, null);
  assert.equal(selected.requireObjectiveContinuity, false);
  assert.equal(selected.companionEvolutionRoot, null);
  assert.equal(selected.evolutionSignalLog, null);
  const signalLog = join(state, "signals.jsonl");
  assert.equal(preflightManagedSession({...input, evolution_signal_log: signalLog})
    .evolutionSignalLog, signalLog);
  assert.throws(() => preflightManagedSession({...input, evolution_signal_log: "relative.jsonl"}),
    /managed-session.evolution-signal-log-absolute-required/);
  assert.throws(() => preflightManagedSession({...input, evolution_signal_log: join(root, "outside.jsonl")}),
    /managed-session.evolution-signal-log-outside-private-state/);
  writeFileSync(signalLog, "");
  const signalLink = join(state, "signal-link.jsonl");
  if (process.platform !== "win32") {
    symlinkSync(signalLog, signalLink);
    assert.throws(() => preflightManagedSession({...input, evolution_signal_log: signalLink}),
      /managed-session.evolution-signal-log-file-invalid/);
    const danglingLink = join(state, "dangling-signal-link.jsonl");
    symlinkSync(join(state, "missing.jsonl"), danglingLink);
    assert.throws(() => preflightManagedSession({...input, evolution_signal_log: danglingLink}),
      /managed-session.evolution-signal-log-file-invalid/);
  }
  assert.throws(() => preflightManagedSession({...input, companion_evolution_root: state}),
    /managed-session.companion-evolution-root-requires-companion-and-absolute-path/);
  assert.throws(() => preflightManagedSession({...input, companion_command: process.execPath,
    companion_evolution_root: "relative"}),
  /managed-session.companion-evolution-root-requires-companion-and-absolute-path/);
  assert.equal(preflightManagedSession({...input, companion_command: process.execPath,
    companion_evolution_root: state}).companionEvolutionRoot, state);
  assert.throws(() => preflightManagedSession({...input, companion_command: process.execPath,
    companion_evolution_root: config}), /managed-session.companion-evolution-root-directory-required/);
  assert.equal(preflightManagedSession({...input, require_objective_continuity: true})
    .requireObjectiveContinuity, true);
  if (process.platform === "linux") {
    const observer = preflightManagedSession({...input, development_observation_tcp_port: 44111});
    assert.equal(observer.observationTcpPort, 44111);
    assert.throws(() => preflightManagedSession({...input, development_observation_tcp_port: 44111,
      companion_command: process.execPath}), /managed-session.observation-tcp-boundary-invalid/);
  } else assert.throws(() => preflightManagedSession({...input, development_observation_tcp_port: 44111}),
    /managed-session.observation-tcp-boundary-invalid/);
  assert.match(selected.gatewaySocket, /gateway\.sock$|are-managed-/);
  assert.throws(() => preflightManagedSession({...input, hook_bridge: true,
    probe_unverified_windows_hooks: true}), /managed-session.unverified-hook-probe-test-only/);
  assert.throws(() => preflightManagedSession({...input, require_mcp_hook_relay: true}),
    /managed-session.mcp-hook-relay-requires-hook-bridge/);
  assert.throws(() => preflightManagedSession({...input, hook_bridge: true,
    require_mcp_hook_relay: true}),
  /managed-session.mcp-hook-relay-requires-dedicated-codex-home/);
  assert.throws(() => preflightManagedSession({...input, require_restricted_host_profile: true}),
    /managed-session.restricted-host-profile-requires-codex-home/);
  assert.throws(() => preflightManagedSession({...input, allow_hosted_effects: true}),
    /managed-session.hosted-effects-require-restricted-host-profile/);
  assert.throws(() => preflightManagedSession({...input, allow_hosted_effects: true,
    require_restricted_host_profile: true, codex_home: join(state, "codex-home")}),
  /managed-session.hosted-effects-require-explicit-cwd/);
  assert.throws(() => preflightManagedSession({...input, codex_home: join(state, "codex-home")}),
    /managed-session.codex-home-requires-restricted-host-profile/);
  assert.throws(() => preflightManagedSession({...input, windows_sandbox_mode: "unelevated"}),
    /managed-session.windows-sandbox-mode-invalid/);
  assert.throws(() => preflightManagedSession({...input, probe_windows_hosted_effects: true}),
    /managed-session.windows-sandbox-probe-mode-required/);
  assert.throws(() => preflightManagedSession({...input, model_wire_upstream: "http://127.0.0.1:9/v1/responses"}),
    /managed-session.model-wire-arguments-must-be-paired/);
  assert.throws(() => preflightManagedSession({...input,
    model_wire_upstream: "http://127.0.0.1:9/v1/responses", model_wire_provider_id: "are_fixture"}),
  /managed-session.model-wire-requires-restricted-host-profile/);
  assert.throws(() => preflightManagedSession({...input, require_restricted_host_profile: true,
    codex_home: join(state, "codex-home"), model_wire_upstream: "http://127.0.0.1:9/v1/responses",
    model_wire_provider_id: "are.fixture"}), /managed-session.model-wire-provider-id-invalid/);
  assert.throws(() => preflightManagedSession({...input, model_wire_upstream_key_env: "OPENAI_API_KEY"}),
    /managed-session.model-wire-upstream-key-env-invalid/);
  assert.throws(() => preflightManagedSession({...input, model_wire_upstream: "https://api.openai.com/v1/responses",
    model_wire_provider_id: "are_fixture", model_wire_upstream_key_env: "ARE_MODEL_WIRE_CLIENT_TOKEN",
    require_restricted_host_profile: true, codex_home: join(state, "codex-home")}),
  /managed-session.model-wire-upstream-key-env-invalid/);
  const codexHome = join(state, "codex-home");
  mkdirSync(codexHome, {mode: 0o700});
  writeFileSync(join(codexHome, "config.toml"), "web_search = \"disabled\"\n", {mode: 0o600});
  assert.equal(preflightManagedSession({...input, hook_bridge: true,
    require_mcp_hook_relay: true, require_restricted_host_profile: true,
    codex_home: codexHome}).requireMcpHookRelay, true);
  const guarded = preflightManagedSession({...input, require_restricted_host_profile: true,
    codex_home: codexHome, model_wire_upstream: "http://127.0.0.1:9/v1/responses",
    model_wire_provider_id: "are_fixture"});
  assert.equal(guarded.modelWireProviderId, "are_fixture");
  if (process.platform === "win32") {
    assert.equal(preflightManagedSession({...input, require_restricted_host_profile: true,
      codex_home: codexHome, windows_sandbox_mode: "unelevated"}).windowsSandboxMode, "unelevated");
    assert.equal(preflightManagedSession({...input, require_restricted_host_profile: true,
      codex_home: codexHome, windows_sandbox_mode: "unelevated",
      probe_windows_hosted_effects: true}).probeWindowsHostedEffects, true);
    assert.throws(() => preflightManagedSession({...input, require_restricted_host_profile: true,
      codex_home: codexHome, windows_sandbox_mode: "default"}),
    /managed-session.windows-sandbox-mode-invalid/);
  } else {
    assert.throws(() => preflightManagedSession({...input, require_restricted_host_profile: true,
      codex_home: codexHome, windows_sandbox_mode: "unelevated"}),
    /managed-session.windows-sandbox-mode-invalid/);
  }
  const guardedWindowsInput = {...input, require_restricted_host_profile: true,
    codex_home: codexHome, model_wire_upstream: "http://127.0.0.1:9/v1/responses",
    model_wire_provider_id: "are_fixture", windows_guarded_text_turns: true};
  const guardedCrossPlatformInput = {...guardedWindowsInput, windows_guarded_text_turns: false,
    guarded_text_turns: true};
  assert.throws(() => preflightManagedSession({...input, guarded_user_input: true}),
    /managed-session.guarded-user-input-requires-guarded-text/);
  assert.throws(() => preflightManagedSession({...input, guarded_plan_model: "are-fixture"}),
    /managed-session.guarded-plan-model-invalid/);
  assert.equal(preflightManagedSession(guardedCrossPlatformInput).guardedTextTurns, true);
  assert.equal(preflightManagedSession({...guardedCrossPlatformInput, guarded_user_input: true,
    guarded_plan_model: "are-fixture"}).guardedUserInput, true);
  assert.throws(() => preflightManagedSession({...guardedCrossPlatformInput, guarded_user_input: true}),
    /managed-session.guarded-plan-model-invalid/);
  assert.throws(() => preflightManagedSession({...guardedCrossPlatformInput, allow_hosted_effects: true,
    cwd_explicit: true}), /managed-session.guarded-text-boundary-invalid/);
  assert.throws(() => preflightManagedSession({...guardedCrossPlatformInput,
    windows_guarded_text_turns: true}), /managed-session.guarded-alias-conflict/);
  if (process.platform === "win32") {
    assert.throws(() => preflightManagedSession({...guardedWindowsInput,
      windows_guarded_text_turns: false, allow_hosted_effects: true,
      cwd_explicit: true}), /managed-session.windows-hosted-effect-sandbox-unverified/);
    assert.equal(preflightManagedSession(guardedWindowsInput).windowsGuardedTextTurns, true);
    assert.throws(() => preflightManagedSession({...guardedWindowsInput, windows_guarded_user_input: true}),
      /managed-session.guarded-plan-model-invalid/);
    assert.equal(preflightManagedSession({...guardedWindowsInput, windows_guarded_user_input: true,
      guarded_plan_model: "are-fixture"})
      .windowsGuardedUserInput, true);
    assert.throws(() => preflightManagedSession({...guardedWindowsInput, allow_hosted_effects: true,
      cwd_explicit: true}), /managed-session.guarded-text-boundary-invalid/);
    assert.throws(() => preflightManagedSession({...guardedWindowsInput,
      probe_unverified_windows_hooks: true, hook_bridge: true}),
    /managed-session.guarded-text-boundary-invalid/);
    assert.throws(() => preflightManagedSession({...guardedWindowsInput, model_wire_upstream: null,
      model_wire_provider_id: null}), /managed-session.guarded-text-boundary-invalid/);
  } else assert.throws(() => preflightManagedSession(guardedWindowsInput),
    /managed-session.windows-guarded-text-boundary-invalid/);
  assert.equal(preflightManagedSession({...input, require_restricted_host_profile: true,
    codex_home: codexHome, model_wire_upstream: "https://api.openai.com/v1/responses",
    model_wire_provider_id: "are_fixture", model_wire_upstream_key_env: "OPENAI_API_KEY"})
    .modelWireUpstreamKeyEnv, "OPENAI_API_KEY");
  assert.throws(() => preflightManagedSession({...input, state_dir: join(repository, "project")}),
    /managed-session.state-inside-repository/);
  assert.throws(() => preflightManagedSession({...input, cwd: state}), /managed-session.cwd-outside-repository/);
  assert.throws(() => preflightManagedSession({...input, codex_command: "codex"}),
    /managed-session.codex_command-absolute-required/);
  if (process.platform !== "win32") {
    chmodSync(state, 0o755);
    assert.throws(() => preflightManagedSession(input), /managed-session.state-directory-not-private/);
  }
});
