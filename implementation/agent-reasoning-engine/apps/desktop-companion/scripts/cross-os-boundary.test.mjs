import assert from "node:assert/strict";
import {EventEmitter} from "node:events";
import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {test} from "node:test";
import {assertReadOnlyObserverReady, assertReadOnlyWslReady,
  assertReadOnlyEvolutionReady, readOnlyCompanionEnvironment, selectCompanionLaunch,
  waitForOwnedChildExit, wslEvolutionRootToWindowsUnc} from "./cross-os-boundary.mjs";

const endpoint = "tcp://127.0.0.1:43117";
const ready = {ok: true, observation_endpoint: endpoint, backend_adapter_id: "codex-app-server",
  current_desktop_task_control: false, model_entry_boundary: "not-verified",
  hosted_effects_status: "disabled", model_wire_guard_status: "disabled",
  guarded_user_input_status: "disabled", managed_gateway_turn_ingress_blocked_reason: null};

test("accepts only the bound observation-only WSL readiness", () => {
  assert.doesNotThrow(() => assertReadOnlyWslReady(ready, endpoint));
  for (const [field, value] of Object.entries({model_entry_boundary: "guarded-text-only-candidate",
    hosted_effects_status: "candidate-enabled", model_wire_guard_status: "verified-loopback-candidate",
    guarded_user_input_status: "plan-mode-candidate-enabled",
    managed_gateway_turn_ingress_blocked_reason: "windows-client.hook-boundary-unverified",
    current_desktop_task_control: true, observation_endpoint: "tcp://127.0.0.1:43118",
    backend_adapter_id: null})) {
    assert.throws(() => assertReadOnlyWslReady({...ready, [field]: value}, endpoint),
      /cross-os-windows.wsl-binding-mismatch/, field);
  }
  assert.throws(() => assertReadOnlyWslReady({...ready, hosted_effects_status: undefined}, endpoint),
    /cross-os-windows.wsl-binding-mismatch/);
});

test("requires a matching Windows-side observer before parent readiness", () => {
  const observation = {schema_version: "are.adapter-observation/v1", source: "gateway-in-process",
    authority_effect: "none", runtime_epoch_id: "gateway-epoch", selected_backend_adapter_id: "codex-app-server",
    gateway: {status: "running"}, selected_path: {status: "ready"},
    host_task_control: {status: "unverified"}};
  assert.doesNotThrow(() => assertReadOnlyObserverReady(observation, ready.backend_adapter_id));
  for (const [field, value] of Object.entries({source: "launch-environment", authority_effect: "effect",
    runtime_epoch_id: "", selected_backend_adapter_id: "another-backend",
    gateway: {status: "unavailable"}, selected_path: {status: "not-observed"},
    host_task_control: {status: "verified"}})) {
    assert.throws(() => assertReadOnlyObserverReady({...observation, [field]: value}, ready.backend_adapter_id),
      /cross-os-windows.observer-binding-mismatch/, field);
  }
});

test("ambient managed declarations cannot change the Windows Companion mode", () => {
  const base = {PATH: "test-path", ARE_MANAGED_CLIENT_TURN_INGRESS: "windows-client.hook-boundary-unverified",
    ARE_MANAGED_MODEL_ENTRY_BOUNDARY: "guarded-text-only-candidate",
    ARE_COMPANION_GUARDED_PLAN_INPUT: "launch-declared-candidate/v1",
    ARE_COMPANION_EVOLUTION_ROOT: "ambient-wrong-root",
    Are_Companion_Evolution_Signal_Log: "ambient-wrong-log",
    ARE_COMPANION_NODE: "ambient-node", ARE_ADAPTER_OBSERVATION_TOKEN: "ambient-token",
    are_managed_client_turn_ingress: "windows-client.hook-boundary-unverified",
    Are_Companion_Guarded_Plan_Input: "launch-declared-candidate/v1",
    are_companion_node: "ambient-lowercase-node"};
  const env = readOnlyCompanionEnvironment(base, {node: "bound-node", entry: "bound-entry",
    endpoint, token: "bound-token"});
  assert.equal(env.PATH, "test-path");
  assert.equal(env.ARE_COMPANION_NODE, "bound-node");
  assert.equal(env.ARE_COMPANION_ENTRY, "bound-entry");
  assert.equal(env.ARE_COMPANION_OBSERVATION_SOCKET, endpoint);
  assert.equal(env.ARE_ADAPTER_OBSERVATION_TOKEN, "bound-token");
  for (const key of ["ARE_MANAGED_CLIENT_TURN_INGRESS", "ARE_MANAGED_MODEL_ENTRY_BOUNDARY",
    "ARE_COMPANION_GUARDED_PLAN_INPUT", "are_managed_client_turn_ingress",
    "Are_Companion_Guarded_Plan_Input", "are_companion_node",
    "ARE_COMPANION_EVOLUTION_ROOT", "Are_Companion_Evolution_Signal_Log"]) assert.equal(env[key], undefined, key);
  assert.equal(base.ARE_MANAGED_CLIENT_TURN_INGRESS, "windows-client.hook-boundary-unverified");
});

test("an explicit WSL Evolution root is a single Windows read-only source", () => {
  const root = wslEvolutionRootToWindowsUnc("Ubuntu-26.04", "/home/vlad_/.local/share/are/evolution-runtime-v1");
  assert.equal(root, "\\\\wsl.localhost\\Ubuntu-26.04\\home\\vlad_\\.local\\share\\are\\evolution-runtime-v1");
  for (const invalid of ["/", "/home/../private", "/home//private", "/home/private/", "/home\\private", "relative"])
    assert.throws(() => wslEvolutionRootToWindowsUnc("Ubuntu-26.04", invalid), /evolution-root-invalid/);
  const env = readOnlyCompanionEnvironment({ARE_COMPANION_EVOLUTION_ROOT: "ambient-wrong-root"},
    {node: "bound-node", entry: "bound-entry", endpoint, token: "bound-token", evolutionRoot: root});
  assert.equal(env.ARE_COMPANION_EVOLUTION_ROOT, root);
  assert.throws(() => readOnlyCompanionEnvironment({}, {node: "bound-node", entry: "bound-entry",
    endpoint, token: "bound-token", evolutionRoot: "C:\\unrelated"}), /evolution-root-invalid/);
  assert.throws(() => readOnlyCompanionEnvironment({}, {node: "bound-node", entry: "bound-entry",
    endpoint, token: "bound-token", evolutionRoot: "\\\\wsl.localhost\\Ubuntu-26.04\\..\\other"}), /evolution-root-invalid/);
  const observation = {schema_version: "are.evolution-observation/v1",
    source: "durable-ledger-and-candidate-registry", root_status: "present", evidence_status: "verified",
    authority_effect: "none", cycle_count: 5, commit_count: 33,
    projection_digest: "a".repeat(64), observed_at_unix_ms: Date.now()};
  assert.doesNotThrow(() => assertReadOnlyEvolutionReady(observation));
  for (const [key, value] of Object.entries({source: "candidate-registry-only", root_status: "unknown",
    evidence_status: "corrupt", authority_effect: "effect", cycle_count: -1, commit_count: -1,
    projection_digest: "invalid", observed_at_unix_ms: Date.now() - 60_000})) {
    assert.throws(() => assertReadOnlyEvolutionReady({...observation, [key]: value}), /evolution-binding-mismatch/, key);
  }
});

test("bundled native orb is the owned Companion process", context => {
  const root = mkdtempSync(join(tmpdir(), "are-cross-os-orb-selection-"));
  context.after(() => rmSync(root, {recursive: true, force: true}));
  const companion = join(root, "are-companion.exe");
  const orb = join(root, "native-orb", "are-native-orb.exe");
  writeFileSync(companion, "");
  assert.deepEqual(selectCompanionLaunch(companion), {command: companion, args: [], mode: "direct"});
  mkdirSync(join(root, "native-orb"));
  writeFileSync(orb, "");
  assert.deepEqual(selectCompanionLaunch(companion), {
    command: orb, args: ["--dashboard", companion], mode: "native-orb"});
  assert.deepEqual(selectCompanionLaunch(join(root, "custom-client.exe")), {
    command: join(root, "custom-client.exe"), args: [], mode: "direct"});
  rmSync(orb);
  mkdirSync(orb);
  assert.throws(() => selectCompanionLaunch(companion), /cross-os-windows.native-orb-invalid/);
});

test("owned-child exit cannot be missed before lifecycle monitoring starts", async () => {
  const alreadyExited = new EventEmitter();
  alreadyExited.exitCode = 1;
  alreadyExited.signalCode = null;
  assert.equal(await waitForOwnedChildExit(alreadyExited, "wsl-exited"), "wsl-exited");
  assert.equal(alreadyExited.listenerCount("exit"), 0);

  const alreadySignalled = new EventEmitter();
  alreadySignalled.exitCode = null;
  alreadySignalled.signalCode = "SIGTERM";
  assert.equal(await waitForOwnedChildExit(alreadySignalled, "companion-exited"), "companion-exited");
  assert.equal(alreadySignalled.listenerCount("exit"), 0);

  const running = new EventEmitter();
  running.exitCode = null;
  running.signalCode = null;
  const observed = waitForOwnedChildExit(running, "wsl-exited");
  running.exitCode = 1;
  running.emit("exit", 1, null);
  assert.equal(await observed, "wsl-exited");
  assert.equal(running.listenerCount("exit"), 0);
  assert.equal(running.listenerCount("error"), 0);
});
