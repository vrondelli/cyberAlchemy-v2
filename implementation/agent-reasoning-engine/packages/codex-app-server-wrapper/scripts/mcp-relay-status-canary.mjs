#!/usr/bin/env node
// Read-only App Server MCP catalog probe. Uses a private CODEX_HOME and starts no model turn.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash} from "node:crypto";
import {existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join, resolve} from "node:path";

import {createAppServerRpcClient, spawnAppServerRpcTransport} from "../src/rpc-client.mjs";
import {verifyRestrictedHostProfile} from "../src/restricted-host-profile.mjs";

const fixtureServer = resolve(import.meta.dirname, "fixtures/mcp-hook-transport-server.mjs");
const [binary, expectedVersion, mode = "present"] = process.argv.slice(2);
const report = {schema_version: "are.mcp-relay-status-canary/v1", status: "FAIL", mode,
  authority_effect: "none", current_desktop_task_touched: false, model_turns: 0, external_model_calls: 0};
let scratch, child, rpc, transport;

try {
  assert.ok(binary && expectedVersion && ["present", "missing-tool", "restricted-profile"].includes(mode),
    "usage: mcp-relay-status-canary.mjs <installed-codex> <exact-version> [present|missing-tool|restricted-profile]");
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0, "canary.host-version-command-failed");
  assert.equal(version.stdout.trim(), expectedVersion, "canary.host-version-drift");
  report.host = {version: expectedVersion, sha256: createHash("sha256").update(readFileSync(binary)).digest("hex")};

  scratch = mkdtempSync(join(tmpdir(), "are-mcp-relay-status-"));
  const codexHome = join(scratch, "codex-home");
  mkdirSync(codexHome);
  const log = join(scratch, "unused-hook-events.jsonl");
  writeFileSync(join(codexHome, "config.toml"),
    `model_provider = "are_fixture"\nmodel = "are-fixture"\n` +
    (mode === "restricted-profile" ? `web_search = "disabled"\n` : "") +
    `[features]\nplugins = false\nremote_plugin = false\n` +
    (mode === "restricted-profile" ? `shell_tool = false\nunified_exec = false\napps = false\nmulti_agent = false\ngoals = false\n` : "") +
    `[model_providers.are_fixture]\nname = "ARE no-turn catalog fixture"\nbase_url = "http://127.0.0.1:9/v1"\n` +
    `wire_api = "responses"\nrequires_openai_auth = false\nrequest_max_retries = 0\nstream_max_retries = 0\n` +
    `[mcp_servers.are_mcp_hook_fixture]\ncommand = ${JSON.stringify(process.execPath)}\n` +
    `args = ${JSON.stringify([fixtureServer, mode === "present" ? "deny" : "missing-tool", log])}\n` +
    `required = true\nenabled_tools = ["intercept_fixture_tool"]\n` +
    `startup_timeout_sec = 10\ntool_timeout_sec = 10\n`, {mode: 0o600});

  transport = spawnAppServerRpcTransport({command: binary, args: ["app-server", "--stdio"],
    env: {...process.env, CODEX_HOME: codexHome},
    spawn_impl: (...args) => { child = spawn(...args); return child; }});
  rpc = createAppServerRpcClient({transport, request_timeout_ms: 15000, thread_start_timeout_ms: 20000});
  await rpc.initialize({clientInfo: {name: "are_mcp_relay_status_canary", version: "1.0.0"}});
  await rpc.notify("initialized", {});
  if (mode === "restricted-profile") {
    const effective = await rpc.request("config/read", {includeLayers: false}, {timeout_ms: 15000});
    const keys = ["shell_tool", "unified_exec", "apps", "multi_agent", "goals", "plugins", "remote_plugin"];
    report.effective_features = Object.fromEntries(keys.map((key) => [key, effective?.config?.features?.[key] ?? null]));
    report.effective_web_search = effective?.config?.webSearch ?? effective?.config?.web_search ?? null;
    report.effective_mcp_server_names = Object.keys(effective?.config?.mcpServers
      ?? effective?.config?.mcp_servers ?? {}).sort();
    report.effective_mcp_server_field_names = Object.fromEntries(report.effective_mcp_server_names
      .map(name => [name, Object.keys((effective?.config?.mcpServers
        ?? effective?.config?.mcp_servers ?? {})[name] ?? {}).sort()]));
    const fixtureIdentity = (effective?.config?.mcpServers ?? effective?.config?.mcp_servers ?? {})
      .are_mcp_hook_fixture;
    report.mcp_fixture_identity_checks = {command: fixtureIdentity?.command === process.execPath,
      args: JSON.stringify(fixtureIdentity?.args) === JSON.stringify([fixtureServer, "missing-tool", log]),
      enabled: fixtureIdentity?.enabled, required: fixtureIdentity?.required,
      environment_id: fixtureIdentity?.environment_id,
      enabled_tools: fixtureIdentity?.enabled_tools};
    assert.ok(keys.every((key) => report.effective_features[key] === false),
      "canary.effective-restricted-features-not-disabled");
    assert.equal(report.effective_web_search, "disabled", "canary.effective-web-search-not-disabled");
    const managedGate = await verifyRestrictedHostProfile({codexCommand: binary, codexHome, cwd: scratch,
      expectedMcpServers: [{name: "are_mcp_hook_fixture", command: process.execPath,
        args: [fixtureServer, "missing-tool", log], tools: ["intercept_fixture_tool"]}]});
    assert.deepEqual(managedGate.features, report.effective_features,
      "canary.managed-gate-features-drift");
    assert.equal(managedGate.web_search, report.effective_web_search,
      "canary.managed-gate-web-search-drift");
    report.managed_gate = "PASS";
    report.status = "PASS";
  } else {
  const started = await rpc.startThread({cwd: scratch, ephemeral: true, model: "are-fixture"});
  const threadId = started?.thread?.id;
  assert.ok(typeof threadId === "string" && threadId.length > 0, "canary.thread-start-identity-missing");
  const result = await rpc.request("mcpServerStatus/list",
    {detail: "toolsAndAuthOnly", threadId, limit: 100}, {timeout_ms: 15000});
  assert.ok(Array.isArray(result?.data) && result.nextCursor === null,
    "canary.catalog-shape-or-pagination-unexpected");
  const matches = result.data.filter((item) => item?.name === "are_mcp_hook_fixture");
  assert.equal(matches.length, 1, "canary.fixture-server-status-not-unique");
  const status = matches[0];
  assert.equal(status.runtimeStatus, "connected", "canary.fixture-server-not-connected");
  assert.equal(status.toolsError, null, "canary.tool-catalog-discovery-failed");
  assert.ok(status.tools && typeof status.tools === "object" && !Array.isArray(status.tools),
    "canary.tool-catalog-invalid");
  const toolPresent = Object.hasOwn(status.tools, "intercept_fixture_tool");
  assert.equal(toolPresent, mode === "present", "canary.tool-catalog-disposition-mismatch");
  report.catalog = {server_name: status.name, runtime_status: status.runtimeStatus,
    tool_discovery_error: false, required_tool_present: toolPresent,
    advertised_tool_count: Object.keys(status.tools).length};
  report.status = "PASS";
  }
} catch (error) {
  report.error = error.message;
  process.exitCode = 1;
} finally {
  await rpc?.close().catch(() => {});
  if (!rpc) await transport?.close().catch(() => {});
  if (child && child.exitCode === null && child.signalCode === null) {
    await Promise.race([new Promise((done) => child.once("close", done)),
      new Promise((done) => setTimeout(done, 5000))]);
    if (child.exitCode === null && child.signalCode === null) child.kill("SIGTERM");
  }
  if (scratch) rmSync(scratch, {recursive: true, force: true, maxRetries: 8, retryDelay: 250});
  report.teardown = {temporary_configuration_removed: scratch ? !existsSync(scratch) : null};
  process.stdout.write(`${JSON.stringify(report)}\n`);
}
