#!/usr/bin/env node
// Development-only parent for one managed WSL gateway/client. Never prints secrets.
import {spawn} from "node:child_process";
import {once} from "node:events";
import {createInterface} from "node:readline";
import {isAbsolute, resolve} from "node:path";
import {waitForOwnedChildExit} from "../src/owned-child-exit.mjs";

const managedEntry = resolve(import.meta.dirname, "are-managed-session.mjs");
const names = ["--repository-root", "--cwd", "--codex-command", "--state-dir", "--config", "--observation-port"];
function argumentsFor(argv) {
  if (process.platform !== "linux" || argv.length !== names.length * 2) throw new Error("cross-os-wsl.arguments-invalid");
  const values = new Map();
  for (let index = 0; index < argv.length; index += 2) {
    if (!names.includes(argv[index]) || values.has(argv[index]) || !argv[index + 1]) {
      throw new Error("cross-os-wsl.arguments-invalid");
    }
    values.set(argv[index], argv[index + 1]);
  }
  for (const name of names.slice(0, -1)) if (!isAbsolute(values.get(name))) {
    throw new Error("cross-os-wsl.path-not-absolute");
  }
  const portText = values.get("--observation-port");
  if (!/^[1-9][0-9]{0,4}$/.test(portText) || Number(portText) > 65535) {
    throw new Error("cross-os-wsl.port-invalid");
  }
  if (typeof process.env.ARE_ADAPTER_OBSERVATION_TOKEN !== "string"
    || Buffer.byteLength(process.env.ARE_ADAPTER_OBSERVATION_TOKEN) < 32) {
    throw new Error("cross-os-wsl.observation-token-required");
  }
  return {values, portText};
}

async function run() {
  const {values, portText} = argumentsFor(process.argv.slice(2));
  const args = names.slice(0, -1).flatMap(name => [name, values.get(name)]);
  args.push("--port", "0", "--development-observation-tcp-port", portText);
  const managed = spawn(process.execPath, [managedEntry, ...args], {
    env: process.env, stdio: ["ignore", "pipe", "pipe", "ipc"], windowsHide: true,
  });
  let lastReason = null;
  let managedReady = false;
  const lines = createInterface({input: managed.stdout, crlfDelay: Infinity});
  const diagnostics = createInterface({input: managed.stderr, crlfDelay: Infinity});
  diagnostics.on("line", line => {
    try {
      const record = JSON.parse(line);
      if (typeof record.reason === "string" && /^[a-z0-9._-]{1,128}$/.test(record.reason)) lastReason = record.reason;
    } catch { /* Keep child diagnostics private. */ }
  });
  const ready = new Promise((resolveReady, rejectReady) => {
    const timeout = setTimeout(() => rejectReady(new Error("cross-os-wsl.managed-ready-timeout")), 45_000);
    lines.on("line", line => {
      let record;
      try { record = JSON.parse(line); } catch { return; }
      if (record.schema_version !== "are.managed-session-ready/v1") return;
      clearTimeout(timeout);
      managedReady = true;
      resolveReady(record);
    });
    managed.once("exit", () => {
      if (!managedReady) { clearTimeout(timeout); rejectReady(new Error(lastReason ?? "cross-os-wsl.managed-exited")); }
    });
    managed.once("error", error => { clearTimeout(timeout); rejectReady(error); });
  });
  try {
    const record = await ready;
    const endpoint = `tcp://127.0.0.1:${portText}`;
    if (record.ok !== true || record.observation_transport !== "loopback-tcp-development"
      || record.observation_endpoint !== endpoint || record.current_desktop_task_control !== false
      || record.companion_process_started !== false
      || typeof record.backend_adapter_id !== "string" || record.backend_adapter_id.length === 0
      || record.model_entry_boundary !== "not-verified"
      || record.hosted_effects_status !== "disabled"
      || record.model_wire_guard_status !== "disabled"
      || record.guarded_user_input_status !== "disabled"
      || record.managed_gateway_turn_ingress_blocked_reason !== null) {
      throw new Error("cross-os-wsl.managed-binding-mismatch");
    }
    if (managed.exitCode !== null || managed.signalCode !== null) {
      throw new Error("cross-os-wsl.managed-exited-before-parent-ready");
    }
    process.stdout.write(`${JSON.stringify({schema_version: "are.cross-os-wsl-ready/v1", ok: true,
      observation_endpoint: endpoint, backend_adapter_id: record.backend_adapter_id,
      model_entry_boundary: record.model_entry_boundary,
      hosted_effects_status: record.hosted_effects_status,
      model_wire_guard_status: record.model_wire_guard_status,
      guarded_user_input_status: record.guarded_user_input_status,
      managed_gateway_turn_ingress_blocked_reason: record.managed_gateway_turn_ingress_blocked_reason,
      current_desktop_task_control: false, authority_effect: "none"})}\n`);
    const input = createInterface({input: process.stdin, crlfDelay: Infinity});
    const stopRequest = new Promise(resolveStop => {
      input.on("line", line => { if (line.trim() === "stop") resolveStop("stop"); });
      input.once("close", () => resolveStop("stdin-closed"));
      process.once("SIGINT", () => resolveStop("signal"));
      process.once("SIGTERM", () => resolveStop("signal"));
    });
    const observedEnd = await Promise.race([stopRequest,
      waitForOwnedChildExit(managed, "managed-exited")]);
    const ended = managed.exitCode !== null || managed.signalCode !== null
      ? "managed-exited" : observedEnd;
    input.close();
    process.stdout.write(`${JSON.stringify({schema_version: "are.cross-os-wsl-stopping/v1",
      reason: ended, authority_effect: "none"})}\n`);
    return ended === "managed-exited" ? 1 : 0;
  } finally {
    if (managed.exitCode === null && managed.signalCode === null) {
      const exited = once(managed, "exit").catch(() => {});
      if (managed.connected) managed.send({schema_version: "are.managed-session-stop/v1"}, () => {});
      await Promise.race([exited, new Promise(resolveWait => setTimeout(resolveWait, 15_000))]);
      if (managed.exitCode === null && managed.signalCode === null) managed.kill("SIGTERM");
      await Promise.race([exited, new Promise(resolveWait => setTimeout(resolveWait, 5_000))]);
      if (managed.exitCode === null && managed.signalCode === null) managed.kill("SIGKILL");
      await exited;
    }
    lines.close();
    diagnostics.close();
  }
}

try { process.exitCode = await run(); }
catch (error) {
  process.stderr.write(`${JSON.stringify({schema_version: "are.cross-os-wsl-failure/v1", ok: false,
    reason: error?.message ?? "cross-os-wsl.failed", authority_effect: "none"})}\n`);
  process.exitCode = 1;
}
