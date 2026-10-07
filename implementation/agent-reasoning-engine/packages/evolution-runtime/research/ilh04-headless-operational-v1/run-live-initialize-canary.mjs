#!/usr/bin/env node
import {createHash} from "node:crypto";
import {spawn} from "node:child_process";
import {closeSync, fsyncSync, mkdirSync, mkdtempSync, openSync, renameSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";

import {canonicalJson, canonicalizeJson} from "../../../intent-route-resolver/index.mjs";
import {connectGatewayRpcTransport, createAppServerRpcClient} from "../../../codex-app-server-wrapper/index.mjs";

const cycleId = "ilh04-headless-operational-v1";
const evolutionRoot = resolve(import.meta.dirname, "../..");
const repositoryRoot = resolve(evolutionRoot, "../../../..");
const configurationRoot = resolve(repositoryRoot, "..");
const wrapperRoot = resolve(evolutionRoot, "../codex-app-server-wrapper");
const evidenceRoot = resolve(evolutionRoot, "evidence", cycleId);
const manifestPath = resolve(evidenceRoot, "activation-manifest.json");
const digest = (value) => createHash("sha256").update(canonicalJson(canonicalizeJson(value))).digest("hex");

function atomicJson(path, value) {
  mkdirSync(resolve(path, ".."), {recursive: true, mode: 0o700});
  const temporary = `${path}.tmp-${process.pid}`;
  const descriptor = openSync(temporary, "wx", 0o600);
  try { writeFileSync(descriptor, `${canonicalJson(canonicalizeJson(value))}\n`); fsyncSync(descriptor); }
  finally { closeSync(descriptor); }
  renameSync(temporary, path);
}

const temporaryRoot = mkdtempSync("/tmp/are-live-operational-continuity-");
const socketPath = resolve(temporaryRoot, "gateway.sock");
const child = spawn(process.execPath, [
  resolve(wrapperRoot, "bin/are-codex-gateway.mjs"),
  "--config", resolve(wrapperRoot, "profiles/repository-v1.json"),
  "--repository-root", configurationRoot,
  "--listen", socketPath,
  "--backend", "direct-stdio",
  "--continuity-activation", manifestPath,
  "--session-store", resolve(temporaryRoot, "sessions.jsonl"),
  "--reasoning-state-dir", resolve(temporaryRoot, "reasoning"),
], {stdio: ["ignore", "ignore", "pipe"]});

let stderr = "";
let ready;
const readyPromise = new Promise((resolveReady, reject) => {
  const timer = setTimeout(() => reject(new Error(`live-initialize.gateway-timeout:${stderr.slice(-4000)}`)), 30000);
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString("utf8");
    for (const line of stderr.split("\n")) {
      try {
        const value = JSON.parse(line);
        if (value.schema_version === "are.codex-gateway-ready/v1") { ready = value; clearTimeout(timer); resolveReady(value); }
      } catch {}
    }
  });
  child.once("exit", (code, signal) => { if (!ready) { clearTimeout(timer); reject(new Error(`live-initialize.gateway-exited:${code}:${signal}:${stderr.slice(-4000)}`)); } });
});

let transport; let client;
try {
  await readyPromise;
  if (ready.observed_codex_version !== "codex-cli 0.155.0-alpha.16.3" || ready.continuity_disposition !== "activated" || !ready.continuity_activation_receipt_digest) throw new Error("live-initialize.ready-binding-invalid");
  transport = connectGatewayRpcTransport({socket_path: socketPath, consumer_id: "codex:human-chat", lane: "interaction-bound"});
  const connection = await transport.ready;
  client = createAppServerRpcClient({transport, request_timeout_ms: 30000});
  const initialized = await client.initialize({clientInfo: {name: "are-live-operational-continuity", version: "1"}, capabilities: {experimentalApi: true}});
  if (!initialized || typeof initialized !== "object") throw new Error(`live-initialize.initialize-result-invalid:${JSON.stringify(initialized)}`);
  const material = {schema_version: "are.live-operational-continuity-initialize-canary/v1", cycle_id: cycleId, observed_codex_version: ready.observed_codex_version, gateway_runtime_epoch_id: connection.runtime_epoch_id, continuity_activation_receipt_digest: ready.continuity_activation_receipt_digest, initialize_result_digest: digest(initialized), checks: {real_installed_binary: true, exact_protocol_binding: true, activation_manifest_consumed_by_cli: true, gateway_handshake: true, app_server_initialize: true, model_turn_started: false}, provider_model_calls: 0, disposition: "live-initialize-confirmed", authority_effect: "none"};
  const result = {...canonicalizeJson(material), result_digest: digest(material)};
  atomicJson(resolve(evidenceRoot, "live-initialize-result.json"), result);
  process.stdout.write(`${canonicalJson({ok: true, ...result})}\n`);
} finally {
  await client?.close().catch(() => {});
  child.kill("SIGTERM");
  await new Promise((done) => {
    if (child.exitCode !== null) { done(); return; }
    let timer;
    const finish = () => { clearTimeout(timer); done(); };
    child.once("exit", finish);
    timer = setTimeout(() => { child.kill("SIGKILL"); finish(); }, 5000);
  });
}
