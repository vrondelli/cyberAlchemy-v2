#!/usr/bin/env node
// Test-only gateway process: die after the real accepted compaction receipt is fsynced.
import assert from "node:assert/strict";
import {spawn} from "node:child_process";

import {createCodexGatewayBackendAdapter, createFileGatewaySessionStore,
  createPersistentGateway} from "../../index.mjs";

const options = JSON.parse(process.argv[2] ?? "null");
assert.ok(options && typeof options === "object", "crash-child.options-required");
const store = createFileGatewaySessionStore({path: options.storePath,
  store_id: options.storeId});
const sessionStore = {
  ...store,
  append(event) {
    const result = store.append(event);
    if (result.ok && event.event_kind === "host-observation"
      && event.content?.observation?.kind === "compaction-turn-accepted") {
      // The native host continues while gateway JS cannot consume terminal events.
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
      process.kill(process.pid, "SIGKILL");
      throw new Error("crash-child.kill-did-not-terminate");
    }
    return result;
  },
};
const gateway = createPersistentGateway({listen_path: options.socketPath,
  runtime_epoch_id: "are-native-compaction-crash-child",
  backend: {command: options.binary, args: ["app-server", "--stdio"]},
  backend_adapter: createCodexGatewayBackendAdapter(), session_store: sessionStore,
  expected_codex_version: options.expectedVersion,
  connection_token: options.connectionToken,
  spawn_impl: (command, args, spawnOptions) => {
    const child = spawn(command, args, {...spawnOptions, cwd: options.cwd,
      env: {...process.env, CODEX_HOME: options.codexHome}, windowsHide: true});
    process.stdout.write(`BACKEND_PID:${child.pid}\n`);
    let pending = "";
    child.stdout.on("data", chunk => {
      pending += chunk.toString("utf8");
      let newline;
      while ((newline = pending.indexOf("\n")) >= 0) {
        const line = pending.slice(0, newline);
        pending = pending.slice(newline + 1);
        try {
          const message = JSON.parse(line);
          if (Object.hasOwn(message, "id")) {
            process.stderr.write(`HOST_RESPONSE:${JSON.stringify({id: message.id,
              result_keys: message.result && typeof message.result === "object"
                ? Object.keys(message.result) : null,
              error_code: message.error?.code ?? null})}\n`);
          }
          if (/^(turn|item|thread)\//.test(message.method ?? "")) {
            process.stderr.write(`HOST_EVENT:${JSON.stringify({method: message.method,
              turn_id: message.params?.turn?.id ?? message.params?.turnId ?? null,
              item_type: message.params?.item?.type ?? null})}\n`);
          }
        } catch { /* Keep native bytes authoritative; diagnostics are best effort. */ }
      }
    });
    return child;
  },
  wrapper_factory: () => ({
    processClientMessage: async message => ({to_server: [message], to_client: []}),
    processServerMessage: async message => ({to_server: [], to_client: [message]}),
  }),
});
await gateway.start();
process.stdout.write("READY\n");
