#!/usr/bin/env node
// Isolated, local-provider proof of a cooperating desktop client's clean restart.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash, randomBytes} from "node:crypto";
import {once} from "node:events";
import {createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {digestValue} from "../src/canonical.mjs";
import {desktopHostProfile} from "../src/desktop-host-profile.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const gatewayEntrypoint = join(packageRoot, "bin/are-codex-gateway.mjs");
const shimEntrypoint = join(packageRoot, "bin/are-codex-desktop-shim.mjs");
const profilePath = join(packageRoot, "profiles/repository-v1.json");
const [binary, expectedVersion, hostProfileId = "desktop-wsl-base/v1"] = process.argv.slice(2);
const hostProfile = desktopHostProfile(hostProfileId);
const report = {schema_version: "are.native-desktop-gateway-restart-canary/v1",
  status: "FAIL", host_profile: hostProfileId, current_desktop_task_touched: false,
  desktop_ui_ingress_proven: false, external_model_calls: 0, authority_effect: "none"};
let scratch;
let provider;
let gateway;
let desktop;
let consumedThrough = 0;
const providerRequests = [];
const gatewayDiagnostics = [];
const desktopDiagnostics = [];

function lines(stream, callback) {
  let pending = "";
  stream.on("data", chunk => {
    pending += chunk.toString("utf8");
    let index;
    while ((index = pending.indexOf("\n")) >= 0) {
      const line = pending.slice(0, index);
      pending = pending.slice(index + 1);
      callback(line);
    }
  });
}

async function until(predicate, stage, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() >= deadline) throw new Error(`canary.${stage}-timeout`);
    await new Promise(done => setTimeout(done, 20));
  }
}

async function stop(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) return;
  const exited = once(child, "exit").catch(() => {});
  child.kill("SIGTERM");
  await Promise.race([exited, new Promise(done => setTimeout(done, 10000))]);
  if (child.exitCode === null && child.signalCode === null) { child.kill("SIGKILL"); await exited; }
}

function responseEvents(id, text) {
  const item = {id: `msg_${id}`, type: "message", status: "completed", role: "assistant",
    content: [{type: "output_text", text, annotations: []}]};
  const events = [
    {type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress"}},
    {type: "response.content_part.added", item_id: item.id, output_index: 0,
      content_index: 0, part: {type: "output_text", text: "", annotations: []}},
    {type: "response.output_text.delta", item_id: item.id, output_index: 0,
      content_index: 0, delta: text},
    {type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response: {id, object: "response", status: "completed",
      output: [item], usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28,
        input_tokens_details: {cached_tokens: 0}}}},
  ];
  return events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}

function startDesktop(env) {
  const child = spawn(process.execPath, [shimEntrypoint, ...hostProfile.prefix_args,
    "app-server", ...hostProfile.app_server_args], {stdio: ["pipe", "pipe", "pipe"], env});
  const messages = [];
  lines(child.stdout, line => {
    try {
      const message = JSON.parse(line);
      messages.push(message);
      consumedThrough += 1;
      child.stdin.write(`${JSON.stringify({jsonrpc: "2.0",
        method: "cyberalchemy/desktopDeliveryConsumed",
        params: {throughSequence: consumedThrough, messageDigest: digestValue(message)}})}\n`);
    } catch (error) { desktopDiagnostics.push(`stdout:${error?.message ?? "invalid"}`); }
  });
  lines(child.stderr, line => desktopDiagnostics.push(line.slice(0, 256)));
  return {child, messages};
}

function send(child, message) { child.stdin.write(`${JSON.stringify({jsonrpc: "2.0", ...message})}\n`); }

async function result(run, id, stage) {
  await until(() => run.messages.some(message => message.id === id && !message.method)
    || run.child.exitCode !== null, stage);
  assert.equal(run.child.exitCode, null, `canary.desktop-exited:${desktopDiagnostics.slice(-3).join(",")}`);
  const message = run.messages.find(entry => entry.id === id && !entry.method);
  assert.ok(!message.error, `canary.${stage}-error:${message.error?.data?.reason_codes?.join(",")
    ?? message.error?.message ?? message.error?.code}`);
  return message.result;
}

async function settledState(statePath, expectedSequence, stage) {
  await until(() => {
    if (!existsSync(statePath)) return false;
    const state = JSON.parse(readFileSync(statePath, "utf8"));
    return state.last_acked_sequence === expectedSequence
      && state.desktop_consumed_through === expectedSequence
      && state.intents.every(intent => intent.status === "response-recorded");
  }, stage);
  return JSON.parse(readFileSync(statePath, "utf8"));
}

try {
  assert.ok(binary && expectedVersion && hostProfile,
    "usage: native-desktop-gateway-restart-canary <codex> <version> [desktop-host-profile]");
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 10000});
  assert.equal(version.status, 0, "canary.version-query-failed");
  assert.equal(version.stdout.trim(), expectedVersion, "canary.host-version-drift");
  const binaryHasher = createHash("sha256");
  for await (const chunk of createReadStream(binary)) binaryHasher.update(chunk);
  const binaryDigest = binaryHasher.digest("hex");
  report.backend = {version: expectedVersion, sha256: binaryDigest};

  scratch = mkdtempSync(join(tmpdir(), "are-native-desktop-restart-"));
  const codexHome = join(scratch, "codex-home");
  const clientStateDir = join(scratch, "desktop-state");
  const reasoningStateDir = join(scratch, "reasoning-state");
  const statePath = join(clientStateDir, "desktop-gateway-state.json");
  for (const path of [codexHome, clientStateDir, reasoningStateDir]) mkdirSync(path, {mode: 0o700});

  provider = createServer(async (request, reply) => {
    try {
      assert.equal(request.method, "POST");
      assert.ok(request.url.endsWith("/responses"));
      const chunks = [];
      let bytes = 0;
      for await (const chunk of request) {
        bytes += chunk.length;
        assert.ok(bytes <= 2 * 1024 * 1024, "canary.provider-request-too-large");
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      providerRequests.push(body);
      assert.ok(providerRequests.length <= 2, "canary.unexpected-provider-retry");
      const index = providerRequests.length;
      reply.writeHead(200, {"content-type": "text/event-stream"});
      reply.end(responseEvents(`resp_are_restart_${index}`, `ARE_NATIVE_RESTART_TURN_${index}`));
    } catch (error) {
      report.provider_error = error?.message ?? "provider.failed";
      reply.writeHead(500);
      reply.end("fixture rejected request");
    }
  });
  await new Promise(done => provider.listen(0, "127.0.0.1", done));
  const endpoint = `http://127.0.0.1:${provider.address().port}/v1`;
  writeFileSync(join(codexHome, "config.toml"), `model_provider = "are_fixture"\nmodel = "are-fixture"\n[model_providers.are_fixture]\nname = "ARE local fixed response fixture"\nbase_url = ${JSON.stringify(endpoint)}\nwire_api = "responses"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n`, {mode: 0o600});

  const socket = join(scratch, "gateway.sock");
  const token = randomBytes(32).toString("hex");
  const ready = [];
  gateway = spawn(process.execPath, [gatewayEntrypoint, "--listen", socket,
    "--backend", "direct-stdio", "--codex-command", binary,
    "--desktop-host-profile", hostProfileId, "--desktop-backend-sha256", binaryDigest,
    "--session-store", join(scratch, "gateway-sessions.jsonl"),
    "--reasoning-state-dir", reasoningStateDir], {stdio: ["ignore", "ignore", "pipe"],
    env: {...process.env, CODEX_HOME: codexHome, ARE_GATEWAY_CONNECTION_TOKEN: token}});
  lines(gateway.stderr, line => {
    try {
      const value = JSON.parse(line);
      if (value.schema_version === "are.gateway-ready/v1") ready.push(value);
      else gatewayDiagnostics.push(value.reason ?? value.schema_version ?? "unknown");
    } catch { gatewayDiagnostics.push("gateway.stderr-non-json"); }
  });
  await until(() => ready.length > 0 || gateway.exitCode !== null, "gateway-start");
  assert.equal(gateway.exitCode, null, `canary.gateway-start-failed:${gatewayDiagnostics.join(",")}`);
  assert.deepEqual(ready[0].desktop_backend_binding,
    {binary_sha256: binaryDigest, host_profile: hostProfileId});

  const env = {...process.env, CODEX_HOME: codexHome,
    ARE_DESKTOP_SHIM_MODE: "managed-gateway",
    ARE_DESKTOP_SHIM_CODEX_COMMAND: binary,
    ARE_DESKTOP_SHIM_CODEX_SHA256: binaryDigest,
    ARE_DESKTOP_SHIM_CONFIG: profilePath,
    ARE_DESKTOP_SHIM_REPOSITORY_ROOT: repositoryRoot,
    ARE_DESKTOP_GATEWAY_SOCKET: socket,
    ARE_DESKTOP_GATEWAY_STATE_DIR: clientStateDir,
    ARE_DESKTOP_GATEWAY_CONNECTION_TOKEN: token,
    ARE_DESKTOP_CONSUMPTION_RECEIPTS: "1"};
  let run = startDesktop(env);
  desktop = run.child;
  send(desktop, {id: 1, method: "initialize", params: {
    clientInfo: {name: "are_native_desktop_restart_canary", version: "1.0.0"},
    capabilities: {experimentalApi: true}}});
  assert.equal(typeof (await result(run, 1, "initialize-first")).userAgent, "string");
  send(desktop, {method: "initialized", params: {}});
  send(desktop, {id: 2, method: "thread/start", params: {cwd: repositoryRoot,
    model: "are-fixture", approvalPolicy: "on-request", sandbox: "read-only"}});
  const threadId = (await result(run, 2, "thread-start")).thread?.id;
  assert.ok(threadId, "canary.thread-id-missing");
  send(desktop, {id: 3, method: "turn/start", params: {threadId,
    input: [{type: "text", text: "Implement this isolated fixture."}],
    approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"},
    collaborationMode: {mode: "plan", settings: {model: "are-fixture",
      reasoning_effort: null, developer_instructions: null}}}});
  const firstTurn = (await result(run, 3, "turn-start-first")).turn?.id;
  assert.ok(firstTurn, "canary.first-turn-id-missing");
  await until(() => run.messages.some(message => message.method === "turn/completed"
    && message.params?.turn?.id === firstTurn) || desktop.exitCode !== null, "turn-completed-first");
  assert.equal(desktop.exitCode, null, desktopDiagnostics.slice(-3).join(","));
  assert.equal(run.messages.find(message => message.method === "turn/completed"
    && message.params?.turn?.id === firstTurn).params.turn.status, "completed");
  const firstState = await settledState(statePath, consumedThrough, "first-state-settled");
  assert.equal(firstState.owned_thread_refs.length, 1);
  const firstSequence = consumedThrough;
  desktop.stdin.end();
  await until(() => desktop.exitCode !== null || desktop.signalCode !== null, "first-desktop-exit");
  assert.equal(desktop.exitCode, 0, desktopDiagnostics.slice(-3).join(","));

  run = startDesktop(env);
  desktop = run.child;
  send(desktop, {id: 1, method: "initialize", params: {
    clientInfo: {name: "are_native_desktop_restart_canary", version: "1.0.0"},
    capabilities: {experimentalApi: true}}});
  assert.equal(typeof (await result(run, 1, "initialize-restart")).userAgent, "string");
  send(desktop, {method: "initialized", params: {}});
  send(desktop, {id: 2, method: "thread/resume", params: {threadId,
    approvalPolicy: "on-request", sandbox: "read-only"}});
  assert.equal((await result(run, 2, "thread-resume")).thread?.id, threadId,
    "canary.resumed-thread-mismatch");
  send(desktop, {id: 3, method: "turn/start", params: {threadId,
    input: [{type: "text", text: "Implement the second isolated fixture."}],
    approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"},
    collaborationMode: {mode: "plan", settings: {model: "are-fixture",
      reasoning_effort: null, developer_instructions: null}}}});
  const secondTurn = (await result(run, 3, "turn-start-second")).turn?.id;
  assert.ok(secondTurn && secondTurn !== firstTurn, "canary.second-turn-id-invalid");
  await until(() => run.messages.some(message => message.method === "turn/completed"
    && message.params?.turn?.id === secondTurn) || desktop.exitCode !== null, "turn-completed-second");
  assert.equal(desktop.exitCode, null, desktopDiagnostics.slice(-3).join(","));
  assert.equal(run.messages.find(message => message.method === "turn/completed"
    && message.params?.turn?.id === secondTurn).params.turn.status, "completed");
  send(desktop, {id: 4, method: "thread/read", params: {threadId, includeTurns: true}});
  const history = (await result(run, 4, "thread-history")).thread;
  assert.equal(history?.id, threadId, "canary.history-thread-mismatch");
  assert.deepEqual(history.turns?.map(turn => turn.id), [firstTurn, secondTurn],
    "canary.host-history-not-two-turns");
  const secondState = await settledState(statePath, consumedThrough, "second-state-settled");
  assert.equal(secondState.owned_thread_refs.length, 1);
  assert.equal(secondState.client_epoch, 2);
  assert.ok(secondState.desktop_consumed_through > firstSequence);
  assert.equal(providerRequests.length, 2, "canary.provider-request-count");
  desktop.stdin.end();
  await until(() => desktop.exitCode !== null || desktop.signalCode !== null, "second-desktop-exit");
  assert.equal(desktop.exitCode, 0, desktopDiagnostics.slice(-3).join(","));

  report.status = "PASS";
  report.backend = {version: expectedVersion, sha256: binaryDigest};
  report.desktop_gateway_consumer = secondState.consumer_id;
  report.owned_thread_count = secondState.owned_thread_refs.length;
  report.client_epoch = secondState.client_epoch;
  report.local_provider_requests = providerRequests.length;
  report.host_history_turns = history.turns.length;
  report.first_delivery_count = firstSequence;
  report.total_delivery_count = consumedThrough;
  report.clean_restart_and_two_turns = true;
} catch (error) {
  report.reason = typeof error?.message === "string" ? error.message.slice(0, 512) : "canary.failed";
  report.provider_error ??= null;
  report.gateway_diagnostics = gatewayDiagnostics.slice(-8);
  report.desktop_diagnostics = desktopDiagnostics.slice(-8);
  process.exitCode = 1;
} finally {
  await stop(desktop);
  await stop(gateway);
  if (provider) await new Promise(done => provider.close(done));
  const stopped = child => !child || child.exitCode !== null || child.signalCode !== null;
  if (scratch && stopped(gateway) && stopped(desktop)) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try { rmSync(scratch, {recursive: true, force: true, maxRetries: 8, retryDelay: 250}); }
      catch (error) { report.cleanup_error = error?.code ?? "unknown"; }
      if (!existsSync(scratch)) break;
      await new Promise(done => setTimeout(done, 1000));
    }
    report.cleanup_complete = !existsSync(scratch);
    if (!report.cleanup_complete) { report.status = "FAIL"; report.reason = "canary.scratch-cleanup-incomplete"; process.exitCode = 1; }
  } else if (scratch) {
    report.cleanup_complete = false;
    report.status = "FAIL";
    report.reason = "canary.child-not-stopped";
    process.exitCode = 1;
  }
}
process.stdout.write(`${JSON.stringify(report)}\n`);
