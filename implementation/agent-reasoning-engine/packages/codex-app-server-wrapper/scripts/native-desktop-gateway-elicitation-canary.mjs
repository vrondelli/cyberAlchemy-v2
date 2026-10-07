#!/usr/bin/env node
// Isolated installed-host server-request proofs through the managed desktop gateway path.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash, randomBytes} from "node:crypto";
import {once} from "node:events";
import {createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {desktopHostProfile} from "../src/desktop-host-profile.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(packageRoot, "../../../../..");
const gatewayEntrypoint = join(packageRoot, "bin/are-codex-gateway.mjs");
const shimEntrypoint = join(packageRoot, "bin/are-codex-desktop-shim.mjs");
const fixtureServer = join(packageRoot, "scripts/fixtures/mcp-elicitation-server.mjs");
const profile = join(packageRoot, "profiles/repository-v1.json");
const [binary, expectedVersion, hostProfileId = "desktop-wsl-base/v1",
  interactionKind = "mcp-form"] = process.argv.slice(2);
const hostProfile = desktopHostProfile(hostProfileId);
const report = {schema_version: "are.native-desktop-gateway-elicitation-canary/v1",
  status: "FAIL", authority_effect: "none", current_desktop_task_touched: false,
  desktop_ui_ingress_proven: false, external_model_calls: 0, host_profile: hostProfileId,
  interaction_kind: interactionKind};
const approvalCallId = "desktop_approval_decline_1";
const acceptedApprovalCallId = "desktop_approval_accept_1";
const secondApprovalCallId = "desktop_approval_decline_2";
const fileChangeCallId = "desktop_file_change_decline_1";
let scratch;
let provider;
let gateway;
let desktop;
const providerRequests = [];
const desktopLines = [];
const desktopErrors = [];
const gatewayErrors = [];

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

async function until(predicate, stage, timeoutMs = 30000) {
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

function responseEvents(id, output) {
  const events = [{type: "response.created", response: {id, object: "response", status: "in_progress", output: []}}];
  for (const [index, item] of output.entries()) {
    events.push({type: "response.output_item.added", output_index: index,
      item: {...item, status: "in_progress"}});
    if (item.type === "message") {
      events.push({type: "response.content_part.added", item_id: item.id, output_index: index,
        content_index: 0, part: {type: "output_text", text: "", annotations: []}});
      events.push({type: "response.output_text.delta", item_id: item.id, output_index: index,
        content_index: 0, delta: item.content[0].text});
    }
    events.push({type: "response.output_item.done", output_index: index, item});
  }
  events.push({type: "response.completed", response: {id, object: "response", status: "completed", output,
    usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28,
      input_tokens_details: {cached_tokens: 0}}}});
  return events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}

function send(message) { desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", ...message})}\n`); }

async function response(id, stage) {
  await until(() => desktopLines.some(message => message.id === id && !message.method)
    || desktop?.exitCode !== null, stage);
  assert.equal(desktop.exitCode, null, `canary.desktop-exited:${desktopErrors.slice(-3).join(",")}`);
  const message = desktopLines.find(entry => entry.id === id && !entry.method);
  assert.ok(!message.error, `canary.${stage}-error:${message.error?.data?.reason_codes?.join(",")
    ?? message.error?.message ?? message.error?.code}`);
  return message.result;
}

try {
  assert.ok(binary && expectedVersion && hostProfile
    && ["mcp-form", "user-input", "approval-decline", "approval-once", "file-change-decline"].includes(interactionKind),
  "usage: native-desktop-gateway-elicitation-canary <codex> <version> [desktop-host-profile] [mcp-form|user-input|approval-decline|approval-once|file-change-decline]");
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 10000});
  assert.equal(version.status, 0, "canary.version-query-failed");
  assert.equal(version.stdout.trim(), expectedVersion, "canary.host-version-drift");
  const binaryHasher = createHash("sha256");
  for await (const chunk of createReadStream(binary)) binaryHasher.update(chunk);
  const binaryDigest = binaryHasher.digest("hex");
  report.backend = {version: expectedVersion, sha256: binaryDigest};
  scratch = mkdtempSync(join(tmpdir(), "are-native-desktop-elicitation-"));
  const codexHome = join(scratch, "codex-home");
  const clientStateDir = join(scratch, "desktop-state");
  const reasoningStateDir = join(scratch, "reasoning-state");
  const approvalSentinel = join(scratch, "approval-must-not-run.txt");
  const acceptedSentinel = join(scratch, "approval-accepted-once.txt");
  const fileChangeSentinel = join(scratch, "file-change-must-not-apply.txt");
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
      assert.ok(providerRequests.length <= (interactionKind === "approval-once" ? 3 : 2),
        "canary.unexpected-provider-retry");
      let output;
      if (providerRequests.length === 1) {
        if (interactionKind === "mcp-form") {
          const tool = (body.tools ?? []).find(entry => entry.name?.includes("are_elicitation_fixture"));
          assert.ok(tool?.tools?.some(entry => entry.name === "collect_fixture_answer"),
            "canary.mcp-tool-unavailable");
          output = [{id: "fc_desktop_elicitation", type: "function_call", call_id: "desktop_elicitation_1",
            namespace: tool.name, name: "collect_fixture_answer", arguments: "{}", status: "completed"}];
        } else if (interactionKind === "user-input") {
          const tool = (body.tools ?? []).find(entry => entry.name?.includes("request_user_input"));
          assert.ok(tool, "canary.user-input-tool-unavailable");
          output = [{id: "fc_desktop_user_input", type: "function_call", call_id: "desktop_user_input_1",
            name: tool.name, arguments: JSON.stringify({questions: [{id: "choice", header: "Fixture choice",
              question: "Continue the isolated ARE canary?",
              options: [{label: "Continue", description: "Complete the fixed local test."}]}]}),
            status: "completed"}];
        } else if (interactionKind === "file-change-decline") {
          const tool = (body.tools ?? []).find(entry => entry.type === "function"
            && entry.name === "apply_patch");
          report.native_tool_names = (body.tools ?? []).map(entry => entry.name).filter(Boolean).slice(0, 64);
          report.native_file_change_tool_advertised = Boolean(tool);
          output = tool
            ? [{id: "fc_desktop_file_change", type: "function_call", call_id: fileChangeCallId,
              name: tool.name, arguments: JSON.stringify({patch: `*** Begin Patch\n*** Add File: ${fileChangeSentinel}\n+MUST_NOT_APPLY\n*** End Patch`}),
              status: "completed"}]
            : [{id: "msg_file_change_unavailable", type: "message", status: "completed", role: "assistant",
              content: [{type: "output_text", text: "ARE_FILE_CHANGE_TOOL_NOT_ADVERTISED", annotations: []}]}];
        } else {
          const tool = (body.tools ?? []).find(entry => entry.type === "function"
            && entry.name === "exec_command");
          report.native_tool_names = (body.tools ?? []).map(entry => entry.name).filter(Boolean).slice(0, 64);
          assert.ok(tool, "canary.native-command-tool-unavailable");
          const acceptFirst = interactionKind === "approval-once";
          output = [{id: "fc_desktop_approval_first", type: "function_call",
            call_id: acceptFirst ? acceptedApprovalCallId : approvalCallId,
            name: tool.name, arguments: JSON.stringify({cmd: acceptFirst
              ? `printf X >> ${JSON.stringify(acceptedSentinel)}`
              : `touch ${JSON.stringify(approvalSentinel)}`,
              sandbox_permissions: "require_escalated",
              justification: acceptFirst
                ? "Accept this one disposable ARE gateway approval; a second will be declined."
                : "Decline this isolated ARE gateway approval canary; no file should be written.",
              max_output_tokens: 64, yield_time_ms: 1000}), status: "completed"}];
        }
      } else if (interactionKind === "approval-once" && providerRequests.length === 2) {
        const firstOutput = (body.input ?? []).find(entry => entry.type === "function_call_output"
          && entry.call_id === acceptedApprovalCallId);
        assert.ok(firstOutput, "canary.accepted-tool-output-missing");
        assert.equal(readFileSync(acceptedSentinel, "utf8"), "X", "canary.accepted-command-not-once");
        const tool = (body.tools ?? []).find(entry => entry.type === "function"
          && entry.name === "exec_command");
        assert.ok(tool, "canary.second-command-tool-unavailable");
        output = [{id: "fc_desktop_approval_second", type: "function_call",
          call_id: secondApprovalCallId, name: tool.name,
          arguments: JSON.stringify({cmd: `touch ${JSON.stringify(approvalSentinel)}`,
            sandbox_permissions: "require_escalated",
            justification: "Decline this second isolated ARE gateway approval.",
            max_output_tokens: 64, yield_time_ms: 1000}), status: "completed"}];
      } else {
        const answered = (body.input ?? []).some(entry => entry.type === "function_call_output"
          && entry.call_id === (interactionKind === "mcp-form" ? "desktop_elicitation_1"
            : interactionKind === "user-input" ? "desktop_user_input_1"
              : interactionKind === "approval-once" ? secondApprovalCallId
                : interactionKind === "file-change-decline" ? fileChangeCallId : approvalCallId)
          && (interactionKind.startsWith("approval-") || interactionKind === "file-change-decline"
            || JSON.stringify(entry.output).includes(interactionKind === "mcp-form"
            ? "ARE_MCP_ELICITATION_NATIVE_OK" : "Continue")));
        assert.ok(answered, `canary.${interactionKind}-answer-not-on-provider-wire`);
        if (interactionKind.startsWith("approval-") || interactionKind === "file-change-decline") {
          assert.equal(existsSync(approvalSentinel), false, "canary.declined-command-executed");
          assert.equal(existsSync(fileChangeSentinel), false, "canary.declined-file-change-applied");
          const toolOutput = (body.input ?? []).find(entry => entry.type === "function_call_output"
            && entry.call_id === (interactionKind === "approval-once"
              ? secondApprovalCallId : interactionKind === "file-change-decline" ? fileChangeCallId : approvalCallId));
          assert.match(JSON.stringify(toolOutput?.output), /declin|denied|reject/i,
            "canary.decline-not-visible-to-model");
          if (interactionKind === "approval-once") {
            assert.equal(readFileSync(acceptedSentinel, "utf8"), "X",
              "canary.accepted-command-count-changed");
          }
          report.declined_tool_output_observed = true;
        }
        output = [{id: "msg_desktop_interaction", type: "message", status: "completed", role: "assistant",
          content: [{type: "output_text", text: "ARE_DESKTOP_INTERACTION_COMPLETE", annotations: []}]}];
      }
      reply.writeHead(200, {"content-type": "text/event-stream"});
      reply.end(responseEvents(`resp_desktop_elicitation_${providerRequests.length}`, output));
    } catch (error) {
      report.provider_error = error.message;
      reply.writeHead(500);
      reply.end("fixture rejected request");
    }
  });
  await new Promise(done => provider.listen(0, "127.0.0.1", done));
  const endpoint = `http://127.0.0.1:${provider.address().port}/v1`;
  const mcpConfig = interactionKind === "mcp-form"
    ? `[mcp_servers.are_elicitation_fixture]\ncommand = ${JSON.stringify(process.execPath)}\nargs = [${JSON.stringify(fixtureServer)}]\nrequired = true\nstartup_timeout_sec = 10\ntool_timeout_sec = 30\ndefault_tools_approval_mode = "auto"\n`
    : "";
  writeFileSync(join(codexHome, "config.toml"), `model_provider = "are_fixture"\nmodel = "are-fixture"\nmcp_optional_startup_grace_ms = 0\n[model_providers.are_fixture]\nname = "ARE local fixed response fixture"\nbase_url = ${JSON.stringify(endpoint)}\nwire_api = "responses"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n${mcpConfig}`, {mode: 0o600});

  const socket = join(scratch, "gateway.sock");
  const token = randomBytes(32).toString("hex");
  const gatewayReady = [];
  gateway = spawn(process.execPath, [gatewayEntrypoint, "--listen", socket,
    "--backend", "direct-stdio", "--codex-command", binary,
    "--desktop-host-profile", hostProfileId, "--desktop-backend-sha256", binaryDigest,
    "--session-store", join(scratch, "gateway-sessions.jsonl"),
    "--reasoning-state-dir", reasoningStateDir], {stdio: ["ignore", "ignore", "pipe"],
    env: {...process.env, CODEX_HOME: codexHome, ARE_GATEWAY_CONNECTION_TOKEN: token}});
  lines(gateway.stderr, line => {
    try {
      const record = JSON.parse(line);
      if (record.schema_version === "are.gateway-ready/v1") gatewayReady.push(record);
      else gatewayErrors.push(record.reason ?? record.schema_version ?? "unknown");
    } catch { gatewayErrors.push("gateway.stderr-non-json"); }
  });
  await until(() => gatewayReady.length > 0 || gateway.exitCode !== null, "gateway-start");
  assert.equal(gateway.exitCode, null, `canary.gateway-start-failed:${gatewayErrors.join(",")}`);
  assert.deepEqual(gatewayReady[0].desktop_backend_binding,
    {binary_sha256: binaryDigest, host_profile: hostProfileId});

  desktop = spawn(process.execPath, [shimEntrypoint, ...hostProfile.prefix_args,
    "app-server", ...hostProfile.app_server_args], {stdio: ["pipe", "pipe", "pipe"],
    env: {...process.env, CODEX_HOME: codexHome,
      ARE_DESKTOP_SHIM_MODE: "managed-gateway",
      ARE_DESKTOP_SHIM_CODEX_COMMAND: binary,
      ARE_DESKTOP_SHIM_CODEX_SHA256: binaryDigest,
      ARE_DESKTOP_SHIM_CONFIG: profile,
      ARE_DESKTOP_SHIM_REPOSITORY_ROOT: repositoryRoot,
      ARE_DESKTOP_GATEWAY_SOCKET: socket,
      ARE_DESKTOP_GATEWAY_STATE_DIR: clientStateDir,
      ARE_DESKTOP_GATEWAY_CONNECTION_TOKEN: token}});
  lines(desktop.stdout, line => {
    try { desktopLines.push(JSON.parse(line)); }
    catch { desktopErrors.push("desktop.stdout-non-json"); }
  });
  lines(desktop.stderr, line => desktopErrors.push(line.slice(0, 256)));
  send({id: 1, method: "initialize", params: {clientInfo: {name: "are_native_desktop_elicitation_canary", version: "1.0.0"},
    capabilities: {experimentalApi: true}}});
  assert.equal(typeof (await response(1, "initialize")).userAgent, "string");
  send({method: "initialized", params: {}});
  send({id: 2, method: "thread/start", params: {cwd: repositoryRoot,
    model: "are-fixture", approvalPolicy: "on-request", sandbox: "read-only"}});
  const threadId = (await response(2, "thread-start")).thread?.id;
  assert.ok(threadId, "canary.thread-id-missing");
  send({id: 3, method: "turn/start", params: {threadId,
    input: [{type: "text", text: interactionKind === "mcp-form"
      ? "Research the repository routing architecture with the isolated fixture MCP tool"
      : interactionKind === "user-input"
        ? "Explain the repository routing architecture with the isolated fixture user-input tool"
        : "Implement this fixture."}],
    approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"},
    ...(interactionKind === "file-change-decline" ? {} : {collaborationMode: {mode: "plan",
      settings: {model: "are-fixture", reasoning_effort: null, developer_instructions: null}}})}});
  const turnId = (await response(3, "turn-start")).turn?.id;
  assert.ok(turnId, "canary.turn-id-missing");
  if (interactionKind === "file-change-decline") {
    await until(() => report.native_file_change_tool_advertised !== undefined
      || desktop.exitCode !== null, "file-change-tool-catalog", 45000);
    if (!report.native_file_change_tool_advertised) {
      throw new Error("canary.native-file-change-tool-not-advertised");
    }
  }
  const requestMethod = interactionKind === "mcp-form"
    ? "mcpServer/elicitation/request" : interactionKind === "user-input"
      ? "item/tool/requestUserInput" : interactionKind === "file-change-decline"
        ? "item/fileChange/requestApproval" : "item/commandExecution/requestApproval";
  await until(() => desktopLines.some(message => message.method === requestMethod)
    || desktop.exitCode !== null, `${interactionKind}-request`, 45000);
  assert.equal(desktop.exitCode, null, `canary.desktop-exited:${desktopErrors.slice(-3).join(",")}`);
  const prompt = desktopLines.find(message => message.method === requestMethod);
  const approvalPrompts = [prompt];
  assert.equal(prompt.params?.threadId, threadId, `canary.${interactionKind}-thread-mismatch`);
  assert.equal(prompt.params?.turnId, turnId, `canary.${interactionKind}-turn-mismatch`);
  if (interactionKind === "mcp-form") {
    assert.equal(prompt.params?.mode, "form", "canary.mcp-mode-mismatch");
    assert.equal(prompt.params?.serverName, "are_elicitation_fixture", "canary.mcp-server-mismatch");
    send({id: prompt.id, result: {action: "accept", content: {answer: "native fixture answer"}, _meta: null}});
  } else if (interactionKind === "user-input") {
    assert.equal(prompt.params?.isBlocking, true, "canary.user-input-not-blocking");
    assert.equal(prompt.params?.questions?.length, 1, "canary.user-input-question-count");
    const question = prompt.params.questions[0];
    assert.ok(question.options?.some(option => option.label === "Continue"),
      "canary.user-input-choice-missing");
    send({id: prompt.id, result: {answers: {[question.id]: {answers: ["Continue"]}}}});
  } else if (interactionKind === "file-change-decline") {
    assert.equal(prompt.params?.itemId?.length > 0, true, "canary.file-change-item-id-missing");
    send({id: prompt.id, result: {decision: "decline"}});
  } else {
    assert.ok(typeof prompt.params?.command === "string" || Array.isArray(prompt.params?.command),
      "canary.approval-command-missing");
    assert.ok(JSON.stringify(prompt.params.command).includes(interactionKind === "approval-once"
      ? acceptedSentinel : approvalSentinel),
      "canary.approval-command-mismatch");
    send({id: prompt.id, result: {decision: interactionKind === "approval-once" ? "accept" : "decline"}});
  }
  await until(() => desktopLines.some(message => message.method === "serverRequest/resolved"
    && message.params?.threadId === threadId && message.params?.requestId === prompt.id),
  `${interactionKind}-resolution`, 45000);
  if (interactionKind === "approval-once") {
    await until(() => desktopLines.filter(message => message.method === requestMethod).length === 2
      || desktop.exitCode !== null, "second-approval-request", 45000);
    assert.equal(desktop.exitCode, null, "canary.desktop-exited-before-second-approval");
    const second = desktopLines.filter(message => message.method === requestMethod)[1];
    assert.notEqual(second.id, prompt.id, "canary.approval-id-reused");
    assert.equal(second.params?.threadId, threadId, "canary.second-approval-thread-mismatch");
    assert.equal(second.params?.turnId, turnId, "canary.second-approval-turn-mismatch");
    assert.ok(JSON.stringify(second.params?.command).includes(approvalSentinel),
      "canary.second-approval-command-mismatch");
    approvalPrompts.push(second);
    send({id: second.id, result: {decision: "decline"}});
    await until(() => desktopLines.some(message => message.method === "serverRequest/resolved"
      && message.params?.threadId === threadId && message.params?.requestId === second.id),
    "second-approval-resolution", 45000);
  }
  await until(() => desktopLines.some(message => message.method === "turn/completed"
    && message.params?.threadId === threadId && message.params?.turn?.id === turnId),
  "turn-completed", 45000);
  assert.equal(desktopLines.find(message => message.method === "turn/completed"
    && message.params?.turn?.id === turnId).params.turn.status, "completed");
  assert.equal(providerRequests.length, interactionKind === "approval-once" ? 3 : 2,
    "canary.provider-request-count");
  if (interactionKind.startsWith("approval-") || interactionKind === "file-change-decline") {
    assert.equal(existsSync(approvalSentinel), false, "canary.declined-command-executed");
    assert.equal(existsSync(fileChangeSentinel), false, "canary.declined-file-change-applied");
  }
  if (interactionKind === "approval-once") {
    assert.equal(readFileSync(acceptedSentinel, "utf8"), "X", "canary.accepted-command-not-once");
  }
  desktop.stdin.end();
  await until(() => desktop.exitCode !== null, "desktop-exit");
  assert.equal(desktop.exitCode, 0, `canary.desktop-client-exit:${desktopErrors.slice(-3).join(",")}`);
  const state = JSON.parse(readFileSync(join(clientStateDir, "desktop-gateway-state.json"), "utf8"));
  assert.equal(state.consumer_id, "codex:desktop-wsl");
  for (const request of approvalPrompts) {
    assert.ok(state.server_response_intents.some(entry => entry.server_id === request.id),
      `canary.${interactionKind}-response-intent-missing`);
    assert.ok(state.deliveries.some(entry => entry.message.method === "serverRequest/resolved"
      && entry.message.params?.requestId === request.id),
    `canary.${interactionKind}-resolution-not-durable`);
  }
  report.status = "PASS";
  report.backend = {version: expectedVersion, sha256: binaryDigest};
  report.desktop_gateway_consumer = state.consumer_id;
  report.thread_bound = true;
  report.turn_completed = true;
  report[interactionKind === "mcp-form" ? "mcp_form_delivered"
    : interactionKind === "user-input" ? "user_input_delivered"
      : interactionKind === "approval-once" ? "approval_one_use"
        : interactionKind === "file-change-decline" ? "file_change_declined" : "approval_declined"] = true;
  if (interactionKind === "approval-once") report.second_approval_prompted_and_declined = true;
  report.server_request_resolved = true;
  report.response_intent_persisted = true;
  report.local_provider_requests = providerRequests.length;
  report.client_experimental_api_declared = true;
} catch (error) {
  report.reason = typeof error?.message === "string" ? error.message.slice(0, 512) : "canary.failed";
  report.provider_error ??= null;
  report.gateway_diagnostics = gatewayErrors.slice(-8);
  report.desktop_diagnostics = desktopErrors.slice(-8);
  report.native_message_methods = desktopLines.filter(message => typeof message.method === "string")
    .map(message => message.method).slice(-20);
  process.exitCode = 1;
} finally {
  await stop(desktop);
  await stop(gateway);
  if (provider) await new Promise(done => provider.close(done));
  const stopped = child => !child || child.exitCode !== null || child.signalCode !== null;
  if (scratch && stopped(gateway) && stopped(desktop)) {
    // The native backend may finish an asynchronous plugin clone just after
    // the gateway exits; give that child work time to quiesce before removal.
    await new Promise(done => setTimeout(done, 1500));
    for (let attempt = 0; attempt < 5; attempt += 1) {
      try { rmSync(scratch, {recursive: true, force: true, maxRetries: 8, retryDelay: 250}); }
      catch (error) { report.cleanup_error = error?.code ?? "unknown"; }
      await new Promise(done => setTimeout(done, 1000));
      if (!existsSync(scratch)) break;
    }
    report.cleanup_complete = !existsSync(scratch);
    if (report.cleanup_complete) delete report.cleanup_error;
    else { report.status = "FAIL"; report.reason = "canary.scratch-cleanup-incomplete"; process.exitCode = 1; }
  } else if (scratch) {
    report.cleanup_complete = false;
    report.status = "FAIL";
    report.reason = "canary.child-not-stopped";
    process.exitCode = 1;
  }
}
process.stdout.write(`${JSON.stringify(report)}\n`);
