#!/usr/bin/env node
import assert from "node:assert/strict";
import {createHash, randomBytes} from "node:crypto";
import {spawn, spawnSync} from "node:child_process";
import {createServer} from "node:http";
import {createInterface} from "node:readline";
import {existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, resolve} from "node:path";
import {fileURLToPath} from "node:url";

import {appendReasoningPlanContext, recoverReasoningStateLedger} from "../packages/reasoning-state-runtime/index.mjs";

const product = fileURLToPath(new URL("../", import.meta.url));
const checkout = resolve(product, "../..");
const cli = resolve(product, "bin/are.mjs");
const sha = value => createHash("sha256").update(value).digest("hex");
const delay = ms => new Promise(resolveDelay => setTimeout(resolveDelay, ms));
const expectedVersion = process.env.ARE_NATIVE_CANARY_EXPECTED_VERSION ?? "codex-cli 0.155.0-alpha.16.4";
const invalidLedgerMode = ["--invalid-ledger", "--automatic-invalid-ledger"].includes(process.argv[3]);
const automaticMode = ["--automatic", "--automatic-invalid-ledger", "--automatic-marker-after-compaction",
  "--automatic-marker-after-compaction-restart"].includes(process.argv[3]);
const restartAfterCompactionMode = ["--marker-after-compaction-restart", "--automatic-marker-after-compaction-restart"]
  .includes(process.argv[3]);
const markerAfterCompactionMode = ["--marker-after-compaction", "--automatic-marker-after-compaction",
  "--marker-after-compaction-restart", "--automatic-marker-after-compaction-restart"].includes(process.argv[3]);
const report = {schema_version: "are.native-compact-context-canary/v1", status: "FAIL", authority_effect: "none",
  external_model_calls: 0, provider: "loopback-fixed-responses-fixture", active_configuration_changed: false,
  native_delivery_verified: false, exact_desktop_task_bound: false,
  mode: automaticMode ? invalidLedgerMode ? "automatic-bound-invalid-ledger"
    : restartAfterCompactionMode ? "automatic-synthetic-marker-after-compaction-restart"
      : markerAfterCompactionMode ? "automatic-synthetic-marker-after-compaction" : "automatic-checkpointed-context"
    : invalidLedgerMode ? "bound-invalid-ledger" : restartAfterCompactionMode ? "synthetic-marker-after-compaction-restart"
      : markerAfterCompactionMode ? "synthetic-marker-after-compaction" : "checkpointed-context"};

let scratch, child, server;
const requests = [], notifications = [], pending = new Map();
let nextId = 0, stderr = "", requestCountAtFirstCompaction = null;
const rpc = (method, params = {}) => new Promise((resolveResult, reject) => {
  const id = ++nextId;
  const timer = setTimeout(() => { pending.delete(id); reject(new Error(`native.rpc-timeout:${method}`)); }, 45000);
  pending.set(id, {resolve: value => {clearTimeout(timer); resolveResult(value);}, reject: error => {clearTimeout(timer); reject(error);}});
  child.stdin.write(`${JSON.stringify({id, method, params})}\n`);
});
async function waitFor(predicate, reason, timeoutMs = 45000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const found = notifications.find(predicate);
    if (found) return found;
    await delay(25);
  }
  throw new Error(reason);
}
function fixtureResponse(number) {
  const id = `resp_compact_fixture_${number}`, itemId = `msg_compact_fixture_${number}`;
  const item = {id: itemId, type: "message", status: "completed", role: "assistant",
    content: [{type: "output_text", text: "ARE_NATIVE_COMPACT_FIXTURE_OK", annotations: []}]};
  const events = [
    {type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress", content: []}},
    {type: "response.content_part.added", item_id: itemId, output_index: 0, content_index: 0, part: {type: "output_text", text: "", annotations: []}},
    {type: "response.output_text.delta", item_id: itemId, output_index: 0, content_index: 0, delta: "ARE_NATIVE_COMPACT_FIXTURE_OK"},
    {type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response: {id, object: "response", status: "completed", output: [item],
      usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28, input_tokens_details: {cached_tokens: 0}}}},
  ];
  return events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}
function matchingMarkedItems(history, marker) {
  return (history.thread?.turns ?? []).flatMap(turn => (turn.items ?? [])
    .filter(item => item.type === "userMessage" && item.clientId === marker)
    .map(item => ({turn_id: turn.id, item_id: item.id})));
}

try {
  assert.ok(process.argv.length === 3 || (process.argv.length === 4 && (invalidLedgerMode || automaticMode || markerAfterCompactionMode)),
    "usage: node test-native-compact-context-hook.mjs /absolute/path/to/codex [--invalid-ledger|--automatic|--automatic-invalid-ledger|--marker-after-compaction|--marker-after-compaction-restart|--automatic-marker-after-compaction|--automatic-marker-after-compaction-restart]");
  const executable = realpathSync(process.argv[2]);
  const version = spawnSync(executable, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), expectedVersion, "native.exact-version-required");
  report.host = {path: executable, version: version.stdout.trim(), sha256: sha(readFileSync(executable))};
  report.sources = Object.fromEntries(["src/compact-context-hook.mjs", "bin/are-hook.mjs", "scripts/test-native-compact-context-hook.mjs"]
    .map(name => [name, sha(readFileSync(resolve(product, name)))]));
  scratch = mkdtempSync(resolve(tmpdir(), "are-native-compact-canary-"));
  const configRoot = resolve(scratch, "codex-config");
  mkdirSync(configRoot);
  const bindingPath = resolve(scratch, "binding.json");
  const callbackPath = resolve(scratch, "callback.mjs");
  const callbackLogPath = resolve(scratch, "callbacks.jsonl");
  writeFileSync(callbackPath, `import {readFileSync,appendFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const event=JSON.parse(readFileSync(0,'utf8'));
const run=spawnSync(${JSON.stringify(process.execPath)},[${JSON.stringify(cli)},'hook','compact',${JSON.stringify(bindingPath)}],{input:JSON.stringify(event),encoding:'utf8',timeout:10000,maxBuffer:2097152});
appendFileSync(${JSON.stringify(callbackLogPath)},JSON.stringify({event,output:run.stdout,status:run.status,error:run.stderr})+'\\n');
process.stdout.write(run.stdout??'{}\\n');process.stderr.write(run.stderr??'');process.exitCode=run.status??1;
`);
  const command = `'${process.execPath.replaceAll("'", "'\\''")}' '${callbackPath.replaceAll("'", "'\\''")}'`;
  writeFileSync(resolve(configRoot, "hooks.json"), JSON.stringify({hooks: {SessionStart: [{matcher: "^compact$",
    hooks: [{type: "command", command, timeout: 15, additionalContextLimit: 6000}]}]}}));

  server = createServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST");
      assert.ok(request.url.endsWith("/responses"));
      const chunks = []; let bytes = 0;
      for await (const chunk of request) { bytes += chunk.length; assert.ok(bytes <= 2 * 1024 * 1024); chunks.push(chunk); }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      assert.ok(requests.length < (automaticMode ? 16 : 5), "native.unexpected-provider-retry");
      requests.push(body);
      response.writeHead(200, {"Content-Type": "text/event-stream"});
      response.end(fixtureResponse(requests.length));
    } catch (error) { report.provider_error = error.message; response.writeHead(500); response.end("fixture rejected request"); }
  });
  await new Promise(resolveListen => server.listen(0, "127.0.0.1", resolveListen));
  const endpoint = `http://127.0.0.1:${server.address().port}/v1`;
  writeFileSync(resolve(configRoot, "config.toml"), `model_provider = "are_fixture"
model = "are-fixture"
${automaticMode ? "model_context_window = 4096\nmodel_auto_compact_token_limit = 10\n" : ""}
[model_providers.are_fixture]
name = "ARE local fixed response fixture"
base_url = ${JSON.stringify(endpoint)}
wire_api = "responses"
requires_openai_auth = false
request_max_retries = 0
stream_max_retries = 0
[features]
hooks = true
[projects.${JSON.stringify(checkout)}]
trust_level = "trusted"
`);
  const launchHost = () => {
    const host = spawn(executable, ["--dangerously-bypass-hook-trust", "app-server"], {cwd: scratch, detached: true,
      env: {PATH: `${dirname(process.execPath)}:/usr/bin:/bin`, LANG: "C.UTF-8", CODEX_HOME: configRoot}, stdio: ["pipe", "pipe", "pipe"]});
    host.stderr.on("data", chunk => { if (stderr.length < 16384) stderr += chunk.toString(); });
    host.on("error", error => { for (const entry of pending.values()) entry.reject(error); pending.clear(); });
    host.on("exit", () => { for (const entry of pending.values()) entry.reject(new Error("native.host-exited")); pending.clear(); });
    createInterface({input: host.stdout}).on("line", line => {
      try {
        const message = JSON.parse(line);
        if (message.method) {
          notifications.push(message);
          if (requestCountAtFirstCompaction === null && message.method === "item/completed"
            && message.params?.item?.type === "contextCompaction") requestCountAtFirstCompaction = requests.length;
          if (message.id !== undefined) host.stdin.write(`${JSON.stringify({id: message.id, error: {code: -32601, message: "Canary accepts no server requests"}})}\n`);
        } else if (pending.has(message.id)) {
          const entry = pending.get(message.id); pending.delete(message.id);
          if (message.error) entry.reject(new Error(JSON.stringify(message.error))); else entry.resolve(message.result);
        }
      } catch { report.protocol_parse_error = true; }
    });
    return host;
  };
  child = launchHost();
  const restartAndVerifyMarker = async (marker, turnId, threadId) => {
    const providerRequestCount = requests.length;
    const originalPid = child.pid;
    process.kill(-originalPid, "SIGTERM");
    await Promise.race([new Promise(resolveExit => child.once("exit", resolveExit)), delay(5000)]);
    assert.ok(child.exitCode !== null || child.signalCode !== null, "native.original-host-did-not-exit");
    child = launchHost();
    assert.notEqual(child.pid, originalPid, "native.backend-pid-not-changed");
    await rpc("initialize", {clientInfo: {name: "are_native_compact_fixture_restarted", version: "1"},
      capabilities: {experimentalApi: true}});
    child.stdin.write(`${JSON.stringify({method: "initialized"})}\n`);
    const restartedHistory = await rpc("thread/read", {threadId, includeTurns: true});
    const restartedMatches = matchingMarkedItems(restartedHistory, marker);
    assert.equal(restartedMatches.length, 1, "native.marker-after-compaction-restart-not-unique");
    assert.equal(restartedMatches[0].turn_id, turnId, "native.marker-after-compaction-restart-wrong-turn");
    assert.equal(requests.length, providerRequestCount, "native.marker-after-compaction-restart-redispatched-provider");
    report.backend_process_restarted = true;
    report.marker_after_restart_count = restartedMatches.length;
    report.provider_redispatch_after_restart = false;
  };
  await rpc("initialize", {clientInfo: {name: "are_native_compact_fixture", version: "1"}, capabilities: {experimentalApi: true}});
  child.stdin.write(`${JSON.stringify({method: "initialized"})}\n`);
  if (automaticMode) {
    const effective = await rpc("config/read", {includeLayers: false});
    report.effective_auto_compact_token_limit = effective.config?.model_auto_compact_token_limit ?? null;
    report.effective_model_context_window = effective.config?.model_context_window ?? null;
  }
  const started = await rpc("thread/start", {cwd: checkout, model: "are-fixture", modelProvider: "are_fixture",
    approvalPolicy: "never", sandbox: "read-only", ephemeral: !markerAfterCompactionMode, config: {bypass_hook_trust: true},
    baseInstructions: "Synthetic local test. The provider returns fixed text and no tool calls."});
  const threadId = started.thread.id;
  const ledgerPath = resolve(scratch, "reasoning.jsonl");
  const ledgerId = "reasoning:native-compact-canary";
  const parentDigest = sha("native-compaction-parent-plan");
  const recovered = recoverReasoningStateLedger({path: ledgerPath, ledger_id: ledgerId});
  assert.equal(recovered.ok, true);
  const plan = appendReasoningPlanContext(recovered.ledger, {thread_ref: threadId, parent_plan_ref: "plan:native-compact-canary",
    parent_plan_digest: parentDigest, previous_plan_context_digest: null, active_slice_id: "C2",
    feature_obligations: [{obligation_id: "C2", summary: "Preserve exact plan after native compaction", status: "active"}],
    unresolved_decisions: [], source_refs: [{source_ref: "plan:native-compact-canary", source_digest: parentDigest}]},
  {expected_thread_ref: threadId, source_digests: {"plan:native-compact-canary": parentDigest}});
  assert.equal(plan.ok, true);
  const epoch = recovered.ledger.seal({event_digests: [plan.event.event_digest], consumer_ref: threadId,
    request_ref: "native-compact-canary", frontier: {kind: "plan-context"}});
  assert.equal(epoch.ok, true);
  assert.equal(recovered.ledger.checkpoint({checkpoint_kind: "before-model-request", epoch: epoch.value}).ok, true);
  recovered.ledger.close();
  writeFileSync(bindingPath, JSON.stringify({schema_version: "are.compact-context-binding/v1", session_id: threadId,
    thread_ref: threadId, cwd: checkout, ledger_path: invalidLedgerMode ? resolve(scratch, "unavailable-ledger.jsonl") : ledgerPath,
    ledger_id: ledgerId}), {mode: 0o600});

  const marker = markerAfterCompactionMode ? `are-canary-client:${randomBytes(16).toString("hex")}` : null;
  const turn = await rpc("turn/start", {threadId, input: [{type: "text", text: "Summarize the synthetic canary."}],
    ...(marker ? {clientUserMessageId: marker} : {})});
  await waitFor(message => message.method === "turn/completed" && message.params?.turn?.id === turn.turn.id,
    "native.initial-turn-not-completed");
  if (!automaticMode) assert.equal(requests.length, 1, "native.initial-provider-request-count");
  if (marker && !automaticMode) {
    const beforeHistory = await rpc("thread/read", {threadId, includeTurns: true});
    const beforeMatches = matchingMarkedItems(beforeHistory, marker);
    assert.equal(beforeMatches.length, 1, "native.marker-before-compaction-not-unique");
    assert.equal(beforeMatches[0].turn_id, turn.turn.id, "native.marker-before-compaction-wrong-turn");
    report.marker_origin = "caller-supplied-synthetic-canary";
    report.marker_before_compaction_count = beforeMatches.length;
  }

  if (automaticMode) {
    for (let index = 0; index < 7 && !notifications.some(message => message.method === "item/completed"
      && message.params?.threadId === threadId && message.params?.item?.type === "contextCompaction"); index++) {
      const next = await rpc("turn/start", {threadId, input: [{type: "text", text: `Continue the synthetic canary, step ${index + 1}.`}]});
      await waitFor(message => message.method === "turn/completed" && message.params?.turn?.id === next.turn.id,
        `native.automatic-turn-${index + 1}-not-completed`);
    }
    const compactions = notifications.filter(message => message.method === "item/completed"
      && message.params?.threadId === threadId && message.params?.item?.type === "contextCompaction");
    assert.ok(compactions.length >= 1, "native.automatic-compaction-not-observed");
    if (marker) {
      const afterHistory = await rpc("thread/read", {threadId, includeTurns: true});
      const afterMatches = matchingMarkedItems(afterHistory, marker);
      assert.equal(afterMatches.length, 1, "native.automatic-marker-after-compaction-not-unique");
      assert.equal(afterMatches[0].turn_id, turn.turn.id, "native.automatic-marker-after-compaction-wrong-turn");
      report.marker_origin = "caller-supplied-synthetic-canary";
      report.marker_after_compaction_count = afterMatches.length;
      report.marker_original_turn_retained = true;
    }
    const callbackRows = existsSync(callbackLogPath) ? readFileSync(callbackLogPath, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : [];
    const compactRows = callbackRows.filter(row => row.event?.hook_event_name === "SessionStart" && row.event?.source === "compact");
    assert.ok(compactRows.length >= 1, "native.automatic-compact-hook-not-delivered");
    assert.ok(compactRows.every(row => row.status === 0 && row.event.session_id === threadId
      && realpathSync(row.event.cwd) === checkout), "native.automatic-compact-hook-binding-failed");
    assert.ok(requestCountAtFirstCompaction !== null, "native.automatic-compaction-request-count-missing");
    const contexts = compactRows.map(row => JSON.parse(row.output).hookSpecificOutput?.additionalContext).filter(Boolean);
    if (invalidLedgerMode) {
      assert.ok(compactRows.every(row => JSON.parse(row.output).continue === false), "native.automatic-invalid-ledger-not-stopped");
      assert.equal(requests.length, requestCountAtFirstCompaction, "native.automatic-invalid-ledger-reached-provider");
      report.stop_prevented_model_dispatch = true;
    } else {
      assert.ok(contexts.some(context => JSON.parse(context.split("\n").at(-1)).plan_context.plan_context_digest
        === plan.value.plan_context_digest), "native.automatic-plan-context-mismatch");
      assert.ok(requests.slice(requestCountAtFirstCompaction).some(body => contexts.some(context =>
        JSON.stringify(body.input).includes(JSON.stringify(context).slice(1, -1)))),
      "native.automatic-compact-context-not-on-provider-wire");
      report.exact_context_on_wire = true;
    }
    if (restartAfterCompactionMode) await restartAndVerifyMarker(marker, turn.turn.id, threadId);
    report.native_delivery_verified = true;
    report.status = "PASS";
    report.thread_id_digest = sha(threadId);
    report.plan_context_digest = plan.value.plan_context_digest;
    report.compaction_item_count = compactions.length;
    report.compact_hook_count = compactRows.length;
    report.provider_requests_at_first_compaction = requestCountAtFirstCompaction;
    report.provider_request_count = requests.length;
  } else {
    const beforeCompaction = requests.length;
    await rpc("thread/compact/start", {threadId});
    await waitFor(message => message.method === "item/completed" && message.params?.threadId === threadId
      && message.params?.item?.type === "contextCompaction", "native.compaction-item-not-completed");
    if (marker) {
      const afterHistory = await rpc("thread/read", {threadId, includeTurns: true});
      const afterMatches = matchingMarkedItems(afterHistory, marker);
      assert.equal(afterMatches.length, 1, "native.marker-after-compaction-not-unique");
      assert.equal(afterMatches[0].turn_id, turn.turn.id, "native.marker-after-compaction-wrong-turn");
      report.marker_after_compaction_count = afterMatches.length;
      report.marker_original_turn_retained = true;
    }
    report.compaction_provider_request_count = requests.length - beforeCompaction;
    const beforePostCompactTurn = requests.length;
    let resumedTurn = null;
    try { resumedTurn = await rpc("turn/start", {threadId, input: [{type: "text", text: "Continue the synthetic canary after compaction."}]}); }
    catch (error) { if (!invalidLedgerMode) throw error; report.post_compaction_start_error = error.message.slice(0, 240); }
    if (!invalidLedgerMode) await waitFor(message => message.method === "turn/completed" && message.params?.turn?.id === resumedTurn.turn.id,
      "native.post-compaction-turn-not-completed");
    else {
      const callbackDeadline = Date.now() + 15000;
      while (!existsSync(callbackLogPath) && Date.now() < callbackDeadline) await delay(25);
      if (resumedTurn?.turn?.id) {
        const terminal = await waitFor(message => message.method === "turn/completed" && message.params?.turn?.id === resumedTurn.turn.id,
          "native.invalid-ledger-turn-not-terminal", 15000);
        report.post_compaction_turn_status = terminal.params.turn.status;
      }
    }
    const callbackRows = existsSync(callbackLogPath) ? readFileSync(callbackLogPath, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : [];
    const compactRows = callbackRows.filter(row => row.event?.hook_event_name === "SessionStart" && row.event?.source === "compact");
    assert.equal(compactRows.length, 1, "native.compact-hook-delivery-count");
    const callback = compactRows[0];
    assert.equal(callback.status, 0, `native.compact-hook-command-failed:${callback.error}`);
    assert.equal(callback.event.session_id, threadId, "native.compact-hook-session-mismatch");
    assert.equal(realpathSync(callback.event.cwd), checkout, "native.compact-hook-cwd-mismatch");
    if (invalidLedgerMode) {
      assert.equal(JSON.parse(callback.output).continue, false, "native.invalid-ledger-not-stopped");
      assert.equal(requests.length, beforePostCompactTurn, "native.invalid-ledger-reached-provider");
      report.native_delivery_verified = true;
      report.status = "PASS";
      report.thread_id_digest = sha(threadId);
      report.compaction_item_completed = true;
      report.compact_hook_count = compactRows.length;
      report.stop_prevented_model_dispatch = true;
    } else {
      const context = JSON.parse(callback.output).hookSpecificOutput.additionalContext;
      const projected = JSON.parse(context.split("\n").at(-1));
      assert.equal(projected.plan_context.plan_context_digest, plan.value.plan_context_digest);
      const compactProviderRequests = requests.slice(beforePostCompactTurn);
      assert.ok(compactProviderRequests.length >= 1, "native.compact-provider-request-missing");
      assert.ok(compactProviderRequests.some(body => JSON.stringify(body.input).includes(JSON.stringify(context).slice(1, -1))),
        "native.compact-context-not-on-provider-wire");
      if (restartAfterCompactionMode) await restartAndVerifyMarker(marker, turn.turn.id, threadId);
      report.native_delivery_verified = true;
      report.status = "PASS";
      report.thread_id_digest = sha(threadId);
      report.plan_context_digest = plan.value.plan_context_digest;
      report.hook_context_sha256 = sha(context);
      report.compaction_item_completed = true;
      report.compact_hook_count = compactRows.length;
      report.compact_provider_request_count = compactProviderRequests.length;
      report.exact_context_on_wire = true;
    }
  }
} catch (error) {
  report.error = error.message;
  report.host_stderr = stderr;
  report.diagnostic_methods = notifications.filter(message => /hook|warn|error|compact/i.test(message.method)).map(message => message.method);
  if (automaticMode) report.isolated_host_warnings = notifications.filter(message => ["warning", "configWarning"].includes(message.method))
    .map(message => String(message.params?.message ?? message.params?.summary ?? "").slice(0, 240));
  if (automaticMode) {
    report.isolated_item_types = notifications.filter(message => message.method === "item/completed")
      .map(message => message.params?.item?.type ?? "unknown");
    report.token_usage_updates = notifications.filter(message => message.method === "thread/tokenUsage/updated")
      .map(message => message.params?.tokenUsage ?? message.params?.usage ?? null).slice(-3);
  }
  report.observed_callback_sources = scratch && existsSync(resolve(scratch, "callbacks.jsonl"))
    ? readFileSync(resolve(scratch, "callbacks.jsonl"), "utf8").trim().split("\n").filter(Boolean).map(line => {
      const row = JSON.parse(line); return `${row.event?.hook_event_name}:${row.event?.source ?? "unknown"}:${row.status}`;
    }) : [];
  report.provider_request_count = requests.length;
  process.exitCode = 1;
} finally {
  if (child && child.exitCode === null) {
    try { process.kill(-child.pid, "SIGTERM"); } catch {}
    await Promise.race([new Promise(resolveExit => child.once("exit", resolveExit)), delay(2000)]);
    if (child.exitCode === null) try { process.kill(-child.pid, "SIGKILL"); } catch {}
  }
  if (server) { server.closeAllConnections(); await new Promise(resolveClose => server.close(resolveClose)); }
  if (scratch) rmSync(scratch, {recursive: true, force: true});
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}
