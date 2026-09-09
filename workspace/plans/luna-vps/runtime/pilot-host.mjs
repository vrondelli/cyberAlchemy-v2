// Single, no-tool live pilot. Open questions: ../HOST-PLAN.md#open-questions
import assert from "node:assert/strict";
import {createHash, randomUUID, randomBytes, timingSafeEqual} from "node:crypto";
import {createServer as httpServer} from "node:http";
import {createServer as socketServer} from "node:net";
import {spawn} from "node:child_process";
import {readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, chmodSync, openSync, writeSync, fsyncSync, closeSync} from "node:fs";
import {resolve, dirname} from "node:path";
import {pathToFileURL} from "node:url";

export const MODEL = "gpt-5.6-luna";
export const MARKER = "ARE_LUNA_LIVE_OK";
export const PROMPT = `For this architecture integration smoke test, reply with exactly ${MARKER}. Do not call tools or read files.`;
const sha = value => createHash("sha256").update(value).digest("hex");
const quote = value => "'" + value.replaceAll("'", "'\\''") + "'";
function durable(path, value) {
  const fd = openSync(path, "w", 0o600);
  try { writeSync(fd, JSON.stringify(value) + "\n"); fsyncSync(fd); } finally { closeSync(fd); }
}

export async function startPilotHost(config, {prepare = false, taskContract = null} = {}) {
  assert.equal(Boolean(config.task), Boolean(taskContract), 'host.task-entry-required');
  if (taskContract) assert.deepEqual(config.task, taskContract.task);
  const prompt = taskContract?.prompt ?? PROMPT;
  for (const key of ["candidate", "state", "runtime", "callback_file"]) assert.ok(config[key]?.startsWith("/"), `host.path:${key}`);
  assert.ok(["live", "fixture"].includes(config.mode));
  assert.equal(sha(readFileSync(config.callback_file)), config.callback_sha256, "host.callback-drift");
  const candidate = config.candidate, product = resolve(candidate, "cyberAlchemy-v2/implementation/agent-reasoning-engine");
  const manifestBytes = readFileSync(resolve(candidate, "MANIFEST.json"));
  assert.equal(sha(manifestBytes), config.manifest_sha256, "host.manifest-drift");
  for (const file of JSON.parse(manifestBytes).files) {
    const path = resolve(candidate, file.path);
    assert.ok(path.startsWith(candidate + "/"));
    assert.equal(sha(readFileSync(path)), file.sha256, `host.source-drift:${file.path}`);
  }
  const load = path => import(pathToFileURL(resolve(product, path)).href);
  const {loadRepositoryProfile, createCodexAppServerWrapper, deriveGatewayReasoningStateProfile} = await load("packages/codex-app-server-wrapper/index.mjs");
  const {createPersistentGateway} = await load("packages/codex-app-server-wrapper/src/gateway.mjs");
  const {createGatewaySessionClient, HOST_HOOK_DECISION_BINDING_VERSION} = await load("src/gateway-session-client.mjs");
  if (taskContract?.task.objective_kind) assert.equal(HOST_HOOK_DECISION_BINDING_VERSION, 1, 'host.objective-binding-runtime-required');
  const {startHookCallbackBridge} = await load("src/hook-callback-bridge.mjs");
  const loaded = loadRepositoryProfile(resolve(candidate, "pilot-profile.json"), candidate);
  assert.equal(loaded.ok, true, JSON.stringify(loaded.reason_codes));
  if (taskContract?.task.objective_kind) {
    const {decide} = await load('src/decision-cli.mjs');
    const selected = decide('route', {schema_version: 'are.cli-request/v1', session_id: `task-preflight:${taskContract.digest}`, request_id: taskContract.task.task_id,
      request: {raw_request: taskContract.task.instruction, objective_kind: taskContract.task.objective_kind,
        field_postures: {request_id: 'explicit', raw_request: 'explicit', objective_kind: 'explicit', requested_effects: 'absent', target_refs: 'absent', constraints: 'absent', evidence_refs: 'absent'}}});
    assert.ok(selected.ok && selected.kind === 'direct' && selected.route_contract?.route_id === 'CA2-ROUTE-UNDERSTAND', 'host.task-objective-route-conflict');
  }
  for (const path of [config.state, config.runtime]) mkdirSync(path, {recursive: true, mode: 0o700});
  const lock = resolve(config.state, "host.lock"), attemptPath = resolve(config.state, "live-attempt.json");
  const generation = randomUUID();
  writeFileSync(lock, JSON.stringify({generation, pid: process.pid}), {flag: "wx", mode: 0o600});
  const journal = resolve(config.state, "generations", generation), home = resolve(config.state, "codex");
  for (const path of [journal, home]) mkdirSync(path, {recursive: true, mode: 0o700});
  let attempt = existsSync(attemptPath) ? JSON.parse(readFileSync(attemptPath, "utf8")) : null;
  let gateway, client, bridge, provider, control, child, closing = false, ready = false, busy = false, terminal, rejectExecution;
  let providerCalls = 0, modelText = "", lastBinding = null;
  const controlSockets = new Set();
  const status = () => ({ready, busy, model: MODEL, mode: config.mode,
    authenticated_provider_configured: config.mode === "fixture" || Boolean(config.credential_file),
    hook_trust: ready ? "verified-persisted-exact-hashes" : "pending",
    attempt: attempt ? {request_id: attempt.request_id, status: attempt.status, provider_calls: attempt.provider_calls ?? 0} : null,
    restart_policy: "no automatic restart; stale lock or uncertain attempt requires inspection", authority_effect: "none"});
  async function close() {
    if (closing) return;
    closing = true; ready = false;
    rejectExecution?.(new Error("pilot.host-cancelled"));
    for (const socket of controlSockets) socket.destroy();
    if (control) await new Promise(resolve => control.close(resolve));
    await bridge?.close();
    await client?.close();
    await gateway?.close();
    if (provider) { provider.closeAllConnections(); await new Promise(resolve => provider.close(resolve)); }
    if (child && child.exitCode === null && child.signalCode === null) {
      const exited = new Promise(ok => child.once("exit", ok));
      child.kill("SIGTERM");
      const killTimer = setTimeout(() => child.kill("SIGKILL"), 2000);
      await exited; clearTimeout(killTimer);
    }
    if (existsSync(resolve(config.runtime, "callback.json"))) unlinkSync(resolve(config.runtime, "callback.json"));
    // Interrupted effects retain the lock and the durable intent for inspection.
    if (!busy && (!attempt || attempt.status === "passed" || attempt.status === "failed")) unlinkSync(lock);
  }
  try {
    const taskPath = resolve(config.state, 'task-binding.json');
    const taskBinding = {task_digest: taskContract?.digest ?? null, prompt_sha256: sha(prompt)};
    if (existsSync(taskPath)) assert.deepEqual(JSON.parse(readFileSync(taskPath, 'utf8')), taskBinding, 'host.task-binding-conflict');
    else if (attempt) {
      assert.equal(attempt.prompt_sha256, taskBinding.prompt_sha256, 'host.attempt-prompt-conflict');
      assert.equal(attempt.task_digest ?? null, taskBinding.task_digest, 'host.attempt-task-conflict');
    }
    durable(taskPath, taskBinding);
    let credential = null;
    if (config.mode === "live" && config.credential_file) credential = readFileSync(config.credential_file, "utf8").trim();
    let endpoint = "https://api.openai.com/v1/responses";
    if (config.mode === "fixture") {
      const url = new URL(config.fixture_url);
      assert.equal(url.hostname, "127.0.0.1"); assert.equal(url.protocol, "http:");
      endpoint = url.href;
    }
    const providerToken = randomBytes(32).toString("hex"), expectedAuthorization = Buffer.from(`Bearer ${providerToken}`);
    provider = httpServer(async (request, response) => {
      const fail = (code, message) => { response.writeHead(code, {"Content-Type": "application/json"}); response.end(JSON.stringify({error: {message}})); };
      try {
        const authorization = Buffer.from(request.headers.authorization ?? "");
        if (authorization.length !== expectedAuthorization.length || !timingSafeEqual(authorization, expectedAuthorization)) return fail(401, "pilot.provider-unauthorized");
        if (request.method !== "POST" || request.url !== "/v1/responses") return fail(404, "pilot.endpoint-invalid");
        if (!busy || !attempt || providerCalls >= 1 || attempt.provider_calls >= 1) return fail(429, "pilot.single-call-limit");
        if (config.mode === "live" && !credential) return fail(503, "pilot.credential-required");
        const chunks = []; let length = 0;
        for await (const chunk of request) { length += chunk.length; if (length > 1048576) throw new Error("input-limit"); chunks.push(chunk); }
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
        body.model = MODEL; body.max_output_tokens = 512; body.tools = []; body.tool_choice = "none";
        delete body.parallel_tool_calls;
        providerCalls += 1; attempt.provider_calls = providerCalls; durable(attemptPath, attempt);
        const upstream = await fetch(endpoint, {method: "POST", headers: {"Content-Type": "application/json",
          ...(credential ? {Authorization: `Bearer ${credential}`} : {})}, body: JSON.stringify(body), signal: AbortSignal.timeout(60000)});
        if (!upstream.ok) {
          attempt.provider_http_status = upstream.status;
          const detail = await upstream.json().catch(() => ({}));
          if (typeof detail.error?.code === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(detail.error.code)) attempt.provider_error_code = detail.error.code;
          durable(attemptPath, attempt); return fail(502, "pilot.provider-rejected");
        }
        response.writeHead(200, {"Content-Type": upstream.headers.get("content-type") ?? "text/event-stream"});
        let bytes = 0;
        for await (const chunk of upstream.body) { bytes += chunk.length; if (bytes > 2097152) throw new Error("output-limit"); response.write(chunk); }
        response.end();
      } catch { if (!response.headersSent) fail(502, "pilot.provider-failed"); else response.destroy(); }
    });
    provider.requestTimeout = 15000; provider.maxConnections = 4;
    await new Promise(resolve => provider.listen(0, "127.0.0.1", resolve));
    const command = `${quote(resolve(candidate, "bin/node"))} ${quote(config.callback_file)} ${quote(resolve(config.runtime, "callback.json"))}`;
    const hooks = {hooks: Object.fromEntries(["UserPromptSubmit", "PreToolUse", "Stop"].map(name => [name, [{hooks: [{type: "command", command, timeout: 15}]}]]))};
    const approvalPath = resolve(config.state, "hook-approval.json");
    const approved = existsSync(approvalPath) ? JSON.parse(readFileSync(approvalPath, "utf8")) : null;
    if (approved) assert.equal(approved.callback_sha256, config.callback_sha256, "host.approved-callback-drift");
    const trustText = approved ? approved.hooks.map(hook => `\n[hooks.state.${JSON.stringify(hook.key)}]\ntrusted_hash = ${JSON.stringify(hook.currentHash)}\n`).join("") : "";
    writeFileSync(resolve(home, "hooks.json"), JSON.stringify(hooks), {mode: 0o600});
    writeFileSync(resolve(home, "config.toml"), `model_provider = "are_pilot"
model = "${MODEL}"
model_reasoning_effort = "low"
approval_policy = "never"
sandbox_mode = "read-only"
[features]
codex_hooks = true
[model_providers.are_pilot]
name = "Bounded ARE pilot provider"
base_url = "http://127.0.0.1:${provider.address().port}/v1"
wire_api = "responses"
requires_openai_auth = false
env_key = "ARE_PILOT_PROVIDER_TOKEN"
request_max_retries = 0
stream_max_retries = 0
${trustText}`, {mode: 0o600});
    gateway = createPersistentGateway({listen_path: resolve(config.runtime, "gateway.sock"),
      backend: {mode: "direct-stdio", command: resolve(candidate, "bin/codex")},
      spawn_impl: (executable, args) => {
        child = spawn(executable, args, {cwd: home, env: {HOME: config.state, CODEX_HOME: home,
          PATH: `${resolve(candidate, "bin") }:/usr/bin:/bin`, LANG: "C.UTF-8", ARE_PILOT_PROVIDER_TOKEN: providerToken}, stdio: ["pipe", "pipe", "pipe"]});
        // Native diagnostics may contain request content. Keep them out of the service journal.
        child.stderr.resume();
        child.on("exit", () => { if (!closing) ready = false; });
        child.on("error", () => { ready = false; });
        return child;
      }, session_store_path: resolve(journal, "gateway.jsonl"), max_clients: 1,
      authorize_client: ({consumer_id, lane}) => consumer_id === "codex:luna-pilot" && lane === "interaction-bound",
      wrapper_factory: ({consumer_id}) => {
        const profile = structuredClone(loaded.value); profile.turn_bindings.default.consumer_ref = consumer_id;
        if (taskContract?.task.objective_kind) profile.turn_bindings.default.objective_kind = taskContract.task.objective_kind;
        profile.reasoning_state = deriveGatewayReasoningStateProfile(loaded.value, consumer_id, resolve(journal, "reasoning"));
        return createCodexAppServerWrapper({loaded_profile: profile, decision_profile: loaded.decision_profile,
          definition_catalog: loaded.definition_catalog, ontology_snapshot: loaded.ontology_snapshot,
          source_snapshot: loaded.source_snapshot, context_source_provider: loaded.context_source_provider, semantic_profile: loaded.semantic_profile});
      }});
    await gateway.start();
    let hookDecide;
    if (taskContract?.task.objective_kind) {
      const {decide} = await load('src/decision-cli.mjs');
      hookDecide = (operation, request) => {
        assert.equal(request.request.raw_request, prompt, 'host.hook-prompt-binding-conflict');
        return decide(operation, {...request, request: {...request.request, raw_request: taskContract.task.instruction, objective_kind: taskContract.task.objective_kind,
          evidence_refs: [...(request.request.evidence_refs ?? []), `reviewed-task:${taskContract.digest}`],
          field_postures: {...request.request.field_postures, objective_kind: 'explicit', evidence_refs: 'inferred'}}});
      };
    }
    client = createGatewaySessionClient({socket_path: resolve(config.runtime, "gateway.sock"), consumer_id: "codex:luna-pilot", lane: "interaction-bound", ...(hookDecide ? {hook_decide: hookDecide} : {})});
    client.events.on("notification", message => {
      if (message.method === "item/completed" && message.params?.item?.type === "agentMessage") modelText += message.params.item.text ?? "";
    });
    client.events.on("hook-observation", (result, message) => { lastBinding = result; terminal?.({result, message}); });
    bridge = await startHookCallbackBridge({client});
    writeFileSync(resolve(config.runtime, "callback.json"), JSON.stringify(bridge.connection), {mode: 0o600});
    await client.connect();
    await client.request("initialize", "initialize", {clientInfo: {name: "are_luna_pilot", version: "1"}, capabilities: {experimentalApi: true}});
    await client.notify("initialized");
    const checkout = resolve(candidate, "cyberAlchemy-v2");
    const inspectHooks = async key => (await client.request(key, "hooks/list", {cwds: [checkout]})).data.flatMap(row => row.hooks);
    const discovered = await inspectHooks("hooks-inspect");
    assert.equal(discovered.length, 3, "host.unexpected-hooks");
    assert.deepEqual(discovered.map(h => h.eventName).sort(), ["preToolUse", "stop", "userPromptSubmit"]);
    assert.ok(discovered.every(h => h.command === command && h.enabled && !h.isManaged), "host.hook-definition-mismatch");
    if (prepare) {
      await client.request("hooks-trust", "config/batchWrite", {edits: discovered.map(h => ({keyPath: `hooks.state.${JSON.stringify(h.key)}.trusted_hash`, value: h.currentHash, mergeStrategy: "replace"})), reloadUserConfig: true});
      durable(approvalPath, {callback_sha256: config.callback_sha256, hooks: discovered.map(({key, currentHash}) => ({key, currentHash}))});
    } else assert.ok(approved, "host.hook-approval-required");
    assert.ok((await inspectHooks("hooks-verify")).every(h => h.trustStatus === "trusted"), "host.hook-trust-required");
    ready = true;
    async function execute(requestId) {
      assert.match(requestId, /^[A-Za-z0-9_-]{1,80}$/);
      if (attempt) {
        if (attempt.request_id === requestId && attempt.status === "passed") return attempt;
        throw new Error("pilot.attempt-already-recorded");
      }
      assert.ok(ready && !busy && !closing);
      busy = true; modelText = ""; lastBinding = null;
      attempt = {request_id: requestId, status: "pending", model: MODEL, prompt_sha256: sha(prompt), ...(taskContract ? {task_digest: taskContract.digest} : {}), provider_calls: 0, max_output_tokens: 512, tools_enabled: false};
      durable(attemptPath, attempt);
      let timer;
      try {
        const done = new Promise((resolveDone, reject) => { terminal = resolveDone; rejectExecution = reject; timer = setTimeout(() => reject(new Error("pilot.turn-timeout")), 90000); });
        done.catch(() => {}); // Closing during startup must not leave an unhandled rejection.
        const thread = await client.request(`${requestId}:thread`, "thread/start", {model: MODEL, cwd: checkout, approvalPolicy: "never", sandbox: "read-only", ephemeral: true});
        const turn = await client.request(`${requestId}:turn`, "turn/start", {threadId: thread.thread.id, input: [{type: "text", text: prompt}],
          ...(taskContract?.task.objective_kind ? {additionalContext: {'cyberalchemy.request-context': {kind: 'application', value: JSON.stringify({schema_version: 'are.request-context-hint/v1',
            raw_request: taskContract.task.instruction, objective_kind: taskContract.task.objective_kind, evidence_refs: [`reviewed-task:${taskContract.digest}`]})}}} : {})});
        const completion = await done;
        assert.ok(!closing, "pilot.host-cancelled");
        assert.equal(completion.message.params.turn.id, turn.turn.id);
        assert.ok(completion.result.ok && completion.result.kind === "complete", `pilot.completion-binding-failed:${JSON.stringify({kind: completion.result.kind, reason_codes: completion.result.reason_codes})}`);
        if (taskContract) taskContract.verifyOutput(modelText.trim());
        else assert.equal(modelText.trim(), MARKER, "pilot.output-mismatch");
        assert.equal(providerCalls, 1);
        attempt = {...attempt, status: "passed", thread_id: thread.thread.id, turn_id: turn.turn.id,
          output: modelText.trim(), completion_binding_digest: lastBinding.binding_digest, verified: true};
        durable(attemptPath, attempt); busy = false;
        return attempt;
      } catch (error) {
        attempt = {...attempt, status: "uncertain", diagnostic: error.message}; durable(attemptPath, attempt);
        // Keep busy and the lock: a timeout or failed outcome is never permission to redispatch.
        throw error;
      } finally { clearTimeout(timer); terminal = null; rejectExecution = null; }
    }
    async function smoke(requestId) {
      assert.ok(!taskContract, 'host.task-operation-required');
      return execute(requestId);
    }
    async function runTask(requestId, digest) {
      assert.ok(taskContract, 'host.task-not-configured');
      assert.equal(requestId, taskContract.task.task_id, 'host.task-request-conflict');
      assert.equal(digest, taskContract.digest, 'host.task-digest-conflict');
      return execute(requestId);
    }
    control = socketServer(socket => {
      controlSockets.add(socket); socket.on("close", () => controlSockets.delete(socket)); socket.on("error", () => {});
      socket.setTimeout(100000, () => socket.destroy()); let input = "", handled = false;
      socket.on("data", async chunk => {
        if (handled) return;
        input += chunk.toString(); if (Buffer.byteLength(input) > 4096) return socket.destroy();
        if (!input.includes("\n")) return;
        handled = true;
        try {
          const request = JSON.parse(input.trim());
          assert.ok(Object.keys(request).every(key => ["op", "request_id", ...(taskContract ? ['task_digest'] : [])].includes(key)));
          const result = request.op === "status" ? status() : request.op === "smoke" ? await smoke(request.request_id) : request.op === 'run' ? await runTask(request.request_id, request.task_digest) : null;
          assert.ok(result, "pilot.operation-invalid"); socket.end(JSON.stringify({ok: true, result}) + "\n");
        } catch (error) { socket.end(JSON.stringify({ok: false, diagnostic: error.message}) + "\n"); }
      });
    });
    await new Promise((resolveListen, reject) => { control.once("error", reject); control.listen(resolve(config.runtime, "control.sock"), resolveListen); });
    chmodSync(resolve(config.runtime, "control.sock"), 0o600);
    return {status, smoke, runTask, close};
  } catch (error) { await close(); throw error; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.umask(0o077);
  const config = JSON.parse(readFileSync(process.argv[2], "utf8"));
  if (config.mode === "live" && process.env.CREDENTIALS_DIRECTORY) config.credential_file = resolve(process.env.CREDENTIALS_DIRECTORY, "openai-api-key");
  const prepare = process.argv[3] === "--prepare";
  const host = await startPilotHost(config, {prepare});
  process.stdout.write(JSON.stringify(host.status()) + "\n");
  if (prepare) await host.close();
  else for (const signal of ["SIGTERM", "SIGINT"]) process.once(signal, async () => { await host.close(); process.exit(0); });
}
