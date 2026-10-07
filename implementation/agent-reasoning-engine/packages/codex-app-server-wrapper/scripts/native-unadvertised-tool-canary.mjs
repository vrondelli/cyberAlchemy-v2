#!/usr/bin/env node
// Fixed-loopback probe: can an installed host execute a native tool absent from its model catalog?
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash, randomBytes} from "node:crypto";
import {once} from "node:events";
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {createServer} from "node:http";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";

import {createAppServerRpcClient, spawnAppServerRpcTransport} from "../src/rpc-client.mjs";
import {startModelWireGuard} from "../src/model-wire-guard.mjs";

const [binary, expectedVersion] = process.argv.slice(2);
const flags = process.argv.slice(4);
const disableViewImage = flags.includes("--disable-view-image");
const cliDisableViewImage = flags.includes("--cli-disable-view-image");
const probeViewImage = flags.includes("--probe-view-image");
const modelWireGuard = flags.includes("--model-wire-guard");
const modelWireGuardBenign = flags.includes("--model-wire-guard-benign");
const guardViaCliOverride = flags.includes("--guard-via-cli-override");
const probeEnvHeader = flags.includes("--probe-env-header");
const bindGuardClientHeader = probeEnvHeader || modelWireGuard;
const guardClientToken = bindGuardClientHeader ? randomBytes(32).toString("hex") : null;
const marker = "ARE_UNADVERTISED_NATIVE_TOOL_EXECUTED";
const report = {schema_version: "are.native-unadvertised-tool-canary/v1", status: "FAIL",
  current_desktop_task_touched: false, external_model_calls: 0};
let root, server, guard, rpc, child, probeImagePath;
const providerRequests = [];

function sse(id, output) {
  const item = output.type === "function_call"
    ? {id: `fc_${id}`, type: "function_call", call_id: "are_unadvertised_call_1",
      name: output.name, arguments: JSON.stringify(output.name === "view_image"
        ? {path: probeImagePath}
        : {cmd: `echo ${marker}`, yield_time_ms: 1000, max_output_tokens: 64}), status: "completed"}
    : {id: `msg_${id}`, type: "message", role: "assistant", status: "completed",
      content: [{type: "output_text", text: "ARE_UNADVERTISED_PROBE_DONE", annotations: []}]};
  const events = [
    {type: "response.created", response: {id, object: "response", status: "in_progress", output: []}},
    {type: "response.output_item.added", output_index: 0, item: {...item, status: "in_progress"}},
    ...(item.type === "message" ? [
      {type: "response.content_part.added", item_id: item.id, output_index: 0, content_index: 0,
        part: {type: "output_text", text: "", annotations: []}},
      {type: "response.output_text.delta", item_id: item.id, output_index: 0, content_index: 0,
        delta: "ARE_UNADVERTISED_PROBE_DONE"},
    ] : []),
    {type: "response.output_item.done", output_index: 0, item},
    {type: "response.completed", response: {id, object: "response", status: "completed", output: [item],
      usage: {input_tokens: 20, output_tokens: 8, total_tokens: 28,
        input_tokens_details: {cached_tokens: 0}}}},
  ];
  return events.map(event => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}

async function closeClient() {
  if (!rpc || !child) return;
  await rpc.close().catch(() => {});
  if (child.exitCode !== null || child.signalCode !== null) return;
  await Promise.race([once(child, "close").catch(() => {}),
    new Promise(done => setTimeout(done, 3000))]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await Promise.race([once(child, "close").catch(() => {}),
      new Promise(done => setTimeout(done, 3000))]);
  }
}

try {
  assert.ok(binary && expectedVersion && flags.length <= 7
    && flags.every(flag => ["--disable-view-image", "--cli-disable-view-image", "--probe-view-image", "--model-wire-guard", "--model-wire-guard-benign", "--guard-via-cli-override", "--probe-env-header"].includes(flag))
    && new Set(flags).size === flags.length,
  "usage: native-unadvertised-tool-canary.mjs <installed-codex> <exact-version> [--disable-view-image] [--cli-disable-view-image] [--probe-view-image] [--model-wire-guard] [--model-wire-guard-benign] [--guard-via-cli-override] [--probe-env-header]");
  assert.ok(!modelWireGuard || probeViewImage, "canary.model-wire-guard-requires-view-image-probe");
  assert.ok(!modelWireGuardBenign || modelWireGuard, "canary.benign-mode-requires-guard");
  assert.ok(!guardViaCliOverride || modelWireGuard, "canary.cli-override-requires-guard");
  assert.ok(!probeEnvHeader || !modelWireGuard, "canary.env-header-probe-requires-direct-fixture");
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0, "canary.host-version-command-failed");
  assert.equal(version.stdout.trim(), expectedVersion, "canary.host-version-drift");
  report.host = {version: expectedVersion,
    sha256: createHash("sha256").update(readFileSync(binary)).digest("hex")};

  root = mkdtempSync(join(tmpdir(), "are-unadvertised-tool-"));
  if (probeViewImage) {
    probeImagePath = join(root, "probe.png");
    writeFileSync(probeImagePath, readFileSync(resolve(import.meta.dirname,
      "../../../apps/desktop-companion/src-tauri/icons/icon.png")), {mode: 0o600});
  }
  const codexHome = join(root, "codex-home");
  mkdirSync(codexHome, {mode: 0o700});
  server = createServer(async (request, response) => {
    try {
      assert.equal(request.method, "POST");
      assert.ok(request.url.endsWith("/responses"));
      if (probeEnvHeader) {
        assert.equal(request.headers["x-are-guard-token"], guardClientToken,
          "canary.env-header-not-sent-to-provider");
        report.env_header_observed = true;
      }
      const chunks = [];
      let size = 0;
      for await (const chunk of request) {
        size += chunk.length;
        assert.ok(size <= 2 * 1024 * 1024, "canary.provider-input-too-large");
        chunks.push(chunk);
      }
      const body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
      providerRequests.push(body);
      assert.ok(providerRequests.length <= (modelWireGuardBenign ? 1 : 2), "canary.unexpected-provider-request");
      response.writeHead(200, {"content-type": "text/event-stream"});
      response.end(sse(`resp_are_unadvertised_${providerRequests.length}`,
        {type: providerRequests.length === 1 && !modelWireGuardBenign ? "function_call" : "message",
          name: probeViewImage ? "view_image" : "exec_command"}));
    } catch (error) {
      report.provider_error = error.message;
      if (!response.headersSent) response.writeHead(500);
      response.end("fixture rejected request");
    }
  });
  await new Promise(done => server.listen(0, "127.0.0.1", done));
  const endpoint = `http://127.0.0.1:${server.address().port}/v1`;
  if (modelWireGuard) guard = await startModelWireGuard({upstreamUrl: `${endpoint}/responses`,
    allowedToolNames: [], clientToken: guardClientToken});
  const hostEndpoint = guard && !guardViaCliOverride ? guard.url : endpoint;
  writeFileSync(join(codexHome, "config.toml"),
    `model_provider = "are_fixture"\nmodel = "are-fixture"\nweb_search = "disabled"\n` +
    `[features]\nshell_tool = false\nunified_exec = false\napps = false\n` +
    `multi_agent = false\ngoals = false\nplugins = false\nremote_plugin = false\n` +
    `[model_providers.are_fixture]\nname = "ARE fixed local probe"\n` +
    `base_url = ${JSON.stringify(hostEndpoint)}\nwire_api = "responses"\nrequires_openai_auth = false\n` +
    `request_max_retries = 0\nstream_max_retries = 0\n` +
    (disableViewImage ? `[tools]\nview_image = false\n` : ""), {mode: 0o600});

  const transport = spawnAppServerRpcTransport({command: binary,
    args: [...(cliDisableViewImage ? ["-c", "tools.view_image=false"] : []),
      ...(guardViaCliOverride ? ["-c", `model_providers.are_fixture.base_url=${JSON.stringify(guard.url)}`] : []),
      ...(bindGuardClientHeader ? ["-c", 'model_providers.are_fixture.env_http_headers={"X-ARE-Guard-Token"="ARE_MODEL_WIRE_CLIENT_TOKEN"}'] : []),
      "app-server", "--stdio"],
    env: {...process.env, CODEX_HOME: codexHome,
      ...(bindGuardClientHeader ? {ARE_MODEL_WIRE_CLIENT_TOKEN: guardClientToken} : {})},
    spawn_impl: (command, args, options) => {
      child = spawn(command, args, {...options, cwd: root, windowsHide: true});
      return child;
    }});
  rpc = createAppServerRpcClient({transport, request_timeout_ms: 15000,
    completion_timeout_ms: 30000});
  await rpc.initialize({clientInfo: {name: "are_unadvertised_tool_canary", version: "1.0.0"}});
  await rpc.notify("initialized", {});
  const effective = await rpc.request("config/read", {includeLayers: false}, {timeout_ms: 15000});
  report.effective_model_provider = effective?.config?.modelProvider ?? effective?.config?.model_provider ?? null;
  report.effective_provider_base_url = effective?.config?.modelProviders?.are_fixture?.baseUrl
    ?? effective?.config?.modelProviders?.are_fixture?.base_url
    ?? effective?.config?.model_providers?.are_fixture?.base_url ?? null;
  if (bindGuardClientHeader) {
    const provider = effective?.config?.modelProviders?.are_fixture
      ?? effective?.config?.model_providers?.are_fixture;
    const headers = provider?.envHttpHeaders ?? provider?.env_http_headers;
    report.effective_env_header_binding = headers?.["X-ARE-Guard-Token"] === "ARE_MODEL_WIRE_CLIENT_TOKEN";
    assert.equal(report.effective_env_header_binding, true, "canary.env-header-config-binding-mismatch");
  }
  if (guardViaCliOverride) {
    assert.equal(report.effective_model_provider, "are_fixture", "canary.cli-override-provider-mismatch");
    assert.equal(report.effective_provider_base_url, guard.url, "canary.cli-override-guard-url-mismatch");
  }
  report.effective_tools = effective?.config?.tools ?? null;
  report.effective_view_image = effective?.config?.tools?.viewImage
    ?? effective?.config?.tools?.view_image ?? null;
  const started = await rpc.startThread({cwd: root, model: "are-fixture"});
  const threadId = started?.thread?.id;
  assert.ok(typeof threadId === "string" && threadId.length > 0, "canary.thread-id-missing");
  let turnError = null;
  let completedStatus = null;
  try {
    const turn = await rpc.runTurn({threadId, input: [{type: "text", text: "Use the local fixed response."}],
      approvalPolicy: "never", sandboxPolicy: {type: "readOnly"}});
    completedStatus = turn.completed?.turn?.status ?? null;
  } catch (error) {
    turnError = String(error).slice(0, 512);
  }
  assert.equal(report.provider_error, undefined, "canary.provider-failed");
  assert.ok(providerRequests.length >= 1, "canary.no-loopback-provider-request");
  const advertised = (providerRequests[0].tools ?? []).map(item => item.name).filter(Boolean);
  const rawOutput = providerRequests[1]?.input?.filter(item =>
    item.type === "function_call_output" && item.call_id === "are_unadvertised_call_1")
    .map(item => item.output) ?? [];
  const output = rawOutput.map(item => String(item));
  report.advertised_native_exec = advertised.includes("exec_command");
  report.advertised_tool_names = advertised;
  report.view_image_disable_requested = disableViewImage;
  report.view_image_cli_disable_requested = cliDisableViewImage;
  report.view_image_disable_effective = disableViewImage || cliDisableViewImage
    ? !advertised.includes("view_image") : null;
  report.provider_request_count = providerRequests.length;
  report.native_tool_result_returned = output.length > 0;
  report.native_execution_marker_returned = output.some(item => item.includes(marker));
  report.native_tool_result_excerpt = probeViewImage ? null : output[0]?.slice(0, 512) ?? null;
  if (probeViewImage) {
    report.provider_return_item_types = (providerRequests[1]?.input ?? [])
      .map(item => item?.type ?? null).slice(-16);
    report.view_image_result_shape = rawOutput[0] === undefined ? null
      : JSON.stringify(rawOutput[0], (_key, value) => typeof value === "string" && value.length > 100
        ? `[string ${value.length} chars]` : value).slice(0, 1024);
  }
  report.turn_error = turnError;
  report.completed_status = completedStatus;
  if (probeEnvHeader) assert.equal(report.env_header_observed, true, "canary.env-header-unobserved");
  if (modelWireGuard) {
    report.model_wire_guard = guard.inspect();
    assert.equal(providerRequests.length, 1, "canary.guard-allowed-second-provider-request");
    assert.equal(report.model_wire_guard.blocked, modelWireGuardBenign ? 0 : 1,
      "canary.guard-block-count-mismatch");
    assert.equal(report.model_wire_guard.forwarded, modelWireGuardBenign ? 1 : 0,
      "canary.guard-forward-count-mismatch");
    assert.equal(output.length, 0, "canary.native-view-image-result-returned");
    assert.equal(report.native_execution_marker_returned, false);
    if (modelWireGuardBenign) {
      assert.equal(turnError, null, "canary.benign-turn-failed");
      assert.equal(completedStatus, "completed", "canary.benign-turn-not-completed");
      report.status = "PASS_ALLOWED_BENIGN";
    } else {
      assert.ok(turnError !== null || completedStatus !== "completed", "canary.host-completed-denied-model-response");
      report.status = "PASS_BLOCKED_BEFORE_HOST";
    }
  } else {
  assert.equal(report.advertised_native_exec, false, "canary.native-exec-was-advertised");
  assert.equal(providerRequests.length, 2, "canary.function-result-not-returned-to-provider");
  if (!probeViewImage) {
    assert.deepEqual(output, ["unsupported call: exec_command"],
      "canary.unadvertised-native-tool-was-not-rejected");
    assert.equal(report.native_execution_marker_returned, false, "canary.unadvertised-tool-executed");
  }
  assert.equal(turnError, null, "canary.turn-failed-after-rejection");
  if (disableViewImage || cliDisableViewImage) assert.equal(report.view_image_disable_effective, true,
    "canary.view-image-disable-ignored");
  report.status = probeViewImage ? "OBSERVED" : "PASS_REJECTED";
  }
} catch (error) {
  report.error = String(error);
  process.exitCode = 1;
} finally {
  await closeClient();
  if (guard) await guard.close();
  if (server) await new Promise(done => server.close(done));
  if (root) rmSync(root, {recursive: true, force: true});
  process.stdout.write(JSON.stringify(report) + "\n");
}
