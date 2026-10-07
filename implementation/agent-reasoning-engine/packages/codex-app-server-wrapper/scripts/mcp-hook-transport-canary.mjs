#!/usr/bin/env node
// Isolated pinned-host MCP-hook delivery/denial probe. Never uses live CODEX_HOME.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {hostname, tmpdir} from "node:os";
import {resolve} from "node:path";

import {startHookCallbackBridge} from "../../../src/hook-callback-bridge.mjs";

const fixtureServer = resolve(import.meta.dirname, "fixtures/mcp-hook-transport-server.mjs");
const relayServer = resolve(import.meta.dirname, "../../are-mcp-server/bin/are-hook-mcp-server.mjs");
const [binary, expectedVersion, mode = "deny"] = process.argv.slice(2);
const viewImageMode = ["restricted-view-image-deny", "restricted-view-image-deny-all",
  "restricted-view-image-missing-tool"].includes(mode);
const allToolHookMode = mode === "restricted-view-image-deny-all";
const report = {schema_version: "are.mcp-hook-transport-canary/v1", status: "FAIL", mode,
  authority_effect: "none", current_desktop_task_touched: false, external_model_calls: 0};
let scratch, provider, child, bridge, probeImagePath;
const requests = [];
const relayEvents = [];
const sha = (bytes) => createHash("sha256").update(bytes).digest("hex");
const sse = (id, output) => {
  const item = output.type === "function_call" ? output : {...output, role: "assistant"};
  const events = [{type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress"}}];
  if (item.type === "message") events.push(
    {type: "response.content_part.added", item_id: item.id, output_index: 0, content_index: 0,
      part: {type: "output_text", text: "", annotations: []}},
    {type: "response.output_text.delta", item_id: item.id, output_index: 0, content_index: 0, delta: item.content[0].text});
  events.push({type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response: {id, object: "response", status: "completed", output: [item],
      usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28, input_tokens_details: {cached_tokens: 0}}}});
  return events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
};

try {
  assert.ok(binary && expectedVersion && ["deny", "deny-text-only", "deny-structured-only", "missing-tool", "missing-server", "relay-deny", "relay-unavailable", "allow-stdin", "restricted-catalog", "restricted-reject-shell", "restricted-reject-effects", "restricted-view-image-deny", "restricted-view-image-deny-all", "restricted-view-image-missing-tool"].includes(mode),
    "usage: mcp-hook-transport-canary.mjs <installed-codex> <exact-version> [deny|deny-text-only|deny-structured-only|missing-tool|missing-server|relay-deny|relay-unavailable|allow-stdin|restricted-*]");
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0, "canary.host-version-command-failed");
  assert.equal(version.stdout.trim(), expectedVersion, "canary.host-version-drift");
  report.host = {version: expectedVersion, sha256: sha(readFileSync(binary))};
  scratch = mkdtempSync(resolve(tmpdir(), "are-mcp-hook-transport-"));
  const configRoot = resolve(scratch, "codex-home");
  const log = resolve(scratch, "hook-arguments.jsonl");
  const stdinProgram = resolve(scratch, "stdin-command.mjs");
  if (viewImageMode) {
    probeImagePath = resolve(scratch, "probe.png");
    writeFileSync(probeImagePath, readFileSync(resolve(import.meta.dirname,
      "../../../apps/desktop-companion/src-tauri/icons/icon.png")), {mode: 0o600});
  }
  if (mode === "allow-stdin") {
    assert.ok(!/\s/.test(process.execPath) && !/\s/.test(stdinProgram),
      "canary.stdin-fixture-path-contains-space");
    writeFileSync(stdinProgram,
      "process.stdin.once('data', d => { console.log('ARE_STDIN:' + d.toString().trim()); process.exit(0); });\n",
      {mode: 0o600});
  }
  mkdirSync(configRoot);
  let connectionPath = null;
  if (mode.startsWith("relay")) {
    bridge = await startHookCallbackBridge({client: {observeHook: hookEvent => {
      relayEvents.push(hookEvent);
      if (hookEvent.hook_event_name === "UserPromptSubmit") return {ok: true, kind: "direct",
        stdout: {hookSpecificOutput: {hookEventName: "UserPromptSubmit",
          additionalContext: "ARE disposable relay prompt binding."}}};
      if (hookEvent.hook_event_name === "PreToolUse") return mode === "relay-unavailable"
        ? {ok: false, kind: "block", stdout: {}}
        : {ok: true, kind: "block", stdout: {hookSpecificOutput: {hookEventName: "PreToolUse",
          additionalContext: "ARE disposable relay tool binding.", permissionDecision: "deny",
          permissionDecisionReason: "Disposable relay denial."}}};
      return {ok: true, kind: "direct", stdout: {}};
    }}});
    connectionPath = resolve(scratch, "hook-connection.json");
    writeFileSync(connectionPath, JSON.stringify({...bridge.connection,
      schema_version: "are.hosted-hook-connection/v1",
      owner_process: {platform: process.platform, hostname: hostname(), pid: process.pid}}), {mode: 0o600});
  }
  provider = createServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST");
      assert.ok(request.url.endsWith("/responses"));
      const chunks = []; let bytes = 0;
      for await (const chunk of request) {
        bytes += chunk.length;
        assert.ok(bytes <= 2 * 1024 * 1024, "canary.provider-input-too-large");
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      requests.push(body);
      assert.ok(requests.length <= (mode === "restricted-reject-effects" ? 4 : 3), "canary.unexpected-provider-retry");
      let output;
      if (mode === "restricted-reject-effects") {
        const deniedTools = ["exec_command", "write_stdin", "apply_patch"];
        if (requests.length === 1) {
          report.advertised_tool_names = (body.tools ?? []).map((entry) => entry.name).filter(Boolean).slice(0, 128);
          assert.ok(deniedTools.every((name) => !report.advertised_tool_names.includes(name)),
            "canary.restricted-effect-tool-still-advertised");
          report.unadvertised_effect_results = [];
        } else {
          const previous = deniedTools[requests.length - 2];
          const result = (body.input ?? []).find((item) => item.type === "function_call_output"
            && item.call_id === `are_unadvertised_${previous}`);
          assert.ok(result, `canary.restricted-${previous}-result-missing`);
          report.unadvertised_effect_results.push({tool_name: previous,
            output: JSON.stringify(result.output).slice(0, 500)});
        }
        const next = deniedTools[requests.length - 1];
        if (next) {
          const args = next === "exec_command" ? {cmd: "echo ARE_UNADVERTISED_TOOL_RAN"}
            : next === "write_stdin" ? {session_id: 99999999, chars: "ARE_UNADVERTISED_STDIN\n"}
              : {patch: `*** Begin Patch\n*** Add File: ${resolve(scratch, "unadvertised-effect.txt")}\n+ARE_UNADVERTISED_PATCH_RAN\n*** End Patch`};
          output = {id: `fc_are_unadvertised_${next}`, type: "function_call",
            call_id: `are_unadvertised_${next}`, name: next, arguments: JSON.stringify(args), status: "completed"};
        } else {
          output = {id: "msg_are_mcp_catalog", type: "message", status: "completed",
            content: [{type: "output_text", text: "ARE_RESTRICTED_EFFECTS_PROBE_COMPLETE", annotations: []}]};
        }
      } else if (requests.length === 1 && viewImageMode) {
        report.advertised_tool_names = (body.tools ?? []).map((entry) => entry.name).filter(Boolean).slice(0, 128);
        assert.ok(report.advertised_tool_names.includes("view_image"), "canary.view-image-not-advertised");
        output = {id: "fc_are_mcp_view_image", type: "function_call", call_id: "are_mcp_hook_tool_1",
          name: "view_image", arguments: JSON.stringify({path: probeImagePath}), status: "completed"};
      } else if (requests.length === 1 && mode === "restricted-catalog") {
        report.advertised_tool_names = (body.tools ?? []).map((entry) => entry.name).filter(Boolean).slice(0, 128);
        output = {id: "msg_are_mcp_catalog", type: "message", status: "completed",
          content: [{type: "output_text", text: "ARE_RESTRICTED_CATALOG_PROBE_COMPLETE", annotations: []}]};
      } else if (requests.length === 1 && mode === "restricted-reject-shell") {
        report.advertised_tool_names = (body.tools ?? []).map((entry) => entry.name).filter(Boolean).slice(0, 128);
        assert.ok(!report.advertised_tool_names.includes("exec_command"), "canary.restricted-shell-still-advertised");
        output = {id: "fc_are_unadvertised_shell", type: "function_call", call_id: "are_unadvertised_shell_1",
          name: "exec_command", arguments: JSON.stringify({cmd: "echo ARE_UNADVERTISED_TOOL_RAN"}),
          status: "completed"};
      } else if (requests.length === 2 && mode === "restricted-reject-shell") {
        const result = (body.input ?? []).find((item) => item.type === "function_call_output"
          && item.call_id === "are_unadvertised_shell_1");
        assert.ok(result, "canary.restricted-shell-result-missing");
        report.unadvertised_shell_result = JSON.stringify(result.output).slice(0, 1000);
        output = {id: "msg_are_mcp_catalog", type: "message", status: "completed",
          content: [{type: "output_text", text: "ARE_RESTRICTED_SHELL_PROBE_COMPLETE", annotations: []}]};
      } else if (requests.length === 1) {
        const tool = (body.tools ?? []).find((entry) => entry.type === "function"
          && ["exec_command", "shell_command", "shell"].includes(entry.name));
        assert.ok(tool, `canary.shell-tool-unavailable:${(body.tools ?? []).map((entry) => entry.name).join(",")}`);
        const command = mode === "allow-stdin"
          ? `${process.execPath} ${stdinProgram}`
          : "echo ARE_MCP_HOOK_TOOL_RAN";
        const args = tool.name === "exec_command" ? {cmd: command, max_output_tokens: 64, yield_time_ms: 1000,
          ...(mode === "allow-stdin" ? {tty: true} : {})}
          : tool.name === "shell_command" ? {command} : {command: ["/bin/sh", "-c", command]};
        report.tool_name = tool.name;
        output = {id: "fc_are_mcp_hook", type: "function_call", call_id: "are_mcp_hook_tool_1",
          name: tool.name, arguments: JSON.stringify(args), status: "completed"};
      } else if (mode === "allow-stdin" && requests.length === 2) {
        const toolOutput = (body.input ?? []).find((item) => item.type === "function_call_output"
          && item.call_id === "are_mcp_hook_tool_1");
        assert.ok(toolOutput, "canary.stdin-command-result-missing");
        const outputText = JSON.stringify(toolOutput.output);
        const sessionId = /session[_ ]id[^0-9]{0,12}(\d+)/i.exec(outputText)?.[1];
        assert.ok(sessionId, `canary.stdin-session-id-missing:${outputText.slice(0, 300)}`);
        const tool = (body.tools ?? []).find((entry) => entry.type === "function" && entry.name === "write_stdin");
        assert.ok(tool, "canary.write-stdin-tool-unavailable");
        output = {id: "fc_are_mcp_stdin", type: "function_call", call_id: "are_mcp_hook_tool_2",
          name: tool.name, arguments: JSON.stringify({session_id: Number(sessionId), chars: "ARE_STDIN_TOOL_OK\n",
            yield_time_ms: 1000}), status: "completed"};
      } else {
        output = {id: "msg_are_mcp_hook", type: "message", status: "completed",
          content: [{type: "output_text", text: "ARE_MCP_HOOK_PROBE_COMPLETE", annotations: []}]};
      }
      response.writeHead(200, {"content-type": "text/event-stream"});
      response.end(sse(`resp_are_mcp_hook_${requests.length}`, output));
    } catch (error) {
      report.provider_error = error.message;
      response.writeHead(500); response.end("fixture rejected request");
    }
  });
  await new Promise((done) => provider.listen(0, "127.0.0.1", done));
  const endpoint = `http://127.0.0.1:${provider.address().port}/v1`;
  const mcpHook = (event) => ({type: "mcp_tool", server: "are_mcp_hook_fixture",
    tool: mode.startsWith("relay") ? "are_hook_observe" : "intercept_fixture_tool", timeout: 15,
    input: {event}});
  const identity = {hook_event_name: "${hook_event_name}", session_id: "${session_id}",
    turn_id: "${turn_id}", cwd: "${cwd}"};
  const hook = {hooks: {
    UserPromptSubmit: [{hooks: [mcpHook({...identity, prompt: "${prompt}"})]}],
    PreToolUse: [{...(!allToolHookMode ? {matcher: viewImageMode ? "view_image" : "Bash"} : {}),
      hooks: [mcpHook({...identity, tool_name: "${tool_name}",
      tool_use_id: "${tool_use_id}", tool_input: "${tool_input}"})]}],
    Stop: [{hooks: [mcpHook({...identity, stop_hook_active: "${stop_hook_active}",
      last_assistant_message: "${last_assistant_message}"})]}],
  }};
  writeFileSync(resolve(configRoot, "hooks.json"), `${JSON.stringify(hook)}\n`, {mode: 0o600});
  writeFileSync(resolve(configRoot, "config.toml"), `model_provider = "are_fixture"\nmodel = "are-fixture"\n` +
    `mcp_optional_startup_grace_ms = 0\n[features]\nhooks = true\nplugins = false\nremote_plugin = false\n` +
    (mode.startsWith("restricted-") ? `shell_tool = false\nunified_exec = false\napps = false\nmulti_agent = false\ngoals = false\n` : "") +
    `[model_providers.are_fixture]\nname = "ARE local fixed response fixture"\nbase_url = ${JSON.stringify(endpoint)}\n` +
    `wire_api = "responses"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n` +
    `[mcp_servers.are_mcp_hook_fixture]\ncommand = ${JSON.stringify(process.execPath)}\n` +
    `args = ${JSON.stringify(mode === "missing-server" ? [resolve(scratch, "absent-mcp-server.mjs")]
      : mode.startsWith("relay") ? [relayServer, "--connection-file", connectionPath]
        : [fixtureServer, mode, log])}\n` +
    `required = true\nstartup_timeout_sec = 10\n` +
    `tool_timeout_sec = 30\ndefault_tools_approval_mode = "auto"\n`, {mode: 0o600});
  const environment = {...process.env, CODEX_HOME: configRoot};
  child = spawn(binary, ["exec", "--ephemeral", "--skip-git-repo-check", "--dangerously-bypass-hook-trust",
    "--sandbox", "danger-full-access", "-C", scratch, "Perform the fixed harmless fixture action and then finish."],
  {cwd: scratch, env: environment, stdio: ["ignore", "pipe", "pipe"]});
  const stdout = [], stderr = []; let outputBytes = 0;
  for (const stream of [child.stdout, child.stderr]) stream.on("data", (chunk) => {
    outputBytes += chunk.length;
    if (outputBytes > 2 * 1024 * 1024) child.kill("SIGTERM");
    (stream === child.stdout ? stdout : stderr).push(chunk);
  });
  const timeout = setTimeout(() => child.kill("SIGTERM"), 60000);
  const outcome = await Promise.race([
    new Promise((done) => child.once("close", (code, signal) => done({code, signal}))),
    new Promise((_, fail) => child.once("error", fail)),
  ]);
  clearTimeout(timeout);
  assert.notEqual(outcome.signal, "SIGTERM", "canary.host-timeout");
  report.host_exit = outcome;
  report.host_stdout = Buffer.concat(stdout).toString("utf8").slice(-2500);
  report.host_stderr = Buffer.concat(stderr).toString("utf8").slice(-5000);
  report.provider_requests = requests.length;
  const observed = mode.startsWith("relay") ? relayEvents.map(event => ({event}))
    : existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").filter(Boolean).map(JSON.parse) : [];
  report.hook_calls = observed.length;
  report.hook_event_names = observed.map((entry) => entry.event?.hook_event_name ?? null);
  const promptEvents = observed.filter((entry) => entry.event?.hook_event_name === "UserPromptSubmit");
  const toolEvents = observed.filter((entry) => entry.event?.hook_event_name === "PreToolUse");
  const toolEvent = toolEvents[0]?.event;
  report.prompt_event = promptEvents[0]?.event ? {
    session_id_present: Boolean(promptEvents[0].event.session_id),
    turn_id_present: Boolean(promptEvents[0].event.turn_id),
    prompt_is_string: typeof promptEvents[0].event.prompt === "string",
  } : null;
  report.hook_event = toolEvent ? {
    hook_event_name: toolEvent.hook_event_name,
    session_id_present: Boolean(toolEvent.session_id),
    turn_id_present: Boolean(toolEvent.turn_id),
    tool_use_id_present: Boolean(toolEvent.tool_use_id),
    tool_name: toolEvent.tool_name,
    tool_input_is_object: toolEvent.tool_input !== null
      && typeof toolEvent.tool_input === "object" && !Array.isArray(toolEvent.tool_input),
  } : null;
  const toolOutput = (requests[1]?.input ?? []).find((item) => item.type === "function_call_output"
    && item.call_id === "are_mcp_hook_tool_1");
  const toolOutputText = JSON.stringify(toolOutput?.output ?? null);
  report.tool_result_preview = viewImageMode ? "[view_image output redacted]" : toolOutputText.slice(0, 1500);
  report.tool_result_hook_blocked = /blocked by PreToolUse hook/i.test(toolOutputText);
  if (viewImageMode) report.image_returned_to_model = toolOutputText.includes('"input_image"');
  assert.equal(report.provider_error, undefined, "canary.provider-failed");
  if (mode === "missing-server") {
    assert.notEqual(outcome.code, 0, "canary.required-server-did-not-stop-host");
    assert.match(report.host_stderr, /required MCP servers failed to initialize: are_mcp_hook_fixture/,
      "canary.host-failed-for-unrelated-reason");
    assert.equal(requests.length, 0, "canary.required-server-allowed-model-entry");
    assert.equal(observed.length, 0, "canary.absent-server-produced-hook-events");
    report.required_server_startup_blocked = true;
  } else {
    assert.equal(toolEvents.length, mode.startsWith("deny") || mode.startsWith("relay") || mode === "allow-stdin"
      || mode === "restricted-view-image-deny" || allToolHookMode ? 1 : 0,
      "canary.tool-hook-delivery-mismatch");
    if (mode.startsWith("deny") || mode.startsWith("relay") || mode === "allow-stdin"
      || mode === "restricted-view-image-deny" || allToolHookMode) {
      assert.equal(promptEvents.length, 1, "canary.prompt-hook-delivery-mismatch");
      assert.equal(report.prompt_event?.session_id_present, true);
      assert.equal(report.prompt_event?.turn_id_present, true);
      assert.equal(report.prompt_event?.prompt_is_string, true);
      assert.equal(promptEvents[0].event.session_id, toolEvent.session_id,
        "canary.prompt-tool-session-mismatch");
      assert.equal(promptEvents[0].event.turn_id, toolEvent.turn_id,
        "canary.prompt-tool-turn-mismatch");
      assert.equal(report.hook_event?.hook_event_name, "PreToolUse");
      assert.equal(report.hook_event?.tool_name, viewImageMode ? "view_image" : "Bash");
      assert.equal(report.hook_event?.session_id_present, true);
      assert.equal(report.hook_event?.turn_id_present, true);
      assert.equal(report.hook_event?.tool_use_id_present, true);
      assert.equal(report.hook_event?.tool_input_is_object, true);
    }
    if (viewImageMode) {
      assert.equal(requests.length, 2, "canary.view-image-unexpected-provider-turns");
      assert.ok(toolOutput, "canary.view-image-result-missing");
      if (mode === "restricted-view-image-deny" || allToolHookMode) {
        assert.equal(report.tool_result_hook_blocked, true, "canary.view-image-hook-denial-missing");
        assert.equal(report.image_returned_to_model, false, "canary.view-image-read-despite-hook-denial");
      } else {
        assert.equal(toolEvents.length, 0, "canary.missing-view-image-hook-was-delivered");
        assert.equal(report.image_returned_to_model, true, "canary.missing-hook-did-not-fail-open");
      }
    } else if (mode === "restricted-catalog") {
      assert.equal(requests.length, 1, "canary.restricted-catalog-unexpected-provider-turn");
      assert.equal(toolEvents.length, 0, "canary.restricted-catalog-unexpected-tool-hook");
      assert.match(report.host_stdout + report.host_stderr, /ARE_RESTRICTED_CATALOG_PROBE_COMPLETE/,
        "canary.restricted-catalog-completion-missing");
    } else if (mode === "restricted-reject-shell") {
      assert.equal(requests.length, 2, "canary.restricted-shell-unexpected-provider-turns");
      assert.equal(toolEvents.length, 0, "canary.restricted-shell-tool-hook-observed");
      assert.ok(!/ARE_UNADVERTISED_TOOL_RAN/.test(report.unadvertised_shell_result ?? ""),
        "canary.unadvertised-shell-executed");
      assert.match(report.host_stdout + report.host_stderr, /ARE_RESTRICTED_SHELL_PROBE_COMPLETE/,
        "canary.restricted-shell-completion-missing");
    } else if (mode === "restricted-reject-effects") {
      assert.equal(requests.length, 4, "canary.restricted-effects-unexpected-provider-turns");
      assert.equal(toolEvents.length, 0, "canary.restricted-effects-tool-hook-observed");
      assert.deepEqual(report.unadvertised_effect_results?.map((entry) => entry.tool_name),
        ["exec_command", "write_stdin", "apply_patch"]);
      for (const entry of report.unadvertised_effect_results) {
        assert.match(entry.output, new RegExp(`unsupported call: ${entry.tool_name}`),
          `canary.unadvertised-${entry.tool_name}-not-rejected`);
      }
      assert.equal(existsSync(resolve(scratch, "unadvertised-effect.txt")), false,
        "canary.unadvertised-patch-created-file");
      assert.match(report.host_stdout + report.host_stderr, /ARE_RESTRICTED_EFFECTS_PROBE_COMPLETE/,
        "canary.restricted-effects-completion-missing");
    } else if (mode === "allow-stdin") {
      const stdinOutput = (requests[2]?.input ?? []).find((item) => item.type === "function_call_output"
        && item.call_id === "are_mcp_hook_tool_2");
      assert.match(JSON.stringify(stdinOutput?.output ?? null), /ARE_STDIN:ARE_STDIN_TOOL_OK/,
        "canary.stdin-tool-output-missing");
      assert.equal(toolEvents.length, 1, "canary.write-stdin-triggered-new-pre-tool-hook");
      report.stdin_tool_result_preview = JSON.stringify(stdinOutput.output).slice(0, 1000);
      report.write_stdin_pre_tool_hook_observed = false;
    } else if (mode === "deny" || mode === "deny-text-only" || mode.startsWith("relay")) {
      assert.equal(report.tool_result_hook_blocked, true, "canary.denial-not-reported");
    } else {
      assert.equal(report.tool_result_hook_blocked, false, "canary.expected-fail-open-not-observed");
      assert.match(report.tool_result_preview, /Output:\\nARE_MCP_HOOK_TOOL_RAN|Output:\nARE_MCP_HOOK_TOOL_RAN/,
        "canary.fixture-command-output-missing");
    }
  }
  report.status = "PASS";
} catch (error) {
  report.error = error.message;
  process.exitCode = 1;
} finally {
  if (child && child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  await bridge?.close().catch(() => {});
  if (provider) {
    provider.closeAllConnections();
    await new Promise((done) => provider.close(done));
  }
  if (scratch) rmSync(scratch, {recursive: true, force: true, maxRetries: 8, retryDelay: 250});
  report.teardown = {temporary_configuration_removed: scratch ? !existsSync(scratch) : null};
  process.stdout.write(`${JSON.stringify(report)}\n`);
}
