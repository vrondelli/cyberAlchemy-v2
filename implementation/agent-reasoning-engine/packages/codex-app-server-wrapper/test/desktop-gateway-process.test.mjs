import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {createHash} from "node:crypto";
import {EventEmitter, once} from "node:events";
import {mkdtempSync, readFileSync, rmSync, writeFileSync} from "node:fs";
import {tmpdir} from "node:os";
import {dirname, join, resolve} from "node:path";
import {PassThrough} from "node:stream";
import test from "node:test";
import {fileURLToPath} from "node:url";

import {createCodexAppServerWrapper, createCodexGatewayBackendAdapter,
  createPersistentGateway, loadVerifiedRepositoryRuntimeBundle} from "../index.mjs";
import {digestValue} from "../src/canonical.mjs";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const shim = join(packageRoot, "bin/are-codex-desktop-shim.mjs");
const appServerArgs = ["-c", "features.code_mode_host=true", "app-server", "--analytics-default-enabled"];
const connectionToken = "fixture-desktop-gateway-connection-token-v1";

function fakeBackend(onMessage = () => {}) {
  const child = new EventEmitter();
  child.stdin = new PassThrough();
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  let buffer = "";
  child.stdin.on("data", chunk => {
    buffer += chunk.toString("utf8");
    let index;
    while ((index = buffer.indexOf("\n")) >= 0) {
      const message = JSON.parse(buffer.slice(0, index));
      buffer = buffer.slice(index + 1);
      if (message.method === "initialize") {
        child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id,
          result: {userAgent: "fixture-codex"}})}\n`);
      } else onMessage(message, child);
    }
  });
  child.kill = () => { child.emit("exit", 0, "SIGTERM"); return true; };
  return child;
}

async function until(predicate, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (!predicate()) {
    if (Date.now() > deadline) throw new Error("Desktop gateway process fixture timed out.");
    await new Promise(resolve => setTimeout(resolve, 10));
  }
}

test("managed desktop shim queues creations, completes two owned turns, and refuses unreconciled restart", async context => {
  if (process.platform === "win32") return context.skip("The desktop shim runs inside WSL.");
  const directory = mkdtempSync(join(tmpdir(), "are-desktop-gateway-process-"));
  const stateDir = mkdtempSync(join(tmpdir(), "are-desktop-gateway-process-state-"));
  const socketPath = join(directory, "gateway.sock");
  const profilePath = join(directory, "profile.json");
  writeFileSync(profilePath, "{}\n", {mode: 0o600});
  const backendDigest = createHash("sha256").update(readFileSync(process.execPath)).digest("hex");
  const loaded = loadVerifiedRepositoryRuntimeBundle(join(packageRoot, "profiles/repository-runtime-v1.json"));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  assert.ok(loaded.value.gateway.allowed_clients.some(client => client.consumer_id === "codex:desktop-wsl"
    && client.lane === "interaction-bound"));
  let creationCount = 0;
  let turnDispatchCount = 0;
  let modelListDispatchCount = 0;
  const completedTurns = [];
  const gateway = createPersistentGateway({listen_path: socketPath, connection_token: connectionToken,
    backend: {mode: "direct-stdio"}, backend_adapter: createCodexGatewayBackendAdapter(),
    desktop_backend_binding: {binary_sha256: backendDigest, host_profile: "desktop-wsl-base/v1"},
    authorize_client: ({consumer_id, lane}) => consumer_id === "codex:desktop-wsl" && lane === "interaction-bound",
    wrapper_factory: ({consumer_id, lane}) => {
      const profile = structuredClone(loaded.value);
      profile.turn_bindings.default = {...profile.turn_bindings.default, consumer_ref: consumer_id, lane};
      const wrapper = createCodexAppServerWrapper({...loaded, loaded_profile: profile,
        require_bound_effect_route: true});
      return {...wrapper, processServerMessage: async message => {
        const actions = await wrapper.processServerMessage(message);
        return {...actions, to_client: [...actions.to_client,
          ...(!message.method && Object.hasOwn(message, "id") ? [{jsonrpc: "2.0",
            method: "cyberalchemy/decision", params: {fixture: true}}] : [])]};
      }};
    },
    spawn_impl: () => fakeBackend((message, child) => {
      if (message.method === "thread/start") {
        creationCount += 1;
        child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id,
          result: {thread: {id: creationCount === 1 ? "thread-first" : "thread-second"}}})}\n`);
      } else if (message.method === "turn/start") {
        turnDispatchCount += 1;
        const turnId = `desktop-turn-${turnDispatchCount}`;
        child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id,
          result: {turn: {id: turnId, threadId: "thread-first"}}})}\n`);
        setImmediate(() => {
          completedTurns.push({id: turnId, status: "completed", items: []});
          child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
            params: {threadId: "thread-first", turn: {id: turnId, status: "completed", items: []}}})}\n`);
        });
      } else if (message.method === "thread/read") {
        child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id,
          result: {thread: {id: message.params.threadId, turns: completedTurns}}})}\n`);
      } else if (message.method === "model/list") {
        modelListDispatchCount += 1;
        child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id,
          result: {data: [{id: "fixture-model"}], nextCursor: null}})}\n`);
      }
    })});
  let desktop = null;
  try {
    await gateway.start();
    desktop = spawn(process.execPath, [shim, ...appServerArgs], {stdio: ["pipe", "pipe", "pipe"],
      env: {PATH: process.env.PATH, ARE_DESKTOP_SHIM_MODE: "managed-gateway",
        ARE_DESKTOP_SHIM_CODEX_COMMAND: process.execPath,
        ARE_DESKTOP_SHIM_CODEX_SHA256: backendDigest,
        ARE_DESKTOP_SHIM_CONFIG: profilePath,
        ARE_DESKTOP_SHIM_REPOSITORY_ROOT: directory,
        ARE_DESKTOP_GATEWAY_SOCKET: socketPath,
        ARE_DESKTOP_GATEWAY_STATE_DIR: stateDir,
        ARE_DESKTOP_GATEWAY_CONNECTION_TOKEN: connectionToken}});
    let stdout = "";
    let stderr = "";
    desktop.stdout.on("data", chunk => { stdout += chunk.toString("utf8"); });
    desktop.stderr.on("data", chunk => { stderr += chunk.toString("utf8"); });
    await until(() => gateway.inspect().sessions.length === 1 || desktop.exitCode !== null);
    assert.equal(desktop.exitCode, null, `${stderr}\n${stdout}`);
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 9, method: "initialize",
      params: {clientInfo: {name: "desktop-process-fixture"}}})}\n`);
    await until(() => stdout.includes("\n"));
    assert.deepEqual(JSON.parse(stdout.trim()), {jsonrpc: "2.0", id: 9,
      result: {userAgent: "fixture-codex"}});
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 10, method: "thread/start",
      params: {cwd: "/first", approvalPolicy: "on-request", sandbox: "read-only"}})}\n`);
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 11, method: "thread/start",
      params: {cwd: "/second", approvalPolicy: "on-request", sandbox: "read-only"}})}\n`);
    await until(() => stdout.trim().split("\n").length === 3 || desktop.exitCode !== null);
    assert.equal(desktop.exitCode, null, `${stderr}\n${stdout}`);
    const replies = stdout.trim().split("\n").map(line => JSON.parse(line));
    assert.deepEqual(replies.slice(1).map(reply => reply.id), [10, 11]);
    assert.deepEqual(replies.slice(1).map(reply => reply.result.thread.id),
      ["thread-first", "thread-second"]);
    assert.equal(creationCount, 2);
    for (let index = 1; index <= 2; index += 1) {
      desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 11 + index, method: "turn/start",
        params: {threadId: "thread-first", input: [{type: "text", text: `Implement fixture ${index}.`}],
          approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}}})}\n`);
      await until(() => stdout.trim().split("\n").length >= 3 + index * 2 || desktop.exitCode !== null)
        .catch(error => { throw new Error(`${error.message}\n${stderr}\n${stdout}`); });
      assert.equal(desktop.exitCode, null, `${stderr}\n${stdout}`);
      const pair = stdout.trim().split("\n").slice(3 + (index - 1) * 2).map(line => JSON.parse(line));
      assert.equal(pair[0].result?.turn?.id, `desktop-turn-${index}`);
      assert.equal(pair[1].method, "turn/completed");
      assert.equal(pair[1].params.turn.id, `desktop-turn-${index}`);
    }
    assert.equal(turnDispatchCount, 2);
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 14, method: "model/list",
      params: {limit: 20, includeHidden: false}})}\n`);
    await until(() => stdout.trim().split("\n").length >= 8 || desktop.exitCode !== null);
    assert.equal(desktop.exitCode, null, `${stderr}\n${stdout}`);
    assert.deepEqual(JSON.parse(stdout.trim().split("\n").at(-1)), {jsonrpc: "2.0", id: 14,
      result: {data: [{id: "fixture-model"}], nextCursor: null}});
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 15, method: "model/list",
      params: {limit: 20, includeHidden: true}})}\n`);
    await until(() => stdout.split("\n").some(line => line.includes('"id":15')) || desktop.exitCode !== null)
      .catch(error => { throw new Error(`${error.message}\n${stderr}\n${JSON.stringify(gateway.inspect().sessions.map(session => ({delivery_sequence: session.delivery_sequence, acknowledged_through: session.acknowledged_through, unacknowledged_deliveries: session.unacknowledged_deliveries})))}`); });
    assert.equal(desktop.exitCode, null, `${stderr}\n${stdout}`);
    const rejectedModelList = stdout.trim().split("\n").map(line => JSON.parse(line))
      .find(reply => reply.id === 15);
    assert.ok(rejectedModelList, stdout);
    assert.equal(rejectedModelList.error?.code, -32082, JSON.stringify(rejectedModelList));
    assert.match(JSON.stringify(rejectedModelList), /host\.params-invalid/);
    assert.equal(modelListDispatchCount, 1, "A rejected hidden-model request must not reach the backend.");
    desktop.stdin.end();
    const [code] = await once(desktop, "exit");
    assert.equal(code, 0, stderr);
    const state = JSON.parse(readFileSync(join(stateDir, "desktop-gateway-state.json"), "utf8"));
    assert.equal(state.consumer_id, "codex:desktop-wsl");
    assert.equal(state.intents.length, 7);
    assert.ok(state.intents.every(intent => intent.status === "response-recorded"));
    assert.equal(state.deliveries.length, 9);
    assert.equal(state.owned_thread_refs.length, 2);
    assert.equal(state.deliveries[0].message.method, undefined);
    desktop = spawn(process.execPath, [shim, ...appServerArgs], {stdio: ["pipe", "pipe", "pipe"],
      env: {PATH: process.env.PATH, ARE_DESKTOP_SHIM_MODE: "managed-gateway",
        ARE_DESKTOP_SHIM_CODEX_COMMAND: process.execPath,
        ARE_DESKTOP_SHIM_CODEX_SHA256: backendDigest,
        ARE_DESKTOP_SHIM_CONFIG: profilePath,
        ARE_DESKTOP_SHIM_REPOSITORY_ROOT: directory,
        ARE_DESKTOP_GATEWAY_SOCKET: socketPath,
        ARE_DESKTOP_GATEWAY_STATE_DIR: stateDir,
        ARE_DESKTOP_GATEWAY_CONNECTION_TOKEN: connectionToken}});
    let restartError = "";
    desktop.stderr.on("data", chunk => { restartError += chunk.toString("utf8"); });
    const [restartCode] = await once(desktop, "exit");
    assert.equal(restartCode, 4);
    assert.match(restartError, /desktop-gateway\.unreconciled-client-state/);
    assert.equal(turnDispatchCount, 2, "Restart may not dispatch a duplicate host turn.");
  } finally {
    if (desktop && desktop.exitCode === null) {
      desktop.kill("SIGTERM");
      await once(desktop, "exit").catch(() => {});
    }
    await gateway.close();
    rmSync(directory, {recursive: true, force: true});
    rmSync(stateDir, {recursive: true, force: true});
  }
});

test("opt-in desktop process receipts resume the same owned thread after a clean restart", async context => {
  if (process.platform === "win32") return context.skip("The desktop shim runs inside WSL.");
  const directory = mkdtempSync(join(tmpdir(), "are-desktop-consumed-process-"));
  const stateDir = mkdtempSync(join(tmpdir(), "are-desktop-consumed-state-"));
  const socketPath = join(directory, "gateway.sock");
  const profilePath = join(directory, "profile.json");
  writeFileSync(profilePath, "{}\n", {mode: 0o600});
  const backendDigest = createHash("sha256").update(readFileSync(process.execPath)).digest("hex");
  const loaded = loadVerifiedRepositoryRuntimeBundle(join(packageRoot, "profiles/repository-runtime-v1.json"));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  let creations = 0;
  let turnDispatches = 0;
  const completedTurns = [];
  const gateway = createPersistentGateway({listen_path: socketPath, connection_token: connectionToken,
    backend: {mode: "direct-stdio"}, backend_adapter: createCodexGatewayBackendAdapter(),
    desktop_backend_binding: {binary_sha256: backendDigest, host_profile: "desktop-wsl-base/v1"},
    authorize_client: ({consumer_id, lane}) => consumer_id === "codex:desktop-wsl" && lane === "interaction-bound",
    wrapper_factory: ({consumer_id, lane}) => {
      const profile = structuredClone(loaded.value);
      profile.turn_bindings.default = {...profile.turn_bindings.default, consumer_ref: consumer_id, lane};
      return createCodexAppServerWrapper({...loaded, loaded_profile: profile,
        require_bound_effect_route: true});
    },
    spawn_impl: () => fakeBackend((message, child) => {
      if (message.method === "thread/start") {
        creations += 1;
        child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id,
          result: {thread: {id: "receipt-owned-thread"}}})}\n`);
      } else if (message.method === "thread/resume" || message.method === "thread/read") {
        child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id,
          result: {thread: {id: "receipt-owned-thread", turns: completedTurns}}})}\n`);
      } else if (message.method === "turn/start") {
        turnDispatches += 1;
        const turnId = `receipt-turn-${turnDispatches}`;
        child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id,
          result: {turn: {id: turnId, threadId: "receipt-owned-thread"}}})}\n`);
        setImmediate(() => {
          const turn = {id: turnId, status: "completed", items: []};
          completedTurns.push(turn);
          child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", method: "turn/completed",
            params: {threadId: "receipt-owned-thread", turn}})}\n`);
        });
      } else if (message.method === "model/list") {
        child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id,
          result: {data: [{id: "fixture-model"}], nextCursor: null}})}\n`);
      }
    })});
  let desktop = null;
  const env = {PATH: process.env.PATH, ARE_DESKTOP_SHIM_MODE: "managed-gateway",
    ARE_DESKTOP_SHIM_CODEX_COMMAND: process.execPath,
    ARE_DESKTOP_SHIM_CODEX_SHA256: backendDigest,
    ARE_DESKTOP_SHIM_CONFIG: profilePath,
    ARE_DESKTOP_SHIM_REPOSITORY_ROOT: directory,
    ARE_DESKTOP_GATEWAY_SOCKET: socketPath,
    ARE_DESKTOP_GATEWAY_STATE_DIR: stateDir,
    ARE_DESKTOP_GATEWAY_CONNECTION_TOKEN: connectionToken,
    ARE_DESKTOP_CONSUMPTION_RECEIPTS: "1"};
  function startDesktop() {
    const child = spawn(process.execPath, [shim, ...appServerArgs],
      {stdio: ["pipe", "pipe", "pipe"], env});
    const messages = [];
    let buffer = "";
    let stderr = "";
    child.stderr.on("data", chunk => { stderr += chunk.toString("utf8"); });
    child.stdout.on("data", chunk => {
      buffer += chunk.toString("utf8");
      let index;
      while ((index = buffer.indexOf("\n")) >= 0) {
        const message = JSON.parse(buffer.slice(0, index));
        buffer = buffer.slice(index + 1);
        messages.push(message);
        child.stdin.write(`${JSON.stringify({jsonrpc: "2.0",
          method: "cyberalchemy/desktopDeliveryConsumed",
          params: {throughSequence: messages.length + consumedBeforeStart,
            messageDigest: digestValue(message)}})}\n`);
      }
    });
    return {child, messages, error: () => stderr};
  }
  let consumedBeforeStart = 0;
  try {
    await gateway.start();
    let run = startDesktop();
    desktop = run.child;
    await until(() => gateway.inspect().sessions.length === 1 || desktop.exitCode !== null);
    assert.equal(desktop.exitCode, null, run.error());
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize",
      params: {clientInfo: {name: "desktop-consumption-fixture"}}})}\n`);
    await until(() => run.messages.length === 1 || desktop.exitCode !== null);
    assert.equal(desktop.exitCode, null, run.error());
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "thread/start",
      params: {cwd: "/fixture", approvalPolicy: "on-request", sandbox: "read-only"}})}\n`);
    await until(() => run.messages.some(message => message.id === 2) || desktop.exitCode !== null);
    assert.equal(desktop.exitCode, null, run.error());
    assert.equal(run.messages.find(message => message.id === 2).result.thread.id, "receipt-owned-thread");
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 3, method: "turn/start",
      params: {threadId: "receipt-owned-thread", input: [{type: "text", text: "Implement first fixture turn."}],
        approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}}})}\n`);
    await until(() => run.messages.some(message => message.method === "turn/completed")
      || desktop.exitCode !== null);
    assert.equal(desktop.exitCode, null, run.error());
    await until(() => gateway.inspect().sessions[0]?.acknowledged_through === run.messages.length);
    consumedBeforeStart = run.messages.length;
    desktop.stdin.end();
    assert.equal((await once(desktop, "exit"))[0], 0, run.error());
    const firstState = JSON.parse(readFileSync(join(stateDir, "desktop-gateway-state.json"), "utf8"));
    assert.equal(firstState.desktop_consumed_through, consumedBeforeStart);
    assert.equal(firstState.owned_thread_refs.length, 1);

    run = startDesktop();
    desktop = run.child;
    await until(() => gateway.inspect().sessions[0]?.attached === true || desktop.exitCode !== null);
    assert.equal(desktop.exitCode, null, run.error());
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize",
      params: {clientInfo: {name: "desktop-consumption-fixture"}}})}\n`);
    await until(() => run.messages.some(message => message.id === 1) || desktop.exitCode !== null);
    assert.equal(desktop.exitCode, null, run.error());
    assert.equal(typeof run.messages.find(message => message.id === 1).result?.userAgent,
      "string", `${run.error()}\n${JSON.stringify(run.messages)}`);
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "thread/resume",
      params: {threadId: "receipt-owned-thread", approvalPolicy: "on-request",
        sandbox: "read-only"}})}\n`);
    await until(() => run.messages.some(message => message.id === 2) || desktop.exitCode !== null);
    assert.equal(desktop.exitCode, null, run.error());
    assert.equal(run.messages.find(message => message.id === 2).result?.thread?.id,
      "receipt-owned-thread", `${run.error()}\n${JSON.stringify(run.messages)}`);
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 3, method: "turn/start",
      params: {threadId: "receipt-owned-thread", input: [{type: "text", text: "Implement second fixture turn."}],
        approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}}})}\n`);
    await until(() => run.messages.some(message => message.method === "turn/completed")
      || desktop.exitCode !== null);
    assert.equal(desktop.exitCode, null, run.error());
    await until(() => gateway.inspect().sessions[0]?.acknowledged_through
      === consumedBeforeStart + run.messages.length);
    for (let id = 4; id <= 304; id += 1) {
      desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id, method: "model/list",
        params: {limit: 1, includeHidden: false}})}\n`);
      await until(() => run.messages.some(message => message.id === id) || desktop.exitCode !== null)
        .catch(error => { throw new Error(`${error.message}\n${run.error()}`); });
      assert.equal(desktop.exitCode, null, run.error());
      assert.equal(run.messages.find(message => message.id === id).result?.data?.[0]?.id,
        "fixture-model", run.error());
    }
    await until(() => gateway.inspect().sessions[0]?.acknowledged_through
      === consumedBeforeStart + run.messages.length);
    desktop.stdin.end();
    assert.equal((await once(desktop, "exit"))[0], 0, run.error());
    assert.equal(creations, 1);
    assert.equal(turnDispatches, 2);
    const finalState = JSON.parse(readFileSync(join(stateDir, "desktop-gateway-state.json"), "utf8"));
    assert.equal(finalState.desktop_consumed_through, finalState.last_acked_sequence);
    assert.equal(finalState.schema_version, "are.codex-desktop-gateway-state/v7");
    assert.ok(finalState.compacted_through >= 64);
    assert.ok(finalState.intents.length < 48);
    assert.ok(finalState.deliveries.length < 32);
    assert.equal(finalState.current_epoch_client_id_digests.length, 304);
  } finally {
    if (desktop && desktop.exitCode === null) {
      desktop.kill("SIGTERM");
      await once(desktop, "exit").catch(() => {});
    }
    await gateway.close();
    rmSync(directory, {recursive: true, force: true});
    rmSync(stateDir, {recursive: true, force: true});
  }
});

test("separate desktop process binds an ARE approval to one turn and denies a sticky grant", async context => {
  if (process.platform === "win32") return context.skip("The desktop shim runs inside WSL.");
  const directory = mkdtempSync(join(tmpdir(), "are-desktop-approval-process-"));
  const stateDir = mkdtempSync(join(tmpdir(), "are-desktop-approval-state-"));
  const socketPath = join(directory, "gateway.sock");
  const profilePath = join(directory, "profile.json");
  writeFileSync(profilePath, "{}\n", {mode: 0o600});
  const backendDigest = createHash("sha256").update(readFileSync(process.execPath)).digest("hex");
  const loaded = loadVerifiedRepositoryRuntimeBundle(join(packageRoot, "profiles/repository-runtime-v1.json"));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  const backendResponses = [];
  const responseIntentsPersistedBeforeBackend = [];
  const approval = id => ({jsonrpc: "2.0", id, method: "item/fileChange/requestApproval",
    params: {threadId: "desktop-owned-thread", turnId: "desktop-owned-turn", itemId: `item-${id}`,
      startedAtMs: 123, reason: "fixture file change"}});
  const gateway = createPersistentGateway({listen_path: socketPath, connection_token: connectionToken,
    backend: {mode: "direct-stdio"}, backend_adapter: createCodexGatewayBackendAdapter(),
    desktop_backend_binding: {binary_sha256: backendDigest, host_profile: "desktop-wsl-base/v1"},
    authorize_client: ({consumer_id, lane}) => consumer_id === "codex:desktop-wsl" && lane === "interaction-bound",
    wrapper_factory: ({consumer_id, lane}) => {
      const profile = structuredClone(loaded.value);
      profile.turn_bindings.default = {...profile.turn_bindings.default, consumer_ref: consumer_id, lane};
      return createCodexAppServerWrapper({...loaded, loaded_profile: profile,
        require_bound_effect_route: true});
    },
    spawn_impl: () => fakeBackend((message, child) => {
      if (message.method === "thread/start") {
        child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id,
          result: {thread: {id: "desktop-owned-thread"}}})}\n`);
      } else if (message.method === "turn/start") {
        child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id,
          result: {turn: {id: "desktop-owned-turn", threadId: "desktop-owned-thread"}}})}\n`);
        setImmediate(() => child.stdout.write(`${JSON.stringify(approval("approval-sticky"))}\n`));
      } else if (message.id === "approval-sticky" || message.id === "approval-once") {
        backendResponses.push(message);
        const state = JSON.parse(readFileSync(join(stateDir, "desktop-gateway-state.json"), "utf8"));
        responseIntentsPersistedBeforeBackend.push(state.server_response_intents.some(intent =>
          intent.server_id === message.id));
        if (message.id === "approval-sticky") {
          setImmediate(() => child.stdout.write(`${JSON.stringify(approval("approval-once"))}\n`));
        }
      }
    })});
  let desktop = null;
  try {
    await gateway.start();
    desktop = spawn(process.execPath, [shim, ...appServerArgs], {stdio: ["pipe", "pipe", "pipe"],
      env: {PATH: process.env.PATH, ARE_DESKTOP_SHIM_MODE: "managed-gateway",
        ARE_DESKTOP_SHIM_CODEX_COMMAND: process.execPath,
        ARE_DESKTOP_SHIM_CODEX_SHA256: backendDigest,
        ARE_DESKTOP_SHIM_CONFIG: profilePath,
        ARE_DESKTOP_SHIM_REPOSITORY_ROOT: directory,
        ARE_DESKTOP_GATEWAY_SOCKET: socketPath,
        ARE_DESKTOP_GATEWAY_STATE_DIR: stateDir,
        ARE_DESKTOP_GATEWAY_CONNECTION_TOKEN: connectionToken}});
    const output = [];
    let stdoutBuffer = "";
    let stderr = "";
    desktop.stdout.on("data", chunk => {
      stdoutBuffer += chunk.toString("utf8");
      let index;
      while ((index = stdoutBuffer.indexOf("\n")) >= 0) {
        output.push(JSON.parse(stdoutBuffer.slice(0, index)));
        stdoutBuffer = stdoutBuffer.slice(index + 1);
      }
    });
    desktop.stderr.on("data", chunk => { stderr += chunk.toString("utf8"); });
    async function nextOutput(label) {
      await until(() => output.length > 0 || desktop.exitCode !== null);
      assert.equal(desktop.exitCode, null, `${label}: ${stderr}`);
      return output.shift();
    }
    await until(() => gateway.inspect().sessions.length === 1 || desktop.exitCode !== null);
    assert.equal(desktop.exitCode, null, stderr);
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize",
      params: {clientInfo: {name: "desktop-approval-fixture"}}})}\n`);
    assert.equal((await nextOutput("initialize")).id, 1);
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "thread/start",
      params: {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"}})}\n`);
    assert.equal((await nextOutput("thread/start")).result.thread.id, "desktop-owned-thread");
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 3, method: "turn/start",
      params: {threadId: "desktop-owned-thread", input: [{type: "text", text: "Implement this fixture."}],
        approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}}})}\n`);
    const startedTurn = await nextOutput("turn/start");
    assert.equal(startedTurn.result?.turn?.id, "desktop-owned-turn", JSON.stringify(startedTurn));
    const firstApproval = await nextOutput("first approval");
    assert.equal(firstApproval.id, "approval-sticky");
    assert.equal(firstApproval.method, "item/fileChange/requestApproval");
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: "approval-sticky",
      result: {decision: "acceptForSession"}})}\n`);
    const denied = await nextOutput("sticky grant denial");
    assert.deepEqual(denied.error?.data?.reason_codes, ["effect.session-or-policy-grant-unsupported"]);
    await until(() => backendResponses.length === 1);
    assert.equal(backendResponses[0].result.decision, "decline");
    const secondApproval = await nextOutput("second approval");
    assert.equal(secondApproval.id, "approval-once");
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: "approval-once",
      result: {decision: "accept"}})}\n`);
    await until(() => backendResponses.length === 2);
    assert.equal(backendResponses[1].result.decision, "accept");
    assert.deepEqual(responseIntentsPersistedBeforeBackend, [true, true]);
    desktop.stdin.end();
    const [code] = await once(desktop, "exit");
    assert.equal(code, 0, stderr);
    const state = JSON.parse(readFileSync(join(stateDir, "desktop-gateway-state.json"), "utf8"));
    assert.equal(state.server_response_intents.length, 2);
    assert.equal(state.server_response_intents[0].server_id, "approval-sticky");
    assert.equal(state.server_response_intents[1].server_id, "approval-once");
    assert.equal(state.server_response_intents[0].response_digest.length, 64);
    assert.equal(state.server_response_intents[1].response_digest.length, 64);
  } finally {
    if (desktop && desktop.exitCode === null) {
      desktop.kill("SIGTERM");
      await once(desktop, "exit").catch(() => {});
    }
    await gateway.close();
    rmSync(directory, {recursive: true, force: true});
    rmSync(stateDir, {recursive: true, force: true});
  }
});

test("separate desktop process carries user input and MCP elicitation through durable resolution", async context => {
  if (process.platform === "win32") return context.skip("The desktop shim runs inside WSL.");
  const directory = mkdtempSync(join(tmpdir(), "are-desktop-elicitation-process-"));
  const stateDir = mkdtempSync(join(tmpdir(), "are-desktop-elicitation-state-"));
  const socketPath = join(directory, "gateway.sock");
  const profilePath = join(directory, "profile.json");
  writeFileSync(profilePath, "{}\n", {mode: 0o600});
  const backendDigest = createHash("sha256").update(readFileSync(process.execPath)).digest("hex");
  const loaded = loadVerifiedRepositoryRuntimeBundle(join(packageRoot, "profiles/repository-runtime-v1.json"));
  assert.equal(loaded.ok, true, JSON.stringify(loaded));
  const threadId = "desktop-elicitation-thread";
  const turnId = "desktop-elicitation-turn";
  const backendResponses = [];
  const persistedBeforeBackend = [];
  const inputRequest = {jsonrpc: "2.0", id: "input-1", method: "item/tool/requestUserInput",
    params: {threadId, turnId, itemId: "input-item", isBlocking: true,
      questions: [{id: "choice", header: "Choice", question: "Proceed?",
        options: [{label: "Yes", description: "Continue"}]}]}};
  const mcpRequest = {jsonrpc: "2.0", id: "mcp-1", method: "mcpServer/elicitation/request",
    params: {threadId, turnId, serverName: "fixture-server", mode: "form", message: "Select a mode",
      requestedSchema: {type: "object", properties: {mode: {type: "string"}}, required: ["mode"]}}};
  const resolved = requestId => ({jsonrpc: "2.0", method: "serverRequest/resolved",
    params: {threadId, requestId}});
  const gateway = createPersistentGateway({listen_path: socketPath, connection_token: connectionToken,
    backend: {mode: "direct-stdio"}, backend_adapter: createCodexGatewayBackendAdapter(),
    desktop_backend_binding: {binary_sha256: backendDigest, host_profile: "desktop-wsl-base/v1"},
    authorize_client: ({consumer_id, lane}) => consumer_id === "codex:desktop-wsl" && lane === "interaction-bound",
    wrapper_factory: ({consumer_id, lane}) => {
      const profile = structuredClone(loaded.value);
      profile.turn_bindings.default = {...profile.turn_bindings.default, consumer_ref: consumer_id, lane};
      return createCodexAppServerWrapper({...loaded, loaded_profile: profile,
        require_bound_effect_route: true});
    },
    spawn_impl: () => fakeBackend((message, child) => {
      if (message.method === "thread/start") {
        child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id,
          result: {thread: {id: threadId}}})}\n`);
      } else if (message.method === "turn/start") {
        child.stdout.write(`${JSON.stringify({jsonrpc: "2.0", id: message.id,
          result: {turn: {id: turnId, threadId}}})}\n`);
        setImmediate(() => child.stdout.write(`${JSON.stringify(inputRequest)}\n`));
      } else if (message.id === "input-1" || message.id === "mcp-1") {
        backendResponses.push(message);
        const state = JSON.parse(readFileSync(join(stateDir, "desktop-gateway-state.json"), "utf8"));
        persistedBeforeBackend.push(state.server_response_intents.some(intent => intent.server_id === message.id));
        child.stdout.write(`${JSON.stringify(resolved(message.id))}\n`);
        if (message.id === "input-1") setImmediate(() => child.stdout.write(`${JSON.stringify(mcpRequest)}\n`));
      }
    })});
  let desktop = null;
  try {
    await gateway.start();
    desktop = spawn(process.execPath, [shim, ...appServerArgs], {stdio: ["pipe", "pipe", "pipe"],
      env: {PATH: process.env.PATH, ARE_DESKTOP_SHIM_MODE: "managed-gateway",
        ARE_DESKTOP_SHIM_CODEX_COMMAND: process.execPath,
        ARE_DESKTOP_SHIM_CODEX_SHA256: backendDigest,
        ARE_DESKTOP_SHIM_CONFIG: profilePath,
        ARE_DESKTOP_SHIM_REPOSITORY_ROOT: directory,
        ARE_DESKTOP_GATEWAY_SOCKET: socketPath,
        ARE_DESKTOP_GATEWAY_STATE_DIR: stateDir,
        ARE_DESKTOP_GATEWAY_CONNECTION_TOKEN: connectionToken}});
    const output = [];
    let stdoutBuffer = "";
    let stderr = "";
    desktop.stdout.on("data", chunk => {
      stdoutBuffer += chunk.toString("utf8");
      let index;
      while ((index = stdoutBuffer.indexOf("\n")) >= 0) {
        output.push(JSON.parse(stdoutBuffer.slice(0, index)));
        stdoutBuffer = stdoutBuffer.slice(index + 1);
      }
    });
    desktop.stderr.on("data", chunk => { stderr += chunk.toString("utf8"); });
    async function nextOutput(label) {
      await until(() => output.length > 0 || desktop.exitCode !== null);
      assert.equal(desktop.exitCode, null, `${label}: ${stderr}`);
      return output.shift();
    }
    await until(() => gateway.inspect().sessions.length === 1 || desktop.exitCode !== null);
    assert.equal(desktop.exitCode, null, stderr);
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 1, method: "initialize",
      params: {clientInfo: {name: "desktop-elicitation-fixture"}}})}\n`);
    assert.equal((await nextOutput("initialize")).id, 1);
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 2, method: "thread/start",
      params: {cwd: "/tmp", approvalPolicy: "on-request", sandbox: "read-only"}})}\n`);
    assert.equal((await nextOutput("thread/start")).result.thread.id, threadId);
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: 3, method: "turn/start",
      params: {threadId, input: [{type: "text", text: "Test elicitation."}],
        approvalPolicy: "on-request", sandboxPolicy: {type: "readOnly"}}})}\n`);
    assert.equal((await nextOutput("turn/start")).result.turn.id, turnId);
    assert.deepEqual(await nextOutput("user input"), inputRequest);
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: "input-1",
      result: {answers: {choice: {answers: ["Yes"]}}}})}\n`);
    assert.deepEqual(await nextOutput("user-input resolution"), resolved("input-1"));
    assert.deepEqual(await nextOutput("MCP elicitation"), mcpRequest);
    desktop.stdin.write(`${JSON.stringify({jsonrpc: "2.0", id: "mcp-1",
      result: {action: "accept", content: {mode: "safe"}}})}\n`);
    assert.deepEqual(await nextOutput("MCP resolution"), resolved("mcp-1"));
    await until(() => backendResponses.length === 2);
    assert.deepEqual(persistedBeforeBackend, [true, true]);
    desktop.stdin.end();
    const [code] = await once(desktop, "exit");
    assert.equal(code, 0, stderr);
    const state = JSON.parse(readFileSync(join(stateDir, "desktop-gateway-state.json"), "utf8"));
    assert.deepEqual(state.server_response_intents.map(intent => intent.server_id), ["input-1", "mcp-1"]);
    assert.deepEqual(state.deliveries.filter(delivery => delivery.message.method === "serverRequest/resolved")
      .map(delivery => delivery.message.params.requestId), ["input-1", "mcp-1"]);
    const session = gateway.inspect().durable_session_index.sessions.find(entry =>
      entry.consumer_id === "codex:desktop-wsl");
    assert.deepEqual(session.server_requests.map(entry => entry.status),
      ["resolved-forwarded", "resolved-forwarded"]);
  } finally {
    if (desktop && desktop.exitCode === null) {
      desktop.kill("SIGTERM");
      await once(desktop, "exit").catch(() => {});
    }
    await gateway.close();
    rmSync(directory, {recursive: true, force: true});
    rmSync(stateDir, {recursive: true, force: true});
  }
});
