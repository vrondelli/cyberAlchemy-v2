#!/usr/bin/env node
// Disposable two-turn proof through the managed gateway and hosted client.
// The private fixed-response provider is the only configured model endpoint.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {randomUUID} from "node:crypto";
import {existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {isAbsolute, join, resolve} from "node:path";
import {createInterface} from "node:readline";
import {fileURLToPath} from "node:url";
import {digestValue} from "../src/canonical.mjs";

const packageRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const repositoryRoot = resolve(packageRoot, "../../../../../");
const checkoutRoot = resolve(repositoryRoot, "cyberAlchemy-v2");
const binary = process.argv[2];
const flags = process.argv.slice(3);
const requirementTracking = flags.includes("--requirement-tracking");
const compactionRequested = flags.includes("--compaction");
const steeringBeforeRestart = flags.includes("--steering");
const guardedWindowsSteering = flags.includes("--windows-guarded-steering");
const lostSteerHttpResponse = flags.includes("--lost-steer-http-response");
const lostSteerRpcResponse = flags.includes("--lost-steer-rpc-response");
const compactionBeforeRestart = compactionRequested && !lostSteerRpcResponse && !lostSteerHttpResponse;
const compactionAfterRestart = compactionRequested && (lostSteerRpcResponse || lostSteerHttpResponse);
const abruptHostedClientLoss = flags.includes("--abrupt-hosted-client-loss");
const abruptStackLoss = flags.includes("--abrupt-stack-loss");
const scratch = mkdtempSync(join(tmpdir(), "are-managed-objective-restart-"));
const stateDir = join(scratch, "state");
const codexHome = guardedWindowsSteering ? join(stateDir, "codex-home") : join(scratch, "codex-home");
const profilePath = join(scratch, "objective-profile.json");
let provider;
let managed;
let ready;
let providerCalls = 0;
let providerError = null;
let diagnostics = "";
let releaseFirstProvider = null;
let modelBaseUrl = null;
let preRpcCrashTriggered = false;

function responseEvents(index) {
  const id = `resp_are_objective_${index}`;
  const text = `ARE_OBJECTIVE_${index}_OK`;
  const item = {id: `msg_${index}`, type: "message", status: "completed", role: "assistant",
    content: [{type: "output_text", text, annotations: []}]};
  return [
    {type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress"}},
    {type: "response.content_part.added", item_id: item.id, output_index: 0, content_index: 0,
      part: {type: "output_text", text: "", annotations: []}},
    {type: "response.output_text.delta", item_id: item.id, output_index: 0, content_index: 0, delta: text},
    {type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response: {id, object: "response", status: "completed", output: [item],
      usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28,
        input_tokens_details: {cached_tokens: 0}}}},
  ].map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}

async function startProvider() {
  provider = createServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST");
      assert.ok(request.url.endsWith("/responses"));
      let bytes = 0;
      for await (const chunk of request) {
        bytes += chunk.length;
        assert.ok(bytes <= 2 * 1024 * 1024);
      }
      providerCalls += 1;
      assert.ok(providerCalls <= (steeringBeforeRestart ? 4 : compactionBeforeRestart ? 3 : 2),
        "duplicate or unexpected model dispatch");
      if (steeringBeforeRestart && providerCalls === 1) {
        await new Promise(done => { releaseFirstProvider = done; });
      }
      response.writeHead(200, {"content-type": "text/event-stream"});
      response.end(responseEvents(providerCalls));
    } catch (error) {
      providerError = error.message;
      response.writeHead(500);
      response.end("private fixture rejected request");
    }
  });
  await new Promise(done => provider.listen(0, "127.0.0.1", done));
  const endpoint = `http://127.0.0.1:${provider.address().port}/v1`;
  modelBaseUrl = endpoint;
  writeFileSync(join(codexHome, "config.toml"), `model_provider = "are_fixture"\nmodel = "are-fixture"\nweb_search = "disabled"\n[features]\nshell_tool = false\nunified_exec = false\napps = false\nmulti_agent = false\ngoals = false\nremote_plugin = false\nplugins = false\n[model_providers.are_fixture]\nname = "ARE objective restart fixture"\nbase_url = ${JSON.stringify(endpoint)}\nwire_api = "responses"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n${guardedWindowsSteering ? `[projects.${JSON.stringify(checkoutRoot)}]\ntrust_level = "trusted"\n` : ""}`, {mode: 0o600});
}

async function boot() {
  managed = spawn(process.execPath, [join(packageRoot, "bin/are-managed-session.mjs"),
    "--repository-root", repositoryRoot, "--cwd", checkoutRoot,
    "--codex-command", binary, "--state-dir", stateDir,
    "--config", profilePath, "--port", "0", "--require-objective-continuity",
    ...(guardedWindowsSteering ? ["--require-restricted-host-profile", "--codex-home", codexHome,
      "--model-wire-upstream", `${modelBaseUrl}/responses`, "--model-wire-provider-id", "are_fixture",
      "--windows-guarded-text-turns"] : [])],
  {env: {...process.env, CODEX_HOME: codexHome,
    ...(abruptHostedClientLoss || abruptStackLoss ? {ARE_INTEGRATION_TEST_MODE: "1"} : {}),
    ...(lostSteerRpcResponse && !preRpcCrashTriggered
      ? {ARE_INTEGRATION_TEST_DROP_STEER_RPC_RESPONSE: "1"} : {})},
  stdio: ["ignore", "pipe", "pipe", "ipc"]});
  diagnostics = "";
  managed.stderr.on("data", chunk => { diagnostics = `${diagnostics}${chunk}`.slice(-4000); });
  ready = await new Promise((done, fail) => {
    const lines = createInterface({input: managed.stdout, crlfDelay: Infinity});
    const timer = setTimeout(() => fail(new Error(`managed readiness timeout: ${diagnostics}`)), 30000);
    lines.on("line", line => {
      let value;
      try { value = JSON.parse(line); } catch { return; }
      if (value.schema_version !== "are.managed-session-ready/v1") return;
      clearTimeout(timer);
      lines.close();
      done(value);
    });
    managed.once("exit", (code, signal) => {
      clearTimeout(timer);
      fail(new Error(`managed session exited ${signal ?? code}: ${diagnostics}`));
    });
  });
  assert.equal(ready.objective_continuity_status, "configured");
  assert.equal(ready.objective_requirement_tracking, requirementTracking);
  assert.equal(ready.current_desktop_task_control, false);
  const hostedState = await api("GET", "api/state");
  assert.deepEqual(hostedState.requirement_tracking, {
    status: requirementTracking ? "enabled" : "disabled",
    source: "managed-gateway-startup",
  });
  if (guardedWindowsSteering) {
    assert.equal(ready.managed_gateway_turn_ingress_blocked_reason, null);
    assert.equal(ready.model_entry_boundary, "guarded-text-only-candidate");
    assert.equal(hostedState.turn_execution?.enabled, true);
  }
}

async function stop() {
  if (!managed || managed.exitCode !== null || managed.signalCode !== null) return;
  const exited = new Promise(done => managed.once("exit", done));
  if (managed.connected) managed.send({schema_version: "are.managed-session-stop/v1"});
  else managed.kill("SIGTERM");
  let timer;
  try {
    await Promise.race([exited, new Promise((_, fail) => {
      timer = setTimeout(() => fail(new Error("managed stop timeout")), 20000);
    })]);
  } finally { clearTimeout(timer); }
  managed = null;
}

async function killOnlyHostedClientAndWaitForManager() {
  const pid = ready?.integration_test_hosted_client_pid;
  assert.ok(Number.isSafeInteger(pid) && pid > 0 && pid !== managed?.pid,
    "managed integration-test hosted-client PID is required");
  assert.equal(managed.exitCode, null, "managed session exited before hosted-client crash");
  process.kill(pid, 0);
  const exited = new Promise(done => managed.once("exit", (code, signal) => done({code, signal})));
  process.kill(pid, "SIGKILL");
  let timer;
  try {
    const result = await Promise.race([exited, new Promise((_, fail) => {
      timer = setTimeout(() => fail(new Error("managed hosted-client crash cleanup timeout")), 30000);
    })]);
    assert.notEqual(result.code, 0, "abrupt hosted-client loss must not look like clean manager stop");
  } finally { clearTimeout(timer); }
  managed = null;
}

async function killWholeManagedStack() {
  assert.equal(process.platform, "win32", "abrupt managed-stack loss is a native Windows fixture");
  const managerPid = managed?.pid;
  const clientPid = ready?.integration_test_hosted_client_pid;
  assert.ok(Number.isSafeInteger(managerPid) && managerPid > 0 && managerPid !== process.pid);
  assert.ok(Number.isSafeInteger(clientPid) && clientPid > 0 && clientPid !== managerPid,
    "managed integration-test hosted-client PID is required");
  assert.equal(managed.exitCode, null, "managed session exited before abrupt stack loss");
  const exited = new Promise(done => managed.once("exit", (code, signal) => done({code, signal})));
  const killed = spawnSync("taskkill", ["/PID", String(managerPid), "/T", "/F"],
    {encoding: "utf8", windowsHide: true, timeout: 20_000});
  assert.equal(killed.status, 0,
    `disposable managed process-tree kill failed: ${killed.stderr || killed.error?.message || killed.stdout}`);
  let timer;
  try {
    const result = await Promise.race([exited, new Promise((_, fail) => {
      timer = setTimeout(() => fail(new Error("abrupt managed-stack exit timeout")), 15_000);
    })]);
    assert.notEqual(result.code, 0, "abrupt stack loss must not look like clean manager stop");
  } finally { clearTimeout(timer); }
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try { process.kill(clientPid, 0); }
    catch (error) {
      if (error.code === "ESRCH") { managed = null; return; }
      throw error;
    }
    await new Promise(done => setTimeout(done, 100));
  }
  throw new Error("hosted client survived disposable managed process-tree kill");
}

async function api(method, path, body) {
  const url = new URL(path, ready.launch_url);
  const token = new URLSearchParams(new URL(ready.launch_url).hash.slice(1)).get("token");
  assert.match(token ?? "", /^[A-Za-z0-9_-]{32,128}$/);
  const response = await fetch(url, {method, headers: {authorization: `Bearer ${token}`,
    ...(body ? {"content-type": "application/json"} : {})}, ...(body ? {body: JSON.stringify(body)} : {})});
  const result = await response.json();
  assert.equal(result.ok, true, `${method} ${path}: ${response.status} ${JSON.stringify(result)}`);
  return result.value;
}

async function steerThroughLostHttpResponse(body) {
  const url = new URL("api/turns/steer", ready.launch_url);
  const token = new URLSearchParams(new URL(ready.launch_url).hash.slice(1)).get("token");
  let forwarded = null;
  let proxyError = null;
  const proxy = createServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST");
      for await (const _chunk of request) { /* Consume the disposable caller body. */ }
      const upstream = await fetch(url, {method: "POST", headers: {authorization: `Bearer ${token}`,
        "content-type": "application/json"}, body: JSON.stringify(body)});
      forwarded = {status: upstream.status, result: await upstream.json()};
      // The host and gateway have completed, but the initiating HTTP client
      // receives no response. This proxy is test-only and never retries.
      response.destroy();
    } catch (error) { proxyError = error; response.destroy(); }
  });
  await new Promise(done => proxy.listen(0, "127.0.0.1", done));
  try {
    await assert.rejects(() => fetch(`http://127.0.0.1:${proxy.address().port}/lost-steer`,
      {method: "POST", body: "disposable lost-response probe"}));
    if (proxyError) throw proxyError;
    assert.equal(forwarded?.status, 202, `hosted steer did not finish before HTTP loss: ${JSON.stringify(forwarded)}`);
    assert.equal(forwarded.result?.value?.turnId, body.expectedTurnId);
  } finally { await new Promise(done => proxy.close(done)); }
}

async function waitForHeldSteerRpcResponse() {
  const path = join(stateDir, "held-steer-rpc-response.json");
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (existsSync(path)) {
      assert.deepEqual(JSON.parse(readFileSync(path, "utf8")), {
        schema_version: "are.test-held-steer-rpc-response/v1", held: true, authority_effect: "none"});
      return;
    }
    await new Promise(done => setTimeout(done, 100));
  }
  throw new Error("gateway steer RPC response was not held before the hosted client observed it");
}

async function postTurn(body) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try { return await api("POST", "api/turns", body); }
    catch (error) {
      if (!/windows-client\.history-unavailable/.test(error.message) || attempt === 19) throw error;
      await new Promise(done => setTimeout(done, 500));
    }
  }
  throw new Error("hosted turn was not attempted");
}

async function waitForTurn(threadId, turnId) {
  const deadline = Date.now() + 120000;
  while (Date.now() < deadline) {
    try {
      const runtime = await api("GET", `api/threads/${encodeURIComponent(threadId)}/runtime`);
      if (runtime.disposition === "idle" && runtime.turn_status === "completed"
        && runtime.turn_ref === digestValue(turnId)) return;
      const history = await api("GET", `api/threads/${encodeURIComponent(threadId)}/history`);
      if (runtime.disposition === "idle" && history.messages?.some(message => message.turn_id === turnId && message.role === "agent")) return;
    } catch (error) {
      if (!/windows-client\.history-unavailable|rollout at .* is empty/.test(error.message)) throw error;
    }
    await new Promise(done => setTimeout(done, 500));
  }
  throw new Error(`host turn ${turnId} did not complete`);
}

async function waitForFirstProvider() {
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    if (providerCalls === 1 && releaseFirstProvider) return;
    await new Promise(done => setTimeout(done, 100));
  }
  throw new Error("first private provider request did not reach the steering window");
}

function objectiveEvents() {
  const directory = join(stateDir, "reasoning-state");
  const files = readdirSync(directory).filter(name => name.endsWith(".jsonl"));
  assert.equal(files.length, 1, "one gateway-owned reasoning ledger expected");
  return readFileSync(join(directory, files[0]), "utf8").trim().split("\n")
    .map(line => JSON.parse(line)).filter(record => record.record_kind === "reasoning-state-event")
    .map(record => record.value).filter(event => event.event_kind === "objective-transition-resolved");
}

async function waitForCompaction(threadId) {
  const path = join(stateDir, "sessions.jsonl");
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    const raw = readFileSync(path, "utf8");
    const lines = raw.split("\n");
    if (!raw.endsWith("\n")) lines.pop();
    const events = lines.filter(Boolean).map(line => JSON.parse(line));
    const observations = events.filter(event => event.event_kind === "host-observation")
      .map(event => event.content?.observation).filter(observation => observation?.thread_ref === threadRef);
    const accepted = observations.filter(observation => observation.kind === "compaction-turn-accepted");
    const completed = observations.find(observation => observation.kind === "compaction-item-completed"
      && accepted.some(entry => entry.turn_ref === observation.turn_ref));
    if (completed) return completed.turn_ref;
    await new Promise(done => setTimeout(done, 250));
  }
  throw new Error("owned compaction did not reach a durable completed item");
}

async function waitForSteerAcceptance(threadId, turnId) {
  const path = join(stateDir, "sessions.jsonl");
  const threadRef = `backend-thread:${digestValue(threadId)}`;
  const turnRef = digestValue(turnId);
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const raw = readFileSync(path, "utf8");
    const lines = raw.split("\n");
    if (!raw.endsWith("\n")) lines.pop();
    const accepted = lines.filter(Boolean).map(line => JSON.parse(line)).filter(event =>
      event.event_kind === "host-observation" && event.content?.observation?.kind === "steer-accepted"
      && event.content.observation.thread_ref === threadRef
      && event.content.observation.turn_ref === turnRef);
    if (accepted.length > 0) return accepted.length;
    await new Promise(done => setTimeout(done, 100));
  }
  throw new Error("hosted steering did not reach a durable exact-turn acceptance observation");
}

try {
  assert.ok(flags.length <= 8 && new Set(flags).size === flags.length
    && flags.every(flag => ["--requirement-tracking", "--compaction", "--steering", "--windows-guarded-steering", "--lost-steer-http-response", "--lost-steer-rpc-response", "--abrupt-hosted-client-loss", "--abrupt-stack-loss"].includes(flag))
    && (!guardedWindowsSteering || (process.platform === "win32" && steeringBeforeRestart))
    && (!lostSteerHttpResponse || guardedWindowsSteering)
    && (!lostSteerRpcResponse || (guardedWindowsSteering && (abruptHostedClientLoss || abruptStackLoss)))
    && !(lostSteerHttpResponse && lostSteerRpcResponse)
    && (!abruptHostedClientLoss || lostSteerHttpResponse || lostSteerRpcResponse)
    && (!abruptStackLoss || (guardedWindowsSteering
      && (lostSteerHttpResponse || lostSteerRpcResponse) && !abruptHostedClientLoss)),
    "usage: managed-objective-restart-canary.mjs <absolute-codex-binary> [--requirement-tracking] [--compaction] [--steering] [--windows-guarded-steering on native Windows with --steering] [--lost-steer-http-response | --lost-steer-rpc-response] [--abrupt-hosted-client-loss | --abrupt-stack-loss]");
  assert.ok(isAbsolute(binary) && existsSync(binary), "an installed Codex binary is required");
  mkdirSync(stateDir, {mode: 0o700});
  mkdirSync(codexHome, {mode: 0o700});
  const profile = JSON.parse(readFileSync(join(packageRoot, "profiles/repository-v1.json"), "utf8"));
  profile.objective_resolution = {enabled: true, requirement_tracking: requirementTracking};
  writeFileSync(profilePath, `${JSON.stringify(profile)}\n`, {mode: 0o600});
  await startProvider();
  await boot();
  const thread = await api("POST", "api/threads", {cwd: checkoutRoot, requestKey: `thread:${randomUUID()}`});
  const threadId = thread.thread.id;
  const firstKey = `turn:${randomUUID()}`;
  const firstText = "Research context management approaches. Do not use tools.";
  let steerStatusInput = null;
  let steerBody = null;
  let lostRpcHttpResult = null;
  if (requirementTracking) {
    const missingKey = `turn:${randomUUID()}`;
    let missingBlocked = false;
    for (let attempt = 0; attempt < 20 && !missingBlocked; attempt += 1) {
      try { await api("POST", "api/turns", {threadId, requestKey: missingKey, text: firstText}); }
      catch (error) {
        if (/requirements\.explicit-seed-required/.test(error.message)) missingBlocked = true;
        else if (!/windows-client\.history-unavailable/.test(error.message)) throw error;
      }
      if (!missingBlocked) await new Promise(done => setTimeout(done, 500));
    }
    assert.equal(missingBlocked, true, "missing explicit requirement seed must block before dispatch");
    assert.equal(providerCalls, 0);
  }
  const first = await postTurn({threadId, requestKey: firstKey, text: firstText,
    ...(requirementTracking ? {requirements: ["Include sources"]} : {})});
  if (steeringBeforeRestart) {
    await waitForFirstProvider();
    steerBody = {threadId, expectedTurnId: first.turn.id,
      requestKey: `steer:${randomUUID()}`,
      text: "Keep the same research objective and include concrete sources; do not use tools."};
    steerStatusInput = {threadId, expectedTurnId: first.turn.id, requestKey: steerBody.requestKey};
    if (lostSteerRpcResponse) {
      lostRpcHttpResult = api("POST", "api/turns/steer", steerBody).then(
        () => "unexpected-http-success", error => error);
      await waitForHeldSteerRpcResponse();
    } else if (lostSteerHttpResponse) await steerThroughLostHttpResponse(steerBody);
    else {
      const steered = await api("POST", "api/turns/steer", steerBody);
      assert.equal(steered.turnId, first.turn.id);
    }
    assert.equal(await waitForSteerAcceptance(threadId, first.turn.id), 1);
    assert.equal((await api("POST", "api/turns/steer/status", steerStatusInput)).disposition,
      "settled-accepted");
    assert.equal((await api("GET", "api/state")).pending_steer?.request_key, steerBody.requestKey,
      "host must retain the steer key until exact terminal acknowledgement");
    if (!lostSteerHttpResponse && !lostSteerRpcResponse) {
      assert.equal((await api("POST", "api/turns/steer/ack", steerStatusInput)).disposition,
        "settled-accepted");
      const replay = await api("POST", "api/turns/steer", steerBody);
      assert.equal(replay.turnId, first.turn.id);
      assert.equal(await waitForSteerAcceptance(threadId, first.turn.id), 1,
        "exact-key steering replay must not record a second host acceptance");
      assert.equal((await api("POST", "api/turns/steer/ack", steerStatusInput)).disposition,
        "settled-accepted");
    }
    releaseFirstProvider();
    releaseFirstProvider = null;
  }
  await waitForTurn(threadId, first.turn.id);
  const initial = objectiveEvents();
  assert.equal(initial.length, 1);
  assert.equal(initial[0].content.resolution.transition, "new");
  if (requirementTracking) assert.deepEqual(initial[0].content.requirement_continuity.snapshots[0].requirements,
    ["Include sources"]);
  const objectiveId = initial[0].content.resolution.next_state.active_objective.objective_id;
  if (compactionBeforeRestart) {
    await api("POST", "api/threads/compact", {threadId, requestKey: `compact:${randomUUID()}`});
    await waitForCompaction(threadId);
    if (!steeringBeforeRestart) assert.equal(providerCalls, 2, "one native model request is expected for compaction");
  }
  if (compactionAfterRestart) await assert.rejects(
    () => api("POST", "api/threads/compact", {threadId, requestKey: `compact:${randomUUID()}`}),
    /windows-client\.pending-steer-recovery-required/,
    "compaction must not enter while a steering key awaits exact acknowledgement");
  if (abruptStackLoss) await killWholeManagedStack();
  else if (abruptHostedClientLoss) await killOnlyHostedClientAndWaitForManager();
  else await stop();
  if (lostSteerRpcResponse) {
    let timer;
    try {
      const result = await Promise.race([lostRpcHttpResult, new Promise((_, fail) => {
        timer = setTimeout(() => fail(new Error("held steer HTTP request did not fail after process loss")), 10000);
      })]);
      assert.ok(result instanceof Error, "held gateway RPC response must not reach hosted HTTP caller");
    } finally { clearTimeout(timer); }
    preRpcCrashTriggered = true;
  }
  await boot();
  if (steeringBeforeRestart) assert.equal((await api("POST", "api/turns/steer/status", steerStatusInput)).disposition,
    "settled-accepted", "steering receipt must survive managed restart without redispatch");
  if (lostSteerHttpResponse || lostSteerRpcResponse) {
    const retained = (await api("GET", "api/state")).pending_steer;
    assert.equal(retained?.request_key, steerStatusInput.requestKey,
      "lost HTTP response key must survive the managed restart");
    assert.equal(JSON.stringify(retained).includes(steerBody.text), false,
      "host recovery state must not include guidance text");
    for (const [path, body] of [
      ["api/threads", {cwd: checkoutRoot, requestKey: `thread:${randomUUID()}`}],
      ["api/feedback", {threadId, requestKey: `feedback:${randomUUID()}`,
        text: "Your last answer was too technical. From now on, use plain language."}],
      ["api/feedback/dismiss", {threadId, requestKey: `feedback:${randomUUID()}`,
        text: "A task-only correction"}],
      ["api/feedback/apply", {threadId, requestKey: `feedback:${randomUUID()}`,
        text: "Please make the answer clearer.", episodeRef: "learning:episode-1",
        quote: "make the answer clearer", instruction: "Use plain language."}],
    ]) await assert.rejects(() => api("POST", path, body),
      /windows-client\.pending-steer-recovery-required/,
      `${path} must not bypass the recovered steer checkpoint`);
    await assert.rejects(() => api("POST", "api/turns", {threadId,
      requestKey: `turn:${randomUUID()}`, text: "do next"}), /windows-client\.pending-steer-recovery-required/);
    await assert.rejects(() => api("POST", "api/turns/steer", steerBody),
      /windows-client\.pending-steer-recovery-required/);
    assert.equal((await api("POST", "api/turns/steer/ack", steerStatusInput)).disposition,
      "settled-accepted");
    assert.equal((await api("GET", "api/state")).pending_steer, null);
    assert.equal(await waitForSteerAcceptance(threadId, first.turn.id), 1,
      "no duplicate acceptance after lost-response recovery");
  }
  const resumed = await api("POST", "api/threads/resume", {threadId, requestKey: `resume:${randomUUID()}`});
  assert.equal(resumed.thread.id, threadId);
  if (requirementTracking) {
    await assert.rejects(() => api("POST", "api/turns", {threadId, requestKey: firstKey,
      text: firstText, requirements: ["Different requirement"]}),
    /windows-client\.accepted-binding-conflict/);
    if (!steeringBeforeRestart) assert.equal(providerCalls, compactionBeforeRestart ? 2 : 1);
  }
  const replay = await api("POST", "api/turns", {threadId, requestKey: firstKey, text: firstText,
    ...(requirementTracking ? {requirements: ["Include sources"]} : {})});
  assert.equal(replay.turn.id, first.turn.id);
  assert.equal(replay.recovered_from_receipt, true);
  if (!steeringBeforeRestart) assert.equal(providerCalls, compactionBeforeRestart ? 2 : 1);
  if (compactionAfterRestart) {
    await api("POST", "api/threads/compact", {threadId, requestKey: `compact:${randomUUID()}`});
    await waitForCompaction(threadId);
  }
  const second = await postTurn({threadId, requestKey: `turn:${randomUUID()}`,
    text: "do next"});
  await waitForTurn(threadId, second.turn.id);
  const events = objectiveEvents();
  assert.equal(events.length, 2);
  assert.equal(events[1].content.resolution.transition, "continue");
  assert.equal(events[1].content.resolution.next_state.active_objective.objective_id, objectiveId);
  assert.equal(events[1].content.thread_id, threadId);
  if (requirementTracking) {
    assert.deepEqual(events[1].content.requirement_continuity.snapshots[0].requirements, ["Include sources"]);
    assert.equal(events[1].content.requirement_continuity.previous_continuity_digest,
      events[0].content.requirement_continuity.continuity_digest);
  }
  if (steeringBeforeRestart) assert.ok(providerCalls >= 2 && providerCalls <= 4);
  else assert.equal(providerCalls, compactionBeforeRestart ? 3 : 2);
  assert.equal(providerError, null);
  process.stdout.write(`${JSON.stringify({schema_version: "are.managed-objective-restart-canary/v1", ok: true,
    hosted_thread_resumed: true, same_objective_after_restart: true, duplicate_dispatch_rejected: true,
    objective_events: events.length, local_model_calls: providerCalls, external_model_calls: 0,
    requirement_tracking: requirementTracking ? "verified-explicit-seed" : "not-tested",
    compaction_before_restart: compactionBeforeRestart,
    compaction_after_restart: compactionAfterRestart,
    steering_before_restart: steeringBeforeRestart,
    windows_guarded_steering: guardedWindowsSteering,
    lost_steer_http_response_recovered: lostSteerHttpResponse,
    lost_steer_rpc_response_recovered: lostSteerRpcResponse,
    abrupt_hosted_client_loss_recovered: abruptHostedClientLoss,
    abrupt_managed_stack_loss_recovered: abruptStackLoss,
    current_desktop_task_control: false, authority_effect: "none"})}\n`);
} catch (error) {
  process.stderr.write(`${JSON.stringify({schema_version: "are.managed-objective-restart-canary/v1", ok: false,
    reason: error.message, private_provider_error: providerError, local_model_calls: providerCalls,
    authority_effect: "none"})}\n`);
  process.exitCode = 1;
} finally {
  if (releaseFirstProvider) releaseFirstProvider();
  try { await stop(); } catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
  if (provider) await new Promise(done => provider.close(done));
  rmSync(scratch, {recursive: true, force: true});
}
