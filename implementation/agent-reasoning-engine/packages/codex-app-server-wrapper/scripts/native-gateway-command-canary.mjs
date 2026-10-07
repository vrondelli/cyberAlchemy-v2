#!/usr/bin/env node
// Disposable, model-free proof of the gateway's command transform against an
// installed App Server. This does not exercise approval or active-turn proof.
import assert from "node:assert/strict";
import {spawn, spawnSync} from "node:child_process";
import {createHash, randomBytes} from "node:crypto";
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {join} from "node:path";

import {connectGatewayRpcTransport, createAppServerRpcClient,
  createJsonLineProcessBackendAdapter, createMemoryGatewaySessionStore,
  createPersistentGateway} from "../index.mjs";
import {materializeHostedCommandExec} from "../src/hosted-effect-command.mjs";
import {HOSTED_EFFECT_EXECUTE} from "../src/protocol.mjs";

const [binary, expectedVersion] = process.argv.slice(2);
const report = {schema_version: "are.native-gateway-command-canary/v1",
  status: "FAIL", current_desktop_task_touched: false, external_model_calls: 0,
  authority_effect: "none"};
let root, gateway, transport, store;
try {
  assert.ok(binary && expectedVersion,
    "usage: native-gateway-command-canary <codex> <version>");
  const version = spawnSync(binary, ["--version"], {encoding: "utf8", timeout: 5000});
  assert.equal(version.status, 0);
  assert.equal(version.stdout.trim(), expectedVersion, "canary.host-version-drift");
  report.host = {version: expectedVersion,
    sha256: createHash("sha256").update(readFileSync(binary)).digest("hex")};
  root = mkdtempSync(join(tmpdir(), "are-native-gateway-command-"));
  const codexHome = join(root, "codex-home");
  mkdirSync(codexHome, {mode: 0o700});
  writeFileSync(join(codexHome, "config.toml"), "web_search = \"disabled\"\n", {mode: 0o600});
  store = createMemoryGatewaySessionStore({store_id: "native-gateway-command-canary"});
  const effectId = `hosted-effect:${"e".repeat(64)}`;
  const sentinel = join(root, "gateway-write.txt");
  const request = {thread_id: "disposable-thread", turn_id: "disposable-turn",
    effect_id: effectId, kind: "command", proposal: {command: [process.execPath, "-e",
      `require('node:fs').writeFileSync(${JSON.stringify(sentinel)}, 'ARE_GATEWAY_OK')`], cwd: root}};
  const token = randomBytes(32).toString("hex");
  gateway = createPersistentGateway({listen_path: join(root, "gateway.sock"),
    runtime_epoch_id: "are-native-gateway-command-canary",
    backend: {command: binary, args: ["app-server", "--stdio"]},
    backend_adapter: createJsonLineProcessBackendAdapter({adapter_id: "native-app-server-canary/v1",
      command: binary, args: ["app-server", "--stdio"]}),
    session_store: store, connection_token: token,
    spawn_impl: (command, args, options) => spawn(command, args, {...options,
      cwd: root, env: {...process.env, CODEX_HOME: codexHome}, windowsHide: true}),
    wrapper_factory: () => ({
      processClientMessage: async message => {
        if (message.method !== HOSTED_EFFECT_EXECUTE) return {to_server: [message], to_client: []};
        const prepared = materializeHostedCommandExec({request: message.params.request,
          repository_root: root});
        assert.equal(prepared.ok, true, "canary.command-materialization-failed");
        return {to_server: [{jsonrpc: "2.0", id: message.id,
          method: prepared.host_method, params: prepared.params}], to_client: []};
      },
      processServerMessage: async message => ({to_server: [], to_client: [message]}),
      prepareForEviction: ({reason}) => ({ok: true, checkpoint_digest: `checkpoint:${reason}`,
        epoch_digest: `epoch:${reason}`, preparation_digest: `preparation:${reason}`}),
    }),
  });
  await gateway.start();
  transport = connectGatewayRpcTransport({socket_path: join(root, "gateway.sock"),
    connection_token: token, consumer_id: "codex:native-gateway-canary", lane: "interaction-bound"});
  await transport.ready;
  const rpc = createAppServerRpcClient({transport, request_timeout_ms: 10000});
  await rpc.initialize({clientInfo: {name: "are_native_gateway_command_canary", version: "1.0.0"}});
  await rpc.notify("initialized", {});
  await assert.rejects(() => rpc.request("command/exec", {command: [process.execPath, "--version"],
    cwd: root, sandboxPolicy: {type: "readOnly"}}),
  error => error?.details?.code === -32081, "canary.direct-command-exec-admitted");
  const result = await rpc.request(HOSTED_EFFECT_EXECUTE, {request},
    {idempotency_key: effectId});
  assert.equal(result.exitCode, 0, "canary.gateway-command-failed");
  assert.equal(readFileSync(sentinel, "utf8"), "ARE_GATEWAY_OK");
  report.status = "PASS";
  report.direct_client_command_denied = true;
  report.gateway_transformed_command_executed = true;
} catch (error) {
  report.reason = typeof error?.message === "string" ? error.message.slice(0, 256) : "canary.failed";
  process.exitCode = 1;
} finally {
  await transport?.close().catch(() => {});
  await gateway?.close().catch(() => {});
  store?.close();
  if (root) rmSync(root, {recursive: true, force: true});
}
process.stdout.write(`${JSON.stringify(report)}\n`);
