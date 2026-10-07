#!/usr/bin/env node
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {existsSync, lstatSync, mkdtempSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {resolve} from "node:path";

import {createCodexAppServerWrapper, createGatewayClientRecoveryState, createPersistentGateway, loadRepositoryProfile} from
  "../../agent-reasoning-engine/packages/codex-app-server-wrapper/index.mjs";
import {snapshotTree} from "../../agent-reasoning-engine/packages/coding-agent-runtime/index.mjs";
import {observePendingGatewayTurn} from "../src/pending-turn-reconciliation.mjs";

const checkoutRoot = resolve(import.meta.dirname, "../../..");
const authorityRoot = resolve(checkoutRoot, "..");
const profilePath = resolve(checkoutRoot, "implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/repository-v1.json");
const report = {schema_version: "cav2.tui-native-gateway-proposal-canary/v1", status: "FAIL", provider: "loopback-fixed-response",
  external_model_calls: 0, current_desktop_task_touched: false, authority_effect: "none"};
let scratch;
let provider;
let gateway;
let child;
let interruptedWorker;
let recovery;
let stderr = "";
const requests = [];
const crashRecovery = process.argv.includes("--crash-recovery");
const ephemeralMode = process.argv.includes("--ephemeral");
let thirdRequestArrived;
let allowThirdResponse;
const thirdRequest = new Promise((resolveReady) => { thirdRequestArrived = resolveReady; });
const thirdResponse = new Promise((resolveReady) => { allowThirdResponse = resolveReady; });

function responseEvents(id, text) {
  const item = {id: `msg_${id}`, type: "message", status: "completed", role: "assistant",
    content: [{type: "output_text", text, annotations: []}]};
  const events = [
    {type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress"}},
    {type: "response.content_part.added", item_id: item.id, output_index: 0, content_index: 0,
      part: {type: "output_text", text: "", annotations: []}},
    {type: "response.output_text.delta", item_id: item.id, output_index: 0, content_index: 0, delta: text},
    {type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response: {id, object: "response", status: "completed", output: [item],
      usage: {input_tokens: 20, output_tokens: 20, total_tokens: 40, input_tokens_details: {cached_tokens: 0}}}},
  ];
  return events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}

function runProposalWorker(statePath, fixtureRoot, gatewaySocket, turn) {
  return new Promise((resolveWorker, rejectWorker) => {
    const worker = spawn(process.execPath, [resolve(import.meta.dirname, "native-gateway-proposal-worker.mjs"),
      statePath, fixtureRoot, profilePath, gatewaySocket, String(turn), ...(ephemeralMode ? ["--ephemeral"] : [])], {cwd: checkoutRoot});
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => worker.kill("SIGTERM"), 30000);
    worker.stdout.on("data", (chunk) => { stdout = `${stdout}${chunk}`.slice(-8192); });
    worker.stderr.on("data", (chunk) => { stderr = `${stderr}${chunk}`.slice(-8192); });
    worker.on("error", rejectWorker);
    worker.on("close", (code) => {
      clearTimeout(timer);
      try {
        const report = JSON.parse(stdout.trim());
        if (code !== 0) throw new Error(`worker-exited-${code}:${JSON.stringify(report)}:${stderr}`);
        resolveWorker(report);
      } catch (error) { rejectWorker(new Error(`canary.worker-${turn}-failed:${error.message}:${stderr}`)); }
    });
  });
}

try {
  assert.ok(process.argv[2] && process.argv[3], "Usage: native-gateway-proposal-canary.mjs <installed-codex-binary> <exact-version>");
  assert.equal(crashRecovery && ephemeralMode, false, "canary.crash-history-requires-durable-thread");
  const binary = realpathSync(process.argv[2]);
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0, "canary.host-version-command-failed");
  assert.equal(version.stdout.trim(), process.argv[3], "canary.host-version-drift");
  report.host = {version: process.argv[3], sha256: createHash("sha256").update(readFileSync(binary)).digest("hex")};

  scratch = mkdtempSync(resolve(tmpdir(), "are-tui-native-"));
  const fixtureRoot = resolve(scratch, "fixture");
  const configRoot = resolve(scratch, "codex-home");
  mkdirSync(fixtureRoot);
  mkdirSync(configRoot);
  writeFileSync(resolve(fixtureRoot, "package.json"), "{\"type\":\"module\"}\n", {mode: 0o600});
  writeFileSync(resolve(fixtureRoot, "range.mjs"), "export const sum = (a, b) => a + b - 1;\n", {mode: 0o600});
  const before = snapshotTree(fixtureRoot);
  const candidate = {schema_version: "are.next-action-candidate/v1", operation: "replace-file", path: "range.mjs",
    expected_base_tree_sha256: before.tree_sha256, expected_file_sha256: before.files["range.mjs"],
    utf8: "export const sum = (a, b) => a + b;\n", rationale: "Bounded canary candidate only", authority_effect: "none"};
  const modelResponse = JSON.stringify({schema_version: "are.coding-agent-event/v1", event_id: "canary-final",
    kind: "final-candidate", candidate, authority_effect: "none"});

  provider = createServer(async (request, response) => {
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
      requests.push(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      assert.ok(requests.length <= (crashRecovery ? 3 : 2), "canary.unexpected-provider-retry");
      if (crashRecovery && requests.length === 3) {
        thirdRequestArrived();
        await thirdResponse;
      }
      response.writeHead(200, {"content-type": "text/event-stream"});
      response.end(responseEvents(`resp_are_tui_${requests.length}`, modelResponse));
    } catch (error) {
      report.provider_error = error.message;
      response.writeHead(500);
      response.end("fixture rejected request");
    }
  });
  await new Promise((done) => provider.listen(0, "127.0.0.1", done));
  const endpoint = `http://127.0.0.1:${provider.address().port}/v1`;
  writeFileSync(resolve(configRoot, "config.toml"), `model_provider = "are_fixture"\nmodel = "are-fixture"\n[model_providers.are_fixture]\nname = "ARE local fixed response fixture"\nbase_url = ${JSON.stringify(endpoint)}\nwire_api = "responses"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n`, {mode: 0o600});

  const loaded = loadRepositoryProfile(profilePath, authorityRoot);
  assert.equal(loaded.ok, true, `canary.wrapper-profile-unavailable:${JSON.stringify(loaded.reason_codes)}`);
  gateway = createPersistentGateway({listen_path: resolve(scratch, "gateway.sock"), expected_codex_version: process.argv[3],
    backend: {mode: "direct-stdio", command: binary}, authorize_client: (client) => client.consumer_id === "codex:coding-proposal",
    spawn_impl: (command, args, options) => {
      child = spawn(command, args, {cwd: scratch, ...options, env: {...process.env, CODEX_HOME: configRoot}});
      child.stderr.on("data", (chunk) => { stderr = `${stderr}${chunk}`.slice(-8192); });
      return child;
    },
    wrapper_factory: () => createCodexAppServerWrapper({loaded_profile: loaded.value,
      decision_profile: loaded.decision_profile, definition_catalog: loaded.definition_catalog,
      ontology_snapshot: loaded.ontology_snapshot, source_snapshot: loaded.source_snapshot}),
  });
  await gateway.start();
  const statePath = resolve(scratch, "tui-recovery.json");
  for (let turn = 1; turn <= 2; turn += 1) {
    const result = await runProposalWorker(statePath, fixtureRoot, resolve(scratch, "gateway.sock"), turn);
    assert.equal(result.status, "AWAITING_APPROVAL", `canary.proposal-${turn}-failed:${JSON.stringify(result)}`);
    assert.equal(result.thread_policy?.approval_policy, "on-request");
    assert.equal(result.thread_policy?.sandbox, "read-only");
    assert.equal(result.thread_policy?.ephemeral, ephemeralMode, "canary.history-mode-drift");
    assert.equal(result.binding_source, "gateway-handshake");
    assert.equal(result.history_disposition, ephemeralMode ? "host-idle-unbound" : "host-terminal", "canary.host-history-unverified");
    assert.equal(result.history_turn_status, ephemeralMode ? null : "completed", "canary.host-turn-incomplete");
    assert.equal(result.history_source, ephemeralMode ? "thread/read-summary" : "thread/read", "canary.host-history-source-drift");
    assert.equal(result.token_exposed, false);
    assert.equal(snapshotTree(fixtureRoot).tree_sha256, before.tree_sha256, "canary.fixture-mutated");
    assert.equal(lstatSync(statePath).mode & 0o777, 0o600, "canary.recovery-file-not-private");
  }
  assert.equal(requests.length, 2, "canary.provider-request-count");
  assert.equal(gateway.inspect().sessions.length, 1, "canary.consumer-session-count");
  if (crashRecovery) {
    interruptedWorker = spawn(process.execPath, [resolve(import.meta.dirname, "native-gateway-proposal-worker.mjs"),
      statePath, fixtureRoot, profilePath, resolve(scratch, "gateway.sock"), "3"], {cwd: checkoutRoot});
    let interruptedStderr = "";
    interruptedWorker.stderr.on("data", (chunk) => { interruptedStderr = `${interruptedStderr}${chunk}`.slice(-8192); });
    const workerClosed = new Promise((done) => interruptedWorker.once("close", (code, signal) => done({code, signal})));
    let requestTimer;
    try {
      await Promise.race([thirdRequest, new Promise((_done, reject) => {
        requestTimer = setTimeout(() => reject(new Error("canary.third-provider-request-timeout")), 30000);
      })]);
    } finally { clearTimeout(requestTimer); }
    interruptedWorker.kill("SIGKILL");
    const ended = await workerClosed;
    assert.equal(ended.signal, "SIGKILL", `canary.worker-not-interrupted:${interruptedStderr}`);
    recovery = createGatewayClientRecoveryState({path: statePath, consumer_id: "codex:coding-proposal"});
    assert.equal(recovery.has_unresolved_turn_intent(), true, "canary.pending-intent-not-durable");
    allowThirdResponse();
    let observation = null;
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try { observation = await observePendingGatewayTurn({recoveryState: recovery, gatewaySocket: resolve(scratch, "gateway.sock")}); }
      catch { observation = null; }
      if (observation?.disposition === "host-terminal") break;
      await new Promise((done) => setTimeout(done, 250));
    }
    assert.equal(observation?.disposition, "host-terminal", `canary.interrupted-history-unverified:${JSON.stringify(observation)}`);
    assert.equal(recovery.has_unresolved_turn_intent(), true, "canary.reconciliation-cleared-pending-intent");
    assert.equal(requests.length, 3, "canary.interrupted-provider-redispatch");
    assert.equal(snapshotTree(fixtureRoot).tree_sha256, before.tree_sha256, "canary.interrupted-fixture-mutated");
    report.interrupted_turn = {worker_killed: true, pending_intent_survived: true,
      read_only_history_disposition: observation.disposition, host_turn_status: observation.turn_status,
      no_redispatch: true, still_blocked: true};
  }
  report.gateway = {consumer_id: gateway.inspect().sessions[0]?.consumer_id ?? null, proposal_turns: 2,
    worker_processes: 2, same_consumer_session: true, fixture_unchanged: true, private_recovery: true,
    exact_prompt_history_observed: !ephemeralMode, ephemeral_summary_only: ephemeralMode};
  report.status = "PASS";
} catch (error) {
  report.error = error.message;
  report.error_code = error.code ?? null;
  report.host_stderr_tail = stderr;
  process.exitCode = 1;
} finally {
  allowThirdResponse();
  if (interruptedWorker && interruptedWorker.exitCode === null && interruptedWorker.signalCode === null) {
    interruptedWorker.kill("SIGKILL");
    await Promise.race([new Promise((done) => interruptedWorker.once("exit", done)), new Promise((done) => setTimeout(done, 2000))]);
  }
  recovery?.close();
  await gateway?.close().catch(() => {});
  if (child && child.exitCode === null && child.signalCode === null) {
    child.kill("SIGTERM");
    await Promise.race([new Promise((done) => child.once("exit", done)), new Promise((done) => setTimeout(done, 2000))]);
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
  }
  if (provider) {
    provider.closeAllConnections();
    await new Promise((done) => provider.close(done));
  }
  if (scratch) rmSync(scratch, {recursive: true, force: true});
  report.teardown = {temporary_configuration_removed: scratch ? !existsSync(scratch) : null,
    native_child_reaped: child ? child.exitCode !== null || child.signalCode !== null : null};
  process.stdout.write(`${JSON.stringify(report)}\n`);
}
